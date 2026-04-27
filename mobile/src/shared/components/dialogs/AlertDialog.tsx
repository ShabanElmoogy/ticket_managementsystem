import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useThemeColors, FontSize, FontWeight } from '@/src/constants/theme';
import { DialogSheet } from './dialog.primitives';
import DialogButton from '@/src/shared/components/actions/DialogButton';

export interface AlertDialogAction {
  label:   string;
  onPress: () => void;
  /** 'primary' = filled accent, 'cancel' = bordered — default 'cancel' */
  variant?: 'primary' | 'cancel';
}

export interface AlertDialogProps {
  visible:      boolean;
  onClose:      () => void;
  accentColor?: string;
  icon?:        string;
  title:        string;
  subtitle?:    string;
  message?:     string;
  extra?:       React.ReactNode;
  actions?:     AlertDialogAction[];
  actionsOverride?: React.ReactNode;
}

const AlertDialog: React.FC<AlertDialogProps> = ({
  visible, onClose,
  accentColor, icon = '⚠️',
  title, subtitle, message,
  extra, actions, actionsOverride,
}) => {
  const c = useThemeColors();
  const accent = accentColor ?? c.buttons.danger.bg;

  const resolvedActions: AlertDialogAction[] = actions ?? [
    { label: 'OK', onPress: onClose, variant: 'primary' },
  ];

  return (
    <DialogSheet
      visible={visible}
      onClose={onClose}
      bg={c.surface.primary}
      shadowColor={c.shadow}
      shake={false}
    >
      {/* Accent stripe */}
      <View style={[styles.stripe, { backgroundColor: accent }]} />

      <View style={styles.body}>
        {/* Icon + title */}
        <View style={styles.titleRow}>
          <View style={[styles.iconBadge, { backgroundColor: accent + '20' }]}>
            <Text style={styles.iconText}>{icon}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.title, { color: c.text.primary }]}>{title}</Text>
            {!!subtitle && (
              <Text style={[styles.subtitle, { color: accent }]}>{subtitle}</Text>
            )}
          </View>
        </View>

        {/* Message */}
        {!!message && (
          <View style={[styles.messageBox, { backgroundColor: c.surface.secondary, borderColor: c.border.primary }]}>
            <Text style={[styles.message, { color: c.text.secondary }]}>{message}</Text>
          </View>
        )}

        {/* Extra slot */}
        {extra}

        {/* Actions */}
        <View style={[styles.actionsRow, { borderTopColor: c.border.primary }]}>
          {actionsOverride ?? resolvedActions.map((action, i) => {
            const isPrimary = action.variant === 'primary';
            return (
              <View key={i} style={{ flex: 1 }}>
                <DialogButton
                  label={action.label}
                  onPress={action.onPress}
                  style={isPrimary
                    ? { backgroundColor: accent }
                    : { backgroundColor: 'transparent', borderWidth: 1.5, borderColor: c.border.secondary }
                  }
                  labelStyle={isPrimary
                    ? { color: c.text.inverse }
                    : { color: c.text.secondary }
                  }
                />
              </View>
            );
          })}
        </View>
      </View>
    </DialogSheet>
  );
};

const styles = StyleSheet.create({
  stripe:     { height: 5, marginHorizontal: -20, marginTop: -20, marginBottom: 20, borderTopLeftRadius: 20, borderTopRightRadius: 20 },
  body:       { gap: 0 },
  titleRow:   { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16 },
  iconBadge:  { width: 48, height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  iconText:   { fontSize: FontSize['3xl'] },
  title:      { fontSize: FontSize.xl, fontWeight: FontWeight.extrabold, marginBottom: 2 },
  subtitle:   { fontSize: FontSize.sm, fontWeight: FontWeight.semibold },
  messageBox: { borderRadius: 12, borderWidth: 1, padding: 14, marginBottom: 16 },
  message:    { fontSize: FontSize.base, lineHeight: 20 },
  actionsRow: { flexDirection: 'row', gap: 10, paddingTop: 16, borderTopWidth: StyleSheet.hairlineWidth, marginTop: 8 },
});

export default AlertDialog;
