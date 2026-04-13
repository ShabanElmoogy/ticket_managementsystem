import React from 'react';
import {
  Select, IconButton, FormControl, InputLabel,
  MenuItem, CircularProgress,
  ListSubheader, Chip, Box, Typography,
} from '@mui/material';
import { Clear as ClearIcon } from '@mui/icons-material';
import type { SelectProps } from '@mui/material/Select';
import type { SxProps, Theme } from '@mui/material/styles';

// ── Option types ──────────────────────────────────────────────────────────────

export interface SelectOption {
  value: string | number;
  label: string;
  /** Optional color dot shown before the label */
  color?: string;
  /** Disable this specific option */
  disabled?: boolean;
  /** Group header — renders a ListSubheader above this option */
  group?: string;
}

// ── Low-level MySelect (raw Select wrapper, used by ReusableFormDialog) ───────

export interface MySelectProps extends Omit<SelectProps, 'autoComplete'> {
  showClearButton?: boolean;
  onClear?: () => void;
}

export const MySelect: React.FC<MySelectProps> = ({
  showClearButton = true,
  onClear,
  value,
  onChange,
  endAdornment,
  ...rest
}) => {
  const hasValue = Boolean(
    value !== undefined && value !== null && value !== '' &&
    (Array.isArray(value) ? value.length > 0 : true)
  );

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (onClear) {
      onClear();
    } else if (onChange) {
      const newValue = rest.multiple ? [] : '';
      onChange({ target: { value: newValue, name: rest.name } } as any, null);
    }
  };

  const clearButton = showClearButton && hasValue ? (
    <IconButton
      aria-label="clear selection"
      onClick={handleClear}
      size="small"
      tabIndex={-1}
      sx={{ opacity: 0.6, '&:hover': { opacity: 1 }, transition: 'opacity 0.15s', mr: 1 }}
    >
      <ClearIcon fontSize="small" />
    </IconButton>
  ) : null;

  return (
    <Select
      {...rest}
      value={value}
      onChange={onChange}
      endAdornment={<>{clearButton}{endAdornment}</>}
      MenuProps={{ disableScrollLock: true, ...rest.MenuProps }}
      slotProps={{
        input: { autoComplete: 'new-password', ...rest.slotProps?.input },
        ...rest.slotProps,
      }}
    />
  );
};

export default MySelect;

// ── High-level AppSelect (FormControl + Label + Select + MenuItems) ───────────

export interface AppSelectProps {
  // ── Value ──────────────────────────────────────────────────────────────────
  value: string | number | string[] | number[];
  onChange: (value: any) => void;

  // ── Options ────────────────────────────────────────────────────────────────
  /** Array of options to render as MenuItems */
  options?: SelectOption[];
  /** Placeholder option rendered as first item with empty value */
  placeholder?: string;

  // ── Label / form ───────────────────────────────────────────────────────────
  label?: string;
  name?: string;
  required?: boolean;
  error?: boolean;
  helperText?: string;
  disabled?: boolean;

  // ── Behaviour ──────────────────────────────────────────────────────────────
  multiple?: boolean;
  /** Show clear (×) button when a value is selected. Default: false */
  showClearButton?: boolean;
  onClear?: () => void;
  /** Show a loading spinner instead of options */
  loading?: boolean;
  /** Size of the FormControl. Default: 'small' */
  size?: 'small' | 'medium';
  fullWidth?: boolean;
  sx?: SxProps<Theme>;
}

/**
 * Self-contained select — wraps FormControl + InputLabel + Select + MenuItems.
 *
 * ```tsx
 * // Simple options array
 * <AppSelect
 *   label="Status"
 *   value={status}
 *   onChange={setStatus}
 *   options={[
 *     { value: 'OPEN',     label: 'Open',      color: '#3b82f6' },
 *     { value: 'RESOLVED', label: 'Resolved',  color: '#10b981' },
 *   ]}
 *   placeholder="All statuses"
 * />
 *
 * // With loading state
 * <AppSelect label="Customer" value={id} onChange={setId} options={customers} loading={isLoading} />
 *
 * // With clear button
 * <AppSelect label="User" value={userId} onChange={setUserId} options={users} showClearButton onClear={() => setUserId('')} />
 *
 * // Multiple
 * <AppSelect label="Tags" value={tags} onChange={setTags} options={tagOptions} multiple />
 * ```
 */
