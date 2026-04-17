import React, { useState, useMemo } from 'react';
import { View, Text, ScrollView, TextInput, Pressable } from 'react-native';
import type { TreeSidebarProps } from './types';
import type { DocRefNode, TreeNode } from '../../types/types';
import TreeHeader from './TreeHeader';
import TreeRow from './TreeRow';
import TreeEmpty from './TreeEmpty';
import { useDirection } from '../../../../../providers/DirectionProvider';

export type { TreeSidebarProps };

// ── Flatten tree to collect all doc nodes ─────────────────────────────────────
function collectAllDocNodes(nodes: TreeNode[]): DocRefNode[] {
  const result: DocRefNode[] = [];
  for (const n of nodes) {
    if (n.type === 'doc') result.push(n as DocRefNode);
    if (n.type === 'folder') result.push(...collectAllDocNodes(n.children));
  }
  return result;
}

// ── Search results list ───────────────────────────────────────────────────────
interface SearchResultsProps {
  query: string;
  nodes: DocRefNode[];
  currentDocId: string | null;
  isDark: boolean;
  onSelect: (docId: string, nodeId: string) => void;
}

const SearchResults: React.FC<SearchResultsProps> = ({ query, nodes, currentDocId, isDark, onSelect }) => {
  const bg       = isDark ? '#0f172a' : '#f8fafc';
  const border   = isDark ? '#334155' : '#e2e8f0';
  const text     = isDark ? '#e2e8f0' : '#1e293b';
  const muted    = isDark ? '#64748b' : '#94a3b8';
  const activeBg = isDark ? '#1e3a5f' : '#eff6ff';

  const filtered = useMemo(() =>
    nodes.filter((n) => n.title.toLowerCase().includes(query.toLowerCase())),
    [nodes, query]
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
              style={{ flex: 1, fontSize: 13, fontWeight: isActive ? '700' : '500', color: isActive ? '#3b82f6' : text }}
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

// ── Main sidebar ──────────────────────────────────────────────────────────────
const DocTreeSidebar: React.FC<TreeSidebarProps> = (props) => {
  const { isDark, tree } = props;
  const { isRtl } = useDirection();
  const [searchQuery, setSearchQuery] = useState('');

  const sidebarBg = isDark ? '#0f172a' : '#f8fafc';
  const borderC   = isDark ? '#1e293b' : '#e2e8f0';
  const inputBg   = isDark ? '#1e293b' : '#fff';
  const inputBorder = isDark ? '#334155' : '#e2e8f0';
  const muted     = isDark ? '#64748b' : '#94a3b8';

  const allDocNodes = useMemo(() => collectAllDocNodes(tree), [tree]);
  const isSearching = searchQuery.trim().length > 0;

  return (
    <View style={{
      flex: 1,
      backgroundColor: sidebarBg,
      ...(isRtl
        ? { borderLeftWidth: 1, borderLeftColor: borderC }
        : { borderRightWidth: 1, borderRightColor: borderC }),
    }}>

      <TreeHeader
        isDark={isDark}
        onAddDoc={props.onAddDoc}
        onAddFolder={props.onAddFolder}
      />

      {/* Search input */}
      <View style={{
        paddingHorizontal: 10, paddingVertical: 6,
        borderBottomWidth: 1, borderBottomColor: borderC,
      }}>
        <View style={{
          flexDirection: 'row', alignItems: 'center', gap: 6,
          backgroundColor: inputBg, borderRadius: 8,
          borderWidth: 1, borderColor: inputBorder,
          paddingHorizontal: 8, paddingVertical: 5,
        }}>
          <Text style={{ fontSize: 13, color: muted }}>🔍</Text>
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search docs…"
            placeholderTextColor={muted}
            style={{ flex: 1, fontSize: 12, color: isDark ? '#e2e8f0' : '#1e293b', paddingVertical: 0 }}
            returnKeyType="search"
            clearButtonMode="while-editing"
          />
          {searchQuery.length > 0 && (
            <Pressable onPress={() => setSearchQuery('')} hitSlop={6}>
              <Text style={{ fontSize: 12, color: muted }}>✕</Text>
            </Pressable>
          )}
        </View>
      </View>

      {/* Tree or search results */}
      {isSearching ? (
        <SearchResults
          query={searchQuery}
          nodes={allDocNodes}
          currentDocId={props.currentDocId}
          isDark={isDark}
          onSelect={(docId, nodeId) => {
            setSearchQuery('');
            props.onSelectDoc(docId, nodeId);
          }}
        />
      ) : (
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingVertical: 4 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {tree.length === 0 ? (
            <TreeEmpty isDark={isDark} onAddDoc={() => props.onAddDoc(null)} />
          ) : (
            tree.map((node) => (
              <TreeRow key={node.id} node={node} depth={0} p={props} />
            ))
          )}
        </ScrollView>
      )}

      <View style={{ paddingVertical: 6, alignItems: 'center', borderTopWidth: 1, borderTopColor: borderC }}>
        <Text style={{ fontSize: 10, color: isDark ? '#334155' : '#cbd5e1' }}>
          Long-press to rename
        </Text>
      </View>
    </View>
  );
};

export default DocTreeSidebar;
