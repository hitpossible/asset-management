import { useEffect, useMemo, useState } from 'react'
import Icon from '../components/Icon.jsx'
import { PageHeading } from '../components/common.jsx'
import { DEFAULT_TRANSFER_WORKFLOW, ACTIVATION_STEP_ORDER, TRANSFER_STEP_ORDER, APPROVAL_JOBS, getWorkflowAssignments, getWorkflowDefinition } from '../utils/workflowAssignmentUtils.js'
import { getActivationSteps, getApprovalTypes, resolveApprovalSteps } from '../utils/activationApprovalUtils.js'
import { normalizeDepartment, validateResponsibilityAssignments } from '../utils/departmentApproverUtils.js'
import './ApprovalWorkflowSettings.css'

const clone = (value) => JSON.parse(JSON.stringify(value))
const blankStep = (index = 0) => ({ id: crypto.randomUUID(), label: '', sequence: index + 1, actionType: 'Approve', approverType: 'user', assignmentType: 'user', userId: '', roleId: '', dynamicResolver: '', required: true, allowReject: true, allowSendBack: true, status: 'Pending Approval' })

function editableWorkflows(data) {
  const workflows = getApprovalTypes(data).map((workflow) => ({ ...clone(workflow), steps: workflow.steps.map((step, index) => ({
    ...step,
    sequence: index + 1,
    approverType: step.approverType || step.assignmentType || (step.userId ? 'user' : 'role'),
    assignmentType: step.approverType || step.assignmentType || (step.userId ? 'user' : 'role'),
    actionType: step.actionType || (step.action === 'acknowledge' ? 'Acknowledge' : step.action === 'review' ? 'Review' : 'Approve'),
    required: step.required !== false,
    allowReject: step.allowReject !== false,
    allowSendBack: step.allowSendBack !== false,
  })) }))
  if (!workflows.some((workflow) => workflow.process === 'asset-transfer' || workflow.id === DEFAULT_TRANSFER_WORKFLOW.id)) workflows.push(clone(DEFAULT_TRANSFER_WORKFLOW))
  return workflows
}

function serializeWorkflows(workflows) {
  return workflows.map(({ id, name, process, active, steps }) => ({
    id, name: String(name || '').trim(), process, active: active !== false,
    steps: steps.map((step, index) => ({
      id: step.id, label: String(step.label || '').trim(), sequence: index + 1,
      actionType: step.actionType || 'Approve', action: (step.actionType || 'Approve').toLowerCase(),
      approverType: step.approverType || step.assignmentType || 'user', assignmentType: step.approverType || step.assignmentType || 'user',
      userId: step.userId || '', roleId: step.roleId || '', dynamicResolver: step.dynamicResolver || '',
      required: step.required !== false, allowReject: step.allowReject !== false, allowSendBack: step.allowSendBack !== false,
      requiresDepreciationDate: Boolean(step.requiresDepreciationDate), status: step.status || 'Pending Approval',
    })),
  }))
}

function normalizeAssignments(data) {
  return getWorkflowAssignments(data).map((item) => ({ id: item.id || crypto.randomUUID(), jobId: item.jobId, workflowId: item.workflowId, depreciationStepId: item.depreciationStepId || '' }))
}

function getDepartmentOptions(data, assets) {
  return [...new Set([
    ...(data.users || []).map((user) => user.department),
    ...(assets || []).map((asset) => asset.department),
    ...(data.departmentApprovers || []).map((item) => item.department),
    ...(data.responsibilityAssignments || []).map((item) => item.department),
  ].map((item) => String(item || '').trim()).filter(Boolean))].sort((a, b) => a.localeCompare(b))
}

function editableResponsibilityAssignments(records, departments) {
  return (records || []).map((item, index) => {
    const savedDepartment = item.department || item.scope || ''
    const department = departments.find((option) => normalizeDepartment(option) === normalizeDepartment(savedDepartment)) || ''
    return { id: item.id || `department-assignment-${index + 1}`, department, userId: item.userId || '', active: item.active !== false }
  })
}

function workflowForJob(jobId, workflows, assignments) {
  const assignment = assignments.find((item) => item.jobId === jobId)
  if (assignment) return workflows.find((item) => item.id === assignment.workflowId) || null
  if (jobId === 'asset-transfer') return workflows.find((item) => item.id === DEFAULT_TRANSFER_WORKFLOW.id) || null
  return null
}

