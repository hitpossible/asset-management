import { useEffect, useState } from 'react'

const STORAGE_KEY = 'tbkk-sub-asset-requests-v1'

export function useSubAssetRequestStore() {
  const [requests, setRequests] = useState(() => {
    try {
      const saved = JSON.parse(window.localStorage.getItem(STORAGE_KEY) || '[]')
      return Array.isArray(saved) ? saved.filter((request) => request && typeof request.sourceAssetId === 'string' && typeof request.name === 'string') : []
    } catch { return [] }
  })
  useEffect(() => {
    try { window.localStorage.setItem(STORAGE_KEY, JSON.stringify(requests)) } catch { /* Keep this session usable without browser storage. */ }
  }, [requests])

  function saveRequest(request) {
    const saved = { ...request, requestId: request.requestId || `SUBREQ-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, status: 'Draft' }
    setRequests((current) => [...current.filter((item) => item.sourceAssetId !== saved.sourceAssetId), saved])
    return saved
  }

  function removeRequests(ids) {
    setRequests((current) => current.filter((request) => !ids.includes(request.requestId)))
  }

  return { requests, saveRequest, removeRequests }
}
