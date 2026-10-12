function normalizeReferences(references, fallback = []) {
  if (Array.isArray(references) && references.length) {
    return references.map((item) => typeof item === 'string' ? { reference: item } : item)
  }
  return fallback.map((item) => typeof item === 'string' ? { reference: item } : item)
}

export function getAssetReferences(asset) {
  const proposalReferences = normalizeReferences(asset.proposalReferences, asset.proposalNo ? [asset.proposalNo] : [])
  const purchaseRequisitionReferences = normalizeReferences(asset.purchaseRequisitionReferences, asset.prNo ? [asset.prNo] : [])
  const purchaseOrderReferences = normalizeReferences(
    asset.purchaseOrderReferences,
    asset.poNo ? [{ poNo: asset.poNo, itemNo: '' }] : [],
  ).map((item) => ({ ...item, poNo: item.poNo || item.reference, itemNo: item.itemNo || '' }))
  const invoiceReferences = normalizeReferences(
    asset.invoiceReferences,
    asset.invoices || [],
  ).map((item) => ({ ...item, reference: item.reference, poNo: item.poNo || asset.poNo || '' }))
  const goodsReceiptReferences = normalizeReferences(
    asset.goodsReceiptReferences,
    asset.goodsReceipts || [],
  ).map((item) => ({ ...item, reference: item.reference, poNo: item.poNo || asset.poNo || '' }))

  return {
    proposalReferences,
    purchaseRequisitionReferences,
    purchaseOrderReferences,
    invoiceReferences,
    goodsReceiptReferences,
  }
}

export function createMISReference(assets, documentType) {
  const year = new Date().getFullYear()
  const prefixes = { proposal: 'PROP', pr: 'PR', po: 'PO', gr: 'GR' }
  const prefix = prefixes[documentType]
  const pattern = documentType === 'gr'
    ? /^GR-(\d+)$/
    : new RegExp(`^${prefix}-${year}-(\\d+)$`)
  let highestNumber = 0

  for (const asset of assets) {
    const refs = getAssetReferences(asset)
    const references = documentType === 'proposal'
      ? refs.proposalReferences.map((item) => item.reference)
      : documentType === 'pr'
        ? refs.purchaseRequisitionReferences.map((item) => item.reference)
        : documentType === 'po'
          ? refs.purchaseOrderReferences.map((item) => item.poNo)
          : refs.goodsReceiptReferences.map((item) => item.reference)
    for (const reference of references) {
      const match = String(reference || '').match(pattern)
      if (match) highestNumber = Math.max(highestNumber, Number(match[1]) || 0)
    }
  }

  const nextNumber = String(highestNumber + 1).padStart(4, '0')
  return documentType === 'gr' ? `GR-${nextNumber}` : `${prefix}-${year}-${nextNumber}`
}

// Register the Invoice in the same save as its GR, before receiving validation.
export function linkGoodsReceiptPO(asset, receipt, purchaseOrders) {
  const po = purchaseOrders.find((order) => order.poNo === receipt.poNo && order.status === 'Approved')
  if (!po) return asset
  const receivedItems = receipt.assetItems.filter((item) => item.assetId === asset.assetId)
  const references = getAssetReferences(asset)
  const added = []
  for (const item of receivedItems) {
    const line = po.assetItems.find((candidate) => candidate.assetId === asset.assetId && (
      item.itemNo ? String(candidate.itemNo) === String(item.itemNo)
      : item.itemId ? candidate.itemId === item.itemId : true
    ))
    if (!line || references.purchaseOrderReferences.some((reference) => reference.poNo === po.poNo && (!reference.itemNo || String(reference.itemNo) === String(line.itemNo)))) continue
    added.push({ poNo: po.poNo, itemNo: line.itemNo || '', costTreatment: line.costTreatment })
  }
  return added.length ? { ...asset, purchaseOrderReferences: [...references.purchaseOrderReferences, ...added] } : asset
}

// Register the Invoice in the same save as its GR, before receiving validation.
export function linkGoodsReceiptInvoice(asset, receipt) {
  if (!receipt.invoiceReference || !receipt.assetItems.some((item) => item.assetId === asset.assetId)) return asset
  const references = getAssetReferences(asset)
  if (!references.purchaseOrderReferences.some((item) => item.poNo === receipt.poNo)) return asset
  const existing = references.invoiceReferences.some((item) => item.reference === receipt.invoiceReference && item.poNo === receipt.poNo)
  return {
    ...asset,
    invoices: [...new Set([...(asset.invoices || []), receipt.invoiceReference])],
    invoiceReferences: existing ? references.invoiceReferences : [...references.invoiceReferences, {
      reference: receipt.invoiceReference,
      poNo: receipt.poNo,
      amount: receipt.invoiceAmount ?? null,
    }],
  }
}
