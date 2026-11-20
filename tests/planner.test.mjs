import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import { shops } from '../app/data/shops.ts'
import { buildTripPlan, createPlanState, parsePlanState, getTripShopChoices, selectTripShop, startTimes } from '../app/utils/planner.ts'

const shopIds = new Set(shops.map(shop => shop.id))
function validate(plan) {
  const paid = plan.stops.filter(stop => stop.shopId)
  assert.equal(new Set(paid.map(stop => stop.shopId)).size, paid.length, 'shops must not repeat')
  assert.ok(plan.end <= 18 * 60, 'the plan must finish by 18:00')
  assert.ok(plan.totalMinutes <= (plan.state.options.duration === 'half' ? 180 : 330))
  assert.equal(plan.allocatedBudget, paid.length ? plan.state.options.budget : 0)
  assert.equal(plan.stops.reduce((sum, stop) => sum + stop.allowance, 0), plan.allocatedBudget)
  for (const [index, stop] of plan.stops.entries()) {
    assert.ok(stop.minutes > 0)
    assert.equal(stop.end - stop.start, stop.minutes)
    assert.ok(stop.allowance >= 0)
    if (index) assert.equal(stop.start - plan.stops[index - 1].end, 10, 'allow time between stops')
    if (stop.shopId) assert.ok(shopIds.has(stop.shopId), 'only known shops may be used')
  }
}

test('time, budget and uniqueness constraints hold across every selectable combination', () => {
  for (const duration of ['half', 'full']) for (const interest of ['chill', 'art', 'food']) for (const startTime of startTimes) for (const budget of [300, 500, 800]) {
    const plan = buildTripPlan(createPlanState({ duration, interest, startTime, budget }, 42), shops)
    validate(plan)
    assert.ok(plan.stops.some(stop => stop.kind === 'food'), 'include a main meal')
    assert.ok(plan.stops.some(stop => stop.kind === 'cafe'), 'include a cafe break')
    if (interest === 'art') assert.ok(plan.stops.some(stop => stop.kind === 'workshop'), 'preserve the requested workshop')
  }
})

test('desserts are not selected as the main meal', () => {
  const desserts = new Set(['meow-meow-roll', 'peanut-ice-cream', 'mee-khluk-corn'])
  for (let seed = 0; seed < 40; seed++) {
    const plan = buildTripPlan(createPlanState({ interest: 'food' }, seed), shops)
    for (const stop of plan.stops) if (stop.kind === 'food') assert.ok(!desserts.has(stop.shopId))
  }
})

test('budget and late start affect the proposed activities', () => {
  const lowBudget = buildTripPlan(createPlanState({ duration: 'full', interest: 'chill', budget: 300 }), shops)
  const moreBudget = buildTripPlan(createPlanState({ duration: 'full', interest: 'chill', budget: 500 }), shops)
  assert.ok(!lowBudget.stops.some(stop => stop.kind === 'workshop'))
  assert.ok(moreBudget.stops.some(stop => stop.kind === 'workshop'))
  const late = buildTripPlan(createPlanState({ duration: 'full', interest: 'art', startTime: '15:00' }), shops)
  assert.equal(late.end, 18 * 60)
  assert.ok(late.notes.length)
})

test('generating again offers varied shops while the same state stays reproducible', () => {
  const signatures = new Set()
  for (let seed = 1; seed <= 20; seed++) {
    const state = createPlanState({}, seed)
    const plan = buildTripPlan(state, shops)
    assert.deepEqual(buildTripPlan(state, shops), plan)
    signatures.add(plan.stops.map(stop => stop.shopId).join(','))
  }
  assert.ok(signatures.size >= 10, 'regeneration should offer varied combinations')
})

