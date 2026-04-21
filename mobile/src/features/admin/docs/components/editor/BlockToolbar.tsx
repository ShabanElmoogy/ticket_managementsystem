import React, { useState } from 'react';
import { View, Text, Pressable, TextInput, Modal, Alert } from 'react-native';
import { BLOCK_META } from './blockMeta';
import type { DocBlock } from '../../types/types';
import { AppDeleteDialog } from '../../../../../shared/components';

interface Props {
  block: DocBlock;
  index: number;
  total: number;
  isDark: boolean;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
  onSaveAsTemplate?: (block: DocBlock) => void;
}

const BlockToolbar: React.FC<Props> = ({
  block, index, total, isDark,
  onMoveUp, onMoveDown, onDuplicate, onDelete, onSaveAsTemplate,
}) => {
  const [confirmOpen,   setConfirmOpen]   = useState(false);
  const [templateOpen,  setTemplateOpen]  = useState(false);
  const [templateName,  setTemplateName]  = useState('');
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

  const handleSaveTemplate = () => {
    setTemplateName(meta.label + ' template');
    setTemplateOpen(true);
  };

  const confirmSaveTemplate = () => {
    if (onSaveAsTemplate) onSaveAsTemplate(block);
    setTemplateOpen(false);
    setTemplateName('');
  };

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
          {onSaveAsTemplate && btn('📋', handleSaveTemplate)}
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

      {/* Save as template name dialog */}
      <Modal visible={templateOpen} transparent animationType="fade" onRequestClose={() => setTemplateOpen(false)}>
        <Pressable
          style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'center', alignItems: 'center', paddingHorizontal: 24 }}
          onPress={() => setTemplateOpen(false)}
        >
          <Pressable
            style={{
              backgroundColor: isDark ? '#1e293b' : '#fff',
              borderRadius: 14, padding: 20, width: '100%',
              borderWidth: 1.5, borderColor: isDark ? '#475569' : '#e2e8f0',
              shadowColor: '#000', shadowOffset: { width: 0, height: 6 },
              shadowOpacity: 0.25, shadowRadius: 16, elevation: 12,
            }}
            onPress={(e) => e.stopPropagation()}
          >
            <Text style={{ fontSize: 16, fontWeight: '700', color: isDark ? '#e2e8f0' : '#1e293b', marginBottom: 4 }}>
              Save as template
            </Text>
            <Text style={{ fontSize: 12, color: isDark ? '#64748b' : '#94a3b8', marginBottom: 14 }}>
              Give this template a name so you can reuse it later.
            </Text>
            <TextInput
              value={templateName}
              onChangeText={setTemplateName}
              placeholder="Template name…"
              placeholderTextColor={isDark ? '#475569' : '#94a3b8'}
              autoFocus
              style={{
                backgroundColor: isDark ? '#0f172a' : '#f8fafc',
                borderRadius: 8, borderWidth: 1, borderColor: isDark ? '#334155' : '#e2e8f0',
                paddingHorizontal: 12, paddingVertical: 10,
                fontSize: 14, color: isDark ? '#e2e8f0' : '#1e293b',
                marginBottom: 14,
              }}
              onSubmitEditing={confirmSaveTemplate}
            />
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <Pressable
                onPress={() => setTemplateOpen(false)}
                style={({ pressed }) => ({
                  flex: 1, paddingVertical: 10, borderRadius: 8, alignItems: 'center',
                  backgroundColor: pressed ? (isDark ? '#334155' : '#e2e8f0') : (isDark ? '#1e293b' : '#f1f5f9'),
                  borderWidth: 1, borderColor: isDark ? '#334155' : '#e2e8f0',
                })}
              >
                <Text style={{ fontSize: 13, fontWeight: '600', color: isDark ? '#94a3b8' : '#64748b' }}>Cancel</Text>
              </Pressable>
              <Pressable
                onPress={confirmSaveTemplate}
                style={({ pressed }) => ({
                  flex: 1, paddingVertical: 10, borderRadius: 8, alignItems: 'center',
                  backgroundColor: pressed ? '#2563eb' : '#3b82f6',
                })}
              >
                <Text style={{ fontSize: 13, fontWeight: '700', color: '#fff' }}>Save</Text>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
};

export default BlockToolbar;
