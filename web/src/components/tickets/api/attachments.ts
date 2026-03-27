import axios from 'axios';
import type { Attachment } from '../../../services/api/types';

const BASE = '/api';

function authHeaders(): Record<string, string> {
  const token = localStorage.getItem('token');
  const tenantSlug = localStorage.getItem('tenantSlug');
  const headers: Record<string, string> = {};
  if (token) headers['Authorization'] = `Bearer ${token}`;
  if (tenantSlug) headers['X-Tenant-Slug'] = tenantSlug;
  return headers;
}

export const attachmentsApi = {
  getAttachments: async (ticketId: string): Promise<Attachment[]> => {
    const res = await axios.get(`${BASE}/tickets/${ticketId}/attachments`, { headers: authHeaders() });
    return res.data;
  },

  uploadAttachments: async (ticketId: string, files: File[]): Promise<Attachment[]> => {
    const form = new FormData();
    files.forEach((f) => form.append('files', f));
    const res = await axios.post(`${BASE}/tickets/${ticketId}/attachments`, form, {
      headers: { ...authHeaders(), 'Content-Type': 'multipart/form-data' },
    });
    return res.data;
  },

  deleteAttachment: async (ticketId: string, attachmentId: string): Promise<void> => {
    await axios.delete(`${BASE}/tickets/${ticketId}/attachments/${attachmentId}`, { headers: authHeaders() });
  },
};
