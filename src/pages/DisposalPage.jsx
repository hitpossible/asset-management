import { useState } from 'react'
import { DetailValue, Field, PageHeading } from '../components/common.jsx'
import Icon from '../components/Icon.jsx'
import DisposalSummary from '../components/DisposalSummary.jsx'
import { MOCK_TAX_INVOICES } from '../data/mockTaxInvoices.js'
import { isCustomerAsset } from '../utils/assetOwnershipUtils.js'
import { formatDate } from '../utils/assetUtils.js'
import { prepareInvoiceDisposals } from '../utils/disposalUtils.js'

const emptyForm = () => ({ taxInvoiceNo: '', itemAssetMap: {}, verifiedBy: '', saleVerified: false, convention: '', remark: '' })
const formatMoney = (amount) => amount == null ? 'Not recorded' : `฿ ${new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(amount)}`

export default function DisposalPage({ assets, assetTypes, purchaseOrders, onSave }) {
  const [form, setForm] = useState(emptyForm)
  const [error, setError] = useState('')
  const [review, setReview] = useState(null)
  const [completed, setCompleted] = useState(null)
  const eligible = assets.filter((asset) => asset.status === 'Active' && !isCustomerAsset(asset))
  const invoice = MOCK_TAX_INVOICES.find((item) => item.taxInvoiceNo === form.taxInvoiceNo)
  const history = assets
    .filter((item) => item.disposalRecord)
    .sort((a, b) => String(b.disposalRecord.completedAt || '').localeCompare(String(a.disposalRecord.completedAt || '')))
  const mappings = (invoice?.items || [])
    .filter((item) => form.itemAssetMap[item.itemNo])
    .map((item) => ({ invoiceItemNo: String(item.itemNo), assetId: form.itemAssetMap[item.itemNo] }))
  const readyToReview = Boolean(invoice && mappings.length && form.verifiedBy.trim() && form.saleVerified && form.convention)
  const flowSteps = ['Select Tax Invoice', 'Match Invoice Items', 'Verify Sale', 'Choose final DP month', 'Derecognize and retain history']
  const flowComplete = completed?.length
    ? flowSteps.map(() => true)
    : [Boolean(invoice), mappings.length > 0, form.saleVerified && Boolean(form.verifiedBy.trim()), Boolean(form.convention), false]

  function changeForm(changes) {
    setForm((current) => ({ ...current, ...changes }))
    setError('')
    setReview(null)
    setCompleted(null)
  }

  function selectInvoice(event) {
    changeForm({ taxInvoiceNo: event.target.value, itemAssetMap: {}, saleVerified: false, verifiedBy: '', convention: '' })
  }

  function setItemAsset(itemNo, assetId) {
    changeForm({ itemAssetMap: { ...form.itemAssetMap, [itemNo]: assetId } })
  }

  function applySuggestedMatches() {
    const itemAssetMap = {}
    const used = new Set()
    for (const item of invoice?.items || []) {
      const match = eligible.find((asset) => !used.has(asset.assetId) && (item.description.includes(asset.name) || (asset.model && item.description.includes(asset.model))))
      if (match) {
        itemAssetMap[item.itemNo] = match.assetId
        used.add(match.assetId)
      }
    }
    changeForm({ itemAssetMap })
  }

  function prepareForm() {
    return {
      invoice,
      mappings,
      verifiedBy: form.verifiedBy,
      saleVerified: form.saleVerified,
      convention: form.convention,
      remark: form.remark,
    }
  }

  function preview(event) {
    event.preventDefault()
    try {
      const records = prepareInvoiceDisposals(prepareForm(), assets, assetTypes, purchaseOrders)
      setReview(records)
      setError('')
    } catch (prepareError) {
      setError(prepareError.message)
      setReview(null)
    }
  }

  function confirm() {
    try {
      const saved = onSave(prepareForm())
      setCompleted(saved)
      setForm(emptyForm())
      setReview(null)
      setError('')
    } catch (saveError) {
      setError(saveError.message)
      setReview(null)
    }
  }

  return <div className="create-asset-workspace disposal-workspace">
    <PageHeading eyebrow="Asset management" title="Disposal / Sale" description="จับคู่ Tax Invoice จาก e‑Tax กับ Asset ก่อนตัดรายการและหยุดค่าเสื่อมราคา" />

    <ol className="disposal-flow" aria-label="Sale disposal process">
      {flowSteps.map((step, index) => <li key={step} className={flowComplete[index] ? 'is-complete' : ''} aria-current={!flowComplete[index] && (index === 0 || flowComplete.slice(0, index).every(Boolean)) ? 'step' : undefined}>
        <span>{flowComplete[index] ? <Icon name="check" size={15} /> : index + 1}</span>{step}
      </li>)}
    </ol>

    <div className="mis-reference-note disposal-intro-note"><Icon name="info" size={16} />เลือก e‑Tax Invoice ที่ออกหลังผ่าน Verify Sale แล้ว จากนั้นจับคู่แต่ละ Invoice Item กับ Asset ที่ขายจริง · Invoice หนึ่งใบจับคู่ได้หลาย Asset</div>

    {completed?.length ? <div role="status">
      <div className="disposal-success"><Icon name="check" size={20} /><strong>{completed.length} Asset{completed.length === 1 ? '' : 's'} · Sold</strong><span>Derecognize แล้ว หยุด DP และบันทึกประวัติ Invoice Item ↔ Asset</span></div>
      {completed.map((record) => <DisposalSummary key={record.transactionNo} record={record} />)}
      <button type="button" className="button button-secondary disposal-next-action" onClick={() => { setCompleted(null); setError('') }}>Start another disposal</button>
    </div> : null}

    <form className="create-asset-form" onSubmit={preview}>
      <section className="panel form-section">
        <div className="form-section-heading">
          <span className="form-section-icon disposal-step-icon">1</span>
          <div><h2>เลือก Tax Invoice จาก e‑Tax</h2><p>ข้อมูลผู้ซื้อ วันที่ และยอด Invoice แสดงจาก e‑Tax แบบอ่านอย่างเดียว</p></div>
        </div>
        <div className="disposal-invoice-selector">
          <Field label="Tax Invoice" required>
            <select name="taxInvoiceNo" value={form.taxInvoiceNo} onChange={selectInvoice} required>
              <option value="">Select an e‑Tax Invoice</option>
              {MOCK_TAX_INVOICES.map((item) => <option key={item.taxInvoiceNo} value={item.taxInvoiceNo}>{item.taxInvoiceNo} · {item.buyer} · {formatDate(item.issueDate)}</option>)}
            </select>
          </Field>
          <p>Source: e‑Tax · Sale Proposal reference is linked to an approved proposal.</p>
        </div>
        {invoice ? <div className="disposal-etax-summary" aria-label="Read-only e-Tax invoice details">
          <DetailValue label="Tax Invoice No." value={invoice.taxInvoiceNo} />
          <DetailValue label="Buyer / ผู้ซื้อ" value={invoice.buyer} />
          <DetailValue label="Invoice date" value={formatDate(invoice.issueDate)} />
          <DetailValue label="Invoice total · e‑Tax" value={formatMoney(invoice.totalAmount)} />
          <DetailValue label="Sale Proposal (Approved)" value={invoice.saleProposalNo} />
          <DetailValue label="Proposal status" value={invoice.saleProposalStatus} />
        </div> : <div className="disposal-invoice-empty"><Icon name="file" size={19} /><span>Select a Tax Invoice to view its verified e‑Tax details and Invoice Items.</span></div>}
      </section>

      {invoice ? <section className="panel form-section">
        <div className="form-section-heading disposal-section-heading-spread">
          <div className="disposal-section-title"><span className="form-section-icon disposal-step-icon">2</span><div><h2>เลือก Invoice Item แล้วจับคู่กับ Asset</h2><p>จับคู่เฉพาะ Asset Company ที่ Active · จับคู่ได้หลายรายการจาก Invoice เดียวกัน</p></div></div>
          <button type="button" className="button button-secondary button-small" onClick={applySuggestedMatches}>Apply suggested matches</button>
        </div>
        <div className="table-scroll disposal-match-table-wrap">
          <table className="asset-table disposal-match-table">
            <thead><tr><th>Invoice Item</th><th>Qty</th><th className="disposal-amount-cell">e‑Tax amount</th><th>Company Asset · Active</th></tr></thead>
            <tbody>{invoice.items.map((item) => {
              const selectedAssetId = form.itemAssetMap[item.itemNo] || ''
              const usedByOtherItem = new Set(Object.entries(form.itemAssetMap).filter(([itemNo, assetId]) => itemNo !== String(item.itemNo) && assetId).map(([, assetId]) => assetId))
              const options = eligible.filter((asset) => !usedByOtherItem.has(asset.assetId) || asset.assetId === selectedAssetId)
              return <tr key={item.itemNo}>
                <td><strong>Item {item.itemNo}</strong><span className="disposal-item-description">{item.description}</span></td>
                <td>{item.quantity ?? '—'}</td>
                <td className="disposal-amount-cell">{formatMoney(item.amount)}</td>
                <td><select aria-label={`Asset matched to Invoice Item ${item.itemNo}`} value={selectedAssetId} onChange={(event) => setItemAsset(item.itemNo, event.target.value)}>
                  <option value="">Select Active Company Asset</option>
                  {options.map((asset) => <option key={asset.assetId} value={asset.assetId}>{asset.assetId} · {asset.name}{asset.parentAssetId ? ' · Sub Asset' : ''}</option>)}
                </select></td>
              </tr>
            })}</tbody>
          </table>
        </div>
        {!eligible.length ? <p className="disposal-inline-note">No Active Company Assets are available to match. Customer Assets and non-Active records are excluded.</p> : null}
        <div className="disposal-link-count"><Icon name="link" size={15} /><span>{mappings.length} of {invoice.items.length} Invoice Items matched · Each saved match keeps its Invoice Item and Asset references together</span></div>
      </section> : null}

      {invoice ? <section className="panel form-section">
        <div className="form-section-heading"><span className="form-section-icon disposal-step-icon">3</span><div><h2>ตรวจทานและยืนยัน Verify Sale</h2><p>ตรวจว่ารายการ Asset ที่จับคู่เป็นรายการที่ขายตาม Invoice นี้จริง</p></div></div>
        <div className="disposal-verify-block">
          <label className="disposal-verified"><input type="checkbox" name="saleVerified" checked={form.saleVerified} onChange={(event) => changeForm({ saleVerified: event.target.checked })} />ยืนยันว่า Asset ที่จับคู่ขายตาม Invoice นี้ และผ่าน Verify Sale แล้ว</label>
          <Field label="Verified by" required><input name="verifiedBy" value={form.verifiedBy} onChange={(event) => changeForm({ verifiedBy: event.target.value })} maxLength={100} placeholder="ชื่อผู้ตรวจสอบการขาย" required /></Field>
        </div>
      </section> : null}

      {invoice ? <section className="panel form-section">
        <div className="form-section-heading"><span className="form-section-icon disposal-step-icon">4</span><div><h2>เลือกเดือนสุดท้ายของ DP</h2><p>วันขายอ้างอิงจากวันที่ออก Tax Invoice · ไม่คำนวณรายวัน</p></div></div>
        <div className="disposal-cutoff-context"><DetailValue label="Sale / derecognition date · e‑Tax" value={formatDate(invoice.issueDate)} /><DetailValue label="Sale month" value={invoice.issueDate.slice(0, 7)} /></div>
        <div className="disposal-cutoff-options" role="radiogroup" aria-label="Last depreciation month">
          <label className={form.convention === 'include-sale-month' ? 'is-selected' : ''}>
            <input type="radio" name="convention" value="include-sale-month" checked={form.convention === 'include-sale-month'} onChange={(event) => changeForm({ convention: event.target.value })} />
            <span><strong>รวมเดือนขาย</strong><small>ใช้เดือน {invoice.issueDate.slice(0, 7)} เป็นเดือนสุดท้ายของ DP แบบเต็มเดือน</small></span>
          </label>
          <label className={form.convention === 'exclude-sale-month' ? 'is-selected' : ''}>
            <input type="radio" name="convention" value="exclude-sale-month" checked={form.convention === 'exclude-sale-month'} onChange={(event) => changeForm({ convention: event.target.value })} />
            <span><strong>หยุดก่อนเดือนขาย</strong><small>ใช้เดือนก่อนหน้าเป็นเดือนสุดท้ายของ DP</small></span>
          </label>
        </div>
        <div className="form-grid disposal-remark-grid"><Field label="Remark"><textarea name="remark" value={form.remark} onChange={(event) => changeForm({ remark: event.target.value })} maxLength={2000} rows={2} /></Field></div>
      </section> : null}

      {error ? <div className="form-error" role="alert">{error}</div> : null}

      {review ? <section className="panel form-section disposal-review-section">
        <div className="form-section-heading"><span className="form-section-icon disposal-step-icon">5</span><div><h2>ตรวจทานก่อน Derecognize</h2><p>{review.length} Invoice Item ↔ Asset match{review.length === 1 ? '' : 'es'} จะถูกบันทึกในประวัติ Disposal</p></div></div>
        <div className="disposal-review-invoice"><strong>{invoice.taxInvoiceNo}</strong><span>{invoice.buyer}</span><span>{formatDate(invoice.issueDate)}</span><span>{formatMoney(invoice.totalAmount)} · Invoice total</span></div>
        <div className="disposal-review-matches">{review.map((record) => {
          const remainingSubAssets = assets.filter((asset) => asset.parentAssetId === record.assetId && asset.status !== 'Sold')
          return <div className="disposal-review-match" key={record.invoiceItemAssetLink.invoiceItemNo}>
            <div><span>Invoice Item {record.invoiceItemAssetLink.invoiceItemNo}</span><strong>{record.invoiceItemAssetLink.description}</strong><small>{formatMoney(record.invoiceItemAssetLink.itemAmount)} · e‑Tax reference</small></div>
            <Icon name="link" size={17} />
            <div><span>Asset to be Sold</span><strong>{record.assetId} · {record.assetName}</strong><small>{record.assignmentSnapshot.location || 'Location not recorded'}</small>{remainingSubAssets.length ? <small>Sub Assets remain: {remainingSubAssets.map((asset) => asset.assetId).join(', ')}</small> : null}</div>
            <span className="disposal-match-check"><Icon name="check" size={15} /> Verified</span>
          </div>
        })}</div>
        <DisposalSummary record={review[0]} />
        <p className="disposal-inline-note">ยืนยันแล้ว Asset ที่จับคู่เท่านั้นจะเปลี่ยนเป็น Sold และหยุด DP ตามเดือนที่เลือก · Sub Assets ที่ไม่ได้จับคู่จะคงสถานะเดิม</p>
        <div className="disposal-confirm"><button type="button" className="button button-secondary" onClick={() => setReview(null)}>Back to edit</button><button type="button" className="button button-primary" onClick={confirm}>Confirm · Derecognize and mark Sold</button></div>
      </section> : <div className="movement-submit-bar create-asset-submit-bar">
        <span><Icon name="info" size={16} />{invoice ? `${mappings.length} Asset match${mappings.length === 1 ? '' : 'es'} ready for review` : 'Select an e‑Tax Invoice to begin'}</span>
        <button type="submit" className="button button-primary" disabled={!readyToReview}>Review disposal</button>
      </div>}
    </form>

    <section className="panel form-section disposal-history">
      <div className="form-section-heading"><span className="form-section-icon"><Icon name="clock" size={18} /></span><div><h2>Disposal history</h2><p>{history.length} sold Asset record{history.length === 1 ? '' : 's'} · Invoice Item ↔ Asset link retained</p></div></div>
      {history.length ? history.map((item) => {
        const record = item.disposalRecord
        const match = record.invoiceItemAssetLink
        return <details key={item.assetId}>
          <summary>{match ? `${match.taxInvoiceNo} · Item ${match.invoiceItemNo} ↔ ${item.assetId}` : `${record.taxInvoiceNo || 'Tax Invoice'} · ${item.assetId}`} · Sold · {record.soldOn}</summary>
          <DisposalSummary record={record} />
        </details>
      }) : <p>No disposal history yet.</p>}
    </section>
  </div>
}
