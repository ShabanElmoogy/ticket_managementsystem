import React from 'react';
import { View, Text, ScrollView, Pressable } from 'react-native';
import type { DocBlock, BlockType } from '../types/types';
import {
  HeadingBlockEditor, TextBlockEditor, CodeBlockEditor, ImageBlockEditor,
  VideoBlockEditor, BulletedListEditor, NumberedListEditor, QuoteEditor,
  CalloutEditor, TableEditor, ToggleEditor, TabsEditor,
  VideoCarouselEditor, DividerBlockView,
} from './blockEditors';

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

// ── Block wrapper with actions ────────────────────────────────────────────────

const BlockContainer: React.FC<{
  index: number;
  total: number;
  isDark: boolean;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
  children: React.ReactNode;
}> = ({ index, total, isDark, onMoveUp, onMoveDown, onDuplicate, onDelete, children }) => (
  <View style={{
    marginBottom: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'transparent',
  }}>
    {/* Action bar */}
    <View style={{
      flexDirection: 'row',
      justifyContent: 'flex-end',
      gap: 2,
      paddingHorizontal: 4,
      paddingTop: 2,
      paddingBottom: 2,
    }}>
      <Pressable onPress={onMoveUp} disabled={index === 0} hitSlop={4}
        style={{ padding: 4, opacity: index === 0 ? 0.3 : 1 }}>
        <Text style={{ fontSize: 12, color: isDark ? '#64748b' : '#9ca3af' }}>↑</Text>
      </Pressable>
      <Pressable onPress={onMoveDown} disabled={index === total - 1} hitSlop={4}
        style={{ padding: 4, opacity: index === total - 1 ? 0.3 : 1 }}>
        <Text style={{ fontSize: 12, color: isDark ? '#64748b' : '#9ca3af' }}>↓</Text>
      </Pressable>
      <Pressable onPress={onDuplicate} hitSlop={4} style={{ padding: 4 }}>
        <Text style={{ fontSize: 12, color: isDark ? '#64748b' : '#9ca3af' }}>⧉</Text>
      </Pressable>
      <Pressable onPress={onDelete} hitSlop={4} style={{ padding: 4 }}>
        <Text style={{ fontSize: 12, color: '#ef4444' }}>✕</Text>
      </Pressable>
    </View>
    {/* Block content */}
    <View style={{ paddingHorizontal: 12, paddingBottom: 8 }}>
      {children}
    </View>
  </View>
);

// ── Render a single block ─────────────────────────────────────────────────────

function renderBlockEditor(block: DocBlock, isDark: boolean, onChange: (patch: Partial<DocBlock>) => void): React.ReactNode {
  switch (block.type) {
    case 'heading':       return <HeadingBlockEditor    block={block} isDark={isDark} onChange={onChange as any} />;
    case 'text':          return <TextBlockEditor       block={block} isDark={isDark} onChange={onChange as any} />;
    case 'divider':       return <DividerBlockView      block={block} isDark={isDark} />;
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

// ── Main editor ───────────────────────────────────────────────────────────────

const DocEditor: React.FC<Props> = ({
  blocks, hasDoc, isDark,
  onUpdateBlock, onRemoveBlock, onDuplicateBlock, onMoveBlock, onInsertBlock,
}) => {
  if (!hasDoc) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 }}>
        <Text style={{ fontSize: 32, marginBottom: 12 }}>📄</Text>
        <Text style={{ fontSize: 16, fontWeight: '600', color: isDark ? '#94a3b8' : '#64748b' }}>
          Select a document to start editing
        </Text>
        <Text style={{ fontSize: 13, color: isDark ? '#475569' : '#9ca3af', marginTop: 6, textAlign: 'center' }}>
          Choose a document from the sidebar or create a new one
        </Text>
      </View>
    );
  }

  if (blocks.length === 0) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 }}>
        <Text style={{ fontSize: 32, marginBottom: 12 }}>✏️</Text>
        <Text style={{ fontSize: 15, fontWeight: '600', color: isDark ? '#94a3b8' : '#64748b' }}>
          This document is empty
        </Text>
        <Text style={{ fontSize: 13, color: isDark ? '#475569' : '#9ca3af', marginTop: 6, textAlign: 'center' }}>
          Use the block palette below to add content
        </Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={{ flex: 1 }}
      contentContainerStyle={{ paddingVertical: 8, paddingHorizontal: 4 }}
      keyboardShouldPersistTaps="handled"
    >
      {blocks.map((block, index) => (
        <BlockContainer
          key={block.id}
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
