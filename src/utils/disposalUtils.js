import { isCustomerAsset } from './assetOwnershipUtils.js'
import { calculateDepreciationBalance, getAssetDepreciationData } from './depreciationUtils.js'
import { DEMO_AUDIT_ACTOR } from './auditLogUtils.js'

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
  const record = Object.fromEntries(['buyer', 'saleProposalNo', 'taxInvoiceNo', 'soldOn', 'remark'].map((key) => [key, String(form[key] || '').trim()]))
  record.verifiedBy = String(form.verifiedBy || DEMO_AUDIT_ACTOR.name).trim()
  if (!record.buyer || !record.saleProposalNo || !record.taxInvoiceNo || !form.saleVerified) throw new Error('Enter the sale references and confirm that Verify Sale is complete.')
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
    saleVerified: true, previousStatus: asset.status, actor: DEMO_AUDIT_ACTOR.name,
    financialSnapshot: { assetValue: dp.assetValue, usefulLifeYears: dp.usefulLifeYears, valueSource: dp.valueSource, ...balance },
    assignmentSnapshot: { custodian: asset.custodian, plant: asset.plant, location: asset.location, line: asset.line, parentAssetId: asset.parentAssetId || '' },
  }
}

export function previewInvoiceDisposals(invoice, assetIds = [], assets = [], assetTypes = [], purchaseOrders = [], convention = '') {
  if (!invoice || !assetIds.length) return []
  const amountBeforeVat = Number(invoice.amountBeforeVat)
  const validAmount = Number.isFinite(amountBeforeVat) && amountBeforeVat >= 0 ? amountBeforeVat : null
  const uniqueAssetIds = [...new Set(assetIds.map(String))]
  const allocation = validAmount === null ? null : validAmount / uniqueAssetIds.length
  const depreciationStopDate = ['include-sale-month', 'exclude-sale-month'].includes(convention)
    ? disposalCutoff(invoice.issueDate, convention)
    : ''

  return uniqueAssetIds.map((assetId) => {
    const asset = assets.find((entry) => entry.assetId === assetId) || null
    const dp = asset ? getAssetDepreciationData(asset, assetTypes, purchaseOrders) : null
    const balance = dp && depreciationStopDate
      ? calculateDepreciationBalance({ ...dp, startDate: asset.depreciationStartDate, asOfDate: new Date(`${depreciationStopDate}T00:00:00`) })
      : null
    const netBookValue = balance?.netBookValue ?? null
    const rawGainLossValue = allocation !== null && netBookValue !== null ? allocation - netBookValue : null
    const gainLossValue = rawGainLossValue === null ? null : Math.round(rawGainLossValue * 100) / 100
    return {
      assetId,
      asset,
      status: asset?.status || 'Asset record unavailable',
      eligible: Boolean(asset && asset.status === 'Active' && !isCustomerAsset(asset)),
      assetValue: dp?.assetValue ?? null,
      usefulLifeYears: dp?.usefulLifeYears ?? null,
      depreciationStartDate: asset?.depreciationStartDate || '',
      netBookValue,
      saleAllocation: allocation,
      gainLossValue,
      gainLossResult: gainLossValue === null ? '' : gainLossValue > 0 ? 'Profit' : gainLossValue < 0 ? 'Loss' : 'Break-even',
    }
  })
}

