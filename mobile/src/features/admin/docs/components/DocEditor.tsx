import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable } from 'react-native';
import type { DocBlock, BlockType } from '../types/types';
import {
  HeadingBlockEditor, TextBlockEditor, CodeBlockEditor, ImageBlockEditor,
  VideoBlockEditor, BulletedListEditor, NumberedListEditor, QuoteEditor,
  CalloutEditor, TableEditor, ToggleEditor, TabsEditor,
  VideoCarouselEditor, DividerBlockView,
} from './blockEditors';

// ── Block type metadata ───────────────────────────────────────────────────────

const BLOCK_META: Record<string, { label: string; emoji: string; color: string }> = {
  heading:       { label: 'Heading',       emoji: '𝐇',   color: '#6366f1' },
  text:          { label: 'Text',          emoji: '¶',   color: '#3b82f6' },
  divider:       { label: 'Divider',       emoji: '—',   color: '#94a3b8' },
  image:         { label: 'Image',         emoji: '🖼️',  color: '#ec4899' },
  video:         { label: 'Video',         emoji: '▶️',  color: '#ef4444' },
  bulletedList:  { label: 'Bullet List',   emoji: '•',   color: '#10b981' },
  numberedList:  { label: 'Numbered List', emoji: '①',   color: '#10b981' },
  code:          { label: 'Code',          emoji: '</>',  color: '#f59e0b' },
  quote:         { label: 'Quote',         emoji: '❝',   color: '#8b5cf6' },
  callout:       { label: 'Callout',       emoji: '💡',  color: '#f59e0b' },
  table:         { label: 'Table',         emoji: '⊞',   color: '#0ea5e9' },
  toggle:        { label: 'Toggle',        emoji: '▸',   color: '#64748b' },
  tabs:          { label: 'Tabs',          emoji: '⊟',   color: '#0ea5e9' },
  videoCarousel: { label: 'Carousel',      emoji: '🎬',  color: '#ef4444' },
};

interface Props {
  blocks: DocBlock[];
  hasDoc: boolean;
  isDark: boolean;
  onUpdateBlock: (id: string, patch: Partial<DocBlock>) => void;
  onRemoveBlock: (id: string) => void;
  onDuplicateBlock: (id: string) => void;
  onMoveBlock: (id: string, dir: -1 | 1) => void;
  onInsertBlock: (type: BlockType, afterIndex: number) => void;
}

// ── Block container ───────────────────────────────────────────────────────────

const BlockContainer: React.FC<{
  block: DocBlock;
  index: number;
  total: number;
  isDark: boolean;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
  children: React.ReactNode;
}> = ({ block, index, total, isDark, onMoveUp, onMoveDown, onDuplicate, onDelete, children }) => {
  const [focused, setFocused] = useState(false);
  const meta = BLOCK_META[block.type] ?? { label: block.type, emoji: '□', color: '#64748b' };

  // ── Dark mode: distinct layered grays ──────────────────────────────────────
  // card bg:    #1e293b  (slate-800)
  // toolbar bg: #273549  (between slate-800 and slate-700 — clearly different)
  // btn bg:     #334155  (slate-700 — visible against toolbar)
  // ── Light mode: clean whites ───────────────────────────────────────────────
  // card bg:    #ffffff
  // toolbar bg: #f1f5f9  (slate-100)
  // btn bg:     #ffffff

  const cardBg    = isDark ? '#1e293b' : '#ffffff';
  const toolbarBg = isDark ? '#273549' : '#f1f5f9';
  const btnBg     = isDark ? '#334155' : '#ffffff';
  const btnBorder = isDark ? '#475569' : '#e2e8f0';
  const btnText   = isDark ? '#cbd5e1' : '#64748b';
  const divider   = isDark ? '#334155' : '#e9ecef';
  const cardBorder = focused
    ? meta.color + '88'
    : isDark ? '#3d5068' : '#e2e8f0';

  // Delete button — dark mode needs dark red bg, not light pink
  const deleteBg     = isDark ? '#3b1515' : '#fef2f2';
  const deleteBorder = isDark ? '#7f1d1d' : '#fecaca';

  return (
    <Pressable
      onPress={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      style={{
        marginBottom: 10,
        borderRadius: 12,
        borderWidth: 1.5,
        borderColor: cardBorder,
        backgroundColor: cardBg,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: isDark ? 2 : 1 },
        shadowOpacity: isDark ? 0.3 : 0.06,
        shadowRadius: isDark ? 6 : 3,
        elevation: isDark ? 4 : 2,
      }}
    >
      {/* ── Block header toolbar ── */}
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
        {/* Type badge — stronger opacity in dark */}
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
            color: isDark ? meta.color : meta.color,
            textTransform: 'uppercase', letterSpacing: 0.4,
          }}>
            {meta.label}
          </Text>
        </View>

        <View style={{ flex: 1 }} />

        {/* Move up */}
        <Pressable
          onPress={onMoveUp}
          disabled={index === 0}
          hitSlop={6}
          style={({ pressed }) => ({
            width: 28, height: 28, borderRadius: 7,
            alignItems: 'center', justifyContent: 'center',
            backgroundColor: pressed ? btnBorder : btnBg,
            opacity: index === 0 ? 0.3 : 1,
            borderWidth: 1, borderColor: btnBorder,
          })}
        >
          <Text style={{ fontSize: 13, color: btnText, lineHeight: 15 }}>↑</Text>
        </Pressable>

        {/* Move down */}
        <Pressable
          onPress={onMoveDown}
          disabled={index === total - 1}
          hitSlop={6}
          style={({ pressed }) => ({
            width: 28, height: 28, borderRadius: 7,
            alignItems: 'center', justifyContent: 'center',
            backgroundColor: pressed ? btnBorder : btnBg,
            opacity: index === total - 1 ? 0.3 : 1,
            borderWidth: 1, borderColor: btnBorder,
          })}
        >
          <Text style={{ fontSize: 13, color: btnText, lineHeight: 15 }}>↓</Text>
        </Pressable>

        {/* Duplicate */}
        <Pressable
          onPress={onDuplicate}
          hitSlop={6}
          style={({ pressed }) => ({
            width: 28, height: 28, borderRadius: 7,
            alignItems: 'center', justifyContent: 'center',
            backgroundColor: pressed ? btnBorder : btnBg,
            borderWidth: 1, borderColor: btnBorder,
          })}
        >
          <Text style={{ fontSize: 13, color: btnText }}>⧉</Text>
        </Pressable>

        {/* Delete */}
        <Pressable
          onPress={onDelete}
          hitSlop={6}
          style={({ pressed }) => ({
            width: 28, height: 28, borderRadius: 7,
            alignItems: 'center', justifyContent: 'center',
            backgroundColor: pressed ? (isDark ? '#7f1d1d' : '#fee2e2') : deleteBg,
            borderWidth: 1, borderColor: deleteBorder,
          })}
        >
          <Text style={{ fontSize: 13, color: isDark ? '#fca5a5' : '#ef4444' }}>✕</Text>
        </Pressable>
      </View>

      {/* ── Block content ── */}
      <View style={{ padding: 14 }}>
        {children}
      </View>
    </Pressable>
  );
};

