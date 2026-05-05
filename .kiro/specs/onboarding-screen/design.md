# Design Document: Onboarding Screen

## Overview

The Onboarding Screen is a first-launch experience for TicketFlow Pro that guides new users through three preference selections — language, color mode, and accent palette — before they reach the login screen. It is shown exactly once, on the very first app launch, and never again after the user completes or skips it.

The design integrates cleanly into the existing Expo Router `(auth)` group, reuses the existing `uiStore`, `changeLanguage()`, and `DirectionProvider` infrastructure, and introduces a minimal `OnboardingStore` solely for tracking the completion flag.

### Key Design Decisions

- **No new persistence for preferences**: `colorMode` and `paletteOption` are already persisted by `uiStore`'s `partialize` config. The onboarding screen simply calls `setColorMode()` and `setPaletteOption()` — no duplication.
- **Language persistence via existing mechanism**: `changeLanguage()` already writes to `AsyncStorage` under `LANG_KEY`. The onboarding screen calls it directly.
- **Completion flag only**: `OnboardingStore` stores a single boolean flag (`onboarding_completed`) in AsyncStorage. Nothing else.
- **Live preview via reactive stores**: Because `useThemeColors()` reads from `uiStore`, any call to `setColorMode()` or `setPaletteOption()` immediately re-renders the entire onboarding screen with the new theme — no extra wiring needed.
- **RTL via DirectionProvider**: Calling `changeLanguage('ar')` triggers `setDirection('rtl')` in `uiStore`, which `DirectionProvider` picks up instantly. No `I18nManager.forceRTL()` or app reload.

---

## Architecture

### Component Hierarchy

```
app/(auth)/onboarding.tsx          ← Expo Router route entry point
  └── OnboardingScreen             ← Main orchestrator (mobile/src/features/onboarding/)
        ├── OnboardingHeader       ← Back button + step progress indicator + skip button
        ├── WelcomeStep            ← Step 0: App logo, name, tagline
        ├── LanguageStep           ← Step 1: Language selection cards
        ├── AppearanceStep         ← Step 2: Color mode selection cards
        ├── PaletteStep            ← Step 3: Palette selection cards
        └── ReadyStep              ← Step 4: Summary + Get Started button
```

### Navigation Flow

```
App Bootstrap (_layout.tsx)
  ├── onboarding_completed = null → Redirect to /(auth)/onboarding
  └── onboarding_completed = true → Proceed to /(auth)/login

OnboardingScreen
  ├── Step 0 (Welcome)    → Next → Step 1
  ├── Step 1 (Language)   → Next → Step 2 | Back → Step 0 | Skip → /(auth)/login
  ├── Step 2 (Appearance) → Next → Step 3 | Back → Step 1 | Skip → /(auth)/login
  ├── Step 3 (Palette)    → Next → Step 4 | Back → Step 2 | Skip → /(auth)/login
  └── Step 4 (Ready)      → Get Started → /(auth)/login (no skip, no back shown)
```

### Data Flow

```
User selects language
  → changeLanguage('ar')
      → i18n.changeLanguage('ar')       [re-renders all useTranslation() consumers]
      → AsyncStorage.setItem(LANG_KEY)  [persists language]
      → uiStore.setDirection('rtl')     [DirectionProvider flips layout instantly]

User selects color mode
  → uiStore.setColorMode('dark')        [re-renders all useThemeColors() consumers]
      → Appearance.setColorScheme('dark')

User selects palette
  → uiStore.setPaletteOption('orange')  [re-renders all useThemeColors() consumers]

User completes/skips
  → onboardingStore.markCompleted()
      → AsyncStorage.setItem('onboarding_completed', 'true')
  → router.replace('/(auth)/login')
```

---

## Components and Interfaces

### OnboardingStore

```typescript
// mobile/src/features/onboarding/store/onboardingStore.ts

import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

const ONBOARDING_KEY = 'onboarding_completed';

interface OnboardingState {
  isCompleted: boolean | null;  // null = not yet checked
  isLoading: boolean;
  checkCompleted: () => Promise<void>;
  markCompleted: () => Promise<void>;
}

export const useOnboardingStore = create<OnboardingState>()((set) => ({
  isCompleted: null,
  isLoading: true,
  checkCompleted: async () => {
    try {
      const value = await AsyncStorage.getItem(ONBOARDING_KEY);
      set({ isCompleted: value === 'true', isLoading: false });
    } catch {
      // On failure, default to showing onboarding (Requirement 1.5)
      set({ isCompleted: false, isLoading: false });
    }
  },
  markCompleted: async () => {
    await AsyncStorage.setItem(ONBOARDING_KEY, 'true');
    set({ isCompleted: true });
  },
}));
```

