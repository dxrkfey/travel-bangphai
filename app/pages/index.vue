<script setup lang="ts">
import { MapPin, Clock3, TrainFront, Coffee, Palette, Footprints, Bookmark, Check, X, Share2, Leaf, ChevronDown, Navigation, Sun, Heart, Ticket, CalendarDays, Sparkles } from '@lucide/vue'
import { places, mapsUrl } from '~/data/places'
const { asset, absoluteAsset } = useSiteUrls()

type Duration = 'half' | 'full'
type Interest = 'chill' | 'art'
interface SavedPlan { duration: Duration; interest: Interest }
const nearbyPlaces = places.filter(place => place.slug === 'artist-house' || place.slug === 'canal-walk')
const duration = ref<Duration>('full')
const interest = ref<Interest>('chill')
const savedPlan = ref<SavedPlan | null>(null)
const dialog = ref<HTMLDialogElement | null>(null)
const notice = ref('')
let noticeTimer: ReturnType<typeof setTimeout> | undefined
const stopData = {
  walk: { title: 'ทักทายชุมชนริมคลอง', description: 'เดินเลียบบ้านไม้ แวะถ่ายรูป และค่อย ๆ ทำความรู้จักบางหลวง', icon: Footprints, slug: 'canal-walk' },
  house: { title: 'แวะบ้านศิลปิน', description: 'ดูงานศิลปะ เลือกโปสการ์ด แล้วหามุมโปรดในบ้านไม้เก่า', icon: Palette, slug: 'artist-house' },
  lunch: { title: 'พักมื้อกลางวันที่ครัวคุณอ๋อย', description: 'แวะกินอาหารไทยในย่านคลองบางหลวง ตรวจสอบเวลาเปิดและราคากับร้าน', icon: Ticket, slug: 'khun-aoi-kitchen' },
  craft: { title: 'ให้มือได้ทำ ให้ใจได้พัก', description: 'เลือกร้อยลูกปัดหรือวาดภาพที่บ้านศิลปิน สอบถามราคาก่อนเริ่ม', icon: Sparkles, slug: 'bead-workshop' },
  cafe: { title: 'จิบกาแฟ มองเรือผ่าน', description: 'พักกับเครื่องดื่มสักแก้วที่คาเฟ่บ้านศิลปิน ก่อนเดินทางกลับ', icon: Coffee, slug: 'canal-cafe' }
}
const itinerary = computed(() => {
  const keys = duration.value === 'full' ? ['walk', 'house', 'lunch', 'craft', 'cafe'] : interest.value === 'art' ? ['house', 'craft', 'cafe'] : ['walk', 'house', 'cafe']
  const times = duration.value === 'full' ? ['10:00', '10:45', '12:00', '13:00', '14:30'] : interest.value === 'art' ? ['10:00', '10:45', '12:15'] : ['10:00', '10:45', '12:00']
  return keys.map((key, i) => ({ ...stopData[key as keyof typeof stopData], time: times[i] }))
})
const estimate = computed(() => duration.value === 'full' || interest.value === 'art' ? '400–700' : '200–400')
function toast(message: string) { notice.value = message; clearTimeout(noticeTimer); noticeTimer = setTimeout(() => notice.value = '', 4000) }
function savePlan() {
  try { localStorage.setItem('bangluang-plan-v1', JSON.stringify({ duration: duration.value, interest: interest.value })); savedPlan.value = { duration: duration.value, interest: interest.value }; toast('บันทึกแพลนไว้ในเครื่องนี้แล้ว') }
  catch { toast('บันทึกไม่ได้ ลองใช้ปุ่มแชร์แพลนแทนได้ค่ะ') }
}
function showSaved() { dialog.value?.showModal() }
function loadPlan() {
  if (savedPlan.value) { duration.value = savedPlan.value.duration; interest.value = savedPlan.value.interest }
  dialog.value?.close()
  document.querySelector('#planner')?.scrollIntoView({ behavior: 'smooth' })
}
function removePlan() {
  try { localStorage.removeItem('bangluang-plan-v1'); savedPlan.value = null; toast('ลบแพลนที่บันทึกแล้ว') }
  catch { toast('ไม่สามารถลบแพลนได้ในขณะนี้') }
}
async function sharePlan() {
  const url = new URL(window.location.href)
  url.searchParams.set('duration', duration.value); url.searchParams.set('interest', interest.value); url.hash = 'planner'
  try { await navigator.clipboard.writeText(url.toString()); toast('คัดลอกลิงก์แพลนแล้ว ส่งให้เพื่อนได้เลย') }
  catch { toast('คัดลอกอัตโนมัติไม่ได้ ลิงก์แพลนแสดงในช่องที่อยู่แล้ว'); history.replaceState({}, '', url) }
}
onMounted(() => {
  try { const raw = localStorage.getItem('bangluang-plan-v1'); if (raw) { const p = JSON.parse(raw); if (['half', 'full'].includes(p.duration) && ['chill', 'art'].includes(p.interest)) savedPlan.value = p } } catch { /* Storage is optional. */ }
  const params = new URLSearchParams(location.search)
  if (['half', 'full'].includes(params.get('duration') || '')) duration.value = params.get('duration') as Duration
  if (['chill', 'art'].includes(params.get('interest') || '')) interest.value = params.get('interest') as Interest
})
onUnmounted(() => clearTimeout(noticeTimer))
useSeoMeta({ ogTitle: 'บางหลวง วันว่าง | วันดี ๆ ไม่ต้องไปไกล', ogDescription: 'เดินเล่น ทำงานคราฟต์ จิบกาแฟ เลือกแพลนคลองบางหลวงในแบบของคุณ', ogImage: absoluteAsset('/images/canal.jpg'), twitterCard: 'summary_large_image' })
</script>

