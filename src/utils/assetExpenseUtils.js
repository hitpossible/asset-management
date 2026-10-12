export function getAssetExpenses(assetId, events) {
  const totals = { maintenance: 0, spareParts: 0, subAssets: 0, modifications: 0 }
  for (const event of events) {
    if (event.assetId !== assetId || event.status !== 'Completed') continue
    const amount = Number(['maintenance', 'sparePartUsage'].includes(event.type) ? event.cost : event.value)
    if (!Number.isFinite(amount) || amount < 0) continue
    if (event.costTreatment === 'Capitalized') continue
    if (event.type === 'maintenance') totals.maintenance += amount
    if (event.type === 'sparePartUsage') totals.spareParts += amount
    if (event.type === 'subAsset' && amount <= 50_000) totals.subAssets += amount
    if (event.type === 'modification' && amount <= 50_000) totals.modifications += amount
  }
  return { ...totals, total: Object.values(totals).reduce((sum, amount) => sum + amount, 0) }
}
