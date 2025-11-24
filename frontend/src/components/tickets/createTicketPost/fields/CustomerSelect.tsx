import React, { memo } from "react";
import { FormControl, InputLabel, MenuItem, Select } from "@mui/material";
import type { Customer } from "../../../services/api";

export interface CustomerSelectProps {
  value: string;
  onChange: (id: string) => void;
  customers: Customer[];
}

const CustomerSelect = memo(({ value, onChange, customers }: CustomerSelectProps) => (
  <FormControl size="small" fullWidth>
    <InputLabel>Customer</InputLabel>
    <Select
      value={value}
      label="Customer"
      onChange={(e) => onChange(e.target.value)}
      sx={{ borderRadius: 2 }}
      inputProps={{ autoComplete: "off" }}
    >
      <MenuItem value="">None</MenuItem>
      {customers.map((customer) => (
        <MenuItem key={customer.id} value={customer.id}>
          {customer.name}
        </MenuItem>
      ))}
    </Select>
  </FormControl>
));

CustomerSelect.displayName = "CustomerSelect";
export default CustomerSelect;
