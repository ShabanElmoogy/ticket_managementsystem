import React, { useState, useRef, useCallback } from 'react';
import { ScrollView, View, findNodeHandle, UIManager } from 'react-native';
import type { DocBlock, BlockType } from '../types/types';
import {
  BlockContainer, EditorEmptyState, renderBlockEditor,
  InsertDivider, MiniBlockPicker,
} from './editor';

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
  const scrollRef = useRef<ScrollView>(null);

  /**
   * Called by each block when its TextInput receives focus.
   * Measures the block's position relative to the ScrollView and scrolls to it.
   * Works with softwareKeyboardLayoutMode="resize" — the window shrinks,
   * so we scroll the focused block into the visible area above the keyboard.
   */
  const scrollToBlock = useCallback((blockNode: View | null) => {
    if (!blockNode || !scrollRef.current) return;
    const scrollHandle = findNodeHandle(scrollRef.current);
    if (!scrollHandle) return;

    // Small delay so the keyboard has started appearing and layout is updated
    setTimeout(() => {
      blockNode.measureLayout(
        scrollHandle,
        (_x, y, _w, h) => {
          // Scroll so the block top is 16px from the top of the visible area
          scrollRef.current?.scrollTo({ y: Math.max(0, y - 16), animated: true });
        },
        () => {} // error — ignore
      );
    }, 150);
  }, []);

  if (!hasDoc || blocks.length === 0) {
    return <EditorEmptyState isDark={isDark} hasDoc={hasDoc} />;
  }

  return (
    <>
      <ScrollView
        ref={scrollRef}
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 12, paddingBottom: 120 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        // automaticallyAdjustKeyboardInsets works on iOS with pan mode
        // On Android with resize mode we use scrollToBlock instead
        automaticallyAdjustKeyboardInsets={false}
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
              onFocus={scrollToBlock}
            >
              {renderBlockEditor(block, isDark, (patch) => onUpdateBlock(block.id, patch))}
            </BlockContainer>

            <InsertDivider
              isDark={isDark}
              onPress={() => setInsertAfter(index)}
            />
          </React.Fragment>
        ))}
      </ScrollView>

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
