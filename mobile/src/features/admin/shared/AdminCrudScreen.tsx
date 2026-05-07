import React, { useState, useCallback, useMemo } from 'react';
import { View, Text, Pressable, BackHandler } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import { useThemeColors, FontSize, FontWeight, Radius } from '@/src/constants/theme';
import { AppScreenHeader, AppDataTable, ConfirmDeleteDialog, DataCard, AppTextInput, type ColDef } from '@/src/shared/components';
import { useToast } from '@/src/shared/hooks/useToast';
import { useUiStore } from '@/src/stores/uiStore';
import { usePaginationStore } from '@/src/stores/paginationStore';

export interface AdminCrudScreenProps<T extends { id: string }> {
  title:                string;
  icon:                 string;
  entities:             T[];
  loading:              boolean;
  columns:              ColDef<T>[];
  searchFields:         (keyof T)[];
  renderForm:           (item: T | null, onClose: () => void) => any;
  onDelete:             (id: string) => Promise<void>;
  getItemName?:         (item: T) => string;
  renderCard?:          (item: T, onEdit: () => void, onDelete: () => void) => any;
  itemType?:            string;
  canAdd?:              boolean;
  onRowPress?:          (item: T) => void;
  onExport?:            () => void;
  exporting?:           boolean;
  onRefresh?:           () => void;
  searchPlaceholder?:   string;
  emptyMessage?:        string;
  emptyFilteredMessage?: string;
  addLabel?:            string;
  exportLabel?:         string;
  exportingLabel?:      string;
  refreshLabel?:        string;
  refreshingLabel?:     string;
  deleteSuccessMessage?: string;
  onDeleteFailed?:      (item: T, error: unknown) => void;
  /** SERVER mode: total from API response (for correct totalPages) */
  apiTotal?:            number;
  /** SERVER mode: called when page changes so parent can re-fetch */
  onPageChange?:        (page: number, limit: number) => void;
}

// ── Auto-generated grid card ───────────────────────────────────────────────

function AutoCard<T extends { id: string }>({
  item, columns, onView, onEdit, onDelete: onDel,
}: {
  item:     T;
  columns:  ColDef<T>[];
  onView?:  () => void;
  onEdit:   () => void;
  onDelete: () => void;
}) {
  const c           = useThemeColors();
  const visibleCols = columns.filter((col) => col.field !== '__actions__');

  return (
    <Pressable
      onPress={onView}
      style={({ pressed }: { pressed: boolean }) => ({
        width: '100%', marginBottom: 10,
        borderRadius: Radius.lg, borderWidth: 1, overflow: 'hidden',
        backgroundColor: pressed ? c.surface.elevated : c.surface.primary,
        borderColor:     c.border.primary,
        shadowColor:     c.shadow,
        shadowOffset:    { width: 0, height: 1 },
        shadowOpacity:   0.05, shadowRadius: 3, elevation: 1,
      })}
    >
      <View style={{ padding: 14 }}>
        {visibleCols.map((col, i) => {
          const val = col.valueGetter ? col.valueGetter(item) : (item as any)[col.field as string];
          return (
            <View key={String(col.field)} style={{ flexDirection: 'row', alignItems: 'center', marginTop: i > 0 ? 6 : 0 }}>
              <Text style={{ fontSize: FontSize.xs, width: 80, flexShrink: 0, color: c.text.muted, textTransform: 'uppercase', letterSpacing: 0.3 }} numberOfLines={1}>
                {col.headerName}
              </Text>
              {col.renderCell ? (
                <View style={{ flex: 1, minWidth: 0 }}>{col.renderCell(item)}</View>
              ) : (
                <Text style={{ fontSize: FontSize.base, flex: 1, fontWeight: i === 0 ? FontWeight.semibold : FontWeight.normal, color: i === 0 ? c.text.primary : c.text.secondary }} numberOfLines={2}>
                  {val == null || val === '' ? '—' : String(val)}
                </Text>
              )}
            </View>
          );
        })}
      </View>

      <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: 6, paddingHorizontal: 12, paddingVertical: 8 }}>
        {onView && (
          <Pressable onPress={onView} style={{ flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 5, borderRadius: Radius.sm, backgroundColor: c.intent.infoSurface }}>
            <Ionicons name="eye-outline" size={13} color={c.interactive.primary} />
            <Text style={{ fontSize: FontSize.xs, color: c.interactive.primary, fontWeight: FontWeight.semibold }}>View</Text>
          </Pressable>
        )}
        <Pressable onPress={onEdit} style={{ flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 5, borderRadius: Radius.sm, backgroundColor: c.intent.infoSurface }}>
          <Ionicons name="create-outline" size={13} color={c.interactive.primary} />
          <Text style={{ fontSize: FontSize.xs, color: c.interactive.primary, fontWeight: FontWeight.semibold }}>Edit</Text>
        </Pressable>
        <Pressable onPress={onDel} style={{ flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 5, borderRadius: Radius.sm, backgroundColor: c.intent.errorSurface }}>
          <Ionicons name="trash-outline" size={13} color={c.intent.error} />
          <Text style={{ fontSize: FontSize.xs, color: c.intent.error, fontWeight: FontWeight.semibold }}>Delete</Text>
        </Pressable>
      </View>

      <View style={{ height: 1, backgroundColor: c.border.primary }} />
    </Pressable>
  );
}

