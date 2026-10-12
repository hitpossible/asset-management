import { useEffect, useState } from 'react'
import Icon from '../components/Icon.jsx'
import { ListMetric, PageHeading } from '../components/common.jsx'

const EMPTY_TYPE = { code: '', name: '', usefulLifeYears: '' }

function countAssetsForType(assets, typeName) {
  return assets.reduce((count, asset) => count + (asset.assetClass === typeName ? 1 : 0), 0)
}

export default function ManageAssetMasterPage({ assetTypes, assets, onCreate, onUpdate, onSetActive, onNotice }) {
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState('All status')
  const [isEditorOpen, setIsEditorOpen] = useState(false)
  const [editingType, setEditingType] = useState(null)
  const [form, setForm] = useState(EMPTY_TYPE)
  const [error, setError] = useState('')

  function openCreate() {
    setEditingType(null)
    setForm(EMPTY_TYPE)
    setError('')
    setIsEditorOpen(true)
  }

  function openEdit(type) {
    setEditingType(type)
    setForm({ code: type.code, name: type.name, usefulLifeYears: String(type.usefulLifeYears) })
    setError('')
    setIsEditorOpen(true)
  }

  function closeEditor() {
    setIsEditorOpen(false)
    setEditingType(null)
    setError('')
  }

  useEffect(() => {
    if (!isEditorOpen) return undefined
    function handleKeyDown(event) {
      if (event.key === 'Escape') {
        setIsEditorOpen(false)
        setError('')
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isEditorOpen])

  const visibleTypes = assetTypes.filter((type) => {
    const matchesQuery = `${type.code} ${type.name}`.toLowerCase().includes(query.trim().toLowerCase())
    const matchesStatus = status === 'All status' || (status === 'Active' ? type.active : !type.active)
    return matchesQuery && matchesStatus
  })
  const activeTypeCount = assetTypes.filter((type) => type.active).length
  const linkedAssetCount = assets.reduce((count, asset) => count + (asset.assetClass ? 1 : 0), 0)

  function updateForm(event) {
    const { name, value } = event.target
    setForm((current) => ({ ...current, [name]: value }))
    if (error) setError('')
  }

  function saveType(event) {
    event.preventDefault()
    const code = form.code.trim().toUpperCase()
    const name = form.name.trim()
    const usefulLifeYears = Number(form.usefulLifeYears)

    if (!code || !name || !form.usefulLifeYears) {
      setError('Enter an asset type code, name and useful life.')
      return
    }
    if (!Number.isInteger(usefulLifeYears) || usefulLifeYears < 1) {
      setError('Useful life must be a whole number of at least 1 year.')
      return
    }
    const duplicate = assetTypes.some((type) => type.id !== editingType?.id && (
      type.code.toLowerCase() === code.toLowerCase() || type.name.toLowerCase() === name.toLowerCase()
    ))
    if (duplicate) {
      setError('This code or asset type name is already in use.')
      return
    }

    const changes = { code, name, usefulLifeYears }
    if (editingType) {
      onUpdate(editingType.id, changes, editingType.name)
      onNotice(`${name} was updated.`)
    } else {
      onCreate({ ...changes, active: true })
      onNotice(`${name} was added to asset types.`)
    }
    closeEditor()
  }

  function toggleActive(type) {
    onSetActive(type.id, !type.active)
    onNotice(type.active ? `${type.name} was deactivated.` : `${type.name} was activated.`)
  }

  return (
    <div className="asset-list-workspace asset-type-workspace">
      <PageHeading
        eyebrow="Administrator"
        title="Manage Asset Type"
        description="Create asset types and set the useful life used for each type."
        action={<button className="button button-primary" onClick={openCreate}><Icon name="plus" size={17} />Create asset type</button>}
      />

      <div className="asset-list-metrics" aria-label="Asset type summary">
        <ListMetric label="All asset types" count={assetTypes.length} hint="Registered asset classifications" icon="box" tone="red" total={assetTypes.length} onClick={() => setStatus('All status')} selected={status === 'All status'} />
        <ListMetric label="Active asset types" count={activeTypeCount} hint="Available for asset creation" icon="check" tone="green" total={assetTypes.length} onClick={() => setStatus('Active')} selected={status === 'Active'} />
        <ListMetric label="Inactive asset types" count={assetTypes.length - activeTypeCount} hint="Retained on existing records" icon="file" tone="slate" total={assetTypes.length} onClick={() => setStatus('Inactive')} selected={status === 'Inactive'} />
        <ListMetric label="Assets with a type" count={linkedAssetCount} hint="Assigned an asset classification" icon="tag" tone="amber" total={assets.length} />
      </div>

      <section className="panel asset-list-panel master-list-panel">
        <div className="list-toolbar">
          <div className="asset-status-tabs" aria-label="Asset type groups">
            {['All status', 'Active', 'Inactive'].map((value) => <button type="button" key={value} className={status === value ? 'asset-tab-active' : ''} aria-pressed={status === value} onClick={() => setStatus(value)}>{value === 'All status' ? 'All asset types' : value} <span>({value === 'All status' ? assetTypes.length : value === 'Active' ? activeTypeCount : assetTypes.length - activeTypeCount})</span></button>)}
          </div>
          <div className="toolbar-actions">
            <label className="table-search"><Icon name="search" size={17} /><input aria-label="Search asset types" placeholder="Search by type or code" value={query} onChange={(event) => setQuery(event.target.value)} />{query ? <button type="button" aria-label="Clear search" onClick={() => setQuery('')}><Icon name="close" size={14} /></button> : null}</label>
            {query || status !== 'All status' ? <button type="button" className="list-reset-filter" onClick={() => { setQuery(''); setStatus('All status') }}><Icon name="close" size={14} />Reset</button> : null}
          </div>
        </div>
        <div className="asset-type-accounting-note"><Icon name="info" size={17} /><span>Useful life is maintained on each asset type. Sample settings should be confirmed with Accounting before use.</span></div>

        {visibleTypes.length ? (
          <div className="table-scroll master-table-scroll">
            <table className="asset-table master-table">
              <thead><tr><th>Asset type</th><th>Type code</th><th>Useful life</th><th>Assets</th><th>Status</th><th><span className="sr-only">Actions</span></th></tr></thead>
              <tbody>
                {visibleTypes.map((type) => {
                  const linkedAssets = countAssetsForType(assets, type.name)
                  return (
                    <tr key={type.id}>
                      <td><span className="master-type-cell"><span className="master-type-mark"><Icon name="box" size={17} /></span><strong>{type.name}</strong></span></td>
                      <td><span className="master-code">{type.code}</span></td>
                      <td><span className="master-life"><strong>{type.usefulLifeYears}</strong><span>years</span></span></td>
                      <td><span className="master-asset-count">{linkedAssets}</span></td>
                      <td><span className={`status-badge ${type.active ? 'status-green' : 'status-gray'}`}><span className="status-dot" />{type.active ? 'Active' : 'Inactive'}</span></td>
                      <td><div className="master-row-actions"><button className="master-row-action" onClick={() => openEdit(type)}><Icon name="edit" size={14} />Edit</button><button className="master-row-action" onClick={() => toggleActive(type)}>{type.active ? 'Deactivate' : 'Activate'}</button></div></td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="master-empty"><span className="empty-table-icon"><Icon name="tag" size={19} /></span><strong>{assetTypes.length ? 'No matching asset types' : 'No asset types yet'}</strong><p>{assetTypes.length ? 'Try a different search or status filter.' : 'Create an asset type to set its useful life.'}</p>{!assetTypes.length ? <button className="button button-primary button-small" onClick={openCreate}><Icon name="plus" size={15} />Create asset type</button> : null}</div>
        )}

        <div className="table-footer"><span>Showing <strong>{visibleTypes.length}</strong> of <strong>{assetTypes.length}</strong> asset types</span><span>Inactive types remain on existing asset records.</span></div>
      </section>

      <div className="dashboard-footnote"><span className="footnote-dot" />Master data is saved in this browser for this mockup.</div>

      {isEditorOpen ? (
        <div className="master-dialog-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) closeEditor() }}>
          <section className="master-dialog" role="dialog" aria-modal="true" aria-labelledby="master-dialog-title">
          <div className="master-dialog-header"><div><span className="detail-eyebrow">ASSET MASTER DATA</span><h2 id="master-dialog-title">{editingType ? 'Edit asset type' : 'Create asset type'}</h2><p>Set the useful life used to calculate monthly depreciation for this type.</p></div><button className="modal-close" aria-label="Close dialog" onClick={closeEditor}><Icon name="close" size={17} /></button></div>
            <form onSubmit={saveType}>
              <div className="master-dialog-fields">
                <label className="form-field"><span>Asset type code <em>*</em></span><input name="code" value={form.code} onChange={updateForm} placeholder="e.g. ME-MCH" maxLength={20} autoFocus required /></label>
                <label className="form-field"><span>Asset type name <em>*</em></span><input name="name" value={form.name} onChange={updateForm} placeholder="e.g. ME - Machine" maxLength={60} required /></label>
                <label className="form-field master-life-field"><span>Useful life <em>*</em></span><div className="master-year-input"><input name="usefulLifeYears" type="number" min="1" step="1" value={form.usefulLifeYears} onChange={updateForm} placeholder="Enter years" required /><span>years</span></div><small>Used to calculate monthly depreciation for assets in this type.</small></label>
              </div>
              {error ? <div className="form-error master-form-error" role="alert"><Icon name="alert" size={16} />{error}</div> : null}
              <div className="master-dialog-footer"><button type="button" className="button button-secondary" onClick={closeEditor}>Cancel</button><button type="submit" className="button button-primary"><Icon name="check" size={16} />{editingType ? 'Save changes' : 'Create type'}</button></div>
            </form>
          </section>
        </div>
      ) : null}
    </div>
  )
}
