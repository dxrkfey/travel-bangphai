<script setup lang="ts">
import { Bookmark, CalendarDays, Check, Clock3, Coffee, Footprints, Heart, MapPin, Palette, RefreshCw, Share2, Sparkles, Sun, Ticket, X } from '@lucide/vue'
import { shops } from '~/data/shops'
import { mapsUrl } from '~/data/places'
import { buildTripPlan, createPlanState, defaultPlanOptions, formatPlanTime, parsePlanState, planBudgets, startTimes, swapTripShop, type PlanDuration, type PlanInterest, type PlanState } from '~/utils/planner'

const emit = defineEmits<{ savedChange: [saved: boolean] }>()
const duration = ref<PlanDuration>(defaultPlanOptions.duration)
const interest = ref<PlanInterest>(defaultPlanOptions.interest)
const startTime = ref(defaultPlanOptions.startTime)
const budget = ref(defaultPlanOptions.budget)
const options = computed(() => ({ duration: duration.value, interest: interest.value, startTime: startTime.value, budget: budget.value }))
const state = ref<PlanState>(createPlanState(options.value))
const plan = computed(() => buildTripPlan(state.value, shops))
const dirty = computed(() => JSON.stringify(options.value) !== JSON.stringify(state.value.options))
const generated = ref(false)
const savedPlan = ref<PlanState | null>(null)
const dialog = ref<HTMLDialogElement | null>(null)
const notice = ref('')
const shareLink = ref('')
const storageKey = 'bangluang-plan-v2'
const legacyKey = 'bangluang-plan-v1'
const icons = { walk: Footprints, food: Ticket, cafe: Coffee, workshop: Palette, snack: Ticket }
const interestLabels = { chill: 'เดินเล่น & คาเฟ่', art: 'ศิลปะ & งานคราฟต์', food: 'กินอร่อยหลายร้าน' }
let timer: ReturnType<typeof setTimeout> | undefined

