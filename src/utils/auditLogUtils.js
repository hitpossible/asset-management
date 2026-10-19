export const AUDIT_STORAGE_KEY = 'tbkk-audit-log-v1'
export const AUDIT_CHANGED_EVENT = 'tbkk-audit-log-changed'
export const DEMO_AUDIT_ACTOR = { id: 'user-admin', name: 'Pat S.', role: 'Administrator' }

function auditValue(value, key = '') {
  if (/password|secret|token/i.test(key)) return value == null ? null : '[Redacted]'
  if (typeof value === 'string' && /^(data:|blob:)/.test(value)) return '[Attachment content]'
  if (Array.isArray(value)) return value.map((item) => auditValue(item))
  if (value && typeof value === 'object') return Object.fromEntries(Object.entries(value).map(([field, item]) => [field, auditValue(item, field)]))
  return value ?? null
}

export function getAuditChanges(before, after, path = '') {
  const changes = []
  const keys = new Set([...Object.keys(before || {}), ...Object.keys(after || {})])
  for (const key of keys) {
    const oldValue = before?.[key]
    const newValue = after?.[key]
    if (JSON.stringify(oldValue) === JSON.stringify(newValue)) continue
    const field = path ? `${path}.${key}` : key
    // Nested objects get field-level changes; collections retain complete old/new values.
    if (oldValue && newValue && typeof oldValue === 'object' && typeof newValue === 'object' && !Array.isArray(oldValue) && !Array.isArray(newValue)) {
      changes.push(...getAuditChanges(oldValue, newValue, field))
    } else {
      changes.push({ field, before: auditValue(oldValue, key), after: auditValue(newValue, key) })
    }
  }
  return changes
}

function inferAction(before, after) {
  if (!before) return 'Create'
  if (!after) return 'Delete'
  if (before.active !== after.active && typeof after.active === 'boolean') return after.active ? 'Activate' : 'Deactivate'
  if (before.status !== after.status) {
    if (/Returned|Correction/.test(after.status || '')) return 'Return for Correction'
    if (after.status === 'Sold') return 'Derecognize / Sale'
    if (after.status === 'Active') return 'Activate'
    if (after.status === 'Completed') return 'Complete'
    if (after.status === 'Approved' || /Pending Accounting/.test(after.status || '')) return 'Approve'
    if (after.status === 'Pending Asset Team Leader Approval') return 'Submit for Approval'
  }
  return 'Update'
}

export function createAuditRecord({ module, origin, entityType, reference, name, before, after, action, actor = DEMO_AUDIT_ACTOR, timestamp = new Date().toISOString(), id }) {
  if (module === 'MIS' || String(origin || '').startsWith('mis-')) return null
  const changes = getAuditChanges(before, after)
  if (!changes.length) return null
  return { id: id || crypto.randomUUID(), timestamp, actor: { ...actor }, module, origin, entityType, reference, name: name || '', action: action || inferAction(before, after), changes }
}

export function diffAuditCollection(before, after, key, meta) {
  const previous = new Map(before.map((record) => [record[key], record]))
  const next = new Map(after.map((record) => [record[key], record]))
  return [...new Set([...previous.keys(), ...next.keys()])].map((reference) => createAuditRecord({ ...meta, reference, name: next.get(reference)?.name || previous.get(reference)?.name || next.get(reference)?.title || '', before: previous.get(reference), after: next.get(reference) })).filter(Boolean)
}

export function formatAuditValue(value) {
  if (value == null || value === '') return '—'
  if (typeof value === 'boolean') return value ? 'Yes' : 'No'
  return typeof value === 'object' ? JSON.stringify(value, null, 2) : String(value)
}

export function filterAuditRecords(records, filters) {
  const query = (filters.query || '').trim().toLowerCase()
  return records.filter((record) => {
    const date = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Bangkok', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date(record.timestamp))
    return (!filters.module || record.module === filters.module)
      && (!filters.actor || record.actor.name === filters.actor)
      && (!filters.action || record.action === filters.action)
      && (!filters.from || date >= filters.from) && (!filters.to || date <= filters.to)
      && (!query || [record.reference, record.name, record.entityType, record.action, record.module, record.actor.name, record.actor.role, ...record.changes.flatMap((change) => [change.field, formatAuditValue(change.before), formatAuditValue(change.after)])].join(' ').toLowerCase().includes(query))
  })
}
