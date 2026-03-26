import React from "react";
import { Select, IconButton } from "@mui/material";
import { Clear as ClearIcon } from "@mui/icons-material";
import type { SelectProps } from "@mui/material/Select";

interface MySelectProps extends Omit<SelectProps, "autoComplete"> {
  showClearButton?: boolean;
  onClear?: () => void;
}

const MySelect: React.FC<MySelectProps> = (props) => {
  const {
    showClearButton = true,
    onClear,
    value,
    onChange,
    endAdornment,
    ...restProps
  } = props;

  // Check if select has value
  const hasValue = Boolean(
    value !== undefined &&
      value !== null &&
      value !== "" &&
      (Array.isArray(value) ? value.length > 0 : true)
  );

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();

    if (onClear) {
      onClear();
    } else if (onChange) {
      const newValue = props.multiple ? [] : "";
      const event = {
        target: {
          value: newValue,
          name: props.name,
        },
      } as any;
      onChange(event, null);
    }
  };

  // Create clear button
  const clearButton =
    showClearButton && hasValue ? (
      <IconButton
        aria-label="clear selection"
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
          mr: 1, // Add margin to separate from dropdown arrow
        }}
      >
        <ClearIcon fontSize="small" />
      </IconButton>
    ) : null;

  return (
    <Select
      {...restProps}
      value={value}
      onChange={onChange}
      endAdornment={
        <>
          {clearButton}
          {endAdornment}
        </>
      }
      slotProps={{
        input: {
          autoComplete: "new-password",
          autoCorrect: "off",
          autoCapitalize: "off",
          spellCheck: false,
          ...props.slotProps?.input,
        },
        ...props.slotProps,
      }}
      MenuProps={{
        disableAutoFocus: true,
        disableEnforceFocus: true,
        disableRestoreFocus: true,
        ...props.MenuProps,
      }}
    />
  );
};

export default MySelect;
