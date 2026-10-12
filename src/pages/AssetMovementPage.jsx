import { isCustomerAsset } from '../utils/assetOwnershipUtils.js'
import { useMemo, useState } from 'react'
import Icon from '../components/Icon.jsx'
import { Field, PageHeading } from '../components/common.jsx'
import { ASSET_LINES, ASSET_LOCATIONS, BUILDINGS } from '../data/assetOptions.js'

const REASONS = ['Relocation', 'Repair', 'Replacement', 'Project Use', 'Other']
const TRANSFER_APPROVAL_STEPS = [
  'Requester Manager Approval',
  'Destination Department Leader Approval',
  'Asset Team Acknowledgement',
]

function localDate() {
  const date = new Date()
  return new Date(date.getTime() - date.getTimezoneOffset() * 60_000).toISOString().slice(0, 10)
}

function FieldSection({ icon, iconClass = '', title, description, children }) {
  return (
    <section className="panel form-section movement-section">
      <div className="form-section-heading">
        <span className={`form-section-icon ${iconClass}`}><Icon name={icon} size={18} /></span>
        <div><h2>{title}</h2>{description ? <p>{description}</p> : null}</div>
      </div>
      {children}
    </section>
  )
}

function movementLabel(asset) {
  return [asset.assetId, asset.name].filter(Boolean).join(' · ')
}

function displayValue(value) {
  return value && value !== '—' ? value : '—'
}

function optionsWithExisting(options, values) {
  return [...new Set([...options, ...values.filter((value) => value && value !== '—')])]
}

function getDefaultDestinationLine(asset, assets) {
  if (!asset) return ''
  const currentLine = String(asset.line || '').toLowerCase()
  return [...assets.map((item) => item.line), ...ASSET_LINES]
    .find((line) => line && line !== '—' && String(line).toLowerCase() !== currentLine) || ''
}

function getSamplePhoto(asset) {
  return asset ? { name: `${asset.assetId}_current.jpg`, type: 'image/jpeg', isSample: true } : null
}

