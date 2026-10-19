import { getNextTemporaryAssetId } from './temporaryAssetUtils.js'
import { isCustomerAsset } from './assetOwnershipUtils.js'

export function getNextSubAssetId(parentAssetId, assetIds) {
  const prefix = `${parentAssetId}-`
  const highest = [...assetIds].reduce((max, id) => {
    const suffix = id.startsWith(prefix) ? id.slice(prefix.length) : ''
    return /^\d+$/.test(suffix) ? Math.max(max, Number(suffix)) : max
  }, 0)
  return `${prefix}${highest + 1}`
}

export function createSubAssetDraft(request, assets) {
  const parent = assets.find((asset) => asset.assetId === request.sourceAssetId)
  if (!parent || parent.status !== 'Active' || isCustomerAsset(parent) || parent.parentAssetId) {
    throw new Error('Select an Active Company Main Asset.')
  }
  if (!request.name?.trim()) throw new Error('Enter a component name.')
  return {
    assetId: getNextTemporaryAssetId(assets),
    temporaryReference: getNextTemporaryAssetId(assets),
    parentAssetId: parent.assetId,
    sourceAssetId: parent.assetId,
    ownershipType: 'company',
    customerName: '',
    workType: 'subAsset',
    draftOrigin: 'Create Sub Asset',
    status: 'Draft',
    name: request.name.trim(),
    assetClass: parent.assetClass,
    custodian: parent.custodian,
    department: parent.department || '',
    plant: parent.plant,
    location: parent.location,
    line: parent.line,
    area: parent.area,
    projectCode: parent.projectCode || '',
    projectName: parent.projectName || '',
    model: request.model || '',
    power: request.power || '',
    targetSop: request.targetSop || '',
    notes: request.notes || '',
    estimatedAmount: Number(request.amount) || 0,
    proposalNo: '', prNo: '', poNo: '',
    proposalReferences: [], invoices: [], goodsReceipts: [], approvalHistory: [],
  }
}

export function migrateSubAssetRequests(requests, assets) {
  const records = []
  const migratedIds = []
  for (const request of requests) {
    if (!request.requestId) continue
    if (assets.some((asset) => asset.legacyRequestId === request.requestId)) {
      migratedIds.push(request.requestId)
      continue
    }
    const parent = assets.find((asset) => asset.assetId === request.sourceAssetId)
    if (!parent || parent.status !== 'Active' || parent.parentAssetId || isCustomerAsset(parent) || !request.name?.trim()) continue
    records.push({ ...createSubAssetDraft(request, [...assets, ...records]), legacyRequestId: request.requestId })
    migratedIds.push(request.requestId)
  }
  return { records, migratedIds }
}