### OnboardingScreen

```typescript
// mobile/src/features/onboarding/OnboardingScreen.tsx

interface OnboardingScreenProps {}

// Internal step type
type OnboardingStep = 'welcome' | 'language' | 'appearance' | 'palette' | 'ready';

const STEPS: OnboardingStep[] = ['welcome', 'language', 'appearance', 'palette', 'ready'];
const TOTAL_STEPS = STEPS.length; // 5
```

### OnboardingHeader

```typescript
// mobile/src/features/onboarding/components/OnboardingHeader.tsx

interface OnboardingHeaderProps {
  currentStep: number;       // 0-indexed
  totalSteps: number;        // 5
  onBack?: () => void;       // undefined on step 0 (no back button shown)
  onSkip?: () => void;       // undefined on step 4 (no skip button shown)
  resolvedColors: ThemeColors;
  isRtl: boolean;
}
```

### Step Components

```typescript
// All step components follow this pattern:
interface StepProps {
  resolvedColors: ThemeColors;
  isRtl: boolean;
}

// WelcomeStep — no additional props
// LanguageStep — no additional props (reads/writes via changeLanguage + getCurrentLanguage)
// AppearanceStep — no additional props (reads/writes via uiStore)
// PaletteStep — no additional props (reads/writes via uiStore)
// ReadyStep — no additional props (reads from uiStore + getCurrentLanguage)
```

### Language Option Card

```typescript
interface LanguageOption {
  code: 'en' | 'ar';
  nativeLabel: string;   // 'English' | 'العربية'
  iconName: IoniconName; // 'language-outline'
}
```

### Color Mode Option Card

```typescript
interface ColorModeOption {
  mode: ColorMode;       // 'light' | 'dark' | 'system'
  labelKey: string;      // i18n key
  iconName: IoniconName; // 'sunny-outline' | 'moon-outline' | 'phone-portrait-outline'
}
```

### Palette Option Card

```typescript
interface PaletteOptionCard {
  option: PaletteOption;  // 'blue' | 'orange' | 'green'
  labelKey: string;       // i18n key
  primaryColor: string;   // from Palette.*
  darkColor: string;      // from Palette.*
}
```

---

## Data Models

### OnboardingStore State

| Field | Type | Default | Persisted |
|---|---|---|---|
| `isCompleted` | `boolean \| null` | `null` | No (read from AsyncStorage on demand) |
| `isLoading` | `boolean` | `true` | No |

### AsyncStorage Keys

| Key | Value | Owner |
|---|---|---|
| `onboarding_completed` | `'true'` | `OnboardingStore` |
| `i18nextLng` | `'en' \| 'ar'` | `i18n.changeLanguage()` (existing) |
| `ui-storage` | JSON (colorMode, paletteOption, etc.) | `uiStore` persist middleware (existing) |

### Step Index Mapping

| Index | Step Name | Component |
|---|---|---|
| 0 | Welcome | `WelcomeStep` |
| 1 | Language | `LanguageStep` |
| 2 | Appearance | `AppearanceStep` |
| 3 | Palette | `PaletteStep` |
| 4 | Ready | `ReadyStep` |

### Navigation Integration

The `_layout.tsx` bootstrap sequence is extended to check the onboarding flag:

```typescript
// In _layout.tsx bootstrap():
const { checkCompleted, isCompleted } = useOnboardingStore.getState();
await checkCompleted();
// Expo Router's redirect logic in (auth)/_layout.tsx handles the routing
```

The `(auth)/_layout.tsx` is updated to redirect to onboarding when the flag is absent:

```typescript
// app/(auth)/_layout.tsx
const { isCompleted, isLoading } = useOnboardingStore();

if (isLoading) return <LoadingScreen />;
if (isAuthenticated) return <Redirect href="/(app)" />;
if (!isCompleted) return <Redirect href="/(auth)/onboarding" />;

return <Stack screenOptions={{ headerShown: false }} />;
```

---

## File Structure

```
mobile/
├── app/
│   └── (auth)/
│       └── onboarding.tsx              ← Expo Router route (thin wrapper)
└── src/
    └── features/
        └── onboarding/
            ├── OnboardingScreen.tsx    ← Main orchestrator
            ├── store/
            │   └── onboardingStore.ts  ← Zustand store (completion flag only)
            └── components/
                ├── OnboardingHeader.tsx
                ├── WelcomeStep.tsx
                ├── LanguageStep.tsx
                ├── AppearanceStep.tsx
                ├── PaletteStep.tsx
                └── ReadyStep.tsx
```

