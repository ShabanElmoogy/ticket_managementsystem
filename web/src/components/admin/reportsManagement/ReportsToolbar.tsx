import React from "react";
import { Stack, TextField, MenuItem, Button } from "@mui/material";
import type { ReportType } from "./types";

interface Props {
  reportType: ReportType;
  setReportType: (t: ReportType) => void;
  reportTypes: { id: ReportType; label: string }[];
  onGeneratePdf: () => void;
  onRefresh: () => void;
  disabled?: boolean;
}

const ReportsToolbar: React.FC<Props> = ({ reportType, setReportType, reportTypes, onGeneratePdf, onRefresh, disabled }) => {
  return (
    <Stack direction="row" spacing={1}>
      <TextField
        select
        size="small"
        label="Report"
        value={reportType}
        onChange={(e) => setReportType(e.target.value as ReportType)}
        sx={{ minWidth: 300 }}
      >
        {reportTypes.map((rt) => (
          <MenuItem key={rt.id} value={rt.id}>
            {rt.label}
          </MenuItem>
        ))}
      </TextField>
      <Button variant="outlined" onClick={onGeneratePdf} disabled={disabled}>
        Generate PDF
      </Button>
      <Button variant="outlined" onClick={onRefresh}>
        Refresh
      </Button>
    </Stack>
  );
};

export default ReportsToolbar;
