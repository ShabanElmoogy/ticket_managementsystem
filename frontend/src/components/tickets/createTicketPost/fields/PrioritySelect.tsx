import { memo } from "react";
import { FormControl, InputLabel, MenuItem, Select } from "@mui/material";

export type Priority = "LOW" | "MEDIUM" | "HIGH" | "URGENT";

export interface PrioritySelectProps {
  value: Priority;
  onChange: (p: Priority) => void;
}

const PrioritySelect = memo(({ value, onChange }: PrioritySelectProps) => (
  <FormControl size="small" fullWidth>
    <InputLabel>Priority</InputLabel>
    <Select
      value={value}
      label="Priority"
      onChange={(e) => onChange(e.target.value as Priority)}
      sx={{ borderRadius: 2 }}
      inputProps={{ autoComplete: "off" }}
    >
      <MenuItem value="LOW">🟢 Low</MenuItem>
      <MenuItem value="MEDIUM">🟡 Medium</MenuItem>
      <MenuItem value="HIGH">🟠 High</MenuItem>
      <MenuItem value="URGENT">🔴 Urgent</MenuItem>
    </Select>
  </FormControl>
));

PrioritySelect.displayName = "PrioritySelect";
export default PrioritySelect;
