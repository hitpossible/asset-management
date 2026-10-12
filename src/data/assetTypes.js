export const ASSET_TYPE_STORAGE_KEY = 'tbkk-asset-types-v1'

// Demonstration values only. Confirm useful-life settings with Accounting before use.
export const INITIAL_ASSET_TYPES = [
  { id: 'ATM-001', code: 'ME-MCH', name: 'ME - Machine', usefulLifeYears: 10, active: true },
  { id: 'ATM-002', code: 'ME-MH', name: 'ME - Material Handling', usefulLifeYears: 8, active: true },
  { id: 'ATM-003', code: 'IE-INSP', name: 'IE - Inspection Equipment', usefulLifeYears: 5, active: true },
  { id: 'ATM-004', code: 'IT-INFO', name: 'IT - Information Technology', usefulLifeYears: 5, active: true },
  { id: 'ATM-005', code: 'OF-EQP', name: 'OF - Office Equipment', usefulLifeYears: 5, active: true },
  { id: 'ATM-006', code: 'OTHER', name: 'Other', usefulLifeYears: 5, active: true },
]
