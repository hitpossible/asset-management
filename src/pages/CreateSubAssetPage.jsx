import { useState } from 'react'
import Icon from '../components/Icon.jsx'
import { Field, PageHeading } from '../components/common.jsx'

export default function CreateSubAssetPage({ parentAsset, nextAssetId, draft, onSave, onProposal, onCancel }) {
  const [form, setForm] = useState(() => ({ name: '', model: '', power: '', targetSop: '', notes: '', amount: '', ...draft }))
  const [error, setError] = useState('')

  function update(event) {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }))
    setError('')
  }

  function submit(event) {
    event.preventDefault()
    if (!form.name.trim()) {
      setError('Enter a component name.')
      return
    }
    const request = { ...form, name: form.name.trim(), sourceAssetId: parentAsset.assetId, parentAssetId: parentAsset.assetId, workType: 'subAsset' }
    try {
      if (event.nativeEvent.submitter?.value === 'proposal') onProposal(request)
      else onSave(request)
    } catch (error) {
      setError(error.message)
    }
  }

  return <div className="create-asset-workspace">
    <PageHeading eyebrow="Asset management" title="Create Sub Asset" description="Create a numbered Draft Sub Asset under the selected Main Asset." />
    <form className="create-asset-form" onSubmit={submit}>
      <div className="form-main-column">
        <section className="panel form-section">
          <div className="form-section-heading"><span className="form-section-icon"><Icon name="box" size={18} /></span><div><h2>Parent Asset</h2><p>The main Asset stays Active. Classification and assignment are inherited from this Asset.</p></div></div>
          <div className="form-grid">
            <Field label="Parent Asset"><input value={`${parentAsset.assetId} · ${parentAsset.name}`} readOnly /></Field>
            <Field label="Sub Asset No."><input value={nextAssetId || ''} readOnly /><small>Assigned when the draft is saved.</small></Field>
            <Field label="Asset class"><input value={parentAsset.assetClass || ''} readOnly /></Field>
            <Field label="Custodian"><input value={parentAsset.custodian || ''} readOnly /></Field>
            <Field label="Location"><input value={[parentAsset.plant, parentAsset.location, parentAsset.line, parentAsset.area].filter(Boolean).join(' · ')} readOnly /></Field>
          </div>
        </section>
        <section className="panel form-section">
          <div className="form-section-heading"><span className="form-section-icon"><Icon name="plus" size={18} /></span><div><h2>Component information</h2><p>Work type: Addition Sub-Asset</p></div></div>
          <div className="form-grid">
            <Field label="Component name" required><input name="name" value={form.name} onChange={update} placeholder="e.g. Conveyor drive unit" maxLength={120} required /></Field>
            <Field label="Model"><input type="text" name="model" value={form.model} onChange={update} placeholder="Enter model" /></Field>
            <Field label="Power"><input name="power" value={form.power} onChange={update} placeholder="e.g. 380 VAC, 50 Hz" maxLength={80} /></Field>
            <Field label="Target SOP"><input type="date" name="targetSop" value={form.targetSop} onChange={update} /></Field>
            <Field label="Estimated base amount (THB)"><input type="number" min="0" step="0.01" name="amount" value={form.amount} onChange={update} placeholder="0.00" /></Field>
            <Field label="Notes"><input name="notes" value={form.notes} onChange={update} placeholder="Describe the component" maxLength={240} /></Field>
          </div>
          <div className="mis-reference-note"><Icon name="info" size={14} />Save draft creates {nextAssetId || 'a numbered Sub Asset'} in the Asset list with Draft status. Continue through Create Proposal (MIS) using this record. A total over THB 50,000 capitalizes the Sub Asset; THB 50,000 or less completes as Expense and cancels the unused Draft, retaining its number in history.</div>
        </section>
        {error ? <div className="form-error" role="alert">{error}</div> : null}
      </div>
      <div className="movement-submit-bar create-asset-submit-bar">
        <span><Icon name="info" size={16} />Saved Sub Assets appear in the Asset list and the Parent Asset’s relationships.</span>
        <div className="create-asset-submit-actions">
          <button type="button" className="button button-secondary" onClick={onCancel}>Cancel</button>
          <button type="submit" className="button button-secondary" value="draft">Save draft</button>
          <button type="submit" className="button button-primary" value="proposal">Create Proposal (MIS)</button>
        </div>
      </div>
    </form>
  </div>
}
