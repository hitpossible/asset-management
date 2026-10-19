import test from 'node:test'
import assert from 'node:assert/strict'
import { INITIAL_ADMIN_DATA } from '../data/adminData.js'
import { resolveJobWorkflow, getWorkflowAssignments, validateWorkflowAssignments, DEFAULT_TRANSFER_WORKFLOW, createTransferWorkflowSnapshot, withAssignedActivationWorkflow, withAssignedTransferWorkflow, getTransferApprovalProgress, approveTransferWorkflow } from './workflowAssignmentUtils.js'
import { createActivationRequest, approveActivation, getActivationProgress, getApprovalTypes } from './activationApprovalUtils.js'

const workflow = (id) => ({ id, name: `Workflow ${id}`, active: true, steps: [{ id: `${id}-check`, label: 'Asset Team Check', assignmentType: 'user', userId: 'user-asset' }, { id: `${id}-final`, label: 'Finance Approval', assignmentType: 'user', userId: 'user-accounting' }] })
const configured = () => ({ ...INITIAL_ADMIN_DATA, approvalTypes: [DEFAULT_TRANSFER_WORKFLOW, workflow('A'), workflow('B')], workflowAssignments: [{ id: 'activation', jobId: 'asset-activation', workflowId: 'B', depreciationStepId: 'B-check' }, { id: 'transfer', jobId: 'asset-transfer', workflowId: DEFAULT_TRANSFER_WORKFLOW.id }] })

test('each job selects only its explicit mapping, independently of workflow order or legacy defaults', () => {
  const data = configured()
  data.defaultActivationApprovalTypeId = 'A'
  assert.equal(resolveJobWorkflow(data, 'asset-activation').workflow.id, 'B')
  assert.equal(resolveJobWorkflow(data, 'asset-transfer').workflow, null)
  assert.match(resolveJobWorkflow(data, 'asset-transfer').error, /Location context/)
  assert.equal(resolveJobWorkflow(data, 'asset-activation').workflow.steps[0].requiresDepreciationDate, true)
  assert.ok(getWorkflowAssignments(data).some((item) => item.jobId === 'asset-transfer'))
  assert.equal(validateWorkflowAssignments(data), '')
})

test('unassigned and duplicate jobs never fall back to the first active workflow', () => {
  const data = configured()
  data.workflowAssignments = []
  assert.equal(resolveJobWorkflow(data, 'asset-activation').workflow, null)
  assert.match(resolveJobWorkflow(data, 'asset-activation').error, /Assign exactly one/)
  data.workflowAssignments = [{ jobId: 'asset-activation', workflowId: 'A' }, { jobId: 'asset-activation', workflowId: 'B' }]
  assert.match(validateWorkflowAssignments(data), /only one/)
})

test('inactive, removed and unavailable reviewers stop new requests with an actionable error', () => {
  const data = configured()
  const activationType = data.approvalTypes.find((item) => item.id === 'B')
  activationType.active = false
  assert.match(resolveJobWorkflow(data, 'asset-activation').error, /inactive/)
  activationType.active = true
  data.users = data.users.map((user) => ({ ...user, active: false }))
  assert.match(resolveJobWorkflow(data, 'asset-activation').error, /available approver/)
  data.approvalTypes = []
  assert.equal(resolveJobWorkflow(data, 'asset-transfer').workflow, null)
})

test('the date review belongs to the job assignment; removed steps are reported and an empty setting uses the last step', () => {
  const data = configured()
  data.workflowAssignments[0].depreciationStepId = 'removed'
  assert.match(resolveJobWorkflow(data, 'asset-activation').error, /step was removed/)
  data.workflowAssignments[0].depreciationStepId = ''
  const resolved = resolveJobWorkflow(data, 'asset-activation').workflow
  assert.equal(resolved.steps[0].requiresDepreciationDate, false)
  assert.equal(resolved.steps[1].requiresDepreciationDate, true)
  assert.equal(data.approvalTypes[1].steps[1].requiresDepreciationDate, undefined)
})

test('submitted activation and transfer requests keep named reviewers and order after assignments change', () => {
  const data = configured()
  const activation = resolveJobWorkflow(data, 'asset-activation').workflow
  const submitted = { assetId: 'ME-1', ...createActivationRequest({}, activation.steps, undefined, activation) }
  const transfer = createTransferWorkflowSnapshot(getApprovalTypes(data)[0])
  data.workflowAssignments.reverse()
  data.approvalTypes[0].steps.reverse()
  assert.deepEqual(transfer.approvalSteps, ['Source Area Owner', 'Destination Area Owner', 'Asset Team'])
  assert.equal(transfer.approvalWorkflow.steps[0].dynamicResolver, 'SOURCE_AREA_OWNER')
  assert.equal(submitted.activationApproval.approvalTypeId, 'B')
  assert.equal(approveActivation(submitted, { stageId: 'B-check', depreciationStartDate: '2026-10-15' }).activationApproval.currentStep, 1)
})

