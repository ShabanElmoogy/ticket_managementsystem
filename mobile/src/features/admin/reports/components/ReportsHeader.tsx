import React from 'react';
import { AppScreenHeader } from '@/src/shared/components';
import type { AdminView } from '@/src/stores/uiStore';

interface Props {
  view: AdminView;
  onViewChange: (v: AdminView) => void;
  loading: boolean;
  exporting: boolean;
  isEmpty: boolean;
  onExport: () => void;
  onRefresh: () => void;
}

/**
 * Reports screen header — uses the unified AppScreenHeader.
 * Shows: ViewToggle | [title] | Refresh | Export PDF
 */
const ReportsHeader: React.FC<Props> = ({
  view, onViewChange,
  loading, exporting, isEmpty,
  onExport, onRefresh,
}) => (
  <AppScreenHeader
    view={view}
    onViewChange={onViewChange}
    loading={loading}
    onExport={onExport}
    exporting={exporting}
    exportDisabled={loading || isEmpty}
    onRefresh={onRefresh}
  />
);

export default ReportsHeader;
