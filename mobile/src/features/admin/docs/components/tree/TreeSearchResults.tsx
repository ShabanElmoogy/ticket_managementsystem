import React, { useMemo } from 'react';
import { View, Text, ScrollView, Pressable } from 'react-native';
import type { DocRefNode } from '../../types/types';

interface Props {
  query: string;
  nodes: DocRefNode[];
  currentDocId: string | null;
  isDark: boolean;
  onSelect: (docId: string, nodeId: string) => void;
}

/**
 * Flat list of doc nodes filtered by search query.
 * Shown in place of the tree when the user is searching.
 */
const TreeSearchResults: React.FC<Props> = ({ query, nodes, currentDocId, isDark, onSelect }) => {
  const border   = isDark ? '#334155' : '#e2e8f0';
  const text     = isDark ? '#e2e8f0' : '#1e293b';
  const muted    = isDark ? '#64748b' : '#94a3b8';
  const activeBg = isDark ? '#1e3a5f' : '#eff6ff';

  const filtered = useMemo(
    () => nodes.filter((n) => n.title.toLowerCase().includes(query.toLowerCase())),
    [nodes, query],
  );

  if (filtered.length === 0) {
    return (
      <View style={{ padding: 16, alignItems: 'center' }}>
        <Text style={{ fontSize: 12, color: muted }}>No docs match "{query}"</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={{ flex: 1 }}
      contentContainerStyle={{ paddingVertical: 4 }}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      {filtered.map((node) => {
        const isActive = node.docId === currentDocId;
        return (
          <Pressable
            key={node.id}
            onPress={() => onSelect(node.docId, node.id)}
            style={({ pressed }) => ({
              flexDirection: 'row', alignItems: 'center', gap: 8,
              paddingHorizontal: 12, paddingVertical: 9,
              backgroundColor: isActive ? activeBg : pressed ? border : 'transparent',
            })}
          >
            <Text style={{ fontSize: 14 }}>📄</Text>
            <Text
              style={{
                flex: 1, fontSize: 13,
                fontWeight: isActive ? '700' : '500',
                color: isActive ? '#3b82f6' : text,
              }}
              numberOfLines={1}
            >
              {node.title}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
};

export default TreeSearchResults;
