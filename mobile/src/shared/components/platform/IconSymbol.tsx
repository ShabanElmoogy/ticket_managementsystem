/**
 * IconSymbol — Android and web fallback using MaterialIcons.
 *
 * Metro automatically selects IconSymbol.ios.tsx on iOS instead of this file.
 *
 * SF Symbol names are mapped to MaterialIcons equivalents via MAPPING.
 * Unmapped names fall back to 'help-outline' rather than rendering nothing.
 *
 * To add a new icon:
 *   1. Find the SF Symbol name in the SF Symbols app
 *   2. Find the equivalent in https://icons.expo.fyi
 *   3. Add the mapping below
 */
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { type SymbolWeight, type SymbolViewProps } from 'expo-symbols';
import type { ViewStyle } from 'react-native';

type IconMapping = Partial<Record<SymbolViewProps['name'], keyof typeof MaterialIcons.glyphMap>>;
export type IconSymbolName = SymbolViewProps['name'];

/** SF Symbol → MaterialIcons name mapping */
const MAPPING: IconMapping = {
  'house.fill':                              'home',
  'paperplane.fill':                         'send',
  'chevron.left.forwardslash.chevron.right': 'code',
  'chevron.right':                           'chevron-right',
};

/** Fallback icon shown when a symbol name has no mapping */
const FALLBACK_ICON: keyof typeof MaterialIcons.glyphMap = 'help-outline';

/**
 * An icon component that uses native SF Symbols on iOS, and Material Icons on Android and web.
 * Icon names are based on SF Symbols — add mappings to MAPPING for new icons.
 *
 * Note: `weight` is accepted for API compatibility with the iOS version but has no effect
 * on Android/web since MaterialIcons does not support variable weight.
 */
export function IconSymbol({
  name,
  size   = 24,
  color,
  style,
}: {
  name:    IconSymbolName;
  size?:   number;
  color:   string;
  style?:  ViewStyle;
  weight?: SymbolWeight;
}) {
  const iconName = MAPPING[name] ?? FALLBACK_ICON;
  return <MaterialIcons color={color} size={size} name={iconName} style={style} />;
}
