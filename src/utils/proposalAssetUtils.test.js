import test from 'node:test'
import assert from 'node:assert/strict'
import { getProposalTreatment, getProposalItemTotal, prepareProposalAssets, WORK_TYPES } from './proposalAssetUtils.js'
import { getAssetExpenses } from './assetExpenseUtils.js'

const parent = { assetId: 'ME-2026-0005', name: 'Machine', status: 'Active', assetClass: 'ME - Machine', custodian: 'Maya', plant: 'Plant 1', location: 'Line C', line: 'Line C', area: 'Assembly', poNo: 'OLD-PO', depreciationStartDate: '2025-01-01', invoices: ['OLD-INV'] }
const makeItem = (changes = {}) => ({ itemId: 'item-1', assetMode: 'existing', assetId: parent.assetId, workType: 'subAsset', workName: 'New component', description: 'Upgrade machine', model: 'C-1', power: '380 VAC', targetSop: '2026-10-22', assetAmount: 50_001, costs: [], ...changes })
const proposal = (items) => ({ proposalId: 'PROP-2026-0042', projectCode: 'P2026-00042', savedAt: '2026-10-01T03:00:00Z', assetItems: items })

test('all three work types use the exact threshold and scoped additional costs', () => {
  for (const { id } of WORK_TYPES) {
    assert.equal(getProposalTreatment(makeItem({ workType: id, assetAmount: 49_999 })), 'Expense')
    assert.equal(getProposalTreatment(makeItem({ workType: id, assetAmount: 50_000 })), 'Expense')
    assert.equal(getProposalTreatment(makeItem({ workType: id, assetAmount: 50_000.01 })), 'Capitalized')
    assert.equal(getProposalTreatment(makeItem({ workType: id, assetAmount: 49_000, costs: [{ amount: 1001 }] })), 'Capitalized')
  }
  assert.equal(getProposalItemTotal({ amount: 49999.8, costs: [{ amount: 0.1 }, { amount: 0.1 }] }), 50_000)
})

test('expense keeps the parent reference without creating a new asset', () => {
  const result = prepareProposalAssets(proposal([makeItem({ assetAmount: 50_000 })]), [parent])
  assert.equal(result.createdAssets.length, 0)
  assert.equal(result.proposal.assetItems[0].assetId, parent.assetId)
  assert.equal(result.events[0].costTreatment, 'Expense')
  assert.equal(result.events[0].status, 'Pending Approval')
  assert.equal(parent.status, 'Active')
})

test('sub asset gets the next suffix, isolated acquisition data and linked proposal item', () => {
  const result = prepareProposalAssets(proposal([makeItem({ workType: 'maintenance' })]), [parent, { assetId: `${parent.assetId}-1` }, { assetId: `${parent.assetId}-3` }, { assetId: `${parent.assetId}-99-1` }])
  const child = result.createdAssets[0]
  assert.equal(child.assetId, `${parent.assetId}-4`)
  assert.equal(child.parentAssetId, parent.assetId)
  assert.equal(child.status, 'Proposal Processing')
  assert.equal(child.workType, 'maintenance')
  assert.equal(child.proposalNo, 'PROP-2026-0042')
  assert.equal(child.poNo, '')
  assert.deepEqual(child.invoices, [])
  assert.equal(child.depreciationStartDate, undefined)
  assert.equal(child.acquisitionValue, 50_001)
  assert.equal(child.model, 'C-1')
  assert.equal(child.power, '380 VAC')
  assert.equal(child.targetSop, '2026-10-22')
  assert.equal(result.proposal.assetItems[0].assetId, child.assetId)
  assert.equal(result.events[0].subAssetId, child.assetId)
})

test('mixed proposal preserves new assets and treats each existing-asset item separately', () => {
  const draft = { assetId: 'DRAFT-1', status: 'Draft' }
  const input = proposal([{ assetMode: 'new', assetId: draft.assetId, assetAmount: 500 }, makeItem({ itemId: 'expense', assetAmount: 50_000 }), makeItem({ itemId: 'child', assetAmount: 50_001 })])
  const snapshot = JSON.stringify(input)
  const result = prepareProposalAssets(input, [parent, draft])
  assert.equal(result.createdAssets.length, 1)
  assert.equal(result.proposal.assetItems[0].assetId, draft.assetId)
  assert.equal(result.proposal.assetItems[0].costTreatment, 'New Asset')
  assert.equal(result.events.length, 2)
  assert.equal(JSON.stringify(input), snapshot)
  const subsequent = prepareProposalAssets(proposal([makeItem()]), [parent, ...result.createdAssets])
  assert.equal(subsequent.createdAssets[0].assetId, `${parent.assetId}-2`)
})

test('capitalized maintenance is excluded from expense totals', () => {
  const result = prepareProposalAssets(proposal([makeItem({ workType: 'maintenance' })]), [parent])
  assert.equal(getAssetExpenses(parent.assetId, result.events.map((event) => ({ ...event, status: 'Completed' }))).total, 0)
})

