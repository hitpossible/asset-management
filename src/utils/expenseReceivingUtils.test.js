import test from 'node:test'
import assert from 'node:assert/strict'
import { getExpenseReceivingUpdate } from './expenseReceivingUtils.js'
import { getAssetExpenses } from './assetExpenseUtils.js'
import { linkGoodsReceiptInvoice } from './misReferenceUtils.js'
import { formatDate } from './assetUtils.js'

const event = { assetId: 'PARENT', proposalId: 'PROP-1', proposalItemId: 'item-1', poNo: 'PO-1', type: 'maintenance', costTreatment: 'Expense', cost: 50_000, value: 50_000, status: 'GR Received' }
const asset = { assetId: 'PARENT', status: 'Active', purchaseOrderReferences: [{ poNo: 'PO-1', itemNo: '10' }], invoiceReferences: [{ reference: 'INV-1', poNo: 'PO-1', amount: 123 }] }
const order = { poNo: 'PO-1', proposalId: 'PROP-1', assetItems: [{ assetId: 'PARENT', itemId: 'item-1', itemNo: '10', orderedQuantity: 1 }] }
const receipt = { grNo: 'GR-1', poNo: 'PO-1', invoiceReference: 'INV-1', goodsChecked: true, receivedDate: '2026-10-01', createdAt: '2026-10-01T04:00:00Z', assetItems: [{ assetId: 'PARENT', itemNo: '10', receivedQuantity: 1 }] }
const update = (changes = {}, assets = [asset], orders = [order], previous = []) => getExpenseReceivingUpdate(event, { ...receipt, ...changes }, assets, orders, previous)

test('Modification and Maintenance on an Active Asset complete after accepted receiving without a new child', () => {
  for (const type of ['modification', 'maintenance']) {
    const work = { ...event, type, workOnExistingAsset: true, costTreatment: 'Capitalized', cost: 60000 }
    assert.equal(getExpenseReceivingUpdate(work, receipt, [asset], [order]).status, 'Completed')
    assert.equal(getExpenseReceivingUpdate(work, { ...receipt, goodsChecked: false }, [asset], [order]).status, 'Hold / Correction Required')
  }
  assert.equal(asset.status, 'Active')
})

test('accepted Expense completes with same-PO references regardless of Invoice amount', () => {
  for (const type of ['subAsset', 'modification', 'maintenance']) {
    const changes = getExpenseReceivingUpdate({ ...event, type }, receipt, [asset], [order])
    assert.equal(changes.status, 'Completed')
    assert.equal(changes.completedAt, receipt.createdAt)
    assert.equal(formatDate(changes.completedAt), '01 Oct 2026', 'Lifecycle can display the completed Expense timestamp')
    assert.equal(changes.occurredOn, receipt.receivedDate)
    assert.equal(changes.acceptedBy, 'Purchasing + Asset Owner')
    assert.deepEqual(changes.grReferences, ['GR-1'])
    assert.deepEqual(changes.invoiceReferences, ['INV-1'])
    assert.equal(getAssetExpenses('PARENT', [{ ...event, type, ...changes }]).total, 50_000)
  }
  assert.equal(asset.status, 'Active')
})

test('missing/mismatched references or failed work acceptance require correction', () => {
  assert.equal(update({ invoiceReference: 'UNKNOWN' }).status, 'Hold / Correction Required')
  assert.equal(update({}, [{ ...asset, invoiceReferences: [{ reference: 'INV-1', poNo: 'OTHER' }] }]).status, 'Hold / Correction Required')
  assert.equal(update({}, [{ ...asset, purchaseOrderReferences: [] }]).status, 'Hold / Correction Required')
  assert.equal(update({}, [asset], []).status, 'Hold / Correction Required')
  assert.equal(update({ grNo: '' }).status, 'Hold / Correction Required')
  assert.equal(update({ goodsChecked: false }).status, 'Hold / Correction Required')
  assert.equal(update({}, [asset], [{ ...order, proposalId: 'OTHER' }]).status, 'Hold / Correction Required')
})

test('partial receiving waits, then completes after remaining accepted delivery', () => {
  const orders = [{ ...order, assetItems: [{ ...order.assetItems[0], orderedQuantity: 2 }] }]
  assert.equal(update({}, [asset], orders).status, 'GR Received')
  const changes = update({ grNo: 'GR-2' }, [asset], orders, [receipt])
  assert.equal(changes.status, 'Completed')
  assert.deepEqual(changes.grReferences, ['GR-1', 'GR-2'])
  assert.equal(update({}, [asset], orders, [receipt]).status, 'GR Received', 'duplicate receipt is not counted twice')
})

test('unrelated PO items and capitalized Sub Assets never complete as Expense', () => {
  assert.equal(update({ poNo: 'OTHER' }), null)
  assert.equal(update({ assetItems: [{ assetId: 'OTHER' }] }), null)
  assert.equal(getExpenseReceivingUpdate({ ...event, costTreatment: 'Capitalized', subAssetId: 'PARENT-1' }, receipt, [asset], [order]), null)
})


test('Invoice entered with GR completes Expense without prior Invoice registration', () => {
  const original = { ...asset, invoices: [], invoiceReferences: [] }
  const savedReceipt = { ...receipt, invoiceAmount: 999 }
  const linked = linkGoodsReceiptInvoice(original, savedReceipt)
  assert.equal(getExpenseReceivingUpdate(event, savedReceipt, [linked], [order]).status, 'Completed')
  assert.deepEqual(linked.invoiceReferences, [{ reference: 'INV-1', poNo: 'PO-1', amount: 999 }])
  assert.equal(linked.status, 'Active')
  assert.deepEqual(original.invoiceReferences, [])
})

test('reusing an Invoice retains its amount and further GRs preserve multiple Invoices', () => {
  const reused = linkGoodsReceiptInvoice(asset, { ...receipt, invoiceAmount: null })
  assert.deepEqual(reused.invoiceReferences, asset.invoiceReferences)
  const added = linkGoodsReceiptInvoice(reused, { ...receipt, grNo: 'GR-2', invoiceReference: 'INV-2' })
  assert.deepEqual(added.invoiceReferences.map((item) => item.reference), ['INV-1', 'INV-2'])
})

test('GR Invoice registration only applies to received Assets linked to its PO', () => {
  assert.equal(linkGoodsReceiptInvoice(asset, { ...receipt, poNo: 'OTHER' }), asset)
  assert.equal(linkGoodsReceiptInvoice(asset, { ...receipt, assetItems: [] }), asset)
})
