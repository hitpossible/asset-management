import { calculateDepreciationBalance, getAssetDepreciationData } from './depreciationUtils.js'
import { isCustomerAsset } from './assetOwnershipUtils.js'

export const REPORT_COLUMNS = ['openingCost', 'closingCost', 'additions', 'openingDP', 'openingNBV', 'monthlyDP', 'closingDP', 'closingNBV', 'disposals', 'disposedDP']
const emptyAmounts = () => Object.fromEntries(REPORT_COLUMNS.map((key) => [key, 0]))
export const DETAIL_COLUMNS = [
  ['assetId', 'AsstCode'], ['name', 'AsstDes'], ['assetClass', 'AsstCls'], ['line', 'Line Code'],
  ['acquisitionDate', 'AcqDate'], ['serviceDate', 'ServDate'], ['entryDate', 'ENTDATE'],
  ['assetValue', 'AsstVal'], ['unitCost', 'UnitCost'], ['quantity', 'Qty'], ['method', 'DPMthd'],
  ['usefulLifeYears', 'EstLf'], ['yearOpeningDP', 'YTDAcmDP'], ['monthlyDP', 'CurrntDP'],
  ['yearToDateDP', 'CurrntYTD'], ['closingDP', 'CurrntYTDAcm'], ['closingNBV', 'NetVal'],
  ['status', 'AsstStatus'], ['startDate', 'DP Start Date'],
].map(([key, label]) => ({ key, label, numeric: ['assetValue', 'unitCost', 'quantity', 'usefulLifeYears', 'yearOpeningDP', 'monthlyDP', 'yearToDateDP', 'closingDP', 'closingNBV'].includes(key) }))

export function buildMonthlyDepreciationReport(assets, assetTypes, purchaseOrders, month) {
  if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(month)) throw new Error('Select a valid report month.')
  const [year, monthNumber] = month.split('-').map(Number)
  const closingDate = new Date(year, monthNumber, 0)
  const openingDate = new Date(year, monthNumber - 1, 0)
  const groups = new Map()
  const excluded = []
  let assetCount = 0
  for (const asset of assets) {
    const soldOn = asset.status === 'Sold' ? asset.disposalRecord?.soldOn : null
    const soldMonth = soldOn?.slice(0, 7)
    if (isCustomerAsset(asset) || (asset.status !== 'Active' && !soldOn) || (soldMonth && soldMonth < month)) continue
    const soldThisMonth = soldMonth === month
    const dp = getAssetDepreciationData(asset, assetTypes, purchaseOrders)
    const start = new Date(`${String(asset.depreciationStartDate || '').slice(0, 10)}T00:00:00`)
    if (dp.assetValue == null || dp.assetValue < 0 || !dp.usefulLifeYears || Number.isNaN(start.getTime())) {
      excluded.push(asset)
      continue
    }
    if (start > closingDate) continue
    const cutoff = asset.depreciationStopDate ? new Date(`${asset.depreciationStopDate}T00:00:00`) : null
    const balanceAt = (date) => calculateDepreciationBalance({ ...dp, startDate: asset.depreciationStartDate, asOfDate: cutoff && cutoff < date ? cutoff : date })
    const closing = balanceAt(closingDate)
    const opening = balanceAt(openingDate)
    const yearOpening = balanceAt(new Date(year, 0, 0))
    const openingCost = start <= openingDate ? dp.assetValue : 0
    const values = {
      openingCost, closingCost: soldThisMonth ? 0 : dp.assetValue, additions: dp.assetValue - openingCost,
      disposals: soldThisMonth ? dp.assetValue : 0, disposedDP: soldThisMonth ? closing.accumulatedDepreciation : 0,
      openingDP: opening.accumulatedDepreciation, openingNBV: openingCost - opening.accumulatedDepreciation,
      monthlyDP: closing.accumulatedDepreciation - opening.accumulatedDepreciation,
      closingDP: soldThisMonth ? 0 : closing.accumulatedDepreciation, closingNBV: soldThisMonth ? 0 : closing.netBookValue,
    }
    const description = dp.assetType?.name || asset.assetClass || 'Unclassified'
    if (!groups.has(description)) groups.set(description, { description, count: 0, assets: [], ...emptyAmounts() })
    const group = groups.get(description)
    const quantity = Number(asset.quantity) > 0 ? Number(asset.quantity) : 1
    group.assets.push({
      assetId: asset.assetId, name: asset.name, assetClass: asset.assetClass || dp.assetType?.code,
      line: asset.lineCode || asset.line, acquisitionDate: asset.acquisitionDate || '',
      serviceDate: asset.serviceDate || asset.confirmedSop || '', entryDate: asset.entryDate || asset.createdAt || '',
      assetValue: dp.assetValue, unitCost: dp.assetValue / quantity, quantity, method: 'SLM',
      usefulLifeYears: dp.usefulLifeYears, yearOpeningDP: yearOpening.accumulatedDepreciation,
      monthlyDP: values.monthlyDP, yearToDateDP: closing.accumulatedDepreciation - yearOpening.accumulatedDepreciation,
      closingDP: values.closingDP, closingNBV: values.closingNBV, status: soldThisMonth ? 'Sold' : 'Active',
      startDate: asset.depreciationStartDate,
    })
    group.count += 1
    for (const key of REPORT_COLUMNS) group[key] += values[key]
    assetCount += 1
  }
  const rows = [...groups.values()].sort((a, b) => a.description.localeCompare(b.description))
  for (const row of rows) row.assets.sort((a, b) => a.assetId.localeCompare(b.assetId, undefined, { numeric: true }))
  const total = { description: 'TOTAL', count: assetCount, ...emptyAmounts() }
  for (const row of rows) for (const key of REPORT_COLUMNS) total[key] += row[key]
  return { rows, total, excluded, openingDate, closingDate, assetCount }
}
