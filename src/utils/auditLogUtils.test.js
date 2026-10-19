import test from 'node:test'
import assert from 'node:assert/strict'
import { createAuditRecord, diffAuditCollection, filterAuditRecords, getAuditChanges, AUDIT_STORAGE_KEY, AUDIT_CHANGED_EVENT } from './auditLogUtils.js'

const meta = { module: 'Assets', origin: 'assets', entityType: 'Asset', reference: 'ME-2026-0001', timestamp: '2026-10-13T17:30:00Z', id: 'log-1' }
const record = (before, after, overrides = {}) => createAuditRecord({ ...meta, before, after, ...overrides })

test('field-level audit retains previous values, removals and nested assignment changes without mutating the record', () => {
  const before = { name: 'Old name', location: 'Building A', profile: { months: 60 }, notes: 'Remove this' }
  const after = { name: 'New name', location: 'Building B', profile: { months: 72 } }
  const snapshot = JSON.stringify(before)
  const log = record(before, after)
  assert.equal(log.action, 'Update')
  assert.deepEqual(log.changes, [
    { field: 'name', before: 'Old name', after: 'New name' },
    { field: 'location', before: 'Building A', after: 'Building B' },
    { field: 'profile.months', before: 60, after: 72 },
    { field: 'notes', before: 'Remove this', after: null },
  ])
  assert.equal(log.actor.name, 'Pat S.')
  assert.equal(log.actor.role, 'Administrator')
  after.profile.months = 100
  assert.equal(log.changes[2].after, 72)
  assert.equal(JSON.stringify(before), snapshot)
})

test('MIS origins exclude indirect Asset changes and lifecycle completion; administration of MIS menu grants is still auditable', () => {
  for (const origin of ['mis-proposal', 'mis-proposals', 'mis-create-pr', 'mis-prs', 'mis-create-po', 'mis-pos', 'mis-create-gr']) {
    assert.equal(record({ status: 'Draft' }, { status: 'Purchasing' }, { origin }), null)
    assert.equal(record({ status: 'Pending Approval' }, { status: 'Completed' }, { origin, module: 'Movement' }), null)
  }
  assert.equal(record({}, { name: 'Test' }, { module: 'MIS' }), null)
  assert.ok(record({ menuIds: [] }, { menuIds: ['mis-create-gr'] }, { module: 'Administrator', origin: 'admin-permissions' }))
})

test('unchanged saves produce no audit record; creation, approval, return, activation, sale and completion have meaningful actions', () => {
  assert.equal(record({ status: 'Draft' }, { status: 'Draft' }), null)
  assert.equal(record(null, { name: 'Machine', status: 'Draft' }).action, 'Create')
  for (const [status, action] of [['Pending Asset Team Leader Approval', 'Submit for Approval'], ['Pending Accounting Review', 'Approve'], ['Returned for Correction', 'Return for Correction'], ['Active', 'Activate'], ['Sold', 'Derecognize / Sale'], ['Completed', 'Complete']]) assert.equal(record({ status: 'Draft' }, { status }).action, action)
  assert.equal(record({ active: true }, { active: false }).action, 'Deactivate')
  assert.equal(record({ currentApprovalStep: 1 }, { currentApprovalStep: 2 }, { action: 'Approve' }).action, 'Approve')
})

test('credentials and attachment bodies never enter audit data, while attachment metadata and permission values remain inspectable', () => {
  const log = record(null, { password: 'private-password', profile: { accessToken: 'private-token' }, photos: [{ name: 'machine.png', data: 'data:image/png;base64,private-content' }], roleIds: ['role-asset'] })
  const json = JSON.stringify(log)
  for (const secret of ['private-password', 'private-token', 'private-content']) assert.equal(json.includes(secret), false)
  assert.ok(json.includes('machine.png'))
  assert.ok(json.includes('role-asset'))
  const values = getAuditChanges({ photo: 'blob:before' }, { photo: 'blob:after' })
  assert.equal(values[0].after, '[Attachment content]')
})

test('user and role collections log only changed entities and retain exact permission arrays', () => {
  const logs = diffAuditCollection([{ id: 'user-1', name: 'Pat', active: true }, { id: 'user-2', name: 'Maya' }], [{ id: 'user-1', name: 'Pat', active: false }, { id: 'user-2', name: 'Maya' }, { id: 'user-3', name: 'New user' }], 'id', { module: 'Administrator', origin: 'admin-users', entityType: 'User' })
  assert.deepEqual(logs.map((log) => log.reference), ['user-1', 'user-3'])
  assert.deepEqual(logs.map((log) => log.action), ['Deactivate', 'Create'])
  assert.deepEqual(record({ roleIds: ['role-owner'] }, { roleIds: ['role-accounting'] }).changes[0], { field: 'roleIds', before: ['role-owner'], after: ['role-accounting'] })
})

test('search combines module, actor, action and Bangkok date boundaries, including changed values', () => {
  const log = record({ location: 'Building A' }, { location: 'Building B' })
  assert.equal(filterAuditRecords([log], { from: '2026-10-14', to: '2026-10-14', query: 'building b', actor: 'Pat S.', module: 'Assets', action: 'Update' }).length, 1)
  assert.equal(filterAuditRecords([log], { to: '2026-10-13' }).length, 0)
  assert.equal(filterAuditRecords([log], { module: 'Administrator' }).length, 0)
  assert.equal(filterAuditRecords([log], { actor: 'Maya' }).length, 0)
  assert.equal(filterAuditRecords([log], { action: 'Create' }).length, 0)
})

test('browser persistence appends without overwriting previous logs, handles reload and falls back to session records on quota failure', async () => {
  const values = new Map()
  const events = []
  let failWrites = false
  globalThis.window = { localStorage: { getItem: (key) => values.get(key) || null, setItem: (key, value) => { if (failWrites) throw new Error('Quota exceeded'); values.set(key, value) } }, dispatchEvent: (event) => events.push(event.type) }
  const { appendAuditRecords, readAuditLog } = await import('./auditLogStorage.js')
  const first = record(null, { name: 'Machine' })
  const second = record({ name: 'Machine' }, { name: 'Machine B' }, { id: 'log-2' })
  appendAuditRecords([first])
  appendAuditRecords([second])
  appendAuditRecords([second])
  assert.deepEqual(readAuditLog().records.map((log) => log.id), ['log-2', 'log-1'])
  assert.equal(JSON.parse(values.get(AUDIT_STORAGE_KEY)).length, 2)
  const reloaded = await import('./auditLogStorage.js?reload-test')
  assert.equal(reloaded.readAuditLog().records.length, 2)
  failWrites = true
  appendAuditRecords([record({ status: 'Draft' }, { status: 'Active' }, { id: 'log-3' })])
  assert.equal(readAuditLog().records.length, 3)
  assert.equal(readAuditLog().storageAvailable, false)
  assert.equal(events.every((type) => type === AUDIT_CHANGED_EVENT), true)
  delete globalThis.window
})
