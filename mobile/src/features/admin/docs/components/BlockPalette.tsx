import React from 'react';
import { HorizontalPalette, VerticalPalette } from '@/src/features/admin/docs/components/palette';
import type { BlockType } from '@/src/features/admin/docs/types/types';

interface Props {
  onAdd: (type: BlockType) => void;
  horizontal?: boolean;
  templateCount?: number;
  onOpenTemplates?: () => void;
}

const BlockPalette: React.FC<Props> = ({
  onAdd, horizontal = false, templateCount = 0, onOpenTemplates,
}) =>
  horizontal
    ? <HorizontalPalette onAdd={onAdd} templateCount={templateCount} onOpenTemplates={onOpenTemplates} />
    : <VerticalPalette   onAdd={onAdd} templateCount={templateCount} onOpenTemplates={onOpenTemplates} />;

export default BlockPalette;
