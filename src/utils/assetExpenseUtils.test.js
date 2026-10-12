import test from 'node:test'
import assert from 'node:assert/strict'
import { getAssetExpenses } from './assetExpenseUtils.js'
import { INITIAL_LIFECYCLE_EVENTS, mergeDemoLifecycleEvents } from '../data/mockLifecycleEvents.js'

test('expense includes completed costs and the exact 50,000 threshold, excluding capitalization and pending requests', () => {
  const event = (type, amount, status = 'Completed') => ({ assetId: 'A', type, cost: amount, value: amount, status })
  const totals = getAssetExpenses('A', [
    event('maintenance', 1200), event('sparePartUsage', 800),
    event('subAsset', 50_000), event('modification', 50_000),
    event('subAsset', 50_001), event('modification', 70_000),
    event('maintenance', 400, 'Pending Approval'), event('maintenance', 400, 'Cancelled'),
    { ...event('maintenance', 999), assetId: 'B' }, event('transfer', 999),
    event('maintenance', -100), event('sparePartUsage', 'invalid'),
  ])
  assert.deepEqual(totals, { maintenance: 1200, spareParts: 800, subAssets: 50_000, modifications: 50_000, total: 102_000 })
})

test('demo issues stay unique across storage reads and preserve existing records', () => {
  const edited = { ...INITIAL_LIFECYCLE_EVENTS[0], cost: 100 }
  const existing = { transactionNo: 'MNT-2026-0001', assetId: 'A', status: 'Completed' }
  const merged = mergeDemoLifecycleEvents([edited, existing])
  assert.deepEqual(mergeDemoLifecycleEvents(merged), merged)
  assert.equal(merged.find((event) => event.transactionNo === edited.transactionNo).cost, 100)
  assert.ok(merged.includes(existing))
  assert.equal(getAssetExpenses('ME-2025-0042', INITIAL_LIFECYCLE_EVENTS).total, 12_500)
  assert.equal(getAssetExpenses('IT-2026-0004', INITIAL_LIFECYCLE_EVENTS).total, 9600)
})

test('newly active assets get three demo issues without duplicates or issues for draft assets', () => {
  const assets = [{ assetId: 'CUSTOM-A', name: 'Machine A', assetClass: 'ME - Machine', status: 'Active' }, { assetId: 'CUSTOM-B', status: 'Draft' }]
  const merged = mergeDemoLifecycleEvents([], assets)
  assert.equal(merged.filter((event) => event.assetId === 'CUSTOM-A').length, 3)
  assert.equal(merged.filter((event) => event.assetId === 'CUSTOM-B').length, 0)
  assert.deepEqual(mergeDemoLifecycleEvents(merged, assets), merged)
  assert.equal(getAssetExpenses('CUSTOM-A', merged).total, 5850)
})
