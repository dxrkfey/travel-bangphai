<script setup lang="ts">
import { Asterisk, MapPin, Clock3, TrainFront, Palette, Footprints, Leaf, ChevronDown, Navigation, Heart, CalendarDays } from '@lucide/vue'
import { places, mapsUrl } from '~/data/places'
const { asset, absoluteAsset } = useSiteUrls()
const nearbyPlaces = places.filter(place => place.slug === 'artist-house' || place.slug === 'canal-walk')
const hasSaved = ref(false)
const tripPlanner = ref<{ openSaved: () => void; addShop: (shopId: string) => void; selectedShopIds: string[] } | null>(null)
function showSaved() { tripPlanner.value?.openSaved() }
useSeoMeta({ ogTitle: 'บางหลวง วันว่าง | วันดี ๆ ไม่ต้องไปไกล', ogDescription: 'เลือกร้านและจัดทริปคลองบางหลวงด้วยตัวเอง เพิ่ม ลบ สลับลำดับ และปรับเวลาได้ตามใจ', ogImage: absoluteAsset('/images/canal.jpg'), twitterCard: 'summary_large_image' })
</script>

<template>
  <div class="mobile-trip-page">
    <a href="#main" class="skip-link">ข้ามไปเนื้อหา</a>
    <SiteHeader :saved="hasSaved" @show-saved="showSaved" />
    <main id="main">
      <section id="discover" class="hero shell">
        <div class="hero-copy">
          <div class="eyebrow"><span class="short-line"></span> A LITTLE ESCAPE IN BANGKOK</div>
          <h1>วันดี ๆ<br>ไม่ต้อง<span class="serif-accent">ไปไกล</span><Asterisk class="hero-sun" :size="36" :stroke-width="1.4" aria-hidden="true" focusable="false" /></h1>
          <p class="hero-location"><MapPin :size="19" /> คลองบางหลวง · กรุงเทพฯ</p>
          <p class="hero-description">ชวนมาพักใจในชุมชนเล็ก ๆ ริมคลอง<br>เดินเล่น ทำงานคราฟต์ จิบกาแฟ<br>แล้วปล่อยให้วันว่าง… เดินช้าลงหน่อย</p>
          <div class="hero-buttons"><a class="button button-primary" href="#planner"><CalendarDays :size="18" />จัดทริปของฉัน</a><a href="#places" class="text-link">ดูร้านทั้งหมด</a></div>
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

      <AutoTripPlanner ref="tripPlanner" @saved-change="hasSaved = $event" />

      <section id="places" class="section shell">
        <div class="section-heading"><div><p class="eyebrow">LITTLE PLACES, LOVELY MOMENTS</p><h2>รายชื่อร้าน<span class="orange">ทั้งหมด</span></h2></div><p>เลือกโซนที่ชอบ หรือค้นหาชื่อร้าน<br>แล้วปักหมุดวันว่างของคุณ</p></div>
        <ShopDirectory :selected-shop-ids="tripPlanner?.selectedShopIds || []" @add-shop="tripPlanner?.addShop($event)" />
        <aside class="between-zones"><p><Footprints :size="18" /> เดินเล่นระหว่างโซน</p><div><NuxtLink v-for="place in nearbyPlaces" :key="place.slug" :to="`/places/${place.slug}`"><MapPin :size="16" />{{ place.title }}</NuxtLink></div></aside>
      </section>

      <section id="getting-here" class="section shell travel-grid"><div class="travel-copy"><p class="eyebrow">CLOSER THAN YOU THINK</p><h2>เริ่มต้นที่บางไผ่<br>ไปต่อที่<span class="orange">บางหลวง</span></h2><p>ไม่ต้องมีรถ ก็มีวันดี ๆ ริมคลองได้<br>ปักหมุดบ้านศิลปิน แล้วค่อย ๆ เดินเข้าชุมชนกัน</p><a :href="mapsUrl('บ้านศิลปิน คลองบางหลวง')" class="button button-primary" target="_blank" rel="noopener noreferrer"><Navigation :size="17" />เปิดเส้นทางใน Google Maps</a><a class="source-link" href="https://www.artisthousebangkok.com/th/locations-contect" target="_blank" rel="noopener noreferrer">ข้อมูลการเดินทางจากบ้านศิลปิน</a></div><div class="travel-details"><div class="transport-line"><span class="transport-icon"><TrainFront :size="23" /></span><div><h3>MRT สายสีน้ำเงิน</h3><p>ลงสถานีบางไผ่ (BL33) ทางออก 4<br>เข้าซอยเพชรเกษม 20 เดินประมาณ 900 เมตร<br>หรือใช้มอเตอร์ไซค์รับจ้างแล้วเดินต่อเข้าริมคลอง</p></div><span class="mrt-pill">BL33</span></div><div class="travel-facts"><div><Clock3 :size="20" /><h3>ช่วงเวลาน่าแวะ</h3><p>บ้านศิลปินเปิด 10.00–18.00 น.<br>เริ่มช่วงสาย มีเวลาเดินและทำกิจกรรม</p></div><div><Footprints :size="20" /><h3>เดินสบาย เตรียมไว้หน่อย</h3><p>รองเท้าเดินสะดวก ร่ม และน้ำดื่ม<br>เผื่อเงินสดสำหรับร้านเล็ก ๆ ในชุมชน</p></div></div><div class="travel-callout"><Heart :size="18" /><p>ที่นี่เป็นบ้านของคนในชุมชนด้วยนะ<br>ช่วยกันเดินเบา ๆ พูดพอดี ๆ และขออนุญาตก่อนถ่ายภาพคน</p></div></div></section>

      <section class="faq-section"><div class="shell faq-grid"><div><p class="eyebrow">A FEW THINGS TO KNOW</p><h2>ก่อนออกไป<span class="orange">วันว่าง</span></h2><p>เตรียมตัวนิดเดียว แล้วไปได้เลย</p></div><div class="faq-list"><details><summary>แพลนนี้ต้องจองก่อนหรือเปล่า?<ChevronDown :size="19" /></summary><p>นี่เป็นแพลนเดินเที่ยวด้วยตัวเอง ไม่มีบริการจองผ่านเว็บ สำหรับกิจกรรมคราฟต์ให้สอบถามราคาและที่นั่งกับบ้านศิลปิน โดยเฉพาะเมื่อไปเป็นกลุ่ม</p></details><details><summary>มีการแสดงหุ่นละครเล็กทุกวันไหม?<ChevronDown :size="19" /></summary><p>เว็บไซต์บ้านศิลปินระบุว่าปัจจุบันมีเฉพาะแบบกลุ่มส่วนตัว ต้องจองล่วงหน้า 2 สัปดาห์ โปรดติดต่อบ้านศิลปินที่ 065 691 5655 เพื่อยืนยันรายละเอียดล่าสุด</p></details><details><summary>งบที่แนะนำเป็นราคาจริงของร้านไหม?<ChevronDown :size="19" /></summary><p>เป็นงบเผื่อสำหรับวางแผนเท่านั้น ไม่ใช่ราคาของร้านหรือแพ็กเกจทัวร์ ควรตรวจสอบราคาอาหาร เครื่องดื่ม และกิจกรรมกับร้านก่อนเลือกซื้อ</p></details><details><summary>ขับรถไปได้ไหม?<ChevronDown :size="19" /></summary><p>บ้านศิลปินแนะนำเข้าทางราชพฤกษ์ซอย 6 และจอดรถที่วัดคูหาสวรรค์ จากนั้นเดินต่อ บ้านอยู่ริมคลองและเข้าถึงช่วงสุดท้ายด้วยการเดินเท้า ควรตรวจสอบเส้นทางและที่จอดก่อนออกเดินทาง</p></details></div></div></section>
      <div class="closing shell"><Leaf :size="26" /><p>บางวัน ความสุขก็อยู่แค่<span>ริมคลอง</span></p><a href="#planner">หาวันว่าง แล้วไปกัน</a></div>
    </main>
    <footer class="site-footer"><div class="shell footer-main"><NuxtLink to="/" class="footer-brand">บางหลวง วันว่าง<span>A LITTLE ESCAPE, A LOVELY DAY.</span></NuxtLink><p>ไอเดียเที่ยวด้วยตัวเองในชุมชนคลองบางหลวง<br>ข้อมูลตรวจสอบ 20 พฤศจิกายน 2569 · เวลาและกิจกรรมอาจเปลี่ยนแปลง</p><a href="https://www.artisthousebangkok.com/th" target="_blank" rel="noopener noreferrer">ข้อมูลและภาพ: บ้านศิลปินคลองบางหลวง</a></div></footer>
    <MobileTripNav :saved="hasSaved" @show-saved="showSaved" />
  </div>
</template>
