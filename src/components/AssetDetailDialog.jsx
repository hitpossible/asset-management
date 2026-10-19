import ActivationApprovalRoute from './ActivationApprovalRoute.jsx'
import { formatPower } from '../utils/powerUtils.js'
import { isCustomerAsset, getAssetOwnerLabel } from '../utils/assetOwnershipUtils.js'
import AssetLabelDialog from './AssetLabelDialog.jsx'
import DisposalSummary from './DisposalSummary.jsx'
import { useEffect, useState } from 'react'
import { formatDate } from '../utils/assetUtils.js'
import Icon from './Icon.jsx'
import AssetDepreciationDialog from './AssetDepreciationDialog.jsx'
import DepreciationPanel from './DepreciationPanel.jsx'
import StatusBadge from './StatusBadge.jsx'
import { DetailValue } from './common.jsx'
import { getAssetReferences } from '../utils/misReferenceUtils.js'
import { getAssetDepreciationData } from '../utils/depreciationUtils.js'
import { getAssetExpenses } from '../utils/assetExpenseUtils.js'

const DETAIL_TABS = [
  { id: 'overview', label: 'Overview', icon: 'file' },
  { id: 'acquisition', label: 'Acquisition', icon: 'cart' },
  { id: 'depreciation', label: 'DP', icon: 'chart' },
  { id: 'lifecycle', label: 'Lifecycle', icon: 'clock' },
]

const LIFECYCLE_TYPES = [
  { id: 'transfer', label: 'Transfer', icon: 'chevron' },
]

function formatTHB(value) {
  return `฿ ${new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(Number(value) || 0)}`
}

function ReferenceGroup({ title, items, emptyText, formatItem, icon = 'file', group }) {
  return (
    <section className={`mis-reference-group acquisition-group-${group}${items.length ? ' has-references' : ''}`}>
      <span className="acquisition-document-icon"><Icon name={icon} size={23} /></span>
      <div className="acquisition-document-content">
        <h4>{title}<span aria-label={`${items.length} records`}>{items.length}</span></h4>
        {items.length ? <ul>{items.map((item, index) => <li key={`${item.reference || item.poNo}-${index}`}>{formatItem(item)}</li>)}</ul> : <p className="mis-reference-empty"><Icon name={icon} size={22} /><span>{emptyText}</span></p>}
      </div>
    </section>
  )
}

function AcquisitionPanel({ references }) {
  return (
    <section className="mis-reference-panel asset-detail-acquisition">
      <div className="mis-reference-heading"><div><h3>Acquisition documents</h3><p>References from MIS appear here in the Asset record.</p></div><span className="mis-demo-tag">MIS demo</span></div>
      <div className="mis-document-groups">
        <ReferenceGroup group="proposal" icon="file" title="Proposal" items={references.proposalReferences} emptyText="No proposal linked" formatItem={(item) => <><strong>{item.reference}</strong>{item.projectCode ? <small>Project {item.projectCode}</small> : null}</>} />
        <ReferenceGroup group="pr" icon="file" title="Purchase requisitions" items={references.purchaseRequisitionReferences} emptyText="No PR linked" formatItem={(item) => <strong>{item.reference}</strong>} />
        <ReferenceGroup group="po" icon="cart" title="Purchase orders / items" items={references.purchaseOrderReferences} emptyText="No PO linked" formatItem={(item) => item.itemNo ? <><strong>{item.poNo}</strong><small>Item {item.itemNo}</small></> : <strong>{item.poNo}</strong>} />
        <ReferenceGroup group="invoices" icon="file" title="Invoices" items={references.invoiceReferences} emptyText="No invoice linked" formatItem={(item) => <><strong>{item.reference}</strong>{item.poNo ? <small>PO {item.poNo}</small> : null}</>} />
        <ReferenceGroup group="gr" icon="truck" title="Goods receipts" items={references.goodsReceiptReferences} emptyText="No GR linked" formatItem={(item) => <><strong>{item.reference}</strong>{item.poNo ? <small>PO {item.poNo}</small> : null}{item.invoiceReference ? <small>Invoice {item.invoiceReference}</small> : null}</>} />
      </div>
      <div className="mis-reference-note"><Icon name="info" size={14} />MIS steps are simulated locally; Invoice references are added when creating GR in MIS.</div>
    </section>
  )
}

