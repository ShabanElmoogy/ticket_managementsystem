import React from "react";
import { TextField } from "@mui/material";

export interface TitleFieldProps {
  value: string;
  onChange: (v: string) => void;
}

const TitleField: React.FC<TitleFieldProps> = ({ value, onChange }) => (
  <TextField
    fullWidth
    label="Title"
    value={value}
    onChange={(e) => onChange(e.target.value)}
    margin="normal"
    required
    autoFocus
  />
);

export default TitleField;
