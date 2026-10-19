import test from 'node:test'
import assert from 'node:assert/strict'
import { normalizeDepartment, validateDepartmentApprovers, validateResponsibilityAssignments, resolveTransferWorkflow } from './departmentApproverUtils.js'
import { INITIAL_ADMIN_DATA } from '../data/adminData.js'
import { DEFAULT_TRANSFER_WORKFLOW, createTransferWorkflowSnapshot, approveTransferWorkflow } from './workflowAssignmentUtils.js'

const configured = () => ({
  ...INITIAL_ADMIN_DATA,
  approvalTypes: [DEFAULT_TRANSFER_WORKFLOW],
  workflowAssignments: [{ id: 'transfer', jobId: 'asset-transfer', workflowId: DEFAULT_TRANSFER_WORKFLOW.id }],
  responsibilityAssignments: [
    { id: 'r1', responsibility: 'Area Owner', scope: 'Building A', userId: 'user-admin', active: true },
    { id: 'r2', responsibility: 'Area Owner', scope: 'Building B', userId: 'user-accounting', active: true },
  ],
})
const source = { department: 'Production', plant: 'Plant 1', location: 'Building A', line: 'A' }
const destination = { department: 'Accounting', plant: 'Plant 2', location: 'Building B', line: 'B' }

test('Transfer resolves Area Owners from the exact source and destination Locations, then Asset Team acknowledgement', () => {
  const { workflow, error } = resolveTransferWorkflow(configured(), source, destination)
  assert.equal(error, '')
  assert.deepEqual(workflow.steps.map((step) => step.userId), ['user-admin', 'user-accounting', ''])
  assert.deepEqual(workflow.steps.map((step) => step.actionType), ['Approve', 'Approve', 'Acknowledge'])
  assert.deepEqual(workflow.steps.map((step) => step.dynamicResolver || step.roleId), ['SOURCE_AREA_OWNER', 'DESTINATION_AREA_OWNER', 'role-asset'])
  assert.equal(workflow.steps[0].scope, 'Building A')
  assert.equal(workflow.steps[1].scope, 'Building B')
  assert.equal(workflow.steps.length, 3)
})

test('the first two approvals do not complete a transfer; final acknowledgement completes it', () => {
  const { workflow } = resolveTransferWorkflow(configured(), source, destination)
  let event = { type: 'transfer', transactionNo: 'TRF-1', status: 'Pending Approval', from: source, to: destination, ...createTransferWorkflowSnapshot(workflow) }
  for (let index = 0; index < 3; index++) {
    const previous = event
    event = approveTransferWorkflow(event, previous)
    assert.equal(event.status === 'Completed', index === 2)
    assert.equal(Boolean(event.completedAt), index === 2)
    assert.throws(() => approveTransferWorkflow(event, previous), /step has changed/)
  }
  assert.equal(event.approvalHistory[2].action, 'Acknowledged and completed')
  assert.equal(event.approvalHistory[2].assignedApproverId, '')
  assert.equal(event.approvalHistory[2].assignedRoleId, 'role-asset')
  assert.deepEqual(event.from, source)
  assert.deepEqual(event.to, destination)
})

test('Location assignments and user renames affect new transfers while submitted snapshots retain resolved approvers', () => {
  const data = configured()
  const { workflow } = resolveTransferWorkflow(data, source, destination)
  const snapshot = createTransferWorkflowSnapshot(workflow)
  data.responsibilityAssignments[0].userId = 'user-accounting'
  data.users = data.users.map((user) => ({ ...user, name: 'Renamed user' }))
  assert.equal(snapshot.approvalWorkflow.steps[0].assignee, 'Pat S.')
  assert.equal(snapshot.approvalWorkflow.steps[0].userId, 'user-admin')
  assert.equal(resolveTransferWorkflow(data, source, destination).workflow.steps[0].userId, 'user-accounting')
})

test('missing Locations, missing or inactive Area Owners, ambiguous assignments, and unavailable Asset Team roles stop submission', () => {
  const data = configured()
  assert.match(resolveTransferWorkflow(data, {}, destination).error, /current Location/)
  assert.match(resolveTransferWorkflow(data, source, {}).error, /destination Location/)
  assert.match(resolveTransferWorkflow(data, source, { ...destination, location: 'Unknown' }).error, /Unknown/)
  data.responsibilityAssignments[0].active = false
  assert.match(resolveTransferWorkflow(data, source, destination).error, /Building A/)
  data.responsibilityAssignments[0].active = true
  data.responsibilityAssignments.push({ ...data.responsibilityAssignments[0], id: 'duplicate' })
  assert.match(resolveTransferWorkflow(data, source, destination).error, /More than one/)
  data.responsibilityAssignments.pop()
  data.users = data.users.map((user) => user.id === 'user-asset' ? { ...user, active: false } : user)
  assert.match(resolveTransferWorkflow(data, source, destination).error, /Asset Team/)
})

test('responsibility validation prevents duplicate active scope assignments and rejects inactive users', () => {
  const records = configured().responsibilityAssignments
  assert.equal(validateResponsibilityAssignments(records, INITIAL_ADMIN_DATA.users), '')
  assert.match(validateResponsibilityAssignments([...records, { ...records[0], id: 'duplicate' }], INITIAL_ADMIN_DATA.users), /already has an active assignment/)
  assert.match(validateResponsibilityAssignments([{ ...records[0], userId: 'user-owner' }], INITIAL_ADMIN_DATA.users), /active user/)
  assert.equal(normalizeDepartment('  Building A  '), 'building a')
})

test('same-location transfers still require separate source, destination, and acknowledgement steps', () => {
  const { workflow } = resolveTransferWorkflow(configured(), source, { ...destination, location: source.location })
  assert.equal(workflow.steps.length, 3)
  assert.deepEqual(workflow.steps.slice(0, 2).map((step) => step.userId), ['user-admin', 'user-admin'])
})

test('legacy department approver records remain readable during migration', () => {
  const records = [{ id: 'd1', department: 'Production', userId: 'user-admin', active: true }]
  assert.equal(validateDepartmentApprovers(records, INITIAL_ADMIN_DATA.users, 'user-asset'), '')
  assert.match(validateDepartmentApprovers([...records, { ...records[0], id: 'dup', department: ' production ' }], INITIAL_ADMIN_DATA.users, 'user-asset'), /only one/)
})