<template>
  <div class="mobile-trip-page">
    <a href="#main" class="skip-link">ข้ามไปเนื้อหา</a>
    <SiteHeader :saved="!!savedPlan" @show-saved="showSaved" />
    <main id="main">
      <section id="discover" class="hero shell">
        <div class="hero-copy">
          <div class="eyebrow"><span class="short-line"></span> A LITTLE ESCAPE IN BANGKOK</div>
          <h1>วันดี ๆ<br>ไม่ต้อง<span class="serif-accent">ไปไกล</span><span class="hero-sun">✳</span></h1>
          <p class="hero-location"><MapPin :size="19" /> คลองบางหลวง · กรุงเทพฯ</p>
          <p class="hero-description">ชวนมาพักใจในชุมชนเล็ก ๆ ริมคลอง<br>เดินเล่น ทำงานคราฟต์ จิบกาแฟ<br>แล้วปล่อยให้วันว่าง… เดินช้าลงหน่อย</p>
          <div class="hero-buttons"><a class="button button-primary" href="#planner"><CalendarDays :size="18" />จัดวันว่างของฉัน</a><a href="#places" class="text-link">มีอะไรให้แวะบ้าง</a></div>
          <div class="hero-note"><Leaf :size="15" /> เที่ยวง่ายด้วย MRT · ใช้เวลาแค่ครึ่งวันก็ได้</div>
        </div>
        <div class="hero-visual">
          <img class="hero-photo" :src="asset('/images/canal.jpg')" alt="ผู้คนนั่งชมวิวคลองบางหลวงจากบ้านศิลปิน มีเรือผ่านหน้าบ้านไม้ริมคลอง" width="1200" height="1000" fetchpriority="high" />
          <div class="photo-caption"><span>ชีวิตช้า ๆ ริมคลอง</span><span>KHLONG BANG LUANG</span></div>
          <div class="photo-sticker"><Heart :size="23" :stroke-width="1.4" /><span>พักใจ<br>ใกล้บ้าน</span></div>
          <div class="photo-location"><MapPin :size="16" /> มุมโปรดที่บ้านศิลปิน</div>
        </div>
      </section>

      <section class="intro-strip"><div class="shell strip-inner"><p>ไม่ต้องลางาน ไม่ต้องจัดกระเป๋า<br><strong>แค่พาตัวเองออกมาเจออะไรน่ารัก ๆ</strong></p><div><TrainFront /><span><strong>MRT บางไผ่</strong><small>สายสีน้ำเงิน · ทางออก 4</small></span></div><div><Clock3 /><span><strong>ครึ่งวันก็เที่ยวได้</strong><small>เลือกจังหวะที่พอดีกับเรา</small></span></div><div><Palette /><span><strong>ศิลปะ & วิถีริมคลอง</strong><small>ของธรรมดาที่ทำให้วันพิเศษ</small></span></div></div></section>

      <section id="places" class="section shell">
        <div class="section-heading"><div><p class="eyebrow">LITTLE PLACES, LOVELY MOMENTS</p><h2>รายชื่อร้าน<span class="orange">ทั้งหมด</span></h2></div><p>เลือกโซนที่ชอบ หรือค้นหาชื่อร้าน<br>แล้วปักหมุดวันว่างของคุณ</p></div>
        <ShopDirectory />
        <aside class="between-zones"><p><Footprints :size="18" /> เดินเล่นระหว่างโซน</p><div><NuxtLink v-for="place in nearbyPlaces" :key="place.slug" :to="`/places/${place.slug}`"><MapPin :size="16" />{{ place.title }}</NuxtLink></div></aside>
      </section>

      <section id="planner" class="planner-section"><div class="shell">
        <div class="section-heading"><div><p class="eyebrow">YOUR DAY, YOUR OWN PACE</p><h2>ออกแบบวันว่าง<span class="orange">ของคุณ</span></h2></div><p>เลือกเวลาที่มี กับสิ่งที่ชอบ<br>ที่เหลือ… เราช่วยเรียงให้</p></div>
        <div class="planner-grid">
          <div class="planner-controls"><div class="planner-label"><CalendarDays :size="19" /><h3>วันนี้มีเวลาเท่าไหร่?</h3></div><div class="duration-options"><button :class="{ selected: duration === 'half' }" :aria-pressed="duration === 'half'" @click="duration = 'half'"><Sun :size="23" /><strong>ครึ่งวัน</strong><span>ประมาณ 3 ชั่วโมง</span></button><button :class="{ selected: duration === 'full' }" :aria-pressed="duration === 'full'" @click="duration = 'full'"><Sun :size="23" /><strong>เต็มวันชิล ๆ</strong><span>ประมาณ 5–6 ชั่วโมง</span></button></div>
            <div class="planner-label second-label"><Heart :size="19" /><h3>ชอบวันว่างแบบไหน?</h3></div><div class="interest-options"><button :class="{ selected: interest === 'chill' }" :aria-pressed="interest === 'chill'" @click="interest = 'chill'"><Coffee :size="18" /> เดินเล่น & คาเฟ่ <Check v-if="interest === 'chill'" :size="17" /></button><button :class="{ selected: interest === 'art' }" :aria-pressed="interest === 'art'" @click="interest = 'art'"><Palette :size="18" /> ศิลปะ & งานคราฟต์ <Check v-if="interest === 'art'" :size="17" /></button></div>
            <div class="budget-note"><span>งบเผื่อไว้ต่อคน</span><strong>฿{{ estimate }}</strong><p>งบประมาณแนะนำสำหรับอาหาร เครื่องดื่ม และกิจกรรม<br>ไม่รวมค่าเดินทาง · ราคาจริงขึ้นอยู่กับร้านและกิจกรรมที่เลือก</p></div>
            <div class="tiny-tip"><Leaf :size="19" /><p>{{ interest === 'art' ? 'เต็มวันมีเวลาสำหรับงานคราฟต์อยู่แล้ว ถ้ามีแค่ครึ่งวัน เราจะจัดเวลาให้ทำงานศิลปะได้เต็มที่' : 'แพลนเป็นไอเดียตั้งต้น สลับเวลา หรือแวะร้านที่ถูกใจระหว่างทางได้เลย' }}</p></div>
          </div>
          <div class="itinerary"><div class="itinerary-heading"><div><span class="itinerary-eyebrow">A DAY WELL SPENT</span><h3>{{ duration === 'half' ? 'ครึ่งวันเล็ก ๆ ความสุขพอดี' : 'หนึ่งวันช้า ๆ ที่บางหลวง' }}</h3></div><span class="stop-count">{{ itinerary.length }} จุดแวะ</span></div><div class="itinerary-list" aria-live="polite"><div v-for="(stop, i) in itinerary" :key="stop.title" class="itinerary-stop"><time>{{ stop.time }}</time><span class="timeline-node"><component :is="stop.icon" :size="17" /></span><div><NuxtLink :to="`/places/${stop.slug}`">{{ stop.title }}</NuxtLink><p>{{ stop.description }}</p></div></div></div><div class="itinerary-footer"><p><Clock3 :size="14" /> เวลาแนะนำ ปรับได้ตามจังหวะของคุณ</p><div class="plan-buttons"><button class="button button-primary" @click="savePlan"><Bookmark :size="17" />บันทึกแพลนนี้</button><button class="button button-outline" @click="sharePlan"><Share2 :size="17" />แชร์ให้เพื่อน</button></div></div></div>
        </div>
      </div></section>

      <section id="getting-here" class="section shell travel-grid"><div class="travel-copy"><p class="eyebrow">CLOSER THAN YOU THINK</p><h2>เริ่มต้นที่บางไผ่<br>ไปต่อที่<span class="orange">บางหลวง</span></h2><p>ไม่ต้องมีรถ ก็มีวันดี ๆ ริมคลองได้<br>ปักหมุดบ้านศิลปิน แล้วค่อย ๆ เดินเข้าชุมชนกัน</p><a :href="mapsUrl('บ้านศิลปิน คลองบางหลวง')" class="button button-primary" target="_blank" rel="noopener noreferrer"><Navigation :size="17" />เปิดเส้นทางใน Google Maps</a><a class="source-link" href="https://www.artisthousebangkok.com/th/locations-contect" target="_blank" rel="noopener noreferrer">ข้อมูลการเดินทางจากบ้านศิลปิน</a></div><div class="travel-details"><div class="transport-line"><span class="transport-icon"><TrainFront :size="23" /></span><div><h3>MRT สายสีน้ำเงิน</h3><p>ลงสถานีบางไผ่ (BL33) ทางออก 4<br>เข้าซอยเพชรเกษม 20 เดินประมาณ 900 เมตร<br>หรือใช้มอเตอร์ไซค์รับจ้างแล้วเดินต่อเข้าริมคลอง</p></div><span class="mrt-pill">BL33</span></div><div class="travel-facts"><div><Clock3 :size="20" /><h3>ช่วงเวลาน่าแวะ</h3><p>บ้านศิลปินเปิด 10.00–18.00 น.<br>เริ่มช่วงสาย มีเวลาเดินและทำกิจกรรม</p></div><div><Footprints :size="20" /><h3>เดินสบาย เตรียมไว้หน่อย</h3><p>รองเท้าเดินสะดวก ร่ม และน้ำดื่ม<br>เผื่อเงินสดสำหรับร้านเล็ก ๆ ในชุมชน</p></div></div><div class="travel-callout"><Heart :size="18" /><p>ที่นี่เป็นบ้านของคนในชุมชนด้วยนะ<br>ช่วยกันเดินเบา ๆ พูดพอดี ๆ และขออนุญาตก่อนถ่ายภาพคน</p></div></div></section>

      <section class="faq-section"><div class="shell faq-grid"><div><p class="eyebrow">A FEW THINGS TO KNOW</p><h2>ก่อนออกไป<span class="orange">วันว่าง</span></h2><p>เตรียมตัวนิดเดียว แล้วไปได้เลย</p></div><div class="faq-list"><details><summary>แพลนนี้ต้องจองก่อนหรือเปล่า?<ChevronDown :size="19" /></summary><p>นี่เป็นแพลนเดินเที่ยวด้วยตัวเอง ไม่มีบริการจองผ่านเว็บ สำหรับกิจกรรมคราฟต์ให้สอบถามราคาและที่นั่งกับบ้านศิลปิน โดยเฉพาะเมื่อไปเป็นกลุ่ม</p></details><details><summary>มีการแสดงหุ่นละครเล็กทุกวันไหม?<ChevronDown :size="19" /></summary><p>เว็บไซต์บ้านศิลปินระบุว่าปัจจุบันมีเฉพาะแบบกลุ่มส่วนตัว ต้องจองล่วงหน้า 2 สัปดาห์ โปรดติดต่อบ้านศิลปินที่ 065 691 5655 เพื่อยืนยันรายละเอียดล่าสุด</p></details><details><summary>งบที่แนะนำเป็นราคาจริงของร้านไหม?<ChevronDown :size="19" /></summary><p>เป็นงบเผื่อสำหรับวางแผนเท่านั้น ไม่ใช่ราคาของร้านหรือแพ็กเกจทัวร์ ควรตรวจสอบราคาอาหาร เครื่องดื่ม และกิจกรรมกับร้านก่อนเลือกซื้อ</p></details><details><summary>ขับรถไปได้ไหม?<ChevronDown :size="19" /></summary><p>บ้านศิลปินแนะนำเข้าทางราชพฤกษ์ซอย 6 และจอดรถที่วัดคูหาสวรรค์ จากนั้นเดินต่อ บ้านอยู่ริมคลองและเข้าถึงช่วงสุดท้ายด้วยการเดินเท้า ควรตรวจสอบเส้นทางและที่จอดก่อนออกเดินทาง</p></details></div></div></section>
      <div class="closing shell"><Leaf :size="26" /><p>บางวัน ความสุขก็อยู่แค่<span>ริมคลอง</span></p><a href="#planner">หาวันว่าง แล้วไปกัน</a></div>
    </main>
    <footer class="site-footer"><div class="shell footer-main"><NuxtLink to="/" class="footer-brand">บางหลวง วันว่าง<span>A LITTLE ESCAPE, A LOVELY DAY.</span></NuxtLink><p>ไอเดียเที่ยวด้วยตัวเองในชุมชนคลองบางหลวง<br>ข้อมูลตรวจสอบ 20 พฤศจิกายน 2569 · เวลาและกิจกรรมอาจเปลี่ยนแปลง</p><a href="https://www.artisthousebangkok.com/th" target="_blank" rel="noopener noreferrer">ข้อมูลและภาพ: บ้านศิลปินคลองบางหลวง</a></div></footer>
    <MobileTripNav :saved="!!savedPlan" @show-saved="showSaved" />
    <Transition name="toast"><div v-if="notice" class="toast-message" role="status"><Check :size="19" />{{ notice }}</div></Transition>
    <dialog ref="dialog" class="saved-dialog" aria-label="แพลนที่บันทึก" @click="($event.target === dialog) && dialog?.close()"><div class="dialog-inner"><button class="icon-button dialog-close" aria-label="ปิดหน้าต่าง" @click="dialog?.close()"><X /></button><Bookmark :size="32" /><p class="eyebrow">YOUR LITTLE ESCAPE</p><h2>แพลนของฉัน</h2><template v-if="savedPlan"><p>เก็บวันว่างของคุณไว้แล้ว</p><div class="saved-summary"><CalendarDays :size="22" /><div><strong>{{ savedPlan.duration === 'half' ? 'ครึ่งวันที่บางหลวง' : 'หนึ่งวันช้า ๆ ที่บางหลวง' }}</strong><p>{{ savedPlan.interest === 'art' ? 'ศิลปะ & งานคราฟต์' : 'เดินเล่น & คาเฟ่' }}</p></div></div><button class="button button-primary" @click="loadPlan">เปิดแพลนที่บันทึก</button><button class="delete-plan" @click="removePlan">ลบแพลนนี้</button></template><template v-else><p>ยังไม่มีแพลนที่บันทึกไว้<br>เลือกเวลาที่มีและสไตล์ที่ชอบ แล้วสร้างวันว่างของคุณ</p><button class="button button-primary" @click="loadPlan">เริ่มจัดแพลนเที่ยว</button></template><small>บันทึกเฉพาะเบราว์เซอร์และเครื่องที่คุณใช้อยู่</small></div></dialog>
  </div>
</template>
