import { useEffect, useState } from 'react'
import Icon from './Icon.jsx'
import { Field } from './common.jsx'

const TRANSFER_APPROVAL_STEPS = [
  'Requester Manager Approval',
  'Destination Department Leader Approval',
  'Asset Team Acknowledgement',
]

function localDate() {
  const date = new Date()
  return new Date(date.getTime() - date.getTimezoneOffset() * 60_000).toISOString().slice(0, 10)
}

function formatTHB(value) {
  return `฿ ${new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(Number(value) || 0)}`
}

function getCapitalization(value) {
  if (value === undefined || value === null || value === '') return 'Not classified'
  return Number(value) > 50_000 ? 'Capitalized' : 'Expense'
}

const TYPE_COPY = {
  subAsset: { title: 'Add Sub Asset', description: 'Record a component associated with this Parent Asset.' },
  modification: { title: 'Create Modification', description: 'Record an upgrade or enhancement to this Active Asset.' },
  maintenance: { title: 'Record Maintenance', description: 'Add a completed repair or maintenance event to the Asset history.' },
  transfer: { title: 'Create Transfer', description: 'Request a change to the Asset assignment or location.' },
}

export default function AssetLifecycleDialog({ asset, type, onClose, onSave }) {
  const [values, setValues] = useState(() => ({
    date: localDate(),
    value: '',
    subAssetName: '',
    assetClass: '',
    model: '',
    modificationType: 'Upgrade',
    description: '',
    vendor: '',
    responsibleTeam: '',
    maintenanceType: 'Preventive',
    result: '',
    fromDepartment: asset.department || '',
    fromCustodian: asset.custodian || '',
    fromPlant: asset.plant || '',
    fromLocation: asset.location || '',
    fromLine: asset.line && asset.line !== '—' ? asset.line : '',
    fromArea: asset.area || '',
    toDepartment: '',
    toCustodian: '',
    toPlant: asset.plant || '',
    toLocation: '',
    toLine: '',
    toArea: '',
    remark: '',
  }))

  useEffect(() => {
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    function closeOnEscape(event) {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', closeOnEscape)
    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', closeOnEscape)
    }
  }, [onClose])

  function updateValue(field, value) {
    setValues((current) => ({ ...current, [field]: value }))
  }

  function submit(event) {
    event.preventDefault()
    const common = {
      assetId: asset.assetId,
      assetName: asset.name,
      type,
      occurredOn: values.date,
      remark: values.remark.trim(),
    }

    if (type === 'subAsset') {
      const value = Number(values.value)
      onSave({
        ...common,
        title: values.subAssetName.trim(),
        subAsset: { name: values.subAssetName.trim(), assetClass: values.assetClass.trim(), model: values.model.trim() },
        value,
        costTreatment: getCapitalization(value),
        status: 'Pending Approval',
      })
    } else if (type === 'modification') {
      const value = Number(values.value)
      onSave({
        ...common,
        title: values.modificationType,
        modificationType: values.modificationType,
        description: values.description.trim(),
        vendor: values.vendor.trim(),
        value,
        costTreatment: getCapitalization(value),
        status: 'Pending Approval',
      })
    } else if (type === 'maintenance') {
      onSave({
        ...common,
        title: values.maintenanceType,
        maintenanceType: values.maintenanceType,
        description: values.description.trim(),
        vendor: values.vendor.trim(),
        responsibleTeam: values.responsibleTeam.trim(),
        cost: Number(values.value) || 0,
        result: values.result.trim(),
        status: 'Completed',
      })
    } else {
      const from = {
        department: values.fromDepartment.trim(),
        custodian: values.fromCustodian.trim(),
        plant: values.fromPlant.trim(),
        location: values.fromLocation.trim(),
        line: values.fromLine.trim(),
        area: values.fromArea.trim(),
      }
      const to = {
        department: values.toDepartment.trim(),
        custodian: values.toCustodian.trim(),
        plant: values.toPlant.trim(),
        location: values.toLocation.trim(),
        line: values.toLine.trim(),
        area: values.toArea.trim(),
      }
      onSave({
        ...common,
        title: `Transfer to ${to.department}`,
        from,
        to,
        approvalSteps: TRANSFER_APPROVAL_STEPS,
        currentApprovalStep: 0,
        approvalHistory: [],
        status: 'Pending Approval',
      })
    }
  }

  const copy = TYPE_COPY[type]
  const isTransfer = type === 'transfer'
  const isSubAsset = type === 'subAsset'
  const isModification = type === 'modification'
  const isMaintenance = type === 'maintenance'
  const amountLabel = isMaintenance ? 'Maintenance cost (THB)' : 'Value (THB)'
  const treatment = isSubAsset || isModification ? getCapitalization(values.value) : ''
  const treatmentClass = treatment === 'Capitalized' ? 'is-capitalized' : treatment === 'Expense' ? 'is-expense' : 'is-unclassified'
  const treatmentHint = treatment === 'Capitalized' ? 'Value is greater than ฿ 50,000' : treatment === 'Expense' ? 'Value is ฿ 50,000 or less' : 'Enter a value to classify this request'

  return (
    <div className={`asset-lifecycle-modal-mask${isTransfer ? ' asset-record-mask' : ''}`} onMouseDown={(event) => { if (event.target === event.currentTarget) onClose() }}>
      <section className={isTransfer ? 'detail-dialog asset-detail-dialog asset-transfer-dialog' : 'asset-lifecycle-modal'} role="dialog" aria-modal="true" aria-labelledby="asset-lifecycle-dialog-title">
        <header className={isTransfer ? 'detail-header' : 'asset-lifecycle-modal-header'}>
          {isTransfer ? <div className="asset-record-heading">
            <span className="asset-record-symbol"><Icon name="transfer" size={36} /></span>
            <div className="asset-record-heading-copy"><span className="detail-eyebrow">Asset lifecycle</span><div className="asset-record-title-row"><h2 id="asset-lifecycle-dialog-title">{copy.title}</h2></div><span className="detail-id">{asset.name} · {asset.assetId}</span><p className="asset-transfer-description">{copy.description}</p></div>
          </div> : <div><span className="detail-eyebrow">LIFECYCLE · {asset.assetId}</span><h2 id="asset-lifecycle-dialog-title">{copy.title}</h2><p>{copy.description}</p></div>}
          <button className="modal-close" type="button" aria-label="Close lifecycle form" onClick={onClose}><Icon name="close" size={17} /></button>
        </header>

        <form className={isTransfer ? 'asset-transfer-form' : undefined} onSubmit={submit}>
          <div className={isTransfer ? 'asset-transfer-form-body' : undefined}>
          {!isTransfer ? <div className="asset-lifecycle-context"><span>Active Asset</span><strong>{asset.name}</strong><small>{asset.assetId} · {asset.model || asset.assetClass || 'Asset record'}</small></div> : null}

          {isSubAsset ? <div className="asset-lifecycle-form-grid">
            <Field label="Sub Asset Name" required><input value={values.subAssetName} onChange={(event) => updateValue('subAssetName', event.target.value)} required /></Field>
            <Field label="Asset Class"><input value={values.assetClass} onChange={(event) => updateValue('assetClass', event.target.value)} /></Field>
            <Field label="Model"><input value={values.model} onChange={(event) => updateValue('model', event.target.value)} /></Field>
            <Field label={amountLabel} required><input type="number" min="0" step="0.01" value={values.value} onChange={(event) => updateValue('value', event.target.value)} required /></Field>
            <Field label="Request date" required><input type="date" value={values.date} onChange={(event) => updateValue('date', event.target.value)} required /></Field>
            <div className={`asset-lifecycle-treatment ${treatmentClass}`}><span>Value treatment</span><strong>{treatment}</strong><small>{treatmentHint}</small></div>
          </div> : null}

          {isModification ? <div className="asset-lifecycle-form-grid">
            <Field label="Modification type" required><select value={values.modificationType} onChange={(event) => updateValue('modificationType', event.target.value)}><option>Upgrade</option><option>Additional equipment</option><option>Capability improvement</option><option>Safety modification</option><option>Other</option></select></Field>
            <Field label={amountLabel} required><input type="number" min="0" step="0.01" value={values.value} onChange={(event) => updateValue('value', event.target.value)} required /></Field>
            <Field label="Date" required><input type="date" value={values.date} onChange={(event) => updateValue('date', event.target.value)} required /></Field>
            <Field label="Vendor / responsible team"><input value={values.vendor} onChange={(event) => updateValue('vendor', event.target.value)} /></Field>
            <Field label="Description" required><input value={values.description} onChange={(event) => updateValue('description', event.target.value)} required /></Field>
            <div className={`asset-lifecycle-treatment ${treatmentClass}`}><span>Value treatment</span><strong>{treatment}</strong><small>{treatmentHint}</small></div>
          </div> : null}

          {isMaintenance ? <div className="asset-lifecycle-form-grid">
            <Field label="Maintenance type" required><select value={values.maintenanceType} onChange={(event) => updateValue('maintenanceType', event.target.value)}><option>Preventive</option><option>Corrective</option><option>Inspection</option><option>Other</option></select></Field>
            <Field label="Date" required><input type="date" value={values.date} onChange={(event) => updateValue('date', event.target.value)} required /></Field>
            <Field label="Vendor / responsible team"><input value={values.responsibleTeam} onChange={(event) => updateValue('responsibleTeam', event.target.value)} /></Field>
            <Field label={amountLabel}><input type="number" min="0" step="0.01" value={values.value} onChange={(event) => updateValue('value', event.target.value)} /></Field>
            <Field label="Problem / work description" required><input value={values.description} onChange={(event) => updateValue('description', event.target.value)} required /></Field>
            <Field label="Result" required><input value={values.result} onChange={(event) => updateValue('result', event.target.value)} required /></Field>
            <p className="asset-lifecycle-inline-note"><Icon name="info" size={14} />Maintenance cost is recorded in history and does not automatically increase Asset value.</p>
          </div> : null}

          {isTransfer ? <>
            <div className="asset-lifecycle-transfer-grid">
              <section><div className="asset-lifecycle-transfer-heading"><span>FROM</span><small>Current assignment</small></div>
                <Field label="Department" required><input value={values.fromDepartment} onChange={(event) => updateValue('fromDepartment', event.target.value)} required /></Field>
                <Field label="Custodian" required><input value={values.fromCustodian} onChange={(event) => updateValue('fromCustodian', event.target.value)} required /></Field>
                <Field label="Plant" required><input value={values.fromPlant} onChange={(event) => updateValue('fromPlant', event.target.value)} required /></Field>
                <Field label="Location" required><input value={values.fromLocation} onChange={(event) => updateValue('fromLocation', event.target.value)} required /></Field>
                <Field label="Line / Area"><input value={[values.fromLine, values.fromArea].filter(Boolean).join(' / ')} readOnly /></Field>
              </section>
              <section><div className="asset-lifecycle-transfer-heading is-destination"><span>TO</span><small>New assignment</small></div>
                <Field label="Department" required><input value={values.toDepartment} onChange={(event) => updateValue('toDepartment', event.target.value)} required /></Field>
                <Field label="Custodian" required><input value={values.toCustodian} onChange={(event) => updateValue('toCustodian', event.target.value)} required /></Field>
                <Field label="Plant" required><input value={values.toPlant} onChange={(event) => updateValue('toPlant', event.target.value)} required /></Field>
                <Field label="Location" required><input value={values.toLocation} onChange={(event) => updateValue('toLocation', event.target.value)} required /></Field>
                <Field label="Line"><input value={values.toLine} onChange={(event) => updateValue('toLine', event.target.value)} /></Field>
                <Field label="Area"><input value={values.toArea} onChange={(event) => updateValue('toArea', event.target.value)} /></Field>
              </section>
            </div>
            <div className="asset-lifecycle-transfer-meta"><Field label="Requested transfer date" required><input type="date" value={values.date} onChange={(event) => updateValue('date', event.target.value)} required /></Field><p><Icon name="info" size={14} />Asset assignment changes after all three approval steps are completed.</p></div>
          </> : null}

          <Field label="Remark"><textarea className="asset-lifecycle-textarea" value={values.remark} onChange={(event) => updateValue('remark', event.target.value)} rows="2" maxLength="300" /></Field>
          </div>
          <footer className={isTransfer ? 'detail-footer' : 'asset-lifecycle-actions'}><button type="button" className="button button-secondary" onClick={onClose}>Cancel</button><button type="submit" className="button button-primary"><Icon name="check" size={15} />{isMaintenance ? 'Save Maintenance' : isTransfer ? 'Submit Transfer Request' : 'Save Request'}</button></footer>
        </form>
      </section>
    </div>
  )
}
