import { BaseApiService } from '../../../../services/api/base';
import type { Doc, DocBlock, ServerDocNode } from '../types/types';

export class DocsApiService extends BaseApiService {
  async saveDoc(doc: Doc): Promise<boolean> {
    try { await this.put(`/documents/${doc.id}`, doc); return true; }
    catch (e) { console.error('Failed to save document:', e); return false; }
  }

  async getDoc(id: string): Promise<Doc> {
    return this.get<Doc>(`/documents/${id}`);
  }

  async loadDocs(): Promise<Doc[] | null> {
    try {
      const result = await this.get<unknown>('/documents');
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
    try { return await this.get<ServerDocNode[]>('/docsbuilder/tree'); }
    catch (e) { console.error('Failed to load tree:', e); return null; }
  }

  async createFolder(title: string, parentId: string | null): Promise<ServerDocNode> {
    return this.post<ServerDocNode>('/docsbuilder/tree/folder', { title, parentId });
  }

  async createDoc(title: string, blocks: DocBlock[]): Promise<Doc> {
    return this.post<Doc>('/documents', { title, blocks });
  }

  async createDocNode(title: string, parentId: string | null, docId: string): Promise<ServerDocNode> {
    return this.post<ServerDocNode>('/docsbuilder/tree/doc', { title, parentId, docId });
  }

  async renameNode(id: string, title: string): Promise<ServerDocNode> {
    return this.put<ServerDocNode>(`/docsbuilder/tree/${id}/rename`, { title });
  }

  async deleteNode(id: string): Promise<void> {
    await this.delete(`/docsbuilder/tree/${id}`);
  }
}

export const docsApi = new DocsApiService();
