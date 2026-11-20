export const mapsUrl = (query: string) => `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`

// A walking stop that is not a shop but still opens the same detail popup.
export const canalWalk = {
  id: 'canal-walk',
  name: 'เดินเล่นเลียบคลอง',
  summary: 'บ้านไม้ เรือผ่าน และเสน่ห์ของวันธรรมดา',
  description: 'ปล่อยให้ทางเดินพาไปเจอภาพเล็ก ๆ ของชุมชนคลองบางหลวง บ้านไม้ ร้านค้า และวิถีชีวิตริมคลอง เดินช้า ๆ เก็บบรรยากาศที่ชอบ และอุดหนุนร้านท้องถิ่นตามความสนใจ',
  tip: 'ขออนุญาตก่อนถ่ายภาพคนหรือพื้นที่ส่วนตัว ทางเดินบางช่วงแคบ ควรใส่รองเท้าที่เดินสะดวก',
  duration: '30–45 นาที',
  image: '/images/canal.jpg',
  map: 'ตลาดคลองบางหลวง',
  source: 'https://www.museumthailand.com/museum/baansilapin',
  sourceName: 'Museum Thailand · บ้านศิลปิน',
  photoSource: 'https://www.artisthousebangkok.com/th',
  photoCredit: 'บ้านศิลปินคลองบางหลวง'
} as const

// Old /places/<slug> URLs now open the matching popup on the home page.
export const legacyPlaceTargets: Record<string, string> = {
  'khun-aoi-kitchen': 'khun-aoi',
  'artist-house': 'artist-house',
  'bead-workshop': 'artist-house',
  'canal-cafe': 'artist-house',
  'canal-walk': 'canal-walk'
}
