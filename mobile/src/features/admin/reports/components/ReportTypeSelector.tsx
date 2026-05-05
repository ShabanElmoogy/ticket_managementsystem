import React from 'react';
import { Text, Pressable, ScrollView, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeColors, Radius, FontSize, FontWeight } from '@/src/constants/theme';
import { REPORT_TYPES, type ReportType } from '@/src/features/admin/reports/types';
import type { IoniconName } from '@/src/components/layout/header/navItems';

interface Props {
  value:    ReportType;
  onChange: (t: ReportType) => void;
}

const TYPE_META: Record<ReportType, { icon: IoniconName }> = {
  'summary':            { icon: 'bar-chart'   },
  'customers-status':   { icon: 'people'      },
  'customers-activity': { icon: 'trending-up' },
  'tickets':            { icon: 'ticket'      },
  'sla':                { icon: 'timer'       },
};

const ReportTypeSelector: React.FC<Props> = ({ value, onChange }) => {
  const c = useThemeColors();

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.row}
      accessibilityRole="radiogroup"
    >
      {REPORT_TYPES.map((rt) => {
        const isActive    = rt.id === value;
        const { icon }    = TYPE_META[rt.id];
        const color       = c.tint;

        return (
          <Pressable
            key={rt.id}
            onPress={() => onChange(rt.id)}
            accessibilityRole="radio"
            accessibilityState={{ selected: isActive }}
            accessibilityLabel={rt.label}
            style={[
              styles.chip,
              {
                backgroundColor:   isActive ? color + '18' : 'transparent',
                borderBottomWidth: isActive ? 2 : 0,
                borderBottomColor: isActive ? color : 'transparent',
              },
            ]}
          >
            <Ionicons
              name={icon}
              size={16}
              color={isActive ? color : c.text.secondary}
            />
            <Text style={[
              styles.label,
              {
                color:      isActive ? color : c.text.secondary,
                fontWeight: isActive ? FontWeight.semibold : FontWeight.normal,
              },
            ]}>
              {rt.label}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection:    'row',
    paddingHorizontal: 8,
    paddingTop:        8,
    gap:               2,
  },
  chip: {
    flexDirection:     'row',
    alignItems:        'center',
    gap:               6,
    paddingHorizontal: 12,
    paddingVertical:   9,
    borderRadius:      Radius.md,
    marginBottom:      4,
  },
  label: { fontSize: FontSize.sm },
});

export default ReportTypeSelector;
