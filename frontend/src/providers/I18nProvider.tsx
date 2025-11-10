import React, { useEffect, useMemo } from 'react';
import { CacheProvider } from '@emotion/react';
import createCache from '@emotion/cache';
import rtlPlugin from 'stylis-plugin-rtl';
import i18n from '../i18n';
import { getCurrentLanguage, isRTL } from '../i18n';

// Create caches once and reuse
const rtlCache = createCache({
  key: 'muirtl',
  stylisPlugins: [rtlPlugin],
});

const ltrCache = createCache({
  key: 'muiltr',
});

interface I18nProviderProps {
  children: React.ReactNode;
}

const I18nProvider: React.FC<I18nProviderProps> = ({ children }) => {
  const [currentLanguage, setCurrentLanguage] = React.useState(getCurrentLanguage());
  const isRtl = isRTL();

  // Listen for language changes
  useEffect(() => {
    const handleLanguageChange = (lng: string) => {
      setCurrentLanguage(lng);
    };
    
    i18n.on('languageChanged', handleLanguageChange);
    return () => {
      i18n.off('languageChanged', handleLanguageChange);
    };
  }, []);

  // Memoize cache selection to prevent unnecessary re-renders
  const cache = useMemo(() => {
    return isRtl ? rtlCache : ltrCache;
  }, [isRtl]);

  useEffect(() => {
    // Batch DOM updates for better performance
    const html = document.documentElement;
    const body = document.body;
    
    // Use requestAnimationFrame for smooth transition
    requestAnimationFrame(() => {
      html.dir = isRtl ? 'rtl' : 'ltr';
      html.lang = currentLanguage;
      body.style.direction = isRtl ? 'rtl' : 'ltr';
    });
  }, [currentLanguage, isRtl]);

  return (
    <CacheProvider value={cache}>
      {children}
    </CacheProvider>
  );
};

export default I18nProvider;