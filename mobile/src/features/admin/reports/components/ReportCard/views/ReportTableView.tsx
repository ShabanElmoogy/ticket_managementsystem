import React from 'react';
import PaginatedView from '../../../../../../shared/components/PaginatedView';

interface PaginationState {
  page: number;
  totalPages: number;
  totalItems: number;
  pageSize: number;
  hasNext: boolean;
  hasPrev: boolean;
  next: () => void;
  prev: () => void;
}

interface Props {
  renderTable: () => React.ReactElement | null;
  ListHeader: React.ReactElement;
  activePag: PaginationState;
  loading: boolean;
  onRefresh: () => void;
  isDark: boolean;
}

/**
 * Report-specific table view — thin wrapper around PaginatedView.
 */
const ReportTableView: React.FC<Props> = ({
  renderTable, ListHeader, activePag, loading, onRefresh, isDark,
}) => (
  <PaginatedView
    renderContent={renderTable}
    ListHeader={ListHeader}
    pagination={activePag}
    loading={loading}
    onRefresh={onRefresh}
    isDark={isDark}
  />
);

export default ReportTableView;
