/**
 * ThemeProvider — applies NativeWind dark/light class to the root view.
 *
 * NativeWind v4 uses `darkMode: 'class'` — the root View must have
 * className="dark" for dark: variants to activate.
 *
 * This provider reads colorMode from uiStore and applies the class,
 * so all NativeWind dark: variants work automatically.
 */

import React from 'react';
import { useColorScheme } from 'react-native';
import { View } from 'react-native';
import { useUiStore } from '@/src/stores/uiStore';

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const colorMode    = useUiStore((s) => s.colorMode);
  const systemScheme = useColorScheme();

  const isDark =
    colorMode === 'dark'  ? true  :
    colorMode === 'light' ? false :
    systemScheme === 'dark';

  return (
    <View className={isDark ? 'dark flex-1' : 'flex-1'}>
      {children}
    </View>
  );
};
