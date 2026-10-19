import { isCustomerAsset } from './assetOwnershipUtils.js'

export const ACTIVATION_STAGES = [
  { id: 'asset-1', label: 'Asset Team 1', group: 'asset', roleId: 'role-asset', status: 'Pending Asset Team Leader Approval' },
  { id: 'asset-2', label: 'Asset Team 2', group: 'asset', roleId: 'role-asset', status: 'Pending Asset Team Leader Approval' },
  { id: 'accounting-1', label: 'Account 1', group: 'accounting', roleId: 'role-accounting', status: 'Pending Accounting Review' },
  { id: 'accounting-2', label: 'Account 2', group: 'accounting', roleId: 'role-accounting', status: 'Pending Accounting Approval' },
  { id: 'accounting-3', label: 'Account 3', group: 'accounting', roleId: 'role-accounting', status: 'Pending Accounting Approval' },
]

export function resolveApprovalSteps(config, users = [], roles = []) {
  return config.map((stage) => {
    const assignmentType = stage.approverType || stage.assignmentType || (stage.userId ? 'user' : 'role')
    const user = users.find((item) => item.id === stage.userId)
    const role = roles.find((item) => item.id === stage.roleId)
    const roleUsers = users.filter((item) => item.active && item.roleIds?.includes(stage.roleId))
    const requiresDepreciationDate = stage.requiresDepreciationDate ?? stage.id === 'accounting-1'
    const knownResolver = ['SOURCE_AREA_OWNER', 'DESTINATION_AREA_OWNER'].includes(stage.dynamicResolver)
    const actionType = stage.actionType || (stage.action === 'acknowledge' ? 'Acknowledge' : stage.action === 'review' ? 'Review' : 'Approve')
    return { ...stage, label: String(stage.label || '').trim(), userId: stage.userId || '', assignmentType, approverType: assignmentType,
      actionType, required: stage.required !== false, allowReject: stage.allowReject !== false, allowSendBack: stage.allowSendBack !== false,
      requiresDepreciationDate, status: stage.status || 'Pending Activation Approval',
      available: assignmentType === 'user' ? Boolean(user?.active) : assignmentType === 'role' ? Boolean(stage.roleId && (role ? role.active && (roleUsers.length > 0 || users.length === 0) : roles.length === 0)) : assignmentType === 'dynamic' ? knownResolver : false,
      approverUserIds: assignmentType === 'role' ? roleUsers.map((item) => item.id) : user?.active ? [user.id] : [],
      assignee: assignmentType === 'user' ? user?.name || 'Select an approver' : assignmentType === 'role' ? role?.name || (stage.roleId === 'role-asset' ? 'Asset Team' : stage.roleId === 'role-accounting' ? 'Accounting' : 'Select a role') : stage.dynamicResolver?.replaceAll('_', ' ') || 'Select a resolver',
    }
  })
}

export function getActivationSteps(config = [], users = [], roles = []) {
  if (Array.isArray(config) && config.some((item) => item.label)) return resolveApprovalSteps(config, users, roles)
  return resolveApprovalSteps(ACTIVATION_STAGES.map((stage) => ({ ...stage, ...(Array.isArray(config) ? config.find((item) => item.id === stage.id) : {}) })), users, roles)
}

export function getApprovalTypes(data) {
  const types = Array.isArray(data.approvalTypes) ? data.approvalTypes : [{ id: 'asset-activation-default', name: 'Asset activation', process: 'asset-activation', active: true, steps: getActivationSteps(data.activationApprovalSteps, data.users, data.roles) }]
  return types.map((type) => ({ ...type, steps: resolveApprovalSteps(type.steps || [], data.users, data.roles) }))
}

export function approvalCollectsDepreciation(asset, progress) {
  return !isCustomerAsset(asset) && ((progress.current?.requiresDepreciationDate ?? (progress.current?.id === 'accounting-1')) || (progress.index === progress.steps?.length - 1 && !asset.depreciationStartDate))
}

export function createActivationRequest(asset, steps, date = new Date().toISOString(), approvalType = null) {
  const requiredSteps = steps.filter((step) => step.required !== false)
  if (!requiredSteps.length || new Set(steps.map((step) => step.id)).size !== steps.length || requiredSteps.some((step) => !step.label?.trim() || step.available === false)) throw new Error('Update the Activation Approval settings: every required level must have an available reviewer.')
  const firstStep = steps.findIndex((step) => step.required !== false)
  const previous = asset.activationApproval
  return {
    activationApproval: { id: crypto.randomUUID(), approvalTypeId: approvalType?.id || '', approvalTypeName: approvalType?.name || 'Asset activation', submittedAt: date, currentStep: firstStep, state: 'Pending', steps: steps.map((step) => ({ ...step })) },
    ...(previous ? { activationApprovalRuns: [...(asset.activationApprovalRuns || []), previous] } : {}),
    status: steps[0].status,
    correctionComment: '', correctionStage: '',
  }
}

