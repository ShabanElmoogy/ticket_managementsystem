import React from "react";
import { FormControl, InputLabel, Select, MenuItem } from "@mui/material";
import type { CreateTicketData } from "../../../services/api";

export interface PrioritySelectProps {
  value: CreateTicketData["priority"];
  onChange: (v: CreateTicketData["priority"]) => void;
}

const PrioritySelect: React.FC<PrioritySelectProps> = ({ value, onChange }) => (
  <FormControl fullWidth margin="normal">
    <InputLabel>Priority</InputLabel>
    <Select
      value={value}
      label="Priority"
      onChange={(e) => onChange(e.target.value as CreateTicketData["priority"])}
    >
      <MenuItem value="LOW">Low</MenuItem>
      <MenuItem value="MEDIUM">Medium</MenuItem>
      <MenuItem value="HIGH">High</MenuItem>
      <MenuItem value="URGENT">Urgent</MenuItem>
    </Select>
  </FormControl>
);

export default PrioritySelect;
