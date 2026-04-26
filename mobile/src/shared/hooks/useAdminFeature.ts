import { useState, useCallback } from 'react';
import { useEntityData, type EntityConfig } from './useEntityData';
import { useToast } from './useToast';

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
  snackbar:     { open: boolean; message: string; severity: 'success' | 'error' };
  deleteDialog: { open: boolean; item: T | null };
}

export interface AdminFeatureConfig<T, CreateT> extends EntityConfig<T, CreateT> {
  entityName: string;
  messages:   MessagesConfig;
}

export interface AdminFeatureReturn<T, CreateT> {
  entities: T[];
  loading:  boolean;
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

  showSnackbar:  (message: string, severity: 'success' | 'error') => void;
  closeSnackbar: () => void;

  messages: MessagesConfig;

  handleError: (error: unknown, fallback: string) => string;
  logError:    (operation: string, error: unknown) => void;

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
  if (!error) return fallback;
  if (typeof error === 'string') return error;
  if (error instanceof Error) return error.message;
  if (typeof error === 'object' && 'message' in (error as object))
    return String((error as Record<string, unknown>).message);
  return fallback;
}

// ── Hook ───────────────────────────────────────────────────────────────────

export function useAdminFeature<T extends object, CreateT>(
  config: AdminFeatureConfig<T, CreateT>
): AdminFeatureReturn<T, CreateT> {
  const { entities, loading, create, update, remove, refetch } =
    useEntityData<T, CreateT>(config);

  const toast = useToast();

  const [ui, setUI] = useState<UIState<T>>({
    dialogOpen:   false,
    editingItem:  null,
    submitting:   false,
    snackbar:     { open: false, message: '', severity: 'success' },
    deleteDialog: { open: false, item: null },
  });

  const openDialog = useCallback((item?: T) => {
    setUI((prev: UIState<T>) => ({ ...prev, dialogOpen: true, editingItem: item ?? null }));
  }, []);

  const closeDialog = useCallback(() => {
    setUI((prev: UIState<T>) => ({ ...prev, dialogOpen: false, editingItem: null }));
  }, []);

  const openDeleteDialog = useCallback((item: T) => {
    setUI((prev: UIState<T>) => ({ ...prev, deleteDialog: { open: true, item } }));
  }, []);

  const closeDeleteDialog = useCallback(() => {
    setUI((prev: UIState<T>) => ({ ...prev, deleteDialog: { open: false, item: null } }));
  }, []);

  const setSubmitting = useCallback((submitting: boolean) => {
    setUI((prev: UIState<T>) => ({ ...prev, submitting }));
  }, []);

  const showSnackbar = useCallback((message: string, severity: 'success' | 'error') => {
    setUI((prev: UIState<T>) => ({ ...prev, snackbar: { open: true, message, severity } }));
  }, []);

  const closeSnackbar = useCallback(() => {
    setUI((prev: UIState<T>) => ({ ...prev, snackbar: { ...prev.snackbar, open: false } }));
  }, []);

  const handleError = useCallback(
    (error: unknown, fallback: string) => getErrorMessage(error, fallback),
    []
  );

  const logError = useCallback((operation: string, error: unknown) => {
    console.error(`${operation} failed:`, error);
  }, []);

  const handleSubmit = useCallback(
    async (values: CreateT, options?: { onSuccess?: () => void }) => {
      setSubmitting(true);
      try {
        if (ui.editingItem) {
          const id = (ui.editingItem as Record<string, unknown>).id as string;
          await update(id, values);
          showSnackbar(config.messages.success.updated, 'success');
          toast.success(config.messages.success.updated);
        } else {
          await create(values);
          showSnackbar(config.messages.success.created, 'success');
          toast.success(config.messages.success.created);
        }
        closeDialog();
        options?.onSuccess?.();
      } catch (error) {
        const msg = ui.editingItem
          ? config.messages.error.update
          : config.messages.error.create;
        showSnackbar(handleError(error, msg), 'error');
        toast.error(handleError(error, msg));
        logError(ui.editingItem ? 'Update' : 'Create', error);
      } finally {
        setSubmitting(false);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [ui.editingItem, create, update]
  );

  const handleDeleteConfirm = useCallback(
    async (getId: (item: T) => string, options?: { onSuccess?: () => void }) => {
      if (!ui.deleteDialog.item) return;
      try {
        await remove(getId(ui.deleteDialog.item));
        showSnackbar(config.messages.success.deleted, 'success');
        toast.success(config.messages.success.deleted);
        closeDeleteDialog();
        options?.onSuccess?.();
      } catch (error) {
        showSnackbar(handleError(error, config.messages.error.delete), 'error');
        toast.error(handleError(error, config.messages.error.delete));
        logError('Delete', error);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [ui.deleteDialog.item, remove]
  );

  return {
    entities,
    loading,
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
    showSnackbar,
    closeSnackbar,
    messages: config.messages,
    handleError,
    logError,
    handleSubmit,
    handleDeleteConfirm,
  };
}
