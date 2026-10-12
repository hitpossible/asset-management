export function getAssetInfoUrl(assetId, pageUrl = window.location.href) {
  const url = new URL(pageUrl)
  url.search = ''
  url.hash = ''
  url.searchParams.set('asset', assetId)
  return url.href
}
