<script setup lang="ts">
import { Bookmark, Menu, X } from '@lucide/vue'
const props = defineProps<{ saved?: boolean }>()
const emit = defineEmits<{ showSaved: [] }>()
const menuOpen = ref(false)
</script>

<template>
  <header class="site-header">
    <div class="shell header-inner">
      <NuxtLink to="/" class="brand" aria-label="บางหลวง วันว่าง หน้าหลัก">
        <img src="/favicon.svg" width="43" height="43" alt="" />
        <span>บางหลวง<span class="brand-sub">วันว่าง / WANDER</span></span>
      </NuxtLink>
      <nav class="desktop-nav" aria-label="เมนูหลัก">
        <NuxtLink to="/#discover">รู้จักบางหลวง</NuxtLink>
        <NuxtLink to="/#places">จุดแวะน่ารัก</NuxtLink>
        <NuxtLink to="/#planner">แพลนเที่ยว</NuxtLink>
        <NuxtLink to="/#getting-here">การเดินทาง</NuxtLink>
      </nav>
      <div class="header-actions">
        <button v-if="$route.path === '/'" class="saved-button" aria-label="แพลนของฉัน" @click="emit('showSaved')"><Bookmark :size="17" :fill="props.saved ? 'currentColor' : 'none'" /><span>แพลนของฉัน</span></button>
        <button class="mobile-menu icon-button" :aria-expanded="menuOpen" :aria-label="menuOpen ? 'ปิดเมนู' : 'เปิดเมนู'" @click="menuOpen = !menuOpen"><X v-if="menuOpen" /><Menu v-else /></button>
      </div>
    </div>
    <nav v-if="menuOpen" class="mobile-nav" aria-label="เมนูมือถือ" @click="menuOpen = false"><NuxtLink to="/#discover">รู้จักบางหลวง</NuxtLink><NuxtLink to="/#places">จุดแวะน่ารัก</NuxtLink><NuxtLink to="/#planner">แพลนเที่ยว</NuxtLink><NuxtLink to="/#getting-here">การเดินทาง</NuxtLink></nav>
  </header>
</template>
