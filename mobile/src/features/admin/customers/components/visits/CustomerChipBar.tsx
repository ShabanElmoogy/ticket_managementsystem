/**
 * CustomerChipBar.tsx
 * Horizontal scrollable list of customer chips.
 * All colors use c.* theme tokens — no hardcoded hex.
 */

import React from 'react';
import { View, Text, ScrollView, Pressable } from 'react-native';
import { useThemeColors, FontSize } from '@/src/constants/theme';
import { formatDate } from '@/src/shared/utils/dateUtils';
import s from './visits.styles';
import { SUB_CFG, getSubStatus } from './visits.types';
import type { Customer } from '@/src/services/api/types/index';

interface Props {
  customers:        Customer[];
  selectedId:       string | null;
  onSelectCustomer: (id: string) => void;
}

const CustomerChipBar: React.FC<Props> = ({ customers, selectedId, onSelectCustomer }) => {
  const c = useThemeColors();

  return (
    <View style={[s.chipBar, { backgroundColor: c.surface.primary, borderBottomColor: c.border.primary }]}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={s.chipBarContent}
      >
        {customers.length === 0 ? (
          <Text style={[s.noCustomers, { color: c.text.muted }]}>
            No customers with location set
          </Text>
        ) : (
          customers.map((cu) => {
            const cfg        = SUB_CFG[getSubStatus(cu)];
            const isSelected = cu.id === selectedId;
            const lastVisit  = (cu as any)._lastVisit as string | undefined;

            return (
              <Pressable
                key={cu.id}
                onPress={() => onSelectCustomer(cu.id)}
                style={[
                  s.chip,
                  {
                    backgroundColor: isSelected ? cfg.color : c.surface.elevated,
                    borderColor:     isSelected ? cfg.color : c.border.primary,
                  },
                ]}
              >
                <View style={{ flexShrink: 1 }}>
                  <Text
                    style={[s.chipName, { color: isSelected ? c.text.inverse : c.text.primary }]}
                    numberOfLines={1}
                  >
                    {cu.name}
                  </Text>
                  {cu.company ? (
                    <Text
                      style={[s.chipSub, { color: isSelected ? c.text.inverse + 'bb' : c.text.muted }]}
                      numberOfLines={1}
                    >
                      {cu.company}
                    </Text>
                  ) : null}
                  {lastVisit ? (
                    <Text style={[s.chipLastVisit, { color: isSelected ? c.text.inverse + 'aa' : c.text.muted }]}>
                      Last: {formatDate(lastVisit)}
                    </Text>
                  ) : null}
                </View>
              </Pressable>
            );
          })
        )}
      </ScrollView>
    </View>
  );
};

export default CustomerChipBar;
