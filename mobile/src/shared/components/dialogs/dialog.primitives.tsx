/**
 * dialog.primitives.tsx
 * All reusable dialog building blocks in one file.
 * Every component is dumb — no useThemeColors(), no context hooks.
 * Colors are always passed as props from the parent dialog.
 */
import React, { useEffect, useRef } from 'react';
import { Modal, View, Text, Pressable, ActivityIndicator, StyleSheet, type ViewStyle, type TextStyle } from 'react-native';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { Animated } = require('react-native') as { Animated: any };
const AnimatedView = Animated.View as any;
// eslint-disable-next-line @typescript-eslint/no-var-requires
const RN = require('react-native');
const TextInput = RN.TextInput as any;
import { Radius, FontSize, FontWeight } from '@/src/constants/tokens';

// ─────────────────────────────────────────────────────────────────────────────
// DialogSheet — animated Modal backdrop + card container
// ─────────────────────────────────────────────────────────────────────────────

export interface DialogSheetProps {
  visible:       boolean;
  onClose:       () => void;
  lockBackdrop?: boolean;
  bg:            string;
  shadowColor:   string;
  shake?:        boolean;
  children?:     React.ReactNode;
  style?:        ViewStyle;
}

export const DialogSheet: React.FC<DialogSheetProps> = ({
  visible, onClose, lockBackdrop = false,
  bg, shadowColor, shake = true, children, style,
}) => {
  const shakeX    = useRef(new Animated.Value(0)).current;
  const scaleIn   = useRef(new Animated.Value(0.85)).current;
  const opacityIn = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!visible) return;
    shakeX.setValue(0); scaleIn.setValue(0.85); opacityIn.setValue(0);
    Animated.parallel([
      Animated.spring(scaleIn,   { toValue: 1, useNativeDriver: true, tension: 180, friction: 10 }),
      Animated.timing(opacityIn, { toValue: 1, duration: 180, useNativeDriver: true }),
    ]).start(() => {
      if (!shake) return;
      Animated.sequence([
        Animated.timing(shakeX, { toValue: -8, duration: 55, useNativeDriver: true }),
        Animated.timing(shakeX, { toValue:  8, duration: 55, useNativeDriver: true }),
        Animated.timing(shakeX, { toValue: -6, duration: 50, useNativeDriver: true }),
        Animated.timing(shakeX, { toValue:  6, duration: 50, useNativeDriver: true }),
        Animated.timing(shakeX, { toValue: -3, duration: 45, useNativeDriver: true }),
        Animated.timing(shakeX, { toValue:  0, duration: 45, useNativeDriver: true }),
      ]).start();
    });
  }, [visible]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      <Pressable
        style={sheet.backdrop}
        onPress={lockBackdrop ? undefined : onClose}
      >
        <AnimatedView style={[sheet.card, { transform: [{ translateX: shakeX }, { scale: scaleIn }], opacity: opacityIn }]}>
          <Pressable
            style={[{ backgroundColor: bg, shadowColor, borderRadius: Radius['2xl'], padding: 20, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 12, elevation: 8 }, style]}
            onPress={() => {}}
          >
            {children}
          </Pressable>
        </AnimatedView>
      </Pressable>
    </Modal>
  );
};

const sheet = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', justifyContent: 'center', alignItems: 'center', paddingHorizontal: 20 },
  card:     { width: '100%', maxWidth: 400 },
});

// ─────────────────────────────────────────────────────────────────────────────
// DialogHeader — icon circle + title, with optional loading pulse
// ─────────────────────────────────────────────────────────────────────────────

export interface DialogHeaderProps {
  title:      string;
  icon?:      string;
  loading?:   boolean;
  iconBg:     string;
  iconColor:  string;
  titleColor: string;
  style?:     ViewStyle;
}

