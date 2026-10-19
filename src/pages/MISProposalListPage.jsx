import { useMISList, MISListMetrics, MISListToolbar, MISListFooter } from '../components/MISListControls.jsx'
import { useState } from 'react'
import { getProposalItemTotal, WORK_TYPES } from '../utils/proposalAssetUtils.js'
import Icon from '../components/Icon.jsx'
import StatusBadge from '../components/StatusBadge.jsx'
import { PageHeading } from '../components/common.jsx'

function formatTHB(value) {
  return new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(Number(value) || 0)
}

function formatCreatedDate(value) {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '—'
  return new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).format(date)
}

export default function MISProposalListPage({ proposals, onCreate, onSetStatus }) {
  const [expandedProposalId, setExpandedProposalId] = useState('')
  const list = useMISList(proposals, (record, search) => [record.proposalId, record.projectCode, record.projectName, ...record.assetItems.flatMap((item) => [item.assetId, item.assetName, item.customerName])].some((value) => String(value || '').toLowerCase().includes(search)))
  const { query, setQuery, filtered: filteredProposals } = list

  return (
    <div className="asset-list-workspace mis-list-workspace">
      <PageHeading
        eyebrow="MIS · Functional / Proposal Service"
        title="Proposal list"
        description="Review proposals created in the MIS simulation and inspect their linked asset costs. Approval assigns real Asset numbers to Draft records."
        action={<button type="button" className="button button-primary" onClick={onCreate}><Icon name="plus" size={17} />Create Proposal</button>}
      />

      <MISListMetrics list={list} noun="proposals" />

      <section className="panel asset-list-panel mis-proposal-list-panel">
        <MISListToolbar list={list} noun="proposals" placeholder="Search proposal, project or asset..." />

        {filteredProposals.length ? (
          <div className="table-scroll">
            <table className="asset-table mis-proposal-table">
              <thead><tr><th>Proposal</th><th>Project Name</th><th>Created</th><th>Assets</th><th>Budget (THB)</th><th>Budget Type</th><th>Status</th><th>Details</th></tr></thead>
              <tbody>
                {list.visible.map((proposal) => {
                  const isExpanded = expandedProposalId === proposal.proposalId
                  return <FragmentRow key={proposal.proposalId} proposal={proposal} isExpanded={isExpanded} onToggle={() => setExpandedProposalId(isExpanded ? '' : proposal.proposalId)} onApprove={() => onSetStatus(proposal.proposalId, 'Approved')} />
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="mis-proposal-list-empty">
            <span className="empty-table-icon"><Icon name="file" size={20} /></span>
            <strong>{proposals.length ? 'No matching proposals' : 'No proposals yet'}</strong>
            <p>{proposals.length ? 'Try another proposal, project or asset search.' : 'Create a Proposal and it will appear here.'}</p>
            {proposals.length ? <button type="button" className="button button-secondary button-small" onClick={() => { setQuery(''); list.setGroup('all') }}>Clear search</button> : <button type="button" className="button button-primary button-small" onClick={onCreate}><Icon name="plus" size={15} />Create Proposal</button>}
          </div>
        )}
        <MISListFooter list={list} noun="proposals" />
      </section>
      <div className="dashboard-footnote"><span className="footnote-dot" />Proposal data is stored locally and is not synchronized with MIS.</div>
    </div>
  )
}

function FragmentRow({ proposal, isExpanded, onToggle, onApprove }) {
  return (
    <>
      <tr className={isExpanded ? 'mis-proposal-row-expanded' : ''}>
        <td><div className="mis-proposal-id-cell"><strong>{proposal.proposalId}</strong><small>{proposal.projectCode}</small><small>{proposal.ownershipType === 'customer' ? 'Customer Asset' : 'Company Asset'}</small></div></td>
        <td><strong className="mis-project-name-cell">{proposal.projectName}</strong></td>
        <td>{formatCreatedDate(proposal.savedAt)}</td>
        <td>{proposal.assetItems.length}</td>
        <td className="mis-proposal-budget-cell">฿ {formatTHB(proposal.budget)}</td>
        <td><span className="mis-budget-type">{proposal.budgetType || 'Expense'}</span></td>
        <td><StatusBadge status={proposal.status || 'Created'} /></td>
        <td><div className="mis-proposal-row-actions">{['Pending Approval', 'Created'].includes(proposal.status) ? <button type="button" className="mis-proposal-approve-button" onClick={onApprove}><Icon name="check" size={13} />Approve</button> : null}<button type="button" className="mis-proposal-details-button" aria-expanded={isExpanded} onClick={onToggle}>{isExpanded ? 'Hide' : 'View'}<Icon name="down" size={13} className={isExpanded ? 'mis-proposal-details-open' : ''} /></button></div></td>
      </tr>
      {isExpanded ? (
        <tr className="mis-proposal-detail-row"><td colSpan="8">
          <div className="mis-proposal-detail-content">
            <div className="mis-proposal-detail-meta">
              <span><small>Factory / Location</small><strong>{[proposal.factory, proposal.location].filter(Boolean).join(' · ') || '—'}</strong></span>
              <span><small>Department / Section</small><strong>{[proposal.department, proposal.section].filter(Boolean).join(' · ') || '—'}</strong></span>
              <span><small>Account Code</small><strong>{proposal.accountCode || '—'}</strong></span>
              <span><small>Period</small><strong>{formatCreatedDate(proposal.periodStart)} – {formatCreatedDate(proposal.periodEnd)}</strong></span>
              <span><small>Supporting file</small><strong>{proposal.attachmentName || '—'}</strong></span>
            </div>
            {proposal.comment ? <p className="mis-proposal-detail-comment"><small>Comment</small>{proposal.comment}</p> : null}
            <div className="mis-proposal-detail-assets">
              <div className="mis-proposal-detail-heading"><strong>Assets and scoped additional costs</strong><span>Amounts in THB</span></div>
              {proposal.assetItems.map((item, index) => (
                <article className="mis-proposal-detail-asset" key={`${proposal.proposalId}-${item.assetId}`}>
                  <div className="mis-proposal-detail-asset-head"><span>{String(index + 1).padStart(2, '0')}</span><strong>{item.assetName || item.assetId}</strong><small>{item.assetId}</small><b>฿ {formatTHB(item.assetAmount)}</b></div>
                  <p className="proposal-item-context">Budget Type: {item.budgetType === 'Capital expenditure' ? 'Investment' : item.budgetType || proposal.budgetType} · Asset total (including additional costs): ฿ {formatTHB(getProposalItemTotal(item))}</p>
                  {item.ownershipType === 'customer' ? <p className="proposal-item-context">Customer: {item.customerName} · No DP or lifecycle events</p> : null}
                  {item.assetMode === 'existing' ? <p className="proposal-item-context"><strong>{WORK_TYPES.find((type) => type.id === item.workType)?.label}</strong> · {item.costTreatment} · Main Asset {item.parentAssetId} · Work on {item.sourceAssetId || item.parentAssetId}{item.subAssetId ? ` · Sub Asset ${item.subAssetId}` : ' · No Sub Asset'}<br />{item.workName} — {item.description}</p> : null}
                  {item.costs?.length ? <ul>{item.costs.map((cost, costIndex) => <li key={`${cost.type}-${costIndex}`}><span>{cost.type}{cost.description ? ` · ${cost.description}` : ''}</span><strong>฿ {formatTHB(cost.amount)}</strong></li>)}</ul> : <p className="mis-proposal-no-costs">No additional costs</p>}
                </article>
              ))}
            </div>
          </div>
        </td></tr>
      ) : null}
    </>
  )
}
