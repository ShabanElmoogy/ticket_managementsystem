import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { I18nManager } from 'react-native';
import * as Updates from 'expo-updates';

import en from './locales/en.json';
import ar from './locales/ar.json';

const LANG_KEY = 'i18nextLng';

export async function initI18n() {
  const saved = await AsyncStorage.getItem(LANG_KEY);
  const lng = saved ?? 'en';

  await i18n.use(initReactI18next).init({
    resources: {
      en: { translation: en },
      ar: { translation: ar },
    },
    lng,
    fallbackLng: 'en',
    interpolation: { escapeValue: false },
  });

  // Apply RTL for Arabic
  const isRtl = lng === 'ar';
  if (I18nManager.isRTL !== isRtl) {
    I18nManager.forceRTL(isRtl);
  }
}

export async function changeLanguage(lng: 'en' | 'ar') {
  await i18n.changeLanguage(lng);
  await AsyncStorage.setItem(LANG_KEY, lng);
  const isRtl = lng === 'ar';
  if (I18nManager.isRTL !== isRtl) {
    I18nManager.forceRTL(isRtl);
    try {
      await Updates.reloadAsync();
    } catch {
      // dev mode — reload manually
    }
  }
}

export const getCurrentLanguage = (): 'en' | 'ar' =>
  (i18n.language === 'ar' ? 'ar' : 'en');

export const isRTL = () => getCurrentLanguage() === 'ar';

export default i18n;
