import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { useThemeColors, FontSize, FontWeight, Radius } from '@/src/constants/theme';

export interface AppPaginationProps {
  page:       number;
  totalPages: number;
  totalItems: number;
  pageSize:   number;
  hasNext:    boolean;
  hasPrev:    boolean;
  onNext:     () => void;
  onPrev:     () => void;
}

/**
 * Generic pagination bar — prev/next buttons, page indicator, item range.
 * Returns null when there is only one page (nothing to paginate).
 */
const AppPagination: React.FC<AppPaginationProps> = ({
  page, totalPages, totalItems, pageSize, hasNext, hasPrev, onNext, onPrev,
}) => {
  // Hook must be called unconditionally — before any early return
  const c = useThemeColors();

  if (totalPages <= 1) return null;

  const from = Math.min((page - 1) * pageSize + 1, totalItems);
  const to   = Math.min(page * pageSize, totalItems);

  return (
    <View style={{
      flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
      paddingHorizontal: 16, paddingVertical: 10,
      backgroundColor: c.surface.secondary,
      borderTopWidth: 1, borderTopColor: c.border.primary,
    }}>
      {/* Item range */}
      <Text style={{ fontSize: FontSize.sm, color: c.text.secondary }}>
        {from}–{to} of {totalItems}
      </Text>

      {/* Prev / page indicator / Next */}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
        <Pressable
          onPress={onPrev}
          disabled={!hasPrev}
          hitSlop={6}
          accessibilityRole="button"
          accessibilityLabel="Previous page"
          accessibilityState={{ disabled: !hasPrev }}
          style={({ pressed }: { pressed: boolean }) => ({
            width: 34, height: 34, borderRadius: Radius.md,
            alignItems: 'center', justifyContent: 'center',
            backgroundColor: pressed ? c.surface.elevated : c.surface.primary,
            borderWidth: 1, borderColor: c.border.primary,
            opacity: hasPrev ? 1 : 0.35,
          })}
        >
          <Text style={{ fontSize: FontSize.xl, color: c.text.primary }}>‹</Text>
        </Pressable>

        <View style={{
          paddingHorizontal: 12, paddingVertical: 4, borderRadius: Radius.md,
          backgroundColor: c.interactive.primary,
        }}>
          <Text style={{ fontSize: FontSize.sm, fontWeight: FontWeight.bold, color: c.text.inverse }}>
            {page} / {totalPages}
          </Text>
        </View>

        <Pressable
          onPress={onNext}
          disabled={!hasNext}
          hitSlop={6}
          accessibilityRole="button"
          accessibilityLabel="Next page"
          accessibilityState={{ disabled: !hasNext }}
          style={({ pressed }: { pressed: boolean }) => ({
            width: 34, height: 34, borderRadius: Radius.md,
            alignItems: 'center', justifyContent: 'center',
            backgroundColor: pressed ? c.surface.elevated : c.surface.primary,
            borderWidth: 1, borderColor: c.border.primary,
            opacity: hasNext ? 1 : 0.35,
          })}
        >
          <Text style={{ fontSize: FontSize.xl, color: c.text.primary }}>›</Text>
        </Pressable>
      </View>
    </View>
  );
};

export default AppPagination;
