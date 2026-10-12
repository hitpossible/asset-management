import { useMemo, useState } from 'react'
import Icon from '../components/Icon.jsx'
import { Field, PageHeading } from '../components/common.jsx'
import { buildMonthlyDepreciationReport, DETAIL_COLUMNS, REPORT_COLUMNS } from '../utils/monthlyDepreciationReport.js'

const money = new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
const dateLabel = (date) => new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).format(date)
const headings = ['At Cost', 'At Cost', 'Current Month', 'Acm. Dprc.', 'Net Book Value', 'Depreciation', 'Acm. Dprc.', 'Net Book Value', 'Disposal Cost', 'Disposal Acm. DP']
const detailDateKeys = ['acquisitionDate', 'serviceDate', 'entryDate', 'startDate']
function detailValue(row, column, csv = false) {
  const value = row[column.key]
  if (value == null || value === '') return csv ? '' : '—'
  if (column.numeric) return ['quantity', 'usefulLifeYears'].includes(column.key) ? value : csv ? value.toFixed(2) : money.format(value)
  if (detailDateKeys.includes(column.key)) {
    const raw = String(value).slice(0, 10)
    const normalized = /^\d{8}$/.test(raw) ? `${raw.slice(0, 4)}-${raw.slice(4, 6)}-${raw.slice(6, 8)}` : raw
    const date = new Date(`${normalized}T00:00:00`)
    if (Number.isNaN(date.getTime())) return csv ? raw : '—'
    return column.key === 'entryDate' ? normalized.replaceAll('-', '') : `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}`
  }
  return value
}
function detailTotals(assets) {
  return Object.fromEntries(['assetValue', 'yearOpeningDP', 'monthlyDP', 'yearToDateDP', 'closingDP', 'closingNBV'].map((key) => [key, assets.reduce((sum, row) => sum + row[key], 0)]))
}
const currentMonth = () => {
  const parts = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Bangkok', year: 'numeric', month: '2-digit' }).formatToParts(new Date())
  return `${parts.find((part) => part.type === 'year').value}-${parts.find((part) => part.type === 'month').value}`
}

