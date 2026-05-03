import { Platform } from 'react-native';
import { BottomTabBarButtonProps } from '@react-navigation/bottom-tabs';
import { PlatformPressable } from '@react-navigation/elements';
import * as Haptics from 'expo-haptics';

/**
 * HapticTab — drop-in replacement for the default bottom tab bar button.
 * Adds a soft haptic feedback on press-in on iOS.
 *
 * Android and web: behaves identically to the default tab button (no haptics).
 *
 * @usage
 *   Pass as `tabBarButton` in screen options:
 *   <Tab.Screen options={{ tabBarButton: HapticTab }} />
 *
 *   Or set globally in the Tab navigator:
 *   <Tab.Navigator screenOptions={{ tabBarButton: HapticTab }}>
 */
export function HapticTab(props: BottomTabBarButtonProps) {
  return (
    <PlatformPressable
      {...props}
      onPressIn={(ev: Parameters<NonNullable<BottomTabBarButtonProps['onPressIn']>>[0]) => {
        if (Platform.OS === 'ios') {
          // Fire-and-forget — haptic feedback is best-effort, not critical
          void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }
        props.onPressIn?.(ev);
      }}
    />
  );
}
