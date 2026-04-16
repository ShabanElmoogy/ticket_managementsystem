import type { TreeNode, FolderNode, DocRefNode, ServerDocNode } from '../types/types';

export function buildTree(nodes: ServerDocNode[]): TreeNode[] {
  const byId: Record<string, FolderNode | DocRefNode> = {};
  const childrenMap: Record<string, (FolderNode | DocRefNode)[]> = {};
  const roots: (FolderNode | DocRefNode)[] = [];

  nodes.forEach((n) => {
    if (n.type === 'FOLDER') {
      byId[n.id] = { id: n.id, type: 'folder', title: n.title, children: [] };
    } else {
      byId[n.id] = { id: n.id, type: 'doc', title: n.title, docId: n.docId ?? '' } as DocRefNode;
    }
  });

  nodes.forEach((n) => {
    const node = byId[n.id];
    const pid = n.parentId || '__root__';
    if (!childrenMap[pid]) childrenMap[pid] = [];
    childrenMap[pid].push(node);
  });

  Object.keys(childrenMap).forEach((pid) => {
    const arr = childrenMap[pid];
    arr.sort((a, b) => {
      const pa = nodes.find((x) => x.id === a.id)?.position ?? 0;
      const pb = nodes.find((x) => x.id === b.id)?.position ?? 0;
      return pa - pb;
    });
    if (pid === '__root__') {
      roots.push(...arr);
    } else {
      const p = byId[pid];
      if (p && p.type === 'folder') (p as FolderNode).children = arr as TreeNode[];
    }
  });

  return roots as TreeNode[];
}

export const isFolder = (n: TreeNode): n is FolderNode => n.type === 'folder';

export const findNode = (nodes: TreeNode[], id: string): TreeNode | null => {
  for (const n of nodes) {
    if (n.id === id) return n;
    if (isFolder(n)) {
      const found = findNode(n.children, id);
      if (found) return found;
    }
  }
  return null;
};

export const insertChild = (nodes: TreeNode[], parentId: string | null, child: TreeNode): TreeNode[] => {
  if (!parentId) return [...nodes, child];
  return nodes.map((n) => {
    if (isFolder(n)) {
      if (n.id === parentId) return { ...n, children: [...n.children, child] };
      return { ...n, children: insertChild(n.children, parentId, child) };
    }
    return n;
  });
};

export const mapTree = (nodes: TreeNode[], mapper: (n: TreeNode) => TreeNode): TreeNode[] =>
  nodes.map((n) => {
    if (isFolder(n)) {
      const mapped = mapper({ ...n, children: mapTree(n.children, mapper) });
      return mapped;
    }
    return mapper(n);
  });

export const removeNode = (nodes: TreeNode[], id: string): { nodes: TreeNode[]; removed?: TreeNode } => {
  const result: TreeNode[] = [];
  let removed: TreeNode | undefined;
  for (const n of nodes) {
    if (n.id === id) { removed = n; continue; }
    if (isFolder(n)) {
      const { nodes: childNodes, removed: r } = removeNode(n.children, id);
      if (r) removed = r;
      result.push({ ...n, children: childNodes });
    } else {
      result.push(n);
    }
  }
  return { nodes: result, removed };
};

export const collectDocIds = (node: TreeNode): string[] => {
  if (node.type === 'doc') return [node.docId];
  return node.children.flatMap(collectDocIds);
};
