export const toSatang = (value) => Math.round(Number(value) * 100)
export const deliveryItemKey = (item) => String(item.itemNo || item.itemId || item.assetId)

export function summarizeVendorDelivery(po, invoices) {
  const rows = (po.assetItems || []).map((item) => {
    const key = deliveryItemKey(item)
    const ordered = Number(item.orderedQuantity ?? item.quantity ?? 1)
    const delivered = invoices.reduce((sum, invoice) => sum + (invoice.items || []).reduce((count, line) => count + (line.key === key ? Number(line.quantity) : 0), 0), 0)
    return { ...item, key, ordered, delivered, remaining: ordered - delivered }
  })
  const totalSatang = toSatang(po.referenceTotal)
  const deliveredSatang = invoices.reduce((sum, invoice) => sum + toSatang(invoice.amount), 0)
  const quantityComplete = rows.length > 0 && rows.every((row) => row.remaining === 0)
  const amountComplete = totalSatang === deliveredSatang
  const exceeded = deliveredSatang > totalSatang || rows.some((row) => row.remaining < 0)
  return { rows, totalSatang, deliveredSatang, remainingSatang: totalSatang - deliveredSatang, quantityComplete, amountComplete, complete: quantityComplete && amountComplete && !exceeded, exceeded }
}

export function validateVendorInvoice(po, invoices, invoice) {
  if (invoice.poNo !== po.poNo) return 'Invoice นี้อ้างอิงคนละ PO กรุณาสแกนเอกสารที่ถูกต้อง'
  if (po.status !== 'Approved') return 'PO ยังไม่ได้รับอนุมัติ'
  if (!invoice.reference.trim() || !invoice.date || !invoice.documentName) return 'ระบุเลข Invoice วันที่ และแนบเอกสาร Invoice'
  if (invoices.some((row) => row.reference.trim().toLowerCase() === invoice.reference.trim().toLowerCase())) return 'เลข Invoice นี้ถูกบันทึกใน PO แล้ว'
  if (!Number.isFinite(Number(invoice.amount)) || Number(invoice.amount) <= 0) return 'ยอด Invoice ต้องมากกว่า 0'
  const summary = summarizeVendorDelivery(po, invoices)
  if (toSatang(invoice.amount) > summary.remainingSatang) return 'ยอด Invoice เกินยอดเงินคงเหลือของ PO'
  if (!Array.isArray(invoice.items) || !invoice.items.length || invoice.items.some((line) => !Number.isFinite(line.quantity) || line.quantity < 0)) return 'จำนวนสินค้าต้องเป็นตัวเลขตั้งแต่ 0 ขึ้นไป'
  if (new Set(invoice.items.map((line) => line.key)).size !== invoice.items.length) return 'พบ PO Item ซ้ำใน Invoice กรุณาตรวจสอบเอกสาร'
  if (invoice.items.some((line) => !summary.rows.some((row) => row.key === line.key) || line.quantity > summary.rows.find((row) => row.key === line.key)?.remaining)) return 'จำนวนสินค้าที่ส่งเกินจำนวนคงเหลือใน PO'
  return ''
}

export function validateVendorBatch(po, submittedInvoices, scannedInvoices) {
  if (!scannedInvoices.length) return 'กรุณาสแกน Invoice อย่างน้อย 1 ใบก่อน Submit'
  const accumulated = [...submittedInvoices]
  for (const invoice of scannedInvoices) {
    const error = validateVendorInvoice(po, accumulated, invoice)
    if (error) return error
    accumulated.push(invoice)
  }
  return ''
}