export function isPendingActivation(asset) {
  return ['Pending Asset Team Leader Approval', 'Pending Accounting Review', 'Pending Accounting Approval', 'Pending Activation Approval'].includes(asset.status) && (!asset.activationApproval || asset.activationApproval.state === 'Pending')
}

export function getActivationProgress(asset, defaultSteps = []) {
  const saved = asset.activationApproval
  const steps = saved?.steps?.length ? saved.steps : defaultSteps
  const savedIndex = saved ? Number(saved.currentStep) : 0
  const index = saved ? steps.findIndex((step, current) => current >= savedIndex && step.required !== false) : Math.max(0, steps.findIndex((step) => step.required !== false))
  const pendingStatus = saved ? asset.status?.startsWith('Pending') : ACTIVATION_STAGES.some((stage) => stage.status === asset.status)
  return { steps, index, current: pendingStatus && (!saved || saved.state === 'Pending') ? steps[index] || null : null }
}

function nextRequiredStepIndex(steps, index) {
  return steps.findIndex((step, current) => current > index && step.required !== false)
}

export function approveActivation(asset, payload, defaultSteps, date = new Date().toISOString()) {
  const { steps, index, current } = getActivationProgress(asset, defaultSteps)
  if (!current || current.id !== payload.stageId || (payload.requestId && payload.requestId !== asset.activationApproval?.id)) throw new Error('This approval step has changed. Refresh the queue and review the current step.')
  const customer = isCustomerAsset(asset)
  const collectsDate = approvalCollectsDepreciation(asset, { current }) || (!customer && index === steps.length - 1 && !asset.depreciationStartDate)
  const startDate = customer ? '' : collectsDate ? payload.depreciationStartDate : asset.depreciationStartDate
  if (!customer && (collectsDate || index === steps.length - 1) && (!/^\d{4}-\d{2}-\d{2}$/.test(startDate || '') || Number.isNaN(Date.parse(startDate)) || new Date(`${startDate}T00:00:00Z`).toISOString().slice(0, 10) !== startDate)) throw new Error('Set a valid Depreciation Start Date before continuing.')
  const nextIndex = nextRequiredStepIndex(steps, index)
  const final = nextIndex === -1
  const workflow = asset.activationApproval || { id: crypto.randomUUID(), submittedAt: null, steps: steps.map((step) => ({ ...step })), legacyContinuation: true }
  const actionLabel = current.actionType === 'Acknowledge' ? 'Acknowledged' : current.actionType === 'Review' ? 'Reviewed' : 'Approved'
  return {
    ...asset,
    activationApproval: { ...workflow, currentStep: final ? steps.length : nextIndex, state: final ? 'Approved' : 'Pending', ...(final ? { completedAt: date } : {}) },
    ...(customer ? { depreciationStartDate: '', depreciationProfile: {} } : collectsDate ? { depreciationStartDate: startDate } : {}),
    ...(final ? { activatedAt: date } : {}),
    status: final ? 'Active' : steps[nextIndex].status,
    approvalHistory: [...(asset.approvalHistory || []), { stage: current.label, stageId: current.id, action: final ? `${actionLabel} and activated` : actionLabel, actor: 'Pat S. (demo)', actorId: 'user-admin', assignedApprover: current.assignee, assignedApproverId: current.userId || '', assignedRoleId: current.roleId || '', stepIndex: index, comment: payload.comment || '', date, requestId: workflow.id, approvalTypeId: workflow.approvalTypeId || '', approvalTypeName: workflow.approvalTypeName || 'Asset activation' }],
  }
}

export function returnActivation(asset, payload, defaultSteps, date = new Date().toISOString()) {
  const { current, steps, index } = getActivationProgress(asset, defaultSteps)
  if (!current || current.id !== payload.stageId || (payload.requestId && payload.requestId !== asset.activationApproval?.id)) throw new Error('This approval step has changed. Review the current step.')
  if (current.allowSendBack === false) throw new Error('This step does not allow sending the request back for correction.')
  if (!payload.comment?.trim()) throw new Error('Enter a correction reason.')
  const workflow = asset.activationApproval || { id: crypto.randomUUID(), submittedAt: null, steps: steps.map((step) => ({ ...step })), currentStep: index, legacyContinuation: true }
  return {
    ...asset, status: 'Returned for Correction',
    activationApproval: { ...workflow, state: 'Returned', returnedAt: date },
    correctionComment: payload.comment.trim(), correctionStage: current.label,
    receivingValidations: (asset.receivingValidations || []).map((item) => ({ ...item, status: 'Correction Required' })),
    approvalHistory: [...(asset.approvalHistory || []), { stage: current.label, stageId: current.id, action: 'Returned for Correction', actor: 'Pat S. (demo)', actorId: 'user-admin', assignedApprover: current.assignee, assignedApproverId: current.userId || '', assignedRoleId: current.roleId || '', stepIndex: index, comment: payload.comment.trim(), date, requestId: workflow.id, approvalTypeId: workflow.approvalTypeId || '', approvalTypeName: workflow.approvalTypeName || 'Asset activation' }],
  }
}
