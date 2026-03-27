import { memo } from "react";
import { Avatar, Box, FormControl, InputLabel, MenuItem, Select } from "@mui/material";
import type { User } from "../../../../services/api";
import { getInitials } from "../Header";

export interface AssignToSelectProps {
  value: string;
  onChange: (id: string) => void;
  employees: User[];
}

const AssignToSelect = memo(({ value, onChange, employees }: AssignToSelectProps) => (
  <FormControl size="small" fullWidth>
    <InputLabel>Assign To</InputLabel>
    <Select
      value={value}
      label="Assign To"
      onChange={(e) => onChange(e.target.value)}
      sx={{ borderRadius: 2 }}
      inputProps={{ autoComplete: "off" }}
    >
      <MenuItem value="">Unassigned</MenuItem>
      {employees.map((employee) => (
        <MenuItem key={employee.id} value={employee.id}>
          <Box display="flex" alignItems="center" gap={1}>
            <Avatar sx={{ width: 24, height: 24, fontSize: "0.75rem" }}>
              {getInitials(employee.name)}
            </Avatar>
            {employee.name}
          </Box>
        </MenuItem>
      ))}
    </Select>
  </FormControl>
));

AssignToSelect.displayName = "AssignToSelect";
export default AssignToSelect;
