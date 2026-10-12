import AssetTable from '../components/AssetTable.jsx'
import Icon from '../components/Icon.jsx'
import { EmptyInline, PageHeading } from '../components/common.jsx'

function DashboardMetric({ label, value, hint, icon, tone, onClick }) {
  return <button className={`dashboard-metric dashboard-metric-${tone}`} onClick={onClick}>
    <span className="dashboard-metric-icon"><Icon name={icon} size={25} /></span>
    <span className="dashboard-metric-copy"><span>{label}</span><strong>{value.toLocaleString('en-US')}</strong><small>{hint}</small></span>
    <Icon name="chevron" size={17} className="dashboard-metric-chevron" />
    <svg className="dashboard-metric-wave" viewBox="0 0 360 75" preserveAspectRatio="none" aria-hidden="true"><path d="M0 58 C45 34 65 76 116 53 S167 52 208 31 S253 39 287 16 S335 3 360 12 V75 H0 Z" fill="currentColor" /></svg>
  </button>
}

export default function DashboardPage({ assets, assetTypes, purchaseOrders, summary, onNavigate, onSaveDPDetails, lifecycleEvents, onTransfer, onAdvanceTransfer }) {
  const metrics = [
    { label: 'Total assets', value: assets.length, hint: `Across ${summary.classSummary.length} asset classes`, icon: 'box', tone: 'red', page: 'assets' },
    { label: 'Active assets', value: summary.activeAssets, hint: `${assets.length ? Math.round(summary.activeAssets / assets.length * 100) : 0}% of registered assets`, icon: 'check', tone: 'green', page: 'assets' },
    { label: 'In acquisition', value: summary.acquisitionAssets, hint: 'Past draft creation', icon: 'file', tone: 'blue', page: 'assets' },
    { label: 'Pending approval', value: summary.pendingAssets, hint: summary.pendingAssets ? 'Awaiting review' : 'No pending approvals', icon: 'clock', tone: 'amber', page: 'approval' },
  ]

  return (
    <div className="dashboard-workspace">
      <PageHeading
        eyebrow="Asset management"
        title="Dashboard"
        description="Track each asset from draft through acquisition, verification and activation."
        action={<button className="button button-primary" onClick={() => onNavigate('create')}><Icon name="plus" size={18} />Create asset</button>}
      />

      <section className="metric-grid" aria-label="Asset summary">
        {metrics.map((metric) => <DashboardMetric key={metric.label} {...metric} onClick={() => onNavigate(metric.page)} />)}
      </section>

      <section className="dashboard-mid-grid">
        <article className="panel category-panel">
          <div className="panel-heading"><div><h2>Assets by class</h2><p>Equipment distribution across the register.</p></div><button className="panel-more" onClick={() => onNavigate('assets')} aria-label="View all assets"><Icon name="more" /></button></div>
          {summary.classSummary.length > 0 ? <div className="dashboard-class-list">{summary.classSummary.map(({ category, count }, index) => {
            const percentage = assets.length ? count / assets.length * 100 : 0
            return <div className="dashboard-class-row" key={category}>
              <span className={`category-symbol symbol-${index % 4}`}><Icon name={index === 1 ? 'wrench' : index === 2 ? 'file' : 'box'} size={20} /></span>
              <div className="dashboard-class-data"><span className="category-name">{category}</span><div className="category-track"><span style={{ width: `${percentage}%` }} className={`category-fill fill-${index % 4}`} /></div></div>
              <div className="dashboard-class-count"><strong>{count.toLocaleString('en-US')}</strong><span>{Math.round(percentage)}%</span></div>
            </div>
          })}</div> : <EmptyInline title="No asset classes yet" copy="Create your first draft asset to see it here." />}
          <button className="text-action" onClick={() => onNavigate('assets')}>View asset list<Icon name="chevron" size={15} /></button>
        </article>

        <article className="panel attention-panel">
          <div className="panel-heading"><div><h2>Acquisition progress</h2><p>Current position across the asset process.</p></div><span className="availability-period">All assets</span></div>
          <div className="availability-total"><strong>{assets.length.toLocaleString('en-US')}</strong><span>asset records</span></div>
          <div className="availability-bar" aria-label={summary.stageSummary.map((stage) => `${stage.count} ${stage.label}`).join(', ')}>
            {summary.stageSummary.filter((stage) => stage.count > 0).map((stage) => <span key={stage.label} className={`availability-segment stage-${stage.style}`} style={{ width: `${assets.length ? (stage.count / assets.length) * 100 : 0}%` }} />)}
          </div>
          <div className="availability-legend stage-legend">{summary.stageSummary.map((stage) => <div key={stage.label}><span className={`legend-dot dot-${stage.style}`} /><span>{stage.label}</span><strong>{stage.count}</strong></div>)}</div>
          {summary.attentionAssets > 0 ? <button className="attention-note" onClick={() => onNavigate('assets')}><Icon name="alert" size={16} /><span><strong>{summary.attentionAssets} records</strong> are waiting for the next step</span><Icon name="chevron" size={15} /></button> : <div className="healthy-note"><span className="healthy-check"><Icon name="check" size={13} /></span>No waiting assets need attention.</div>}
        </article>
      </section>

      <section className="panel recent-panel">
        <div className="panel-heading recent-heading"><div><h2>Recently updated</h2><p>Latest activity in the asset register.</p></div><button className="button button-secondary button-small" onClick={() => onNavigate('assets')}>View all assets<Icon name="chevron" size={15} /></button></div>
        {assets.length > 0 ? <AssetTable assets={assets.slice(0, 3)} allAssets={assets} assetTypes={assetTypes} purchaseOrders={purchaseOrders} compact onSaveDPDetails={onSaveDPDetails} lifecycleEvents={lifecycleEvents} onTransfer={onTransfer} onAdvanceTransfer={onAdvanceTransfer} /> : <EmptyInline title="Your register is ready" copy="Create a draft asset to start the acquisition process." action={<button className="button button-primary button-small" onClick={() => onNavigate('create')}><Icon name="plus" size={16} />Create asset</button>} />}
      </section>
      <div className="dashboard-footnote"><span className="footnote-dot" />Asset information is saved in this browser.</div>
    </div>
  )
}
