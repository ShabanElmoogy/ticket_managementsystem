import React from 'react';
import { View, type StyleProp, type ViewStyle } from 'react-native';

export interface AppCardProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  className?: string;
}

const AppCard: React.FC<AppCardProps> = ({ children, style, className = '' }) => (
  <View
    className={`bg-white rounded-xl p-4 shadow-sm ${className}`}
    style={style}
  >
    {children}
  </View>
);

export default AppCard;
