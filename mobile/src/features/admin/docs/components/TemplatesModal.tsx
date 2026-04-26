import React, { useState } from 'react';
import {
  Modal, View, Text, Pressable, FlatList,
  TextInput, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BLOCK_META } from '@/src/features/admin/docs/components/editor/blockMeta';
import type { BlockTemplate } from '@/src/features/admin/docs/hooks/useBlockTemplates';

interface Props {
  visible: boolean;
  templates: BlockTemplate[];
  isDark: boolean;
  onClose: () => void;
  onUse: (template: BlockTemplate) => void;
  onDelete: (id: string) => void;
}

// ── Template card ─────────────────────────────────────────────────────────────
const TemplateCard: React.FC<{
  template: BlockTemplate;
  isDark: boolean;
  onUse: () => void;
  onDelete: () => void;
}> = ({ template, isDark, onUse, onDelete }) => {
  const bg     = isDark ? '#1e293b' : '#fff';
  const border = isDark ? '#334155' : '#e2e8f0';
  const text   = isDark ? '#e2e8f0' : '#1e293b';
  const muted  = isDark ? '#64748b' : '#94a3b8';

  const handleDelete = () => {
    Alert.alert(
      'Delete template',
      `Delete "${template.name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: onDelete },
      ],
    );
  };

  return (
    <View style={{
      backgroundColor: bg, borderRadius: 12,
      borderWidth: 1, borderColor: border,
      marginHorizontal: 14, marginBottom: 10,
      overflow: 'hidden',
    }}>
      {/* Header */}
      <View style={{
        flexDirection: 'row', alignItems: 'center', gap: 10,
        paddingHorizontal: 14, paddingVertical: 10,
        backgroundColor: isDark ? '#0f172a' : '#f8fafc',
        borderBottomWidth: 1, borderBottomColor: border,
      }}>
        <Text style={{ fontSize: 18 }}>📋</Text>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 14, fontWeight: '700', color: text }} numberOfLines={1}>
            {template.name}
          </Text>
          <Text style={{ fontSize: 11, color: muted, marginTop: 1 }}>
            {template.blocks.length} block{template.blocks.length !== 1 ? 's' : ''} · {new Date(template.createdAt).toLocaleDateString()}
          </Text>
        </View>
        <Pressable onPress={handleDelete} hitSlop={6}>
          <Text style={{ fontSize: 14, color: '#ef4444' }}>🗑️</Text>
        </Pressable>
      </View>

      {/* Block type preview chips */}
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 5, padding: 10 }}>
        {template.blocks.slice(0, 6).map((b, i) => {
          const meta = BLOCK_META[b.type] ?? { emoji: '□', color: '#64748b', label: b.type };
          return (
            <View key={i} style={{
              flexDirection: 'row', alignItems: 'center', gap: 3,
              paddingHorizontal: 7, paddingVertical: 3, borderRadius: 6,
              backgroundColor: meta.color + (isDark ? '28' : '15'),
              borderWidth: 1, borderColor: meta.color + (isDark ? '44' : '25'),
            }}>
              <Text style={{ fontSize: 11 }}>{meta.emoji}</Text>
              <Text style={{ fontSize: 10, fontWeight: '600', color: meta.color }}>{meta.label}</Text>
            </View>
          );
        })}
        {template.blocks.length > 6 && (
          <View style={{
            paddingHorizontal: 7, paddingVertical: 3, borderRadius: 6,
            backgroundColor: isDark ? '#334155' : '#f1f5f9',
          }}>
            <Text style={{ fontSize: 10, color: muted }}>+{template.blocks.length - 6} more</Text>
          </View>
        )}
      </View>

      {/* Use button */}
      <Pressable
        onPress={onUse}
        style={({ pressed }) => ({
          flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
          paddingVertical: 10, marginHorizontal: 10, marginBottom: 10, borderRadius: 8,
          backgroundColor: pressed ? '#2563eb' : '#3b82f6',
        })}
      >
        <Text style={{ fontSize: 14 }}>➕</Text>
        <Text style={{ fontSize: 13, fontWeight: '700', color: '#fff' }}>Insert template</Text>
      </Pressable>
    </View>
  );
};

// ── Main modal ────────────────────────────────────────────────────────────────
const TemplatesModal: React.FC<Props> = ({
  visible, templates, isDark, onClose, onUse, onDelete,
}) => {
  const [search, setSearch] = useState('');

  const bg       = isDark ? '#0f172a' : '#f8fafc';
  const headerBg = isDark ? '#1e293b' : '#fff';
  const border   = isDark ? '#334155' : '#e2e8f0';
  const muted    = isDark ? '#64748b' : '#94a3b8';
  const inputBg  = isDark ? '#273549' : '#f1f5f9';

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
      <SafeAreaView style={{ flex: 1, backgroundColor: bg }}>
        {/* Header */}
        <View style={{
          flexDirection: 'row', alignItems: 'center', gap: 10,
          paddingHorizontal: 14, paddingVertical: 10,
          backgroundColor: headerBg,
          borderBottomWidth: 1, borderBottomColor: border,
        }}>
          <Text style={{ fontSize: 18 }}>📋</Text>
          <Text style={{ flex: 1, fontSize: 16, fontWeight: '700', color: isDark ? '#e2e8f0' : '#1e293b' }}>
            Block Templates
          </Text>
          <Pressable onPress={onClose} hitSlop={8}>
            <Text style={{ fontSize: 14, color: muted, fontWeight: '600' }}>Close</Text>
          </Pressable>
        </View>

        {/* Search */}
        {templates.length > 3 && (
          <View style={{ paddingHorizontal: 14, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: border }}>
            <TextInput
              value={search}
              onChangeText={setSearch}
              placeholder="Search templates…"
              placeholderTextColor={muted}
              style={{
                backgroundColor: inputBg, borderRadius: 8,
                paddingHorizontal: 12, paddingVertical: 8,
                fontSize: 13, color: isDark ? '#e2e8f0' : '#1e293b',
              }}
              clearButtonMode="while-editing"
            />
          </View>
        )}

        {/* List */}
        {filtered.length === 0 ? (
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10, padding: 40 }}>
            <Text style={{ fontSize: 40 }}>📋</Text>
            <Text style={{ fontSize: 15, fontWeight: '700', color: isDark ? '#e2e8f0' : '#1e293b', textAlign: 'center' }}>
              {templates.length === 0 ? 'No templates yet' : 'No results'}
            </Text>
            <Text style={{ fontSize: 13, color: muted, textAlign: 'center' }}>
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
                isDark={isDark}
                onUse={() => { onUse(item); onClose(); }}
                onDelete={() => onDelete(item.id)}
              />
            )}
          />
        )}
      </SafeAreaView>
    </Modal>
  );
};

export default TemplatesModal;
