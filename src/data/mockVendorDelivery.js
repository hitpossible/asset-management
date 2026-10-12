export const vendorDemoPO = {
  poNo: 'PO-DEMO-2026-0101', status: 'Approved', vendor: 'Daifuku (Thailand) Ltd.',
  referenceTotal: 240000, shipTo: 'TBKK · Plant 1 / Assembly',
  assetItems: [
    { itemNo: '10', assetName: 'Conveyor drive unit', orderedQuantity: 4, unitOfMeasure: 'unit' },
    { itemNo: '20', assetName: 'Safety control panel', orderedQuantity: 2, unitOfMeasure: 'unit' },
  ],
}
export const vendorDemoInvoice = {
  poNo: vendorDemoPO.poNo, reference: 'INV-DEMO-001', date: '2026-10-06', amount: 120000,
  documentName: 'Invoice-DEMO-001.pdf (เอกสารตัวอย่าง)',
  items: [{ key: '10', quantity: 2 }, { key: '20', quantity: 1 }],
}
