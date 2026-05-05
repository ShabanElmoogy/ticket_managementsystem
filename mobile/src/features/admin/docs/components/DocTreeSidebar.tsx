import React, { useState, useMemo } from 'react';
import { View, Text, ScrollView } from 'react-native';
import { useThemeColors } from '@/src/constants/theme';
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
  const { tree } = props;
  const c = useThemeColors();
  const { isRtl } = useDirection();
  const [searchQuery, setSearchQuery] = useState('');

  const allDocNodes = useMemo(() => collectAllDocNodes(tree), [tree]);
  const isSearching = searchQuery.trim().length > 0;

  return (
    <View style={{
      flex: 1,
      backgroundColor: c.surface.secondary,
      ...(isRtl
        ? { borderLeftWidth: 1, borderLeftColor: c.border.primary }
        : { borderRightWidth: 1, borderRightColor: c.border.primary }),
    }}>

      <TreeHeader
        onAddDoc={props.onAddDoc}
        onAddFolder={props.onAddFolder}
        onSearch={props.onSearch}
      />

      <TreeSearchInput
        value={searchQuery}
        onChange={setSearchQuery}
      />

      {isSearching ? (
        <TreeSearchResults
          query={searchQuery}
          nodes={allDocNodes}
          currentDocId={props.currentDocId}
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
            <TreeEmpty onAddDoc={() => props.onAddDoc(null)} />
          ) : (
            tree.map((node) => (
              <TreeRow key={node.id} node={node} depth={0} p={props} />
            ))
          )}
        </ScrollView>
      )}

      <View style={{ paddingVertical: 6, alignItems: 'center', borderTopWidth: 1, borderTopColor: c.border.primary }}>
        <Text style={{ fontSize: 10, color: c.text.muted }}>
          Long-press to rename
        </Text>
      </View>
    </View>
  );
};

export default DocTreeSidebar;
