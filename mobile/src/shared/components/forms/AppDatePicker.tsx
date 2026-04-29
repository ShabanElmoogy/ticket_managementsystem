/**
 * AppDatePicker — native OS date picker with label, error, and clear button.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * BEHAVIOR
 * ─────────────────────────────────────────────────────────────────────────────
 *   - Stores value as ISO date string: 'YYYY-MM-DD'
 *   - Displays using tenant's date format (from tenantStore via formatDate())
 *   - Android: native date picker dialog
 *   - iOS: inline spinner with Done button
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * ⚠️ MODAL RULE
 * ─────────────────────────────────────────────────────────────────────────────
 * Calls useThemeColors() and useDirection() internally.
 * Do NOT use inside a <Modal> — use only in screen-level forms.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * WHERE IT IS USED
 * ─────────────────────────────────────────────────────────────────────────────
 *   CustomerForm — subscriptionStartDate, subscriptionEndDate
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * USAGE
 * ─────────────────────────────────────────────────────────────────────────────
 *   <AppDatePicker
 *     label="Start Date"
 *     value={fields.startDate}          // 'YYYY-MM-DD' or ''
 *     onChange={(iso) => handleChange('startDate', iso)}
 *     placeholder="Select date"
 *     error={errors.startDate}
 *     minDate={new Date()}
 *     required
 *   />
 */

import React, { useState } from 'react';
import { View, Text, Pressable, Platform, StyleSheet, type ViewStyle } from 'react-native';
import DateTimePicker, { type DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { useTranslation } from 'react-i18next';
import { useDirection } from '@/src/providers/DirectionProvider';
import { useThemeColors, FontSize, FontWeight, Radius } from '@/src/constants/theme';
import { formatDate } from '@/src/shared/utils/dateUtils';

interface AppDatePickerProps {
  label?:          string;
  value:           string;           // ISO date: 'YYYY-MM-DD' or ''
  onChange:        (iso: string) => void;
  placeholder?:    string;
  error?:          string;
  required?:       boolean;
  minDate?:        Date;
  maxDate?:        Date;
  containerStyle?: ViewStyle;
}

const AppDatePicker: React.FC<AppDatePickerProps> = ({
  label, value, onChange,
  placeholder, error,
  required = false,
  minDate, maxDate,
  containerStyle,
}) => {
  const [show, setShow] = useState(false);
  const { isRtl }       = useDirection();
  const { t }           = useTranslation();
  const c               = useThemeColors();

  const resolvedPlaceholder = placeholder ?? t('customers.form.datePlaceholder');

  // Parse stored ISO string to Date for the picker
  const dateValue = value ? new Date(value) : new Date();

  // Display using tenant's date format (respects dd/MM/yyyy, MM/dd/yyyy, etc.)
  const displayValue = value ? formatDate(value) : '';

  const handleChange = (_event: DateTimePickerEvent, selected?: Date) => {
    // Android closes automatically; iOS stays open until Done is pressed
    if (Platform.OS === 'android') setShow(false);
    if (_event.type === 'dismissed') { setShow(false); return; }
    if (selected) onChange(selected.toISOString().split('T')[0]);
  };

  const borderColor = error ? c.intent.error : c.border.secondary;
  const labelColor  = error ? c.intent.error : c.text.secondary;

  return (
    <View style={[{ marginBottom: 12 }, containerStyle]}>
      {/* Label */}
      {label && (
        <Text style={{
          fontSize:   FontSize.sm,
          fontWeight: FontWeight.semibold,
          marginBottom: 6,
          color:      labelColor,
          textAlign:  isRtl ? 'right' : 'left',
        }}>
          {label}
          {required && <Text style={{ color: c.intent.error }}> *</Text>}
        </Text>
      )}

      {/* Trigger row */}
      <Pressable
        onPress={() => setShow(true)}
        accessibilityRole="button"
        accessibilityLabel={label ?? resolvedPlaceholder}
        style={[styles.field, { borderColor, backgroundColor: c.surface.primary }]}
      >
        <Text style={{ fontSize: FontSize.xl, marginHorizontal: 10 }}>📅</Text>
        <Text style={[styles.valueText, { color: displayValue ? c.text.primary : c.text.muted, flex: 1 }]}>
          {displayValue || resolvedPlaceholder}
        </Text>
        {!!value && (
          <Pressable
            onPress={() => { onChange(''); setShow(false); }}
            style={{ padding: 10 }}
            accessibilityLabel={t('common.cancel')}
          >
            <View style={[styles.clearIcon, { backgroundColor: c.text.muted + '30' }]}>
              <Text style={{ fontSize: 10, color: c.text.muted, fontWeight: FontWeight.bold }}>✕</Text>
            </View>
          </Pressable>
        )}
      </Pressable>

      {/* Error message */}
      {error && (
        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 5, gap: 4 }}>
          <Text style={{ fontSize: 11, color: c.intent.error }}>⚠</Text>
          <Text style={{ fontSize: FontSize.xs, color: c.intent.error, flex: 1, textAlign: isRtl ? 'right' : 'left' }}>
            {error}
          </Text>
        </View>
      )}

      {/* Native date picker */}
      {show && (
        <DateTimePicker
          value={dateValue}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={handleChange}
          minimumDate={minDate}
          maximumDate={maxDate}
        />
      )}

      {/* iOS Done button — closes the inline spinner */}
      {show && Platform.OS === 'ios' && (
        <Pressable
          onPress={() => setShow(false)}
          style={[styles.iosDoneBtn, { backgroundColor: c.interactive.primary }]}
          accessibilityRole="button"
        >
          <Text style={[styles.iosDoneText, { color: c.text.inverse }]}>
            {t('common.ok')}
          </Text>
        </Pressable>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  field: {
    flexDirection: 'row',
    alignItems:    'center',
    borderWidth:   2,
    borderRadius:  Radius.xl,
    minHeight:     48,
    overflow:      'hidden',
  },
  valueText: {
    fontSize:       FontSize.md,
    paddingVertical: 12,
  },
  clearIcon: {
    width:          18,
    height:         18,
    borderRadius:   9,
    alignItems:     'center',
    justifyContent: 'center',
  },
  iosDoneBtn: {
    alignSelf:        'flex-end',
    paddingHorizontal: 20,
    paddingVertical:   9,
    marginTop:         6,
    borderRadius:      Radius.lg,
  },
  iosDoneText: {
    fontWeight: FontWeight.bold,
    fontSize:   FontSize.md,
  },
});

export default AppDatePicker;