// ── Auto-generated compact row ─────────────────────────────────────────────

function CompactRow<T extends { id: string }>({
  item, columns, onView, onEdit, onDelete: onDel,
}: {
  item:     T;
  columns:  ColDef<T>[];
  onView?:  () => void;
  onEdit:   () => void;
  onDelete: () => void;
}) {
  const c = useThemeColors();

  const allValues = columns
    .filter((col) => col.field !== '__actions__' && !col.renderCell)
    .map((col) => {
      const val = col.valueGetter ? col.valueGetter(item) : (item as any)[col.field as string];
      return val != null && val !== '' ? String(val) : null;
    })
    .filter(Boolean) as string[];

  const lineText  = allValues.join('  ·  ');
  const btnCount  = onView ? 3 : 2;
  const btnsWidth = btnCount * 30 + (btnCount - 1) * 4;

  return (
    <View style={{
      flexDirection: 'row', alignItems: 'center',
      paddingHorizontal: 12, paddingVertical: 10,
      borderBottomWidth: 1, borderBottomColor: c.border.primary,
    }}>
      <Pressable onPress={onView} style={{ flex: 1, minWidth: 0, marginEnd: 8 }}>
        <Text style={{ fontSize: FontSize.base, color: c.text.primary }} numberOfLines={1} ellipsizeMode="tail">
          {lineText || '—'}
        </Text>
      </Pressable>

      <View style={{ flexDirection: 'row', gap: 4, width: btnsWidth }}>
        {onView && (
          <Pressable onPress={onView} style={{ width: 30, height: 30, borderRadius: Radius.sm, backgroundColor: c.intent.infoSurface, alignItems: 'center', justifyContent: 'center' }}>
            <Ionicons name="eye-outline" size={15} color={c.interactive.primary} />
          </Pressable>
        )}
        <Pressable onPress={onEdit} style={{ width: 30, height: 30, borderRadius: Radius.sm, backgroundColor: c.intent.infoSurface, alignItems: 'center', justifyContent: 'center' }}>
          <Ionicons name="create-outline" size={15} color={c.interactive.primary} />
        </Pressable>
        <Pressable onPress={onDel} style={{ width: 30, height: 30, borderRadius: Radius.sm, backgroundColor: c.intent.errorSurface, alignItems: 'center', justifyContent: 'center' }}>
          <Ionicons name="trash-outline" size={15} color={c.intent.error} />
        </Pressable>
      </View>
    </View>
  );
}

// ── Main component ─────────────────────────────────────────────────────────

