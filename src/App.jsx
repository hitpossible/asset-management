import { resolveTransferWorkflow, normalizeDepartment } from './utils/departmentApproverUtils.js'
import { resolveJobWorkflow, createTransferWorkflowSnapshot, withAssignedActivationWorkflow, withAssignedTransferWorkflow, approveTransferWorkflow } from './utils/workflowAssignmentUtils.js'
import { createActivationRequest, approveActivation, returnActivation } from './utils/activationApprovalUtils.js'
import { createAuditRecord, diffAuditCollection } from './utils/auditLogUtils.js'
import { appendAuditRecords } from './utils/auditLogStorage.js'
import { getNextTemporaryAssetId, prepareProposalApproval, prepareDraftNumberMigration, remapAssetReferences } from './utils/assetNumberUtils.js'
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
import { createSubAssetDraft, migrateSubAssetRequests } from './utils/subAssetDraftUtils.js'
import { createMISReference, getAssetReferences, linkGoodsReceiptInvoice, linkGoodsReceiptPO } from './utils/misReferenceUtils.js'

const AuditLogPage = lazy(() => import('./pages/AuditLogPage.jsx'))
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
const ActivationApprovalSettingsPage = lazy(() => import('./pages/ActivationApprovalSettingsPage.jsx'))
const AssetApprovalPage = lazy(() => import('./pages/AssetApprovalPage.jsx'))
const AssetMovementPage = lazy(() => import('./pages/AssetMovementPage.jsx'))
const AssetMovementListPage = lazy(() => import('./pages/AssetMovementListPage.jsx'))

