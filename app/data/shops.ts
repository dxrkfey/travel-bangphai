import { shopPhotos } from './shopPhotos.ts'

export type ShopZone = 'food' | 'cafe' | 'workshop'

export interface Shop {
  id: string
  name: string
  zone: ShopZone
  summary: string
  source: string
  sourceName: string
  detail?: string
  foodType?: 'meal' | 'snack'
  image: string
  photoSource: string
  photoCredit: string
}

const marketGuide = 'https://super.co.th/review/review-khlong-bang-luang/'
const marketSource = { source: marketGuide, sourceName: 'SUPER · คู่มือร้านในตลาด' }

export const shopZones = [
  { id: 'food', title: 'อาหาร', subtitle: 'มื้อหลัก ขนม และของกินเล่น' },
  { id: 'cafe', title: 'คาเฟ่', subtitle: 'กาแฟ ชา และร้านเครื่องดื่ม' },
  { id: 'workshop', title: 'เวิร์กช็อป', subtitle: 'ศิลปะและกิจกรรมทำมือ' }
] as const

// One entry per business; activities and cafe corners are not counted as separate shops.
const shopEntries: readonly Omit<Shop, 'image' | 'photoSource' | 'photoCredit'>[] = [
  { id: 'khun-aoi', name: 'ครัวคุณอ๋อย', zone: 'food', summary: 'อาหารไทย จานเดียว และกับข้าว', source: 'https://www.wongnai.com/articles/khun-aoi-kitchen-gsb', sourceName: 'Wongnai · สัมภาษณ์ร้าน', detail: '/places/khun-aoi-kitchen' },
  { id: 'plern-jitt', name: 'บ้านเพลินจิตต์ ณ คลองบางหลวง', zone: 'food', summary: 'ผัดไทยและขนมไทย', source: 'https://www.ryoiireview.com/restaurant/view/19967', sourceName: 'Ryoii · ข้อมูลร้าน' },
  { id: 'jan-dara', name: 'ก๋วยเตี๋ยวจานดารา', zone: 'food', summary: 'ก๋วยเตี๋ยวน้ำตก', ...marketSource },
  { id: 'meow-meow-roll', name: 'Meow Meow Roll', zone: 'food', summary: 'ขนมโตเกียวไส้คาวและหวาน', ...marketSource },
  { id: 'pa-lek', name: 'ป้าเล็ก', zone: 'food', summary: 'ผัดไทยและก๋วยจั๊บ', ...marketSource },
  { id: 'pad-thai-no1', name: 'ผัดไทย NO.1', zone: 'food', summary: 'ผัดไทยและขนมผักกาด', ...marketSource },
  { id: 'peanut-ice-cream', name: 'ไอติมถั่วตัด', zone: 'food', summary: 'ขนมไอศกรีมในร้านบ้านมวยไทย', ...marketSource },
  { id: 'mee-khluk-corn', name: 'หมีคลุกคอร์น', zone: 'food', summary: 'ข้าวโพดคลุกเนย', ...marketSource },
  { id: 'baan-muay-thai', name: 'บ้านมวยไทยคลองบางหลวง', zone: 'cafe', summary: 'ชาและกาแฟในตลาด', ...marketSource },
  { id: 'sor-haeng', name: 'ซ้อแห้งกาแฟโบราณ', zone: 'cafe', summary: 'กาแฟโบราณและชาไทย', ...marketSource },
  { id: 'bang-luang-coffee', name: 'กาแฟบางหลวง', zone: 'cafe', summary: 'กาแฟและเครื่องดื่มผลไม้', ...marketSource },
  { id: 'khun-thip', name: 'น้ำปั่นคุณทิพย์', zone: 'cafe', summary: 'น้ำผลไม้ปั่น ชา และกาแฟโบราณ', ...marketSource },
  { id: 'phrao-hom', name: 'บ้านพร้าวหอม', zone: 'cafe', summary: 'เครื่องดื่มมะพร้าวและผลไม้', ...marketSource },
  { id: 'yen-lamoon', name: 'เย็นละมุน', zone: 'cafe', summary: 'เครื่องดื่มและมัทฉะ', ...marketSource },
  { id: 'lung-tong', name: 'ลุงโต้งกาแฟสด', zone: 'cafe', summary: 'ร้านกาแฟสดในชุมชน', ...marketSource },
  { id: 'artist-house', name: 'บ้านศิลปินคลองบางหลวง', zone: 'workshop', summary: 'ร้อยลูกปัด วาดภาพ และมีมุมคาเฟ่', source: 'https://www.artisthousebangkok.com/th/art-workshop', sourceName: 'เว็บไซต์บ้านศิลปิน', detail: '/places/artist-house' },
  { id: 'phueng-sin', name: 'บ้านพึ่งศิลป์', zone: 'workshop', summary: 'งานเพนต์ ร้อยลูกปัด และเครื่องดื่ม', source: 'https://travel.trueid.net/detail/6pOxrAK1GgYJ', sourceName: 'TrueID · เที่ยวคลองบางหลวง' }
]


export const shops: readonly Shop[] = shopEntries.map(shop => {
  const photo = shopPhotos[shop.id]
  if (!photo) throw new Error(`Missing photo attribution for ${shop.id}`)
  return { ...shop, image: photo.image, photoSource: photo.source, photoCredit: photo.credit }
})
