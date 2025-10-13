import React from "react";
import { TextField, IconButton, InputAdornment } from "@mui/material";
import { Clear as ClearIcon } from "@mui/icons-material";
import type { TextFieldProps } from "@mui/material/TextField";

interface MyTextFieldProps extends Omit<TextFieldProps, "autoComplete"> {
  showClearButton?: boolean;
  onClear?: () => void;
  rounded?: boolean;
}

const MyTextField: React.FC<MyTextFieldProps> = (props) => {
  const {
    showClearButton = true,
    onClear,
    value,
    onChange,
    slotProps,
    sx,
    rounded = false,
    ...restProps
  } = props;

  // Check if field has value
  const hasValue = Boolean(value && String(value).length > 0);

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onClear) {
      onClear();
    } else if (onChange) {
      const event = {
        target: { value: "" },
        currentTarget: { value: "" },
      } as React.ChangeEvent<HTMLInputElement>;
      onChange(event);
    }
  };

  // Create clear button - only show when there's text
  const clearButton =
    showClearButton && hasValue ? (
      <InputAdornment position="end">
        <IconButton
          aria-label="clear"
          onClick={handleClear}
          edge="end"
          size="small"
          tabIndex={-1}
          sx={{
            opacity: 0.7,
            "&:hover": {
              opacity: 1,
              backgroundColor: "rgba(0, 0, 0, 0.04)",
            },
            transition: "opacity 0.2s ease-in-out",
          }}
        >
          <ClearIcon fontSize="small" />
        </IconButton>
      </InputAdornment>
    ) : undefined;

  // Build the input slot props with proper typing
  const inputSlotProps = {
    ...slotProps?.input,
    ...(clearButton && { endAdornment: clearButton }),
  };

  return (
    <TextField
      {...restProps}
      value={value}
      onChange={onChange}
      autoComplete="off"
      sx={{
        ...(rounded && {
          "& .MuiOutlinedInput-root": {
            borderRadius: 3,
          },
        }),
        ...sx,
      }}
      slotProps={{
        ...slotProps,
        input: inputSlotProps,
        htmlInput: {
          ...slotProps?.htmlInput,
          // Comprehensive autocomplete prevention
          autoComplete: "new-password",
          autoCorrect: "off",
          autoCapitalize: "off",
          spellCheck: "false",
          // Password manager prevention
          "data-lpignore": "true", // LastPass
          "data-1p-ignore": "true", // 1Password
          "data-bwignore": "true", // Bitwarden
          "data-dashlane-ignore": "true", // Dashlane
          "data-keeper-ignore": "true", // Keeper
          // Browser autocomplete prevention
          "data-form-type": "other",
          "data-autocomplete-type": "disabled",
          // Additional attributes
          role: "textbox",
          "aria-autocomplete": "none",
        },
      }}
    />
  );
};

export default MyTextField;
