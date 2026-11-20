// One detail popup for the whole page: shop ids, or 'canal-walk' for the walking stop.
export function useDetailSheet() {
  const openId = useState<string | null>('detail-sheet-id', () => null)
  const open = (id: string) => { openId.value = id }
  const close = () => { openId.value = null }
  return { openId, open, close }
}
