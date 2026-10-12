import { useMemo, useState } from 'react'
import Icon from '../components/Icon.jsx'
import { Field, PageHeading } from '../components/common.jsx'
import { buildPOChoices, isExistingAssetWork, getReceivingItemKey } from '../utils/grReceivingUtils.js'

function localDate(date = new Date()) {
  return new Date(date.getTime() - date.getTimezoneOffset() * 60_000).toISOString().slice(0, 10)
}

export default function MISCreateGRPage({ vendorInvoices = [], assets, purchaseOrders, goodsReceipts, nextGRNo, onSave, onAssets, onAssetValidation }) {
  const eligiblePOs = useMemo(() => buildPOChoices(purchaseOrders, assets, goodsReceipts, vendorInvoices), [purchaseOrders, assets, goodsReceipts, vendorInvoices])
  const [selectedPONo, setSelectedPONo] = useState(() => eligiblePOs[0]?.poNo || '')
  const selectedPO = eligiblePOs.find((purchaseOrder) => purchaseOrder.poNo === selectedPONo) || eligiblePOs[0]
  const [selectedInvoice, setSelectedInvoice] = useState(() => eligiblePOs[0]?.invoiceReferences[0] || '')
  const [selectedItemKeys, setSelectedItemKeys] = useState(() => eligiblePOs[0]?.assetItems.map(getReceivingItemKey) || [])
  const [invoiceAmount, setInvoiceAmount] = useState(() => vendorInvoices.find((invoice) => invoice.poNo === eligiblePOs[0]?.poNo && invoice.reference === eligiblePOs[0]?.invoiceReferences[0])?.amount ?? '')
  const [receivedDate, setReceivedDate] = useState(localDate)
  const [comment, setComment] = useState('')
  const [goodsChecked, setGoodsChecked] = useState(false)
  const [error, setError] = useState('')
  const [savedGR, setSavedGR] = useState(null)

  const invoiceReference = selectedInvoice.trim()
  const selectedItems = (selectedPO?.assetItems || []).filter((item) => selectedItemKeys.includes(getReceivingItemKey(item)))

  function changePO(poNo) {
    const nextPO = eligiblePOs.find((purchaseOrder) => purchaseOrder.poNo === poNo)
    setSelectedPONo(poNo)
    setSelectedInvoice(nextPO?.invoiceReferences[0] || '')
    setInvoiceAmount(vendorInvoices.find((invoice) => invoice.poNo === poNo && invoice.reference === nextPO?.invoiceReferences[0])?.amount ?? '')
    setGoodsChecked(false)
    setSelectedItemKeys(nextPO?.assetItems.map(getReceivingItemKey) || [])
    setError('')
  }

  function changeInvoice(reference) {
    setSelectedInvoice(reference)
    setInvoiceAmount(vendorInvoices.find((invoice) => invoice.poNo === selectedPO?.poNo && invoice.reference === reference)?.amount ?? '')
  }

  function toggleItem(assetId) {
    setSelectedItemKeys((current) => current.includes(assetId)
      ? current.filter((selectedId) => selectedId !== assetId)
      : [...current, assetId])
    setError('')
  }

  function startAnotherGR() {
    changePO(eligiblePOs[0]?.poNo || '')
    setSavedGR(null)
    setGoodsChecked(false)
    setComment('')
    setError('')
  }

  function submit(event) {
    event.preventDefault()
    if (!selectedPO || !invoiceReference || selectedItems.length === 0 || !goodsChecked) {
      setError('Select a PO, a related Invoice, at least one received item, and confirm goods/work acceptance with Purchasing and the Asset Owner.')
      return
    }

    const goodsReceipt = {
      grNo: nextGRNo,
      poNo: selectedPO.poNo,
      invoiceReference,
      invoiceAmount: invoiceAmount === '' ? null : Number(invoiceAmount),
      receivedDate,
      comment: comment.trim(),
      goodsChecked: true,
      assetItems: selectedItems.map((item) => ({
        itemId: item.itemId,
        costTreatment: item.costTreatment,
        workType: item.workType,
        workOnExistingAsset: isExistingAssetWork(item, item.asset),
        assetId: item.assetId,
        assetName: item.assetName || item.asset.name,
        itemNo: item.itemNo || '',
        receivedQuantity: Number(item.remainingQuantity) || Number(item.orderedQuantity) || 1,
        unitOfMeasure: item.unitOfMeasure || 'asset',
      })),
      status: 'Complete',
      createdAt: new Date().toISOString(),
    }

    onSave(goodsReceipt)
    setSavedGR(goodsReceipt)
    setError('')
  }

  if (savedGR) {
    return (
      <div className="create-asset-workspace mis-create-workspace">
        <PageHeading eyebrow="MIS · Functional / Goods Receipt" title="Goods Receipt created" description="The GR is linked to its PO. Accepted Expense and existing-asset work items complete; new Assets continue to Asset Validation." />
        <section className="panel mis-transaction-result">
          <div className="mis-transaction-result-header"><span className="mis-transaction-result-mark"><Icon name="check" size={22} /></span><div><span className="mis-transaction-kicker">GOODS RECEIPT SAVED</span><h2>{savedGR.grNo}</h2><p>Purchase Order {savedGR.poNo}</p></div><span className="status-badge status-green"><span className="status-dot" />Received</span></div>
          <div className="mis-transaction-result-meta"><span>Purchase Order<strong>{savedGR.poNo}</strong></span><span>Invoice reference<strong>{savedGR.invoiceReference}</strong></span><span>Items received<strong>{savedGR.assetItems.length}</strong></span><span>Receiving date<strong>{savedGR.receivedDate}</strong></span></div>
          <div className="mis-transaction-result-note"><Icon name="info" size={15} /><span>Expense items complete automatically when PO, Invoice and GR references are valid and goods/work are accepted. New Assets and Sub Assets continue to Asset Validation.</span></div>
          <div className="mis-transaction-result-actions"><button type="button" className="button button-secondary" onClick={onAssets}>Open Asset list</button>{savedGR.assetItems.some((item) => item.costTreatment !== 'Expense' && !item.workOnExistingAsset) ? <button type="button" className="button button-primary" onClick={onAssetValidation}>Open Asset Validation</button> : null}<button type="button" className="button button-secondary" onClick={startAnotherGR}>Create another GR</button></div>
        </section>
      </div>
    )
  }

  return (
    <div className="create-asset-workspace mis-create-workspace">
      <PageHeading eyebrow="MIS · Functional / Goods Receipt" title="Create GR" description="Record PO items after Purchasing and the Asset Owner accept the delivered goods or completed work." action={<span className="mis-page-badge"><span />MIS simulation</span>} />

      {eligiblePOs.length === 0 ? (
        <section className="panel mis-transaction-empty">
          <span className="empty-table-icon"><Icon name="file" size={20} /></span>
          <strong>No PO is ready for a GR</strong>
          <p>Create a PO first. Add its Invoice reference here when recording the Goods Receipt.</p>
          <button type="button" className="button button-primary button-small" onClick={onAssets}>Open Asset list</button>
        </section>
      ) : (
        <form className="create-asset-form mis-transaction-form" onSubmit={submit}>
          <div className="form-main-column">
          <section className="panel form-section mis-transaction-panel">
            <div className="mis-proposal-panel-heading form-section-heading"><div><span className="form-section-icon "><Icon name="file" size={23} /></span><div><h2>Goods Receipt information</h2><p>Choose a PO and Invoice reference that belongs to the same purchase order.</p></div></div></div>
            <div className="form-grid mis-transaction-grid">
              <Field label="GR No."><input className="mis-readonly-field" value={nextGRNo} readOnly /></Field>
              <Field label="Purchase Order" required><select value={selectedPO?.poNo || ''} onChange={(event) => changePO(event.target.value)} required><option value="">Select a PO</option>{eligiblePOs.map((purchaseOrder) => <option key={purchaseOrder.poNo} value={purchaseOrder.poNo}>{purchaseOrder.poNo} · {purchaseOrder.vendor || 'PO'}</option>)}</select></Field>
              <Field label="Invoice reference" required><input value={selectedInvoice} onChange={(event) => changeInvoice(event.target.value)} list="gr-invoice-references" placeholder="Enter Invoice reference or select an existing one" maxLength={40} required /><datalist id="gr-invoice-references">{(selectedPO?.invoiceReferences || []).map((reference) => <option key={reference} value={reference} />)}</datalist><small>The Invoice is linked to the selected PO when you save GR.</small></Field>
              <Field label="Invoice amount (THB)"><input type="number" min="0" step="0.01" value={invoiceAmount} onChange={(event) => setInvoiceAmount(event.target.value)} placeholder="Optional · reference only" /></Field>
              <Field label="Receiving date" required><input type="date" value={receivedDate} onChange={(event) => setReceivedDate(event.target.value)} required /></Field>
              <Field label="Comment"><input value={comment} onChange={(event) => setComment(event.target.value)} maxLength={240} placeholder="Add a receiving note (optional)" /></Field>
            </div>
          </section>

          <section className="panel form-section mis-transaction-panel mis-pr-assets-panel">
            <div className="mis-proposal-panel-heading form-section-heading"><div><span className="form-section-icon form-icon-location"><Icon name="box" size={23} /></span><div><h2>PO items received</h2><p>Select the delivered goods or completed service items. Partial receipts can be recorded as separate GRs.</p></div></div><span className="mis-line-count">{selectedItems.length} of {selectedPO?.assetItems.length || 0} selected</span></div>
            <div className="mis-pr-item-list">
              {(selectedPO?.assetItems || []).map((item) => {
                const selected = selectedItemKeys.includes(getReceivingItemKey(item))
                return (
                  <label className={`mis-pr-item ${selected ? 'mis-pr-item-selected' : ''}`} key={`${selectedPO.poNo}-${getReceivingItemKey(item)}`}>
                    <input type="checkbox" checked={selected} onChange={() => toggleItem(getReceivingItemKey(item))} />
                    <span className="mis-pr-item-copy"><strong>{item.assetName || item.asset.name}</strong><small>{item.assetId} · {item.asset.model || 'Asset item'}</small></span>
                    <span className="mis-pr-item-reference">PO item<strong>{item.itemNo || '—'}</strong><small>Ordered {item.orderedQuantity} · Received {item.receivedQuantity} · Balance {item.remainingQuantity} {item.unitOfMeasure || 'asset'}</small></span>
                  </label>
                )
              })}
            </div>
          </section>

          <section className="panel form-section mis-transaction-panel mis-gr-check-panel">
            <div className="mis-proposal-panel-heading form-section-heading"><div><span className="form-section-icon form-icon-purchase"><Icon name="check" size={23} /></span><div><h2>Goods / work acceptance</h2><p>Purchasing and the Asset Owner confirm the delivered goods or completed Modification / Maintenance work before creating the GR.</p></div></div></div>
            <label className="mis-goods-check"><input type="checkbox" checked={goodsChecked} onChange={(event) => setGoodsChecked(event.target.checked)} /><span><strong>Goods / completed work accepted by Purchasing + Asset Owner</strong><small>Confirm delivery or completed work for every selected item. Expense items complete automatically after valid receiving references.</small></span></label>
            <div className="mis-transaction-result-note"><Icon name="info" size={15} /><span>This GR and its Invoice reference must use the same PO. Invoice amounts and PO / GR quantities are not matched here.</span></div>
          </section>

          {error ? <div className="form-error" role="alert"><Icon name="alert" size={17} />{error}</div> : null}
          </div>
          <div className="movement-submit-bar create-asset-submit-bar"><span><Icon name="info" size={16} />Review the details before saving.</span><div className="create-asset-submit-actions"><button type="button" className="button button-secondary" onClick={onAssets}>Back to Asset list</button><button type="submit" className="button button-primary" disabled={!selectedItems.length || !invoiceReference || !goodsChecked}><Icon name="check" size={16} />Save GR in MIS</button></div></div>
        </form>
      )}
      <div className="dashboard-footnote"><span className="footnote-dot" />Accepted Expense items complete after reference checks. New Assets and Sub Assets continue to Asset Validation.</div>
    </div>
  )
}
