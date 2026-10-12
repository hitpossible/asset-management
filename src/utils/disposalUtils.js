import { isCustomerAsset } from './assetOwnershipUtils.js'
import { calculateDepreciationBalance, getAssetDepreciationData } from './depreciationUtils.js'

export function bangkokDate() {
  const parts = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Bangkok', year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(new Date())
  return ['year', 'month', 'day'].map((type) => parts.find((part) => part.type === type).value).join('-')
}

export function disposalCutoff(soldOn, convention) {
  if (convention === 'include-sale-month') return soldOn
  const [year, month] = soldOn.split('-').map(Number)
  const previous = new Date(year, month - 1, 0)
  return `${previous.getFullYear()}-${String(previous.getMonth() + 1).padStart(2, '0')}-${String(previous.getDate()).padStart(2, '0')}`
}

export function prepareDisposal(asset, form, assetTypes = [], purchaseOrders = [], today = bangkokDate()) {
  if (!asset || asset.status !== 'Active' || isCustomerAsset(asset)) throw new Error('Select an Active Company Asset.')
  const record = Object.fromEntries(['buyer', 'saleProposalNo', 'taxInvoiceNo', 'verifiedBy', 'soldOn', 'remark'].map((key) => [key, String(form[key] || '').trim()]))
  if (!record.buyer || !record.saleProposalNo || !record.taxInvoiceNo || !record.verifiedBy || !form.saleVerified) throw new Error('Enter the sale references, buyer and verifier, and confirm that Verify Sale is complete.')
  const soldDate = new Date(`${record.soldOn}T00:00:00Z`)
  if (!/^\d{4}-\d{2}-\d{2}$/.test(record.soldOn) || Number.isNaN(soldDate.getTime()) || soldDate.toISOString().slice(0, 10) !== record.soldOn || record.soldOn > today) throw new Error('Enter a valid sale date on or before today.')
  if (asset.depreciationStartDate && record.soldOn < asset.depreciationStartDate.slice(0, 10)) throw new Error('Sale date cannot precede the depreciation start date.')
  if (!['include-sale-month', 'exclude-sale-month'].includes(form.convention)) throw new Error('Select the last depreciation month convention.')
  const saleAmount = form.saleAmount === '' || form.saleAmount == null ? null : Number(form.saleAmount)
  if (saleAmount !== null && (!Number.isFinite(saleAmount) || saleAmount < 0)) throw new Error('Sale amount must be zero or greater.')
  const depreciationStopDate = disposalCutoff(record.soldOn, form.convention)
  const dp = getAssetDepreciationData(asset, assetTypes, purchaseOrders)
  const balance = calculateDepreciationBalance({ ...dp, startDate: asset.depreciationStartDate, asOfDate: new Date(`${depreciationStopDate}T00:00:00`) })
  return {
    ...record, saleAmount, convention: form.convention, depreciationStopDate,
    saleVerified: true, previousStatus: asset.status, actor: 'Pat S.',
    financialSnapshot: { assetValue: dp.assetValue, usefulLifeYears: dp.usefulLifeYears, valueSource: dp.valueSource, ...balance },
    assignmentSnapshot: { custodian: asset.custodian, plant: asset.plant, location: asset.location, line: asset.line, parentAssetId: asset.parentAssetId || '' },
  }
}

export function prepareInvoiceDisposals(form, assets = [], assetTypes = [], purchaseOrders = [], today = bangkokDate()) {
  const invoice = form.invoice
  if (!invoice?.taxInvoiceNo || !invoice.buyer || !invoice.issueDate || !invoice.saleProposalNo || invoice.saleProposalStatus !== 'Approved') {
    throw new Error('Select an e-Tax invoice linked to an approved Sale Proposal.')
  }
  if (!form.saleVerified || !String(form.verifiedBy || '').trim()) {
    throw new Error('Confirm Verify Sale and enter the verifier before disposal.')
  }
  if (!['include-sale-month', 'exclude-sale-month'].includes(form.convention)) {
    throw new Error('Select the last depreciation month.')
  }

  const selected = (form.mappings || []).filter((mapping) => mapping.assetId)
  if (!selected.length) throw new Error('Match at least one Invoice Item to an Active Company Asset.')
  const usedAssetIds = new Set()

  return selected.map((mapping) => {
    const item = invoice.items?.find((entry) => String(entry.itemNo) === String(mapping.invoiceItemNo))
    if (!item) throw new Error(`Invoice Item ${mapping.invoiceItemNo} is not part of ${invoice.taxInvoiceNo}.`)
    if (usedAssetIds.has(mapping.assetId)) throw new Error('Each Asset can only be matched once in this disposal batch.')
    usedAssetIds.add(mapping.assetId)

    const asset = assets.find((entry) => entry.assetId === mapping.assetId)
    const prepared = prepareDisposal(asset, {
      buyer: invoice.buyer,
      saleProposalNo: invoice.saleProposalNo,
      taxInvoiceNo: invoice.taxInvoiceNo,
      verifiedBy: form.verifiedBy,
      soldOn: invoice.issueDate,
      saleAmount: item.amount ?? '',
      convention: form.convention,
      saleVerified: form.saleVerified,
      remark: form.remark,
    }, assetTypes, purchaseOrders, today)

    return {
      ...prepared,
      assetId: asset.assetId,
      assetName: asset.name,
      taxInvoiceDate: invoice.issueDate,
      taxInvoiceTotalAmount: invoice.totalAmount ?? null,
      invoiceItemAssetLink: {
        taxInvoiceNo: invoice.taxInvoiceNo,
        invoiceItemNo: String(item.itemNo),
        description: item.description,
        quantity: item.quantity ?? null,
        itemAmount: item.amount ?? null,
        buyer: invoice.buyer,
        invoiceDate: invoice.issueDate,
        invoiceTotalAmount: invoice.totalAmount ?? null,
        saleProposalNo: invoice.saleProposalNo,
        assetId: asset.assetId,
        assetName: asset.name,
      },
    }
  })
}
