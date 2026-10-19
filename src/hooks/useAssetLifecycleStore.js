import { remapAssetReferences } from '../utils/assetNumberUtils.js'
import { isCustomerAsset } from '../utils/assetOwnershipUtils.js'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { mergeDemoLifecycleEvents } from '../data/mockLifecycleEvents.js'

const ASSET_LIFECYCLE_STORAGE_KEY = 'tbkk-asset-lifecycle-v1'

const TRANSACTION_PREFIXES = {
  disposal: 'DIS',
  subAsset: 'SUB',
  modification: 'MOD',
  maintenance: 'MNT',
  transfer: 'TRF',
  sparePartUsage: 'SPU',
}

function readLifecycleEvents() {
  try {
    const saved = window.localStorage.getItem(ASSET_LIFECYCLE_STORAGE_KEY)
    const parsed = saved ? JSON.parse(saved) : []
    return mergeDemoLifecycleEvents(Array.isArray(parsed) ? parsed : [])
  } catch {
    return mergeDemoLifecycleEvents([])
  }
}

function createTransactionNo(events, type) {
  const prefix = TRANSACTION_PREFIXES[type] || 'LC'
  const year = new Date().getFullYear()
  const pattern = new RegExp(`^${prefix}-${year}-(\\d+)$`)
  const highestNumber = events.reduce((highest, event) => {
    const match = String(event.transactionNo || '').match(pattern)
    return Math.max(highest, Number(match?.[1]) || 0)
  }, 0)

  return `${prefix}-${year}-${String(highestNumber + 1).padStart(4, '0')}`
}

export function useAssetLifecycleStore(assets) {
  const [storedEvents, setLifecycleEvents] = useState(readLifecycleEvents)
  const lifecycleEvents = useMemo(() => mergeDemoLifecycleEvents(storedEvents, assets), [storedEvents, assets])

  useEffect(() => {
    try {
      window.localStorage.setItem(ASSET_LIFECYCLE_STORAGE_KEY, JSON.stringify(lifecycleEvents))
    } catch {
      // Keep the current session usable if browser storage is unavailable.
    }
  }, [lifecycleEvents])

  const remapAssetIds = useCallback((mapping) => {
    setLifecycleEvents((current) => remapAssetReferences(current, mapping))
  }, [])

  const addLifecycleEvent = useCallback((event) => {
    if (isCustomerAsset(assets.find((asset) => asset.assetId === event.assetId))) throw new Error('Customer Assets cannot have lifecycle events.')
    const record = {
      ...event,
      transactionNo: createTransactionNo(lifecycleEvents, event.type),
      createdAt: new Date().toISOString(),
    }
    setLifecycleEvents((current) => [record, ...mergeDemoLifecycleEvents(current, assets)])
    return record
  }, [lifecycleEvents, assets])

  const addLifecycleEvents = useCallback((newEvents) => {
    if (newEvents.some((event) => isCustomerAsset(assets.find((asset) => asset.assetId === event.assetId)))) throw new Error('Customer Assets cannot have lifecycle events.')
    let knownEvents = [...lifecycleEvents]
    const records = newEvents.map((event) => {
      const record = {
        ...event,
        transactionNo: createTransactionNo(knownEvents, event.type),
        createdAt: new Date().toISOString(),
      }
      knownEvents = [record, ...knownEvents]
      return record
    })
    setLifecycleEvents((current) => [...records, ...mergeDemoLifecycleEvents(current, assets)])
    return records
  }, [lifecycleEvents, assets])

  const updateLifecycleEvent = useCallback((transactionNo, changes) => {
    setLifecycleEvents((current) => mergeDemoLifecycleEvents(current, assets).map((event) => (
      event.transactionNo === transactionNo ? { ...event, ...changes } : event
    )))
  }, [assets])

  const addProposalEvents = useCallback((events) => {
    if (events.some((event) => isCustomerAsset(assets.find((asset) => asset.assetId === event.assetId)))) throw new Error('Customer Assets cannot have lifecycle events.')
    setLifecycleEvents((current) => [...events, ...current])
  }, [assets])

  return { remapAssetIds, lifecycleEvents, addLifecycleEvent, addLifecycleEvents, updateLifecycleEvent, addProposalEvents }
}
