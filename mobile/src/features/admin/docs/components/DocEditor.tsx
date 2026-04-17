import React, { useState } from 'react';
import { ScrollView } from 'react-native';
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
