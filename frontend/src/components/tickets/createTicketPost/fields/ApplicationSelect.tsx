import { memo } from "react";
import { FormControl, InputLabel, MenuItem, Select } from "@mui/material";
import type { Application } from "../../../../services/api";

export interface ApplicationSelectProps {
  value: string;
  onChange: (id: string) => void;
  applications: Application[];
}

const ApplicationSelect = memo(({ value, onChange, applications }: ApplicationSelectProps) => (
  <FormControl size="small" fullWidth>
    <InputLabel>Application</InputLabel>
    <Select
      value={value}
      label="Application"
      onChange={(e) => onChange(e.target.value)}
      sx={{ borderRadius: 2 }}
      inputProps={{ autoComplete: "off" }}
    >
      <MenuItem value="">None</MenuItem>
      {applications.map((app) => (
        <MenuItem key={app.id} value={app.id}>
          {app.name}
        </MenuItem>
      ))}
    </Select>
  </FormControl>
));

ApplicationSelect.displayName = "ApplicationSelect";
export default ApplicationSelect;
