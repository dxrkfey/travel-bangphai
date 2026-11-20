import type { Shop } from '../data/shops'

export type PlanDuration = 'half' | 'full'
export type PlanInterest = 'chill' | 'art' | 'food'
export type StopKind = 'walk' | 'food' | 'cafe' | 'workshop' | 'snack'
export interface PlanOptions {
  duration: PlanDuration
  interest: PlanInterest
  startTime: string
  budget: number
  travelMinutes: number
}
export interface EditableStop {
  id: string
  kind: StopKind
  shopId?: string
  title?: string
  mapQuery?: string
  description?: string
  detail?: string
  minutes: number
  allowance?: number
}
export interface PlanState {
  version: 3
  options: PlanOptions
  seed: number
  overrides: Record<string, string>
  customStops?: EditableStop[]
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

export const defaultPlanOptions: PlanOptions = { duration: 'full', interest: 'chill', startTime: '10:00', budget: 500, travelMinutes: 10 }
export const startTimes = ['10:00', '11:00', '12:00', '13:00', '14:00', '15:00'] as const
export const planBudgets = [300, 500, 800] as const
const snackIds = new Set(['meow-meow-roll', 'peanut-ice-cream', 'mee-khluk-corn'])
const validKinds: StopKind[] = ['walk', 'food', 'cafe', 'workshop', 'snack']
const weights: Record<StopKind, number> = { walk: 0, food: 3, cafe: 2, workshop: 6, snack: 1 }
const travelMinutes = 10
const validTime = (value: unknown): value is string => typeof value === 'string' && /^([01]\d|2[0-3]):[0-5]\d$/.test(value)
const safeAmount = (value: unknown, fallback: number, min: number, max: number) => typeof value === 'number' && Number.isFinite(value) ? Math.min(max, Math.max(min, Math.round(value))) : fallback

export function normalizeOptions(value: Partial<PlanOptions> = {}): PlanOptions {
  return {
    duration: value.duration === 'half' ? 'half' : 'full',
    interest: value.interest === 'art' || value.interest === 'food' ? value.interest : 'chill',
    startTime: validTime(value.startTime) ? value.startTime : '10:00',
    budget: safeAmount(value.budget, 500, 0, 100000),
    travelMinutes: safeAmount(value.travelMinutes, 10, 0, 120)
  }
}

export function createPlanState(options: Partial<PlanOptions>, seed = 1): PlanState {
  return { version: 3, options: normalizeOptions(options), seed: seed >>> 0, overrides: {} }
}

export function createBlankPlanState(options: Partial<PlanOptions> = {}): PlanState {
  return { ...createPlanState(options), customStops: [] }
}

export function parsePlanState(raw: unknown): PlanState | null {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null
  const data = raw as Record<string, unknown>
  if (data.version !== 2 && data.version !== 3) {
    // Preferences saved by the original planner still open in the new planner.
    if (!['half', 'full'].includes(String(data.duration)) || !['chill', 'art'].includes(String(data.interest))) return null
    return createPlanState({ duration: data.duration as PlanDuration, interest: data.interest as PlanInterest })
  }
  if (!data.options || typeof data.options !== 'object' || Array.isArray(data.options)) return null
  const options = data.options as Record<string, unknown>
  if (!['half', 'full'].includes(String(options.duration)) || !['chill', 'art', 'food'].includes(String(options.interest))) return null
  if (typeof options.budget !== 'number' || !Number.isFinite(options.budget) || !validTime(options.startTime)) return null
  if (typeof data.seed !== 'number' || !Number.isSafeInteger(data.seed) || data.seed < 0 || data.seed > 0xffffffff) return null
  const state = createPlanState(options as unknown as PlanOptions, data.seed)
  if (data.overrides && typeof data.overrides === 'object' && !Array.isArray(data.overrides)) {
    for (const [slot, shop] of Object.entries(data.overrides).slice(0, 10)) {
      if (/^(walk|food|cafe|workshop|snack)-\d$/.test(slot) && typeof shop === 'string' && /^[a-z0-9-]{1,60}$/.test(shop)) state.overrides[slot] = shop
    }
  }
  if (data.version === 3 && data.customStops !== undefined) {
    if (!Array.isArray(data.customStops) || data.customStops.length > 50) return null
    const usedIds = new Set<string>()
    state.customStops = []
    for (const rawStop of data.customStops) {
      if (!rawStop || typeof rawStop !== 'object' || Array.isArray(rawStop)) return null
      const stop = rawStop as Record<string, unknown>
      if (typeof stop.id !== 'string' || !/^[a-z0-9-]{1,64}$/.test(stop.id) || usedIds.has(stop.id)) return null
      if (!validKinds.includes(stop.kind as StopKind) || typeof stop.minutes !== 'number' || !Number.isFinite(stop.minutes)) return null
      if (stop.shopId !== undefined && (typeof stop.shopId !== 'string' || !/^[a-z0-9-]{1,60}$/.test(stop.shopId))) return null
      if (stop.allowance !== undefined && (typeof stop.allowance !== 'number' || !Number.isFinite(stop.allowance))) return null
      usedIds.add(stop.id)
      state.customStops.push({ id: stop.id, kind: stop.kind as StopKind, minutes: safeAmount(stop.minutes, 30, 5, 480), shopId: stop.shopId as string | undefined, title: typeof stop.title === 'string' ? stop.title.trim().slice(0, 120) : undefined, mapQuery: typeof stop.mapQuery === 'string' ? stop.mapQuery.trim().slice(0, 200) : undefined, allowance: stop.allowance === undefined ? undefined : safeAmount(stop.allowance, 0, 0, 100000) })
      const parsed = state.customStops[state.customStops.length - 1]!
      if (typeof stop.description === 'string') parsed.description = stop.description.slice(0, 500)
      if (typeof stop.detail === 'string' && /^\/places\/[a-z-]+$/.test(stop.detail)) parsed.detail = stop.detail
    }
  }
  return state
}

export function formatPlanTime(minutes: number): string {
  const days = Math.floor(minutes / 1440)
  const clock = `${String(Math.floor(minutes / 60) % 24).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`
  return days ? `${clock} (+${days} วัน)` : clock
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

const slotsDuration = (slots: Slot[], gap = travelMinutes) => slots.reduce((sum, slot) => sum + slot.minutes, 0) + Math.max(0, slots.length - 1) * gap

export function buildTripPlan(input: PlanState, available: readonly Shop[]): TripPlan {
  const state = parsePlanState(input) || createPlanState(defaultPlanOptions)
  if (state.customStops !== undefined) return buildCustomPlan(state, available)
  const { options } = state
  const [hour, minute] = options.startTime.split(':').map(Number)
  const start = hour! * 60 + minute!
  const requestedMinutes = options.duration === 'half' ? 180 : 330
  const availableMinutes = start < 18 * 60 ? Math.max(60, Math.min(requestedMinutes, 18 * 60 - start)) : requestedMinutes
  const notes: string[] = []
  const slots = template(options, availableMinutes).filter(slot => slot.kind === 'walk' || shopPool(slot.kind, available).length)
  if (options.duration === 'full' && availableMinutes < 270) notes.push('เวลาเริ่มค่อนข้างบ่าย จัดเป็นทริปสั้นเพื่อให้จบก่อน 18:00 น.')
  while (slotsDuration(slots, options.travelMinutes) > availableMinutes) {
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
    if (stops.length) cursor += options.travelMinutes
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
  return stop ? [...available] : []
}

export function selectTripShop(input: PlanState, slotId: string, shopId: string, available: readonly Shop[]): PlanState {
  const state = editablePlan(input, available)
  const shop = available.find(item => item.id === shopId)
  if (!shop) return parsePlanState(input) || state
  return { ...state, customStops: state.customStops!.map(stop => stop.id === slotId ? { ...stop, kind: kindForShop(shop), shopId, title: undefined, mapQuery: undefined } : stop) }
}

function kindForShop(shop: Shop): StopKind {
  return shop.zone === 'food' ? (shop.foodType === 'snack' || snackIds.has(shop.id) ? 'snack' : 'food') : shop.zone
}

function buildCustomPlan(state: PlanState, available: readonly Shop[]): TripPlan {
  const [hour, minute] = state.options.startTime.split(':').map(Number)
  const start = hour! * 60 + minute!
  let cursor = start
  const stops: TripStop[] = []
  const notes: string[] = []
  const explicit = new Map<string, number>()
  for (const item of state.customStops || []) {
    const shop = item.shopId ? available.find(shop => shop.id === item.shopId) : undefined
    if (item.shopId && !shop) { notes.push('มีร้านที่ไม่อยู่ในรายชื่อปัจจุบัน กรุณาเลือกร้านใหม่'); continue }
    if (stops.length) cursor += state.options.travelMinutes
    const kind = shop ? kindForShop(shop) : item.kind
    stops.push({ id: item.id, kind, shopId: shop?.id, title: shop?.name || item.title || 'กิจกรรมของฉัน', description: shop?.summary || item.description || 'กิจกรรมและเวลาที่คุณกำหนดเอง', detail: shop?.detail || (!shop ? item.detail : undefined), mapQuery: shop ? `${shop.name} คลองบางหลวง` : item.mapQuery || 'คลองบางหลวง', start: cursor, end: cursor + item.minutes, minutes: item.minutes, allowance: item.allowance || 0 })
    if (item.allowance !== undefined) explicit.set(item.id, item.allowance)
    cursor += item.minutes
  }
  const fixed = stops.filter(stop => explicit.has(stop.id)).reduce((sum, stop) => sum + stop.allowance, 0)
  const remaining = Math.max(0, state.options.budget - fixed)
  const unallocated = stops.filter(stop => stop.shopId && !explicit.has(stop.id))
  const totalWeight = unallocated.reduce((sum, stop) => sum + weights[stop.kind], 0)
  if (totalWeight) {
    for (const stop of unallocated) stop.allowance = Math.floor(remaining * weights[stop.kind] / totalWeight)
    unallocated[0]!.allowance += remaining - unallocated.reduce((sum, stop) => sum + stop.allowance, 0)
  }
  const allocatedBudget = stops.reduce((sum, stop) => sum + stop.allowance, 0)
  if (allocatedBudget > state.options.budget) notes.push(`งบที่ใส่รวมเกินงบตั้งไว้ ${allocatedBudget - state.options.budget} บาท ปรับงบหรือแต่ละจุดได้ตามต้องการ`)
  if (stops.some(stop => stop.shopId && stop.allowance === 0)) notes.push('บางร้านยังไม่ได้เผื่องบ ใส่เองแต่ละจุดหรือกดแบ่งงบใหม่ได้')
  if (cursor > 18 * 60) notes.push('ทริปจบหลัง 18:00 น. โปรดตรวจเวลาเปิดร้าน ระบบเก็บทุกจุดที่คุณเลือกไว้')
  return { state, stops, start, end: cursor, totalMinutes: cursor - start, allocatedBudget, notes }
}

export function editablePlan(input: PlanState, available: readonly Shop[]): PlanState {
  const plan = buildTripPlan(input, available)
  if (plan.state.customStops !== undefined) return plan.state
  return { ...plan.state, customStops: plan.stops.map(stop => ({ id: stop.id, kind: stop.kind, shopId: stop.shopId, title: stop.shopId ? undefined : stop.title, mapQuery: stop.shopId ? undefined : stop.mapQuery, description: stop.shopId ? undefined : stop.description, detail: stop.shopId ? undefined : stop.detail, minutes: stop.minutes, allowance: stop.allowance })) }
}

export function addTripStop(input: PlanState, shopId: string | null, available: readonly Shop[]): PlanState {
  const state = editablePlan(input, available)
  const shop = shopId ? available.find(shop => shop.id === shopId) : undefined
  if ((shopId && !shop) || state.customStops!.length >= 50) return state
  const used = new Set(state.customStops!.map(stop => stop.id))
  let next = 1
  while (used.has(`stop-${next}`)) next++
  const kind = shop ? kindForShop(shop) : 'walk'
  const minutes = { walk: 20, food: 45, cafe: 40, workshop: 90, snack: 20 }[kind]
  return { ...state, customStops: [...state.customStops!, { id: `stop-${next}`, kind, shopId: shop?.id, title: shop ? undefined : 'พักหรือเดินเล่น', minutes, allowance: 0 }] }
}

export function removeTripStop(input: PlanState, stopId: string, available: readonly Shop[]): PlanState {
  const state = editablePlan(input, available)
  return { ...state, customStops: state.customStops!.filter(stop => stop.id !== stopId) }
}

export function moveTripStop(input: PlanState, stopId: string, direction: -1 | 1, available: readonly Shop[]): PlanState {
  const state = editablePlan(input, available)
  const stops = [...state.customStops!]
  const from = stops.findIndex(stop => stop.id === stopId)
  const to = from + direction
  if (from < 0 || to < 0 || to >= stops.length) return state
  ;[stops[from], stops[to]] = [stops[to]!, stops[from]!]
  return { ...state, customStops: stops }
}

export function updateTripStop(input: PlanState, stopId: string, patch: Partial<Pick<EditableStop, 'minutes' | 'allowance' | 'title' | 'mapQuery'>>, available: readonly Shop[]): PlanState {
  const state = editablePlan(input, available)
  return { ...state, customStops: state.customStops!.map(stop => stop.id !== stopId ? stop : { ...stop, minutes: patch.minutes === undefined ? stop.minutes : safeAmount(patch.minutes, stop.minutes, 5, 480), allowance: patch.allowance === undefined ? stop.allowance : safeAmount(patch.allowance, stop.allowance || 0, 0, 100000), title: patch.title === undefined ? stop.title : patch.title.trim().slice(0, 120), mapQuery: patch.mapQuery === undefined ? stop.mapQuery : patch.mapQuery.trim().slice(0, 200) }) }
}

export function updateTripOptions(input: PlanState, patch: Partial<PlanOptions>, available: readonly Shop[]): PlanState {
  const state = editablePlan(input, available)
  return { ...state, options: normalizeOptions({ ...state.options, ...patch }) }
}

export function redistributeTripBudget(input: PlanState, available: readonly Shop[]): PlanState {
  const state = editablePlan(input, available)
  const unallocated = { ...state, customStops: state.customStops!.map(stop => ({ ...stop, allowance: stop.shopId ? undefined : stop.allowance })) }
  const allowances = new Map(buildTripPlan(unallocated, available).stops.map(stop => [stop.id, stop.allowance]))
  return { ...unallocated, customStops: unallocated.customStops.map(stop => ({ ...stop, allowance: allowances.get(stop.id) || 0 })) }
}
