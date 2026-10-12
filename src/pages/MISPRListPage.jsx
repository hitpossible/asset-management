import { useMISList, MISListMetrics, MISListToolbar, MISListFooter } from '../components/MISListControls.jsx'
import { useState } from 'react'
import Icon from '../components/Icon.jsx'
import StatusBadge from '../components/StatusBadge.jsx'
import { PageHeading } from '../components/common.jsx'

function formatTHB(value) {
  return new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(Number(value) || 0)
}

function formatDate(value) {
  if (!value) return '—'
  const date = new Date(`${value}T00:00:00`)
  if (Number.isNaN(date.getTime())) return '—'
  return new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).format(date)
}

export default function MISPRListPage({ purchaseRequisitions, onCreate, onApprove, onCreatePO }) {
  const [expandedPRNo, setExpandedPRNo] = useState('')
  const list = useMISList(purchaseRequisitions, (record, search) => [record.prNo, record.proposalId, record.projectCode, record.projectName, record.requestTitle, ...record.assetItems.map((item) => `${item.assetId} ${item.assetName}`)].some((value) => String(value || '').toLowerCase().includes(search)))
  const { query, setQuery, filtered: filteredRequisitions } = list

  return (
    <div className="asset-list-workspace mis-list-workspace">
      <PageHeading eyebrow="MIS · Functional / Purchase Requisition" title="PR list" description="Review Purchase Requisitions, complete simulated approval, and continue to Create PO." action={<button type="button" className="button button-primary" onClick={onCreate}><Icon name="plus" size={17} />Create PR</button>} />
      <MISListMetrics list={list} noun="PRs" />

      <section className="panel asset-list-panel mis-pr-list-panel">
        <MISListToolbar list={list} noun="PRs" placeholder="Search pr, project or asset..." />

        {filteredRequisitions.length ? <div className="table-scroll"><table className="asset-table mis-pr-table"><thead><tr><th>PR No.</th><th>Request Title</th><th>Proposal / Project</th><th>Assets</th><th>Request Total (THB)</th><th>Requested Date</th><th>Status</th><th>Next step</th></tr></thead><tbody>
          {list.visible.map((requisition) => {
            const expanded = expandedPRNo === requisition.prNo
            return <MISPRRow key={requisition.prNo} requisition={requisition} expanded={expanded} onToggle={() => setExpandedPRNo(expanded ? '' : requisition.prNo)} onApprove={() => onApprove(requisition.prNo)} onCreatePO={() => onCreatePO(requisition.prNo)} />
          })}
        </tbody></table></div> : <div className="mis-proposal-list-empty"><span className="empty-table-icon"><Icon name="file" size={20} /></span><strong>{purchaseRequisitions.length ? 'No matching PRs' : 'No Purchase Requisitions yet'}</strong><p>{purchaseRequisitions.length ? 'Try another PR, project or asset search.' : 'Create a PR from an approved Proposal to get started.'}</p>{purchaseRequisitions.length ? <button type="button" className="button button-secondary button-small" onClick={() => { setQuery(''); list.setGroup('all') }}>Clear search</button> : <button type="button" className="button button-primary button-small" onClick={onCreate}><Icon name="plus" size={15} />Create PR</button>}</div>}
        <MISListFooter list={list} noun="PRs" />
      </section>
      <div className="dashboard-footnote"><span className="footnote-dot" />Approval and purchasing records are simulated locally in MIS.</div>
    </div>
  )
}

function MISPRRow({ requisition, expanded, onToggle, onApprove, onCreatePO }) {
  const needsApproval = requisition.status === 'Pending Approval'
  return <>
    <tr className={expanded ? 'mis-proposal-row-expanded' : ''}>
      <td><strong className="mis-pr-number">{requisition.prNo}</strong></td>
      <td><strong className="mis-project-name-cell">{requisition.requestTitle}</strong></td>
      <td><div className="mis-proposal-id-cell"><strong>{requisition.proposalId}</strong><small>{requisition.projectCode} · {requisition.projectName}</small></div></td>
      <td>{requisition.assetItems.length}</td>
      <td className="mis-pr-total-cell">฿ {formatTHB(requisition.totalAmount)}</td>
      <td>{formatDate(requisition.requestedDate)}</td>
      <td><StatusBadge status={requisition.status} /></td>
      <td><div className="mis-pr-row-actions">{needsApproval ? <button type="button" className="mis-proposal-approve-button" onClick={onApprove}><Icon name="check" size={13} />Approve</button> : <button type="button" className="mis-proposal-details-button" onClick={onCreatePO}>Create PO<Icon name="chevron" size={13} /></button>}<button type="button" className="mis-proposal-details-button" aria-expanded={expanded} onClick={onToggle}>{expanded ? 'Hide' : 'View'}<Icon name="down" size={13} className={expanded ? 'mis-proposal-details-open' : ''} /></button></div></td>
    </tr>
    {expanded ? <tr className="mis-proposal-detail-row"><td colSpan="8"><div className="mis-proposal-detail-content"><div className="mis-proposal-detail-meta"><span><small>Department / Section</small><strong>{[requisition.department, requisition.section].filter(Boolean).join(' · ') || '—'}</strong></span><span><small>Account Code</small><strong>{requisition.accountCode || '—'}</strong></span><span><small>Budget Type</small><strong>{requisition.budgetType || '—'}</strong></span><span><small>Requested Date</small><strong>{formatDate(requisition.requestedDate)}</strong></span><span><small>Reason</small><strong>{requisition.reason || '—'}</strong></span></div><div className="mis-proposal-detail-assets"><div className="mis-proposal-detail-heading"><strong>Requested assets and scoped costs</strong><span>Amounts in THB · reference only</span></div>{requisition.assetItems.map((item, index) => <article className="mis-proposal-detail-asset" key={`${requisition.prNo}-${item.assetId}`}><div className="mis-proposal-detail-asset-head"><span>{String((index + 1) * 10).padStart(2, '0')}</span><strong>{item.assetName || item.assetId}</strong><small>{item.assetId}</small><b>฿ {formatTHB(item.assetAmount)}</b></div>{item.costs?.length ? <ul>{item.costs.map((cost, costIndex) => <li key={`${cost.type}-${costIndex}`}><span>{cost.type}{cost.description ? ` · ${cost.description}` : ''}</span><strong>฿ {formatTHB(cost.amount)}</strong></li>)}</ul> : <p className="mis-proposal-no-costs">No additional costs</p>}</article>)}</div></div></td></tr> : null}
  </>
}
