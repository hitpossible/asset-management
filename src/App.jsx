import { isCustomerAsset, normalizeAssetOwnership } from './utils/assetOwnershipUtils.js'
import { lazy, Suspense, useEffect, useMemo, useState } from 'react'
import Sidebar from './components/Sidebar.jsx'
import Toast from './components/Toast.jsx'
import WorkspaceErrorBoundary from './components/WorkspaceErrorBoundary.jsx'
import TopBar from './components/TopBar.jsx'
import LoginPage from './pages/LoginPage.jsx'
import { useAssetFilters } from './hooks/useAssetFilters.js'
import { useSubAssetRequestStore } from './hooks/useSubAssetRequestStore.js'
import { useProjectStore } from './hooks/useProjectStore.js'
import { useAssetStore } from './hooks/useAssetStore.js'
import { useAssetTypeStore } from './hooks/useAssetTypeStore.js'
import { useAdminStore } from './hooks/useAdminStore.js'
import { ADMIN_PAGES } from './data/adminData.js'
import { useMISProposalStore } from './hooks/useMISProposalStore.js'
import { useMISPurchasingStore } from './hooks/useMISPurchasingStore.js'
import { useAssetLifecycleStore } from './hooks/useAssetLifecycleStore.js'
import { downloadAssetCsv, summarizeAssets } from './utils/assetUtils.js'
import { prepareInvoiceDisposals } from './utils/disposalUtils.js'
import { getExpenseReceivingUpdate } from './utils/expenseReceivingUtils.js'
import { prepareProposalAssets } from './utils/proposalAssetUtils.js'
import { createSubAssetDraft, getNextSubAssetId, migrateSubAssetRequests } from './utils/subAssetDraftUtils.js'
import { createMISReference, getAssetReferences, linkGoodsReceiptInvoice, linkGoodsReceiptPO } from './utils/misReferenceUtils.js'

const ReportPage = lazy(() => import('./pages/ReportPage.jsx'))
const DisposalPage = lazy(() => import('./pages/DisposalPage.jsx'))
const AssetListPage = lazy(() => import('./pages/AssetListPage.jsx'))
const ProjectListPage = lazy(() => import('./pages/ProjectListPage.jsx'))
const CreateProjectPage = lazy(() => import('./pages/CreateProjectPage.jsx'))
const CreateSubAssetPage = lazy(() => import('./pages/CreateSubAssetPage.jsx'))
const CreateAssetPage = lazy(() => import('./pages/CreateAssetPage.jsx'))
const DashboardPage = lazy(() => import('./pages/DashboardPage.jsx'))
const AdministratorPage = lazy(() => import('./pages/AdministratorPage.jsx'))
const ManageAssetMasterPage = lazy(() => import('./pages/ManageAssetMasterPage.jsx'))
const MISCreateProposalPage = lazy(() => import('./pages/MISCreateProposalPage.jsx'))
const MISProposalListPage = lazy(() => import('./pages/MISProposalListPage.jsx'))
const MISPRListPage = lazy(() => import('./pages/MISPRListPage.jsx'))
const MISCreatePRPage = lazy(() => import('./pages/MISCreatePRPage.jsx'))
const MISPOListPage = lazy(() => import('./pages/MISPOListPage.jsx'))
const MISCreatePOPage = lazy(() => import('./pages/MISCreatePOPage.jsx'))
const MISCreateGRPage = lazy(() => import('./pages/MISCreateGRPage.jsx'))
const AssetValidationPage = lazy(() => import('./pages/AssetValidationPage.jsx'))
const AssetApprovalPage = lazy(() => import('./pages/AssetApprovalPage.jsx'))
const AssetMovementPage = lazy(() => import('./pages/AssetMovementPage.jsx'))
const AssetMovementListPage = lazy(() => import('./pages/AssetMovementListPage.jsx'))

