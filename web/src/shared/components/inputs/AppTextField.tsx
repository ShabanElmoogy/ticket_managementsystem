import React, { useState } from 'react';
import { TextField, IconButton, InputAdornment, Chip } from '@mui/material';
import {
  Clear as ClearIcon,
  Search as SearchIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
} from '@mui/icons-material';
import type { TextFieldProps } from '@mui/material/TextField';
import type { SvgIconComponent } from '@mui/icons-material';

export interface AppTextFieldProps extends Omit<TextFieldProps, 'autoComplete' | 'type'> {
  // ── Variants ───────────────────────────────────────────────────────────────
  /**
   * - `'search'`   → SearchIcon start adornment + clear button
   * - `'password'` → show/hide toggle
   * - `'number'`   → type="number" + min/max/step
   * - `'text'`     → plain text (default)
   */
  fieldType?: 'text' | 'search' | 'password' | 'number';

  // ── Clear button ───────────────────────────────────────────────────────────
  /** Show clear (×) button when field has a value. Default: true for search */
  showClearButton?: boolean;
  /** Called on clear. Falls back to firing onChange('') */
  onClear?: () => void;

  // ── Adornment shorthands ───────────────────────────────────────────────────
  /** MUI icon component rendered as start adornment */
  startIcon?: SvgIconComponent;
  /** MUI icon component rendered as end adornment */
  endIcon?: SvgIconComponent;

  // ── Style ──────────────────────────────────────────────────────────────────
  /** Rounded corners (borderRadius: 3). Default: false */
  rounded?: boolean;

  // ── Number constraints ─────────────────────────────────────────────────────
  min?: number;
  max?: number;
  step?: number;

  // ── Character limit ────────────────────────────────────────────────────────
  /**
   * Maximum character length.
   * - Blocks typing beyond the limit
   * - Shows a `current/max` chip in the end adornment
   * - Chip turns red when at the limit
   */
  maxLength?: number;
}

/**
 * Drop-in replacement for MUI TextField.
 *
 * ```tsx
 * <AppTextField fieldType="search" value={q} onClear={() => setQ('')} onChange={...} />
 * <AppTextField fieldType="password" label="Password" value={pw} onChange={...} />
 * <AppTextField fieldType="number" min={0} step={0.5} label="Hours" value={h} onChange={...} />
 * <AppTextField maxLength={10} label="Title" value={v} onChange={...} />
 * <AppTextField startIcon={EmailIcon} label="Email" value={email} onChange={...} />
 * ```
 */
const AppTextField: React.FC<AppTextFieldProps> = ({
  fieldType = 'text',
  showClearButton,
  onClear,
  startIcon: StartIcon,
  endIcon: EndIcon,
  value,
  onChange,
  slotProps,
  sx,
  rounded = false,
  min,
  max,
  step,
  maxLength,
  ...rest
}) => {
  const [showPassword, setShowPassword] = useState(false);

  // ── Derived ────────────────────────────────────────────────────────────────
  const strValue   = String(value ?? '');
  const charCount  = strValue.length;
  const hasValue   = charCount > 0;
  const atLimit    = maxLength !== undefined && charCount >= maxLength;

  const shouldShowClear = showClearButton ?? (fieldType === 'search');
  const showClear = shouldShowClear && hasValue;

  const inputType: string =
    fieldType === 'password' ? (showPassword ? 'text' : 'password') :
    fieldType === 'number'   ? 'number' :
    fieldType === 'search'   ? 'search' :
    (rest as any).type ?? 'text';

  // ── Handlers ───────────────────────────────────────────────────────────────
  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onClear) {
      onClear();
    } else if (onChange) {
      onChange({ target: { value: '' }, currentTarget: { value: '' } } as React.ChangeEvent<HTMLInputElement>);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (maxLength !== undefined && e.target.value.length > maxLength) return;
    onChange?.(e);
  };

  // ── Adornments ─────────────────────────────────────────────────────────────
  const resolvedStartIcon = StartIcon ?? (fieldType === 'search' ? SearchIcon : undefined);

  const startAdornment = resolvedStartIcon
    ? (
      <InputAdornment position="start">
        {React.createElement(resolvedStartIcon, { fontSize: 'small', sx: { color: 'text.secondary' } })}
      </InputAdornment>
    )
    : (slotProps?.input as any)?.startAdornment;

  const endAdornments: React.ReactNode[] = [];

  // Custom end icon
  if (EndIcon) {
    endAdornments.push(
      <InputAdornment key="end-icon" position="end">
        <EndIcon fontSize="small" sx={{ color: 'text.secondary' }} />
      </InputAdornment>
    );
  }

  // Character counter chip
  if (maxLength !== undefined) {
    endAdornments.push(
      <InputAdornment key="counter" position="end">
        <Chip
          label={`${charCount}/${maxLength}`}
          size="small"
          color={atLimit ? 'error' : 'default'}
          variant={atLimit ? 'filled' : 'outlined'}
          sx={{ height: 20, fontSize: '0.65rem', fontFamily: 'monospace', '& .MuiChip-label': { px: 0.75 } }}
        />
      </InputAdornment>
    );
  }

  // Password show/hide
  if (fieldType === 'password') {
    endAdornments.push(
      <InputAdornment key="show-pw" position="end">
        <IconButton
          aria-label={showPassword ? 'Hide password' : 'Show password'}
          onClick={() => setShowPassword((v) => !v)}
          edge="end"
          size="small"
          tabIndex={-1}
        >
          {showPassword ? <VisibilityOffIcon fontSize="small" /> : <VisibilityIcon fontSize="small" />}
        </IconButton>
      </InputAdornment>
    );
  }

  // Clear button
  if (showClear) {
    endAdornments.push(
      <InputAdornment key="clear" position="end">
        <IconButton
          aria-label="clear"
          onClick={handleClear}
          edge="end"
          size="small"
          tabIndex={-1}
          sx={{ opacity: 0.6, '&:hover': { opacity: 1 }, transition: 'opacity 0.15s' }}
        >
          <ClearIcon fontSize="small" />
        </IconButton>
      </InputAdornment>
    );
  }

  const endAdornment = endAdornments.length > 0
    ? <>{endAdornments}</>
    : (slotProps?.input as any)?.endAdornment;

  return (
    <TextField
      {...rest}
      type={inputType}
      value={value}
      onChange={handleChange}
      autoComplete="off"
      sx={{
        ...(rounded && { '& .MuiOutlinedInput-root': { borderRadius: 3 } }),
        ...sx,
      }}
      slotProps={{
        ...slotProps,
        input: {
          ...(slotProps?.input as object),
          ...(startAdornment && { startAdornment }),
          ...(endAdornment   && { endAdornment }),
        },
        htmlInput: {
          autoComplete: 'new-password',
          autoCorrect: 'off',
          autoCapitalize: 'off',
          spellCheck: 'false',
          'data-lpignore': 'true',
          'data-1p-ignore': 'true',
          ...(fieldType === 'number' && {
            ...(min  !== undefined && { min }),
            ...(max  !== undefined && { max }),
            ...(step !== undefined && { step }),
          }),
          ...(maxLength !== undefined && { maxLength }),
          ...slotProps?.htmlInput,
        },
      }}
    />
  );
};

export { AppTextField as MyTextField };
export default AppTextField;
