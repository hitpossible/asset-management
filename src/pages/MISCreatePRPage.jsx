import { useMemo, useState } from 'react'
import Icon from '../components/Icon.jsx'
import { Field, PageHeading } from '../components/common.jsx'
import { getAssetReferences } from '../utils/misReferenceUtils.js'

function availableItemsForProposal(proposal, assets, purchaseRequisitions) {
  const assetById = new Map(assets.map((asset) => [asset.assetId, asset]))
  return proposal.assetItems.filter((item) => {
    const asset = assetById.get(item.assetId)
    if (!asset) return false
    if (item.itemId) return !purchaseRequisitions.some((pr) => pr.proposalId === proposal.proposalId && pr.assetItems.some((prItem) => prItem.itemId === item.itemId))
    const references = getAssetReferences(asset)
    const linkedToProposal = references.proposalReferences.some((reference) => reference.reference === proposal.proposalId)
    return linkedToProposal && references.purchaseRequisitionReferences.length === 0
  })
}

function getEligibleProposals(proposals, assets, purchaseRequisitions) {
  return proposals.filter((proposal) => proposal.status === 'Approved' && availableItemsForProposal(proposal, assets, purchaseRequisitions).length > 0)
}

function getPendingProposals(proposals, assets, purchaseRequisitions) {
  return proposals.filter((proposal) => ['Pending Approval', 'Created'].includes(proposal.status) && availableItemsForProposal(proposal, assets, purchaseRequisitions).length > 0)
}

function dateValue(date = new Date()) {
  return new Date(date.getTime() - date.getTimezoneOffset() * 60_000).toISOString().slice(0, 10)
}

function formatTHB(value) {
  return new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(Number(value) || 0)
}

