import { formatDate } from '../utils/assetUtils.js'
import { formatPower } from '../utils/powerUtils.js'
import { getAssetReferences } from '../utils/misReferenceUtils.js'

const display = (value) => value === '' || value == null ? '—' : value
const amount = (value) => value === '' || value == null ? '—' : Number(value).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

function SignatureRow() {
  return <div className="registration-signatures">{['Prepared by', 'Verified by', 'Approved by'].map((label) => <div key={label}><span /><strong>{label}</strong><small>Date: ____ / ____ / ________</small></div>)}</div>
}

export default function AssetRegistrationPages({ row, form, totalPages }) {
  const asset = row.asset
  const refs = getAssetReferences(asset)
  const profile = asset.depreciationProfile || {}
  const customer = asset.ownershipType === 'customer'
  const value = asset.acquisitionValue ?? asset.assetValue ?? row.matchSummary?.poAmount
  const poReferences = refs.purchaseOrderReferences.map((item) => `${item.poNo}${item.itemNo ? ` / ${item.itemNo}` : ''}`).join(', ')
  const vendor = row.purchaseOrder?.vendor || asset.vendor
  const fields = [
    ['Quantity', row.matchSummary?.orderedQuantity], ['Unit', row.unitOfMeasure || row.purchaseOrderLines?.find((item) => item.assetId === asset.assetId)?.unitOfMeasure],
    ['Unit cost', row.matchSummary?.orderedQuantity > 0 && value != null ? amount(value / row.matchSummary.orderedQuantity) : null],
    ['Asset GL account no.', asset.accountCode], ['Asset GL accumulated DP no.', profile.accumulatedAccountCode],
    ['Asset GL expense no.', profile.expenseAccountCode], ['Asset value', amount(value)],
    ['Acquisition date', formatDate(asset.acquisitionDate)], ['Service date', formatDate(form.confirmedSop || asset.targetSop)],
    ['Warranty date', formatDate(asset.warrantyDate)], ['Class', asset.assetClass],
    ['Location', [asset.plant, asset.location, asset.line].filter(Boolean).join(' / ')], ['Custodian', asset.custodian],
    ['Serial number', form.serialNo], ['Purchase Order / Item', poReferences], ['Vendor name', vendor],
    ['Proposal reference', refs.proposalReferences.map((item) => item.reference).join(', ')],
    ['Cost center', asset.costCenter], ['Currency code', 'THB'], ['Temporary reference', asset.temporaryReference],
    ['Building / Floor', asset.plant], ['Main component', asset.parentAssetId],
    ['Power', formatPower(form.power ?? asset.power, form.powerUnit || asset.powerUnit)],
    ['Area (m²)', form.area ?? asset.area], ['RFQ No.', asset.rfqNo], ['Part number', asset.partNo],
  ]
  const financial = [
    ['DP method', customer ? 'Not applicable — Customer Asset' : profile.method],
    ['Acquired value', amount(value)], ['Estimated life (years)', customer ? 'Not applicable' : profile.usefulLifeYears],
    ['Depreciation start date', customer ? 'Not applicable' : formatDate(asset.depreciationStartDate)],
  ]
  const registerFields = [
    ['Asset no.', asset.assetId], ['Description', asset.name], ['Quantity', row.matchSummary?.orderedQuantity],
    ['Model', asset.model], ['Unit cost', fields[2][1]], ['Purchase amount', amount(value)],
    ['Purchase date', formatDate(asset.acquisitionDate)], ['Production date', formatDate(form.confirmedSop || asset.targetSop)],
    ['Warranty date', formatDate(asset.warrantyDate)], ['MFG. no. / Serial no.', form.serialNo],
    ['Invoice no.', refs.invoiceReferences.map((item) => item.reference).join(', ')], ['Class', asset.assetClass],
    ['Location', [asset.plant, asset.location].filter(Boolean).join(' / ')], ['Custodian', asset.custodian],
    ['Dealer / Vendor', vendor], ['Reference', refs.proposalReferences.map((item) => item.reference).join(', ')],
    ['Cost center', asset.costCenter], ['Currency code', 'THB'], ['Electric capacity', formatPower(form.power ?? asset.power, form.powerUnit || asset.powerUnit)],
    ['Site area (m²)', form.area ?? asset.area], ['Line code', asset.line], ['Maker', form.maker],
    ['Investment no.', form.investmentNo], ['Special control item', form.specialControl],
  ]
  return <>
    <article className="control-sheet-page registration-page" aria-label="Asset Details page 1">
      <h2 className="registration-title">ASSET DETAILS</h2>
      <dl className="registration-identity"><div><dt>Asset code:</dt><dd>{display(asset.assetId)}</dd></div><div><dt>Description:</dt><dd>{display(asset.name)}</dd></div></dl>
      <dl className="registration-details">{fields.map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{display(value)}</dd></div>)}</dl>
      <table className="registration-financial"><thead><tr><th>Depreciation information</th><th>Asset record</th></tr></thead><tbody>{financial.map(([label, value]) => <tr key={label}><th scope="row">{label}</th><td>{display(value)}</td></tr>)}</tbody></table>
      <p className="registration-reference-note">Financial data is shown only when recorded. Depreciation is reviewed by Accounting; no residual value or tax depreciation assumptions are applied.</p>
      <SignatureRow />
      <footer>Asset Details · {asset.assetId}<span>1 / {totalPages}</span></footer>
    </article>
    <article className="control-sheet-page registration-page register-form-page" aria-label="Fixed Assets Register Form page 2">
      <h2 className="register-form-title">Fixed Assets Register Form</h2>
      <div className="register-form-layout"><div className="register-entry"><h3>Asset entry</h3><dl className="register-fields">{registerFields.map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{display(value)}</dd></div>)}</dl><h3>Depreciation information</h3><dl className="register-fields">{financial.map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{display(value)}</dd></div>)}</dl></div>
        <aside className="register-document-checks"><h3>Supporting information</h3><p>Registration references</p><dl>{[['Proposal', refs.proposalReferences.map((item) => item.reference).join(', ')], ['PR', refs.purchaseRequisitionReferences.map((item) => item.reference).join(', ')], ['PO / Item', poReferences], ['Invoice(s)', refs.invoiceReferences.map((item) => item.reference).join(', ')], ['Goods Receipt(s)', refs.goodsReceiptReferences.map((item) => item.reference).join(', ')], ['Confirmed SOP', formatDate(form.confirmedSop)], ['Registration date', formatDate(form.registrationDate)]].map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{display(value)}</dd></div>)}</dl><p>Original photographs and identification plates follow on the Control Sheet.</p></aside>
      </div>
      <SignatureRow />
      <p className="registration-reference-note">Prepared from the current Asset record. Signatures are left blank until the responsible persons approve.</p>
      <footer>Fixed Assets Register Form · {asset.assetId}<span>2 / {totalPages}</span></footer>
    </article>
  </>
}
