/**
 * DataCard — unified data display component.
 *
 * Combines all features from AdminCrudScreen and ReportCard:
 *   - Search / filter
 *   - Table / Grid / Compact views
 *   - Sorting + Pagination (table view)
 *   - Pull-to-refresh
 *   - Loading state
 *   - Empty state
 *   - CRUD: form modal + delete dialog (optional)
 *   - Section header with count badge
 *   - Optional extra header content (period selectors, etc.)
 *
 * Both AdminCrudScreen and ReportCard are thin wrappers around this.
 */
import React, { useState, useMemo } from 'react';
import {
  View, Text, FlatList, ActivityIndicator, RefreshControl,
} from 'react-native';
import AppSearchInput  from './AppSearchInput';
import AppEmptyState   from './AppEmptyState';
import AppDeleteDialog from './AppDeleteDialog';
import SectionHeader   from './SectionHeader';
import CountBadge      from './CountBadge';
import PaginatedView   from './PaginatedView';
import type { AdminView } from '../../stores/uiStore';

// ── Pagination state shape ────────────────────────────────────────────────────

export interface PaginationState {
  page: number;
  totalPages: number;
  totalItems: number;
  pageSize: number;
  hasNext: boolean;
  hasPrev: boolean;
  next: () => void;
  prev: () => void;
}

// ── Props ─────────────────────────────────────────────────────────────────────

export interface DataCardProps<T extends { id: string }> {
  // ── Identity ────────────────────────────────────────────────────────────
  title: string;
  isDark: boolean;

  // ── Data ────────────────────────────────────────────────────────────────
  /** All rows (unfiltered) — used for the total count in the header badge */
  totalCount: number;
  /** Filtered rows passed to grid/compact views */
  rows: T[];
  loading: boolean;

  // ── Search ──────────────────────────────────────────────────────────────
  search: string;
  onSearchChange: (q: string) => void;
  searchPlaceholder?: string;

  // ── View ────────────────────────────────────────────────────────────────
  view: AdminView;

  // ── Renderers ───────────────────────────────────────────────────────────
  /** Table view — rendered inside PaginatedView */
  renderTable: () => React.ReactElement | null;
  /** Pagination state for table view */
  pagination?: PaginationState;
  /** Grid view card per row */
  renderGridItem?: (item: T) => React.ReactElement | null;
  /** Compact view row per item */
  renderCompactItem?: (item: T) => React.ReactElement | null;

  // ── Header extras ────────────────────────────────────────────────────────
  /** Extra content rendered below the search bar (period selectors, filters, etc.) */
  headerExtras?: React.ReactNode;

  // ── Refresh ──────────────────────────────────────────────────────────────
  onRefresh?: () => void;

  // ── CRUD (optional) ──────────────────────────────────────────────────────
  /** Form modal — rendered when formOpen is true */
  renderForm?: (editingItem: T | null, onClose: () => void) => React.ReactNode;
  /** Called when delete is confirmed */
  onDelete?: (id: string) => Promise<void>;
  /** Extract display name for delete dialog */
  getItemName?: (item: T) => string;
  itemType?: string;
}

// ── Component ─────────────────────────────────────────────────────────────────

