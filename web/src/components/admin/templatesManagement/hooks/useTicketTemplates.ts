import { useEffect, useRef, useState } from 'react';
import { templatesApi, type TemplatePayload } from '../api/templates';
import type { TicketTemplate } from '../../../../services/api/types';

const emptyForm = (): TemplatePayload => ({
  name: '', description: '', priority: 'MEDIUM', estimatedHours: null,
});

export function useTicketTemplates() {
  const [templates, setTemplates]       = useState<TicketTemplate[]>([]);
  const [loading, setLoading]           = useState(true);
  const [dialogOpen, setDialogOpen]     = useState(false);
  const [editing, setEditing]           = useState<TicketTemplate | null>(null);
  const [form, setForm]                 = useState<TemplatePayload>(emptyForm());
  const [saving, setSaving]             = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<TicketTemplate | null>(null);
  const [deleting, setDeleting]         = useState(false);
  const [snack, setSnack]               = useState<{ msg: string; severity: 'success' | 'error' } | null>(null);
  const nameRef = useRef<HTMLInputElement>(null);

  useEffect(() => { fetchTemplates(); }, []);
  useEffect(() => {
    if (dialogOpen) setTimeout(() => nameRef.current?.focus(), 100);
  }, [dialogOpen]);

  const fetchTemplates = async () => {
    setLoading(true);
    try { setTemplates(await templatesApi.list()); }
    catch { setSnack({ msg: 'Failed to load templates', severity: 'error' }); }
    finally { setLoading(false); }
  };

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm());
    setDialogOpen(true);
  };

  const openEdit = (id: string) => {
    const t = templates.find((x) => x.id === id);
    if (!t) return;
    setEditing(t);
    setForm({
      name: t.name,
      description: t.description ?? '',
      priority: t.priority,
      estimatedHours: t.estimatedHours ?? null,
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) return;
    setSaving(true);
    try {
      if (editing) {
        const updated = await templatesApi.update(editing.id, form);
        setTemplates((prev) => prev.map((t) => t.id === updated.id ? { ...t, ...updated } : t));
        setSnack({ msg: 'Template updated', severity: 'success' });
      } else {
        const created = await templatesApi.create(form);
        setTemplates((prev) => [...prev, created]);
        setSnack({ msg: 'Template created', severity: 'success' });
      }
      setDialogOpen(false);
    } catch {
      setSnack({ msg: 'Failed to save template', severity: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await templatesApi.delete(deleteTarget.id);
      setTemplates((prev) => prev.filter((t) => t.id !== deleteTarget.id));
      setDeleteTarget(null);
      setSnack({ msg: 'Template deleted', severity: 'success' });
    } catch {
      setSnack({ msg: 'Failed to delete template', severity: 'error' });
    } finally {
      setDeleting(false);
    }
  };

  return {
    templates, loading,
    dialogOpen, editing, form, setForm, saving, nameRef,
    deleteTarget, deleting, snack,
    openCreate, openEdit, handleSave, handleDelete,
    setDialogOpen, setDeleteTarget, setSnack,
  };
}
