import { getApprovalTypes, resolveApprovalSteps } from './activationApprovalUtils.js'

export const APPROVAL_JOBS = [
  { id: 'asset-transfer', name: 'Asset Transfer', source: 'Movement Asset', result: 'Update Asset assignment after all approvals', icon: 'transfer' },
  { id: 'asset-activation', name: 'Asset Activation', source: 'Asset Validation', result: 'Activate the Asset after final approval', icon: 'box' },
  { id: 'asset-enhancement', name: 'Asset Enhancement', source: 'Asset Lifecycle', result: 'Complete the enhancement transaction', icon: 'settings' },
  { id: 'asset-disposal', name: 'Asset Disposal', source: 'Asset Lifecycle', result: 'Complete the disposal transaction', icon: 'file' },
  { id: 'asset-sale', name: 'Asset Sale', source: 'Asset Lifecycle', result: 'Complete the sale transaction', icon: 'file' },
]

export const DEFAULT_TRANSFER_WORKFLOW = {
  id: 'asset-transfer-default', name: 'Asset Transfer', process: 'asset-transfer', active: true,
  steps: [
    { id: 'source-area-owner', label: 'Source Area Owner', sequence: 1, actionType: 'Approve', approverType: 'dynamic', dynamicResolver: 'SOURCE_AREA_OWNER', assignmentType: 'dynamic', required: true, allowReject: true, allowSendBack: true, status: 'Pending Approval' },
    { id: 'destination-area-owner', label: 'Destination Area Owner', sequence: 2, actionType: 'Approve', approverType: 'dynamic', dynamicResolver: 'DESTINATION_AREA_OWNER', assignmentType: 'dynamic', required: true, allowReject: true, allowSendBack: true, status: 'Pending Approval' },
    { id: 'asset-team-acknowledge', label: 'Asset Team', sequence: 3, actionType: 'Acknowledge', approverType: 'role', assignmentType: 'role', roleId: 'role-asset', required: true, allowReject: false, allowSendBack: false, status: 'Pending Approval' },
  ],
}

export const ACTIVATION_STEP_ORDER = ['asset-1', 'asset-2', 'accounting-1', 'accounting-2', 'accounting-3']
export const TRANSFER_STEP_ORDER = ['source-area-owner', 'destination-area-owner', 'asset-team-acknowledge']

export function getWorkflowDefinition(data, jobId) {
  const assignments = getWorkflowAssignments(data).filter((item) => item.jobId === jobId)
  if (assignments.length > 1) return { workflow: null, error: `Assign exactly one workflow to ${APPROVAL_JOBS.find((job) => job.id === jobId)?.name || jobId}.` }
  const id = assignments[0]?.workflowId
  if (!id && jobId === 'asset-transfer') return { workflow: DEFAULT_TRANSFER_WORKFLOW, assignment: null, error: '' }
  if (!id) return { workflow: null, assignment: null, error: '' }
  const workflow = getApprovalTypes(data).find((item) => item.id === id)
  if (!workflow) return { workflow: null, assignment: assignments[0], error: 'The assigned workflow could not be found. Choose another workflow.' }
  return { workflow, assignment: assignments[0], error: '' }
}

export function getWorkflowAssignments(data) {
  if (Array.isArray(data.workflowAssignments)) return data.workflowAssignments
  const legacyId = data.defaultActivationApprovalTypeId || (!Array.isArray(data.approvalTypes) ? 'asset-activation-default' : '')
  return legacyId ? [{ id: 'assignment-activation', jobId: 'asset-activation', workflowId: legacyId, depreciationStepId: '' }] : []
}

export function resolveJobWorkflow(data, jobId) {
  if (jobId === 'asset-transfer') return { workflow: null, error: 'Asset Transfer needs source and destination Department context to resolve its Area Owners.' }
  const mappings = getWorkflowAssignments(data).filter((item) => item.jobId === jobId)
  if (mappings.length !== 1) return { workflow: null, error: `Assign exactly one workflow to ${APPROVAL_JOBS.find((job) => job.id === jobId)?.name || jobId} in Approval Management → Transaction workflows.` }
  const mapping = mappings[0]
  const definition = getApprovalTypes(data).find((workflow) => workflow.id === mapping.workflowId)
  if (!definition?.active) return { workflow: null, error: 'The assigned workflow is unavailable or inactive. Update it in Approval Management before submitting.' }
  const steps = resolveApprovalSteps(definition.steps, data.users, data.roles)
  if (!steps.length || new Set(steps.map((step) => step.id)).size !== steps.length || steps.some((step) => step.required !== false && (!step.label || !step.available))) return { workflow: null, error: 'The assigned workflow needs a step name and an available approver at every required step.' }
  if (jobId === 'asset-activation' && mapping.depreciationStepId && !steps.some((step) => step.id === mapping.depreciationStepId)) return { workflow: null, error: 'The depreciation review step was removed. Update the Asset Activation assignment.' }
  // Keep legacy date configuration until the new assignment has been saved explicitly.
  const dateStepId = mapping.depreciationStepId || (!Array.isArray(data.workflowAssignments) ? steps.find((step) => step.requiresDepreciationDate)?.id : '') || steps.at(-1).id
  return { error: '', workflow: { ...definition, process: jobId, steps: steps.map((step) => ({ ...step, requiresDepreciationDate: jobId === 'asset-activation' && step.id === dateStepId, status: jobId === 'asset-activation' ? 'Pending Activation Approval' : 'Pending Approval' })) } }
}