function WorkspaceApp({ onSignOut }) {
  const { projects, addProject } = useProjectStore()
  const { data: adminData, save: saveAdminData } = useAdminStore()
  const { assets, addDraft, updateDraft, renameAssetClass, updateAssets, addAssets } = useAssetStore()
  const { assetTypes, addAssetType, updateAssetType, setAssetTypeActive } = useAssetTypeStore()
  const { proposals, addProposal, setProposalStatus } = useMISProposalStore()
  const { purchaseRequisitions, purchaseOrders, goodsReceipts, vendorInvoices, addPurchaseRequisition, setPurchaseRequisitionStatus, addPurchaseOrder, addGoodsReceipt, approvePurchaseOrder } = useMISPurchasingStore()
  const { lifecycleEvents, addLifecycleEvent, addLifecycleEvents, updateLifecycleEvent, addProposalEvents } = useAssetLifecycleStore(assets)
  const [page, setPage] = useState('dashboard')
  const [approvalTab, setApprovalTab] = useState('asset')
  const [menuOpen, setMenuOpen] = useState(false)
  const [notice, setNotice] = useState('')
  const { requests: subAssetRequests, removeRequests: removeSubAssetRequests } = useSubAssetRequestStore()
  const [subAssetParent, setSubAssetParent] = useState(null)
  const [proposalWorkRequest, setProposalWorkRequest] = useState(null)
  const [editingAsset, setEditingAsset] = useState(null)
  const [selectedPRNo, setSelectedPRNo] = useState('')
  const [movementAssetId, setMovementAssetId] = useState('')
  const { filters, options, filteredAssets, hasActiveFilters, updateFilter, clearFilters } = useAssetFilters(assets)
  const summary = useMemo(() => summarizeAssets(assets), [assets])

  useEffect(() => {
    const { records, migratedIds } = migrateSubAssetRequests(subAssetRequests, assets)
    if (records.length) addAssets(records)
    if (migratedIds.length) removeSubAssetRequests(migratedIds)
  }, [subAssetRequests, assets, addAssets, removeSubAssetRequests])

  useEffect(() => {
    if (!notice) return undefined
    const timer = window.setTimeout(() => setNotice(''), 3600)
    return () => window.clearTimeout(timer)
  }, [notice])

  function navigate(nextPage) {
    setPage(nextPage)
    if (nextPage !== 'mis-proposal') setProposalWorkRequest(null)
    if (nextPage !== 'movement') setMovementAssetId('')
    if (nextPage === 'approval') setApprovalTab('asset')
    setMenuOpen(false)
    if (nextPage === 'create') setEditingAsset(null)
    if (nextPage !== 'assets') clearFilters()
  }

  function openAssetTransfer(assetId) {
    if (isCustomerAsset(assets.find((asset) => asset.assetId === assetId))) return
    setMovementAssetId(assetId)
    navigate('movement')
  }

  function openCreateSubAsset(asset) {
    if (asset.status !== 'Active' || isCustomerAsset(asset) || asset.parentAssetId) return
    setSubAssetParent(asset)
    navigate('create-sub-asset')
  }

  function saveSubAssetDraft(request, openProposal = false) {
    const saved = createSubAssetDraft(request, assets)
    addAssets([saved])
    if (request.requestId) removeSubAssetRequests([request.requestId])
    clearFilters()
    if (openProposal) {
      setProposalWorkRequest({ ...saved, amount: saved.estimatedAmount })
      navigate('mis-proposal')
    } else {
      setNotice(`${saved.assetId} · ${saved.name} was saved as a draft Sub Asset.`)
      navigate('assets')
    }
  }

  function openDraftForEdit(asset) {
    setEditingAsset(asset)
    setPage('create')
    setMenuOpen(false)
  }

  function saveDraft(formData) {
    formData = normalizeAssetOwnership(formData)
    if (editingAsset) {
      updateDraft(editingAsset.assetId, formData)
      setNotice(`${formData.name} draft was updated.`)
    } else {
      addDraft(formData)
      setNotice(`${formData.name} was saved as a draft asset.`)
    }
    setEditingAsset(null)
    clearFilters()
    navigate('assets')
  }

  function saveProject(project) {
    addProject(project)
    setNotice(`${project.projectCode} was saved.`)
    navigate('projects')
  }

  function handleExport() {
    downloadAssetCsv(filteredAssets)
    setNotice('Asset list exported as CSV.')
  }

  function saveMISProposal(inputProposal) {
    const { proposal, createdAssets, updatedAssets, events } = prepareProposalAssets(inputProposal, assets)
    addProposal(proposal)
    removeSubAssetRequests(proposal.assetItems.map((item) => item.requestId).filter(Boolean))
    addAssets(createdAssets)
    addProposalEvents(events)
    const preparedById = new Map(updatedAssets.map((asset) => [asset.assetId, asset]))
    const selectedAssets = [...proposal.assetItems.map((item) => item.assetId), ...preparedById.keys()]
    updateAssets(selectedAssets, (asset) => {
      asset = preparedById.get(asset.assetId) || asset
      if (asset.status === 'Cancelled') return asset
      const references = getAssetReferences(asset)
      return {
        ...asset,
        proposalNo: proposal.proposalId,
        proposalReferences: references.proposalReferences.some((ref) => ref.reference === proposal.proposalId) ? references.proposalReferences : [...references.proposalReferences, { reference: proposal.proposalId, projectCode: proposal.projectCode }],
        status: asset.status === 'Active' ? 'Active' : 'Proposal Processing',
      }
    })
    setNotice(`${proposal.proposalId} was saved in the MIS simulation.`)
    navigate('mis-proposals')
  }

  function saveMISPurchaseRequisition(requisition) {
    addPurchaseRequisition(requisition)
    const itemNumbers = new Map(requisition.assetItems.map((item, index) => [item.assetId, String((index + 1) * 10)]))
    updateAssets(requisition.assetItems.map((item) => item.assetId), (asset) => {
      const references = getAssetReferences(asset)
      return {
        ...asset,
        prNo: requisition.prNo,
        purchaseRequisitionReferences: [...references.purchaseRequisitionReferences, { reference: requisition.prNo, itemNo: itemNumbers.get(asset.assetId) }],
        status: asset.status === 'Active' ? 'Active' : 'Purchasing',
      }
    })
    for (const item of requisition.assetItems) {
      const event = lifecycleEvents.find((event) => event.proposalId === requisition.proposalId && event.proposalItemId === item.itemId)
      if (event) updateLifecycleEvent(event.transactionNo, { status: 'Purchasing', prNo: requisition.prNo })
    }
    setNotice(`${requisition.prNo} was saved in the MIS simulation.`)
    navigate('mis-prs')
  }

  function approveMISPurchaseRequisition(prNo) {
    setPurchaseRequisitionStatus(prNo, 'Approved')
    setNotice(`${prNo} was approved in the MIS simulation.`)
  }

  function openMISCreatePO(prNo) {
    setSelectedPRNo(prNo)
    navigate('mis-create-po')
  }

  function approveMISPurchaseOrder(poNo) {
    approvePurchaseOrder(poNo)
    setNotice(`${poNo} approved in MIS. Vendor Delivery is ready.`)
  }

  function saveMISPurchaseOrder(purchaseOrder) {
    addPurchaseOrder(purchaseOrder)
    const itemNumbers = new Map(purchaseOrder.assetItems.map((item) => [item.assetId, item.itemNo]))
    updateAssets(purchaseOrder.assetItems.map((item) => item.assetId), (asset) => {
      const references = getAssetReferences(asset)
      return {
        ...asset,
        poNo: purchaseOrder.poNo,
        purchaseOrderReferences: [...references.purchaseOrderReferences, { poNo: purchaseOrder.poNo, itemNo: itemNumbers.get(asset.assetId), costTreatment: purchaseOrder.assetItems.find((item) => item.assetId === asset.assetId)?.costTreatment }],
        status: asset.status === 'Active' ? 'Active' : 'Waiting Delivery',
      }
    })
    for (const item of purchaseOrder.assetItems) {
      const event = lifecycleEvents.find((event) => event.proposalId === purchaseOrder.proposalId && event.proposalItemId === item.itemId)
      if (event) updateLifecycleEvent(event.transactionNo, { status: 'Waiting Delivery', poNo: purchaseOrder.poNo })
    }
    setNotice(`${purchaseOrder.poNo} was saved in the MIS simulation.`)
  }

  function saveMISGoodsReceipt(goodsReceipt) {
    const assetsWithInvoice = assets.map((asset) => linkGoodsReceiptInvoice(linkGoodsReceiptPO(asset, goodsReceipt, purchaseOrders), goodsReceipt))
    const expenseUpdates = lifecycleEvents.flatMap((event) => {
      const changes = getExpenseReceivingUpdate(event, goodsReceipt, assetsWithInvoice, purchaseOrders, goodsReceipts)
      return changes ? [{ event, changes }] : []
    })
    addGoodsReceipt(goodsReceipt)
    const itemNumbers = new Map(goodsReceipt.assetItems.map((item) => [item.assetId, item.itemNo]))
    updateAssets(goodsReceipt.assetItems.map((item) => item.assetId), (currentAsset) => {
      const asset = linkGoodsReceiptInvoice(linkGoodsReceiptPO(currentAsset, goodsReceipt, purchaseOrders), goodsReceipt)
      const references = getAssetReferences(asset)
      const completeStatuses = ['Asset Validation', 'Ready for Verification', 'Verification In Progress', 'Pending Asset Team Leader Approval', 'Pending Accounting Review', 'Pending Accounting Approval']
      const receivingValidations = [...(asset.receivingValidations || [])]

      if (completeStatuses.includes(asset.status) && receivingValidations.length === 0) {
        const previousPONos = [...new Set(references.purchaseOrderReferences.map((item) => item.poNo).filter(Boolean))]
        for (const poNo of previousPONos) {
          const hasInvoice = references.invoiceReferences.some((item) => item.poNo === poNo)
          const hasGR = references.goodsReceiptReferences.some((item) => item.poNo === poNo)
          if (hasInvoice && hasGR) receivingValidations.push({ poNo, status: 'Complete', legacy: true })
        }
      }

      const nextValidations = receivingValidations.filter((item) => item.poNo !== goodsReceipt.poNo)
      nextValidations.push({
        poNo: goodsReceipt.poNo,
        status: expenseUpdates.find((item) => item.event.assetId === asset.assetId)?.changes.status === 'Completed' ? 'Complete' : 'Pending',
        stage: asset.status === 'Active' ? 'Work Receiving' : 'Receiving',
        grNo: goodsReceipt.grNo,
        invoiceReference: goodsReceipt.invoiceReference,
        createdAt: goodsReceipt.createdAt,
      })

      return {
        ...asset,
        goodsReceipts: [...new Set([...(asset.goodsReceipts || []), goodsReceipt.grNo])],
        goodsReceiptReferences: [...references.goodsReceiptReferences, {
          reference: goodsReceipt.grNo,
          poNo: goodsReceipt.poNo,
          invoiceReference: goodsReceipt.invoiceReference,
          itemNo: itemNumbers.get(asset.assetId) || '',
          receivedQuantity: goodsReceipt.assetItems.find((item) => item.assetId === asset.assetId)?.receivedQuantity,
          unitOfMeasure: goodsReceipt.assetItems.find((item) => item.assetId === asset.assetId)?.unitOfMeasure || 'asset',
          goodsChecked: goodsReceipt.goodsChecked,
        }],
        receivingValidations: nextValidations,
        status: asset.status === 'Active' ? asset.status : 'Asset Validation',
      }
    })
    for (const { event, changes } of expenseUpdates) {
      updateLifecycleEvent(event.transactionNo, changes)
    }
    for (const event of lifecycleEvents.filter((event) => event.poNo === goodsReceipt.poNo && event.subAssetId)) {
      if (goodsReceipt.assetItems.some((item) => item.assetId === event.subAssetId)) {
        updateLifecycleEvent(event.transactionNo, { status: 'Asset Validation', grNo: goodsReceipt.grNo })
      }
    }
    const completedCount = expenseUpdates.filter((item) => item.changes.status === 'Completed').length
    setNotice(`${goodsReceipt.grNo} was saved in the MIS simulation.${completedCount ? ` ${completedCount} work item(s) completed.` : ''}`)
  }

  function completeAssetValidation(record) {
    const currentAsset = assets.find((asset) => asset.assetId === record.assetId)
    const references = getAssetReferences(currentAsset || record.asset)
    const linkedPONos = [...new Set(references.purchaseOrderReferences.map((item) => item.poNo).filter(Boolean))]
    const existingValidations = currentAsset?.receivingValidations || []
    const completedValidation = {
      poNo: record.poNo,
      invoiceReferences: record.invoiceReferences,
      goodsReceiptReferences: record.goodsReceiptReferences,
      stage: 'Asset Team Verification',
      status: 'Complete',
      validatedAt: new Date().toISOString(),
    }
    const allPurchaseOrdersValidated = linkedPONos.length > 0 && linkedPONos.every((poNo) => (
      poNo === record.poNo
        || existingValidations.some((item) => item.poNo === poNo && item.status === 'Complete' && item.stage === 'Asset Team Verification')
    ))

    updateAssets([record.assetId], (asset) => {
      const currentValidations = (asset.receivingValidations || []).filter((item) => item.poNo !== record.poNo)
      const receivingValidations = [...currentValidations, completedValidation]

      return {
        ...asset,
        receivingValidations,
        assetControlSheet: record.assetControlSheet,
        validationDraft: null,
        approvalHistory: [...(Array.isArray(asset.approvalHistory) ? asset.approvalHistory : []), { stage: 'Asset Team Verification', action: 'Asset Validation completed', actor: 'Asset Team', date: completedValidation.validatedAt }],
        status: asset.status === 'Active' ? asset.status : allPurchaseOrdersValidated ? 'Pending Asset Team Leader Approval' : 'Asset Validation',
      }
    })
    for (const event of lifecycleEvents.filter((event) => event.subAssetId === record.assetId)) {
      updateLifecycleEvent(event.transactionNo, { status: allPurchaseOrdersValidated ? 'Pending Asset Team Leader Approval' : 'Asset Validation' })
    }
    if (allPurchaseOrdersValidated) {
      setNotice(`${record.assetId} was submitted to the Asset Team Leader.`)
      navigate('approval')
    } else {
      setNotice(`Verification for ${record.poNo} is saved. Complete the remaining linked POs before Asset approval.`)
    }
  }

  function approveAsset({ assetId, stageId, depreciationStartDate, comment }) {
    const stageNames = {
      'asset-leader': 'Asset Team Leader',
      'accounting-review': 'Accounting Review',
      'accounting-final': 'Accounting Final Approval',
    }
    const stage = stageNames[stageId]
    const action = stageId === 'accounting-final' ? 'Approved and activated' : 'Approved'
    const date = new Date().toISOString()
    const nextStatus = stageId === 'asset-leader'
      ? 'Pending Accounting Review'
      : stageId === 'accounting-review' ? 'Pending Accounting Approval' : 'Active'

    updateAssets([assetId], (asset) => ({
      ...asset,
      ...(isCustomerAsset(asset) ? { depreciationStartDate: '', depreciationProfile: {} } : stageId === 'accounting-review' ? { depreciationStartDate } : {}),
      ...(stageId === 'accounting-final' ? { activatedAt: date } : {}),
      status: nextStatus,
      approvalHistory: [...(Array.isArray(asset.approvalHistory) ? asset.approvalHistory : []), { stage, action, actor: stageId === 'asset-leader' ? 'Asset Team Leader' : 'Accounting', comment, date }],
    }))
    for (const event of lifecycleEvents.filter((event) => event.subAssetId === assetId)) {
      updateLifecycleEvent(event.transactionNo, { status: stageId === 'accounting-final' ? 'Completed' : nextStatus, ...(stageId === 'accounting-final' ? { completedAt: date } : {}) })
    }
    setNotice(stageId === 'accounting-final'  ? `${assetId} is approved and now Active.` : `${assetId} was approved by ${stage}.`)
  }

  function returnAssetForCorrection({ assetId, stageId, comment }) {
    const stageNames = {
      'asset-leader': 'Asset Team Leader',
      'accounting-review': 'Accounting Review',
      'accounting-final': 'Accounting Final Approval',
    }
    const date = new Date().toISOString()
    updateAssets([assetId], (asset) => ({
      ...asset,
      status: 'Returned for Correction',
      correctionComment: comment,
      correctionStage: stageNames[stageId],
      receivingValidations: (asset.receivingValidations || []).map((item) => ({ ...item, status: 'Correction Required' })),
      approvalHistory: [...(Array.isArray(asset.approvalHistory) ? asset.approvalHistory : []), { stage: stageNames[stageId], action: 'Returned for Correction', actor: stageId === 'asset-leader' ? 'Asset Team Leader' : 'Accounting', comment, date }],
    }))
    for (const event of lifecycleEvents.filter((event) => event.subAssetId === assetId)) {
      updateLifecycleEvent(event.transactionNo, { status: 'Returned for Correction', remark: comment })
    }
    setNotice(`${assetId} was returned to Asset Validation for correction.`)
  }

  function handleProposalStatus(proposalId, status) {
    setProposalStatus(proposalId, status)
    for (const event of lifecycleEvents.filter((event) => event.proposalId === proposalId)) {
      updateLifecycleEvent(event.transactionNo, { status })
    }
    setNotice(`${proposalId} was approved in the MIS simulation.`)
  }

  function saveDepreciationDetails({ assetId, acquisitionValue, depreciationStartDate, depreciationProfile }) {
    const target = assets.find((asset) => asset.assetId === assetId)
    if (!target || target.status === 'Sold' || isCustomerAsset(target)) return
    updateAssets([assetId], (asset) => ({
      ...asset,
      ...(acquisitionValue !== undefined ? { acquisitionValue } : {}),
      depreciationStartDate,
      depreciationProfile: { ...(asset.depreciationProfile || {}), ...depreciationProfile },
    }))
    setNotice(`${assetId} DP details were saved.`)
  }

  function saveLifecycleEvent(event) {
    if (assets.find((asset) => asset.assetId === event.assetId)?.status !== 'Active') throw new Error('Lifecycle actions require an Active Asset.')
    const record = addLifecycleEvent(event)
    setNotice(`${record.transactionNo} was saved to the Asset lifecycle.`)
    return record
  }

  function derecognizeAssets(form) {
    const preparedRecords = prepareInvoiceDisposals(form, assets, assetTypes, purchaseOrders)
    const completedAt = new Date().toISOString()
    const batchId = `${form.invoice.taxInvoiceNo}-${Date.now()}`
    const records = addLifecycleEvents(preparedRecords.map((prepared) => {
      const asset = assets.find((item) => item.assetId === prepared.assetId)
      return { ...prepared, mainAssetId: asset.parentAssetId || asset.assetId, type: 'disposal', title: `Sale · ${asset.name}`, occurredOn: prepared.soldOn, status: 'Completed', completedAt, disposalBatchId: batchId }
    }))
    const recordByAssetId = new Map(records.map((record) => [record.assetId, record]))
    updateAssets([...recordByAssetId.keys()], (current) => {
      const record = recordByAssetId.get(current.assetId)
      return { ...current, status: 'Sold', derecognizedOn: record.soldOn, depreciationStopDate: record.depreciationStopDate, disposalRecord: record }
    })
    setNotice(`${records.length} Asset${records.length === 1 ? '' : 's'} Sold. Depreciation stopped and Disposal history retained.`)
    return records
  }

  function advanceTransferApproval(event) {
    const target = assets.find((asset) => asset.assetId === event.assetId)
    if (!target || target.status !== 'Active' || isCustomerAsset(target)) return
    const currentStep = Number(event.currentApprovalStep) || 0
    const approvalSteps = event.approvalSteps || []
    const currentStage = approvalSteps[currentStep]
    if (!currentStage) return

    const date = new Date().toISOString()
    const isFinalStep = currentStep >= approvalSteps.length - 1
    const approvalHistory = [...(event.approvalHistory || []), {
      stage: currentStage,
      action: isFinalStep ? 'Acknowledged and completed' : 'Approved',
      actor: currentStage === 'Asset Team Acknowledgement' ? 'Asset Team' : currentStage.replace(' Approval', ''),
      date,
    }]

    if (isFinalStep) {
      updateLifecycleEvent(event.transactionNo, { status: 'Completed', approvalHistory, completedAt: date })
      updateAssets([event.assetId], (asset) => ({
        ...asset,
        department: event.to?.department || asset.department || '',
        custodian: event.to?.custodian || asset.custodian || '',
        plant: event.to?.plant || asset.plant || '—',
        location: event.to?.location || asset.location || '—',
        line: event.to?.line || asset.line || '—',
        transferHistory: [...(Array.isArray(asset.transferHistory) ? asset.transferHistory : []), {
          transactionNo: event.transactionNo,
          date,
          from: event.from,
          to: event.to,
        }],
      }))
      setNotice(`${event.assetId} transfer ${event.transactionNo} is complete.`)
      return
    }

    updateLifecycleEvent(event.transactionNo, { currentApprovalStep: currentStep + 1, approvalHistory })
    setNotice(`${currentStage} is complete. Next: ${approvalSteps[currentStep + 1]}.`)
  }

  const pageTitle = ({ disposal: 'Disposal / Sale', reports: 'Report', 'create-sub-asset': 'Create Sub Asset', projects: 'Project List', 'create-project': 'Create Project' })[page] || ADMIN_PAGES[page] || (page === 'dashboard' ? 'Dashboard' : page === 'create' ? (editingAsset ? 'Edit draft' : 'Create asset') : page === 'assets' ? 'Asset list' : page === 'movement' ? 'Movement asset' : page === 'movements' ? 'Assets in movement' : page === 'mis-proposal' ? 'Create Proposal' : page === 'mis-proposals' ? 'Proposal list' : page === 'mis-prs' ? 'PR list' : page === 'mis-create-pr' ? 'Create PR' : page === 'mis-pos' ? 'PO list' : page === 'mis-create-po' ? 'Create PO' : page === 'mis-create-gr' ? 'Create GR' : page === 'asset-validation' ? 'Asset Validation' : page === 'approval' ? 'Approval' : 'Manage Asset Type')
  const sectionTitle = page === 'reports' ? 'Report' : ['projects', 'create-project'].includes(page) ? 'Project Management' : (page === 'master' || ADMIN_PAGES[page]) ? 'Administrator' : page === 'approval' ? 'Approval' : ['mis-proposal', 'mis-proposals', 'mis-prs', 'mis-create-pr', 'mis-pos', 'mis-create-po', 'mis-create-gr'].includes(page) ? 'MIS' : 'Asset management'
  const assetClassOptions = assetTypes.filter((type) => type.active).map((type) => type.name)
  const pageContent = (
    <Suspense fallback={<div className="page-loading" role="status">Loading page...</div>}>
      {page === 'disposal'
        ? <DisposalPage assets={assets} assetTypes={assetTypes} purchaseOrders={purchaseOrders} onSave={derecognizeAssets} />
        : page === 'reports'
        ? <ReportPage assets={assets} assetTypes={assetTypes} purchaseOrders={purchaseOrders} />
        : page === 'projects'
        ? <ProjectListPage projects={projects} assets={assets} onCreate={() => navigate('create-project')} />
        : page === 'create-project'
        ? <CreateProjectPage onSave={saveProject} onCancel={() => navigate('projects')} />
        : ADMIN_PAGES[page]
        ? <AdministratorPage key={page} page={page} data={adminData} onSave={saveAdminData} onNotice={setNotice} />
        : page === 'dashboard'
        ? <DashboardPage assets={assets} assetTypes={assetTypes} purchaseOrders={purchaseOrders} summary={summary} onNavigate={navigate} onSaveDPDetails={saveDepreciationDetails} lifecycleEvents={lifecycleEvents} onTransfer={openAssetTransfer} onAdvanceTransfer={advanceTransferApproval} />
        : page === 'assets'
          ? <AssetListPage assets={filteredAssets} allAssets={assets} projects={projects} assetTypes={assetTypes} purchaseOrders={purchaseOrders} totalCount={assets.length} filters={filters} filterOptions={options} hasActiveFilters={hasActiveFilters} updateFilter={updateFilter} clearFilters={clearFilters} onCreate={() => navigate('create')} onCreateSubAsset={openCreateSubAsset} onEdit={openDraftForEdit} onExport={handleExport} onSaveDPDetails={saveDepreciationDetails} lifecycleEvents={lifecycleEvents} onTransfer={openAssetTransfer} onAdvanceTransfer={advanceTransferApproval} />
          : page === 'movement'
            ? <AssetMovementPage initialAssetId={movementAssetId} assets={assets} lifecycleEvents={lifecycleEvents} onSave={saveLifecycleEvent} onMovements={() => navigate('movements')} />
          : page === 'movements'
            ? <AssetMovementListPage lifecycleEvents={lifecycleEvents} onCreate={() => navigate('movement')} onApproval={() => { navigate('approval'); setApprovalTab('movement') }} />
          : page === 'create-sub-asset' && subAssetParent
            ? <CreateSubAssetPage key={subAssetParent.assetId} parentAsset={subAssetParent} nextAssetId={getNextSubAssetId(subAssetParent.assetId, assets.map((asset) => asset.assetId))} draft={subAssetRequests.find((request) => request.sourceAssetId === subAssetParent.assetId)} onSave={saveSubAssetDraft} onProposal={(request) => saveSubAssetDraft(request, true)} onCancel={() => navigate('assets')} />
          : page === 'create'
            ? <CreateAssetPage projects={projects} asset={editingAsset} assetClassOptions={assetClassOptions} onCancel={() => { setEditingAsset(null); navigate('assets') }} onSave={saveDraft} />
            : page === 'mis-proposal'
              ? <MISCreateProposalPage projects={projects} initialWorkRequest={proposalWorkRequest} assets={assets} proposals={proposals} onSave={saveMISProposal} onBack={() => navigate('mis-proposals')} onAssets={() => navigate('assets')} />
              : page === 'mis-proposals'
              ? <MISProposalListPage proposals={proposals} onCreate={() => navigate('mis-proposal')} onSetStatus={handleProposalStatus} />
                : page === 'mis-prs'
                  ? <MISPRListPage purchaseRequisitions={purchaseRequisitions} onCreate={() => navigate('mis-create-pr')} onApprove={approveMISPurchaseRequisition} onCreatePO={openMISCreatePO} />
                  : page === 'mis-create-pr'
                    ? <MISCreatePRPage assets={assets} proposals={proposals} purchaseRequisitions={purchaseRequisitions} nextPRNo={createMISReference(assets, 'pr')} onSave={saveMISPurchaseRequisition} onProposalList={() => navigate('mis-proposals')} onApproveProposal={(proposalId) => handleProposalStatus(proposalId, 'Approved')} />
                  : page === 'mis-pos'
                    ? <MISPOListPage purchaseOrders={purchaseOrders} onApprove={approveMISPurchaseOrder} onCreate={() => navigate('mis-create-po')} />
                  : page === 'mis-create-po'
                    ? <MISCreatePOPage purchaseOrders={purchaseOrders} onApprove={approveMISPurchaseOrder} onPOList={() => navigate('mis-pos')} assets={assets} purchaseRequisitions={purchaseRequisitions} defaultPRNo={selectedPRNo} nextPONo={createMISReference(assets, 'po')} onSave={saveMISPurchaseOrder} onPRList={() => navigate('mis-prs')} />
                : page === 'mis-create-gr'
                  ? <MISCreateGRPage vendorInvoices={vendorInvoices} assets={assets} purchaseOrders={purchaseOrders} goodsReceipts={goodsReceipts} nextGRNo={createMISReference([...assets, ...goodsReceipts.map((receipt) => ({ goodsReceiptReferences: [{ reference: receipt.grNo }] }))], 'gr')} onSave={saveMISGoodsReceipt} onAssets={() => navigate('assets')} onAssetValidation={() => navigate('asset-validation')} />
                  : page === 'asset-validation'
                    ? <AssetValidationPage assets={assets} proposals={proposals} purchaseOrders={purchaseOrders} goodsReceipts={goodsReceipts} onComplete={completeAssetValidation} onSaveDraft={(assetId, validationDraft) => updateAssets([assetId], (asset) => ({ ...asset, validationDraft }))} onCreateGR={() => navigate('mis-create-gr')} onAssets={() => navigate('assets')} />
                    : page === 'approval'
                      ? <AssetApprovalPage initialTab={approvalTab} assets={assets} purchaseOrders={purchaseOrders} lifecycleEvents={lifecycleEvents} onApprove={approveAsset} onReturn={returnAssetForCorrection} onAdvanceTransfer={advanceTransferApproval} onAssetValidation={() => navigate('asset-validation')} />
                  : <ManageAssetMasterPage
                        assetTypes={assetTypes}
                        assets={assets}
                        onCreate={addAssetType}
                        onUpdate={(id, changes, previousName) => {
                          updateAssetType(id, changes)
                          if (changes.name !== previousName) renameAssetClass(previousName, changes.name)
                        }}
                        onSetActive={setAssetTypeActive}
                        onNotice={setNotice}
                      />}
    </Suspense>
  )

  return (
    <div className="app-shell min-h-screen">
      <Sidebar page={page} assetCount={assets.length} menuOpen={menuOpen} onNavigate={navigate} onClose={() => setMenuOpen(false)} />
      <main className="main-shell">
        <TopBar
          onSignOut={onSignOut}
          pageTitle={pageTitle}
          sectionTitle={sectionTitle}
          query={filters.query}
          setQuery={(value) => updateFilter('query', value)}
          attentionAssets={summary.attentionAssets}
          onSearch={() => setPage('assets')}
          onNotice={() => setNotice(summary.attentionAssets ? `${summary.attentionAssets} assets are waiting for a next step.` : 'No new notifications.')}
          onOpenMenu={() => setMenuOpen(true)}
        />
        <div className="page-content">{pageContent}</div>
      </main>
      <Toast message={notice} onDismiss={() => setNotice('')} />
    </div>
  )
}

const VendorDeliveryPage = lazy(() => import('./pages/VendorDeliveryPage.jsx'))

const AssetInfoPage = lazy(() => import('./pages/AssetInfoPage.jsx'))

export default function App() {
  const [signedIn, setSignedIn] = useState(() => sessionStorage.getItem('tbkk-demo-session-v1') === 'active')
  if (window.location.pathname === '/vendor-delivery') return <Suspense fallback={<div className="page-loading">Loading Vendor Delivery...</div>}><VendorDeliveryPage /></Suspense>
  const assetId = new URLSearchParams(window.location.search).get('asset')
  if (assetId !== null) return <Suspense fallback={<div className="page-loading" role="status">Loading Asset information...</div>}><AssetInfoPage assetId={assetId} /></Suspense>
  function signIn() {
    sessionStorage.setItem('tbkk-demo-session-v1', 'active')
    setSignedIn(true)
  }
  function signOut() {
    sessionStorage.removeItem('tbkk-demo-session-v1')
    setSignedIn(false)
  }
  return signedIn ? <WorkspaceErrorBoundary><WorkspaceApp onSignOut={signOut} /></WorkspaceErrorBoundary> : <LoginPage onSignIn={signIn} />
}
