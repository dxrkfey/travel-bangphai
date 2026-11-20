<script setup lang="ts">
import { ArrowDown, ArrowUp, Bookmark, Check, Clock3, Coffee, Footprints, MapPin, Palette, Pencil, Plus, RefreshCw, Share2, Sparkles, Ticket, Trash2, Undo2, X } from '@lucide/vue'
import { shops, shopZones, type ShopZone } from '~/data/shops'
import { mapsUrl } from '~/data/places'
import { addTripStop, buildTripPlan, createBlankPlanState, createPlanState, formatPlanTime, moveTripStop, parsePlanState, redistributeTripBudget, removeTripStop, selectTripShop, updateTripOptions, updateTripStop, type EditableStop, type PlanDuration, type PlanInterest, type PlanOptions, type PlanState } from '~/utils/planner'

const emit = defineEmits<{ savedChange: [saved: boolean] }>()
const { asset } = useSiteUrls()
const { open: openDetail } = useDetailSheet()
const route = useRoute()
const shopById = new Map(shops.map(shop => [shop.id, shop]))
const state = ref<PlanState>(createBlankPlanState())
const history = ref<PlanState[]>([])
const generated = ref(false)
const plan = computed(() => buildTripPlan(state.value, shops))
const itinerary = computed(() => plan.value.stops.map(stop => ({ ...stop, shop: shopById.get(stop.shopId || ''), detailId: stop.shopId || (stop.detail?.endsWith('/canal-walk') ? 'canal-walk' : '') })))
const selectedShopIds = computed(() => plan.value.stops.flatMap(stop => stop.shopId ? [stop.shopId] : []))
const unbudgetedShops = computed(() => plan.value.stops.filter(stop => stop.shopId && !stop.allowance).length)
const options = computed(() => state.value.options)
const savedPlan = ref<PlanState | null>(null)
const dialog = ref<HTMLDialogElement | null>(null)
const shopChooser = ref<HTMLDialogElement | null>(null)
const choosingSlot = ref('')
const choosingStop = computed(() => plan.value.stops.find(stop => stop.id === choosingSlot.value))
const editingId = ref('')
const query = ref('')
const zone = ref<ShopZone | 'all'>('all')
const shopChoices = computed(() => shops.filter(shop => (zone.value === 'all' || shop.zone === zone.value) && `${shop.name} ${shop.summary}`.toLocaleLowerCase('th').includes(query.value.trim().toLocaleLowerCase('th'))))
const notice = ref<{ message: string; action?: { label: string; run: () => void } } | null>(null)
const shareLink = ref('')
const resultPanel = ref<HTMLElement | null>(null)
const storageKeys = ['bangluang-plan-v3', 'bangluang-plan-v2', 'bangluang-plan-v1']
const icons = { walk: Footprints, food: Ticket, cafe: Coffee, workshop: Palette, snack: Ticket }
const interestLabels = { chill: 'คาเฟ่', art: 'เวิร์กช็อป', food: 'สายกิน' }
let timer: ReturnType<typeof setTimeout> | undefined

