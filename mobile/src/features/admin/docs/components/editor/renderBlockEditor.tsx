import React from 'react';
import type { DocBlock } from '../../types/types';
import {
  HeadingBlockEditor, TextBlockEditor, CodeBlockEditor, ImageBlockEditor,
  VideoBlockEditor, BulletedListEditor, NumberedListEditor, QuoteEditor,
  CalloutEditor, TableEditor, ToggleEditor, TabsEditor,
  VideoCarouselEditor, ImageCarouselEditor, DividerBlockView,
} from '../blockEditors';

export function renderBlockEditor(
  block: DocBlock,
  isDark: boolean,
  onChange: (patch: Partial<DocBlock>) => void,
): React.ReactNode {
  switch (block.type) {
    case 'heading':       return <HeadingBlockEditor    block={block} isDark={isDark} onChange={onChange as any} />;
    case 'text':          return <TextBlockEditor       block={block} isDark={isDark} onChange={onChange as any} />;
    case 'divider':       return <DividerBlockView      block={block} isDark={isDark} onChange={onChange as any} />;
    case 'image':         return <ImageBlockEditor      block={block} isDark={isDark} onChange={onChange as any} />;
    case 'video':         return <VideoBlockEditor      block={block} isDark={isDark} onChange={onChange as any} />;
    case 'bulletedList':  return <BulletedListEditor    block={block} isDark={isDark} onChange={onChange as any} />;
    case 'numberedList':  return <NumberedListEditor    block={block} isDark={isDark} onChange={onChange as any} />;
    case 'code':          return <CodeBlockEditor       block={block} isDark={isDark} onChange={onChange as any} />;
    case 'quote':         return <QuoteEditor           block={block} isDark={isDark} onChange={onChange as any} />;
    case 'callout':       return <CalloutEditor         block={block} isDark={isDark} onChange={onChange as any} />;
    case 'table':         return <TableEditor           block={block} isDark={isDark} onChange={onChange as any} />;
    case 'toggle':        return <ToggleEditor          block={block} isDark={isDark} onChange={onChange as any} />;
    case 'tabs':          return <TabsEditor            block={block} isDark={isDark} onChange={onChange as any} />;
    case 'videoCarousel': return <VideoCarouselEditor   block={block} isDark={isDark} onChange={onChange as any} />;
    case 'imageCarousel': return <ImageCarouselEditor   block={block} isDark={isDark} onChange={onChange as any} />;
    default:              return null;
  }
}
