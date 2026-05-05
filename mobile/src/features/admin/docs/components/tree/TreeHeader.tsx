import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { useThemeColors } from '@/src/constants/theme';
import type { TreeSidebarProps } from './types';

interface Props {
  onAddDoc: TreeSidebarProps['onAddDoc'];
  onAddFolder: TreeSidebarProps['onAddFolder'];
  onSearch?: () => void;
}

/**
 * Web equivalent:
 *   px:1.5 py:1.25 row with NotesIcon + "DOCUMENTS" label + CreateNewFolderIcon + AddIcon
 * Mobile: same compact layout — no big full-width buttons
 */
const TreeHeader: React.FC<Props> = ({ onAddDoc, onAddFolder, onSearch }) => {
  const c = useThemeColors();

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: c.border.primary,
      }}
    >
      {/* NotesIcon equivalent */}
      <Text style={{ fontSize: 13, color: c.text.muted, marginEnd: 6 }}>📝</Text>

      {/* "DOCUMENTS" label — flex:1 */}
      <Text style={{
        flex: 1,
        fontSize: 10, fontWeight: '700',
        textTransform: 'uppercase', letterSpacing: 0.5,
        color: c.text.muted,
      }}>
        Documents
      </Text>

      {/* CreateNewFolderIcon equivalent */}
      <Pressable
        onPress={() => onAddFolder(null)}
        hitSlop={4}
        style={({ pressed }) => ({
          width: 34, height: 34, borderRadius: 8,
          alignItems: 'center', justifyContent: 'center',
          backgroundColor: pressed ? c.surface.elevated : c.surface.tertiary,
          marginEnd: 8,
        })}
      >
        <Text style={{ fontSize: 18, lineHeight: 22 }}>📁</Text>
      </Pressable>

      {/* Separator */}
      <View style={{ width: 1, height: 18, backgroundColor: c.border.primary, marginEnd: 8 }} />

      {/* AddIcon equivalent */}
      <Pressable
        onPress={() => onAddDoc(null)}
        hitSlop={4}
        style={({ pressed }) => ({
          width: 34, height: 34, borderRadius: 8,
          alignItems: 'center', justifyContent: 'center',
          backgroundColor: pressed ? c.surface.elevated : c.surface.tertiary,
        })}
      >
        <Text style={{ fontSize: 22, color: c.text.muted, lineHeight: 26 }}>+</Text>
      </Pressable>

      {/* Search icon */}
      {onSearch && (
        <>
          <View style={{ width: 1, height: 18, backgroundColor: c.border.primary, marginStart: 8 }} />
          <Pressable
            onPress={onSearch}
            hitSlop={4}
            style={({ pressed }) => ({
              width: 34, height: 34, borderRadius: 8,
              alignItems: 'center', justifyContent: 'center',
              marginStart: 8,
              backgroundColor: pressed ? c.surface.elevated : c.surface.tertiary,
            })}
          >
            <Text style={{ fontSize: 16, lineHeight: 20 }}>🔍</Text>
          </Pressable>
        </>
      )}
    </View>
  );
};

export default TreeHeader;
