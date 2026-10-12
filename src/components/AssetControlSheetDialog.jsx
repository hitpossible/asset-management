import { useEffect, useRef } from 'react'
import { AssetControlSheet } from './AssetControlSheet.jsx'
import Icon from './Icon.jsx'

export default function AssetControlSheetDialog({ asset, purchaseOrders = [], onClose }) {
  const dialogRef = useRef(null)
  const sheet = asset.assetControlSheet
  useEffect(() => {
    const previousFocus = document.activeElement
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    dialogRef.current.showModal()
    return () => {
      document.body.style.overflow = previousOverflow
      previousFocus?.focus()
    }
  }, [])

  return <dialog ref={dialogRef} className="detail-dialog asset-detail-dialog asset-control-sheet-dialog" aria-labelledby="asset-control-sheet-title" onCancel={(event) => { event.preventDefault(); onClose() }} onClick={(event) => {
    if (event.target !== event.currentTarget) return
    const rect = event.currentTarget.getBoundingClientRect()
    if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) onClose()
  }}>
    <div className="asset-detail-scroll-content">
      <header className="detail-header"><div><span className="detail-eyebrow">Asset document</span><h2 id="asset-control-sheet-title">Asset Control Sheet</h2><p className="detail-id">{asset.assetId} · {asset.name}</p>{sheet?.reviewedAt ? <p className="asset-control-sheet-submitted">Submitted {new Date(sheet.reviewedAt).toLocaleString('en-GB', { timeZone: 'Asia/Bangkok' })} · 2 pages</p> : null}</div><button type="button" className="modal-close" aria-label="Close Asset Control Sheet" onClick={onClose} autoFocus><Icon name="close" size={18} /></button></header>
      {sheet ? <AssetControlSheet row={{ asset: sheet.documentAsset || asset, poNo: sheet.purchaseOrder?.poNo || asset.poNo, purchaseOrder: sheet.purchaseOrder || purchaseOrders.find((po) => po.poNo === asset.poNo) }} form={sheet.form || {}} photos={sheet.photos || {}} specialNA={sheet.specialNA || false} /> : <div className="asset-approval-sheet-empty"><Icon name="file" size={32} /><strong>No Asset Control Sheet has been submitted</strong><p>The document will be available here after the Asset Team submits Asset Validation.</p></div>}
    </div>
    <footer className="detail-footer"><button type="button" className="button button-secondary" onClick={onClose}>Close preview</button></footer>
  </dialog>
}
