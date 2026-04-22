import React, { useState } from 'react';
import {
  Modal, View, Text, Pressable, StyleSheet,
  Clipboard,
} from 'react-native';
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
  isDark?:      boolean;
}

/**
 * AlertDialog — production-grade modal alert.
 *
 * Features:
 * - Colored top stripe + icon badge
 * - Title + subtitle + message
 * - Optional copy-to-clipboard button on message
 * - Configurable action buttons (primary / secondary / ghost)
 * - Dark mode support
 */
const AlertDialog: React.FC<AlertDialogProps> = ({
  visible,
  onClose,
  accentColor = '#ef4444',
  icon        = '⚠️',
  title,
  subtitle,
  message,
  copyable    = false,
  extra,
  actions,
  actionsOverride,
  isDark      = false,
}) => {
  const [copied, setCopied] = useState(false);
  const { isRtl } = useDirection();

  const cardBg    = isDark ? '#1e293b' : '#ffffff';
  const titleCol  = isDark ? '#f1f5f9' : '#0f172a';
  const msgCol    = isDark ? '#94a3b8' : '#64748b';
  const msgBg     = isDark ? '#0f172a' : '#f8fafc';
  const borderCol = isDark ? '#334155' : '#e2e8f0';

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
        <Pressable onPress={() => {}} style={[styles.card, { backgroundColor: cardBg, direction: isRtl ? 'rtl' : 'ltr' }]}>

          {/* Colored top stripe */}
          <View style={[styles.stripe, { backgroundColor: accentColor }]} />

          <View style={styles.body}>

            {/* Icon + title row */}
            <View style={styles.titleRow}>
              <View style={[styles.iconBadge, { backgroundColor: accentColor + '18' }]}>
                <Text style={styles.iconText}>{icon}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.title, { color: titleCol }]}>{title}</Text>
                {subtitle && (
                  <Text style={[styles.subtitle, { color: accentColor }]}>{subtitle}</Text>
                )}
              </View>
            </View>

            {/* Message — with optional copy button */}
            {message && (
              <View style={[styles.messageBox, { backgroundColor: msgBg, borderColor: borderCol }]}>
                <Text style={[styles.message, { color: msgCol }]}>{message}</Text>
                {copyable && (
                  <Pressable
                    onPress={handleCopy}
                    style={[styles.copyBtn, { borderColor: borderCol }]}
                  >
                    <Text style={{ fontSize: 14 }}>{copied ? '✅' : '📋'}</Text>
                    <Text style={[styles.copyLabel, { color: copied ? '#10b981' : (isDark ? '#64748b' : '#94a3b8') }]}>
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
                <View style={[styles.actions, { marginTop: 4, flexDirection: isRtl ? 'row-reverse' : 'row' }]}>
                  {actionsOverride}
                </View>
              )
              : (defaultActions.length > 0 && (
                <View style={[styles.actions, { flexDirection: isRtl ? 'row-reverse' : 'row' }]}>
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
          backgroundColor: pressed
            ? (isDark ? '#334155' : '#e2e8f0')
            : (isDark ? '#1e293b' : '#ffffff'),
          borderWidth: 1.5,
          borderColor: isDark ? '#475569' : '#d1d5db',
        },
        isGhost && {
          backgroundColor: pressed
            ? (isDark ? resolvedColor + '18' : resolvedColor + '10')
            : 'transparent',
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
        isPrimary   && { color: '#fff', letterSpacing: 0.3 },
        isSecondary && { color: isDark ? '#cbd5e1' : '#374151' },
        isGhost     && { color: resolvedColor },
      ]}>
        {action.label}
      </Text>
    </Pressable>
  );
};

const darken = (hex: string) => {
  const map: Record<string, string> = {
    '#ef4444': '#dc2626',
    '#3b82f6': '#2563eb',
    '#f59e0b': '#d97706',
    '#10b981': '#059669',
    '#8b5cf6': '#7c3aed',
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
  actions: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 4,
    paddingTop: 16,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(0,0,0,0.08)',
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
