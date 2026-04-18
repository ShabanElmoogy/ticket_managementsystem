import React, { useState, useRef, useCallback } from 'react';
import {
  ScrollView, View, Text, Pressable,
  PanResponder, Animated, LayoutAnimation, UIManager, Platform,
} from 'react-native';
import type { DocBlock, BlockType } from '../types/types';
import {
  BlockContainer, EditorEmptyState, renderBlockEditor,
  InsertDivider, MiniBlockPicker,
} from './editor';

// Enable LayoutAnimation on Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

interface Props {
  blocks: DocBlock[];
  hasDoc: boolean;
  isDark: boolean;
  onUpdateBlock: (id: string, patch: Partial<DocBlock>) => void;
  onRemoveBlock: (id: string) => void;
  onDuplicateBlock: (id: string) => void;
  onMoveBlock: (id: string, dir: -1 | 1) => void;
  onInsertBlock: (type: BlockType, afterIndex: number) => void;
  onReorderBlocks: (orderedIds: string[]) => void;
  onSaveBlockAsTemplate?: (block: DocBlock) => void;
}

// ── Drag handle ───────────────────────────────────────────────────────────────

const DragHandle: React.FC<{
  isDark: boolean;
  isDragging: boolean;
  panHandlers: object;
}> = ({ isDark, isDragging, panHandlers }) => (
  <View
    {...panHandlers}
    style={{
      paddingHorizontal: 10,
      paddingVertical: 8,
      alignItems: 'center',
      justifyContent: 'center',
      opacity: isDragging ? 0.4 : 1,
    }}
    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
  >
    <Text style={{
      fontSize: 16,
      color: isDragging ? '#3b82f6' : (isDark ? '#475569' : '#94a3b8'),
      letterSpacing: 1,
    }}>
      ☰
    </Text>
  </View>
);

// ── Drop indicator ────────────────────────────────────────────────────────────

const DropIndicator: React.FC<{ isDark: boolean }> = ({ isDark }) => (
  <View style={{
    height: 3,
    borderRadius: 2,
    backgroundColor: '#3b82f6',
    marginHorizontal: 8,
    marginVertical: 2,
    shadowColor: '#3b82f6',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 4,
    elevation: 4,
  }} />
);

// ── Main editor ───────────────────────────────────────────────────────────────

