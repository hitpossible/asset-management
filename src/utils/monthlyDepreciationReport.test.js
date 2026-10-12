import test from 'node:test'
import assert from 'node:assert/strict'
import { buildMonthlyDepreciationReport } from './monthlyDepreciationReport.js'

const types = [{ id: 'machine', name: 'Machine', usefulLifeYears: 1 }]
const asset = { assetId: 'M-1', status: 'Active', assetTypeId: 'machine', acquisitionValue: 1200, depreciationStartDate: '2026-01-15' }
const report = (assets, month = '2026-08') => buildMonthlyDepreciationReport(assets, types, [], month)

test('opening, movement and closing balances reconcile including new Sub Assets', () => {
  const result = report([asset, { ...asset, assetId: 'M-1-1', parentAssetId: 'M-1', depreciationStartDate: '2026-08-31' }])
  assert.deepEqual(result.total, { description: 'TOTAL', count: 2, openingCost: 1200, closingCost: 2400, additions: 1200, openingDP: 700, openingNBV: 500, monthlyDP: 200, closingDP: 900, closingNBV: 1500, disposals: 0, disposedDP: 0 })
})
test('caps depreciation and charges only remaining value in the final period', () => {
  const fractionalLife = [{ ...types[0], usefulLifeYears: 1.05 }]
  const final = buildMonthlyDepreciationReport([asset], fractionalLife, [], '2027-01')
  assert.ok(Math.abs(final.total.monthlyDP - 1200 / 21) < 1e-9)
  assert.equal(final.total.closingDP, 1200)
  assert.equal(final.total.closingNBV, 0)
  assert.equal(report([asset], '2027-02').total.monthlyDP, 0)
})
test('excludes customers, pending assets, future start dates and flags incomplete DP', () => {
  const result = report([asset, { ...asset, ownershipType: 'customer' }, { ...asset, status: 'Draft' }, { ...asset, depreciationStartDate: '2026-09-01' }, { ...asset, assetId: 'M-2', depreciationStartDate: '' }])
  assert.equal(result.assetCount, 1)
  assert.deepEqual(result.excluded.map((item) => item.assetId), ['M-2'])
})
test('handles year rollover and rejects invalid months', () => {
  assert.equal(report([asset], '2026-01').total.openingCost, 0)
  assert.equal(report([asset], '2026-01').total.monthlyDP, 100)
  assert.throws(() => report([asset], '2026-13'))
})
test('groups asset details with prior-year accumulated DP and calendar-year movement', () => {
  const result = report([{ ...asset, acquisitionValue: 30000, depreciationStartDate: '2025-08-01', quantity: 2, name: 'Inspection recorder', lineCode: 'K1PD01', acquisitionDate: '2025-08-01', createdAt: '2025-09-02T10:00:00Z' }])
  const detail = result.rows[0].assets[0]
  assert.equal(detail.assetId, 'M-1')
  assert.equal(detail.unitCost, 15000)
  assert.equal(detail.yearOpeningDP, 12500)
  assert.equal(detail.yearToDateDP, 17500)
  assert.equal(detail.closingDP, 30000)
  assert.equal(detail.monthlyDP, 0)
  assert.equal(detail.closingNBV, 0)
  assert.equal(detail.line, 'K1PD01')
  assert.equal(detail.serviceDate, '')
})
test('asset detail YTD reconciles across year rollover and separate asset types', () => {
  const result = buildMonthlyDepreciationReport([
    { ...asset, depreciationStartDate: '2025-12-01' },
    { ...asset, assetId: 'SW-1', assetTypeId: 'software' },
  ], [...types, { id: 'software', name: 'Software', usefulLifeYears: 5 }], [], '2026-01')
  assert.deepEqual(result.rows.map((row) => row.description), ['Machine', 'Software'])
  for (const group of result.rows) {
    const detail = group.assets[0]
    assert.equal(detail.yearToDateDP, detail.monthlyDP)
    assert.equal(detail.yearOpeningDP + detail.yearToDateDP, detail.closingDP)
    assert.equal(detail.assetValue - detail.closingDP, detail.closingNBV)
  }
})
