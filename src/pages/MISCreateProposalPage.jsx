import { getProposalEligibleAssets } from '../utils/assetOwnershipUtils.js'
import { useEffect, useMemo, useRef, useState } from 'react'
import Icon from '../components/Icon.jsx'
import { Field, PageHeading } from '../components/common.jsx'
import { getMainAsset, getProposalItemTotal, getProposalTreatment, EXISTING_WORK_TYPES } from '../utils/proposalAssetUtils.js'
import { MOCK_PARTS } from '../data/mockParts.js'
import { createMISReference } from '../utils/misReferenceUtils.js'

const FACTORIES = ['TBKK']
const LOCATIONS = ['Phase 8', 'Phase 7', 'Phase 9']
const DEPARTMENTS = ['K2PE00:K2PE00', 'K1ME00:K1ME00', 'K4IE00:K4IE00', 'ACCT:ACCT']
const SECTIONS = ['K2MN00:K2MN00', 'K1MN00:K1MN00', 'K4IE00:K4IE00', 'ACCT:ACCT']
const ACCOUNT_CODES = ['A', 'B', 'C', 'D', 'E']
const BUDGET_TYPES = ['Capital expenditure', 'Expense']

function toLocalDateValue(date) {
  const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60_000)
  return localDate.toISOString().slice(0, 10)
}

function addOneYear(dateValue) {
  const date = new Date(`${dateValue}T12:00:00`)
  date.setFullYear(date.getFullYear() + 1)
  return toLocalDateValue(date)
}

function createCostRow(type = 'Installation', amount = '', description = '') {
  return { id: `cost-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, type, amount, description, accountCode: 'A' }
}

function createAssetRow(assetId = '', withSampleValues = false, assetMode = 'new') {
  return {
    id: `item-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    assetId,
    assetMode,
    budgetType: 'Capital expenditure',
    accountCode: 'A',
    workType: 'modification',
    workName: '',
    description: '',
    model: '',
    power: '',
    targetSop: '',
    amount: withSampleValues ? '1400000' : '',
    costs: withSampleValues ? [
      createCostRow('Installation', '150000', 'Installation'),
      createCostRow('Delivery', '50000', 'Delivery'),
    ] : [],
  }
}

function createInitialForm(assets, initialWorkRequest) {
  const today = toLocalDateValue(new Date())
  const eligibleAssets = getProposalEligibleAssets(assets).filter((asset) => asset.status === 'Draft')
  const draftSubAsset = assets.find((asset) => asset.assetId === initialWorkRequest?.assetId && asset.status === 'Draft')
  const workTarget = draftSubAsset || assets.find((asset) => asset.assetId === initialWorkRequest?.sourceAssetId)
  const initialAsset = initialWorkRequest ? workTarget : eligibleAssets.find((asset) => asset.projectCode?.trim())
  return {
    ownershipType: 'company',
    factory: 'TBKK',
    location: 'Phase 8',
    department: 'K2PE00:K2PE00',
    section: 'K2MN00:K2MN00',
    accountCode: ACCOUNT_CODES[0],
    proposalName: '',
    proposalType: 'Buy',
    inBudget: initialWorkRequest ? String(initialWorkRequest.amount || 0) : eligibleAssets.length ? '1400000' : '0',
    outOfBudget: '0',
    productionLine: 'Line C',
    investmentPlanNo: '',
    relatedDepartment: '',
    partNo: '',
    proposalId: createMISReference(assets, 'proposal'),
    projectCode: initialAsset?.projectCode || '',
    projectName: initialWorkRequest ? `${initialWorkRequest.name} for ${workTarget?.name || 'Existing Asset'}` : eligibleAssets[0] ? `${eligibleAssets[0].name} for Quality Inspection` : 'Manufacturing Equipment Upgrade',
    periodStart: today,
    periodEnd: addOneYear(today),
    budget: initialWorkRequest ? String(initialWorkRequest.amount || '0') : eligibleAssets.length ? '1400000' : '0',
    budgetType: !initialWorkRequest || Number(initialWorkRequest.amount) > 50_000 ? 'Capital expenditure' : 'Expense',
    assetItems: initialWorkRequest ? [{ ...createAssetRow(workTarget?.projectCode?.trim() ? workTarget.assetId : '', false, draftSubAsset ? 'new' : 'existing'), requestId: initialWorkRequest.requestId, workType: 'subAsset', workName: initialWorkRequest.name, description: initialWorkRequest.notes || '', model: initialWorkRequest.model, power: initialWorkRequest.power, targetSop: initialWorkRequest.targetSop, amount: initialWorkRequest.amount, budgetType: Number(initialWorkRequest.amount) > 50_000 ? 'Capital expenditure' : 'Expense' }] : [createAssetRow(initialAsset?.assetId || '', eligibleAssets.length > 0)],
  }
}

