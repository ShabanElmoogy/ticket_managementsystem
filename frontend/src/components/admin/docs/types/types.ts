export type BlockType = 'heading' | 'text' | 'divider' | 'image' | 'video' | 'bulletedList';

export interface BlockSettings {
  align?: 'left' | 'center' | 'right';
  color?: string; // text color
  dividerColor?: string;
  dividerThickness?: number; // px
}

export interface DocBlockBase {
  id: string;
  type: BlockType;
  settings?: BlockSettings;
}

export interface HeadingBlock extends DocBlockBase {
  type: 'heading';
  text: string; // plain text
}

export interface TextBlock extends DocBlockBase {
  type: 'text';
  html: string; // rich text HTML content
}

export interface DividerBlock extends DocBlockBase {
  type: 'divider';
}

export interface ImageBlock extends DocBlockBase {
  type: 'image';
  url: string;
  caption?: string;
}

export interface VideoBlock extends DocBlockBase {
  type: 'video';
  url: string;
  caption?: string;
}

export interface BulletedListBlock extends DocBlockBase {
  type: 'bulletedList';
  title?: string;
  items: string[];
}

export type DocBlock = HeadingBlock | TextBlock | DividerBlock | ImageBlock | VideoBlock | BulletedListBlock;

export interface Doc {
  id: string;
  title: string;
  blocks: DocBlock[];
  updatedAt: string;
}

// Tree for organizing documents in levels
export type TreeNode = FolderNode | DocRefNode;

export interface FolderNode {
  id: string;
  type: 'folder';
  title: string;
  children: TreeNode[];
}

export interface DocRefNode {
  id: string;
  type: 'doc';
  title: string; // mirrored from the doc's title
  docId: string; // reference to Doc.id
}

export type ServerDocNode = {
  id: string;
  type: 'FOLDER' | 'DOC';
  title: string;
  parentId: string | null;
  position: number;
  docId?: string | null;
};

// Helpers
export const newId = () => Math.random().toString(36).slice(2) + Date.now().toString(36);