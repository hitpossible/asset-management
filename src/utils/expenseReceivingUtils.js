import { getAssetReferences } from './misReferenceUtils.js'

// Expense receiving uses document references and acceptance, never Invoice amounts.
export function getExpenseReceivingUpdate(event, receipt, assets, purchaseOrders, previousReceipts = []) {
  if ((event.costTreatment !== 'Expense' && !(event.workOnExistingAsset && event.costTreatment === 'Capitalized')) || event.subAssetId) return null
  const order = purchaseOrders.find((item) => item.poNo === receipt.poNo)
  const orderItem = order?.assetItems.find((item) => item.assetId === event.assetId && item.itemId === event.proposalItemId)
  const receivedItem = receipt.assetItems.find((item) => item.assetId === event.assetId && (!orderItem || !item.itemNo || item.itemNo === orderItem.itemNo))
  if (event.poNo !== receipt.poNo || !receivedItem) return null

  const asset = assets.find((item) => item.assetId === event.assetId)
  const references = getAssetReferences(asset || {})
  const validPO = Boolean(orderItem && order.proposalId === event.proposalId
    && references.purchaseOrderReferences.some((item) => item.poNo === receipt.poNo))
  const validInvoice = Boolean(receipt.invoiceReference && references.invoiceReferences.some((item) => item.reference === receipt.invoiceReference && item.poNo === receipt.poNo))
  const validGR = Boolean(receipt.grNo && receipt.poNo)
  const accepted = receipt.goodsChecked === true
  const valid = validPO && validInvoice && validGR && accepted
  const receipts = [...previousReceipts.filter((item) => item.grNo !== receipt.grNo), receipt]
  const relevantReceipts = receipts.filter((item) => item.poNo === receipt.poNo && item.goodsChecked === true
    && references.invoiceReferences.some((invoice) => invoice.reference === item.invoiceReference && invoice.poNo === item.poNo)
    && item.assetItems.some((line) => line.assetId === event.assetId && (!line.itemNo || line.itemNo === orderItem?.itemNo)))
  const receivedQuantity = relevantReceipts.reduce((sum, item) => sum + item.assetItems
    .filter((line) => line.assetId === event.assetId && (!line.itemNo || line.itemNo === orderItem?.itemNo))
    .reduce((total, line) => total + (Number(line.receivedQuantity) || 0), 0), 0)
  const complete = valid && receivedQuantity >= (Number(orderItem?.orderedQuantity) || 1)
  const status = !valid ? 'Hold / Correction Required' : complete ? 'Completed' : 'GR Received'
  return {
    status,
    grNo: receipt.grNo,
    invoiceReference: receipt.invoiceReference,
    grReferences: [...new Set(relevantReceipts.map((item) => item.grNo).filter(Boolean))],
    invoiceReferences: [...new Set(relevantReceipts.map((item) => item.invoiceReference).filter(Boolean))],
    receivingChecks: { poValid: validPO, invoiceValid: validInvoice, grValid: validGR, accepted },
    receivingRemark: !valid ? 'Confirm the PO, related Invoice, GR and goods/work acceptance.' : !complete ? 'Waiting for the remaining goods or work to be received.' : '',
    completedAt: complete ? receipt.createdAt : null,
    occurredOn: complete ? receipt.receivedDate : event.occurredOn,
    acceptedBy: accepted ? 'Purchasing + Asset Owner' : '',
  }
}
