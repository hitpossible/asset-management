import Icon from './Icon.jsx'

export default function TopBar({ pageTitle, sectionTitle = 'Asset management', query, setQuery, attentionAssets, onSearch, onNotice, onOpenMenu, onSignOut }) {
  function handleSearchClick() {
    if (window.matchMedia('(max-width: 700px)').matches) onSearch()
  }

  return (
    <header className="topbar">
      <div className="topbar-left">
        <button className="mobile-menu-button" aria-label="Open navigation" onClick={onOpenMenu}><Icon name="menu" /></button>
        <div className="breadcrumb"><span>{sectionTitle}</span><Icon name="chevron" size={14} /><strong>{pageTitle}</strong></div>
      </div>
      <div className="topbar-right">
        <form className="global-search" onClick={handleSearchClick} onSubmit={(event) => { event.preventDefault(); onSearch() }}>
          <Icon name="search" size={17} />
          <input aria-label="Search assets" placeholder="Search assets..." value={query} onChange={(event) => setQuery(event.target.value)} />
          <kbd>/</kbd>
        </form>
        <button className="icon-button notification-button" aria-label="Notifications" onClick={onNotice}>
          <Icon name="bell" size={19} />{attentionAssets > 0 ? <span className="notification-indicator" /> : null}
        </button>
        <div className="topbar-divider" />
        <div className="profile-button" aria-label="User profile">
          <span className="avatar">PS</span><span className="profile-copy"><strong>Pat S.</strong><small>Administrator</small></span><Icon name="down" size={15} />
        </div>
        <button className="workspace-signout" onClick={onSignOut}>Sign out</button>
      </div>
    </header>
  )
}
