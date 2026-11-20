import tailwindcss from '@tailwindcss/vite'
import { env } from 'node:process'

export default defineNuxtConfig({
  compatibilityDate: '2026-11-20',
  devtools: { enabled: false },
  runtimeConfig: { public: { siteOrigin: 'https://dxrkfey.github.io' } },
  css: ['~/assets/css/main.css', '~/assets/css/mobile.css', '~/assets/css/zones.css', '~/assets/css/directory.css', '~/assets/css/typography.css'],
  vite: { plugins: [tailwindcss()], optimizeDeps: { include: ['@lucide/vue'] } },
  app: {
    baseURL: env.NUXT_APP_BASE_URL || '/',
    head: {
      htmlAttrs: { lang: 'th' },
      title: 'บางหลวง วันว่าง | แพลนเที่ยวคลองบางหลวงในหนึ่งวัน',
      meta: [
        { name: 'viewport', content: 'width=device-width, initial-scale=1, viewport-fit=cover' },
        { name: 'description', content: 'ชวนใช้เวลาช้า ๆ ที่คลองบางหลวง เลือกแพลนเที่ยวครึ่งวันหรือเต็มวัน เดินชุมชน แวะบ้านศิลปิน ทำงานคราฟต์ พร้อมวิธีเดินทางด้วย MRT บางไผ่' },
        { name: 'theme-color', content: '#1c5144' }
      ],
      link: [
        { rel: 'icon', type: 'image/svg+xml', href: `${env.NUXT_APP_BASE_URL || '/'}favicon.svg` },
        { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
        { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' },
        { rel: 'stylesheet', href: 'https://fonts.googleapis.com/css2?family=IBM+Plex+Sans+Thai:wght@400;450;500;600;700&family=Noto+Serif+Thai:wght@400;500;600;700&display=swap' }
      ]
    }
  }
})
