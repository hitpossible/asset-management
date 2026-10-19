import { Fragment, useMemo, useState } from 'react'
import { useAuditLogStore } from '../hooks/useAuditLogStore.js'
import { filterAuditRecords, formatAuditValue } from '../utils/auditLogUtils.js'
import { Field, ListMetric, PageHeading } from '../components/common.jsx'
import Icon from '../components/Icon.jsx'
import './AuditLogPage.css'

const EMPTY_FILTERS = { query: '', module: '', action: '', actor: '', from: '', to: '' }
const timestamp = (value) => new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Bangkok', dateStyle: 'medium', timeStyle: 'medium' }).format(new Date(value))
const fieldLabel = (field) => field.replaceAll('.', ' › ').replace(/([a-z])([A-Z])/g, '$1 $2').replace(/^./, (char) => char.toUpperCase())

function downloadCsv(records) {
  const rows = [['Timestamp (Bangkok)', 'User', 'Role', 'Module', 'Action', 'Entity', 'Reference', 'Name', 'Field', 'Before', 'After'], ...records.flatMap((record) => record.changes.map((change) => [timestamp(record.timestamp), record.actor.name, record.actor.role, record.module, record.action, record.entityType, record.reference, record.name, change.field, formatAuditValue(change.before), formatAuditValue(change.after)]))]
  const csv = '\uFEFF' + rows.map((row) => row.map((value) => {
    const text = String(value ?? '')
    return `"${(/^[=+@-]/.test(text) ? `'${text}` : text).replaceAll('"', '""')}"`
  }).join(',')).join('\r\n')
  const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }))
  const link = document.createElement('a')
  link.href = url
  link.download = 'tbkk-audit-log.csv'
  link.click()
  URL.revokeObjectURL(url)
}

export default function AuditLogPage() {
  const { records, storageAvailable } = useAuditLogStore()
  const [filters, setFilters] = useState(EMPTY_FILTERS)
  const [page, setPage] = useState(1)
  const [expanded, setExpanded] = useState('')
  const options = useMemo(() => ({ modules: [...new Set(records.map((record) => record.module))].sort(), actors: [...new Set(records.map((record) => record.actor.name))].sort(), actions: [...new Set(records.map((record) => record.action))].sort() }), [records])
  const filtered = useMemo(() => filterAuditRecords(records, filters), [records, filters])
  const totalPages = Math.max(1, Math.ceil(filtered.length / 20))
  const currentPage = Math.min(page, totalPages)
  const visible = filtered.slice((currentPage - 1) * 20, currentPage * 20)
  const invalidRange = filters.from && filters.to && filters.from > filters.to
  const activeFilters = Object.values(filters).some(Boolean)
  function update(key, value) { setFilters((current) => ({ ...current, [key]: value })); setPage(1); setExpanded('') }
  function clear() { setFilters(EMPTY_FILTERS); setPage(1); setExpanded('') }

  return <div className="asset-list-workspace audit-workspace">
    <PageHeading eyebrow="Administrator" title="Audit Log" description="Trace changes across Asset Management. Open a record to compare the previous and updated values." action={<button type="button" className="button button-secondary" disabled={!filtered.length || !!invalidRange} onClick={() => downloadCsv(filtered)}><Icon name="download" size={17} />Export CSV</button>} />
    <div className="asset-list-metrics audit-metrics">
      <ListMetric label="Recorded changes" count={records.length} hint="Saved operations · MIS excluded" icon="clock" tone="slate" total={records.length} />
      <ListMetric label="Matching records" count={filtered.length} hint="Current search and filters" icon="search" tone="blue" total={records.length} />
      <ListMetric label="Modules" count={options.modules.length} hint="With recorded activity" icon="file" tone="slate" total={options.modules.length} />
    </div>
    {!storageAvailable ? <div className="form-error" role="alert">Browser storage is unavailable. New audit records are kept for this session only.</div> : null}
    <section className="panel asset-list-panel audit-panel">
      <div className="audit-panel-heading"><div><h2>Change history</h2><p>All times are shown in Asia/Bangkok (UTC+7).</p></div><span className="mis-demo-tag">Read only</span></div>
      <div className="audit-filters">
        <Field label="Search"><input type="search" value={filters.query} onChange={(event) => update('query', event.target.value)} placeholder="Reference, field, user or value..." /></Field>
        <Field label="Module"><select value={filters.module} onChange={(event) => update('module', event.target.value)}><option value="">All modules</option>{options.modules.map((module) => <option key={module}>{module}</option>)}</select></Field>
        <Field label="Action"><select value={filters.action} onChange={(event) => update('action', event.target.value)}><option value="">All actions</option>{options.actions.map((action) => <option key={action}>{action}</option>)}</select></Field>
        <Field label="User"><select value={filters.actor} onChange={(event) => update('actor', event.target.value)}><option value="">All users</option>{options.actors.map((actor) => <option key={actor}>{actor}</option>)}</select></Field>
        <Field label="From date"><input type="date" value={filters.from} onChange={(event) => update('from', event.target.value)} /></Field>
        <Field label="To date"><input type="date" value={filters.to} min={filters.from || undefined} onChange={(event) => update('to', event.target.value)} /></Field>
        <button type="button" className="button button-secondary button-small" disabled={!activeFilters} onClick={clear}>Clear filters</button>
      </div>
      {invalidRange ? <p className="form-error" role="alert">To date must be on or after From date.</p> : null}
      <div className="table-scroll"><table className="asset-table audit-table"><thead><tr><th>Date / Time</th><th>User</th><th>Module</th><th>Action</th><th>Record</th><th>Changes</th><th>Details</th></tr></thead><tbody>
        {visible.map((record) => <Fragment key={record.id}><tr>
          <td><time dateTime={record.timestamp}>{timestamp(record.timestamp)}</time></td>
          <td><strong>{record.actor.name}</strong><small>{record.actor.role}</small></td>
          <td>{record.module}</td><td><span className="audit-action">{record.action}</span></td>
          <td><strong>{record.reference}</strong><small>{record.entityType}{record.name ? ` · ${record.name}` : ''}</small></td>
          <td><strong>{record.changes.length} field{record.changes.length === 1 ? '' : 's'}</strong><small>{record.changes.slice(0, 2).map((change) => fieldLabel(change.field)).join(', ')}{record.changes.length > 2 ? '…' : ''}</small></td>
          <td><button type="button" className="button button-secondary button-small" aria-expanded={expanded === record.id} aria-controls={`audit-${record.id}`} onClick={() => setExpanded(expanded === record.id ? '' : record.id)}>{expanded === record.id ? 'Hide' : 'View'}</button></td>
        </tr>{expanded === record.id ? <tr id={`audit-${record.id}`}><td colSpan={7} className="audit-expanded"><div className="audit-detail-meta"><strong>{record.action} · {record.reference}</strong><span>Log ID: {record.id}</span></div><table className="audit-changes-table"><thead><tr><th>Field</th><th>Before</th><th>After</th></tr></thead><tbody>{record.changes.map((change) => <tr key={change.field}><th scope="row">{fieldLabel(change.field)}</th><td><pre>{formatAuditValue(change.before)}</pre></td><td><pre>{formatAuditValue(change.after)}</pre></td></tr>)}</tbody></table></td></tr> : null}</Fragment>)}
        {!visible.length ? <tr><td colSpan={7}><div className="empty-table"><span className="empty-table-icon"><Icon name="clock" size={22} /></span><strong>{records.length ? 'No matching audit records' : 'No changes recorded yet'}</strong><p>{records.length ? 'Try changing your search or filters.' : 'New changes in Asset Management will appear here. Existing history is not backfilled.'}</p>{activeFilters ? <button type="button" className="button button-secondary button-small" onClick={clear}>Clear filters</button> : null}</div></td></tr> : null}
      </tbody></table></div>
      <div className="table-footer audit-pagination"><span>{filtered.length ? `Showing ${(currentPage - 1) * 20 + 1}–${Math.min(currentPage * 20, filtered.length)} of ${filtered.length}` : '0 records'}</span><div><button type="button" className="button button-secondary button-small" disabled={currentPage <= 1} onClick={() => { setPage(currentPage - 1); setExpanded('') }}>Previous</button><span>Page {currentPage} of {totalPages}</span><button type="button" className="button button-secondary button-small" disabled={currentPage >= totalPages} onClick={() => { setPage(currentPage + 1); setExpanded('') }}>Next</button></div></div>
    </section>
    <div className="dashboard-footnote"><span className="footnote-dot" />Audit records are saved in this browser. The demo session uses Pat S. (Administrator). MIS operations and automatic migrations are excluded.</div>
  </div>
}
