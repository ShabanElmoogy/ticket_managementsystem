import React from 'react';
import { View, Text } from 'react-native';

interface Props {
  count: number;
  total?: number;       // when provided shows "count / total" (filtered state)
  isFiltered?: boolean;
}

/**
 * Small pill badge showing a row/item count.
 * Turns amber when `isFiltered` is true to signal active filtering.
 * Shows "count / total" when both are provided and filtered.
 */
const CountBadge: React.FC<Props> = ({ count, total, isFiltered = false }) => (
  <View style={{
    paddingHorizontal: 8, paddingVertical: 1, borderRadius: 8,
    backgroundColor: isFiltered ? '#f59e0b22' : '#3b82f620',
  }}>
    <Text style={{ fontSize: 11, fontWeight: '700', color: isFiltered ? '#f59e0b' : '#3b82f6' }}>
      {isFiltered && total != null ? `${count} / ${total}` : `${count} rows`}
    </Text>
  </View>
);

export default CountBadge;