test('legacy default settings migrate only a known assignment and an explicit empty mapping stays empty', () => {
  const data = { ...INITIAL_ADMIN_DATA, approvalTypes: [workflow('A')], defaultActivationApprovalTypeId: 'A' }
  assert.equal(getWorkflowAssignments(data)[0].workflowId, 'A')
  assert.equal(resolveJobWorkflow(data, 'asset-activation').workflow.id, 'A')
  assert.deepEqual(getWorkflowAssignments({ ...data, workflowAssignments: [] }), [])
  assert.deepEqual(getWorkflowAssignments({ ...INITIAL_ADMIN_DATA, approvalTypes: [workflow('A')] }), [])
  assert.equal(getWorkflowAssignments(INITIAL_ADMIN_DATA)[0].workflowId, 'asset-activation-default')
})


test('legacy activation queues show and approve the mapped route from its first step without fabricating prior approvals', () => {
  const assigned = resolveJobWorkflow(configured(), 'asset-activation').workflow
  const legacy = { assetId: 'ME-OLD', status: 'Pending Accounting Review', approvalHistory: [{ stage: 'Old Review', action: 'Approved' }] }
  const effective = withAssignedActivationWorkflow(legacy, assigned)
  assert.equal(getActivationProgress(effective).current.label, 'Asset Team Check')
  assert.equal(getActivationProgress(effective).current.assignee, 'Maya Singh')
  assert.equal(effective.activationApproval.approvalTypeName, 'Workflow B')
  assert.equal(effective.approvalHistory.length, 1)
  assert.equal(legacy.activationApproval, undefined)
  const next = approveActivation(effective, { stageId: 'B-check', requestId: effective.activationApproval.id, depreciationStartDate: '2026-10-15' })
  assert.equal(next.approvalHistory.length, 2)
  assert.equal(next.approvalHistory.at(-1).assignedApproverId, 'user-asset')
  assert.equal(next.activationApproval.currentStep, 1)
  const changed = resolveJobWorkflow(configured(), 'asset-transfer').workflow
  assert.equal(withAssignedActivationWorkflow(next, changed), next)
  assert.equal(getActivationProgress(legacy).current, null)
})

test('legacy transfers adopt mapped steps and reject duplicate or stale approval clicks', () => {
  const assigned = getApprovalTypes(configured()).find((item) => item.id === 'A')
  const legacy = { transactionNo: 'TRF-OLD', type: 'transfer', status: 'Pending Approval', approvalSteps: ['Old Fixed Role'], currentApprovalStep: 0, approvalHistory: [], from: { line: 'A' }, to: { line: 'B' } }
  const first = withAssignedTransferWorkflow(legacy, assigned)
  assert.equal(getTransferApprovalProgress(first).current.label, 'Asset Team Check')
  assert.equal(getTransferApprovalProgress(first).current.assignee, 'Maya Singh')
  assert.equal(first.approvalSteps.length, 2)
  const next = approveTransferWorkflow(first, first)
  assert.equal(next.status, 'Pending Approval')
  assert.equal(next.currentApprovalStep, 1)
  assert.equal(next.approvalHistory[0].assignedApproverId, 'user-asset')
  assert.throws(() => approveTransferWorkflow(next, first), /step has changed/)
  const final = approveTransferWorkflow(next, next)
  assert.equal(final.status, 'Completed')
  assert.equal(final.approvalHistory.at(-1).stage, 'Finance Approval')
  assert.throws(() => approveTransferWorkflow(final, final), /step has changed/)
  assert.deepEqual(final.from, { line: 'A' })
  assert.deepEqual(legacy.approvalSteps, ['Old Fixed Role'])
  const missing = withAssignedTransferWorkflow(legacy, null)
  assert.deepEqual(missing.approvalSteps, [])
  assert.equal(getTransferApprovalProgress(missing).current, null)
})

test('a stored Transfer snapshot is the source of truth even when duplicated labels or current settings differ', () => {
  const assigned = getApprovalTypes(configured()).find((item) => item.id === 'A')
  const record = { transactionNo: 'TRF-1', type: 'transfer', status: 'Pending Approval', ...createTransferWorkflowSnapshot(assigned), approvalSteps: ['Incorrect stale label'] }
  const changed = { ...assigned, name: 'Changed workflow', steps: [] }
  const effective = withAssignedTransferWorkflow(record, changed)
  assert.deepEqual(effective.approvalSteps, ['Asset Team Check', 'Finance Approval'])
  assert.equal(getTransferApprovalProgress(effective).workflowName, 'Workflow A')
  const wrongRun = { ...effective, approvalWorkflow: { ...effective.approvalWorkflow, requestId: 'other-request' } }
  assert.throws(() => approveTransferWorkflow(effective, wrongRun), /step has changed/)
})
