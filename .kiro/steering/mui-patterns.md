# MUI Component Patterns

Canonical usage for MUI v6+. Follow these patterns in all new and edited components.

---

## TextField

### Deprecated props → replacements

| Deprecated | Replacement |
|---|---|
| `inputProps` | `slotProps.htmlInput` |
| `InputProps` | `slotProps.input` |
| `inputRef` | keep `inputRef` (still works in v6) |

```tsx
// ✅ Correct
<TextField
  slotProps={{
    htmlInput: { min: 0, step: 0.25 },        // native <input> attributes
    input: {                                    // InputBase wrapper props
      startAdornment: (
        <InputAdornment position="start"><SearchIcon /></InputAdornment>
      ),
      endAdornment: value ? (
        <InputAdornment position="end">
          <IconButton size="small" onClick={onClear} edge="end">
            <ClearIcon fontSize="small" />
          </IconButton>
        </InputAdornment>
      ) : null,
    },
  }}
/>

// ❌ Deprecated
<TextField inputProps={{ min: 0 }} InputProps={{ startAdornment: ... }} />
```

---

## Select / FormControl

Always add `disableScrollLock` via `MenuProps` to prevent page-width jump when dropdown opens.

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

// ❌ Missing — page jumps on open
<Select value={val}>...</Select>
```

---

## Dialog

Always add `disableScrollLock` to prevent layout shift when a dialog opens.

```tsx
// ✅ Correct
<Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth disableScrollLock>
  ...
</Dialog>

// ❌ Missing — causes page width jump
<Dialog open={open} onClose={onClose}>...</Dialog>
```

---

## Autocomplete

```tsx
// ✅ Correct — use slotProps.input inside renderInput
<Autocomplete
  renderInput={(params) => (
    <TextField
      {...params}
      label="Search"
      slotProps={{
        input: {
          ...params.InputProps,
          startAdornment: (
            <><SearchIcon sx={{ ml: 0.5, mr: 0.5 }} />{params.InputProps.startAdornment}</>
          ),
        },
      }}
    />
  )}
/>

// ❌ Deprecated
<TextField {...params} InputProps={{ ...params.InputProps, startAdornment: ... }} />
```

---

## DataGrid (MUI X)

Use `slots` + `slotProps` — `components` / `componentsProps` are deprecated since v6.

```tsx
// ✅
<DataGrid
  slots={{ toolbar: GridToolbar, noRowsOverlay: () => <EmptyState message="No data" /> }}
  slotProps={{ toolbar: { showQuickFilter: true } }}
/>

// ❌ Deprecated
<DataGrid components={{ Toolbar: GridToolbar }} componentsProps={{ toolbar: { ... } }} />
```

---

## Responsive Layout

### Breakpoint scale used in this project

| Breakpoint | Value | Use for |
|---|---|---|
| `xs` | 0px | Mobile default |
| `sm` | 600px | Large phones / small tablets |
| `md` | 900px | Tablets / small laptops |
| `lg` | 1200px | Desktops |
| `xl` | 1536px | Wide screens |

### Admin panel context

The admin sidebar is **240px wide**. When writing responsive styles inside the admin panel, account for this offset — effective content width at 1024px viewport is only ~784px. Use `lg` (1200px) as the breakpoint for 3-column layouts inside admin.

### Preferred patterns

```tsx
// ✅ Padding that scales with screen
<Box sx={{ p: { xs: 1, sm: 2, md: 3 } }}>

// ✅ Stack that switches direction
<Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>

// ✅ Grid responsive columns
<Grid container spacing={2}>
  <Grid size={{ xs: 12, sm: 6, md: 4 }}>...</Grid>
</Grid>

// ✅ Hide/show at breakpoints
<Box sx={{ display: { xs: 'none', md: 'block' } }}>Desktop only</Box>
<Box component="span" sx={{ display: { xs: 'none', sm: 'inline' } }}>Label text</Box>

// ✅ Width that switches
<Box sx={{ width: { xs: '100%', md: 340 } }}>

// ✅ useMediaQuery for JS-driven layout decisions (sidebars, overlays)
const compact = useMediaQuery('(max-width: 900px)');
// Use ONE query per component — derive all layout decisions from it
// Never mix useMediaQuery + sx breakpoints for the same layout decision
```

### Sidebar overlay pattern (compact screens)

When a sidebar should overlay content instead of pushing it on small screens:

```tsx
// In the sidebar component — position:absolute removes it from flex flow
<Box sx={{
  width: 240,
  flexShrink: 0,
  ...(overlay && {
    position: 'absolute',
    top: 0, left: 0, bottom: 0,
    zIndex: 10,
    boxShadow: '4px 0 12px rgba(0,0,0,0.15)',
  }),
}}>

// Backdrop to close on tap
{overlay && sidebarOpen && (
  <Box
    onClick={() => setSidebarOpen(false)}
    sx={{ position: 'absolute', inset: 0, zIndex: 9, bgcolor: 'rgba(0,0,0,0.35)' }}
  />
)}

// Auto-close when crossing breakpoint
useEffect(() => { if (compact) setSidebarOpen(false); }, [compact]);
```

### AppBar spacer

Use this consistent spacer below a fixed AppBar:

```tsx
<Toolbar sx={{ minHeight: { xs: 56, sm: 64, md: 70 } }} />
```

---

## Grid v2

This project uses MUI Grid v2 (`size` prop, not `item`/`xs`).

```tsx
// ✅ Grid v2
import Grid from '@mui/material/Grid';

<Grid container spacing={2}>
  <Grid size={{ xs: 12, sm: 6, md: 4 }}>...</Grid>
</Grid>

// ❌ Grid v1 (deprecated)
<Grid container><Grid item xs={12} sm={6}></Grid></Grid>
```

---

## Colored Chip pattern

Consistent tinted chip used throughout the app for status/priority labels:

```tsx
// ✅ Standard colored chip
<Chip
  label={status}
  size="small"
  sx={{
    height: 18,
    fontSize: '0.65rem',
    fontWeight: 700,
    bgcolor: `${color}22`,          // 13% opacity background
    color: color,
    border: `1px solid ${color}44`, // 27% opacity border
  }}
/>
```

---

## Section label pattern

Consistent uppercase section headings used in detail panels:

```tsx
// ✅ Standard section label
<Typography
  variant="caption"
  fontWeight={700}
  color="text.secondary"
  sx={{ textTransform: 'uppercase', letterSpacing: 0.8, display: 'block', mb: 1 }}
>
  Section Title
</Typography>
```

---

## General deprecation rule

Whenever MUI shows a deprecation warning for `*Props` or `components*`, the replacement is always the `slots` / `slotProps` API:

```
inputProps          → slotProps.htmlInput
InputProps          → slotProps.input
InputLabelProps     → slotProps.inputLabel
FormHelperTextProps → slotProps.formHelperText
components          → slots
componentsProps     → slotProps
```
