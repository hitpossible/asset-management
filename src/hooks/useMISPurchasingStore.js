import { remapAssetReferences } from '../utils/assetNumberUtils.js'
import { useCallback, useEffect, useState } from 'react'

const MIS_PURCHASING_STORAGE_KEY = 'tbkk-mis-purchasing-v1'

const SAMPLE_PO = {
  poNo: 'PO-2026-0097',
  status: 'Approved',
  vendor: 'Daifuku (Thailand) Ltd.',
  referenceTotal: 1_400_000,
  assetItems: [{
    assetId: 'ME-2026-0010',
    assetName: 'Transfer Conveyor',
    itemNo: '10',
    assetAmount: 1_200_000,
    costs: [
      { type: 'Installation', amount: 150_000 },
      { type: 'Transportation', amount: 50_000 },
    ],
    orderedQuantity: 1,
    unitOfMeasure: 'asset',
  }],
}

const SAMPLE_GR = {
  grNo: 'GR-0002',
  poNo: 'PO-2026-0097',
  invoiceReference: 'INV-DF-260422',
  receivedDate: '2026-09-16',
  goodsChecked: true,
  assetItems: [{ assetId: 'ME-2026-0010', assetName: 'Transfer Conveyor', itemNo: '10', receivedQuantity: 1, unitOfMeasure: 'asset' }],
  status: 'Complete',
}

function readPurchasingDocuments() {
  try {
    const saved = window.localStorage.getItem(MIS_PURCHASING_STORAGE_KEY)
    const parsed = saved ? JSON.parse(saved) : null
    const purchaseOrders = Array.isArray(parsed?.purchaseOrders) ? parsed.purchaseOrders : []
    const goodsReceipts = Array.isArray(parsed?.goodsReceipts) ? parsed.goodsReceipts : []
    return {
      vendorInvoices: Array.isArray(parsed?.vendorInvoices) ? parsed.vendorInvoices : [],
      purchaseRequisitions: Array.isArray(parsed?.purchaseRequisitions) ? parsed.purchaseRequisitions : [],
      purchaseOrders: purchaseOrders.some((item) => item.poNo === SAMPLE_PO.poNo) ? purchaseOrders : [...purchaseOrders, SAMPLE_PO],
      goodsReceipts: goodsReceipts.some((item) => item.grNo === SAMPLE_GR.grNo) ? goodsReceipts : [...goodsReceipts, SAMPLE_GR],
    }
  } catch {
    return { vendorInvoices: [], purchaseRequisitions: [], purchaseOrders: [SAMPLE_PO], goodsReceipts: [SAMPLE_GR] }
  }
}

export function useMISPurchasingStore() {
  const [documents, setDocuments] = useState(readPurchasingDocuments)
  const [storageFailed, setStorageFailed] = useState(false)
  const { purchaseRequisitions, purchaseOrders, goodsReceipts, vendorInvoices } = documents

  useEffect(() => {
    try {
      window.localStorage.setItem(MIS_PURCHASING_STORAGE_KEY, JSON.stringify(documents))
      setStorageFailed(false)
    } catch {
      setStorageFailed(true)
    }
  }, [documents])

  useEffect(() => {
    function syncDocuments(event) {
      if (event.key === MIS_PURCHASING_STORAGE_KEY) setDocuments(readPurchasingDocuments())
    }
    window.addEventListener('storage', syncDocuments)
    return () => window.removeEventListener('storage', syncDocuments)
  }, [])

  const remapAssetIds = useCallback((mapping) => {
    setDocuments((current) => remapAssetReferences(current, mapping))
  }, [])

  const addPurchaseRequisition = useCallback((requisition) => {
    setDocuments((current) => ({ ...current, purchaseRequisitions: [requisition, ...current.purchaseRequisitions] }))
  }, [])

  const setPurchaseRequisitionStatus = useCallback((prNo, status) => {
    setDocuments((current) => ({
      ...current,
      purchaseRequisitions: current.purchaseRequisitions.map((requisition) => (
        requisition.prNo === prNo ? { ...requisition, status } : requisition
      )),
    }))
  }, [])

  const addPurchaseOrder = useCallback((purchaseOrder) => {
    setDocuments((current) => ({ ...current, purchaseOrders: [purchaseOrder, ...current.purchaseOrders] }))
  }, [])

  const addGoodsReceipt = useCallback((goodsReceipt) => {
    setDocuments((current) => ({ ...current, goodsReceipts: [goodsReceipt, ...current.goodsReceipts] }))
  }, [])

  const addVendorInvoices = useCallback((invoices) => {
    setDocuments((current) => ({ ...current, vendorInvoices: [...current.vendorInvoices, ...invoices] }))
  }, [])

  const approvePurchaseOrder = useCallback((poNo) => {
    setDocuments((current) => ({ ...current, purchaseOrders: current.purchaseOrders.map((po) => po.poNo === poNo && ['Created', 'Pending Approval'].includes(po.status) ? { ...po, status: 'Approved', approvedAt: new Date().toISOString() } : po) }))
  }, [])

  return { storageFailed, remapAssetIds, vendorInvoices, addVendorInvoices, approvePurchaseOrder, purchaseRequisitions, purchaseOrders, goodsReceipts, addPurchaseRequisition, setPurchaseRequisitionStatus, addPurchaseOrder, addGoodsReceipt }
}
