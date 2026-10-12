import { useCallback, useEffect, useState } from 'react'
import { INITIAL_ASSETS, STORAGE_KEY } from '../data/mockAssets.js'

function readAssets() {
  try {
    const saved = window.localStorage.getItem(STORAGE_KEY)
    const parsed = saved ? JSON.parse(saved) : null
    const assets = Array.isArray(parsed) ? parsed : INITIAL_ASSETS
    return assets.map((asset) => asset.status === 'Receiving Validation'
      ? { ...asset, status: 'Asset Validation' }
      : asset)
  } catch {
    return INITIAL_ASSETS
  }
}

export function useAssetStore() {
  const [assets, setAssets] = useState(readAssets)

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(assets))
    } catch {
      // Keep the current session usable if browser storage is unavailable.
    }
  }, [assets])

  const addDraft = useCallback((draft) => {
    setAssets((currentAssets) => {
      const highestDraftNumber = currentAssets.reduce((highest, asset) => {
        const match = asset.assetId.match(/^AST-2026-(\d+)$/)
        return Math.max(highest, Number(match?.[1]) || 0)
      }, 0)
      const nextAsset = {
        ...draft,
        assetId: `AST-2026-${String(highestDraftNumber + 1).padStart(4, '0')}`,
        status: 'Draft',
      }
      return [nextAsset, ...currentAssets]
    })
  }, [])

  const updateDraft = useCallback((assetId, draft) => {
    setAssets((currentAssets) => currentAssets.map((asset) => (
      asset.assetId === assetId ? { ...asset, ...draft, status: 'Draft' } : asset
    )))
  }, [])

  const renameAssetClass = useCallback((previousName, nextName) => {
    setAssets((currentAssets) => currentAssets.map((asset) => (
      asset.assetClass === previousName ? { ...asset, assetClass: nextName } : asset
    )))
  }, [])

  const updateAssets = useCallback((assetIds, updateAsset) => {
    const selectedIds = new Set(assetIds)
    setAssets((currentAssets) => currentAssets.map((asset) => (
      selectedIds.has(asset.assetId) ? updateAsset(asset) : asset
    )))
  }, [])

  const addAssets = useCallback((records) => {
    setAssets((current) => [...records.filter((record) => !current.some((asset) => asset.assetId === record.assetId)), ...current])
  }, [])

  return { assets, addDraft, updateDraft, renameAssetClass, updateAssets, addAssets }
}
