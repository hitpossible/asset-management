import { formatPower } from '../utils/powerUtils.js'
import { useEffect, useRef, useState } from 'react'
import Icon from './Icon.jsx'
import StatusBadge from './StatusBadge.jsx'
import { DetailValue, EmptyInline } from './common.jsx'
import { getAssetOwnerLabel } from '../utils/assetOwnershipUtils.js'
import { formatDate } from '../utils/assetUtils.js'
import { getAssetReferences } from '../utils/misReferenceUtils.js'
import './ProjectAssetsDialog.css'

export default function ProjectAssetsDialog({ project, assets, onClose }) {
  const dialogRef = useRef(null)
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState('')
  const statuses = [...new Set(assets.map((asset) => asset.status || 'Unknown'))].sort()
  const search = query.trim().toLowerCase()
  const visibleAssets = assets.filter((asset) => (!status || (asset.status || 'Unknown') === status)
    && [asset.assetId, asset.name, asset.model, asset.partNumber, asset.assetClass, getAssetOwnerLabel(asset), asset.custodian, asset.plant, asset.location, asset.line, asset.area, asset.power, asset.targetSop, asset.status, ...getAssetReferences(asset).proposalReferences.map((item) => item.reference)]
      .some((value) => String(value || '').toLowerCase().includes(search)))

  useEffect(() => {
    const previousFocus = document.activeElement
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    dialogRef.current.showModal()
    return () => {
      document.body.style.overflow = previousOverflow
      previousFocus?.focus()
    }
  }, [])

  function closeOnBackdrop(event) {
    if (event.target !== event.currentTarget) return
    const rect = event.currentTarget.getBoundingClientRect()
    if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) onClose()
  }

  return <dialog ref={dialogRef} className="project-assets-dialog" aria-labelledby="project-assets-title" onCancel={(event) => { event.preventDefault(); onClose() }} onClick={closeOnBackdrop}>
    <header className="project-assets-dialog-header">
      <span className="project-assets-dialog-icon"><Icon name="box" size={24} /></span>
      <div><h2 id="project-assets-title">Project Assets</h2><p><strong>{project.projectCode}</strong><span>{project.projectName}</span></p></div>
      <button type="button" className="project-assets-dialog-close" aria-label="Close project assets" onClick={onClose} autoFocus><Icon name="close" size={20} /></button>
    </header>
    <div className="project-assets-dialog-summary">
      <div><span>Linked Assets</span><strong>{assets.length}</strong></div>
      <div><span>Active Assets</span><strong>{assets.filter((asset) => asset.status === 'Active').length}</strong></div>
      <div className="project-assets-dialog-date"><Icon name="calendar" size={17} /><span>Project date<strong>{formatDate(project.date)}</strong></span></div>
      {project.detail ? <p>{project.detail}</p> : null}
    </div>
    <div className="project-assets-dialog-toolbar">
      <label className="project-assets-dialog-search"><Icon name="search" size={18} /><input aria-label="Search linked assets" placeholder="Search asset, proposal, custodian or location..." value={query} onChange={(event) => setQuery(event.target.value)} />{query ? <button type="button" aria-label="Clear asset search" onClick={() => setQuery('')}><Icon name="close" size={16} /></button> : null}</label>
      <select aria-label="Filter assets by status" value={status} onChange={(event) => setStatus(event.target.value)}><option value="">All statuses</option>{statuses.map((value) => <option key={value} value={value}>{value}</option>)}</select>
    </div>
    <div className="project-assets-dialog-body">
      {visibleAssets.length ? <div className="project-assets-dialog-grid">{visibleAssets.map((asset) => <article className="project-asset-card" key={asset.assetId}>
        <div className="project-asset-card-heading"><strong>{asset.assetId}</strong><StatusBadge status={asset.status || 'Unknown'} /></div>
        <h3>{asset.name || 'Unnamed Asset'}</h3>
        <p className="project-asset-card-class"><Icon name="tag" size={15} />{asset.assetClass || 'Class not set'}</p>
        <dl className="project-asset-card-owner"><dt>Ownership</dt><dd>{getAssetOwnerLabel(asset)}</dd></dl>
        <div className="project-asset-card-fields">
          <div className="project-asset-card-proposal"><DetailValue label="Proposal No." value={[...new Set(getAssetReferences(asset).proposalReferences.map((item) => item.reference).filter(Boolean))].join(', ')} /></div>
          <DetailValue label="Model" value={asset.model} />
          <DetailValue label="Custodian" value={asset.custodian} />
          <DetailValue label="Plant / Location" value={[asset.plant, asset.location].filter((value) => value && value !== '—').join(' · ')} />
          <DetailValue label="Line / Area" value={[asset.line, asset.area].filter((value) => value && value !== '—').join(' · ')} />
          <DetailValue label="Power" value={formatPower(asset.power, asset.powerUnit)} />
          <DetailValue label="Target SOP" value={formatDate(asset.targetSop)} />
        </div>
      </article>)}</div> : <EmptyInline title={assets.length ? 'No matching Assets' : 'No linked Assets'} copy={assets.length ? 'Try another search or status to find an Asset in this project.' : 'Assets assigned to this project will appear here.'} action={assets.length ? <button type="button" className="button button-secondary" onClick={() => { setQuery(''); setStatus('') }}>Clear filters</button> : null} />}
    </div>
    <footer className="project-assets-dialog-footer"><span role="status">Showing <strong>{visibleAssets.length}</strong> of {assets.length} Assets</span><button type="button" className="button button-secondary" onClick={onClose}>Close</button></footer>
  </dialog>
}
