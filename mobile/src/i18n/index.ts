import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';

import en from './locales/en.json';
import ar from './locales/ar.json';

const LANG_KEY = 'i18nextLng';

export async function initI18n() {
  const saved = await AsyncStorage.getItem(LANG_KEY);
  const lng = (saved === 'ar' ? 'ar' : 'en') as 'en' | 'ar';

  await i18n.use(initReactI18next).init({
    resources: {
      en: { translation: en },
      ar: { translation: ar },
    },
    lng,
    fallbackLng: 'en',
    interpolation: { escapeValue: false },
    // Disable i18next's own language detection — we manage it manually
    detection: undefined,
  });

  // Sync direction store to match the persisted language
  // Import lazily to avoid circular deps at module load time
  const { useUiStore } = await import('../stores/uiStore');
  useUiStore.getState().setDirection(lng === 'ar' ? 'rtl' : 'ltr');
}

/**
 * Switch language at runtime — no app reload needed.
 * Updates i18n + uiStore.direction (which DirectionProvider reads).
 * DirectionProvider applies `direction` style to the root View,
 * so all layouts flip instantly without I18nManager or reloadAsync.
 */
export async function changeLanguage(lng: 'en' | 'ar') {
  // 1. Switch i18next — triggers re-render of all useTranslation() consumers
  await i18n.changeLanguage(lng);

  // 2. Persist the choice
  await AsyncStorage.setItem(LANG_KEY, lng);

  // 3. Sync direction — DirectionProvider picks this up immediately
  const { useUiStore } = await import('../stores/uiStore');
  useUiStore.getState().setDirection(lng === 'ar' ? 'rtl' : 'ltr');
}

export const getCurrentLanguage = (): 'en' | 'ar' =>
  (i18n.language === 'ar' ? 'ar' : 'en');

export default i18n;
