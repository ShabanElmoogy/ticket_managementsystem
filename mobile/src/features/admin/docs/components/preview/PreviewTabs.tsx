import React from 'react';
import { View, Text, Pressable, ScrollView } from 'react-native';
import type { TabsBlock } from '../../types/types';
import type { PreviewColors } from './previewUtils';

interface Props {
  block: TabsBlock;
  colors: PreviewColors;
  activeIdx: number;
  onTabChange: (idx: number) => void;
}

const PreviewTabs: React.FC<Props> = ({ block, colors, activeIdx, onTabChange }) => {
  const tab = block.tabs[activeIdx];
  return (
    <View style={{ marginBottom: 8, borderRadius: 8, borderWidth: 1, borderColor: colors.borderColor, overflow: 'hidden' }}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ flexDirection: 'row', paddingHorizontal: 4, paddingVertical: 4, gap: 2 }}
      >
        {block.tabs.map((t, idx) => (
          <Pressable
            key={t.id}
            onPress={() => onTabChange(idx)}
            style={{
              paddingHorizontal: 12, paddingVertical: 6, borderRadius: 6,
              backgroundColor: activeIdx === idx ? '#3b82f6' : 'transparent',
            }}
          >
            <Text style={{ fontSize: 13, fontWeight: '600', color: activeIdx === idx ? '#fff' : colors.mutedColor }}>
              {t.label}
            </Text>
          </Pressable>
        ))}
      </ScrollView>
      {tab && (
        <View style={{ padding: 12 }}>
          <Text style={{ fontSize: 14, color: colors.textColor, lineHeight: 20 }}>{tab.content}</Text>
        </View>
      )}
    </View>
  );
};

export default PreviewTabs;
