import { memo } from "react";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import type { Dayjs } from "dayjs";

export interface DueDatePickerProps {
  value: Dayjs | null;
  onChange: (date: Dayjs | null) => void;
}

const DueDatePicker = memo(({ value, onChange }: DueDatePickerProps) => (
  <LocalizationProvider dateAdapter={AdapterDayjs}>
    <DatePicker
      label="Due Date"
      value={value}
      onChange={(val) => onChange(val as Dayjs | null)}
      format="DD/MM/YYYY"
      slotProps={{
        textField: {
          fullWidth: true,
          size: "small",
          sx: { "& .MuiOutlinedInput-root": { borderRadius: 2 } },
        },
      }}
    />
  </LocalizationProvider>
));

DueDatePicker.displayName = "DueDatePicker";
export default DueDatePicker;
