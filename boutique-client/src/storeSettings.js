import { createContext, useContext } from 'react'

export const DEFAULT_STORE_SETTINGS = {
  whatsappPhone: (import.meta.env.VITE_WHATSAPP_PHONE || '').trim(),
  whatsappMessage: 'Bonjour ORTARA, je souhaite commander :',
  instagram: 'ortara.ci',
  tiktok: 'ortara.ci',
  facebook: '',
  address: '',
  serviceHours: '',
}

export function splitWhatsAppPhone(value) {
  const text = value?.trim() || ''
  const separated = text.match(/^\+?(\d{1,4})[\s.-]+(.+)$/)
  if (separated) {
    return {
      countryCode: separated[1],
      phoneNumber: separated[2].replace(/\D/g, ''),
    }
  }

  const digits = text.replace(/\D/g, '')
  const knownCountryCodes = [
    '225',
    '221',
    '223',
    '226',
    '229',
    '228',
    '237',
    '212',
    '44',
    '33',
    '1',
  ]
  const countryCode = knownCountryCodes.find((code) => digits.startsWith(code))
  return countryCode
    ? { countryCode, phoneNumber: digits.slice(countryCode.length) }
    : { countryCode: '225', phoneNumber: digits }
}

const socialDomains = {
  instagram: 'instagram.com',
  tiktok: 'tiktok.com',
  facebook: 'facebook.com',
}

export const StoreSettingsContext = createContext(null)

export function resolveSocialUrl(platform, value) {
  const domain = socialDomains[platform]
  const text = value?.trim()
  if (!domain || !text) return ''

  if (/^https?:\/\//i.test(text)) {
    try {
      const url = new URL(text)
      const host = url.hostname.toLowerCase().replace(/^www\./, '')
      return ['http:', 'https:'].includes(url.protocol) && host === domain
        ? url.href
        : ''
    } catch {
      return ''
    }
  }

  const handle = text
    .replace(new RegExp(`^(?:www\\.)?${domain.replace('.', '\\.')}\\/+`, 'i'), '')
    .replace(/^@/, '')
    .replace(/^\/+|\/+$/g, '')
  if (!handle || /\s/.test(handle)) return ''

  const profilePath = platform === 'tiktok' ? `@${handle}` : handle
  return `https://www.${domain}/${profilePath
    .split('/')
    .map((part) => encodeURIComponent(part).replace(/%40/gi, '@'))
    .join('/')}`
}

export function useStoreSettings() {
  const context = useContext(StoreSettingsContext)
  if (!context) {
    throw new Error('useStoreSettings doit être utilisé dans StoreSettingsProvider.')
  }
  return context
}
