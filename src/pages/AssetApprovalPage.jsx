import { isCustomerAsset, getAssetOwnerLabel } from '../utils/assetOwnershipUtils.js'
import { useCallback, useEffect, useMemo, useState } from 'react'
import Icon from '../components/Icon.jsx'
import { AssetControlSheet } from '../components/AssetControlSheet.jsx'
import StatusBadge from '../components/StatusBadge.jsx'
import { ListMetric, PageHeading } from '../components/common.jsx'
import { getAssetReferences } from '../utils/misReferenceUtils.js'

const APPROVAL_STAGES = [
  { id: 'asset-leader', label: 'Asset Team Leader', status: 'Pending Asset Team Leader Approval' },
  { id: 'accounting-review', label: 'Accounting Review', status: 'Pending Accounting Review' },
  { id: 'accounting-final', label: 'Accounting Final Approval', status: 'Pending Accounting Approval' },
]

function formatAmount(value) {
  return `฿ ${new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(Number(value) || 0)}`
}

function formatDate(value) {
  if (!value) return '—'
  const date = new Date(`${value.slice(0, 10)}T00:00:00`)
  return Number.isNaN(date.getTime()) ? value : new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).format(date)
}

function stageLabel(stageId) {
  return APPROVAL_STAGES.find((stage) => stage.id === stageId)?.label || 'Asset approval'
}

function movementLocation(values) {
  return [values?.plant, values?.location, values?.line].filter(Boolean).join(' · ') || '—'
}

