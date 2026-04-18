import React, { useState } from 'react';
import { View, Text, Pressable } from 'react-native';
import { BLOCK_META } from './blockMeta';
import type { DocBlock } from '../../types/types';
import AppDeleteDialog from '../../../../../shared/components/AppDeleteDialog';

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
  const [confirmOpen, setConfirmOpen] = useState(false);
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
    opts?: { disabled?: boolean; danger?: boolean; primary?: boolean }
  ) => (
    <Pressable
      onPress={onPress}
      disabled={opts?.disabled}
      hitSlop={4}
      style={({ pressed }) => ({
        width: opts?.primary ? 52 : 42,
        height: opts?.primary ? 52 : 42,
        borderRadius: opts?.primary ? 13 : 10,
        alignItems: 'center', justifyContent: 'center',
        opacity: opts?.disabled ? 0.3 : 1,
        borderWidth: 1.5,
        borderColor: opts?.danger
          ? deleteBorder
          : opts?.primary
          ? '#3b82f6'
          : btnBorder,
        backgroundColor: pressed
          ? (opts?.danger
              ? (isDark ? '#7f1d1d' : '#fee2e2')
              : opts?.primary
              ? '#2563eb'
              : btnBorder)
          : (opts?.danger
              ? deleteBg
              : opts?.primary
              ? (isDark ? '#1e3a5f' : '#eff6ff')
              : btnBg),
      })}
    >
      <Text style={{
        fontSize: opts?.primary ? 24 : 18,
        fontWeight: opts?.primary ? '800' : '500',
        color: opts?.danger
          ? (isDark ? '#fca5a5' : '#ef4444')
          : opts?.primary
          ? '#3b82f6'
          : btnText,
        lineHeight: opts?.primary ? 28 : 22,
        includeFontPadding: false,
      }}>
        {label}
      </Text>
    </Pressable>
  );

  const handleDelete = () => setConfirmOpen(true);

  return (
    <>
      <View style={{
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 10,
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
            fontSize: 12, fontWeight: '800',
            color: meta.color,
            textTransform: 'uppercase', letterSpacing: 0.4,
          }}>
            {meta.label}
          </Text>
        </View>

        <View style={{ flex: 1 }} />

        {/* Move group */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          {btn('↑', onMoveUp,   { disabled: index === 0,         primary: true })}
          {btn('↓', onMoveDown, { disabled: index === total - 1, primary: true })}
        </View>

        {/* Separator */}
        <View style={{ width: 1, height: 32, backgroundColor: divider, marginHorizontal: 4 }} />

        {/* Action group */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          {btn('⧉', onDuplicate)}
          {btn('✕', handleDelete, { danger: true })}
        </View>
      </View>

      <AppDeleteDialog
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={() => { setConfirmOpen(false); onDelete(); }}
        title="Delete block"
        message={`Remove this ${meta.label} block?`}
        confirmLabel="Delete"
        cancelLabel="Cancel"
      />
    </>
  );
};

export default BlockToolbar;
