import assert from 'node:assert/strict'
import React from 'react'
import { renderToString } from 'react-dom/server'
import { createServer } from 'vite'

const server = await createServer({ server: { middlewareMode: true, ws: false }, appType: 'custom' })
try {
  const { default: Page } = await server.ssrLoadModule('/src/pages/MISCreatePOPage.jsx')
  const internals = React.__CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE
  const states = []
  let cursor = 0
  const dispatcher = {
    useState(initial) {
      const index = cursor++
      if (!(index in states)) states[index] = typeof initial === 'function' ? initial() : initial
      return [states[index], (next) => { states[index] = typeof next === 'function' ? next(states[index]) : next }]
    },
    useMemo: (calculate) => calculate(),
  }
  function render(props) {
    cursor = 0
    const previous = internals.H
    internals.H = dispatcher
    try { return Page(props) } finally { internals.H = previous }
  }
  function find(element, predicate) {
    if (!element || typeof element !== 'object') return undefined
    if (predicate(element)) return element
    for (const child of React.Children.toArray(element.props?.children)) {
      const found = find(child, predicate)
      if (found) return found
    }
  }
  let saved
  const props = {
    assets: [{ assetId: 'A', model: 'Model A' }],
    purchaseRequisitions: [{ prNo: 'PR-1', status: 'Approved', proposalId: 'PROP-1', assetItems: [{ assetId: 'A', assetName: 'Test machine', assetAmount: 100, costs: [] }] }],
    purchaseOrders: [],
    nextPONo: 'PO-1', onSave: (po) => { saved = po },
    onApprove: (poNo) => { props.purchaseOrders = [{ ...saved, poNo, status: 'Approved' }] },
  }
  const form = find(render(props), (element) => element.type === 'form')
  assert.ok(form)
  form.props.onSubmit({ preventDefault() {} })
  assert.equal(saved.poNo, 'PO-1')
  assert.equal(saved.referenceTotal, 100)
  assert.match(renderToString(render(props)), /Purchase Order created/)
  assert.equal(saved.status, 'Pending Approval')
  assert.equal(find(render(props), (element) => element.type === 'a' && element.props.href?.startsWith('/vendor-delivery')), undefined)
  const approveButton = find(render(props), (element) => element.type === 'button' && renderToString(element).includes('Approve PO (MIS)'))
  assert.ok(approveButton)
  approveButton.props.onClick()
  assert.ok(find(render(props), (element) => element.type === 'a' && element.props.href === '/vendor-delivery?po=PO-1'))
  states.length = 0
  const incompletePR = { ...props, purchaseRequisitions: [{ prNo: 'PR-OLD', status: 'Approved' }] }
  assert.doesNotThrow(() => renderToString(render(incompletePR)))
  states.length = 0
  const { default: List } = await server.ssrLoadModule('/src/pages/MISPOListPage.jsx')
  cursor = 0
  const previous = internals.H
  internals.H = dispatcher
  let listTree
  let approvedLegacyPO
  try { listTree = List({ purchaseOrders: [{ ...saved, status: 'Created' }], onApprove: (poNo) => { approvedLegacyPO = poNo } }) } finally { internals.H = previous }
  const legacyApprove = find(listTree, (element) => element.type === 'button' && renderToString(element).includes('Approve PO (MIS)'))
  assert.ok(legacyApprove)
  legacyApprove.props.onClick()
  assert.equal(approvedLegacyPO, saved.poNo)
  console.log('Create PO: save, pending approval gate, approval, Vendor link, incomplete legacy PR, and approval from PO list passed.')
} finally { await server.close() }