function ApprovalDetail({ asset, stageId, purchaseOrders, onClose, onApprove, onReturn }) {
  const [depreciationStartDate, setDepreciationStartDate] = useState(asset.depreciationStartDate || '')
  const [comment, setComment] = useState('')
  const [error, setError] = useState('')
  const controlSheet = asset.assetControlSheet
  const [detailTab, setDetailTab] = useState(controlSheet && stageId === 'asset-leader' ? 'control-sheet' : 'details')
  const references = getAssetReferences(asset)
  const purchaseOrderReferences = references.purchaseOrderReferences
  const invoiceReferences = references.invoiceReferences
  const goodsReceiptReferences = references.goodsReceiptReferences
  const amount = purchaseOrderReferences.reduce((total, reference) => {
    const purchaseOrder = purchaseOrders.find((item) => item.poNo === reference.poNo)
    return total + (Number(purchaseOrder?.referenceTotal) || 0)
  }, 0)
  const hasPurchaseOrderAmount = purchaseOrderReferences.some((reference) => purchaseOrders.some((item) => item.poNo === reference.poNo && item.referenceTotal != null))
  const history = Array.isArray(asset.approvalHistory) ? asset.approvalHistory : []
  const customerAsset = isCustomerAsset(asset)
  const canSetDepreciationDate = !customerAsset && stageId === 'accounting-review'

  useEffect(() => {
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    function closeOnEscape(event) {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', closeOnEscape)
    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', closeOnEscape)
    }
  }, [onClose])

  function approve() {
    if (canSetDepreciationDate && !depreciationStartDate) {
      setError('Set the Depreciation Start Date before submitting the accounting review.')
      return
    }
    if (!customerAsset && stageId === 'accounting-final' && !asset.depreciationStartDate) {
      setError('Complete the Accounting Review and set the Depreciation Start Date before final approval.')
      return
    }
    setError('')
    onApprove({ assetId: asset.assetId, stageId, depreciationStartDate, comment: comment.trim() })
  }

  function returnForCorrection() {
    if (!comment.trim()) {
      setError('Add a remark explaining what needs to be corrected.')
      return
    }
    setError('')
    onReturn({ assetId: asset.assetId, stageId, comment: comment.trim() })
  }

  return (
    <div className="detail-mask asset-record-mask asset-approval-modal-mask" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose() }}>
      <section className="detail-dialog asset-detail-dialog asset-approval-modal" role="dialog" aria-modal="true" aria-labelledby="asset-approval-title">
        <div className="asset-approval-modal-body">
          <header className="detail-header">
            <div className="asset-record-heading">
              <span className="asset-record-symbol"><Icon name={asset.assetClass?.startsWith('IT') ? 'file' : 'factory'} size={36} /></span>
              <div className="asset-record-heading-copy">
                <span className="detail-eyebrow">Approval · {stageLabel(stageId)}</span>
                <div className="asset-record-title-row"><h2 id="asset-approval-title">{asset.name}</h2><StatusBadge status={asset.status} /></div>
                <span className="detail-id">{asset.assetId} · {asset.assetClass || 'Unclassified'}</span><span className="detail-id asset-approval-ownership">{getAssetOwnerLabel(asset)}</span>
              </div>
            </div>
            <button type="button" className="modal-close" aria-label="Close approval details" onClick={onClose}><Icon name="close" size={17} /></button>
          </header>

          <div className="asset-approval-tabs" role="tablist" aria-label="Approval review content">
            <button type="button" id="approval-details-tab" role="tab" aria-selected={detailTab === 'details'} aria-controls="approval-details-panel" onClick={() => setDetailTab('details')}><Icon name="box" size={17} />Review details</button>
            <button type="button" id="approval-control-sheet-tab" role="tab" aria-selected={detailTab === 'control-sheet'} aria-controls="approval-control-sheet-panel" onClick={() => setDetailTab('control-sheet')}><Icon name="file" size={17} />Asset Control Sheet{controlSheet ? <span>2 pages</span> : null}</button>
          </div>
          <div id="approval-details-panel" role="tabpanel" aria-labelledby="approval-details-tab" hidden={detailTab !== 'details'}>
          <div className="asset-approval-detail-grid">
            <section className="asset-approval-info-card">
              <div className="asset-approval-section-heading"><div><h3>Asset information</h3><p>Reviewed Asset record</p></div></div>
              <dl className="asset-approval-data-grid">
                <div><dt>Asset name</dt><dd>{asset.name}</dd></div>
                <div><dt>Asset No.</dt><dd>{asset.assetId}</dd></div>
                <div><dt>Asset class</dt><dd>{asset.assetClass || '—'}</dd></div>
                <div><dt>Model</dt><dd>{asset.model || '—'}</dd></div>
                <div><dt>Custodian</dt><dd>{asset.custodian || '—'}</dd></div>
                <div><dt>Plant / Location</dt><dd>{[asset.plant, asset.location].filter(Boolean).join(' · ') || '—'}</dd></div>
                <div><dt>Line / Area</dt><dd>{[asset.line, asset.area].filter(Boolean).join(' · ') || '—'}</dd></div>
                <div><dt>Target SOP</dt><dd>{formatDate(asset.targetSop)}</dd></div>
              </dl>
            </section>

            <section className="asset-approval-info-card">
              <div className="asset-approval-section-heading"><div><h3>Acquisition references</h3><p>Related MIS documents</p></div></div>
              <div className="asset-approval-reference-list">
                <div><span>Purchase Orders</span><strong>{purchaseOrderReferences.map((item) => item.poNo).filter(Boolean).join(', ') || 'Not linked'}</strong></div>
                <div><span>PO amount</span><strong>{hasPurchaseOrderAmount ? formatAmount(amount) : 'Not recorded'}{hasPurchaseOrderAmount ? <small>Reference only</small> : null}</strong></div>
                <div><span>Invoices</span><strong>{invoiceReferences.map((item) => item.reference).filter(Boolean).join(', ') || 'Not linked'}</strong></div>
                <div><span>Goods Receipts</span><strong>{goodsReceiptReferences.map((item) => item.reference).filter(Boolean).join(', ') || 'Not linked'}</strong></div>
              </div>
            </section>

            {customerAsset && stageId !== 'asset-leader' ? <section className="asset-approval-info-card asset-approval-accounting-card"><div className="asset-approval-section-heading"><div><h3>Customer Asset accounting review</h3><p>{getAssetOwnerLabel(asset)}</p></div></div><p>No depreciation applies. Complete the accounting approval to activate this Customer Asset.</p></section> : canSetDepreciationDate ? <section className="asset-approval-info-card asset-approval-accounting-card">
              <div className="asset-approval-section-heading"><div><h3>Accounting review</h3><p>Set when depreciation begins for this Asset.</p></div></div>
              <label className="form-field asset-approval-date-field"><span>Depreciation Start Date <em>*</em></span><input type="date" value={depreciationStartDate} onChange={(event) => setDepreciationStartDate(event.target.value)} required /></label>
              {asset.targetSop ? <p className="asset-approval-field-hint">Target SOP: {formatDate(asset.targetSop)} · Accounting confirms the actual depreciation date.</p> : null}
            </section> : stageId === 'accounting-final' ? <section className="asset-approval-info-card asset-approval-accounting-card">
              <div className="asset-approval-section-heading"><div><h3>Accounting review complete</h3><p>Confirm the accounting details before activation.</p></div></div>
              <div className="asset-approval-depreciation-value"><span>Depreciation Start Date</span><strong>{formatDate(asset.depreciationStartDate)}</strong></div>
            </section> : <section className="asset-approval-info-card asset-approval-accounting-card">
              <div className="asset-approval-section-heading"><div><h3>Asset Team Verification</h3><p>Review was submitted by the Asset Team.</p></div></div>
              {controlSheet?.form ? <dl className="asset-approval-data-grid"><div><dt>Verification result</dt><dd>{controlSheet.form.result || '—'}</dd></div><div><dt>Confirmed / Estimated SOP</dt><dd>{formatDate(controlSheet.form.confirmedSop)}</dd></div><div><dt>Remark</dt><dd>{controlSheet.form.remark || '—'}</dd></div></dl> : asset.verificationRemark ? <p className="asset-approval-verification-remark">{asset.verificationRemark}</p> : <p className="asset-approval-field-hint">Asset details and receiving references are available above for review.</p>}
            </section>}

            <section className="asset-approval-info-card asset-approval-history-card">
              <div className="asset-approval-section-heading"><div><h3>Approval history</h3><p>Actions and remarks</p></div></div>
              {history.length ? <ol className="asset-approval-history">{[...history].reverse().map((event, index) => <li key={`${event.stage}-${event.date}-${index}`}>
                <span className={`asset-approval-history-mark ${event.action?.includes('Return') ? 'asset-approval-history-return' : ''}`}><Icon name={event.action?.includes('Return') ? 'alert' : 'check'} size={13} /></span>
                <div><strong>{event.action}</strong><small>{event.stage}{event.actor ? ` · ${event.actor}` : ''}{event.date ? ` · ${new Date(event.date).toLocaleString()}` : ''}</small>{event.comment ? <p>{event.comment}</p> : null}</div>
              </li>)}</ol> : <p className="asset-approval-history-empty">No approval actions recorded yet.</p>}
            </section>
          </div>

          </div>
          <div id="approval-control-sheet-panel" role="tabpanel" aria-labelledby="approval-control-sheet-tab" hidden={detailTab !== 'control-sheet'}>
            {controlSheet ? <section className="asset-approval-control-sheet"><div className="asset-approval-section-heading"><div><h3>ASSET CONTROL SHEET</h3><p>Submitted by Asset Team{controlSheet.reviewedAt ? ` · ${new Date(controlSheet.reviewedAt).toLocaleString('en-GB', { timeZone: 'Asia/Bangkok' })}` : ''}</p></div><StatusBadge status="Complete" /></div><AssetControlSheet row={{ asset: controlSheet.documentAsset || asset, poNo: controlSheet.purchaseOrder?.poNo || asset.poNo, purchaseOrder: controlSheet.purchaseOrder || purchaseOrders.find((po) => po.poNo === asset.poNo) }} form={controlSheet.form || {}} photos={controlSheet.photos || {}} specialNA={controlSheet.specialNA || false} /></section> : <div className="asset-approval-sheet-empty"><Icon name="file" size={32} /><strong>No Asset Control Sheet was submitted</strong><p>This record was verified without a saved control sheet. Review the Asset information and acquisition references in Review details.</p></div>}
          </div>

          <label className="form-field asset-approval-comment-field"><span>{stageId === 'asset-leader' ? 'Approval remark' : 'Accounting remark'} <small>Optional for approval; required when returning for correction.</small></span><textarea value={comment} onChange={(event) => setComment(event.target.value)} rows="2" maxLength={300} placeholder="Add a decision remark or correction reason" /></label>
        </div>
        {error ? <div className="form-error asset-approval-error" role="alert"><Icon name="alert" size={16} />{error}</div> : null}
        <footer className="detail-footer asset-approval-actions">
          <button type="button" className="button button-danger-quiet" onClick={returnForCorrection}><Icon name="alert" size={15} />Return for Correction</button>
          <button type="button" className="button button-primary" onClick={approve}><Icon name="check" size={15} />{stageId === 'asset-leader' ? 'Approve & Send to Accounting' : stageId === 'accounting-review' ? 'Save Review & Continue' : 'Approve & Activate Asset'}</button>
        </footer>
      </section>
    </div>
  )
}

