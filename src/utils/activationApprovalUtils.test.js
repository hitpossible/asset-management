import test from 'node:test'
import assert from 'node:assert/strict'
import { getActivationSteps, getApprovalTypes, resolveApprovalSteps, approvalCollectsDepreciation, createActivationRequest, getActivationProgress, approveActivation, returnActivation } from './activationApprovalUtils.js'
import { INITIAL_ADMIN_DATA } from '../data/adminData.js'

const steps = () => getActivationSteps([], INITIAL_ADMIN_DATA.users, INITIAL_ADMIN_DATA.roles)
const submitted = (asset = {}) => {
  const initial = { assetId: 'ME-1', status: 'Ready for Verification', ...asset }
  return { ...initial, ...createActivationRequest(initial, steps(), '2026-10-15T04:00:00Z') }
}
const approve = (asset, stageId, extra = {}) => approveActivation(asset, { stageId, ...extra }, steps(), '2026-10-15T05:00:00Z')

test('activation requires two Asset approvals and three Accounting approvals in order', () => {
  let asset = submitted()
  const sequence = ['asset-1', 'asset-2', 'accounting-1', 'accounting-2', 'accounting-3']
  sequence.forEach((stageId, index) => {
    assert.equal(getActivationProgress(asset).current.id, stageId)
    assert.equal(asset.activatedAt, undefined)
    asset = approve(asset, stageId, { depreciationStartDate: '2026-10-15', comment: 'Reviewed' })
    assert.equal(asset.approvalHistory.length, index + 1)
    assert.equal(asset.approvalHistory.at(-1).actorId, 'user-admin')
    assert.equal(asset.status === 'Active', index === 4)
  })
  assert.equal(asset.activationApproval.state, 'Approved')
  assert.equal(asset.depreciationStartDate, '2026-10-15')
  assert.equal(getActivationProgress(asset).current, null)
  assert.equal(asset.approvalHistory.at(-1).stage, 'Account 3')
})

test('stale, skipped and repeated decisions cannot advance a request', () => {
  const asset = submitted()
  assert.throws(() => approve(asset, 'accounting-3'), /step has changed/)
  const next = approve(asset, 'asset-1')
  assert.throws(() => approve(next, 'asset-1'), /step has changed/)
  assert.equal(asset.activationApproval.currentStep, 0)
})

test('Company Assets require Accounting 1 to record a valid depreciation date', () => {
  const asset = approve(approve(submitted(), 'asset-1'), 'asset-2')
  assert.throws(() => approve(asset, 'accounting-1'), /Depreciation Start Date/)
  assert.throws(() => approve(asset, 'accounting-1', { depreciationStartDate: 'not-a-date' }), /Depreciation Start Date/)
  assert.throws(() => approve(asset, 'accounting-1', { depreciationStartDate: '2026-02-31' }), /Depreciation Start Date/)
  const next = approve(asset, 'accounting-1', { depreciationStartDate: '2026-10-01' })
  assert.equal(next.status, 'Pending Accounting Approval')
  assert.equal(getActivationProgress(next).current.id, 'accounting-2')
})

test('Customer Assets pass all five levels without depreciation', () => {
  let asset = submitted({ ownershipType: 'customer', customerName: 'Customer A', depreciationStartDate: '2025-01-01', depreciationProfile: { method: 'Legacy' } })
  for (const stage of steps()) asset = approve(asset, stage.id)
  assert.equal(asset.status, 'Active')
  assert.equal(asset.depreciationStartDate, '')
  assert.deepEqual(asset.depreciationProfile, {})
})

test('submitted requests retain their named approvers after settings or user names change', () => {
  const config = steps()
  config[0].assignee = 'Original reviewer'
  const asset = { assetId: 'ME-1', ...createActivationRequest({}, config) }
  config[0].assignee = 'Replacement'
  const updated = approveActivation(asset, { stageId: 'asset-1' }, config)
  assert.equal(updated.activationApproval.steps[0].assignee, 'Original reviewer')
  assert.equal(updated.approvalHistory[0].assignedApprover, 'Original reviewer')
})

test('return and resubmission preserve the old route and all decisions', () => {
  const second = approve(submitted(), 'asset-1')
  assert.throws(() => returnActivation(second, { stageId: 'asset-2', comment: '' }, steps()), /correction reason/)
  const returned = returnActivation(second, { stageId: 'asset-2', comment: 'Fix model' }, steps())
  assert.equal(returned.status, 'Returned for Correction')
  assert.equal(getActivationProgress(returned).current, null)
  assert.throws(() => approve(returned, 'asset-2'), /step has changed/)
  const resubmitted = { ...returned, ...createActivationRequest(returned, steps()) }
  assert.equal(resubmitted.activationApproval.currentStep, 0)
  assert.equal(resubmitted.approvalHistory.length, 2)
  assert.equal(resubmitted.activationApprovalRuns[0].state, 'Returned')
  assert.notEqual(resubmitted.activationApproval.id, returned.activationApproval.id)
})