test('replacing a shop preserves other stops, timing and budget', () => {
  for (const interest of ['food', 'art', 'chill']) for (let seed = 1; seed <= 20; seed++) {
    let state = createPlanState({ interest, duration: 'full' }, seed)
    for (let iteration = 0; iteration < 3; iteration++) {
    const before = buildTripPlan(state, shops)
    for (const stop of before.stops.filter(stop => stop.shopId)) {
      const alternative = getTripShopChoices(state, stop.id, shops).find(shop => shop.id !== stop.shopId)
      const changed = selectTripShop(state, stop.id, alternative.id, shops)
      const after = buildTripPlan(changed, shops)
      validate(after)
      assert.notEqual(after.stops.find(item => item.id === stop.id).shopId, stop.shopId)
      for (const other of before.stops.filter(item => item.id !== stop.id)) assert.deepEqual(after.stops.find(item => item.id === other.id), other)
      assert.equal(after.end, before.end)
    }
    const first = before.stops.find(stop => stop.shopId)
    const alternative = getTripShopChoices(state, first.id, shops).find(shop => shop.id !== first.shopId)
    state = selectTripShop(state, first.id, alternative.id, shops)
    }
  }
})

test('saved and shared states restore the exact shop choices', () => {
  let state = createPlanState({ interest: 'art', startTime: '13:00', budget: 800 }, 100)
  const stop = buildTripPlan(state, shops).stops.find(item => item.kind === 'workshop')
  state = selectTripShop(state, stop.id, getTripShopChoices(state, stop.id, shops).find(shop => shop.id !== stop.shopId).id, shops)
  const params = new URLSearchParams({ trip: JSON.stringify(state) })
  const restored = parsePlanState(JSON.parse(new URLSearchParams(params.toString()).get('trip')))
  assert.deepEqual(buildTripPlan(restored, shops), buildTripPlan(state, shops))
})

test('legacy preferences migrate and malformed saved data is rejected', () => {
  const legacy = parsePlanState({ duration: 'half', interest: 'art' })
  assert.equal(legacy.version, 2)
  assert.equal(legacy.options.interest, 'art')
  for (const input of [null, [], {}, { version: 2 }, { duration: 'invalid', interest: 'art' }, { ...createPlanState({}), seed: Infinity }]) assert.equal(parsePlanState(input), null)
  const invalidShop = { ...createPlanState({}), overrides: { 'food-2': 'unknown-shop' } }
  validate(buildTripPlan(invalidShop, shops))
  assert.ok(!buildTripPlan(invalidShop, shops).stops.some(stop => stop.shopId === 'unknown-shop'))
})

test('an empty shop directory yields only walking stops without allocating money', () => {
  const plan = buildTripPlan(createPlanState({}), [])
  validate(plan)
  assert.ok(plan.stops.every(stop => stop.kind === 'walk'))
})

test('the chosen shop is applied exactly and invalid choices cannot change another category', () => {
  const state = createPlanState({ interest: 'food', duration: 'full' }, 10)
  const plan = buildTripPlan(state, shops)
  const food = plan.stops.filter(stop => stop.kind === 'food')
  const choices = getTripShopChoices(state, food[0].id, shops)
  assert.ok(!choices.some(shop => shop.id === food[1].shopId), 'do not offer a shop used by another stop')
  const chosen = choices.find(shop => shop.id !== food[0].shopId)
  const changed = selectTripShop(state, food[0].id, chosen.id, shops)
  assert.equal(buildTripPlan(changed, shops).stops.find(stop => stop.id === food[0].id).shopId, chosen.id)
  const cafe = shops.find(shop => shop.zone === 'cafe')
  assert.deepEqual(selectTripShop(state, food[0].id, cafe.id, shops), state)
  assert.deepEqual(selectTripShop(state, food[0].id, 'unknown-shop', shops), state)
})

test('every shop has a distinct real photo file and photo attribution', () => {
  assert.equal(new Set(shops.map(shop => shop.image)).size, shops.length)
  for (const shop of shops) {
    const file = new URL(`../public${shop.image}`, import.meta.url)
    assert.ok(fs.statSync(file).size > 1024, `Photo missing for ${shop.name}`)
    const bytes = fs.readFileSync(file)
    assert.equal(bytes[0], 0xff)
    assert.equal(bytes[1], 0xd8)
    assert.ok(shop.photoSource.startsWith('https://'))
    assert.ok(shop.photoCredit.length > 3)
  }
})
