import { useState } from 'react'
import { PageHeading } from '../components/common.jsx'
import Icon from '../components/Icon.jsx'
import StatusBadge from '../components/StatusBadge.jsx'

const money = (value) => Number(value || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

export default function MISPOListPage({ purchaseOrders, onApprove, onCreate }) {
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState('all')
  const rows = purchaseOrders.filter((po) => `${po.poNo} ${po.vendor} ${po.prNo || ''}`.toLowerCase().includes(query.trim().toLowerCase()) && (status === 'all' || (status === 'approved' ? po.status === 'Approved' : po.status !== 'Approved')))
  return <div className="asset-list-workspace mis-list-workspace">
    <PageHeading eyebrow="MIS · Purchase Order" title="PO list" description="อนุมัติ PO ใน MIS ก่อนส่งต่อให้ Vendor แจ้งส่งสินค้า" action={<button type="button" className="button button-primary" onClick={onCreate}><Icon name="plus" size={17} />Create PO</button>} />
    <section className="panel asset-list-panel">
      <div className="mis-po-toolbar"><label className="table-search"><Icon name="search" size={17} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="ค้นหา PO, PR หรือ Vendor" aria-label="Search Purchase Orders" /></label><select value={status} onChange={(event) => setStatus(event.target.value)} aria-label="PO approval status"><option value="all">ทั้งหมด</option><option value="pending">รออนุมัติ</option><option value="approved">อนุมัติแล้ว</option></select></div>
      <div className="table-scroll"><table className="asset-table"><thead><tr><th>PO No.</th><th>Vendor</th><th>PR No.</th><th>ยอด PO (THB)</th><th>Status</th><th>ขั้นตอนถัดไป</th></tr></thead><tbody>{rows.map((po) => <tr key={po.poNo}><td><strong>{po.poNo}</strong></td><td>{po.vendor}</td><td>{po.prNo || '—'}</td><td className="mis-po-amount">{money(po.referenceTotal)}</td><td><StatusBadge status={po.status === 'Created' ? 'Pending Approval' : po.status} /></td><td>{po.status === 'Approved' ? <a className="button button-secondary button-small" href={`/vendor-delivery?po=${encodeURIComponent(po.poNo)}`} target="_blank" rel="noopener noreferrer"><Icon name="truck" size={16} />เปิด Vendor Delivery</a> : ['Created', 'Pending Approval'].includes(po.status) ? <button type="button" className="button button-primary button-small" onClick={() => onApprove(po.poNo)}><Icon name="check" size={16} />Approve PO (MIS)</button> : <span>ยังไม่พร้อมอนุมัติ</span>}</td></tr>)}{!rows.length ? <tr><td colSpan={6}>ไม่พบ PO ตามเงื่อนไข</td></tr> : null}</tbody></table></div>
    </section><div className="dashboard-footnote"><span className="footnote-dot" />การอนุมัติจำลองใน MIS · Vendor ทำเฉพาะแจ้งส่งสินค้าและสแกน Invoice</div>
  </div>
}
