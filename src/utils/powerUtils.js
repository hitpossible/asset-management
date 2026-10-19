export const POWER_UNITS = ['kW', 'W', 'HP', 'kVA']

export function formatPower(value, unit = 'kW') {
  const text = String(value ?? '').trim()
  if (!text) return ''
  return Number.isFinite(Number(text)) ? `${text} ${unit || 'kW'}` : text
}
