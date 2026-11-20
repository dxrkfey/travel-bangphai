<script setup lang="ts">
import { Bookmark, CalendarDays, Check, ChevronDown, Clock3, Coffee, Footprints, MapPin, Palette, Share2, Sparkles, Sun, Ticket, X } from '@lucide/vue'
import { shops } from '~/data/shops'
import { mapsUrl } from '~/data/places'
import { buildTripPlan, createPlanState, defaultPlanOptions, formatPlanTime, getTripShopChoices, parsePlanState, planBudgets, selectTripShop, startTimes, type PlanDuration, type PlanInterest, type PlanState } from '~/utils/planner'

const emit = defineEmits<{ savedChange: [saved: boolean] }>()
const { asset } = useSiteUrls()
const shopById = new Map(shops.map(shop => [shop.id, shop]))
const duration = ref<PlanDuration>(defaultPlanOptions.duration)
const interest = ref<PlanInterest>(defaultPlanOptions.interest)
const startTime = ref(defaultPlanOptions.startTime)
const budget = ref(defaultPlanOptions.budget)
const options = computed(() => ({ duration: duration.value, interest: interest.value, startTime: startTime.value, budget: budget.value }))
const state = ref<PlanState>(createPlanState(options.value))
const plan = computed(() => buildTripPlan(state.value, shops))
const itinerary = computed(() => plan.value.stops.map(stop => ({ ...stop, shop: shopById.get(stop.shopId || '') })))
const dirty = computed(() => JSON.stringify(options.value) !== JSON.stringify(state.value.options))
const generated = ref(false)
const savedPlan = ref<PlanState | null>(null)
const dialog = ref<HTMLDialogElement | null>(null)
const notice = ref('')
const shareLink = ref('')
const formPanel = ref<HTMLFormElement | null>(null)
const resultPanel = ref<HTMLElement | null>(null)
const shopChooser = ref<HTMLDialogElement | null>(null)
const choosingSlot = ref('')
const choosingStop = computed(() => plan.value.stops.find(stop => stop.id === choosingSlot.value))
const shopChoices = computed(() => getTripShopChoices(state.value, choosingSlot.value, shops))
const storageKey = 'bangluang-plan-v2'
const legacyKey = 'bangluang-plan-v1'
const icons = { walk: Footprints, food: Ticket, cafe: Coffee, workshop: Palette, snack: Ticket }
const interestLabels = { chill: 'คาเฟ่', art: 'เวิร์กช็อป', food: 'สายกิน' }
let timer: ReturnType<typeof setTimeout> | undefined

function toast(message: string) { notice.value = message; clearTimeout(timer); timer = setTimeout(() => notice.value = '', 4500) }
function applyState(next: PlanState) {
  duration.value = next.options.duration; interest.value = next.options.interest
  startTime.value = next.options.startTime; budget.value = next.options.budget
  state.value = next; generated.value = true; shareLink.value = ''
}
async function generatePlan() {
  if (!generated.value || dirty.value) state.value = createPlanState(options.value)
  generated.value = true; shareLink.value = ''
  await nextTick()
  resultPanel.value?.focus({ preventScroll: true })
  resultPanel.value?.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth', block: 'start' })
}
async function openShopChooser(slotId: string) {
  if (dirty.value) return
  choosingSlot.value = slotId
  await nextTick()
  shopChooser.value?.showModal()
}
function chooseShop(shopId: string) {
  if (!shopChoices.value.some(shop => shop.id === shopId)) return
  state.value = selectTripShop(state.value, choosingSlot.value, shopId, shops)
  shareLink.value = ''
  shopChooser.value?.close()
  toast(`เลือก ${shopById.get(shopId)?.name} แล้ว`)
}
function editOptions() {
  formPanel.value?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  formPanel.value?.querySelector('button')?.focus({ preventScroll: true })
}
function savePlan() {
  if (dirty.value || !generated.value) return
  try { localStorage.setItem(storageKey, JSON.stringify(state.value)); savedPlan.value = JSON.parse(JSON.stringify(state.value)); toast('บันทึกทั้งเวลาและร้านในแพลนนี้แล้ว') }
  catch { toast('บันทึกไม่ได้ ลองใช้ปุ่มแชร์แพลนแทนได้ค่ะ') }
}
function openSaved() { dialog.value?.showModal() }
async function loadSaved() {
  if (savedPlan.value) applyState(savedPlan.value)
  dialog.value?.close()
  await nextTick()
  ;(savedPlan.value ? resultPanel.value : formPanel.value)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}
