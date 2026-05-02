/**
 * AlertDialog — themed modal dialog with icon, title, message, and action buttons.
 *
 * Renders its own Modal — do NOT nest inside another Modal.
 * useThemeColors() is called here (before the Modal renders) — safe.
 *
 * @example
 * <AlertDialog
 *   visible={showAlert}
 *   onClose={() => setShowAlert(false)}
 *   title="Discard changes?"
 *   message="Your unsaved changes will be lost."
 *   icon="⚠️"
 *   accentColor={c.intent.warning}
 *   actions={[
 *     { label: 'Discard',      onPress: handleDiscard,          variant: 'primary' },
 *     { label: 'Keep editing', onPress: () => setShowAlert(false), variant: 'cancel' },
 *   ]}
 * />
 */
import React, { useEffect, useRef } from 'react';
import { Modal, View, Text, Pressable, StyleSheet } from 'react-native';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { Animated } = require('react-native') as { Animated: any };
const AnimatedView = Animated.View as any;
import { useThemeColors, FontSize, FontWeight, Radius } from '@/src/constants/theme';
import DialogButton from '@/src/shared/components/actions/DialogButton';

export interface AlertDialogAction {
  label:    string;
  onPress:  () => void;
  /** 'primary' = filled accent | 'cancel' = subtle bordered (default) */
  variant?: 'primary' | 'cancel';
}

export interface AlertDialogProps {
  visible:          boolean;
  onClose:          () => void;
  title:            string;
  icon?:            string;
  /** Accent color for stripe, icon badge, primary button — default blue */
  accentColor?:     string;
  subtitle?:        string;
  message?:         string;
  extra?:           React.ReactNode;
  actions?:         AlertDialogAction[];
  actionsOverride?: React.ReactNode;
}

const AlertDialog: React.FC<AlertDialogProps> = ({
  visible, onClose,
  title, icon = '⚠️', accentColor,
  subtitle, message,
  extra, actions, actionsOverride,
}) => {
  const c      = useThemeColors();
  const accent = accentColor ?? c.buttons.primary.bg;

  // Scale + fade in animation
  const scaleIn   = useRef(new Animated.Value(0.88)).current;
  const opacityIn = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!visible) return;
    scaleIn.setValue(0.88);
    opacityIn.setValue(0);
    Animated.parallel([
      Animated.spring(scaleIn,   { toValue: 1, useNativeDriver: true, tension: 200, friction: 12 }),
      Animated.timing(opacityIn, { toValue: 1, duration: 160, useNativeDriver: true }),
    ]).start();
  }, [visible]); // eslint-disable-line react-hooks/exhaustive-deps

  const resolvedActions: AlertDialogAction[] = actions ?? [
    { label: 'OK',     onPress: onClose, variant: 'primary' },
    { label: 'Cancel', onPress: onClose, variant: 'cancel'  },
  ];

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <Pressable style={styles.backdrop} onPress={onClose}>
        <AnimatedView style={[styles.cardWrap, { transform: [{ scale: scaleIn }], opacity: opacityIn }]}>
          <Pressable
            style={[styles.card, { backgroundColor: c.surface.primary, shadowColor: c.shadow }]}
            onPress={() => {}}
          >
            {/* Accent stripe */}
            <View style={[styles.stripe, { backgroundColor: accent }]} />

            <View style={styles.body}>
              {/* Icon + title */}
              <View style={styles.titleRow}>
                <View style={[styles.iconBadge, { backgroundColor: accent + '22' }]}>
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
                {actionsOverride ?? resolvedActions.map((action) => {
                  const isPrimary = action.variant === 'primary';
                  return (
                    <View key={action.label} style={{ flex: 1 }}>
                      <DialogButton
                        label={action.label}
                        onPress={action.onPress}
                        style={isPrimary
                          ? {
                              backgroundColor: accent,
                              shadowColor:     accent,
                              shadowOffset:    { width: 0, height: 4 },
                              shadowOpacity:   0.35,
                              shadowRadius:    8,
                              elevation:       4,
                            }
                          : {
                              backgroundColor: c.surface.secondary,
                              borderWidth:     1.5,
                              borderColor:     c.border.secondary,
                            }
                        }
                        labelStyle={{ color: isPrimary ? '#ffffff' : c.text.secondary }}
                      />
                    </View>
                  );
                })}
              </View>
            </View>
          </Pressable>
        </AnimatedView>
      </Pressable>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop:   { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center', paddingHorizontal: 20 },
  cardWrap:   { width: '100%', maxWidth: 400 },
  card: {
    borderRadius:  Radius['2xl'],
    overflow:      'hidden',
    shadowOffset:  { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius:  20,
    elevation:     12,
  },
  stripe:     { height: 5, backgroundColor: 'transparent' },
  body:       { padding: 20, gap: 0 },
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