---

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system — essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Completion flag round-trip

*For any* call to `markCompleted()`, reading `AsyncStorage.getItem('onboarding_completed')` afterwards SHALL return `'true'`.

**Validates: Requirements 1.3**

---

### Property 2: Back button presence invariant

*For any* step index in `[1, 2, 3, 4]`, the `OnboardingHeader` SHALL render a back button. For step index `0`, no back button SHALL be rendered.

**Validates: Requirements 2.2, 2.3**

---

### Property 3: Step progress indicator correctness

*For any* step index `i` in `[0, 1, 2, 3, 4]`, the progress indicator SHALL display `i + 1` as the current step out of `5` total steps.

**Validates: Requirements 2.4**

---

### Property 4: Next advances step

*For any* step index `i` in `[0, 1, 2, 3]`, pressing the primary action button SHALL result in the current step index becoming `i + 1`.

**Validates: Requirements 2.5**

---

### Property 5: Skip button presence invariant

*For any* step index in `[0, 1, 2, 3]`, the `OnboardingHeader` SHALL render a skip button. For step index `4` (Ready), no skip button SHALL be rendered.

**Validates: Requirements 2.7**

---

### Property 6: Language selection calls changeLanguage

*For any* language code `lng` in `['en', 'ar']`, selecting that language option SHALL result in `changeLanguage(lng)` being called with exactly that code.

**Validates: Requirements 3.2**

---

### Property 7: Language selection state retention

*For any* language `lng` selected on the Language step, navigating to the next step and then back SHALL result in `lng` still being the active selection.

**Validates: Requirements 3.8**

---

### Property 8: Color mode selection calls setColorMode

*For any* color mode `mode` in `['light', 'dark', 'system']`, selecting that color mode option SHALL result in `uiStore.setColorMode(mode)` being called with exactly that mode.

**Validates: Requirements 4.2**

---

### Property 9: Color mode selection state retention

*For any* color mode `mode` selected on the Appearance step, navigating to the next step and then back SHALL result in `mode` still being the active selection.

**Validates: Requirements 4.6**

---

### Property 10: Palette selection calls setPaletteOption

*For any* palette `option` in `['blue', 'orange', 'green']`, selecting that palette option SHALL result in `uiStore.setPaletteOption(option)` being called with exactly that option.

**Validates: Requirements 5.2**

---

### Property 11: Palette selection state retention

*For any* palette `option` selected on the Palette step, navigating to the next step and then back SHALL result in `option` still being the active selection.

**Validates: Requirements 5.6**

---

### Property 12: Palette labels are translated

*For any* language `lng` in `['en', 'ar']`, after calling `changeLanguage(lng)`, the palette option labels on the Palette step SHALL match the translations for `lng`.

**Validates: Requirements 5.7**

---

### Property 13: Ready step displays all selected preferences

*For any* combination of `(language, colorMode, paletteOption)` selected during onboarding, the Ready step SHALL display a summary that includes all three selected values.

**Validates: Requirements 7.3**

---

### Property 14: Ready step content is translated

*For any* language `lng` in `['en', 'ar']`, the Ready step SHALL display its app name and confirmation message in `lng`.

**Validates: Requirements 7.5**

---

### Property 15: Text alignment follows language

*For any* language `lng` in `['en', 'ar']`, all `Text` elements on the onboarding screen SHALL have `textAlign` set to `'right'` when `lng === 'ar'` and `'left'` when `lng === 'en'`.

**Validates: Requirements 8.2**

---

### Property 16: Interactive elements have accessibility props

*For any* interactive element (Pressable, button) on the onboarding screen, both `accessibilityRole` and `accessibilityLabel` SHALL be defined and non-empty.

**Validates: Requirements 8.6**

---

### Property 17: Preferences persist after onboarding completion

*For any* combination of `(colorMode, paletteOption)` selected during onboarding, after calling `markCompleted()`, `uiStore`'s persisted state SHALL contain those exact values for `colorMode` and `paletteOption`.

**Validates: Requirements 10.1**

---

### Property 18: Language persists after onboarding completion

*For any* language `lng` selected during onboarding, after calling `markCompleted()`, `AsyncStorage.getItem('i18nextLng')` SHALL return `lng`.

**Validates: Requirements 10.2**

---

### Property 19: UiStore rehydration round-trip

*For any* `(colorMode, paletteOption)` written to `uiStore`'s persisted storage, calling `uiStore.persist.rehydrate()` SHALL restore those exact values.

