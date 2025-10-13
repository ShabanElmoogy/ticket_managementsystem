import React from "react";
import { FormControl, InputLabel, Select, MenuItem } from "@mui/material";
import type { User } from "../../../services/api";

export interface AssignSelectProps {
  value: string;
  employees: User[];
  onChange: (v: string) => void;
}

const AssignSelect: React.FC<AssignSelectProps> = ({ value, employees, onChange }) => (
  <FormControl fullWidth margin="normal">
    <InputLabel>Assign To</InputLabel>
    <Select value={value} label="Assign To" onChange={(e) => onChange(e.target.value)}>
      <MenuItem value="">Unassigned</MenuItem>
      {employees.map((employee) => (
        <MenuItem key={employee.id} value={employee.id}>
          {employee.name}
        </MenuItem>
      ))}
    </Select>
  </FormControl>
);

export default AssignSelect;