function formatTHB(value) {
  return new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value || 0)
}

export default function MISCreateProposalPage({ assets, proposals, initialWorkRequest, projects = [], onSave, onBack, onAssets }) {
  const [form, setForm] = useState(() => createInitialForm(assets, initialWorkRequest))
  const [browse, setBrowse] = useState(null)
  const [browseQuery, setBrowseQuery] = useState('')
  const projectDialogRef = useRef(null)
  useEffect(() => {
    if (browse === 'project' || browse === 'part') projectDialogRef.current?.showModal()
  }, [browse])
  const [error, setError] = useState('')
  const eligibleAssets = useMemo(() => getProposalEligibleAssets(assets, form.ownershipType).filter((asset) => form.projectCode.trim() && asset.projectCode?.trim() === form.projectCode.trim() && (asset.status === 'Draft' || getMainAsset(asset, assets))), [assets, form.ownershipType, form.projectCode])
  const eligibleAssetsById = useMemo(() => new Map(eligibleAssets.map((asset) => [asset.assetId, asset])), [eligibleAssets])
  const budgetAmount = (Number(form.inBudget) || 0) + (Number(form.outOfBudget) || 0)
  const proposalTotal = form.assetItems.reduce((total, item) => total + Math.round(getProposalItemTotal(item) * 100), 0) / 100
  const baseTotal = form.assetItems.reduce((total, item) => total + Math.round((Number(item.amount) || 0) * 100), 0) / 100
  const additionalTotal = Math.round((proposalTotal - baseTotal) * 100) / 100
  const selectedPart = MOCK_PARTS.find((part) => part.partNo === form.partNo)
  const matchingParts = MOCK_PARTS.filter((part) => `${part.partNo} ${part.name} ${part.model}`.toLowerCase().includes(browseQuery.toLowerCase()))
  const departmentBudget = 5000000
  const departmentUsed = proposals.filter((proposal) => proposal.department === form.department).reduce((total, proposal) => total + (Number(proposal.budget) || 0), 0)

  function setField(name, value) {
    setForm((current) => ({
      ...current,
      [name]: value,
      ...(name === 'ownershipType' ? { assetItems: [createAssetRow()] } : {}),
      ...(name === 'projectCode' && value.trim() !== current.projectCode.trim() ? {
        projectName: projects.find((project) => project.projectCode === value)?.projectName || '',
        assetItems: [createAssetRow()],
      } : {}),
    }))
    if (error) setError('')
  }

  function setAssetItem(itemId, changes) {
    setForm((current) => ({ ...current, assetItems: current.assetItems.map((item) => item.id === itemId ? { ...item, ...changes, ...(changes.assetId !== undefined || changes.assetMode !== undefined ? { requestId: undefined } : {}) } : item) }))
    if (error) setError('')
  }

  function setCost(itemId, costId, changes) {
    setForm((current) => ({
      ...current,
      assetItems: current.assetItems.map((item) => item.id === itemId
        ? { ...item, costs: item.costs.map((cost) => cost.id === costId ? { ...cost, ...changes } : cost) }
        : item),
    }))
  }

  function submit(event) {
    event.preventDefault()
    if (new Date(`${form.periodEnd}T00:00:00`) < new Date(`${form.periodStart}T00:00:00`)) {
      setError('Period End must be the same as or later than Period Start.')
      return
    }
    if (!form.assetItems.length) {
      setError('Select at least one Asset for this Proposal.')
      return
    }
    if (new Set(form.assetItems.map((item) => item.assetId)).size !== form.assetItems.length) {
      setError('Select each Asset only once in this Proposal.')
      return
    }
    const missingAsset = form.assetItems.some((item) => {
      const asset = eligibleAssetsById.get(item.assetId)
      return !asset || (form.ownershipType === 'customer' && item.assetMode !== 'new') || (item.assetMode === 'existing' ? asset.status !== 'Active' : asset.status !== 'Draft')
    })
    if (missingAsset) {
      setError('Select an available Draft or Active Asset linked to this Project Code and matching the Proposal ownership.')
      return
    }
    if (form.assetItems.some((item) => item.assetMode === 'existing' && !EXISTING_WORK_TYPES.some((type) => type.id === item.workType))) {
      setError('Select Modification or Maintenance for the Active Asset.')
      return
    }

    const proposal = {
      ...form,
      proposalId: form.proposalId,
      budget: proposalTotal,
      budgetType: new Set(form.assetItems.map((item) => item.budgetType)).size === 1 ? form.assetItems[0].budgetType : 'Mixed',
      partModel: selectedPart?.model || '',
      proposalName: form.proposalName.trim(),
      inBudget: Number(form.inBudget) || 0,
      outOfBudget: Number(form.outOfBudget) || 0,
      assetItems: form.assetItems.map((item) => ({
        itemId: item.id,
        requestId: item.requestId,
        assetMode: item.assetMode,
        workType: item.assetMode === 'existing' ? item.workType : '',
        workOnExistingAsset: item.assetMode === 'existing',
        workName: item.assetMode === 'existing' ? item.workName.trim() || form.proposalName.trim() : item.workName.trim(),
        description: item.description.trim() || (item.assetMode === 'existing' ? form.proposalName.trim() : ''),
        model: item.model.trim(),
        power: item.power.trim(),
        targetSop: item.targetSop,
        costTreatment: getProposalTreatment(item),
        budgetType: item.budgetType,
        assetId: item.assetId,
        assetName: eligibleAssetsById.get(item.assetId)?.name || '',
        assetAmount: Number(item.amount) || 0,
        accountCode: item.accountCode || form.accountCode,
        costs: item.costs.filter((cost) => cost.amount !== '' || cost.description.trim()).map((cost) => ({
          type: cost.description.trim() || cost.type,
          accountCode: cost.accountCode || 'A',
          amount: Number(cost.amount) || 0,
          description: cost.description.trim(),
        })),
      })),
      attachmentName: '',
      attachments: [],
      savedAt: new Date().toISOString(),
      status: 'Pending Approval',
    }
    try {
      onSave(proposal)
    } catch (error) {
      setError(error.message)
    }
  }

  return (
    <div className="create-asset-workspace mis-create-workspace proposal-reference-workspace">
      <PageHeading eyebrow="MIS · Functional / Proposal Service" title="Create Proposal" description="Project Service · Proposal / Create" action={<span className="mis-page-badge"><span />MIS simulation</span>} />
      <form className="create-asset-form mis-proposal-form" onSubmit={submit}>
          <div className="form-main-column">
        <section className="panel form-section mis-proposal-header-panel">
          <div className="mis-proposal-panel-heading form-section-heading"><div><span className="form-section-icon "><Icon name="file" size={23} /></span><div><h2>Proposal information</h2><p>Enter the project and budget details used in MIS.</p></div></div><span className="mis-required-note"><em>*</em> Required fields</span></div>
          <div className="proposal-reference-grid">
            <div className="proposal-reference-column">
              <Field label="Factory" required><select value={form.factory} onChange={(event) => setField('factory', event.target.value)}>{FACTORIES.map((option) => <option key={option}>{option}</option>)}</select></Field>
              <Field label="Location" required><select value={form.location} onChange={(event) => setField('location', event.target.value)}>{LOCATIONS.map((option) => <option key={option}>{option}</option>)}</select></Field>
              <Field label="Department" required><select value={form.department} onChange={(event) => setField('department', event.target.value)}>{DEPARTMENTS.map((option) => <option key={option}>{option}</option>)}</select></Field>
              <Field label="Section" required><select value={form.section} onChange={(event) => setField('section', event.target.value)}>{SECTIONS.map((option) => <option key={option}>{option}</option>)}</select></Field>
              <Field label="Proposal ID" required><input className="mis-readonly-field" value={form.proposalId} readOnly /></Field>
              <Field label="Proposal Name" required><input value={form.proposalName} onChange={(event) => setField('proposalName', event.target.value)} placeholder="Enter proposal name" maxLength={120} required /></Field>
              <div className="proposal-inline-field"><span>Proposal Type <em>*</em></span><div className="proposal-radio-group">{['Buy', 'Sales'].map((type) => <label key={type}><input type="radio" name="proposalType" value={type} checked={form.proposalType === type} onChange={() => setField('proposalType', type)} />{type}</label>)}</div></div>
              <div className="proposal-inline-field"><span id="proposal-ownership-label">Asset Ownership <em>*</em></span><div className="proposal-radio-group" role="radiogroup" aria-labelledby="proposal-ownership-label">{[['company', 'Company Asset · TBKK'], ['customer', 'Customer Asset']].map(([value, label]) => <label key={value}><input type="radio" name="ownershipType" value={value} checked={form.ownershipType === value} onChange={() => setField('ownershipType', value)} required />{label}</label>)}</div></div>
              <div className="proposal-inline-field proposal-budget-status"><span>Budget Status <em>*</em></span><div>{[['inBudget', 'In Budget'], ['outOfBudget', 'Out of Budget']].map(([key, label]) => <label key={key}><span>{label}</span><input aria-label={label} type="number" min="0" step="0.01" value={form[key]} onChange={(event) => setField(key, event.target.value)} required /></label>)}</div></div>
              <Field label="Budget Amount" required><input className="mis-readonly-field proposal-money" value={formatTHB(budgetAmount)} readOnly /><small>Proposal funding · In Budget + Out of Budget (THB)</small></Field>
              <Field label="Production Line"><select value={form.productionLine} onChange={(event) => setField('productionLine', event.target.value)}>{['Line A', 'Line B', 'Line C', 'Line D', 'N/A'].map((line) => <option key={line}>{line}</option>)}</select></Field>
              <Field label="Related Department"><select value={form.relatedDepartment} onChange={(event) => setField('relatedDepartment', event.target.value)}><option value="">+ เพิ่ม Department</option>{DEPARTMENTS.map((option) => <option key={option}>{option}</option>)}</select></Field>
            </div>
            <div className="proposal-reference-column">
              <Field label="Project Code" required><div className="proposal-browse-control"><input value={form.projectCode} onChange={(event) => setField('projectCode', event.target.value)} required /><button type="button" onClick={() => { setBrowse('project'); setBrowseQuery('') }}><Icon name="search" size={13} />Browse</button></div></Field>
              <Field label="Project Name" required><input value={form.projectName} onChange={(event) => setField('projectName', event.target.value)} maxLength={120} required /></Field>
              <div className="proposal-reference-spacer" />
              <Field label="Period Start" required><input type="date" value={form.periodStart} onChange={(event) => setField('periodStart', event.target.value)} required /></Field>
              <Field label="Period End" required><input type="date" value={form.periodEnd} min={form.periodStart} onChange={(event) => setField('periodEnd', event.target.value)} required /></Field>
              <div className="proposal-inline-field proposal-department-budget"><span>Department Budget</span><div><p>In Budget: {formatTHB(Number(form.inBudget))} / {formatTHB(departmentBudget)}</p><table><thead><tr><th>Total</th><th>Used</th><th>Balance</th></tr></thead><tbody><tr><td>{formatTHB(departmentBudget)}</td><td>{formatTHB(departmentUsed)}</td><td>{formatTHB(departmentBudget - departmentUsed)}</td></tr></tbody></table><small>Mock budget · saved proposals in this department</small></div></div>
              <Field label="Investment Plan No."><input value={form.investmentPlanNo} onChange={(event) => setField('investmentPlanNo', event.target.value)} maxLength={80} /></Field>
              <Field label="Part No."><div className="proposal-browse-control"><input className="mis-readonly-field" value={form.partNo} readOnly placeholder="Browse to select a Part" /><button type="button" onClick={() => { setBrowse('part'); setBrowseQuery('') }}><Icon name="search" size={13} />Browse</button></div></Field>
              <Field label="Model No."><input className="mis-readonly-field" value={selectedPart?.model || ''} readOnly placeholder="From selected Part" /></Field>
            </div>
          </div>
        </section>

        <section className="panel form-section proposal-assets-panel" aria-labelledby="proposal-assets-heading">
          <div className="mis-proposal-panel-heading form-section-heading"><div><span className="form-section-icon"><Icon name="box" size={23} /></span><div><h2 id="proposal-assets-heading">Proposal Assets</h2><p>Select one or more Assets. Each Asset has its own amount and additional costs.</p></div></div><button type="button" className="button button-secondary button-small" disabled={!eligibleAssets.length || form.assetItems.length >= eligibleAssets.length} onClick={() => { setForm((current) => ({ ...current, assetItems: [...current.assetItems, createAssetRow()] })); setError('') }}><Icon name="plus" size={15} />Add Asset</button></div>
          {form.assetItems.map((item, assetIndex) => {
            const selectedAsset = eligibleAssetsById.get(item.assetId)
            const isDraftSubAsset = selectedAsset?.draftOrigin === 'Create Sub Asset'
            const treatment = getProposalTreatment(isDraftSubAsset ? { ...item, assetMode: 'existing' } : item)
            const additionalCosts = item.costs.reduce((total, cost) => total + Math.round((Number(cost.amount) || 0) * 100), 0) / 100
            const otherSelectedIds = new Set(form.assetItems.filter((row) => row.id !== item.id).map((row) => row.assetId))
            return <article className="proposal-asset-card" key={item.id} aria-labelledby={`asset-item-${item.id}`}>
              <div className="proposal-asset-card-heading"><div><span className="mis-line-count">{String(assetIndex + 1).padStart(2, '0')}</span><h3 id={`asset-item-${item.id}`}>{selectedAsset?.name || 'Select an Asset'}</h3></div><button type="button" className="button button-secondary button-small" disabled={form.assetItems.length === 1} aria-label={`Remove Asset ${assetIndex + 1}`} onClick={() => { setForm((current) => ({ ...current, assetItems: current.assetItems.filter((row) => row.id !== item.id) })); setError('') }}><Icon name="close" size={14} />Remove Asset</button></div>
              <div className="form-grid">
                <Field label="Asset No. / Draft reference" required><select aria-label={`Asset ${assetIndex + 1} reference`} disabled={!form.projectCode.trim() || !eligibleAssets.length} value={selectedAsset ? item.assetId : ''} onChange={(event) => { const asset = eligibleAssetsById.get(event.target.value); setAssetItem(item.id, { assetId: event.target.value, assetMode: asset?.status === 'Active' ? 'existing' : 'new', workType: 'modification', workName: '', description: '', model: '', power: '', targetSop: '' }) }} required><option value="">{!form.projectCode.trim() ? 'Select a Project Code first' : !eligibleAssets.length ? 'No eligible Assets linked to this Project Code' : 'Select an Asset'}</option>{eligibleAssets.map((asset) => <option key={asset.assetId} value={asset.assetId} disabled={otherSelectedIds.has(asset.assetId)}>{asset.assetId} · {asset.name} ({asset.status}){otherSelectedIds.has(asset.assetId) ? ' · Already selected' : ''}{form.ownershipType === 'customer' ? ` · ${asset.customerName}` : ''}</option>)}</select><small>Assets must match the Project Code and Proposal ownership.</small></Field>
                <Field label="Asset name"><input value={selectedAsset?.name || ''} readOnly className="mis-readonly-field" /></Field>
                <Field label={item.assetMode === 'existing' ? 'Work amount (THB)' : 'Asset amount (THB)'} required><input aria-label={`Asset ${assetIndex + 1} amount`} type="number" min="0" step="0.01" value={item.amount} onChange={(event) => setAssetItem(item.id, { amount: event.target.value })} required placeholder="0.00" /></Field>
                <Field label="Account Code"><select aria-label={`Asset ${assetIndex + 1} Account Code`} value={item.accountCode || 'A'} onChange={(event) => setAssetItem(item.id, { accountCode: event.target.value })}>{ACCOUNT_CODES.map((code) => <option key={code}>{code}</option>)}</select></Field>
              </div>
              {isDraftSubAsset ? <div className="proposal-work-information"><p className="proposal-item-context"><strong>Draft Sub Asset:</strong> {selectedAsset.assetId} · {selectedAsset.name}<br /><strong>Main Asset:</strong> {selectedAsset.parentAssetId}</p><div className={`proposal-treatment ${treatment === 'Capitalized' ? 'is-capitalized' : 'is-expense'}`}><strong>{treatment === 'Capitalized' ? 'Capitalized · Use existing Draft Sub Asset' : 'Expense · No Sub Asset activation'}</strong><p>{treatment === 'Capitalized' ? 'The Draft receives its real Sub Asset No. when the Proposal is approved.' : 'The total is THB 50,000 or less. Saving cancels the unused Draft and records Expense work on the Main Asset, retaining the temporary reference.'}</p></div></div> : null}
              {item.assetMode === 'existing' ? <div className="proposal-work-information"><div className="proposal-inline-field"><span id={`work-type-${item.id}`}>Work type <em>*</em></span><div className="proposal-radio-group" role="radiogroup" aria-labelledby={`work-type-${item.id}`}>{EXISTING_WORK_TYPES.map((type) => <label key={type.id}><input type="radio" name={`workType-${item.id}`} value={type.id} checked={item.workType === type.id} onChange={() => setAssetItem(item.id, { workType: type.id })} required />{type.label}</label>)}</div></div><div className="form-grid"><Field label="Work title"><input value={item.workName} onChange={(event) => setAssetItem(item.id, { workName: event.target.value })} placeholder="Defaults to Proposal Name" maxLength={120} /></Field><Field label="Work details"><input value={item.description} onChange={(event) => setAssetItem(item.id, { description: event.target.value })} placeholder="Describe work for this Asset" maxLength={240} /></Field></div></div> : null}
              <div className="proposal-budget-details">
                <div className="proposal-radio-group"><span>Budget Type <em>*</em></span>{BUDGET_TYPES.map((type) => <label key={type}><input type="radio" name={`budgetType-${item.id}`} checked={item.budgetType === type} onChange={() => setAssetItem(item.id, { budgetType: type })} required />{type === 'Capital expenditure' ? 'Investment' : type}</label>)}</div>
                <button type="button" className="proposal-add-row" aria-label={`Add cost row for Asset ${assetIndex + 1}`} onClick={() => setAssetItem(item.id, { costs: [...item.costs, createCostRow('Other cost')] })}><Icon name="plus" size={13} />Add Row</button>
                <div className="proposal-budget-table-wrap"><table className="proposal-budget-table proposal-additional-cost-table"><caption className="sr-only">Additional costs for Asset {assetIndex + 1}</caption><thead><tr><th>No.</th><th>Detail (รายการ)</th><th>Account Code</th><th>Budget (รวมเงิน)</th><th><span className="sr-only">Actions</span></th></tr></thead><tbody>{item.costs.map((cost, index) => <tr key={cost.id}>
                  <td>{index + 1}</td>
                  <td><input aria-label={`Asset ${assetIndex + 1} cost ${index + 1} Detail`} value={cost.description} onChange={(event) => setCost(item.id, cost.id, { description: event.target.value })} placeholder="e.g. Installation, Delivery" maxLength={100} required /></td>
                  <td><select aria-label={`Asset ${assetIndex + 1} cost ${index + 1} Account Code`} value={cost.accountCode || 'A'} onChange={(event) => setCost(item.id, cost.id, { accountCode: event.target.value })}>{ACCOUNT_CODES.map((code) => <option key={code}>{code}</option>)}</select></td>
                  <td><input aria-label={`Asset ${assetIndex + 1} cost ${index + 1} Budget`} type="number" min="0" step="0.01" value={cost.amount} onChange={(event) => setCost(item.id, cost.id, { amount: event.target.value })} placeholder="0.00" required /></td>
                  <td><button type="button" className="mis-cost-remove" aria-label={`Remove Asset ${assetIndex + 1} cost row ${index + 1}`} onClick={() => setAssetItem(item.id, { costs: item.costs.filter((row) => row.id !== cost.id) })}><Icon name="close" size={15} /></button></td>
                </tr>)}{!item.costs.length ? <tr><td colSpan={5}>No additional costs. Select Add Row to add costs for this Asset.</td></tr> : null}</tbody><tfoot><tr><td colSpan={3}>Additional costs (THB)</td><td>{formatTHB(additionalCosts)}</td><td /></tr></tfoot></table></div>
                <div className="mis-proposal-line-total"><span>Total (Asset amount + additional costs)</span><strong>฿ {formatTHB(getProposalItemTotal(item))}</strong></div>
              </div>
            </article>
          })}
          {!eligibleAssets.length ? <div className="mis-proposal-empty"><div><strong>{form.projectCode.trim() ? 'No eligible Assets linked to this Project Code' : 'Select a Project Code first'}</strong><p>Link an eligible Asset to this project in the Asset form, or select another Project Code.</p></div><button type="button" className="button button-secondary button-small" onClick={onAssets}>Go to Asset list</button></div> : null}
          <div className="proposal-all-assets-total"><div><strong>Proposal total</strong><span>{form.assetItems.length} Asset item{form.assetItems.length === 1 ? '' : 's'} · Base amount ฿ {formatTHB(baseTotal)} + Additional costs ฿ {formatTHB(additionalTotal)}</span></div><strong>฿ {formatTHB(proposalTotal)}</strong></div>
        </section>


        {error ? <div className="form-error" role="alert"><Icon name="alert" size={17} />{error}</div> : null}
        </div>
          <div className="movement-submit-bar create-asset-submit-bar"><span><Icon name="info" size={16} />Assets stay Draft until Proposal approval assigns their real Asset No.</span><div className="create-asset-submit-actions"><button type="button" className="button button-secondary" onClick={onBack}>Back</button><button type="submit" className="button button-primary" disabled={eligibleAssets.length === 0}><Icon name="check" size={16} />Save Proposal</button></div></div>
      </form>
      {browse === 'project' ? <dialog ref={projectDialogRef} className="proposal-project-dialog" aria-labelledby="proposal-project-title" onCancel={() => setBrowse(null)} onClose={() => setBrowse(null)}><div><h2 id="proposal-project-title">Select Project</h2><button type="button" aria-label="Close project selection" onClick={() => setBrowse(null)}><Icon name="close" size={18} /></button></div><input autoFocus aria-label="Search projects" placeholder="Search project code or name" value={browseQuery} onChange={(event) => setBrowseQuery(event.target.value)} /><div className="proposal-project-results">{projects.filter((project) => `${project.projectCode} ${project.projectName}`.toLowerCase().includes(browseQuery.toLowerCase())).map((project) => <button type="button" key={project.projectCode} onClick={() => { setField('projectCode', project.projectCode); setField('projectName', project.projectName); setBrowse(null) }}><strong>{project.projectCode}</strong><span>{project.projectName}</span></button>)}{projects.length === 0 ? <p>No saved projects. Create a project in Project Management, or enter the project code and name in this form.</p> : projects.every((project) => !`${project.projectCode} ${project.projectName}`.toLowerCase().includes(browseQuery.toLowerCase())) ? <p>No matching projects.</p> : null}</div></dialog> : null}
      {browse === 'part' ? <dialog ref={projectDialogRef} className="proposal-project-dialog" aria-labelledby="proposal-part-title" onCancel={() => setBrowse(null)} onClose={() => setBrowse(null)}>
        <div><h2 id="proposal-part-title">Select Part Number</h2><button type="button" aria-label="Close part selection" onClick={() => setBrowse(null)}><Icon name="close" size={18} /></button></div>
        <input autoFocus aria-label="Search parts" placeholder="Search Part Number, name or Model" value={browseQuery} onChange={(event) => setBrowseQuery(event.target.value)} />
        <div className="proposal-project-results">{matchingParts.map((part) => <button type="button" key={part.partNo} onClick={() => { setField('partNo', part.partNo); setBrowse(null) }}><strong>{part.partNo}</strong><span>{part.name}</span><span>Model: {part.model}</span></button>)}{matchingParts.length === 0 ? <p>No matching parts.</p> : null}</div>
        <small className="proposal-part-note">MIS mock part references</small>
      </dialog> : null}
      <div className="dashboard-footnote"><span className="footnote-dot" />Proposal and asset references are saved in this browser. No connection to MIS is made.</div>
    </div>
  )
}
