import React from 'react';
import { Stack } from '@mui/material';
import { AppSelect, AppButton } from '../../../shared/components';
import type { ReportType } from './types';

interface Props {
  reportType: ReportType;
  setReportType: (t: ReportType) => void;
  reportTypes: { id: ReportType; label: string }[];
  onGeneratePdf: () => void;
  onRefresh: () => void;
  disabled?: boolean;
}

const ReportsToolbar: React.FC<Props> = ({
  reportType, setReportType, reportTypes, onGeneratePdf, onRefresh, disabled,
}) => (
  <Stack direction="row" spacing={1} alignItems="center">
    <AppSelect
      label="Report"
      value={reportType}
      onChange={(v) => setReportType(v as ReportType)}
      options={reportTypes.map((rt) => ({ value: rt.id, label: rt.label }))}
      size="small"
      fullWidth={false}
      sx={{ minWidth: 300 }}
    />
    <AppButton variant="outlined" onClick={onGeneratePdf} disabled={disabled}>
      Generate PDF
    </AppButton>
    <AppButton variant="outlined" onClick={onRefresh} disabled={disabled}>
      Refresh
    </AppButton>
  </Stack>
);

export default ReportsToolbar;
