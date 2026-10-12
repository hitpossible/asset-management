import { isCustomerAsset } from './assetOwnershipUtils.js'
import { getAssetReferences } from './misReferenceUtils.js'

function finiteAmount(value) {
  if (value === undefined || value === null || value === '') return null
  const amount = Number(value)
  return Number.isFinite(amount) && amount >= 0 ? amount : null
}

function getPurchaseOrderLineAmount(item) {
  const baseAmount = [item.referenceAmount, item.assetAmount, item.amount]
    .map(finiteAmount)
    .find((amount) => amount !== null)
  let hasCostAmount = false
  const costs = (item.costs || []).reduce((total, cost) => {
    const amount = finiteAmount(cost.amount)
    if (amount === null) return total
    hasCostAmount = true
    return total + amount
  }, 0)

  if (baseAmount === undefined && !hasCostAmount) return null

  const rawQuantity = finiteAmount(item.orderedQuantity ?? item.quantity)
  const quantity = rawQuantity > 0 ? rawQuantity : 1
  return ((baseAmount ?? 0) + costs) * quantity
}

function getLinkedPurchaseOrderLines(asset, purchaseOrders) {
  const references = getAssetReferences(asset).purchaseOrderReferences
  const matches = []
  const seen = new Set()

  function matchingLines(purchaseOrder, reference) {
    return (purchaseOrder.assetItems || []).map((item, index) => ({ item, index })).filter(({ item }) => {
      const matchesAsset = item.assetId === asset.assetId
      const matchesItem = reference?.itemNo && String(item.itemNo || '') === String(reference.itemNo)
      const isLinked = reference
        ? reference.itemNo
          ? matchesItem && (!item.assetId || matchesAsset)
          : matchesAsset
        : matchesAsset
      return isLinked
    })
  }

  function addLines(purchaseOrder, lines) {
    lines.forEach(({ item, index }) => {
      if (item.costTreatment === 'Expense') return
      const itemKey = `${purchaseOrder.poNo}:${item.itemNo || index}`
      if (seen.has(itemKey)) return
      seen.add(itemKey)
      matches.push(item)
    })
  }

  if (references.length) {
    let referencesResolved = true
    references.forEach((reference) => {
      const purchaseOrder = purchaseOrders.find((item) => item.poNo === reference.poNo)
      if (!purchaseOrder) {
        referencesResolved = false
        return
      }
      const linkedLines = matchingLines(purchaseOrder, reference)
      if (!linkedLines.length) referencesResolved = false
      addLines(purchaseOrder, linkedLines)
    })
    return { lines: matches, referencesResolved }
  } else {
    purchaseOrders.forEach((purchaseOrder) => addLines(purchaseOrder, matchingLines(purchaseOrder)))
  }

  return { lines: matches, referencesResolved: true }
}

function getAssetType(asset, assetTypes) {
  const normalizedClass = String(asset.assetClass || '').trim().toLowerCase()
  return assetTypes.find((type) => type.id === asset.assetTypeId)
    || assetTypes.find((type) => String(type.name || '').trim().toLowerCase() === normalizedClass)
    || assetTypes.find((type) => String(type.code || '').trim().toLowerCase() === normalizedClass)
    || null
}

export function getAssetDepreciationData(asset, assetTypes = [], purchaseOrders = []) {
  if (isCustomerAsset(asset)) return {
    applicable: false, assetType: null, usefulLifeYears: null, assetValue: null, valueSource: '',
    annualRatePercent: null, monthlyDepreciation: null, depreciationPeriods: null,
    totalDepreciationPeriods: null, accumulatedDepreciation: null, netBookValue: null,
  }
  if (asset.status === 'Sold' && asset.disposalRecord?.financialSnapshot) return {
    ...asset.disposalRecord.financialSnapshot,
    assetType: getAssetType(asset, assetTypes),
    stopped: true,
  }
  const assetType = getAssetType(asset, assetTypes)
  const usefulLifeYears = finiteAmount(assetType?.usefulLifeYears)
  const directValue = [asset.acquisitionValue, asset.assetValue]
    .map(finiteAmount)
    .find((amount) => amount !== null) ?? null
  const linkedPOData = getLinkedPurchaseOrderLines(asset, purchaseOrders)
  const lineAmounts = linkedPOData.lines.map(getPurchaseOrderLineAmount)
  const hasCompletePOValue = linkedPOData.referencesResolved
    && lineAmounts.length > 0
    && lineAmounts.every((amount) => amount !== null)
  const assetValue = directValue ?? (hasCompletePOValue ? lineAmounts.reduce((total, amount) => total + amount, 0) : null)
  const balance = calculateDepreciationBalance({
    assetValue,
    usefulLifeYears,
    startDate: asset.depreciationStartDate,
  })

  return {
    assetType,
    usefulLifeYears: usefulLifeYears > 0 ? usefulLifeYears : null,
    assetValue,
    valueSource: directValue !== null ? 'Asset record' : hasCompletePOValue ? 'Linked PO / PO item amount + costs' : '',
    annualRatePercent: usefulLifeYears > 0 ? 100 / usefulLifeYears : null,
    ...balance,
  }
}

export function calculateDepreciationBalance({ assetValue, usefulLifeYears, startDate, asOfDate = new Date() }) {
  const validValue = finiteAmount(assetValue)
  const validUsefulLife = finiteAmount(usefulLifeYears)
  const monthlyDepreciation = validValue !== null && validUsefulLife > 0
    ? validValue / validUsefulLife / 12
    : null
  const totalDepreciationPeriods = validUsefulLife > 0 ? Math.ceil(validUsefulLife * 12) : null

  if (monthlyDepreciation === null || !startDate) {
    return {
      monthlyDepreciation,
      depreciationPeriods: null,
      totalDepreciationPeriods,
      accumulatedDepreciation: null,
      netBookValue: null,
    }
  }

  const start = new Date(`${String(startDate).slice(0, 10)}T00:00:00`)
  const today = new Date(asOfDate.getFullYear(), asOfDate.getMonth(), asOfDate.getDate())
  if (Number.isNaN(start.getTime())) {
    return {
      monthlyDepreciation,
      depreciationPeriods: null,
      totalDepreciationPeriods,
      accumulatedDepreciation: null,
      netBookValue: null,
    }
  }

  const periodsBeforeCap = start > today
    ? 0
    : Math.max(0, (today.getFullYear() - start.getFullYear()) * 12 + today.getMonth() - start.getMonth() + 1)
  const depreciationPeriods = Math.min(periodsBeforeCap, totalDepreciationPeriods)
  const accumulatedDepreciation = Math.min(validValue, monthlyDepreciation * depreciationPeriods)

  return {
    monthlyDepreciation,
    depreciationPeriods,
    totalDepreciationPeriods,
    accumulatedDepreciation,
    netBookValue: Math.max(0, validValue - accumulatedDepreciation),
  }
}
