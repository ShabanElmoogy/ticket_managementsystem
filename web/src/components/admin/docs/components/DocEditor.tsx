import React from 'react';
import { Box, Typography } from '@mui/material';
import NotesIcon from '@mui/icons-material/Notes';
import CommandPalette from './CommandPalette';
import type { BlockType } from '../types';
import type {
  DocBlock, HeadingBlock, TextBlock, BulletedListBlock, NumberedListBlock,
  ImageBlock, VideoBlock, CodeBlock, QuoteBlock, CalloutBlock, TableBlock,
  ToggleBlock, TabsBlock, VideoCarouselBlock,
} from '../types';
import BlockContainer from './BlockContainer';
import BlockSettingsBar from './BlockSettingsBar';
import AddBlockDivider from './AddBlockDivider';
import {
  HeadingBlockEditor, TextBlockEditor, CodeBlockEditor, BulletedListEditor,
  NumberedListEditor, DividerBlockView, ImageBlockEditor, VideoBlockEditor,
  QuoteEditor, CalloutEditor, TableEditor, ToggleEditor, TabsEditor, VideoCarouselEditor,
} from './blockEditors';

interface Props {
  blocks: DocBlock[];
  hasDoc: boolean;
  onUpdateBlock: (id: string, patch: Partial<DocBlock>) => void;
  onUpdateBlockSettings: (id: string, patch: any) => void;
  onRemoveBlock: (id: string) => void;
  onDuplicateBlock: (id: string) => void;
  onMoveBlock: (id: string, dir: -1 | 1) => void;
  onInsertBlock: (type: import('../types').BlockType, afterIndex: number) => void;
  dndHandlers: (id: string) => any;
}

