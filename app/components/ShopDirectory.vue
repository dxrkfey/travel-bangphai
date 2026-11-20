<script setup lang="ts">
import { Check, ChevronDown, Coffee, MapPin, Palette, Plus, Search, Utensils, X } from '@lucide/vue'
import { shops, shopZones, type ShopZone } from '~/data/shops'
import { mapsUrl } from '~/data/places'

const props = withDefaults(defineProps<{ selectedShopIds?: string[] }>(), { selectedShopIds: () => [] })
const emit = defineEmits<{ addShop: [shopId: string] }>()
const { asset } = useSiteUrls()
const { open: openDetail } = useDetailSheet()
const query = ref('')
const selectedZone = ref<ShopZone | 'all'>('all')
const expanded = ref<string[]>([])
const previewCount = 4
const zoneIcons = { food: Utensils, cafe: Coffee, workshop: Palette }
const normalize = (value: string) => value.normalize('NFC').toLocaleLowerCase('th').replace(/[\s\u200b]+/g, '')
const filteredShops = computed(() => shops.filter(shop =>
  (selectedZone.value === 'all' || shop.zone === selectedZone.value) &&
  normalize(`${shop.name} ${shop.summary} ${shopZones.find(zone => zone.id === shop.zone)?.title}`).includes(normalize(query.value))
))
// Collapse long zones only while browsing everything; searching or picking a zone shows every match.
const browsing = computed(() => !query.value.trim() && selectedZone.value === 'all')
const groups = computed(() => shopZones.map(zone => {
  const all = filteredShops.value.filter(shop => shop.zone === zone.id)
  const collapsed = browsing.value && !expanded.value.includes(zone.id) && all.length > previewCount + 1
  return { ...zone, total: all.length, shops: collapsed ? all.slice(0, previewCount) : all, hidden: collapsed ? all.length - previewCount : 0 }
}).filter(zone => zone.total))
function clearFilters() { query.value = ''; selectedZone.value = 'all' }
function expand(zoneId: string) { expanded.value = [...expanded.value, zoneId] }
const inTrip = (id: string) => props.selectedShopIds.includes(id)
</script>

<template>
  <div class="shop-directory">
    <div class="directory-toolbar">
      <div class="directory-search"><Search :size="18" aria-hidden="true" /><input v-model="query" type="search" aria-label="ค้นหาชื่อร้านหรือประเภทอาหาร" placeholder="ค้นหาร้าน กาแฟ ผัดไทย ลูกปัด…" autocomplete="off" enterkeyhint="search" /><button v-if="query" class="icon-button" aria-label="ล้างคำค้นหา" @click="query = ''"><X :size="17" /></button></div>
      <p class="directory-result" role="status">แสดง {{ filteredShops.length }} จาก {{ shops.length }} ร้าน</p>
    </div>
    <div class="filter-row directory-filters" role="group" aria-label="เลือกโซนร้าน">
      <button class="filter-chip" :class="{ active: selectedZone === 'all' }" :aria-pressed="selectedZone === 'all'" @click="selectedZone = 'all'">ทั้งหมด <span>{{ shops.length }}</span></button>
      <button v-for="zone in shopZones" :key="zone.id" class="filter-chip" :class="{ active: selectedZone === zone.id }" :aria-pressed="selectedZone === zone.id" @click="selectedZone = zone.id">{{ zone.title }} <span>{{ shops.filter(shop => shop.zone === zone.id).length }}</span></button>
    </div>
    <div v-if="groups.length" class="directory-groups">
      <section v-for="zone in groups" :id="`zone-${zone.id}`" :key="zone.id" class="directory-zone" :aria-labelledby="`zone-title-${zone.id}`">
        <header class="directory-zone-header"><span class="zone-icon"><component :is="zoneIcons[zone.id]" :size="21" aria-hidden="true" /></span><div><h3 :id="`zone-title-${zone.id}`">โซน{{ zone.title }} <span>{{ zone.total }} ร้าน</span></h3><p>{{ zone.subtitle }}</p></div></header>
        <ul class="shop-list">
          <li v-for="shop in zone.shops" :key="shop.id" class="shop-row">
            <button class="shop-photo" :aria-label="`ดูรายละเอียด ${shop.name}`" @click="openDetail(shop.id)"><img :src="asset(shop.image)" :alt="`ภาพร้านหรือเมนูของ ${shop.name}`" loading="lazy" decoding="async" width="192" height="192" /></button>
            <div class="shop-row-content">
              <button class="shop-row-copy" @click="openDetail(shop.id)"><strong>{{ shop.name }}</strong><span>{{ shop.summary }}</span></button>
              <div class="shop-row-actions">
                <a :href="mapsUrl(`${shop.name} คลองบางหลวง`)" class="shop-map-link" target="_blank" rel="noopener noreferrer" :aria-label="`เปิดแผนที่ ${shop.name}`"><MapPin :size="16" aria-hidden="true" />แผนที่</a>
                <button v-if="inTrip(shop.id)" class="directory-add is-added" :aria-label="`${shop.name} อยู่ในทริปแล้ว ดูรายละเอียด`" @click="openDetail(shop.id)"><Check :size="16" aria-hidden="true" />ในทริปแล้ว</button>
                <button v-else class="directory-add" :aria-label="`เพิ่ม ${shop.name} ในทริป`" @click="emit('addShop', shop.id)"><Plus :size="16" aria-hidden="true" />เพิ่มในทริป</button>
              </div>
            </div>
          </li>
        </ul>
        <button v-if="zone.hidden" class="zone-more" :aria-label="`ดูร้านโซน${zone.title}อีก ${zone.hidden} ร้าน`" @click="expand(zone.id)">ดูอีก {{ zone.hidden }} ร้าน<ChevronDown :size="16" aria-hidden="true" /></button>
      </section>
    </div>
    <div v-else class="directory-empty" role="status"><Search :size="26" /><p>ไม่พบร้านที่ตรงกับคำค้นหา</p><button class="button button-outline" @click="clearFilters">แสดงร้านทั้งหมด</button></div>
    <p class="directory-note">รวบรวมรายชื่อจากข้อมูลออนไลน์ ตรวจสอบแหล่งอ้างอิง 20 พ.ย. 2569 รายชื่อนี้อาจยังไม่ครบทุกร้านในชุมชน และไม่ได้ยืนยันว่าทุกร้านเปิดในวันนี้ กรุณาตรวจสอบเวลาเปิดกับร้านก่อนเดินทาง</p>
  </div>
</template>
