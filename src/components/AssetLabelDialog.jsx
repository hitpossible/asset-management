import { isCustomerAsset, getAssetOwnerLabel } from '../utils/assetOwnershipUtils.js'
import { useEffect, useRef } from 'react'
import qrcode from 'qrcode-generator'
import Icon from './Icon.jsx'
import { getAssetInfoUrl } from '../utils/assetLabelUtils.js'

const REGISTER_DATE_FORMAT = new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Bangkok', day: '2-digit', month: '2-digit', year: 'numeric' })

function registerDate(value) {
  if (!value) return '—'
  const date = new Date(/^\d{4}-\d{2}-\d{2}$/.test(value) ? `${value}T00:00:00+07:00` : value)
  return Number.isNaN(date.getTime()) ? '—' : REGISTER_DATE_FORMAT.format(date)
}

function labelLines(value, limit = 30) {
  const words = String(value || '—').split(/\s+/)
  const lines = ['']
  for (const word of words) {
    if (lines.at(-1) && lines.at(-1).length + word.length + 1 > limit) lines.push('')
    lines[lines.length - 1] += `${lines.at(-1) ? ' ' : ''}${word}`
  }
  return lines
}

function AssetLabel({ asset }) {
  const customerAsset = isCustomerAsset(asset)
  const background = customerAsset ? '#78a843' : '#075da9'
  const ink = customerAsset ? '#111b32' : '#fff'
  const qr = qrcode(0, 'M')
  // Open the standalone information page for this exact Main or Sub Asset.
  qr.addData(getAssetInfoUrl(asset.assetId), 'Byte')
  qr.make()
  const count = qr.getModuleCount()
  const nameLines = labelLines(asset.name)
  const nameSize = Math.min(28, 88 / nameLines.length, 470 / Math.max(...nameLines.map((line) => line.length)) * 1.6)
  const rows = [
    ['Asset No.', [asset.assetId], 28],
    ['Asset Name', nameLines, nameSize],
    ['Register Date', [registerDate(asset.registerDate)], 28],
    ['Export License No.', [asset.exportLicenseNo || '—'], 26],
  ]
  return <svg className="asset-identification-label" viewBox="0 0 1120 570" role="img" aria-label={`${customerAsset ? 'Customer Asset' : 'Asset identification'} label for ${asset.assetId}: ${asset.name}`} xmlns="http://www.w3.org/2000/svg">
    <rect x="7" y="7" width="1106" height="556" rx="36" fill={background} stroke="#d6e7f4" strokeWidth="3" />
    <path d="M435 9 H1078 Q1111 9 1111 44 V165 H572 Q543 165 525 138 Z" fill="#fff" />
    {!customerAsset ? <><g fill="none" stroke="#fff" strokeWidth="10"><path d="M264 67 A66 66 0 1 0 267 143" /><path d="M158 83 H315" /></g>
    <text x="157" y="139" fill="#fff" fontFamily="Arial, sans-serif" fontWeight="900" fontStyle="italic" fontSize="63">TBKK</text></> : null}
    <g fill={background} fontFamily="Noto Sans, Noto Sans Thai, Arial, sans-serif" fontWeight="700"><text x="615" y="86" fontSize={customerAsset ? 44 : 39}>{customerAsset ? 'CUSTOMER ASSET' : 'ASSET IDENTIFICATION'}</text><text x="617" y="134" fontSize="30">{customerAsset ? 'ทรัพย์สินของลูกค้า' : 'ป้ายระบุสินทรัพย์'}</text></g>
    {rows.map(([label, lines, fontSize], index) => {
      const y = 203 + index * 72
      return <g key={label} fontFamily="Arial, sans-serif"><text x="55" y={y + 39} fill={ink} fontSize="30" fontWeight={customerAsset ? 700 : 400} textLength={label.length > 15 ? 275 : undefined} lengthAdjust="spacingAndGlyphs">{label}</text><text x="321" y={y + 39} fill={ink} fontSize="30" fontWeight={customerAsset ? 700 : 400}>:</text><rect x="348" y={y} width="445" height="59" rx="7" fill="#fff" stroke="#c6dbea" strokeWidth="2" />{lines.map((line, lineIndex) => <text key={lineIndex} x="365" y={y + 30 + (lineIndex - (lines.length - 1) / 2) * (fontSize + 2)} dominantBaseline="central" fill="#111b32" fontSize={fontSize} fontWeight="700" textLength={line.length * fontSize * 0.6 > 410 ? 410 : undefined} lengthAdjust="spacingAndGlyphs">{line}</text>)}</g>
    })}
    <rect x="813" y="203" width="246" height="236" rx="8" fill="#fff" stroke="#c6dbea" strokeWidth="2" />
    <svg x="839" y="226" width="196" height="190" viewBox={`-4 -4 ${count + 8} ${count + 8}`} shapeRendering="crispEdges" aria-hidden="true">
      <rect x="-4" y="-4" width={count + 8} height={count + 8} fill="#fff" />
      <path fill="#111" d={Array.from({ length: count }, (_, row) => Array.from({ length: count }, (_, col) => qr.isDark(row, col) ? `M${col} ${row}h1v1h-1z` : '').join('')).join('')} />
    </svg>
    <text x="936" y="482" textAnchor="middle" fill={ink} fontFamily="Arial, sans-serif" fontSize="35" fontWeight={customerAsset ? 700 : 400}>SCAN ME</text>
    <path d="M55 502 H1064" stroke={customerAsset ? '#334b27' : '#dcebf8'} strokeWidth="2" />
    {!customerAsset ? <text x="560" y="546" textAnchor="middle" fill="#fff" fontFamily="Arial, sans-serif" fontSize="30">TBKK (THAILAND) CO.,LTD.</text> : null}
  </svg>
}

export default function AssetLabelDialog({ asset, onClose }) {
  const dialogRef = useRef(null)
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

  return <dialog ref={dialogRef} className="asset-label-dialog" aria-labelledby="asset-label-title" onCancel={(event) => { event.preventDefault(); onClose() }} onClick={(event) => { if (event.target === event.currentTarget) { const rect = event.currentTarget.getBoundingClientRect(); if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) onClose() } }}>
    <header className="asset-label-dialog-header"><div><h2 id="asset-label-title">Preview Asset Label</h2><p>{asset.assetId} · {asset.name}</p><p>{getAssetOwnerLabel(asset)}</p></div><button type="button" className="modal-close" aria-label="Close asset label preview" onClick={onClose} autoFocus><Icon name="close" size={18} /></button></header>
    <div className="asset-label-preview"><AssetLabel asset={asset} /></div>
    <p className="asset-label-note"><Icon name="info" size={16} />Scan the QR code to open Asset information. Missing Register Date or Export License No. is shown as “—”.</p>
    <footer className="asset-label-dialog-footer"><a className="button button-primary" href={getAssetInfoUrl(asset.assetId)} target="_blank" rel="noopener noreferrer"><Icon name="box" size={16} />Open Asset information</a><button type="button" className="button button-secondary" onClick={onClose}>Close preview</button></footer>
  </dialog>
}
