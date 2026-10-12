import { useCallback, useEffect, useState } from 'react'
import { ASSET_TYPE_STORAGE_KEY, INITIAL_ASSET_TYPES } from '../data/assetTypes.js'

function readAssetTypes() {
  try {
    const saved = window.localStorage.getItem(ASSET_TYPE_STORAGE_KEY)
    const parsed = saved ? JSON.parse(saved) : null
    return Array.isArray(parsed) ? parsed : INITIAL_ASSET_TYPES
  } catch {
    return INITIAL_ASSET_TYPES
  }
}

export function useAssetTypeStore() {
  const [assetTypes, setAssetTypes] = useState(readAssetTypes)

  useEffect(() => {
    try {
      window.localStorage.setItem(ASSET_TYPE_STORAGE_KEY, JSON.stringify(assetTypes))
    } catch {
      // Keep the current session usable if browser storage is unavailable.
    }
  }, [assetTypes])

  const addAssetType = useCallback((assetType) => {
    setAssetTypes((currentTypes) => {
      const highestNumber = currentTypes.reduce((highest, type) => {
        const match = type.id.match(/^ATM-(\d+)$/)
        return Math.max(highest, Number(match?.[1]) || 0)
      }, 0)
      const nextType = { ...assetType, id: `ATM-${String(highestNumber + 1).padStart(3, '0')}` }
      return [...currentTypes, nextType]
    })
  }, [])

  const updateAssetType = useCallback((id, changes) => {
    setAssetTypes((currentTypes) => currentTypes.map((type) => (
      type.id === id ? { ...type, ...changes } : type
    )))
  }, [])

  const setAssetTypeActive = useCallback((id, active) => {
    setAssetTypes((currentTypes) => currentTypes.map((type) => (
      type.id === id ? { ...type, active } : type
    )))
  }, [])

  return { assetTypes, addAssetType, updateAssetType, setAssetTypeActive }
}
