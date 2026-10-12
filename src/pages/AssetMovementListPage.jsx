import { Fragment, useState } from 'react'
import Icon from '../components/Icon.jsx'
import StatusBadge from '../components/StatusBadge.jsx'
import { PageHeading } from '../components/common.jsx'
import { formatDate } from '../utils/assetUtils.js'

const GROUPS = [
  { id: 'all', label: 'All movements', icon: 'transfer', tone: 'red', hint: 'Transfer requests in progress', matches: () => true },
  { id: 'pending', label: 'Pending approval', icon: 'clock', tone: 'amber', hint: 'Waiting for the next approver', matches: (event) => event.status === 'Pending Approval' },
  { id: 'approved', label: 'Approved', icon: 'check', tone: 'green', hint: 'Awaiting transfer completion', matches: (event) => event.status === 'Approved' },
  { id: 'returned', label: 'Returned', icon: 'file', tone: 'slate', hint: 'Correction required before review', matches: (event) => ['Returned', 'Returned for Correction'].includes(event.status) },
]

function assignment(values) {
  return [values?.department, values?.custodian, values?.plant, values?.location, values?.line, values?.area].filter(Boolean).join(' · ') || '—'
}

export default function AssetMovementListPage({ lifecycleEvents, onCreate, onApproval }) {
  const [query, setQuery] = useState('')
  const [group, setGroup] = useState('all')
  const [pagination, setPagination] = useState({ page: 1, size: 8, context: '' })
  const [expandedRequest, setExpandedRequest] = useState(null)
  const movements = lifecycleEvents.filter((event) => event.type === 'transfer' && ['Pending Approval', 'Returned', 'Returned for Correction', 'Approved'].includes(event.status))
  const search = query.trim().toLowerCase()
  const counts = GROUPS.map((item) => movements.filter(item.matches).length)
  const filteredMovements = movements.filter(GROUPS.find((item) => item.id === group).matches).filter((event) => [event.transactionNo, event.assetId, event.assetName, assignment(event.from), assignment(event.to), event.status, event.approvalSteps?.[event.currentApprovalStep || 0]].join(' ').toLowerCase().includes(search))

  const context = JSON.stringify([query, group])
  const pageCount = Math.max(1, Math.ceil(filteredMovements.length / pagination.size))
  const page = pagination.context === context ? Math.min(pagination.page, pageCount) : 1
  const start = (page - 1) * pagination.size
  const pageMovements = filteredMovements.slice(start, start + pagination.size)
  const pages = Array.from({ length: pageCount }, (_, index) => index + 1).filter((number) => number === 1 || number === pageCount || Math.abs(number - page) <= 1)

  function exportMovements() {
    const rows = [['Request', 'Asset No.', 'Asset name', 'From', 'To', 'Request date', 'Status', 'Current step'], ...filteredMovements.map((event) => [event.transactionNo, event.assetId, event.assetName, assignment(event.from), assignment(event.to), event.occurredOn, event.status, event.approvalSteps?.[event.currentApprovalStep || 0]])]
    const csv = rows.map((row) => row.map((value) => `"${String(value ?? '').replaceAll('"', '""')}"`).join(',')).join('\n')
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' }))
    const link = document.createElement('a')
    link.href = url
    link.download = 'tbkk-assets-in-movement.csv'
    link.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="asset-list-workspace movement-list-workspace">
      <PageHeading eyebrow="Asset management" title="Assets in movement" description="Track submitted transfer requests and their current approval step." action={<button className="button button-primary" onClick={onCreate}><Icon name="plus" size={16} />Create movement</button>} />
      <div className="asset-list-metrics" aria-label="Movement summary">
        {GROUPS.map((item, index) => <button key={item.id} className={`asset-list-metric metric-tone-${item.tone}`} onClick={() => setGroup(item.id)} aria-pressed={group === item.id}>
          <span className="list-metric-icon"><Icon name={item.icon} size={25} /></span>
          <span className="list-metric-copy"><span>{item.label}</span><strong>{counts[index].toLocaleString()}</strong><small>{item.hint}</small></span>
          <span className="list-metric-progress" aria-hidden="true"><span style={{ width: `${movements.length ? counts[index] / movements.length * 100 : 0}%` }} /></span>
        </button>)}
      </div>
      <section className="panel asset-list-panel movement-list">
        <div className="list-toolbar">
          <div className="asset-status-tabs" aria-label="Movement groups">{GROUPS.map((item, index) => <button key={item.id} className={group === item.id ? 'asset-tab-active' : ''} aria-pressed={group === item.id} onClick={() => setGroup(item.id)}>{item.label} <span>({counts[index].toLocaleString()})</span></button>)}</div>
          <div className="toolbar-actions">
            <label className="table-search"><Icon name="search" size={17} /><input aria-label="Search assets in movement" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search asset, request or destination..." />{query ? <button aria-label="Clear search" onClick={() => setQuery('')}><Icon name="close" size={14} /></button> : null}</label>
            <button className="button button-secondary export-button" onClick={exportMovements}><Icon name="download" size={17} />Export</button>
          </div>
        </div>
        {filteredMovements.length ? <div className="table-scroll">
          <table className="asset-table asset-transfer-approval-table movement-register-table">
            <thead><tr><th>Asset / Request</th><th>From</th><th>To</th><th>Request date</th><th>Status / Current step</th><th>Action</th></tr></thead>
            <tbody>{pageMovements.map((event, index) => {
              const steps = event.approvalSteps || []
              const stepIndex = Number(event.currentApprovalStep) || 0
              const expanded = expandedRequest === event.transactionNo
              return <Fragment key={event.transactionNo}>
                <tr>
                  <td><div className="asset-cell"><span className={`asset-avatar asset-avatar-${index % 5}`}><Icon name="transfer" size={17} /></span><span><strong>{event.assetName || event.assetId}</strong><small>{event.assetId} <span className="asset-cell-separator">/</span> {event.transactionNo}</small></span></div></td>
                  <td><div className="asset-transfer-approval-location">{assignment(event.from)}</div></td>
                  <td><div className="asset-transfer-approval-location is-destination">{assignment(event.to)}</div></td>
                  <td>{formatDate(event.occurredOn)}</td>
                  <td><div className="asset-transfer-approval-stage"><StatusBadge status={event.status} /><strong>{steps[stepIndex] || 'Awaiting review'}</strong>{steps.length ? <span>Step {stepIndex + 1} of {steps.length}</span> : null}</div></td>
                  <td><button className="button button-secondary button-small" aria-expanded={expanded} aria-controls={`movement-${event.transactionNo}`} onClick={() => setExpandedRequest(expanded ? null : event.transactionNo)}>{expanded ? 'Hide details' : 'View details'}</button></td>
                </tr>
                {expanded ? <tr><td colSpan={6}><div id={`movement-${event.transactionNo}`} className="movement-list-detail">
                  <dl className="movement-review-list">
                    <div><dt>Reason</dt><dd>{event.reasons?.join(', ') || '—'}{event.otherReason ? ` · ${event.otherReason}` : ''}</dd></div>
                    <div><dt>Remark</dt><dd>{event.remark || '—'}</dd></div>
                    {event.conditionCheck ? <div><dt>Condition</dt><dd>{event.conditionCheck.physicalCondition} · Tag {event.conditionCheck.assetTag} · Accessories {event.conditionCheck.accessories}</dd></div> : null}
                    {event.photoName ? <div><dt>Photo reference</dt><dd>{event.photoName}</dd></div> : null}
                    <div><dt>Approval history</dt><dd>{event.approvalHistory?.length ? event.approvalHistory.map((item, index) => <p key={index}>{item.actor || item.stage} · {item.action} · {item.date}{item.remark ? ` · ${item.remark}` : ''}</p>) : 'Awaiting first review'}</dd></div>
                  </dl>
                  {event.status === 'Pending Approval' ? <div className="movement-actions"><button className="button button-secondary" onClick={onApproval}>Open movement approvals<Icon name="chevron" size={14} /></button></div> : null}
                </div></td></tr> : null}
              </Fragment>
            })}</tbody>
          </table>
        </div> : <div className="asset-approval-empty asset-transfer-approval-empty">
          <span className="asset-approval-empty-icon"><Icon name="box" size={19} /></span>
          <strong>{search || group !== 'all' ? 'No movements match your filters' : 'No assets currently in movement'}</strong>
          <p>{search || group !== 'all' ? 'Try another status, asset number, request or destination.' : 'Submitted requests appear here until the transfer is completed.'}</p>
          {search || group !== 'all' ? <button className="button button-secondary button-small" onClick={() => { setQuery(''); setGroup('all') }}>Reset filters</button> : <button className="button button-primary button-small" onClick={onCreate}>Create movement</button>}
        </div>}
        <div className="table-footer">
          <span>Showing <strong>{filteredMovements.length ? start + 1 : 0}–{Math.min(start + pagination.size, filteredMovements.length)}</strong> of <strong>{filteredMovements.length}</strong> movements</span>
          <nav className="asset-pagination" aria-label="Movement list pages">
            <button disabled={page === 1} aria-label="Previous page" onClick={() => setPagination({ ...pagination, page: page - 1, context })}><Icon name="chevron" size={15} className="previous-chevron" /></button>
            {pages.map((number, index) => <span key={number}>{index > 0 && number - pages[index - 1] > 1 ? <span className="pagination-gap">…</span> : null}<button className={number === page ? 'page-current' : ''} aria-current={number === page ? 'page' : undefined} aria-label={`Page ${number}`} onClick={() => setPagination({ ...pagination, page: number, context })}>{number}</button></span>)}
            <button disabled={page === pageCount} aria-label="Next page" onClick={() => setPagination({ ...pagination, page: page + 1, context })}><Icon name="chevron" size={15} /></button>
          </nav>
          <label className="asset-page-size">Show<select aria-label="Movements per page" value={pagination.size} onChange={(event) => setPagination({ page: 1, size: Number(event.target.value), context })}>{[8, 16, 32].map((size) => <option key={size}>{size}</option>)}</select>per page</label>
        </div>
      </section>
      <div className="dashboard-footnote"><span className="footnote-dot" />Asset assignment updates after approval and acknowledgement. Completed transfers remain in Asset history.</div>
    </div>
  )
}
