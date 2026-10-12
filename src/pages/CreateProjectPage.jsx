import { useState } from 'react'
import Icon from '../components/Icon.jsx'
import { Field, PageHeading } from '../components/common.jsx'

export default function CreateProjectPage({ onSave, onCancel }) {
  const [form, setForm] = useState({ projectCode: '', projectName: '', detail: '' })
  const [error, setError] = useState('')

  function updateField(event) {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }))
    setError('')
  }

  function submit(event) {
    event.preventDefault()
    const project = { ...form, projectCode: form.projectCode.trim(), projectName: form.projectName.trim(), detail: form.detail.trim() }
    if (!project.projectCode || !project.projectName) {
      setError('Enter a Project Code and Project Name.')
      return
    }
    try {
      onSave(project)
    } catch (error) {
      setError(error.message)
    }
  }

  return <div className="create-asset-workspace">
    <PageHeading eyebrow="Project Management" title="Create Project" description="Add a project to reference when creating an asset." />
    <form className="create-asset-form" onSubmit={submit}>
      <section className="panel form-section">
        <div className="form-section-heading"><span className="form-section-icon"><Icon name="file" size={18} /></span><div><h2>Project information</h2><p>Record the project code, name and supporting details.</p></div></div>
        <div className="form-grid">
          <Field label="Project Code" required><input name="projectCode" value={form.projectCode} onChange={updateField} placeholder="e.g. PRJ-2026-001" maxLength={80} required /></Field>
          <Field label="Project Name" required><input name="projectName" value={form.projectName} onChange={updateField} placeholder="e.g. Assembly Line Expansion" maxLength={200} required /></Field>
          <div className="project-detail-field"><Field label="Detail"><textarea name="detail" value={form.detail} onChange={updateField} placeholder="Describe the project" rows={5} maxLength={2000} /></Field></div>
        </div>
        {error ? <div className="form-error" role="alert"><Icon name="alert" size={17} />{error}</div> : null}
      </section>
      <div className="movement-submit-bar create-asset-submit-bar"><span><Icon name="info" size={16} />Saved projects are available in Create asset.</span><div className="create-asset-submit-actions"><button type="button" className="button button-secondary" onClick={onCancel}>Cancel</button><button type="submit" className="button button-primary"><Icon name="check" size={17} />Save Project</button></div></div>
    </form>
  </div>
}
