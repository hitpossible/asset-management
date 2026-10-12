import { useEffect, useRef, useState } from 'react'
import Icon from '../components/Icon.jsx'
import { Field, PageHeading } from '../components/common.jsx'
import { ADMIN_PAGES } from '../data/adminData.js'

function Status({ active }) {
  return <span className={`status-badge ${active ? 'status-green' : 'status-gray'}`}><span className="status-dot" />{active ? 'Active' : 'Inactive'}</span>
}
function Editor({ title, onClose, onSave, children, error }) {
  const ref = useRef(null)
  useEffect(() => { ref.current.showModal() }, [])
  return <dialog ref={ref} className="master-dialog admin-dialog" onCancel={onClose} onClick={event => { if (event.target === ref.current) { const rect = ref.current.getBoundingClientRect(); if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) onClose() } }} aria-labelledby="admin-editor-title">
    <div className="master-dialog-header"><h2 id="admin-editor-title">{title}</h2><button className="modal-close" aria-label="Close dialog" onClick={onClose}><Icon name="close" size={18} /></button></div>
    <form onSubmit={onSave}><div className="master-dialog-fields">{children}</div>{error ? <p className="form-error" role="alert">{error}</p> : null}<div className="master-dialog-footer"><button type="button" className="button button-secondary" onClick={onClose}>Cancel</button><button className="button button-primary" type="submit">Save changes</button></div></form>
  </dialog>
}

