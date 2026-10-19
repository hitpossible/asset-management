import { useState } from 'react'
import { DetailValue, Field, PageHeading } from '../components/common.jsx'
import Icon from '../components/Icon.jsx'
import StatusBadge from '../components/StatusBadge.jsx'
import DisposalSummary from '../components/DisposalSummary.jsx'
import { MOCK_SALE_PROPOSALS, MOCK_TAX_INVOICES } from '../data/mockTaxInvoices.js'
import { formatDate } from '../utils/assetUtils.js'
import { disposalCutoff, prepareInvoiceDisposals, previewInvoiceDisposals } from '../utils/disposalUtils.js'

const emptyForm = () => ({ documentType: 'proposal', documentNo: '', linkedInvoiceNo: '', saleVerified: false, convention: '', remark: '' })
const formatMoney = (amount) => amount == null ? '—' : `฿ ${new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(amount)}`
const proposalInvoicesFor = (proposal) => MOCK_TAX_INVOICES.filter((invoice) => invoice.saleProposalNo === proposal?.saleProposalNo && invoice.saleProposalStatus === 'Approved')

function ResultValue({ row }) {
  if (!row.gainLossResult) return <span className="disposal-result-empty">เลือกเดือน DP</span>
  if (row.gainLossResult === 'Break-even') return <span className="disposal-result is-even">เท่าทุน</span>
  return <span className={`disposal-result ${row.gainLossResult === 'Profit' ? 'is-profit' : 'is-loss'}`}>
    <strong>{row.gainLossResult === 'Profit' ? 'กำไร' : 'ขาดทุน'}</strong>
    <span>{formatMoney(Math.abs(row.gainLossValue))}</span>
  </span>
}

function getAssetReadinessIssue(row) {
  if (!row.asset) return 'ไม่พบ Asset ในทะเบียน'
  if (!row.eligible) return row.status === 'Active' ? 'Customer Asset ไม่อยู่ในขอบเขต Disposal' : `สถานะปัจจุบันคือ ${row.status}`
  const missing = []
  if (row.assetValue == null) missing.push('Asset Value')
  if (!row.usefulLifeYears) missing.push('Useful Life')
  if (!row.depreciationStartDate) missing.push('Depreciation Start Date')
  if (row.netBookValue === null && !missing.length) missing.push('คำนวณ Net Value ไม่สำเร็จ')
  return missing.length ? `ข้อมูลไม่ครบ: ${missing.join(', ')}` : ''
}

