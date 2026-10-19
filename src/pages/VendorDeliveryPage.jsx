import { useRef, useState } from 'react'
import { readInvoiceAttachment } from '../utils/invoiceAttachmentUtils.js'
import { Field } from '../components/common.jsx'
import Icon from '../components/Icon.jsx'
import { useMISPurchasingStore } from '../hooks/useMISPurchasingStore.js'
import { vendorDemoPO, vendorDemoInvoice } from '../data/mockVendorDelivery.js'
import { deliveryItemKey, summarizeVendorDelivery, validateVendorInvoice, validateVendorBatch } from '../utils/vendorDeliveryUtils.js'
import './VendorDeliveryPage.css'

const money = (value) => Number(value).toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
const today = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Bangkok', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date())

function sampleDocument(po, part, documentName) {
  const rows = (po.assetItems || []).map((item) => ({ key: deliveryItemKey(item), quantity: Number(item.orderedQuantity ?? item.quantity ?? 1) }))
  const firstAmount = Math.floor(Number(po.referenceTotal) * 100 / 2) / 100
  return {
    poNo: po.poNo,
    reference: po.poNo === vendorDemoPO.poNo ? `INV-DEMO-00${part}` : `SCAN-DEMO-${po.poNo}-${part}`,
    date: today(), amount: part === 1 ? firstAmount : Number(po.referenceTotal) - firstAmount,
    documentName: documentName || `Invoice-example-${part}.pdf`, isScanDemo: true,
    items: rows.map((row) => ({ key: row.key, quantity: part === 1 ? Math.floor(row.quantity / 2) : row.quantity - Math.floor(row.quantity / 2) })),
  }
}

function InvoiceCard({ invoice, po, onRemove }) {
  return <article className="vendor-invoice-card">
    <span className="vendor-document-icon"><Icon name="file" size={23} /></span>
    <div className="vendor-invoice-copy"><strong>{invoice.reference}</strong><span>{invoice.documentName}</span><small>PO {invoice.poNo} · {invoice.date}{invoice.isScanDemo ? ' · ข้อมูลจากการอ่านจำลอง' : ''}</small>
      <ul>{(invoice.items || []).filter((item) => item.quantity > 0).map((item) => <li key={item.key}>{po.assetItems.find((row) => deliveryItemKey(row) === item.key)?.assetName || `Item ${item.key}`} <b>× {item.quantity}</b></li>)}</ul>
    </div><div className="vendor-invoice-side"><strong>฿ {money(invoice.amount)}</strong>{onRemove ? <button type="button" className="vendor-remove" onClick={onRemove}><Icon name="close" size={16} />ลบจากรอบนี้</button> : <span className="vendor-locked"><Icon name="check" size={14} />ส่งแล้ว</span>}</div>
  </article>
}