const DocEditor: React.FC<Props> = ({
  blocks, hasDoc, onUpdateBlock, onUpdateBlockSettings, onRemoveBlock,
  onDuplicateBlock, onMoveBlock, onInsertBlock, dndHandlers,
}) => {
  // ── Command palette state ──────────────────────────────────────────────────
  const [palette, setPalette] = React.useState<{
    open: boolean; query: string; anchorEl: HTMLElement | null; afterIndex: number;
  }>({ open: false, query: '', anchorEl: null, afterIndex: -1 });

  const closePalette = React.useCallback(() =>
    setPalette((p) => ({ ...p, open: false, query: '' })), []);

  const handlePaletteSelect = React.useCallback((type: BlockType) => {
    onInsertBlock(type, palette.afterIndex);
    closePalette();
  }, [palette.afterIndex, onInsertBlock, closePalette]);

  // Listen for "/" keypress inside the editor to open the palette
  const handleEditorKeyDown = React.useCallback((e: React.KeyboardEvent) => {
    if (e.key !== '/') return;
    const target = e.target as HTMLElement;
    const blockEl = target.closest('[data-block-id]') as HTMLElement | null;
    const blockId = blockEl?.dataset.blockId;
    const idx = blockId ? blocks.findIndex((b) => b.id === blockId) : blocks.length - 1;
    // Prevent the "/" from being typed into the field
    e.preventDefault();
    setPalette({ open: true, query: '', anchorEl: blockEl ?? target, afterIndex: idx });
  }, [blocks]);

  // Track query as user types after "/" — handled inside CommandPalette via its own listener

  // Alt+↑ / Alt+↓ to reorder the focused block
  React.useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (!e.altKey || (e.key !== 'ArrowUp' && e.key !== 'ArrowDown')) return;
      const focusedEl = document.activeElement;
      if (!focusedEl) return;
      const blockEl = (focusedEl as HTMLElement).closest('[data-block-id]') as HTMLElement | null;
      if (!blockEl) return;
      const blockId = blockEl.dataset.blockId;
      if (!blockId) return;
      e.preventDefault();
      onMoveBlock(blockId, e.key === 'ArrowUp' ? -1 : 1);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onMoveBlock]);
  const renderBlock = (block: DocBlock, idx: number): React.ReactNode => {
    const actions = {
      onMoveUp:    idx > 0                ? () => onMoveBlock(block.id, -1)    : undefined,
      onMoveDown:  idx < blocks.length - 1 ? () => onMoveBlock(block.id, 1)    : undefined,
      onDelete:    () => onRemoveBlock(block.id),
      onDuplicate: () => onDuplicateBlock(block.id),
    };
    const dnd      = dndHandlers(block.id);
    const settings = block.settings || {};
    const onChange = (p: Partial<DocBlock>) => onUpdateBlock(block.id, p);
    const onSC     = (p: any) => onUpdateBlockSettings(block.id, p);

    switch (block.type) {
      case 'heading':      return <BlockContainer key={block.id} data-block-id={block.id} {...actions} draggable dragHandlers={dnd}><HeadingBlockEditor block={block as HeadingBlock} onChange={onChange} settings={settings} onSettingsChange={onSC} /></BlockContainer>;
      case 'text':         return <BlockContainer key={block.id} data-block-id={block.id} {...actions} draggable dragHandlers={dnd}><TextBlockEditor block={block as TextBlock} onChange={onChange} settings={settings} onSettingsChange={onSC} /></BlockContainer>;
      case 'code':         return <BlockContainer key={block.id} data-block-id={block.id} {...actions} draggable dragHandlers={dnd}><CodeBlockEditor block={block as CodeBlock} onChange={onChange} settings={settings} onSettingsChange={onSC} /></BlockContainer>;
      case 'bulletedList': return <BlockContainer key={block.id} data-block-id={block.id} {...actions} draggable dragHandlers={dnd}><BulletedListEditor block={block as BulletedListBlock} onChange={onChange} settings={settings} onSettingsChange={onSC} /></BlockContainer>;
      case 'numberedList': return <BlockContainer key={block.id} data-block-id={block.id} {...actions} draggable dragHandlers={dnd}><NumberedListEditor block={block as NumberedListBlock} onChange={onChange} settings={settings} onSettingsChange={onSC} /></BlockContainer>;
      case 'quote':        return <BlockContainer key={block.id} data-block-id={block.id} {...actions} draggable dragHandlers={dnd}><QuoteEditor block={block as QuoteBlock} onChange={onChange} settings={settings} onSettingsChange={onSC} /></BlockContainer>;
      case 'callout':      return <BlockContainer key={block.id} data-block-id={block.id} {...actions} draggable dragHandlers={dnd}><CalloutEditor block={block as CalloutBlock} onChange={onChange} settings={settings} onSettingsChange={onSC} /></BlockContainer>;
      case 'table':        return <BlockContainer key={block.id} data-block-id={block.id} {...actions} draggable dragHandlers={dnd}><TableEditor block={block as TableBlock} onChange={onChange} settings={settings} onSettingsChange={onSC} /></BlockContainer>;
      case 'toggle':       return <BlockContainer key={block.id} data-block-id={block.id} {...actions} draggable dragHandlers={dnd}><ToggleEditor block={block as ToggleBlock} onChange={onChange} settings={settings} onSettingsChange={onSC} /></BlockContainer>;
      case 'tabs':         return <BlockContainer key={block.id} data-block-id={block.id} {...actions} draggable dragHandlers={dnd}><TabsEditor block={block as TabsBlock} onChange={onChange} settings={settings} onSettingsChange={onSC} /></BlockContainer>;
      case 'divider':      return <BlockContainer key={block.id} data-block-id={block.id} {...actions} draggable dragHandlers={dnd}><DividerBlockView settings={settings} /><BlockSettingsBar settings={settings} onSettingsChange={onSC} enableDivider /></BlockContainer>;
      case 'image':        return <BlockContainer key={block.id} data-block-id={block.id} {...actions} draggable dragHandlers={dnd}><ImageBlockEditor block={block as ImageBlock} onChange={onChange} settings={settings} onSettingsChange={onSC} /></BlockContainer>;
      case 'video':         return <BlockContainer key={block.id} data-block-id={block.id} {...actions} draggable dragHandlers={dnd}><VideoBlockEditor block={block as VideoBlock} onChange={onChange} settings={settings} onSettingsChange={onSC} /></BlockContainer>;
      case 'videoCarousel': return <BlockContainer key={block.id} data-block-id={block.id} {...actions} draggable dragHandlers={dnd}><VideoCarouselEditor block={block as VideoCarouselBlock} onChange={onChange} /></BlockContainer>;
      default: return null;
    }
  };

  return (
    <>
      <Box data-editor-area onKeyDown={handleEditorKeyDown} sx={{ flex: 1, overflowY: 'auto', p: { xs: 1.5, md: 3 } }}>
        <Box sx={{ maxWidth: 760, mx: 'auto' }}>
          {!hasDoc ? (
            <Box sx={{ textAlign: 'center', mt: 8 }}>
              <NotesIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 2 }} />
              <Typography variant="h6" color="text.secondary" fontWeight={400}>
                Select a document to start editing
              </Typography>
              <Typography variant="body2" color="text.disabled" mt={0.5}>
                or create a new one from the sidebar
              </Typography>
            </Box>
          ) : blocks.length === 0 ? (
            <Box sx={{ textAlign: 'center', mt: 6 }}>
              <Typography variant="body1" color="text.secondary">This document is empty.</Typography>
              <Typography variant="body2" color="text.disabled" mt={0.5}>
                Click a block type on the right to add content.
              </Typography>
            </Box>
          ) : (
            <>
              <AddBlockDivider onAdd={(type) => onInsertBlock(type, -1)} />
              {blocks.map((block, idx) => (
                <React.Fragment key={block.id}>
                  {renderBlock(block, idx)}
                  <AddBlockDivider onAdd={(type) => onInsertBlock(type, idx)} />
                </React.Fragment>
              ))}
            </>
          )}
        </Box>
      </Box>

      <CommandPalette
        open={palette.open}
        query={palette.query}
        anchorEl={palette.anchorEl}
        onSelect={handlePaletteSelect}
        onClose={closePalette}
        onQueryChange={(q) => setPalette((p) => ({ ...p, query: q }))}
      />
    </>
  );
};

export default DocEditor;
