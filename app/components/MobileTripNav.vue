<script setup lang="ts">
import { Bookmark, CalendarDays, MapPin, Navigation } from '@lucide/vue'
defineProps<{ saved: boolean }>()
const emit = defineEmits<{ showSaved: [] }>()
const sections = [
  { id: 'planner', label: 'จัดทริป', icon: CalendarDays },
  { id: 'places', label: 'ร้านทั้งหมด', icon: MapPin },
  { id: 'getting-here', label: 'เส้นทาง', icon: Navigation }
] as const
const current = ref('')
let observer: IntersectionObserver | undefined
// Highlight the section crossing the middle of the screen, so the tab follows scrolling.
onMounted(() => {
  observer = new IntersectionObserver(entries => {
    for (const entry of entries) {
      if (entry.isIntersecting) current.value = entry.target.id
      else if (current.value === entry.target.id) current.value = ''
    }
  }, { rootMargin: '-45% 0px -50% 0px' })
  for (const section of sections) { const el = document.getElementById(section.id); if (el) observer.observe(el) }
})
onUnmounted(() => observer?.disconnect())
</script>

<template>
  <nav class="mobile-trip-nav" aria-label="ทางลัดสำหรับเที่ยวบนมือถือ">
    <NuxtLink v-for="section in sections" :key="section.id" :to="`/#${section.id}`" :aria-current="current === section.id ? 'location' : undefined"><component :is="section.icon" :size="21" aria-hidden="true" /><span>{{ section.label }}</span></NuxtLink>
    <button aria-label="เปิดทริปที่บันทึก" @click="emit('showSaved')"><Bookmark :size="21" :fill="saved ? 'currentColor' : 'none'" aria-hidden="true" /><span>ที่บันทึก</span></button>
  </nav>
</template>
