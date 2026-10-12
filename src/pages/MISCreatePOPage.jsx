import { useMemo, useState } from 'react'
import Icon from '../components/Icon.jsx'
import { Field, PageHeading } from '../components/common.jsx'

const VENDORS = ['Daifuku (Thailand) Ltd.', 'Mazak Thailand', 'Fanuc Thailand', 'Keyence (Thailand)']

function localDate(date = new Date()) {
  return new Date(date.getTime() - date.getTimezoneOffset() * 60_000).toISOString().slice(0, 10)
}

function afterDays(days) {
  const date = new Date()
  date.setDate(date.getDate() + days)
  return localDate(date)
}

function formatTHB(value) {
  return new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(Number(value) || 0)
}

export default function MISCreatePOPage({ purchaseOrders = [], onApprove, onPOList, assets, purchaseRequisitions, defaultPRNo, nextPONo, onSave, onPRList }) {
  const approvedRequisitions = useMemo(() => purchaseRequisitions.filter((requisition) => requisition.status === 'Approved'), [purchaseRequisitions])
  const [selectedPRNo, setSelectedPRNo] = useState(() => approvedRequisitions.some((item) => item.prNo === defaultPRNo) ? defaultPRNo : approvedRequisitions[0]?.prNo || '')
  const selectedRequisition = approvedRequisitions.find((requisition) => requisition.prNo === selectedPRNo)
  const [selectedAssetIds, setSelectedAssetIds] = useState(() => selectedRequisition?.assetItems?.map((item) => item.assetId) || [])
  const [vendor, setVendor] = useState(VENDORS[0])
  const [orderDate, setOrderDate] = useState(localDate)
  const [expectedDelivery, setExpectedDelivery] = useState(afterDays(30))
  const [shipTo, setShipTo] = useState(() => selectedRequisition?.location || '')
  const [comment, setComment] = useState('')
  const [error, setError] = useState('')
  const [savedPO, setSavedPO] = useState(null)
  const selectedItems = (selectedRequisition?.assetItems || []).filter((item) => selectedAssetIds.includes(item.assetId))
  const referenceTotal = selectedItems.reduce((total, item) => total + (Number(item.assetAmount) || 0) + (item.costs || []).reduce((sum, cost) => sum + (Number(cost.amount) || 0), 0), 0)

  function changeRequisition(prNo) {
    const requisition = approvedRequisitions.find((item) => item.prNo === prNo)
    setSelectedPRNo(prNo)
    setSelectedAssetIds(requisition?.assetItems?.map((item) => item.assetId) || [])
    setShipTo(requisition?.location || '')
    setError('')
  }

  function toggleAsset(assetId) {
    setSelectedAssetIds((current) => current.includes(assetId) ? current.filter((id) => id !== assetId) : [...current, assetId])
    setError('')
  }

  function createAnotherPO() {
    setSavedPO(null)
    setError('')
  }

  function submit(event) {
    event.preventDefault()
    if (!selectedRequisition || selectedItems.length === 0) {
      setError('Select an approved PR and at least one asset item for this Purchase Order.')
      return
    }
    if (new Date(`${expectedDelivery}T00:00:00`) < new Date(`${orderDate}T00:00:00`)) {
      setError('Expected Delivery must be the same as or later than Order Date.')
      return
    }
    const purchaseOrder = {
      poNo: nextPONo,
      prNo: selectedRequisition.prNo,
      proposalId: selectedRequisition.proposalId,
      projectCode: selectedRequisition.projectCode,
      vendor,
      orderDate,
      expectedDelivery,
      shipTo: shipTo.trim(),
      comment: comment.trim(),
      assetItems: selectedItems.map((item, index) => ({ ...item, orderedQuantity: Number(item.orderedQuantity) || 1, unitOfMeasure: item.unitOfMeasure || 'asset', itemNo: String((index + 1) * 10) })),
      referenceTotal,
      status: 'Pending Approval',
      createdAt: new Date().toISOString(),
    }
    onSave(purchaseOrder)
    setSavedPO(purchaseOrder)
    setError('')
  }

  if (savedPO) {
    const currentPO = purchaseOrders.find((po) => po.poNo === savedPO.poNo) || savedPO
    const approved = currentPO.status === 'Approved'
    return (
      <div className="create-asset-workspace mis-create-workspace">
        <PageHeading eyebrow="MIS · Functional / Purchase Order" title="Purchase Order created" description="The PO reference is linked to its PR items and saved to the related Asset records." />
        <section className="panel mis-transaction-result">
          <div className="mis-transaction-result-header"><span className="mis-transaction-result-mark"><Icon name="check" size={22} /></span><div><span className="mis-transaction-kicker">PURCHASE ORDER SAVED</span><h2>{savedPO.poNo}</h2><p>{savedPO.vendor}</p></div><span className={`status-badge ${approved ? 'status-green' : 'status-amber'}`}><span className="status-dot" />{currentPO.status}</span></div>
          <div className="mis-transaction-result-meta"><span>Purchase Requisition<strong>{savedPO.prNo}</strong></span><span>Proposal<strong>{savedPO.proposalId}</strong></span><span>PO items<strong>{savedPO.assetItems.length}</strong></span><span>Reference amount<strong>฿ {formatTHB(savedPO.referenceTotal)}</strong></span></div>
          <div className="mis-transaction-result-note"><Icon name="info" size={15} /><span>{approved ? 'PO อนุมัติแล้ว เปิดหน้า Vendor Delivery เพื่อแจ้งส่งสินค้าได้' : 'ขั้นตอนถัดไป: กด Approve PO (MIS) ก่อนเปิดหน้า Vendor Delivery'}</span></div>
          <div className="mis-transaction-result-actions"><button type="button" className="button button-secondary" onClick={onPOList}>ดู PO list / Approval</button><button type="button" className="button button-secondary" onClick={createAnotherPO}>Create another PO</button>{approved ? <a className="button button-primary" href={`/vendor-delivery?po=${encodeURIComponent(savedPO.poNo)}`} target="_blank" rel="noopener noreferrer"><Icon name="truck" size={17} />เปิดหน้า Vendor Delivery</a> : <button type="button" className="button button-primary" onClick={() => onApprove(savedPO.poNo)}><Icon name="check" size={17} />Approve PO (MIS)</button>}</div>
        </section>
      </div>
    )
  }

  return (
    <div className="create-asset-workspace mis-create-workspace">
      <PageHeading eyebrow="MIS · Functional / Purchase Order" title="Create PO" description="Create one Purchase Order for selected items from an approved PR." action={<span className="mis-page-badge"><span />MIS simulation</span>} />
      {approvedRequisitions.length === 0 ? (
        <section className="panel mis-transaction-empty"><span className="empty-table-icon"><Icon name="file" size={20} /></span><strong>No approved PR is ready for a PO</strong><p>Create a PR and complete its approval step in the MIS simulation first.</p><button type="button" className="button button-primary button-small" onClick={onPRList}>Open PR list</button></section>
      ) : (
        <form className="create-asset-form mis-transaction-form" onSubmit={submit}>
          <div className="form-main-column">
          <section className="panel form-section mis-transaction-panel">
            <div className="mis-proposal-panel-heading form-section-heading"><div><span className="form-section-icon "><Icon name="file" size={23} /></span><div><h2>Purchase Order information</h2><p>Choose an approved PR and complete supplier and delivery details.</p></div></div></div>
            <div className="form-grid mis-transaction-grid">
              <Field label="PO No."><input className="mis-readonly-field" value={nextPONo} readOnly /></Field>
              <Field label="Purchase Requisition" required><select value={selectedPRNo} onChange={(event) => changeRequisition(event.target.value)} required><option value="">Select an approved PR</option>{approvedRequisitions.map((requisition) => <option key={requisition.prNo} value={requisition.prNo}>{requisition.prNo} · {requisition.projectName}</option>)}</select></Field>
              <Field label="Vendor" required><select value={vendor} onChange={(event) => setVendor(event.target.value)} required>{VENDORS.map((option) => <option key={option}>{option}</option>)}</select></Field>
              <Field label="Order Date" required><input type="date" value={orderDate} onChange={(event) => setOrderDate(event.target.value)} required /></Field>
              <Field label="Expected Delivery" required><input type="date" value={expectedDelivery} onChange={(event) => setExpectedDelivery(event.target.value)} required /></Field>
              <Field label="Ship-to Location"><input value={shipTo} onChange={(event) => setShipTo(event.target.value)} maxLength={120} placeholder="Enter delivery location" /></Field>
              <Field label="Currency"><input className="mis-readonly-field" value="THB" readOnly /></Field>
              <Field label="Comment"><input value={comment} onChange={(event) => setComment(event.target.value)} maxLength={240} placeholder="Add a comment (optional)" /></Field>
            </div>
          </section>

          <section className="panel form-section mis-transaction-panel mis-pr-assets-panel">
            <div className="mis-proposal-panel-heading form-section-heading"><div><span className="form-section-icon form-icon-location"><Icon name="box" size={23} /></span><div><h2>PO items</h2><p>Select all or part of the approved PR items. Each selected Asset gets a PO item reference.</p></div></div><span className="mis-line-count">{selectedItems.length} of {selectedRequisition?.assetItems?.length || 0} selected</span></div>
            {selectedRequisition?.assetItems?.length ? <div className="mis-pr-item-list">{selectedRequisition.assetItems.map((item, index) => {
              const selected = selectedAssetIds.includes(item.assetId)
              const itemTotal = (Number(item.assetAmount) || 0) + (item.costs || []).reduce((sum, cost) => sum + (Number(cost.amount) || 0), 0)
              const currentAsset = assets.find((asset) => asset.assetId === item.assetId)
              return <label className={`mis-pr-item ${selected ? 'mis-pr-item-selected' : ''}`} key={item.assetId}><input type="checkbox" checked={selected} onChange={() => toggleAsset(item.assetId)} /><span className="mis-pr-item-copy"><strong>{item.assetName || item.assetId}</strong><small>{item.assetId} · {currentAsset?.model || 'Asset item'}</small></span><span className="mis-pr-item-reference">PR item {String((index + 1) * 10).padStart(2, '0')} · Reference amount<strong>฿ {formatTHB(itemTotal)}</strong></span></label>
            })}</div> : <div className="mis-transaction-inline-empty">This approved PR has no asset items available.</div>}
            <div className="mis-transaction-total"><span>Selected PO reference amount <small>Reference only · not Invoice matching</small></span><strong>฿ {formatTHB(referenceTotal)}</strong></div>
          </section>

          {error ? <div className="form-error" role="alert"><Icon name="alert" size={17} />{error}</div> : null}
          </div>
          <div className="movement-submit-bar create-asset-submit-bar"><span><Icon name="info" size={16} />Review the details before saving.</span><div className="create-asset-submit-actions"><button type="button" className="button button-secondary" onClick={onPRList}>Back to PR list</button><button type="submit" className="button button-primary" disabled={!selectedItems.length}><Icon name="check" size={16} />Save PO in MIS</button></div></div>
        </form>
      )}
      <div className="dashboard-footnote"><span className="footnote-dot" />PO and asset item references are stored locally. Add Invoice references when creating GR in MIS.</div>
    </div>
  )
}
