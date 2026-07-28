import { useEffect } from 'react'
import { SITE_URL, SITE_NAME } from '../config/site'

interface SeoOptions {
  title: string
  description: string
  /** Caminho relativo (ex: "/privacidade"). Vira URL canônica absoluta a partir de SITE_URL. */
  path?: string
  /** Impede indexação (não usado nas rotas públicas atuais, disponível se necessário). */
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
export function useSeo({ title, description, path = '/', noindex = false, image }: SeoOptions) {
  useEffect(() => {
    const fullTitle = title.includes(SITE_NAME) ? title : `${title} | ${SITE_NAME}`
    document.title = fullTitle

    setMeta('name', 'description', description)
    setMeta('name', 'robots', noindex ? 'noindex, nofollow' : 'index, follow')

    const canonicalUrl = `${SITE_URL}${path}`
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