export const AppSelect: React.FC<AppSelectProps> = ({
  value,
  onChange,
  options = [],
  placeholder,
  label,
  name,
  required,
  error,
  helperText,
  disabled,
  multiple = false,
  showClearButton = false,
  onClear,
  loading = false,
  size = 'small',
  fullWidth = true,
  sx,
}) => {
  const hasValue = Array.isArray(value) ? value.length > 0 : Boolean(value !== '' && value !== undefined && value !== null);

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (onClear) { onClear(); return; }
    onChange(multiple ? [] : '');
  };

  // Group options by their `group` key
  const rendered: React.ReactNode[] = [];
  let lastGroup: string | undefined;

  if (placeholder) {
    rendered.push(
      <MenuItem key="__placeholder__" value="">
        <Typography variant="body2" color="text.secondary">{placeholder}</Typography>
      </MenuItem>
    );
  }

  if (loading) {
    rendered.push(
      <MenuItem key="__loading__" disabled>
        <Box display="flex" alignItems="center" gap={1}>
          <CircularProgress size={14} />
          <Typography variant="body2" color="text.secondary">Loading…</Typography>
        </Box>
      </MenuItem>
    );
  } else {
    for (const opt of options) {
      if (opt.group && opt.group !== lastGroup) {
        rendered.push(<ListSubheader key={`group-${opt.group}`}>{opt.group}</ListSubheader>);
        lastGroup = opt.group;
      }
      rendered.push(
        <MenuItem key={opt.value} value={opt.value} disabled={opt.disabled}>
          {opt.color ? (
            <Box display="flex" alignItems="center" gap={1}>
              <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: opt.color, flexShrink: 0 }} />
              {opt.label}
            </Box>
          ) : opt.label}
        </MenuItem>
      );
    }
  }

  const clearButton = showClearButton && hasValue ? (
    <IconButton
      aria-label="clear selection"
      onClick={handleClear}
      size="small"
      tabIndex={-1}
      sx={{ opacity: 0.6, '&:hover': { opacity: 1 }, transition: 'opacity 0.15s', mr: 1 }}
    >
      <ClearIcon fontSize="small" />
    </IconButton>
  ) : null;

  // Render selected value as chip(s) for multiple
  const renderValue = multiple
    ? (selected: unknown) => (
      <Box display="flex" flexWrap="wrap" gap={0.5}>
        {(selected as string[]).map((v) => {
          const opt = options.find((o) => String(o.value) === String(v));
          return (
            <Chip
              key={v}
              label={opt?.label ?? v}
              size="small"
              sx={{ height: 20, fontSize: '0.7rem' }}
            />
          );
        })}
      </Box>
    )
    : undefined;

  return (
    <FormControl size={size} fullWidth={fullWidth} error={error} disabled={disabled || loading} required={required} sx={sx}>
      {label && <InputLabel>{label}</InputLabel>}
      <Select
        name={name}
        value={value}
        label={label}
        multiple={multiple}
        onChange={(e) => onChange(e.target.value)}
        renderValue={renderValue}
        endAdornment={clearButton}
        MenuProps={{ disableScrollLock: true }}
        slotProps={{ input: { autoComplete: 'new-password' } }}
      >
        {rendered}
      </Select>
      {helperText && (
        <Typography variant="caption" color={error ? 'error' : 'text.secondary'} sx={{ mt: 0.5, mx: 1.75 }}>
          {helperText}
        </Typography>
      )}
    </FormControl>
  );
};
