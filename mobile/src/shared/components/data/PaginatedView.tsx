import React from 'react';
import { View, FlatList, RefreshControl } from 'react-native';
import AppPagination from './AppPagination';
import type { PaginationState } from './DataCard';

interface Props {
  /** Renders the main content (table, list, etc.) */
  renderContent: () => React.ReactElement | null;
  /** Optional header rendered above the content (search bar, filters, etc.) */
  ListHeader?: React.ReactElement;
  pagination: PaginationState;
  loading: boolean;
  onRefresh: () => void;
}

const SENTINEL = [{ key: 'content' }];

/**
 * Generic paginated view — renders a single content block inside a FlatList
 * with an optional header, pagination footer, and pull-to-refresh.
 *
 * The FlatList wrapper is needed so the header, content, and pagination
 * footer all scroll together as one unit.
 */
const PaginatedView: React.FC<Props> = ({
  renderContent, ListHeader, pagination, loading, onRefresh,
}) => (
  <View style={{ flex: 1 }}>
    <FlatList
      data={SENTINEL}
      keyExtractor={(item) => item.key}
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
