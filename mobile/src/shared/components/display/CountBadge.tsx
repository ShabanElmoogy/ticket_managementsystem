import React from 'react';
import { View, Text } from 'react-native';
import { useThemeColors, FontSize, FontWeight, Radius } from '@/src/constants/theme';

interface Props {
  count:       number;
  total?:      number;
  isFiltered?: boolean;
}

const CountBadge: React.FC<Props> = ({ count, total, isFiltered = false }) => {
  const c = useThemeColors();
  const color = isFiltered ? c.intent.warning : c.interactive.primary;
  return (
    <View style={{
      paddingHorizontal: 8, paddingVertical: 1, borderRadius: Radius.md,
      backgroundColor: color + '22',
    }}>
      <Text style={{ fontSize: FontSize.xs, fontWeight: FontWeight.bold, color }}>
        {isFiltered && total != null ? `${count} / ${total}` : `${count} rows`}
      </Text>
    </View>
  );
};

export default CountBadge;
