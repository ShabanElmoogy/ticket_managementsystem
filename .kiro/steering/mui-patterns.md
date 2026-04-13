# MUI Component Patterns

Canonical usage for MUI v6+. Follow these patterns in all new and edited components.

---

## TextField

### Deprecated props → replacements

| Deprecated | Replacement |
|---|---|
| `inputProps` | `slotProps.htmlInput` |
| `InputProps` | `slotProps.input` |
| `inputRef` | `slotProps.htmlInput.ref` or keep `inputRef` (still works) |

```tsx
// ✅ Correct
<TextField
  slotProps={{
    htmlInput: { min: 0, step: 0.25 },   // native <input> attributes
    input: {                               // InputBase wrapper props
      startAdornment: <InputAdornment position="start"><SearchIcon /></InputAdornment>,
      endAdornment: <InputAdornment position="end"><ClearIcon /></InputAdornment>,
    },
  }}
/>

// ❌ Deprecated
<TextField inputProps={{ min: 0 }} InputProps={{ startAdornment: ... }} />
```

---

## Select / FormControl

Always add `disableScrollLock` to prevent the page from jumping when a dropdown opens.

```tsx
// ✅ Correct
<FormControl fullWidth>
  <InputLabel>Label</InputLabel>
  <Select
    value={val}
    label="Label"
    onChange={...}
    MenuProps={{ disableScrollLock: true }}
  >
    <MenuItem value="a">A</MenuItem>
  </Select>
</FormControl>

// ❌ Missing disableScrollLock — page jumps on open
<Select value={val} label="Label" onChange={...}>...</Select>
```

Same applies to any component that opens a `Menu` or `Popover` (e.g. `Autocomplete`, `DatePicker`):

```tsx
<Autocomplete
  slotProps={{ popper: { disablePortal: false } }}
  componentsProps={{ paper: {} }}
  // For scroll lock: wrap in a FormControl or pass MenuProps if available
/>
```

---

## Autocomplete

| Deprecated | Replacement |
|---|---|
| `renderInput` inputProps | use `slotProps.htmlInput` inside `renderInput` |

---

## DataGrid (MUI X)

- Use `slots` + `slotProps` instead of `components` + `componentsProps` (deprecated since v6).

```tsx
// ✅
<DataGrid slots={{ toolbar: GridToolbar }} slotProps={{ toolbar: { showQuickFilter: true } }} />

// ❌ Deprecated
<DataGrid components={{ Toolbar: GridToolbar }} componentsProps={{ toolbar: { showQuickFilter: true } }} />
```

---

## Dialog

Always add `disableScrollLock` to prevent layout shift when a dialog opens.

```tsx
// ✅ Correct
<Dialog open={open} onClose={onClose} disableScrollLock>
  ...
</Dialog>

// ❌ Missing — causes page width jump
<Dialog open={open} onClose={onClose}>...</Dialog>
```

---

## General rule

Whenever MUI shows a deprecation warning for `*Props` or `components*`, the replacement is always the `slots` / `slotProps` API:

```
inputProps        → slotProps.htmlInput
InputProps        → slotProps.input
InputLabelProps   → slotProps.inputLabel
FormHelperTextProps → slotProps.formHelperText
components        → slots
componentsProps   → slotProps
```
