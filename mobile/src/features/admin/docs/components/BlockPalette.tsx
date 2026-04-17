import React from 'react';
import type { BlockType } from '../types/types';
import { HorizontalPalette, VerticalPalette } from './palette';

interface Props {
  onAdd: (type: BlockType) => void;
  isDark: boolean;
  horizontal?: boolean;
}

/**
 * Block type picker — renders as a horizontal strip or vertical sidebar
 * depending on the `horizontal` prop.
 */
const BlockPalette: React.FC<Props> = ({ onAdd, isDark, horizontal = false }) =>
  horizontal
    ? <HorizontalPalette onAdd={onAdd} isDark={isDark} />
    : <VerticalPalette   onAdd={onAdd} isDark={isDark} />;

export default BlockPalette;