function AdminCrudScreen<T extends { id: string }>({
  title, icon, entities, loading, columns, searchFields,
  renderForm, onDelete, renderCard,
  getItemName, itemType = 'item', canAdd = true, onRowPress,
  onExport, exporting = false, onRefresh,
  searchPlaceholder, emptyMessage, emptyFilteredMessage,
  addLabel, exportLabel, exportingLabel, refreshLabel, refreshingLabel,
  deleteSuccessMessage, onDeleteFailed,
  apiTotal, onPageChange,
}: AdminCrudScreenProps<T>) {
  const c      = useThemeColors();
  const { setAdminView } = useUiStore();
  const toast  = useToast();
  const view   = useUiStore((s) => s.adminViews[title] ?? 'table');

  // ── Tenant-aware pagination ────────────────────────────────────────────────
  const paginationMode = usePaginationStore((s) => s.paginationMode);
  const pageSize       = usePaginationStore((s) => s.getEffectivePageSize());
  const maxClientRecs  = usePaginationStore((s) => s.maxClientRecords);

  const [search,       setSearch]       = useState('');
  const [formItem,     setFormItem]     = useState<T | null>(null);
  const [formOpen,     setFormOpen]     = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<T | null>(null);
  const [deleting,     setDeleting]     = useState(false);
  const [page,         setPage]         = useState(1);

  // ── Hardware Back Button Handling ──────────────────────────────────────────
  useFocusEffect(
    useCallback(() => {
      const onBackPress = () => {
        if (formOpen) {
          setFormOpen(false);
          return true;
        }
        return false;
      };

      const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);
      return () => subscription.remove();
    }, [formOpen])
  );

  const handleDelete = async () => {
    if (!deleteTarget) return;
    const targetSnapshot = deleteTarget;
    setDeleting(true);
    try {
      await onDelete(targetSnapshot.id);
      toast.success(deleteSuccessMessage ?? 'Deleted successfully');
      setDeleteTarget(null);
    } catch (error) {
      setDeleteTarget(null);
      if (onDeleteFailed) onDeleteFailed(targetSnapshot, error);
    } finally {
      setDeleting(false);
    }
  };

  const filtered = search.trim()
    ? entities.filter((e) =>
        searchFields.some((f) =>
          String((e as any)[f as string] ?? '').toLowerCase().includes(search.toLowerCase())
        )
      )
    : entities;

  const handleSearchChange = useCallback((q: string) => { setSearch(q); setPage(1); }, []);

  // CLIENT mode: cap at maxClientRecords, then paginate locally
  // SERVER mode: entities already paged by API — use apiTotal for correct totalPages
  const cappedEntities = paginationMode === 'CLIENT'
    ? filtered.slice(0, maxClientRecs)
    : filtered;

  const totalItems = paginationMode === 'SERVER' && apiTotal != null
    ? apiTotal
    : cappedEntities.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const safePage   = Math.min(page, totalPages);

  // SERVER mode: entities are already the current page from API — show as-is
  // CLIENT mode: slice locally
  const pageRows = useMemo(
    () => paginationMode === 'SERVER'
      ? cappedEntities                                                              // API already sliced
      : cappedEntities.slice((safePage - 1) * pageSize, safePage * pageSize),     // local slice
    [cappedEntities, safePage, pageSize, paginationMode],
  );

  const goToPage = useCallback((p: number) => {
    const clamped = Math.max(1, Math.min(p, totalPages));
    setPage(clamped);
    onPageChange?.(clamped, pageSize);
  }, [totalPages, pageSize, onPageChange]);

  const pagination = useMemo(() => ({
    page: safePage, totalPages, totalItems, pageSize,
    hasNext: safePage < totalPages, hasPrev: safePage > 1,
    next: () => goToPage(safePage + 1),
    prev: () => goToPage(safePage - 1),
  }), [safePage, totalPages, totalItems, pageSize, goToPage]);

  const actionCol: ColDef<T> = useMemo(() => ({
    field: '__actions__', headerName: '', width: onRowPress ? 108 : 76, sortable: false, align: 'center',
    renderCell: (row: T) => (
      <View style={{ flexDirection: 'row', gap: 4, alignItems: 'center', justifyContent: 'center', overflow: 'visible' }}>
        {onRowPress && (
          <Pressable onPress={() => onRowPress(row)} style={{ width: 28, height: 28, borderRadius: Radius.md, backgroundColor: c.intent.infoSurface, alignItems: 'center', justifyContent: 'center' }}>
            <Ionicons name="eye-outline" size={14} color={c.interactive.primary} />
          </Pressable>
        )}
        <Pressable onPress={() => { setFormItem(row); setFormOpen(true); }} style={{ width: 28, height: 28, borderRadius: Radius.md, backgroundColor: c.intent.infoSurface, alignItems: 'center', justifyContent: 'center' }}>
          <Ionicons name="create-outline" size={14} color={c.interactive.primary} />
        </Pressable>
        <Pressable onPress={() => setDeleteTarget(row)} style={{ width: 28, height: 28, borderRadius: Radius.md, backgroundColor: c.intent.errorSurface, alignItems: 'center', justifyContent: 'center' }}>
          <Ionicons name="trash-outline" size={14} color={c.intent.error} />
        </Pressable>
      </View>
    ),
  }), [c, onRowPress]); // eslint-disable-line react-hooks/exhaustive-deps

  const renderTable = useCallback(() => (
    <AppDataTable<T>
      rows={pageRows}
      columns={[...columns, actionCol]}
      loading={loading}
      emptyMessage={search ? (emptyFilteredMessage ?? `No ${title.toLowerCase()} match "${search}"`) : (emptyMessage ?? `No ${title.toLowerCase()} yet`)}
      onRowPress={onRowPress}
    />
  ), [pageRows, columns, actionCol, loading, search, title, emptyMessage, emptyFilteredMessage, onRowPress]);

  return (
    <View style={{ flex: 1, backgroundColor: c.surface.secondary }}>
      <AppScreenHeader
        view={view} 
        onViewChange={(v) => setAdminView(title, v)}
        onAdd={canAdd ? () => { setFormItem(null); setFormOpen(true); } : undefined}
        addLabel={addLabel ?? `Add ${itemType}`}
        loading={loading}
        onExport={onExport} 
        exporting={exporting} 
        exportDisabled={loading || entities.length === 0}
        exportLabel={exportLabel} 
        exportingLabel={exportingLabel}
        onRefresh={onRefresh} 
        refreshLabel={refreshLabel} 
        refreshingLabel={refreshingLabel}
      />

      <View style={{ marginTop: 8, marginBottom: 8 , marginHorizontal: 10}}>
        <AppTextInput
          fieldType="search"
          value={search}
          onChangeText={handleSearchChange}
          placeholder={searchPlaceholder ?? `Search ${title.toLowerCase()}…`}
          showClearButton
          onClear={() => handleSearchChange('')}
          containerStyle={{ marginBottom: 0 }}
        />
      </View>

      <View style={{ flex: 1, marginHorizontal: 12, marginBottom: 12 }}>
        <DataCard<T>
          title={title}
          totalCount={entities.length} rows={pageRows} loading={loading}
          search={search}
          view={view} renderTable={renderTable} pagination={pagination}
          renderGridItem={(item) =>
            renderCard
              ? renderCard(item, () => { setFormItem(item); setFormOpen(true); }, () => setDeleteTarget(item))
              : <AutoCard item={item} columns={columns} onView={onRowPress ? () => onRowPress(item) : undefined} onEdit={() => { setFormItem(item); setFormOpen(true); }} onDelete={() => setDeleteTarget(item)} />
          }
          renderCompactItem={(item) =>
            <CompactRow item={item} columns={columns} onView={onRowPress ? () => onRowPress(item) : undefined} onEdit={() => { setFormItem(item); setFormOpen(true); }} onDelete={() => setDeleteTarget(item)} />
          }
        />
      </View>

      {formOpen && renderForm(formItem, () => setFormOpen(false))}

      <ConfirmDeleteDialog
        open={!!deleteTarget} onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        itemName={deleteTarget && getItemName ? getItemName(deleteTarget) : undefined}
        itemType={itemType} loading={deleting}
      />
    </View>
  );
}

export default AdminCrudScreen;


