import React from 'react';
import { HorizontalPalette, VerticalPalette } from '@/src/features/admin/docs/components/palette';
import type { BlockType } from '@/src/features/admin/docs/types/types';

interface Props {
  onAdd: (type: BlockType) => void;
  isDark: boolean;
  horizontal?: boolean;
  templateCount?: number;
  onOpenTemplates?: () => void;
}

/**
 * Block type picker — renders as a horizontal strip or vertical sidebar.
 * Optionally shows a Templates button when onOpenTemplates is provided.
 */
const BlockPalette: React.FC<Props> = ({
  onAdd, isDark, horizontal = false, templateCount = 0, onOpenTemplates,
}) =>
  horizontal
    ? <HorizontalPalette onAdd={onAdd} isDark={isDark} templateCount={templateCount} onOpenTemplates={onOpenTemplates} />
    : <VerticalPalette   onAdd={onAdd} isDark={isDark} templateCount={templateCount} onOpenTemplates={onOpenTemplates} />;

export default BlockPalette;
