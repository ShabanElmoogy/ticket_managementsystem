import type { Doc, DocBlock, ServerDocNode } from '../types';

// Import the docsApi service directly
import { DocsApiService } from '../api/docs';

// Create singleton instance
const docsApi = new DocsApiService();

// Export functions that use the service
export async function saveDocServer(doc: Doc): Promise<boolean> {
  return await docsApi.saveDoc(doc);
}

export async function loadDocsServer(): Promise<Doc[] | null> {
  return await docsApi.loadDocs();
}

export async function loadTreeServer(): Promise<ServerDocNode[] | null> {
  return await docsApi.loadTree();
}

export async function createFolderServer(title: string, parentId: string | null): Promise<ServerDocNode> {
  return await docsApi.createFolder(title, parentId);
}

export async function createDocServer(title: string, blocks: DocBlock[]): Promise<Doc> {
  return await docsApi.createDoc(title, blocks);
}

export async function createDocNodeServer(title: string, parentId: string | null, docId: string): Promise<ServerDocNode> {
  return await docsApi.createDocNode(title, parentId, docId);
}

export async function renameNodeServer(id: string, title: string): Promise<ServerDocNode> {
  return await docsApi.renameNode(id, title);
}

export async function deleteNodeServer(id: string): Promise<void> {
  return await docsApi.deleteNode(id);
}