import { useMemo, useState } from 'react'
import { ASSET_STATUSES } from '../data/assetOptions.js'
import AssetTable from '../components/AssetTable.jsx'
import Icon from '../components/Icon.jsx'
import { PageHeading } from '../components/common.jsx'
import { downloadAssetCsv } from '../utils/assetUtils.js'

const GROUPS = [
  { id: 'all', label: 'All assets', icon: 'box', tone: 'red', hint: 'Registered in this workspace', matches: () => true },
  { id: 'active', label: 'Active', icon: 'check', tone: 'green', hint: 'Activated and ready for use', matches: (asset) => asset.status === 'Active' },
  { id: 'acquisition', label: 'In acquisition', icon: 'clock', tone: 'amber', hint: 'Purchasing through activation', matches: (asset) => !['Active', 'Draft', 'Sold'].includes(asset.status) },
  { id: 'draft', label: 'Draft', icon: 'file', tone: 'slate', hint: 'Preparing for a proposal', matches: (asset) => asset.status === 'Draft' },
]

export default function AssetListPage({ assets, allAssets, projects = [], assetTypes, purchaseOrders, filters, filterOptions, hasActiveFilters, updateFilter, clearFilters, onCreate, onCreateSubAsset, onEdit, onSaveDPDetails, lifecycleEvents, onTransfer, onAdvanceTransfer }) {
  const [group, setGroup] = useState('all')
  const [pagination, setPagination] = useState({ page: 1, size: 8, context: '' })
  const [selectedIds, setSelectedIds] = useState([])
  const [sort, setSort] = useState({ key: '', direction: 'ascending' })
  const sourceAssets = allAssets || assets
  const projectOptions = useMemo(() => {
    const byCode = new Map()
    for (const project of projects) {
      const projectCode = project.projectCode?.trim()
      if (projectCode) byCode.set(projectCode.toLowerCase(), { projectCode, projectName: project.projectName || '' })
    }
    for (const asset of sourceAssets) {
      const projectCode = asset.projectCode?.trim()
      if (projectCode && !byCode.has(projectCode.toLowerCase())) byCode.set(projectCode.toLowerCase(), { projectCode, projectName: asset.projectName || '' })
    }
    return [...byCode.values()].sort((left, right) => left.projectCode.localeCompare(right.projectCode, undefined, { numeric: true }))
  }, [projects, sourceAssets])
  const hasUnassignedProjectAssets = sourceAssets.some((asset) => !asset.projectCode?.trim())
  const counts = GROUPS.map((item) => sourceAssets.filter(item.matches).length)
  const groupAssets = assets.filter(GROUPS.find((item) => item.id === group).matches)
  const sortedAssets = sort.key ? [...groupAssets].sort((a, b) => String(a[sort.key] || '').localeCompare(String(b[sort.key] || ''), undefined, { numeric: true }) * (sort.direction === 'ascending' ? 1 : -1)) : groupAssets
  const context = JSON.stringify([filters, group, sort])
  const pageCount = Math.max(1, Math.ceil(sortedAssets.length / pagination.size))
  const page = pagination.context === context ? Math.min(pagination.page, pageCount) : 1
  const start = (page - 1) * pagination.size
  const pageAssets = sortedAssets.slice(start, start + pagination.size)
  const selectedAssets = sortedAssets.filter((asset) => selectedIds.includes(asset.assetId))
  const pages = Array.from({ length: pageCount }, (_, index) => index + 1).filter((number) => number === 1 || number === pageCount || Math.abs(number - page) <= 1)

  function changeGroup(nextGroup) {
    setGroup(nextGroup)
    updateFilter('status', 'All status')
  }
  function resetFilters() {
    clearFilters()
    setGroup('all')
  }
  function toggleSelection(assetId) {
    setSelectedIds((current) => current.includes(assetId) ? current.filter((id) => id !== assetId) : [...current, assetId])
  }
  function togglePageSelection() {
    const pageIds = pageAssets.map((asset) => asset.assetId)
    setSelectedIds((current) => pageIds.every((id) => current.includes(id)) ? current.filter((id) => !pageIds.includes(id)) : [...new Set([...current, ...pageIds])])
  }
  function changeSort(key) {
    setSort((current) => ({ key, direction: current.key === key && current.direction === 'ascending' ? 'descending' : 'ascending' }))
  }

  return (
    <div className="asset-list-workspace">
      <PageHeading eyebrow="Asset management" title="Asset list" description="Manage and view all assets with filters, search, and detailed information."
        action={<button className="button button-primary" onClick={onCreate}><Icon name="plus" size={18} />Create asset</button>} />
      <div className="asset-list-metrics" aria-label="Asset summary">
        {GROUPS.map((item, index) => <button key={item.id} className={`asset-list-metric metric-tone-${item.tone}`} onClick={() => changeGroup(item.id)} aria-pressed={group === item.id}>
          <span className="list-metric-icon"><Icon name={item.icon} size={25} /></span>
          <span className="list-metric-copy"><span>{item.id === 'active' ? 'Active assets' : item.id === 'draft' ? 'Draft assets' : item.label}</span><strong>{counts[index].toLocaleString()}</strong><small>{item.hint}</small></span>
          <span className="list-metric-progress" aria-hidden="true"><span style={{ width: `${sourceAssets.length ? counts[index] / sourceAssets.length * 100 : 0}%` }} /></span>
        </button>)}
      </div>
      <section className="panel asset-list-panel">
        <div className="list-toolbar">
          <div className="asset-status-tabs" aria-label="Asset groups">{GROUPS.map((item, index) => <button key={item.id} className={group === item.id ? 'asset-tab-active' : ''} aria-pressed={group === item.id} onClick={() => changeGroup(item.id)}>{item.label} <span>({counts[index].toLocaleString()})</span></button>)}</div>
          <div className="toolbar-actions">
            <label className="table-search"><Icon name="search" size={17} /><input aria-label="Filter asset list" placeholder="Search name, model, project, location..." value={filters.query} onChange={(event) => updateFilter('query', event.target.value)} />{filters.query ? <button aria-label="Clear search" onClick={() => updateFilter('query', '')}><Icon name="close" size={14} /></button> : null}</label>
            <button className="button button-secondary export-button" onClick={() => downloadAssetCsv(selectedAssets.length ? selectedAssets : sortedAssets)}><Icon name="download" size={17} />{selectedAssets.length ? `Export (${selectedAssets.length})` : 'Export'}</button>
          </div>
        </div>
        <div className="asset-list-filters">
          <label><span>Status</span><select value={filters.status} onChange={(event) => { setGroup('all'); updateFilter('status', event.target.value) }}><option>All status</option>{ASSET_STATUSES.map((status) => <option key={status}>{status}</option>)}</select></label>
          <label><span>Asset ownership</span><select value={filters.ownershipType} onChange={(event) => updateFilter('ownershipType', event.target.value)}><option value="all">All ownership</option><option value="company">Company Asset · TBKK</option><option value="customer">Customer Asset</option></select></label>
          <label><span>Project</span><select value={filters.projectCode} onChange={(event) => updateFilter('projectCode', event.target.value)}><option value="">All projects</option>{projectOptions.map((project) => <option key={project.projectCode} value={project.projectCode}>{[project.projectCode, project.projectName].filter(Boolean).join(' · ')}</option>)}{hasUnassignedProjectAssets ? <option value="__unassigned__">No project assigned</option> : null}</select></label>
          <label><span>Asset class</span><select value={filters.assetClass} onChange={(event) => updateFilter('assetClass', event.target.value)}><option>All asset classes</option>{filterOptions.assetClasses.map((value) => <option key={value}>{value}</option>)}</select></label>
          <label><span>Plant</span><select value={filters.plant} onChange={(event) => updateFilter('plant', event.target.value)}><option>All plants</option>{filterOptions.plants.map((value) => <option key={value}>{value}</option>)}</select></label>
          <label><span>Location</span><select value={filters.location} onChange={(event) => updateFilter('location', event.target.value)}><option>All locations</option>{filterOptions.locations.map((value) => <option key={value}>{value}</option>)}</select></label>
          <label><span>Custodian</span><select value={filters.custodian} onChange={(event) => updateFilter('custodian', event.target.value)}><option>All custodians</option>{filterOptions.custodians.map((value) => <option key={value}>{value}</option>)}</select></label>
          {hasActiveFilters || group !== 'all' ? <button className="list-reset-filter" onClick={resetFilters}><Icon name="close" size={14} />Reset</button> : null}
        </div>
        {selectedAssets.length ? <div className="asset-selection-summary">{selectedAssets.length} matching assets selected<button onClick={() => setSelectedIds([])}>Clear selection</button></div> : null}
        <AssetTable assets={pageAssets} allAssets={allAssets} assetTypes={assetTypes} purchaseOrders={purchaseOrders} onEdit={onEdit} onCreateSubAsset={onCreateSubAsset} onSaveDPDetails={onSaveDPDetails} lifecycleEvents={lifecycleEvents} onTransfer={onTransfer} onAdvanceTransfer={onAdvanceTransfer} listStyle selectedIds={selectedIds} onToggleSelection={toggleSelection} onTogglePageSelection={togglePageSelection} sort={sort} onSort={changeSort} />
        <div className="table-footer">
          <span>Showing <strong>{sortedAssets.length ? start + 1 : 0}–{Math.min(start + pagination.size, sortedAssets.length)}</strong> of <strong>{sortedAssets.length}</strong> assets</span>
          <nav className="asset-pagination" aria-label="Asset list pages">
            <button disabled={page === 1} aria-label="Previous page" onClick={() => setPagination({ ...pagination, page: page - 1, context })}><Icon name="chevron" size={15} className="previous-chevron" /></button>
            {pages.map((number, index) => <span key={number}>{index > 0 && number - pages[index - 1] > 1 ? <span className="pagination-gap">…</span> : null}<button className={number === page ? 'page-current' : ''} aria-current={number === page ? 'page' : undefined} aria-label={`Page ${number}`} onClick={() => setPagination({ ...pagination, page: number, context })}>{number}</button></span>)}
            <button disabled={page === pageCount} aria-label="Next page" onClick={() => setPagination({ ...pagination, page: page + 1, context })}><Icon name="chevron" size={15} /></button>
          </nav>
          <label className="asset-page-size">Show<select aria-label="Assets per page" value={pagination.size} onChange={(event) => setPagination({ page: 1, size: Number(event.target.value), context })}>{[8, 16, 32].map((size) => <option key={size}>{size}</option>)}</select>per page</label>
        </div>
      </section>
      <div className="dashboard-footnote"><span className="footnote-dot" />Asset information is saved in this browser.</div>
    </div>
  )
}