**Validates: Requirements 10.4**

---

### Property 20: i18n language and direction round-trip

*For any* language `lng` in `['en', 'ar']` persisted via `changeLanguage(lng)`, calling `initI18n()` SHALL result in `i18n.language === lng` and `uiStore.getState().direction === (lng === 'ar' ? 'rtl' : 'ltr')`.

**Validates: Requirements 10.5**

---

**Property Reflection:**

After reviewing all 20 properties:

- Properties 7, 9, and 11 all test "state retention on back navigation" for different preference types. They are structurally similar but test distinct state (language vs colorMode vs palette), so they are kept separate — each validates a different store interaction.
- Properties 6, 8, and 10 all test "selection calls the correct store action" for different preference types. Same reasoning — kept separate.
- Properties 17 and 18 both test persistence after completion but for different storage mechanisms (uiStore vs AsyncStorage/i18n), so they are kept separate.
- Properties 19 and 20 both test rehydration round-trips but for different systems (uiStore vs i18n), so they are kept separate.
- No redundancy identified — each property provides unique validation value.

---

## Error Handling

### AsyncStorage Read Failure (Requirement 1.5)

If `AsyncStorage.getItem('onboarding_completed')` throws during the bootstrap check, `OnboardingStore.checkCompleted()` catches the error and sets `isCompleted: false`. This defaults to showing the onboarding flow rather than skipping it — the safe fallback.

### AsyncStorage Write Failure

If `markCompleted()` fails to write the completion flag, the error is caught and logged in development. The navigation to login still proceeds — the worst case is the user sees onboarding again on the next launch, which is acceptable.

### Language Change Failure

`changeLanguage()` is async and may fail if AsyncStorage is unavailable. The i18n language change itself (in-memory) still succeeds. The direction update still fires. Only the persistence fails silently.

### Authenticated User Accessing Onboarding

If an authenticated user somehow navigates to `/(auth)/onboarding`, the `(auth)/_layout.tsx` redirect logic checks `isAuthenticated` first and redirects to `/(app)` before the onboarding screen renders (Requirement 9.5).

---

## Testing Strategy

### Dual Testing Approach

Both unit/example tests and property-based tests are used. Unit tests cover specific examples, edge cases, and integration points. Property tests verify universal behaviors across all valid inputs.

### Property-Based Testing Library

**`fast-check`** — already installed in `mobile/node_modules/fast-check`. Use with Jest (`jest.config.js` is already configured).

Each property test runs a minimum of **100 iterations**.

Tag format: `// Feature: onboarding-screen, Property N: <property_text>`

### Unit Tests

Located in `mobile/src/features/onboarding/__tests__/`.

Key example-based tests:
- First launch: AsyncStorage returns null → onboarding shown
- Returning launch: AsyncStorage returns 'true' → login shown
- Loading state: AsyncStorage delayed → loading indicator shown
- Step structure: exactly 5 steps in correct order
- Welcome step: app name, tagline, ticket-outline icon present
- Language step: 'English' and 'العربية' labels present, English pre-selected
- Appearance step: 3 options with correct icons, 'system' pre-selected
- Palette step: 3 options with swatches, 'blue' pre-selected
- Ready step: 'Get Started' button present, no skip button
- Completion: router.replace('/(auth)/login') called after Get Started
- Skip: router.replace('/(auth)/login') called after skip
- Authenticated redirect: isAuthenticated → redirect to /(app)

### Property Tests

Located in `mobile/src/features/onboarding/__tests__/onboarding.property.test.ts`.

Each property test implements one of the 20 correctness properties defined above. Example:

```typescript
// Feature: onboarding-screen, Property 4: Next advances step
it('pressing next on any non-final step advances to the next step', () => {
  fc.assert(
    fc.property(
      fc.integer({ min: 0, max: 3 }),
      (stepIndex) => {
        const { result } = renderHook(() => useOnboardingNavigation());
        act(() => result.current.setStep(stepIndex));
        act(() => result.current.handleNext());
        expect(result.current.currentStep).toBe(stepIndex + 1);
      }
    ),
    { numRuns: 100 }
  );
});
```

### Integration Tests

- Full onboarding flow: start → select all preferences → complete → verify AsyncStorage state
- RTL layout: select Arabic → verify DirectionProvider applies 'rtl'
- Theme live preview: select dark mode → verify ThemeColors tokens update

### Accessibility Tests

- All interactive elements have `accessibilityRole` and `accessibilityLabel`
- Screen reader traversal order is logical in both LTR and RTL
