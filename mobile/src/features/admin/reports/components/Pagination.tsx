import React from 'react';
import { View, Text, Pressable } from 'react-native';

interface Props {
  page: number;
  totalPages: number;
  totalItems: number;
  pageSize: number;
  hasNext: boolean;
  hasPrev: boolean;
  onNext: () => void;
  onPrev: () => void;
  isDark: boolean;
}

const Pagination: React.FC<Props> = ({
  page, totalPages, totalItems, pageSize,
  hasNext, hasPrev, onNext, onPrev, isDark,
}) => {
  const from  = Math.min((page - 1) * pageSize + 1, totalItems);
  const to    = Math.min(page * pageSize, totalItems);
  const bg    = isDark ? '#1e293b' : '#f8fafc';
  const border = isDark ? '#334155' : '#e2e8f0';
  const text  = isDark ? '#94a3b8' : '#64748b';
  const btnBg = isDark ? '#273549' : '#ffffff';

  if (totalPages <= 1) return null;

  return (
    <View style={{
      flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
      paddingHorizontal: 16, paddingVertical: 10,
      backgroundColor: bg,
      borderTopWidth: 1, borderTopColor: border,
    }}>
      {/* Info */}
      <Text style={{ fontSize: 12, color: text }}>
        {from}–{to} of {totalItems}
      </Text>

      {/* Controls */}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
        {/* Prev */}
        <Pressable
          onPress={onPrev}
          disabled={!hasPrev}
          hitSlop={6}
          style={({ pressed }) => ({
            width: 34, height: 34, borderRadius: 8,
            alignItems: 'center', justifyContent: 'center',
            backgroundColor: pressed ? (isDark ? '#334155' : '#e2e8f0') : btnBg,
            borderWidth: 1, borderColor: border,
            opacity: hasPrev ? 1 : 0.35,
          })}
        >
          <Text style={{ fontSize: 16, color: isDark ? '#e2e8f0' : '#374151' }}>‹</Text>
        </Pressable>

        {/* Page indicator */}
        <View style={{
          paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8,
          backgroundColor: '#3b82f6',
        }}>
          <Text style={{ fontSize: 12, fontWeight: '700', color: '#fff' }}>
            {page} / {totalPages}
          </Text>
        </View>

        {/* Next */}
        <Pressable
          onPress={onNext}
          disabled={!hasNext}
          hitSlop={6}
          style={({ pressed }) => ({
            width: 34, height: 34, borderRadius: 8,
            alignItems: 'center', justifyContent: 'center',
            backgroundColor: pressed ? (isDark ? '#334155' : '#e2e8f0') : btnBg,
            borderWidth: 1, borderColor: border,
            opacity: hasNext ? 1 : 0.35,
          })}
        >
          <Text style={{ fontSize: 16, color: isDark ? '#e2e8f0' : '#374151' }}>›</Text>
        </Pressable>
      </View>
    </View>
  );
};

export default Pagination;
