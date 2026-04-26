import React, { useState, useMemo } from 'react';
import { View, Text, ScrollView } from 'react-native';
import TreeEmpty from '@/src/features/admin/docs/components/tree/TreeEmpty';
import TreeHeader from '@/src/features/admin/docs/components/tree/TreeHeader';
import TreeRow from '@/src/features/admin/docs/components/tree/TreeRow';
import TreeSearchInput from '@/src/features/admin/docs/components/tree/TreeSearchInput';
import TreeSearchResults from '@/src/features/admin/docs/components/tree/TreeSearchResults';
import type { TreeSidebarProps } from '@/src/features/admin/docs/components/tree/types';
import type { DocRefNode, TreeNode } from '@/src/features/admin/docs/types/types';
import { useDirection } from '@/src/providers/DirectionProvider';

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

// ── Main sidebar ──────────────────────────────────────────────────────────────
const DocTreeSidebar: React.FC<TreeSidebarProps> = (props) => {
  const { isDark, tree } = props;
  const { isRtl } = useDirection();
  const [searchQuery, setSearchQuery] = useState('');

  const sidebarBg = isDark ? '#0f172a' : '#f8fafc';
  const borderC   = isDark ? '#1e293b' : '#e2e8f0';

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
        onSearch={props.onSearch}
      />

      <TreeSearchInput
        value={searchQuery}
        onChange={setSearchQuery}
        isDark={isDark}
      />

      {isSearching ? (
        <TreeSearchResults
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
