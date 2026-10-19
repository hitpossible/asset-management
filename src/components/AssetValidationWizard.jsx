import ActivationApprovalRoute from './ActivationApprovalRoute.jsx'
import { useRef, useState } from 'react'
import Icon from './Icon.jsx'
import MeasurementInput from './MeasurementInput.jsx'
import { POWER_UNITS, formatPower } from '../utils/powerUtils.js'
import AssetMatchSummary from './AssetMatchSummary.jsx'
import { getControlSheetInvoices, getControlSheetPageCount, getControlSheetAttachments } from '../utils/controlSheetUtils.js'
import { AssetControlSheet } from './AssetControlSheet.jsx'
import StatusBadge from './StatusBadge.jsx'
import { getAssetReferences } from '../utils/misReferenceUtils.js'
import { formatDate } from '../utils/assetUtils.js'
import './AssetValidationWizard.css'

const STEPS = ['Check information', 'Upload photographs', 'Preview control sheet']
const FIELDS = [['name', 'Asset name'], ['assetClass', 'Asset class'], ['model', 'Model'], ['custodian', 'Custodian'], ['plant', 'Plant'], ['location', 'Location'], ['line', 'Line'], ['power', 'Power'], ['area', 'Area (m²)'], ['targetSop', 'Target SOP']]
const FIELD_GROUPS = [
  { title: 'Asset identity', icon: 'box', keys: ['name', 'assetClass', 'model'] },
  { title: 'Assignment & location', icon: 'pin', keys: ['custodian', 'plant', 'location', 'line'] },
  { title: 'Technical information & SOP', icon: 'settings', keys: ['power', 'area', 'targetSop'] },
]

const PHOTOS = [['machine', 'Machine photographs', 'Show the complete machine and its installation.'], ['assetPlate', 'TBKK Asset Plate', 'Make the Asset number and registration date legible.'], ['machinePlate', 'Machine Plate', 'Show the manufacturer, model and serial number.'], ['specialPlate', 'Special Control Plate', 'Upload the control plate, or mark it not applicable.']]

async function readPhoto(file) {
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) throw new Error('Choose a JPG, PNG or WebP image.')
  if (file.size > 10 * 1024 * 1024) throw new Error('Each image must be 10 MB or smaller.')
  const bitmap = await createImageBitmap(file)
  try {
    const scale = Math.min(1, 1200 / Math.max(bitmap.width, bitmap.height))
    const canvas = document.createElement('canvas')
    canvas.width = Math.round(bitmap.width * scale)
    canvas.height = Math.round(bitmap.height * scale)
    const context = canvas.getContext('2d')
    context.fillStyle = '#fff'
    context.fillRect(0, 0, canvas.width, canvas.height)
    context.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
    return { name: file.name, url: canvas.toDataURL('image/jpeg', .75) }
  } finally { bitmap.close() }
}

