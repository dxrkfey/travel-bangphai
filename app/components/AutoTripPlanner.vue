<script setup lang="ts">
import { Bookmark, Check, Clock3, Coffee, Footprints, MapPin, Palette, Plus, Share2, Sparkles, Ticket, X } from '@lucide/vue'
import { shops, shopZones, type ShopZone } from '~/data/shops'
import { mapsUrl } from '~/data/places'
import { addTripStop, buildTripPlan, createBlankPlanState, createPlanState, formatPlanTime, moveTripStop, parsePlanState, redistributeTripBudget, removeTripStop, selectTripShop, updateTripOptions, updateTripStop, type EditableStop, type PlanDuration, type PlanInterest, type PlanOptions, type PlanState } from '~/utils/planner'

const emit = defineEmits<{ savedChange: [saved: boolean] }>()
const { asset } = useSiteUrls()
const shopById = new Map(shops.map(shop => [shop.id, shop]))
const state = ref<PlanState>(createBlankPlanState())
const history = ref<PlanState[]>([])
const generated = ref(false)
const plan = computed(() => buildTripPlan(state.value, shops))
const itinerary = computed(() => plan.value.stops.map(stop => ({ ...stop, shop: shopById.get(stop.shopId || '') })))
const selectedShopIds = computed(() => plan.value.stops.flatMap(stop => stop.shopId ? [stop.shopId] : []))
const options = computed(() => state.value.options)
const savedPlan = ref<PlanState | null>(null)
const dialog = ref<HTMLDialogElement | null>(null)
const shopChooser = ref<HTMLDialogElement | null>(null)
const choosingSlot = ref('')
const choosingStop = computed(() => plan.value.stops.find(stop => stop.id === choosingSlot.value))
const query = ref('')
const zone = ref<ShopZone | 'all'>('all')
const shopChoices = computed(() => shops.filter(shop => (zone.value === 'all' || shop.zone === zone.value) && `${shop.name} ${shop.summary}`.toLocaleLowerCase('th').includes(query.value.trim().toLocaleLowerCase('th'))))
const notice = ref('')
const shareLink = ref('')
const resultPanel = ref<HTMLElement | null>(null)
const storageKeys = ['bangluang-plan-v3', 'bangluang-plan-v2', 'bangluang-plan-v1']
const icons = { walk: Footprints, food: Ticket, cafe: Coffee, workshop: Palette, snack: Ticket }
const interestLabels = { chill: 'คาเฟ่', art: 'เวิร์กช็อป', food: 'สายกิน' }
let timer: ReturnType<typeof setTimeout> | undefined
function toast(message: string) { notice.value = message; clearTimeout(timer); timer = setTimeout(() => notice.value = '', 4500) }
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
async function reveal() {
  generated.value = true
  await nextTick()
  resultPanel.value?.focus({ preventScroll: true })
  resultPanel.value?.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth', block: 'start' })
}
async function openShopChooser(slotId = 'add') {
  choosingSlot.value = slotId; query.value = ''; zone.value = 'all'
  await nextTick(); shopChooser.value?.showModal()
}
async function addShop(shopId: string) {
  if (plan.value.stops.length >= 50) { toast('เพิ่มได้สูงสุด 50 จุดต่อทริป'); return }
  commit(addTripStop(state.value, shopId, shops)); await reveal()
  toast(`เพิ่ม ${shopById.get(shopId)?.name} ในทริปแล้ว`)
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
}
async function suggest() {
  if (!generated.value || !plan.value.stops.length) commit(createPlanState(options.value))
  else {
    const preferred = options.value.interest === 'art' ? 'workshop' : options.value.interest === 'food' ? 'food' : 'cafe'
    const candidate = shops.find(shop => shop.zone === preferred && !selectedShopIds.value.includes(shop.id)) || shops.find(shop => !selectedShopIds.value.includes(shop.id))
    if (candidate) { await addShop(candidate.id); return }
    toast('เพิ่มร้านครบแล้ว เลือกแวะร้านเดิมซ้ำได้จากเพิ่มจุดแวะ'); return
  }
  await reveal()
}
function applyState(next: PlanState) { commit(next); generated.value = true }
function savePlan() {
  try { localStorage.setItem(storageKeys[0]!, JSON.stringify(state.value)); savedPlan.value = JSON.parse(JSON.stringify(state.value)); toast('บันทึกร้าน ลำดับ เวลา และงบแล้ว') }
  catch { toast('บันทึกไม่ได้ ลองใช้ปุ่มแชร์แพลนแทนได้ค่ะ') }
}
function openSaved() { dialog.value?.showModal() }
async function loadSaved() { if (savedPlan.value) applyState(savedPlan.value); dialog.value?.close(); await reveal() }
function removeSaved() {
  try { for (const key of storageKeys) localStorage.removeItem(key); savedPlan.value = null; toast('ลบแพลนที่บันทึกแล้ว') }
  catch { toast('ไม่สามารถลบแพลนได้ในขณะนี้') }
}
async function sharePlan() {
  const url = new URL(window.location.href)
  url.searchParams.delete('duration'); url.searchParams.delete('interest')
  url.searchParams.set('trip', JSON.stringify(state.value)); url.hash = 'planner'
  try { await navigator.clipboard.writeText(url.toString()); toast('คัดลอกลิงก์แล้ว เพื่อนจะเห็นแพลนตามที่คุณแก้ไว้') }
  catch { shareLink.value = url.toString(); toast('คัดลอกลิงก์จากช่องด้านล่างได้เลย') }
}
watch(savedPlan, value => emit('savedChange', !!value), { immediate: true })
onMounted(() => {
  try { for (const key of storageKeys) { const raw = localStorage.getItem(key); if (raw) { const parsed = parsePlanState(JSON.parse(raw)); if (parsed) { savedPlan.value = parsed; break } } } } catch { /* Storage is optional. */ }
  const params = new URLSearchParams(location.search)
  const shared = params.get('trip')
  if (shared) {
    try { const parsed = shared.length <= 100000 ? parsePlanState(JSON.parse(shared)) : null; if (parsed) applyState(parsed); else toast('ลิงก์แพลนไม่ถูกต้อง เริ่มจัดแพลนใหม่ได้เลย') }
    catch { toast('ลิงก์แพลนไม่ถูกต้อง เริ่มจัดแพลนใหม่ได้เลย') }
  } else if (params.has('duration')) {
    const legacy = parsePlanState({ duration: params.get('duration'), interest: params.get('interest') })
    if (legacy) applyState(legacy)
  }
})
onUnmounted(() => clearTimeout(timer))
defineExpose({ openSaved, addShop, selectedShopIds })
</script>

