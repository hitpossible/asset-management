import { useState } from 'react'
import Icon from './Icon.jsx'
import { formatDate } from '../utils/assetUtils.js'

const moneyFormatter = new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
const periodFormatter = new Intl.DateTimeFormat('en-US', { month: 'short', year: 'numeric' })
const money = (value) => value == null ? 'Not recorded' : `฿ ${moneyFormatter.format(value)}`
const dateString = (date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
const PAGE_SIZE = 3

export default function DepreciationPanel({ asset, depreciation: dp, onEdit }) {
  const [page, setPage] = useState(1)
  const start = asset.depreciationStartDate ? new Date(`${asset.depreciationStartDate.slice(0, 10)}T00:00:00`) : null
  const hasStart = start && !Number.isNaN(start.getTime())
  const target = hasStart && dp.totalDepreciationPeriods ? new Date(start.getFullYear(), start.getMonth() + dp.totalDepreciationPeriods, 0) : null
  const count = dp.depreciationPeriods ?? 0
  const pageCount = Math.max(1, Math.ceil(count / PAGE_SIZE))
  const currentPage = Math.min(page, pageCount)
  const offset = (currentPage - 1) * PAGE_SIZE
  const rows = Array.from({ length: Math.min(PAGE_SIZE, Math.max(0, count - offset)) }, (_, index) => {
    const period = offset + index + 1
    const accumulated = Math.min(dp.assetValue, dp.monthlyDepreciation * period)
    const previous = Math.min(dp.assetValue, dp.monthlyDepreciation * (period - 1))
    return { period, date: new Date(start.getFullYear(), start.getMonth() + period - 1, 1), amount: accumulated - previous, accumulated, balance: Math.max(0, dp.assetValue - accumulated) }
  })
  const pages = Array.from({ length: pageCount }, (_, index) => index + 1).filter((number) => number === 1 || number === pageCount || Math.abs(number - currentPage) <= 1)
  const fields = [
    { label: 'Asset value', value: money(dp.assetValue), hint: dp.valueSource === 'Asset record' ? 'Recorded acquisition value' : dp.valueSource || 'No acquisition value recorded', icon: 'coins', tone: 'warm' },
    { label: 'Useful life', value: dp.usefulLifeYears == null ? 'Not recorded' : `${dp.usefulLifeYears} years`, hint: dp.totalDepreciationPeriods ? `(${dp.totalDepreciationPeriods} months) · Asset Type` : 'Set useful life in Asset Type', icon: 'clock', tone: 'blue' },
    { label: dp.stopped ? 'Monthly depreciation · Stopped' : 'Monthly depreciation', value: money(dp.stopped ? 0 : dp.monthlyDepreciation), hint: dp.stopped ? `Historical monthly rate: ${money(dp.monthlyDepreciation)}` : dp.monthlyDepreciation == null ? 'Requires asset value and useful life' : `${money(dp.assetValue)} ÷ ${dp.usefulLifeYears * 12} months`, icon: 'chart', tone: 'red', emphasis: true },
    { label: 'Depreciation start date', value: hasStart ? formatDate(asset.depreciationStartDate) : 'Not recorded', icon: 'calendar', tone: 'blue' },
    { label: 'Depreciation method', value: 'Straight-line', hint: 'Equal depreciation each month', icon: 'file', tone: 'slate' },
    { label: dp.stopped ? 'Depreciation stop date' : 'Depreciation target', value: dp.stopped ? formatDate(asset.depreciationStopDate) : target ? formatDate(dateString(target)) : 'Not recorded', hint: dp.stopped ? 'Selected final depreciation month' : target ? 'Final depreciation month' : null, icon: 'pie', tone: 'slate' },
    { label: 'Accumulated DP', value: money(dp.accumulatedDepreciation), hint: dp.depreciationPeriods == null ? 'Requires depreciation start date' : `(${count} months)`, icon: 'chart', tone: 'blue' },
    { label: dp.stopped ? 'NBV at sale' : 'Net book value', value: money(dp.netBookValue), hint: dp.stopped ? 'Retained disposal snapshot' : 'Current remaining value', icon: 'receipt', tone: 'warm' },
    { label: 'Last calculation', value: dp.depreciationPeriods == null ? 'Not recorded' : periodFormatter.format(new Date(dp.stopped ? `${asset.depreciationStopDate}T00:00:00` : Date.now())), hint: dp.stopped ? 'Final calculation · Depreciation stopped' : dp.depreciationPeriods == null ? null : 'Calculated through the current month', icon: 'calendar', tone: 'slate' },
  ]

  return <div className="dp-workspace">
    <section className="dp-profile-card">
      {dp.stopped ? <div className="dp-calculation-note"><Icon name="info" size={17} /><span>Sold · Depreciation stopped after {asset.depreciationStopDate.slice(0, 7)}. Historical cost and DP are retained; this Asset has been derecognized.</span></div> : null}
      <header className="dp-card-heading"><div><h3>Depreciation profile</h3><p>Monthly depreciation based on Asset Type useful life and accounting rules.</p></div><button type="button" className="button button-secondary button-small" disabled={dp.stopped} onClick={onEdit}><Icon name="edit" size={15} />Edit DP details</button></header>
      <div className="dp-profile-grid">{fields.map((field) => <div className="dp-profile-field" key={field.label}><span className={`dp-field-icon dp-tone-${field.tone}`}><Icon name={field.icon} size={19} /></span><div><span>{field.label}</span><strong className={field.emphasis ? 'dp-amount-emphasis' : ''}>{field.value}</strong>{field.hint ? <small>{field.hint}</small> : null}</div></div>)}</div>
      <div className="dp-calculation-note"><Icon name="info" size={17} /><span>Depreciation is calculated automatically from asset value and Asset Type useful life. The start month counts as a full period; accumulated DP is capped at asset value. Sold Assets retain their final calculation and cannot edit DP details.</span></div>
    </section>
    <section className="dp-history-card">
      <header className="dp-card-heading"><div><h3>DP transaction history</h3><p>Calculated monthly depreciation for this asset. These are preview amounts, not accounting postings.</p></div><span className="dp-history-count">{count} periods</span></header>
      <div className="dp-table-scroll"><table className="dp-history-table"><thead><tr><th scope="col">Period</th><th scope="col" className="dp-number">Depreciation amount</th><th scope="col" className="dp-number">Accumulated DP</th><th scope="col" className="dp-number">Net book value</th><th scope="col">Status</th><th scope="col">Calculated by</th></tr></thead><tbody>{rows.length ? rows.map((row) => <tr key={row.period}><td>{periodFormatter.format(row.date)}</td><td className="dp-number">{money(row.amount)}</td><td className="dp-number">{money(row.accumulated)}</td><td className="dp-number">{money(row.balance)}</td><td><span className="dp-calculated-status"><span />Calculated</span></td><td>System</td></tr>) : <tr><td colSpan={6} className="dp-history-empty"><Icon name="calendar" size={24} /><strong>No depreciation periods yet</strong><span>{dp.monthlyDepreciation == null || !hasStart ? 'Enter asset value, Asset Type useful life and a depreciation start date to view monthly calculations.' : 'Monthly calculations will appear when the depreciation start date is reached.'}</span></td></tr>}</tbody></table></div>
      {count ? <footer className="dp-history-footer"><span>Showing {offset + 1} – {Math.min(offset + PAGE_SIZE, count)} of {count} records</span><nav className="asset-pagination" aria-label="DP history pagination"><button type="button" disabled={currentPage === 1} aria-label="Previous DP page" onClick={() => setPage(currentPage - 1)}><Icon name="chevron" size={16} className="previous-chevron" /></button>{pages.map((number, index) => <span key={number}>{index > 0 && number - pages[index - 1] > 1 ? <span className="pagination-gap">…</span> : null}<button type="button" className={currentPage === number ? 'page-current' : ''} aria-current={currentPage === number ? 'page' : undefined} aria-label={`DP page ${number}`} onClick={() => setPage(number)}>{number}</button></span>)}<button type="button" disabled={currentPage === pageCount} aria-label="Next DP page" onClick={() => setPage(currentPage + 1)}><Icon name="chevron" size={16} /></button></nav></footer> : null}
    </section>
  </div>
}
