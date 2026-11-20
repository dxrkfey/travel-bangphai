<script setup lang="ts">
import { Bookmark, Menu, X } from '@lucide/vue'
const props = defineProps<{ saved?: boolean }>()
const emit = defineEmits<{ showSaved: [] }>()
const menuOpen = ref(false)
const { asset } = useSiteUrls()
const route = useRoute()
const links = [{ to: '/#planner', label: 'จัดทริป' }, { to: '/#places', label: 'ร้านทั้งหมด' }, { to: '/#getting-here', label: 'การเดินทาง' }]
</script>

<template>
  <header class="site-header" :class="{ 'site-header--home': route.path === '/' }">
    <div class="shell header-inner">
      <NuxtLink to="/" class="brand" aria-label="บางหลวง วันว่าง หน้าหลัก">
        <img :src="asset('/favicon.svg')" width="43" height="43" alt="" />
        <span>บางหลวง<span class="brand-sub">วันว่าง / WANDER</span></span>
      </NuxtLink>
      <nav class="desktop-nav" aria-label="เมนูหลัก">
        <NuxtLink v-for="link in links" :key="link.to" :to="link.to">{{ link.label }}</NuxtLink>
      </nav>
      <div class="header-actions">
        <button v-if="$route.path === '/'" class="saved-button" aria-label="ทริปที่บันทึก" @click="emit('showSaved')"><Bookmark :size="17" :fill="props.saved ? 'currentColor' : 'none'" /><span>ทริปของฉัน</span></button>
        <button class="mobile-menu icon-button" :aria-expanded="menuOpen" aria-controls="mobile-site-nav" :aria-label="menuOpen ? 'ปิดเมนู' : 'เปิดเมนู'" @click="menuOpen = !menuOpen"><X v-if="menuOpen" /><Menu v-else /></button>
      </div>
    </div>
    <nav v-if="menuOpen" id="mobile-site-nav" class="mobile-nav" aria-label="เมนูมือถือ" @click="menuOpen = false"><NuxtLink v-for="link in links" :key="link.to" :to="link.to">{{ link.label }}</NuxtLink></nav>
  </header>
</template>
