import { formatPower } from './powerUtils.js'
import { getAssetOwnership } from './assetOwnershipUtils.js'
const DATE_FORMATTER = new Intl.DateTimeFormat('en-GB', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
  timeZone: 'Asia/Bangkok',
})

const ATTENTION_STATUS = /Waiting|Pending|Returned|Hold|Asset Validation/

export function formatDate(value) {
  if (!value) return '—'
  // Calendar fields have no time; completion records contain ISO timestamps.
  const date = new Date(/^\d{4}-\d{2}-\d{2}$/.test(value) ? `${value}T00:00:00+07:00` : value)
  return Number.isNaN(date.getTime()) ? '—' : DATE_FORMATTER.format(date)
}

export function summarizeAssets(assets) {
  const classCounts = new Map()
  const stages = { Draft: 0, Acquisition: 0, Verification: 0, Approval: 0, Active: 0, Sold: 0 }
  let activeAssets = 0
  let draftAssets = 0
  let acquisitionAssets = 0
  let pendingAssets = 0
  let attentionAssets = 0

  for (const asset of assets) {
    classCounts.set(asset.assetClass || 'Unclassified', (classCounts.get(asset.assetClass || 'Unclassified') || 0) + 1)

    if (asset.status === 'Draft') {
      draftAssets += 1
      stages.Draft += 1
    } else if (asset.status === 'Active') {
      activeAssets += 1
      stages.Active += 1
    } else if (asset.status === 'Sold') {
      stages.Sold += 1
    } else if (asset.status.includes('Verification')) {
      stages.Verification += 1
    } else if (asset.status.startsWith('Pending')) {
      pendingAssets += 1
      stages.Approval += 1
    } else {
      stages.Acquisition += 1
    }

    if (!['Active', 'Draft', 'Sold'].includes(asset.status)) acquisitionAssets += 1
    if (ATTENTION_STATUS.test(asset.status)) attentionAssets += 1
  }

  const classSummary = [...classCounts.entries()]
    .map(([category, count]) => ({ category, count }))
    .sort((left, right) => right.count - left.count)
  const stageSummary = Object.entries(stages).map(([label, count]) => ({
    label,
    count,
    style: label.toLowerCase(),
  }))

  return {
    activeAssets,
    acquisitionAssets,
    attentionAssets,
    classSummary,
    draftAssets,
    pendingAssets,
    stageSummary,
  }
}

export function downloadAssetCsv(assets) {
  const headings = ['Asset No. / Draft reference', 'Asset name', 'Asset ownership', 'Customer name', 'Asset class', 'RFQ No.', 'Model', 'Part number', 'Custodian', 'Plant', 'Location', 'Line', 'Power', 'Area', 'Target SOP', 'Status']
  const rows = assets.map((asset) => [
    asset.assetId,
    asset.name,
    getAssetOwnership(asset),
    asset.customerName || '',
    asset.assetClass,
    asset.rfqNo || '',
    asset.model,
    asset.partNo || '',
    asset.custodian,
    asset.plant,
    asset.location,
    asset.line,
    formatPower(asset.power, asset.powerUnit),
    asset.area,
    asset.targetSop,
    asset.status,
  ])
  const csv = [headings, ...rows]
    .map((row) => row.map((value) => `"${String(value ?? '').replaceAll('"', '""')}"`).join(','))
    .join('\n')
  const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' }))
  const link = document.createElement('a')
  link.href = url
  link.download = 'tbkk-asset-register.csv'
  link.click()
  URL.revokeObjectURL(url)
}
