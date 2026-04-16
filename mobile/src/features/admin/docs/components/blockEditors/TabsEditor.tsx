import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, ScrollView } from 'react-native';
import type { TabsBlock, TabItem } from '../../types/types';
import { newId } from '../../utils/idUtils';

interface Props { block: TabsBlock; isDark: boolean; onChange: (patch: Partial<TabsBlock>) => void; }

const TAB_COLORS = ['#3b82f6','#8b5cf6','#10b981','#f59e0b','#ef4444','#ec4899','#0ea5e9','#64748b'];

const TabsEditor: React.FC<Props> = ({ block, isDark, onChange }) => {
  const [activeTab, setActiveTab] = useState(0);

  const updateTab = (idx: number, patch: Partial<TabItem>) => {
    onChange({ tabs: block.tabs.map((t, i) => (i === idx ? { ...t, ...patch } : t)) });
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
  const activeColor = TAB_COLORS[activeTab % TAB_COLORS.length];

  return (
    <View style={{
      borderRadius: 12, overflow: 'hidden',
      borderWidth: 1.5, borderColor: isDark ? '#334155' : '#e2e8f0',
    }}>
      {/* Tab bar */}
      <View style={{ backgroundColor: isDark ? '#0f172a' : '#f8fafc' }}>
        <ScrollView
          horizontal showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ flexDirection: 'row', paddingHorizontal: 8, paddingTop: 8, paddingBottom: 0, gap: 4 }}
        >
          {block.tabs.map((t, idx) => {
            const tabColor = TAB_COLORS[idx % TAB_COLORS.length];
            const isActive = activeTab === idx;
            return (
              <View key={t.id} style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Pressable
                  onPress={() => setActiveTab(idx)}
                  style={{
                    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 8,
                    borderBottomLeftRadius: isActive ? 0 : 8,
                    borderBottomRightRadius: isActive ? 0 : 8,
                    backgroundColor: isActive ? (isDark ? '#1e293b' : '#fff') : 'transparent',
                    borderWidth: isActive ? 1.5 : 0,
                    borderBottomWidth: 0,
                    borderColor: isActive ? tabColor + '55' : 'transparent',
                    flexDirection: 'row', alignItems: 'center', gap: 5,
                  }}
                >
                  <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: tabColor }} />
                  <Text style={{
                    fontSize: 13, fontWeight: isActive ? '700' : '500',
                    color: isActive ? tabColor : (isDark ? '#64748b' : '#94a3b8'),
                  }}>
                    {t.label}
                  </Text>
                </Pressable>
                <Pressable onPress={() => removeTab(idx)} hitSlop={6} style={{ paddingHorizontal: 2, paddingBottom: 4 }}>
                  <Text style={{ fontSize: 10, color: '#ef4444' }}>✕</Text>
                </Pressable>
              </View>
            );
          })}
          <Pressable
            onPress={addTab}
            style={({ pressed }) => ({
              paddingHorizontal: 10, paddingVertical: 8, borderRadius: 8,
              backgroundColor: pressed ? '#3b82f620' : 'transparent',
              alignItems: 'center', justifyContent: 'center',
            })}
          >
            <Text style={{ fontSize: 18, color: '#3b82f6', lineHeight: 20 }}>+</Text>
          </Pressable>
        </ScrollView>

        {/* Active tab indicator line */}
        <View style={{ height: 2, backgroundColor: activeColor, marginHorizontal: 8, borderRadius: 1 }} />
      </View>

      {/* Tab content */}
      {tab && (
        <View style={{ backgroundColor: isDark ? '#1e293b' : '#fff', padding: 14, gap: 10 }}>
          {/* Label editor */}
          <View style={{
            flexDirection: 'row', alignItems: 'center', gap: 8,
            backgroundColor: isDark ? '#0f172a' : '#f8fafc',
            borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4,
            borderWidth: 1, borderColor: activeColor + '44',
          }}>
            <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: activeColor }} />
            <TextInput
              value={tab.label}
              onChangeText={(label) => updateTab(activeTab, { label })}
              placeholder="Tab label…"
              placeholderTextColor={isDark ? '#334155' : '#cbd5e1'}
              style={{ flex: 1, fontSize: 13, fontWeight: '700', color: activeColor, paddingVertical: 6 }}
            />
          </View>

          {/* Content editor */}
          <TextInput
            value={tab.content}
            onChangeText={(content) => updateTab(activeTab, { content })}
            placeholder="Tab content…"
            placeholderTextColor={isDark ? '#334155' : '#cbd5e1'}
            multiline
            style={{
              fontSize: 14, lineHeight: 22,
              color: isDark ? '#e2e8f0' : '#1e293b',
              minHeight: 100,
            }}
          />
        </View>
      )}
    </View>
  );
};

export default TabsEditor;
