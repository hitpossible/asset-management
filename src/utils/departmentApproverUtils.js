import { getWorkflowDefinition } from './workflowAssignmentUtils.js'
import { resolveApprovalSteps } from './activationApprovalUtils.js'

export const normalizeDepartment = (value) => {
  const name = String(value || '').trim().replace(/\s+/g, ' ').toLowerCase()
  return ['-', '—'].includes(name) ? '' : name
}

export function validateResponsibilityAssignments(records, users) {
  const activeRows = records.filter((item) => item.active !== false)
  if (activeRows.some((item) => !String(item.department || '').trim())) return 'Select a department for every active assignment.'
  const keys = activeRows.map((item) => normalizeDepartment(item.department))
  if (new Set(keys).size !== keys.length) return 'This department already has an active Area Owner assignment.'
  for (const record of activeRows) {
    if (!users.some((user) => user.id === record.userId && user.active)) return `Select an active user for ${record.department}.`
  }
  return ''
}

function resolveAreaOwner(data, department) {
  const matches = (data.responsibilityAssignments || []).filter((item) => item.active !== false
    && normalizeDepartment(item.department) === normalizeDepartment(department))
  if (matches.length !== 1) return { user: null, error: matches.length ? `More than one active Area Owner is assigned to the ${department} department. Resolve the conflict in Approval Management → Responsibility Matrix.` : `No active Area Owner is assigned to the ${department} department. Add an assignment in Approval Management → Responsibility Matrix.` }
  const user = data.users.find((item) => item.id === matches[0].userId && item.active)
  return user ? { user, error: '' } : { user: null, error: `The Area Owner assigned to the ${department} department is unavailable. Update the Responsibility Matrix.` }
}

export function resolveTransferWorkflow(data, from, to) {
  if (!String(from?.department || '').trim()) return { workflow: null, error: 'The Asset has no current Department. Add a current Department before starting a transfer.' }
  if (!String(to?.department || '').trim()) return { workflow: null, error: 'Select a destination Department before starting a transfer.' }
  const { workflow: definition, error: definitionError } = getWorkflowDefinition(data, 'asset-transfer')
  if (definitionError) return { workflow: null, error: definitionError }
  if (!definition?.active) return { workflow: null, error: 'Asset Transfer workflow is inactive. Activate it in Approval Management before submitting.' }

  const steps = resolveApprovalSteps(definition.steps || [], data.users || [], data.roles || [])
  const resolvedSteps = []
  for (const step of steps) {
    if (step.approverType === 'dynamic') {
      const source = step.dynamicResolver === 'SOURCE_AREA_OWNER'
      const destination = step.dynamicResolver === 'DESTINATION_AREA_OWNER'
      if (!source && !destination) return { workflow: null, error: `Step “${step.label || 'Unnamed step'}” uses an unsupported Dynamic Resolver.` }
      const department = source ? from.department : to.department
      const match = resolveAreaOwner(data, department)
      if (!match.user) return { workflow: null, error: match.error }
      resolvedSteps.push({ ...step, assignmentType: 'user', userId: match.user.id, approverUserIds: [match.user.id], assignee: match.user.name, department, scope: department, resolvedFrom: source ? 'Source Department' : 'Destination Department', available: true, status: 'Pending Approval' })
      continue
    }
    if (step.required !== false && !step.available) return { workflow: null, error: `Step “${step.label || 'Unnamed step'}” does not resolve to an active user or role.` }
    resolvedSteps.push({ ...step, status: 'Pending Approval' })
  }
  if (!resolvedSteps.length) return { workflow: null, error: 'Asset Transfer workflow needs at least one approval step.' }
  return { error: '', workflow: { ...definition, process: 'asset-transfer', steps: resolvedSteps } }
}

// Legacy exports remain available for old saved browser sessions while they are migrated.
export function validateDepartmentApprovers(records, users, assetTeamUserId, { requireTeam = true } = {}) {
  const names = records.map((item) => normalizeDepartment(item.department))
  if (names.some((name) => !name)) return 'Enter a department name for every row.'
  if (new Set(names).size !== names.length) return 'Each department can have only one approver record. Edit its existing row instead.'
  for (const record of records.filter((item) => item.active !== false)) {
    if (!users.some((user) => user.id === record.userId && user.active)) return `Select an active approver for ${record.department}.`
  }
  if ((requireTeam || assetTeamUserId) && !users.some((user) => user.id === assetTeamUserId && user.active && user.roleIds.includes('role-asset'))) return 'Select an active Asset Team member for the acknowledgement step.'
  return ''
}
