<script setup lang="ts">
// Place details now open as a popup on the home page; keep old links working.
import { legacyPlaceTargets } from '~/data/places'
const route = useRoute()
const slug = String(route.params.slug)
if (!legacyPlaceTargets[slug]) throw createError({ statusCode: 404, statusMessage: 'ไม่พบจุดแวะนี้' })
const { absoluteAsset } = useSiteUrls()
const target = `/?place=${slug}#places`
useHead({ meta: [{ name: 'robots', content: 'noindex' }], link: [{ rel: 'canonical', href: absoluteAsset('/') }] })
onMounted(() => navigateTo(target, { replace: true }))
</script>

<template>
  <main class="shell redirect-page"><p>ย้ายรายละเอียดไปไว้ที่หน้าหลักแล้ว</p><NuxtLink :to="target" class="button button-primary">ไปดูรายละเอียด</NuxtLink></main>
</template>
