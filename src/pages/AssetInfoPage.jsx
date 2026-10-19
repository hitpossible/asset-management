import { createAuditRecord } from '../utils/auditLogUtils.js'
import { appendAuditRecords } from '../utils/auditLogStorage.js'
import { getAssetOwnerLabel } from '../utils/assetOwnershipUtils.js'
import { useRef, useState } from 'react'
import { useAssetStore } from '../hooks/useAssetStore.js'
import Icon from '../components/Icon.jsx'
import StatusBadge from '../components/StatusBadge.jsx'
import brandIcon from '../public/tbkk_icon.png'
import { formatDate } from '../utils/assetUtils.js'

function InfoField({ icon, label, value, tone = '' }) {
  return <div className={`scan-info-field ${tone}`}><span className="scan-field-icon"><Icon name={icon} size={23} /></span><div><span>{label}</span><strong>{value || '—'}</strong></div></div>
}

function DocumentPreview({ asset, kind }) {
  return <div className="scan-document-sheet"><span className="scan-document-brand">TBKK (THAILAND) CO.,LTD.</span><h3>{kind === 'card' ? 'Asset card' : 'Machine information'}</h3><p>Preview from the Asset record · {asset.assetId}</p><dl>{[['Asset No.', asset.assetId], ['Asset name', asset.name], ['Asset ownership', getAssetOwnerLabel(asset)], ['Class', asset.assetClass], ['Maker', asset.maker], ['Model', asset.model], ['Serial number', asset.serialNo], ['Power', asset.power], ['Custodian', asset.custodian], ['Plant', asset.plant], ['Location / Line', [asset.location, asset.line].filter(Boolean).join(' / ')], ['Register date', formatDate(asset.registerDate)], ['Status', asset.status]].map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value || '—'}</dd></div>)}</dl></div>
}

