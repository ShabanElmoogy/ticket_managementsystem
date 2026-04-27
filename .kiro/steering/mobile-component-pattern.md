# Mobile Reusable Component Pattern

## Rule — Dumb components receive style, not theme

Reusable components in `mobile/src/shared/components/` that are used inside a `<Modal>` **must not** call `useThemeColors()` or any context hook internally.

**Why:** React Native `Modal` renders in a separate native view tree, outside the app's provider hierarchy. Any hook that reads from a context/store (Zustand, React context) will silently return `undefined` or stale values inside a Modal. This causes colors, theme tokens, and other context values to not apply.

**Scope:** This rule is mandatory for:
- Any component rendered inside `<Modal>` (dialogs, form modals, bottom sheets)
- Any component in `shared/components/actions/` or `shared/components/dialogs/`

Screen-level components (`AppButton`, `AppTextInput`, etc.) used only in screens/pages may call `useThemeColors()` internally — they are never inside a Modal tree.

**The pattern:**

```tsx
// ✅ Correct — dumb component, receives style as props
import { Pressable, Text, StyleSheet, type ViewStyle, type TextStyle } from 'react-native';

interface Props {
  label:       string;
  onPress:     () => void;
  style?:      ViewStyle;
  labelStyle?: TextStyle;
  disabled?:   boolean;
}

const MyButton: React.FC<Props> = ({ label, onPress, style, labelStyle, disabled = false }) => (
  <Pressable style={[styles.base, style, disabled && styles.disabled]} onPress={onPress} disabled={disabled}>
    <Text style={[styles.label, labelStyle]}>{label}</Text>
  </Pressable>
);
```

```tsx
// ✅ Correct — parent resolves colors from useThemeColors() and passes via style
const MyDialog = () => {
  const c = useThemeColors();   // ← hook lives HERE, in the screen/dialog component
  return (
    <Modal>
      <MyButton
        label="Delete"
        onPress={handleDelete}
        style={{ backgroundColor: c.buttons.danger.bg }}
        labelStyle={{ color: c.buttons.danger.text }}
      />
    </Modal>
  );
};
```

```tsx
// ❌ Wrong — hook inside reusable component breaks inside Modal
const MyButton = () => {
  const c = useThemeColors();   // ← undefined inside Modal tree
  return <Pressable style={{ backgroundColor: c.buttons.danger.bg }} />;
};
```

---

## Rules

1. **No hooks in shared components.** `useThemeColors()`, `useIsDark()`, `useTranslation()`, `useDirection()` — none of these belong inside a reusable component in `shared/components/`.

2. **Accept `style` and `labelStyle` props** on every component that renders a container or text. Use `StyleSheet.create` for base/default styles only.

3. **Colors come from the caller.** The screen or dialog that uses the component calls `useThemeColors()` once and passes resolved color strings into `style` props.

4. **`StyleSheet.create` for static styles only.** Dynamic values (colors, sizes that depend on props/theme) go in the inline `style` array, not in `StyleSheet.create`.

5. **Always type style props** as `ViewStyle`, `TextStyle`, or `ImageStyle` from `react-native` — never `object` or `any`.

---

## Component prop checklist

Every new shared component must have:

- [ ] `style?: ViewStyle` — container style override
- [ ] `labelStyle?: TextStyle` — text style override (if it renders text)
- [ ] `disabled?: boolean` — with `opacity: 0.45` in disabled style
- [ ] No `useThemeColors()`, `useIsDark()`, or any context hook
- [ ] `StyleSheet.create` for base layout only (borderRadius, padding, flexDirection)
- [ ] All color props resolved by the parent and passed via `style`

---

## Reference implementation

`mobile/src/shared/components/actions/DialogButton.tsx` — canonical example of this pattern.

```tsx
const DialogButton: React.FC<DialogButtonProps> = ({
  label, onPress, style, labelStyle, disabled = false,
}) => (
  <Pressable
    onPress={onPress}
    disabled={disabled}
    style={[styles.base, style, disabled && styles.disabled]}
  >
    <Text style={[styles.label, labelStyle]}>{label}</Text>
  </Pressable>
);

const styles = StyleSheet.create({
  base:     { width: '100%', borderRadius: Radius.xl, paddingVertical: 14, alignItems: 'center', justifyContent: 'center' },
  label:    { fontSize: FontSize.lg, fontWeight: FontWeight.bold, letterSpacing: 0.3 },
  disabled: { opacity: 0.45 },
});
```
