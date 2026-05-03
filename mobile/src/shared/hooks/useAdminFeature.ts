import { useState, useCallback } from 'react';
import { useEntityData, type EntityConfig, type PaginatedResponse } from './useEntityData';
import { useToast } from './useToast';
import { getErrorMessage as extractErrorMessage } from '@/src/shared/utils/httpUtils';

// ── Types ──────────────────────────────────────────────────────────────────

export interface MessagesConfig {
  success: { created: string; updated: string; deleted: string };
  error:   { create: string;  update: string;  delete: string  };
  titles:  { create: string;  edit: string                     };
}

export interface UIState<T> {
  dialogOpen:   boolean;
  editingItem:  T | null;
  submitting:   boolean;
  deleteDialog: { open: boolean; item: T | null };
}

export interface AdminFeatureConfig<T, CreateT> extends EntityConfig<T, CreateT> {
  entityName: string;
  messages:   MessagesConfig;
  /** Current page (SERVER mode) — passed from AdminCrudScreen */
  page?:  number;
  /** Page size (SERVER mode) — passed from AdminCrudScreen */
  limit?: number;
}

export interface AdminFeatureReturn<T, CreateT> {
  entities: T[];
  loading:  boolean;
  apiMeta:  PaginatedResponse<T>['pagination'] | null;
  refetch:  () => void;

  create: (data: CreateT) => Promise<T>;
  update: (id: string | number, data: CreateT) => Promise<T>;
  remove: (id: string | number) => Promise<void>;

  ui: UIState<T>;
  openDialog:        (item?: T) => void;
  closeDialog:       () => void;
  openDeleteDialog:  (item: T) => void;
  closeDeleteDialog: () => void;
  setSubmitting:     (v: boolean) => void;

  messages: MessagesConfig;

  handleError: (error: unknown, fallback: string) => string;

  handleSubmit: (
    values: CreateT,
    options?: { onSuccess?: () => void }
  ) => Promise<void>;
  handleDeleteConfirm: (
    getId: (item: T) => string,
    options?: { onSuccess?: () => void }
  ) => Promise<void>;
}

// ── Error helper ───────────────────────────────────────────────────────────

function getErrorMessage(error: unknown, fallback: string): string {
  return extractErrorMessage(error) || fallback;
}

// ── Hook ───────────────────────────────────────────────────────────────────

export function useAdminFeature<T extends object, CreateT>(
  config: AdminFeatureConfig<T, CreateT>
): AdminFeatureReturn<T, CreateT> {
  const { entities, loading, create, update, remove, refetch, apiMeta } =
    useEntityData<T, CreateT>(config);

  const toast = useToast();

  const [ui, setUI] = useState<UIState<T>>({
    dialogOpen:   false,
    editingItem:  null,
    submitting:   false,
    deleteDialog: { open: false, item: null },
  });

  const openDialog = useCallback((item?: T) => {
    setUI((prev) => ({ ...prev, dialogOpen: true, editingItem: item ?? null }));
  }, []);

  const closeDialog = useCallback(() => {
    setUI((prev) => ({ ...prev, dialogOpen: false, editingItem: null }));
  }, []);

  const openDeleteDialog = useCallback((item: T) => {
    setUI((prev) => ({ ...prev, deleteDialog: { open: true, item } }));
  }, []);

  const closeDeleteDialog = useCallback(() => {
    setUI((prev) => ({ ...prev, deleteDialog: { open: false, item: null } }));
  }, []);

  const setSubmitting = useCallback((submitting: boolean) => {
    setUI((prev) => ({ ...prev, submitting }));
  }, []);

  const handleError = useCallback(
    (error: unknown, fallback: string) => getErrorMessage(error, fallback),
    []
  );

  const handleSubmit = useCallback(
    async (values: CreateT, options?: { onSuccess?: () => void }) => {
      setUI((prev) => ({ ...prev, submitting: true }));
      try {
        if (ui.editingItem) {
          const id = (ui.editingItem as Record<string, unknown>).id as string;
          await update(id, values);
          toast.success(config.messages.success.updated);
        } else {
          await create(values);
          toast.success(config.messages.success.created);
        }
        setUI((prev) => ({ ...prev, submitting: false, dialogOpen: false, editingItem: null }));
        options?.onSuccess?.();
      } catch (error) {
        const fallback = ui.editingItem
          ? config.messages.error.update
          : config.messages.error.create;
        const msg = getErrorMessage(error, fallback);
        toast.error(msg);
        if (__DEV__) console.error(`${ui.editingItem ? 'Update' : 'Create'} failed:`, error);
        setUI((prev) => ({ ...prev, submitting: false }));
      }
    },
    [ui.editingItem, create, update, config.messages, toast]
  );

  const handleDeleteConfirm = useCallback(
    async (getId: (item: T) => string, options?: { onSuccess?: () => void }) => {
      if (!ui.deleteDialog.item) return;
      const item = ui.deleteDialog.item;
      try {
        await remove(getId(item));
        toast.success(config.messages.success.deleted);
        setUI((prev) => ({ ...prev, deleteDialog: { open: false, item: null } }));
        options?.onSuccess?.();
      } catch (error) {
        const msg = getErrorMessage(error, config.messages.error.delete);
        toast.error(msg);
        if (__DEV__) console.error('Delete failed:', error);
      }
    },
    [ui.deleteDialog.item, remove, config.messages, toast]
  );

  return {
    entities,
    loading,
    apiMeta,
    refetch,
    create,
    update,
    remove,
    ui,
    openDialog,
    closeDialog,
    openDeleteDialog,
    closeDeleteDialog,
    setSubmitting,
    messages: config.messages,
    handleError,
    handleSubmit,
    handleDeleteConfirm,
  };
}