export default function AssetInfoPage({ assetId }) {
  const { assets } = useAssetStore()
  const asset = assets.find((record) => record.assetId === assetId)
  const documentDialog = useRef(null)
  const issueDialog = useRef(null)
  const [documentKind, setDocumentKind] = useState('card')
  const [issue, setIssue] = useState('')
  const [reported, setReported] = useState(false)
  const [error, setError] = useState('')
  const [photoFailed, setPhotoFailed] = useState(false)
  const workspaceUrl = window.location.pathname

  function openDocument(kind) {
    setDocumentKind(kind)
    documentDialog.current.showModal()
  }

  function reportIssue(event) {
    event.preventDefault()
    if (!issue.trim()) return
    try {
      const key = 'tbkk-asset-reported-issues-v1'
      const saved = JSON.parse(localStorage.getItem(key) || '[]')
      const records = Array.isArray(saved) ? saved : []
      const report = { id: crypto.randomUUID(), assetId, description: issue.trim(), reportedAt: new Date().toISOString(), status: 'Reported' }
      localStorage.setItem(key, JSON.stringify([...records, report]))
      appendAuditRecords([createAuditRecord({ module: 'Assets', origin: 'asset-info', entityType: 'Issue report', reference: assetId, name: asset.name, before: null, after: report, actor: { id: 'visitor', name: 'Asset information visitor', role: 'Visitor' } })])
      setReported(true)
      setIssue('')
      setError('')
      issueDialog.current.close()
    } catch {
      setError('Could not save the issue in this browser. Please try again.')
    }
  }

  if (!asset) return <main className="asset-scan-page"><section className="scan-not-found"><Icon name="search" size={42} /><h1>Asset not found</h1><p>No Asset record for <strong>{assetId || 'this QR code'}</strong> is available in this browser.</p><p>This mockup uses browser data. Assets created on another device are not synced.</p><a className="button button-primary" href={workspaceUrl}>Open Asset Workspace</a></section></main>

  const hasPhoto = Boolean(asset.photoUrl) && !photoFailed
  const expiryDate = asset.expiryDate ? new Date(asset.expiryDate) : null
  const expired = expiryDate && !Number.isNaN(expiryDate.getTime()) && asset.expiryDate.slice(0, 10) < new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Bangkok' }).format(new Date())

  return <main className="asset-scan-page">
    <div className="asset-scan-container">
      <header className="scan-header"><a href={workspaceUrl} aria-label="Open Asset Workspace" className="scan-brand"><img src={brandIcon} alt="TBKK" /></a><div className="scan-header-copy"><h1>TBKK Asset Information</h1><p>ข้อมูลสินทรัพย์และเอกสารประจำเครื่อง</p></div><StatusBadge status={asset.status} /></header>
      <article className="scan-asset-card">
        <div className="scan-profile-grid">
          <section className="scan-photo-panel" aria-label="Asset photo">
            <div className="scan-photo">{hasPhoto ? <img src={asset.photoUrl} alt={asset.name} onError={() => setPhotoFailed(true)} /> : <div className="scan-photo-empty"><Icon name="factory" size={110} /><strong>{asset.name}</strong><span>ยังไม่มีรูปสินทรัพย์ · No Asset photo</span><small>{asset.model || asset.assetClass}</small></div>}</div>
            <div className="scan-photo-id"><span>Asset ID</span><strong>{asset.assetId}</strong></div>
          </section>
          <section className="scan-profile"><InfoField icon="box" label="Asset ownership" value={getAssetOwnerLabel(asset)} />
            <span className="scan-section-tag">Machine profile (ข้อมูลเครื่องจักร)</span>
            <h2>{asset.name}</h2><p className="scan-profile-subtitle">{[asset.assetId, asset.department || asset.area, asset.line].filter((value) => value && value !== '—').join(' · ')}</p>
            <div className="scan-owner"><span className="scan-owner-icon"><Icon name="user" size={28} /></span><div><span>Custodian / Engineer (ผู้รับผิดชอบ)</span><strong>{asset.custodian || '—'}</strong><small>{[asset.department, asset.plant].filter(Boolean).join(' · ') || '—'}</small></div><button type="button" className="button button-primary scan-report-button" onClick={() => issueDialog.current.showModal()}><Icon name="alert" size={18} />Report issue (แจ้งปัญหา)</button></div>
            {reported ? <p className="scan-issue-success" role="status"><Icon name="check" size={16} />Issue saved in this browser (mockup). ยังไม่ได้ส่งให้ทีมงาน</p> : null}
            <div className="scan-fields">
              <InfoField icon="factory" label="Zone / Department (โซน / แผนก)" value={asset.department || asset.area} />
              <InfoField icon="pin" label="Line / Location (ไลน์ / ตำแหน่ง)" value={[asset.line, asset.location].filter((value) => value && value !== '—').join(' / ')} />
              <InfoField icon="tag" label="Asset No. (รหัสทรัพย์สิน)" value={asset.assetId} />
              <InfoField icon="settings" label="Machine Power (กำลังเครื่องจักร)" value={asset.power} />
              <InfoField icon="wrench" label="Maker / Model (ผู้ผลิต / รุ่น)" value={[asset.maker, asset.model].filter(Boolean).join(' / ')} />
              <InfoField icon="file" label="Serial Number (หมายเลขเครื่อง)" value={asset.serialNo} />
              <InfoField icon="calendar" label="Register Date (วันที่ขึ้นทะเบียน)" value={formatDate(asset.registerDate)} />
              <InfoField icon="calendar" label="Expiry Date (วันหมดอายุ)" value={formatDate(asset.expiryDate)} tone={expired ? 'scan-field-expired' : ''} />
              {asset.parentAssetId ? <InfoField icon="box" label="Parent Asset (สินทรัพย์หลัก)" value={asset.parentAssetId} /> : null}
            </div>
          </section>
        </div>
        <section className="scan-documents"><span className="scan-section-tag">Asset documents</span><h2>เอกสารประจำ Asset</h2><p>ข้อมูลเครื่องและทะเบียนสินทรัพย์ · เปิดดูจากข้อมูล Asset ปัจจุบัน</p><div className="scan-document-grid">{[{ kind: 'machine', name: asset.assetId, hint: 'Machine information · ข้อมูลประจำเครื่อง' }, { kind: 'card', name: 'Asset card', hint: 'Asset register · ทะเบียนสินทรัพย์' }].map((doc) => <button type="button" className="scan-document" key={doc.kind} onClick={() => openDocument(doc.kind)}><span className="scan-document-thumbnail"><Icon name="file" size={30} /></span><span><strong>{doc.name}</strong><small>{doc.hint}</small><small>Record preview · ตัวอย่างจากข้อมูลระบบ</small></span><Icon name="chevron" size={22} /></button>)}</div></section>
      </article>
      <footer className="scan-footer"><span>TBKK (THAILAND) CO.,LTD.</span><a href={workspaceUrl}>Open Asset Workspace<Icon name="chevron" size={14} /></a></footer>
    </div>
    <dialog className="scan-modal" ref={documentDialog} aria-labelledby="scan-document-title"><div className="scan-modal-header"><h2 id="scan-document-title">{documentKind === 'card' ? 'Asset card' : 'Machine information'}</h2><button type="button" className="modal-close" aria-label="Close document" onClick={() => documentDialog.current.close()}><Icon name="close" size={18} /></button></div><DocumentPreview asset={asset} kind={documentKind} /><div className="scan-modal-footer"><button className="button button-secondary" onClick={() => documentDialog.current.close()}>Close</button></div></dialog>
    <dialog className="scan-modal" ref={issueDialog} aria-labelledby="scan-issue-title"><form onSubmit={reportIssue}><div className="scan-modal-header"><h2 id="scan-issue-title">Report issue (แจ้งปัญหา)</h2><button type="button" className="modal-close" aria-label="Close issue form" onClick={() => issueDialog.current.close()}><Icon name="close" size={18} /></button></div><div className="scan-issue-body"><strong>{asset.assetId} · {asset.name}</strong><label htmlFor="scan-issue-description">Problem / Description (รายละเอียดปัญหา)</label><textarea id="scan-issue-description" value={issue} onChange={(event) => setIssue(event.target.value)} rows={5} maxLength={2000} required /><p>Mockup: saves in this browser. No notification is sent.</p>{error ? <p role="alert">{error}</p> : null}</div><div className="scan-modal-footer"><button type="button" className="button button-secondary" onClick={() => issueDialog.current.close()}>Cancel</button><button type="submit" className="button button-primary scan-report-button" disabled={!issue.trim()}>Save issue</button></div></form></dialog>
  </main>
}
