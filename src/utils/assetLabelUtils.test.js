import test from 'node:test'
import assert from 'node:assert/strict'
import { getAssetInfoUrl } from './assetLabelUtils.js'

test('label URL opens an exact Sub Asset and preserves deployment base path', () => {
  const url = new URL(getAssetInfoUrl('ME-2025-0042-3', 'https://assets.example.com/workspace/?other=old#tab'))
  assert.equal(url.origin + url.pathname, 'https://assets.example.com/workspace/')
  assert.equal(url.searchParams.get('asset'), 'ME-2025-0042-3')
  assert.equal(url.searchParams.size, 1)
  assert.equal(url.hash, '')
})

test('asset numbers with URL delimiters round-trip as one asset parameter', () => {
  const id = 'Asset A & B/#1'
  const url = new URL(getAssetInfoUrl(id, 'https://assets.example.com/'))
  assert.equal(url.searchParams.get('asset'), id)
  assert.equal(url.searchParams.size, 1)
})
