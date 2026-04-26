import React, { useState, useMemo } from 'react';
import { View, Text, FlatList, ActivityIndicator, RefreshControl } from 'react-native';
import { useThemeColors, FontSize } from '@/src/constants/theme';
import AppEmptyState   from '@/src/shared/components/feedback/AppEmptyState';
import AppDeleteDialog from '@/src/shared/components/dialogs/AppDeleteDialog';
import SectionHeader   from '@/src/shared/components/display/SectionHeader';
import CountBadge      from '@/src/shared/components/display/CountBadge';
import PaginatedView   from './PaginatedView';
import AppPagination   from './AppPagination';
import type { AdminView } from '@/src/stores/uiStore';

// ── Pagination state shape ────────────────────────────────────────────────────

export interface PaginationState {
  page:       number;
  totalPages: number;
  totalItems: number;
  pageSize:   number;
  hasNext:    boolean;
  hasPrev:    boolean;
  next:       () => void;
  prev:       () => void;
}

// ── Props ─────────────────────────────────────────────────────────────────────

export interface DataCardProps<T extends { id: string }> {
  title:              string;
  /** @deprecated — theme is resolved automatically via useThemeColors() */
  isDark?:            boolean;
  totalCount:         number;
  rows:               T[];
  loading:            boolean;
  search:             string;
  onSearchChange:     (q: string) => void;
  searchPlaceholder?: string;
  view:               AdminView;
  renderTable:        () => React.ReactElement | null;
  pagination?:        PaginationState;
  renderGridItem?:    (item: T) => React.ReactElement | null;
  renderCompactItem?: (item: T) => React.ReactElement | null;
  headerExtras?:      React.ReactNode;
  onRefresh?:         () => void;
  renderForm?:        (editingItem: T | null, onClose: () => void) => React.ReactNode;
  onDelete?:          (id: string) => Promise<void>;
  getItemName?:       (item: T) => string;
  itemType?:          string;
}

// ── Component ─────────────────────────────────────────────────────────────────

function DataCard<T extends { id: string }>({
  title,
  totalCount, rows, loading,
  search, onSearchChange, searchPlaceholder = 'Search…',
  view,
  renderTable, pagination,
  renderGridItem, renderCompactItem,
  headerExtras,
  onRefresh,
  renderForm, onDelete, getItemName, itemType = 'item',
}: DataCardProps<T>) {
  const c = useThemeColors();

  const [formOpen,    setFormOpen]    = useState(false);
  const [editingItem, setEditingItem] = useState<T | null>(null);
  const [deleteItem,  setDeleteItem]  = useState<T | null>(null);
  const [deleting,    setDeleting]    = useState(false);

  const handleDelete = async () => {
    if (!deleteItem || !onDelete) return;
    setDeleting(true);
    try { await onDelete(deleteItem.id); }
    finally { setDeleting(false); setDeleteItem(null); }
  };

  const isFiltered = search.trim().length > 0;
  const emptyIcon  = isFiltered ? '🔍' : '📭';
  const emptyMsg   = isFiltered ? 'No results found' : 'No data available';
  const emptySub   = isFiltered ? `No rows match "${search}"` : undefined;

  const ListHeader = useMemo(() => (
    headerExtras ? <View>{headerExtras}</View> : undefined
  ), [headerExtras]);

  const paginationBar = pagination ? (
    <AppPagination
      page={pagination.page}
      totalPages={pagination.totalPages}
      totalItems={pagination.totalItems}
      pageSize={pagination.pageSize}
      hasNext={pagination.hasNext}
      hasPrev={pagination.hasPrev}
      onNext={pagination.next}
      onPrev={pagination.prev}
    />
  ) : null;

  return (
    <View style={{
      flex: 1, borderRadius: 12, overflow: 'hidden',
      borderWidth: 1, borderColor: c.border.primary,
      backgroundColor: c.surface.primary,
      shadowColor: c.shadow,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.06, shadowRadius: 6, elevation: 2,
    }}>
      {/* ── Header ── */}
      <SectionHeader
        title={title}
        right={<CountBadge count={rows.length} total={totalCount} isFiltered={isFiltered} />}
      />

      {/* ── Loading ── */}
      {loading ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 }}>
          <ActivityIndicator size="large" color={c.interactive.primary} />
          <Text style={{ fontSize: FontSize.base, color: c.text.muted }}>Loading…</Text>
        </View>

      ) : view === 'table' ? (
        pagination ? (
          <PaginatedView
            renderContent={renderTable}
            ListHeader={ListHeader}
            pagination={pagination}
            loading={loading}
            onRefresh={onRefresh ?? (() => {})}
          />
        ) : (
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
        <View style={{ flex: 1 }}>
          <FlatList
            style={{ flex: 1 }}
            data={rows}
            keyExtractor={(item) => item.id}
            contentContainerStyle={{ paddingHorizontal: 12, paddingTop: 8, paddingBottom: 24 }}
            ListEmptyComponent={<AppEmptyState icon={emptyIcon} message={emptyMsg} subtitle={emptySub} />}
            ListFooterComponent={paginationBar}
            refreshControl={onRefresh ? <RefreshControl refreshing={loading} onRefresh={onRefresh} /> : undefined}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            renderItem={({ item }) => renderGridItem ? (renderGridItem(item) ?? null) : null}
          />
        </View>

      ) : (
        <View style={{ flex: 1 }}>
          <FlatList
            style={{ flex: 1 }}
            data={rows}
            keyExtractor={(item) => item.id}
            contentContainerStyle={{ paddingBottom: 24 }}
            ListEmptyComponent={<AppEmptyState icon={emptyIcon} message={emptyMsg} subtitle={emptySub} />}
            ListFooterComponent={paginationBar}
            refreshControl={onRefresh ? <RefreshControl refreshing={loading} onRefresh={onRefresh} /> : undefined}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            renderItem={({ item }) => renderCompactItem ? (renderCompactItem(item) ?? null) : null}
          />
        </View>
      )}

      {formOpen && renderForm && renderForm(editingItem, () => setFormOpen(false))}

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
