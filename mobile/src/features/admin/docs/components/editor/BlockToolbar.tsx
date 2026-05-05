import React, { useState } from 'react';
import { View, Text, Pressable, TextInput, Modal } from 'react-native';
import { useThemeColors } from '@/src/constants/theme';
import { BLOCK_META } from '@/src/features/admin/docs/components/editor/blockMeta';
import type { DocBlock } from '@/src/features/admin/docs/types/types';
import { ConfirmDeleteDialog } from '@/src/shared/components';

interface Props {
  block: DocBlock;
  index: number;
  total: number;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
  onSaveAsTemplate?: (block: DocBlock) => void;
}

const BlockToolbar: React.FC<Props> = ({
  block, index, total,
  onMoveUp, onMoveDown, onDuplicate, onDelete, onSaveAsTemplate,
}) => {
  const [confirmOpen,  setConfirmOpen]  = useState(false);
  const [templateOpen, setTemplateOpen] = useState(false);
  const [templateName, setTemplateName] = useState('');
  const c    = useThemeColors();
  const meta = BLOCK_META[block.type] ?? { label: block.type, emoji: '□', color: c.text.muted };

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
          ? c.intent.error + '66'
          : opts?.primary
          ? c.interactive.primary
          : c.border.primary,
        backgroundColor: pressed
          ? (opts?.danger
              ? c.intent.errorSurface
              : opts?.primary
              ? c.interactive.primaryPressed
              : c.surface.elevated)
          : (opts?.danger
              ? c.intent.errorSurface
              : opts?.primary
              ? c.interactive.primary + '20'
              : c.surface.card),
      })}
    >
      <Text style={{
        fontSize: opts?.primary ? 24 : 18,
        fontWeight: opts?.primary ? '800' : '500',
        color: opts?.danger
          ? c.intent.error
          : opts?.primary
          ? c.interactive.primary
          : c.text.secondary,
        lineHeight: opts?.primary ? 28 : 22,
        includeFontPadding: false,
      }}>
        {label}
      </Text>
    </Pressable>
  );

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
        backgroundColor: c.surface.tertiary,
        borderBottomWidth: 1,
        borderBottomColor: c.border.primary,
        gap: 6,
      }}>
        {/* Type badge */}
        <View style={{
          flexDirection: 'row', alignItems: 'center', gap: 5,
          paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6,
          backgroundColor: meta.color + '20',
          borderWidth: 1,
          borderColor: meta.color + '40',
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
        <View style={{ width: 1, height: 32, backgroundColor: c.border.primary, marginHorizontal: 4 }} />

        {/* Action group */}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          {onSaveAsTemplate && btn('📋', handleSaveTemplate)}
          {btn('⧉', onDuplicate)}
          {btn('✕', () => setConfirmOpen(true), { danger: true })}
        </View>
      </View>

      <ConfirmDeleteDialog
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
              backgroundColor: c.surface.card,
              borderRadius: 14, padding: 20, width: '100%',
              borderWidth: 1.5, borderColor: c.border.secondary,
              shadowColor: c.shadow,
              shadowOffset: { width: 0, height: 6 },
              shadowOpacity: 1, shadowRadius: 16, elevation: 12,
            }}
            onPress={(e) => e.stopPropagation()}
          >
            <Text style={{ fontSize: 16, fontWeight: '700', color: c.text.primary, marginBottom: 4 }}>
              Save as template
            </Text>
            <Text style={{ fontSize: 12, color: c.text.muted, marginBottom: 14 }}>
              Give this template a name so you can reuse it later.
            </Text>
            <TextInput
              value={templateName}
              onChangeText={setTemplateName}
              placeholder="Template name…"
              placeholderTextColor={c.text.muted}
              autoFocus
              style={{
                backgroundColor: c.surface.secondary,
                borderRadius: 8, borderWidth: 1, borderColor: c.border.primary,
                paddingHorizontal: 12, paddingVertical: 10,
                fontSize: 14, color: c.text.primary,
                marginBottom: 14,
              }}
              onSubmitEditing={confirmSaveTemplate}
            />
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <Pressable
                onPress={() => setTemplateOpen(false)}
                style={({ pressed }) => ({
                  flex: 1, paddingVertical: 10, borderRadius: 8, alignItems: 'center',
                  backgroundColor: pressed ? c.surface.elevated : c.surface.tertiary,
                  borderWidth: 1, borderColor: c.border.primary,
                })}
              >
                <Text style={{ fontSize: 13, fontWeight: '600', color: c.text.muted }}>Cancel</Text>
              </Pressable>
              <Pressable
                onPress={confirmSaveTemplate}
                style={({ pressed }) => ({
                  flex: 1, paddingVertical: 10, borderRadius: 8, alignItems: 'center',
                  backgroundColor: pressed ? c.buttons.primary.pressed : c.buttons.primary.bg,
                })}
              >
                <Text style={{ fontSize: 13, fontWeight: '700', color: c.buttons.primary.text }}>Save</Text>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
};

export default BlockToolbar;
