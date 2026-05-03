/**
 * IconSymbol — iOS implementation using native SF Symbols via expo-symbols.
 *
 * Metro automatically selects this file on iOS over IconSymbol.tsx.
 * On Android and web, IconSymbol.tsx (MaterialIcons fallback) is used instead.
 *
 * @see IconSymbol.tsx for the Android/web fallback
 */
import { SymbolView, type SymbolViewProps, type SymbolWeight } from 'expo-symbols';
import type { ViewStyle } from 'react-native';

export function IconSymbol({
  name,
  size   = 24,
  color,
  style,
  weight = 'regular',
}: {
  name:    SymbolViewProps['name'];
  size?:   number;
  color:   string;
  style?:  ViewStyle;
  weight?: SymbolWeight;
}) {
  return (
    <SymbolView
      weight={weight}
      tintColor={color}
      resizeMode="scaleAspectFit"
      name={name}
      style={[{ width: size, height: size }, style]}
    />
  );
}
