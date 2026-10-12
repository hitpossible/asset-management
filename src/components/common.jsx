import Icon from './Icon.jsx'

export function PageHeading({ eyebrow, title, description, action }) {
  return (
    <div className="page-heading">
      <div>
        <div className="page-eyebrow">{eyebrow}</div>
        <h1>{title}</h1>
        <p>{description}</p>
      </div>
      {action}
    </div>
  )
}

export function Field({ label, required = false, children }) {
  return <label className="form-field"><span>{label}{required && <em> *</em>}</span>{children}</label>
}

export function DetailValue({ label, value }) {
  return <div className="detail-value"><span>{label}</span><strong>{value || '—'}</strong></div>
}

export function EmptyInline({ title, copy, action }) {
  return <div className="empty-inline"><span className="empty-inline-icon"><Icon name="box" size={21} /></span><strong>{title}</strong><p>{copy}</p>{action}</div>
}

export function ListMetric({ label, count, hint, icon, tone, total, onClick, selected }) {
  const Component = onClick ? 'button' : 'div'
  return <Component className={`asset-list-metric metric-tone-${tone}`} {...(onClick ? { type: 'button', onClick, 'aria-pressed': selected } : {})}>
    <span className="list-metric-icon"><Icon name={icon} size={25} /></span>
    <span className="list-metric-copy"><span>{label}</span><strong>{count.toLocaleString()}</strong><small>{hint}</small></span>
    <span className="list-metric-progress" aria-hidden="true"><span style={{ width: `${total ? Math.min(count / total * 100, 100) : 0}%` }} /></span>
  </Component>
}
