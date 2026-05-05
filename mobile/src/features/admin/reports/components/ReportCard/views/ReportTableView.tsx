import React from 'react';
import { PaginatedView } from '@/src/shared/components';

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
}

const ReportTableView: React.FC<Props> = ({
  renderTable, ListHeader, activePag, loading, onRefresh,
}) => (
  <PaginatedView
    renderContent={renderTable}
    ListHeader={ListHeader}
    pagination={activePag}
    loading={loading}
    onRefresh={onRefresh}
  />
);

export default ReportTableView;
