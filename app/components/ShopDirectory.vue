<script setup lang="ts">
import { BookOpen, Coffee, MapPin, Palette, Search, Utensils, X } from '@lucide/vue'
import { shops, shopZones, type Shop, type ShopZone } from '~/data/shops'
import { mapsUrl } from '~/data/places'

const query = ref('')
const props = withDefaults(defineProps<{ selectedShopIds?: string[] }>(), { selectedShopIds: () => [] })
const emit = defineEmits<{ addShop: [shopId: string] }>()
const { asset } = useSiteUrls()
const photoDialog = ref<HTMLDialogElement | null>(null)
const selectedPhoto = ref<Shop | null>(null)
async function openPhoto(shop: Shop) { selectedPhoto.value = shop; await nextTick(); photoDialog.value?.showModal() }
const selectedZone = ref<ShopZone | 'all'>('all')
const zoneIcons = { food: Utensils, cafe: Coffee, workshop: Palette }
const normalize = (value: string) => value.normalize('NFC').toLocaleLowerCase('th').replace(/[\s\u200b]+/g, '')
const filteredShops = computed(() => shops.filter(shop =>
  (selectedZone.value === 'all' || shop.zone === selectedZone.value) &&
  normalize(`${shop.name} ${shop.summary} ${shopZones.find(zone => zone.id === shop.zone)?.title}`).includes(normalize(query.value))
))
const groups = computed(() => shopZones.map(zone => ({ ...zone, shops: filteredShops.value.filter(shop => shop.zone === zone.id) })).filter(zone => zone.shops.length))
function clearFilters() { query.value = ''; selectedZone.value = 'all' }
</script>

<template>
  <div class="shop-directory">
    <div class="directory-toolbar">
      <div class="directory-search"><Search :size="18" aria-hidden="true" /><input v-model="query" type="search" aria-label="ค้นหาชื่อร้านหรือประเภทอาหาร" placeholder="ค้นหาชื่อร้าน กาแฟ ผัดไทย ลูกปัด…" autocomplete="off" /><button v-if="query" class="icon-button" aria-label="ล้างคำค้นหา" @click="query = ''"><X :size="17" /></button></div>
      <p class="directory-result" role="status">แสดง {{ filteredShops.length }} จาก {{ shops.length }} ร้าน</p>
    </div>
    <div class="filter-row directory-filters" aria-label="เลือกโซนร้าน">
      <button class="filter-chip" :class="{ active: selectedZone === 'all' }" :aria-pressed="selectedZone === 'all'" @click="selectedZone = 'all'">ทั้งหมด <span>{{ shops.length }}</span></button>
      <button v-for="zone in shopZones" :key="zone.id" class="filter-chip" :class="{ active: selectedZone === zone.id }" :aria-pressed="selectedZone === zone.id" @click="selectedZone = zone.id">{{ zone.title }} <span>{{ shops.filter(shop => shop.zone === zone.id).length }}</span></button>
    </div>
    <div v-if="groups.length" class="directory-groups">
      <section v-for="zone in groups" :id="`zone-${zone.id}`" :key="zone.id" class="directory-zone" :aria-labelledby="`zone-title-${zone.id}`">
        <header class="directory-zone-header"><span class="zone-icon"><component :is="zoneIcons[zone.id]" :size="21" aria-hidden="true" /></span><div><h3 :id="`zone-title-${zone.id}`">โซน{{ zone.title }} <span>{{ zone.shops.length }} ร้าน</span></h3><p>{{ zone.subtitle }}</p></div></header>
        <ul class="shop-list">
          <li v-for="shop in zone.shops" :key="shop.id" class="shop-row">
            <button class="shop-photo" :aria-label="`ดูรูป ${shop.name}`" @click="openPhoto(shop)"><img :src="asset(shop.image)" :alt="`ภาพร้านหรือเมนูของ ${shop.name}`" :title="`ภาพ: ${shop.photoCredit}`" loading="lazy" decoding="async" width="192" height="192" /><span>ดูรูป</span></button>
            <div class="shop-row-content"><div class="shop-row-copy"><h4><NuxtLink v-if="shop.detail" :to="shop.detail">{{ shop.name }}</NuxtLink><span v-else>{{ shop.name }}</span></h4><p>{{ shop.summary }}</p></div><div class="shop-row-actions"><a :href="mapsUrl(`${shop.name} คลองบางหลวง`)" class="shop-map-link" target="_blank" rel="noopener noreferrer" :aria-label="`เปิดแผนที่ ${shop.name}`"><MapPin :size="16" aria-hidden="true" />แผนที่</a><a :href="shop.source" class="shop-source-link" target="_blank" rel="noopener noreferrer" :aria-label="`ข้อมูล ${shop.name} จาก ${shop.sourceName}`"><BookOpen :size="14" aria-hidden="true" />ข้อมูลร้าน</a><button class="directory-add" :aria-label="`เพิ่ม ${shop.name} ในทริป`" @click="emit('addShop', shop.id)">{{ props.selectedShopIds.includes(shop.id) ? 'เพิ่มแวะซ้ำ' : 'เพิ่มในทริป' }}</button></div></div>
          </li>
        </ul>
      </section>
    </div>
    <div v-else class="directory-empty" role="status"><Search :size="26" /><p>ไม่พบร้านที่ตรงกับคำค้นหา</p><button class="button button-outline" @click="clearFilters">แสดงร้านทั้งหมด</button></div>
    <p class="directory-note">รวบรวมรายชื่อจากข้อมูลออนไลน์ ตรวจสอบแหล่งอ้างอิง 20 พ.ย. 2569 รายชื่อนี้อาจยังไม่ครบทุกร้านในชุมชน และไม่ได้ยืนยันว่าทุกร้านเปิดในวันนี้ กรุณาตรวจสอบเวลาเปิดกับร้านก่อนเดินทาง</p>
    <dialog ref="photoDialog" class="shop-photo-dialog" aria-labelledby="shop-photo-title" @click="($event.target === photoDialog) && photoDialog?.close()" @close="selectedPhoto = null"><div v-if="selectedPhoto" class="shop-photo-view"><button class="icon-button photo-close" aria-label="ปิดรูป" @click="photoDialog?.close()"><X /></button><h3 id="shop-photo-title">{{ selectedPhoto.name }}</h3><img :src="asset(selectedPhoto.image)" :alt="`ภาพร้านหรือเมนูของ ${selectedPhoto.name}`" width="768" height="576" /><a :href="selectedPhoto.photoSource" target="_blank" rel="noopener noreferrer">ภาพ: {{ selectedPhoto.photoCredit }}</a></div></dialog>
  </div>
</template>
