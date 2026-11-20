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
npm run build
```

ผลลัพธ์สำหรับ static hosting อยู่ที่ `.output/public/`

## แก้ไขข้อมูล

- `app/data/places.ts` ข้อมูลจุดแวะและแหล่งอ้างอิง
- `app/pages/index.vue` หน้าแรกและตัวจัดแพลน
- `app/pages/places/[slug].vue` หน้ารายละเอียด
- `app/assets/css/main.css` สไตล์ responsive

การบันทึกแพลนใช้ localStorage บนเครื่องผู้ใช้ แชร์แพลนด้วย URL parameters ไม่ต้องมีบัญชีหรือฐานข้อมูล งบและเวลาเป็นคำแนะนำสำหรับจัดทริปเอง ไม่ใช่แพ็กเกจหรือราคาจากร้าน

ข้อมูลและภาพประกอบจากเว็บไซต์ทางการของ [บ้านศิลปินคลองบางหลวง](https://www.artisthousebangkok.com/th) และ [ข้อมูลการเดินทาง](https://www.artisthousebangkok.com/th/locations-contect) ตรวจสอบ 20 พฤศจิกายน 2569 โปรดตรวจสอบสิทธิ์ภาพเพิ่มเติมก่อนนำไปใช้งานเชิงพาณิชย์
