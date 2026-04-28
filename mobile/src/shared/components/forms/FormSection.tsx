import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useThemeColors, FontSize, FontWeight, Radius } from '@/src/constants/theme';

export interface FormSectionProps {
  title:     string;
  icon?:     string;
  children?: React.ReactNode;
  last?:     boolean;
}

const FormSection: React.FC<FormSectionProps> = ({ title, icon, children, last = false }) => {
  const c = useThemeColors();

  return (
    <View style={[styles.section, !last && { marginBottom: 8 }]}>
      {/* Section header */}
      <View style={styles.header}>
        {icon && <Text style={styles.icon}>{icon}</Text>}
        <Text style={[styles.title, { color: c.text.secondary }]}>{title}</Text>
        <View style={[styles.divider, { backgroundColor: c.border.primary }]} />
      </View>

      {/* Card wrapper */}
      <View style={[styles.card, {
        backgroundColor: c.surface.primary,
        borderColor:     c.border.primary,
        shadowColor:     c.shadow,
      }]}>
        {children}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  section:  { marginBottom: 20 },
  header:   { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 10, paddingHorizontal: 2 },
  icon:     { fontSize: 13 },
  title:    { fontSize: FontSize.xs, fontWeight: FontWeight.bold, textTransform: 'uppercase', letterSpacing: 0.8 },
  divider:  { flex: 1, height: 1, marginStart: 4 },
  card: {
    borderRadius: Radius.xl, borderWidth: 1,
    padding: 16, paddingBottom: 4,
    shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 1,
  },
});

export default FormSection;