function AssetFinancialSummary({ depreciation, expenses }) {
  const amount = (value) => value == null ? 'Not recorded' : formatTHB(value)
  const fields = [
    ['Asset value', depreciation.assetValue, 'bank'],
    [depreciation.stopped ? 'Current monthly DP · Stopped' : 'Monthly DP', depreciation.stopped ? 0 : depreciation.monthlyDepreciation, 'chart'],
    ['Accumulated DP', depreciation.accumulatedDepreciation, 'pie'],
    [depreciation.stopped ? 'NBV at sale' : 'Net book value', depreciation.netBookValue, 'receipt'],
    ['Total expense', expenses.total, 'coins'],
  ]
  return <section className="asset-financial-summary" aria-label="Asset financial summary">
    <div className="asset-financial-metrics">{fields.map(([label, value, icon]) => <div className="asset-financial-card" key={label}><span className="asset-financial-icon"><Icon name={icon} size={22} /></span><div className="asset-financial-copy"><span>{label}</span><strong>{amount(value)}</strong></div></div>)}</div>
    <details className="asset-expense-breakdown"><summary>Expense breakdown · Completed transactions only · Excludes DP</summary>
      <dl>{[['Maintenance', expenses.maintenance], ['Spare parts', expenses.spareParts], ['Sub Assets (expense)', expenses.subAssets], ['Modifications (expense)', expenses.modifications]].map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{formatTHB(value)}</dd></div>)}</dl>
      <p>Existing-asset Proposal items ≤ THB 50,000 are Expenses; higher values create Sub Assets. Completed expense records and MIS spare part costs are shown here.</p>
    </details>
  </section>
}

