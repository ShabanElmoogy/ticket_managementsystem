import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import type { BaseToastProps } from 'react-native-toast-message';
import { Palette, Colors } from '@/src/constants/tokens';
import { useUiStore } from '@/src/stores/uiStore';
import { useColorScheme } from 'react-native';

// ── Resolve colors outside hook — safe for toast config ──────────────────────

function useToastColors() {
  const colorMode   = useUiStore((s) => s.colorMode);
  const systemScheme = useColorScheme();
  const isDark = colorMode === 'dark' ? true
               : colorMode === 'light' ? false
               : systemScheme === 'dark';
  return isDark ? Colors.light : Colors.dark;
}

// ── Toast item ────────────────────────────────────────────────────────────────

interface ToastItemProps extends BaseToastProps {
  accentColor: string;
  icon:        string;
}

const ToastItem: React.FC<ToastItemProps> = ({
  text1, text2, accentColor, icon, onPress,
}) => {
  const c = useToastColors();

  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.container,
        {
          backgroundColor: c.surface.primary,
          borderLeftColor: accentColor,
          shadowColor:     c.shadow,
        },
      ]}
    >
      {/* Icon badge */}
      <View style={[styles.iconWrap, { backgroundColor: accentColor + '22' }]}>
        <Text style={styles.iconText}>{icon}</Text>
      </View>

      {/* Text */}
      <View style={styles.textWrap}>
        {!!text1 && (
          <Text style={[styles.text1, { color: c.text.primary }]} numberOfLines={2}>
            {text1}
          </Text>
        )}
        {!!text2 && (
          <Text style={[styles.text2, { color: c.text.secondary }]} numberOfLines={2}>
            {text2}
          </Text>
        )}
      </View>
    </Pressable>
  );
};

// ── Toast config — pass to <Toast config={toastConfig} /> in root layout ──────

export const toastConfig = {
  success: (props: BaseToastProps) => (
    <ToastItem {...props} accentColor={Palette.green500} icon="✅" />
  ),
  error: (props: BaseToastProps) => (
    <ToastItem {...props} accentColor={Palette.red500}   icon="❌" />
  ),
  info: (props: BaseToastProps) => (
    <ToastItem {...props} accentColor={Palette.blue500}  icon="ℹ️" />
  ),
};

// ── Styles — static layout only, colors applied inline ───────────────────────

const styles = StyleSheet.create({
  container: {
    flexDirection:     'row',
    alignItems:        'center',
    borderRadius:      14,
    borderLeftWidth:   5,
    paddingVertical:   12,
    paddingHorizontal: 14,
    marginHorizontal:  16,
    gap:               12,
    shadowOffset:      { width: 0, height: 4 },
    shadowOpacity:     0.15,
    shadowRadius:      12,
    elevation:         8,
    minHeight:         56,
  },
  iconWrap: {
    width:          36,
    height:         36,
    borderRadius:   10,
    alignItems:     'center',
    justifyContent: 'center',
  },
  iconText: { fontSize: 18 },
  textWrap: { flex: 1 },
  text1:    { fontSize: 14, fontWeight: '700' },
  text2:    { fontSize: 12, marginTop: 2 },
});
