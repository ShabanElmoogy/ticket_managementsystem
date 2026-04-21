import React from 'react';
import { Modal, View, Text, Pressable, StyleSheet } from 'react-native';

export interface AlertDialogAction {
  label: string;
  onPress: () => void;
  /** 'primary' = colored fill, 'secondary' = muted fill. Default: 'secondary' */
  variant?: 'primary' | 'secondary';
  /** Override button background color */
  color?: string;
}

export interface AlertDialogProps {
  visible: boolean;
  onClose: () => void;
  /** Top stripe + icon background accent color. Default: '#ef4444' (red) */
  accentColor?: string;
  /** Emoji or text icon shown in the icon badge */
  icon?: string;
  title: string;
  subtitle?: string;
  message?: string;
  /** Optional extra content rendered below the message (e.g. count badge) */
  extra?: React.ReactNode;
  actions?: AlertDialogAction[];
  isDark?: boolean;
}

/**
 * AlertDialog — generic modal alert with:
 *   - Colored top stripe
 *   - Icon badge + title + subtitle
 *   - Message body
 *   - Optional extra slot (badges, counts, etc.)
 *   - Configurable action buttons
 *
 * Zero app logic — no store, no events, no routing.
 * Used by NetworkErrorDialog, and any other alert/warning/info modal.
 */
const AlertDialog: React.FC<AlertDialogProps> = ({
  visible,
  onClose,
  accentColor = '#ef4444',
  icon = '⚠️',
  title,
  subtitle,
  message,
  extra,
  actions,
  isDark = false,
}) => {
  const cardBg   = isDark ? '#1e293b' : '#ffffff';
  const titleCol = isDark ? '#f1f5f9' : '#0f172a';
  const msgCol   = isDark ? '#94a3b8' : '#64748b';

  const defaultActions: AlertDialogAction[] = actions ?? [
    { label: 'OK', onPress: onClose, variant: 'primary' },
  ];

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      {/* Backdrop — tap to dismiss */}
      <Pressable style={styles.backdrop} onPress={onClose}>
        {/* Card — stop tap propagation */}
        <Pressable onPress={() => {}} style={[styles.card, { backgroundColor: cardBg }]}>

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

            {/* Message */}
            {message && (
              <Text style={[styles.message, { color: msgCol }]}>{message}</Text>
            )}

            {/* Extra slot */}
            {extra}

            {/* Actions */}
            {defaultActions.length > 0 && (
              <View style={styles.actions}>
                {defaultActions.map((action, i) => (
                  <ActionButton
                    key={i}
                    action={action}
                    accentColor={accentColor}
                    isDark={isDark}
                  />
                ))}
              </View>
            )}
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
};

// ── Internal ActionButton ─────────────────────────────────────────────────────

interface ActionButtonProps {
  action: AlertDialogAction;
  accentColor: string;
  isDark: boolean;
}

const ActionButton: React.FC<ActionButtonProps> = ({ action, accentColor, isDark }) => {
  const isPrimary = action.variant === 'primary';

  return (
    <Pressable
      onPress={action.onPress}
      style={({ pressed }) => [
        styles.actionBtn,
        isPrimary
          ? { backgroundColor: pressed ? darken(action.color ?? accentColor) : (action.color ?? accentColor) }
          : { backgroundColor: pressed
              ? (isDark ? '#334155' : '#e2e8f0')
              : (isDark ? '#273549' : '#f1f5f9') },
      ]}
    >
      <Text style={[
        styles.actionLabel,
        { color: isPrimary ? '#fff' : (isDark ? '#e2e8f0' : '#374151') },
      ]}>
        {action.label}
      </Text>
    </Pressable>
  );
};

/** Naive darken — just adds '99' alpha for pressed state on colored buttons */
const darken = (hex: string) => {
  if (hex === '#ef4444') return '#dc2626';
  if (hex === '#3b82f6') return '#2563eb';
  if (hex === '#f59e0b') return '#d97706';
  if (hex === '#10b981') return '#059669';
  return hex;
};

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  card: {
    width: '100%',
    maxWidth: 340,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 16,
  },
  stripe: {
    height: 4,
  },
  body: {
    padding: 24,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  iconBadge: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  iconText: {
    fontSize: 22,
  },
  title: {
    fontSize: 16,
    fontWeight: '800',
  },
  subtitle: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 1,
  },
  message: {
    fontSize: 13,
    lineHeight: 20,
    marginBottom: 20,
  },
  actions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 4,
  },
  actionBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  actionLabel: {
    fontSize: 14,
    fontWeight: '700',
  },
});

export default AlertDialog;
