# RTL / LTR Direction — Mobile App

How the app handles Arabic (RTL) and English (LTR) layout direction.

---

## How It Works

The app uses a **CSS `direction` inheritance model** — not `I18nManager.forceRTL()` and not app reloads.

```
DirectionProvider (root View: direction: 'rtl' | 'ltr')
  └─ All children inherit direction automatically
       └─ flexDirection: 'row' flows right-to-left in RTL
       └─ flexDirection: 'row' flows left-to-right in LTR
```

No component needs to manually flip its own `flexDirection`. It just works.

---

## Key Files

| File | Role |
|---|---|
| `src/providers/DirectionProvider.tsx` | Wraps the entire app. Applies `direction` style to root `View`. Exposes `useDirection()` hook. |
| `src/stores/uiStore.ts` | Holds `direction: 'ltr' \| 'rtl'` state + `setDirection()` action. **Not persisted** (see below). |
| `src/i18n/index.ts` | `initI18n()` and `changeLanguage()` both call `setDirection()` after setting the language. |

---

## DirectionProvider

```tsx
// src/providers/DirectionProvider.tsx
export const DirectionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const direction = useUiStore((s) => s.direction);
  const isRtl = direction === 'rtl';

  return (
    <DirectionContext.Provider value={{ isRtl, direction }}>
      <View style={{ flex: 1, direction }}>
        {children}
      </View>
    </DirectionContext.Provider>
  );
};

export const useDirection = () => useContext(DirectionContext);
```

The `direction` style on the root `View` cascades to all descendants — exactly like CSS `direction` in a browser.

---

## Language Switching

```ts
// src/i18n/index.ts
export async function changeLanguage(lng: 'en' | 'ar') {
  await i18n.changeLanguage(lng);                          // re-renders all useTranslation() consumers
  await AsyncStorage.setItem(LANG_KEY, lng);               // persists language choice
  useUiStore.getState().setDirection(lng === 'ar' ? 'rtl' : 'ltr'); // updates DirectionProvider
}
```

No app reload needed. `DirectionProvider` re-renders instantly when the store updates.

---

## Why `direction` Is NOT Persisted

`direction` is intentionally excluded from `uiStore`'s `partialize` (AsyncStorage persist).

**Reason — race condition:** On app boot, Zustand rehydrates from AsyncStorage asynchronously. If `direction` were persisted, the rehydration would overwrite the value set by `initI18n()`, causing the direction to always be stale.

**Solution:** `direction` is always derived fresh from the language at boot:

```ts
// src/i18n/index.ts — initI18n()
const saved = await AsyncStorage.getItem(LANG_KEY); // reads persisted language
useUiStore.getState().setDirection(lng === 'ar' ? 'rtl' : 'ltr'); // sets direction from language
```

The **language** is persisted (via `LANG_KEY` in AsyncStorage). The **direction** is always computed from it.

---

## Rules for Components

### ✅ Layout direction — inherit, never override

```tsx
// ✅ Correct — inherits direction from DirectionProvider
<View style={{ flexDirection: 'row' }}>
  <Text>Icon</Text>
  <Text>Label</Text>
</View>
// In LTR: Icon → Label (left to right)
// In RTL: Label ← Icon (right to left) — automatic!

// ❌ Wrong — overriding flexDirection breaks inheritance
<View style={{ flexDirection: isRtl ? 'row-reverse' : 'row' }}>
```

### ✅ Text alignment — must be explicit

`textAlign` is NOT inherited from `direction`. Set it explicitly:

```tsx
// ✅ Correct
<Text style={{ textAlign: isRtl ? 'right' : 'left' }}>Label</Text>

// ❌ Wrong — textAlign does not inherit from direction
<Text style={{ textAlign: 'left' }}>Label</Text>
```

### ✅ Writing direction for TextInput — must be explicit

