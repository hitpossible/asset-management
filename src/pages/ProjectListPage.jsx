import { useMemo, useState } from 'react'
import Icon from '../components/Icon.jsx'
import { EmptyInline, PageHeading } from '../components/common.jsx'
import ProjectAssetsDialog from '../components/ProjectAssetsDialog.jsx'
import { MISListFooter, useMISList } from '../components/MISListControls.jsx'
import { formatDate } from '../utils/assetUtils.js'
import { getAssetReferences } from '../utils/misReferenceUtils.js'

const normalizeProjectCode = (value) => String(value || '').trim().toLowerCase()

export default function ProjectListPage({ projects, assets = [], onCreate }) {
  const [selectedProject, setSelectedProject] = useState(null)
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
      ...linkedAssets.flatMap((asset) => [asset.assetId, asset.name, asset.model, asset.assetClass, asset.custodian, asset.plant, asset.location, asset.line, asset.power, asset.area, asset.targetSop, asset.status, ...getAssetReferences(asset).proposalReferences.map((item) => item.reference)])]
      .some((value) => String(value || '').toLowerCase().includes(query))
  })

  return <div className="asset-list-workspace">
    <PageHeading eyebrow="Project Management" title="Project List" description="Manage project references and review the Assets linked to each Project." action={<button type="button" className="button button-primary" onClick={onCreate}><Icon name="plus" size={17} />Create Project</button>} />
    <section className="panel asset-list-panel">
      <div className="list-toolbar"><strong>Projects ({projects.length})</strong><div className="toolbar-actions"><label className="table-search"><Icon name="search" size={17} /><input aria-label="Search projects and assets" placeholder="Search project, asset code or name..." value={list.query} onChange={(event) => list.setQuery(event.target.value)} />{list.query ? <button type="button" aria-label="Clear search" onClick={() => list.setQuery('')}><Icon name="close" size={14} /></button> : null}</label></div></div>
      {list.filtered.length ? <div className="table-scroll"><table className="asset-table project-table"><thead><tr><th>Project Code</th><th>Project Name</th><th>Detail</th><th>Date</th><th>Assets</th></tr></thead><tbody>{list.visible.map((project) => {
        const linkedAssets = assetsByProjectCode.get(normalizeProjectCode(project.projectCode)) || []
        return <tr key={project.projectCode}>
            <td><strong>{project.projectCode}</strong></td>
            <td>{project.projectName}</td>
            <td className="project-description">{project.detail || '—'}</td>
            <td>{formatDate(project.date)}</td>
            <td className="project-assets-cell">{linkedAssets.length ? <button type="button" className="project-assets-toggle" aria-haspopup="dialog" onClick={() => setSelectedProject(project)}><Icon name="box" size={15} />View {linkedAssets.length} {linkedAssets.length === 1 ? 'Asset' : 'Assets'}<Icon name="chevron" size={14} /></button> : <span className="project-no-assets">No linked Assets</span>}</td>
          </tr>
      })}</tbody></table></div> : <EmptyInline title={projects.length ? 'No matching projects' : 'No projects yet'} copy={projects.length ? 'Try another project or Asset code/name.' : 'Create a project to make it available for asset references.'} action={<button type="button" className="button button-secondary" onClick={projects.length ? () => list.setQuery('') : onCreate}>{projects.length ? 'Clear search' : 'Create Project'}</button>} />}
      <MISListFooter list={list} noun="projects" />
    </section>
    {selectedProject ? <ProjectAssetsDialog project={selectedProject} assets={assetsByProjectCode.get(normalizeProjectCode(selectedProject.projectCode)) || []} onClose={() => setSelectedProject(null)} /> : null}
  </div>
}
