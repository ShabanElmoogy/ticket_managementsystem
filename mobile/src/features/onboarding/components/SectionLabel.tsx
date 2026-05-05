import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { IoniconName } from '@/src/components/layout/header/navItems';

interface Props {
  icon:          IoniconName;
  title:         string;
  subtitle:      string;
  accentColor:   string;
  textColor:     string;
  subtitleColor: string;
  textAlign:     'left' | 'right';
}

/**
 * SectionLabel — icon + title + subtitle header for each settings group.
 * Modal-safe: no hooks. All colors passed as props.
 */
const SectionLabel: React.FC<Props> = ({
  icon, title, subtitle, accentColor, textColor, subtitleColor, textAlign,
}) => (
  <View style={styles.container}>
    <View style={styles.row}>
      <View style={[styles.iconWrap, { backgroundColor: accentColor + '18' }]}>
        <Ionicons name={icon} size={16} color={accentColor} />
      </View>
      <Text style={[styles.title, { color: textColor, textAlign }]}>{title}</Text>
    </View>
    <Text style={[styles.subtitle, { color: subtitleColor, textAlign }]}>{subtitle}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: { marginBottom: 14 },
  row:       { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  iconWrap:  { width: 28, height: 28, borderRadius: 8, alignItems: 'center', justifyContent: 'center', marginEnd: 10 },
  title:     { fontSize: 16, fontWeight: '700', letterSpacing: 0.2, flex: 1 },
  subtitle:  { fontSize: 13, lineHeight: 18, letterSpacing: 0.1, paddingStart: 38 },
});

export default SectionLabel;