export default function AssetValidationWizard({ row, activationWorkflow, activationWorkflowError = '', onComplete, onClose, onSaveDraft, receivingDetails }) {
  const saved = row.asset.validationDraft || row.asset.assetControlSheet || {}
  const [step, setStep] = useState(0)
  const approvalType = activationWorkflow
  const approvalTypeId = approvalType?.id || ''
  const [form, setForm] = useState(() => ({ area: row.asset.area ?? '', power: row.asset.power ?? '', powerUnit: row.asset.powerUnit || 'kW', confirmedSop: row.asset.targetSop || '', result: '', remark: '', maker: '', serialNo: '', investmentNo: '', manufacturingDate: '', registrationDate: '', specialControl: 'None', condition: 'Purchase', ...saved.form }))
  const [photos, setPhotos] = useState(saved.photos || {})
  const invoiceAttachments = getControlSheetAttachments(row, saved.invoiceAttachments || [])
  const invoices = getControlSheetInvoices(row)
  const previewSheets = getControlSheetPageCount(row, invoiceAttachments)
  const [specialNA, setSpecialNA] = useState(saved.specialNA || false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [busy, setBusy] = useState(false)
  const [reviewed, setReviewed] = useState(false)
  const heading = useRef(null)
  const pendingUpload = useRef(false)
  const complete = row.status === 'Validation Complete'
  const submittedWorkflow = row.asset.activationApproval
  const hasSubmittedWorkflow = Boolean(submittedWorkflow?.steps?.length && submittedWorkflow.state === 'Pending')
  const visibleWorkflow = hasSubmittedWorkflow
    ? { ...submittedWorkflow, name: submittedWorkflow.approvalTypeName || 'Submitted workflow' }
    : approvalType
  const workflowUnavailable = !hasSubmittedWorkflow && (Boolean(activationWorkflowError) || !approvalType?.steps?.length)
  const workflowSummary = workflowUnavailable
    ? activationWorkflowError || 'No approval workflow is assigned.'
    : hasSubmittedWorkflow
      ? `Submitted with ${visibleWorkflow.name}`
      : `Assigned: ${approvalType.name} · ${approvalType.steps.length} ${approvalType.steps.length === 1 ? 'approval level' : 'approval levels'}${complete ? ' · starts after all linked PO checks are complete' : ''}`
  const requiredFields = row.asset.ownershipType === 'customer' ? [...FIELDS, ['customerName', 'Customer name']] : FIELDS
  const missingFields = requiredFields.filter(([key]) => !String(row.asset[key] || '').trim())
  const assetReady = row.canComplete && !missingFields.length
  const infoReady = assetReady && form.confirmedSop && form.result === 'Complete'
  const photosReady = photos.machine?.length && photos.assetPlate?.length && photos.machinePlate?.length && (specialNA || photos.specialPlate?.length)
  const snapshot = () => ({ form, photos, specialNA, approvalTypeId, invoiceAttachments, registrationData: {
    assetValue: row.asset.acquisitionValue ?? row.asset.assetValue ?? row.matchSummary?.poAmount,
    orderedQuantity: row.matchSummary?.orderedQuantity,
    unitOfMeasure: row.purchaseOrderLines?.find((item) => item.assetId === row.assetId)?.unitOfMeasure || '',
  } })
  function go(next) { setStep(next); setError(''); if (next === 2) setReviewed(false); heading.current?.focus() }
  function measurementsValid() {
    if (['area', 'power'].some((key) => String(form[key] ?? '').trim() !== '' && (!Number.isFinite(Number(form[key])) || Number(form[key]) < 0))) {
      setError('Enter zero or a positive number for installation area and power rating, or leave the fields blank.')
      return false
    }
    return true
  }
  function next() {
    if (step === 1 && !measurementsValid()) return
    if (step === 0 && !assetReady) { setError('Complete the Asset information and receiving requirements before continuing.'); return }
    if (step === 1 && !infoReady) { setError('Enter the Confirmed / Estimated SOP and set the verification result to Complete before previewing.'); return }
    if (step === 1 && !photosReady) { setError('Upload machine, Asset Plate and Machine Plate photographs. Upload the Special Control Plate or mark it not applicable.'); return }
    go(step + 1)
  }
  async function upload(key, files) {
    if (!files.length || pendingUpload.current) return
    pendingUpload.current = true
    setBusy(true); setError('')
    try {
      const selected = key === 'machine' ? [...files] : [files[0]]
      if (key === 'machine' && (photos.machine?.length || 0) + selected.length > 3) throw new Error('Upload up to three machine photographs. Remove a photograph before adding another.')
      const images = await Promise.all(selected.map(readPhoto))
      setPhotos((current) => ({ ...current, [key]: key === 'machine' ? [...(current.machine || []), ...images] : images }))
      setReviewed(false)
    } catch (err) { setError(err.message || 'This image could not be opened. Choose another image.') }
    finally { pendingUpload.current = false; setBusy(false) }
  }
  return <>
    <div className="mis-validation-detail-header"><span className="validation-asset-icon"><Icon name="conveyor" size={40} /></span><div className="validation-header-copy"><span className="page-eyebrow">Asset Validation · {row.poNo}</span><h2 id="asset-validation-detail-title" tabIndex={-1} ref={heading}>{row.asset.name}</h2><p>{row.asset.assetId}{row.itemNumbers ? ` · PO item ${row.itemNumbers}` : ''}</p></div><StatusBadge status={row.status} /><button autoFocus className="modal-close" type="button" aria-label="Close Asset Validation details" onClick={onClose}><Icon name="close" size={17} /></button></div>
    <nav className="validation-wizard-steps" aria-label="Asset validation steps">{STEPS.map((label, index) => <button key={label} type="button" aria-current={step === index ? 'step' : undefined} disabled={index > step} onClick={() => go(index)}><span>{index < step ? <Icon name="check" size={18} /> : index + 1}</span><div><strong>{label}</strong><small>{['Verify the received Asset', 'Verification details and photographs', 'Review before approval'][index]}</small></div></button>)}</nav>
    <div className={`validation-workflow-summary${workflowUnavailable ? ' is-error' : ''}`} role="status">
      <Icon name={workflowUnavailable ? 'alert' : 'check'} size={19} />
      <div><strong>Approval workflow</strong><span>{workflowSummary}</span><small>Managed in Approval Management → Transaction workflows</small></div>
    </div>
    {row.asset.correctionComment ? <p className="mis-validation-hold-note">Returned for correction: {row.asset.correctionComment}</p> : null}
    {error ? <p className="mis-validation-hold-note" role="alert">{error}</p> : null}{notice ? <p className="mis-validation-complete-note" role="status">{notice}</p> : null}
    {step === 0 ? <div className="validation-wizard-info validation-check-information">
      <div className={`validation-check-readiness ${assetReady || complete ? 'is-ready' : 'needs-attention'}`}>
        <Icon name={assetReady || complete ? 'circle-check' : 'alert'} size={22} />
        <div><strong>{assetReady || complete ? 'Ready for Asset verification' : 'Information needs attention'}</strong><p>{assetReady || complete ? 'Review the Asset details and receiving references, then continue to photographs.' : 'Review the highlighted information and receiving requirements below before continuing.'}</p></div>
      </div>
      <section className="asset-validation-data-section validation-asset-overview">
        <div className="asset-validation-data-heading"><span className="validation-card-icon validation-icon-red"><Icon name="box" size={22} /></span><div><h3>Asset information</h3><p>Current Asset record · read only</p></div></div>
        <div className="validation-information-groups">{FIELD_GROUPS.map((group) => <section className="validation-information-group" key={group.title}>
          <h4><Icon name={group.icon} size={17} />{group.title}</h4>
          <dl className="validation-asset-fields">{FIELDS.filter(([key]) => group.keys.includes(key)).map(([key, label]) => <div key={key} className={!String(row.asset[key] || '').trim() ? 'validation-information-missing' : ''}><dt>{label}</dt><dd>{row.asset[key] ? key === 'targetSop' ? formatDate(row.asset[key]) : key === 'power' ? formatPower(row.asset.power, row.asset.powerUnit) : row.asset[key] : <><Icon name="alert" size={14} />Missing information</>}</dd></div>)}</dl>
        </section>)}</div>
        {row.asset.ownershipType === 'customer' ? <dl className="validation-check-customer"><dt>Customer</dt><dd>{row.asset.customerName || 'Missing information'}</dd></dl> : null}
        {missingFields.length ? <p className="mis-validation-hold-note">Missing: {missingFields.map(([, label]) => label).join(', ')}. Update the Asset record before submission.</p> : null}
      </section>
      <section className="asset-validation-data-section validation-check-receiving"><div className="asset-validation-data-heading"><span className="validation-card-icon validation-icon-blue"><Icon name="truck" size={22} /></span><div><h3>Receiving validation summary</h3><p>Proposal and purchasing references for this Asset</p></div></div>
      <dl className="validation-proposal-meta" aria-label="Proposal and vendor information">
        <div className="validation-meta-item"><dt><span className="validation-meta-icon"><Icon name="file" size={19} /></span>Proposal</dt><dd className="validation-meta-proposals">{row.matchSummary.proposalNumbers.length ? row.matchSummary.proposalNumbers.map((number) => <span className="validation-proposal-number" key={number}>{number}</span>) : <span className="validation-meta-empty">Not recorded</span>}</dd></div>
        <div className="validation-meta-item"><dt><span className="validation-meta-icon"><Icon name="circle-check" size={19} /></span>Status</dt><dd className="validation-meta-status">{row.matchSummary.proposalStatus === 'Not recorded' ? <span className="validation-meta-empty">Not recorded</span> : row.matchSummary.proposalStatus.split(', ').map((status) => <StatusBadge key={status} status={status} />)}</dd></div>
        <div className="validation-meta-item"><dt><span className="validation-meta-icon"><Icon name="factory" size={19} /></span>Vendor</dt><dd className={row.matchSummary.vendor === 'Not recorded' ? 'validation-meta-empty' : 'validation-meta-vendor'}>{row.matchSummary.vendor}</dd></div>
      </dl>
      <AssetMatchSummary row={row} />{row.issues.length ? <p className="mis-validation-hold-note">{row.issues.join(' ')}</p> : null}<details className="validation-check-documents"><summary><Icon name="file" size={18} /><span>View purchasing & receiving documents<small>{row.invoiceReferences.length} Invoice reference(s) · {row.goodsReceiptReferences.length} GR reference(s)</small></span><Icon name="chevron" size={18} /></summary><div className="validation-receiving-references">{receivingDetails}</div></details></section></div> : null}
    {step === 1 ? <section className="validation-upload-section"><section className="asset-validation-data-section"><h3>Verification information</h3>
      <div className="validation-form-grid">{[['area', 'Area (m²)', 'm²'], ['power', 'Power', 'kW']].map(([key, label, unit]) => <label key={key}>{label}<MeasurementInput unit={key === 'power' ? form.powerUnit || 'kW' : unit} units={key === 'power' ? POWER_UNITS : undefined} onUnitChange={(event) => { setForm({ ...form, powerUnit: event.target.value }); setReviewed(false) }} aria-label={label} value={form[key]} disabled={complete} placeholder="Not entered" onChange={(event) => { setForm({ ...form, [key]: event.target.value }); setReviewed(false) }} /></label>)}{[['confirmedSop', 'Confirmed / Estimated SOP', 'date'], ['maker', 'Maker', 'text'], ['serialNo', 'Serial number', 'text'], ['investmentNo', 'Investment number', 'text'], ['manufacturingDate', 'Manufacturing date', 'date'], ['registrationDate', 'Registration date', 'date']].map(([key, label, type]) => <label key={key}>{label}{key === 'confirmedSop' ? ' *' : ''}<input type={type} value={form[key]} disabled={complete} onChange={(event) => { setForm({ ...form, [key]: event.target.value }); setReviewed(false) }} /></label>)}<label>Special control item<select value={form.specialControl} disabled={complete} onChange={(event) => setForm({ ...form, specialControl: event.target.value })}>{['None', 'BOI', 'E/L', 'Customer Asset', 'Other'].map((value) => <option key={value}>{value}</option>)}</select></label><label>Condition<select value={form.condition} disabled={complete} onChange={(event) => setForm({ ...form, condition: event.target.value })}>{['Purchase', 'Leasing', 'Rental', 'Other'].map((value) => <option key={value}>{value}</option>)}</select></label><label>Verification result *<select value={form.result} disabled={complete} onChange={(event) => setForm({ ...form, result: event.target.value })}><option value="">Select result</option><option>Complete</option><option>Mismatch</option></select></label><label className="validation-field-wide">Comment / Remark<textarea value={form.remark} disabled={complete} rows={3} onChange={(event) => setForm({ ...form, remark: event.target.value })} /></label></div></section><h3>Asset photographs & identification plates</h3><p>JPG, PNG or WebP · up to 10 MB per image · up to 3 machine views.</p><div className="validation-upload-grid">{PHOTOS.map(([key, label, hint]) => <section className="validation-upload-card" key={key}><h4>{label}</h4><p>{hint}</p>{key === 'specialPlate' ? <label className="validation-na"><input type="checkbox" checked={specialNA} disabled={complete || busy} onChange={(event) => { setSpecialNA(event.target.checked); setReviewed(false) }} />Not applicable to this Asset</label> : null}{key === 'specialPlate' && specialNA ? <div className="validation-upload-empty">Special Control Plate: not applicable</div> : <><div className="validation-upload-thumbnails">{(photos[key] || []).map((photo, index) => <figure key={index}><img src={photo.url} alt={`${label} ${index + 1}`} /><figcaption>{photo.name}</figcaption>{!complete ? <button type="button" disabled={busy} aria-label={`Remove ${photo.name}`} onClick={() => { setPhotos({ ...photos, [key]: photos[key].filter((_, i) => i !== index) }); setReviewed(false) }}><Icon name="close" size={16} /></button> : null}</figure>)}</div>{!complete ? <label className="validation-upload-picker"><Icon name="plus" size={20} /><span>{photos[key]?.length ? key === 'machine' ? 'Add machine view' : 'Replace photograph' : 'Choose photograph'}</span><input type="file" accept="image/jpeg,image/png,image/webp" multiple={key === 'machine'} disabled={busy} onChange={(event) => { upload(key, event.target.files); event.target.value = '' }} /></label> : null}</>}</section>)}</div>{busy ? <p role="status">Preparing files…</p> : null}</section> : null}
    {step === 2 ? <section className="validation-preview-section"><div className="validation-preview-heading"><div><h3>Preview Asset Control Sheet</h3><p>Review Asset Details, the Register Form, the Control Sheet and all Invoice documents before submitting.</p></div><span>{previewSheets} preview sheets · A4</span></div><AssetControlSheet row={row} form={form} photos={photos} specialNA={specialNA} invoiceAttachments={invoiceAttachments} /><section className="asset-validation-data-section"><h3>Approval route</h3><p className="asset-approval-field-hint">Asset Activation → <strong>{visibleWorkflow?.name || 'Not assigned'}</strong></p>{workflowUnavailable ? <p className="form-error" role="alert">{activationWorkflowError || 'Assign an available approval workflow before submitting.'}</p> : null}{visibleWorkflow?.steps?.length ? <ActivationApprovalRoute steps={visibleWorkflow.steps} /> : <p className="asset-approval-field-hint">No approval route is available.</p>}</section><label className="validation-review-confirm"><input type="checkbox" checked={reviewed} onChange={(event) => setReviewed(event.target.checked)} />I have reviewed the Asset Control Sheet and confirm the information, photographs and Invoice documents are correct.</label></section> : null}
    <div className="validation-wizard-footer"><div>{!complete ? <button type="button" className="button button-secondary" disabled={busy} onClick={() => { if (!measurementsValid()) return; onSaveDraft(row.assetId, snapshot()); setNotice('Validation draft saved. You can continue later.') }}>Save draft</button> : <span>This PO verification is complete.</span>}</div><div>{step > 0 ? <button type="button" className="button button-secondary" disabled={busy} onClick={() => go(step - 1)}>Back</button> : null}{step < 2 ? <button type="button" className="button button-primary" disabled={busy} onClick={complete ? () => go(step + 1) : next}>{step === 0 ? 'Next: Upload photographs' : 'Next: Preview control sheet'}<Icon name="chevron" size={16} /></button> : !complete ? <button type="button" className="button button-primary" disabled={!infoReady || !photosReady || !reviewed || busy || Boolean(activationWorkflowError) || !approvalType?.steps.length || approvalType.steps.some((item) => item.available === false)} onClick={() => onComplete({ ...row, approvalTypeId, assetControlSheet: { ...snapshot(), documentAsset: { ...Object.fromEntries([...new Set(['assetId', 'ownershipType', 'customerName', 'vendor', 'temporaryReference', 'parentAssetId', 'acquisitionValue', 'assetValue', 'acquisitionDate', 'warrantyDate', 'accountCode', 'costCenter', 'depreciationProfile', 'depreciationStartDate', 'rfqNo', 'partNo', 'powerUnit', ...FIELDS.map(([key]) => key)])].map((key) => [key, row.asset[key]])), ...getAssetReferences(row.asset), invoiceReferences: invoices.map(({ attachment, attachments, ...invoice }) => invoice) }, purchaseOrder: { poNo: row.poNo, vendor: row.purchaseOrder?.vendor || row.asset.vendor || '' }, reviewedAt: new Date().toISOString() } })}><Icon name="check" size={17} />Submit for Approval</button> : <button type="button" className="button button-secondary" onClick={onClose}>Close</button>}</div></div>
  </>
}
