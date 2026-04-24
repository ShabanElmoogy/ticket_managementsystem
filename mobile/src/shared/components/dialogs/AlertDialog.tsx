import React, { useState } from 'react';
import {
  Modal, View, Text, Pressable, StyleSheet,
  Clipboard,
} from 'react-native';
import { useThemeColors, useIsDark, Palette, Radius, FontSize, FontWeight } from '../../../constants/theme';
import { useDirection } from '../../../providers/DirectionProvider';

export interface AlertDialogAction {
  label:    string;
  onPress:  () => void;
  variant?: 'primary' | 'secondary' | 'ghost';
  color?:   string;
  icon?:    string;
}

export interface AlertDialogProps {
  visible:      boolean;
  onClose:      () => void;
  accentColor?: string;
  icon?:        string;
  title:        string;
  subtitle?:    string;
  message?:     string;
  /** Show a copy-to-clipboard button next to the message */
  copyable?:    boolean;
  extra?:       React.ReactNode;
  actions?:     AlertDialogAction[];
  /** Replaces the entire actions row with custom content */
  actionsOverride?: React.ReactNode;
  /** @deprecated — component reads theme internally via useThemeColors() */
  isDark?:      boolean;
}

const AlertDialog: React.FC<AlertDialogProps> = ({
  visible,
  onClose,
  accentColor = Palette.red500,
  icon        = '⚠️',
  title,
  subtitle,
  message,
  copyable    = false,
  extra,
  actions,
  actionsOverride,
}) => {
  const [copied, setCopied] = useState(false);
  const { isRtl } = useDirection();
  const c      = useThemeColors();
  const isDark = useIsDark();

  const handleCopy = () => {
    if (!message) return;
    Clipboard.setString(message);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const defaultActions: AlertDialogAction[] = actions ?? [
    { label: 'OK', onPress: onClose, variant: 'primary' },
  ];

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable onPress={() => {}} style={[styles.card, { backgroundColor: c.surface.primary, direction: isRtl ? 'rtl' : 'ltr' }]}>

          {/* Colored top stripe */}
          <View style={[styles.stripe, { backgroundColor: accentColor }]} />

          <View style={styles.body}>

            {/* Icon + title row */}
            <View style={styles.titleRow}>
              <View style={[styles.iconBadge, { backgroundColor: accentColor + '18' }]}>
                <Text style={styles.iconText}>{icon}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.title, { color: c.text.primary }]}>{title}</Text>
                {subtitle && (
                  <Text style={[styles.subtitle, { color: accentColor }]}>{subtitle}</Text>
                )}
              </View>
            </View>

            {/* Message — with optional copy button */}
            {message && (
              <View style={[styles.messageBox, { backgroundColor: c.surface.secondary, borderColor: c.border.primary }]}>
                <Text style={[styles.message, { color: c.text.secondary }]}>{message}</Text>
                {copyable && (
                  <Pressable
                    onPress={handleCopy}
                    style={[styles.copyBtn, { borderColor: c.border.primary }]}
                  >
                    <Text style={{ fontSize: FontSize.base }}>{copied ? '✅' : '📋'}</Text>
                    <Text style={[styles.copyLabel, { color: copied ? c.intent.success : c.text.muted }]}>
                      {copied ? 'Copied!' : 'Copy'}
                    </Text>
                  </Pressable>
                )}
              </View>
            )}

            {/* Extra slot */}
            {extra}

            {/* Actions — override takes priority */}
            {actionsOverride
              ? (
                <View style={[styles.actionsBase, { marginTop: 4 }]}>
                  {actionsOverride}
                </View>
              )
              : (defaultActions.length > 0 && (
                <View style={[styles.actionsBase, styles.actionsRow, { flexDirection: isRtl ? 'row-reverse' : 'row' }]}>
                  {defaultActions.map((action, i) => (
                    <ActionButton
                      key={i}
                      action={action}
                      accentColor={accentColor}
                      isDark={isDark}
                    />
                  ))}
                </View>
              ))
            }
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
};

// ── ActionButton ──────────────────────────────────────────────────────────────

interface ActionButtonProps {
  action:      AlertDialogAction;
  accentColor: string;
  isDark:      boolean;
}

const ActionButton: React.FC<ActionButtonProps> = ({ action, accentColor, isDark }) => {
  const isPrimary   = action.variant === 'primary';
  const isSecondary = action.variant === 'secondary' || !action.variant;
  const isGhost     = action.variant === 'ghost';
  const c           = useThemeColors();

  const resolvedColor = action.color ?? accentColor;

  return (
    <Pressable
      onPress={action.onPress}
      style={({ pressed }) => [
        styles.actionBtn,
        isPrimary && {
          backgroundColor: pressed ? darken(resolvedColor) : resolvedColor,
          shadowColor: resolvedColor,
          shadowOffset: { width: 0, height: pressed ? 1 : 4 },
          shadowOpacity: pressed ? 0.1 : 0.35,
          shadowRadius: pressed ? 2 : 8,
          elevation: pressed ? 1 : 4,
          transform: [{ scale: pressed ? 0.97 : 1 }],
        },
        isSecondary && {
          backgroundColor: pressed ? c.interactive.pressed : c.surface.primary,
          borderWidth: 1.5,
          borderColor: c.border.secondary,
        },
        isGhost && {
          backgroundColor: pressed ? resolvedColor + '18' : 'transparent',
        },
      ]}
    >
      {action.icon && (
        <Text style={[styles.actionIcon, isSecondary && { opacity: 0.7 }]}>
          {action.icon}
        </Text>
      )}
      <Text style={[
        styles.actionLabel,
        isPrimary   && { color: c.text.inverse, letterSpacing: 0.3 },
        isSecondary && { color: c.text.secondary },
        isGhost     && { color: resolvedColor },
      ]}>
        {action.label}
      </Text>
    </Pressable>
  );
};

const darken = (hex: string) => {
  const map: Record<string, string> = {
    [Palette.red500]:    Palette.red600,
    [Palette.blue500]:   Palette.blue600,
    [Palette.amber500]:  Palette.amber600,
    [Palette.green500]:  Palette.green600,
    [Palette.violet500]: Palette.violet600,
  };
  return map[hex] ?? hex;
};

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  card: {
    width: '100%',
    maxWidth: 360,
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.35,
    shadowRadius: 24,
    elevation: 20,
  },
  stripe: {
    height: 5,
  },
  body: {
    padding: 24,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 12,
  },
  iconBadge: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconText: {
    fontSize: 24,
  },
  title: {
    fontSize: 17,
    fontWeight: '800',
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 12,
    fontWeight: '600',
  },
  messageBox: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 14,
    marginBottom: 20,
    gap: 10,
  },
  message: {
    fontSize: 13,
    lineHeight: 20,
  },
  copyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-end',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
  },
  copyLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  actionsBase: {
    marginTop: 4,
    paddingTop: 16,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(0,0,0,0.08)',
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 16,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    paddingVertical: 18,
    paddingHorizontal: 10,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    minHeight: 58,
  },
  actionIcon: {
    fontSize: 18,
  },
  actionLabel: {
    fontSize: 16,
    fontWeight: '700',
  },
});

export default AlertDialog;
