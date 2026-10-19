import test from 'node:test'
import assert from 'node:assert/strict'
import { getNextTemporaryAssetId, prepareProposalApproval, prepareDraftNumberMigration, remapAssetReferences } from './assetNumberUtils.js'

const parent = { assetId: 'ME-2026-0005', status: 'Active' }
const draft = { assetId: 'TMP-2026-0001', temporaryReference: 'TMP-2026-0001', status: 'Draft', name: 'New machine', proposalNo: 'PROP-1' }
const proposal = (items) => ({ proposalId: 'PROP-1', status: 'Pending Approval', assetItems: items })

test('temporary references remain unique after previous Drafts receive real numbers', () => {
  assert.equal(getNextTemporaryAssetId([{ assetId: 'AST-2026-0001', temporaryReference: 'TMP-2026-0007' }], '2026'), 'TMP-2026-0008')
})

test('approval assigns numbers once, preserves Draft reference and updates linked documents', () => {
  const customer = { ...draft, assetId: 'TMP-2026-0002', temporaryReference: 'TMP-2026-0002', ownershipType: 'customer', customerName: 'Example Motors' }
  const input = proposal([{ assetId: draft.assetId }, { assetId: customer.assetId }])
  const assets = [draft, customer, { assetId: 'AST-2026-0009', status: 'Active' }]
  const snapshot = JSON.stringify({ input, assets })
  const result = prepareProposalApproval(input, assets, '2026')
  const approvedAssets = assets.map((asset) => result.updates.get(asset.assetId) || asset)
  const approvedProposal = { ...remapAssetReferences(input, result.mapping), status: 'Approved' }
  assert.equal(result.updates.get(draft.assetId).assetId, 'AST-2026-0010')
  assert.equal(result.updates.get(customer.assetId).assetId, 'AST-2026-0011')
  assert.equal(result.updates.get(draft.assetId).status, 'Purchasing')
  assert.equal(result.updates.get(draft.assetId).temporaryReference, draft.assetId)
  assert.equal(result.updates.get(customer.assetId).depreciationStartDate, undefined)
  assert.equal(approvedProposal.assetItems[0].assetId, approvedAssets[0].assetId)
  assert.equal(prepareProposalApproval(approvedProposal, approvedAssets, '2026').updates.size, 0)
  assert.equal(JSON.stringify({ input, assets }), snapshot)
})

test('Sub Assets take next real suffix on approval; Expense and work targets keep their numbers', () => {
  const child = { ...draft, parentAssetId: parent.assetId, sourceAssetId: `${parent.assetId}-1` }
  const second = { ...child, assetId: 'TMP-2026-0002' }
  const input = proposal([{ assetId: child.assetId, subAssetId: child.assetId }, { assetId: second.assetId }, { assetId: parent.assetId, costTreatment: 'Expense' }])
  const result = prepareProposalApproval(input, [parent, child, second, { assetId: `${parent.assetId}-1`, status: 'Active' }, { assetId: `${parent.assetId}-3`, status: 'Sold' }], '2026')
  assert.deepEqual([...result.mapping.values()], [`${parent.assetId}-4`, `${parent.assetId}-5`])
  const events = remapAssetReferences([{ assetId: parent.assetId, mainAssetId: parent.assetId, subAssetId: child.assetId, sourceAssetId: child.sourceAssetId, temporaryReference: child.assetId }], result.mapping)
  assert.equal(events[0].assetId, parent.assetId)
  assert.equal(events[0].sourceAssetId, `${parent.assetId}-1`)
  assert.equal(events[0].subAssetId, `${parent.assetId}-4`)
  assert.equal(events[0].temporaryReference, child.assetId)
  assert.equal(result.updates.has(parent.assetId), false)
})

test('migration fixes legacy pre-approval Drafts and relationships without touching approved records', () => {
  const legacy = { assetId: 'AST-2026-0003', status: 'Proposal Processing', proposalNo: 'PROP-1' }
  const approved = { assetId: 'AST-2026-0004', status: 'Proposal Processing', proposalNo: 'PROP-2' }
  const proposals = [proposal([{ assetId: legacy.assetId }]), { proposalId: 'PROP-2', status: 'Approved', assetItems: [{ assetId: approved.assetId }] }]
  const result = prepareDraftNumberMigration([legacy, approved, parent], proposals, '2026')
  assert.equal(result.updates.get(legacy.assetId).status, 'Draft')
  assert.equal(result.mapping.get(legacy.assetId), 'TMP-2026-0001')
  assert.equal(result.updates.has(approved.assetId), false)
  const migrated = [legacy, approved, parent].map((asset) => result.updates.get(asset.assetId) || asset)
  const migratedProposals = remapAssetReferences(proposals, result.mapping)
  assert.equal(migratedProposals[0].assetItems[0].assetId, migrated[0].assetId)
  assert.equal(prepareDraftNumberMigration(migrated, migratedProposals, '2026').updates.size, 0)
})