export default function AssetMovementPage({ assets, lifecycleEvents, initialAssetId = '', onSave, onMovements }) {
  const activeAssets = useMemo(() => assets.filter((asset) => asset.status === 'Active' && !isCustomerAsset(asset)), [assets])
  const unavailableAssetIds = useMemo(() => new Set(lifecycleEvents
    .filter((event) => event.type === 'transfer' && event.status === 'Pending Approval')
    .map((event) => event.assetId)), [lifecycleEvents])
  const selectableAssets = activeAssets.filter((asset) => !unavailableAssetIds.has(asset.assetId))
  const initialAsset = initialAssetId
    ? selectableAssets.find((asset) => asset.assetId === initialAssetId) || null
    : selectableAssets[0] || null
  const [selectedAssetId, setSelectedAssetId] = useState(() => initialAsset?.assetId || '')
  const [assetSearch, setAssetSearch] = useState(() => initialAsset ? movementLabel(initialAsset) : '')
  const [searchOpen, setSearchOpen] = useState(false)
  const [requestDate, setRequestDate] = useState(localDate)
  const [serialNo, setSerialNo] = useState(() => initialAsset ? initialAsset.serialNo || `SN-${initialAsset.assetId}` : '')
  const [photo, setPhoto] = useState(() => getSamplePhoto(initialAsset))
  const [photoInputKey, setPhotoInputKey] = useState(0)
  const [destinationLine, setDestinationLine] = useState(() => getDefaultDestinationLine(initialAsset, assets))
  const [destinationLocation, setDestinationLocation] = useState(() => initialAsset?.location || '')
  const [destinationBuilding, setDestinationBuilding] = useState(() => initialAsset?.plant || '')
  const [reasons, setReasons] = useState(() => initialAsset ? ['Relocation'] : [])
  const [otherReason, setOtherReason] = useState('')
  const [physicalCondition, setPhysicalCondition] = useState(() => initialAsset ? 'Good' : '')
  const [assetTag, setAssetTag] = useState(() => initialAsset ? 'Available' : '')
  const [accessories, setAccessories] = useState(() => initialAsset ? 'Complete' : '')
  const [remark, setRemark] = useState(() => initialAsset ? 'Relocation to support production line allocation.' : '')
  const [formError, setFormError] = useState(() => initialAssetId && !initialAsset
    ? 'This Asset is unavailable for transfer. It must be Active and have no transfer request pending approval.'
    : '')
  const [showReview, setShowReview] = useState(false)

  const selectedAsset = assets.find((asset) => asset.assetId === selectedAssetId) || null
  const locationOptions = useMemo(() => optionsWithExisting(ASSET_LOCATIONS, assets.map((asset) => asset.location)), [assets])
  const zoneOptions = useMemo(() => optionsWithExisting(ASSET_LINES, assets.map((asset) => asset.line)), [assets])
  const buildingOptions = useMemo(() => optionsWithExisting(BUILDINGS, assets.map((asset) => asset.plant)), [assets])
  const matchingAssets = selectableAssets.filter((asset) => {
    const query = assetSearch.trim().toLowerCase()
    if (!query) return true
    const searchable = [asset.assetId, asset.name, asset.model, asset.assetClass].join(' ').toLowerCase()
    return query.split(/[·\s]+/).filter(Boolean).every((term) => searchable.includes(term))
  })
  const from = selectedAsset ? {
    plant: selectedAsset.plant || '',
    location: selectedAsset.location || '',
    line: selectedAsset.line && selectedAsset.line !== '—' ? selectedAsset.line : '',
  } : null
  const effectiveDestination = selectedAsset ? {
    plant: destinationBuilding || selectedAsset.plant || '',
    location: destinationLocation.trim() || selectedAsset.location || '',
    line: destinationLine.trim(),
  } : null

  function populateFromAsset(asset) {
    setSelectedAssetId(asset.assetId)
    setAssetSearch(movementLabel(asset))
    setDestinationBuilding(asset.plant || '')
    setDestinationLocation(asset.location || '')
    setDestinationLine(getDefaultDestinationLine(asset, assets))
    setSerialNo(asset.serialNo || `SN-${asset.assetId}`)
    setPhoto(getSamplePhoto(asset))
    setPhotoInputKey((current) => current + 1)
    setReasons(['Relocation'])
    setOtherReason('')
    setPhysicalCondition('Good')
    setAssetTag('Available')
    setAccessories('Complete')
    setRemark('Relocation to support production line allocation.')
  }

  function chooseAsset(asset) {
    populateFromAsset(asset)
    setSearchOpen(false)
    setFormError('')
  }

  function toggleReason(reason) {
    setReasons((current) => current.includes(reason) ? current.filter((item) => item !== reason) : [...current, reason])
    setFormError('')
  }

  function reviewRequest(event) {
    event.preventDefault()
    if (!selectedAsset || isCustomerAsset(selectedAsset) || selectedAsset.status !== 'Active') {
      setFormError('Select an active asset before continuing.')
      return
    }
    if (!photo) {
      setFormError('Attach a current asset photo before continuing.')
      return
    }
    if (!destinationLine.trim()) {
      setFormError('Enter the destination production line.')
      return
    }
    if (destinationLine.trim().toLowerCase() === from.line.trim().toLowerCase()) {
      setFormError('Choose a destination line different from the current line.')
      return
    }
    if (!reasons.length) {
      setFormError('Select at least one reason for movement.')
      return
    }
    if (reasons.includes('Other') && !otherReason.trim()) {
      setFormError('Describe the reason for movement when Other is selected.')
      return
    }
    if (!physicalCondition || !assetTag || !accessories) {
      setFormError('Complete all three condition checks before continuing.')
      return
    }
    setFormError('')
    setShowReview(true)
  }

  function submitRequest() {
    const transfer = {
      assetId: selectedAsset.assetId,
      assetName: selectedAsset.name,
      type: 'transfer',
      title: `Transfer to ${effectiveDestination.line}`,
      occurredOn: requestDate,
      from,
      to: effectiveDestination,
      serialNo: serialNo.trim(),
      quantity: 1,
      unit: 'EA',
      photoName: photo?.name || '',
      photoType: photo?.type || '',
      photoIsSample: Boolean(photo?.isSample),
      reasons,
      otherReason: otherReason.trim(),
      conditionCheck: { physicalCondition, assetTag, accessories },
      remark: remark.trim(),
      approvalSteps: TRANSFER_APPROVAL_STEPS,
      currentApprovalStep: 0,
      approvalHistory: [],
      status: 'Pending Approval',
    }
    onSave(transfer)
    onMovements()
  }

  return (
    <div className="create-asset-workspace movement-asset-workspace">
      <PageHeading eyebrow="Asset management" title="Movement asset" description="Request an Asset transfer to another production line." action={<button type="button" className="button button-secondary" onClick={onMovements}>Assets in movement</button>} />
      <form className="create-asset-form movement-form" onSubmit={reviewRequest}>
        <div className="create-layout">
        <div className="form-main-column">
        <section className="panel movement-document-bar">
          <div><span>Document no.</span><strong>Generated after submission</strong></div>
          <Field label="Request date" required><input type="date" value={requestDate} onChange={(event) => { setRequestDate(event.target.value); setFormError('') }} required /></Field>
          <div><span>Workflow</span><strong>Request <i>→</i> Approval <i>→</i> Complete</strong></div>
        </section>

        <FieldSection icon="box" title="Asset information" description="Select the active Asset to move.">
          <div className="movement-asset-search-wrap" onBlur={(event) => { if (!event.currentTarget.contains(event.relatedTarget)) setSearchOpen(false) }}>
            <Field label="Find asset or machine" required>
              <div className="movement-search-control">
                <input type="search" value={assetSearch} placeholder="Search asset no., name or model..." aria-label="Search asset or machine" autoComplete="off" onFocus={() => setSearchOpen(true)} onChange={(event) => { setAssetSearch(event.target.value); setSelectedAssetId(''); setSearchOpen(true); setFormError('') }} required />
                <Icon name="search" size={17} />
              </div>
            </Field>
            {searchOpen ? <div className="movement-search-results">
              {matchingAssets.length ? matchingAssets.map((asset) => <button type="button" key={asset.assetId} onClick={() => chooseAsset(asset)}><strong>{asset.assetId}</strong><span>{asset.name}</span><small>{asset.model || asset.assetClass} · {asset.line || 'No line'}</small></button>) : <div className="movement-search-empty">{activeAssets.length && !selectableAssets.length ? 'All Active Assets already have a transfer request pending approval.' : activeAssets.length ? 'No matching Active Assets available.' : 'No Active Assets available for transfer.'}</div>}
            </div> : null}
          </div>

          <div className="form-grid movement-asset-grid">
            <Field label="Asset code"><input value={selectedAsset?.assetId || ''} placeholder="Auto-filled from Asset" readOnly /></Field>
            <Field label="Asset description"><input value={selectedAsset ? `${selectedAsset.name}${selectedAsset.model ? ` · ${selectedAsset.model}` : ''}` : ''} placeholder="Auto-filled from Asset" readOnly /></Field>
            <Field label="Serial no. (optional)"><input value={serialNo} onChange={(event) => setSerialNo(event.target.value)} placeholder="Enter serial number" /></Field>
            <Field label="Quantity" required><input value="1" readOnly aria-label="Quantity, one asset record" /></Field>
            <Field label="Unit" required><input value="EA" readOnly /></Field>
          </div>

          <div className="movement-photo">
            <span className="movement-photo-icon"><Icon name="file" size={20} /></span>
            <div><strong>Machine photo <em>*</em></strong><p>Attach a clear current photo for approval review.</p>{photo ? <small>{photo.isSample ? `Sample photo reference · ${photo.name}` : photo.name}</small> : <small>Image file required · JPG, PNG or HEIC</small>}</div>
            <label className="button button-secondary movement-photo-button"><Icon name="file" size={16} />{photo ? 'Change photo' : 'Choose photo'}<input key={photoInputKey} type="file" accept="image/*" capture="environment" onChange={(event) => {
              const file = event.target.files?.[0] || null
              if (file && !file.type.startsWith('image/')) {
                setPhoto(null)
                setFormError('Choose an image file for the movement photo.')
                return
              }
              setPhoto(file)
              setFormError('')
            }} required={!photo} /></label>
          </div>

          {selectedAsset ? <div className="movement-asset-context"><Icon name="info" size={14} /><span>Current record: <strong>{selectedAsset.assetId}</strong> · {selectedAsset.assetClass || 'Asset'} · {selectedAsset.plant || 'Building not set'}</span></div> : null}
        </FieldSection>

        <FieldSection icon="pin" iconClass="form-icon-location" title="Movement detail" description="Compare the current assignment with the destination production line.">
          <div className="movement-from-to">
            <section>
              <div className="movement-from-to-heading"><strong>FROM <small>(Current)</small></strong><span>Auto-filled from Asset record</span></div>
              <div className="movement-detail-grid">
                <Field label="Building"><input value={from?.plant || ''} placeholder="Current building" readOnly /></Field>
                <Field label="Location"><input value={from?.location || ''} placeholder="Current location" readOnly /></Field>
                <Field label="Line"><input value={from?.line || ''} placeholder="Current production line" readOnly /></Field>
              </div>
            </section>
            <section className="movement-destination">
              <div className="movement-from-to-heading"><strong>TO <small>(Destination)</small></strong><span>New production assignment</span></div>
              <div className="movement-detail-grid">
                <Field label="Building"><select value={destinationBuilding} onChange={(event) => setDestinationBuilding(event.target.value)}><option value="">Select building</option>{buildingOptions.map((building) => <option key={building} value={building}>{building}</option>)}</select></Field>
                <Field label="Location"><select value={destinationLocation} onChange={(event) => setDestinationLocation(event.target.value)}><option value="">Select location</option>{locationOptions.map((location) => <option key={location} value={location}>{location}</option>)}</select></Field>
                <Field label="Line" required><select value={destinationLine} onChange={(event) => { setDestinationLine(event.target.value); setFormError('') }} required><option value="">Select destination line</option>{zoneOptions.map((zone) => <option key={zone} value={zone}>{zone}</option>)}</select></Field>
              </div>
              <p className="movement-line-hint"><Icon name="info" size={13} />Destination line must be different from the current line.</p>
            </section>
          </div>
        </FieldSection>

        <FieldSection icon="file" iconClass="form-icon-purchase" title="Reason for movement" description="Select at least one reason.">
          <div className="movement-reasons">
            {REASONS.map((reason) => <label className="movement-choice" key={reason}><input type="checkbox" checked={reasons.includes(reason)} onChange={() => toggleReason(reason)} /><span>{reason}</span></label>)}
          </div>
          {reasons.includes('Other') ? <Field label="Other reason" required><input value={otherReason} onChange={(event) => { setOtherReason(event.target.value); setFormError('') }} placeholder="Describe the reason" required /></Field> : null}
        </FieldSection>

        <FieldSection icon="check" title="Condition check" description="Record the Asset condition at the time of movement.">
          <div className="movement-condition-list">
            <fieldset className="movement-condition-row"><legend>Physical condition <em>*</em></legend><label><input type="radio" name="physical-condition" value="Good" checked={physicalCondition === 'Good'} onChange={(event) => { setPhysicalCondition(event.target.value); setFormError('') }} />Good (Normal)</label><label><input type="radio" name="physical-condition" value="Damaged" checked={physicalCondition === 'Damaged'} onChange={(event) => { setPhysicalCondition(event.target.value); setFormError('') }} />Damaged</label></fieldset>
            <fieldset className="movement-condition-row"><legend>Asset tag <em>*</em></legend><label><input type="radio" name="asset-tag" value="Available" checked={assetTag === 'Available'} onChange={(event) => { setAssetTag(event.target.value); setFormError('') }} />Available</label><label><input type="radio" name="asset-tag" value="Missing" checked={assetTag === 'Missing'} onChange={(event) => { setAssetTag(event.target.value); setFormError('') }} />Missing</label></fieldset>
            <fieldset className="movement-condition-row"><legend>Accessories <em>*</em></legend><label><input type="radio" name="accessories" value="Complete" checked={accessories === 'Complete'} onChange={(event) => { setAccessories(event.target.value); setFormError('') }} />Complete</label><label><input type="radio" name="accessories" value="Incomplete" checked={accessories === 'Incomplete'} onChange={(event) => { setAccessories(event.target.value); setFormError('') }} />Incomplete</label></fieldset>
          </div>
          <div className="movement-remark"><Field label="Remark (optional)"><textarea value={remark} onChange={(event) => setRemark(event.target.value)} rows="3" maxLength="500" placeholder="Add transfer instructions or additional notes" /></Field></div>
        </FieldSection>

          {formError ? <div className="form-error" role="alert"><Icon name="alert" size={17} />{formError}</div> : null}
        </div>
        <aside className="form-aside">
          <section className="panel record-preview" aria-label="Movement request preview">
            <h2 className="preview-kicker">Movement request</h2>
            <div className="preview-image"><span className="preview-grid" /><span className="preview-box"><Icon name="transfer" size={44} /></span></div>
            <div className="preview-id"><Icon name="tag" size={17} />{selectedAsset?.assetId || 'Select an active asset'}</div>
            <div className="preview-divider" />
            <div className="create-preview-name"><span>Asset name</span><div><strong>{selectedAsset?.name || 'No asset selected'}</strong><small>{selectedAsset?.assetClass || 'Select an asset class'}</small></div></div>
            <dl className="create-preview-details">
              <div><dt><Icon name="pin" size={18} />From</dt><dd>{[from?.plant, from?.location, from?.line].filter(Boolean).join(' · ') || 'Current location not set'}</dd></div>
              <div><dt><Icon name="transfer" size={18} />To</dt><dd>{[effectiveDestination?.plant, effectiveDestination?.location, effectiveDestination?.line].filter(Boolean).join(' · ') || 'Destination not set'}</dd></div>
              <div><dt><Icon name="calendar" size={18} />Request date</dt><dd>{requestDate || 'Not set'}</dd></div>
              <div><dt><Icon name="file" size={18} />Reason</dt><dd>{reasons.join(', ') || 'Not selected'}</dd></div>
            </dl>
          </section>
          <div className="panel create-tip-panel"><div className="form-tip"><span className="tip-icon"><Icon name="info" size={25} /></span><p><strong>Review before submission</strong>Asset assignment updates after approval and acknowledgement are complete. The original assignment remains in transfer history.</p></div></div>
        </aside>
        </div>
        <div className="movement-submit-bar create-asset-submit-bar">
          <span><Icon name="info" size={15} />Review the movement details before submitting.</span>
          <div className="create-asset-submit-actions"><button type="button" className="button button-secondary" onClick={onMovements}>Cancel</button><button className="button button-primary" type="submit"><Icon name="file" size={17} />Review request</button></div>
        </div>
      </form>

      {showReview ? <div className="movement-review-mask" onMouseDown={(event) => { if (event.target === event.currentTarget) setShowReview(false) }}>
        <section className="panel movement-review-dialog" role="dialog" aria-modal="true" aria-labelledby="movement-review-title">
          <div className="movement-review-heading"><div><span className="movement-kicker">ASSET MOVEMENT</span><h2 id="movement-review-title">Review transfer request</h2></div><button type="button" className="modal-close" aria-label="Close review" onClick={() => setShowReview(false)}><Icon name="close" size={17} /></button></div>
          <p className="movement-review-copy">Check the Asset and production line before sending this request for approval.</p>
          <div className="movement-review-asset"><span>ASSET</span><strong>{selectedAsset?.name}</strong><small>{selectedAsset?.assetId} · {selectedAsset?.model || selectedAsset?.assetClass}</small></div>
          <div className="movement-success-route"><span>{displayValue(from?.line)}</span><Icon name="chevron" size={17} /><strong>{effectiveDestination?.line}</strong></div>
          <dl className="movement-review-list">{serialNo.trim() ? <div><dt>Serial no.</dt><dd>{serialNo.trim()}</dd></div> : null}<div><dt>Request date</dt><dd>{requestDate}</dd></div><div><dt>Destination building</dt><dd>{displayValue(effectiveDestination?.plant)}</dd></div><div><dt>Destination location</dt><dd>{displayValue(effectiveDestination?.location)}</dd></div><div><dt>Reason</dt><dd>{reasons.join(', ')}{otherReason ? ` — ${otherReason}` : ''}</dd></div><div><dt>Condition</dt><dd>{physicalCondition} · Tag {assetTag.toLowerCase()} · Accessories {accessories.toLowerCase()}</dd></div><div><dt>Photo</dt><dd>{photo?.isSample ? `Sample file reference · ${photo.name}` : photo?.name}</dd></div></dl>
          <div className="movement-review-workflow"><Icon name="info" size={14} /><span>Approval order: Requester Manager → Destination Department Leader → Asset Team Acknowledgement. The Asset record updates when complete.</span></div>
          <div className="movement-actions"><button className="button button-secondary" type="button" onClick={() => setShowReview(false)}>Back to form</button><button className="button button-primary" type="button" onClick={submitRequest}><Icon name="check" size={15} />Confirm & submit</button></div>
        </section>
      </div> : null}
    </div>
  )
}
