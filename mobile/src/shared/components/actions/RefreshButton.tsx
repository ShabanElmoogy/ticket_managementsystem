import React, { useEffect, useRef, useCallback } from 'react';
import { Pressable, Text, View, Animated, Easing } from 'react-native';

interface Props {
  onPress:       () => void;
  loading?:      boolean;
  isDark?:       boolean;
  label?:        string;
  loadingLabel?: string;
}

const RefreshButton: React.FC<Props> = ({
  onPress,
  loading      = false,
  isDark       = false,
  label        = 'Refresh',
  loadingLabel = 'Loading…',
}) => {
  const rotation = useRef(new Animated.Value(0)).current;
  const loopRef  = useRef<Animated.CompositeAnimation | null>(null);

  const stopSpin = useCallback(() => {
    loopRef.current?.stop();
    loopRef.current = null;
    // Animate back to 0 smoothly instead of snapping
    Animated.timing(rotation, {
      toValue:         0,
      duration:        150,
      easing:          Easing.out(Easing.ease),
      useNativeDriver: true,
    }).start();
  }, [rotation]);

  const startLoop = useCallback(() => {
    loopRef.current?.stop();
    rotation.setValue(0);
    loopRef.current = Animated.loop(
      Animated.timing(rotation, {
        toValue:         1,
        duration:        600,
        easing:          Easing.linear,
        useNativeDriver: true,
      }),
    );
    loopRef.current.start();
  }, [rotation]);

  // loading prop is the single source of truth
  useEffect(() => {
    if (loading) {
      startLoop();
    } else {
      stopSpin();
    }
    return () => {
      loopRef.current?.stop();
    };
  }, [loading]); // eslint-disable-line react-hooks/exhaustive-deps

  // On press: do one quick spin then hand off to loading state
  const handlePress = useCallback(() => {
    // One 360° spin immediately for instant feedback
    loopRef.current?.stop();
    rotation.setValue(0);
    Animated.timing(rotation, {
      toValue:         1,
      duration:        400,
      easing:          Easing.out(Easing.ease),
      useNativeDriver: true,
    }).start(({ finished }) => {
      // After the single spin, if loading is now true → start the loop
      // The useEffect will handle this automatically
    });
    onPress();
  }, [rotation, onPress]);

  const spin = rotation.interpolate({
    inputRange:  [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <Pressable
      onPress={handlePress}
      disabled={loading}
      style={({ pressed }) => ({
        alignItems:        'center',
        justifyContent:    'center',
        height:            44,
        paddingHorizontal: 12,
        borderRadius:      10,
        backgroundColor:   pressed
          ? (isDark ? '#475569' : '#d1d5db')
          : (isDark ? '#334155' : '#e5e7eb'),
        opacity: loading ? 0.7 : 1,
      })}
    >
      <View style={{ alignItems: 'center', gap: 2 }}>
        <Animated.View style={{ transform: [{ rotate: spin }] }}>
          <Text style={{ fontSize: 16, lineHeight: 18 }}>🔄</Text>
        </Animated.View>
        <Text style={{
          fontSize:   12,
          fontWeight: '800',
          color:      isDark ? '#e2e8f0' : '#374151',
        }}>
          {loading ? loadingLabel : label}
        </Text>
      </View>
    </Pressable>
  );
};

export default RefreshButton;
