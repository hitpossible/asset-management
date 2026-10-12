export const CUSTODIANS = [
  'Anan Charoen',
  'Chaiwat Lert',
  'Krit Thana',
  'Maya Singh',
  'Nattaya Kittisak',
  'Pimchanok Rattanakorn',
  'Somchai Prasert',
  'Somsak Preecha',
  'Thanawat Viroj',
  'Wichai Srisuk',
]

export const BUILDINGS = ['BD F10-1', 'BD F10-2', 'BD F10-2-1', 'BD F10-3', 'BD F10-3-1']
export const ASSET_LOCATIONS = ['K1PD1', 'K1PD2', 'K1PD3', 'K1PD4']
export const ASSET_LINES = ['K1A001', 'K1M167', 'K1D004', 'K1B097']
export const ASSET_MODELS = ['Mazak QT-250', 'Fanuc LR Mate', 'Komatsu H1F-200', 'Noriscon Encore', 'Dorin FlexMove']
export const CUSTOMERS = ['Isuzu Motors (Thailand) Co., Ltd.', 'Hino Motors Manufacturing (Thailand) Ltd.', 'Toyota Motor Thailand Co., Ltd.']

export const ASSET_STATUSES = [
  'Draft',
  'Proposal Processing',
  'Purchasing',
  'Waiting Delivery',
  'Waiting Invoice',
  'Waiting GR',
  'Asset Validation',
  'Ready for Verification',
  'Verification In Progress',
  'Pending Asset Team Leader Approval',
  'Pending Accounting Review',
  'Pending Accounting Approval',
  'Active',
  'Sold',
  'Returned for Correction',
  'On Hold',
]

export const EMPTY_ASSET_FORM = {
  projectCode: '',
  projectName: '',
  ownershipType: 'company',
  customerName: '',
  name: '',
  assetClass: '',
  model: '',
  custodian: '',
  plant: '',
  location: '',
  line: '',
  power: '',
  area: '',
  targetSop: '',
  notes: '',
}
