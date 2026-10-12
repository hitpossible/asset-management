import { DetailValue } from './common.jsx'
import { formatDate } from '../utils/assetUtils.js'
import StatusBadge from './StatusBadge.jsx'

export const disposalMoney = (value) => value == null ? 'Not recorded' : `฿ ${new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value)}`

export default function DisposalSummary({ record }) {
  const link = record.invoiceItemAssetLink
  const financial = record.financialSnapshot || {}
  return <section className="mis-reference-panel disposal-summary">
    <div className="mis-reference-heading"><div><h3>Disposal history · Sale</h3><p>{record.transactionNo || 'Derecognition preview'}</p></div><StatusBadge status={record.completedAt ? 'Sold' : 'Sale Verified'} /></div>
    <div className="detail-grid">
      {link ? <DetailValue label="Invoice Item ↔ Asset" value={`${link.taxInvoiceNo} · Item ${link.invoiceItemNo} ↔ ${link.assetId} · ${link.assetName}`} /> : null}
      <DetailValue label="Buyer" value={record.buyer} />
      <DetailValue label="Sale Proposal (Approved)" value={record.saleProposalNo} />
      <DetailValue label="Tax Invoice (e-Tax)" value={record.taxInvoiceNo} />
      <DetailValue label="Tax Invoice date" value={formatDate(record.taxInvoiceDate || record.soldOn)} />
      <DetailValue label="Sale verified by" value={record.verifiedBy} />
      <DetailValue label="Sale / Derecognition date" value={formatDate(record.soldOn)} />
      <DetailValue label={link ? 'Invoice Item amount · e-Tax reference' : 'Tax Invoice amount · reference'} value={disposalMoney(link?.itemAmount ?? record.saleAmount)} />
      {link ? <DetailValue label="Invoice total · e-Tax" value={disposalMoney(link.invoiceTotalAmount)} /> : null}
      <DetailValue label="Historical acquisition value" value={disposalMoney(financial.assetValue)} />
      <DetailValue label="Accumulated DP at sale" value={disposalMoney(financial.accumulatedDepreciation)} />
      <DetailValue label="NBV at sale" value={disposalMoney(financial.netBookValue)} />
      <DetailValue label="Last depreciation month" value={record.depreciationStopDate?.slice(0, 7)} />
      <DetailValue label="Recorded by" value={record.actor} />
      {record.completedAt ? <DetailValue label="Recorded at (ICT)" value={new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Bangkok', dateStyle: 'medium', timeStyle: 'short' }).format(new Date(record.completedAt))} /> : null}
    </div>
    <p className="mis-reference-note">{record.convention === 'include-sale-month' ? 'Sale month counts as the final full DP period.' : 'DP ends in the month before sale.'} Historical value and DP are retained; the Asset is removed from the active register.</p>
    {record.remark ? <p>{record.remark}</p> : null}
  </section>
}
