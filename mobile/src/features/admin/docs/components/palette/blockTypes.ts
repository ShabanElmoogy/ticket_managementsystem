import type { BlockType } from '../../types/types';

export interface BlockDef {
  type: BlockType;
  icon: string;
  label: string;
  color: string;
  isEmoji?: boolean;
}

export const BLOCK_TYPES: BlockDef[] = [
  { type: 'heading',       icon: '🔤',  label: 'Heading',      color: '#6366f1', isEmoji: true },
  { type: 'text',          icon: '📝',  label: 'Text',         color: '#3b82f6', isEmoji: true },
  { type: 'bulletedList',  icon: '📋',  label: 'Bullet',       color: '#10b981', isEmoji: true },
  { type: 'numberedList',  icon: '🔢',  label: 'Numbered',     color: '#10b981', isEmoji: true },
  { type: 'code',          icon: '💻',  label: 'Code',         color: '#f59e0b', isEmoji: true },
  { type: 'quote',         icon: '💬',  label: 'Quote',        color: '#8b5cf6', isEmoji: true },
  { type: 'callout',       icon: '💡',  label: 'Callout',      color: '#f59e0b', isEmoji: true },
  { type: 'image',         icon: '🖼️',  label: 'Image',        color: '#ec4899', isEmoji: true },
  { type: 'video',         icon: '▶️',  label: 'Video',        color: '#ef4444', isEmoji: true },
  { type: 'table',         icon: '📊',  label: 'Table',        color: '#0ea5e9', isEmoji: true },
  { type: 'toggle',        icon: '🔽',  label: 'Toggle',       color: '#64748b', isEmoji: true },
  { type: 'tabs',          icon: '🗂️',  label: 'Tabs',         color: '#0ea5e9', isEmoji: true },
  { type: 'divider',       icon: '➖',  label: 'Divider',      color: '#94a3b8', isEmoji: true },
  { type: 'videoCarousel', icon: '🎬',  label: 'Vid Carousel', color: '#ef4444', isEmoji: true },
  { type: 'imageCarousel', icon: '🎠',  label: 'Img Carousel', color: '#ec4899', isEmoji: true },
  { type: 'pdf',           icon: '📄',  label: 'PDF',          color: '#dc2626', isEmoji: true },
  { type: 'excel',         icon: '📈',  label: 'Excel',        color: '#16a34a', isEmoji: true },
];
