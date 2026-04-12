import { BaseApiService } from '../../../../services/api/base';
import type { Doc, DocBlock, ServerDocNode } from '../types';

/**
 * Docs API Service - Handles all documentation-related API calls
 * Extends BaseApiService for consistent HTTP client behavior
 */
export class DocsApiService extends BaseApiService {
  /**
   * Save a document to the server
   */
  async saveDoc(doc: Doc): Promise<boolean> {
    try {
      await this.put(`/documents/${doc.id}`, doc);
      return true;
    } catch (error) {
      console.error('Failed to save document:', error);
      return false;
    }
  }

  /**
   * Get a single document from the server
   */
  async getDoc(id: string): Promise<Doc> {
    try {
      return await this.get<Doc>(`/documents/${id}`);
    } catch (error) {
      console.error(`Failed to get document ${id}:`, error);
      throw error;
    }
  }

  /**
   * Load all documents from the server
   */
  async loadDocs(): Promise<Doc[] | null> {
    try {
      const result = await this.get<unknown>('/documents');
      if (Array.isArray(result)) return result as Doc[];
      // Handle wrapped responses e.g. { data: [...] } or { docs: [...] }
      if (result && typeof result === 'object') {
        const r = result as Record<string, unknown>;
        if (Array.isArray(r.data)) return r.data as Doc[];
        if (Array.isArray(r.docs)) return r.docs as Doc[];
      }
      return [];
    } catch (error) {
      console.error('Failed to load documents:', error);
      return null;
    }
  }

  /**
   * Load the document tree structure from the server
   */
  async loadTree(): Promise<ServerDocNode[] | null> {
    try {
      return await this.get<ServerDocNode[]>('/docsbuilder/tree');
    } catch (error) {
      console.error('Failed to load document tree:', error);
      return null;
    }
  }

  /**
   * Create a new folder in the document tree
   */
  async createFolder(title: string, parentId: string | null): Promise<ServerDocNode> {
    try {
      return await this.post<ServerDocNode>('/docsbuilder/tree/folder', { title, parentId });
    } catch (error) {
      console.error('Failed to create folder:', error);
      throw error;
    }
  }

  /**
   * Create a new document
   */
  async createDoc(title: string, blocks: DocBlock[]): Promise<Doc> {
    try {
      return await this.post<Doc>('/documents', { title, blocks });
    } catch (error) {
      console.error('Failed to create document:', error);
      throw error;
    }
  }

  /**
   * Create a new document node in the tree
   */
  async createDocNode(title: string, parentId: string | null, docId: string): Promise<ServerDocNode> {
    try {
      return await this.post<ServerDocNode>('/docsbuilder/tree/doc', { title, parentId, docId });
    } catch (error) {
      console.error('Failed to create document node:', error);
      throw error;
    }
  }

  /**
   * Rename a node in the document tree
   */
  async renameNode(id: string, title: string): Promise<ServerDocNode> {
    try {
      return await this.put<ServerDocNode>(`/docsbuilder/tree/${id}/rename`, { title });
    } catch (error) {
      console.error('Failed to rename node:', error);
      throw error;
    }
  }

  /**
   * Delete a node from the document tree
   */
  async deleteNode(id: string): Promise<void> {
    try {
      await this.delete(`/docsbuilder/tree/${id}`);
    } catch (error) {
      console.error('Failed to delete node:', error);
      throw error;
    }
  }
}

// Create singleton instance
export const docsApi = new DocsApiService();