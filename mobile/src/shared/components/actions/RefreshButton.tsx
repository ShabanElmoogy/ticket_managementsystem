import React, { useEffect, useRef, useCallback } from 'react';
import { Pressable, Text, View } from 'react-native';
import { Animated } from 'react-native/Libraries/Animated/Animated';
import { Easing } from 'react-native/Libraries/Animated/Easing';
import { useThemeColors, FontSize, FontWeight, Radius } from '@/src/constants/theme';

interface Props {
  onPress:       () => void;
  loading?:      boolean;
  label?:        string;
  loadingLabel?: string;
}

const RefreshButton: React.FC<Props> = ({
  onPress, loading = false, label = 'Refresh', loadingLabel = 'Loading…',
}) => {
  const c        = useThemeColors();
  const rotation = useRef(new Animated.Value(0)).current;
  const loopRef  = useRef<Animated.CompositeAnimation | null>(null);

  const stopSpin = useCallback(() => {
    loopRef.current?.stop();
    loopRef.current = null;
    Animated.timing(rotation, { toValue: 0, duration: 150, easing: Easing.out(Easing.ease), useNativeDriver: true }).start();
  }, [rotation]);

  const startLoop = useCallback(() => {
    loopRef.current?.stop();
    rotation.setValue(0);
    loopRef.current = Animated.loop(
      Animated.timing(rotation, { toValue: 1, duration: 600, easing: Easing.linear, useNativeDriver: true }),
    );
    loopRef.current.start();
  }, [rotation]);

  useEffect(() => {
    if (loading) startLoop(); else stopSpin();
    return () => { loopRef.current?.stop(); };
  }, [loading]); // eslint-disable-line react-hooks/exhaustive-deps

  const handlePress = useCallback(() => {
    loopRef.current?.stop();
    rotation.setValue(0);
    Animated.timing(rotation, { toValue: 1, duration: 400, easing: Easing.out(Easing.ease), useNativeDriver: true }).start();
    onPress();
  }, [rotation, onPress]);

  const spin = rotation.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });

  return (
    <Pressable
      onPress={handlePress}
      disabled={loading}
      style={({ pressed }: { pressed: boolean }) => ({
        alignItems: 'center', justifyContent: 'center',
        height: 44, paddingHorizontal: 12, borderRadius: Radius.lg,
        backgroundColor: pressed ? c.buttons.neutral.pressed : c.buttons.neutral.bg,
        opacity: loading ? 0.7 : 1,
      })}
    >
      <View style={{ alignItems: 'center', gap: 2 }}>
        <Animated.View style={{ transform: [{ rotate: spin }] }}>
          <Text style={{ fontSize: FontSize.xl, lineHeight: 18 }}>🔄</Text>
        </Animated.View>
        <Text style={{ fontSize: FontSize.sm, fontWeight: FontWeight.extrabold, color: c.buttons.neutral.text }}>
          {loading ? loadingLabel : label}
        </Text>
      </View>
    </Pressable>
  );
};

export default RefreshButton;
