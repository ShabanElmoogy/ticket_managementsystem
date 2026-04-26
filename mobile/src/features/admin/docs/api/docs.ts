import { BaseApiService } from '@/src/services/api/base';
import { API, QUERY_KEYS } from '@/src/constants/api';
import type { Doc, DocBlock, ServerDocNode } from '@/src/features/admin/docs/types/types';

export class DocsApiService extends BaseApiService {
  async saveDoc(doc: Doc): Promise<boolean> {
    try { await this.put(API.DOCS.BY_ID(doc.id), doc); return true; }
    catch (e) { console.error('Failed to save document:', e); return false; }
  }

  async getDoc(id: string): Promise<Doc> {
    return this.get<Doc>(API.DOCS.BY_ID(id));
  }

  async loadDocs(): Promise<Doc[] | null> {
    try {
      const result = await this.get<unknown>(API.DOCS.LIST);
      if (Array.isArray(result)) return result as Doc[];
      if (result && typeof result === 'object') {
        const r = result as Record<string, unknown>;
        if (Array.isArray(r.data)) return r.data as Doc[];
        if (Array.isArray(r.docs)) return r.docs as Doc[];
      }
      return [];
    } catch (e) { console.error('Failed to load documents:', e); return null; }
  }

  async loadTree(): Promise<ServerDocNode[] | null> {
    try { return await this.get<ServerDocNode[]>(API.DOCS.TREE); }
    catch (e) { console.error('Failed to load tree:', e); return null; }
  }

  async createFolder(title: string, parentId: string | null): Promise<ServerDocNode> {
    return this.post<ServerDocNode>(API.DOCS.TREE_FOLDER, { title, parentId });
  }

  async createDoc(title: string, blocks: DocBlock[]): Promise<Doc> {
    return this.post<Doc>(API.DOCS.LIST, { title, blocks });
  }

  async createDocNode(title: string, parentId: string | null, docId: string): Promise<ServerDocNode> {
    return this.post<ServerDocNode>(API.DOCS.TREE_DOC, { title, parentId, docId });
  }

  async renameNode(id: string, title: string): Promise<ServerDocNode> {
    return this.put<ServerDocNode>(API.DOCS.TREE_RENAME(id), { title });
  }

  async deleteNode(id: string): Promise<void> {
    await this.delete(API.DOCS.TREE_BY_ID(id));
  }
}

export const docsApi  = new DocsApiService();
export const docsKeys = QUERY_KEYS.DOCS;
