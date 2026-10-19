import { useEffect, useRef, useState } from 'react'
import Icon from '../components/Icon.jsx'
import { PageHeading } from '../components/common.jsx'
import { validateDepartmentApprovers } from '../utils/departmentApproverUtils.js'
import './DepartmentApproversPage.css'

export default function DepartmentApproversPage({ data, assets = [], onSave, onNotice }) {
  const [records, setRecords] = useState(() => data.departmentApprovers || [])
  const [teamUserId, setTeamUserId] = useState(data.assetTeamAcknowledgementUserId || '')
  const [activeSection, setActiveSection] = useState('departments')
  const [error, setError] = useState('')
  const [focusId, setFocusId] = useState('')
  const inputs = useRef(new Map())
  useEffect(() => { if (focusId) { inputs.current.get(focusId)?.focus(); setFocusId('') } }, [focusId])
  const activeUsers = data.users.filter((user) => user.active)
  const teamUsers = activeUsers.filter((user) => user.roleIds.includes('role-asset'))
  const assignedTeamUser = teamUsers.find((user) => user.id === teamUserId)
  const teamAssignmentLabel = assignedTeamUser ? 'Assigned' : teamUserId ? 'Unavailable' : 'Needs setup'
  const departments = [...new Set([...data.users.map((user) => user.department), ...assets.map((asset) => asset.department)].filter(Boolean))].sort()
  const dirty = JSON.stringify(records) !== JSON.stringify(data.departmentApprovers || []) || teamUserId !== (data.assetTeamAcknowledgementUserId || '')
  function update(id, changes) { setRecords((current) => current.map((item) => item.id === id ? { ...item, ...changes } : item)); setError('') }
  function add() { const id = crypto.randomUUID(); setRecords((current) => [...current, { id, department: '', userId: '', active: true }]); setFocusId(id); setError('') }
  function save(event) {
    event.preventDefault()
    const issue = validateDepartmentApprovers(records, data.users, teamUserId)
    if (issue) { setActiveSection(/Asset Team/i.test(issue) ? 'asset-team' : 'departments'); setError(issue); return }
    const next = { ...data, departmentApprovers: records.map((item) => ({ ...item, department: item.department.trim().replace(/\s+/g, ' ') })), assetTeamAcknowledgementUserId: teamUserId }
    if (!onSave(next)) { setError('Could not save. Browser storage is unavailable or full.'); return }
    setRecords(next.departmentApprovers); setError(''); onNotice('Transfer approval settings saved. New transfers use the department leaders and final Asset Team acknowledgement configured here.')
  }
  return <div className="department-approver-workspace">
    <PageHeading eyebrow="Administrator" title="Department Approvers" description="Configure department leader approvals and the separate final Asset Team acknowledgement for transfers." action={activeSection === 'departments' ? <button type="button" className="button button-primary" onClick={add}><Icon name="plus" size={17} />Add department</button> : null} />

    <section className="panel department-transfer-flow" aria-labelledby="department-transfer-flow-title">
      <header><span className="department-flow-icon"><Icon name="transfer" size={21} /></span><div><h2 id="department-transfer-flow-title">Transfer approval sequence</h2><p>New transfer requests resolve reviewers from the selected departments.</p></div></header>
      <div className="department-transfer-sequence">
        <section className="department-flow-group"><h3>Department leader approvals <span>Steps 1–2</span></h3><ol>
          <li><span>1</span><div><strong>Source department leader</strong><small>Approves the Asset leaving the department</small></div></li>
          <li><span>2</span><div><strong>Destination department leader</strong><small>Approves the Asset entering the department</small></div></li>
        </ol></section>
        <Icon name="chevron" size={20} className="department-flow-connector" />
        <section className="department-flow-group department-flow-acknowledgement"><h3>Asset Team acknowledgement <span>Final step</span></h3><div className="department-flow-final-step"><span>3</span><div><strong>Records the approved transfer</strong><small>Completes the handoff and assignment update</small></div></div></section>
      </div>
    </section>

    <div className="department-approver-tabs" role="group" aria-label="Transfer approver settings">
      <button type="button" aria-pressed={activeSection === 'departments'} onClick={() => { setActiveSection('departments'); setError('') }}><span>Department leader approvals</span><small>{records.filter((item) => item.active !== false).length} active departments</small></button>
      <button type="button" aria-pressed={activeSection === 'asset-team'} onClick={() => { setActiveSection('asset-team'); setError('') }}><span>Asset Team acknowledgement</span><small>{teamAssignmentLabel}</small></button>
    </div>

    <form onSubmit={save}>
      {activeSection === 'departments' ? <section className="panel department-approver-panel" aria-labelledby="department-leaders-title">
        <header><div><h2 id="department-leaders-title">Department leader approvers</h2><p>Assign one active leader to each department. These users approve the source and destination sides of a transfer.</p></div></header>
        <div className="table-scroll"><table className="department-approver-table"><thead><tr><th>Department</th><th>Department leader</th><th>Status</th><th><span className="sr-only">Actions</span></th></tr></thead><tbody>{records.map((record, index) => <tr key={record.id}><td><input ref={(node) => { if (node) inputs.current.set(record.id, node); else inputs.current.delete(record.id) }} aria-label={`Department ${index + 1}`} list="department-approver-options" value={record.department} maxLength={100} placeholder="Select or enter department" onChange={(event) => update(record.id, { department: event.target.value })} /></td><td><select aria-label={`Approver for ${record.department || `department ${index + 1}`}`} value={record.userId} onChange={(event) => update(record.id, { userId: event.target.value })}><option value="">Select a person</option>{activeUsers.map((user) => <option key={user.id} value={user.id}>{user.name} · {user.department || 'No department'}</option>)}{record.userId && !activeUsers.some((user) => user.id === record.userId) ? <option value={record.userId}>Unavailable person — select another</option> : null}</select></td><td><label className="department-active"><input type="checkbox" checked={record.active !== false} onChange={(event) => update(record.id, { active: event.target.checked })} />{record.active !== false ? 'Active' : 'Inactive'}</label></td><td><button type="button" className="department-remove" aria-label={`Remove ${record.department || 'department'}`} onClick={() => setRecords((current) => current.filter((item) => item.id !== record.id))}><Icon name="close" size={17} /></button></td></tr>)}</tbody></table></div><datalist id="department-approver-options">{departments.map((department) => <option key={department} value={department} />)}</datalist>
        {!records.length ? <div className="department-approver-empty"><Icon name="user" size={28} /><strong>No department leaders configured</strong><p>Add a department and select its leader to enable transfer approvals.</p><button type="button" className="button button-secondary" onClick={add}>Add department</button></div> : null}
      </section> : <section className="panel department-team-setting" aria-labelledby="asset-team-ack-title">
        <span className="department-team-icon"><Icon name="check" size={23} /></span><div><span className="department-team-kicker">Transfer · Final step</span><h2 id="asset-team-ack-title">Asset Team acknowledgement</h2><p>This person records the handoff after both department leaders approve. The transfer completes after acknowledgement.</p>
          <label><span>Asset Team member</span><select aria-label="Asset Team acknowledgement person" value={teamUserId} onChange={(event) => { setTeamUserId(event.target.value); setError('') }}><option value="">Select Asset Team member</option>{teamUsers.map((user) => <option key={user.id} value={user.id}>{user.name}</option>)}{teamUserId && !teamUsers.some((user) => user.id === teamUserId) ? <option value={teamUserId}>Unavailable member — select another</option> : null}</select></label>
          {!teamUsers.length ? <p className="department-team-empty-help">Add an active user with the Asset Team role in Manage User.</p> : null}
        </div>
      </section>}

      <p className="department-approver-note"><Icon name="info" size={16} />New transfers use these settings. Submitted requests keep their recorded approvers and full history.</p>
      {error ? <p className="form-error" role="alert">{error}</p> : null}
      <footer className="department-approver-save"><span>{dirty ? 'Unsaved transfer approval settings' : 'All transfer approval settings saved'}<small>Includes department leaders and the Asset Team acknowledgement</small></span><button type="button" className="button button-secondary" disabled={!dirty} onClick={() => { setRecords(data.departmentApprovers || []); setTeamUserId(data.assetTeamAcknowledgementUserId || ''); setError('') }}>Discard changes</button><button type="submit" className="button button-primary" disabled={!dirty}><Icon name="check" size={16} />Save transfer settings</button></footer>
    </form>
  </div>
}
