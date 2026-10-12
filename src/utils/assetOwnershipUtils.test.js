import test from 'node:test'
import assert from 'node:assert/strict'
import { getAssetOwnership, getProposalEligibleAssets, normalizeAssetOwnership } from './assetOwnershipUtils.js'
import { prepareProposalAssets } from './proposalAssetUtils.js'
import { getAssetDepreciationData } from './depreciationUtils.js'
import { mergeDemoLifecycleEvents } from '../data/mockLifecycleEvents.js'

const company = { assetId: 'TBKK-1', status: 'Draft', name: 'Company machine' }
const customer = { assetId: 'CUSTOMER-1', status: 'Draft', ownershipType: 'customer', customerName: 'Example Motors', name: 'Customer machine' }
const makeProposal = (ownershipType, assetItems) => ({ ownershipType, proposalId: 'PROP-TEST', assetItems })
const item = (asset, assetMode = 'new') => ({ assetId: asset.assetId, assetMode, assetAmount: 100000 })

test('legacy assets remain company-owned; customer names are required and trimmed', () => {
  assert.equal(getAssetOwnership(company), 'company')
  assert.throws(() => normalizeAssetOwnership({ ...customer, customerName: '  ' }), /customer name/)
  assert.equal(normalizeAssetOwnership({ ...customer, customerName: ' Example Motors ' }).customerName, 'Example Motors')
  assert.equal(normalizeAssetOwnership({ ...company, customerName: 'Stale name' }).customerName, '')
})

test('Proposal selection separates ownership and excludes customer lifecycle targets and linked drafts', () => {
  const assets = [company, customer, { ...company, assetId: 'ACTIVE-COMPANY', status: 'Active' }, { ...customer, assetId: 'ACTIVE-CUSTOMER', status: 'Active' }, { ...customer, assetId: 'LINKED-CUSTOMER', proposalNo: 'PROP-1' }]
  assert.deepEqual(getProposalEligibleAssets(assets).map((asset) => asset.assetId), ['TBKK-1', 'ACTIVE-COMPANY'])
  assert.deepEqual(getProposalEligibleAssets(assets, 'customer').map((asset) => asset.assetId), ['CUSTOMER-1'])
})

test('Customer Proposal retains customer ownership and acquisition item without creating lifecycle events', () => {
  const result = prepareProposalAssets(makeProposal('customer', [item(customer)]), [customer])
  assert.deepEqual(result.createdAssets, [])
  assert.deepEqual(result.events, [])
  assert.equal(result.proposal.assetItems[0].customerName, 'Example Motors')
  assert.equal(result.proposal.assetItems[0].costTreatment, 'New Asset')
  assert.equal(customer.status, 'Draft')
})

test('Proposal save rejects mixed ownership and all existing-customer work', () => {
  assert.throws(() => prepareProposalAssets(makeProposal('company', [item(customer)]), [customer]), /ownership/)
  assert.throws(() => prepareProposalAssets(makeProposal('customer', [item(customer), item(company)]), [customer, company]), /ownership/)
  for (const workType of ['subAsset', 'modification', 'maintenance']) {
    const active = { ...customer, status: 'Active' }
    assert.throws(() => prepareProposalAssets(makeProposal('customer', [{ ...item(active, 'existing'), workType }]), [active]), /lifecycle/)
  }
})

test('Customer Assets never calculate depreciation even with value, useful life and a stale start date', () => {
  const asset = { ...customer, acquisitionValue: 120000, depreciationStartDate: '2026-01-01', assetTypeId: 'ME' }
  const data = getAssetDepreciationData(asset, [{ id: 'ME', usefulLifeYears: 5 }])
  assert.equal(data.applicable, false)
  for (const key of ['monthlyDepreciation', 'accumulatedDepreciation', 'netBookValue', 'depreciationPeriods']) assert.equal(data[key], null)
  assert.equal(normalizeAssetOwnership(asset).depreciationStartDate, '')
  assert.equal(getAssetDepreciationData({ ...asset, ownershipType: 'company' }, [{ id: 'ME', usefulLifeYears: 5 }]).monthlyDepreciation, 2000)
})

test('activating a Customer Asset does not generate demo spare part usage', () => {
  const events = mergeDemoLifecycleEvents([], [{ ...customer, status: 'Active' }, { ...company, status: 'Active' }])
  assert.equal(events.filter((event) => event.assetId === customer.assetId).length, 0)
  assert.equal(events.filter((event) => event.assetId === company.assetId).length, 3)
})


test('previously saved Customer Draft Assets cannot be reused in another Proposal', () => {
  const linked = { ...customer, proposalNo: 'PROP-OLD' }
  assert.throws(() => prepareProposalAssets(makeProposal('customer', [item(linked)]), [linked]), /available Draft/)
})

test('stale lifecycle events for Customer Assets are excluded from the stored and displayed history', () => {
  const events = mergeDemoLifecycleEvents([{ transactionNo: 'TRF-OLD', assetId: customer.assetId, type: 'transfer' }], [customer])
  assert.equal(events.some((event) => event.assetId === customer.assetId), false)
})
