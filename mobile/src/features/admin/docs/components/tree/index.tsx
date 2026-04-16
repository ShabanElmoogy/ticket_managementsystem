import React from 'react';
import { View, Text, ScrollView } from 'react-native';
import type { TreeSidebarProps } from './types';
import TreeHeader from './TreeHeader';
import TreeRow from './TreeRow';
import TreeEmpty from './TreeEmpty';
import { useDirection } from '../../../../../providers/DirectionProvider';

export type { TreeSidebarProps };

const DocTreeSidebar: React.FC<TreeSidebarProps> = (props) => {
  const { isDark, tree } = props;
  const { isRtl } = useDirection();

  const sidebarBg = isDark ? '#0f172a' : '#f8fafc';
  const borderC   = isDark ? '#1e293b' : '#e2e8f0';

  return (
    <View style={{
      flex: 1,
      backgroundColor: sidebarBg,
      // Border on the correct side based on direction
      ...(isRtl
        ? { borderLeftWidth: 1, borderLeftColor: borderC }
        : { borderRightWidth: 1, borderRightColor: borderC }),
    }}>

      <TreeHeader
        isDark={isDark}
        onAddDoc={props.onAddDoc}
        onAddFolder={props.onAddFolder}
      />

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

      <View style={{ paddingVertical: 6, alignItems: 'center', borderTopWidth: 1, borderTopColor: borderC }}>
        <Text style={{ fontSize: 10, color: isDark ? '#334155' : '#cbd5e1' }}>
          Long-press to rename
        </Text>
      </View>
    </View>
  );
};

export default DocTreeSidebar;
