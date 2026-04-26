import React, { useState } from 'react';
import { View, Text, Pressable, Platform, StyleSheet } from 'react-native';
import DateTimePicker, { type DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { useDirection } from '@/src/providers/DirectionProvider';
import { useThemeColors, FontSize, FontWeight, Radius } from '@/src/constants/theme';

interface Props {
  label?:       string;
  value:        string;
  onChange:     (iso: string) => void;
  placeholder?: string;
  error?:       string;
  minDate?:     Date;
  maxDate?:     Date;
}

const AppDatePicker: React.FC<Props> = ({
  label, value, onChange,
  placeholder = 'Select date', error,
  minDate, maxDate,
}) => {
  const [show, setShow] = useState(false);
  const { isRtl } = useDirection();
  const c = useThemeColors();

  const dateValue    = value ? new Date(value) : new Date();
  const displayValue = value
    ? new Date(value).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' })
    : '';

  const handleChange = (_event: DateTimePickerEvent, selected?: Date) => {
    if (Platform.OS === 'android') setShow(false);
    if (selected) onChange(selected.toISOString().split('T')[0]);
  };

  const borderColor  = error ? c.intent.error : c.border.secondary;
  const labelColor   = error ? c.intent.error : c.text.secondary;

  return (
    <View style={{ marginBottom: 12 }}>
      {label && (
        <Text style={{ fontSize: FontSize.base, fontWeight: FontWeight.semibold, marginBottom: 4, color: labelColor, textAlign: isRtl ? 'right' : 'left' }}>
          {label}
        </Text>
      )}

      <Pressable
        onPress={() => setShow(true)}
        style={[styles.field, { borderColor, backgroundColor: c.surface.primary }]}
      >
        <Text style={{ fontSize: FontSize.xl, marginHorizontal: 10 }}>📅</Text>
        <Text style={[styles.valueText, { color: displayValue ? c.text.primary : c.text.muted, flex: 1 }]}>
          {displayValue || placeholder}
        </Text>
        {!!value && (
          <Pressable onPress={() => { onChange(''); setShow(false); }} style={{ padding: 10 }} accessibilityLabel="Clear date">
            <Text style={{ color: c.text.muted, fontSize: FontSize.xl }}>✕</Text>
          </Pressable>
        )}
      </Pressable>

      {error && (
        <Text style={{ fontSize: FontSize.xs, color: c.intent.error, marginTop: 4, textAlign: isRtl ? 'right' : 'left' }}>
          {error}
        </Text>
      )}

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

      {show && Platform.OS === 'ios' && (
        <Pressable onPress={() => setShow(false)} style={[styles.iosDoneBtn, { backgroundColor: c.interactive.primary }]}>
          <Text style={[styles.iosDoneText, { color: c.text.inverse }]}>Done</Text>
        </Pressable>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  field: {
    flexDirection: 'row', alignItems: 'center',
    borderWidth: 2, borderRadius: Radius.lg,
    minHeight: 44, overflow: 'hidden',
  },
  valueText: {
    fontSize: FontSize.lg, paddingVertical: 10,
  },
  iosDoneBtn: {
    alignSelf: 'flex-end', paddingHorizontal: 16, paddingVertical: 8,
    marginTop: 4, borderRadius: Radius.md,
  },
  iosDoneText: {
    fontWeight: FontWeight.bold, fontSize: FontSize.md,
  },
});

export default AppDatePicker;