test('requests with a saved legacy workflow keep their remaining levels and earlier decisions', () => {
  const legacy = { status: 'Pending Accounting Approval', depreciationStartDate: '2026-10-01', activationApproval: { id: 'legacy-request', state: 'Pending', steps: steps(), currentStep: 3, legacyContinuation: true }, approvalHistory: [{ stage: 'Accounting Review', action: 'Approved' }] }
  assert.equal(getActivationProgress(legacy).current.id, 'accounting-2')
  const next = approve(legacy, 'accounting-2')
  assert.equal(next.approvalHistory.length, 2)
  assert.equal(next.activationApproval.legacyContinuation, true)
  assert.equal(next.status, 'Pending Accounting Approval')
  assert.equal(approve(next, 'accounting-3').status, 'Active')
})

test('unavailable named reviewers block new submissions instead of silently changing to a role queue', () => {
  const config = getActivationSteps([{ id: 'asset-1', userId: 'deleted-user' }], INITIAL_ADMIN_DATA.users, INITIAL_ADMIN_DATA.roles)
  assert.equal(config[0].userId, 'deleted-user')
  assert.equal(config[0].available, false)
  assert.throws(() => createActivationRequest({}, config), /available reviewer/)
})


test('custom approval types support one, two and seven freely named reviewers in the configured order', () => {
  for (const count of [1, 2, 7]) {
    const type = { id: `type-${count}`, name: `Activate with ${count} reviewers`, process: 'asset-activation', active: true,
      steps: Array.from({ length: count }, (_, i) => ({ id: `custom-${i}`, label: i === 0 ? 'Asset Team Check' : `Custom Check ${i}`, assignmentType: 'user', userId: 'user-admin' })) }
    const [resolved] = getApprovalTypes({ ...INITIAL_ADMIN_DATA, approvalTypes: [type] })
    let asset = { assetId: 'ME-CUSTOM', ...createActivationRequest({}, resolved.steps, undefined, resolved) }
    assert.equal(asset.activationApproval.approvalTypeName, type.name)
    for (let i = 0; i < count; i++) {
      assert.equal(getActivationProgress(asset).current.label, type.steps[i].label)
      assert.equal(asset.status, 'Pending Activation Approval')
      asset = approveActivation(asset, { stageId: type.steps[i].id, depreciationStartDate: '2026-10-15' })
      assert.equal(asset.status === 'Active', i === count - 1)
    }
    assert.equal(asset.approvalHistory.length, count)
    assert.ok(asset.approvalHistory.every((event) => event.assignedApprover === 'Pat S.' && event.approvalTypeId === type.id))
  }
})

test('a custom date-check step works by configuration, regardless of its id or name', () => {
  const customSteps = resolveApprovalSteps([
    { id: 'review', label: 'Accounting Team Check', assignmentType: 'user', userId: 'user-accounting', requiresDepreciationDate: true },
    { id: 'director', label: 'Director Sign-off', assignmentType: 'user', userId: 'user-admin' },
  ], INITIAL_ADMIN_DATA.users, INITIAL_ADMIN_DATA.roles)
  let asset = { ...createActivationRequest({}, customSteps) }
  assert.equal(approvalCollectsDepreciation(asset, getActivationProgress(asset)), true)
  assert.throws(() => approveActivation(asset, { stageId: 'review' }), /Depreciation Start Date/)
  asset = approveActivation(asset, { stageId: 'review', depreciationStartDate: '2026-10-01' })
  assert.equal(approvalCollectsDepreciation(asset, getActivationProgress(asset)), false)
  assert.equal(approveActivation(asset, { stageId: 'director' }).status, 'Active')
})

test('the last reviewer collects the date when no earlier step does; Customer Assets remain exempt', () => {
  const customSteps = resolveApprovalSteps([{ id: 'only', label: 'One Approval', assignmentType: 'user', userId: 'user-admin' }], INITIAL_ADMIN_DATA.users, INITIAL_ADMIN_DATA.roles)
  const company = { ...createActivationRequest({}, customSteps) }
  assert.equal(approvalCollectsDepreciation(company, getActivationProgress(company)), true)
  assert.throws(() => approveActivation(company, { stageId: 'only' }), /Depreciation Start Date/)
  const customer = { ownershipType: 'customer', ...createActivationRequest({}, customSteps) }
  assert.equal(approvalCollectsDepreciation(customer, getActivationProgress(customer)), false)
  assert.equal(approveActivation(customer, { stageId: 'only' }).status, 'Active')
})

test('editing or removing an approval type never changes an already submitted request', () => {
  const type = { id: 'a', name: 'Original Type', steps: resolveApprovalSteps([{ id: 'step-a', label: 'Original Check', assignmentType: 'user', userId: 'user-admin' }], INITIAL_ADMIN_DATA.users, INITIAL_ADMIN_DATA.roles) }
  const asset = { ...createActivationRequest({}, type.steps, undefined, type) }
  type.name = 'Renamed Type'; type.steps[0].label = 'Changed'; type.steps.push({ id: 'b', label: 'Extra' })
  const reloaded = JSON.parse(JSON.stringify(asset))
  assert.equal(reloaded.activationApproval.approvalTypeName, 'Original Type')
  assert.equal(getActivationProgress(reloaded, []).current.label, 'Original Check')
  assert.equal(reloaded.activationApproval.steps.length, 1)
})

test('empty routes and duplicate step identities cannot be submitted', () => {
  assert.throws(() => createActivationRequest({}, []), /available reviewer/)
  const step = { id: 'same', label: 'Check', status: 'Pending Activation Approval', available: true }
  assert.throws(() => createActivationRequest({}, [step, step]), /available reviewer/)
})
