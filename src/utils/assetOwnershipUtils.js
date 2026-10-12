import { getAssetReferences } from './misReferenceUtils.js'

// Existing records without ownership remain company-owned.
export function getAssetOwnership(asset) {
  return asset?.ownershipType === 'customer' ? 'customer' : 'company'
}

export function isCustomerAsset(asset) {
  return getAssetOwnership(asset) === 'customer'
}

export function getAssetOwnerLabel(asset) {
  return isCustomerAsset(asset) ? `Customer Asset · ${asset.customerName || 'Customer not specified'}` : 'Company Asset · TBKK'
}

export function getProposalEligibleAssets(assets, ownershipType = 'company') {
  return assets.filter((asset) => getAssetOwnership(asset) === ownershipType && (
    asset.status === 'Draft' && getAssetReferences(asset).proposalReferences.length === 0
    || ownershipType === 'company' && asset.status === 'Active'
  ))
}

export function normalizeAssetOwnership(asset) {
  const ownershipType = getAssetOwnership(asset)
  const customerName = ownershipType === 'customer' ? String(asset.customerName || '').trim() : ''
  if (ownershipType === 'customer' && !customerName) throw new Error('Enter the customer name for a Customer Asset.')
  return { ...asset, ownershipType, customerName, ...(ownershipType === 'customer' ? { depreciationStartDate: '', depreciationProfile: {} } : {}) }
}
