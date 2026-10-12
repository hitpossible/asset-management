import { useEffect, useState } from 'react'
import Icon from './Icon.jsx'
import { Field } from './common.jsx'
import { calculateDepreciationBalance } from '../utils/depreciationUtils.js'

function formatTHB(value) {
  return `฿ ${new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(Number(value) || 0)}`
}

function optionalAmount(value) {
  return value === '' ? null : Number(value)
}

export default function AssetDepreciationDialog({ asset, depreciation, onClose, onSave }) {
  const profile = asset.depreciationProfile || {}
  const usesLinkedPOValue = Boolean(depreciation.valueSource && depreciation.valueSource !== 'Asset record')
  const [assetValue, setAssetValue] = useState(usesLinkedPOValue ? '' : depreciation.assetValue ?? '')
  const [startDate, setStartDate] = useState(asset.depreciationStartDate || '')
  const currentAssetValue = usesLinkedPOValue
    ? depreciation.assetValue
    : assetValue === '' ? null : Number(assetValue)
  const currentBalance = calculateDepreciationBalance({
    assetValue: currentAssetValue,
    usefulLifeYears: depreciation.usefulLifeYears,
    startDate,
  })

  useEffect(() => {
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    function closeOnEscape(event) {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', closeOnEscape)
    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', closeOnEscape)
    }
  }, [onClose])

  function submit(event) {
    event.preventDefault()
    const usefulLifeYears = depreciation.usefulLifeYears
    const record = {
      assetId: asset.assetId,
      depreciationStartDate: startDate,
      depreciationProfile: {
        method: usefulLifeYears ? 'Straight-line' : profile.method || '',
        ...(usefulLifeYears ? {
          usefulLifeYears,
          usefulLifeMonths: null,
          annualRatePercent: 100 / usefulLifeYears,
        } : {}),
      },
    }
    if (!usesLinkedPOValue) record.acquisitionValue = optionalAmount(assetValue)
    onSave(record)
  }

  return (
    <div className="asset-lifecycle-modal-mask" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose() }}>
      <section className="asset-lifecycle-modal asset-dp-modal" role="dialog" aria-modal="true" aria-labelledby="asset-dp-dialog-title">
        <header className="asset-lifecycle-modal-header">
          <div><span className="detail-eyebrow">DP DETAILS · {asset.assetId}</span><h2 id="asset-dp-dialog-title">Depreciation profile</h2><p>Useful life and monthly depreciation are calculated from the Asset Type and linked value.</p></div>
          <button className="modal-close" type="button" aria-label="Close DP details" onClick={onClose}><Icon name="close" size={17} /></button>
        </header>
        <div className="asset-lifecycle-context"><span>Asset</span><strong>{asset.name}</strong><small>{asset.assetId}</small></div>
        <form onSubmit={submit}>
          <div className="asset-dp-modal-summary">
            <div><span>Asset Value</span><strong>{currentAssetValue == null ? 'Not recorded' : formatTHB(currentAssetValue)}</strong><small>{usesLinkedPOValue ? `${depreciation.valueSource} · reference` : currentAssetValue == null ? 'Enter a value below' : 'Recorded on the Asset'}</small></div>
            <div><span>Useful Life</span><strong>{depreciation.usefulLifeYears == null ? 'Not recorded' : `${depreciation.usefulLifeYears} years`}</strong><small>{depreciation.assetType?.name || 'Asset Type'}</small></div>
            <div className="is-calculated"><span>Monthly Depreciation</span><strong>{currentBalance.monthlyDepreciation == null ? 'Not recorded' : formatTHB(currentBalance.monthlyDepreciation)}</strong><small>Asset Value ÷ Useful Life ÷ 12</small></div>
            <div><span>Accumulated Depreciation</span><strong>{currentBalance.accumulatedDepreciation == null ? 'Not calculated' : formatTHB(currentBalance.accumulatedDepreciation)}</strong><small>{currentBalance.depreciationPeriods == null ? 'Enter a start date to calculate' : `${currentBalance.depreciationPeriods} monthly period(s)`}</small></div>
            <div className="is-calculated"><span>Net Book Value</span><strong>{currentBalance.netBookValue == null ? 'Not calculated' : formatTHB(currentBalance.netBookValue)}</strong><small>Asset Value − Accumulated Depreciation</small></div>
          </div>
          <div className="asset-lifecycle-form-grid asset-dp-modal-fields">
            {!usesLinkedPOValue ? <Field label="Asset Value (THB)" required><input type="number" min="0" step="0.01" value={assetValue} onChange={(event) => setAssetValue(event.target.value)} placeholder="Enter asset value" required /></Field> : null}
            <Field label="Depreciation Start Date" required><input type="date" value={startDate} onChange={(event) => setStartDate(event.target.value)} required /></Field>
          </div>
          <div className="asset-lifecycle-inline-note"><Icon name="info" size={14} />Accumulated depreciation counts the start month as the first full period and continues through the current month. Partial-month proration, residual value and impairment are not modeled.</div>
          <footer className="asset-lifecycle-actions"><button type="button" className="button button-secondary" onClick={onClose}>Cancel</button><button type="submit" className="button button-primary"><Icon name="check" size={15} />Save DP Details</button></footer>
        </form>
      </section>
    </div>
  )
}