export function prepareInvoiceDisposals(form, assets = [], assetTypes = [], purchaseOrders = [], today = bangkokDate()) {
  const invoice = form.invoice
  if (!invoice?.taxInvoiceNo || !invoice.buyer || !invoice.issueDate || !invoice.saleProposalNo || invoice.saleProposalStatus !== 'Approved') {
    throw new Error('Select an e-Tax invoice linked to an approved Sale Proposal.')
  }
  if (form.proposal && (form.proposal.saleProposalNo !== invoice.saleProposalNo || form.proposal.status !== 'Approved')) {
    throw new Error('The selected Sale Proposal does not match this approved e-Tax invoice.')
  }
  if (invoice.amountBeforeVat == null || invoice.amountBeforeVat === '' || !Number.isFinite(Number(invoice.amountBeforeVat)) || Number(invoice.amountBeforeVat) < 0) {
    throw new Error('The invoice amount before VAT is unavailable.')
  }
  if (!form.saleVerified) {
    throw new Error('Confirm Verify Sale before disposal.')
  }
  if (!['include-sale-month', 'exclude-sale-month'].includes(form.convention)) {
    throw new Error('Select the last depreciation month.')
  }

  if (!Array.isArray(invoice.items) || invoice.items.length === 0 || invoice.items.some((item) => !item.assetId)) {
    throw new Error('The Tax Invoice is missing an Asset reference for one or more sale items.')
  }
  const invoiceAssetIds = [...new Set(invoice.items.map((item) => String(item.assetId)))]
  const selectedAssetIds = [...new Set((form.assetIds || []).map(String))]
  if (!invoiceAssetIds.length || invoiceAssetIds.length !== selectedAssetIds.length || invoiceAssetIds.some((assetId) => !selectedAssetIds.includes(assetId))) {
    throw new Error('The selected sale Assets must match the Asset references on this invoice.')
  }
  const preview = previewInvoiceDisposals(invoice, selectedAssetIds, assets, assetTypes, purchaseOrders, form.convention)
  if (preview.some((entry) => !entry.eligible)) throw new Error('Every Asset on the sale invoice must be an Active Company Asset.')
  if (preview.some((entry) => entry.netBookValue === null || entry.saleAllocation === null || entry.gainLossValue === null)) {
    throw new Error('Net Value cannot be calculated for every Asset. Complete its Asset Value and depreciation details before disposal.')
  }

  return preview.map((entry) => {
    const asset = entry.asset
    const prepared = prepareDisposal(asset, {
      buyer: invoice.buyer,
      saleProposalNo: invoice.saleProposalNo,
      taxInvoiceNo: invoice.taxInvoiceNo,
      verifiedBy: form.verifiedBy || DEMO_AUDIT_ACTOR.name,
      soldOn: invoice.issueDate,
      saleAmount: entry.saleAllocation,
      convention: form.convention,
      saleVerified: form.saleVerified,
      remark: form.remark,
    }, assetTypes, purchaseOrders, today)

    return {
      ...prepared,
      assetId: asset.assetId,
      assetName: asset.name,
      saleAmount: entry.saleAllocation,
      invoiceAmountBeforeVat: Number(invoice.amountBeforeVat),
      taxInvoiceDate: invoice.issueDate,
      taxInvoiceTotalAmount: invoice.totalAmount ?? null,
      vatAmount: invoice.vatAmount ?? null,
      assetCountOnInvoice: preview.length,
      gainLossValue: Math.round(entry.gainLossValue * 100) / 100,
      gainLossAmount: Math.round(Math.abs(entry.gainLossValue) * 100) / 100,
      gainLossResult: entry.gainLossResult,
      saleAssetLink: {
        taxInvoiceNo: invoice.taxInvoiceNo,
        buyer: invoice.buyer,
        invoiceDate: invoice.issueDate,
        amountBeforeVat: Number(invoice.amountBeforeVat),
        invoiceTotalAmount: invoice.totalAmount ?? null,
        vatAmount: invoice.vatAmount ?? null,
        saleProposalNo: invoice.saleProposalNo,
        assetId: asset.assetId,
        assetName: asset.name,
        assetCount: preview.length,
        allocatedAmount: entry.saleAllocation,
        netBookValue: entry.netBookValue,
        gainLossValue: Math.round(entry.gainLossValue * 100) / 100,
        gainLossAmount: Math.round(Math.abs(entry.gainLossValue) * 100) / 100,
        gainLossResult: entry.gainLossResult,
      },
    }
  })
}