export function validateWorkflowAssignments(data) {
  const assignments = getWorkflowAssignments(data)
  const ids = assignments.map((item) => item.jobId)
  if (new Set(ids).size !== ids.length) return 'Each job can have only one assigned workflow.'
  for (const item of assignments) {
    if (!APPROVAL_JOBS.some((job) => job.id === item.jobId)) return 'Select a supported job type.'
    if (item.jobId === 'asset-transfer') {
      const definition = getApprovalTypes(data).find((workflow) => workflow.id === item.workflowId)
      if (!definition?.active) return 'Asset Transfer needs one active workflow.'
      if (!definition.steps?.some((step) => step.approverType === 'dynamic' && step.dynamicResolver === 'SOURCE_AREA_OWNER') || !definition.steps?.some((step) => step.approverType === 'dynamic' && step.dynamicResolver === 'DESTINATION_AREA_OWNER')) return 'Asset Transfer must include Source Area Owner and Destination Area Owner dynamic steps.'
      continue
    }
    const result = resolveJobWorkflow(data, item.jobId)
    if (result.error) return result.error
  }
  return ''
}

export function createTransferWorkflowSnapshot(workflow) {
  if (!workflow?.steps?.length) throw new Error('Assign a valid Asset Transfer workflow before submitting.')
  return { approvalWorkflow: { requestId: crypto.randomUUID(), id: workflow.id, name: workflow.name, routing: workflow.routing, steps: workflow.steps.map((step) => ({ ...step })), submittedAt: new Date().toISOString() }, approvalSteps: workflow.steps.map((step) => step.label), currentApprovalStep: 0, approvalHistory: [] }
}


export function withAssignedActivationWorkflow(asset, workflow) {
  if (asset.activationApproval || !['Pending Asset Team Leader Approval', 'Pending Accounting Review', 'Pending Accounting Approval', 'Pending Activation Approval'].includes(asset.status) || !workflow?.steps?.length) return asset
  return { ...asset, activationApproval: { id: `legacy-activation:${asset.assetId}`, approvalTypeId: workflow.id, approvalTypeName: workflow.name, submittedAt: null, currentStep: 0, state: 'Pending', adoptedFromAssignment: true, steps: workflow.steps.map((step) => ({ ...step })) } }
}

export function withAssignedTransferWorkflow(event, workflow) {
  if (event.type !== 'transfer') return event
  if (event.approvalWorkflow?.steps?.length) return { ...event, approvalSteps: event.approvalWorkflow.steps.map((step) => step.label) }
  if (event.status !== 'Pending Approval') return event
  if (!workflow?.steps?.length) return { ...event, legacyApprovalSteps: event.approvalSteps || [], approvalSteps: [], currentApprovalStep: 0, approvalWorkflowRequired: true }
  return { ...event, legacyApprovalSteps: event.approvalSteps || [], currentApprovalStep: 0,
    approvalSteps: workflow.steps.map((step) => step.label),
    approvalWorkflow: { requestId: `legacy-transfer:${event.transactionNo}`, id: workflow.id, name: workflow.name, submittedAt: null, adoptedFromAssignment: true, steps: workflow.steps.map((step) => ({ ...step })) },
  }
}

export function getTransferApprovalProgress(event) {
  const steps = event.approvalWorkflow?.steps || []
  const savedIndex = Number(event.currentApprovalStep) || 0
  const index = steps.findIndex((step, current) => current >= savedIndex && step.required !== false)
  return { steps, index: index < 0 ? steps.length : index, current: event.status === 'Pending Approval' && index >= 0 ? steps[index] : null, workflowName: event.approvalWorkflow?.name || '' }
}

export function approveTransferWorkflow(event, expectedEvent, date = new Date().toISOString(), payload = {}) {
  const progress = getTransferApprovalProgress(event)
  const expected = getTransferApprovalProgress(expectedEvent)
  if (!progress.current || !expected.current || progress.index !== expected.index || progress.current.id !== expected.current.id || event.approvalWorkflow?.requestId !== expectedEvent.approvalWorkflow?.requestId) throw new Error('The transfer approval step has changed or has no assigned workflow. Refresh the queue before approving.')
  if (!progress.current.available && progress.current.required !== false) throw new Error('The current approval step has no available approver. Update the Responsibility Matrix or workflow settings.')
  const nextIndex = progress.steps.findIndex((step, current) => current > progress.index && step.required !== false)
  const final = nextIndex === -1
  const action = progress.current.actionType === 'Acknowledge' || progress.current.action === 'acknowledge' ? 'Acknowledged' : progress.current.actionType === 'Review' || progress.current.action === 'review' ? 'Reviewed' : 'Approved'
  return { ...event, currentApprovalStep: final ? progress.steps.length : nextIndex, status: final ? 'Completed' : 'Pending Approval', ...(final ? { completedAt: date } : {}),
    approvalHistory: [...(event.approvalHistory || []), { stage: progress.current.label, stageId: progress.current.id, stepIndex: progress.index, action: final ? `${action} and completed` : action, actor: 'Pat S. (demo)', actorId: 'user-admin', assignedApprover: progress.current.assignee, assignedApproverId: progress.current.userId || '', assignedRoleId: progress.current.roleId || '', approvalTypeName: progress.workflowName, comment: String(payload.comment || '').trim(), date }],
  }
}
