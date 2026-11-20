import test from 'node:test'
import assert from 'node:assert/strict'
import { shops } from '../app/data/shops.ts'
import { buildTripPlan, createPlanState, parsePlanState, startTimes, swapTripShop } from '../app/utils/planner.ts'

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
      const changed = swapTripShop(state, stop.id, shops)
      const after = buildTripPlan(changed, shops)
      validate(after)
      assert.notEqual(after.stops.find(item => item.id === stop.id).shopId, stop.shopId)
      for (const other of before.stops.filter(item => item.id !== stop.id)) assert.deepEqual(after.stops.find(item => item.id === other.id), other)
      assert.equal(after.end, before.end)
    }
    state = swapTripShop(state, before.stops.find(stop => stop.shopId).id, shops)
    }
  }
})

test('saved and shared states restore the exact shop choices', () => {
  let state = createPlanState({ interest: 'art', startTime: '13:00', budget: 800 }, 100)
  const stop = buildTripPlan(state, shops).stops.find(item => item.kind === 'workshop')
  state = swapTripShop(state, stop.id, shops)
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