export default function VendorDeliveryPage() {
  const { purchaseOrders, vendorInvoices, addVendorInvoices, storageFailed } = useMISPurchasingStore()
  const [query, setQuery] = useState(() => new URLSearchParams(window.location.search).get('po') || '')
  const [poNo, setPONo] = useState(() => [vendorDemoPO, ...purchaseOrders].find((order) => order.poNo.toLowerCase() === query.trim().toLowerCase())?.poNo || '')
  const [demoInvoices, setDemoInvoices] = useState([vendorDemoInvoice])
  const [pending, setPending] = useState([])
  const [scanFile, setScanFile] = useState(null)
  const [scanBusy, setScanBusy] = useState(false)
  const scanPending = useRef(false)
  const [scanFileKey, setScanFileKey] = useState(0)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [step, setStep] = useState(() => poNo ? 2 : 1)
  const orders = [vendorDemoPO, ...purchaseOrders]
  const po = orders.find((order) => order.poNo === poNo)
  const invoices = poNo === vendorDemoPO.poNo ? demoInvoices : vendorInvoices.filter((invoice) => invoice.poNo === poNo)
  const summary = po ? summarizeVendorDelivery(po, invoices) : null
  const projected = po ? summarizeVendorDelivery(po, [...invoices, ...pending]) : null
  const pendingAmount = pending.reduce((total, invoice) => total + invoice.amount, 0)
  const allowed = po?.status === 'Approved' && !summary?.complete
  const nextSamplePart = po ? [1, 2].find((part) => ![...invoices, ...pending].some((row) => row.reference === sampleDocument(po, part).reference)) : null

  function clearScan() { setScanFile(null); setScanFileKey((value) => value + 1) }
  function openPO(value) {
    if (scanPending.current) return
    if (pending.length || scanFile) { setError('กรุณา Submit หรือลบ Invoice ในรอบนี้ก่อนเปลี่ยน PO'); return }
    const found = orders.find((order) => order.poNo.toLowerCase() === value.trim().toLowerCase())
    if (!found) { setError('ไม่พบเลข PO นี้ กรุณาตรวจสอบเอกสาร PO'); return }
    setPONo(found.poNo); setQuery(found.poNo); setStep(2); setError(''); setNotice('');
  }
  async function scanExample(part) {
    if (scanPending.current) return
    const invoice = sampleDocument(po, part, scanFile?.name)
    const issue = validateVendorInvoice(po, [...invoices, ...pending], invoice)
    if (issue) { setError(issue); return }
    if (scanFile && [...invoices, ...pending].some((row) => row.documentName === scanFile.name)) { setError('เอกสารนี้ถูกสแกนแล้ว กรุณาเลือกเอกสารอื่น'); return }
    scanPending.current = true
    setScanBusy(true)
    try {
      const attachment = scanFile ? await readInvoiceAttachment(scanFile) : null
      setPending((current) => [...current, { ...invoice, ...(attachment ? { attachment } : {}) }])
      clearScan(); setError(''); setNotice('')
    } catch (error) { setError(error.message) }
    finally { scanPending.current = false; setScanBusy(false) }
  }
  function removePending(reference) {
    setPending((current) => current.filter((invoice) => invoice.reference !== reference)); setError(''); setNotice('')
  }
  function submit() {
    if (scanPending.current) return
    const issue = validateVendorBatch(po, invoices, pending)
    if (issue) { setError(issue); return }
    const roundId = crypto.randomUUID()
    const records = pending.map((invoice) => ({ ...invoice, roundId, submittedAt: new Date().toISOString() }))
    if (poNo === vendorDemoPO.poNo) setDemoInvoices((current) => [...current, ...records])
    else addVendorInvoices(records)
    setPending([]); clearScan(); setError(''); setStep(5)
    setNotice(projected.complete ? 'ส่งครบแล้ว รอ PU และ Asset Owner ตรวจรับ' : 'Submit สำเร็จ ส่งบางส่วนแล้ว สามารถนำ Invoice รอบถัดไปมาสแกนเพิ่มได้')
  }

  function moveStep(next) { setError(''); setStep(next) }
  const stepLabels = ['กรอกเลข PO', 'ข้อมูล PO', 'สแกน Invoice', 'ตรวจสอบและยืนยัน']

  return <div className="vendor-page">
    {storageFailed ? <p className="asset-storage-notice" role="status">บันทึกได้เฉพาะรอบนี้: พื้นที่จัดเก็บของเบราว์เซอร์เต็มหรือไม่พร้อมใช้งาน ข้อมูล Delivery และไฟล์ Invoice จะหายเมื่อโหลดหน้าใหม่</p> : null}
    <header className="vendor-header"><div className="vendor-brand">TBKK</div><span>Vendor Receiving</span><span className="vendor-header-right">หน้าสำหรับผู้ส่งสินค้า</span></header>
    <main className="vendor-main">
      <ol className="vendor-steps" aria-label="ขั้นตอนแจ้งส่งสินค้า">{stepLabels.map((label, index) => <li key={label} className={step === index + 1 ? 'current' : step > index + 1 ? 'done' : ''}><span>{step > index + 1 ? <Icon name="check" size={15} /> : index + 1}</span><strong>{label}</strong></li>)}</ol>
      <section className={`vendor-screen ${step === 1 ? 'vendor-welcome' : ''}`}>
        {step > 1 && step < 5 ? <div className="vendor-screen-nav"><button type="button" className="vendor-text-button" onClick={() => moveStep(step - 1)}><Icon name="chevron" size={16} className="vendor-back-icon" />กลับ</button><span>{poNo}</span></div> : null}
        {error ? <div className="vendor-alert" role="alert"><Icon name="alert" size={19} />{error}</div> : null}
        {step === 1 ? <>
          <div className="vendor-welcome-heading"><span className="vendor-welcome-icon"><Icon name="truck" size={36} /></span><h1>ยินดีต้อนรับ</h1><p>กรอกหรือสแกนเลขที่ใบสั่งซื้อ (PO) เพื่อเริ่มส่งสินค้า</p></div>
          <form className="vendor-po-form" onSubmit={(event) => { event.preventDefault(); openPO(query) }}><Field label="เลขที่ใบสั่งซื้อ (PO)"><div className="vendor-po-input"><Icon name="search" size={23} /><input autoFocus value={query} onChange={(event) => setQuery(event.target.value)} placeholder="เช่น PO-2026-0117" required /><button type="button" aria-label="ล้างเลข PO" onClick={() => setQuery('')}><Icon name="close" size={18} /></button></div></Field><button type="submit" className="vendor-primary"><Icon name="search" size={19} />ค้นหาข้อมูล PO</button></form>
          <div className="vendor-howto"><Icon name="info" size={22} /><div><h2>วิธีใช้งาน</h2><ol><li>ค้นหาเลข PO ที่นำมาส่ง</li><li>ตรวจสอบข้อมูล PO แล้วสแกน Invoice</li><li>ตรวจข้อมูลที่อ่านได้ แล้วกดยืนยันส่ง</li></ol></div></div>
        </> : null}
        {step === 2 && po ? <>
          <div className="vendor-po-heading"><h1>{po.poNo}</h1><span className={`vendor-status ${po.status === 'Approved' ? 'success' : ''}`}>{po.status === 'Approved' ? 'อนุมัติแล้ว' : 'รออนุมัติ'}</span></div>
          <div className="vendor-po-meta"><div><span>ผู้ขาย</span><strong>{po.vendor}</strong></div><div><span>วันที่สั่งซื้อ</span><strong>{po.orderDate || '—'}</strong></div></div>
          <div className="vendor-po-metrics"><div><Icon name="box" size={25} /><span>จำนวนรายการ<strong>{summary.rows.length} รายการ</strong></span></div><div><Icon name="receipt" size={25} /><span>มูลค่ารวม PO<strong>฿ {money(po.referenceTotal)}</strong></span></div></div>
          <div className="vendor-money-line"><span>Invoice ที่ยืนยันแล้ว <strong>฿ {money(summary.deliveredSatang / 100)}</strong></span><span>ยอดคงเหลือ <strong>฿ {money(summary.remainingSatang / 100)}</strong></span></div>
          <h2 className="vendor-table-title">รายการสินค้าใน PO</h2><div className="vendor-table-wrap"><table className="vendor-table"><thead><tr><th>สินค้า / รายการ</th><th>จำนวนสั่งซื้อ</th><th>ส่งแล้ว</th><th>คงเหลือ</th></tr></thead><tbody>{summary.rows.map((row) => <tr key={row.key}><td><strong>{row.assetName || row.assetId}</strong><small>Item {row.key} · {row.unitOfMeasure || 'unit'}</small></td><td>{row.ordered}</td><td>{row.delivered}</td><td><span className={`vendor-qty ${row.remaining === 0 ? 'success' : ''}`}>{row.remaining}</span></td></tr>)}</tbody></table></div>
          <details className="vendor-history"><summary>Invoice ที่ส่งแล้ว ({invoices.length} ใบ)<Icon name="down" size={16} /></summary><div className="vendor-invoice-list">{invoices.map((invoice) => <InvoiceCard key={invoice.reference} invoice={invoice} po={po} />)}{!invoices.length ? <p>ยังไม่มี Invoice ที่ส่งแล้ว</p> : null}</div></details>
          {summary.complete ? <div className="vendor-result success"><Icon name="circle-check" size={25} /><div><strong>ส่งครบตามใบสั่งซื้อแล้ว</strong><span>รอ PU + Asset Owner ตรวจรับ และสร้าง GR ใน MIS</span></div></div> : po.status !== 'Approved' ? <div className="vendor-result"><Icon name="clock" size={25} /><div><strong>PO ยังไม่อนุมัติ</strong><span>กรุณาติดต่อ Purchasing ก่อนส่ง Invoice</span></div></div> : null}
          <div className="vendor-bottom-actions"><button type="button" className="vendor-primary" disabled={!allowed} onClick={() => moveStep(3)}>ถัดไป: สแกน Invoice<Icon name="chevron" size={20} /></button></div>
        </> : null}
        {step === 3 && po ? <>
          <h1>สแกน Invoice</h1><p className="vendor-description">ถ่ายรูปเอกสารหรือเลือกไฟล์ Invoice ที่นำมาส่ง</p>
          <div className="vendor-capture-area"><span className="vendor-document-illustration"><Icon name={pending.length ? 'circle-check' : 'file'} size={64} /></span><h2>{pending.length ? `สแกนแล้ว ${pending.length} ใบ` : 'เพิ่มเอกสาร Invoice'}</h2><p>{pending.length ? 'ตรวจเอกสารด้านล่าง หรือสแกนใบถัดไปได้' : 'ถ่ายรูปให้เห็นเอกสารครบทั้งใบและตัวอักษรชัดเจน'}</p><div className="vendor-upload-actions"><label className="vendor-upload-button primary"><Icon name="camera" size={20} />ถ่ายรูป Invoice<input key={`camera-${scanFileKey}`} type="file" accept="image/*" capture="environment" disabled={scanBusy} onChange={(event) => { setScanFile(event.target.files[0] || null); setError('') }} /></label><label className="vendor-upload-button"><Icon name="file" size={20} />เลือกไฟล์<input key={`file-${scanFileKey}`} type="file" accept="image/jpeg,image/png,image/webp,application/pdf" disabled={scanBusy} onChange={(event) => { setScanFile(event.target.files[0] || null); setError('') }} /></label></div><small>{scanBusy ? 'กำลังอ่านไฟล์ Invoice…' : 'รองรับ JPG, PNG, WebP และ PDF ขนาดไม่เกิน 5 MB'}</small></div>
          {scanFile ? <div className="vendor-selected-file"><Icon name="file" size={19} /><span>{scanFile.name}</span><button type="button" className="vendor-text-button" onClick={clearScan}>ลบเอกสารนี้</button></div> : null}
          <details className="vendor-scan-demo" open={scanFile ? true : undefined}><summary><Icon name="info" size={16} />ทดลองอ่าน Invoice ตัวอย่าง<span>Mockup</span></summary><p>ยังไม่มี OCR จริง ข้อมูลที่อ่านใน mockup เป็นข้อมูลตัวอย่าง</p><button type="button" className="vendor-secondary" aria-label={`จำลองสแกนใบที่ ${nextSamplePart || ''}`} disabled={scanBusy || !nextSamplePart || !allowed} onClick={() => scanExample(nextSamplePart)}><Icon name="file" size={18} />{nextSamplePart ? 'จำลองสแกน Invoice' : 'สแกนเอกสารตัวอย่างครบแล้ว'}</button></details>
          <div className="vendor-invoice-list">{pending.map((invoice) => <InvoiceCard key={invoice.reference} invoice={invoice} po={po} onRemove={() => removePending(invoice.reference)} />)}</div>
          <p className="vendor-lock-note">ข้อมูลจาก Invoice อ่านได้อย่างเดียว · สแกนผิดให้ลบแล้วสแกนใหม่</p>
          <div className="vendor-bottom-actions"><button type="button" className="vendor-primary" disabled={!pending.length || !!scanFile} onClick={() => moveStep(4)}>ถัดไป: ตรวจสอบการส่ง<Icon name="chevron" size={20} /></button></div>
        </> : null}
        {step === 4 && po ? <>
          <h1>ตรวจสอบการส่งครั้งนี้</h1><p className="vendor-description">จำนวนสินค้าและยอดเงินอ่านจาก Invoice กรุณาตรวจสอบก่อนยืนยัน</p>
          <div className="vendor-table-wrap"><table className="vendor-table vendor-review-table"><thead><tr><th>สินค้า / รายการ</th><th>ตาม PO</th><th>ส่งแล้ว</th><th>ส่งครั้งนี้</th><th>รวมส่ง</th><th>ผล</th></tr></thead><tbody>{projected.rows.map((row) => { const prior = summary.rows.find((item) => item.key === row.key); return <tr key={row.key}><td><strong>{row.assetName || row.assetId}</strong><small>Item {row.key}</small></td><td>{row.ordered}</td><td>{prior.delivered}</td><td><span className="vendor-read-qty">{row.delivered - prior.delivered}</span></td><td>{row.delivered}</td><td><span className={`vendor-qty ${row.remaining === 0 ? 'success' : ''}`}>{row.remaining === 0 ? 'ครบตาม PO' : `เหลือ ${row.remaining}`}</span></td></tr> })}</tbody></table></div>
          <div className={`vendor-result ${projected.complete ? 'success' : ''}`}><Icon name={projected.complete ? 'circle-check' : 'info'} size={30} /><div><strong>{projected.complete ? 'ครบตามใบสั่งซื้อ' : 'ส่งบางส่วนได้'}</strong><span>{projected.complete ? 'ครบทั้งจำนวนสินค้าและยอด Invoice รวม' : `จำนวนสินค้า${projected.quantityComplete ? 'ครบแล้ว' : 'ยังไม่ครบ'} · ยอดเงินคงเหลือหลังยืนยัน ฿ ${money(projected.remainingSatang / 100)}`}</span></div></div>
          <div className="vendor-round-summary"><span>Invoice รอบนี้<strong>{pending.length} ใบ</strong></span><span>ยอดส่งครั้งนี้<strong>฿ {money(pendingAmount)}</strong></span></div>
          <details className="vendor-history"><summary>ดู Invoice รอบนี้<Icon name="down" size={16} /></summary><div className="vendor-invoice-list">{pending.map((invoice) => <InvoiceCard key={invoice.reference} invoice={invoice} po={po} onRemove={() => { removePending(invoice.reference); moveStep(3) }} />)}</div></details>
          <p className="vendor-lock-note">เมื่อยืนยันแล้ว จะไม่สามารถแก้ไขหรือลบ Invoice ได้</p>
          <div className="vendor-bottom-actions split"><button type="button" className="vendor-secondary" onClick={() => moveStep(3)}>ย้อนกลับ</button><button type="button" className="vendor-primary" aria-label="Submit การส่งครั้งนี้" disabled={!allowed || !pending.length || !!scanFile} onClick={submit}><Icon name="check" size={20} />ยืนยันข้อมูลการส่ง</button></div>
        </> : null}
        {step === 5 && po ? <div className="vendor-success-screen"><span className="vendor-success-mark"><Icon name="circle-check" size={56} /></span><h1>บันทึกการส่งเรียบร้อย</h1><p>{notice}</p><div className="vendor-round-summary"><span>เลข PO<strong>{poNo}</strong></span><span>สถานะ<strong>{summary.complete ? 'ส่งครบแล้ว' : 'ส่งบางส่วน'}</strong></span></div><div className="vendor-invoice-list">{invoices.filter((invoice) => invoice.roundId && invoice.roundId === invoices.at(-1)?.roundId).map((invoice) => <InvoiceCard key={invoice.reference} invoice={invoice} po={po} />)}</div><p className="vendor-lock-note">Invoice ที่บันทึกแล้วไม่สามารถแก้ไขหรือลบได้</p><button type="button" className="vendor-primary" onClick={() => moveStep(2)}>กลับไปดูข้อมูล PO</button></div> : null}
      </section>
      <details className="vendor-test-tools"><summary>เครื่องมือทดลอง mockup</summary><div className="vendor-demo"><span>PO ตัวอย่าง ฿240,000 · ส่งแล้วครึ่งหนึ่ง</span><button className="vendor-secondary" disabled={pending.length > 0 || !!scanFile} onClick={() => { if (pending.length || scanFile) return; setDemoInvoices([vendorDemoInvoice]); openPO(vendorDemoPO.poNo) }}>เริ่มตัวอย่าง</button></div></details>
    </main>
  </div>
}
