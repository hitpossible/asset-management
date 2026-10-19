import { getNextTemporaryAssetId } from '../utils/temporaryAssetUtils.js'
import { useCallback, useEffect, useState } from 'react'
import { INITIAL_ASSETS, STORAGE_KEY } from '../data/mockAssets.js'
import { MOCK_SALE_PROPOSALS } from '../data/mockTaxInvoices.js'

const DISPOSAL_DEMO_ASSET_IDS = new Set(MOCK_SALE_PROPOSALS.flatMap((proposal) => proposal.assetIds || []))

function hydrateDisposalDemoAssets(assets) {
  const demoRecords = INITIAL_ASSETS.filter((asset) => DISPOSAL_DEMO_ASSET_IDS.has(asset.assetId))
  const demoById = new Map(demoRecords.map((asset) => [asset.assetId, asset]))
  const existingIds = new Set(assets.map((asset) => asset.assetId))
  const hydrated = assets.map((asset) => {
    const demo = demoById.get(asset.assetId)
    if (!demo) return asset
    return {
      ...asset,
      acquisitionValue: asset.acquisitionValue ?? demo.acquisitionValue,
      depreciationStartDate: asset.depreciationStartDate || demo.depreciationStartDate,
    }
  })
  return [...hydrated, ...demoRecords.filter((asset) => !existingIds.has(asset.assetId))]
}

function readAssets() {
  try {
    const saved = window.localStorage.getItem(STORAGE_KEY)
    const parsed = saved ? JSON.parse(saved) : null
    const assets = hydrateDisposalDemoAssets(Array.isArray(parsed) ? parsed : INITIAL_ASSETS)
    return assets.map((asset) => asset.status === 'Receiving Validation'
      ? { ...asset, status: 'Asset Validation' }
      : asset)
  } catch {
    return INITIAL_ASSETS
  }
}

export function useAssetStore() {
  const [assets, setAssets] = useState(readAssets)
  const [storageFailed, setStorageFailed] = useState(false)

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(assets))
      setStorageFailed(false)
    } catch {
      setStorageFailed(true)
    }
  }, [assets])

  const addDraft = useCallback((draft) => {
    setAssets((currentAssets) => {
      const temporaryReference = getNextTemporaryAssetId(currentAssets)
      const nextAsset = {
        ...draft,
        assetId: temporaryReference,
        temporaryReference,
        status: 'Draft',
      }
      return [nextAsset, ...currentAssets]
    })
  }, [])

  const updateDraft = useCallback((assetId, draft) => {
    setAssets((currentAssets) => currentAssets.map((asset) => (
      asset.assetId === assetId && asset.status === 'Draft' && !asset.proposalNo ? { ...asset, ...draft, status: 'Draft' } : asset
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

  return { assets, storageFailed, addDraft, updateDraft, renameAssetClass, updateAssets, addAssets }
}
