import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useThemeColors, useIsDark } from '@/src/constants/theme';

export interface LoginControlsProps {
  isRtl:           boolean;
  onToggleRtl:     () => void;
  onToggleTheme:   () => void;
}

/**
 * LoginControls — top-right floating controls on the login screen.
 * RTL toggle + theme (dark/light) toggle.
 */
const LoginControls: React.FC<LoginControlsProps> = ({
  isRtl, onToggleRtl, onToggleTheme,
}) => {
  const c      = useThemeColors();
  const isDark = useIsDark();

  return (
    <View style={styles.container}>
      <Pressable
        style={[styles.btn, { backgroundColor: c.surface.elevated }]}
        onPress={onToggleRtl}
        accessibilityRole="button"
        accessibilityLabel={isRtl ? 'Switch to LTR' : 'Switch to RTL'}
      >
        <Text style={{ fontSize: 16, fontWeight: 'bold', color: c.text.primary }}>
          {isRtl ? 'LTR' : 'RTL'}
        </Text>
      </Pressable>

      <Pressable
        style={[styles.btn, { backgroundColor: c.surface.elevated }]}
        onPress={onToggleTheme}
        accessibilityRole="button"
        accessibilityLabel={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      >
        <Text style={{ fontSize: 18 }}>{isDark ? '☀️' : '🌙'}</Text>
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { position: 'absolute', top: 12, right: 16, zIndex: 10, flexDirection: 'row', gap: 8 },
  btn:       { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
});

export default LoginControls;
