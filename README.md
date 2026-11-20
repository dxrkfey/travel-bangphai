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

- `app/data/places.ts` จุดเดินเล่นริมคลอง ลิงก์แผนที่ และการพาลิงก์หน้าเดิมไปยังป๊อปอัป
- `app/data/shops.ts` รายชื่อร้าน แบ่งโซน และแหล่งอ้างอิงรายร้าน
- `app/data/shops.ts` รายละเอียดเพิ่มเติมของร้าน (`description`, `tip`, `duration`) แสดงในป๊อปอัป
- `app/components/ShopDirectory.vue` รายชื่อร้านพร้อมค้นหาและตัวกรอง แตะร้านเพื่อดูรายละเอียด
- `app/components/ShopDetailSheet.vue` ป๊อปอัปรายละเอียดร้าน (บนมือถือเป็น bottom sheet)
- `app/pages/index.vue` หน้าแรกและตัวจัดแพลน
- `app/pages/places/[slug].vue` ลิงก์หน้าเดิม `/places/...` จะพากลับหน้าหลักแล้วเปิดป๊อปอัปของร้านนั้น
- `app/assets/css/main.css` สไตล์ responsive
- `app/assets/css/typography.css` ขนาดตัวหนังสือสำหรับเดสก์ท็อปและมือถือ
- `app/assets/css/refine.css` สไตล์ป๊อปอัป bottom sheet และแพลนบนมือถือ (โหลดเป็นไฟล์สุดท้าย)

การบันทึกแพลนใช้ localStorage บนเครื่องผู้ใช้ แชร์แพลนด้วย URL parameters ไม่ต้องมีบัญชีหรือฐานข้อมูล งบและเวลาเป็นคำแนะนำสำหรับจัดทริปเอง ไม่ใช่แพ็กเกจหรือราคาจากร้าน

ตัวจัดแพลนเริ่มจากทริปว่าง เลือกร้านจากทุกโซนได้เอง เพิ่มจากรายชื่อร้านหรือเพิ่มกิจกรรมส่วนตัว แวะร้านซ้ำได้ เพิ่ม/ลบได้ทุกจุด สลับลำดับ และแก้เวลาแวะ งบแต่ละจุด เวลาเริ่ม และเวลาเดินระหว่างจุดได้ ระบบคำนวณเวลาใหม่โดยไม่เปลี่ยนร้านหรือตัดจุดที่เลือกไว้ แม้งบหรือเวลาเกินคำแนะนำ มีปุ่มย้อนกลับ บันทึกและแชร์ลำดับ เวลา และงบที่แก้ไว้ พร้อมรองรับแพลนเดิม v1/v2 แพลนแนะนำเป็นทางเลือก และเมื่อมีแพลนอยู่แล้วจะแนะนำร้านเพิ่มโดยไม่แทนที่รายการเดิม ยังไม่ตรวจเวลาเปิดหรือราคาจริงแบบเรียลไทม์

ภาพร้านทั้ง 17 รายการมีแหล่งที่มาระบุใน `app/data/shopPhotos.ts` และ [IMAGE_CREDITS.md](IMAGE_CREDITS.md) ใช้ภาพชุดเดียวกันในรายชื่อร้าน แพลน และตัวเลือกร้าน เพื่อให้ภาพตรงกันทุกจุด

ข้อมูลและภาพประกอบจากเว็บไซต์ทางการของ [บ้านศิลปินคลองบางหลวง](https://www.artisthousebangkok.com/th) และ [ข้อมูลการเดินทาง](https://www.artisthousebangkok.com/th/locations-contect) ตรวจสอบ 20 พฤศจิกายน 2569 โปรดตรวจสอบสิทธิ์ภาพเพิ่มเติมก่อนนำไปใช้งานเชิงพาณิชย์
