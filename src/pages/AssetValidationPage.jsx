import { useEffect, useMemo, useState } from 'react'
import Icon from '../components/Icon.jsx'
import AssetValidationWizard from '../components/AssetValidationWizard.jsx'
import AssetReceivingDocuments from '../components/AssetReceivingDocuments.jsx'
import StatusBadge from '../components/StatusBadge.jsx'
import { PageHeading } from '../components/common.jsx'
import { getAssetReferences } from '../utils/misReferenceUtils.js'
import { getProposalItemTotal } from '../utils/proposalAssetUtils.js'
import { isPendingActivation } from '../utils/activationApprovalUtils.js'

const ASSET_VALIDATION_STATUSES = new Set([
  'Waiting Delivery',
  'Waiting Invoice',
  'Waiting GR',
  'Asset Validation',
  'Ready for Verification',
  'Verification In Progress',
  'Returned for Correction',
  'On Hold',
])
const WAITING_OR_HOLD_STATUSES = new Set(['Waiting Invoice', 'Waiting GR', 'Hold / Correction Required', 'Returned for Correction'])

function unique(values) {
  return [...new Set(values.filter(Boolean))]
}

function formatTHB(value) {
  return `฿ ${new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(Number(value) || 0)}`
}

function formatQuantity(value) {
  return new Intl.NumberFormat('en-US', { maximumFractionDigits: 2 }).format(Number(value) || 0)
}

function getLineAmount(item) {
  const hasAssetAmount = item.assetAmount !== undefined && item.assetAmount !== null && item.assetAmount !== ''
  const amount = Number(item.referenceAmount ?? item.assetAmount ?? item.amount) || 0
  const costs = (item.costs || []).reduce((total, cost) => total + (Number(cost.amount) || 0), 0)
  const quantity = Number(item.orderedQuantity ?? item.quantity) || 1
  return { amount: (amount + costs) * quantity, hasAmount: hasAssetAmount || item.referenceAmount != null || item.amount != null || costs > 0 }
}

