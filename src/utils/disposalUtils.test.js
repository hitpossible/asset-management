import test from 'node:test'
import assert from 'node:assert/strict'
import { prepareDisposal, disposalCutoff } from './disposalUtils.js'
import { getAssetDepreciationData } from './depreciationUtils.js'
import { buildMonthlyDepreciationReport } from './monthlyDepreciationReport.js'
import { summarizeAssets } from './assetUtils.js'

const types = [{ id: 'machine', name: 'Machine', usefulLifeYears: 5 }]
const asset = { assetId: 'ME-1', status: 'Active', assetTypeId: 'machine', acquisitionValue: 120000, depreciationStartDate: '2026-01-01' }
const form = { buyer: 'Buyer', saleProposalNo: 'SALE-1', taxInvoiceNo: 'ETAX-1', verifiedBy: 'Accounting', saleVerified: true, soldOn: '2026-10-12', convention: 'include-sale-month', saleAmount: '30000' }
const prepare = (changes = {}, target = asset) => prepareDisposal(target, { ...form, ...changes }, types, [], '2026-10-12')
const soldAsset = (convention) => {
  const record = prepare({ convention })
  return { ...asset, status: 'Sold', disposalRecord: record, depreciationStopDate: record.depreciationStopDate }
}

test('sale keeps cost and records the chosen cutoff balance', () => {
  const included = prepare()
  assert.equal(included.financialSnapshot.depreciationPeriods, 10)
  assert.equal(included.financialSnapshot.accumulatedDepreciation, 20000)
  assert.equal(included.financialSnapshot.netBookValue, 100000)
  assert.equal(prepare({ convention: 'exclude-sale-month' }).financialSnapshot.accumulatedDepreciation, 18000)
  assert.equal(disposalCutoff('2026-01-12', 'exclude-sale-month'), '2025-12-31')
  assert.equal(asset.status, 'Active')
})

test('rejects invalid sales, customer assets, duplicate sales and missing verification', () => {
  for (const changes of [{ saleVerified: false }, { saleProposalNo: ' ' }, { taxInvoiceNo: '' }, { soldOn: '2026-02-30' }, { soldOn: '2026-10-13' }, { soldOn: '2025-12-01' }, { saleAmount: '-1' }, { convention: '' }]) assert.throws(() => prepare(changes))
  assert.throws(() => prepare({}, { ...asset, status: 'Sold' }))
  assert.throws(() => prepare({}, { ...asset, ownershipType: 'customer' }))
})

test('sold DP remains frozen when asset type useful life changes', () => {
  const dp = getAssetDepreciationData(soldAsset('include-sale-month'), [{ ...types[0], usefulLifeYears: 10 }])
  assert.equal(dp.stopped, true)
  assert.equal(dp.usefulLifeYears, 5)
  assert.equal(dp.accumulatedDepreciation, 20000)
  assert.equal(dp.depreciationPeriods, 10)
})

test('reports retain pre-sale months, derecognize sale month, omit post-sale months', () => {
  for (const convention of ['include-sale-month', 'exclude-sale-month']) {
    const sold = soldAsset(convention)
    const before = buildMonthlyDepreciationReport([sold], types, [], '2026-09')
    assert.equal(before.total.monthlyDP, 2000)
    assert.equal(before.total.closingCost, 120000)
    assert.equal(before.rows[0].assets[0].status, 'Active')
    const sale = buildMonthlyDepreciationReport([sold], types, [], '2026-10')
    assert.equal(sale.total.monthlyDP, convention === 'include-sale-month' ? 2000 : 0)
    assert.equal(sale.total.closingCost, 0)
    assert.equal(sale.total.closingDP, 0)
    assert.equal(sale.total.closingNBV, 0)
    assert.equal(sale.total.disposals, 120000)
    assert.equal(sale.total.openingDP + sale.total.monthlyDP - sale.total.disposedDP, sale.total.closingDP)
    assert.equal(buildMonthlyDepreciationReport([sold], types, [], '2026-11').assetCount, 0)
  }
})

test('Sold is excluded from acquisition and active counts', () => {
  const summary = summarizeAssets([soldAsset('include-sale-month')])
  assert.equal(summary.activeAssets, 0)
  assert.equal(summary.acquisitionAssets, 0)
  assert.equal(summary.stageSummary.find((stage) => stage.label === 'Sold').count, 1)
})
