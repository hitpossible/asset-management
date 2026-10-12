import assert from 'node:assert/strict'
import React from 'react'
import { renderToString } from 'react-dom/server'
import { createServer } from 'vite'

const server = await createServer({ server: { middlewareMode: true, ws: false }, appType: 'custom' })
globalThis.window = { location: { search: '?po=PO-DEMO-2026-0101' }, localStorage: { getItem: () => null } }
try {
  const { default: Page } = await server.ssrLoadModule('/src/pages/VendorDeliveryPage.jsx')
  const internals = React.__CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE
  const states = []
  let cursor = 0
  const dispatcher = {
    useState(initial) {
      const index = cursor++
      if (!(index in states)) states[index] = typeof initial === 'function' ? initial() : initial
      return [states[index], (next) => { states[index] = typeof next === 'function' ? next(states[index]) : next }]
    },
    useEffect() {}, useCallback: (callback) => callback,
  }
  function render() {
    cursor = 0
    const previous = internals.H
    internals.H = dispatcher
    try { return Page() } finally { internals.H = previous }
  }
  function all(element, predicate) {
    if (!element || typeof element !== 'object') return []
    return [...(predicate(element) ? [element] : []), ...React.Children.toArray(element.props?.children).flatMap((child) => all(child, predicate))]
  }
  function button(tree, label) {
    return all(tree, (element) => element.type === 'button').find((element) => renderToString(element).includes(label))
  }
  function cards(tree) { return all(tree, (element) => typeof element.type === 'function' && element.type.name === 'InvoiceCard') }
  let tree = render()
  assert.equal(cards(tree).length, 1)
  assert.equal(cards(tree)[0].props.onRemove, undefined)
  assert.ok(button(tree, 'ถัดไป: สแกน Invoice'))
  assert.equal(button(tree, 'Submit การส่งครั้งนี้'), undefined)
  button(tree, 'ถัดไป: สแกน Invoice').props.onClick()
  tree = render()
  assert.equal(button(tree, 'ถัดไป: ตรวจสอบการส่ง').props.disabled, true)
  assert.equal(cards(tree).length, 0)
  button(tree, 'จำลองสแกนใบที่ 2').props.onClick()
  tree = render()
  assert.equal(cards(tree).length, 1)
  assert.ok(cards(tree)[0].props.onRemove)
  assert.equal(button(tree, 'ถัดไป: ตรวจสอบการส่ง').props.disabled, false)
  cards(tree)[0].props.onRemove()
  tree = render()
  assert.equal(cards(tree).length, 0)
  assert.equal(button(tree, 'ถัดไป: ตรวจสอบการส่ง').props.disabled, true)
  button(tree, 'จำลองสแกนใบที่ 2').props.onClick()
  tree = render()
  button(tree, 'ถัดไป: ตรวจสอบการส่ง').props.onClick()
  tree = render()
  assert.match(renderToString(tree), /ตรวจสอบการส่งครั้งนี้/)
  assert.match(renderToString(tree), /ครบตามใบสั่งซื้อ/)
  assert.equal(all(tree, (element) => element.type === 'input').length, 0)
  button(tree, 'ย้อนกลับ').props.onClick()
  tree = render()
  assert.equal(cards(tree).length, 1)
  button(tree, 'ถัดไป: ตรวจสอบการส่ง').props.onClick()
  tree = render()
  button(tree, 'Submit การส่งครั้งนี้').props.onClick()
  tree = render()
  assert.match(renderToString(tree), /บันทึกการส่งเรียบร้อย/)
  assert.equal(cards(tree).length, 1)
  assert.ok(cards(tree).every((card) => card.props.onRemove === undefined))
  assert.equal(button(tree, 'Submit การส่งครั้งนี้'), undefined)
  button(tree, 'กลับไปดูข้อมูล PO').props.onClick()
  tree = render()
  assert.equal(cards(tree).length, 2)
  assert.ok(cards(tree).every((card) => card.props.onRemove === undefined))
  assert.equal(button(tree, 'ถัดไป: สแกน Invoice').props.disabled, true)
  states.length = 0
  window.location.search = ''
  tree = render()
  assert.match(renderToString(tree), /ยินดีต้อนรับ/)
  assert.equal(button(tree, 'ถัดไป: สแกน Invoice'), undefined)
  console.log('Vendor screens: PO entry, PO summary, scan, remove/rescan, review, back navigation, submit, locked history, and completed delivery passed.')

} finally { await server.close(); delete globalThis.window }