function WorkspaceApp({ onSignOut }) {
  const { projects, addProject: rawAddProject } = useProjectStore()
  const { data: adminData, save: rawSaveAdminData } = useAdminStore()
  const { assets, storageFailed: assetStorageFailed, addDraft: rawAddDraft, updateDraft: rawUpdateDraft, renameAssetClass: rawRenameAssetClass, updateAssets: rawUpdateAssets, addAssets: rawAddAssets } = useAssetStore()
  const activationAssignment = resolveJobWorkflow(adminData, 'asset-activation')
  const activationSteps = activationAssignment.workflow?.steps || []
  const { assetTypes, addAssetType: rawAddAssetType, updateAssetType: rawUpdateAssetType, setAssetTypeActive: rawSetAssetTypeActive } = useAssetTypeStore()
  const { proposals, addProposal, setProposalStatus, remapAssetIds: remapProposalAssetIds } = useMISProposalStore()
  const { purchaseRequisitions, purchaseOrders, goodsReceipts, vendorInvoices, addPurchaseRequisition, setPurchaseRequisitionStatus, addPurchaseOrder, addGoodsReceipt, approvePurchaseOrder, remapAssetIds: remapPurchasingAssetIds } = useMISPurchasingStore()
  const { lifecycleEvents, addLifecycleEvent: rawAddLifecycleEvent, addLifecycleEvents: rawAddLifecycleEvents, updateLifecycleEvent: rawUpdateLifecycleEvent, addProposalEvents, remapAssetIds: remapLifecycleAssetIds } = useAssetLifecycleStore(assets)
  const approvalAssets = assets.map((asset) => withAssignedActivationWorkflow(asset, activationAssignment.workflow))
  const approvalLifecycleEvents = lifecycleEvents.map((event) => withAssignedTransferWorkflow(event, resolveTransferWorkflow(adminData, event.from, event.to).workflow))
  const [page, setPage] = useState('dashboard')
  const [approvalTab, setApprovalTab] = useState('asset')
  const [approvalSettingsSection, setApprovalSettingsSection] = useState('workflows')
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
    const { mapping, updates } = prepareDraftNumberMigration(assets, proposals)
    if (!updates.size) return
    rawUpdateAssets(assets.map((asset) => asset.assetId), (asset) => remapAssetReferences(updates.get(asset.assetId) || asset, mapping))
    remapProposalAssetIds(mapping)
    remapPurchasingAssetIds(mapping)
    remapLifecycleAssetIds(mapping)
  }, [assets, proposals, rawUpdateAssets, remapProposalAssetIds, remapPurchasingAssetIds, remapLifecycleAssetIds])

  useEffect(() => {
    // Wait for legacy Draft numbering to finish before allocating request references.
    if (prepareDraftNumberMigration(assets, proposals).updates.size) return
    const { records, migratedIds } = migrateSubAssetRequests(subAssetRequests, assets)
    if (records.length) rawAddAssets(records)
    if (migratedIds.length) removeSubAssetRequests(migratedIds)
  }, [subAssetRequests, assets, proposals, rawAddAssets, removeSubAssetRequests])

  useEffect(() => {
    if (!notice) return undefined
    const timer = window.setTimeout(() => setNotice(''), 3600)
    return () => window.clearTimeout(timer)
  }, [notice])

  function audit(module, entityType, reference, before, after, action) {
    const record = createAuditRecord({ module, entityType, reference, before, after, action, origin: page, name: after?.name || after?.title || before?.name || '' })
    if (record) appendAuditRecords([record])
  }

  function updateAssets(ids, update, meta = {}) {
    const selected = new Set(ids)
    const changes = new Map(assets.filter((asset) => selected.has(asset.assetId)).map((asset) => [asset.assetId, update(asset)]))
    rawUpdateAssets(ids, (asset) => changes.get(asset.assetId) || asset)
    for (const asset of assets.filter((record) => selected.has(record.assetId))) {
      audit(meta.module || (page === 'disposal' ? 'Disposal' : page === 'approval' ? 'Approval' : page === 'asset-validation' ? 'Verification' : 'Assets'), 'Asset', asset.assetId, asset, changes.get(asset.assetId), meta.action)
    }
  }

  function addAssets(records) {
    rawAddAssets(records)
    for (const record of records.filter((item) => !assets.some((asset) => asset.assetId === item.assetId))) audit('Assets', 'Sub Asset', record.assetId, null, record)
  }

  function addDraft(draft) {
    const temporaryReference = getNextTemporaryAssetId(assets)
    rawAddDraft(draft)
    audit('Assets', 'Asset', temporaryReference, null, { ...draft, assetId: temporaryReference, temporaryReference, status: 'Draft' })
  }

  function updateDraft(id, draft) {
    const before = assets.find((asset) => asset.assetId === id)
    rawUpdateDraft(id, draft)
    if (before?.status === 'Draft' && !before.proposalNo) audit('Assets', 'Asset', id, before, { ...before, ...draft, status: 'Draft' })
  }

  function addProject(project) {
    rawAddProject(project)
    audit('Projects', 'Project', project.projectCode, null, project)
  }

  function saveAdminData(next) {
    if (!rawSaveAdminData(next)) return false
    const meta = { module: 'Administrator', origin: page }
    const records = ['users', 'roles', 'menus'].flatMap((collection) => diffAuditCollection(adminData[collection], next[collection], 'id', { ...meta, entityType: { users: 'User', roles: 'Role', menus: 'Menu' }[collection] }))
    for (const roleId of new Set([...Object.keys(adminData.permissions), ...Object.keys(next.permissions)])) {
      const record = createAuditRecord({ ...meta, entityType: 'Permission', reference: roleId, name: next.roles.find((role) => role.id === roleId)?.name, before: { menuIds: adminData.permissions[roleId] }, after: { menuIds: next.permissions[roleId] } })
      if (record) records.push(record)
    }
    const workflowRecord = createAuditRecord({ ...meta, entityType: 'Approval Management', reference: 'approval-management', name: 'Approval Management', before: { types: adminData.approvalTypes || null, assignments: adminData.workflowAssignments || null, responsibilityAssignments: adminData.responsibilityAssignments || null, legacyDefaultTypeId: adminData.defaultActivationApprovalTypeId || null }, after: { types: next.approvalTypes || null, assignments: next.workflowAssignments || null, responsibilityAssignments: next.responsibilityAssignments || null } })
    if (workflowRecord) records.push(workflowRecord)
    records.push(...diffAuditCollection(adminData.departmentApprovers || [], next.departmentApprovers || [], 'id', { ...meta, entityType: 'Department Approver' }))
    const teamRecord = createAuditRecord({ ...meta, entityType: 'Transfer Acknowledgement', reference: 'asset-team-acknowledgement', name: 'Asset Team Acknowledge', before: { userId: adminData.assetTeamAcknowledgementUserId || '' }, after: { userId: next.assetTeamAcknowledgementUserId || '' } })
    if (teamRecord) records.push(teamRecord)
    appendAuditRecords(records)
    return true
  }

  function addAssetType(type) {
    const highest = assetTypes.reduce((max, record) => Math.max(max, Number(record.id.match(/^ATM-(\d+)$/)?.[1]) || 0), 0)
    const record = { ...type, id: `ATM-${String(highest + 1).padStart(3, '0')}` }
    rawAddAssetType(type)
    audit('Asset Types', 'Asset Type', record.id, null, record)
  }

  function updateAssetType(id, changes) {
    const before = assetTypes.find((type) => type.id === id)
    rawUpdateAssetType(id, changes)
    if (before) audit('Asset Types', 'Asset Type', id, before, { ...before, ...changes })
  }

  function setAssetTypeActive(id, active) {
    const before = assetTypes.find((type) => type.id === id)
    rawSetAssetTypeActive(id, active)
    if (before) audit('Asset Types', 'Asset Type', id, before, { ...before, active })
  }

  function renameAssetClass(previous, next) {
    rawRenameAssetClass(previous, next)
    for (const asset of assets.filter((record) => record.assetClass === previous)) audit('Asset Types', 'Asset', asset.assetId, asset, { ...asset, assetClass: next })
  }

  function addLifecycleEvent(event) {
    const record = rawAddLifecycleEvent(event)
    audit('Movement', 'Transfer', record.transactionNo, null, record)
    return record
  }

  function addLifecycleEvents(events) {
    const records = rawAddLifecycleEvents(events)
    for (const record of records) audit('Disposal', 'Disposal', record.transactionNo, null, record)
    return records
  }

  function updateLifecycleEvent(id, changes, action) {
    const before = lifecycleEvents.find((event) => event.transactionNo === id)
    rawUpdateLifecycleEvent(id, changes)
    if (before) audit(before.type === 'transfer' ? 'Movement' : 'Approval', 'Lifecycle transaction', id, before, { ...before, ...changes }, action)
  }

  function navigate(nextPage) {
    setPage(nextPage)
    if (nextPage === 'activation-approval') setApprovalSettingsSection('workflows')
    if (nextPage !== 'mis-proposal') setProposalWorkRequest(null)
    if (nextPage !== 'movement') setMovementAssetId('')
    if (nextPage === 'approval') setApprovalTab('asset')
    setMenuOpen(false)
    if (nextPage === 'create') setEditingAsset(null)
    if (nextPage !== 'assets') clearFilters()
  }

  function openApprovalManagement(section = 'workflows') {
    navigate('activation-approval')
    setApprovalSettingsSection(section)
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
        status: asset.status === 'Active' ? 'Active' : 'Draft',
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
      const completeStatuses = ['Asset Validation', 'Ready for Verification', 'Verification In Progress', 'Pending Asset Team Leader Approval', 'Pending Accounting Review', 'Pending Accounting Approval', 'Pending Activation Approval']
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

    let activationRequest = null
    if (allPurchaseOrdersValidated && currentAsset?.status !== 'Active') {
      const { workflow: approvalType, error } = resolveJobWorkflow(adminData, 'asset-activation')
      if (error) { setNotice(error); return false }
      try { activationRequest = createActivationRequest(currentAsset || record.asset, approvalType.steps, completedValidation.validatedAt, approvalType) }
      catch (error) { setNotice(error.message); return false }
    }

    updateAssets([record.assetId], (asset) => {
      const currentValidations = (asset.receivingValidations || []).filter((item) => item.poNo !== record.poNo)
      const receivingValidations = [...currentValidations, completedValidation]

      return {
        ...asset,
        receivingValidations,
        assetControlSheet: record.assetControlSheet,
        ...(record.assetControlSheet?.form ? {
          area: record.assetControlSheet.form.area ?? asset.area ?? '',
          power: record.assetControlSheet.form.power ?? asset.power ?? '',
          powerUnit: record.assetControlSheet.form.powerUnit || asset.powerUnit || 'kW',
        } : {}),
        validationDraft: null,
        approvalHistory: [...(Array.isArray(asset.approvalHistory) ? asset.approvalHistory : []), { stage: 'Asset Team Verification', action: 'Asset Validation completed', actor: 'Asset Team', date: completedValidation.validatedAt }],
        ...(activationRequest || {}),
        status: asset.status === 'Active' ? asset.status : allPurchaseOrdersValidated ? activationRequest?.status || asset.status : 'Asset Validation',
      }
    })
    for (const event of lifecycleEvents.filter((event) => event.subAssetId === record.assetId)) {
      updateLifecycleEvent(event.transactionNo, { status: allPurchaseOrdersValidated ? activationRequest?.status || 'Pending Activation Approval' : 'Asset Validation' })
    }
    if (allPurchaseOrdersValidated) {
      setNotice(`${record.assetId} was submitted using ${activationRequest?.activationApproval.approvalTypeName || 'Asset activation'}.`)
      navigate('approval')
    } else {
      setNotice(`Verification for ${record.poNo} is saved. Complete the remaining linked POs before Asset approval.`)
    }
  }

  function approveAsset(payload) {
    const current = assets.find((asset) => asset.assetId === payload.assetId)
    if (!current) return false
    let next
    try { next = approveActivation(withAssignedActivationWorkflow(current, activationAssignment.workflow), payload, activationSteps) }
    catch (error) { setNotice(error.message); return false }
    const final = next.status === 'Active'
    updateAssets([payload.assetId], () => next, { action: final ? 'Activate' : 'Approve' })
    for (const event of lifecycleEvents.filter((event) => event.subAssetId === payload.assetId)) {
      updateLifecycleEvent(event.transactionNo, { status: final ? 'Completed' : next.status, ...(final ? { completedAt: next.activatedAt } : {}) })
    }
    setNotice(final ? `${payload.assetId} has completed all approval steps and is now Active.` : `${payload.assetId}: ${next.approvalHistory.at(-1).stage} approved. Next: ${next.activationApproval.steps[next.activationApproval.currentStep].label}.`)
    return true
  }

  function returnAssetForCorrection(payload) {
    const current = assets.find((asset) => asset.assetId === payload.assetId)
    if (!current) return false
    let next
    try { next = returnActivation(withAssignedActivationWorkflow(current, activationAssignment.workflow), payload, activationSteps) }
    catch (error) { setNotice(error.message); return false }
    updateAssets([payload.assetId], () => next, { action: 'Return for Correction' })
    for (const event of lifecycleEvents.filter((event) => event.subAssetId === payload.assetId)) {
      updateLifecycleEvent(event.transactionNo, { status: 'Returned for Correction', remark: payload.comment })
    }
    setNotice(`${payload.assetId} was returned to Asset Validation for correction.`)
    return true
  }

  function handleProposalStatus(proposalId, status) {
    const proposal = proposals.find((record) => record.proposalId === proposalId)
    if (!proposal || proposal.status === status) return
    if (status === 'Approved') {
      const { mapping, updates } = prepareProposalApproval(proposal, assets)
      updateAssets(assets.map((asset) => asset.assetId), (asset) => remapAssetReferences(updates.get(asset.assetId) || asset, mapping))
      remapProposalAssetIds(mapping)
      remapPurchasingAssetIds(mapping)
      remapLifecycleAssetIds(mapping)
    }
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
    }), { module: 'Depreciation' })
    setNotice(`${assetId} DP details were saved.`)
  }

  function saveLifecycleEvent(event) {
    if (assets.find((asset) => asset.assetId === event.assetId)?.status !== 'Active') throw new Error('Lifecycle actions require an Active Asset.')
    const asset = assets.find((item) => item.assetId === event.assetId)
    if (event.type === 'transfer' && normalizeDepartment(asset?.department) && normalizeDepartment(asset.department) !== normalizeDepartment(event.from?.department)) throw new Error('The source department changed. Reopen the Transfer request using the current Asset assignment.')
    const assignment = event.type === 'transfer' && event.status === 'Pending Approval' ? resolveTransferWorkflow(adminData, event.from, event.to) : null
    if (assignment?.error) throw new Error(assignment.error)
    const record = addLifecycleEvent(assignment ? { ...event, ...createTransferWorkflowSnapshot(assignment.workflow) } : event)
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

  function advanceTransferApproval(event, payload = {}) {
    const stored = lifecycleEvents.find((item) => item.transactionNo === event.transactionNo)
    if (!stored || stored.status !== 'Pending Approval') return
    const target = assets.find((asset) => asset.assetId === stored.assetId)
    if (!target || target.status !== 'Active' || isCustomerAsset(target)) return
    const current = withAssignedTransferWorkflow(stored, resolveTransferWorkflow(adminData, stored.from, stored.to).workflow)
    let next
    try { next = approveTransferWorkflow(current, event, undefined, payload) }
    catch (error) { setNotice(error.message); return }
    const date = next.approvalHistory.at(-1).date
    const isFinalStep = next.status === 'Completed'
    const approvalSteps = next.approvalSteps
    const currentStep = Number(current.currentApprovalStep) || 0
    const currentStage = current.approvalWorkflow.steps[currentStep].label
    event = current

    if (isFinalStep) {
      updateLifecycleEvent(event.transactionNo, next, 'Complete')
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

    updateLifecycleEvent(event.transactionNo, next, 'Approve')
    setNotice(`${currentStage} is complete. Next: ${approvalSteps[currentStep + 1]}.`)
  }

  const pageTitle = ({ 'audit-log': 'Audit Log', disposal: 'Disposal / Sale', reports: 'Report', 'create-sub-asset': 'Create Sub Asset', projects: 'Project List', 'create-project': 'Create Project', 'department-approvers': 'Approval Management' })[page] || ADMIN_PAGES[page] || (page === 'dashboard' ? 'Dashboard' : page === 'create' ? (editingAsset ? 'Edit draft' : 'Create asset') : page === 'assets' ? 'Asset list' : page === 'movement' ? 'Movement asset' : page === 'movements' ? 'Assets in movement' : page === 'mis-proposal' ? 'Create Proposal' : page === 'mis-proposals' ? 'Proposal list' : page === 'mis-prs' ? 'PR list' : page === 'mis-create-pr' ? 'Create PR' : page === 'mis-pos' ? 'PO list' : page === 'mis-create-po' ? 'Create PO' : page === 'mis-create-gr' ? 'Create GR' : page === 'asset-validation' ? 'Asset Validation' : page === 'approval' ? 'Approval' : 'Manage Asset Type')
  const sectionTitle = page === 'reports' ? 'Report' : ['projects', 'create-project'].includes(page) ? 'Project Management' : (page === 'master' || page === 'audit-log' || page === 'department-approvers' || ADMIN_PAGES[page]) ? 'Administrator' : page === 'approval' ? 'Approval' : ['mis-proposal', 'mis-proposals', 'mis-prs', 'mis-create-pr', 'mis-pos', 'mis-create-po', 'mis-create-gr'].includes(page) ? 'MIS' : 'Asset management'
  const assetClassOptions = assetTypes.filter((type) => type.active).map((type) => type.name)
  const pageContent = (
    <Suspense fallback={<div className="page-loading" role="status">Loading page...</div>}>
      {page === 'audit-log'
        ? <AuditLogPage />
        : page === 'disposal'
        ? <DisposalPage assets={assets} assetTypes={assetTypes} purchaseOrders={purchaseOrders} onSave={derecognizeAssets} />
        : page === 'reports'
        ? <ReportPage assets={assets} assetTypes={assetTypes} purchaseOrders={purchaseOrders} />
        : page === 'projects'
        ? <ProjectListPage projects={projects} assets={assets} onCreate={() => navigate('create-project')} />
        : page === 'create-project'
        ? <CreateProjectPage onSave={saveProject} onCancel={() => navigate('projects')} />
        : page === 'department-approvers' || page === 'activation-approval'
        ? <ActivationApprovalSettingsPage initialSection={page === 'department-approvers' ? 'responsibilities' : approvalSettingsSection} data={adminData} assets={assets} onSave={saveAdminData} onNotice={setNotice} />
        : ADMIN_PAGES[page]
        ? <AdministratorPage key={page} page={page} data={adminData} onSave={saveAdminData} onNotice={setNotice} />
        : page === 'dashboard'
        ? <DashboardPage assets={assets} assetTypes={assetTypes} purchaseOrders={purchaseOrders} summary={summary} onNavigate={navigate} onSaveDPDetails={saveDepreciationDetails} lifecycleEvents={approvalLifecycleEvents} onTransfer={openAssetTransfer} onAdvanceTransfer={advanceTransferApproval} />
        : page === 'assets'
          ? <AssetListPage assets={filteredAssets} allAssets={assets} projects={projects} assetTypes={assetTypes} purchaseOrders={purchaseOrders} totalCount={assets.length} filters={filters} filterOptions={options} hasActiveFilters={hasActiveFilters} updateFilter={updateFilter} clearFilters={clearFilters} onCreate={() => navigate('create')} onCreateSubAsset={openCreateSubAsset} onEdit={openDraftForEdit} onExport={handleExport} onSaveDPDetails={saveDepreciationDetails} lifecycleEvents={approvalLifecycleEvents} onTransfer={openAssetTransfer} onAdvanceTransfer={advanceTransferApproval} />
          : page === 'movement'
            ? <AssetMovementPage transferApprovalData={adminData} initialAssetId={movementAssetId} assets={assets} lifecycleEvents={approvalLifecycleEvents} onSave={saveLifecycleEvent} onMovements={() => navigate('movements')} />
          : page === 'movements'
            ? <AssetMovementListPage lifecycleEvents={approvalLifecycleEvents} onCreate={() => navigate('movement')} onApproval={() => { navigate('approval'); setApprovalTab('movement') }} />
          : page === 'create-sub-asset' && subAssetParent
            ? <CreateSubAssetPage key={subAssetParent.assetId} parentAsset={subAssetParent} nextAssetId={getNextTemporaryAssetId(assets)} draft={subAssetRequests.find((request) => request.sourceAssetId === subAssetParent.assetId)} onSave={saveSubAssetDraft} onProposal={(request) => saveSubAssetDraft(request, true)} onCancel={() => navigate('assets')} />
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
                    ? <AssetValidationPage activationWorkflow={activationAssignment.workflow} activationWorkflowError={activationAssignment.error} assets={assets} vendorInvoices={vendorInvoices} proposals={proposals} purchaseOrders={purchaseOrders} goodsReceipts={goodsReceipts} onComplete={completeAssetValidation} onSaveDraft={(assetId, validationDraft) => updateAssets([assetId], (asset) => ({ ...asset, validationDraft }))} onCreateGR={() => navigate('mis-create-gr')} onAssets={() => navigate('assets')} />
                    : page === 'approval'
                      ? <AssetApprovalPage activationSteps={activationSteps} activationWorkflowName={activationAssignment.workflow?.name} activationWorkflowError={activationAssignment.error} transferWorkflowError="Transfer approval resolves Area Owners from the source and destination Departments. Configure the Responsibility Matrix in Approval Management." onManageTransferApprovers={() => openApprovalManagement('responsibilities')} onManageWorkflows={() => openApprovalManagement('workflows')} initialTab={approvalTab} assets={approvalAssets} purchaseOrders={purchaseOrders} lifecycleEvents={approvalLifecycleEvents} onApprove={approveAsset} onReturn={returnAssetForCorrection} onAdvanceTransfer={advanceTransferApproval} onAssetValidation={() => navigate('asset-validation')} />
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
      {assetStorageFailed ? <p className="asset-storage-notice" role="status">Session only: browser storage is unavailable or full. Asset changes and attached Invoice files will be lost when this page is reloaded.</p> : null}
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
