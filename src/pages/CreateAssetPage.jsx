import { normalizeAssetOwnership } from '../utils/assetOwnershipUtils.js'
import { useState } from 'react'
import { ASSET_LINES, ASSET_LOCATIONS, BUILDINGS, CUSTODIANS, CUSTOMERS, EMPTY_ASSET_FORM } from '../data/assetOptions.js'
import Icon from '../components/Icon.jsx'
import { Field, PageHeading } from '../components/common.jsx'

function includeCurrentValue(options, currentValue) {
  return currentValue && !options.includes(currentValue) ? [...options, currentValue] : options
}

export default function CreateAssetPage({ asset, projects = [], assetClassOptions, onCancel, onSave }) {
  const [form, setForm] = useState(() => asset ? { ...EMPTY_ASSET_FORM, ...asset } : EMPTY_ASSET_FORM)
  const [error, setError] = useState('')
  const availableClasses = asset?.assetClass && !assetClassOptions.includes(asset.assetClass)
    ? [...assetClassOptions, asset.assetClass]
    : assetClassOptions
  const custodianOptions = includeCurrentValue(CUSTODIANS, asset?.custodian)
  const customerOptions = includeCurrentValue(CUSTOMERS, asset?.customerName)
  const buildingOptions = includeCurrentValue(BUILDINGS, asset?.plant)
  const locationOptions = includeCurrentValue(ASSET_LOCATIONS, asset?.location)
  const lineOptions = includeCurrentValue(ASSET_LINES, asset?.line)
  const completionFields = [...(form.ownershipType === 'customer' ? ['customerName'] : []), 'name', 'assetClass', 'model', 'custodian', 'plant', 'location', 'line', 'area', 'power', 'targetSop']
  const completion = Math.round(completionFields.filter((field) => String(form[field] || '').trim()).length / completionFields.length * 100)

  function updateField(event) {
    if (event.target.name === 'projectCode') {
      const project = projects.find((record) => record.projectCode === event.target.value)
      setForm((current) => ({ ...current, projectCode: project?.projectCode || '', projectName: project?.projectName || '' }))
      return
    }
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }))
    if (error) setError('')
  }

  function submitForm(event) {
    event.preventDefault()
    if (!form.name.trim() || !form.assetClass) {
      setError('Enter an asset name and select an asset class to save this draft.')
      return
    }
    try {
      onSave(normalizeAssetOwnership({ ...form, name: form.name.trim() }))
    } catch (error) {
      setError(error.message)
    }
  }

  return (
    <div className="create-asset-workspace">
      <PageHeading eyebrow="Asset management" title={asset ? 'Edit draft' : 'Create asset'} description={asset ? 'Update this draft before it enters the acquisition process.' : 'Create a draft asset record before the acquisition process begins.'} />
      <form className="create-asset-form" onSubmit={submitForm}>
        <div className="create-layout">
        <div className="form-main-column">
          <section className="panel form-section">
            <div className="form-section-heading"><span className="form-section-icon"><Icon name="file" size={18} /></span><div><h2>Project reference</h2><p>Link this asset to a project, if applicable.</p></div></div>
            <div className="form-grid"><Field label="Project"><select name="projectCode" value={form.projectCode || ''} onChange={updateField}><option value="">No project selected</option>{form.projectCode && !projects.some((project) => project.projectCode === form.projectCode) ? <option value={form.projectCode}>{form.projectCode} · {form.projectName || 'Existing reference'}</option> : null}{projects.map((project) => <option key={project.projectCode} value={project.projectCode}>{project.projectCode} · {project.projectName}</option>)}</select><small>{projects.length ? 'Select a project by code and name.' : 'Add a project in Project Management → Create Project.'}</small></Field></div>
          </section>
          <section className="panel form-section" aria-labelledby="asset-ownership-heading">
            <div className="form-section-heading"><span className="form-section-icon"><Icon name="box" size={18} /></span><div><h2 id="asset-ownership-heading">Asset ownership</h2><p>Select whether the asset belongs to the company or a customer before entering its details.</p></div></div>
            <div className="form-grid asset-ownership-grid">
              <Field label="Ownership type" required><select name="ownershipType" value={form.ownershipType || 'company'} onChange={updateField} required><option value="company">Company Asset · TBKK</option><option value="customer">Customer Asset</option></select></Field>
              {form.ownershipType === 'customer' ? <Field label="Customer name" required><select name="customerName" value={form.customerName || ''} onChange={updateField} required><option value="">Select a customer</option>{customerOptions.map((customer) => <option key={customer} value={customer}>{customer}{customer === asset?.customerName && !CUSTOMERS.includes(customer) ? ' (existing value)' : ''}</option>)}</select><small>Follows the standard receiving and approval process, with no depreciation or lifecycle events.</small></Field> : null}
            </div>
          </section>
          <section className="panel form-section">
            <div className="form-section-heading"><span className="form-section-icon"><Icon name="box" size={18} /></span><div><h2>Asset information</h2><p>Identify the asset and its responsible custodian.</p></div></div>
            <div className="form-grid">
              <Field label="Asset name" required><input name="name" placeholder="e.g. Transfer Conveyor" value={form.name} onChange={updateField} required /></Field>
              <Field label="Asset class" required><select name="assetClass" value={form.assetClass} onChange={updateField} required><option value="">Select an asset class</option>{availableClasses.map((assetClass) => <option key={assetClass} value={assetClass}>{assetClass}{assetClass === asset?.assetClass && !assetClassOptions.includes(assetClass) ? ' (inactive)' : ''}</option>)}</select></Field>
              <Field label="Model"><input type="text" name="model" value={form.model} onChange={updateField} placeholder="Enter model" /></Field>
              <Field label="Custodian"><select name="custodian" value={form.custodian} onChange={updateField}><option value="">Select a custodian</option>{custodianOptions.map((custodian) => <option key={custodian} value={custodian}>{custodian}{custodian === asset?.custodian && !CUSTODIANS.includes(custodian) ? ' (existing value)' : ''}</option>)}</select></Field>
            </div>
          </section>

          <section className="panel form-section">
            <div className="form-section-heading"><span className="form-section-icon form-icon-location"><Icon name="pin" size={18} /></span><div><h2>Location & specification</h2><p>Record where the asset will be installed and used.</p></div></div>
            <div className="form-grid">
              <Field label="Building"><select name="plant" value={form.plant} onChange={updateField}><option value="">Select a building</option>{buildingOptions.map((building) => <option key={building} value={building}>{building}{building === asset?.plant && !BUILDINGS.includes(building) ? ' (existing value)' : ''}</option>)}</select></Field>
              <Field label="Location"><select name="location" value={form.location} onChange={updateField}><option value="">Select a location</option>{locationOptions.map((location) => <option key={location} value={location}>{location}{location === asset?.location && !ASSET_LOCATIONS.includes(location) ? ' (existing value)' : ''}</option>)}</select></Field>
              <Field label="Line"><select name="line" value={form.line} onChange={updateField}><option value="">Select a line</option>{lineOptions.map((line) => <option key={line} value={line}>{line}{line === asset?.line && !ASSET_LINES.includes(line) ? ' (existing value)' : ''}</option>)}</select></Field>
              <Field label="Area"><input name="area" placeholder="e.g. Assembly" value={form.area} onChange={updateField} /></Field>
              <div className="create-power-field"><Field label="Power"><input name="power" placeholder="e.g. 380 VAC, 50 Hz" value={form.power} onChange={updateField} /></Field></div>
            </div>
          </section>

          <section className="panel form-section">
            <div className="form-section-heading"><span className="form-section-icon form-icon-purchase"><Icon name="calendar" size={18} /></span><div><h2>Target & notes</h2><p>Set the planned start of production and add context.</p></div></div>
            <div className="form-grid">
              <Field label="Target SOP"><input type="date" name="targetSop" value={form.targetSop} onChange={updateField} /></Field>
              <Field label="Notes"><input name="notes" placeholder="Add a note about this asset" value={form.notes} onChange={updateField} /></Field>
            </div>
          </section>
          {error ? <div className="form-error" role="alert"><Icon name="alert" size={17} />{error}</div> : null}
        </div>
        <aside className="form-aside">
          <section className="panel record-preview" aria-label="Draft asset preview">
            <h2 className="preview-kicker">Draft asset</h2>
            <div className="preview-image"><span className="preview-grid" /><span className="preview-box"><Icon name="box" size={44} /></span></div>
            <div className="preview-id"><Icon name="tag" size={17} />{asset?.assetId || 'Temporary no. assigned on save'}</div>
            <div className="preview-divider" />
            <div className="create-preview-name"><span>Asset name</span><div><strong>{form.name || 'New asset'}</strong><small>{form.assetClass || 'Select an asset class'}</small></div></div>
            <dl className="create-preview-details">
              <div><dt>Project</dt><dd>{[form.projectCode, form.projectName].filter(Boolean).join(' · ') || 'No project selected'}</dd></div>
              <div><dt>Asset ownership</dt><dd>{form.ownershipType === 'customer' ? `Customer · ${form.customerName || 'Name required'}` : 'Company · TBKK'}</dd></div>
              <div><dt><Icon name="box" size={18} />Asset class</dt><dd>{form.assetClass || 'Not selected'}</dd></div>
              <div><dt><Icon name="pin" size={18} />Location</dt><dd>{[form.plant, form.location, form.line].filter(Boolean).join(' · ') || 'Location not set'}</dd></div>
              <div><dt><Icon name="clock" size={18} />Status</dt><dd><span className="create-draft-status">Draft</span></dd></div>
            </dl>
            <div className="preview-divider" />
            <div className="create-completion"><div><strong>Completion</strong><span>{completion}%</span></div><progress aria-label="Asset information completion" max="100" value={completion} /><p>Complete the form to prepare this asset for proposal.</p></div>
          </section>
          <div className="panel create-tip-panel"><div className="form-tip"><span className="tip-icon"><Icon name="info" size={25} /></span><p><strong>Draft assets can be updated</strong>Once the details are ready, this asset can be selected for a Proposal in MIS.</p></div></div>
        </aside>
        </div>
        <div className="movement-submit-bar create-asset-submit-bar">
          <span><Icon name="info" size={16} />Review the asset details before saving this draft.</span>
          <div className="create-asset-submit-actions"><button type="button" className="button button-secondary" onClick={onCancel}>Cancel</button><button type="submit" className="button button-primary"><Icon name="check" size={17} />Save draft</button></div>
        </div>
      </form>
    </div>
  )
}