function removeSaved() {
  try { localStorage.removeItem(storageKey); localStorage.removeItem(legacyKey); savedPlan.value = null; toast('ลบแพลนที่บันทึกแล้ว') }
  catch { toast('ไม่สามารถลบแพลนได้ในขณะนี้') }
}
async function sharePlan() {
  if (dirty.value || !generated.value) return
  const url = new URL(window.location.href)
  url.searchParams.delete('duration'); url.searchParams.delete('interest')
  url.searchParams.set('trip', JSON.stringify(state.value)); url.hash = 'planner'
  try { await navigator.clipboard.writeText(url.toString()); toast('คัดลอกลิงก์แล้ว เพื่อนจะเห็นร้านและเวลาเหมือนแพลนนี้') }
  catch { shareLink.value = url.toString(); toast('คัดลอกลิงก์จากช่องด้านล่างได้เลย') }
}
watch(savedPlan, value => emit('savedChange', !!value), { immediate: true })
onMounted(() => {
  try { const raw = localStorage.getItem(storageKey) || localStorage.getItem(legacyKey); if (raw) savedPlan.value = parsePlanState(JSON.parse(raw)) } catch { /* Storage is optional. */ }
  const params = new URLSearchParams(location.search)
  const shared = params.get('trip')
  if (shared) {
    try { const parsed = shared.length <= 5000 ? parsePlanState(JSON.parse(shared)) : null; if (parsed) applyState(parsed); else toast('ลิงก์แพลนไม่ถูกต้อง เริ่มจัดแพลนใหม่ได้เลย') }
    catch { toast('ลิงก์แพลนไม่ถูกต้อง เริ่มจัดแพลนใหม่ได้เลย') }
  } else if (params.has('duration')) {
    const legacy = parsePlanState({ duration: params.get('duration'), interest: params.get('interest') })
    if (legacy) applyState(legacy)
  }
})
onUnmounted(() => clearTimeout(timer))
defineExpose({ openSaved })
</script>


