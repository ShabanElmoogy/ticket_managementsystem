import React, { createContext, useContext } from 'react';
import { View } from 'react-native';
import { useUiStore } from '../stores/uiStore';

interface DirectionContextValue {
  isRtl: boolean;
  direction: 'ltr' | 'rtl';
}

const DirectionContext = createContext<DirectionContextValue>({
  isRtl: false,
  direction: 'ltr',
});

export const useDirection = () => useContext(DirectionContext);

/**
 * Wraps the entire app. Applies `direction: 'rtl'` to the root View
 * so all children flip without needing I18nManager or an app reload.
 */
export const DirectionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const direction = useUiStore((s) => s.direction);
  const isRtl = direction === 'rtl';

  return (
    <DirectionContext.Provider value={{ isRtl, direction }}>
      <View style={{ flex: 1, direction }} >
        {children}
      </View>
    </DirectionContext.Provider>
  );
};
