import React, { useState, useCallback, useMemo } from 'react';
import { View, Text, Pressable } from 'react-native';
import { AppScreenHeader, AppDataTable, AppDeleteDialog, DataCard, type ColDef } from '../../../shared/components';
import { useUiStore } from '../../../stores/uiStore';
import { useToast } from '../../../shared/hooks/useToast';

const PAGE_SIZE = 5;

export interface AdminCrudScreenProps<T extends { id: string }> {
  title: string;
  icon: string;
  entities: T[];
  loading: boolean;
  columns: ColDef<T>[];
  searchFields: (keyof T)[];
  renderForm: (item: T | null, onClose: () => void) => React.ReactNode;
  onDelete: (id: string) => Promise<void>;
  getItemName?: (item: T) => string;
  renderCard?: (item: T, onEdit: () => void, onDelete: () => void) => React.ReactElement | null;
  itemType?: string;
  canAdd?: boolean;
  onRowPress?: (item: T) => void;
  /** Optional PDF export — shows Export PDF button in header */
  onExport?: () => void;
  exporting?: boolean;
  /** Optional refresh — shows Refresh button in header */
  onRefresh?: () => void;
  /** Translated search placeholder — e.g. t('applications.searchPlaceholder') */
  searchPlaceholder?: string;
  /** Translated empty message when no items exist */
  emptyMessage?: string;
  /** Translated empty message when search has no results */
  emptyFilteredMessage?: string;
  /** Translated button labels — passed from screen via t() */
  addLabel?: string;
  exportLabel?: string;
  exportingLabel?: string;
  refreshLabel?: string;
  refreshingLabel?: string;
  /** Shown as a toast after successful delete */
  deleteSuccessMessage?: string;
}

// ── Auto-generated grid card ───────────────────────────────────────────────

function AutoCard<T extends { id: string }>({
  item, columns, onEdit, onDelete: onDel, isDark,
}: {
  item: T; columns: ColDef<T>[];
  onEdit: () => void; onDelete: () => void;
  isDark: boolean;
}) {
  const visibleCols = columns.filter((c) => c.field !== '__actions__');
  return (
    <View style={{
      width: '100%',
      marginBottom: 10,
      padding: 14,
      borderRadius: 10,
      borderWidth: 1,
      backgroundColor: isDark ? '#1e293b' : '#ffffff',
      borderColor: isDark ? '#334155' : '#e5e7eb',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: isDark ? 0 : 0.05,
      shadowRadius: 3,
      elevation: 1,
    }}>
      {visibleCols.map((col, i) => {
        const val = col.valueGetter ? col.valueGetter(item) : (item as any)[col.field as string];
        return (
          <View key={String(col.field)} style={{ flexDirection: 'row', alignItems: 'center', marginTop: i > 0 ? 6 : 0 }}>
            <Text style={{ fontSize: 11, width: 80, flexShrink: 0, color: isDark ? '#64748b' : '#9ca3af', textTransform: 'uppercase', letterSpacing: 0.3 }} numberOfLines={1}>
              {col.headerName}
            </Text>
            {col.renderCell ? (
              <View style={{ flex: 1, minWidth: 0 }}>{col.renderCell(item)}</View>
            ) : (
              <Text style={{ fontSize: 13, flex: 1, fontWeight: i === 0 ? '600' : '400', color: isDark ? (i === 0 ? '#f1f5f9' : '#cbd5e1') : (i === 0 ? '#111827' : '#4b5563') }} numberOfLines={2}>
                {val == null || val === '' ? '—' : String(val)}
              </Text>
            )}
          </View>
        );
      })}
      <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: 8, marginTop: 10, paddingTop: 8, borderTopWidth: 1, borderTopColor: isDark ? '#334155' : '#f1f5f9' }}>
        <Pressable onPress={onEdit} style={{ flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, backgroundColor: '#eff6ff' }}>
          <Text style={{ fontSize: 13 }}>✏️</Text>
          <Text style={{ fontSize: 12, color: '#2563eb', fontWeight: '600' }}>Edit</Text>
        </Pressable>
        <Pressable onPress={onDel} style={{ flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, backgroundColor: '#fef2f2' }}>
          <Text style={{ color: '#ef4444', fontSize: 13 }}>✕</Text>
          <Text style={{ fontSize: 12, color: '#ef4444', fontWeight: '600' }}>Delete</Text>
        </Pressable>
      </View>
    </View>
  );
}

// ── Auto-generated compact row ─────────────────────────────────────────────

