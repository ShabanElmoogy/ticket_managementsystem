import React, { useState } from 'react';
import {
  Modal, View, Text, Pressable, FlatList, TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useThemeColors } from '@/src/constants/theme';
import { BLOCK_META } from '@/src/features/admin/docs/components/editor/blockMeta';
import { ConfirmDeleteDialog } from '@/src/shared/components/dialogs';
import type { BlockTemplate } from '@/src/features/admin/docs/hooks/useBlockTemplates';

interface Props {
  visible: boolean;
  templates: BlockTemplate[];
  onClose: () => void;
  onUse: (template: BlockTemplate) => void;
  onDelete: (id: string) => void;
}

// ── Template card ─────────────────────────────────────────────────────────────
const TemplateCard: React.FC<{
  template:        BlockTemplate;
  onUse:           () => void;
  onDeleteRequest: () => void;
}> = ({ template, onUse, onDeleteRequest }) => {
  const c = useThemeColors();

  return (
    <View style={{
      backgroundColor: c.surface.card, borderRadius: 12,
      borderWidth: 1, borderColor: c.border.primary,
      marginHorizontal: 14, marginBottom: 10,
      overflow: 'hidden',
    }}>
      {/* Header */}
      <View style={{
        flexDirection: 'row', alignItems: 'center', gap: 10,
        paddingHorizontal: 14, paddingVertical: 10,
        backgroundColor: c.surface.secondary,
        borderBottomWidth: 1, borderBottomColor: c.border.primary,
      }}>
        <Text style={{ fontSize: 18 }}>📋</Text>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 14, fontWeight: '700', color: c.text.primary }} numberOfLines={1}>
            {template.name}
          </Text>
          <Text style={{ fontSize: 11, color: c.text.muted, marginTop: 1 }}>
            {template.blocks.length} block{template.blocks.length !== 1 ? 's' : ''} · {new Date(template.createdAt).toLocaleDateString()}
          </Text>
        </View>
        <Pressable onPress={onDeleteRequest} hitSlop={6}>
          <Text style={{ fontSize: 14, color: c.intent.error }}>🗑️</Text>
        </Pressable>
      </View>

      {/* Block type preview chips */}
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 5, padding: 10 }}>
        {template.blocks.slice(0, 6).map((b, i) => {
          const meta = BLOCK_META[b.type] ?? { emoji: '□', color: c.text.muted, label: b.type };
          return (
            <View key={i} style={{
              flexDirection: 'row', alignItems: 'center', gap: 3,
              paddingHorizontal: 7, paddingVertical: 3, borderRadius: 6,
              backgroundColor: meta.color + '20',
              borderWidth: 1, borderColor: meta.color + '35',
            }}>
              <Text style={{ fontSize: 11 }}>{meta.emoji}</Text>
              <Text style={{ fontSize: 10, fontWeight: '600', color: meta.color }}>{meta.label}</Text>
            </View>
          );
        })}
        {template.blocks.length > 6 && (
          <View style={{
            paddingHorizontal: 7, paddingVertical: 3, borderRadius: 6,
            backgroundColor: c.surface.elevated,
          }}>
            <Text style={{ fontSize: 10, color: c.text.muted }}>+{template.blocks.length - 6} more</Text>
          </View>
        )}
      </View>

      {/* Use button */}
      <Pressable
        onPress={onUse}
        style={({ pressed }) => ({
          flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
          paddingVertical: 10, marginHorizontal: 10, marginBottom: 10, borderRadius: 8,
          backgroundColor: pressed ? c.buttons.primary.pressed : c.buttons.primary.bg,
        })}
      >
        <Text style={{ fontSize: 14 }}>➕</Text>
        <Text style={{ fontSize: 13, fontWeight: '700', color: c.buttons.primary.text }}>Insert template</Text>
      </Pressable>
    </View>
  );
};

// ── Main modal ────────────────────────────────────────────────────────────────
const TemplatesModal: React.FC<Props> = ({
  visible, templates, onClose, onUse, onDelete,
}) => {
  const [search,       setSearch]       = useState('');
  const [deleteTarget, setDeleteTarget] = useState<BlockTemplate | null>(null);
  const c = useThemeColors();

  const filtered = templates.filter((t) =>
    t.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={{ flex: 1, backgroundColor: c.surface.secondary }}>
        {/* Header */}
        <View style={{
          flexDirection: 'row', alignItems: 'center', gap: 10,
          paddingHorizontal: 14, paddingVertical: 10,
          backgroundColor: c.surface.card,
          borderBottomWidth: 1, borderBottomColor: c.border.primary,
        }}>
          <Text style={{ fontSize: 18 }}>📋</Text>
          <Text style={{ flex: 1, fontSize: 16, fontWeight: '700', color: c.text.primary }}>
            Block Templates
          </Text>
          <Pressable onPress={onClose} hitSlop={8}>
            <Text style={{ fontSize: 14, color: c.text.muted, fontWeight: '600' }}>Close</Text>
          </Pressable>
        </View>

        {/* Search */}
        {templates.length > 3 && (
          <View style={{ paddingHorizontal: 14, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: c.border.primary }}>
            <TextInput
              value={search}
              onChangeText={setSearch}
              placeholder="Search templates…"
              placeholderTextColor={c.text.muted}
              style={{
                backgroundColor: c.surface.tertiary, borderRadius: 8,
                paddingHorizontal: 12, paddingVertical: 8,
                fontSize: 13, color: c.text.primary,
              }}
              clearButtonMode="while-editing"
            />
          </View>
        )}

        {/* List */}
        {filtered.length === 0 ? (
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10, padding: 40 }}>
            <Text style={{ fontSize: 40 }}>📋</Text>
            <Text style={{ fontSize: 15, fontWeight: '700', color: c.text.primary, textAlign: 'center' }}>
              {templates.length === 0 ? 'No templates yet' : 'No results'}
            </Text>
            <Text style={{ fontSize: 13, color: c.text.muted, textAlign: 'center' }}>
              {templates.length === 0
                ? 'Save a block as a template using the ⧉ menu in the block toolbar'
                : 'Try a different search term'}
            </Text>
          </View>
        ) : (
          <FlatList
            data={filtered}
            keyExtractor={(t) => t.id}
            contentContainerStyle={{ paddingTop: 12, paddingBottom: 40 }}
            showsVerticalScrollIndicator={false}
            renderItem={({ item }) => (
              <TemplateCard
                template={item}
                onUse={() => { onUse(item); onClose(); }}
                onDeleteRequest={() => setDeleteTarget(item)}
              />
            )}
          />
        )}
      </SafeAreaView>

      <ConfirmDeleteDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => { if (deleteTarget) { onDelete(deleteTarget.id); setDeleteTarget(null); } }}
        itemName={deleteTarget?.name}
        itemType="template"
      />
    </Modal>
  );
};

export default TemplatesModal;
