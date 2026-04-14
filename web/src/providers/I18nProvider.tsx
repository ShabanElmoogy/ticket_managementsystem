/**
 * I18nProvider — handles language and direction.
 *
 * Direction strategy: set document.dir only — no Emotion cache swap.
 * MUI v6 uses CSS logical properties (margin-inline-start, padding-inline-end, etc.)
 * which respond to dir="rtl" natively in all modern browsers.
 * This is instant vs the stylis-plugin-rtl approach which re-injects all CSS.
 */

import React, { useEffect } from 'react';
import i18n from '../i18n';
import { useThemeStore } from '../stores/themeStore';

const I18nProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const direction = useThemeStore((s) => s.direction);

  // Sync document attributes — this is all that's needed for RTL
  useEffect(() => {
    document.documentElement.dir  = direction;
    document.body.style.direction = direction;
  }, [direction]);

  // Keep document.lang in sync with i18n language
  useEffect(() => {
    document.documentElement.lang = i18n.language || 'en';
    const onLangChange = (lng: string) => { document.documentElement.lang = lng; };
    i18n.on('languageChanged', onLangChange);
    return () => { i18n.off('languageChanged', onLangChange); };
  }, []);

  return <>{children}</>;
};

export default I18nProvider;
