import React, { useState, useCallback, useMemo } from 'react';
import { View, Text, Pressable } from 'react-native';
import { AppScreenHeader, AppDataTable, AppDeleteDialog, DataCard, type ColDef } from '../../../shared/components';
import { AppSearchInput } from '../../../shared/components';
import { useThemeColors, useIsDark, FontSize, FontWeight, Radius } from '../../../constants/theme';
import { useUiStore } from '../../../stores/uiStore';
import { useToast } from '../../../shared/hooks/useToast';

const PAGE_SIZE = 5;

export interface AdminCrudScreenProps<T extends { id: string }> {
  title:                string;
  icon:                 string;
  entities:             T[];
  loading:              boolean;
  columns:              ColDef<T>[];
  searchFields:         (keyof T)[];
  renderForm:           (item: T | null, onClose: () => void) => React.ReactNode;
  onDelete:             (id: string) => Promise<void>;
  getItemName?:         (item: T) => string;
  renderCard?:          (item: T, onEdit: () => void, onDelete: () => void) => React.ReactElement | null;
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
      style={({ pressed }) => ({
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
            <Text style={{ fontSize: FontSize.sm }}>👁️</Text>
            <Text style={{ fontSize: FontSize.xs, color: c.interactive.primary, fontWeight: FontWeight.semibold }}>View</Text>
          </Pressable>
        )}
        <Pressable onPress={onEdit} style={{ flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 5, borderRadius: Radius.sm, backgroundColor: c.intent.infoSurface }}>
          <Text style={{ fontSize: FontSize.sm }}>✏️</Text>
          <Text style={{ fontSize: FontSize.xs, color: c.interactive.primary, fontWeight: FontWeight.semibold }}>Edit</Text>
        </Pressable>
        <Pressable onPress={onDel} style={{ flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 5, borderRadius: Radius.sm, backgroundColor: c.intent.errorSurface }}>
          <Text style={{ color: c.intent.error, fontSize: FontSize.sm }}>✕</Text>
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
            <Text style={{ fontSize: FontSize.base }}>👁️</Text>
          </Pressable>
        )}
        <Pressable onPress={onEdit} style={{ width: 30, height: 30, borderRadius: Radius.sm, backgroundColor: c.intent.infoSurface, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ fontSize: FontSize.base }}>✏️</Text>
        </Pressable>
        <Pressable onPress={onDel} style={{ width: 30, height: 30, borderRadius: Radius.sm, backgroundColor: c.intent.errorSurface, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ color: c.intent.error, fontSize: FontSize.md, lineHeight: 16 }}>✕</Text>
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
}: AdminCrudScreenProps<T>) {
  const c      = useThemeColors();
  const isDark = useIsDark();
  const { setAdminView } = useUiStore();
  const toast  = useToast();
  const view   = useUiStore((s) => s.adminViews[title] ?? 'table');

  const [search,       setSearch]       = useState('');
  const [formItem,     setFormItem]     = useState<T | null>(null);
  const [formOpen,     setFormOpen]     = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<T | null>(null);
  const [deleting,     setDeleting]     = useState(false);
  const [page,         setPage]         = useState(1);

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

  const totalItems = filtered.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / PAGE_SIZE));
  const safePage   = Math.min(page, totalPages);
  const pageRows   = useMemo(() => filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE), [filtered, safePage]);

  const pagination = useMemo(() => ({
    page: safePage, totalPages, totalItems, pageSize: PAGE_SIZE,
    hasNext: safePage < totalPages, hasPrev: safePage > 1,
    next: () => setPage((p) => Math.min(p + 1, totalPages)),
    prev: () => setPage((p) => Math.max(p - 1, 1)),
  }), [safePage, totalPages, totalItems]);

  const actionCol: ColDef<T> = {
    field: '__actions__', headerName: '', width: onRowPress ? 124 : 88, sortable: false, align: 'center',
    renderCell: (row: T) => (
      <View style={{ flexDirection: 'row', gap: 4, alignItems: 'center', justifyContent: 'center' }}>
        {onRowPress && (
          <Pressable onPress={() => onRowPress(row)} style={{ width: 32, height: 32, borderRadius: Radius.md, backgroundColor: c.intent.infoSurface, alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ fontSize: FontSize.md }}>👁️</Text>
          </Pressable>
        )}
        <Pressable onPress={() => { setFormItem(row); setFormOpen(true); }} style={{ width: 32, height: 32, borderRadius: Radius.md, backgroundColor: c.intent.infoSurface, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ fontSize: FontSize.md }}>✏️</Text>
        </Pressable>
        <Pressable onPress={() => setDeleteTarget(row)} style={{ width: 32, height: 32, borderRadius: Radius.md, backgroundColor: c.intent.errorSurface, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ color: c.intent.error, fontSize: FontSize.xl, lineHeight: 18 }}>✕</Text>
        </Pressable>
      </View>
    ),
  };

  const renderTable = useCallback(() => (
    <AppDataTable<T>
      rows={pageRows}
      columns={[...columns, actionCol]}
      loading={loading}
      emptyMessage={search ? (emptyFilteredMessage ?? `No ${title.toLowerCase()} match "${search}"`) : (emptyMessage ?? `No ${title.toLowerCase()} yet`)}
      onRowPress={onRowPress}
    />
  ), [pageRows, columns, loading, search, title, emptyMessage, emptyFilteredMessage, onRowPress]);

  return (
    <View style={{ flex: 1, backgroundColor: c.surface.secondary }}>
      <AppScreenHeader
        title={title} isDark={isDark}
        view={view} onViewChange={(v) => setAdminView(title, v)}
        onAdd={canAdd ? () => { setFormItem(null); setFormOpen(true); } : undefined}
        addLabel={addLabel ?? `Add ${itemType}`}
        loading={loading}
        onExport={onExport} exporting={exporting} exportDisabled={loading || entities.length === 0}
        exportLabel={exportLabel} exportingLabel={exportingLabel}
        onRefresh={onRefresh} refreshLabel={refreshLabel} refreshingLabel={refreshingLabel}
      />

      <View style={{ marginTop: 8, marginBottom: 4 }}>
        <AppSearchInput value={search} onChange={handleSearchChange} isDark={isDark} placeholder={searchPlaceholder ?? `Search ${title.toLowerCase()}…`} />
      </View>

      <View style={{ flex: 1, marginHorizontal: 12, marginBottom: 12 }}>
        <DataCard<T>
          title={title} isDark={isDark}
          totalCount={entities.length} rows={pageRows} loading={loading}
          search={search} onSearchChange={handleSearchChange}
          searchPlaceholder={searchPlaceholder ?? `Search ${title.toLowerCase()}…`}
          view={view} renderTable={renderTable} pagination={pagination}
          renderGridItem={(item) =>
            renderCard
              ? renderCard(item, () => { setFormItem(item); setFormOpen(true); }, () => setDeleteTarget(item))
              : <AutoCard item={item} columns={columns} onView={onRowPress ? () => onRowPress(item) : undefined} onEdit={() => { setFormItem(item); setFormOpen(true); }} onDelete={() => setDeleteTarget(item)} />
          }
          renderCompactItem={(item) =>
            <CompactRow item={item} columns={columns} onView={onRowPress ? () => onRowPress(item) : undefined} onEdit={() => { setFormItem(item); setFormOpen(true); }} onDelete={() => setDeleteTarget(item)} />
          }
          renderForm={renderForm} onDelete={onDelete} getItemName={getItemName} itemType={itemType}
        />
      </View>

      {formOpen && renderForm(formItem, () => setFormOpen(false))}

      <AppDeleteDialog
        open={!!deleteTarget} onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        itemName={deleteTarget && getItemName ? getItemName(deleteTarget) : undefined}
        itemType={itemType} loading={deleting}
      />
    </View>
  );
}

export default AdminCrudScreen;