export default function AdministratorPage({ page, data, onSave, onNotice }) {
  const isUsers = page === 'admin-users'
  const isPermissions = page === 'admin-permissions'
  const [tab, setTab] = useState('mapping')
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState('All')
  const [editor, setEditor] = useState(null)
  const [error, setError] = useState('')
  const [roleId, setRoleId] = useState(data.roles[0]?.id || '')
  const [grants, setGrants] = useState(data.permissions[roleId] || [])
  const [dirty, setDirty] = useState(false)
  const collection = isUsers ? 'users' : isPermissions ? 'menus' : 'roles'
  const noun = isUsers ? 'user' : isPermissions ? 'menu' : 'role'
  const rows = data[collection].filter(row => `${row.name} ${row.email || ''} ${row.department || ''} ${row.description || ''} ${row.route || ''}`.toLowerCase().includes(query.trim().toLowerCase()) && (status === 'All' || row.active === (status === 'Active')))
  const roots = data.menus.filter(menu => !menu.parentId)
  const orderedMenus = roots.flatMap(root => [root, ...data.menus.filter(menu => menu.parentId === root.id)])
  function persist(next, message) {
    if (!onSave(next)) { onNotice('Changes could not be saved. Browser storage is unavailable.'); return false }
    onNotice(message)
    return true
  }
  function openEditor(row) {
    setError('')
    setEditor(row ? { ...row, roleIds: [...(row.roleIds || [])] } : { name: '', email: '', department: '', roleIds: [], description: '', parentId: '', route: '', active: true })
  }
  function change(field, value) { setEditor(current => ({ ...current, [field]: value })); setError('') }
  function saveEditor(event) {
    event.preventDefault()
    const name = editor.name.trim()
    if (!name) { setError('Enter a name.'); return }
    if (data[collection].some(row => row.id !== editor.id && (isUsers ? row.email.toLowerCase() === editor.email.trim().toLowerCase() : row.name.toLowerCase() === name.toLowerCase()))) { setError(isUsers ? 'This email is already in use.' : 'This name is already in use.'); return }
    if (isUsers && !editor.roleIds.length) { setError('Select at least one role.'); return }
    if (isPermissions && editor.parentId && !editor.route.trim()) { setError('Enter a page reference for this submenu.'); return }
    if (isPermissions && editor.id && editor.parentId && data.menus.some(menu => menu.parentId === editor.id)) { setError('A menu with submenus must remain a main menu.'); return }
    if (isPermissions && editor.route.trim() && data.menus.some(menu => menu.id !== editor.id && menu.route === editor.route.trim())) { setError('This page reference is already in use.'); return }
    const row = { ...editor, name, email: editor.email?.trim(), route: editor.route?.trim(), id: editor.id || crypto.randomUUID() }
    const next = { ...data, [collection]: editor.id ? data[collection].map(item => item.id === editor.id ? row : item) : [...data[collection], row] }
    if (isPermissions && row.parentId) next.permissions = Object.fromEntries(Object.entries(data.permissions).map(([id, ids]) => [id, ids.includes(row.id) ? [...new Set([...ids, row.parentId])] : ids]))
    if (persist(next, `${name} saved.`)) setEditor(null)
  }
  function toggleGrant(menu) {
    setGrants(current => {
      const next = new Set(current)
      if (next.has(menu.id)) {
        next.delete(menu.id)
        if (!menu.parentId) data.menus.filter(child => child.parentId === menu.id).forEach(child => next.delete(child.id))
      } else {
        next.add(menu.id)
        if (menu.parentId) next.add(menu.parentId)
        else data.menus.filter(child => child.parentId === menu.id && child.active).forEach(child => next.add(child.id))
      }
      return [...next]
    }); setDirty(true)
  }
  return <div className="asset-list-workspace asset-type-workspace admin-workspace">
    <PageHeading eyebrow="Administrator" title={ADMIN_PAGES[page]} description={isUsers ? 'Manage users, departments and assigned roles.' : isPermissions ? 'Manage menus, submenus and menu access for each role.' : 'Define roles used to assign access to users.'} action={!isPermissions || tab === 'menus' ? <button className="button button-primary" onClick={() => openEditor()}><Icon name="plus" size={17} />Create {noun}</button> : null} />
    {isPermissions ? <div className="admin-tabs asset-status-tabs">{[['mapping', 'Menu access by role'], ['menus', 'Menus & submenus']].map(([id, label]) => <button key={id} className={tab === id ? 'asset-tab-active' : ''} aria-pressed={tab === id} onClick={() => { setTab(id); if (id === 'mapping' && !dirty) setGrants(data.permissions[roleId] || []) }}>{label}</button>)}</div> : null}
    {isPermissions && tab === 'mapping' ? <section className="panel admin-permission-panel">
      <div className="admin-permission-toolbar"><Field label="Role"><select value={roleId} disabled={dirty} onChange={event => { setRoleId(event.target.value); setGrants(data.permissions[event.target.value] || []); setDirty(false) }}>{data.roles.map(role => <option key={role.id} value={role.id}>{role.name}{role.active ? '' : ' (Inactive)'}</option>)}</select></Field><div><strong>{grants.filter(id => data.menus.some(menu => menu.id === id)).length} menus selected</strong><p>{dirty ? 'Save or reset changes before switching roles.' : 'Select a main menu to include its active submenus.'}</p></div><button className="button button-secondary" disabled={!dirty} onClick={() => { setGrants(data.permissions[roleId] || []); setDirty(false) }}>Reset changes</button><button className="button button-primary" disabled={!dirty || !roleId} onClick={() => { if (persist({ ...data, permissions: { ...data.permissions, [roleId]: grants } }, 'Role permissions saved.')) setDirty(false) }}>Save permissions{dirty ? ' *' : ''}</button></div>
      <div className="table-scroll"><table className="asset-table admin-table"><thead><tr><th>Menu / submenu</th><th>Page reference</th><th>Status</th><th>Access</th></tr></thead><tbody>{orderedMenus.map(menu => <tr key={menu.id} className={!menu.parentId ? 'admin-menu-group' : ''}><td className={menu.parentId ? 'admin-submenu-name' : ''}>{menu.parentId ? <Icon name="chevron" size={14} /> : null}<strong>{menu.name}</strong></td><td>{menu.route || 'Menu group'}</td><td><Status active={menu.active} /></td><td><input type="checkbox" aria-label={`Allow ${menu.name}`} checked={grants.includes(menu.id)} onChange={() => toggleGrant(menu)} /></td></tr>)}</tbody></table></div>
      <div className="table-footer"><span>{dirty ? 'Unsaved permission changes' : 'Permissions saved'} · Inactive menus and roles retain their assignments.</span></div>
    </section> : <section className="panel asset-list-panel master-list-panel">
      <div className="list-toolbar"><div className="asset-status-tabs">{['All', 'Active', 'Inactive'].map(value => <button key={value} className={status === value ? 'asset-tab-active' : ''} aria-pressed={status === value} onClick={() => setStatus(value)}>{value}</button>)}</div><label className="table-search"><Icon name="search" size={17} /><input aria-label={`Search ${collection}`} placeholder={`Search ${collection}`} value={query} onChange={event => setQuery(event.target.value)} /></label></div>
      <div className="table-scroll"><table className="asset-table admin-table"><thead><tr><th>{isUsers ? 'User' : isPermissions ? 'Menu / submenu' : 'Role'}</th><th>{isUsers ? 'Department' : isPermissions ? 'Parent menu' : 'Description'}</th><th>{isUsers ? 'Roles' : isPermissions ? 'Page reference' : 'Assigned users'}</th><th>Status</th><th>Actions</th></tr></thead><tbody>{rows.map(row => <tr key={row.id}><td><strong>{row.name}</strong>{isUsers ? <small>{row.email}</small> : null}</td><td>{isUsers ? row.department || '—' : isPermissions ? data.menus.find(menu => menu.id === row.parentId)?.name || 'Main menu' : row.description || '—'}</td><td>{isUsers ? row.roleIds.map(id => <span className="admin-role-tag" key={id}>{data.roles.find(role => role.id === id)?.name || id}</span>) : isPermissions ? row.route || '—' : data.users.filter(user => user.roleIds.includes(row.id)).length}</td><td><Status active={row.active} /></td><td><div className="master-row-actions"><button className="master-row-action" onClick={() => openEditor(row)}><Icon name="edit" size={14} />Edit</button><button className="master-row-action" onClick={() => persist({ ...data, [collection]: data[collection].map(item => item.id === row.id ? { ...item, active: !item.active } : item) }, `${row.name} ${row.active ? 'deactivated' : 'activated'}.`)}>{row.active ? 'Deactivate' : 'Activate'}</button></div></td></tr>)}</tbody></table>{!rows.length ? <div className="master-empty"><strong>No matching {collection}</strong><p>Try another search or status filter.</p></div> : null}</div><div className="table-footer"><span>Showing {rows.length} of {data[collection].length} {collection}</span><span>Inactive records retain their assignments.</span></div>
    </section>}
    <div className="dashboard-footnote"><span className="footnote-dot" />Administration settings are saved in this browser. Menu access is a mockup configuration; the demo session remains Administrator.</div>
    {editor ? <Editor title={`${editor.id ? 'Edit' : 'Create'} ${noun}`} onClose={() => setEditor(null)} onSave={saveEditor} error={error}>
      <Field label={isUsers ? 'Full name' : isPermissions ? 'Menu name' : 'Role name'} required><input autoFocus required maxLength={80} value={editor.name} onChange={event => change('name', event.target.value)} /></Field>
      {isUsers ? <><Field label="Email" required><input type="email" required value={editor.email} onChange={event => change('email', event.target.value)} /></Field><Field label="Department"><input value={editor.department} onChange={event => change('department', event.target.value)} /></Field><fieldset className="admin-role-options"><legend>Assigned roles *</legend>{data.roles.map(role => <label key={role.id}><input type="checkbox" checked={editor.roleIds.includes(role.id)} disabled={!role.active && !editor.roleIds.includes(role.id)} onChange={event => change('roleIds', event.target.checked ? [...editor.roleIds, role.id] : editor.roleIds.filter(id => id !== role.id))} />{role.name}{role.active ? '' : ' (Inactive)'}</label>)}</fieldset></> : isPermissions ? <><Field label="Parent menu"><select value={editor.parentId} onChange={event => change('parentId', event.target.value)}><option value="">None — main menu</option>{roots.filter(menu => menu.id !== editor.id).map(menu => <option key={menu.id} value={menu.id}>{menu.name}</option>)}</select></Field><Field label="Page reference" required={!!editor.parentId}><input required={!!editor.parentId} value={editor.route} onChange={event => change('route', event.target.value)} placeholder="e.g. assets" /><small>Reference for menu mapping. New entries do not create application pages.</small></Field></> : <Field label="Description"><input value={editor.description} onChange={event => change('description', event.target.value)} maxLength={160} /></Field>}
      <Field label="Status"><select value={String(editor.active)} onChange={event => change('active', event.target.value === 'true')}><option value="true">Active</option><option value="false">Inactive</option></select></Field>
    </Editor> : null}
  </div>
}
