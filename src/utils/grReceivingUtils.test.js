import test from 'node:test'
import assert from 'node:assert/strict'
import { buildPOChoices } from './grReceivingUtils.js'
import { linkGoodsReceiptPO, linkGoodsReceiptInvoice } from './misReferenceUtils.js'
import { getExpenseReceivingUpdate } from './expenseReceivingUtils.js'

const asset = { assetId: 'MAIN-1', name: 'Machine', status: 'Active' }
const line = { assetId: asset.assetId, itemId: 'WORK-1', itemNo: '10', assetMode: 'existing', workType: 'maintenance', workOnExistingAsset: true, costTreatment: 'Expense', orderedQuantity: 1 }
const po = { poNo: 'PO-WORK-1', status: 'Approved', proposalId: 'PROP-WORK-1', assetItems: [line] }
const invoice = { poNo: po.poNo, reference: 'INV-SERVICE-1', amount: 123, items: [{ key: '10', quantity: 1 }] }

test('delivered Expense services on an Active Asset appear in GR even when the Asset master PO reference is missing', () => {
  const choices = buildPOChoices([po], [asset], [], [invoice])
  assert.equal(choices.length, 1)
  assert.equal(choices[0].poNo, po.poNo)
  assert.deepEqual(choices[0].invoiceReferences, [invoice.reference])
  assert.equal(choices[0].assetItems[0].remainingQuantity, 1)
})

test('Active work is receivable for either treatment but old acquisition POs and Customer lifecycle work stay excluded', () => {
  assert.equal(buildPOChoices([{ ...po, assetItems: [{ ...line, costTreatment: 'Capitalized' }] }], [asset], [], []).length, 1)
  assert.equal(buildPOChoices([{ ...po, assetItems: [{ assetId: asset.assetId, orderedQuantity: 1 }] }], [asset], [], []).length, 0)
  assert.equal(buildPOChoices([po], [{ ...asset, ownershipType: 'customer' }], [], []).length, 0)
  assert.equal(buildPOChoices([{ ...po, status: 'Pending Approval' }], [asset], [], [invoice]).length, 0)
})

test('older Expense references supply the treatment when a PO item lacks it', () => {
  const legacyAsset = { ...asset, purchaseOrderReferences: [{ poNo: po.poNo, itemNo: '10', costTreatment: 'Expense' }] }
  const legacyPO = { ...po, assetItems: [{ assetId: asset.assetId, itemNo: '10' }] }
  assert.equal(buildPOChoices([legacyPO], [legacyAsset], [], [invoice])[0].assetItems[0].costTreatment, 'Expense')
  assert.equal(buildPOChoices([], [legacyAsset], [], [invoice])[0].assetItems[0].costTreatment, 'Expense')
})

test('receiving one PO line does not hide another line for the same Asset; partial and completed quantities are retained', () => {
  const order = { ...po, assetItems: [line, { ...line, itemNo: '20', itemId: 'WORK-2', orderedQuantity: 2 }] }
  const receipt = { poNo: po.poNo, grNo: 'GR-1', assetItems: [{ assetId: asset.assetId, itemNo: '10', receivedQuantity: 1 }, { assetId: asset.assetId, itemNo: '20', receivedQuantity: 1 }] }
  const choices = buildPOChoices([order], [asset], [receipt], [invoice])
  assert.equal(choices[0].assetItems.length, 1)
  assert.equal(choices[0].assetItems[0].itemNo, '20')
  assert.equal(choices[0].assetItems[0].remainingQuantity, 1)
  const finalReceipt = { ...receipt, grNo: 'GR-2', assetItems: [{ assetId: asset.assetId, itemNo: '20', receivedQuantity: 1 }] }
  assert.equal(buildPOChoices([order], [asset], [receipt, finalReceipt], [invoice]).length, 0)
})

test('GR save repairs references from its approved PO and completes Expense service without changing the Asset', () => {
  const receipt = { poNo: po.poNo, grNo: 'GR-SERVICE-1', invoiceReference: invoice.reference, invoiceAmount: invoice.amount, goodsChecked: true, receivedDate: '2026-10-07', createdAt: '2026-10-07T03:00:00Z', assetItems: [{ ...line, receivedQuantity: 1 }] }
  const linked = linkGoodsReceiptInvoice(linkGoodsReceiptPO(asset, receipt, [po]), receipt)
  const event = { assetId: asset.assetId, poNo: po.poNo, proposalId: po.proposalId, proposalItemId: line.itemId, costTreatment: 'Expense', type: 'maintenance' }
  assert.equal(getExpenseReceivingUpdate(event, receipt, [linked], [po]).status, 'Completed')
  assert.equal(linked.status, 'Active')
  assert.equal(linked.acquisitionValue, undefined)
  assert.deepEqual(linkGoodsReceiptPO(asset, receipt, [{ ...po, status: 'Pending Approval' }]), asset)
})