function buildValidationRows(assets, purchaseOrders, goodsReceipts, proposals, vendorInvoices) {
  const assetsById = new Map(assets.map((asset) => [asset.assetId, asset]))

  return assets.flatMap((asset) => {
    if (!ASSET_VALIDATION_STATUSES.has(asset.status)) return []

    const references = getAssetReferences(asset)
    const poNumbers = unique(references.purchaseOrderReferences.map((item) => item.poNo))

    return poNumbers.map((poNo) => {
      const linkedAssets = assets.filter((candidate) => getAssetReferences(candidate).purchaseOrderReferences.some((item) => item.poNo === poNo))
      const po = purchaseOrders.find((item) => item.poNo === poNo) || null
      const invoiceMap = new Map()
      linkedAssets.forEach((candidate) => {
        getAssetReferences(candidate).invoiceReferences
          .filter((item) => item.reference && item.poNo === poNo)
          .forEach((item) => {
            const existing = invoiceMap.get(item.reference)
            if (!existing || (existing.amount == null && item.amount != null)) invoiceMap.set(item.reference, item)
          })
      })

      const receiptMap = new Map()
      goodsReceipts.filter((receipt) => receipt.poNo === poNo).forEach((receipt) => {
        const current = receiptMap.get(receipt.grNo) || { ...receipt, assetItems: [] }
        const itemMap = new Map(current.assetItems.map((item) => [item.assetId, item]))
        ;(receipt.assetItems || []).forEach((item) => itemMap.set(item.assetId, { ...itemMap.get(item.assetId), ...item }))
        receiptMap.set(receipt.grNo, { ...current, ...receipt, assetItems: [...itemMap.values()] })
      })
      linkedAssets.forEach((candidate) => {
        getAssetReferences(candidate).goodsReceiptReferences
          .filter((item) => item.reference && item.poNo === poNo)
          .forEach((reference) => {
            const current = receiptMap.get(reference.reference) || { grNo: reference.reference, poNo, receivedDate: '', invoiceReference: reference.invoiceReference || '', goodsChecked: reference.goodsChecked === true, assetItems: [] }
            if (!current.assetItems.some((item) => item.assetId === candidate.assetId)) {
              current.assetItems.push({
                assetId: candidate.assetId,
                assetName: candidate.name,
                itemNo: reference.itemNo || '',
                receivedQuantity: reference.receivedQuantity,
                unitOfMeasure: reference.unitOfMeasure || 'asset',
              })
            }
            if (!current.invoiceReference && reference.invoiceReference) current.invoiceReference = reference.invoiceReference
            if (reference.goodsChecked) current.goodsChecked = true
            receiptMap.set(reference.reference, current)
          })
      })

      const receiptDocuments = [...receiptMap.values()]
      receiptDocuments.forEach((receipt) => {
        if (receipt.invoiceReference && !invoiceMap.has(receipt.invoiceReference)) {
          invoiceMap.set(receipt.invoiceReference, { reference: receipt.invoiceReference, poNo, amount: null })
        }
      })

      const purchaseOrderLines = []
      ;(po?.assetItems || []).forEach((item) => {
        const lineAsset = assetsById.get(item.assetId)
        if (!lineAsset || purchaseOrderLines.some((line) => line.assetId === item.assetId)) return
        const orderedQuantity = Number(item.orderedQuantity ?? item.quantity) || 1
        const amount = getLineAmount(item)
        purchaseOrderLines.push({
          ...item,
          assetId: item.assetId,
          assetName: item.assetName || lineAsset.name,
          model: lineAsset.model,
          orderedQuantity,
          unitOfMeasure: item.unitOfMeasure || 'asset',
          amount: amount.amount,
          hasAmount: amount.hasAmount,
        })
      })
      linkedAssets.forEach((lineAsset) => {
        if (purchaseOrderLines.some((line) => line.assetId === lineAsset.assetId)) return
        const purchaseOrderReference = getAssetReferences(lineAsset).purchaseOrderReferences.find((item) => item.poNo === poNo)
        purchaseOrderLines.push({
          assetId: lineAsset.assetId,
          assetName: lineAsset.name,
          model: lineAsset.model,
          itemNo: purchaseOrderReference?.itemNo || '',
          orderedQuantity: 1,
          unitOfMeasure: 'asset',
          amount: 0,
          hasAmount: false,
        })
      })

      const receivedByAsset = new Map()
      const legacyReceiptAssets = new Set()
      receiptDocuments.forEach((receipt) => {
        ;(receipt.assetItems || []).forEach((item) => {
          const rawQuantity = item.receivedQuantity ?? item.quantity
          const quantity = Number(rawQuantity)
          if (rawQuantity != null && Number.isFinite(quantity) && quantity > 0) {
            receivedByAsset.set(item.assetId, (receivedByAsset.get(item.assetId) || 0) + quantity)
          } else {
            legacyReceiptAssets.add(item.assetId)
          }
        })
      })
      purchaseOrderLines.forEach((line) => {
        const recordedQuantity = receivedByAsset.get(line.assetId) || 0
        const legacyQuantity = recordedQuantity === 0 && line.orderedQuantity === 1 && legacyReceiptAssets.has(line.assetId) ? 1 : 0
        line.receivedQuantity = Math.min(line.orderedQuantity, recordedQuantity + legacyQuantity)
        line.quantityInferred = legacyQuantity > 0
        line.remainingQuantity = Math.max(0, line.orderedQuantity - line.receivedQuantity)
        line.isComplete = line.remainingQuantity === 0
      })

      const orderedQuantity = purchaseOrderLines.reduce((total, line) => total + line.orderedQuantity, 0)
      const receivedQuantity = purchaseOrderLines.reduce((total, line) => total + line.receivedQuantity, 0)
      const purchaseOrderAmountFromLines = purchaseOrderLines.every((line) => line.hasAmount)
        ? purchaseOrderLines.reduce((total, line) => total + line.amount, 0)
        : null
      const purchaseOrderAmount = po?.referenceTotal != null
        ? Number(po.referenceTotal)
        : purchaseOrderAmountFromLines
      const receiptStatus = receivedQuantity >= orderedQuantity && orderedQuantity > 0
        ? 'Complete'
        : receivedQuantity > 0 ? 'Partial' : 'Not received'
      const invoiceDocuments = [...invoiceMap.values()].sort((first, second) => first.reference.localeCompare(second.reference))
      const invoiceReferences = invoiceDocuments.map((item) => item.reference)
      const goodsReceiptReferences = unique(receiptDocuments.map((item) => item.grNo))
      const receiptDocumentsWithTotals = receiptDocuments.map((receipt) => {
        const quantityRecorded = (receipt.assetItems || []).some((item) => item.receivedQuantity != null || item.quantity != null)
        const receiptQuantity = (receipt.assetItems || []).reduce((total, item) => total + (Number(item.receivedQuantity ?? item.quantity) || 0), 0)
        const receiptValue = (receipt.assetItems || []).reduce((total, item) => {
          const line = purchaseOrderLines.find((candidate) => candidate.assetId === item.assetId)
          if (!line?.hasAmount) return total
          const quantity = Number(item.receivedQuantity ?? item.quantity) || 0
          return total + line.amount / line.orderedQuantity * quantity
        }, 0)
        const hasReceiptValue = quantityRecorded && (receipt.assetItems || []).some((item) => purchaseOrderLines.find((line) => line.assetId === item.assetId)?.hasAmount)
        return { ...receipt, receiptQuantity, quantityRecorded, receiptValue, hasReceiptValue }
      })
      const validation = (asset.receivingValidations || []).find((item) => item.poNo === poNo)
      const hasPurchaseOrder = references.purchaseOrderReferences.some((item) => item.poNo === poNo)
      const hasInvoice = invoiceDocuments.length > 0
      const assetReceiptDocuments = receiptDocuments.filter((receipt) => receipt.assetItems?.some((item) => item.assetId === asset.assetId))
      const hasGoodsReceipt = assetReceiptDocuments.length > 0
      const assetLine = purchaseOrderLines.find((line) => line.assetId === asset.assetId)
      const proposalNumbers = unique([po?.proposalId, ...references.proposalReferences.map((item) => item.reference)])
      const linkedProposals = proposals.filter((proposal) => proposalNumbers.includes(proposal.proposalId))
      const approvedItems = linkedProposals.filter((proposal) => proposal.status === 'Approved').flatMap((proposal) => (proposal.assetItems || []).filter((item) => item.assetId === asset.assetId))
      const approvedProposalAmount = approvedItems.length ? approvedItems.reduce((total, item) => total + getProposalItemTotal(item), 0) : null
      const assetPOAmount = assetLine?.hasAmount ? assetLine.amount : null
      const assetGRAmount = assetPOAmount != null && assetLine.orderedQuantity > 0 ? assetPOAmount * assetLine.receivedQuantity / assetLine.orderedQuantity : null
      const approvedItem = approvedItems.length === 1 ? approvedItems[0] : null
      const approvedProposal = linkedProposals.find((proposal) => proposal.status === 'Approved' && proposal.assetItems?.some((item) => item.assetId === asset.assetId))
      const poItem = po?.assetItems?.find((item) => item.assetId === asset.assetId)
      const grItems = assetReceiptDocuments.flatMap((receipt) => (receipt.assetItems || []).filter((item) => item.assetId === asset.assetId))
      const documentCell = (record, key, fallback, reference = 'Asset record') => record?.[key] ? { value: record[key] } : { value: record ? fallback : null, reference }
      const grCell = (key, fallback, reference = 'Asset record') => {
        const values = unique(grItems.map((item) => item[key]))
        return values.length ? { value: values.join(', ') } : { value: grItems.length ? fallback : null, reference }
      }
      const comparison = [
        { label: 'Asset Name', cells: [documentCell(approvedItem, 'assetName', asset.name), documentCell(poItem, 'assetName', asset.name), grCell('assetName', asset.name)] },
        { label: 'Model', cells: [documentCell(approvedItem, 'model', asset.model), documentCell(poItem, 'model', asset.model), grCell('model', asset.model)] },
        { label: 'Quantity', cells: [{ value: approvedItem ? Number(approvedItem.quantity ?? approvedItem.orderedQuantity ?? 1) : null }, { value: assetLine?.orderedQuantity ?? null }, { value: hasGoodsReceipt ? assetLine?.receivedQuantity ?? null : null }] },
        { label: 'Unit Price', money: true, cells: [{ value: approvedItem ? getProposalItemTotal(approvedItem) / (Number(approvedItem.quantity ?? approvedItem.orderedQuantity) || 1) : null }, { value: assetPOAmount != null ? assetPOAmount / assetLine.orderedQuantity : null }, { value: hasGoodsReceipt && assetPOAmount != null ? assetPOAmount / assetLine.orderedQuantity : null, reference: 'PO item rate' }] },
        { label: 'Total Amount', money: true, cells: [{ value: approvedProposalAmount }, { value: assetPOAmount }, { value: hasGoodsReceipt ? assetGRAmount : null, reference: 'Received Qty × PO rate' }] },
        { label: 'Vendor', cells: [{ value: approvedItem?.vendor || approvedProposal?.vendor || null }, { value: po?.vendor || null }, grCell('vendor', po?.vendor, 'PO reference')] },
      ]
      const matchSummary = {
        comparison,
        proposalNumbers,
        proposalStatus: linkedProposals.length ? unique(linkedProposals.map((proposal) => proposal.status)).join(', ') : 'Not recorded',
        vendor: po?.vendor || asset.vendor || 'Not recorded',
        approvedProposalAmount,
        poAmount: assetPOAmount,
        grAmount: assetGRAmount,
        variance: assetPOAmount != null && assetGRAmount != null ? assetPOAmount - assetGRAmount : null,
        orderedQuantity: assetLine?.orderedQuantity ?? null,
        receivedQuantity: assetLine?.receivedQuantity ?? null,
      }
      const assetLineComplete = assetLine ? assetLine.isComplete : hasGoodsReceipt
      const goodsChecked = assetReceiptDocuments.some((item) => item.goodsChecked === true)
        || (['Ready for Verification', 'Verification In Progress'].includes(asset.status) && hasGoodsReceipt)
      const previouslyCompleted = validation?.status === 'Complete'
        && validation.stage === 'Asset Team Verification'
        && assetLineComplete
      const canComplete = hasPurchaseOrder && hasInvoice && hasGoodsReceipt && goodsChecked && assetLineComplete

      let status = 'Waiting Invoice'
      if (previouslyCompleted) status = 'Validation Complete'
      else if (hasGoodsReceipt && !canComplete) status = 'Hold / Correction Required'
      else if (canComplete) status = 'Ready to Validate'
      else if (hasInvoice) status = 'Waiting GR'

      const issues = []
      if (!hasPurchaseOrder) issues.push('PO reference is missing.')
      if (!hasInvoice) issues.push('No Invoice reference is linked to this PO.')
      if (!hasGoodsReceipt) issues.push('No GR reference is linked to this Asset item.')
      if (hasGoodsReceipt && !goodsChecked && !previouslyCompleted) issues.push('Physical goods check is not recorded.')
      if (assetLine && !assetLineComplete) issues.push(`${formatQuantity(assetLine.receivedQuantity)} of ${formatQuantity(assetLine.orderedQuantity)} ${assetLine.unitOfMeasure} received for this PO item.`)

      return {
        key: `${asset.assetId}:${poNo}`,
        matchSummary,
        assetId: asset.assetId,
        asset,
        poNo,
        itemNumbers: unique(references.purchaseOrderReferences.filter((item) => item.poNo === poNo).map((item) => item.itemNo)).join(', '),
        invoiceReferences,
        invoiceDocuments,
        invoiceCatalog: vendorInvoices,
        goodsReceiptReferences,
        receiptDocuments: receiptDocumentsWithTotals,
        hasPurchaseOrder,
        hasInvoice,
        hasGoodsReceipt,
        goodsChecked,
        purchaseOrderLines,
        purchaseOrderAmount,
        orderedQuantity,
        receivedQuantity,
        receiptStatus,
        canComplete: canComplete && !previouslyCompleted,
        status,
        issues,
        validation,
        purchaseOrder: po,
      }
    })
  })
}