function statusForJob(jobId, workflows, assignments) {
  const workflow = workflowForJob(jobId, workflows, assignments)
  const assignment = assignments.some((item) => item.jobId === jobId)
  if (!workflow || (jobId !== 'asset-transfer' && !assignment)) return { label: 'Not Configured', tone: 'unconfigured', count: 0 }
  return { label: workflow.active ? 'Active' : 'Inactive', tone: workflow.active ? 'active' : 'inactive', count: workflow.steps.length }
}

function validateWorkflow(jobId, workflow, data, assignments, responsibilityAssignments) {
  if (!workflow) return 'Choose or create a workflow for this Transaction Type.'
  if (!String(workflow.name || '').trim()) return 'Enter a Workflow Name.'
  if (!workflow.steps.length) return 'Add at least one approval step.'
  const ids = workflow.steps.map((step) => step.id)
  if (new Set(ids).size !== ids.length) return 'Each approval step must have a unique ID.'
  if (!workflow.active) return ''
  const steps = resolveApprovalSteps(workflow.steps, data.users, data.roles)
  if (steps.some((step) => !step.label.trim())) return 'Enter a Step Name for each approval step.'
  if (steps.some((step) => step.required && !step.available)) return 'Every required step needs an active User, Role, or supported Dynamic Resolver.'

  if (jobId === 'asset-transfer') {
    const resolvers = workflow.steps.map((step) => step.dynamicResolver)
    if (workflow.steps.length !== 3 || resolvers[0] !== 'SOURCE_AREA_OWNER' || resolvers[1] !== 'DESTINATION_AREA_OWNER') return 'Asset Transfer must keep Source Area Owner → Destination Area Owner → Asset Team in that order.'
    if (workflow.steps.some((step) => !step.required)) return 'All three Asset Transfer steps are required to complete a transfer.'
    if (workflow.steps[0].actionType !== 'Approve' || workflow.steps[1].actionType !== 'Approve') return 'Source and Destination Area Owner steps must use Approve.'
    const acknowledgement = workflow.steps[2]
    if (acknowledgement.actionType !== 'Acknowledge') return 'The final Asset Team step must use Acknowledge.'
    const validTeamApprover = acknowledgement.approverType === 'role'
      ? acknowledgement.roleId === 'role-asset'
      : acknowledgement.approverType === 'user' && data.users.some((user) => user.id === acknowledgement.userId && user.active && user.roleIds.includes('role-asset'))
    if (!validTeamApprover) return 'The final step must be assigned to the Asset Team role or an active Asset Team member.'
    const activeOwners = responsibilityAssignments.filter((item) => item.active !== false)
    if (activeOwners.some((item) => !String(item.department || '').trim() || !data.users.some((user) => user.id === item.userId && user.active))) return 'Resolve each active Area Owner assignment to a Department and active user.'
    return ''
  }

  if (jobId === 'asset-activation') {
    if (workflow.steps.length !== 5 || workflow.steps.some((step, index) => step.id !== ACTIVATION_STEP_ORDER[index])) return 'Asset Activation must keep its five approval levels in order: Asset Team 1, Asset Team 2, Account 1, Account 2, Account 3.'
    if (workflow.steps.some((step) => !step.required || step.actionType !== 'Approve')) return 'All five Asset Activation levels must be required approvals.'
  }
  if (assignments.filter((item) => item.jobId === jobId).length !== 1) return 'A Transaction Type can have only one assigned workflow.'
  return ''
}

function displayApprover(step, users, roles) {
  if (step.approverType === 'dynamic') return step.dynamicResolver === 'SOURCE_AREA_OWNER' ? 'Source Area Owner' : step.dynamicResolver === 'DESTINATION_AREA_OWNER' ? 'Destination Area Owner' : 'Select a resolver'
  if (step.approverType === 'role') return roles.find((role) => role.id === step.roleId)?.name || 'Select a role'
  return users.find((user) => user.id === step.userId)?.name || 'Select a user'
}

