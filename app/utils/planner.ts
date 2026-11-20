import type { Shop } from '../data/shops'

export type PlanDuration = 'half' | 'full'
export type PlanInterest = 'chill' | 'art' | 'food'
export type StopKind = 'walk' | 'food' | 'cafe' | 'workshop' | 'snack'
export interface PlanOptions {
  duration: PlanDuration
  interest: PlanInterest
  startTime: string
  budget: number
}
export interface PlanState {
  version: 2
  options: PlanOptions
  seed: number
  overrides: Record<string, string>
}
export interface TripStop {
  id: string
  kind: StopKind
  title: string
  description: string
  start: number
  end: number
  minutes: number
  allowance: number
  shopId?: string
  detail?: string
  mapQuery: string
}
export interface TripPlan {
  state: PlanState
  stops: TripStop[]
  start: number
  end: number
  totalMinutes: number
  allocatedBudget: number
  notes: string[]
}

export const defaultPlanOptions: PlanOptions = { duration: 'full', interest: 'chill', startTime: '10:00', budget: 500 }
export const startTimes = ['10:00', '11:00', '12:00', '13:00', '14:00', '15:00'] as const
export const planBudgets = [300, 500, 800] as const
const snackIds = new Set(['meow-meow-roll', 'peanut-ice-cream', 'mee-khluk-corn'])
const validKinds: StopKind[] = ['walk', 'food', 'cafe', 'workshop', 'snack']
const weights: Record<StopKind, number> = { walk: 0, food: 3, cafe: 2, workshop: 6, snack: 1 }
const travelMinutes = 10

export function normalizeOptions(value: Partial<PlanOptions> = {}): PlanOptions {
  return {
    duration: value.duration === 'half' ? 'half' : 'full',
    interest: value.interest === 'art' || value.interest === 'food' ? value.interest : 'chill',
    startTime: startTimes.includes(value.startTime as typeof startTimes[number]) ? value.startTime! : '10:00',
    budget: planBudgets.includes(value.budget as typeof planBudgets[number]) ? value.budget! : 500
  }
}

export function createPlanState(options: Partial<PlanOptions>, seed = 1): PlanState {
  return { version: 2, options: normalizeOptions(options), seed: seed >>> 0, overrides: {} }
}

export function parsePlanState(raw: unknown): PlanState | null {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null
  const data = raw as Record<string, unknown>
  if (data.version !== 2) {
    // Preferences saved by the original planner still open in the new planner.
    if (!['half', 'full'].includes(String(data.duration)) || !['chill', 'art'].includes(String(data.interest))) return null
    return createPlanState({ duration: data.duration as PlanDuration, interest: data.interest as PlanInterest })
  }
  if (!data.options || typeof data.options !== 'object' || Array.isArray(data.options)) return null
  const options = data.options as Record<string, unknown>
  if (!['half', 'full'].includes(String(options.duration)) || !['chill', 'art', 'food'].includes(String(options.interest))) return null
  if (!planBudgets.includes(options.budget as typeof planBudgets[number]) || typeof options.startTime !== 'string') return null
  if (!startTimes.includes(options.startTime as typeof startTimes[number])) return null
  if (typeof data.seed !== 'number' || !Number.isSafeInteger(data.seed) || data.seed < 0 || data.seed > 0xffffffff) return null
  const state = createPlanState(options as unknown as PlanOptions, data.seed)
  if (data.overrides && typeof data.overrides === 'object' && !Array.isArray(data.overrides)) {
    for (const [slot, shop] of Object.entries(data.overrides).slice(0, 10)) {
      if (/^(walk|food|cafe|workshop|snack)-\d$/.test(slot) && typeof shop === 'string' && /^[a-z0-9-]{1,60}$/.test(shop)) state.overrides[slot] = shop
    }
  }
  return state
}

export function formatPlanTime(minutes: number): string {
  return `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`
}

function shopPool(kind: StopKind, available: readonly Shop[]): Shop[] {
  if (kind === 'walk') return []
  if (kind === 'food' || kind === 'snack') {
    return available.filter(shop => shop.zone === 'food' && (kind === 'snack' ? shop.foodType === 'snack' || snackIds.has(shop.id) : shop.foodType !== 'snack' && !snackIds.has(shop.id)))
  }
  return available.filter(shop => shop.zone === kind)
}

function score(text: string, seed: number): number {
  let hash = (2166136261 ^ seed) >>> 0
  for (let i = 0; i < text.length; i++) hash = Math.imul(hash ^ text.charCodeAt(i), 16777619) >>> 0
  hash = Math.imul(hash ^ (hash >>> 16), 2246822507)
  return (hash ^ (hash >>> 13)) >>> 0
}

interface Slot { kind: StopKind; minutes: number }
function template(options: PlanOptions, availableMinutes: number): Slot[] {
  const full = options.duration === 'full' && availableMinutes >= 270
  if (!full) {
    if (options.interest === 'art') return [{ kind: 'walk', minutes: 15 }, { kind: 'workshop', minutes: 75 }, { kind: 'food', minutes: 35 }, { kind: 'cafe', minutes: 25 }]
    return [{ kind: 'walk', minutes: 25 }, { kind: 'food', minutes: 45 }, { kind: 'cafe', minutes: 40 }, { kind: 'snack', minutes: 20 }]
  }
  if (options.interest === 'food') return [{ kind: 'walk', minutes: 30 }, { kind: 'food', minutes: 50 }, { kind: 'cafe', minutes: 45 }, { kind: 'snack', minutes: 25 }, { kind: 'food', minutes: 45 }, { kind: 'walk', minutes: 25 }]
  const slots: Slot[] = [{ kind: 'walk', minutes: 30 }]
  if (options.interest === 'art' || options.budget >= 400) slots.push({ kind: 'workshop', minutes: options.interest === 'art' ? 120 : 90 })
  slots.push({ kind: 'food', minutes: 50 }, { kind: 'cafe', minutes: 45 }, { kind: 'snack', minutes: 20 }, { kind: 'walk', minutes: 25 })
  return slots
}