function ReferenceList({ values, emptyText }) {
  return values.length ? <div className="mis-validation-references">{values.map((value) => <span key={value}>{value}</span>)}</div> : <span className="mis-validation-empty-ref">{emptyText}</span>
}

export default function AssetValidationPage({ activationWorkflow, activationWorkflowError, assets, proposals = [], vendorInvoices = [], purchaseOrders, goodsReceipts, onComplete, onCreateGR, onAssets, onSaveDraft }) {
  const [filter, setFilter] = useState('All')
  const [query, setQuery] = useState('')
  const [pagination, setPagination] = useState({ page: 1, size: 8, context: '' })
  const rows = useMemo(() => buildValidationRows(assets, purchaseOrders, goodsReceipts, proposals, vendorInvoices), [assets, purchaseOrders, goodsReceipts, proposals, vendorInvoices])
  const pendingCount = rows.filter((row) => row.status === 'Ready to Validate').length
  const readyCount = assets.filter(isPendingActivation).length
  const attentionCount = rows.filter((row) => row.status === 'Waiting Invoice' || row.status === 'Waiting GR' || row.status === 'Hold / Correction Required').length
  const filteredRows = rows.filter((row) => {
    const matchesFilter = filter === 'All'
      || (filter === 'Ready to submit' && row.status === 'Ready to Validate')
      || (filter === 'Waiting / hold' && WAITING_OR_HOLD_STATUSES.has(row.status))
      || (filter === 'Returned for correction' && row.asset.status === 'Returned for Correction')
    const searchable = `${row.asset.assetId} ${row.asset.name} ${row.poNo} ${row.invoiceReferences.join(' ')} ${row.goodsReceiptReferences.join(' ')}`.toLowerCase()
    return matchesFilter && searchable.includes(query.trim().toLowerCase())
  })
  const context = JSON.stringify([filter, query])
  const pageCount = Math.max(1, Math.ceil(filteredRows.length / pagination.size))
  const page = pagination.context === context ? Math.min(pagination.page, pageCount) : 1
  const start = (page - 1) * pagination.size
  const pageRows = filteredRows.slice(start, start + pagination.size)
  const pages = Array.from({ length: pageCount }, (_, index) => index + 1).filter((number) => number === 1 || number === pageCount || Math.abs(number - page) <= 1)
  const filterCounts = {
    All: rows.length,
    'Ready to submit': pendingCount,
    'Waiting / hold': rows.filter((row) => WAITING_OR_HOLD_STATUSES.has(row.status)).length,
    'Returned for correction': rows.filter((row) => row.asset.status === 'Returned for Correction').length,
  }
  const metrics = [
    { label: 'All validation records', count: rows.length, icon: 'box', tone: 'red', hint: 'Assets and linked PO references', filter: 'All' },
    { label: 'Ready to submit', count: pendingCount, icon: 'check', tone: 'green', hint: 'Asset verification ready for approval', filter: 'Ready to submit' },
    { label: 'In Asset Approval', count: readyCount, icon: 'file', tone: 'slate', hint: 'Waiting for assigned approvers' },
    { label: 'Waiting or on hold', count: attentionCount, icon: 'clock', tone: 'amber', hint: 'Receiving references need attention', filter: 'Waiting / hold' },
  ]
  const [selectedKey, setSelectedKey] = useState('')
  const selectedRow = rows.find((row) => row.key === selectedKey) || null

  useEffect(() => {
    if (!selectedRow) return undefined
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    function closeOnEscape(event) {
      if (event.key === 'Escape') setSelectedKey('')
    }
    window.addEventListener('keydown', closeOnEscape)
    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', closeOnEscape)
    }
  }, [selectedRow])

  function completeSelectedValidation(row) {
    if (onComplete(row) === false) return
    setSelectedKey('')
  }

  return (
    <>
      <div className="asset-list-workspace asset-validation-workspace">
      <PageHeading eyebrow="Asset management" title="Asset Validation" description="Verify the received Asset and its references, then submit it to the assigned approval workflow." action={<button type="button" className="button button-primary" onClick={onCreateGR}><Icon name="file" size={16} />Create GR in MIS</button>} />

      <div className="asset-list-metrics" aria-label="Asset validation summary">
        {metrics.map((metric) => {
          const Tag = metric.filter ? 'button' : 'div'
          return <Tag key={metric.label} className={`asset-list-metric metric-tone-${metric.tone}`} {...(metric.filter ? { type: 'button', onClick: () => setFilter(metric.filter), 'aria-pressed': filter === metric.filter } : {})}>
            <span className="list-metric-icon"><Icon name={metric.icon} size={25} /></span>
            <span className="list-metric-copy"><span>{metric.label}</span><strong>{metric.count.toLocaleString()}</strong><small>{metric.hint}</small></span>
            <span className="list-metric-progress" aria-hidden="true"><span style={{ width: `${rows.length + readyCount ? metric.count / (rows.length + readyCount) * 100 : 0}%` }} /></span>
          </Tag>
        })}
      </div>

      <section className="panel asset-list-panel asset-validation-list-panel">
        <div className="list-toolbar">
          <div className="asset-status-tabs" role="group" aria-label="Filter Asset Validation queue">
            {Object.entries(filterCounts).map(([option, count]) => <button type="button" key={option} className={filter === option ? 'asset-tab-active' : ''} aria-pressed={filter === option} onClick={() => setFilter(option)}>{option} <span>({count.toLocaleString()})</span></button>)}
          </div>
          <div className="toolbar-actions">
            <label className="table-search"><Icon name="search" size={17} /><input aria-label="Search Asset Validation queue" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search Asset, PO, Invoice or GR" />{query ? <button type="button" aria-label="Clear search" onClick={() => setQuery('')}><Icon name="close" size={14} /></button> : null}</label>
            {query || filter !== 'All' ? <button type="button" className="list-reset-filter" onClick={() => { setQuery(''); setFilter('All') }}><Icon name="close" size={14} />Reset</button> : null}
          </div>
        </div>
        {filteredRows.length ? (
          <div className="table-scroll">
            <table className="asset-table mis-validation-table">
              <thead><tr><th>Asset</th><th>Purchase Order / item</th><th>Invoice references</th><th>Goods Receipts</th><th>Validation status</th><th>Actions</th></tr></thead>
              <tbody>{pageRows.map((row, index) => (
                <tr key={row.key} className={selectedRow?.key === row.key ? 'mis-validation-row-selected' : ''}>
                  <td><div className="asset-cell"><span className={`asset-avatar asset-avatar-${index % 5}`}><Icon name="box" size={17} /></span><span><strong>{row.asset.name}</strong><small>{row.asset.assetId} <span className="asset-cell-separator">/</span> {row.asset.model || 'Model not set'}</small></span></div></td>
                  <td><div className="mis-validation-ref-primary"><strong>{row.poNo}</strong><small>{row.itemNumbers ? `Item ${row.itemNumbers}` : 'PO item reference'}</small></div></td>
                  <td><ReferenceList values={row.invoiceReferences} emptyText="Not recorded" /></td>
                  <td><ReferenceList values={row.goodsReceiptReferences} emptyText="Not recorded" /></td>
                  <td><StatusBadge status={row.status} /></td>
                  <td><button type="button" className="asset-row-detail-action" aria-label={`View validation for ${row.asset.name}, ${row.poNo}`} title={row.status === 'Ready to Validate' ? 'Review validation' : 'View validation'} aria-haspopup="dialog" onClick={() => setSelectedKey(row.key)}><Icon name="more" size={19} /></button></td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        ) : (
          <div className="mis-transaction-empty mis-validation-empty-state"><span className="empty-table-icon"><Icon name="box" size={20} /></span><strong>No Asset validation records found</strong><p>Assets with PO references will appear here. Create a GR in MIS after delivery to start validation.</p><button type="button" className="button button-secondary button-small" onClick={onAssets}>Open Asset list</button></div>
        )}
        <div className="table-footer">
          <span>Showing <strong>{filteredRows.length ? start + 1 : 0}–{Math.min(start + pagination.size, filteredRows.length)}</strong> of <strong>{filteredRows.length}</strong> records</span>
          <nav className="asset-pagination" aria-label="Asset validation pages">
            <button type="button" disabled={page === 1} aria-label="Previous page" onClick={() => setPagination({ ...pagination, page: page - 1, context })}><Icon name="chevron" size={15} className="previous-chevron" /></button>
            {pages.map((number, index) => <span key={number}>{index > 0 && number - pages[index - 1] > 1 ? <span className="pagination-gap">…</span> : null}<button type="button" className={number === page ? 'page-current' : ''} aria-current={number === page ? 'page' : undefined} aria-label={`Page ${number}`} onClick={() => setPagination({ ...pagination, page: number, context })}>{number}</button></span>)}
            <button type="button" disabled={page === pageCount} aria-label="Next page" onClick={() => setPagination({ ...pagination, page: page + 1, context })}><Icon name="chevron" size={15} /></button>
          </nav>
          <label className="asset-page-size">Show<select aria-label="Validation records per page" value={pagination.size} onChange={(event) => setPagination({ page: 1, size: Number(event.target.value), context })}>{[8, 16, 32].map((size) => <option key={size}>{size}</option>)}</select>per page</label>
        </div>
      </section>
      <div className="dashboard-footnote"><span className="footnote-dot" />PO, Invoice, and GR references are stored with each Asset.</div>
      </div>

      {selectedRow ? <div className="asset-validation-modal-mask" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setSelectedKey('') }}>
        <section className="asset-validation-modal" role="dialog" aria-modal="true" aria-labelledby="asset-validation-detail-title" onKeyDown={(event) => {
          if (event.key !== 'Tab') return
          const controls = [...event.currentTarget.querySelectorAll('button:not(:disabled), input:not(:disabled), select:not(:disabled), textarea:not(:disabled), summary, [tabindex="0"]')].filter((element) => element.getClientRects().length)
          const first = controls[0]
          const last = controls[controls.length - 1]
          if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus() }
          else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus() }
        }}>
          <AssetValidationWizard activationWorkflow={activationWorkflow} activationWorkflowError={activationWorkflowError} key={selectedRow.key} row={selectedRow} onComplete={completeSelectedValidation} onSaveDraft={onSaveDraft} onClose={() => setSelectedKey('')} receivingDetails={<AssetReceivingDocuments row={selectedRow} relatedRows={rows.filter((row) => row.assetId === selectedRow.assetId)} />} />
        </section>
      </div> : null}
    </>
  )
}
