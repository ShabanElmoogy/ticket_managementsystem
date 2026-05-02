/**
 * PaginatedView — wraps any content block with pull-to-refresh and a pagination footer.
 *
 * Uses a single-item FlatList so the header, content, and pagination bar
 * all scroll together as one unit.
 */
import React from 'react';
import { View } from 'react-native';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { FlatList, RefreshControl } = require('react-native') as { FlatList: any; RefreshControl: any };
import AppPagination from './AppPagination';
import type { PaginationState } from './DataCard';

export interface PaginatedViewProps {
  /** Renders the main content (table, list, etc.) */
  renderContent:  () => React.ReactElement | null;
  /** Optional header rendered above the content */
  ListHeader?:    React.ReactElement;
  pagination:     PaginationState;
  loading:        boolean;
  onRefresh:      () => void;
}

// Single sentinel item — FlatList renders it once, giving us header/footer/refresh for free
const SENTINEL = [{ key: 'content' }];

const PaginatedView: React.FC<PaginatedViewProps> = ({
  renderContent, ListHeader, pagination, loading, onRefresh,
}) => (
  <View style={{ flex: 1 }}>
    <FlatList
      data={SENTINEL}
      keyExtractor={(item: { key: string }) => item.key}
      renderItem={() => renderContent()}
      ListHeaderComponent={ListHeader}
      ListFooterComponent={
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
      }
      refreshControl={<RefreshControl refreshing={loading} onRefresh={onRefresh} />}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
      removeClippedSubviews={false}
    />
  </View>
);

export default PaginatedView;
