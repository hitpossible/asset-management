import { getAssetOwnership, isCustomerAsset, getProposalEligibleAssets } from './assetOwnershipUtils.js'
import { getNextSubAssetId } from './subAssetDraftUtils.js'
export const WORK_TYPES = [
  { id: 'subAsset', label: 'Addition Sub-Asset' },
  { id: 'modification', label: 'Modification' },
  { id: 'maintenance', label: 'Maintenance' },
]
export const EXISTING_WORK_TYPES = WORK_TYPES.filter((type) => type.id !== 'subAsset')

export function getProposalItemTotal(item) {
  // Compare in satang so decimal addition does not cross the threshold accidentally.
  const satang = (value) => Math.round((Number(value) || 0) * 100)
  return (satang(item.assetAmount ?? item.amount) + (item.costs || []).reduce((sum, cost) => sum + satang(cost.amount), 0)) / 100
}

export function getProposalTreatment(item) {
  return item.assetMode === 'existing' ? getProposalItemTotal(item) > 50_000 ? 'Capitalized' : 'Expense' : 'New Asset'
}

// Resolve the main Asset by relationship, not by parsing its number.
export function getMainAsset(asset, assets) {
  const byId = new Map(assets.map((record) => [record.assetId, record]))
  const seen = new Set()
  let current = asset
  while (current?.parentAssetId) {
    if (seen.has(current.assetId)) return null
    seen.add(current.assetId)
    current = byId.get(current.parentAssetId)
  }
  return current || null
}

export function prepareProposalAssets(proposal, assets) {
  const knownIds = new Set(assets.map((asset) => asset.assetId))
  const createdAssets = []
  const updatedAssets = []
  const events = []
  const selectedDraftIds = new Set()
  const assetItems = proposal.assetItems.map((inputItem, index) => {
    // A manually saved Sub Asset already has a reserved number. Process its
    // purchasing work against the source, reusing that Draft when capitalized.
    const draft = assets.find((asset) => asset.assetId === inputItem.assetId && asset.draftOrigin === 'Create Sub Asset' && asset.status === 'Draft')
    if (draft && (isCustomerAsset(draft) || selectedDraftIds.has(draft.assetId))) throw new Error('Select each Company Sub Asset Draft only once.')
    if (draft) selectedDraftIds.add(draft.assetId)
    if (draft && !getProposalEligibleAssets([draft]).length) throw new Error('Sub Asset must be an available Draft.')
    const item = draft ? {
      ...inputItem,
      assetMode: 'existing',
      assetId: draft.sourceAssetId,
      workType: draft.workType,
      workName: draft.name,
      description: draft.notes || '',
      model: draft.model,
      power: draft.power,
      targetSop: draft.targetSop,
    } : inputItem
    const source = assets.find((asset) => asset.assetId === item.assetId)
    if (!source) throw new Error('The selected Asset does not exist.')
    if (getAssetOwnership(source) !== (proposal.ownershipType || 'company')) throw new Error('All Assets must match the Proposal ownership.')
    if (isCustomerAsset(source) && item.assetMode === 'existing') throw new Error('Customer Assets cannot have lifecycle work.')
    if (isCustomerAsset(source) && !source.customerName?.trim()) throw new Error('Customer Asset requires a customer name.')
    const costTreatment = getProposalTreatment(item)
    const total = getProposalItemTotal(item)
    const itemId = item.itemId || `${proposal.proposalId}-${index + 1}`
    if (item.assetMode !== 'existing') {
      if (!getProposalEligibleAssets([source], getAssetOwnership(source)).some((asset) => asset.status === 'Draft')) throw new Error('New Asset must be an available Draft.')
      return { ...item, itemId, costTreatment, ownershipType: getAssetOwnership(source), customerName: source.customerName || '' }
    }
    if (!source || source.status !== 'Active') throw new Error('Existing Asset must be Active.')
    if (item.workOnExistingAsset && !EXISTING_WORK_TYPES.some((type) => type.id === item.workType)) throw new Error('Select Modification or Maintenance for an Active Asset.')
    const mainAsset = getMainAsset(source, assets)
    if (!mainAsset) throw new Error('The selected Asset must have a valid main Asset relationship.')
    let subAssetId = ''
    if (costTreatment === 'Capitalized' && !item.workOnExistingAsset) {
      if (draft && draft.parentAssetId !== mainAsset.assetId) throw new Error('The Sub Asset Draft must belong to the selected Main Asset.')
      subAssetId = draft?.assetId || getNextSubAssetId(mainAsset.assetId, knownIds)
      knownIds.add(subAssetId)
      const child = {
        ...(draft || {}),
        assetId: subAssetId,
        ownershipType: 'company',
        customerName: '',
        parentAssetId: mainAsset.assetId,
        sourceAssetId: source.assetId,
        name: item.workName,
        assetClass: source.assetClass,
        model: item.model || '',
        custodian: source.custodian,
        department: source.department || '',
        plant: source.plant,
        location: source.location,
        line: source.line,
        power: item.power || '',
        area: source.area,
        projectCode: proposal.projectCode || source.projectCode || '',
        projectName: proposal.projectName || source.projectName || '',
        targetSop: item.targetSop,
        acquisitionValue: total,
        workType: item.workType,
        proposalItemId: itemId,
        status: 'Proposal Processing',
        proposalNo: proposal.proposalId,
        proposalReferences: [{ reference: proposal.proposalId, projectCode: proposal.projectCode }],
        prNo: '', poNo: '', invoices: [], goodsReceipts: [],
        notes: item.description || '',
        approvalHistory: [],
      }
      if (draft) updatedAssets.push(child)
      else createdAssets.push(child)
    } else if (draft) {
      updatedAssets.push({ ...draft, status: 'Cancelled', cancellationReason: 'Proposal classified as Expense; no Sub Asset activation.', expenseProposalNo: proposal.proposalId })
    }
    events.push({
      transactionNo: `PROP-${proposal.proposalId}-${index + 1}`,
      assetId: source.assetId,
      sourceAssetId: source.assetId,
      mainAssetId: mainAsset.assetId,
      type: item.workType,
      title: item.workName,
      description: item.description,
      value: total,
      cost: total,
      costTreatment,
      workOnExistingAsset: Boolean(item.workOnExistingAsset),
      proposalId: proposal.proposalId,
      proposalItemId: itemId,
      subAssetId,
      subAsset: subAssetId ? { name: item.workName, model: item.model } : undefined,
      status: 'Pending Approval',
      occurredOn: proposal.savedAt?.slice(0, 10),
      createdAt: proposal.savedAt,
    })
    return { ...item, itemId, costTreatment, parentAssetId: mainAsset.assetId, sourceAssetId: source.assetId, assetId: subAssetId || source.assetId, assetName: subAssetId ? item.workName : source.name, subAssetId }
  })
  return { proposal: { ...proposal, assetItems }, createdAssets, updatedAssets, events }
}
