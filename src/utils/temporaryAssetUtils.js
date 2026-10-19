export function getAssetNumberYear() {
  return new Intl.DateTimeFormat('en', { year: 'numeric', timeZone: 'Asia/Bangkok' }).format(new Date())
}

export function getNextTemporaryAssetId(assets, year = getAssetNumberYear()) {
  const prefix = `TMP-${year}-`
  const highest = assets.reduce((max, asset) => {
    const id = asset.temporaryReference || asset.assetId || ''
    const suffix = id.startsWith(prefix) ? id.slice(prefix.length) : ''
    return /^\d+$/.test(suffix) ? Math.max(max, Number(suffix)) : max
  }, 0)
  return `${prefix}${String(highest + 1).padStart(4, '0')}`
}

