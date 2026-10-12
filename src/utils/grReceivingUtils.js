import { getAssetReferences } from './misReferenceUtils.js'
import { isCustomerAsset } from './assetOwnershipUtils.js'

export const getReceivingItemKey = (item) => String(item.itemNo || item.itemId || item.assetId)

export function isExistingAssetWork(item, asset) {
  return asset?.status === 'Active' && !isCustomerAsset(asset) && (
    item.workOnExistingAsset === true || item.assetMode === 'existing'
    || ['modification', 'maintenance'].includes(item.workType) || item.costTreatment === 'Expense'
  )
}

export function buildPOChoices(purchaseOrders, assets, goodsReceipts, vendorInvoices) {
  const assetsById = new Map(assets.map((asset) => [asset.assetId, asset]))
  const savedPOs = new Map(purchaseOrders.map((purchaseOrder) => [purchaseOrder.poNo, purchaseOrder]))
  const fallbackPOs = new Map()

  for (const asset of assets) {
    const references = getAssetReferences(asset)
    for (const reference of references.purchaseOrderReferences) {
      if (!reference.poNo || savedPOs.has(reference.poNo)) continue
      if (asset.status === 'Active' && reference.costTreatment !== 'Expense') continue
      const purchaseOrder = fallbackPOs.get(reference.poNo) || { poNo: reference.poNo, assetItems: [] }
      if (!purchaseOrder.assetItems.some((item) => item.assetId === asset.assetId)) {
        purchaseOrder.assetItems.push({ assetId: asset.assetId, assetName: asset.name, itemNo: reference.itemNo, costTreatment: reference.costTreatment })
      }
      fallbackPOs.set(reference.poNo, purchaseOrder)
    }
  }

  return [...purchaseOrders, ...fallbackPOs.values()].filter((po) => !po.status || po.status === 'Approved').map((purchaseOrder) => {
    const poNo = purchaseOrder.poNo
    const assetItems = (purchaseOrder.assetItems || []).flatMap((item) => {
      const asset = assetsById.get(item.assetId)
      if (!asset) return []
      const references = getAssetReferences(asset)
      const reference = references.purchaseOrderReferences.find((reference) => reference.poNo === poNo && (!reference.itemNo || !item.itemNo || reference.itemNo === item.itemNo))
      const receivingItem = { ...item, costTreatment: item.costTreatment || reference?.costTreatment }
      if (asset.status === 'Active' && !isExistingAssetWork(receivingItem, asset)) return []
      // Saved PO lines are the purchasing source of truth. Older Asset master
      // records may not yet contain the duplicate PO reference.
      const orderedQuantity = Number(item.orderedQuantity ?? item.quantity) || 1
      let recordedReceivedQuantity = 0
      let hasLegacyReceipt = false
      goodsReceipts.forEach((receipt) => {
        if (receipt.poNo !== poNo) return
        const receiptItems = receipt.assetItems?.filter((candidate) => candidate.assetId === item.assetId && (
          candidate.itemNo && item.itemNo ? String(candidate.itemNo) === String(item.itemNo)
          : candidate.itemId && item.itemId ? candidate.itemId === item.itemId
          : purchaseOrder.assetItems.filter((line) => line.assetId === item.assetId).length === 1
        )) || []
        for (const receiptItem of receiptItems) {
          const rawQuantity = receiptItem.receivedQuantity ?? receiptItem.quantity
          const quantity = Number(rawQuantity)
          if (rawQuantity != null && Number.isFinite(quantity) && quantity > 0) recordedReceivedQuantity += quantity
          else hasLegacyReceipt = true
        }
      })
      const receivedQuantity = recordedReceivedQuantity || (hasLegacyReceipt ? Math.min(orderedQuantity, 1) : 0)
      const cappedReceived = Math.min(orderedQuantity, receivedQuantity)
      return cappedReceived < orderedQuantity
        ? [{ ...receivingItem, asset, orderedQuantity, receivedQuantity: cappedReceived, remainingQuantity: orderedQuantity - cappedReceived }]
        : []
    })
    const invoiceReferences = [...new Set([...vendorInvoices.filter((invoice) => invoice.poNo === poNo).map((invoice) => invoice.reference), ...assetItems.flatMap(({ asset }) => (
      getAssetReferences(asset).invoiceReferences
        .filter((invoice) => invoice.reference && invoice.poNo === poNo)
        .map((invoice) => invoice.reference)
    ))])]

    return { ...purchaseOrder, assetItems, invoiceReferences }
  }).filter((purchaseOrder) => purchaseOrder.assetItems.length > 0)
}
