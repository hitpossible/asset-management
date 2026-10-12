import { Fragment, useMemo, useState } from 'react'
import Icon from '../components/Icon.jsx'
import { EmptyInline, PageHeading } from '../components/common.jsx'
import StatusBadge from '../components/StatusBadge.jsx'
import { MISListFooter, useMISList } from '../components/MISListControls.jsx'
import { getAssetOwnerLabel } from '../utils/assetOwnershipUtils.js'
import { formatDate } from '../utils/assetUtils.js'

const normalizeProjectCode = (value) => String(value || '').trim().toLowerCase()

export default function ProjectListPage({ projects, assets = [], onCreate }) {
  const [expandedProjectCodes, setExpandedProjectCodes] = useState(() => new Set())
  const assetsByProjectCode = useMemo(() => assets.reduce((grouped, asset) => {
    const projectCode = normalizeProjectCode(asset.projectCode)
    if (!projectCode) return grouped
    const linkedAssets = grouped.get(projectCode) || []
    linkedAssets.push(asset)
    grouped.set(projectCode, linkedAssets)
    return grouped
  }, new Map()), [assets])
  const list = useMISList(projects, (project, query) => {
    const linkedAssets = assetsByProjectCode.get(normalizeProjectCode(project.projectCode)) || []
    return [project.projectCode, project.projectName, project.detail, project.date,
      ...linkedAssets.flatMap((asset) => [asset.assetId, asset.name, asset.model, asset.assetClass, asset.custodian, asset.plant, asset.location, asset.line, asset.power, asset.area, asset.targetSop, asset.status])]
      .some((value) => String(value || '').toLowerCase().includes(query))
  })

  function toggleExpanded(projectCode) {
    setExpandedProjectCodes((current) => {
      const next = new Set(current)
      if (next.has(projectCode)) next.delete(projectCode)
      else next.add(projectCode)
      return next
    })
  }

  return <div className="asset-list-workspace">
    <PageHeading eyebrow="Project Management" title="Project List" description="Manage project references and review the Assets linked to each Project." action={<button type="button" className="button button-primary" onClick={onCreate}><Icon name="plus" size={17} />Create Project</button>} />
    <section className="panel asset-list-panel">
      <div className="list-toolbar"><strong>Projects ({projects.length})</strong><div className="toolbar-actions"><label className="table-search"><Icon name="search" size={17} /><input aria-label="Search projects and assets" placeholder="Search project, asset code or name..." value={list.query} onChange={(event) => list.setQuery(event.target.value)} />{list.query ? <button type="button" aria-label="Clear search" onClick={() => list.setQuery('')}><Icon name="close" size={14} /></button> : null}</label></div></div>
      {list.filtered.length ? <div className="table-scroll"><table className="asset-table project-table"><thead><tr><th>Project Code</th><th>Project Name</th><th>Detail</th><th>Date</th><th>Assets</th></tr></thead><tbody>{list.visible.map((project) => {
        const linkedAssets = assetsByProjectCode.get(normalizeProjectCode(project.projectCode)) || []
        const expanded = expandedProjectCodes.has(project.projectCode)
        return <Fragment key={project.projectCode}>
          <tr>
            <td><strong>{project.projectCode}</strong></td>
            <td>{project.projectName}</td>
            <td className="project-description">{project.detail || '—'}</td>
            <td>{formatDate(project.date)}</td>
            <td className="project-assets-cell">{linkedAssets.length ? <button type="button" className="project-assets-toggle" aria-expanded={expanded} onClick={() => toggleExpanded(project.projectCode)}><Icon name="chevron" size={14} className={expanded ? 'project-assets-chevron-open' : ''} />{expanded ? 'Hide' : 'View'} {linkedAssets.length} {linkedAssets.length === 1 ? 'Asset' : 'Assets'}</button> : <span className="project-no-assets">No linked Assets</span>}</td>
          </tr>
          {expanded && linkedAssets.length ? <tr className="project-assets-expanded-row" key={`${project.projectCode}-assets`}><td colSpan={5}><div className="project-assets-details" id={`project-assets-${project.projectCode}`}><strong className="project-assets-details-heading">Assets under {project.projectCode} · {linkedAssets.length}</strong><div className="project-assets-details-scroll"><table className="project-asset-details-table"><thead><tr><th>Asset No.</th><th>Asset / Model</th><th>Asset class</th><th>Ownership / Custodian</th><th>Location / Line</th><th>Power / Area</th><th>Target SOP</th><th>Status</th></tr></thead><tbody>{linkedAssets.map((asset) => <tr key={asset.assetId}><td><strong>{asset.assetId}</strong></td><td><strong>{asset.name || '—'}</strong><small>{asset.model || 'Model not set'}</small></td><td>{asset.assetClass || '—'}</td><td><span>{getAssetOwnerLabel(asset)}</span><small>Custodian: {asset.custodian || 'Unassigned'}</small></td><td>{[asset.plant, asset.location, asset.line !== '—' ? asset.line : ''].filter(Boolean).join(' · ') || '—'}</td><td><span>{asset.power || '—'}</span><small>Area: {asset.area || '—'}</small></td><td>{formatDate(asset.targetSop)}</td><td><StatusBadge status={asset.status || 'Unknown'} /></td></tr>)}</tbody></table></div></div></td></tr> : null}
        </Fragment>
      })}</tbody></table></div> : <EmptyInline title={projects.length ? 'No matching projects' : 'No projects yet'} copy={projects.length ? 'Try another project or Asset code/name.' : 'Create a project to make it available for asset references.'} action={<button type="button" className="button button-secondary" onClick={projects.length ? () => list.setQuery('') : onCreate}>{projects.length ? 'Clear search' : 'Create Project'}</button>} />}
      <MISListFooter list={list} noun="projects" />
    </section>
  </div>
}
