import React from 'react';
import { Platform, View, type StyleProp, type ViewStyle } from 'react-native';
import { useThemeColors, Radius } from '@/src/constants/theme';

export interface AppCardProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}

const AppCard: React.FC<AppCardProps> = ({ children, style }) => {
  const c = useThemeColors();

  return (
    <View
      style={[
        {
          backgroundColor: c.surface.primary,
          borderRadius: Radius.xl,
          padding: 16,
          borderWidth: 1,
          borderColor: c.border.primary,
        },
        Platform.OS === 'web'
          ? ({ boxShadow: '0 1px 4px rgba(0,0,0,0.08)' } as any)
          : { 
              shadowColor: c.shadow, 
              shadowOffset: { width: 0, height: 1 }, 
              shadowOpacity: 0.08, 
              shadowRadius: 4, 
              elevation: 2 
            },
        style,
      ]}
    >
      {children}
    </View>
  );
};

export default AppCard;
