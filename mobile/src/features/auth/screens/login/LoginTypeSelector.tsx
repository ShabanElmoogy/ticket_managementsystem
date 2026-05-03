import React, { useEffect, useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useThemeColors } from '@/src/constants/theme';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

export interface LoginTypeSelectorProps {
  isSystemLogin: boolean;
  isRtl:         boolean;
  disabled:      boolean;
  onChange:      (isSystem: boolean) => void;
}

/**
 * LoginTypeSelector — Sleek iOS-style segmented control.
 * Fixed Android elevation bugs, layout height, and redundant icons.
 */
const LoginTypeSelector: React.FC<LoginTypeSelectorProps> = ({
  isSystemLogin, isRtl, disabled, onChange,
}) => {
  const c     = useThemeColors();
  const { t } = useTranslation();

  const segments = isRtl ? [
    { key: 'tenant', label: t('auth.tenantLogin'), isSystem: false },
    { key: 'system', label: t('auth.systemLogin'), isSystem: true  },
  ] : [
    { key: 'system', label: t('auth.systemLogin'), isSystem: true  },
    { key: 'tenant', label: t('auth.tenantLogin'), isSystem: false },
  ];

  const activeIndex = segments.findIndex(seg => seg.isSystem === isSystemLogin);

  const [positions, setPositions] = useState<{ x: number; width: number }[]>([]);

  const handleLayout = (index: number, event: { nativeEvent: { layout: { x: number; width: number } } }) => {
    const { x, width } = event.nativeEvent.layout;
    setPositions(prev => {
      const newPos = [...prev];
      newPos[index] = { x, width };
      return newPos;
    });
  };

  const indicatorX = useSharedValue(0);
  const indicatorWidth = useSharedValue(0);
  const isReady = positions.filter(Boolean).length === segments.length;

  useEffect(() => {
    if (isReady && positions[activeIndex]) {
      if (indicatorWidth.value === 0) {
        indicatorX.value = positions[activeIndex].x;
        indicatorWidth.value = positions[activeIndex].width;
      } else {
        indicatorX.value = withSpring(positions[activeIndex].x, {
          damping: 24,
          stiffness: 300,
          mass: 0.8,
        });
        indicatorWidth.value = withSpring(positions[activeIndex].width, {
          damping: 24,
          stiffness: 300,
          mass: 0.8,
        });
      }
    }
  }, [activeIndex, isReady, positions, indicatorX, indicatorWidth]);

  const indicatorStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateX: indicatorX.value }],
      width: indicatorWidth.value,
      opacity: indicatorWidth.value > 0 ? 1 : 0,
    };
  });

  const handlePress = (isSystem: boolean) => {
    if (isSystem !== isSystemLogin) {
      Haptics.selectionAsync().catch(() => {});
      onChange(isSystem);
    }
  };

  return (
    <View style={[styles.control, { backgroundColor: c.surface.elevated }]}>
      <Animated.View style={[
        styles.indicator, 
        { 
          backgroundColor: c.surface.primary,
          shadowColor: '#000',
        }, 
        indicatorStyle
      ]} />
      {segments.map((seg, index) => {
        const isActive = activeIndex === index;
        const color = isActive ? c.text.primary : c.text.secondary;
        return (
          <Pressable
            key={seg.key}
            style={styles.segment}
            onLayout={(e: { nativeEvent: { layout: { x: number; width: number } } }) => handleLayout(index, e)}
            onPress={() => handlePress(seg.isSystem)}
            disabled={disabled}
            accessibilityRole="radio"
            accessibilityLabel={seg.label}
            accessibilityState={{ selected: isActive }}
          >
            {({ pressed }: { pressed: boolean }) => (
              <View style={[
                styles.segmentContent, 
                { 
                  opacity: pressed && !isActive ? 0.6 : 1,
                  transform: [{ scale: pressed ? 0.96 : 1 }]
                }
              ]}>
                <Text 
                  style={[styles.segmentText, { color }]}
                  numberOfLines={2}
                >
                  {seg.label}
                </Text>
              </View>
            )}
          </Pressable>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  control: {
    flexDirection:  'row',
    borderRadius:   100,
    padding:        4,
    marginBottom:   24,
    position:       'relative',
  },
  indicator: {
    position:       'absolute',
    top:            4,
    bottom:         4,
    left:           0,
    borderRadius:   100,
    shadowOffset:   { width: 0, height: 2 },
    shadowOpacity:  0.15,
    shadowRadius:   4,
  },
  segment: {
    flex:            1,
    borderRadius:    100,
    paddingVertical: 8,
    zIndex:          1,
  },
  segmentContent: {
    flexDirection:   'row',
    alignItems:      'center',
    justifyContent:  'center',
    paddingHorizontal: 4,
    minHeight:       32,
  },
  segmentText: { 
    fontSize: 13, 
    fontWeight: '700',
    letterSpacing: 0.1,
    textAlign: 'center',
    lineHeight: 16,
  },
});

export default LoginTypeSelector;