export const DialogHeader: React.FC<DialogHeaderProps> = ({
  title, icon = '⚠️', loading = false,
  iconBg, iconColor, titleColor, style,
}) => {
  const iconScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (!loading) { iconScale.setValue(1); return; }
    const pulse = Animated.loop(Animated.sequence([
      Animated.timing(iconScale, { toValue: 1.15, duration: 400, useNativeDriver: true }),
      Animated.timing(iconScale, { toValue: 1,    duration: 400, useNativeDriver: true }),
    ]));
    pulse.start();
    return () => pulse.stop();
  }, [loading]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <View style={[{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 }, style]}>
      <AnimatedView style={{ width: 44, height: 44, borderRadius: Radius.full, backgroundColor: iconBg, alignItems: 'center', justifyContent: 'center', transform: [{ scale: iconScale }] }}>
        {loading
          ? <ActivityIndicator size="small" color={iconColor} />
          : <Text style={{ fontSize: FontSize['2xl'] }}>{icon}</Text>
        }
      </AnimatedView>
      <Text style={{ fontSize: FontSize.xl, fontWeight: FontWeight.bold, color: titleColor, flex: 1 }}>
        {title}
      </Text>
    </View>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// DialogBanner — warning / info box
// ─────────────────────────────────────────────────────────────────────────────

export interface DialogBannerProps {
  message:     string;
  bg:          string;
  borderColor: string;
  textColor:   string;
  style?:      ViewStyle;
}

export const DialogBanner: React.FC<DialogBannerProps> = ({
  message, bg, borderColor, textColor, style,
}) => (
  <View style={[{ backgroundColor: bg, borderWidth: 1, borderColor, borderRadius: Radius.md, padding: 12, marginBottom: 12 }, style]}>
    <Text style={{ fontSize: FontSize.xs, color: textColor }}>⚠️  {message}</Text>
  </View>
);

// ─────────────────────────────────────────────────────────────────────────────
// DialogProgressBar — animated sliding bar shown during async ops
// ─────────────────────────────────────────────────────────────────────────────

export interface DialogProgressBarProps {
  color:  string;
  style?: ViewStyle;
}

export const DialogProgressBar: React.FC<DialogProgressBarProps> = ({ color, style }) => {
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const anim = Animated.loop(Animated.sequence([
      Animated.timing(progress, { toValue: 1, duration: 900, useNativeDriver: true }),
      Animated.timing(progress, { toValue: 0, duration: 0,   useNativeDriver: true }),
    ]));
    anim.start();
    return () => anim.stop();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const translateX = progress.interpolate({ inputRange: [0, 1], outputRange: [-260, 260] });

  return (
    <View style={[{ height: 3, borderRadius: 2, backgroundColor: color + '30', overflow: 'hidden', marginBottom: 16 }, style]}>
      <AnimatedView style={{ height: '100%', width: '40%', borderRadius: 2, backgroundColor: color, transform: [{ translateX }] }} />
    </View>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// DialogTextInput — styled type-to-confirm input
// ─────────────────────────────────────────────────────────────────────────────

export interface DialogTextInputProps {
  value:            string;
  onChangeText:     (text: string) => void;
  placeholder?:     string;
  autoCapitalize?:  'none' | 'sentences' | 'words' | 'characters';
  autoCorrect?:     boolean;
  borderColor:      string;
  textColor:        string;
  bg:               string;
  placeholderColor: string;
  style?:           TextStyle;
}

export const DialogTextInput: React.FC<DialogTextInputProps> = ({
  value, onChangeText, placeholder, autoCapitalize, autoCorrect,
  borderColor, textColor, bg, placeholderColor, style,
}) => (
  <TextInput
    value={value}
    onChangeText={onChangeText}
    placeholder={placeholder}
    placeholderTextColor={placeholderColor}
    autoCapitalize={autoCapitalize}
    autoCorrect={autoCorrect}
    style={[{
      borderWidth: 2, borderColor, borderRadius: Radius.md,
      paddingHorizontal: 12, paddingVertical: 10,
      fontSize: FontSize.lg, fontWeight: FontWeight.bold,
      color: textColor, backgroundColor: bg,
      marginBottom: 20, letterSpacing: 1,
    }, style]}
  />
);