function toast(message: string, action?: { label: string; run: () => void }) {
  notice.value = { message, action }; clearTimeout(timer); timer = setTimeout(() => notice.value = null, action ? 6000 : 4500)
}
function runToastAction() { const action = notice.value?.action; notice.value = null; action?.run() }
function commit(next: PlanState) {
  if (JSON.stringify(next) === JSON.stringify(state.value)) return
  history.value = [...history.value.slice(-29), state.value]
  state.value = next; shareLink.value = ''
}
function undo() { const previous = history.value.pop(); if (previous) { state.value = previous; shareLink.value = '' } }
function setOptions(patch: Partial<PlanOptions>) { commit(updateTripOptions(state.value, patch, shops)) }
function numeric(event: Event) { return (event.target as HTMLInputElement).valueAsNumber }
function textValue(event: Event) { return (event.target as HTMLInputElement).value }
function editStop(id: string, patch: Partial<EditableStop>) { commit(updateTripStop(state.value, id, patch, shops)) }
function scrollBehavior(): ScrollBehavior { return window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' }
async function reveal() {
  generated.value = true
  await nextTick()
  resultPanel.value?.focus({ preventScroll: true })
  resultPanel.value?.scrollIntoView({ behavior: scrollBehavior(), block: 'start' })
}
async function openShopChooser(slotId = 'add') {
  choosingSlot.value = slotId; query.value = ''; zone.value = 'all'
  await nextTick(); shopChooser.value?.showModal()
}
// Adding from the shop list keeps the visitor where they are; the toast offers a jump to the trip.
async function addShop(shopId: string, options: { reveal?: boolean } = {}) {
  if (plan.value.stops.length >= 50) { toast('เพิ่มได้สูงสุด 50 จุดต่อทริป'); return }
  commit(addTripStop(state.value, shopId, shops))
  const name = shopById.get(shopId)?.name
  if (options.reveal === false) { generated.value = true; toast(`เพิ่ม ${name} แล้ว · ทริปมี ${plan.value.stops.length} จุด`, { label: 'ดูทริป', run: reveal }); return }
  await reveal(); toast(`เพิ่ม ${name} ในทริปแล้ว`)
}
async function chooseShop(shopId: string) {
  const slot = choosingSlot.value
  shopChooser.value?.close()
  if (slot === 'add') await addShop(shopId)
  else { commit(selectTripShop(state.value, slot, shopId, shops)); toast('เปลี่ยนร้านแล้ว แก้เวลาและงบต่อได้เลย') }
}
async function addActivity() {
  if (plan.value.stops.length >= 50) { toast('เพิ่มได้สูงสุด 50 จุดต่อทริป'); return }
  commit(addTripStop(state.value, null, shops)); await reveal()
  editingId.value = plan.value.stops.at(-1)?.id || ''
}
async function suggest() {
  if (!generated.value || !plan.value.stops.length) { commit(createPlanState(options.value)); await reveal(); toast('จัดทริปแนะนำให้แล้ว แก้ เพิ่ม หรือลบได้ทุกจุด'); return }
  const preferred = options.value.interest === 'art' ? 'workshop' : options.value.interest === 'food' ? 'food' : 'cafe'
  const candidate = shops.find(shop => shop.zone === preferred && !selectedShopIds.value.includes(shop.id)) || shops.find(shop => !selectedShopIds.value.includes(shop.id))
  if (candidate) await addShop(candidate.id)
  else toast('เพิ่มร้านครบแล้ว เลือกแวะร้านเดิมซ้ำได้จากปุ่มเพิ่มจุดแวะ')
}
function removeStop(id: string) {
  commit(removeTripStop(state.value, id, shops))
  toast('ลบจุดแวะแล้ว', { label: 'เอาคืน', run: undo })
}
function shareBudget() { commit(redistributeTripBudget(state.value, shops)); toast(`แบ่งงบ ฿${options.value.budget} ให้ร้านในทริปแล้ว`) }
function applyState(next: PlanState) { commit(next); generated.value = true }
function savePlan() {
  try { localStorage.setItem(storageKeys[0]!, JSON.stringify(state.value)); savedPlan.value = JSON.parse(JSON.stringify(state.value)); toast('บันทึกทริปไว้ในเครื่องนี้แล้ว') }
  catch { toast('บันทึกไม่ได้ ลองใช้ปุ่มแชร์ทริปแทนได้') }
}
function openSaved() { dialog.value?.showModal() }
async function loadSaved() {
  dialog.value?.close()
  if (!savedPlan.value) { document.getElementById('planner')?.scrollIntoView({ behavior: scrollBehavior(), block: 'start' }); return }
  applyState(savedPlan.value); await reveal()
}
function removeSaved() {
  try { for (const key of storageKeys) localStorage.removeItem(key); savedPlan.value = null; toast('ลบทริปที่บันทึกแล้ว') }
  catch { toast('ไม่สามารถลบทริปได้ในขณะนี้') }
}
async function sharePlan() {
  const url = new URL(window.location.href)
  url.searchParams.delete('duration'); url.searchParams.delete('interest'); url.searchParams.delete('place')
  url.searchParams.set('trip', JSON.stringify(state.value)); url.hash = 'planner'
  const link = url.toString()
  // Phones open the native share sheet (LINE, Messenger…); desktops fall back to copying.
  if (navigator.share) {
    try { await navigator.share({ title: 'ทริปคลองบางหลวงของฉัน', text: `ทริปคลองบางหลวง ${plan.value.stops.length} จุด ${formatPlanTime(plan.value.start)}–${formatPlanTime(plan.value.end)} น.`, url: link }); return }
    catch (error) { if ((error as DOMException)?.name === 'AbortError') return }
  }
  try { await navigator.clipboard.writeText(link); toast('คัดลอกลิงก์แล้ว เพื่อนจะเห็นทริปตามที่คุณแก้ไว้') }
  catch { shareLink.value = link; toast('คัดลอกลิงก์จากช่องด้านล่างได้เลย') }
}
watch(savedPlan, value => emit('savedChange', !!value), { immediate: true })

// The router briefly rewrites the URL during hydration, so read the shared trip from the
// route once it settles instead of from location.search on mount.
let handledSharedLink = false
function loadSharedLink() {
  if (handledSharedLink) return
  const shared = route.query.trip
  if (typeof shared === 'string' && shared) {
    handledSharedLink = true
    try { const parsed = shared.length <= 100000 ? parsePlanState(JSON.parse(shared)) : null; if (parsed) { applyState(parsed); history.value = [] } else toast('ลิงก์ทริปไม่ถูกต้อง เริ่มจัดทริปใหม่ได้เลย') }
    catch { toast('ลิงก์ทริปไม่ถูกต้อง เริ่มจัดทริปใหม่ได้เลย') }
  } else if (typeof route.query.duration === 'string') {
    handledSharedLink = true
    const legacy = parsePlanState({ duration: route.query.duration, interest: route.query.interest })
    if (legacy) { applyState(legacy); history.value = [] }
  }
}
onMounted(() => {
  try { for (const key of storageKeys) { const raw = localStorage.getItem(key); if (raw) { const parsed = parsePlanState(JSON.parse(raw)); if (parsed) { savedPlan.value = parsed; break } } } } catch { /* Storage is optional. */ }
  watch(() => route.query, loadSharedLink, { immediate: true })
})
onUnmounted(() => clearTimeout(timer))
defineExpose({ openSaved, addShop, selectedShopIds })
</script>

<template>
  <section id="planner" class="planner-section auto-planner"><div class="shell">
    <div class="section-heading"><div><p class="eyebrow">YOUR DAY, YOUR WAY</p><h2>จัดทริป<span class="orange">ในแบบคุณ</span></h2></div><p>เลือกกี่ร้านก็ได้ ข้ามโซนได้ <br>เพิ่ม ลบ สลับ และปรับเวลาเองได้ทุกจุด</p></div>
    <div class="planner-grid">
      <div class="planner-controls">
        <h3 class="free-plan-title">เริ่มจากร้านที่อยากไป</h3>
        <p class="auto-plan-help">แวะคาเฟ่อย่างเดียว หรือผสมอาหารกับเวิร์กช็อปก็ได้ คุณเลือกลำดับเอง</p>
        <button type="button" class="button button-primary auto-generate" @click="openShopChooser()"><Plus :size="18" />{{ generated ? 'เพิ่มจุดแวะ' : 'เลือกร้านเอง' }}</button>
        <div class="auto-plan-fields free-plan-fields">
          <label>เริ่มเที่ยว<input type="time" :value="options.startTime" @change="setOptions({ startTime: textValue($event) })" /></label>
          <label>งบต่อคน (บาท)<input type="number" min="0" max="100000" step="1" inputmode="numeric" :value="options.budget" @change="setOptions({ budget: numeric($event) })" /></label>
        </div>
        <details class="planner-extra"><summary>ให้ช่วยแนะนำ และตั้งค่าเพิ่มเติม</summary><div class="suggestion-fields">
          <label>เวลาคร่าว ๆ<select :value="options.duration" @change="setOptions({ duration: textValue($event) as PlanDuration })"><option value="half">ประมาณครึ่งวัน</option><option value="full">ประมาณเต็มวัน</option></select></label>
          <label>สนใจเป็นพิเศษ<select :value="options.interest" @change="setOptions({ interest: textValue($event) as PlanInterest })"><option v-for="(label, key) in interestLabels" :key="key" :value="key">{{ label }}</option></select></label>
          <button class="button button-outline" @click="suggest"><Sparkles :size="16" />{{ generated && plan.stops.length ? 'ช่วยแนะนำร้านเพิ่ม' : 'ให้ช่วยจัดทริปให้' }}</button>
          <label>เวลาเดินระหว่างจุด (นาที)<input type="number" min="0" max="120" step="1" inputmode="numeric" :value="options.travelMinutes" @change="setOptions({ travelMinutes: numeric($event) })" /></label>
        </div></details>
        <p class="auto-plan-help">เวลาคำนวณตามลำดับและระยะเวลาที่คุณใส่ งบเป็นเงินเผื่อ ไม่ใช่ราคายืนยันจากร้าน</p>
      </div>
      <div v-if="!generated" class="planner-empty"><Footprints :size="30" aria-hidden="true" /><h3>วันนี้อยากแวะไหนบ้าง?</h3><p>ยังไม่รู้จะเริ่มตรงไหน ให้เราจัดทริปตัวอย่างให้ <br>แล้วค่อยแก้ เพิ่ม หรือลบได้ทุกจุด</p><button class="button button-outline planner-empty-cta" @click="suggest"><Sparkles :size="17" />ให้ช่วยจัดทริปให้</button><button class="edit-plan-button" @click="addActivity">หรือเพิ่มกิจกรรมของฉันเอง</button></div>
      <div v-else ref="resultPanel" class="itinerary" tabindex="-1" role="region" aria-label="ทริปที่แก้ไขได้">
        <div class="itinerary-heading"><div><h3>ทริปของคุณ · {{ plan.stops.length }} จุด</h3><p class="auto-plan-summary"><template v-if="plan.stops.length">{{ formatPlanTime(plan.start) }}–{{ formatPlanTime(plan.end) }} น. · </template>งบ ฿{{ options.budget }}<template v-if="plan.allocatedBudget"> · แบ่งแล้ว ฿{{ plan.allocatedBudget }}</template></p></div><button class="edit-plan-button with-icon" :disabled="!history.length" @click="undo"><Undo2 :size="16" aria-hidden="true" />ย้อนกลับ</button></div>
        <div v-if="unbudgetedShops" class="budget-prompt"><p>ยังไม่ได้แบ่งงบให้ {{ unbudgetedShops }} ร้าน</p><button class="button button-outline" @click="shareBudget"><RefreshCw :size="15" aria-hidden="true" />แบ่งงบ ฿{{ options.budget }} อัตโนมัติ</button></div>
        <p v-if="!plan.stops.length" class="empty-stops">ยังไม่มีจุดแวะ เลือกร้านหรือเพิ่มกิจกรรมได้เลย</p>
        <ol class="itinerary-list" aria-label="รายการในทริป">
          <li v-for="(stop, index) in itinerary" :key="stop.id" class="itinerary-stop"><time>{{ formatPlanTime(stop.start) }}</time><span class="timeline-node"><component :is="icons[stop.kind]" :size="16" /></span><div class="editable-stop">
            <div class="auto-stop-heading">
              <button v-if="stop.detailId" class="auto-stop-link" @click="openDetail(stop.detailId)"><strong>{{ stop.title }}</strong><span>{{ stop.description }}</span></button>
              <div v-else class="auto-stop-link"><strong>{{ stop.title }}</strong><span>{{ stop.description }}</span></div>
              <img v-if="stop.shop" :src="asset(stop.shop.image)" alt="" loading="lazy" decoding="async" width="80" height="64" />
            </div>
            <div class="auto-stop-meta"><span>{{ stop.minutes }} นาที · ถึง {{ formatPlanTime(stop.end) }}</span><span v-if="stop.allowance">งบ ฿{{ stop.allowance }}</span><span v-else-if="stop.shopId" class="no-budget">ยังไม่ใส่งบ</span></div>
            <div class="stop-toolbar">
              <a class="stop-tool" :href="mapsUrl(stop.mapQuery)" target="_blank" rel="noopener noreferrer" :aria-label="`เปิดแผนที่ ${stop.title}`"><MapPin :size="16" aria-hidden="true" /><span>แผนที่</span></a>
              <button v-if="stop.shopId" class="stop-tool" :aria-label="`เปลี่ยนร้านแทน ${stop.title}`" @click="openShopChooser(stop.id)"><RefreshCw :size="16" aria-hidden="true" /><span>เปลี่ยน</span></button>
              <button class="stop-tool" :class="{ active: editingId === stop.id }" :aria-expanded="editingId === stop.id" :aria-controls="`edit-${stop.id}`" :aria-label="`แก้ไข ย้าย หรือลบ ${stop.title}`" @click="editingId = editingId === stop.id ? '' : stop.id"><Pencil :size="16" aria-hidden="true" /><span>แก้ไข</span></button>
            </div>
            <div v-if="editingId === stop.id" :id="`edit-${stop.id}`" class="stop-editor auto-plan-fields">
              <label v-if="!stop.shopId" class="full-field">ชื่อกิจกรรม<input :value="stop.title" maxlength="120" @change="editStop(stop.id, { title: textValue($event) })" /></label>
              <label v-if="!stop.shopId" class="full-field">สถานที่สำหรับค้นหาแผนที่<input :value="stop.mapQuery" maxlength="200" @change="editStop(stop.id, { mapQuery: textValue($event) })" /></label>
              <label>เวลาแวะ (นาที)<input type="number" min="5" max="480" step="1" inputmode="numeric" :value="stop.minutes" @change="editStop(stop.id, { minutes: numeric($event) })" /></label>
              <label>งบเผื่อ (บาท)<input type="number" min="0" max="100000" step="1" inputmode="numeric" :value="stop.allowance" @change="editStop(stop.id, { allowance: numeric($event) })" /></label>
              <div class="stop-editor-actions full-field">
                <button class="stop-tool" :disabled="index === 0" :aria-label="`เลื่อน ${stop.title} ขึ้น`" @click="commit(moveTripStop(state, stop.id, -1, shops))"><ArrowUp :size="17" aria-hidden="true" /><span>ขึ้น</span></button>
                <button class="stop-tool" :disabled="index === itinerary.length - 1" :aria-label="`เลื่อน ${stop.title} ลง`" @click="commit(moveTripStop(state, stop.id, 1, shops))"><ArrowDown :size="17" aria-hidden="true" /><span>ลง</span></button>
                <button class="stop-tool remove-stop" :aria-label="`ลบ ${stop.title} จากทริป`" @click="removeStop(stop.id); editingId = ''"><Trash2 :size="17" aria-hidden="true" /><span>ลบ</span></button>
                <button class="edit-plan-button" @click="editingId = ''">เสร็จแล้ว</button>
              </div>
            </div>
          </div></li>
        </ol>
        <div class="free-plan-add"><button class="button button-primary" @click="openShopChooser()"><Plus :size="16" />เพิ่มจุดแวะ</button><button class="button button-outline" @click="addActivity">เพิ่มกิจกรรมเอง</button></div>
        <div class="itinerary-footer">
          <ul v-if="plan.notes.length" class="auto-plan-notes"><li v-for="note in plan.notes" :key="note">{{ note }}</li></ul>
          <p><Clock3 :size="14" />เผื่อเดิน {{ options.travelMinutes }} นาทีระหว่างจุด · เช็กเวลาเปิดและราคากับร้านก่อนเดินทาง</p>
          <button v-if="!unbudgetedShops && plan.stops.some(stop => stop.shopId)" class="edit-plan-button" @click="shareBudget">แบ่งงบใหม่ตามงบที่ตั้งไว้</button>
          <div class="plan-buttons"><button class="button button-primary" :disabled="!plan.stops.length" @click="savePlan"><Bookmark :size="17" />บันทึกทริป</button><button class="button button-outline" :disabled="!plan.stops.length" @click="sharePlan"><Share2 :size="17" />แชร์ให้เพื่อน</button></div>
          <label v-if="shareLink" class="auto-share-fallback">ลิงก์ทริปสำหรับคัดลอก<input :value="shareLink" readonly @focus="($event.target as HTMLInputElement).select()" /></label>
        </div>
      </div>
    </div>
    <dialog ref="shopChooser" class="shop-choice-dialog sheet-dialog" aria-labelledby="shop-choice-title" @click="($event.target === shopChooser) && shopChooser?.close()" @close="choosingSlot = ''"><div class="shop-choice-content">
      <header class="shop-choice-header"><div><h3 id="shop-choice-title">{{ choosingSlot === 'add' ? 'เพิ่มจุดแวะ' : 'เปลี่ยนร้าน' }}</h3><p>{{ choosingStop ? `แทน ${choosingStop.title} · เวลาและงบเดิมคงไว้` : 'เลือกได้ทุกโซน และแวะร้านเดิมซ้ำได้' }}</p></div><button class="icon-button" aria-label="ปิดรายการร้าน" @click="shopChooser?.close()"><X /></button></header>
      <div class="shop-picker-filters"><input v-model="query" type="search" aria-label="ค้นหาร้านเพื่อเพิ่มในทริป" placeholder="ค้นหาชื่อร้าน…" enterkeyhint="search" /><div class="filter-row" role="group" aria-label="เลือกโซน"><button class="filter-chip" :class="{ active: zone === 'all' }" :aria-pressed="zone === 'all'" @click="zone = 'all'">ทั้งหมด</button><button v-for="item in shopZones" :key="item.id" class="filter-chip" :class="{ active: zone === item.id }" :aria-pressed="zone === item.id" @click="zone = item.id">{{ item.title }}</button></div></div>
      <ul class="shop-choice-list"><li v-for="shop in shopChoices" :key="shop.id"><button class="shop-choice" :class="{ selected: shop.id === choosingStop?.shopId }" @click="chooseShop(shop.id)"><img :src="asset(shop.image)" :alt="`ภาพของ ${shop.name}`" loading="lazy" decoding="async" width="160" height="128" /><span class="shop-choice-copy"><strong>{{ shop.name }}</strong><span>{{ shop.summary }}</span><small v-if="selectedShopIds.includes(shop.id)" class="in-trip-tag">อยู่ในทริปแล้ว · แวะซ้ำได้</small><small>ภาพ: {{ shop.photoCredit }}</small></span><Check v-if="shop.id === choosingStop?.shopId" :size="19" aria-hidden="true" /></button></li></ul><p v-if="!shopChoices.length" class="empty-stops" role="status">ไม่พบร้าน ลองค้นหาใหม่หรือเลือกโซนอื่น</p>
    </div></dialog>
    <Transition name="toast"><div v-if="notice" class="toast-message" role="status"><Check :size="19" aria-hidden="true" /><span>{{ notice.message }}</span><button v-if="notice.action" class="toast-action" @click="runToastAction">{{ notice.action.label }}</button></div></Transition>
    <dialog ref="dialog" class="saved-dialog sheet-dialog" aria-labelledby="saved-title" @click="($event.target === dialog) && dialog?.close()"><div class="dialog-inner"><button class="icon-button dialog-close" aria-label="ปิดหน้าต่าง" @click="dialog?.close()"><X /></button><Bookmark :size="32" /><h2 id="saved-title">ทริปที่บันทึก</h2><template v-if="savedPlan"><p>เก็บร้าน ลำดับ เวลา และงบที่เลือกไว้แล้ว</p><div class="saved-summary"><div><strong>ทริปคลองบางหลวงของฉัน</strong><p>เริ่ม {{ savedPlan.options.startTime }} น. · งบ ฿{{ savedPlan.options.budget }}</p></div></div><button class="button button-primary" @click="loadSaved">เปิดทริปที่บันทึก</button><button class="delete-plan" @click="removeSaved">ลบทริปนี้</button></template><template v-else><p>ยังไม่มีทริปที่บันทึกไว้</p><button class="button button-primary" @click="loadSaved">เริ่มจัดทริป</button></template><small>บันทึกเฉพาะเบราว์เซอร์และเครื่องที่คุณใช้อยู่</small></div></dialog>
  </div></section>
</template>
