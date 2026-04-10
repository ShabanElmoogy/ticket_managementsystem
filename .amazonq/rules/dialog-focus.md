# Dialog Auto-Focus Rule

## When creating a new Dialog component with form fields, ALWAYS auto-focus the first TextField on open using `useRef`.

### Pattern to follow

```tsx
import React, { useRef, useEffect } from 'react';

const MyDialog: React.FC<Props> = ({ open, onClose }) => {
  const firstFieldRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) setTimeout(() => firstFieldRef.current?.focus(), 100);
  }, [open]);

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogContent>
        <TextField inputRef={firstFieldRef} label="..." />
      </DialogContent>
    </Dialog>
  );
};
```

### Rules
1. Always import `useRef` and `useEffect` (or use `React.useRef` / `React.useEffect` if React is already imported as namespace)
2. Declare `const firstFieldRef = useRef<HTMLInputElement>(null)` inside the component
3. Add a `useEffect` that fires when `open` changes — use `setTimeout(..., 100)` to wait for the dialog animation to complete before focusing
4. Attach `inputRef={firstFieldRef}` to the **first** `TextField` in the dialog
5. Never use `autoFocus` prop on TextField — it causes issues with MUI dialogs and scroll jumping
