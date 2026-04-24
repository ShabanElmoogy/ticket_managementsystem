import React, { useState, useEffect, useRef } from 'react';
import { Modal, View, Text, Pressable, TextInput, type TextInput as TextInputType } from 'react-native';
import AppButton from '../forms/AppButton';
import { useThemeColors, Radius, FontSize, FontWeight, Palette } from '../../../constants/theme';

export interface AppConfirmDialogProps {
  open:           boolean;
  onClose:        () => void;
  onConfirm:      () => void;
  title?:         string;
  message?:       string;
  confirmWord?:   string;
  loading?:       boolean;
  errorText?:     string;
  confirmLabel?:  string;
  cancelLabel?:   string;
  confirmColor?:  'error' | 'warning' | 'primary';
}

const AppConfirmDialog: React.FC<AppConfirmDialogProps> = ({
  open,
  onClose,
  onConfirm,
  title         = 'Confirm Action',
  message,
  confirmWord   = 'DELETE',
  loading       = false,
  errorText,
  confirmLabel  = 'Delete Related Data',
  cancelLabel   = 'Cancel',
  confirmColor  = 'error',
}) => {
  const c = useThemeColors();

  const [value, setValue] = useState('');
  const inputRef = useRef<TextInputType>(null);
  const isValid  = value.trim() === confirmWord;

  useEffect(() => {
    if (!open) setValue('');
    else setTimeout(() => inputRef.current?.focus(), 150);
  }, [open]);

  return (
    <Modal visible={open} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable
        style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', justifyContent: 'center', alignItems: 'center', paddingHorizontal: 20 }}
        onPress={onClose}
      >
        <Pressable
          style={{
            backgroundColor: c.surface.primary,
            borderRadius:    Radius['2xl'],
            padding:         20,
            width:           '100%',
            maxWidth:        400,
            shadowColor:     c.shadow,
            shadowOffset:    { width: 0, height: 4 },
            shadowOpacity:   0.2,
            shadowRadius:    12,
            elevation:       8,
          }}
          onPress={() => {}}
        >
          {/* ── Title row ── */}
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 }}>
            <View style={{
              width: 40, height: 40, borderRadius: Radius.full,
              backgroundColor: c.intent.errorSurface,
              alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}>
              <Text style={{ fontSize: FontSize['2xl'] }}>⚠️</Text>
            </View>
            <Text style={{ fontSize: FontSize.xl, fontWeight: FontWeight.bold, color: c.text.primary, flex: 1 }}>
              {title}
            </Text>
          </View>

          {/* ── Message ── */}
          {message && (
            <Text style={{ fontSize: FontSize.md, color: c.text.secondary, marginBottom: 12, lineHeight: 20 }}>
              {message}
            </Text>
          )}

          {/* ── Error banner ── */}
          {errorText && (
            <View style={{
              backgroundColor: c.intent.warningSurface,
              borderWidth: 1, borderColor: c.intent.warning + '55',
              borderRadius: Radius.md, padding: 12, marginBottom: 12,
            }}>
              <Text style={{ fontSize: FontSize.base, color: c.intent.warning }}>⚠️  {errorText}</Text>
            </View>
          )}

          {/* ── Irreversible note ── */}
          <Text style={{ fontSize: FontSize.sm, color: c.text.muted, marginBottom: 14 }}>
            This action will also delete related data and cannot be undone.
          </Text>

          {/* ── Type-to-confirm ── */}
          <Text style={{ fontSize: FontSize.base, fontWeight: FontWeight.semibold, color: c.text.secondary, marginBottom: 6 }}>
            Type{' '}
            <Text style={{ fontWeight: FontWeight.extrabold, color: c.intent.error }}>{confirmWord}</Text>
            {' '}to confirm
          </Text>
          <TextInput
            ref={inputRef}
            value={value}
            onChangeText={setValue}
            placeholder={confirmWord}
            placeholderTextColor={c.text.muted}
            autoCapitalize="characters"
            autoCorrect={false}
            style={{
              borderWidth:       2,
              borderColor:       isValid ? c.intent.error : c.border.secondary,
              borderRadius:      Radius.md,
              paddingHorizontal: 12,
              paddingVertical:   10,
              fontSize:          FontSize.lg,
              fontWeight:        FontWeight.bold,
              color:             c.text.primary,
              backgroundColor:   c.surface.secondary,
              marginBottom:      20,
              letterSpacing:     1,
            }}
          />

          {/* ── Actions — stacked vertically ── */}
          <View style={{ gap: 8 }}>
            <AppButton
              variant="contained"
              color={confirmColor}
              onPress={onConfirm}
              disabled={!isValid || loading}
              loading={loading}
              loadingText={`${confirmLabel}…`}
              fullWidth
            >
              {confirmLabel}
            </AppButton>

            <AppButton variant="outlined" color="secondary" onPress={onClose} disabled={loading} fullWidth>
              {cancelLabel}
            </AppButton>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
};

export default AppConfirmDialog;
