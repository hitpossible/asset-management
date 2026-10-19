import { getAssetReferences } from './misReferenceUtils.js'

export const INVOICES_PER_SHEET = 12

export function getControlSheetInvoices(row) {
  const assetReferences = getAssetReferences(row.asset)
  const poNumbers = new Set([row.poNo, ...assetReferences.purchaseOrderReferences.map((item) => item.poNo), ...assetReferences.invoiceReferences.map((item) => item.poNo)].filter(Boolean))
  const references = [...(row.invoiceCatalog || []).filter((invoice) => poNumbers.has(invoice.poNo)), ...assetReferences.invoiceReferences, ...(row.invoiceDocuments || [])]
  const invoices = new Map()
  for (const invoice of references) {
    if (!invoice.reference) continue
    const poNo = invoice.poNo || row.poNo || ''
    const key = `${poNo}:${invoice.reference}`
    const catalog = (row.invoiceCatalog || []).find((record) => record.poNo === poNo && record.reference === invoice.reference)
    const existing = invoices.get(key) || catalog || {}
    // Optional data from one source must not erase recorded values from another.
    const defined = Object.fromEntries(Object.entries(invoice).filter(([, value]) => value != null && value !== ''))
    invoices.set(key, { ...existing, ...defined, poNo })
  }
  return [...invoices.values()]
}

export function getControlSheetAttachments(row, savedAttachments = []) {
  const attachments = new Map()
  for (const invoice of getControlSheetInvoices(row)) {
    const files = [...(invoice.attachments || []), ...(invoice.attachment ? [invoice.attachment] : [])]
    for (const file of files) {
      if (!file.url) continue
      const key = `${invoice.poNo}:${invoice.reference}:${file.name}:${file.url}`
      attachments.set(key, { ...file, id: file.id || `${invoice.poNo}:${invoice.reference}:${file.name}`, invoiceReference: invoice.reference, poNo: invoice.poNo })
    }
  }
  for (const file of savedAttachments) {
    const key = `${file.poNo}:${file.invoiceReference}:${file.name || file.id}:${file.url}`
    if (!attachments.has(key)) attachments.set(key, file)
  }
  return [...attachments.values()]
}

export function getControlSheetPageCount(row, attachments = []) {
  const invoices = getControlSheetInvoices(row)
  return 3 + Math.max(1, Math.ceil(invoices.length / INVOICES_PER_SHEET)) + invoices.length + getControlSheetAttachments(row, attachments).length
}
