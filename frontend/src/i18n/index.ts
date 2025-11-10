import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Import translation files
import enTranslations from './locales/en.json';
import arTranslations from './locales/ar.json';

const resources = {
  en: { translation: enTranslations },
  ar: { translation: arTranslations }
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'en',
    debug: false,
    
    interpolation: {
      escapeValue: false,
    },
    
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
    }
  });

export default i18n;

// Language utilities
export const changeLanguage = (lng: string) => {
  // Batch all updates together
  const isRtl = lng === 'ar';
  
  // Update i18n first
  i18n.changeLanguage(lng);
  localStorage.setItem('i18nextLng', lng);
  
  // Use requestAnimationFrame for smooth DOM updates
  requestAnimationFrame(() => {
    const html = document.documentElement;
    const body = document.body;
    
    // Update direction and language atomically
    html.dir = isRtl ? 'rtl' : 'ltr';
    html.lang = lng;
    body.style.direction = isRtl ? 'rtl' : 'ltr';
    
    // Force immediate style recalculation
    body.offsetHeight;
  });
};

export const getCurrentLanguage = () => i18n.language || 'en';
export const isRTL = () => getCurrentLanguage() === 'ar';