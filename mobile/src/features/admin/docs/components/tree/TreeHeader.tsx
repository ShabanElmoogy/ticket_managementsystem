import React from 'react';
import { View, Text, Pressable } from 'react-native';
import type { TreeSidebarProps } from './types';

interface Props {
  isDark: boolean;
  onAddDoc: TreeSidebarProps['onAddDoc'];
  onAddFolder: TreeSidebarProps['onAddFolder'];
}

/**
 * Web equivalent:
 *   px:1.5 py:1.25 row with NotesIcon + "DOCUMENTS" label + CreateNewFolderIcon + AddIcon
 * Mobile: same compact layout — no big full-width buttons
 */
const TreeHeader: React.FC<Props> = ({ isDark, onAddDoc, onAddFolder }) => {
  const borderC   = isDark ? '#1e293b' : '#e2e8f0';
  const textMuted = isDark ? '#64748b' : '#94a3b8';
  const hoverBg   = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)';

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: borderC,
      }}
    >
      {/* NotesIcon equivalent */}
      <Text style={{ fontSize: 13, color: textMuted, marginRight: 6 }}>📝</Text>

      {/* "DOCUMENTS" label — flex:1 */}
      <Text style={{
        flex: 1,
        fontSize: 10, fontWeight: '700',
        textTransform: 'uppercase', letterSpacing: 0.5,
        color: textMuted,
      }}>
        Documents
      </Text>

      {/* CreateNewFolderIcon equivalent */}
      <Pressable
        onPress={() => onAddFolder(null)}
        hitSlop={6}
        style={({ pressed }) => ({
          width: 26, height: 26, borderRadius: 4,
          alignItems: 'center', justifyContent: 'center',
          backgroundColor: pressed ? hoverBg : 'transparent',
          marginRight: 2,
        })}
      >
        <Text style={{ fontSize: 14, color: textMuted }}>📁</Text>
      </Pressable>

      {/* AddIcon equivalent */}
      <Pressable
        onPress={() => onAddDoc(null)}
        hitSlop={6}
        style={({ pressed }) => ({
          width: 26, height: 26, borderRadius: 4,
          alignItems: 'center', justifyContent: 'center',
          backgroundColor: pressed ? hoverBg : 'transparent',
        })}
      >
        <Text style={{ fontSize: 18, color: textMuted, lineHeight: 22 }}>+</Text>
      </Pressable>
    </View>
  );
};

export default TreeHeader;
