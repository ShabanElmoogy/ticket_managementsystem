import { Doc, DocBlock, ServerDocNode } from '../types/types';

// Server persistence helpers (graceful fallback to localStorage)
export async function saveDocServer(doc: Doc): Promise<boolean> {
  try {
    const res = await fetch(`/api/docs/${doc.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(doc),
    });
    return res.ok;
  } catch {
    return false;
  }
}

export async function loadDocsServer(): Promise<Doc[] | null> {
  try {
    const res = await fetch('/api/docs', { method: 'GET' });
    if (!res.ok) return null;
    const data = await res.json();
    return data as Doc[];
  } catch {
    return null;
  }
}

// Tree server helpers
export async function loadTreeServer(): Promise<ServerDocNode[] | null> {
  try {
    const res = await fetch('/api/docsbuilder/tree', { method: 'GET' });
    if (!res.ok) return null;
    return (await res.json()) as ServerDocNode[];
  } catch {
    return null;
  }
}

export async function createFolderServer(title: string, parentId: string | null) {
  const res = await fetch('/api/docsbuilder/tree/folder', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title, parentId }),
  });
  if (!res.ok) throw new Error('Failed to create folder');
  return (await res.json()) as ServerDocNode;
}

export async function createDocServer(title: string, blocks: DocBlock[]) {
  const res = await fetch('/api/docs', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title, blocks }),
  });
  if (!res.ok) throw new Error('Failed to create doc');
  return (await res.json()) as Doc;
}

export async function createDocNodeServer(title: string, parentId: string | null, docId: string) {
  const res = await fetch('/api/docsbuilder/tree/doc', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title, parentId, docId }),
  });
  if (!res.ok) throw new Error('Failed to create doc node');
  return (await res.json()) as ServerDocNode;
}

export async function renameNodeServer(id: string, title: string) {
  const res = await fetch(`/api/docsbuilder/tree/${id}/rename`, {
    method: 'PUT', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title }),
  });
  if (!res.ok) throw new Error('Failed to rename node');
  return (await res.json()) as ServerDocNode;
}

export async function deleteNodeServer(id: string) {
  const res = await fetch(`/api/docsbuilder/tree/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Failed to delete node');
}