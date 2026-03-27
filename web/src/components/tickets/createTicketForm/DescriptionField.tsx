import React from "react";
import { TextField } from "@mui/material";

export interface DescriptionFieldProps {
  value: string;
  onChange: (v: string) => void;
}

const DescriptionField: React.FC<DescriptionFieldProps> = ({ value, onChange }) => (
  <TextField
    fullWidth
    label="Description"
    multiline
    rows={4}
    value={value}
    onChange={(e) => onChange(e.target.value)}
    margin="normal"
    required
  />
);

export default DescriptionField;
