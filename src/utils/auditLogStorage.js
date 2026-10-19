import { AUDIT_STORAGE_KEY, AUDIT_CHANGED_EVENT } from './auditLogUtils.js'

let sessionRecords = null
let storageAvailable = true

export function readAuditLog() {
  try {
    const parsed = JSON.parse(window.localStorage.getItem(AUDIT_STORAGE_KEY) || '[]')
    if (storageAvailable) sessionRecords = Array.isArray(parsed) ? parsed.filter((record) => record && typeof record.id === 'string' && Array.isArray(record.changes) && record.actor?.name && !Number.isNaN(Date.parse(record.timestamp))) : []
  } catch { storageAvailable = false }
  return { records: sessionRecords || [], storageAvailable }
}

export function appendAuditRecords(records) {
  records = records.filter(Boolean)
  if (!records.length) return
  const current = readAuditLog().records
  const ids = new Set(current.map((record) => record.id))
  sessionRecords = [...records.filter((record) => !ids.has(record.id)), ...current]
  try {
    window.localStorage.setItem(AUDIT_STORAGE_KEY, JSON.stringify(sessionRecords))
    storageAvailable = true
  } catch { storageAvailable = false }
  window.dispatchEvent(new Event(AUDIT_CHANGED_EVENT))
}
