import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, ScrollView } from 'react-native';
import type { TabsBlock, TabItem } from '../../types/types';
import { newId } from '../../utils/idUtils';

interface Props { block: TabsBlock; isDark: boolean; onChange: (patch: Partial<TabsBlock>) => void; }

const TabsEditor: React.FC<Props> = ({ block, isDark, onChange }) => {
  const [activeTab, setActiveTab] = useState(0);

  const updateTab = (idx: number, patch: Partial<TabItem>) => {
    const tabs = block.tabs.map((t, i) => (i === idx ? { ...t, ...patch } : t));
    onChange({ tabs });
  };
  const addTab = () => {
    const tabs = [...block.tabs, { id: newId(), label: `Tab ${block.tabs.length + 1}`, content: '' }];
    onChange({ tabs });
    setActiveTab(tabs.length - 1);
  };
  const removeTab = (idx: number) => {
    if (block.tabs.length <= 1) return;
    const tabs = block.tabs.filter((_, i) => i !== idx);
    onChange({ tabs });
    setActiveTab(Math.min(activeTab, tabs.length - 1));
  };

  const tab = block.tabs[activeTab];

  return (
    <View style={{ borderRadius: 8, borderWidth: 1, borderColor: isDark ? '#334155' : '#e2e8f0', overflow: 'hidden' }}>
      {/* Tab bar */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false}
        style={{ backgroundColor: isDark ? '#0f172a' : '#f8fafc' }}
        contentContainerStyle={{ flexDirection: 'row', paddingHorizontal: 4, paddingVertical: 4, gap: 2 }}
      >
        {block.tabs.map((t, idx) => (
          <View key={t.id} style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Pressable
              onPress={() => setActiveTab(idx)}
              style={{
                paddingHorizontal: 12, paddingVertical: 6, borderRadius: 6,
                backgroundColor: activeTab === idx ? '#3b82f6' : 'transparent',
              }}
            >
              <Text style={{
                fontSize: 13, fontWeight: '600',
                color: activeTab === idx ? '#fff' : (isDark ? '#94a3b8' : '#64748b'),
              }}>
                {t.label}
              </Text>
            </Pressable>
            <Pressable onPress={() => removeTab(idx)} hitSlop={4} style={{ paddingHorizontal: 2 }}>
              <Text style={{ fontSize: 10, color: '#ef4444' }}>✕</Text>
            </Pressable>
          </View>
        ))}
        <Pressable onPress={addTab} style={{ paddingHorizontal: 8, paddingVertical: 6 }}>
          <Text style={{ fontSize: 13, color: '#3b82f6' }}>+</Text>
        </Pressable>
      </ScrollView>

      {/* Active tab content */}
      {tab && (
        <View style={{ padding: 12, backgroundColor: isDark ? '#1e293b' : '#fff', gap: 8 }}>
          <TextInput
            value={tab.label}
            onChangeText={(label) => updateTab(activeTab, { label })}
            placeholder="Tab label…"
            placeholderTextColor={isDark ? '#475569' : '#9ca3af'}
            style={{
              fontSize: 13, fontWeight: '600', color: isDark ? '#e2e8f0' : '#1e293b',
              backgroundColor: isDark ? '#0f172a' : '#f8fafc',
              borderRadius: 6, paddingHorizontal: 8, paddingVertical: 4,
              borderWidth: 1, borderColor: isDark ? '#334155' : '#e2e8f0',
            }}
          />
          <TextInput
            value={tab.content}
            onChangeText={(content) => updateTab(activeTab, { content })}
            placeholder="Tab content…"
            placeholderTextColor={isDark ? '#475569' : '#9ca3af'}
            multiline
            style={{
              fontSize: 14, color: isDark ? '#e2e8f0' : '#1e293b',
              lineHeight: 20, minHeight: 80,
            }}
          />
        </View>
      )}
    </View>
  );
};

export default TabsEditor;
