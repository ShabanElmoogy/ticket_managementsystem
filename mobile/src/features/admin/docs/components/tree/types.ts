import type { TreeNode, Doc } from '../../types/types';

export interface TreeSidebarProps {
  tree: TreeNode[];
  docs: Doc[];
  currentDocId: string | null;
  selectedTreeId: string | null;
  expanded: Record<string, boolean>;
  isDark: boolean;
  onSelectDoc: (docId: string, nodeId: string) => void;
  onSelectFolder: (nodeId: string) => void;
  onToggleExpand: (id: string) => void;
  onAddFolder: (parentId: string | null) => void;
  onAddDoc: (parentId: string | null) => void;
  onRename: (id: string, title: string) => void;
  onDelete: (id: string) => void;
  onSetFolderIcon: (id: string, icon: string) => void;
  onDuplicateDoc: (docId: string) => void;
  onSearch?: () => void;
}

export const INDENT_PX = 12; // depth * 1.5 * 8px — matches web
