import test from 'node:test'
import assert from 'node:assert/strict'
import { summarizeVendorDelivery, validateVendorInvoice } from './vendorDeliveryUtils.js'
import { vendorDemoPO as po, vendorDemoInvoice as first } from '../data/mockVendorDelivery.js'
const final = { ...first, reference: 'INV-DEMO-002' }
test('partial delivery tracks remaining amounts and every PO item', () => {
  const result = summarizeVendorDelivery(po, [first])
  assert.equal(result.complete, false)
  assert.equal(result.remainingSatang, 12000000)
  assert.deepEqual(result.rows.map((row) => row.remaining), [2, 1])
})
test('both quantities and invoice total must equal PO to complete', () => {
  assert.equal(summarizeVendorDelivery(po, [first, final]).complete, true)
  assert.equal(summarizeVendorDelivery(po, [{ ...first, amount: 240000 }]).complete, false)
  assert.equal(summarizeVendorDelivery(po, [{ ...first, items: final.items.map((line) => ({ ...line, quantity: line.quantity * 2 })) }]).complete, false)
})
test('reject duplicate invoices, excess amounts, excess quantity and unapproved PO', () => {
  assert.ok(validateVendorInvoice(po, [first], first))
  assert.ok(validateVendorInvoice(po, [first], { ...final, amount: 120000.01 }))
  assert.ok(validateVendorInvoice(po, [first], { ...final, items: [{ key: '10', quantity: 3 }] }))
  assert.ok(validateVendorInvoice({ ...po, status: 'Created' }, [], first))
  assert.equal(validateVendorInvoice(po, [first], final), '')
})
test('currency comparison uses satang and every line must match', () => {
  const fractionalPO = { ...po, referenceTotal: 0.3 }
  assert.equal(summarizeVendorDelivery(fractionalPO, [{ ...first, amount: 0.1 }, { ...final, amount: 0.2 }]).complete, true)
  assert.equal(summarizeVendorDelivery(po, [first, { ...final, items: [{ key: '10', quantity: 3 }] }]).complete, false)
})

test('batch validation includes all scanned invoices before submission', async () => {
  const { validateVendorBatch } = await import('./vendorDeliveryUtils.js')
  assert.equal(validateVendorBatch(po, [], [first, final]), '')
  assert.ok(validateVendorBatch(po, [], [first, first]))
  assert.ok(validateVendorBatch(po, [first], []))
  assert.ok(validateVendorBatch(po, [first], [{ ...final, poNo: 'OTHER-PO' }]))
  assert.ok(validateVendorBatch(po, [], [{ ...first, items: [{ key: '10', quantity: 1 }, { key: '10', quantity: 1 }] }]))
})