test('existing asset must be Active', () => {
  assert.throws(() => prepareProposalAssets(proposal([makeItem()]), [{ ...parent, status: 'Draft' }]), /Active/)
})

test('expense PO lines never enter parent depreciation value', async () => {
  const { getAssetDepreciationData } = await import('./depreciationUtils.js')
  const asset = { ...parent, poNo: 'PO-1', purchaseOrderReferences: [{ poNo: 'PO-1', itemNo: '10' }, { poNo: 'PO-2', itemNo: '10' }] }
  const orders = [
    { poNo: 'PO-1', assetItems: [{ assetId: parent.assetId, itemNo: '10', assetAmount: 100_000 }] },
    { poNo: 'PO-2', assetItems: [{ assetId: parent.assetId, itemNo: '10', assetAmount: 50_000, costTreatment: 'Expense' }] },
  ]
  assert.equal(getAssetDepreciationData(asset, [], orders).assetValue, 100_000)
})

test('work on a Sub Asset creates a sibling under the main Asset, retaining the work target', () => {
  const child = { ...parent, assetId: `${parent.assetId}-1`, parentAssetId: parent.assetId, location: 'Control cabinet' }
  for (const workType of ['subAsset', 'modification', 'maintenance']) {
    const result = prepareProposalAssets(proposal([makeItem({ assetId: child.assetId, workType })]), [parent, child])
    const next = result.createdAssets[0]
    assert.equal(next.assetId, `${parent.assetId}-2`)
    assert.equal(next.parentAssetId, parent.assetId)
    assert.equal(next.sourceAssetId, child.assetId)
    assert.equal(next.location, child.location)
    assert.equal(result.events[0].assetId, child.assetId)
    assert.equal(result.events[0].mainAssetId, parent.assetId)
    assert.equal(result.proposal.assetItems[0].sourceAssetId, child.assetId)
    assert.ok(!next.assetId.endsWith('-1-1'))
  }
})

test('multiple work targets under the same main Asset share one suffix sequence', () => {
  const child = { ...parent, assetId: `${parent.assetId}-1`, parentAssetId: parent.assetId }
  const result = prepareProposalAssets(proposal([makeItem(), makeItem({ itemId: 'item-2', assetId: child.assetId })]), [parent, child])
  assert.deepEqual(result.createdAssets.map((asset) => asset.assetId), [`${parent.assetId}-2`, `${parent.assetId}-3`])
  assert.ok(result.createdAssets.every((asset) => asset.parentAssetId === parent.assetId))
})

test('Expense work on a Sub Asset stays on that Asset without generating a sibling', () => {
  const child = { ...parent, assetId: `${parent.assetId}-1`, parentAssetId: parent.assetId }
  const result = prepareProposalAssets(proposal([makeItem({ assetId: child.assetId, assetAmount: 50_000 })]), [parent, child])
  assert.equal(result.createdAssets.length, 0)
  assert.equal(result.proposal.assetItems[0].assetId, child.assetId)
  assert.equal(result.proposal.assetItems[0].parentAssetId, parent.assetId)
  assert.equal(result.events[0].assetId, child.assetId)
  assert.equal(result.events[0].mainAssetId, parent.assetId)
})

test('invalid parent relationships are rejected instead of creating a third level', () => {
  const child = { ...parent, assetId: `${parent.assetId}-1`, parentAssetId: 'MISSING' }
  assert.throws(() => prepareProposalAssets(proposal([makeItem({ assetId: child.assetId })]), [parent, child]), /relationship/)
  assert.throws(() => prepareProposalAssets(proposal([makeItem()]), [{ ...parent, parentAssetId: parent.assetId }]), /relationship/)
})

test('Active Asset radio work records Modification or Maintenance on the selected Asset without creating a child', () => {
  for (const workType of ['modification', 'maintenance']) {
    for (const assetAmount of [50000, 50001]) {
      const result = prepareProposalAssets(proposal([makeItem({ workType, assetAmount, workOnExistingAsset: true, workName: 'Scheduled work', model: '', power: '', targetSop: '' })]), [parent])
      assert.equal(result.createdAssets.length, 0)
      assert.equal(result.updatedAssets.length, 0)
      assert.equal(result.proposal.assetItems[0].assetId, parent.assetId)
      assert.equal(result.proposal.assetItems[0].subAssetId, '')
      assert.equal(result.events[0].type, workType)
      assert.equal(result.events[0].workOnExistingAsset, true)
      assert.equal(result.events[0].costTreatment, assetAmount > 50000 ? 'Capitalized' : 'Expense')
      assert.equal(parent.status, 'Active')
    }
  }
  assert.throws(() => prepareProposalAssets(proposal([makeItem({ workOnExistingAsset: true })]), [parent]), /Modification or Maintenance/)
})
