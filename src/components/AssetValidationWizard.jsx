import { useRef, useState } from 'react'
import Icon from './Icon.jsx'
import AssetMatchSummary from './AssetMatchSummary.jsx'
import { AssetControlSheet } from './AssetControlSheet.jsx'
import StatusBadge from './StatusBadge.jsx'
import { getAssetReferences } from '../utils/misReferenceUtils.js'

const STEPS = ['Check information', 'Upload photographs', 'Preview control sheet']
const FIELDS = [['name', 'Asset name'], ['assetClass', 'Asset class'], ['model', 'Model'], ['custodian', 'Custodian'], ['plant', 'Plant'], ['location', 'Location'], ['line', 'Line'], ['power', 'Power'], ['area', 'Area'], ['targetSop', 'Target SOP']]
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

export default function AssetValidationWizard({ row, onComplete, onClose, onSaveDraft, receivingDetails }) {
  const saved = row.asset.validationDraft || row.asset.assetControlSheet || {}
  const [step, setStep] = useState(0)
  const [form, setForm] = useState(() => ({ confirmedSop: row.asset.targetSop || '', result: '', remark: '', maker: '', serialNo: '', investmentNo: '', manufacturingDate: '', registrationDate: '', specialControl: 'None', condition: 'Purchase', ...saved.form }))
  const [photos, setPhotos] = useState(saved.photos || {})
  const [specialNA, setSpecialNA] = useState(saved.specialNA || false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [busy, setBusy] = useState(false)
  const [reviewed, setReviewed] = useState(false)
  const heading = useRef(null)
  const pendingUpload = useRef(false)
  const complete = row.status === 'Validation Complete'
  const requiredFields = row.asset.ownershipType === 'customer' ? [...FIELDS, ['customerName', 'Customer name']] : FIELDS
  const missingFields = requiredFields.filter(([key]) => !String(row.asset[key] || '').trim())
  const assetReady = row.canComplete && !missingFields.length
  const infoReady = assetReady && form.confirmedSop && form.result === 'Complete'
  const photosReady = photos.machine?.length && photos.assetPlate?.length && photos.machinePlate?.length && (specialNA || photos.specialPlate?.length)
  const snapshot = () => ({ form, photos, specialNA })
  function go(next) { setStep(next); setError(''); if (next === 2) setReviewed(false); heading.current?.focus() }
  function next() {
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
    {row.asset.correctionComment ? <p className="mis-validation-hold-note">Returned for correction: {row.asset.correctionComment}</p> : null}
    {error ? <p className="mis-validation-hold-note" role="alert">{error}</p> : null}{notice ? <p className="mis-validation-complete-note" role="status">{notice}</p> : null}
    {step === 0 ? <div className="validation-wizard-info"><div><section className="asset-validation-data-section validation-asset-overview"><div className="asset-validation-data-heading"><span className="validation-card-icon validation-icon-red"><Icon name="box" size={22} /></span><div><h3>Asset information</h3></div></div><dl className="validation-asset-fields">{FIELDS.map(([key, label]) => <div key={key}><dt>{label}</dt><dd>{row.asset[key] || 'Missing information'}</dd></div>)}{row.asset.ownershipType === 'customer' ? <div><dt>Customer</dt><dd>{row.asset.customerName}</dd></div> : null}</dl>{missingFields.length ? <p className="mis-validation-hold-note">Missing: {missingFields.map(([, label]) => label).join(', ')}. Update the Asset record before submission.</p> : null}</section><section className="asset-validation-data-section"><h3>Receiving validation summary</h3>
      <dl className="validation-proposal-meta" aria-label="Proposal and vendor information">
        <div className="validation-meta-item"><dt><span className="validation-meta-icon"><Icon name="file" size={19} /></span>Proposal</dt><dd className="validation-meta-proposals">{row.matchSummary.proposalNumbers.length ? row.matchSummary.proposalNumbers.map((number) => <span className="validation-proposal-number" key={number}>{number}</span>) : <span className="validation-meta-empty">Not recorded</span>}</dd></div>
        <div className="validation-meta-item"><dt><span className="validation-meta-icon"><Icon name="circle-check" size={19} /></span>Status</dt><dd className="validation-meta-status">{row.matchSummary.proposalStatus === 'Not recorded' ? <span className="validation-meta-empty">Not recorded</span> : row.matchSummary.proposalStatus.split(', ').map((status) => <StatusBadge key={status} status={status} />)}</dd></div>
        <div className="validation-meta-item"><dt><span className="validation-meta-icon"><Icon name="factory" size={19} /></span>Vendor</dt><dd className={row.matchSummary.vendor === 'Not recorded' ? 'validation-meta-empty' : 'validation-meta-vendor'}>{row.matchSummary.vendor}</dd></div>
      </dl>
      <AssetMatchSummary row={row} />{row.issues.length ? <p className="mis-validation-hold-note">{row.issues.join(' ')}</p> : null}<div className="validation-receiving-references">{receivingDetails}</div></section></div></div> : null}
    {step === 1 ? <section className="validation-upload-section"><section className="asset-validation-data-section"><h3>Verification information</h3><div className="validation-form-grid">{[['confirmedSop', 'Confirmed / Estimated SOP', 'date'], ['maker', 'Maker', 'text'], ['serialNo', 'Serial number', 'text'], ['investmentNo', 'Investment number', 'text'], ['manufacturingDate', 'Manufacturing date', 'date'], ['registrationDate', 'Registration date', 'date']].map(([key, label, type]) => <label key={key}>{label}{key === 'confirmedSop' ? ' *' : ''}<input type={type} value={form[key]} disabled={complete} onChange={(event) => { setForm({ ...form, [key]: event.target.value }); setReviewed(false) }} /></label>)}<label>Special control item<select value={form.specialControl} disabled={complete} onChange={(event) => setForm({ ...form, specialControl: event.target.value })}>{['None', 'BOI', 'E/L', 'Customer Asset', 'Other'].map((value) => <option key={value}>{value}</option>)}</select></label><label>Condition<select value={form.condition} disabled={complete} onChange={(event) => setForm({ ...form, condition: event.target.value })}>{['Purchase', 'Leasing', 'Rental', 'Other'].map((value) => <option key={value}>{value}</option>)}</select></label><label>Verification result *<select value={form.result} disabled={complete} onChange={(event) => setForm({ ...form, result: event.target.value })}><option value="">Select result</option><option>Complete</option><option>Mismatch</option></select></label><label className="validation-field-wide">Comment / Remark<textarea value={form.remark} disabled={complete} rows={3} onChange={(event) => setForm({ ...form, remark: event.target.value })} /></label></div></section><h3>Asset photographs & identification plates</h3><p>JPG, PNG or WebP · up to 10 MB per image · up to 3 machine views.</p><div className="validation-upload-grid">{PHOTOS.map(([key, label, hint]) => <section className="validation-upload-card" key={key}><h4>{label}</h4><p>{hint}</p>{key === 'specialPlate' ? <label className="validation-na"><input type="checkbox" checked={specialNA} disabled={complete || busy} onChange={(event) => { setSpecialNA(event.target.checked); setReviewed(false) }} />Not applicable to this Asset</label> : null}{key === 'specialPlate' && specialNA ? <div className="validation-upload-empty">Special Control Plate: not applicable</div> : <><div className="validation-upload-thumbnails">{(photos[key] || []).map((photo, index) => <figure key={index}><img src={photo.url} alt={`${label} ${index + 1}`} /><figcaption>{photo.name}</figcaption>{!complete ? <button type="button" disabled={busy} aria-label={`Remove ${photo.name}`} onClick={() => { setPhotos({ ...photos, [key]: photos[key].filter((_, i) => i !== index) }); setReviewed(false) }}><Icon name="close" size={16} /></button> : null}</figure>)}</div>{!complete ? <label className="validation-upload-picker"><Icon name="plus" size={20} /><span>{photos[key]?.length ? key === 'machine' ? 'Add machine view' : 'Replace photograph' : 'Choose photograph'}</span><input type="file" accept="image/jpeg,image/png,image/webp" multiple={key === 'machine'} disabled={busy} onChange={(event) => { upload(key, event.target.files); event.target.value = '' }} /></label> : null}</>}</section>)}</div>{busy ? <p role="status">Preparing photographs…</p> : null}</section> : null}
    {step === 2 ? <section className="validation-preview-section"><div className="validation-preview-heading"><div><h3>Preview Asset Control Sheet</h3><p>Review both pages and uploaded photographs before submitting.</p></div><span>2 pages · A4</span></div><AssetControlSheet row={row} form={form} photos={photos} specialNA={specialNA} /><label className="validation-review-confirm"><input type="checkbox" checked={reviewed} onChange={(event) => setReviewed(event.target.checked)} />I have reviewed the Asset Control Sheet and confirm the information and photographs are correct.</label></section> : null}
    <div className="validation-wizard-footer"><div>{!complete ? <button type="button" className="button button-secondary" disabled={busy} onClick={() => { onSaveDraft(row.assetId, snapshot()); setNotice('Validation draft saved. You can continue later.') }}>Save draft</button> : <span>This PO verification is complete.</span>}</div><div>{step > 0 ? <button type="button" className="button button-secondary" disabled={busy} onClick={() => go(step - 1)}>Back</button> : null}{step < 2 ? <button type="button" className="button button-primary" disabled={busy} onClick={complete ? () => go(step + 1) : next}>{step === 0 ? 'Next: Upload photographs' : 'Next: Preview control sheet'}<Icon name="chevron" size={16} /></button> : !complete ? <button type="button" className="button button-primary" disabled={!infoReady || !photosReady || !reviewed || busy} onClick={() => onComplete({ ...row, assetControlSheet: { ...snapshot(), documentAsset: { ...Object.fromEntries([...new Set(['assetId', 'ownershipType', 'customerName', 'vendor', ...FIELDS.map(([key]) => key)])].map((key) => [key, row.asset[key]])), ...getAssetReferences(row.asset) }, purchaseOrder: { poNo: row.poNo, vendor: row.purchaseOrder?.vendor || row.asset.vendor || '' }, reviewedAt: new Date().toISOString() } })}><Icon name="check" size={17} />Submit for Approval</button> : <button type="button" className="button button-secondary" onClick={onClose}>Close</button>}</div></div>
  </>
}
