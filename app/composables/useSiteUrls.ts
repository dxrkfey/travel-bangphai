export function useSiteUrls() {
  const config = useRuntimeConfig()
  const asset = (path: string) => `${config.app.baseURL.replace(/\/$/, '')}/${path.replace(/^\/+/, '')}`
  const absoluteAsset = (path: string) => new URL(asset(path), config.public.siteOrigin).href
  return { asset, absoluteAsset }
}
