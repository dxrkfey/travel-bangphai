<script setup lang="ts">
import { BookOpen, Check, Clock3, Leaf, Navigation, Plus, X } from '@lucide/vue'
import { shops, shopZones } from '~/data/shops'
import { canalWalk, mapsUrl } from '~/data/places'

const props = withDefaults(defineProps<{ selectedShopIds?: string[] }>(), { selectedShopIds: () => [] })
const emit = defineEmits<{ addShop: [shopId: string] }>()
const { asset } = useSiteUrls()
const { openId, close } = useDetailSheet()
const sheet = ref<HTMLDialogElement | null>(null)

const item = computed(() => {
  if (!openId.value) return null
  if (openId.value === canalWalk.id) return { ...canalWalk, zoneTitle: 'เดินเล่น', isShop: false }
  const shop = shops.find(entry => entry.id === openId.value)
  if (!shop) return null
  return { ...shop, map: `${shop.name} คลองบางหลวง`, zoneTitle: shopZones.find(zone => zone.id === shop.zone)?.title || '', isShop: true }
})
const inTrip = computed(() => !!item.value && props.selectedShopIds.includes(item.value.id))

watch(item, async value => {
  await nextTick()
  if (value && !sheet.value?.open) sheet.value?.showModal()
  else if (!value && sheet.value?.open) sheet.value.close()
})
function add() {
  if (!item.value?.isShop) return
  emit('addShop', item.value.id)
  sheet.value?.close()
}
</script>

<template>
  <dialog ref="sheet" class="detail-sheet" aria-labelledby="detail-sheet-title" @click="($event.target === sheet) && sheet?.close()" @close="close">
    <div v-if="item" class="detail-sheet-body">
      <div class="detail-sheet-media">
        <img :src="asset(item.image)" :alt="`ภาพของ ${item.name}`" width="768" height="576" />
        <button class="icon-button detail-sheet-close" aria-label="ปิดรายละเอียด" @click="sheet?.close()"><X :size="20" /></button>
      </div>
      <div class="detail-sheet-copy">
        <p class="detail-sheet-zone">{{ item.zoneTitle }}<template v-if="item.duration"> · <Clock3 :size="14" aria-hidden="true" /> เผื่อเวลา {{ item.duration }}</template></p>
        <h3 id="detail-sheet-title" tabindex="-1" autofocus>{{ item.name }}</h3>
        <p class="detail-sheet-summary">{{ item.summary }}</p>
        <p v-if="item.description" class="detail-sheet-description">{{ item.description }}</p>
        <div v-if="item.tip" class="detail-sheet-tip"><Leaf :size="18" aria-hidden="true" /><p>{{ item.tip }}</p></div>
        <p v-else class="detail-sheet-tip detail-sheet-tip--plain">เวลาเปิดและราคาอาจเปลี่ยนแปลง กรุณาตรวจสอบกับร้านก่อนเดินทาง</p>
        <div class="detail-sheet-actions">
          <button v-if="item.isShop" class="button button-primary" @click="add"><Check v-if="inTrip" :size="17" /><Plus v-else :size="17" />{{ inTrip ? 'แวะซ้ำอีกรอบ' : 'เพิ่มในทริป' }}</button>
          <a class="button button-outline" :href="mapsUrl(item.map)" target="_blank" rel="noopener noreferrer"><Navigation :size="17" />เปิดแผนที่</a>
        </div>
        <p class="detail-sheet-meta">
          <a :href="item.source" target="_blank" rel="noopener noreferrer"><BookOpen :size="14" aria-hidden="true" />ข้อมูลจาก {{ item.sourceName }}</a>
          <a :href="item.photoSource" target="_blank" rel="noopener noreferrer">ภาพ: {{ item.photoCredit }}</a>
        </p>
      </div>
    </div>
  </dialog>
</template>
