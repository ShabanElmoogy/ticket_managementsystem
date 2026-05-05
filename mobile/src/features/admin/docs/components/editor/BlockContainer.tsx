import React, { useState } from 'react';
import { View, Pressable } from 'react-native';
import { useThemeColors } from '@/src/constants/theme';
import BlockToolbar from '@/src/features/admin/docs/components/editor/BlockToolbar';
import { BLOCK_META } from '@/src/features/admin/docs/components/editor/blockMeta';
import type { DocBlock } from '@/src/features/admin/docs/types/types';

interface Props {
  block: DocBlock;
  index: number;
  total: number;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
  onSaveAsTemplate?: (block: DocBlock) => void;
  children: React.ReactNode;
}

const BlockContainer: React.FC<Props> = ({
  block, index, total,
  onMoveUp, onMoveDown, onDuplicate, onDelete, onSaveAsTemplate, children,
}) => {
  const [focused, setFocused] = useState(false);
  const c    = useThemeColors();
  const meta = BLOCK_META[block.type] ?? { label: block.type, emoji: '□', color: c.text.muted };

  const cardBorder = focused ? meta.color + '88' : c.border.primary;

  return (
    <View>
      <Pressable
        onPress={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={{
          marginBottom: 10,
          borderRadius: 12,
          borderWidth: 1.5,
          borderColor: cardBorder,
          backgroundColor: c.surface.card,
          overflow: 'hidden',
          shadowColor: c.shadow,
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 1,
          shadowRadius: 4,
          elevation: 2,
        }}
      >
        <BlockToolbar
          block={block}
          index={index}
          total={total}
          onMoveUp={onMoveUp}
          onMoveDown={onMoveDown}
          onDuplicate={onDuplicate}
          onDelete={onDelete}
          onSaveAsTemplate={onSaveAsTemplate}
        />
        <View style={{ padding: 14 }}>
          {children}
        </View>
      </Pressable>
    </View>
  );
};

export default BlockContainer;
