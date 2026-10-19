import { getAssetOwnerLabel } from '../utils/assetOwnershipUtils.js'
import { useCallback, useState } from 'react'
import { formatDate } from '../utils/assetUtils.js'
import AssetDetailDialog from './AssetDetailDialog.jsx'
import AssetLabelDialog from './AssetLabelDialog.jsx'
import AssetControlSheetDialog from './AssetControlSheetDialog.jsx'
import Icon from './Icon.jsx'
import StatusBadge from './StatusBadge.jsx'

export default function AssetTable({ assets, allAssets = assets, assetTypes = [], purchaseOrders = [], compact = false, onEdit, onCreateSubAsset, onSaveDPDetails, lifecycleEvents = [], onTransfer, onAdvanceTransfer, listStyle = false, selectedIds = [], onToggleSelection, onTogglePageSelection, sort, onSort }) {
  const [selectedAsset, setSelectedAsset] = useState(null)
  const [labelAsset, setLabelAsset] = useState(null)
  const [controlSheetAsset, setControlSheetAsset] = useState(null)
  const closeDetails = useCallback(() => setSelectedAsset(null), [])

  const editSelectedDraft = useCallback((asset) => {
    closeDetails()
    onEdit(asset)
  }, [closeDetails, onEdit])

  const columns = listStyle
    ? [['name', 'Asset'], ['assetClass', 'Asset class'], ['location', 'Location / line'], ['custodian', 'Custodian'], ['targetSop', 'Target SOP'], ['status', 'Status']]
    : [['name', 'Asset'], ['assetClass', 'Asset class'], ['custodian', 'Custodian'], ['location', 'Plant / location'], ['targetSop', 'Target SOP'], ['status', 'Status']]

  return (
    <>
      <div className={`table-scroll ${compact ? 'table-compact' : ''}`}>
        <table className={`asset-table ${listStyle ? 'asset-register-table' : ''}`}>
          <thead><tr>{listStyle ? <th className="asset-select-column"><input type="checkbox" aria-label="Select all assets on this page" checked={assets.length > 0 && assets.every((asset) => selectedIds.includes(asset.assetId))} disabled={!assets.length} onChange={onTogglePageSelection} /></th> : null}{columns.map(([key, label]) => <th key={key} aria-sort={listStyle && sort?.key === key ? sort.direction : undefined}>{listStyle ? <button className="asset-sort-button" onClick={() => onSort(key)}>{label}<Icon name="down" size={12} className={sort?.key === key && sort.direction === 'ascending' ? 'sort-ascending' : ''} /></button> : label}</th>)}<th>{listStyle ? 'Actions' : <span className="sr-only">Actions</span>}</th></tr></thead>
          <tbody>
            {assets.map((asset, index) => (
              <tr key={asset.assetId} className={listStyle && selectedIds.includes(asset.assetId) ? 'asset-row-selected' : ''}>
                {listStyle ? <td className="asset-select-column"><input type="checkbox" aria-label={`Select ${asset.name}`} checked={selectedIds.includes(asset.assetId)} onChange={() => onToggleSelection(asset.assetId)} /></td> : null}
                <td><div className="asset-cell"><span className={`asset-avatar asset-avatar-${index % 5}`}><Icon name={asset.assetClass?.startsWith('IT') ? 'file' : asset.assetClass?.startsWith('IE') ? 'tag' : 'box'} size={17} /></span><span><strong>{asset.name}</strong><small>{asset.assetId.startsWith('TMP-') ? 'Draft ref. ' : ''}{asset.assetId} <span className="asset-cell-separator">/</span> {asset.model || 'Model not set'}</small><small>{getAssetOwnerLabel(asset)}</small></span></div></td>
                <td><span className="table-category">{asset.assetClass || '—'}</span></td>
                {listStyle ? <td><span className="table-location"><Icon name="pin" size={14} />{[asset.plant, asset.location, asset.line !== '—' ? asset.line : ''].filter(Boolean).join(' · ') || '—'}</span></td> : null}
                <td><span className="assigned-cell"><span className="assigned-avatar">{(asset.custodian || '—').split(' ').map((part) => part[0]).slice(0, 2).join('')}</span>{asset.custodian || 'Unassigned'}</span></td>
                {!listStyle ? <td><span className="table-location"><Icon name="pin" size={14} />{[asset.plant, asset.location, asset.line !== '—' ? asset.line : ''].filter(Boolean).join(' · ') || '—'}</span></td> : null}
                <td>{formatDate(asset.targetSop)}</td>
                <td><StatusBadge status={asset.status} /></td>
                <td><div className="asset-row-actions">{listStyle ? <button type="button" className="asset-row-detail-action" aria-label={`View Asset Control Sheet for ${asset.name}`} title="Asset Control Sheet" onClick={() => setControlSheetAsset(asset)}><Icon name="file" size={18} /></button> : null}<button type="button" className="asset-row-detail-action" aria-label={`Preview asset label for ${asset.name}`} title="Preview Asset Label" onClick={() => setLabelAsset(asset)}><Icon name="tag" size={18} /></button><button className="asset-row-detail-action" aria-label={`View details for ${asset.name}`} onClick={() => setSelectedAsset(asset)} title={`View details for ${asset.name}`}>{listStyle ? <Icon name="more" size={19} /> : <>View details<Icon name="chevron" size={13} /></>}</button></div></td>
              </tr>
            ))}
            {assets.length === 0 ? <tr><td colSpan={listStyle ? 8 : 7}><div className="empty-table"><span className="empty-table-icon"><Icon name="search" size={20} /></span><strong>No assets found</strong><p>Try changing your search or filters.</p></div></td></tr> : null}
          </tbody>
        </table>
        <div className="mobile-asset-list">
          {assets.map((asset, index) => (
            <article className="mobile-asset-card" key={asset.assetId}>
              <div className="mobile-asset-top"><span className={`asset-avatar asset-avatar-${index % 5}`}><Icon name="box" size={17} /></span><StatusBadge status={asset.status} /></div>
              <strong>{asset.name}</strong>
              <span className="mobile-asset-id">{asset.assetId} · {asset.assetClass}</span>
              <div className="mobile-asset-meta"><span><Icon name="pin" size={14} />{[asset.plant, asset.location, asset.line !== '—' ? asset.line : ''].filter(Boolean).join(' · ')}</span><span>{formatDate(asset.targetSop)}</span></div>
              <small>{getAssetOwnerLabel(asset)}</small><small className="mobile-custodian">Custodian: {asset.custodian || 'Unassigned'}</small>
              {listStyle ? <button type="button" className="mobile-detail-button" onClick={() => setControlSheetAsset(asset)}><Icon name="file" size={14} />Asset Control Sheet</button> : null}
              <button className="mobile-detail-button" onClick={() => setLabelAsset(asset)}><Icon name="tag" size={14} />Preview Asset Label</button>
              <button className="mobile-detail-button" onClick={() => setSelectedAsset(asset)}>View asset details<Icon name="chevron" size={14} /></button>
            </article>
          ))}
          {assets.length === 0 ? <div className="empty-table"><strong>No assets found</strong><p>Try changing your search or filters.</p></div> : null}
        </div>
      </div>
      {controlSheetAsset ? <AssetControlSheetDialog asset={allAssets.find((asset) => asset.assetId === controlSheetAsset.assetId) || controlSheetAsset} purchaseOrders={purchaseOrders} onClose={() => setControlSheetAsset(null)} /> : null}
      {labelAsset ? <AssetLabelDialog asset={allAssets.find((asset) => asset.assetId === labelAsset.assetId) || labelAsset} onClose={() => setLabelAsset(null)} /> : null}
      <AssetDetailDialog
        asset={selectedAsset ? allAssets.find((asset) => asset.assetId === selectedAsset.assetId) || selectedAsset : null}
        assets={allAssets}
        assetTypes={assetTypes}
        purchaseOrders={purchaseOrders}
        onClose={closeDetails}
        onEdit={onEdit ? editSelectedDraft : undefined}
        onCreateSubAsset={onCreateSubAsset}
       
        onSaveDPDetails={onSaveDPDetails}
        lifecycleEvents={lifecycleEvents}
        onTransfer={onTransfer}
        onAdvanceTransfer={onAdvanceTransfer}
      />
    </>
  )
}
