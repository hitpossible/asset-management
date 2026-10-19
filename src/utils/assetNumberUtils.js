import { getNextSubAssetId } from './subAssetDraftUtils.js'

import { getNextTemporaryAssetId, getAssetNumberYear } from './temporaryAssetUtils.js'
export { getNextTemporaryAssetId, getAssetNumberYear } from './temporaryAssetUtils.js'

const REFERENCE_KEYS = new Set(['assetId', 'parentAssetId', 'sourceAssetId', 'mainAssetId', 'subAssetId'])

// Update only relationship keys; retain historical document numbers and temporary references.
export function remapAssetReferences(value, mapping) {
  if (Array.isArray(value)) return value.map((item) => remapAssetReferences(item, mapping))
  if (!value || typeof value !== 'object') return value
  return Object.fromEntries(Object.entries(value).map(([key, item]) => [key,
    REFERENCE_KEYS.has(key) && mapping.has(item) ? mapping.get(item) : remapAssetReferences(item, mapping),
  ]))
}

export function prepareProposalApproval(proposal, assets, year = getAssetNumberYear()) {
  const mapping = new Map()
  const updates = new Map()
  if (!proposal || proposal.status === 'Approved') return { mapping, updates }
  const knownIds = new Set(assets.map((asset) => asset.assetId))
  const prefix = `AST-${year}-`
  let highest = assets.reduce((max, asset) => {
    const suffix = asset.assetId.startsWith(prefix) ? asset.assetId.slice(prefix.length) : ''
    return /^\d+$/.test(suffix) ? Math.max(max, Number(suffix)) : max
  }, 0)
  for (const item of proposal.assetItems || []) {
    const asset = assets.find((record) => record.assetId === item.assetId)
    if (!asset || !['Draft', 'Proposal Processing'].includes(asset.status) || mapping.has(asset.assetId)) continue
    const assetId = asset.parentAssetId
      ? getNextSubAssetId(asset.parentAssetId, knownIds)
      : `${prefix}${String(++highest).padStart(4, '0')}`
    knownIds.add(assetId)
    mapping.set(asset.assetId, assetId)
    updates.set(asset.assetId, {
      ...asset,
      assetId,
      temporaryReference: asset.temporaryReference || asset.assetId,
      assetNumberAssignedAt: new Date().toISOString(),
      status: 'Purchasing',
    })
  }
  return { mapping, updates }
}

// Upgrade pre-approval records saved by the previous mockup without changing approved Assets.
export function prepareDraftNumberMigration(assets, proposals, year = getAssetNumberYear()) {
  const mapping = new Map()
  const updates = new Map()
  const known = [...assets]
  for (const asset of assets) {
    if (!['Draft', 'Proposal Processing'].includes(asset.status) || asset.assetNumberAssignedAt) continue
    if (asset.prNo || asset.poNo || asset.purchaseOrderReferences?.length || asset.purchaseRequisitionReferences?.length) continue
    if (proposals.some((proposal) => proposal.status === 'Approved' && proposal.assetItems?.some((item) => item.assetId === asset.assetId))) continue
    const assetId = asset.assetId.startsWith('TMP-') ? asset.assetId : getNextTemporaryAssetId(known, year)
    const record = { ...asset, assetId, temporaryReference: assetId, status: 'Draft' }
    if (assetId !== asset.assetId || asset.status !== 'Draft' || !asset.temporaryReference) {
      mapping.set(asset.assetId, assetId)
      updates.set(asset.assetId, record)
      known.push(record)
    }
  }
  return { mapping, updates }
}