function exportReport(report, month) {
  const dates = [report.openingDate, report.closingDate, report.closingDate, report.openingDate, report.openingDate, report.closingDate, report.closingDate, report.closingDate, report.closingDate, report.closingDate]
  const escape = (value) => `"${String(value).replaceAll('"', '""')}"`
  const rows = [
    ['TBKK (Thailand) Co., Ltd.'], [`Monthly asset depreciation report — ${month}`, 'THB · Preview from current Asset records'],
    ['Description', ...headings.map((heading, index) => `${heading} ${dateLabel(dates[index])}`)],
    ...[...report.rows, report.total].map((row) => [row.description, ...REPORT_COLUMNS.map((key) => row[key].toFixed(2))]),
    ...report.rows.flatMap((group) => [
      [], ['Asset Class', group.description], DETAIL_COLUMNS.map((column) => column.label),
      ...group.assets.map((asset) => DETAIL_COLUMNS.map((column) => detailValue(asset, column, true))),
      DETAIL_COLUMNS.map((column, index) => index === 0 ? 'SUBTOTAL' : detailValue(detailTotals(group.assets), column, true)),
    ]),
    [], ['Excluded: incomplete DP information', ...report.excluded.map((asset) => asset.assetId)],
  ]
  const url = URL.createObjectURL(new Blob(['\uFEFF', rows.map((row) => row.map(escape).join(',')).join('\r\n')], { type: 'text/csv;charset=utf-8;' }))
  const link = document.createElement('a')
  link.href = url
  link.download = `asset-monthly-dp-${month}.csv`
  link.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

export default function ReportPage({ assets, assetTypes, purchaseOrders }) {
  const [selected, setSelected] = useState(false)
  const [month, setMonth] = useState(currentMonth)
  const [activeAssetType, setActiveAssetType] = useState('')
  const report = useMemo(() => buildMonthlyDepreciationReport(assets, assetTypes, purchaseOrders, month), [assets, assetTypes, purchaseOrders, month])
  const visibleAssetType = report.rows.some((group) => group.description === activeAssetType) ? activeAssetType : report.rows[0]?.description
  function handleTypeTabKeyDown(event, index) {
    let nextIndex
    if (event.key === 'ArrowRight') nextIndex = (index + 1) % report.rows.length
    else if (event.key === 'ArrowLeft') nextIndex = (index - 1 + report.rows.length) % report.rows.length
    else if (event.key === 'Home') nextIndex = 0
    else if (event.key === 'End') nextIndex = report.rows.length - 1
    else return
    event.preventDefault()
    setActiveAssetType(report.rows[nextIndex].description)
    event.currentTarget.parentElement.querySelectorAll('[role="tab"]')[nextIndex].focus()
  }
  if (!selected) return <div className="create-asset-workspace report-page">
    <PageHeading eyebrow="Asset management" title="Report" description="เลือกดูรายงานข้อมูล Asset และค่าเสื่อมราคา" />
    <div className="report-catalog"><button type="button" className="report-card" onClick={() => setSelected(true)}>
      <span className="report-card-icon"><Icon name="chart" size={28} /></span>
      <span className="report-card-copy"><strong>Monthly Asset Depreciation</strong><span>รายงานรายการค่า DP Asset ประจำเดือน</span><small>มูลค่าทุน · ค่าเสื่อมราคาสะสม · มูลค่าตามบัญชี แยกตาม Asset Class</small></span>
      <span className="report-card-action">เปิดรายงาน <Icon name="chevron" size={17} /></span>
    </button></div>
  </div>
  const monthLabel = new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric' }).format(report.closingDate)
  const dates = [report.openingDate, report.closingDate, report.closingDate, report.openingDate, report.openingDate, report.closingDate, report.closingDate, report.closingDate, report.closingDate, report.closingDate]
  return <div className="create-asset-workspace report-page">
    <PageHeading eyebrow="Report / Monthly Asset Depreciation" title="Monthly Asset Depreciation" description="รายงานรายการค่า DP Asset ประจำเดือน" action={<button className="button button-secondary" onClick={() => setSelected(false)}>กลับหน้ารายงาน</button>} />
    <div className="report-workspace">
    <aside className="panel form-section report-filter-card" aria-labelledby="report-filter-title">
      <header className="form-section-heading"><span className="form-section-icon"><Icon name="settings" size={19} /></span><div><h2 id="report-filter-title">Report filter</h2><p>เลือกเดือนที่ต้องการแสดงรายงาน</p></div></header>
      <Field label="Report month / เดือนรายงาน"><input type="month" value={month} onChange={(event) => { if (/^\d{4}-(0[1-9]|1[0-2])$/.test(event.target.value)) setMonth(event.target.value) }} /></Field>
      <div className="report-scope"><span>Company Assets</span><span>Unit: THB</span><strong>{report.assetCount} Assets ในรายงาน</strong></div>
      <button type="button" className="button button-primary" onClick={() => exportReport(report, month)} disabled={!report.rows.length}><Icon name="download" size={17} />Export CSV</button>
    </aside>
    <div className="report-results">
    {report.excluded.length ? <div className="report-warning" role="status"><Icon name="alert" size={19} /><div><strong>{report.excluded.length} Assets มีข้อมูล DP ไม่ครบและยังไม่รวมในยอดรายงาน</strong><p>ตรวจสอบ Asset Value, Useful Life และ Depreciation Start Date: {report.excluded.map((asset) => asset.assetId).join(', ')}</p></div></div> : null}
    <section className="panel form-section report-sheet">
      <header className="form-section-heading report-sheet-heading"><span className="form-section-icon"><Icon name="chart" size={19} /></span><div><h2>Depreciation summary</h2><p>TBKK (Thailand) Co., Ltd. · Report asset on {dateLabel(report.closingDate)}</p></div><span className="report-period">{monthLabel} · THB</span></header>
      <div className="report-table-scroll" tabIndex={0} role="region" aria-label="Monthly asset depreciation table">
        <table className="report-table"><caption className="sr-only">Monthly asset depreciation by Asset Class for {monthLabel}, amounts in THB</caption><thead><tr><th scope="col">Description</th>{headings.map((heading, index) => <th scope="col" key={REPORT_COLUMNS[index]} className={`${[0, 3, 4].includes(index) ? 'report-opening' : ''} ${index === 5 ? 'report-monthly' : ''}`}>{heading}<span>{index === 2 || index === 5 ? monthLabel : dateLabel(dates[index])}</span></th>)}</tr></thead>
          <tbody>{report.rows.length ? report.rows.map((row) => <tr key={row.description}><th scope="row">{row.description}</th>{REPORT_COLUMNS.map((key) => <td key={key} className={key === 'monthlyDP' ? 'report-monthly' : ''}>{money.format(row[key])}</td>)}</tr>) : <tr><td colSpan={REPORT_COLUMNS.length + 1} className="report-empty">ไม่มีรายการสำหรับเดือนนี้ — ตรวจสอบข้อมูล DP ของ Company Asset ที่ Active</td></tr>}</tbody>
          <tfoot><tr><th scope="row">TOTAL</th>{REPORT_COLUMNS.map((key) => <td key={key} className={key === 'monthlyDP' ? 'report-monthly' : ''}>{money.format(report.total[key])}</td>)}</tr></tfoot>
        </table>
      </div>
    </section>
    <section className="panel form-section report-sheet">
      <div className="form-section-heading"><span className="form-section-icon form-icon-location"><Icon name="box" size={19} /></span><div><h2>Asset details by type</h2><p>รายการสินทรัพย์และค่าเสื่อมราคาแยกประเภท ณ {dateLabel(report.closingDate)}</p></div></div>
      {report.rows.length ? <div className="asset-detail-tabs report-type-tabs" role="tablist" aria-label="Asset types">
        {report.rows.map((group, index) => <button type="button" key={group.description} role="tab" id={`report-type-tab-${index}`} aria-controls={`report-type-panel-${index}`} aria-selected={visibleAssetType === group.description} tabIndex={visibleAssetType === group.description ? 0 : -1} className={visibleAssetType === group.description ? 'is-active' : ''} onClick={() => setActiveAssetType(group.description)} onKeyDown={(event) => handleTypeTabKeyDown(event, index)}>{group.description}<span>{group.count}</span></button>)}
      </div> : null}
      {report.rows.map((group, index) => {
        const totals = detailTotals(group.assets)
        return <section className="report-asset-group" key={group.description} role="tabpanel" id={`report-type-panel-${index}`} aria-labelledby={`report-type-tab-${index}`} hidden={visibleAssetType !== group.description}>
          {visibleAssetType === group.description ? <>
          <header className="report-group-heading"><h4>{group.description}</h4><span>{group.count} Assets</span></header>
          <div className="report-table-scroll" tabIndex={0} role="region" aria-label={`${group.description} depreciation details`}>
            <table className="report-table report-detail-table">
              <caption className="sr-only">{group.description} — Report asset on {dateLabel(report.closingDate)}</caption>
              <thead><tr>{DETAIL_COLUMNS.map((column) => <th scope="col" key={column.key} className={column.numeric ? '' : 'report-text'}>{column.label}{column.key === 'usefulLifeYears' ? <span>Years</span> : null}</th>)}</tr></thead>
              <tbody>{group.assets.map((asset) => <tr key={asset.assetId}>{DETAIL_COLUMNS.map((column, index) => index === 0 ? <th scope="row" key={column.key}>{asset.assetId}</th> : <td key={column.key} className={`${column.numeric ? '' : 'report-text'} ${column.key === 'monthlyDP' ? 'report-monthly' : ''}`}>{detailValue(asset, column)}</td>)}</tr>)}</tbody>
              <tfoot><tr>{DETAIL_COLUMNS.map((column, index) => index === 0 ? <th scope="row" key={column.key}>SUBTOTAL</th> : <td key={column.key} className={column.key === 'monthlyDP' ? 'report-monthly' : ''}>{totals[column.key] == null ? '' : money.format(totals[column.key])}</td>)}</tr></tfoot>
            </table>
          </div>
          </> : null}
        </section>
      })}
      {!report.rows.length ? <div className="report-empty-details"><Icon name="box" size={24} /><p>ไม่มีรายการสินทรัพย์สำหรับเดือนที่เลือก</p></div> : null}
    </section>
    <details className="panel report-notes"><summary><Icon name="info" size={17} />รายละเอียดการคำนวณและคำอธิบายคอลัมน์</summary><p>Preview จากข้อมูล Company Asset และประวัติขาย ไม่ใช่ยอดปิดบัญชีที่บันทึกไว้ย้อนหลัง</p><p>At Cost และ Current Month อ้างอิงเดือนเริ่ม DP · ค่าเสื่อมเริ่มนับเต็มเดือนและไม่เกินมูลค่า Asset · Sub Asset คำนวณแยกจาก Main Asset · ไม่รวม Customer Asset และ Expense</p><p>Sold แสดงในเดือนขายพร้อม Disposal Cost / Disposal Acm. DP และยอดปิดเป็นศูนย์ หยุด DP ตามเดือนสุดท้ายที่เลือก เดือนก่อนขายยังแสดงข้อมูลเดิม เดือนหลังขายไม่รวม Asset นี้</p><p>SLM = Straight-line · EstLf = อายุการใช้งาน (ปี) · YTDAcmDP = ค่าเสื่อมสะสม ณ สิ้นปีก่อน · CurrntDP = ค่าเสื่อมเดือนที่เลือก · CurrntYTD = ค่าเสื่อมตั้งแต่มกราคมถึงเดือนที่เลือก · CurrntYTDAcm = ค่าเสื่อมสะสมถึงสิ้นเดือน · NetVal = มูลค่าตามบัญชี</p><p>วันที่ไม่ได้บันทึกแสดง — · Qty ใช้จำนวนใน Asset record (ค่าเริ่มต้น 1 ต่อสินทรัพย์) · UnitCost = AsstVal ÷ Qty · AsstStatus แสดงสถานะในระบบ</p></details>
    </div>
    </div>
  </div>
}
