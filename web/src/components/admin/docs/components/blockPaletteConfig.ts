import type { BlockType } from '../types';

export interface PaletteItem {
  type: BlockType;
  label: string;
  color: string;
}

export const PALETTE_ITEMS: PaletteItem[] = [
  { type: 'heading',      label: 'Heading',       color: '#f59e0b' },
  { type: 'text',         label: 'Text',          color: '#3b82f6' },
  { type: 'quote',        label: 'Quote',         color: '#8b5cf6' },
  { type: 'callout',      label: 'Callout',       color: '#06b6d4' },
  { type: 'code',         label: 'Code',          color: '#6366f1' },
  { type: 'bulletedList', label: 'Bullet List',   color: '#10b981' },
  { type: 'numberedList', label: 'Numbered List', color: '#14b8a6' },
  { type: 'toggle',       label: 'Toggle',        color: '#f97316' },
  { type: 'tabs',         label: 'Tabs',          color: '#a855f7' },
  { type: 'table',        label: 'Table',         color: '#ec4899' },
  { type: 'image',        label: 'Image',         color: '#0ea5e9' },
  { type: 'video',         label: 'Video',          color: '#ef4444' },
  { type: 'videoCarousel', label: 'Video Carousel', color: '#f43f5e' },
  { type: 'divider',       label: 'Divider',        color: '#6b7280' },
];