export default function DisposalPage({ assets, assetTypes, purchaseOrders, onSave }) {
  const [form, setForm] = useState(emptyForm)
  const [error, setError] = useState('')
  const [review, setReview] = useState(null)
  const [completed, setCompleted] = useState(null)

  const proposal = form.documentType === 'proposal'
    ? MOCK_SALE_PROPOSALS.find((item) => item.saleProposalNo === form.documentNo)
    : null
  const proposalInvoices = proposalInvoicesFor(proposal)
  const linkedInvoiceNo = form.linkedInvoiceNo || (proposalInvoices.length === 1 ? proposalInvoices[0].taxInvoiceNo : '')
  const invoice = form.documentType === 'invoice'
    ? MOCK_TAX_INVOICES.find((item) => item.taxInvoiceNo === form.documentNo)
    : proposalInvoices.find((item) => item.taxInvoiceNo === linkedInvoiceNo)
  const invoiceProposal = invoice && MOCK_SALE_PROPOSALS.find((item) => item.saleProposalNo === invoice.saleProposalNo)
  const invoiceItemsComplete = Boolean(invoice?.items?.length && invoice.items.every((item) => item.assetId))
  const soldAssetIds = [...new Set((invoice?.items || []).map((item) => String(item.assetId || '')).filter(Boolean))]
  const saleRows = previewInvoiceDisposals(invoice, soldAssetIds, assets, assetTypes, purchaseOrders, form.convention)
  const readinessIssues = saleRows.map((row) => ({ row, issue: getAssetReadinessIssue(row) })).filter((item) => item.issue)
  const assetsReady = invoiceItemsComplete && saleRows.length > 0 && readinessIssues.length === 0 && saleRows.every((row) => row.gainLossValue !== null)
  const readyToReview = Boolean(invoice && assetsReady && form.convention && form.saleVerified)
  const history = assets
    .filter((item) => item.disposalRecord)
    .sort((a, b) => String(b.disposalRecord.completedAt || '').localeCompare(String(a.disposalRecord.completedAt || '')))
  const flowSteps = ['Select Sale Proposal or Invoice', 'Review Assets and allocation', 'Choose final DP month', 'Verify sale', 'Submit and update status']
  const flowComplete = completed?.length
    ? flowSteps.map(() => true)
    : [Boolean(invoice), Boolean(invoice && invoiceItemsComplete && saleRows.length), Boolean(form.convention && assetsReady), form.saleVerified, false]

  function changeForm(changes) {
    setForm((current) => ({ ...current, ...changes }))
    setError('')
    setReview(null)
    setCompleted(null)
  }

  function selectDocumentType(event) {
    changeForm({ documentType: event.target.value, documentNo: '', linkedInvoiceNo: '', saleVerified: false, convention: '' })
  }

  function selectDocument(event) {
    changeForm({ documentNo: event.target.value, linkedInvoiceNo: '', saleVerified: false, convention: '' })
  }

  function prepareForm() {
    return {
      proposal: proposal || invoiceProposal,
      invoice,
      assetIds: soldAssetIds,
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

  const allocationPerAsset = invoice && soldAssetIds.length ? Number(invoice.amountBeforeVat) / soldAssetIds.length : null
  const disposalDate = invoice?.issueDate || ''

  return <div className="create-asset-workspace disposal-workspace">
    <PageHeading eyebrow="Asset management" title="Disposal / Sale" description="เลือก Sale Proposal หรือ Tax Invoice เพื่อดู Asset ที่ขาย แบ่งยอดก่อน VAT เท่ากัน และบันทึกผลกำไรหรือขาดทุนก่อนเปลี่ยนสถานะเป็น Sold" />

    <ol className="disposal-flow" aria-label="Sale disposal process">
      {flowSteps.map((step, index) => <li key={step} className={flowComplete[index] ? 'is-complete' : ''} aria-current={!flowComplete[index] && (index === 0 || flowComplete.slice(0, index).every(Boolean)) ? 'step' : undefined}>
        <span>{flowComplete[index] ? <Icon name="check" size={15} /> : index + 1}</span>{step}
      </li>)}
    </ol>

    <div className="mis-reference-note disposal-intro-note"><Icon name="info" size={16} />รายการ Asset อ้างอิงจากเอกสารขายที่อนุมัติแล้ว ระบบแบ่งยอด Invoice ก่อน VAT เท่ากันทุก Asset และใช้ Net Value ณ เดือน DP สุดท้ายที่เลือกเพื่อคำนวณกำไรหรือขาดทุน</div>

    {completed?.length ? <div role="status">
      <div className="disposal-success"><Icon name="check" size={20} /><strong>{completed.length} Asset{completed.length === 1 ? '' : 's'} · Sold</strong><span>ปรับสถานะแล้ว หยุด DP และเก็บประวัติการขายพร้อมผลกำไร/ขาดทุน</span></div>
      {completed.map((record) => <DisposalSummary key={record.transactionNo} record={record} />)}
      <button type="button" className="button button-secondary disposal-next-action" onClick={() => { setCompleted(null); setError('') }}>Start another disposal</button>
    </div> : null}

    <form className="create-asset-form" onSubmit={preview}>
      <section className="panel form-section">
        <div className="form-section-heading">
          <span className="form-section-icon disposal-step-icon">1</span>
          <div><h2>เลือกเอกสารขาย</h2><p>เลือก Sale Proposal ที่อนุมัติแล้ว หรือ Tax Invoice จาก e‑Tax</p></div>
        </div>
        <div className="disposal-document-select">
          <div className="disposal-document-types" role="radiogroup" aria-label="Sale reference type">
            <label className={form.documentType === 'proposal' ? 'is-selected' : ''}><input type="radio" name="documentType" value="proposal" checked={form.documentType === 'proposal'} onChange={selectDocumentType} /><span>Sale Proposal</span></label>
            <label className={form.documentType === 'invoice' ? 'is-selected' : ''}><input type="radio" name="documentType" value="invoice" checked={form.documentType === 'invoice'} onChange={selectDocumentType} /><span>Tax Invoice</span></label>
          </div>
          <Field label={form.documentType === 'proposal' ? 'Sale Proposal (Approved)' : 'Tax Invoice (e‑Tax)'} required>
            <select name="documentNo" value={form.documentNo} onChange={selectDocument} required>
              <option value="">{form.documentType === 'proposal' ? 'Select an approved Sale Proposal' : 'Select a Tax Invoice'}</option>
              {form.documentType === 'proposal'
                ? MOCK_SALE_PROPOSALS.filter((item) => item.status === 'Approved').map((item) => <option key={item.saleProposalNo} value={item.saleProposalNo}>{item.saleProposalNo} · {item.buyer} · {item.assetIds.length} Assets</option>)
                : MOCK_TAX_INVOICES.filter((item) => item.saleProposalStatus === 'Approved').map((item) => <option key={item.taxInvoiceNo} value={item.taxInvoiceNo}>{item.taxInvoiceNo} · {item.saleProposalNo} · {formatDate(item.issueDate)}</option>)}
            </select>
          </Field>
          {proposal && proposalInvoices.length > 1 ? <Field label="Tax Invoice for allocation" required>
            <select value={form.linkedInvoiceNo} onChange={(event) => changeForm({ linkedInvoiceNo: event.target.value, convention: '', saleVerified: false })} required>
              <option value="">Select a linked Tax Invoice</option>
              {proposalInvoices.map((item) => <option key={item.taxInvoiceNo} value={item.taxInvoiceNo}>{item.taxInvoiceNo} · {formatMoney(item.amountBeforeVat)} before VAT</option>)}
            </select>
          </Field> : null}
        </div>
        {proposal && proposalInvoices.length === 0 ? <div className="disposal-warning-note"><Icon name="info" size={16} />ยังไม่มี Tax Invoice ที่เชื่อมกับ Proposal นี้ จึงยังคำนวณยอดขายก่อน VAT ไม่ได้</div> : null}
        {invoice ? <div className="disposal-etax-summary" aria-label="Selected sale document details">
          <DetailValue label="Sale Proposal (Approved)" value={invoice.saleProposalNo} />
          <DetailValue label="Tax Invoice No." value={invoice.taxInvoiceNo} />
          <DetailValue label="Buyer / ผู้ซื้อ" value={invoice.buyer} />
          <DetailValue label="Invoice date" value={formatDate(invoice.issueDate)} />
          <DetailValue label="Invoice amount before VAT" value={formatMoney(invoice.amountBeforeVat)} />
          <DetailValue label="VAT amount" value={formatMoney(invoice.vatAmount)} />
          <DetailValue label="Invoice total · including VAT" value={formatMoney(invoice.totalAmount)} />
          <DetailValue label="Assets on invoice" value={`${soldAssetIds.length} Asset${soldAssetIds.length === 1 ? '' : 's'}`} />
        </div> : <div className="disposal-invoice-empty"><Icon name="file" size={19} /><span>เลือกเอกสารขายเพื่อแสดง Asset ที่อยู่ใน Invoice และยอดก่อน VAT</span></div>}
      </section>

      {invoice ? <>
        <section className="panel form-section">
          <div className="form-section-heading disposal-section-heading-spread">
            <div className="disposal-section-title"><span className="form-section-icon disposal-step-icon">2</span><div><h2>รายการ Asset ที่ขายและการแบ่งยอด</h2><p>ระบบแสดง Asset จาก Invoice และจัดสรรยอดก่อน VAT เท่ากันต่อ Asset</p></div></div>
          </div>
          <div className="disposal-allocation-banner" aria-label="Equal invoice allocation">
            <div><span>ยอด Invoice ก่อน VAT</span><strong>{formatMoney(invoice.amountBeforeVat)}</strong></div>
            <b aria-hidden="true">÷</b>
            <div><span>จำนวน Asset</span><strong>{soldAssetIds.length}</strong></div>
            <b aria-hidden="true">=</b>
            <div className="disposal-allocation-per-asset"><span>ยอดขายต่อ Asset</span><strong>{formatMoney(allocationPerAsset)}</strong></div>
          </div>
          <div className="table-scroll disposal-match-table-wrap">
            <table className="asset-table disposal-match-table disposal-financial-table">
              <thead><tr><th>Asset ที่ขาย</th><th>สถานะ</th><th className="disposal-amount-cell">Net Value ณ วันขาย</th><th className="disposal-amount-cell">ยอดขายก่อน VAT</th><th>ผลต่างจาก Net Value</th></tr></thead>
              <tbody>{saleRows.map((row) => <tr key={row.assetId}>
                <td><strong>{row.asset?.assetId || row.assetId}</strong><span className="disposal-item-description">{row.asset?.name || 'ไม่พบ Asset ในทะเบียน'}</span><small className="disposal-item-description">{row.asset?.assetClass || 'ตรวจสอบ Asset reference'}</small></td>
                <td>{row.asset ? <StatusBadge status={row.status} /> : <span className="disposal-result-empty">ไม่พบข้อมูล</span>}</td>
                <td className="disposal-amount-cell">{row.netBookValue === null ? <span className="disposal-result-empty">เลือกเดือน DP</span> : formatMoney(row.netBookValue)}</td>
                <td className="disposal-amount-cell">{formatMoney(row.saleAllocation)}</td>
                <td><ResultValue row={row} /></td>
              </tr>)}</tbody>
            </table>
          </div>
          <div className="disposal-link-count"><Icon name="info" size={15} /><span>ยอดจัดสรรต่อ Asset = Invoice amount before VAT ÷ จำนวน Asset · กำไร/ขาดทุน = ยอดขายก่อน VAT ที่จัดสรร − Net Value · ไม่ใช้ยอดราย Item และไม่รวม VAT</span></div>
          {!invoiceItemsComplete ? <div className="disposal-warning-note"><Icon name="info" size={16} />Invoice นี้มีรายการที่ยังไม่เชื่อมกับ Asset จึงยังจัดสรรยอดขายครบทุกตัวไม่ได้</div> : null}
          {!assetsReady && form.convention ? <div className="disposal-warning-note"><Icon name="info" size={16} /><div><strong>ยังบันทึก Disposal ไม่ได้</strong><span>ตรวจสอบข้อมูลต่อไปนี้แล้วลองอีกครั้ง</span><ul>{readinessIssues.map(({ row, issue }) => <li key={row.assetId}>{row.assetId}: {issue}</li>)}</ul></div></div> : null}
        </section>

        <section className="panel form-section">
          <div className="form-section-heading"><span className="form-section-icon disposal-step-icon">3</span><div><h2>เลือกเดือนสุดท้ายของ DP</h2><p>วันขายอ้างอิงจากวันที่ออก Tax Invoice · ไม่คำนวณรายวัน</p></div></div>
          <div className="disposal-cutoff-context"><DetailValue label="Sale / derecognition date · e‑Tax" value={formatDate(disposalDate)} /><DetailValue label="Sale month" value={disposalDate.slice(0, 7)} /></div>
          <div className="disposal-cutoff-options" role="radiogroup" aria-label="Last depreciation month">
            <label className={form.convention === 'include-sale-month' ? 'is-selected' : ''}>
              <input type="radio" name="convention" value="include-sale-month" checked={form.convention === 'include-sale-month'} onChange={(event) => changeForm({ convention: event.target.value })} />
              <span><strong>รวมเดือนขาย</strong><small>ใช้เดือน {disposalDate.slice(0, 7)} เป็นเดือนสุดท้ายของ DP แบบเต็มเดือน</small></span>
            </label>
            <label className={form.convention === 'exclude-sale-month' ? 'is-selected' : ''}>
              <input type="radio" name="convention" value="exclude-sale-month" checked={form.convention === 'exclude-sale-month'} onChange={(event) => changeForm({ convention: event.target.value })} />
              <span><strong>หยุดก่อนเดือนขาย</strong><small>ใช้เดือนก่อนหน้าเป็นเดือนสุดท้ายของ DP</small></span>
            </label>
          </div>
          {form.convention ? <p className="disposal-inline-note">Net Value และผลกำไร/ขาดทุนคำนวณถึง {formatDate(disposalCutoff(disposalDate, form.convention))}</p> : <p className="disposal-inline-note">เลือกเดือน DP เพื่อคำนวณ Net Value และผลกำไร/ขาดทุนต่อ Asset</p>}
        </section>

        <section className="panel form-section">
          <div className="form-section-heading"><span className="form-section-icon disposal-step-icon">4</span><div><h2>ยืนยันผล Verify Sale</h2><p>ตรวจสอบว่า Asset ตามเอกสารขายได้รับการยืนยันการขายแล้ว</p></div></div>
          <div className="disposal-verify-block">
            <label className="disposal-verified"><input type="checkbox" name="saleVerified" checked={form.saleVerified} onChange={(event) => changeForm({ saleVerified: event.target.checked })} />ยืนยันว่า Asset ทั้งหมดในรายการขายผ่าน Verify Sale แล้ว</label>
          </div>
          <div className="form-grid disposal-remark-grid"><Field label="Remark"><textarea name="remark" value={form.remark} onChange={(event) => changeForm({ remark: event.target.value })} maxLength={2000} rows={2} /></Field></div>
        </section>
      </> : null}

      {error ? <div className="form-error" role="alert">{error}</div> : null}

      {review ? <section className="panel form-section disposal-review-section">
        <div className="form-section-heading"><span className="form-section-icon disposal-step-icon">5</span><div><h2>ตรวจทานก่อนเปลี่ยนสถานะ</h2><p>{review.length} Asset จะเปลี่ยนเป็น Sold และเก็บ financial snapshot รายตัว</p></div></div>
        <div className="disposal-review-invoice"><strong>{invoice.saleProposalNo}</strong><span>{invoice.taxInvoiceNo}</span><span>{invoice.buyer}</span><span>{formatMoney(invoice.amountBeforeVat)} · before VAT</span></div>
        <div className="disposal-review-asset-list">{review.map((record) => {
          const mainAssetId = record.assignmentSnapshot.parentAssetId || record.assetId
          const remainingSubAssets = assets.filter((asset) => asset.parentAssetId === mainAssetId && asset.assetId !== record.assetId && asset.status !== 'Sold')
          return <div className="disposal-review-asset" key={record.assetId}>
            <div><span>Asset to be Sold</span><strong>{record.assetId} · {record.assetName}</strong><small>{record.assignmentSnapshot.location || 'Location not recorded'}</small></div>
            <div><span>Net Value</span><strong>{formatMoney(record.financialSnapshot.netBookValue)}</strong></div>
            <div><span>Sale amount allocated</span><strong>{formatMoney(record.saleAmount)}</strong></div>
            <div><span>Gain / (loss)</span><strong className={record.gainLossResult === 'Profit' ? 'disposal-profit-text' : record.gainLossResult === 'Loss' ? 'disposal-loss-text' : ''}>{record.gainLossResult === 'Break-even' ? 'เท่าทุน' : `${record.gainLossResult === 'Profit' ? 'กำไร' : 'ขาดทุน'} ${formatMoney(record.gainLossAmount)}`}</strong></div>
            {remainingSubAssets.length ? <small className="disposal-review-subassets">Sub Assets ที่เหลือจะคงสถานะเดิม: {remainingSubAssets.map((asset) => asset.assetId).join(', ')}</small> : null}
          </div>
        })}</div>
        <p className="disposal-inline-note">ยืนยันแล้ว Asset ในรายการข้างต้นเท่านั้นจะเปลี่ยนเป็น Sold และหยุด DP ตามเดือนที่เลือก</p>
        <div className="disposal-confirm"><button type="button" className="button button-secondary" onClick={() => setReview(null)}>Back to edit</button><button type="button" className="button button-primary" onClick={confirm}>Confirm · Derecognize and mark Sold</button></div>
      </section> : <div className="movement-submit-bar create-asset-submit-bar">
        <span><Icon name="info" size={16} />{invoice ? `${soldAssetIds.length} Asset${soldAssetIds.length === 1 ? '' : 's'} in sale · ${form.convention ? 'Net Value calculated' : 'Choose final DP month'}` : 'Select an approved Sale Proposal or Tax Invoice to begin'}</span>
        <button type="submit" className="button button-primary" disabled={!readyToReview}>Review disposal</button>
      </div>}
    </form>

    <section className="panel form-section disposal-history">
      <div className="form-section-heading"><span className="form-section-icon"><Icon name="clock" size={18} /></span><div><h2>Disposal history</h2><p>{history.length} sold Asset record{history.length === 1 ? '' : 's'} · Sale references and financial result retained</p></div></div>
      {history.length ? history.map((item) => {
        const record = item.disposalRecord
        return <details key={item.assetId}>
          <summary>{record.saleProposalNo || record.taxInvoiceNo || 'Sale'} · {item.assetId} · Sold · {record.gainLossResult === 'Profit' ? 'กำไร' : record.gainLossResult === 'Loss' ? 'ขาดทุน' : record.gainLossResult || ''} · {record.soldOn}</summary>
          <DisposalSummary record={record} />
        </details>
      }) : <p>No disposal history yet.</p>}
    </section>
  </div>
}
