import { api } from '../../../services/api/base';
import type { Attachment } from '../../../services/api/types';

export const attachmentsApi = {
  getAttachments: (ticketId: string) =>
    api.get<Attachment[]>(`/tickets/${ticketId}/attachments`),

  uploadAttachments: async (ticketId: string, files: File[]): Promise<Attachment[]> => {
    const form = new FormData();
    files.forEach((f) => form.append('files', f));
    // Use the underlying axios instance so interceptors (token refresh, tenant header) apply
    const http = (await import('../../../services/api/base')).api.getHttpClient();
    const res = await http.post<Attachment[]>(`/tickets/${ticketId}/attachments`, form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res.data;
  },

  deleteAttachment: (ticketId: string, attachmentId: string) =>
    api.delete<{ message: string }>(`/tickets/${ticketId}/attachments/${attachmentId}`),
};
