<script setup lang="ts">
import { Bookmark, CalendarDays, MapPin, Navigation } from '@lucide/vue'
defineProps<{ saved: boolean }>()
const emit = defineEmits<{ showSaved: [] }>()
const route = useRoute()
</script>

<template>
  <nav class="mobile-trip-nav" aria-label="ทางลัดสำหรับเที่ยวบนมือถือ">
    <NuxtLink to="/#places" :aria-current="route.hash === '#places' ? 'location' : undefined"><MapPin :size="21" aria-hidden="true" /><span>จุดแวะ</span></NuxtLink>
    <NuxtLink to="/#planner" :aria-current="route.hash === '#planner' ? 'location' : undefined"><CalendarDays :size="21" aria-hidden="true" /><span>จัดแพลน</span></NuxtLink>
    <NuxtLink to="/#getting-here" :aria-current="route.hash === '#getting-here' ? 'location' : undefined"><Navigation :size="21" aria-hidden="true" /><span>เส้นทาง</span></NuxtLink>
    <button aria-label="เปิดแพลนที่บันทึก" @click="emit('showSaved')"><Bookmark :size="21" :fill="saved ? 'currentColor' : 'none'" aria-hidden="true" /><span>ที่บันทึก</span></button>
  </nav>
</template>
