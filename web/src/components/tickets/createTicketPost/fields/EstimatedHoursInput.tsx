import { memo } from "react";
import { TextField } from "@mui/material";

export interface EstimatedHoursInputProps {
  value: string;
  onChange: (value: string) => void;
}

const EstimatedHoursInput = memo(({ value, onChange }: EstimatedHoursInputProps) => (
  <TextField
    fullWidth
    label="Estimated Hours"
    type="number"
    size="small"
    value={value}
    onChange={(e) => onChange(e.target.value)}
    inputProps={{ min: 0, step: 0.5 }}
    sx={{
      "& .MuiOutlinedInput-root": {
        borderRadius: 2,
      },
    }}
  />
));

EstimatedHoursInput.displayName = "EstimatedHoursInput";
export default EstimatedHoursInput;
