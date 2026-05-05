import React, { useState, useMemo } from 'react';
import {
  Modal, View, Text, TextInput, Pressable,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useThemeColors } from '@/src/constants/theme';
import { BLOCK_META } from '@/src/features/admin/docs/components/editor/blockMeta';
import { useContentSearch, type SearchMatch } from '@/src/features/admin/docs/hooks/useContentSearch';
import type { Doc } from '@/src/features/admin/docs/types/types';

interface Props {
  visible: boolean;
  docs: Doc[];
  onClose: () => void;
  onSelectDoc: (docId: string) => void;
}

// ── Block type badge ──────────────────────────────────────────────────────────
const BlockTypeBadge: React.FC<{ type: string }> = ({ type }) => {
  const c    = useThemeColors();
  const meta = BLOCK_META[type] ?? { label: type, emoji: '□', color: c.text.muted };
  return (
    <View style={{
      flexDirection: 'row', alignItems: 'center', gap: 3,
      paddingHorizontal: 6, paddingVertical: 2, borderRadius: 5,
      backgroundColor: meta.color + '20',
      borderWidth: 1, borderColor: meta.color + '40',
    }}>
      <Text style={{ fontSize: 10 }}>{meta.emoji}</Text>
      <Text style={{ fontSize: 9, fontWeight: '700', color: meta.color, textTransform: 'uppercase' }}>
        {meta.label}
      </Text>
    </View>
  );
};

// ── Highlighted snippet ───────────────────────────────────────────────────────
const HighlightedSnippet: React.FC<{ text: string; query: string }> = ({ text, query }) => {
  const c = useThemeColors();
  if (!query) return <Text style={{ fontSize: 12, color: c.text.muted }}>{text}</Text>;

  const lower = text.toLowerCase();
  const q     = query.toLowerCase();
  const idx   = lower.indexOf(q);
  if (idx === -1) return <Text style={{ fontSize: 12, color: c.text.muted }}>{text}</Text>;

  return (
    <Text style={{ fontSize: 12, color: c.text.muted }}>
      {text.slice(0, idx)}
      <Text style={{ backgroundColor: '#fef08a', color: '#713f12', fontWeight: '700' }}>
        {text.slice(idx, idx + query.length)}
      </Text>
      {text.slice(idx + query.length)}
    </Text>
  );
};

// ── Result item ───────────────────────────────────────────────────────────────
const ResultItem: React.FC<{
  match: SearchMatch;
  query: string;
  onPress: () => void;
  showDocTitle: boolean;
}> = ({ match, query, onPress, showDocTitle }) => {
  const c = useThemeColors();
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        backgroundColor: pressed ? c.surface.elevated : c.surface.card,
        borderBottomWidth: 1, borderBottomColor: c.border.primary,
        paddingHorizontal: 16, paddingVertical: 10,
      })}
    >
      {showDocTitle && (
        <Text style={{ fontSize: 11, fontWeight: '700', color: c.interactive.primary, marginBottom: 4 }}>
          📄 {match.docTitle}
        </Text>
      )}
      <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 8 }}>
        <BlockTypeBadge type={match.blockType} />
        <View style={{ flex: 1 }}>
          <HighlightedSnippet text={match.snippet} query={query} />
        </View>
      </View>
    </Pressable>
  );
};

// ── Main modal ────────────────────────────────────────────────────────────────
const ContentSearchModal: React.FC<Props> = ({ visible, docs, onClose, onSelectDoc }) => {
  const [query, setQuery] = useState('');
  const c = useThemeColors();

  const results = useContentSearch(docs, query);

  const items = useMemo(() => {
    const seen = new Set<string>();
    return results.map((m) => {
      const showDocTitle = !seen.has(m.docId);
      seen.add(m.docId);
      return { ...m, showDocTitle };
    });
  }, [results]);

  const handleSelect = (docId: string) => {
    onSelectDoc(docId);
    setQuery('');
    onClose();
  };

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
          <Text style={{ fontSize: 16 }}>🔍</Text>
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Search across all docs…"
            placeholderTextColor={c.text.muted}
            autoFocus
            style={{
              flex: 1, fontSize: 15,
              color: c.text.primary,
              backgroundColor: c.surface.tertiary,
              borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8,
            }}
            returnKeyType="search"
            clearButtonMode="while-editing"
          />
          <Pressable onPress={() => { setQuery(''); onClose(); }} hitSlop={8}>
            <Text style={{ fontSize: 14, color: c.text.muted, fontWeight: '600' }}>Cancel</Text>
          </Pressable>
        </View>

        {/* Results count */}
        {query.trim().length >= 2 && (
          <View style={{ paddingHorizontal: 16, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: c.border.primary }}>
            <Text style={{ fontSize: 12, color: c.text.muted }}>
              {results.length === 0
                ? `No results for "${query}"`
                : `${results.length} result${results.length !== 1 ? 's' : ''} in ${new Set(results.map((r) => r.docId)).size} doc${new Set(results.map((r) => r.docId)).size !== 1 ? 's' : ''}`
              }
            </Text>
          </View>
        )}

        {query.trim().length < 2 ? (
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10, padding: 40 }}>
            <Text style={{ fontSize: 40 }}>🔍</Text>
            <Text style={{ fontSize: 15, fontWeight: '700', color: c.text.primary, textAlign: 'center' }}>
              Search doc content
            </Text>
            <Text style={{ fontSize: 13, color: c.text.muted, textAlign: 'center' }}>
              Search headings, text, code, quotes and more across all your documents
            </Text>
          </View>
        ) : results.length === 0 ? (
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8, padding: 40 }}>
            <Text style={{ fontSize: 36 }}>😶</Text>
            <Text style={{ fontSize: 14, fontWeight: '700', color: c.text.primary }}>No results found</Text>
            <Text style={{ fontSize: 12, color: c.text.muted, textAlign: 'center' }}>Try a different search term</Text>
          </View>
        ) : (
          <FlatList
            data={items}
            keyExtractor={(item) => `${item.docId}-${item.blockId}`}
            renderItem={({ item }) => (
              <ResultItem
                match={item}
                query={query}
                showDocTitle={item.showDocTitle}
                onPress={() => handleSelect(item.docId)}
              />
            )}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          />
        )}
      </SafeAreaView>
    </Modal>
  );
};

export default ContentSearchModal;
