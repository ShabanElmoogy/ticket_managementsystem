/** Visual metadata for each block type — label, emoji, accent color */
export const BLOCK_META: Record<string, { label: string; emoji: string; color: string }> = {
  heading:       { label: 'Heading',       emoji: '𝐇',    color: '#6366f1' },
  text:          { label: 'Text',          emoji: '¶',    color: '#3b82f6' },
  divider:       { label: 'Divider',       emoji: '—',    color: '#94a3b8' },
  image:         { label: 'Image',         emoji: '🖼️',   color: '#ec4899' },
  video:         { label: 'Video',         emoji: '▶️',   color: '#ef4444' },
  bulletedList:  { label: 'Bullet List',   emoji: '•',    color: '#10b981' },
  numberedList:  { label: 'Numbered List', emoji: '①',    color: '#10b981' },
  code:          { label: 'Code',          emoji: '</>',  color: '#f59e0b' },
  quote:         { label: 'Quote',         emoji: '❝',    color: '#8b5cf6' },
  callout:       { label: 'Callout',       emoji: '💡',   color: '#f59e0b' },
  table:         { label: 'Table',         emoji: '⊞',    color: '#0ea5e9' },
  toggle:        { label: 'Toggle',        emoji: '▸',    color: '#64748b' },
  tabs:          { label: 'Tabs',          emoji: '⊟',    color: '#0ea5e9' },
  videoCarousel: { label: 'Carousel',      emoji: '🎬',   color: '#ef4444' },
};
