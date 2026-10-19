import { getAssetOwnerLabel, getAssetOwnership } from '../utils/assetOwnershipUtils.js'
import { useCallback, useMemo, useState } from 'react'

const DEFAULT_FILTERS = {
  query: '',
  ownershipType: 'all',
  status: 'All status',
  projectCode: '',
  assetClass: 'All asset classes',
  plant: 'All plants',
  location: 'All locations',
  custodian: 'All custodians',
}

export function useAssetFilters(assets) {
  const [filters, setFilters] = useState(DEFAULT_FILTERS)

  const options = useMemo(() => ({
    assetClasses: [...new Set(assets.map((asset) => asset.assetClass).filter(Boolean))].sort(),
    plants: [...new Set(assets.map((asset) => asset.plant).filter(Boolean))].sort(),
    locations: [...new Set(assets.map((asset) => asset.location).filter(Boolean))].sort(),
    custodians: [...new Set(assets.map((asset) => asset.custodian).filter(Boolean))].sort(),
  }), [assets])

  const filteredAssets = useMemo(() => {
    const needle = filters.query.trim().toLowerCase()
    return assets.filter((asset) => {
      const matchesQuery = !needle || [
        asset.assetId,
        asset.name,
        asset.rfqNo,
        asset.partNo,
        asset.assetClass,
        asset.model,
        asset.customerName,
        getAssetOwnerLabel(asset),
        asset.custodian,
        asset.plant,
        asset.location,
        asset.line,
        asset.projectCode,
        asset.projectName,
        asset.power,
        asset.area,
      ].some((value) => String(value || '').toLowerCase().includes(needle))
      const matchesStatus = filters.status === 'All status' || asset.status === filters.status
      const assetProjectCode = asset.projectCode?.trim()
      const matchesProject = !filters.projectCode
        || (filters.projectCode === '__unassigned__' ? !assetProjectCode : assetProjectCode?.toLowerCase() === filters.projectCode.toLowerCase())
      const matchesClass = filters.assetClass === 'All asset classes' || asset.assetClass === filters.assetClass
      const matchesPlant = filters.plant === 'All plants' || asset.plant === filters.plant
      const matchesLocation = filters.location === 'All locations' || asset.location === filters.location

      const matchesCustodian = filters.custodian === 'All custodians' || asset.custodian === filters.custodian

      return (filters.ownershipType === 'all' || getAssetOwnership(asset) === filters.ownershipType) && matchesQuery && matchesStatus && matchesProject && matchesClass && matchesPlant && matchesLocation && matchesCustodian
    })
  }, [assets, filters])

  const hasActiveFilters = Object.entries(filters).some(([key, value]) => value !== DEFAULT_FILTERS[key])
  const updateFilter = useCallback((key, value) => {
    setFilters((currentFilters) => ({ ...currentFilters, [key]: value }))
  }, [])
  const clearFilters = useCallback(() => setFilters(DEFAULT_FILTERS), [])

  return { filters, options, filteredAssets, hasActiveFilters, updateFilter, clearFilters }
}
