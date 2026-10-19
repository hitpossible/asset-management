import test from 'node:test'
import assert from 'node:assert/strict'
import { getControlSheetInvoices, getControlSheetPageCount, getControlSheetAttachments } from './controlSheetUtils.js'

test('includes every linked PO invoice and merges duplicates without losing recorded amounts', () => {
  const row = { asset: { invoiceReferences: [{ reference: 'INV-1', poNo: 'PO-1', amount: 500 }, { reference: 'INV-2', poNo: 'PO-2' }] }, invoiceDocuments: [{ reference: 'INV-1', poNo: 'PO-1', amount: null, date: '2026-10-15' }, { reference: 'INV-3', poNo: 'PO-1' }] }
  const invoices = getControlSheetInvoices(row)
  assert.equal(invoices.length, 3)
  assert.equal(invoices[0].amount, 500)
  assert.equal(invoices[0].date, '2026-10-15')
  assert.equal(invoices[1].reference, 'INV-2')
})

test('the same Invoice number on different POs remains separate and catalog only enriches linked invoices', () => {
  const row = { asset: { invoiceReferences: [{ reference: 'INV-1', poNo: 'PO-1' }, { reference: 'INV-1', poNo: 'PO-2' }] }, invoiceCatalog: [{ reference: 'INV-1', poNo: 'PO-1', amount: 123 }, { reference: 'INV-other', poNo: 'PO-3' }] }
  assert.deepEqual(getControlSheetInvoices(row).map((item) => [item.poNo, item.amount]), [['PO-1', 123], ['PO-2', undefined]])
})

test('page counts include the two new pages, existing sheets, all invoices and attachments', () => {
  assert.equal(getControlSheetPageCount({ asset: {} }), 4)
  const row = { asset: { invoices: ['INV-1', 'INV-2'] }, poNo: 'PO-1' }
  assert.equal(getControlSheetPageCount(row, [{ id: 'pdf' }, { id: 'image' }]), 8)
})

test('long Invoice lists paginate their summary without dropping any references', () => {
  const row = { asset: { invoices: Array.from({ length: 25 }, (_, i) => `INV-${i}`) } }
  assert.equal(getControlSheetInvoices(row).length, 25)
  assert.equal(getControlSheetPageCount(row), 31)
})


test('Vendor Delivery files are collected automatically across linked POs without duplicate attachments', () => {
  const file = { id: 'file-1', name: 'invoice.pdf', url: 'data:application/pdf;base64,JVBERi0=' }
  const row = { asset: { purchaseOrderReferences: [{ poNo: 'PO-1' }, { poNo: 'PO-2' }] }, invoiceCatalog: [
    { reference: 'INV-1', poNo: 'PO-1', attachment: file },
    { reference: 'INV-2', poNo: 'PO-2', attachment: { ...file, id: 'file-2', name: 'second.pdf' } },
    { reference: 'INV-other', poNo: 'PO-other', attachment: file },
  ] }
  const files = getControlSheetAttachments(row)
  assert.equal(files.length, 2)
  assert.deepEqual(files.map((item) => item.invoiceReference), ['INV-1', 'INV-2'])
  assert.equal(getControlSheetAttachments(row, files).length, 2)
  assert.equal(getControlSheetPageCount(row), 8)
  const savedRow = { asset: { invoiceReferences: getControlSheetInvoices(row).map(({ attachment, ...invoice }) => invoice) } }
  assert.deepEqual(getControlSheetAttachments(savedRow, files), files)
  assert.equal(getControlSheetPageCount(savedRow, files), 8)
})
