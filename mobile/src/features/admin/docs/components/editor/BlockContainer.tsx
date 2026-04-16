import React, { useState } from 'react';
import { View, Pressable } from 'react-native';
import BlockToolbar from './BlockToolbar';
import { BLOCK_META } from './blockMeta';
import type { DocBlock } from '../../types/types';

interface Props {
  block: DocBlock;
  index: number;
  total: number;
  isDark: boolean;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
  children: React.ReactNode;
}

const BlockContainer: React.FC<Props> = ({
  block, index, total, isDark,
  onMoveUp, onMoveDown, onDuplicate, onDelete, children,
}) => {
  const [focused, setFocused] = useState(false);
  const meta = BLOCK_META[block.type] ?? { label: block.type, emoji: '□', color: '#64748b' };

  const cardBg     = isDark ? '#1e293b' : '#ffffff';
  const cardBorder = focused
    ? meta.color + '88'
    : isDark ? '#3d5068' : '#e2e8f0';

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
      <BlockToolbar
        block={block}
        index={index}
        total={total}
        isDark={isDark}
        onMoveUp={onMoveUp}
        onMoveDown={onMoveDown}
        onDuplicate={onDuplicate}
        onDelete={onDelete}
      />

      <View style={{ padding: 14 }}>
        {children}
      </View>
    </Pressable>
  );
};

export default BlockContainer;