export default function AssetApprovalPage({ initialTab = 'asset', assets, purchaseOrders, lifecycleEvents, onApprove, onReturn, onAssetValidation, onAdvanceTransfer }) {
  const [activeTab, setActiveTab] = useState(initialTab)
  const [assetQuery, setAssetQuery] = useState('')
  const [movementQuery, setMovementQuery] = useState('')
  const [selectedAssetId, setSelectedAssetId] = useState('')
  const counts = useMemo(() => Object.fromEntries(APPROVAL_STAGES.map((stage) => [stage.id, assets.filter((asset) => asset.status === stage.status).length])), [assets])
  const pendingAssetCount = Object.values(counts).reduce((total, count) => total + count, 0)
  const returnedCount = assets.filter((asset) => asset.status === 'Returned for Correction').length
  const approvalStageOrder = new Map(APPROVAL_STAGES.map((stage, index) => [stage.status, index]))
  const filteredAssets = assets.filter((asset) => {
    if (!approvalStageOrder.has(asset.status)) return false
    const searchable = `${asset.assetId} ${asset.name} ${asset.model} ${asset.custodian} ${asset.poNo}`.toLowerCase()
    return searchable.includes(assetQuery.trim().toLowerCase())
  }).sort((first, second) => approvalStageOrder.get(first.status) - approvalStageOrder.get(second.status))
  const filteredTransfers = lifecycleEvents.filter((event) => {
    if (event.type !== 'transfer' || event.status !== 'Pending Approval') return false
    const step = event.approvalSteps?.[Number(event.currentApprovalStep) || 0] || ''
    const searchable = `${event.transactionNo} ${event.assetId} ${event.assetName} ${event.from?.plant} ${event.from?.location} ${event.from?.line} ${event.to?.plant} ${event.to?.location} ${event.to?.line} ${step}`.toLowerCase()
    return searchable.includes(movementQuery.trim().toLowerCase())
  })
  const pendingTransferCount = lifecycleEvents.filter((event) => event.type === 'transfer' && event.status === 'Pending Approval').length
  const selectedAsset = assets.find((asset) => asset.assetId === selectedAssetId) || null
  const selectedStageId = APPROVAL_STAGES.find((stage) => stage.status === selectedAsset?.status)?.id || ''

  const closeDetail = useCallback(() => {
    setSelectedAssetId('')
  }, [])

  const approveAsset = useCallback((payload) => {
    onApprove(payload)
    closeDetail()
  }, [closeDetail, onApprove])

  const returnAsset = useCallback((payload) => {
    onReturn(payload)
    closeDetail()
  }, [closeDetail, onReturn])

  function handleApprovalTabKeyDown(event, currentTab) {
    let nextTab = ''
    if (event.key === 'ArrowRight') nextTab = currentTab === 'asset' ? 'movement' : 'asset'
    else if (event.key === 'ArrowLeft') nextTab = currentTab === 'asset' ? 'movement' : 'asset'
    else if (event.key === 'Home') nextTab = 'asset'
    else if (event.key === 'End') nextTab = 'movement'
    if (!nextTab) return
    event.preventDefault()
    setActiveTab(nextTab)
    document.getElementById(nextTab === 'asset' ? 'asset-approval-tab-assets' : 'asset-approval-tab-movement')?.focus()
  }

  return (
    <div className="asset-list-workspace approval-list-workspace">
      <PageHeading eyebrow="Asset management" title="Approval" description="Choose an approval queue to review Assets or Movement transfers." />

      <div className="asset-approval-tabs" role="tablist" aria-label="Approval queue type">
        <button type="button" role="tab" id="asset-approval-tab-assets" aria-controls="asset-approval-panel-assets" aria-selected={activeTab === 'asset'} tabIndex={activeTab === 'asset' ? 0 : -1} className={activeTab === 'asset' ? 'is-active' : ''} onClick={() => setActiveTab('asset')} onKeyDown={(event) => handleApprovalTabKeyDown(event, 'asset')}>Asset approvals<span>{pendingAssetCount}</span></button>
        <button type="button" role="tab" id="asset-approval-tab-movement" aria-controls="asset-approval-panel-movement" aria-selected={activeTab === 'movement'} tabIndex={activeTab === 'movement' ? 0 : -1} className={activeTab === 'movement' ? 'is-active' : ''} onClick={() => setActiveTab('movement')} onKeyDown={(event) => handleApprovalTabKeyDown(event, 'movement')}>Movement approvals<span>{pendingTransferCount}</span></button>
      </div>

      <section id="asset-approval-panel-assets" className="asset-approval-tab-panel" role="tabpanel" aria-labelledby="asset-approval-tab-assets" hidden={activeTab !== 'asset'}>
        <div className="asset-list-metrics" aria-label="Asset approval summary">
          <ListMetric label="Asset Team Leader" count={counts['asset-leader']} hint="Waiting for team approval" icon="user" tone="red" total={pendingAssetCount} />
          <ListMetric label="Accounting review" count={counts['accounting-review']} hint="Review before final approval" icon="calendar" tone="amber" total={pendingAssetCount} />
          <ListMetric label="Final approval" count={counts['accounting-final']} hint="Ready for activation decision" icon="check" tone="green" total={pendingAssetCount} />
          <ListMetric label="Returned for correction" count={returnedCount} hint="Sent back to Asset Validation" icon="file" tone="slate" total={pendingAssetCount + returnedCount} />
        </div>

        <section className="panel asset-list-panel asset-approval-queue-panel">
          <div className="list-toolbar asset-approval-queue-heading"><div><h2>Asset approval queue</h2><p>Items are grouped by their current approval step.</p></div>
            <label className="table-search"><Icon name="search" size={15} /><input aria-label="Search Asset approvals" value={assetQuery} onChange={(event) => setAssetQuery(event.target.value)} placeholder="Search Asset, model, custodian or PO" />{assetQuery ? <button type="button" aria-label="Clear Asset search" onClick={() => setAssetQuery('')}><Icon name="close" size={14} /></button> : null}</label>
          </div>
          {filteredAssets.length ? <div className="table-scroll">
            <table className="asset-table asset-approval-table">
              <thead><tr><th>Asset</th><th>Asset details</th><th>Custodian / Site</th><th>PO references</th><th>Target SOP / Depreciation</th><th>Current approval step</th><th><span className="sr-only">Action</span></th></tr></thead>
              <tbody>{filteredAssets.map((asset, index) => {
                const references = getAssetReferences(asset)
                const purchaseOrdersForAsset = references.purchaseOrderReferences.map((reference) => reference.poNo).filter(Boolean)
                const stage = APPROVAL_STAGES.find((item) => item.status === asset.status)
                return <tr key={asset.assetId}>
                  <td><div className="asset-cell"><span className={`asset-avatar asset-avatar-${index % 5}`}><Icon name={asset.assetClass?.startsWith('IT') ? 'file' : 'factory'} size={17} /></span><span><strong>{asset.name}</strong><small>{asset.assetId}</small></span></div></td>
                  <td>{asset.assetClass || '—'}<small>{asset.model || 'Model not recorded'}</small></td>
                  <td>{asset.custodian || '—'}<small>{[asset.plant, asset.location].filter(Boolean).join(' · ') || 'Site not recorded'}</small></td>
                  <td><div className="asset-approval-po-list">{purchaseOrdersForAsset.length ? purchaseOrdersForAsset.map((poNo) => <span key={poNo}>{poNo}</span>) : '—'}</div></td>
                  <td>{formatDate(asset.targetSop)}<small>{!isCustomerAsset(asset) && asset.depreciationStartDate ? `Depreciation ${formatDate(asset.depreciationStartDate)}` : isCustomerAsset(asset) ? 'Customer Asset · No DP' : 'Depreciation date not set'}</small></td>
                  <td><div className="asset-approval-stage-cell"><strong>{stage?.label}</strong><StatusBadge status={asset.status} /></div></td>
                  <td><button type="button" className="asset-approval-review-button" aria-haspopup="dialog" onClick={() => setSelectedAssetId(asset.assetId)}>Review<Icon name="chevron" size={13} /></button></td>
                </tr>
              })}</tbody>
            </table>
          </div> : <div className="asset-approval-empty">
            <span className="asset-approval-empty-icon"><Icon name="check" size={19} /></span>
            <strong>{assetQuery.trim() ? 'No Assets match your search' : 'No Assets awaiting approval'}</strong>
            <p>{assetQuery.trim() ? 'Try another Asset name, model, custodian or PO reference.' : 'Assets appear here after Asset Validation is submitted. Each approval advances the Asset to its next step in this same queue.'}</p>
            {!assetQuery.trim() ? <button type="button" className="button button-secondary button-small" onClick={onAssetValidation}>Open Asset Validation</button> : null}
          </div>}
          <div className="table-footer"><span>{filteredAssets.length} Asset(s) in the approval queue</span><span>Approval decisions are saved in this browser.</span></div>
        </section>
      </section>

      <section id="asset-approval-panel-movement" className="asset-approval-tab-panel" role="tabpanel" aria-labelledby="asset-approval-tab-movement" hidden={activeTab !== 'movement'}>
        <section className="panel asset-list-panel asset-approval-queue-panel asset-transfer-approval-queue">
          <div className="list-toolbar asset-approval-queue-heading">
            <div><h2>Movement approval queue</h2><p>Approve each transfer in order: Requester Manager, Destination Department Leader, then Asset Team acknowledgement.</p></div>
            <label className="table-search"><Icon name="search" size={15} /><input aria-label="Search Movement approvals" value={movementQuery} onChange={(event) => setMovementQuery(event.target.value)} placeholder="Search asset, request, location or approver" />{movementQuery ? <button type="button" aria-label="Clear Movement search" onClick={() => setMovementQuery('')}><Icon name="close" size={14} /></button> : null}</label>
          </div>
          {filteredTransfers.length ? <div className="table-scroll">
            <table className="asset-table asset-transfer-approval-table">
              <thead><tr><th>Asset / Request</th><th>From · Building / Location / Line</th><th>To · Building / Location / Line</th><th>Request date</th><th>Current approval step</th><th><span className="sr-only">Action</span></th></tr></thead>
              <tbody>{filteredTransfers.map((event, index) => {
                const steps = event.approvalSteps || []
                const stepIndex = Math.min(Number(event.currentApprovalStep) || 0, Math.max(steps.length - 1, 0))
                const currentStep = steps[stepIndex] || 'Approval'
                const finalStep = stepIndex >= steps.length - 1
                const actionLabel = finalStep ? 'Acknowledge' : 'Approve'
                return <tr key={event.transactionNo}>
                  <td><div className="asset-cell"><span className={`asset-avatar asset-avatar-${index % 5}`}><Icon name="transfer" size={17} /></span><span><strong>{event.assetName || event.assetId}</strong><small>{event.assetId} · {event.transactionNo}</small></span></div></td>
                  <td><div className="asset-transfer-approval-location">{movementLocation(event.from)}</div></td>
                  <td><div className="asset-transfer-approval-location is-destination">{movementLocation(event.to)}</div></td>
                  <td>{formatDate(event.occurredOn)}</td>
                  <td><div className="asset-transfer-approval-stage"><strong>{currentStep}</strong><span>Step {stepIndex + 1} of {steps.length}</span></div></td>
                  <td><button type="button" className="button button-primary button-small asset-transfer-approval-action" aria-label={`${actionLabel} ${event.transactionNo} as ${currentStep}`} onClick={() => onAdvanceTransfer(event)}><Icon name="check" size={13} />{actionLabel}</button></td>
                </tr>
              })}</tbody>
            </table>
          </div> : <div className="asset-approval-empty asset-transfer-approval-empty">
            <span className="asset-approval-empty-icon"><Icon name="check" size={19} /></span>
            <strong>{movementQuery.trim() ? 'No Movement requests match your search' : 'No Movement requests awaiting approval'}</strong>
            <p>{movementQuery.trim() ? 'Try another Asset number, request number, location or approval step.' : 'Submitted transfers will appear here for sequential approval.'}</p>
          </div>}
          <div className="table-footer"><span>{filteredTransfers.length} Movement request(s) shown</span><span>{pendingTransferCount} pending approval</span></div>
        </section>
      </section>

      <div className="dashboard-footnote"><span className="footnote-dot" />Approval decisions are saved in this browser.</div>

      {selectedAsset && selectedStageId ? <ApprovalDetail asset={selectedAsset} stageId={selectedStageId} purchaseOrders={purchaseOrders} onClose={closeDetail} onApprove={approveAsset} onReturn={returnAsset} /> : null}
    </div>
  )
}