<template>
  <section id="planner" class="planner-section auto-planner"><div class="shell">
    <div class="section-heading"><div><p class="eyebrow">YOUR DAY, YOUR WAY</p><h2>จัดทริป<span class="orange">ในแบบคุณ</span></h2></div><p>เลือกกี่ร้านก็ได้ ข้ามโซนได้<br>เพิ่ม ลบ สลับ และปรับเวลาเองได้ทุกจุด</p></div>
    <div class="planner-grid">
      <div class="planner-controls">
        <h3 class="free-plan-title">เริ่มจากร้านที่อยากไป</h3>
        <p class="auto-plan-help">แวะคาเฟ่อย่างเดียว หรือผสมอาหารกับเวิร์กช็อปก็ได้ คุณเลือกลำดับเอง</p>
        <button type="button" class="button button-primary auto-generate" @click="openShopChooser()"><Plus :size="18" />{{ generated ? 'เพิ่มจุดแวะ' : 'เลือกร้านเอง' }}</button>
        <div class="auto-plan-fields free-plan-fields">
          <label>เริ่มเที่ยว<input type="time" :value="options.startTime" @change="setOptions({ startTime: textValue($event) })" /></label>
          <label>งบตั้งไว้ / คน (บาท)<input type="number" min="0" max="100000" step="1" inputmode="numeric" :value="options.budget" @change="setOptions({ budget: numeric($event) })" /></label>
          <label class="full-field">เวลาเดินระหว่างจุด (นาที)<input type="number" min="0" max="120" step="1" inputmode="numeric" :value="options.travelMinutes" @change="setOptions({ travelMinutes: numeric($event) })" /></label>
        </div>
        <details class="planner-extra"><summary>อยากให้ช่วยแนะนำ?</summary><div class="suggestion-fields">
          <label>เวลาคร่าว ๆ<select :value="options.duration" @change="setOptions({ duration: textValue($event) as PlanDuration })"><option value="half">ประมาณครึ่งวัน</option><option value="full">ประมาณเต็มวัน</option></select></label>
          <label>สนใจเป็นพิเศษ<select :value="options.interest" @change="setOptions({ interest: textValue($event) as PlanInterest })"><option v-for="(label, key) in interestLabels" :key="key" :value="key">{{ label }}</option></select></label>
          <button class="button button-outline" @click="suggest"><Sparkles :size="16" />{{ generated && plan.stops.length ? 'ช่วยแนะนำร้านเพิ่ม' : 'เริ่มจากแพลนแนะนำ' }}</button>
          <p class="auto-plan-help">แก้แพลนแนะนำต่อได้ทุกจุด เมื่อมีแพลนแล้วจะเพิ่มร้านให้ โดยเก็บจุดที่เลือกไว้</p>
        </div></details>
        <p class="auto-plan-help">เวลาอัปเดตตามลำดับและระยะเวลาที่คุณใส่ งบเป็นเงินเผื่อ ไม่ใช่ราคายืนยันจากร้าน</p>
      </div>
      <div v-if="!generated" class="planner-empty"><Footprints :size="32" aria-hidden="true" /><h3>วันนี้อยากแวะไหนบ้าง?</h3><p>กดเลือกร้านเอง หรือเพิ่มจากรายชื่อร้านด้านล่าง<br>เริ่มจากจุดเดียว แล้วค่อยเติมทริปได้</p><button class="edit-plan-button" @click="addActivity">เพิ่มกิจกรรมของฉัน</button></div>
      <div v-else ref="resultPanel" class="itinerary" tabindex="-1" role="region" aria-label="ทริปที่แก้ไขได้">
        <div class="itinerary-heading"><div><h3>ทริปของคุณ · {{ plan.stops.length }} จุด</h3><p class="auto-plan-summary">{{ formatPlanTime(plan.start) }}–{{ formatPlanTime(plan.end) }} น.<br>งบตั้งไว้ ฿{{ options.budget }} · ใส่ไว้รวม ฿{{ plan.allocatedBudget }}</p></div><button class="edit-plan-button" :disabled="!history.length" @click="undo">ย้อนกลับ</button></div>
        <p v-if="!plan.stops.length" class="empty-stops">ยังไม่มีจุดแวะ เลือกร้านหรือเพิ่มกิจกรรมได้เลย</p>
        <div class="itinerary-list" aria-label="รายการในทริป">
          <div v-for="(stop, index) in itinerary" :key="stop.id" class="itinerary-stop"><time>{{ formatPlanTime(stop.start) }}</time><span class="timeline-node"><component :is="icons[stop.kind]" :size="16" /></span><div class="editable-stop">
            <div class="auto-stop-heading"><div><NuxtLink v-if="stop.detail" :to="stop.detail">{{ stop.title }}</NuxtLink><strong v-else class="auto-stop-title">{{ stop.title }}</strong></div><img v-if="stop.shop" :src="asset(stop.shop.image)" :alt="`ภาพของ ${stop.title}`" :title="`ภาพ: ${stop.shop.photoCredit}`" loading="lazy" decoding="async" width="80" height="64" /></div>
            <p>{{ stop.description }}</p><div class="auto-stop-meta"><span>{{ stop.minutes }} นาที · ถึง {{ formatPlanTime(stop.end) }}</span><span>งบเผื่อ ฿{{ stop.allowance }}</span></div>
            <div class="auto-stop-actions"><a :href="mapsUrl(stop.mapQuery)" target="_blank" rel="noopener noreferrer" :aria-label="`เปิดแผนที่ ${stop.title}`"><MapPin :size="14" />แผนที่</a><button type="button" :aria-label="`เลือกร้านแทน ${stop.title}`" @click="openShopChooser(stop.id)">เปลี่ยนร้าน</button></div>
            <details class="stop-editor"><summary>แก้ไขจุดนี้</summary><div class="auto-plan-fields">
              <label v-if="!stop.shopId" class="full-field">ชื่อกิจกรรม<input :value="stop.title" maxlength="120" @change="editStop(stop.id, { title: textValue($event) })" /></label>
              <label v-if="!stop.shopId" class="full-field">สถานที่สำหรับค้นหาแผนที่<input :value="stop.mapQuery" maxlength="200" @change="editStop(stop.id, { mapQuery: textValue($event) })" /></label>
              <label>เวลาแวะ (นาที)<input type="number" min="5" max="480" step="1" inputmode="numeric" :value="stop.minutes" @change="editStop(stop.id, { minutes: numeric($event) })" /></label>
              <label>งบเผื่อ (บาท)<input type="number" min="0" max="100000" step="1" inputmode="numeric" :value="stop.allowance" @change="editStop(stop.id, { allowance: numeric($event) })" /></label>
            </div></details>
            <div class="stop-order-actions"><button :disabled="index === 0" :aria-label="`เลื่อน ${stop.title} ขึ้น`" @click="commit(moveTripStop(state, stop.id, -1, shops))">เลื่อนขึ้น</button><button :disabled="index === itinerary.length - 1" :aria-label="`เลื่อน ${stop.title} ลง`" @click="commit(moveTripStop(state, stop.id, 1, shops))">เลื่อนลง</button><button class="remove-stop" :aria-label="`ลบ ${stop.title} จากทริป`" @click="commit(removeTripStop(state, stop.id, shops)); toast('ลบจุดแวะแล้ว กดย้อนกลับเพื่อคืนได้')">ลบจุดนี้</button></div>
          </div></div>
        </div>
        <div class="free-plan-add"><button class="button button-primary" @click="openShopChooser()"><Plus :size="16" />เพิ่มจุดแวะ</button><button class="button button-outline" @click="addActivity">เพิ่มกิจกรรมเอง</button></div>
        <div class="itinerary-footer"><ul v-if="plan.notes.length" class="auto-plan-notes"><li v-for="note in plan.notes" :key="note">{{ note }}</li></ul><p><Clock3 :size="14" />เผื่อเดิน {{ options.travelMinutes }} นาทีระหว่างจุด</p><button class="edit-plan-button" :disabled="!plan.stops.some(stop => stop.shopId)" @click="commit(redistributeTripBudget(state, shops)); toast('แบ่งงบที่เหลือให้ร้านในทริปแล้ว')">แบ่งงบใหม่ตามงบตั้งไว้</button><p class="auto-plan-disclaimer">กรุณาเช็กเวลาเปิดและราคากับร้านก่อนเดินทาง</p><div class="plan-buttons"><button class="button button-primary" @click="savePlan"><Bookmark :size="17" />บันทึกทริปนี้</button><button class="button button-outline" @click="sharePlan"><Share2 :size="17" />แชร์ให้เพื่อน</button></div><label v-if="shareLink" class="auto-share-fallback">ลิงก์ทริปสำหรับคัดลอก<input :value="shareLink" readonly aria-label="ลิงก์ทริปสำหรับคัดลอก" @focus="($event.target as HTMLInputElement).select()" /></label></div>
      </div>
    </div>
    <dialog ref="shopChooser" class="shop-choice-dialog" aria-labelledby="shop-choice-title" @click="($event.target === shopChooser) && shopChooser?.close()" @close="choosingSlot = ''"><div class="shop-choice-content">
      <header class="shop-choice-header"><div><h3 id="shop-choice-title">{{ choosingSlot === 'add' ? 'เพิ่มจุดแวะ' : 'เปลี่ยนร้าน' }}</h3><p>{{ choosingStop ? `แทน ${choosingStop.title}` : 'เลือกได้ทุกโซน และแวะร้านเดิมซ้ำได้' }}</p></div><button class="icon-button" aria-label="ปิดรายการร้าน" @click="shopChooser?.close()"><X /></button></header>
      <div class="shop-picker-filters"><input v-model="query" type="search" aria-label="ค้นหาร้านเพื่อเพิ่มในทริป" placeholder="ค้นหาชื่อร้าน…" /><div class="filter-row"><button class="filter-chip" :class="{ active: zone === 'all' }" :aria-pressed="zone === 'all'" @click="zone = 'all'">ทั้งหมด</button><button v-for="item in shopZones" :key="item.id" class="filter-chip" :class="{ active: zone === item.id }" :aria-pressed="zone === item.id" @click="zone = item.id">{{ item.title }}</button></div></div>
      <p v-if="choosingStop" class="shop-choice-help">เลือกข้ามโซนได้ เวลาและงบของจุดนี้จะคงเดิม ปรับต่อได้หลังเลือก</p>
      <ul class="shop-choice-list"><li v-for="shop in shopChoices" :key="shop.id"><button class="shop-choice" :class="{ selected: shop.id === choosingStop?.shopId }" @click="chooseShop(shop.id)"><img :src="asset(shop.image)" :alt="`ภาพของ ${shop.name}`" loading="lazy" decoding="async" width="160" height="128" /><span class="shop-choice-copy"><strong>{{ shop.name }}</strong><span>{{ shop.summary }}</span><small v-if="selectedShopIds.includes(shop.id)">อยู่ในทริปแล้ว · เลือกแวะซ้ำได้</small><small>ภาพ: {{ shop.photoCredit }}</small></span><Check v-if="shop.id === choosingStop?.shopId" :size="19" aria-hidden="true" /></button></li></ul><p v-if="!shopChoices.length" class="empty-stops" role="status">ไม่พบร้าน ลองค้นหาใหม่หรือเลือกโซนอื่น</p>
    </div></dialog>
    <Transition name="toast"><div v-if="notice" class="toast-message" role="status"><Check :size="19" />{{ notice }}</div></Transition>
    <dialog ref="dialog" class="saved-dialog" aria-label="ทริปที่บันทึก" @click="($event.target === dialog) && dialog?.close()"><div class="dialog-inner"><button class="icon-button dialog-close" aria-label="ปิดหน้าต่าง" @click="dialog?.close()"><X /></button><Bookmark :size="32" /><h2>ทริปที่บันทึก</h2><template v-if="savedPlan"><p>เก็บร้าน ลำดับ เวลา และงบที่เลือกไว้แล้ว</p><div class="saved-summary"><div><strong>ทริปคลองบางหลวงของฉัน</strong><p>เริ่ม {{ savedPlan.options.startTime }} น. · งบ ฿{{ savedPlan.options.budget }}</p></div></div><button class="button button-primary" @click="loadSaved">เปิดทริปที่บันทึก</button><button class="delete-plan" @click="removeSaved">ลบทริปนี้</button></template><template v-else><p>ยังไม่มีทริปที่บันทึกไว้</p><button class="button button-primary" @click="loadSaved">เริ่มจัดทริป</button></template><small>บันทึกเฉพาะเบราว์เซอร์และเครื่องที่คุณใช้อยู่</small></div></dialog>
  </div></section>
</template>
