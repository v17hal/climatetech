import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import LanguageDetector from 'i18next-browser-languagedetector'

import en from './locales/en.json'
import zu from './locales/zu.json'
import xh from './locales/xh.json'
import af from './locales/af.json'
import fr from './locales/fr.json'
import pt from './locales/pt.json'
import sw from './locales/sw.json'

export const SUPPORTED_LANGUAGES = [
  { code: 'en', label: 'English (SA)', flag: '🇿🇦' },
  { code: 'zu', label: 'Zulu', flag: '🇿🇦' },
  { code: 'xh', label: 'Xhosa', flag: '🇿🇦' },
  { code: 'af', label: 'Afrikaans', flag: '🇿🇦' },
  { code: 'fr', label: 'Français', flag: '🇫🇷' },
  { code: 'pt', label: 'Português', flag: '🇲🇿' },
  { code: 'sw', label: 'Kiswahili', flag: '🇰🇪' },
]

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: { en: { translation: en }, zu: { translation: zu }, xh: { translation: xh }, af: { translation: af }, fr: { translation: fr }, pt: { translation: pt }, sw: { translation: sw } },
    fallbackLng: 'en',
    interpolation: { escapeValue: false },
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
      lookupLocalStorage: 'cs-language',
    },
  })

export default i18n
