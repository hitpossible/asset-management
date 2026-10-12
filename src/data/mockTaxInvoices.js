// Local e-Tax reference data for the Disposal mockup.
export const MOCK_TAX_INVOICES = [
  {
    taxInvoiceNo: 'ETAX-2026-1008',
    buyer: 'Siam Industrial Trading Co., Ltd.',
    issueDate: '2026-10-08',
    totalAmount: 183000,
    saleProposalNo: 'SALE-2026-0012',
    saleProposalStatus: 'Approved',
    items: [
      { itemNo: '10', description: 'CNC Milling Machine · VCN-530C', quantity: 1, amount: 150000 },
      { itemNo: '20', description: 'Network Switch 48-port · Catalyst 9300', quantity: 1, amount: 33000 },
    ],
  },
  {
    taxInvoiceNo: 'ETAX-2026-0929',
    buyer: 'Eastern Machinery Resale Ltd.',
    issueDate: '2026-09-29',
    totalAmount: 720000,
    saleProposalNo: 'SALE-2026-0009',
    saleProposalStatus: 'Approved',
    items: [
      { itemNo: '10', description: 'Industrial press · 160 ton', quantity: 1, amount: 720000 },
    ],
  },
]