const slotsDuration = (slots: Slot[]) => slots.reduce((sum, slot) => sum + slot.minutes, 0) + Math.max(0, slots.length - 1) * travelMinutes

export function buildTripPlan(input: PlanState, available: readonly Shop[]): TripPlan {
  const state = parsePlanState(input) || createPlanState(defaultPlanOptions)
  const { options } = state
  const [hour, minute] = options.startTime.split(':').map(Number)
  const start = hour! * 60 + minute!
  const availableMinutes = Math.min(options.duration === 'half' ? 180 : 330, 18 * 60 - start)
  const notes: string[] = []
  const slots = template(options, availableMinutes).filter(slot => slot.kind === 'walk' || shopPool(slot.kind, available).length)
  if (options.duration === 'full' && availableMinutes < 270) notes.push('เวลาเริ่มค่อนข้างบ่าย จัดเป็นทริปสั้นเพื่อให้จบก่อน 18:00 น.')
  while (slotsDuration(slots) > availableMinutes) {
    const lastWalk = slots.findLastIndex((slot, index) => slot.kind === 'walk' && index > 0)
    const optionalSnack = slots.findLastIndex(slot => slot.kind === 'snack')
    const removable = lastWalk >= 0 ? lastWalk : optionalSnack
    if (removable >= 0) { slots.splice(removable, 1); continue }
    const longest = slots.reduce((index, slot, i) => slot.minutes > slots[index]!.minutes ? i : index, 0)
    if (!slots[longest] || slots[longest].minutes <= 15) break
    slots[longest]!.minutes -= 5
  }
  if (options.interest === 'art' && options.budget < 400) notes.push('งบงานคราฟต์อาจจำกัด เลือกชนิดงานและสอบถามราคาก่อนเริ่ม')
  if (options.duration === 'full' && options.interest === 'chill' && options.budget < 400) notes.push('เน้นเดินเล่น อาหาร และคาเฟ่ เพื่อแบ่งงบโดยไม่เพิ่มกิจกรรมคราฟต์')

  const used = new Set<string>()
  const selectedOverrides = new Set(Object.values(state.overrides))
  const stops: TripStop[] = []
  let cursor = start
  slots.forEach((slot, index) => {
    const id = `${slot.kind}-${index}`
    const pool = shopPool(slot.kind, available).filter(shop => !used.has(shop.id))
    const override = pool.find(shop => shop.id === state.overrides[id])
    const candidates = pool.filter(shop => !selectedOverrides.has(shop.id) || shop.id === state.overrides[id])
    const shop = override || (candidates.length ? candidates : pool).sort((a, b) => score(`${id}:${a.id}`, state.seed) - score(`${id}:${b.id}`, state.seed) || a.id.localeCompare(b.id))[0]
    if (slot.kind !== 'walk' && !shop) return
    if (stops.length) cursor += travelMinutes
    if (shop) used.add(shop.id)
    stops.push({
      id, kind: slot.kind, minutes: slot.minutes, start: cursor, end: cursor + slot.minutes, allowance: 0,
      title: shop?.name || (index === 0 ? 'เดินเล่นทำความรู้จักชุมชน' : 'เดินชมบ้านไม้และเลือกของฝาก'),
      description: shop?.summary || 'ค่อย ๆ เดินเลียบคลอง เก็บบรรยากาศ และเผื่อเวลาพักตามสบาย',
      shopId: shop?.id, detail: shop?.detail || (slot.kind === 'walk' ? '/places/canal-walk' : undefined),
      mapQuery: shop ? `${shop.name} คลองบางหลวง` : 'ตลาดคลองบางหลวง'
    })
    cursor += slot.minutes
  })
  const paid = stops.filter(stop => stop.shopId)
  const totalWeight = paid.reduce((sum, stop) => sum + weights[stop.kind], 0)
  if (totalWeight) {
    for (const stop of paid) stop.allowance = Math.floor(options.budget * weights[stop.kind] / totalWeight / 10) * 10
    paid[0]!.allowance += options.budget - paid.reduce((sum, stop) => sum + stop.allowance, 0)
  }
  return { state, stops, start, end: cursor, totalMinutes: cursor - start, allocatedBudget: paid.reduce((sum, stop) => sum + stop.allowance, 0), notes }
}

export function getTripShopChoices(input: PlanState, slotId: string, available: readonly Shop[]): Shop[] {
  const plan = buildTripPlan(input, available)
  const stop = plan.stops.find(item => item.id === slotId)
  if (!stop?.shopId || !validKinds.includes(stop.kind)) return []
  const usedElsewhere = new Set(plan.stops.filter(item => item.id !== slotId).map(item => item.shopId))
  return shopPool(stop.kind, available).filter(shop => !usedElsewhere.has(shop.id))
}

export function selectTripShop(input: PlanState, slotId: string, shopId: string, available: readonly Shop[]): PlanState {
  const plan = buildTripPlan(input, available)
  if (!getTripShopChoices(plan.state, slotId, available).some(shop => shop.id === shopId)) return plan.state
  const overrides = Object.fromEntries(plan.stops.filter(item => item.shopId).map(item => [item.id, item.id === slotId ? shopId : item.shopId!]))
  return { ...plan.state, overrides }
}
