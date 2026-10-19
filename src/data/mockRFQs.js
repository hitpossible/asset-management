import { MOCK_PARTS } from './mockParts.js'

// Local RFQ references for Asset creation; reuse the mock Part catalogue.
export const MOCK_RFQS = MOCK_PARTS.map((part, index) => ({
  rfqNo: `RFQ-2026-${String(index + 1).padStart(4, '0')}`,
  name: part.name,
  model: part.model,
  partNo: part.partNo,
}))
