import { useState } from 'react'
import brandIcon from '../public/ams-logo.png'
import Icon from './Icon.jsx'
import { ADMIN_PAGES } from '../data/adminData.js'

const ASSET_LINKS = [
  { page: 'assets', label: 'Asset list', icon: 'box' },
  { page: 'create', label: 'Create asset', icon: 'plus' },
  { page: 'asset-validation', label: 'Asset validation', icon: 'check' },
  { page: 'movement', label: 'Movement asset', icon: 'pin' },
  { page: 'movements', label: 'Assets in movement', icon: 'clock' },
  { page: 'disposal', label: 'Disposal / Sale', icon: 'file' },
]
const MIS_LINKS = [
  { page: 'mis-proposals', label: 'Proposal list', icon: 'file' },
  { page: 'mis-proposal', label: 'Create Proposal', icon: 'plus' },
  { page: 'mis-prs', label: 'PR list', icon: 'file' },
  { page: 'mis-create-pr', label: 'Create PR', icon: 'plus' },
  { page: 'mis-pos', label: 'PO list / Approval', icon: 'file' },
  { page: 'mis-create-po', label: 'Create PO', icon: 'plus' },
  { page: 'mis-create-gr', label: 'Create GR', icon: 'plus' },
]

function SidebarLink({ item, page, onNavigate, count, child = false }) {
  return <button className={`nav-link ${child ? 'nav-child' : ''} ${page === item.page ? 'nav-link-active' : ''}`} aria-current={page === item.page ? 'page' : undefined} onClick={() => onNavigate(item.page)}>
    {child ? null : <Icon name={item.icon} size={19} />}<span>{item.label}</span>{count !== undefined ? <span className="nav-count">{count}</span> : null}
  </button>
}

export default function Sidebar({ page, assetCount, menuOpen, onNavigate, onClose }) {
  const [projectMenuOpen, setProjectMenuOpen] = useState(true)
  const [assetMenuOpen, setAssetMenuOpen] = useState(true)
  const [approvalMenuOpen, setApprovalMenuOpen] = useState(true)
  const [misMenuOpen, setMisMenuOpen] = useState(true)
  const [administratorMenuOpen, setAdministratorMenuOpen] = useState(true)

  return (
    <>
      {menuOpen ? <button className="mobile-scrim" aria-label="Close navigation" onClick={onClose} /> : null}
      <aside className={`sidebar ${menuOpen ? 'sidebar-open' : ''}`}>
        <div className="brand-lockup">
          <div className="sidebar-brand"><img className="brand-logo" src={brandIcon} alt="TBK Group AMS — Asset Management System" /></div>
          <button className="sidebar-close" aria-label="Close navigation" onClick={onClose}><Icon name="close" size={18} /></button>
        </div>
        <nav className="primary-nav" aria-label="Main navigation">
          <SidebarLink item={{ page: 'dashboard', label: 'Dashboard', icon: 'dashboard' }} page={page} onNavigate={onNavigate} />
          <div className="sidebar-nav-section">
            <button className="nav-group-trigger" aria-expanded={projectMenuOpen} aria-controls="project-submenu" onClick={() => setProjectMenuOpen((open) => !open)}>
              <Icon name="file" size={19} /><span>Project Management</span><Icon name="down" size={13} className={projectMenuOpen ? 'group-chevron-open' : 'group-chevron-closed'} />
            </button>
            {projectMenuOpen ? <div className="nav-submenu" id="project-submenu"><SidebarLink child item={{ page: 'projects', label: 'Project List' }} page={page} onNavigate={onNavigate} /><SidebarLink child item={{ page: 'create-project', label: 'Create Project' }} page={page} onNavigate={onNavigate} /></div> : null}
          </div>
          <div className="sidebar-nav-section">
            <button className="nav-group-trigger" aria-expanded={assetMenuOpen} aria-controls="asset-management-submenu" onClick={() => setAssetMenuOpen((open) => !open)}>
              <Icon name="box" size={19} /><span>Asset management</span><Icon name="down" size={13} className={assetMenuOpen ? 'group-chevron-open' : 'group-chevron-closed'} />
            </button>
            {assetMenuOpen ? <div className="nav-submenu" id="asset-management-submenu">{ASSET_LINKS.map((item) => <SidebarLink child key={item.page} item={item} page={page} onNavigate={onNavigate} count={item.page === 'assets' ? assetCount : undefined} />)}</div> : null}
          </div>
          <div className="sidebar-nav-section">
            <button className="nav-group-trigger" aria-expanded={approvalMenuOpen} aria-controls="approval-submenu" onClick={() => setApprovalMenuOpen((open) => !open)}>
              <Icon name="check" size={19} /><span>Approval</span><Icon name="down" size={13} className={approvalMenuOpen ? 'group-chevron-open' : 'group-chevron-closed'} />
            </button>
            {approvalMenuOpen ? <div className="nav-submenu" id="approval-submenu"><SidebarLink child item={{ page: 'approval', label: 'My approvals', icon: 'check' }} page={page} onNavigate={onNavigate} /></div> : null}
          </div>
          <div className="sidebar-nav-section">
            <button className="nav-group-trigger" aria-expanded={misMenuOpen} aria-controls="mis-submenu" onClick={() => setMisMenuOpen((open) => !open)}>
              <Icon name="file" size={19} /><span>MIS purchasing</span><Icon name="down" size={13} className={misMenuOpen ? 'group-chevron-open' : 'group-chevron-closed'} />
            </button>
            {misMenuOpen ? <div className="nav-submenu" id="mis-submenu">{MIS_LINKS.map((item) => <SidebarLink child key={item.page} item={item} page={page} onNavigate={onNavigate} />)}</div> : null}
          </div>
          <SidebarLink item={{ page: 'reports', label: 'Report', icon: 'chart' }} page={page} onNavigate={onNavigate} />
          <div className="sidebar-nav-section">
            <button className="nav-group-trigger" aria-expanded={administratorMenuOpen} aria-controls="administrator-submenu" onClick={() => setAdministratorMenuOpen((open) => !open)}>
              <Icon name="settings" size={19} /><span>Administrator</span><Icon name="down" size={13} className={administratorMenuOpen ? 'group-chevron-open' : 'group-chevron-closed'} />
            </button>
            {administratorMenuOpen ? <div className="nav-submenu" id="administrator-submenu"><SidebarLink child item={{ page: 'master', label: 'Manage Asset Type', icon: 'settings' }} page={page} onNavigate={onNavigate} />{Object.entries(ADMIN_PAGES).map(([id, label]) => <SidebarLink child key={id} item={{ page: id, label }} page={page} onNavigate={onNavigate} />)}</div> : null}
          </div>
        </nav>
        <div className="sidebar-bottom">
          <div className="sidebar-profile" aria-label="User profile: Pat S., Administrator">
            <span className="sidebar-profile-avatar">PS</span>
            <div className="sidebar-profile-copy"><strong>Pat S.</strong><span>Administrator</span></div>
            <Icon name="more" size={18} className="sidebar-profile-more" />
          </div>
        </div>
      </aside>
    </>
  )
}
