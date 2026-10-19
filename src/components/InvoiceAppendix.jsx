import { formatDate } from '../utils/assetUtils.js'

const money = (value) => value == null ? 'Not recorded' : Number(value).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

export default function InvoiceAppendix({ asset, invoices, attachments, startPage, totalPages }) {
  return <>
    {invoices.map((invoice, index) => <article className="control-sheet-page invoice-appendix-page" aria-label={`Invoice ${invoice.reference}`} key={`${invoice.poNo}:${invoice.reference}`}>
      <header className="invoice-appendix-header"><div><span>Acquisition supporting document</span><h2>Invoice reference</h2></div><strong>{invoice.reference}</strong></header>
      <dl className="invoice-appendix-meta">{[['Asset', `${asset.assetId} · ${asset.name}`], ['Invoice no.', invoice.reference], ['Invoice date', formatDate(invoice.invoiceDate || invoice.date)], ['Purchase Order', invoice.poNo], ['Vendor', invoice.vendor || asset.vendor], ['Amount (THB · reference only)', money(invoice.amount)], ['Document name', invoice.documentName]].map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value || 'Not recorded'}</dd></div>)}</dl>
      <div className="invoice-appendix-notice">{attachments.some((file) => file.invoiceReference === invoice.reference && file.poNo === invoice.poNo) ? 'Attached original file(s) follow in the Invoice attachments section.' : 'No original file is attached to this Invoice reference. This page displays the recorded reference information only.'}</div>
      <p className="registration-reference-note">Invoice amounts are reference only and are not receiving validation criteria.</p>
      <footer>Invoice reference · {invoice.reference}<span>{startPage + index} / {totalPages}</span></footer>
    </article>)}
    {attachments.map((file, index) => <article className="control-sheet-page invoice-appendix-page invoice-attachment-page" aria-label={`Invoice attachment ${file.name}`} key={file.id}>
      <header className="invoice-appendix-header"><div><span>Invoice attachment · {file.invoiceReference || 'Supporting document'}</span><h2>{file.name}</h2></div></header>
      <p className="invoice-attachment-reference">Asset {asset.assetId}{file.poNo ? ` · ${file.poNo}` : ''}</p>
      {file.url?.startsWith('data:application/pdf') ? <object className="invoice-attachment-pdf" data={file.url} type="application/pdf" aria-label={`PDF ${file.name}`}><p>This browser cannot display the PDF. <a href={file.url} download={file.name}>Download {file.name}</a> to review all pages.</p></object> : /^data:image\/(jpeg|png|webp);/.test(file.url || '') ? <img className="invoice-attachment-image" src={file.url} alt={`Invoice ${file.invoiceReference || file.name}`} /> : <p>Original file unavailable.</p>}
      {file.url?.startsWith('data:application/pdf') ? <p className="registration-reference-note">PDF attachment: scroll inside the document to review every page. This attachment may contain more than one PDF page.</p> : null}
      <footer>Invoice attachment · {file.invoiceReference || file.name}<span>{startPage + invoices.length + index} / {totalPages}</span></footer>
    </article>)}
  </>
}