function TransferLocation({ title, values, destination = false }) {
  const entries = [
    ['Building', values?.plant],
    ['Location', values?.location],
    ['Line', values?.line],
  ].filter(([, value]) => value)

  return <section className={`asset-transfer-location ${destination ? 'is-destination' : ''}`}><h4>{title}</h4><dl>{entries.map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl></section>
}

function TransferApprovals({ event, onAdvanceTransfer }) {
  const steps = event.approvalSteps || []
  const activeStep = Number(event.currentApprovalStep) || 0
  const completed = event.status === 'Completed'
  const canAdvance = event.status === 'Pending Approval' && steps.length > 0 && typeof onAdvanceTransfer === 'function'
  const finalStep = activeStep >= steps.length - 1
  return <div className="asset-transfer-progress">
    <div className="asset-transfer-progress-heading"><strong>Transfer approvals</strong><span>{completed ? 'Complete' : `Step ${Math.min(activeStep + 1, steps.length)} of ${steps.length}`}</span></div>
    <ol className="asset-transfer-approval-icons">{steps.map((step, index) => {
      const history = (event.approvalHistory || []).findLast((item) => event.approvalWorkflow?.steps[index]?.id && item.stageId ? item.stageId === event.approvalWorkflow.steps[index].id : item.stage === step)
      const done = index < activeStep || completed
      const current = index === activeStep && !completed
      const status = done ? (history?.action || 'Approved') : current ? 'Awaiting approval' : 'Upcoming'
      const date = history?.date ? new Date(history.date) : null
      const time = date && !Number.isNaN(date.getTime()) ? new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Bangkok', day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }).format(date) + ' (ICT)' : 'Time not recorded'
      const tooltipId = `transfer-approval-${event.transactionNo}-${index}`
      return <li key={event.approvalWorkflow?.steps[index]?.id || index} className={done ? 'is-done' : current ? 'is-current' : ''}>
        <button type="button" className="asset-approval-icon" aria-label={`${step}: ${status}`} aria-describedby={tooltipId}>
          <Icon name="user" size={18} /><span className="asset-approval-icon-status"><Icon name={done ? 'check' : 'clock'} size={9} /></span>
        </button>
        <div id={tooltipId} role="tooltip" className="asset-approval-icon-tooltip"><strong>{step}</strong><span>{status}</span>{done ? <><span>By: {history?.actor || 'Approver not recorded'}</span><span>{time}</span></> : null}</div>
      </li>
    })}</ol>
    {canAdvance ? <button type="button" className="button button-secondary button-small" onClick={() => onAdvanceTransfer(event)}>{finalStep ? ['acknowledge', 'Acknowledge'].includes(event.approvalWorkflow?.steps[activeStep]?.actionType || event.approvalWorkflow?.steps[activeStep]?.action) ? 'Acknowledge and complete transfer' : event.approvalWorkflow ? 'Approve and complete transfer' : 'Acknowledge and complete transfer' : `${['acknowledge', 'Acknowledge'].includes(event.approvalWorkflow?.steps[activeStep]?.actionType || event.approvalWorkflow?.steps[activeStep]?.action) ? 'Acknowledge' : 'Approve'} as ${steps[activeStep].replace(' Approval', '')}`}<Icon name="chevron" size={13} /></button> : null}
  </div>
}

function LifecycleEvent({ event, onAdvanceTransfer }) {
  const isTransfer = event.type === 'transfer'
  const isSparePart = event.type === 'sparePartUsage'
  const eventLabel = {
    subAsset: 'Sub Asset',
    modification: 'Modification',
    maintenance: 'Maintenance',
    transfer: 'Transfer',
    sparePartUsage: 'Spare Part Usage',
    disposal: 'Disposal / Sale',
  }[event.type] || 'Lifecycle event'
  const amount = ['maintenance', 'sparePartUsage'].includes(event.type) ? event.cost : event.value
  const approvalSteps = event.approvalSteps || []

  return (
    <details className="asset-lifecycle-event asset-event-compact">
      <summary className="asset-event-summary">
        <span className="asset-event-title"><strong>{event.title || event.transactionNo}</strong><small>{formatDate(event.occurredOn)}</small></span>
        <span className="asset-event-type"><Icon name={isTransfer ? 'transfer' : event.type === 'maintenance' ? 'wrench' : 'box'} size={21} /><span><small>Event type</small><span>{eventLabel}</span></span></span>
        <span className="asset-event-reference"><small>Reference No.</small><span>{event.transactionNo}</span></span>
        <span className="asset-event-status"><StatusBadge status={event.status || 'Recorded'} /></span>
        <Icon name="down" size={14} className="asset-event-chevron" />
      </summary>
      <div className="asset-event-expanded">
      <span className={`asset-lifecycle-event-mark event-${event.type}`}><Icon name={event.type === 'maintenance' ? 'wrench' : event.type === 'transfer' ? 'chevron' : 'box'} size={15} /></span>
      <div className="asset-lifecycle-event-body">
        {event.type === 'disposal' ? <DisposalSummary record={event} /> : null}


        {event.type === 'subAsset' ? <div className="asset-lifecycle-event-detail"><span>Main Asset <strong>{event.mainAssetId || event.assetId}</strong></span><span>Work on <strong>{event.sourceAssetId || event.assetId}</strong></span><span>Sub Asset <strong>{event.subAsset?.name || event.title}</strong></span>{event.subAsset?.model ? <span>Model <strong>{event.subAsset.model}</strong></span> : null}</div> : null}
        {event.type === 'modification' || event.type === 'maintenance' ? <div className="asset-lifecycle-event-detail"><span>Description <strong>{event.description || '—'}</strong></span>{event.vendor || event.responsibleTeam ? <span>Vendor / team <strong>{event.vendor || event.responsibleTeam}</strong></span> : null}{event.result ? <span>Result <strong>{event.result}</strong></span> : null}</div> : null}
        {isSparePart ? <div className="asset-lifecycle-event-detail"><span>Spare Part <strong>{event.sparePart || event.partName}</strong></span><span>Quantity <strong>{event.quantity ?? '—'}</strong></span><span>Cost <strong>{event.cost == null ? 'Not recorded' : formatTHB(event.cost)}</strong></span><span>MIS reference <strong>{event.misReference || event.reference || '—'}</strong></span></div> : null}

        {isTransfer ? <>
          <div className="asset-transfer-pair"><TransferLocation title="FROM" values={event.from} /><TransferLocation title="TO" values={event.to} destination /></div>
          {event.serialNo || event.reasons?.length || event.conditionCheck || event.photoName ? <div className="asset-lifecycle-event-detail">
            {event.serialNo ? <span>Serial No. <strong>{event.serialNo}</strong></span> : null}
            {event.reasons?.length ? <span>Reason <strong>{[...event.reasons, event.otherReason].filter(Boolean).join(', ')}</strong></span> : null}
            {event.conditionCheck ? <span>Condition check <strong>{event.conditionCheck.physicalCondition} · Tag {event.conditionCheck.assetTag?.toLowerCase()} · Accessories {event.conditionCheck.accessories?.toLowerCase()}</strong></span> : null}
            {event.photoName ? <span>Photo <strong>{event.photoIsSample ? `Sample file reference · ${event.photoName}` : event.photoName}</strong></span> : null}
          </div> : null}
          {approvalSteps.length ? <TransferApprovals event={event} onAdvanceTransfer={onAdvanceTransfer} /> : null}
        </> : null}

        {amount != null ? <div className="asset-lifecycle-event-cost"><span>{event.type === 'maintenance' ? 'Maintenance cost' : 'Transaction value'}</span><strong>{formatTHB(amount)}</strong>{event.costTreatment ? <b className={event.costTreatment === 'Capitalized' ? 'is-capitalized' : 'is-expense'}>{event.costTreatment}</b> : null}</div> : null}
        {event.proposalId ? <div className="asset-lifecycle-event-detail"><span>Work on <strong>{event.sourceAssetId || event.assetId}</strong></span><span>Proposal <strong>{event.proposalId}</strong></span><span>Sub Asset <strong>{event.subAssetId || 'None (Expense)'}</strong></span>{event.prNo ? <span>PR <strong>{event.prNo}</strong></span> : null}{event.poNo ? <span>PO <strong>{event.poNo}</strong></span> : null}{event.grNo ? <span>GR <strong>{event.grNo}</strong></span> : null}</div> : null}
        {event.completedAt && event.costTreatment === 'Expense' ? <div className="asset-lifecycle-event-detail"><span>Completed <strong>{formatDate(event.completedAt)}</strong></span><span>Accepted by <strong>{event.acceptedBy}</strong></span><span>Invoices <strong>{(event.invoiceReferences || [event.invoiceReference]).filter(Boolean).join(', ')}</strong></span><span>Goods Receipts <strong>{(event.grReferences || [event.grNo]).filter(Boolean).join(', ')}</strong></span></div> : null}
        {event.receivingRemark ? <p className="asset-lifecycle-event-remark">{event.receivingRemark}</p> : null}
        {event.remark ? <p className="asset-lifecycle-event-remark">{event.remark}</p> : null}
      </div>
      </div>
    </details>
  )
}

function LifecyclePanel({ asset, assets, events, onCreate, onCreateSubAsset, onAdvanceTransfer }) {
  const isActive = asset.status === 'Active'
  const childIds = new Set(assets.filter((child) => child.parentAssetId === asset.assetId).map((child) => child.assetId))
  const assetEvents = events.filter((event) => event.assetId === asset.assetId || (!asset.parentAssetId && (event.mainAssetId === asset.assetId || childIds.has(event.assetId))))
  const sortedEvents = [...assetEvents].sort((first, second) => String(second.occurredOn || second.createdAt).localeCompare(String(first.occurredOn || first.createdAt)))
  const sparePartEvents = sortedEvents.filter((event) => event.type === 'sparePartUsage')
  const transactionEvents = sortedEvents.filter((event) => event.type !== 'sparePartUsage')

  return (
    <div className="asset-lifecycle-panel">
      <section className="asset-lifecycle-start-panel">
        <div className="asset-lifecycle-heading"><span className="asset-lifecycle-section-icon"><Icon name="clock" size={25} /></span><div><h3>Lifecycle activity</h3><p>Independent events are stored with the Asset and remain visible in its history.</p></div></div>
        <div className="asset-lifecycle-actions">{LIFECYCLE_TYPES.map((item) => <button className="button button-secondary button-small" type="button" key={item.id} disabled={!isActive} onClick={() => onCreate(item.id)}><Icon name={item.icon} size={14} />{item.label}</button>)}{onCreateSubAsset && !asset.parentAssetId ? <button type="button" className="button button-secondary button-small" disabled={!isActive} title={!isActive ? 'Activate this Asset before creating a Sub Asset' : 'Prepare a Sub Asset draft request'} onClick={onCreateSubAsset}><Icon name="plus" size={14} />Create Sub Asset</button> : null}</div>
      </section>
      {!isActive ? <div className="asset-lifecycle-inline-note"><Icon name="info" size={14} />{asset.status === 'Sold' ? 'Sold · Lifecycle history is retained. New lifecycle actions are unavailable.' : 'Lifecycle actions are available after the Asset becomes Active.'}</div> : null}
      <div className="asset-lifecycle-inline-note"><Icon name="info" size={14} />Prepare Addition Sub-Asset using Create Sub Asset, then continue to Create Proposal (MIS). Modification and Maintenance start in Create Proposal (MIS) with Existing Asset and the work type.</div>

      {assets.some((child) => child.parentAssetId === asset.assetId) ? <section className="asset-lifecycle-history-section"><div className="asset-detail-section-heading"><div><h3>Asset relationship</h3><p>{asset.parentAssetId ? `Parent Asset: ${asset.parentAssetId}` : 'Sub Assets linked to this Main Asset, including Drafts'}</p></div></div><div className="table-scroll"><table className="asset-lifecycle-spares-table"><thead><tr><th>Sub Asset No.</th><th>Name</th><th>Work type</th><th>Work on</th><th>Proposal</th><th>Status</th></tr></thead><tbody>{assets.filter((child) => child.parentAssetId === asset.assetId).map((child) => <tr key={child.assetId}><td>{child.assetId}</td><td>{child.name}</td><td>{child.workType === 'subAsset' ? 'Addition Sub-Asset' : child.workType === 'modification' ? 'Modification' : 'Maintenance'}</td><td>{child.sourceAssetId || child.parentAssetId}</td><td>{child.proposalNo || child.expenseProposalNo || '—'}</td><td><StatusBadge status={child.status} /></td></tr>)}</tbody></table></div></section> : null}
      <section className="asset-lifecycle-history-section">
        <div className="asset-detail-section-heading"><div className="asset-lifecycle-heading"><span className="asset-lifecycle-section-icon"><Icon name="file" size={23} /></span><div><h3>Event history</h3><p>{transactionEvents.length} lifecycle transaction(s)</p></div></div></div>
        {transactionEvents.length ? <div className="asset-lifecycle-timeline">{transactionEvents.map((event) => <LifecycleEvent key={event.transactionNo} event={event} onAdvanceTransfer={assets.find((item) => item.assetId === event.assetId)?.status === 'Active' ? onAdvanceTransfer : undefined} />)}</div> : <div className="asset-lifecycle-empty"><span className="empty-table-icon"><Icon name="clock" size={18} /></span><strong>No lifecycle events recorded</strong><p>Existing-asset Proposal work and Transfer history appear here.</p></div>}
      </section>

      <section className="asset-lifecycle-spares-section">
        <div className="asset-detail-section-heading"><div className="asset-lifecycle-heading"><span className="asset-lifecycle-section-icon"><Icon name="box" size={23} /></span><div><h3>Spare Part Usage</h3><p>Usage references received from MIS; stock and issue processing remain in MIS.</p></div></div></div>
        {sparePartEvents.length ? <div className="table-scroll"><table className="asset-lifecycle-spares-table"><thead><tr><th>Date</th><th>Spare Part</th><th>Qty</th><th>Cost (THB)</th><th>MIS Reference</th></tr></thead><tbody>{sparePartEvents.map((event) => <tr key={event.transactionNo}><td>{formatDate(event.occurredOn)}</td><td>{event.sparePart || event.partName || '—'}</td><td>{event.quantity ?? '—'} {event.unit || ''}</td><td>{event.cost == null ? 'Not recorded' : formatTHB(event.cost)}</td><td>{event.misReference || event.reference || '—'}{event.isDemo ? <small className="asset-demo-reference">Demo MIS issue</small> : null}</td></tr>)}</tbody><tfoot><tr><td colSpan={3}>Total spare part cost</td><td>{formatTHB(sparePartEvents.filter((event) => event.status === 'Completed').reduce((total, event) => total + (Number(event.cost) || 0), 0))}</td><td>Completed issues</td></tr></tfoot></table></div> : <p className="asset-lifecycle-spares-empty">Spare Part Usage records will appear here when the MIS reference is received.</p>}
      </section>
      <div className="asset-lifecycle-inline-note"><Icon name="info" size={14} />Create Sub Assets as Drafts before selecting them in a Proposal. Modification and Maintenance record work against the selected Active Asset.</div>
    </div>
  )
}

export default function AssetDetailDialog({ asset, assets = [], assetTypes = [], purchaseOrders = [], lifecycleEvents = [], onClose, onEdit, onCreateSubAsset, onSaveDPDetails, onTransfer, onAdvanceTransfer }) {
  const [editingDP, setEditingDP] = useState(false)
  const [previewingLabel, setPreviewingLabel] = useState(false)
  const [activeTab, setActiveTab] = useState('overview')

  useEffect(() => {
    if (!asset || editingDP || previewingLabel) return undefined
    function closeOnEscape(event) {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', closeOnEscape)
    return () => window.removeEventListener('keydown', closeOnEscape)
  }, [asset, editingDP, previewingLabel, onClose])

  useEffect(() => {
    setActiveTab('overview')
    setEditingDP(false)
    setPreviewingLabel(false)
  }, [asset?.assetId])

  if (!asset) return null

  const customerAsset = isCustomerAsset(asset)
  const detailTabs = customerAsset ? DETAIL_TABS.filter((tab) => tab.id === 'overview' || tab.id === 'acquisition') : DETAIL_TABS
  const visibleTab = detailTabs.some((tab) => tab.id === activeTab) ? activeTab : 'overview'
  const references = getAssetReferences(asset)
  const depreciation = getAssetDepreciationData(asset, assetTypes, purchaseOrders)
  const expenses = getAssetExpenses(asset.assetId, lifecycleEvents)

  function openTransfer() {
    onClose()
    onTransfer(asset.assetId)
  }

  return (
    <>
      <div className="detail-mask asset-record-mask" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose() }}>
        <section className="detail-dialog asset-detail-dialog" role="dialog" aria-modal="true" aria-labelledby="asset-detail-title">
          <div className="asset-detail-scroll-content">
          <div className="detail-header">
            <div className="asset-record-heading">
              <span className="asset-record-symbol"><Icon name={asset.assetClass?.startsWith('IT') ? 'file' : 'factory'} size={36} /></span>
              <div className="asset-record-heading-copy"><span className="detail-eyebrow">Asset record</span><div className="asset-record-title-row"><h2 id="asset-detail-title">{asset.name}</h2><StatusBadge status={asset.status} /></div><span className="detail-id">{asset.assetId.startsWith('TMP-') ? 'Draft reference: ' : ''}{asset.assetId} · {asset.assetClass || 'Unclassified'}</span>{asset.assetId.startsWith('TMP-') ? <small>Real Asset No. will be assigned after Proposal approval.</small> : asset.temporaryReference ? <small>Original Draft reference: {asset.temporaryReference}</small> : null}</div>
            </div>
            <button className="modal-close" aria-label="Close details" onClick={onClose}><Icon name="close" size={18} /></button>
          </div>

          {customerAsset ? <div className="mis-reference-note"><Icon name="info" size={14} />{getAssetOwnerLabel(asset)} · No depreciation or lifecycle events. Acquisition and approval history remain available.</div> : <AssetFinancialSummary depreciation={depreciation} expenses={expenses} />}

          <div className="asset-detail-tabs" role="tablist" aria-label="Asset details">
            {detailTabs.map((tab) => <button key={tab.id} type="button" role="tab" aria-selected={visibleTab === tab.id} className={visibleTab === tab.id ? 'is-active' : ''} onClick={() => setActiveTab(tab.id)}><Icon name={tab.icon} size={18} />{tab.label}{tab.id === 'lifecycle' && lifecycleEvents.some((event) => event.assetId === asset.assetId) ? <span>{lifecycleEvents.filter((event) => event.assetId === asset.assetId).length}</span> : null}</button>)}
          </div>

          <div className="asset-detail-tab-panel" role="tabpanel">
            {visibleTab === 'overview' ? <section className="asset-overview-card">
              <h3 className="detail-section-title"><Icon name="file" size={21} />Asset information</h3>
              <div className="detail-grid">
                {asset.parentAssetId ? <DetailValue label="Parent Asset" value={asset.parentAssetId} /> : null}
                {asset.sourceAssetId ? <DetailValue label="Work on Asset" value={asset.sourceAssetId} /> : null}
                {asset.workType ? <DetailValue label="Originating work" value={asset.workType === 'subAsset' ? 'Addition Sub-Asset' : asset.workType === 'modification' ? 'Modification' : 'Maintenance'} /> : null}
                <DetailValue label="Project Code" value={asset.projectCode} />
                <DetailValue label="Project Name" value={asset.projectName} />
                <DetailValue label="Asset ownership" value={getAssetOwnerLabel(asset)} />
                <DetailValue label="Asset class" value={asset.assetClass} />
                <DetailValue label="RFQ No." value={asset.rfqNo} />
                <DetailValue label="Part number" value={asset.partNo} />
                <DetailValue label="Model" value={asset.model} />
                <DetailValue label="Custodian" value={asset.custodian} />
                <DetailValue label="Department" value={asset.department} />
                <DetailValue label="Plant" value={asset.plant} />
                <DetailValue label="Location" value={asset.location} />
                <DetailValue label="Line" value={asset.line} />
                <DetailValue label="Power" value={formatPower(asset.power, asset.powerUnit)} />
                <DetailValue label="Area (m²)" value={asset.area} />
                <DetailValue label="Target SOP" value={formatDate(asset.targetSop)} />
              </div>
              {asset.activationApproval?.steps?.length ? <ActivationApprovalRoute steps={asset.activationApproval.steps} state={asset.activationApproval.state} currentIndex={asset.activationApproval.currentStep} legacy={asset.activationApproval.legacyContinuation} /> : null}
              {Array.isArray(asset.approvalHistory) && asset.approvalHistory.length ? <section className="mis-reference-panel"><h3>Approval history</h3><div className="table-scroll"><table className="asset-table"><thead><tr><th>Stage</th><th>Actor</th><th>Action</th><th>Date</th><th>Remark</th></tr></thead><tbody>{asset.approvalHistory.map((entry, index) => <tr key={index}><td>{entry.stage}</td><td>{entry.actor}{entry.assignedApprover ? <small>Assigned: {entry.assignedApprover}</small> : null}</td><td>{entry.action}</td><td>{formatDate(entry.date)}</td><td>{entry.comment || '—'}</td></tr>)}</tbody></table></div></section> : null}
              {asset.disposalRecord ? <DisposalSummary record={asset.disposalRecord} /> : null}
              {asset.notes ? <div className="detail-notes"><span>Notes</span><p>{asset.notes}</p></div> : null}
            </section> : null}

            {visibleTab === 'acquisition' ? <AcquisitionPanel references={references} /> : null}
            {visibleTab === 'depreciation' ? <DepreciationPanel asset={asset} depreciation={depreciation} onEdit={() => setEditingDP(true)} /> : null}
            {visibleTab === 'lifecycle' ? <LifecyclePanel asset={asset} assets={assets} events={lifecycleEvents} onCreate={openTransfer} onCreateSubAsset={onCreateSubAsset ? () => { onClose(); onCreateSubAsset(asset) } : undefined} onAdvanceTransfer={onAdvanceTransfer} /> : null}
          </div>

          </div>
          <div className="detail-footer">
            <button type="button" className="button button-secondary" onClick={() => setPreviewingLabel(true)}><Icon name="tag" size={18} />Preview Asset Label</button>
            <button className="button button-secondary" onClick={onClose}>Close</button>
            {onEdit && asset.status === 'Draft' && !asset.proposalNo ? <button className="button button-primary" onClick={() => onEdit(asset)}><Icon name="edit" size={18} />Edit draft</button> : null}
          </div>
        </section>
      </div>
      {previewingLabel ? <AssetLabelDialog asset={asset} onClose={() => setPreviewingLabel(false)} /> : null}
      {!customerAsset && editingDP && onSaveDPDetails ? <AssetDepreciationDialog asset={asset} depreciation={depreciation} onClose={() => setEditingDP(false)} onSave={(record) => { onSaveDPDetails(record); setEditingDP(false) }} /> : null}
    </>
  )
}