export default function ActivationApprovalSettingsPage({ data, assets = [], onSave, onNotice, initialSection = 'workflows' }) {
  const [workflows, setWorkflows] = useState(() => editableWorkflows(data))
  const [assignments, setAssignments] = useState(() => normalizeAssignments(data))
  const [responsibilityAssignments, setResponsibilityAssignments] = useState(() => editableResponsibilityAssignments(data.responsibilityAssignments, getDepartmentOptions(data, assets)))
  const [section, setSection] = useState(initialSection)
  const [selectedJobId, setSelectedJobId] = useState('asset-activation')
  const [selectedStepId, setSelectedStepId] = useState(() => editableWorkflows(data).find((item) => item.process === 'asset-activation' || item.id === 'asset-activation-default')?.steps[0]?.id || '')
  const [workflowQuery, setWorkflowQuery] = useState('')
  const [responsibilityQuery, setResponsibilityQuery] = useState('')
  const [departmentFilter, setDepartmentFilter] = useState('all')
  const [editingResponsibilityId, setEditingResponsibilityId] = useState(null)
  const [responsibilityForm, setResponsibilityForm] = useState({ department: '', userId: '', active: true })
  const [responsibilityFormError, setResponsibilityFormError] = useState('')
  const [confirmSave, setConfirmSave] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => { setSection(initialSection) }, [initialSection])

  const baselineWorkflows = editableWorkflows(data)
  const baselineAssignments = normalizeAssignments(data)
  const departmentOptions = getDepartmentOptions(data, assets)
  const baselineResponsibilityAssignments = editableResponsibilityAssignments(data.responsibilityAssignments, departmentOptions)
  const serializedWorkflows = serializeWorkflows(workflows)
  const dirty = JSON.stringify(serializedWorkflows) !== JSON.stringify(serializeWorkflows(baselineWorkflows))
    || JSON.stringify(assignments) !== JSON.stringify(baselineAssignments)
    || JSON.stringify(responsibilityAssignments) !== JSON.stringify(baselineResponsibilityAssignments)
  const activeUsers = data.users.filter((user) => user.active)
  const selectedWorkflow = workflowForJob(selectedJobId, workflows, assignments)
  const selectedStep = selectedWorkflow?.steps.find((step) => step.id === selectedStepId) || selectedWorkflow?.steps[0] || null
  const workflowStatus = statusForJob(selectedJobId, workflows, assignments)
  const assignedWorkflowCount = assignments.length + (assignments.some((item) => item.jobId === 'asset-transfer') ? 0 : 1)
  const resolvedPreview = selectedWorkflow ? resolveApprovalSteps(selectedWorkflow.steps, data.users, data.roles) : []
  const filteredResponsibilities = useMemo(() => responsibilityAssignments.filter((item) => {
    const userName = data.users.find((user) => user.id === item.userId)?.name || ''
    const queryMatches = `${item.department} ${userName}`.toLowerCase().includes(responsibilityQuery.trim().toLowerCase())
    return queryMatches && (departmentFilter === 'all' || item.department === departmentFilter)
  }), [responsibilityAssignments, departmentFilter, responsibilityQuery, data.users])

  function updateWorkflow(changes) {
    if (!selectedWorkflow) return
    setWorkflows((current) => current.map((workflow) => workflow.id === selectedWorkflow.id ? { ...workflow, ...changes } : workflow))
    setError('')
  }

  function updateStep(changes) {
    if (!selectedWorkflow || !selectedStep) return
    const updated = { ...selectedStep, ...changes }
    if (updated.approverType !== selectedStep.approverType) {
      updated.assignmentType = updated.approverType
      updated.userId = ''
      updated.roleId = ''
      updated.dynamicResolver = ''
    }
    setWorkflows((current) => current.map((workflow) => workflow.id === selectedWorkflow.id ? { ...workflow, steps: workflow.steps.map((step) => step.id === selectedStep.id ? updated : step) } : workflow))
    setError('')
  }

  function moveStep(offset) {
    const index = selectedWorkflow?.steps.findIndex((step) => step.id === selectedStepId) ?? -1
    const target = index + offset
    if (index < 0 || target < 0 || target >= selectedWorkflow.steps.length) return
    const steps = [...selectedWorkflow.steps]
    ;[steps[index], steps[target]] = [steps[target], steps[index]]
    steps.forEach((step, position) => { step.sequence = position + 1 })
    setWorkflows((current) => current.map((workflow) => workflow.id === selectedWorkflow.id ? { ...workflow, steps } : workflow))
    setSelectedStepId(steps[target].id)
    setError('')
  }

  function addWorkflow() {
    const job = APPROVAL_JOBS.find((item) => item.id === selectedJobId)
    if (!job || workflowForJob(selectedJobId, workflows, assignments)) return
    const steps = selectedJobId === 'asset-activation'
      ? getActivationSteps([], data.users, data.roles).map((step, index) => ({ ...step, sequence: index + 1, approverType: 'role', assignmentType: 'role', actionType: 'Approve', required: true, allowReject: true, allowSendBack: true }))
      : [blankStep()]
    const workflow = { id: crypto.randomUUID(), name: job.name, process: job.id, active: true, steps }
    setWorkflows((current) => [...current, workflow])
    setAssignments((current) => [...current, { id: crypto.randomUUID(), jobId: job.id, workflowId: workflow.id, depreciationStepId: '' }])
    setSelectedStepId(steps[0].id)
    setError('')
  }

  function updateAssignment(id, changes) {
    setAssignments((current) => current.map((item) => item.id === id ? { ...item, ...changes } : item))
  }

  function openResponsibilityEditor(record = null) {
    setEditingResponsibilityId(record?.id || '')
    setResponsibilityForm({ department: record?.department || '', userId: record?.userId || '', active: record?.active !== false })
    setResponsibilityFormError('')
    setConfirmSave(false)
  }

  function closeResponsibilityEditor() {
    setEditingResponsibilityId(null)
    setResponsibilityFormError('')
  }

  function saveResponsibility(event) {
    event.preventDefault()
    const department = String(responsibilityForm.department || '').trim().replace(/\s+/g, ' ')
    if (!department || !responsibilityForm.userId) { setResponsibilityFormError('Select a Department and an Assigned User.'); return }
    if (!data.users.some((user) => user.id === responsibilityForm.userId && user.active)) { setResponsibilityFormError('Select an active user.'); return }
    const duplicate = responsibilityForm.active && responsibilityAssignments.some((item) => item.id !== editingResponsibilityId && item.active !== false && normalizeDepartment(item.department) === normalizeDepartment(department))
    if (duplicate) { setResponsibilityFormError('This Department already has an active Area Owner assignment.'); return }
    const assignment = { id: editingResponsibilityId || crypto.randomUUID(), department, userId: responsibilityForm.userId, active: responsibilityForm.active }
    setResponsibilityAssignments((current) => editingResponsibilityId ? current.map((item) => item.id === editingResponsibilityId ? assignment : item) : [...current, assignment])
    setEditingResponsibilityId(null)
    setResponsibilityFormError('')
    setError('')
  }

  function addResponsibility() {
    setDepartmentFilter('all')
    openResponsibilityEditor()
  }

  function validateBeforeSave() {
    const assignmentError = validateResponsibilityAssignments(responsibilityAssignments, data.users)
    if (assignmentError) { setSection('responsibilities'); setError(assignmentError); return false }
    const types = new Set()
    for (const assignment of assignments) {
      if (types.has(assignment.jobId)) { setSection('workflows'); setSelectedJobId(assignment.jobId); setError('Each Transaction Type can have only one workflow assignment.'); return false }
      types.add(assignment.jobId)
    }
    const jobsToValidate = new Set(assignments.map((item) => item.jobId))
    if (workflowForJob('asset-transfer', workflows, assignments)) jobsToValidate.add('asset-transfer')
    for (const jobId of jobsToValidate) {
      const workflow = workflowForJob(jobId, workflows, assignments)
      const issue = validateWorkflow(jobId, workflow, data, assignments, responsibilityAssignments)
      if (issue) { setSection('workflows'); setSelectedJobId(jobId); setSelectedStepId(workflow?.steps[0]?.id || ''); setError(issue); return false }
    }
    return true
  }

  function openSaveConfirmation() {
    if (!validateBeforeSave()) return
    setConfirmSave(true)
  }

  function saveChanges() {
    const persistedAssignments = [...assignments]
    if (!persistedAssignments.some((item) => item.jobId === 'asset-transfer')) {
      const transfer = workflows.find((item) => item.id === DEFAULT_TRANSFER_WORKFLOW.id)
      if (transfer) persistedAssignments.push({ id: crypto.randomUUID(), jobId: 'asset-transfer', workflowId: transfer.id, depreciationStepId: '' })
    }
    const next = {
      ...data,
      approvalTypes: serializeWorkflows(workflows),
      workflowAssignments: persistedAssignments.map(({ id, jobId, workflowId, depreciationStepId }) => ({ id, jobId, workflowId, depreciationStepId: jobId === 'asset-activation' ? depreciationStepId || '' : '' })),
      responsibilityAssignments: responsibilityAssignments.map((item) => ({ id: item.id, department: String(item.department || '').trim().replace(/\s+/g, ' '), userId: item.userId || '', active: item.active !== false })),
    }
    delete next.defaultActivationApprovalTypeId
    delete next.activationApprovalSteps
    if (!onSave(next)) { setError('Could not save. Browser storage is unavailable or full.'); setConfirmSave(false); return }
    setAssignments(persistedAssignments)
    setResponsibilityAssignments(next.responsibilityAssignments)
    setError('')
    setConfirmSave(false)
    onNotice('Approval Management settings saved. New transactions use these steps; in-progress approvals keep their saved workflow snapshot.')
  }

  const filteredJobs = APPROVAL_JOBS.filter((job) => `${job.name} ${job.source}`.toLowerCase().includes(workflowQuery.trim().toLowerCase()))
  const displayedResponsibilities = [...filteredResponsibilities].sort((a, b) => a.department.localeCompare(b.department))

  return <div className="workflow-settings-workspace approval-management-workspace">
    <PageHeading eyebrow="Administrator" title="Approval Management" description="Configure ordered approvals and resolve transfer approvers by Department." />
    <div className="approval-prototype-note"><Icon name="info" size={16} /><span>Prototype storage: changes are saved in this browser. No server approval API is connected in this project.</span></div>

    <div className="workflow-settings-tabs" role="tablist" aria-label="Approval management sections">
      <button type="button" role="tab" aria-selected={section === 'workflows'} aria-pressed={section === 'workflows'} onClick={() => { setSection('workflows'); setError('') }}><Icon name="transfer" size={17} />Transaction workflows<span>{assignedWorkflowCount}</span></button>
      <button type="button" role="tab" aria-selected={section === 'responsibilities'} aria-pressed={section === 'responsibilities'} onClick={() => { setSection('responsibilities'); setError('') }}><Icon name="user" size={17} />Responsibility matrix<span>{responsibilityAssignments.filter((item) => item.active !== false).length}</span></button>
    </div>

    {section === 'workflows' ? <div className="approval-management-layout">
      <aside className="panel approval-workflow-list" aria-label="Transaction workflows">
        <div className="approval-list-heading"><div><h2>Transaction types</h2><p>Select a workflow to manage its approval steps.</p></div><span>{APPROVAL_JOBS.length}</span></div>
        <label className="workflow-library-search"><Icon name="search" size={16} /><input aria-label="Search transaction types" placeholder="Search transactions" value={workflowQuery} onChange={(event) => setWorkflowQuery(event.target.value)} /></label>
        <div className="approval-job-list">{filteredJobs.map((job) => {
          const status = statusForJob(job.id, workflows, assignments)
          return <button type="button" key={job.id} aria-pressed={selectedJobId === job.id} onClick={() => { setSelectedJobId(job.id); const target = workflowForJob(job.id, workflows, assignments); setSelectedStepId(target?.steps[0]?.id || ''); setError('') }}>
            <span className="approval-job-icon"><Icon name={job.icon} size={18} /></span>
            <span className="approval-job-copy"><strong>{job.name}</strong><small>{status.count ? `${status.count} ${status.count === 1 ? 'step' : 'steps'}` : 'No approval route defined'}</small></span>
            <span className={`approval-status-badge is-${status.tone}`}>{status.label}</span>
          </button>
        })}{!filteredJobs.length ? <p className="approval-list-empty">No transaction types match this search.</p> : null}</div>
      </aside>

      <section className="panel approval-workflow-editor" aria-live="polite">
        {selectedWorkflow ? <>
          <header className="approval-editor-header">
            <div><span className="approval-editor-kicker">{APPROVAL_JOBS.find((job) => job.id === selectedJobId)?.name}</span><h2>{selectedWorkflow.name || 'Untitled workflow'}</h2><p>{selectedWorkflow.steps.length} ordered steps · {APPROVAL_JOBS.find((job) => job.id === selectedJobId)?.result}</p></div>
            <label className="workflow-active-toggle"><input type="checkbox" checked={selectedWorkflow.active !== false} onChange={(event) => updateWorkflow({ active: event.target.checked })} />Active</label>
          </header>
          <div className="approval-workflow-fields"><label><span>Workflow Name <em>*</em></span><input value={selectedWorkflow.name} maxLength={100} onChange={(event) => updateWorkflow({ name: event.target.value })} /></label><div><span>Transaction Type</span><strong>{APPROVAL_JOBS.find((job) => job.id === selectedJobId)?.name}</strong></div><div><span>Workflow Status</span><strong className={`approval-status-inline is-${workflowStatus.tone}`}>{selectedWorkflow.active ? 'Active' : 'Inactive'}</strong></div></div>
          <section className="approval-sequence-section" aria-labelledby="approval-sequence-title">
            <div className="approval-section-heading"><div><h3 id="approval-sequence-title">Approval sequence</h3><p>Each transaction advances through its approval steps in order.</p></div><span>{selectedWorkflow.steps.length} steps</span></div>
            {selectedWorkflow.steps.length ? <div className="approval-stepper" role="list" aria-label="Approval steps">
              {resolvedPreview.map((step, index) => <div className="approval-stepper-fragment" key={step.id}>
                <button type="button" role="listitem" aria-current={selectedStep?.id === step.id ? 'step' : undefined} className={`approval-stepper-node ${selectedStep?.id === step.id ? 'is-selected' : ''}`} onClick={() => { setSelectedStepId(step.id); setError('') }}>
                  <span className="approval-stepper-number">{index + 1}</span><strong>{step.label || 'Unnamed step'}</strong><small>{step.actionType} · {displayApprover(step, data.users, data.roles)}</small>
                </button><span className="approval-stepper-connector" aria-hidden="true" />
              </div>)}
              <div className="approval-stepper-completion"><span><Icon name="check" size={16} /></span><strong>{selectedJobId === 'asset-transfer' ? 'Transfer Completed' : selectedJobId === 'asset-activation' ? 'Asset Status: Active' : 'Completed'}</strong></div>
            </div> : <div className="approval-no-steps"><Icon name="info" size={18} /><span>This workflow has no configured approval steps.</span></div>}
          </section>

          {selectedStep ? <section className="approval-step-configuration" aria-labelledby="step-configuration-title">
            <div className="approval-section-heading"><div><h3 id="step-configuration-title">Step configuration</h3><p>Update step {selectedWorkflow.steps.findIndex((step) => step.id === selectedStep.id) + 1} without changing submitted approval snapshots.</p></div><div className="approval-step-order-controls"><button type="button" aria-label="Move step earlier" title="Move step earlier" disabled={selectedWorkflow.steps.findIndex((step) => step.id === selectedStep.id) === 0} onClick={() => moveStep(-1)}><Icon name="down" size={16} className="workflow-arrow-up" /></button><span>Sequence {selectedWorkflow.steps.findIndex((step) => step.id === selectedStep.id) + 1}</span><button type="button" aria-label="Move step later" title="Move step later" disabled={selectedWorkflow.steps.findIndex((step) => step.id === selectedStep.id) === selectedWorkflow.steps.length - 1} onClick={() => moveStep(1)}><Icon name="down" size={16} /></button></div></div>
            <div className="approval-step-form-grid">
              <label><span>Step Name <em>*</em></span><input value={selectedStep.label} maxLength={100} onChange={(event) => updateStep({ label: event.target.value })} /></label>
              <label><span>Action Type</span><select value={selectedStep.actionType || 'Approve'} onChange={(event) => updateStep({ actionType: event.target.value })}><option>Approve</option><option>Acknowledge</option><option>Review</option></select></label>
              <label><span>Approver Type</span><select value={selectedStep.approverType || 'user'} onChange={(event) => updateStep({ approverType: event.target.value })}><option value="user">User</option><option value="role">Role</option>{selectedJobId === 'asset-transfer' ? <option value="dynamic">Dynamic</option> : null}</select></label>
              {selectedStep.approverType === 'dynamic' ? <label><span>Dynamic Resolver</span><select value={selectedStep.dynamicResolver || ''} onChange={(event) => updateStep({ dynamicResolver: event.target.value })}><option value="">Select a resolver</option><option value="SOURCE_AREA_OWNER">Source Area Owner · source Department</option><option value="DESTINATION_AREA_OWNER">Destination Area Owner · destination Department</option></select></label>
                : selectedStep.approverType === 'role' ? <label><span>Approver Role</span><select value={selectedStep.roleId || ''} onChange={(event) => updateStep({ roleId: event.target.value })}><option value="">Select a role</option>{data.roles.filter((role) => role.active).map((role) => <option key={role.id} value={role.id}>{role.name}</option>)}</select></label>
                  : <label><span>Approver User</span><select value={selectedStep.userId || ''} onChange={(event) => updateStep({ userId: event.target.value })}><option value="">Select a user</option>{activeUsers.map((user) => <option key={user.id} value={user.id}>{user.name} · {user.department || 'No department'}</option>)}</select></label>}
            </div>
            <div className="approval-step-controls"><button type="button" className="button button-secondary" onClick={() => { const step = blankStep(selectedWorkflow.steps.length); updateWorkflow({ steps: [...selectedWorkflow.steps, step] }); setSelectedStepId(step.id) }}><Icon name="plus" size={16} />Add step</button><button type="button" className="button button-danger-quiet" disabled={selectedWorkflow.steps.length <= 1} onClick={() => { const steps = selectedWorkflow.steps.filter((step) => step.id !== selectedStep.id); updateWorkflow({ steps }); setSelectedStepId(steps[Math.max(0, selectedWorkflow.steps.findIndex((step) => step.id === selectedStep.id) - 1)]?.id || '') }}><Icon name="close" size={15} />Remove step</button></div>
          </section> : null}

          <div className="approval-editor-note"><Icon name="info" size={16} /><span>Changing a workflow affects new transactions only. Active approval instances keep their saved approvers, step order, and history.</span></div>
        </> : <div className="approval-unconfigured-state"><span className="approval-unconfigured-icon"><Icon name="file" size={26} /></span><h2>{APPROVAL_JOBS.find((job) => job.id === selectedJobId)?.name} is not configured</h2><p>No approval steps have been defined for this Transaction Type. Create a workflow to make this transaction available for approval.</p><button type="button" className="button button-primary" onClick={addWorkflow}><Icon name="plus" size={16} />Configure workflow</button></div>}
      </section>
    </div> : <section className="panel responsibility-matrix-panel">
      <header className="responsibility-matrix-header"><div><h2>Responsibility matrix</h2><p>Assign one active Area Owner to each Department used in Asset Transfer.</p></div><button type="button" className="button button-primary" onClick={addResponsibility}><Icon name="plus" size={16} />Add assignment</button></header>
      <div className="responsibility-matrix-tools"><label className="workflow-library-search"><Icon name="search" size={16} /><input aria-label="Search departments or users" placeholder="Search department or user" value={responsibilityQuery} onChange={(event) => setResponsibilityQuery(event.target.value)} /></label><label><span>Department</span><select value={departmentFilter} onChange={(event) => setDepartmentFilter(event.target.value)}><option value="all">All departments</option>{departmentOptions.map((name) => <option key={name} value={name}>{name}</option>)}</select></label></div>
      <div className="table-scroll"><table className="responsibility-matrix-table"><thead><tr><th>Department</th><th>Assigned User</th><th>Status</th><th>Actions</th></tr></thead><tbody>
        {displayedResponsibilities.map((record, index) => <tr key={record.id}>
          <td><strong>{record.department || '—'}</strong></td>
          <td><div className="responsibility-assignee"><strong>{data.users.find((user) => user.id === record.userId)?.name || '—'}</strong><small>{data.users.find((user) => user.id === record.userId)?.department || data.users.find((user) => user.id === record.userId)?.email || ''}</small></div></td>
          <td><span className={`approval-status-badge is-${record.active !== false ? 'active' : 'inactive'}`}>{record.active !== false ? 'Active' : 'Inactive'}</span></td>
          <td><div className="responsibility-row-actions"><button type="button" className="responsibility-edit" onClick={() => openResponsibilityEditor(record)}><Icon name="edit" size={14} />Edit</button><button type="button" className="responsibility-remove" aria-label={`Remove ${record.department || `department ${index + 1}`} assignment`} onClick={() => setResponsibilityAssignments((current) => current.filter((item) => item.id !== record.id))}><Icon name="close" size={16} /></button></div></td>
        </tr>)}
        {!displayedResponsibilities.length ? <tr><td colSpan="4"><div className="responsibility-empty"><Icon name="user" size={22} /><strong>{responsibilityAssignments.length ? 'No matching department assignments' : 'No departments configured'}</strong><span>{responsibilityAssignments.length ? 'Change the search or department filter to see other assignments.' : 'Add an Area Owner assignment for each Department that can appear in a transfer.'}</span>{!responsibilityAssignments.length ? <button type="button" className="button button-secondary" onClick={addResponsibility}>Add first assignment</button> : null}</div></td></tr> : null}
      </tbody></table></div>
      <div className="responsibility-matrix-guidance"><Icon name="info" size={16} /><span>Transfer approvals use an exact Department match. Each Department can have one active Area Owner assignment, and assigned users must be active.</span></div>

      {editingResponsibilityId !== null ? <div className="approval-confirm-mask responsibility-editor-mask" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) closeResponsibilityEditor() }}><section className="responsibility-editor-dialog" role="dialog" aria-modal="true" aria-labelledby="responsibility-editor-title"><header><div><span className="detail-eyebrow">APPROVAL MANAGEMENT</span><h2 id="responsibility-editor-title">{editingResponsibilityId ? 'Edit Department assignment' : 'Add Department assignment'}</h2><p>Assign the Area Owner used for transfer approvals in this Department.</p></div><button type="button" className="modal-close" aria-label="Close dialog" onClick={closeResponsibilityEditor}><Icon name="close" size={17} /></button></header><form onSubmit={saveResponsibility}>
        <label className="form-field"><span>Department <em>*</em></span><select value={responsibilityForm.department} onChange={(event) => setResponsibilityForm((current) => ({ ...current, department: event.target.value }))} required><option value="">Select a Department</option>{responsibilityForm.department && !departmentOptions.includes(responsibilityForm.department) ? <option value={responsibilityForm.department}>{responsibilityForm.department} · unavailable</option> : null}{departmentOptions.map((department) => <option key={department} value={department}>{department}</option>)}</select></label>
        <label className="form-field"><span>Assigned User <em>*</em></span><select value={responsibilityForm.userId} onChange={(event) => setResponsibilityForm((current) => ({ ...current, userId: event.target.value }))} required><option value="">Select an active user</option>{responsibilityForm.userId && !activeUsers.some((user) => user.id === responsibilityForm.userId) ? <option value={responsibilityForm.userId}>Unavailable user · select another</option> : null}{activeUsers.map((user) => <option key={user.id} value={user.id}>{user.name} · {user.department || 'No department'}</option>)}</select></label>
        <label className="responsibility-editor-active"><input type="checkbox" checked={responsibilityForm.active} onChange={(event) => setResponsibilityForm((current) => ({ ...current, active: event.target.checked }))} /><span><strong>Active</strong><small>Active assignments can be selected for new Transfer approvals.</small></span></label>
        {responsibilityFormError ? <div className="workflow-settings-error responsibility-form-error" role="alert"><Icon name="alert" size={16} />{responsibilityFormError}</div> : null}
        <footer><button type="button" className="button button-secondary" onClick={closeResponsibilityEditor}>Cancel</button><button type="submit" className="button button-primary"><Icon name="check" size={15} />{editingResponsibilityId ? 'Save changes' : 'Add assignment'}</button></footer>
      </form></section></div> : null}
    </section>}

    {error ? <div className="workflow-settings-error" role="alert"><Icon name="alert" size={18} />{error}</div> : null}
    <div className="workflow-settings-save approval-management-save"><span><span className={`workflow-save-dot ${dirty ? 'is-dirty' : ''}`} />{dirty ? 'Unsaved changes' : 'All changes saved'}</span><button type="button" className="button button-secondary" disabled={!dirty} onClick={() => { setWorkflows(editableWorkflows(data)); setAssignments(normalizeAssignments(data)); setResponsibilityAssignments(editableResponsibilityAssignments(data.responsibilityAssignments, departmentOptions)); setError('') }}>Discard changes</button><button type="button" className="button button-primary" disabled={!dirty} onClick={openSaveConfirmation}><Icon name="check" size={16} />Save changes</button></div>

    {confirmSave ? <div className="approval-confirm-mask" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setConfirmSave(false) }}><section className="approval-confirm-dialog" role="dialog" aria-modal="true" aria-labelledby="approval-confirm-title"><span className="approval-confirm-icon"><Icon name="settings" size={20} /></span><h2 id="approval-confirm-title">Save approval changes?</h2><p>New transactions will use these workflow steps and responsibility assignments. Approvals already in progress keep their current snapshots.</p><div><button type="button" className="button button-secondary" onClick={() => setConfirmSave(false)}>Review changes</button><button type="button" className="button button-primary" onClick={saveChanges}>Save changes</button></div></section></div> : null}
  </div>
}
