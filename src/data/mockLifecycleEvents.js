import { isCustomerAsset } from '../utils/assetOwnershipUtils.js'

// Simulated MIS issues. Costs are line totals, not unit prices.
export const INITIAL_LIFECYCLE_EVENTS = [
  { transactionNo: 'SPU-DEMO-0001', assetId: 'ME-2025-0042', type: 'sparePartUsage', title: 'Spindle bearing replacement', sparePart: 'Spindle bearing · NSK 7014', quantity: 2, unit: 'EA', cost: 8400, occurredOn: '2026-07-15', misReference: 'MIS-ISS-2026-0148', status: 'Completed', isDemo: true },
  { transactionNo: 'SPU-DEMO-0002', assetId: 'ME-2025-0042', type: 'sparePartUsage', title: 'Coolant filter replacement', sparePart: 'Coolant filter · CF-100', quantity: 3, unit: 'EA', cost: 2250, occurredOn: '2026-08-20', misReference: 'MIS-ISS-2026-0206', status: 'Completed', isDemo: true },
  { transactionNo: 'SPU-DEMO-0003', assetId: 'ME-2025-0042', type: 'sparePartUsage', title: 'Drive belt replacement', sparePart: 'Drive belt · HTD 8M', quantity: 1, unit: 'EA', cost: 1850, occurredOn: '2026-09-18', misReference: 'MIS-ISS-2026-0251', status: 'Completed', isDemo: true },
  { transactionNo: 'SPU-DEMO-0004', assetId: 'IT-2026-0004', type: 'sparePartUsage', title: 'SFP module replacement', sparePart: 'SFP transceiver · 1G SX', quantity: 2, unit: 'EA', cost: 6400, occurredOn: '2026-08-12', misReference: 'MIS-ISS-2026-0191', status: 'Completed', isDemo: true },
  { transactionNo: 'SPU-DEMO-0005', assetId: 'IT-2026-0004', type: 'sparePartUsage', title: 'Fan module replacement', sparePart: 'Cooling fan module · C9300', quantity: 1, unit: 'EA', cost: 3200, occurredOn: '2026-09-22', misReference: 'MIS-ISS-2026-0265', status: 'Completed', isDemo: true },
]

const PART_TEMPLATES = {
  machine: [
    { sparePart: 'Proximity sensor · M18 inductive', quantity: 2, unit: 'EA', cost: 2400 },
    { sparePart: 'Pneumatic seal kit · SK-40', quantity: 1, unit: 'SET', cost: 1800 },
    { sparePart: 'Contactor · 3P 32A', quantity: 1, unit: 'EA', cost: 1650 },
  ],
  inspection: [
    { sparePart: 'Industrial camera cable · M12', quantity: 1, unit: 'EA', cost: 2800 },
    { sparePart: 'LED inspection light · 24V', quantity: 1, unit: 'EA', cost: 4200 },
    { sparePart: 'Mounting bracket · adjustable', quantity: 2, unit: 'EA', cost: 1200 },
  ],
  it: [
    { sparePart: 'Patch cable · CAT6 3m', quantity: 4, unit: 'EA', cost: 1200 },
    { sparePart: 'SFP transceiver · 10G SR', quantity: 1, unit: 'EA', cost: 4800 },
    { sparePart: 'Power supply module · 350W', quantity: 1, unit: 'EA', cost: 6500 },
  ],
}

export function mergeDemoLifecycleEvents(events, assets = []) {
  const customerAssetIds = new Set(assets.filter(isCustomerAsset).map((asset) => asset.assetId))
  const existing = new Set(events.map((event) => event.transactionNo))
  const issueDate = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Bangkok', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date())
  const assetIssues = assets.filter((asset) => asset.status === 'Active' && !isCustomerAsset(asset)).flatMap((asset) => {
    const category = String(asset.assetClass || '').startsWith('IT') ? 'it' : String(asset.assetClass || '').startsWith('IE') ? 'inspection' : 'machine'
    return PART_TEMPLATES[category].map((part, index) => ({
      ...part,
      transactionNo: `SPU-DEMO-${asset.assetId}-${index + 1}`,
      assetId: asset.assetId,
      assetName: asset.name,
      type: 'sparePartUsage',
      title: part.sparePart,
      occurredOn: issueDate,
      misReference: `MIS-ISS-DEMO-${asset.assetId}-${index + 1}`,
      status: 'Completed',
      isDemo: true,
      remark: 'Simulated MIS spare part issue. Cost is the total for the issued quantity.',
    }))
  })
  return [...events, ...[...INITIAL_LIFECYCLE_EVENTS, ...assetIssues].filter((event) => !existing.has(event.transactionNo))].filter((event) => !customerAssetIds.has(event.assetId))
}