export default function MISCreatePRPage({ assets, proposals, purchaseRequisitions = [], nextPRNo, onSave, onProposalList, onApproveProposal }) {
  const eligibleProposals = useMemo(() => getEligibleProposals(proposals, assets, purchaseRequisitions), [proposals, assets, purchaseRequisitions])
  const pendingProposals = useMemo(() => getPendingProposals(proposals, assets, purchaseRequisitions), [proposals, assets, purchaseRequisitions])
  const [proposalId, setProposalId] = useState(() => eligibleProposals[0]?.proposalId || '')
  const selectedProposal = eligibleProposals.find((proposal) => proposal.proposalId === proposalId)
  const availableItems = selectedProposal ? availableItemsForProposal(selectedProposal, assets, purchaseRequisitions) : []
  const [selectedAssetIds, setSelectedAssetIds] = useState(() => availableItems.map((item) => item.assetId))
  const [requestTitle, setRequestTitle] = useState(() => eligibleProposals[0] ? `Purchase request - ${eligibleProposals[0].projectName}` : '')
  const [requestedDate, setRequestedDate] = useState(dateValue)
  const [reason, setReason] = useState('Purchase request for approved proposal scope.')
  const [error, setError] = useState('')
  const selectedItems = availableItems.filter((item) => selectedAssetIds.includes(item.assetId))
  const requestTotal = selectedItems.reduce((total, item) => total + (Number(item.assetAmount) || 0) + (item.costs || []).reduce((sum, cost) => sum + (Number(cost.amount) || 0), 0), 0)

  function changeProposal(nextProposalId) {
    const nextProposal = eligibleProposals.find((proposal) => proposal.proposalId === nextProposalId)
    setProposalId(nextProposalId)
    setSelectedAssetIds(nextProposal ? availableItemsForProposal(nextProposal, assets, purchaseRequisitions).map((item) => item.assetId) : [])
    setRequestTitle(nextProposal ? `Purchase request - ${nextProposal.projectName}` : '')
    setError('')
  }

  function toggleAsset(assetId) {
    setSelectedAssetIds((current) => current.includes(assetId) ? current.filter((id) => id !== assetId) : [...current, assetId])
    setError('')
  }

  function approveAndSelectProposal(proposal) {
    onApproveProposal(proposal.proposalId)
    setProposalId(proposal.proposalId)
    setSelectedAssetIds(availableItemsForProposal(proposal, assets, purchaseRequisitions).map((item) => item.assetId))
    setRequestTitle(`Purchase request - ${proposal.projectName}`)
    setError('')
  }

  function submit(event) {
    event.preventDefault()
    if (!selectedProposal || selectedItems.length === 0) {
      setError('Select a proposal and at least one asset for this requisition.')
      return
    }
    const requisition = {
      prNo: nextPRNo,
      proposalId: selectedProposal.proposalId,
      projectCode: selectedProposal.projectCode,
      projectName: selectedProposal.projectName,
      requestTitle: requestTitle.trim(),
      requestedDate,
      reason: reason.trim(),
      department: selectedProposal.department,
      section: selectedProposal.section,
      accountCode: selectedProposal.accountCode,
      factory: selectedProposal.factory,
      location: selectedProposal.location,
      budgetType: selectedProposal.budgetType,
      assetItems: selectedItems.map((item) => ({ ...item })),
      totalAmount: requestTotal,
      status: 'Pending Approval',
      createdAt: new Date().toISOString(),
    }
    onSave(requisition)
  }

  return (
    <div className="create-asset-workspace mis-create-workspace">
      <PageHeading eyebrow="MIS · Functional / Purchase Requisition" title="Create PR" description="Create a Purchase Requisition from an approved MIS Proposal and select the asset items to request." action={<span className="mis-page-badge"><span />MIS simulation</span>} />
      {eligibleProposals.length === 0 ? (
        <section className="panel mis-transaction-empty mis-pr-approval-empty"><span className="empty-table-icon"><Icon name="file" size={20} /></span><strong>{pendingProposals.length ? 'Proposal approval required before creating a PR' : 'No approved Proposal items are ready for a PR'}</strong><p>{pendingProposals.length ? 'Approve a pending Proposal below to continue. This approval is simulated in MIS.' : 'Create a Proposal and approve it from the Proposal list before creating a PR.'}</p>
          {pendingProposals.length ? <div className="mis-pr-pending-proposals">{pendingProposals.map((proposal) => <div className="mis-pr-pending-proposal" key={proposal.proposalId}><span className="mis-pr-pending-icon"><Icon name="file" size={16} /></span><span className="mis-pr-pending-copy"><strong>{proposal.projectName}</strong><small>{proposal.proposalId} · {proposal.projectCode} · {availableItemsForProposal(proposal, assets, purchaseRequisitions).length} asset(s)</small></span><button type="button" className="button button-primary button-small" onClick={() => approveAndSelectProposal(proposal)}><Icon name="check" size={14} />Approve & continue</button></div>)}</div> : <button type="button" className="button button-primary button-small" onClick={onProposalList}>Open Proposal list</button>}
        </section>
      ) : (
        <form className="create-asset-form mis-transaction-form" onSubmit={submit}>
          <div className="form-main-column">
          <section className="panel form-section mis-transaction-panel">
            <div className="mis-proposal-panel-heading form-section-heading"><div><span className="form-section-icon "><Icon name="file" size={23} /></span><div><h2>Requisition information</h2><p>Purchase Requisition references an approved Proposal in MIS.</p></div></div></div>
            <div className="form-grid mis-transaction-grid">
              <Field label="PR No."><input className="mis-readonly-field" value={nextPRNo} readOnly /></Field>
              <Field label="Proposal" required><select value={proposalId} onChange={(event) => changeProposal(event.target.value)} required><option value="">Select a Proposal</option>{eligibleProposals.map((proposal) => <option key={proposal.proposalId} value={proposal.proposalId}>{proposal.proposalId} · {proposal.projectName}</option>)}</select></Field>
              <Field label="Request Title" required><input value={requestTitle} onChange={(event) => setRequestTitle(event.target.value)} maxLength={120} required /></Field>
              <Field label="Requested Date" required><input type="date" value={requestedDate} onChange={(event) => setRequestedDate(event.target.value)} required /></Field>
              <Field label="Department"><input className="mis-readonly-field" value={selectedProposal?.department || ''} readOnly /></Field>
              <Field label="Section"><input className="mis-readonly-field" value={selectedProposal?.section || ''} readOnly /></Field>
              <Field label="Account Code"><input className="mis-readonly-field" value={selectedProposal?.accountCode || ''} readOnly /></Field>
              <Field label="Reason / Comment"><input value={reason} onChange={(event) => setReason(event.target.value)} maxLength={240} /></Field>
            </div>
          </section>

          <section className="panel form-section mis-transaction-panel mis-pr-assets-panel">
            <div className="mis-proposal-panel-heading form-section-heading"><div><span className="form-section-icon form-icon-location"><Icon name="box" size={23} /></span><div><h2>Requested asset items</h2><p>Select all or part of the remaining assets in this Proposal.</p></div></div><span className="mis-line-count">{selectedItems.length} of {availableItems.length} selected</span></div>
            {availableItems.length ? <div className="mis-pr-item-list">{availableItems.map((item) => {
              const selected = selectedAssetIds.includes(item.assetId)
              const itemTotal = (Number(item.assetAmount) || 0) + (item.costs || []).reduce((sum, cost) => sum + (Number(cost.amount) || 0), 0)
              return <label className={`mis-pr-item ${selected ? 'mis-pr-item-selected' : ''}`} key={item.assetId}><input type="checkbox" checked={selected} onChange={() => toggleAsset(item.assetId)} /><span className="mis-pr-item-copy"><strong>{item.assetName || item.assetId}</strong><small>{item.assetId}{item.parentAssetId ? ` · Main Asset ${item.parentAssetId} · Work on ${item.sourceAssetId || item.parentAssetId} · ${item.costTreatment}` : ''} · {item.costs?.length || 0} additional cost lines</small></span><span className="mis-pr-item-reference">Reference amount<strong>฿ {formatTHB(itemTotal)}</strong></span></label>
            })}</div> : <div className="mis-transaction-inline-empty">All asset items from this Proposal already have a PR reference.</div>}
            <div className="mis-transaction-total"><span>Selected request amount <small>Reference only</small></span><strong>฿ {formatTHB(requestTotal)}</strong></div>
          </section>

          {error ? <div className="form-error" role="alert"><Icon name="alert" size={17} />{error}</div> : null}
          </div>
          <div className="movement-submit-bar create-asset-submit-bar"><span><Icon name="info" size={16} />Review the details before saving.</span><div className="create-asset-submit-actions"><button type="button" className="button button-secondary" onClick={onProposalList}>Back to Proposal list</button><button type="submit" className="button button-primary" disabled={!selectedItems.length}><Icon name="check" size={16} />Save PR in MIS</button></div></div>
        </form>
      )}
      <div className="dashboard-footnote"><span className="footnote-dot" />PR information is stored in this browser. Proposal amounts are shown as references only.</div>
    </div>
  )
}