function CompactRow<T extends { id: string }>({
  item, columns, onEdit, onDelete: onDel, isDark,
}: {
  item: T; columns: ColDef<T>[];
  onEdit: () => void; onDelete: () => void;
  isDark: boolean;
}) {
  const visibleCols = columns.filter((c) => c.field !== '__actions__').slice(0, 3);
  const primary   = visibleCols[0];
  const secondary = visibleCols.slice(1);
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: isDark ? '#334155' : '#f3f4f6' }}>
      <View style={{ flex: 1, marginRight: 8 }}>
        {primary && (
          primary.renderCell
            ? <View>{primary.renderCell(item)}</View>
            : <Text style={{ fontSize: 13, fontWeight: '600', color: isDark ? '#f1f5f9' : '#111827' }} numberOfLines={1}>
                {String((item as any)[primary.field as string] ?? '—')}
              </Text>
        )}
        {secondary.length > 0 && (
          <View style={{ flexDirection: 'row', gap: 8, marginTop: 2, flexWrap: 'wrap' }}>
            {secondary.map((col) => (
              <View key={String(col.field)}>
                {col.renderCell ? col.renderCell(item) : (
                  <Text style={{ fontSize: 11, color: isDark ? '#94a3b8' : '#6b7280' }} numberOfLines={1}>
                    {String((item as any)[col.field as string] ?? '—')}
                  </Text>
                )}
              </View>
            ))}
          </View>
        )}
      </View>
      <View style={{ flexDirection: 'row', gap: 4 }}>
        <Pressable onPress={onEdit} style={{ width: 32, height: 32, borderRadius: 8, backgroundColor: '#eff6ff', alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ fontSize: 14 }}>✏️</Text>
        </Pressable>
        <Pressable onPress={onDel} style={{ width: 32, height: 32, borderRadius: 8, backgroundColor: '#fef2f2', alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ color: '#ef4444', fontSize: 16, lineHeight: 18 }}>✕</Text>
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
  deleteSuccessMessage,
}: AdminCrudScreenProps<T>) {
  const { colorMode, setAdminView } = useUiStore();
  const toast  = useToast();
  const isDark = colorMode === 'dark';
  const view   = useUiStore((s) => s.adminViews[title] ?? 'table');

  const [search,      setSearch]      = useState('');
  const [formItem,    setFormItem]    = useState<T | null>(null);
  const [formOpen,    setFormOpen]    = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<T | null>(null);
  const [deleting,    setDeleting]    = useState(false);
  const [page,        setPage]        = useState(1);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await onDelete(deleteTarget.id);
      toast.success(deleteSuccessMessage ?? 'Deleted successfully');
      setDeleteTarget(null);
    } catch {
      // Error is handled globally by NetworkErrorDialog — no toast here
      setDeleteTarget(null);
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

  // Reset to page 1 whenever search or data changes
  const handleSearchChange = useCallback((q: string) => {
    setSearch(q);
    setPage(1);
  }, []);

  // Pagination derived values
  const totalItems = filtered.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / PAGE_SIZE));
  const safePage   = Math.min(page, totalPages);
  const pageRows   = useMemo(
    () => filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE),
    [filtered, safePage],
  );

  const pagination = useMemo(() => ({
    page:       safePage,
    totalPages,
    totalItems,
    pageSize:   PAGE_SIZE,
    hasNext:    safePage < totalPages,
    hasPrev:    safePage > 1,
    next:       () => setPage((p) => Math.min(p + 1, totalPages)),
    prev:       () => setPage((p) => Math.max(p - 1, 1)),
  }), [safePage, totalPages, totalItems]);

  // Action column for table view
  const actionCol: ColDef<T> = {
    field: '__actions__', headerName: '', width: 88, sortable: false, align: 'center',
    renderCell: (row: T) => (
      <View style={{ flexDirection: 'row', gap: 4, alignItems: 'center', justifyContent: 'center' }}>
        <Pressable
          onPress={() => { setFormItem(row); setFormOpen(true); }}
          style={{ width: 32, height: 32, borderRadius: 8, backgroundColor: '#eff6ff', alignItems: 'center', justifyContent: 'center' }}
        >
          <Text style={{ fontSize: 14 }}>✏️</Text>
        </Pressable>
        <Pressable
          onPress={() => setDeleteTarget(row)}
          style={{ width: 32, height: 32, borderRadius: 8, backgroundColor: '#fef2f2', alignItems: 'center', justifyContent: 'center' }}
        >
          <Text style={{ color: '#ef4444', fontSize: 16, lineHeight: 18 }}>✕</Text>
        </Pressable>
      </View>
    ),
  };

  const renderTable = useCallback(() => (
    <AppDataTable<T>
      rows={pageRows}
      columns={[...columns, actionCol]}
      loading={loading}
      emptyMessage={
        search
          ? (emptyFilteredMessage ?? `No ${title.toLowerCase()} match "${search}"`)
          : (emptyMessage ?? `No ${title.toLowerCase()} yet`)
      }
      onRowPress={onRowPress}
    />
  ), [pageRows, columns, loading, search, title, emptyMessage, emptyFilteredMessage, onRowPress]);

  return (
    <View style={{ flex: 1, backgroundColor: isDark ? '#0f172a' : '#f8fafc' }}>
      {/* Screen header with Add button + ViewToggle */}
      <AppScreenHeader
        title={title}
        isDark={isDark}
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

      {/* DataCard handles search, views, empty states, delete dialog */}
      <View style={{ flex: 1, margin: 12 }}>
        <DataCard<T>
          title={title}
          isDark={isDark}
          totalCount={entities.length}
          rows={pageRows}
          loading={loading}
          search={search}
          onSearchChange={handleSearchChange}
          searchPlaceholder={searchPlaceholder ?? `Search ${title.toLowerCase()}…`}
          view={view}
          renderTable={renderTable}
          pagination={pagination}
          renderGridItem={(item) =>
            renderCard
              ? renderCard(item, () => { setFormItem(item); setFormOpen(true); }, () => setDeleteTarget(item))
              : <AutoCard item={item} columns={columns} onEdit={() => { setFormItem(item); setFormOpen(true); }} onDelete={() => setDeleteTarget(item)} isDark={isDark} />
          }
          renderCompactItem={(item) =>
            <CompactRow item={item} columns={columns} onEdit={() => { setFormItem(item); setFormOpen(true); }} onDelete={() => setDeleteTarget(item)} isDark={isDark} />
          }
          renderForm={renderForm}
          onDelete={onDelete}
          getItemName={getItemName}
          itemType={itemType}
        />
      </View>

      {/* Form modal */}
      {formOpen && renderForm(formItem, () => setFormOpen(false))}

      {/* Delete dialog — owned here so table column can trigger it */}
      <AppDeleteDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        itemName={deleteTarget && getItemName ? getItemName(deleteTarget) : undefined}
        itemType={itemType}
        loading={deleting}
      />
    </View>
  );
}

export default AdminCrudScreen;
