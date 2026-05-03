/**
 * DataCard — admin list card with table/grid/compact view switching.
 *
 * Handles: loading state, empty state, pagination, pull-to-refresh.
 * Delete dialog is managed by the parent via `onDelete` — DataCard does NOT
 * manage delete state internally (the dialog is in AdminCrudScreen).
 */
import React from 'react';
import { View, Text, ActivityIndicator, ScrollView } from 'react-native';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { FlatList, RefreshControl } = require('react-native') as { FlatList: any; RefreshControl: any };
import { useThemeColors, FontSize } from '@/src/constants/theme';
import AppEmptyState from '@/src/shared/components/feedback/AppEmptyState';
import SectionHeader from '@/src/shared/components/display/SectionHeader';
import CountBadge    from '@/src/shared/components/display/CountBadge';
import PaginatedView from './PaginatedView';
import AppPagination from './AppPagination';
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
  totalCount:         number;
  rows:               T[];
  loading:            boolean;
  search:             string;
  view:               AdminView;
  renderTable:        () => React.ReactElement | null;
  pagination?:        PaginationState;
  renderGridItem?:    (item: T) => React.ReactElement | null;
  renderCompactItem?: (item: T) => React.ReactElement | null;
  headerExtras?:      React.ReactNode;
  onRefresh?:         () => void;
  /** Empty state messages — defaults to English if not provided */
  emptyMessage?:      string;
  emptyFilteredMessage?: string;
}

// ── Component ─────────────────────────────────────────────────────────────────

function DataCard<T extends { id: string }>({
  title,
  totalCount, rows, loading,
  search, view,
  renderTable, pagination,
  renderGridItem, renderCompactItem,
  headerExtras, onRefresh,
  emptyMessage = 'No data available',
  emptyFilteredMessage = 'No results found',
}: DataCardProps<T>) {
  const c = useThemeColors();

  const isFiltered = search.trim().length > 0;
  const emptyMsg   = isFiltered ? emptyFilteredMessage : emptyMessage;
  const emptyIcon  = isFiltered ? '🔍' : '📭';
  const emptySub   = isFiltered ? `No rows match "${search}"` : undefined;

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
      shadowColor: c.shadow, shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.06, shadowRadius: 6, elevation: 2,
    }}>
      {/* Header */}
      <SectionHeader
        title={title}
        right={<CountBadge count={rows.length} total={totalCount} isFiltered={isFiltered} />}
      />

      {/* Loading */}
      {loading ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 }}>
          <ActivityIndicator size="large" color={c.interactive.primary} />
          <Text style={{ fontSize: FontSize.base, color: c.text.muted }}>Loading…</Text>
        </View>

      ) : view === 'table' ? (
        // ── Table view ──────────────────────────────────────────────────────
        pagination ? (
          <PaginatedView
            renderContent={renderTable}
            ListHeader={headerExtras ? <View>{headerExtras}</View> : undefined}
            pagination={pagination}
            loading={false}
            onRefresh={onRefresh ?? (() => {})}
          />
        ) : (
          <ScrollView
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            refreshControl={onRefresh ? <RefreshControl refreshing={loading} onRefresh={onRefresh} /> : undefined}
          >
            {headerExtras}
            {renderTable()}
          </ScrollView>
        )

      ) : view === 'grid' ? (
        // ── Grid view ───────────────────────────────────────────────────────
        <FlatList
          style={{ flex: 1 }}
          data={rows}
          keyExtractor={(item: any) => item.id}
          contentContainerStyle={{ paddingHorizontal: 12, paddingTop: 8, paddingBottom: 24 }}
          ListHeaderComponent={headerExtras ? <View>{headerExtras}</View> : undefined}
          ListEmptyComponent={<AppEmptyState fill icon={emptyIcon} message={emptyMsg} subtitle={emptySub} />}
          ListFooterComponent={paginationBar}
          refreshControl={onRefresh ? <RefreshControl refreshing={loading} onRefresh={onRefresh} /> : undefined}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          renderItem={({ item }: { item: any }) => renderGridItem ? (renderGridItem(item) ?? null) : null}
        />

      ) : (
        // ── Compact view ────────────────────────────────────────────────────
        <FlatList
          style={{ flex: 1 }}
          data={rows}
          keyExtractor={(item: any) => item.id}
          contentContainerStyle={{ paddingBottom: 24 }}
          ListHeaderComponent={headerExtras ? <View>{headerExtras}</View> : undefined}
          ListEmptyComponent={<AppEmptyState fill icon={emptyIcon} message={emptyMsg} subtitle={emptySub} />}
          ListFooterComponent={paginationBar}
          refreshControl={onRefresh ? <RefreshControl refreshing={loading} onRefresh={onRefresh} /> : undefined}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          renderItem={({ item }: { item: any }) => renderCompactItem ? (renderCompactItem(item) ?? null) : null}
        />
      )}
    </View>
  );
}

export default DataCard;

