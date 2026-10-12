import test from 'node:test'
import assert from 'node:assert/strict'
import { createSubAssetDraft, getNextSubAssetId, migrateSubAssetRequests } from './subAssetDraftUtils.js'
import { prepareProposalAssets } from './proposalAssetUtils.js'

const parent = { assetId: 'ME-2026-0005', name: 'Machine', status: 'Active', assetClass: 'ME - Machine', custodian: 'Maya', plant: 'Plant 1', location: 'Building A', line: 'Line C', area: 'Assembly', projectCode: 'PROJECT-1', poNo: 'OLD-PO', invoices: ['OLD-INVOICE'], approvalHistory: [{ action: 'Approved' }], depreciationStartDate: '2025-01-01' }
const request = { sourceAssetId: parent.assetId, name: ' Drive unit ', model: 'TC-8800', power: '380 VAC', targetSop: '2026-10-22', amount: 60000 }
const proposalFor = (draft, amount) => ({ proposalId: 'PROP-2026-1000', ownershipType: 'company', projectCode: parent.projectCode, savedAt: '2026-10-07T03:00:00Z', assetItems: [{ assetMode: 'new', assetId: draft.assetId, assetAmount: amount, costs: [] }] })

test('Save Sub Asset Draft creates a numbered child with inherited assignment and isolated acquisition', () => {
  const child = createSubAssetDraft(request, [parent])
  assert.equal(child.assetId, `${parent.assetId}-1`)
  assert.equal(child.status, 'Draft')
  assert.equal(child.parentAssetId, parent.assetId)
  assert.equal(child.sourceAssetId, parent.assetId)
  assert.equal(child.name, 'Drive unit')
  for (const key of ['assetClass', 'custodian', 'plant', 'location', 'line', 'area', 'projectCode']) assert.equal(child[key], parent[key])
  assert.equal(child.poNo, '')
  assert.deepEqual(child.invoices, [])
  assert.deepEqual(child.approvalHistory, [])
  assert.equal(child.depreciationStartDate, undefined)
  assert.equal(child.acquisitionValue, undefined)
  assert.equal(parent.status, 'Active')
})

test('numbering advances across Draft, Active and Cancelled siblings, never filling gaps', () => {
  const first = createSubAssetDraft(request, [parent])
  const second = createSubAssetDraft(request, [parent, first])
  assert.equal(second.assetId, `${parent.assetId}-2`)
  const ids = [parent.assetId, first.assetId, `${parent.assetId}-4`, `${parent.assetId}-99-1`]
  assert.equal(getNextSubAssetId(parent.assetId, ids), `${parent.assetId}-5`)
})

test('Sub Asset Draft rejects inactive, Customer, nested and missing parent targets', () => {
  for (const source of [{ ...parent, status: 'Draft' }, { ...parent, ownershipType: 'customer' }, { ...parent, parentAssetId: 'MAIN' }]) assert.throws(() => createSubAssetDraft(request, [source]), /Active Company Main/)
  assert.throws(() => createSubAssetDraft(request, []), /Active Company Main/)
})

test('capitalized Proposal reuses the saved Draft number and records the parent work event', () => {
  const draft = createSubAssetDraft(request, [parent])
  const result = prepareProposalAssets(proposalFor(draft, 60000), [parent, draft])
  assert.equal(result.createdAssets.length, 0)
  assert.equal(result.updatedAssets[0].assetId, draft.assetId)
  assert.equal(result.updatedAssets[0].status, 'Proposal Processing')
  assert.equal(result.updatedAssets[0].acquisitionValue, 60000)
  assert.equal(result.proposal.assetItems[0].assetId, draft.assetId)
  assert.equal(result.events[0].assetId, parent.assetId)
  assert.equal(result.events[0].subAssetId, draft.assetId)
  assert.equal(createSubAssetDraft(request, [parent, result.updatedAssets[0]]).assetId, `${parent.assetId}-2`)
})

test('Expense keeps its work on the parent and retains the cancelled Draft suffix without activation', () => {
  const draft = createSubAssetDraft(request, [parent])
  const result = prepareProposalAssets(proposalFor(draft, 50000), [parent, draft])
  assert.equal(result.createdAssets.length, 0)
  assert.equal(result.updatedAssets[0].status, 'Cancelled')
  assert.equal(result.updatedAssets[0].acquisitionValue, undefined)
  assert.equal(result.proposal.assetItems[0].assetId, parent.assetId)
  assert.equal(result.events[0].costTreatment, 'Expense')
  assert.equal(result.events[0].subAssetId, '')
  assert.equal(createSubAssetDraft(request, [parent, result.updatedAssets[0]]).assetId, `${parent.assetId}-2`)
})

test('a saved Sub Asset cannot be allocated twice in the same Proposal', () => {
  const draft = createSubAssetDraft(request, [parent])
  const input = proposalFor(draft, 60000)
  input.assetItems.push({ ...input.assetItems[0] })
  assert.throws(() => prepareProposalAssets(input, [parent, draft]), /only once/)
})

test('previously saved requests become numbered Drafts without duplicate migration or discarding invalid requests', () => {
  const requests = [{ ...request, requestId: 'OLD-1' }, { ...request, requestId: 'OLD-2' }, { ...request, requestId: 'INVALID', sourceAssetId: 'MISSING' }]
  const result = migrateSubAssetRequests(requests, [parent])
  assert.deepEqual(result.records.map((asset) => asset.assetId), [`${parent.assetId}-1`, `${parent.assetId}-2`])
  assert.deepEqual(result.migratedIds, ['OLD-1', 'OLD-2'])
  assert.equal(migrateSubAssetRequests(requests, [parent, ...result.records]).records.length, 0)
})