const DocEditor: React.FC<Props> = ({
  blocks, hasDoc, isDark,
  onUpdateBlock, onRemoveBlock, onDuplicateBlock, onMoveBlock,
  onInsertBlock, onReorderBlocks, onSaveBlockAsTemplate,
}) => {
  const [insertAfter, setInsertAfter] = useState<number | null>(null);

  // ── Drag state ──────────────────────────────────────────────────────────────
  const [draggingId,  setDraggingId]  = useState<string | null>(null);
  const [dropIndex,   setDropIndex]   = useState<number | null>(null);
  const dragY         = useRef(new Animated.Value(0)).current;
  const dragStartY    = useRef(0);
  const blockHeights  = useRef<Record<string, number>>({});
  const blockOffsets  = useRef<Record<string, number>>({});
  const scrollOffset  = useRef(0);
  const scrollRef     = useRef<ScrollView>(null);

  // Compute which drop slot the finger is over
  const computeDropIndex = useCallback((absoluteY: number) => {
    const relY = absoluteY + scrollOffset.current;
    let cumulative = 0;
    for (let i = 0; i < blocks.length; i++) {
      const h = blockHeights.current[blocks[i].id] ?? 60;
      const mid = cumulative + h / 2;
      if (relY < mid) return i;
      cumulative += h;
    }
    return blocks.length;
  }, [blocks]);

  // Build PanResponder for a specific block
  const makePanResponder = useCallback((blockId: string, blockIndex: number) => {
    return PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder:  (_, g) => Math.abs(g.dy) > 4,

      onPanResponderGrant: (_, g) => {
        dragStartY.current = g.y0;
        dragY.setValue(0);
        setDraggingId(blockId);
        setDropIndex(blockIndex);
      },

      onPanResponderMove: (_, g) => {
        dragY.setValue(g.dy);
        const newDrop = computeDropIndex(g.moveY);
        setDropIndex(newDrop);

        // Auto-scroll when near edges
        const EDGE = 80;
        const { height: winH } = require('react-native').Dimensions.get('window');
        if (g.moveY < EDGE) {
          scrollRef.current?.scrollTo({ y: Math.max(0, scrollOffset.current - 8), animated: false });
        } else if (g.moveY > winH - EDGE) {
          scrollRef.current?.scrollTo({ y: scrollOffset.current + 8, animated: false });
        }
      },

      onPanResponderRelease: (_, g) => {
        const finalDrop = computeDropIndex(g.moveY);

        if (finalDrop !== blockIndex && finalDrop !== blockIndex + 1) {
          // Build new order
          const ids = blocks.map(b => b.id);
          const [removed] = ids.splice(blockIndex, 1);
          const insertAt = finalDrop > blockIndex ? finalDrop - 1 : finalDrop;
          ids.splice(insertAt, 0, removed);

          LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
          onReorderBlocks(ids);
        }

        dragY.setValue(0);
        setDraggingId(null);
        setDropIndex(null);
      },

      onPanResponderTerminate: () => {
        dragY.setValue(0);
        setDraggingId(null);
        setDropIndex(null);
      },
    });
  }, [blocks, computeDropIndex, onReorderBlocks]);

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
        scrollEnabled={!draggingId}   // disable scroll while dragging
        onScroll={e => { scrollOffset.current = e.nativeEvent.contentOffset.y; }}
        scrollEventThrottle={16}
      >
        {blocks.map((block, index) => {
          const isDraggingThis = draggingId === block.id;
          const panResponder   = makePanResponder(block.id, index);

          return (
            <View
              key={block.id}
              onLayout={e => {
                blockHeights.current[block.id] = e.nativeEvent.layout.height;
                blockOffsets.current[block.id] = e.nativeEvent.layout.y;
              }}
            >
              {/* Drop indicator ABOVE this block */}
              {dropIndex === index && draggingId && draggingId !== block.id && (
                <DropIndicator isDark={isDark} />
              )}

              <Animated.View
                style={isDraggingThis ? {
                  opacity: 0.55,
                  transform: [{ translateY: dragY }],
                  zIndex: 999,
                  shadowColor: '#3b82f6',
                  shadowOffset: { width: 0, height: 8 },
                  shadowOpacity: 0.4,
                  shadowRadius: 12,
                  elevation: 12,
                } : undefined}
              >
                <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
                  {/* Drag handle — left side */}
                  <DragHandle
                    isDark={isDark}
                    isDragging={isDraggingThis}
                    panHandlers={panResponder.panHandlers}
                  />

                  {/* Block card — flex:1 */}
                  <View style={{ flex: 1 }}>
                    <BlockContainer
                      block={block}
                      index={index}
                      total={blocks.length}
                      isDark={isDark}
                      onMoveUp={()    => onMoveBlock(block.id, -1)}
                      onMoveDown={()  => onMoveBlock(block.id, 1)}
                      onDuplicate={() => onDuplicateBlock(block.id)}
                      onDelete={()    => onRemoveBlock(block.id)}
                      onSaveAsTemplate={onSaveBlockAsTemplate ? () => onSaveBlockAsTemplate(block) : undefined}
                    >
                      {renderBlockEditor(block, isDark, (patch) => onUpdateBlock(block.id, patch))}
                    </BlockContainer>
                  </View>
                </View>
              </Animated.View>

              <InsertDivider
                isDark={isDark}
                onPress={() => setInsertAfter(index)}
              />
            </View>
          );
        })}

        {/* Drop indicator at the very end */}
        {dropIndex === blocks.length && draggingId && (
          <DropIndicator isDark={isDark} />
        )}
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
