export type BlockType =
  | 'heading' | 'text' | 'divider' | 'image' | 'video'
  | 'bulletedList' | 'numberedList' | 'code' | 'quote' | 'callout'
  | 'table' | 'toggle' | 'tabs' | 'videoCarousel' | 'imageCarousel' | 'pdf' | 'excel';

export interface BlockSettings {
  align?: 'left' | 'center' | 'right';
  color?: string;
  dividerColor?: string;
  dividerThickness?: number;
}

export interface DocBlockBase {
  id: string;
  type: BlockType;
  settings?: BlockSettings;
}

export interface HeadingBlock extends DocBlockBase { type: 'heading'; text: string; }
export interface TextBlock     extends DocBlockBase { type: 'text';    html: string; }
export interface DividerBlock  extends DocBlockBase { type: 'divider'; }
export interface ImageBlock    extends DocBlockBase { type: 'image';   url: string; caption?: string; }
export interface VideoBlock    extends DocBlockBase { type: 'video';   url: string; caption?: string; }
export interface BulletedListBlock extends DocBlockBase { type: 'bulletedList'; title?: string; items: string[]; }
export interface NumberedListBlock extends DocBlockBase { type: 'numberedList'; title?: string; items: string[]; }
export interface CodeBlock     extends DocBlockBase { type: 'code';    language: string; code: string; }
export interface QuoteBlock    extends DocBlockBase { type: 'quote';   text: string; attribution?: string; }
export type CalloutType = 'info' | 'warning' | 'success' | 'error';
export interface CalloutBlock  extends DocBlockBase { type: 'callout'; calloutType: CalloutType; text: string; }
export interface TableBlock    extends DocBlockBase { type: 'table';   headers: string[]; rows: string[][]; }
export interface ToggleBlock   extends DocBlockBase { type: 'toggle';  summary: string; content: string; }
export interface TabItem  { id: string; label: string; content: string; }
export interface TabsBlock     extends DocBlockBase { type: 'tabs';    tabs: TabItem[]; }
export interface VideoItem { id: string; title: string; url: string; }
export interface VideoCarouselBlock extends DocBlockBase { type: 'videoCarousel'; videos: VideoItem[]; }

export interface ImageItem { id: string; caption: string; url: string; }
export interface ImageCarouselBlock extends DocBlockBase { type: 'imageCarousel'; images: ImageItem[]; }

export interface PdfBlock   extends DocBlockBase { type: 'pdf';   url: string; name?: string; }
export interface ExcelBlock extends DocBlockBase { type: 'excel'; url: string; name?: string; }

export type DocBlock =
  | HeadingBlock | TextBlock | DividerBlock | ImageBlock | VideoBlock
  | BulletedListBlock | NumberedListBlock | CodeBlock | QuoteBlock | CalloutBlock
  | TableBlock | ToggleBlock | TabsBlock | VideoCarouselBlock | ImageCarouselBlock
  | PdfBlock | ExcelBlock;

export interface Doc {
  id: string;
  title: string;
  blocks: DocBlock[];
  updatedAt: string;
}

export type TreeNode = FolderNode | DocRefNode;

export interface FolderNode {
  id: string;
  type: 'folder';
  title: string;
  icon?: string;
  children: TreeNode[];
}

export interface DocRefNode {
  id: string;
  type: 'doc';
  title: string;
  docId: string;
}

export type ServerDocNode = {
  id: string;
  type: 'FOLDER' | 'DOC';
  title: string;
  parentId: string | null;
  position: number;
  docId?: string | null;
};
