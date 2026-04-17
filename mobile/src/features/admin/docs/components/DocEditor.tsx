import React, { useState } from 'react';
import { ScrollView, View, Text, Pressable, Modal } from 'react-native';
import type { DocBlock, BlockType } from '../types/types';
import { BlockContainer, EditorEmptyState, renderBlockEditor } from './editor';
import { BLOCK_META } from './editor/blockMeta';

// ── Mini block picker — shown between blocks ──────────────────────────────────

const QUICK_BLOCKS: BlockType[] = [
  'text', 'heading', 'image', 'video', 'bulletedList',
  'numberedList', 'code', 'quote', 'callout', 'divider',
  'table', 'toggle', 'tabs', 'pdf', 'excel',
  'videoCarousel', 'imageCarousel',
];

interface MiniPickerProps {
  isDark: boolean;
  onPick: (type: BlockType) => void;
  onClose: () => void;
}

const MiniBlockPicker: React.FC<MiniPickerProps> = ({ isDark, onPick, onClose }) => {
  const bg     = isDark ? '#1e293b' : '#fff';
  const border = isDark ? '#334155' : '#e2e8f0';
  const text   = isDark ? '#e2e8f0' : '#1e293b';

  return (
    <Modal transparent animationType="fade" onRequestClose={onClose}>
      <Pressable
        style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center' }}
        onPress={onClose}
      >
        <Pressable
          style={{
            backgroundColor: bg, borderRadius: 14, borderWidth: 1, borderColor: border,
            padding: 12, width: 280, maxHeight: 400,
            shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.2, shadowRadius: 12, elevation: 8,
          }}
          onPress={(e) => e.stopPropagation()}
        >
          <Text style={{ fontSize: 12, fontWeight: '700', color: isDark ? '#64748b' : '#94a3b8', marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.6 }}>
            Insert block
          </Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
            {QUICK_BLOCKS.map((type) => {
              const meta = BLOCK_META[type] ?? { label: type, emoji: '□', color: '#64748b' };
              return (
                <Pressable
                  key={type}
                  onPress={() => { onPick(type); onClose(); }}
                  style={({ pressed }) => ({
                    flexDirection: 'row', alignItems: 'center', gap: 5,
                    paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8,
                    backgroundColor: pressed ? meta.color + '22' : (isDark ? '#0f172a' : '#f8fafc'),
                    borderWidth: 1, borderColor: pressed ? meta.color + '66' : border,
                  })}
                >
                  <Text style={{ fontSize: 13 }}>{meta.emoji}</Text>
                  <Text style={{ fontSize: 11, fontWeight: '600', color: text }}>{meta.label}</Text>
                </Pressable>
              );
            })}
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
};

// ── Insert divider — shown between blocks on hover ────────────────────────────

interface InsertDividerProps {
  isDark: boolean;
  onPress: () => void;
}

const InsertDivider: React.FC<InsertDividerProps> = ({ isDark, onPress }) => (
  <Pressable
    onPress={onPress}
    style={({ pressed }) => ({
      flexDirection: 'row', alignItems: 'center', gap: 6,
      marginVertical: 2, paddingVertical: 3, paddingHorizontal: 4,
      opacity: pressed ? 1 : 0.35,
    })}
    hitSlop={6}
  >
    <View style={{ flex: 1, height: 1, backgroundColor: isDark ? '#334155' : '#e2e8f0' }} />
    <View style={{
      width: 20, height: 20, borderRadius: 10,
      backgroundColor: isDark ? '#334155' : '#e2e8f0',
      alignItems: 'center', justifyContent: 'center',
    }}>
      <Text style={{ fontSize: 12, color: isDark ? '#94a3b8' : '#64748b', lineHeight: 14 }}>＋</Text>
    </View>
    <View style={{ flex: 1, height: 1, backgroundColor: isDark ? '#334155' : '#e2e8f0' }} />
  </Pressable>
);

// ── DocEditor ─────────────────────────────────────────────────────────────────

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

const DocEditor: React.FC<Props> = ({
  blocks, hasDoc, isDark,
  onUpdateBlock, onRemoveBlock, onDuplicateBlock, onMoveBlock, onInsertBlock,
}) => {
  const [insertAfter, setInsertAfter] = useState<number | null>(null);

  if (!hasDoc || blocks.length === 0) {
    return <EditorEmptyState isDark={isDark} hasDoc={hasDoc} />;
  }

  return (
    <>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 12, paddingBottom: 24 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {blocks.map((block, index) => (
          <React.Fragment key={block.id}>
            <BlockContainer
              block={block}
              index={index}
              total={blocks.length}
              isDark={isDark}
              onMoveUp={()    => onMoveBlock(block.id, -1)}
              onMoveDown={()  => onMoveBlock(block.id, 1)}
              onDuplicate={() => onDuplicateBlock(block.id)}
              onDelete={()    => onRemoveBlock(block.id)}
            >
              {renderBlockEditor(block, isDark, (patch) => onUpdateBlock(block.id, patch))}
            </BlockContainer>

            {/* Insert divider between blocks */}
            <InsertDivider
              isDark={isDark}
              onPress={() => setInsertAfter(index)}
            />
          </React.Fragment>
        ))}
      </ScrollView>

      {/* Mini block picker modal */}
      {insertAfter !== null && (
        <MiniBlockPicker
          isDark={isDark}
          onPick={(type) => onInsertBlock(type, insertAfter)}
          onClose={() => setInsertAfter(null)}
        />
      )}
    </>
  );
};

export default DocEditor;
