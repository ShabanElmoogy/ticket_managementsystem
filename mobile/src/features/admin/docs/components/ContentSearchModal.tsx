import React, { useState, useMemo } from 'react';
import {
  Modal, View, Text, TextInput, Pressable,
  FlatList, useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { Doc } from '../types/types';
import { useContentSearch, type SearchMatch } from '../hooks/useContentSearch';
import { BLOCK_META } from './editor/blockMeta';

interface Props {
  visible: boolean;
  docs: Doc[];
  isDark: boolean;
  onClose: () => void;
  onSelectDoc: (docId: string) => void;
}

// ── Block type badge ──────────────────────────────────────────────────────────
const BlockTypeBadge: React.FC<{ type: string; isDark: boolean }> = ({ type, isDark }) => {
  const meta = BLOCK_META[type] ?? { label: type, emoji: '□', color: '#64748b' };
  return (
    <View style={{
      flexDirection: 'row', alignItems: 'center', gap: 3,
      paddingHorizontal: 6, paddingVertical: 2, borderRadius: 5,
      backgroundColor: meta.color + (isDark ? '28' : '15'),
      borderWidth: 1, borderColor: meta.color + (isDark ? '44' : '25'),
    }}>
      <Text style={{ fontSize: 10 }}>{meta.emoji}</Text>
      <Text style={{ fontSize: 9, fontWeight: '700', color: meta.color, textTransform: 'uppercase' }}>
        {meta.label}
      </Text>
    </View>
  );
};

// ── Highlighted snippet — bolds the matching query ────────────────────────────
const HighlightedSnippet: React.FC<{ text: string; query: string; isDark: boolean }> = ({ text, query, isDark }) => {
  const muted = isDark ? '#94a3b8' : '#64748b';
  const highlight = isDark ? '#fef08a' : '#fef08a';
  const highlightText = isDark ? '#1e293b' : '#713f12';

  if (!query) return <Text style={{ fontSize: 12, color: muted }}>{text}</Text>;

  const lower = text.toLowerCase();
  const q     = query.toLowerCase();
  const idx   = lower.indexOf(q);
  if (idx === -1) return <Text style={{ fontSize: 12, color: muted }}>{text}</Text>;

  return (
    <Text style={{ fontSize: 12, color: muted }}>
      {text.slice(0, idx)}
      <Text style={{ backgroundColor: highlight, color: highlightText, fontWeight: '700' }}>
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
  isDark: boolean;
  onPress: () => void;
  showDocTitle: boolean;
}> = ({ match, query, isDark, onPress, showDocTitle }) => {
  const bg     = isDark ? '#1e293b' : '#fff';
  const border = isDark ? '#334155' : '#e2e8f0';
  const text   = isDark ? '#e2e8f0' : '#1e293b';
  const muted  = isDark ? '#64748b' : '#94a3b8';

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        backgroundColor: pressed ? (isDark ? '#273549' : '#f1f5f9') : bg,
        borderBottomWidth: 1, borderBottomColor: border,
        paddingHorizontal: 16, paddingVertical: 10,
      })}
    >
      {showDocTitle && (
        <Text style={{ fontSize: 11, fontWeight: '700', color: '#3b82f6', marginBottom: 4 }}>
          📄 {match.docTitle}
        </Text>
      )}
      <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 8 }}>
        <BlockTypeBadge type={match.blockType} isDark={isDark} />
        <View style={{ flex: 1 }}>
          <HighlightedSnippet text={match.snippet} query={query} isDark={isDark} />
        </View>
      </View>
    </Pressable>
  );
};

// ── Main modal ────────────────────────────────────────────────────────────────
const ContentSearchModal: React.FC<Props> = ({ visible, docs, isDark, onClose, onSelectDoc }) => {
  const [query, setQuery] = useState('');
  const { width } = useWindowDimensions();

  const results = useContentSearch(docs, query);

  // Group results by doc — show doc title only on first match per doc
  const items = useMemo(() => {
    const seen = new Set<string>();
    return results.map((m) => {
      const showDocTitle = !seen.has(m.docId);
      seen.add(m.docId);
      return { ...m, showDocTitle };
    });
  }, [results]);

  const bg        = isDark ? '#0f172a' : '#f8fafc';
  const headerBg  = isDark ? '#1e293b' : '#fff';
  const border    = isDark ? '#334155' : '#e2e8f0';
  const muted     = isDark ? '#64748b' : '#94a3b8';
  const inputBg   = isDark ? '#273549' : '#f1f5f9';

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
      <SafeAreaView style={{ flex: 1, backgroundColor: bg }}>
        {/* Header */}
        <View style={{
          flexDirection: 'row', alignItems: 'center', gap: 10,
          paddingHorizontal: 14, paddingVertical: 10,
          backgroundColor: headerBg,
          borderBottomWidth: 1, borderBottomColor: border,
        }}>
          <Text style={{ fontSize: 16 }}>🔍</Text>
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Search across all docs…"
            placeholderTextColor={muted}
            autoFocus
            style={{
              flex: 1, fontSize: 15,
              color: isDark ? '#e2e8f0' : '#1e293b',
              backgroundColor: inputBg,
              borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8,
            }}
            returnKeyType="search"
            clearButtonMode="while-editing"
          />
          <Pressable onPress={() => { setQuery(''); onClose(); }} hitSlop={8}>
            <Text style={{ fontSize: 14, color: muted, fontWeight: '600' }}>Cancel</Text>
          </Pressable>
        </View>

        {/* Results count */}
        {query.trim().length >= 2 && (
          <View style={{ paddingHorizontal: 16, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: border }}>
            <Text style={{ fontSize: 12, color: muted }}>
              {results.length === 0
                ? `No results for "${query}"`
                : `${results.length} result${results.length !== 1 ? 's' : ''} in ${new Set(results.map((r) => r.docId)).size} doc${new Set(results.map((r) => r.docId)).size !== 1 ? 's' : ''}`
              }
            </Text>
          </View>
        )}

        {/* Empty state */}
        {query.trim().length < 2 ? (
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10, padding: 40 }}>
            <Text style={{ fontSize: 40 }}>🔍</Text>
            <Text style={{ fontSize: 15, fontWeight: '700', color: isDark ? '#e2e8f0' : '#1e293b', textAlign: 'center' }}>
              Search doc content
            </Text>
            <Text style={{ fontSize: 13, color: muted, textAlign: 'center' }}>
              Search headings, text, code, quotes and more across all your documents
            </Text>
          </View>
        ) : results.length === 0 ? (
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8, padding: 40 }}>
            <Text style={{ fontSize: 36 }}>😶</Text>
            <Text style={{ fontSize: 14, fontWeight: '700', color: isDark ? '#e2e8f0' : '#1e293b' }}>
              No results found
            </Text>
            <Text style={{ fontSize: 12, color: muted, textAlign: 'center' }}>
              Try a different search term
            </Text>
          </View>
        ) : (
          <FlatList
            data={items}
            keyExtractor={(item) => `${item.docId}-${item.blockId}`}
            renderItem={({ item }) => (
              <ResultItem
                match={item}
                query={query}
                isDark={isDark}
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