// ── Render block editor ───────────────────────────────────────────────────────

function renderBlockEditor(block: DocBlock, isDark: boolean, onChange: (patch: Partial<DocBlock>) => void): React.ReactNode {
  switch (block.type) {
    case 'heading':       return <HeadingBlockEditor    block={block} isDark={isDark} onChange={onChange as any} />;
    case 'text':          return <TextBlockEditor       block={block} isDark={isDark} onChange={onChange as any} />;
    case 'divider':       return <DividerBlockView      block={block} isDark={isDark} onChange={onChange as any} />;
    case 'image':         return <ImageBlockEditor      block={block} isDark={isDark} onChange={onChange as any} />;
    case 'video':         return <VideoBlockEditor      block={block} isDark={isDark} onChange={onChange as any} />;
    case 'bulletedList':  return <BulletedListEditor    block={block} isDark={isDark} onChange={onChange as any} />;
    case 'numberedList':  return <NumberedListEditor    block={block} isDark={isDark} onChange={onChange as any} />;
    case 'code':          return <CodeBlockEditor       block={block} isDark={isDark} onChange={onChange as any} />;
    case 'quote':         return <QuoteEditor           block={block} isDark={isDark} onChange={onChange as any} />;
    case 'callout':       return <CalloutEditor         block={block} isDark={isDark} onChange={onChange as any} />;
    case 'table':         return <TableEditor           block={block} isDark={isDark} onChange={onChange as any} />;
    case 'toggle':        return <ToggleEditor          block={block} isDark={isDark} onChange={onChange as any} />;
    case 'tabs':          return <TabsEditor            block={block} isDark={isDark} onChange={onChange as any} />;
    case 'videoCarousel': return <VideoCarouselEditor   block={block} isDark={isDark} onChange={onChange as any} />;
    default:              return null;
  }
}

// ── Empty states ──────────────────────────────────────────────────────────────

const EmptyState: React.FC<{ isDark: boolean; hasDoc: boolean }> = ({ isDark, hasDoc }) => (
  <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40 }}>
    <View style={{
      width: 72, height: 72, borderRadius: 20, alignItems: 'center', justifyContent: 'center',
      backgroundColor: isDark ? '#1e293b' : '#f1f5f9',
      marginBottom: 16,
    }}>
      <Text style={{ fontSize: 32 }}>{hasDoc ? '✏️' : '📄'}</Text>
    </View>
    <Text style={{ fontSize: 17, fontWeight: '700', color: isDark ? '#e2e8f0' : '#1e293b', marginBottom: 8, textAlign: 'center' }}>
      {hasDoc ? 'Document is empty' : 'No document selected'}
    </Text>
    <Text style={{ fontSize: 14, color: isDark ? '#64748b' : '#94a3b8', textAlign: 'center', lineHeight: 20 }}>
      {hasDoc
        ? 'Tap a block type below to start adding content'
        : 'Open the sidebar to select or create a document'}
    </Text>
  </View>
);

// ── Main editor ───────────────────────────────────────────────────────────────

const DocEditor: React.FC<Props> = ({
  blocks, hasDoc, isDark,
  onUpdateBlock, onRemoveBlock, onDuplicateBlock, onMoveBlock,
}) => {
  if (!hasDoc || blocks.length === 0) {
    return <EmptyState isDark={isDark} hasDoc={hasDoc} />;
  }

  return (
    <ScrollView
      style={{ flex: 1 }}
      contentContainerStyle={{ padding: 12, paddingBottom: 24 }}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      {blocks.map((block, index) => (
        <BlockContainer
          key={block.id}
          block={block}
          index={index}
          total={blocks.length}
          isDark={isDark}
          onMoveUp={() => onMoveBlock(block.id, -1)}
          onMoveDown={() => onMoveBlock(block.id, 1)}
          onDuplicate={() => onDuplicateBlock(block.id)}
          onDelete={() => onRemoveBlock(block.id)}
        >
          {renderBlockEditor(block, isDark, (patch) => onUpdateBlock(block.id, patch))}
        </BlockContainer>
      ))}
    </ScrollView>
  );
};

export default DocEditor;
