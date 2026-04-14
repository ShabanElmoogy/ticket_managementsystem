import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

// Import translation files
import enTranslations from './locales/en.json';
import arTranslations from './locales/ar.json';

const resources = {
  en: { translation: enTranslations },
  ar: { translation: arTranslations }
};

// Get initial language from localStorage or default to 'en'
const initialLanguage = localStorage.getItem('i18nextLng') || 'en';

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: initialLanguage,
    fallbackLng: 'en',
    debug: false,
    
    interpolation: {
      escapeValue: false,
    }
  });

export default i18n;

// Language utilities
export const changeLanguage = (lng: string) => {
  const isRtl = lng === 'ar';

  i18n.changeLanguage(lng);
  localStorage.setItem('i18nextLng', lng);

  // Sync direction into themeStore — single source of truth
  // Dynamic import avoids circular dependency
  import('../stores/themeStore').then(({ useThemeStore }) => {
    useThemeStore.getState().setDirection(isRtl ? 'rtl' : 'ltr');
  });
};

export const getCurrentLanguage = () => {
  const lang = i18n.language || 'en';
  // Ensure the language exists in our supported languages
  return ['en', 'ar'].includes(lang) ? lang : 'en';
};
export const isRTL = () => getCurrentLanguage() === 'ar';