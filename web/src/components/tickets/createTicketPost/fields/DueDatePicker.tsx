import { memo } from "react";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";

export interface DueDatePickerProps {
  value: Date | null;
  onChange: (date: Date | null) => void;
}

const DueDatePicker = memo(({ value, onChange }: DueDatePickerProps) => (
  <LocalizationProvider dateAdapter={AdapterDateFns}>
    <DatePicker
      label="Due Date"
      value={value}
      onChange={(date) => onChange(date)}
      format="dd/MM/yyyy"
      slotProps={{
        textField: {
          fullWidth: true,
          size: "small",
          sx: {
            "& .MuiOutlinedInput-root": {
              borderRadius: 2,
            },
          },
        },
      }}
    />
  </LocalizationProvider>
));

DueDatePicker.displayName = "DueDatePicker";
export default DueDatePicker;
