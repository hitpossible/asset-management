import test from 'node:test'
import assert from 'node:assert/strict'
import { formatDate } from './assetUtils.js'

test('formats calendar dates and ISO completion timestamps', () => {
  assert.equal(formatDate('2026-10-01'), '01 Oct 2026')
  assert.equal(formatDate('2026-10-01T04:00:00Z'), '01 Oct 2026')
  assert.equal(formatDate('2026-10-01T11:00:00+07:00'), '01 Oct 2026')
})

test('displays timestamp dates in Bangkok time', () => {
  assert.equal(formatDate('2026-09-30T18:00:00Z'), '01 Oct 2026')
})

test('missing or invalid dates display a placeholder without throwing', () => {
  for (const value of [undefined, null, '', 'invalid', '2026-10-01Tinvalid']) {
    assert.equal(formatDate(value), '—')
  }
})