```tsx
// ✅ Correct
<TextInput style={{ writingDirection: isRtl ? 'rtl' : 'ltr', textAlign: isRtl ? 'right' : 'left' }} />
```

### ✅ Physical margins/padding — use logical properties

```tsx
// ❌ Physical — does not flip in RTL
marginLeft: 8
paddingRight: 12

// ✅ Logical — flips automatically with direction
marginStart: 8
paddingEnd: 12
```

### ✅ Borders on steppers/dividers — use logical properties

```tsx
// ❌ Wrong — manual swap needed
borderRightWidth: isRtl ? 0 : 1,
borderLeftWidth:  isRtl ? 1 : 0,

// ✅ Correct — flips automatically
borderEndWidth: 1,
```

---

## How to Read `isRtl` in a Component

Always use `useDirection()` — never read from `uiStore` directly.

```tsx
import { useDirection } from '@/src/providers/DirectionProvider';

const MyComponent = () => {
  const { isRtl } = useDirection();
  // use isRtl only for text alignment and writingDirection
  // layout direction is inherited automatically
};
```

**Why not `useUiStore(s => s.direction)`?**
The store value may be stale during the boot rehydration window. `useDirection()` reads from `DirectionContext` which is set by `DirectionProvider` — the single source of truth for the current layout direction.

---

## What Needs `isRtl` vs What Doesn't

| Thing | Needs explicit `isRtl`? | Why |
|---|---|---|
| `flexDirection: 'row'` | ❌ No | Inherited from `DirectionProvider` |
| `flexDirection: 'column'` | ❌ No | Column is not affected by direction |
| `textAlign` on `Text` | ✅ Yes | Not inherited |
| `textAlign` on `TextInput` | ✅ Yes | Not inherited |
| `writingDirection` on `TextInput` | ✅ Yes | Not inherited |
| `marginLeft` / `marginRight` | ⚠️ Use `marginStart`/`marginEnd` instead | Logical properties flip automatically |
| `paddingLeft` / `paddingRight` | ⚠️ Use `paddingStart`/`paddingEnd` instead | Logical properties flip automatically |
| `borderLeftWidth` / `borderRightWidth` | ⚠️ Use `borderStartWidth`/`borderEndWidth` instead | Logical properties flip automatically |
| `position: absolute` with `left`/`right` | ✅ Yes | Absolute positioning ignores direction |
| Icon order in a row | ❌ No | Row direction handles it |
| Button order in a row | ❌ No | Row direction handles it |

---

## Reference Implementation

`AppSearchInput` is the canonical example of a correctly implemented RTL-aware component:

```tsx
// ✅ No isRtl needed — direction inherited from parent
const AppSearchInput = ({ value, onChange, isDark, placeholder }) => (
  <View style={{ flexDirection: 'row', alignItems: 'center', ... }}>
    <Text style={{ marginRight: 8 }}>🔍</Text>   {/* flips automatically */}
    <TextInput style={{ flex: 1 }} ... />
    {value.length > 0 && (
      <Pressable onPress={() => onChange('')}>
        <Text style={{ marginLeft: 6 }}>✕</Text>  {/* flips automatically */}
      </Pressable>
    )}
  </View>
);
```

In RTL, the search icon appears on the right and the clear button on the left — with zero RTL-specific code.

---

## Common Mistakes

| Mistake | Fix |
|---|---|
| `flexDirection: isRtl ? 'row-reverse' : 'row'` | Remove the conditional — use `'row'` and inherit |
| `useUiStore(s => s.direction)` for layout | Use `useDirection()` from `DirectionProvider` |
| Persisting `direction` in uiStore | Don't — it causes a boot race condition |
| `I18nManager.forceRTL()` | Don't use — requires app reload, not needed |
| `Updates.reloadAsync()` after language change | Not needed — `DirectionProvider` updates instantly |
| `marginLeft`/`marginRight` for spacing between elements | Use `marginStart`/`marginEnd` |
