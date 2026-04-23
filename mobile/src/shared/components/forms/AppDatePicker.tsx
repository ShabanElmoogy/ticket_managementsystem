import React, { useState } from 'react';
import { View, Text, Pressable, Platform, StyleSheet } from 'react-native';
import DateTimePicker, { type DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { useDirection } from '../../../providers/DirectionProvider';

interface Props {
  label?:       string;
  value:        string;           // ISO date string "YYYY-MM-DD" or ""
  onChange:     (iso: string) => void;
  placeholder?: string;
  error?:       string;
  isDark?:      boolean;
  minDate?:     Date;
  maxDate?:     Date;
}

/**
 * AppDatePicker — native OS date picker wrapped in a pressable field.
 *
 * - Shows the native Android/iOS date picker on press
 * - Stores value as "YYYY-MM-DD" ISO string
 * - Displays formatted date in the field
 * - Supports clear (✕ button)
 */
const AppDatePicker: React.FC<Props> = ({
  label,
  value,
  onChange,
  placeholder = 'Select date',
  error,
  isDark = false,
  minDate,
  maxDate,
}) => {
  const [show, setShow] = useState(false);
  const { isRtl } = useDirection();

  // Parse stored ISO string → Date object for the picker
  const dateValue = value ? new Date(value) : new Date();

  // Format for display: DD/MM/YYYY
  const displayValue = value
    ? new Date(value).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' })
    : '';

  const handleChange = (_event: DateTimePickerEvent, selected?: Date) => {
    // On Android the picker closes automatically; on iOS it stays open
    if (Platform.OS === 'android') setShow(false);

    if (selected) {
      // Store as YYYY-MM-DD
      const iso = selected.toISOString().split('T')[0];
      onChange(iso);
    }
  };

  const handleClear = () => {
    onChange('');
    setShow(false);
  };

  const borderColor = error ? '#ef4444' : '#d1d5db';
  const bg          = isDark ? '#1e293b' : '#ffffff';
  const textColor   = isDark ? '#f1f5f9' : '#111827';
  const placeholderColor = isDark ? '#475569' : '#9ca3af';
  const labelColor  = error ? '#ef4444' : (isDark ? '#e2e8f0' : '#374151');

  return (
    <View style={{ marginBottom: 12 }}>
      {label && (
        <Text style={{ fontSize: 13, fontWeight: '600', marginBottom: 4, color: labelColor, textAlign: isRtl ? 'right' : 'left' }}>
          {label}
        </Text>
      )}

      <Pressable
        onPress={() => setShow(true)}
        style={[
          styles.field,
          {
            borderColor,
            backgroundColor: bg,
          },
        ]}
      >
        {/* Calendar icon */}
        <Text style={{ fontSize: 16, marginHorizontal: 10 }}>📅</Text>

        {/* Date text or placeholder */}
        <Text style={[styles.valueText, { color: displayValue ? textColor : placeholderColor, flex: 1 }]}>
          {displayValue || placeholder}
        </Text>

        {/* Clear button */}
        {!!value && (
          <Pressable onPress={handleClear} style={{ padding: 10 }} accessibilityLabel="Clear date">
            <Text style={{ color: '#9ca3af', fontSize: 16 }}>✕</Text>
          </Pressable>
        )}
      </Pressable>

      {/* Error message */}
      {error && (
        <Text style={{ fontSize: 11, color: '#ef4444', marginTop: 4, textAlign: isRtl ? 'right' : 'left' }}>
          {error}
        </Text>
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
          onTouchCancel={() => setShow(false)}
        />
      )}

      {/* iOS: Done button to close the spinner */}
      {show && Platform.OS === 'ios' && (
        <Pressable
          onPress={() => setShow(false)}
          style={styles.iosDoneBtn}
        >
          <Text style={styles.iosDoneText}>Done</Text>
        </Pressable>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 2,
    borderRadius: 10,
    minHeight: 44,
    overflow: 'hidden',
  },
  valueText: {
    fontSize: 15,
    paddingVertical: 10,
  },
  iosDoneBtn: {
    alignSelf: 'flex-end',
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginTop: 4,
    backgroundColor: '#3b82f6',
    borderRadius: 8,
  },
  iosDoneText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 14,
  },
});

export default AppDatePicker;
