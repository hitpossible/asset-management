import { useEffect, useState } from 'react'
import { AUDIT_CHANGED_EVENT, AUDIT_STORAGE_KEY } from '../utils/auditLogUtils.js'
import { readAuditLog } from '../utils/auditLogStorage.js'

export function useAuditLogStore() {
  const [snapshot, setSnapshot] = useState(readAuditLog)
  useEffect(() => {
    const refresh = () => setSnapshot(readAuditLog())
    const onStorage = (event) => { if (event.key === AUDIT_STORAGE_KEY || event.key === null) refresh() }
    window.addEventListener(AUDIT_CHANGED_EVENT, refresh)
    window.addEventListener('storage', onStorage)
    return () => { window.removeEventListener(AUDIT_CHANGED_EVENT, refresh); window.removeEventListener('storage', onStorage) }
  }, [])
  return snapshot
}
