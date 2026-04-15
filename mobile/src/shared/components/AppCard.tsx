import React from 'react';
import { Platform, View, type StyleProp, type ViewStyle } from 'react-native';

export interface AppCardProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  className?: string;
}

const AppCard: React.FC<AppCardProps> = ({ children, style, className = '' }) => (
  <View
    className={`bg-white rounded-xl p-4 ${className}`}
    style={[
      Platform.OS === 'web'
        ? ({ boxShadow: '0 1px 4px rgba(0,0,0,0.08)' } as any)
        : { shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.08, shadowRadius: 4, elevation: 2 },
      style,
    ]}
  >
    {children}
  </View>
);

export default AppCard;