<template>
  <section id="planner" class="planner-section auto-planner"><div class="shell">
    <div class="section-heading"><div><p class="eyebrow">YOUR DAY, MADE SIMPLE</p><h2>จัดทริป<span class="orange">ในแบบคุณ</span></h2></div><p>เลือกเวลาและสไตล์ที่ชอบ<br>ระบบจัดให้ แล้วค่อยเลือกร้านที่ถูกใจ</p></div>
    <div class="planner-grid">
      <form ref="formPanel" class="planner-controls" @submit.prevent="generatePlan">
        <fieldset class="planner-fieldset"><legend class="planner-label"><CalendarDays :size="18" /><span>มีเวลาเท่าไหร่?</span></legend>
          <div class="duration-options"><button type="button" :class="{ selected: duration === 'half' }" :aria-pressed="duration === 'half'" @click="duration = 'half'"><Sun :size="20" /><strong>ครึ่งวัน</strong><span>ไม่เกิน 3 ชั่วโมง</span></button><button type="button" :class="{ selected: duration === 'full' }" :aria-pressed="duration === 'full'" @click="duration = 'full'"><Sun :size="20" /><strong>เต็มวัน</strong><span>ไม่เกิน 5 ชั่วโมงครึ่ง</span></button></div>
        </fieldset>
        <fieldset class="planner-fieldset"><legend class="planner-label"><Sparkles :size="18" /><span>อยากเน้นอะไร?</span></legend>
          <div class="interest-options"><button v-for="(label, key) in interestLabels" :key="key" type="button" :class="{ selected: interest === key }" :aria-pressed="interest === key" @click="interest = key"><Coffee v-if="key === 'chill'" :size="20" /><Palette v-else-if="key === 'art'" :size="20" /><Ticket v-else :size="20" /><span>{{ label }}</span><Check v-if="interest === key" :size="14" class="interest-check" /></button></div>
        </fieldset>
        <details class="planner-extra"><summary><span>เวลาเริ่มและงบ</span><span class="planner-extra-value">{{ startTime }} น. · ฿{{ budget }}</span><ChevronDown :size="16" /></summary>
          <div class="auto-plan-fields"><label>เริ่มเที่ยว<select v-model="startTime"><option v-for="time in startTimes" :key="time" :value="time">{{ time }} น.</option></select></label><label>งบเผื่อต่อคน<select v-model.number="budget"><option v-for="amount in planBudgets" :key="amount" :value="amount">{{ amount }} บาท</option></select></label></div>
        </details>
        <button type="submit" class="button button-primary auto-generate"><Sparkles :size="18" />{{ generated ? (dirty ? 'อัปเดตทริป' : 'ดูทริปของฉัน') : 'จัดทริปให้ฉัน' }}</button>
        <p class="auto-plan-help">งบเป็นเงินเผื่อ ไม่ใช่ราคายืนยันจากร้าน<br>ไม่รวมค่าเดินทางและของฝาก</p>
      </form>
      <div v-if="!generated" class="planner-empty"><Sparkles :size="32" aria-hidden="true" /><h3>วันว่างของคุณ เริ่มตรงนี้</h3><p>เลือกเงื่อนไขแล้วกด “จัดทริปให้ฉัน”<br>ได้ร้าน เวลาแวะ และงบที่แบ่งไว้ในครั้งเดียว</p><span>เปลี่ยนร้าน บันทึก และแชร์ได้หลังจัดทริป</span></div>
      <div v-else ref="resultPanel" class="itinerary" tabindex="-1" role="region" aria-label="ทริปที่จัดให้">
        <div class="itinerary-heading"><div><h3>ทริปของคุณ</h3><p class="auto-plan-summary">{{ formatPlanTime(plan.start) }}–{{ formatPlanTime(plan.end) }} น. · งบเผื่อ ฿{{ plan.allocatedBudget }}</p></div><button type="button" class="edit-plan-button" @click="editOptions">ปรับเงื่อนไข</button></div>
        <div v-if="dirty" class="auto-plan-dirty" role="status">เงื่อนไขเปลี่ยนแล้ว กดอัปเดตทริปเพื่อใช้เงื่อนไขใหม่<button type="button" @click="editOptions">กลับไปอัปเดต</button></div>
        <div class="itinerary-list" aria-live="polite" aria-label="รายการในทริป">
          <div v-for="stop in itinerary" :key="stop.id" class="itinerary-stop"><time>{{ formatPlanTime(stop.start) }}</time><span class="timeline-node"><component :is="icons[stop.kind]" :size="16" /></span><div>
            <div class="auto-stop-heading"><div><NuxtLink v-if="stop.detail" :to="stop.detail">{{ stop.title }}</NuxtLink><strong v-else class="auto-stop-title">{{ stop.title }}</strong></div><img v-if="stop.shop" :src="asset(stop.shop.image)" :alt="`ภาพของ ${stop.title}`" :title="`ภาพ: ${stop.shop.photoCredit}`" loading="lazy" decoding="async" width="80" height="64" /></div>
            <p>{{ stop.description }}</p><div class="auto-stop-meta"><span>{{ stop.minutes }} นาที</span><span v-if="stop.allowance">แบ่งงบ ฿{{ stop.allowance }}</span><span v-else>เดินเล่นตามอัธยาศัย</span></div>
            <div class="auto-stop-actions"><a :href="mapsUrl(stop.mapQuery)" target="_blank" rel="noopener noreferrer" :aria-label="`เปิดแผนที่ ${stop.title}`"><MapPin :size="14" />แผนที่</a><button v-if="stop.shopId" type="button" :disabled="dirty" :aria-label="`เลือกร้านแทน ${stop.title}`" @click="openShopChooser(stop.id)">เปลี่ยนร้าน<ChevronDown :size="14" /></button></div>
          </div></div>
        </div>
        <div class="itinerary-footer"><ul v-if="plan.notes.length" class="auto-plan-notes"><li v-for="note in plan.notes" :key="note">{{ note }}</li></ul><p><Clock3 :size="14" />เผื่อเดินระหว่างจุดประมาณ 10 นาที</p><p class="auto-plan-disclaimer">เวลาเป็นคำแนะนำ กรุณาเช็กเวลาเปิดและราคากับร้านก่อนเดินทาง</p><div class="plan-buttons"><button class="button button-primary" :disabled="dirty" @click="savePlan"><Bookmark :size="17" />บันทึกทริปนี้</button><button class="button button-outline" :disabled="dirty" @click="sharePlan"><Share2 :size="17" />แชร์ให้เพื่อน</button></div><label v-if="shareLink" class="auto-share-fallback">ลิงก์ทริปสำหรับคัดลอก<input :value="shareLink" readonly aria-label="ลิงก์ทริปสำหรับคัดลอก" @focus="($event.target as HTMLInputElement).select()" /></label></div>
      </div>
    </div>
    <dialog ref="shopChooser" class="shop-choice-dialog" aria-labelledby="shop-choice-title" @click="($event.target === shopChooser) && shopChooser?.close()" @close="choosingSlot = ''"><div v-if="choosingStop" class="shop-choice-content">
      <header class="shop-choice-header"><div><h3 id="shop-choice-title">เลือกร้านด้วยตัวเอง</h3><p>แทน {{ choosingStop.title }}</p></div><button class="icon-button" aria-label="ปิดรายการร้าน" @click="shopChooser?.close()"><X /></button></header>
      <p class="shop-choice-help">เลือกจากร้านประเภทเดียวกันที่ยังไม่อยู่ในจุดอื่นของทริป เวลาและงบที่แบ่งไว้จะคงเดิม</p>
      <ul class="shop-choice-list"><li v-for="shop in shopChoices" :key="shop.id"><button class="shop-choice" :class="{ selected: shop.id === choosingStop.shopId }" :aria-pressed="shop.id === choosingStop.shopId" @click="chooseShop(shop.id)"><img :src="asset(shop.image)" :alt="`ภาพของ ${shop.name}`" loading="lazy" decoding="async" width="160" height="128" /><span class="shop-choice-copy"><strong>{{ shop.name }}</strong><span>{{ shop.summary }}</span><small>ภาพ: {{ shop.photoCredit }}</small></span><Check v-if="shop.id === choosingStop.shopId" :size="19" aria-hidden="true" /></button></li></ul>
    </div></dialog>
    <Transition name="toast"><div v-if="notice" class="toast-message" role="status"><Check :size="19" />{{ notice }}</div></Transition>
    <dialog ref="dialog" class="saved-dialog" aria-label="ทริปที่บันทึก" @click="($event.target === dialog) && dialog?.close()"><div class="dialog-inner"><button class="icon-button dialog-close" aria-label="ปิดหน้าต่าง" @click="dialog?.close()"><X /></button><Bookmark :size="32" /><h2>ทริปที่บันทึก</h2><template v-if="savedPlan"><p>เก็บทั้งร้านและเวลาที่เลือกไว้แล้ว</p><div class="saved-summary"><CalendarDays :size="22" /><div><strong>{{ savedPlan.options.duration === 'half' ? 'ครึ่งวันที่บางหลวง' : 'หนึ่งวันที่บางหลวง' }}</strong><p>{{ interestLabels[savedPlan.options.interest] }}</p><p>เริ่ม {{ savedPlan.options.startTime }} น. · งบ ฿{{ savedPlan.options.budget }}</p></div></div><button class="button button-primary" @click="loadSaved">เปิดทริปที่บันทึก</button><button class="delete-plan" @click="removeSaved">ลบทริปนี้</button></template><template v-else><p>ยังไม่มีทริปที่บันทึกไว้<br>เริ่มจัดทริป แล้วบันทึกร้านที่ถูกใจได้เลย</p><button class="button button-primary" @click="loadSaved">เริ่มจัดทริป</button></template><small>บันทึกเฉพาะเบราว์เซอร์และเครื่องที่คุณใช้อยู่</small></div></dialog>
  </div></section>
</template>
