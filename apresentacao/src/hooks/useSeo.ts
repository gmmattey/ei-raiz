import { useEffect } from 'react'
import { getSiteUrl, SITE_URL_PUBLICA_CONFIGURADA, SITE_NAME } from '../config/site'

interface SeoOptions {
  title: string
  description: string
  /** Caminho relativo (ex: "/privacidade"). Vira URL canônica absoluta a partir da URL pública configurada. */
  path?: string
  /**
   * Impede indexação. Se omitido, o default é `!SITE_URL_PUBLICA_CONFIGURADA` — ou seja,
   * qualquer build sem `VITE_PUBLIC_SITE_URL` (dev local, preview de branch) já nasce
   * `noindex, nofollow`, sem precisar que cada rota lembre de marcar isso.
   */
  noindex?: boolean
  image?: string
}

function setMeta(attr: 'name' | 'property', key: string, content: string) {
  let el = document.head.querySelector<HTMLMetaElement>(`meta[${attr}="${key}"]`)
  if (!el) {
    el = document.createElement('meta')
    el.setAttribute(attr, key)
    document.head.appendChild(el)
  }
  el.setAttribute('content', content)
}

function setLink(rel: string, href: string) {
  let el = document.head.querySelector<HTMLLinkElement>(`link[rel="${rel}"]`)
  if (!el) {
    el = document.createElement('link')
    el.setAttribute('rel', rel)
    document.head.appendChild(el)
  }
  el.setAttribute('href', href)
}

/**
 * Hook leve de SEO — escreve title/description/canonical/OG/Twitter no <head> via useEffect.
 * Não usa lib externa (react-helmet etc), só DOM direto. Cada rota pública chama isso 1x.
 */
export function useSeo({ title, description, path = '/', noindex, image }: SeoOptions) {
  useEffect(() => {
    const fullTitle = title.includes(SITE_NAME) ? title : `${title} | ${SITE_NAME}`
    document.title = fullTitle

    const deveNoindex = noindex ?? !SITE_URL_PUBLICA_CONFIGURADA

    setMeta('name', 'description', description)
    setMeta('name', 'robots', deveNoindex ? 'noindex, nofollow' : 'index, follow')

    const canonicalUrl = `${getSiteUrl()}${path}`
    setLink('canonical', canonicalUrl)

    setMeta('property', 'og:title', fullTitle)
    setMeta('property', 'og:description', description)
    setMeta('property', 'og:url', canonicalUrl)
    setMeta('property', 'og:type', 'website')
    setMeta('property', 'og:locale', 'pt_BR')
    if (image) setMeta('property', 'og:image', image)

    setMeta('name', 'twitter:card', 'summary')
    setMeta('name', 'twitter:title', fullTitle)
    setMeta('name', 'twitter:description', description)
    if (image) setMeta('name', 'twitter:image', image)
  }, [title, description, path, noindex, image])
}

/**
 * Injeta um bloco JSON-LD no <head>, substituindo qualquer bloco anterior com a mesma chave.
 * Usado só na landing (Organization + SoftwareApplication).
 */
export function useJsonLd(key: string, data: Record<string, unknown>) {
  useEffect(() => {
    const id = `jsonld-${key}`
    let script = document.getElementById(id) as HTMLScriptElement | null
    if (!script) {
      script = document.createElement('script')
      script.type = 'application/ld+json'
      script.id = id
      document.head.appendChild(script)
    }
    script.textContent = JSON.stringify(data)
    return () => {
      script?.remove()
    }
  }, [key, JSON.stringify(data)])
}