function toast(message: string) { notice.value = message; clearTimeout(timer); timer = setTimeout(() => notice.value = '', 4500) }
function applyState(next: PlanState) {
  duration.value = next.options.duration; interest.value = next.options.interest
  startTime.value = next.options.startTime; budget.value = next.options.budget
  state.value = next; generated.value = true; shareLink.value = ''
}
function generatePlan() {
  state.value = createPlanState(options.value, (state.value.seed + 1) >>> 0)
  generated.value = true; shareLink.value = ''
  toast('จัดแพลนให้แล้ว เปลี่ยนร้านแต่ละจุดได้เลย')
}
function changeShop(slotId: string) {
  state.value = swapTripShop(state.value, slotId, shops)
  shareLink.value = ''
  toast('เปลี่ยนร้านแล้ว เวลาและงบที่แบ่งไว้ยังเท่าเดิม')
}
function savePlan() {
  if (dirty.value) return
  try { localStorage.setItem(storageKey, JSON.stringify(state.value)); savedPlan.value = JSON.parse(JSON.stringify(state.value)); toast('บันทึกทั้งเวลาและร้านในแพลนนี้แล้ว') }
  catch { toast('บันทึกไม่ได้ ลองใช้ปุ่มแชร์แพลนแทนได้ค่ะ') }
}
function openSaved() { dialog.value?.showModal() }
function loadSaved() {
  if (savedPlan.value) applyState(savedPlan.value)
  dialog.value?.close()
  document.querySelector('#planner')?.scrollIntoView({ behavior: 'smooth' })
}
function removeSaved() {
  try { localStorage.removeItem(storageKey); localStorage.removeItem(legacyKey); savedPlan.value = null; toast('ลบแพลนที่บันทึกแล้ว') }
  catch { toast('ไม่สามารถลบแพลนได้ในขณะนี้') }
}
async function sharePlan() {
  if (dirty.value) return
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
    <div class="section-heading"><div><p class="eyebrow">A DAY PLANNED FOR YOU</p><h2>ให้เราจัดแพลน<span class="orange">ให้คุณ</span></h2></div><p>เลือกเงื่อนไขที่ชอบ แล้วกดจัดแพลน<br>ระบบเลือกร้านและเรียงเวลาให้จากรายชื่อในเว็บ</p></div>
    <div class="planner-grid">
      <div class="planner-controls">
        <div class="planner-label"><CalendarDays :size="19" /><h3>วันนี้มีเวลาเท่าไหร่?</h3></div>
        <div class="duration-options"><button :class="{ selected: duration === 'half' }" :aria-pressed="duration === 'half'" @click="duration = 'half'"><Sun :size="22" /><strong>ครึ่งวัน</strong><span>ไม่เกิน 3 ชั่วโมง</span></button><button :class="{ selected: duration === 'full' }" :aria-pressed="duration === 'full'" @click="duration = 'full'"><Sun :size="22" /><strong>เต็มวันชิล ๆ</strong><span>ไม่เกิน 5 ชั่วโมงครึ่ง</span></button></div>
        <div class="planner-label second-label"><Heart :size="19" /><h3>ชอบวันว่างแบบไหน?</h3></div>
        <div class="interest-options"><button v-for="(label, key) in interestLabels" :key="key" :class="{ selected: interest === key }" :aria-pressed="interest === key" @click="interest = key"><Coffee v-if="key === 'chill'" :size="18" /><Palette v-else-if="key === 'art'" :size="18" /><Ticket v-else :size="18" />{{ label }}<Check v-if="interest === key" :size="17" /></button></div>
        <div class="auto-plan-fields"><label>เริ่มเที่ยว<select v-model="startTime"><option v-for="time in startTimes" :key="time" :value="time">{{ time }} น.</option></select></label><label>งบเผื่อต่อคน<select v-model.number="budget"><option v-for="amount in planBudgets" :key="amount" :value="amount">{{ amount }} บาท</option></select></label></div>
        <button class="button button-primary auto-generate" @click="generatePlan"><Sparkles :size="19" />{{ generated ? 'จัดแพลนใหม่ให้ฉัน' : 'จัดแพลนให้อัตโนมัติ' }}</button>
        <p class="auto-plan-help">ระบบแบ่งงบให้แต่ละกิจกรรม ไม่ใช่ราคาจากร้าน<br>ไม่รวมค่าเดินทางและของฝาก</p>
      </div>
      <div class="itinerary">
        <div class="itinerary-heading"><div><span class="itinerary-eyebrow">{{ generated ? 'YOUR PERSONAL DAY PLAN' : 'A LITTLE INSPIRATION' }}</span><h3>{{ generated ? 'แพลนที่ระบบจัดให้' : 'ลองดูแพลนเริ่มต้น' }}</h3><p class="auto-plan-summary">{{ formatPlanTime(plan.start) }}–{{ formatPlanTime(plan.end) }} น. · {{ plan.totalMinutes }} นาที · แบ่งงบ ฿{{ plan.allocatedBudget }}</p></div><span class="stop-count">{{ plan.stops.length }} จุดแวะ</span></div>
        <p v-if="dirty" class="auto-plan-dirty" role="status">เปลี่ยนเงื่อนไขแล้ว กด “จัดแพลนให้อัตโนมัติ” หรือ “จัดแพลนใหม่ให้ฉัน” เพื่ออัปเดตผลลัพธ์</p>
        <div class="itinerary-list" aria-live="polite" aria-label="แพลนที่ระบบจัดให้">
          <div v-for="stop in plan.stops" :key="stop.id" class="itinerary-stop"><time>{{ formatPlanTime(stop.start) }}</time><span class="timeline-node"><component :is="icons[stop.kind]" :size="17" /></span><div><NuxtLink v-if="stop.detail" :to="stop.detail">{{ stop.title }}</NuxtLink><strong v-else class="auto-stop-title">{{ stop.title }}</strong><p>{{ stop.description }}</p><div class="auto-stop-meta"><span>{{ stop.minutes }} นาที</span><span v-if="stop.allowance">แบ่งงบ ฿{{ stop.allowance }}</span><span v-else>เดินเล่นตามอัธยาศัย</span></div><div class="auto-stop-actions"><a :href="mapsUrl(stop.mapQuery)" target="_blank" rel="noopener noreferrer" :aria-label="`เปิดแผนที่ ${stop.title}`"><MapPin :size="14" />แผนที่</a><button v-if="stop.shopId" :disabled="dirty" :aria-label="`เปลี่ยนร้าน ${stop.title}`" @click="changeShop(stop.id)"><RefreshCw :size="14" />เปลี่ยนร้าน</button></div></div></div>
        </div>
        <div class="itinerary-footer"><ul v-if="plan.notes.length" class="auto-plan-notes"><li v-for="note in plan.notes" :key="note">{{ note }}</li></ul><p><Clock3 :size="14" />เผื่อเดินระหว่างจุดประมาณ 10 นาที</p><p class="auto-plan-disclaimer">เวลาเป็นกำหนดการแนะนำ ยังไม่ได้ตรวจเวลาเปิดร้านแบบเรียลไทม์ กรุณาเช็กกับร้านก่อนเดินทาง</p><div class="plan-buttons"><button class="button button-primary" :disabled="dirty" @click="savePlan"><Bookmark :size="17" />บันทึกแพลนนี้</button><button class="button button-outline" :disabled="dirty" @click="sharePlan"><Share2 :size="17" />แชร์ให้เพื่อน</button></div><label v-if="shareLink" class="auto-share-fallback">ลิงก์แพลนสำหรับคัดลอก<input :value="shareLink" readonly aria-label="ลิงก์แพลนสำหรับคัดลอก" @focus="($event.target as HTMLInputElement).select()" /></label></div>
      </div>
    </div>
    <Transition name="toast"><div v-if="notice" class="toast-message" role="status"><Check :size="19" />{{ notice }}</div></Transition>
    <dialog ref="dialog" class="saved-dialog" aria-label="แพลนที่บันทึก" @click="($event.target === dialog) && dialog?.close()"><div class="dialog-inner"><button class="icon-button dialog-close" aria-label="ปิดหน้าต่าง" @click="dialog?.close()"><X /></button><Bookmark :size="32" /><p class="eyebrow">YOUR LITTLE ESCAPE</p><h2>แพลนของฉัน</h2><template v-if="savedPlan"><p>เก็บทั้งร้านและเวลาที่เลือกไว้แล้ว</p><div class="saved-summary"><CalendarDays :size="22" /><div><strong>{{ savedPlan.options.duration === 'half' ? 'ครึ่งวันที่บางหลวง' : 'หนึ่งวันที่บางหลวง' }}</strong><p>{{ interestLabels[savedPlan.options.interest] }}</p><p>เริ่ม {{ savedPlan.options.startTime }} น. · งบ ฿{{ savedPlan.options.budget }}</p></div></div><button class="button button-primary" @click="loadSaved">เปิดแพลนที่บันทึก</button><button class="delete-plan" @click="removeSaved">ลบแพลนนี้</button></template><template v-else><p>ยังไม่มีแพลนที่บันทึกไว้<br>เลือกเวลาที่มีแล้วให้ระบบจัดวันว่างของคุณ</p><button class="button button-primary" @click="loadSaved">เริ่มจัดแพลนเที่ยว</button></template><small>บันทึกเฉพาะเบราว์เซอร์และเครื่องที่คุณใช้อยู่</small></div></dialog>
  </div></section>
</template>