function DataCard<T extends { id: string }>({
  title, isDark,
  totalCount, rows, loading,
  search, onSearchChange, searchPlaceholder = 'Search…',
  view,
  renderTable, pagination,
  renderGridItem, renderCompactItem,
  headerExtras,
  onRefresh,
  renderForm, onDelete, getItemName, itemType = 'item',
}: DataCardProps<T>) {
  // ── CRUD state ────────────────────────────────────────────────────────────
  const [formOpen,   setFormOpen]   = useState(false);
  const [editingItem, setEditingItem] = useState<T | null>(null);
  const [deleteItem, setDeleteItem] = useState<T | null>(null);
  const [deleting,   setDeleting]   = useState(false);

  const openEdit   = (item: T)  => { setEditingItem(item); setFormOpen(true); };
  const openAdd    = ()          => { setEditingItem(null); setFormOpen(true); };
  const openDelete = (item: T)  => setDeleteItem(item);

  const handleDelete = async () => {
    if (!deleteItem || !onDelete) return;
    setDeleting(true);
    try { await onDelete(deleteItem.id); }
    finally { setDeleting(false); setDeleteItem(null); }
  };

  // ── Derived ───────────────────────────────────────────────────────────────
  const isFiltered  = search.trim().length > 0;
  const border      = isDark ? '#334155' : '#e2e8f0';
  const cardBg      = isDark ? '#1e293b' : '#ffffff';
  const emptyIcon   = isFiltered ? '🔍' : '📭';
  const emptyMsg    = isFiltered ? 'No results found' : 'No data available';
  const emptySub    = isFiltered ? `No rows match "${search}"` : undefined;

  // ── Shared list header ────────────────────────────────────────────────────
  const ListHeader = useMemo(() => (
    <View>
      <AppSearchInput
        value={search}
        onChange={onSearchChange}
        isDark={isDark}
        placeholder={searchPlaceholder}
      />
      {headerExtras}
    </View>
  ), [search, onSearchChange, isDark, searchPlaceholder, headerExtras]);

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <View style={{
      flex: 1, borderRadius: 12, overflow: 'hidden',
      borderWidth: 1, borderColor: border,
      backgroundColor: cardBg,
      shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
      shadowOpacity: isDark ? 0 : 0.06, shadowRadius: 6, elevation: 2,
    }}>
      {/* Header */}
      <SectionHeader
        title={title}
        isDark={isDark}
        right={
          <CountBadge
            count={rows.length}
            total={totalCount}
            isFiltered={isFiltered}
          />
        }
      />

      {/* Loading */}
      {loading ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 }}>
          <ActivityIndicator size="large" color="#3b82f6" />
          <Text style={{ fontSize: 13, color: isDark ? '#64748b' : '#94a3b8' }}>Loading…</Text>
        </View>

      ) : view === 'table' ? (
        /* ── Table view ── */
        pagination ? (
          <PaginatedView
            renderContent={renderTable}
            ListHeader={ListHeader}
            pagination={pagination}
            loading={loading}
            onRefresh={onRefresh ?? (() => {})}
            isDark={isDark}
          />
        ) : (
          /* No pagination — render table directly with header */
          <FlatList
            data={[{ key: 'table' }]}
            keyExtractor={(i) => i.key}
            renderItem={() => renderTable()}
            ListHeaderComponent={ListHeader}
            refreshControl={onRefresh ? <RefreshControl refreshing={loading} onRefresh={onRefresh} /> : undefined}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          />
        )

      ) : view === 'grid' ? (
        /* ── Grid view ── */
        <FlatList
          data={rows}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 12, paddingBottom: 24 }}
          ListHeaderComponent={ListHeader}
          ListEmptyComponent={<AppEmptyState icon={emptyIcon} message={emptyMsg} subtitle={emptySub} />}
          refreshControl={onRefresh ? <RefreshControl refreshing={loading} onRefresh={onRefresh} /> : undefined}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          renderItem={({ item }) =>
            renderGridItem
              ? (renderGridItem(item) ?? null)
              : null
          }
        />

      ) : (
        /* ── Compact view ── */
        <FlatList
          data={rows}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingBottom: 24 }}
          ListHeaderComponent={ListHeader}
          ListEmptyComponent={<AppEmptyState icon={emptyIcon} message={emptyMsg} subtitle={emptySub} />}
          refreshControl={onRefresh ? <RefreshControl refreshing={loading} onRefresh={onRefresh} /> : undefined}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          renderItem={({ item }) =>
            renderCompactItem
              ? (renderCompactItem(item) ?? null)
              : null
          }
        />
      )}

      {/* CRUD: form modal */}
      {formOpen && renderForm && renderForm(editingItem, () => setFormOpen(false))}

      {/* CRUD: delete dialog */}
      {onDelete && (
        <AppDeleteDialog
          open={!!deleteItem}
          onClose={() => setDeleteItem(null)}
          onConfirm={handleDelete}
          itemName={deleteItem && getItemName ? getItemName(deleteItem) : undefined}
          itemType={itemType}
          loading={deleting}
        />
      )}
    </View>
  );
}

export default DataCard;
