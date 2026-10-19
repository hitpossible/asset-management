// Local e-Tax reference data for the Disposal mockup.
export const MOCK_SALE_PROPOSALS = [
  {
    saleProposalNo: 'SALE-2026-0012',
    buyer: 'Siam Industrial Trading Co., Ltd.',
    status: 'Approved',
    assetIds: ['ME-2025-0042', 'IT-2026-0004'],
  },
  {
    saleProposalNo: 'SALE-2026-0009',
    buyer: 'Eastern Machinery Resale Ltd.',
    status: 'Approved',
    assetIds: ['ME-2024-0017'],
  },
]

export const MOCK_TAX_INVOICES = [
  {
    taxInvoiceNo: 'ETAX-2026-1008',
    buyer: 'Siam Industrial Trading Co., Ltd.',
    issueDate: '2026-10-08',
    amountBeforeVat: 1200000,
    vatAmount: 84000,
    totalAmount: 1284000,
    saleProposalNo: 'SALE-2026-0012',
    saleProposalStatus: 'Approved',
    items: [
      { itemNo: '10', assetId: 'ME-2025-0042', description: 'CNC Milling Machine · VCN-530C', quantity: 1, amount: 900000 },
      { itemNo: '20', assetId: 'IT-2026-0004', description: 'Network Switch 48-port · Catalyst 9300', quantity: 1, amount: 300000 },
    ],
  },
  {
    taxInvoiceNo: 'ETAX-2026-0929',
    buyer: 'Eastern Machinery Resale Ltd.',
    issueDate: '2026-09-29',
    amountBeforeVat: 720000,
    vatAmount: 50400,
    totalAmount: 770400,
    saleProposalNo: 'SALE-2026-0009',
    saleProposalStatus: 'Approved',
    items: [
      { itemNo: '10', assetId: 'ME-2024-0017', description: 'Industrial press · 160 ton', quantity: 1, amount: 720000 },
    ],
  },
]
