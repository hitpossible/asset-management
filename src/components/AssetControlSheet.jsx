import AssetRegistrationPages from './AssetRegistrationPages.jsx'
import InvoiceAppendix from './InvoiceAppendix.jsx'
import { getControlSheetInvoices, getControlSheetPageCount, getControlSheetAttachments, INVOICES_PER_SHEET } from '../utils/controlSheetUtils.js'
import './AssetControlSheet.css'
import { formatPower } from '../utils/powerUtils.js'
import { getAssetReferences } from '../utils/misReferenceUtils.js'

const money = (value) => value == null ? '—' : new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value)

function SheetField({ label, value }) {
  return <div className="control-sheet-field"><small>{label}</small><strong>{value === '' || value == null ? '—' : value}</strong></div>
}

export function AssetControlSheet({ row, form, photos, specialNA, invoiceAttachments: savedAttachments = [] }) {
  const asset = row.asset
  const refs = getAssetReferences(asset)
  const invoices = getControlSheetInvoices(row)
  const invoiceAttachments = getControlSheetAttachments(row, savedAttachments)
  const totalPages = getControlSheetPageCount(row, invoiceAttachments)
  const invoiceSheets = Array.from({ length: Math.max(1, Math.ceil(invoices.length / INVOICES_PER_SHEET)) }, (_, index) => invoices.slice(index * INVOICES_PER_SHEET, (index + 1) * INVOICES_PER_SHEET))
  const total = invoices.reduce((sum, invoice) => sum + (Number(invoice.amount) || 0), 0)
  const allAmounts = invoices.length > 0 && invoices.every((invoice) => invoice.amount != null)
  return <div className="control-sheet-pages">
    <AssetRegistrationPages row={{ ...row, asset: { ...asset, invoiceReferences: invoices } }} form={form} totalPages={totalPages} />
    <article className="control-sheet-page" aria-label="Asset Control Sheet page 3">
      <header className="control-sheet-header"><div><h2>ASSET CONTROL SHEET</h2><SheetField label="Line code" value={asset.line} /></div><div><p>Production Engineering Department</p><div className="control-sheet-signatures">{['Approved by', 'Checked by', 'In charge'].map((label) => <SheetField key={label} label={label} value={label === 'In charge' ? asset.custodian : 'Pending approval'} />)}</div></div></header>
      <div className="control-sheet-grid"><SheetField label="Asset number" value={asset.assetId} /><SheetField label="Model" value={asset.model} /><SheetField label="Asset name" value={asset.name} /></div>
      <div className="control-sheet-grid five"><SheetField label="Maker" value={form.maker} /><SheetField label="Vendor" value={row.purchaseOrder?.vendor || asset.vendor} /><SheetField label="Serial no." value={form.serialNo} /><SheetField label="Power" value={formatPower(form.power ?? asset.power, form.powerUnit || asset.powerUnit)} /><SheetField label="Area (m²)" value={form.area ?? asset.area} /></div>
      <section className="control-sheet-photo-section"><h3>Photograph</h3><div className="control-sheet-machine-photos">{(photos.machine || []).map((photo, index) => <img key={index} src={photo.url} alt={`Machine view ${index + 1}`} />)}</div></section>
      <div className="control-sheet-plates">{[['assetPlate', 'TBKK Asset Plate'], ['machinePlate', 'Machine Plate']].map(([key, label]) => <section key={key}><h3>{label}</h3>{photos[key]?.[0] ? <img src={photos[key][0].url} alt={label} /> : <p>No photograph</p>}</section>)}</div>
      <div className="control-sheet-bottom"><div><section className="control-sheet-special"><h3>Special Control Plate</h3>{specialNA ? <p>Not applicable</p> : photos.specialPlate?.[0] ? <img src={photos.specialPlate[0].url} alt="Special Control Plate" /> : <p>No photograph</p>}</section><SheetField label="Investment no." value={form.investmentNo} /><SheetField label="Manufacturing date" value={form.manufacturingDate} /><SheetField label="Registration date" value={form.registrationDate} /><SheetField label="Place / Area" value={`${asset.plant} / ${asset.location} / ${asset.area}`} /></div><div><div className="control-sheet-grid two"><SheetField label="Special control item" value={form.specialControl} /><SheetField label="Condition" value={form.condition} /></div><h3>Revision record</h3><table><thead><tr><th>No.</th><th>Detail</th><th>Date</th></tr></thead><tbody><tr><td>1</td><td>{form.remark || 'Initial Asset verification'}</td><td>{form.registrationDate || '—'}</td></tr></tbody></table><SheetField label="Confirmed / Estimated SOP" value={form.confirmedSop} /><SheetField label="Proposal" value={refs.proposalReferences.map((ref) => ref.reference).join(', ')} /><SheetField label="PR" value={refs.purchaseRequisitionReferences.map((ref) => ref.reference).join(', ')} /><SheetField label="PO / Item" value={refs.purchaseOrderReferences.map((ref) => `${ref.poNo}${ref.itemNo ? ` / ${ref.itemNo}` : ''}`).join(', ')} /><SheetField label="GR" value={refs.goodsReceiptReferences.map((ref) => ref.reference).join(', ')} /></div></div>
      <footer>Asset Control Sheet · {asset.assetId} <span>3 / {totalPages}</span></footer>
    </article>
    {invoiceSheets.map((sheetInvoices, sheetIndex) => <article key={sheetIndex} className="control-sheet-page control-sheet-invoices" aria-label={`Acquisition invoice summary page ${4 + sheetIndex}`}><header><strong>ASSET NO. {asset.assetId}</strong><strong>LINE {asset.line}</strong></header><h3>Acquisition invoice references</h3><p>Amounts are reference only. They are not receiving validation criteria.</p><table><thead><tr><th>No.</th><th>Invoice date</th><th>Invoice no.</th><th>PO no.</th><th>Company name</th><th>Total / Baht</th></tr></thead><tbody>{sheetInvoices.map((invoice, index) => <tr key={`${invoice.poNo}-${invoice.reference}`}><td>{sheetIndex * INVOICES_PER_SHEET + index + 1}</td><td>{invoice.invoiceDate || invoice.date || '—'}</td><td>{invoice.reference}</td><td>{invoice.poNo || '—'}</td><td>{invoice.vendor || (invoice.poNo === row.poNo ? row.purchaseOrder?.vendor : '') || '—'}</td><td>{money(invoice.amount)}</td></tr>)}{!invoices.length ? <tr><td colSpan={6}>No invoice references recorded.</td></tr> : null}</tbody>{sheetIndex === invoiceSheets.length - 1 ? <tfoot><tr><td colSpan={5}>{allAmounts ? 'TOTAL AMOUNT' : 'RECORDED AMOUNTS (incomplete)'}</td><td>{money(total)}</td></tr></tfoot> : null}</table><footer>Asset Control Sheet · {asset.assetId}<span>{4 + sheetIndex} / {totalPages}</span></footer></article>)}
    <InvoiceAppendix asset={asset} invoices={invoices} attachments={invoiceAttachments} startPage={4 + invoiceSheets.length} totalPages={totalPages} />
  </div>
}

