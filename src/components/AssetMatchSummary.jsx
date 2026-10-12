import Icon from './Icon.jsx'

const currency = (value) => value == null ? 'Not recorded' : `฿${new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value)}`
const percent = (numerator, denominator) => numerator == null || denominator == null || denominator <= 0 ? null : `${new Intl.NumberFormat('en-US', { maximumFractionDigits: 1 }).format(numerator / denominator * 100)}%`

function ComparisonResult({ cells }) {
  if (cells.some((cell) => cell.value == null || cell.value === '')) return <span className="asset-match-result result-unavailable"><Icon name="info" size={16} />Not recorded</span>
  const values = cells.map((cell) => typeof cell.value === 'number' ? Math.round(cell.value * 100) / 100 : String(cell.value).trim().toLowerCase())
  const match = values.every((value) => value === values[0])
  if (cells.some((cell) => cell.reference)) return <span className="asset-match-result result-reference"><Icon name="info" size={16} />{match ? 'Reference aligned' : 'Reference differs'}</span>
  return <span className={`asset-match-result ${match ? 'result-match' : 'result-different'}`}><Icon name={match ? 'circle-check' : 'alert'} size={16} />{match ? 'Match' : 'Difference'}</span>
}

export default function AssetMatchSummary({ row }) {
  const summary = row.matchSummary
  const poPercent = percent(summary.poAmount, summary.approvedProposalAmount)
  const grPercent = percent(summary.grAmount, summary.poAmount)
  const varianceMatch = summary.variance != null && Math.abs(summary.variance) < .005
  const cards = [
    { title: 'Approved Proposal Amount', icon: 'file', amount: summary.approvedProposalAmount },
    { title: 'Total PO Amount', icon: 'cart', amount: summary.poAmount, detail: poPercent ? `${poPercent} of Proposal` : 'Proposal amount not recorded', aligned: summary.poAmount != null && summary.approvedProposalAmount != null && Math.abs(summary.poAmount - summary.approvedProposalAmount) < .005 },
    { title: 'Total GR Amount', icon: 'truck', amount: summary.grAmount, detail: grPercent ? `${grPercent} of PO` : 'PO amount not recorded', aligned: varianceMatch },
    { title: 'Variance (PO vs GR)', icon: 'coins', amount: summary.variance, variance: true },
  ]
  return <div className="asset-match-overview">
    <div className="asset-validation-data-heading asset-match-section-title"><span className="validation-card-icon validation-icon-red"><Icon name="coins" size={24} /></span><div><h3>Match Summary</h3><p>Proposal, PO and received value for this Asset</p></div></div>
    <div className="asset-match-card-grid">{cards.map((card) => <div className="asset-match-card" key={card.title}><span className="validation-card-icon validation-icon-red"><Icon name={card.icon} size={26} /></span><div className="asset-match-card-copy"><span>{card.title}</span><strong className={card.variance ? 'asset-match-variance' : ''}>{currency(card.amount)}</strong>{card.detail ? <small className={card.aligned ? 'result-match' : 'result-reference'}><Icon name={card.aligned ? 'circle-check' : 'info'} size={16} />{card.detail}</small> : null}{card.variance ? <small className={`asset-match-variance-badge ${varianceMatch ? 'is-match' : ''}`}>{card.amount == null ? 'Not recorded' : varianceMatch ? 'Match' : 'Difference'}</small> : null}</div></div>)}</div>
    <div className="asset-validation-data-heading asset-match-section-title"><span className="validation-card-icon validation-icon-blue"><Icon name="file" size={24} /></span><div><h3>3-Way Match Comparison</h3><p>Compare approved and received Asset information</p></div></div>
    <div className="asset-match-table-wrap"><table className="asset-match-table"><thead><tr><th>Check Item</th><th>Proposal</th><th>Purchase Order</th><th>Goods Receipt (Received)</th><th>Result</th></tr></thead><tbody>{summary.comparison.map((check) => <tr key={check.label}><th scope="row">{check.label}</th>{check.cells.map((cell, index) => <td key={index}>{cell.value == null || cell.value === '' ? <span className="asset-match-missing">Not recorded</span> : check.money ? currency(cell.value) : cell.value}{cell.reference && cell.value != null && cell.value !== '' ? <small>{cell.reference}</small> : null}</td>)}<td><ComparisonResult cells={check.cells} /></td></tr>)}</tbody></table></div>
    <p className="asset-match-reference-note">Comparison for this Asset and its linked PO item. GR amounts use received quantity × PO item rate. Asset record and PO reference values are identified below each value. Financial comparisons are reference only; Invoice amounts are not matching criteria.</p>
    <div className="validation-match-grid validation-match-receiving"><div><span>Ordered Qty</span><strong>{summary.orderedQuantity ?? 'Not recorded'}</strong></div><div><span>Received Qty</span><strong>{summary.receivedQuantity ?? 'Not recorded'}</strong></div><div><span>Invoice Docs</span><strong>{row.invoiceReferences.length}</strong></div><div><span>Receiving Status</span><strong className={row.canComplete || row.status === 'Validation Complete' ? 'validation-match-complete' : ''}><Icon name={row.canComplete || row.status === 'Validation Complete' ? 'circle-check' : 'alert'} size={18} />{row.canComplete || row.status === 'Validation Complete' ? 'Complete' : 'Hold / Correction Required'}</strong></div></div>
  </div>
}
