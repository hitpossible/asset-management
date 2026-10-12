import { useState } from 'react'
import Icon from './Icon.jsx'
import { ListMetric } from './common.jsx'

const GROUPS = [
  { id: 'all', label: 'All', icon: 'file', tone: 'red', hint: 'Saved in this workspace', matches: () => true },
  { id: 'pending', label: 'Pending approval', icon: 'clock', tone: 'amber', hint: 'Waiting for MIS approval', matches: (item) => ['Pending Approval', 'Created'].includes(item.status || 'Created') },
  { id: 'approved', label: 'Approved', icon: 'check', tone: 'green', hint: 'Ready for the next purchasing step', matches: (item) => item.status === 'Approved' },
  { id: 'other', label: 'Other statuses', icon: 'file', tone: 'slate', hint: 'Other document statuses', matches: (item) => !['Pending Approval', 'Created', 'Approved'].includes(item.status || 'Created') },
]

export function useMISList(records, searchMatches) {
  const [query, setQuery] = useState('')
  const [group, setGroup] = useState('all')
  const [pagination, setPagination] = useState({ page: 1, size: 8, context: '' })
  const groups = GROUPS.map((item) => ({ ...item, count: records.filter(item.matches).length }))
  const filtered = records.filter((item) => GROUPS.find((entry) => entry.id === group).matches(item) && searchMatches(item, query.trim().toLowerCase()))
  const context = JSON.stringify([group, query])
  const pageCount = Math.max(1, Math.ceil(filtered.length / pagination.size))
  const page = pagination.context === context ? Math.min(pagination.page, pageCount) : 1
  const start = (page - 1) * pagination.size
  return { query, setQuery, group, setGroup, groups, filtered, visible: filtered.slice(start, start + pagination.size), pagination, setPagination, context, pageCount, page, start, total: records.length }
}

export function MISListMetrics({ list, noun }) {
  return <div className="asset-list-metrics" aria-label={`${noun} summary`}>{list.groups.map((item) => <ListMetric key={item.id} label={item.id === 'all' ? `All ${noun}` : item.label} count={item.count} hint={item.hint} icon={item.icon} tone={item.tone} total={list.total} selected={list.group === item.id} onClick={() => list.setGroup(item.id)} />)}</div>
}

export function MISListToolbar({ list, noun, placeholder }) {
  return <div className="list-toolbar">
    <div className="asset-status-tabs" aria-label={`${noun} groups`}>{list.groups.map((item) => <button type="button" key={item.id} className={list.group === item.id ? 'asset-tab-active' : ''} aria-pressed={list.group === item.id} onClick={() => list.setGroup(item.id)}>{item.id === 'all' ? `All ${noun}` : item.label} <span>({item.count})</span></button>)}</div>
    <div className="toolbar-actions"><label className="table-search"><Icon name="search" size={17} /><input aria-label={`Search ${noun}`} placeholder={placeholder} value={list.query} onChange={(event) => list.setQuery(event.target.value)} />{list.query ? <button type="button" aria-label="Clear search" onClick={() => list.setQuery('')}><Icon name="close" size={14} /></button> : null}</label></div>
  </div>
}

export function MISListFooter({ list, noun }) {
  const pages = Array.from({ length: list.pageCount }, (_, index) => index + 1).filter((number) => number === 1 || number === list.pageCount || Math.abs(number - list.page) <= 1)
  const changePage = (page) => list.setPagination({ ...list.pagination, page, context: list.context })
  return <div className="table-footer">
    <span>Showing <strong>{list.filtered.length ? list.start + 1 : 0}–{Math.min(list.start + list.pagination.size, list.filtered.length)}</strong> of <strong>{list.filtered.length}</strong> {noun}</span>
    <nav className="asset-pagination" aria-label={`${noun} pages`}><button type="button" disabled={list.page === 1} aria-label="Previous page" onClick={() => changePage(list.page - 1)}><Icon name="chevron" size={15} className="previous-chevron" /></button>{pages.map((number, index) => <span key={number}>{index > 0 && number - pages[index - 1] > 1 ? <span className="pagination-gap">…</span> : null}<button type="button" className={number === list.page ? 'page-current' : ''} aria-current={number === list.page ? 'page' : undefined} aria-label={`Page ${number}`} onClick={() => changePage(number)}>{number}</button></span>)}<button type="button" disabled={list.page === list.pageCount} aria-label="Next page" onClick={() => changePage(list.page + 1)}><Icon name="chevron" size={15} /></button></nav>
    <label className="asset-page-size">Show<select aria-label={`${noun} per page`} value={list.pagination.size} onChange={(event) => list.setPagination({ page: 1, size: Number(event.target.value), context: list.context })}>{[8, 16, 32].map((size) => <option key={size}>{size}</option>)}</select>per page</label>
  </div>
}
