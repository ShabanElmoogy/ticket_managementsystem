import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { BLOCK_META } from './blockMeta';
import type { DocBlock } from '../../types/types';

interface Props {
  block: DocBlock;
  index: number;
  total: number;
  isDark: boolean;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
}

const BlockToolbar: React.FC<Props> = ({
  block, index, total, isDark,
  onMoveUp, onMoveDown, onDuplicate, onDelete,
}) => {
  const meta = BLOCK_META[block.type] ?? { label: block.type, emoji: '□', color: '#64748b' };

  const toolbarBg = isDark ? '#273549' : '#f1f5f9';
  const btnBg     = isDark ? '#334155' : '#ffffff';
  const btnBorder = isDark ? '#475569' : '#e2e8f0';
  const btnText   = isDark ? '#cbd5e1' : '#64748b';
  const divider   = isDark ? '#334155' : '#e9ecef';
  const deleteBg     = isDark ? '#3b1515' : '#fef2f2';
  const deleteBorder = isDark ? '#7f1d1d' : '#fecaca';

  const btn = (
    label: string,
    onPress: () => void,
    opts?: { disabled?: boolean; danger?: boolean }
  ) => (
    <Pressable
      onPress={onPress}
      disabled={opts?.disabled}
      hitSlop={4}
      style={({ pressed }) => ({
        width: 36, height: 36, borderRadius: 9,
        alignItems: 'center', justifyContent: 'center',
        opacity: opts?.disabled ? 0.3 : 1,
        borderWidth: 1,
        borderColor: opts?.danger ? deleteBorder : btnBorder,
        backgroundColor: pressed
          ? (opts?.danger ? (isDark ? '#7f1d1d' : '#fee2e2') : btnBorder)
          : (opts?.danger ? deleteBg : btnBg),
      })}
    >
      <Text style={{
        fontSize: 16,
        color: opts?.danger ? (isDark ? '#fca5a5' : '#ef4444') : btnText,
      }}>
        {label}
      </Text>
    </Pressable>
  );

  return (
    <View style={{
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 10,
      paddingVertical: 7,
      backgroundColor: toolbarBg,
      borderBottomWidth: 1,
      borderBottomColor: divider,
      gap: 6,
    }}>
      {/* Type badge */}
      <View style={{
        flexDirection: 'row', alignItems: 'center', gap: 5,
        paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6,
        backgroundColor: isDark ? meta.color + '30' : meta.color + '15',
        borderWidth: 1,
        borderColor: isDark ? meta.color + '55' : meta.color + '25',
      }}>
        <Text style={{ fontSize: 12 }}>{meta.emoji}</Text>
        <Text style={{
          fontSize: 10, fontWeight: '800',
          color: meta.color,
          textTransform: 'uppercase', letterSpacing: 0.4,
        }}>
          {meta.label}
        </Text>
      </View>

      <View style={{ flex: 1 }} />

      {btn('↑', onMoveUp,   { disabled: index === 0 })}
      {btn('↓', onMoveDown, { disabled: index === total - 1 })}
      {btn('⧉', onDuplicate)}
      {btn('✕', onDelete,   { danger: true })}
    </View>
  );
};

export default BlockToolbar;
