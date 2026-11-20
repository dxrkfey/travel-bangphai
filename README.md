# บางหลวง วันว่าง

เว็บภาษาไทยสำหรับวางแผนเที่ยวคลองบางหลวง ใช้ Nuxt 4, Vue 3, TypeScript และ Tailwind CSS 4 พร้อมสร้างหน้าแบบ static สำหรับ SEO

## เริ่มพัฒนา

```sh
npm install
npm run dev
```

## ตรวจสอบและสร้างเว็บ

```sh
npm run typecheck
npm test
npm run build
```

ผลลัพธ์สำหรับ static hosting อยู่ที่ `.output/public/`

## Deploy บน GitHub Pages

Workflow `.github/workflows/github-pages.yml` จะตรวจ TypeScript สร้างเว็บแบบ static และ deploy เมื่อ push เข้า `main` หรือสั่ง Run workflow ในหน้า Actions โดยใช้ Node.js ตาม `.nvmrc`

เปิด Settings → Pages → Build and deployment → Source เป็น GitHub Actions ก่อนใช้งานครั้งแรก GitHub Pages สำหรับ private repository ขึ้นอยู่กับแผนบัญชี GitHub

พาธเว็บของ repo นี้คือ `https://dxrkfey.github.io/travel-bangphai/` Workflow ใช้ base path และ origin จาก GitHub Pages เพื่อให้ลิงก์ รูป และภาพแชร์ทำงานภายใต้พาธของ repo

## แก้ไขข้อมูล

- `app/data/places.ts` ข้อมูลจุดแวะและแหล่งอ้างอิง
- `app/data/shops.ts` รายชื่อร้าน แบ่งโซน และแหล่งอ้างอิงรายร้าน
- `app/components/ShopDirectory.vue` รายชื่อร้านพร้อมค้นหาและตัวกรอง
- `app/pages/index.vue` หน้าแรกและตัวจัดแพลน
- `app/pages/places/[slug].vue` หน้ารายละเอียด
- `app/assets/css/main.css` สไตล์ responsive
- `app/assets/css/typography.css` ขนาดตัวหนังสือสำหรับเดสก์ท็อปและมือถือ

การบันทึกแพลนใช้ localStorage บนเครื่องผู้ใช้ แชร์แพลนด้วย URL parameters ไม่ต้องมีบัญชีหรือฐานข้อมูล งบและเวลาเป็นคำแนะนำสำหรับจัดทริปเอง ไม่ใช่แพ็กเกจหรือราคาจากร้าน

ตัวจัดแพลนอัตโนมัติใช้รายชื่อใน `app/data/shops.ts` เลือกกิจกรรมตามเวลาที่มี เวลาเริ่ม งบเผื่อ และความสนใจ ระบบกันร้านซ้ำ เผื่อเวลาเดิน 10 นาทีระหว่างจุด และจัดให้จบไม่เกิน 18:00 น. ปุ่มเปลี่ยนร้านเปิดรายการพร้อมรูปให้ผู้ใช้เลือกเอง โดยคงจุดอื่น เวลา และงบที่แบ่งไว้ บันทึกและแชร์ตัวเลือกร้านได้ โดยยังไม่ตรวจเวลาเปิดหรือราคาจริงแบบเรียลไทม์

ภาพร้านทั้ง 17 รายการมีแหล่งที่มาระบุใน `app/data/shopPhotos.ts` และ [IMAGE_CREDITS.md](IMAGE_CREDITS.md) ใช้ภาพชุดเดียวกันในรายชื่อร้าน แพลน และตัวเลือกร้าน เพื่อให้ภาพตรงกันทุกจุด

ข้อมูลและภาพประกอบจากเว็บไซต์ทางการของ [บ้านศิลปินคลองบางหลวง](https://www.artisthousebangkok.com/th) และ [ข้อมูลการเดินทาง](https://www.artisthousebangkok.com/th/locations-contect) ตรวจสอบ 20 พฤศจิกายน 2569 โปรดตรวจสอบสิทธิ์ภาพเพิ่มเติมก่อนนำไปใช้งานเชิงพาณิชย์
