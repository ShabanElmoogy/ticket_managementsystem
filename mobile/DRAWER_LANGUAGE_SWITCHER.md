# Drawer Language Switcher — Implementation

## What Changed

### Before
The drawer had an **RTL button** that only toggled `uiStore.direction` without syncing `i18n.language`:
```tsx
<Pressable onPress={onToggleDir}>
  <Text>{isRtl ? '← LTR' : 'RTL →'}</Text>
</Pressable>
```

**Problem:** This caused `i18n.language` and `uiStore.direction` to drift out of sync — you could have English text with RTL layout or vice versa.

### After
The drawer now has a **Language Switcher** that syncs both `i18n` and `direction` using the same `changeLanguage()` function:
```tsx
<Pressable onPress={handleLanguageSwitch}>
  <Text>{currentLang === 'en' ? 'عربي' : 'EN'}</Text>
</Pressable>
```

**Result:** Switching language in the drawer now:
1. ✅ Changes `i18n.language` (all translations update)
2. ✅ Changes `uiStore.direction` (layout flips)
3. ✅ Persists to AsyncStorage (survives app restart)
4. ✅ No app reload needed (instant switch)

## Files Changed

### 1. `DrawerUserCard.tsx`
**Before:**
- Accepted `onToggleDir` prop
- Button showed `← LTR` / `RTL →`
- Only toggled direction, didn't touch i18n

**After:**
- Removed `onToggleDir` prop
- Uses `changeLanguage()` from `@/src/i18n`
- Button shows `عربي` (when EN) / `EN` (when AR)
- Shows loading spinner during switch
- Syncs both i18n + direction

### 2. `AppDrawerOverlay.tsx`
**Before:**
- Passed `setDirection` to `DrawerUserCard`
- Managed direction toggle logic

**After:**
- Removed `setDirection` usage
- No longer passes `onToggleDir` prop
- Direction is now managed by `changeLanguage()` internally

## How It Works

```
User taps language button in drawer
         ↓
handleLanguageSwitch() called
         ↓
changeLanguage('ar' | 'en')
         ↓
    ┌────────────────────────┐
    │ 1. i18n.changeLanguage │ → All useTranslation() re-render
    │ 2. AsyncStorage.setItem│ → Persists choice
    │ 3. uiStore.setDirection│ → DirectionProvider flips layout
    └────────────────────────┘
         ↓
Instant switch — no reload
```

## Consistency Across App

Now **both** language switchers use the same logic:

| Location | Component | Function |
|---|---|---|
| Device Info screen | `LanguageSwitcher.tsx` | `changeLanguage()` |
| Drawer | `DrawerUserCard.tsx` | `changeLanguage()` |

Both are always in sync — switching in one place updates the other.

## Testing

1. **Open drawer** (tap hamburger menu)
2. **Tap language button** (shows `عربي` or `EN`)
3. **Verify:**
   - Button shows loading spinner briefly
   - All text switches to Arabic/English
   - Layout flips to RTL/LTR
   - Drawer closes and reopens correctly from the right/left side
   - Device Info screen also reflects the change
   - Choice persists after app restart

## Visual Changes

**Before (RTL button):**
```
┌─────────────────────┐
│ ☀️ Light  │ RTL →  │
└─────────────────────┘
```

**After (Language button):**
```
┌─────────────────────┐
│ ☀️ Light  │  عربي   │  ← When English
└─────────────────────┘

┌─────────────────────┐
│ 🌙 Dark   │   EN    │  ← When Arabic
└─────────────────────┘
```

## Code Comparison

### Before
```tsx
// DrawerUserCard.tsx
interface Props {
  onToggleDir: () => void;  // ❌ Manual direction toggle
}

<Pressable onPress={onToggleDir}>
  <Text>{isRtl ? '← LTR' : 'RTL →'}</Text>
</Pressable>

// AppDrawerOverlay.tsx
const { setDirection } = useUiStore();
<DrawerUserCard
  onToggleDir={() => setDirection(isRtl ? 'ltr' : 'rtl')}
/>
```

### After
```tsx
// DrawerUserCard.tsx
import { changeLanguage, getCurrentLanguage } from '../../../i18n';

const [switching, setSwitching] = useState(false);
const currentLang = getCurrentLanguage();

const handleLanguageSwitch = async () => {
  setSwitching(true);
  await changeLanguage(currentLang === 'en' ? 'ar' : 'en');
  setSwitching(false);
};

<Pressable onPress={handleLanguageSwitch} disabled={switching}>
  {switching ? (
    <ActivityIndicator color="#fff" />
  ) : (
    <Text>{currentLang === 'en' ? 'عربي' : 'EN'}</Text>
  )}
</Pressable>

// AppDrawerOverlay.tsx
<DrawerUserCard
  // ✅ No onToggleDir prop needed
  onToggleTheme={toggleColorMode}
/>
```

## Benefits

1. **Single source of truth** — `changeLanguage()` manages both i18n and direction
2. **No drift** — language and layout always match
3. **Consistent UX** — same behavior in drawer and Device Info screen
4. **Better labels** — `عربي` / `EN` is clearer than `← LTR` / `RTL →`
5. **Loading feedback** — spinner shows during switch
6. **No reload** — instant switch via DirectionProvider
