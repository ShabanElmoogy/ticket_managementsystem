import React from 'react';
import AdminToolbar    from '../../../../shared/components/AdminToolbar';
import ExportPdfButton from '../../../../shared/components/ExportPdfButton';
import RefreshButton   from '../../../../shared/components/RefreshButton';
import type { AdminView } from '../../../../stores/uiStore';

interface Props {
  isDark: boolean;
  view: AdminView;
  onViewChange: (v: AdminView) => void;
  loading: boolean;
  exporting: boolean;
  isEmpty: boolean;
  onExport: () => void;
  onRefresh: () => void;
}

const ReportsHeader: React.FC<Props> = ({
  isDark, view, onViewChange,
  loading, exporting, isEmpty,
  onExport, onRefresh,
}) => (
  <AdminToolbar
    isDark={isDark}
    view={view}
    onViewChange={onViewChange}
    actions={
      <>
        <ExportPdfButton
          onPress={onExport}
          loading={exporting}
          disabled={loading || isEmpty}
          isDark={isDark}
        />
        <RefreshButton
          onPress={onRefresh}
          loading={loading}
          isDark={isDark}
        />
      </>
    }
  />
);

export default ReportsHeader;
