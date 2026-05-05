# Implementation Plan: Onboarding Screen

## Overview

Implement a first-launch onboarding experience for TicketFlow Pro that guides new users through language, color mode, and accent palette selection before reaching the login screen. The implementation integrates into the existing Expo Router `(auth)` group, reuses `uiStore`, `changeLanguage()`, and `DirectionProvider`, and introduces a minimal `OnboardingStore` for the completion flag.

## Tasks

- [x] 1. Add onboarding i18n keys to locale files
  - Add all `onboarding.*` keys to `mobile/src/i18n/locales/en.json`
  - Add all `onboarding.*` keys to `mobile/src/i18n/locales/ar.json` (Arabic translations)
  - Keys needed: `welcome.title`, `welcome.tagline`, `welcome.next`, `language.title`, `language.subtitle`, `appearance.title`, `appearance.subtitle`, `appearance.light`, `appearance.dark`, `appearance.system`, `palette.title`, `palette.subtitle`, `palette.blue`, `palette.orange`, `palette.green`, `ready.title`, `ready.subtitle`, `ready.getStarted`, `ready.language`, `ready.colorMode`, `ready.palette`, `skip`, `back`, `stepOf`
  - _Requirements: 3.5, 5.7, 7.1, 7.4, 7.5_

- [x] 2. Create OnboardingStore
  - [x] 2.1 Implement `mobile/src/features/onboarding/store/onboardingStore.ts`
    - Create Zustand store with `isCompleted: boolean | null`, `isLoading: boolean`, `checkCompleted()`, `markCompleted()` actions
    - `checkCompleted` reads `AsyncStorage.getItem('onboarding_completed')` and sets state; on failure defaults to `isCompleted: false` (Requirement 1.5)
    - `markCompleted` writes `AsyncStorage.setItem('onboarding_completed', 'true')` and sets `isCompleted: true`
    - Do NOT use `persist` middleware — reads/writes AsyncStorage manually
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_

  - [x] 2.2 Write property test for OnboardingStore completion flag round-trip
    - **Property 1: Completion flag round-trip**
    - **Validates: Requirements 1.3**
    - File: `mobile/src/features/onboarding/__tests__/onboarding.property.test.ts`
    - Tag: `// Feature: onboarding-screen, Property 1: Completion flag round-trip`
    - Mock AsyncStorage; call `markCompleted()`, then verify `AsyncStorage.getItem('onboarding_completed')` returns `'true'`

- [x] 3. Implement OnboardingHeader component
  - [x] 3.1 Create `mobile/src/features/onboarding/components/OnboardingHeader.tsx`
    - Props: `currentStep: number`, `totalSteps: number`, `onBack?: () => void`, `onSkip?: () => void`, `resolvedColors: ThemeColors`, `isRtl: boolean`
    - Render back button only when `onBack` is defined (step > 0)
    - Render skip button only when `onSkip` is defined (step < 4)
    - Render step progress indicator showing `currentStep + 1` of `totalSteps`
    - Use `marginStart`/`marginEnd` for horizontal spacing; `textAlign: isRtl ? 'right' : 'left'` on all Text
    - All interactive elements must have `accessibilityRole` and `accessibilityLabel`
    - Use `Ionicons` for back (`arrow-back-outline`) and skip icons — no emoji
    - Colors from `resolvedColors` only — no hardcoded hex
    - _Requirements: 2.2, 2.3, 2.4, 2.7, 8.1, 8.3, 8.5, 8.6_

  - [x] 3.2 Write property tests for OnboardingHeader back/skip button invariants
    - **Property 2: Back button presence invariant**
    - **Validates: Requirements 2.2, 2.3**
    - **Property 5: Skip button presence invariant**
    - **Validates: Requirements 2.7**
    - **Property 3: Step progress indicator correctness**
    - **Validates: Requirements 2.4**
    - File: `mobile/src/features/onboarding/__tests__/onboarding.property.test.ts`
    - Use `fc.integer({ min: 0, max: 4 })` to test all step indices

- [x] 4. Implement WelcomeStep component
  - Create `mobile/src/features/onboarding/components/WelcomeStep.tsx`
  - Props: `resolvedColors: ThemeColors`, `isRtl: boolean`
  - Display app name "TicketFlow Pro" and tagline from `t('onboarding.welcome.tagline')`
  - Display `ticket-outline` Ionicon colored with `resolvedColors.interactive.primary`
  - Use `textAlign: isRtl ? 'right' : 'left'` on all Text elements
  - Use `paddingStart`/`paddingEnd` for horizontal padding
  - _Requirements: 7.1, 7.2, 8.2, 8.3, 8.4_

- [x] 5. Implement LanguageStep component
  - [x] 5.1 Create `mobile/src/features/onboarding/components/LanguageStep.tsx`
    - Props: `resolvedColors: ThemeColors`, `isRtl: boolean`
    - Render two language option cards: English (`en`, label "English") and Arabic (`ar`, label "العربية")
    - On selection: call `changeLanguage(code)` from `@/src/i18n` immediately
    - Active card: border and background tint using `resolvedColors.interactive.primary`
    - Default selection: `en` (read current language via `getCurrentLanguage()` to retain selection on back-navigation)
    - Each card must have `accessibilityRole="button"` and `accessibilityLabel`
    - Use `marginStart`/`marginEnd` for spacing; `textAlign: isRtl ? 'right' : 'left'`
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8, 8.2, 8.3, 8.6_

  - [x] 5.2 Write property tests for language selection
    - **Property 6: Language selection calls changeLanguage**
    - **Validates: Requirements 3.2**
    - **Property 7: Language selection state retention**
    - **Validates: Requirements 3.8**
    - File: `mobile/src/features/onboarding/__tests__/onboarding.property.test.ts`
    - Use `fc.constantFrom('en', 'ar')` as the arbitrary

- [x] 6. Implement AppearanceStep component
  - [x] 6.1 Create `mobile/src/features/onboarding/components/AppearanceStep.tsx`
    - Props: `resolvedColors: ThemeColors`, `isRtl: boolean`
    - Render three color mode option cards: Light (`sunny-outline`), Dark (`moon-outline`), System (`phone-portrait-outline`)
    - On selection: call `useUiStore.getState().setColorMode(mode)` immediately
    - Active card: border and background tint using `resolvedColors.interactive.primary`
    - Default selection: read from `useUiStore(s => s.colorMode)` — defaults to `'system'`
    - Labels from `t('onboarding.appearance.light')`, etc.
    - Each card must have `accessibilityRole="button"` and `accessibilityLabel`
    - Use `marginStart`/`marginEnd`; `textAlign: isRtl ? 'right' : 'left'`
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 8.2, 8.3, 8.6_

  - [x] 6.2 Write property tests for color mode selection
    - **Property 8: Color mode selection calls setColorMode**
    - **Validates: Requirements 4.2**
    - **Property 9: Color mode selection state retention**
    - **Validates: Requirements 4.6**
    - File: `mobile/src/features/onboarding/__tests__/onboarding.property.test.ts`
    - Use `fc.constantFrom('light', 'dark', 'system')` as the arbitrary

- [x] 7. Implement PaletteStep component
  - [x] 7.1 Create `mobile/src/features/onboarding/components/PaletteStep.tsx`
    - Props: `resolvedColors: ThemeColors`, `isRtl: boolean`
    - Render three palette option cards: Blue, Orange, Green — each with a color swatch circle and translated label
    - On selection: call `useUiStore.getState().setPaletteOption(option)` immediately
    - Active card: border and background tint using the palette's own primary color (consistent with `PaletteSelector` behavior)
    - Default selection: read from `useUiStore(s => s.paletteOption)` — defaults to `'blue'`
    - Labels from `t('onboarding.palette.blue')`, etc.
    - Use `Palette.*` constants for swatch colors at module level — not inside render
    - Each card must have `accessibilityRole="button"` and `accessibilityLabel`
    - Use `marginStart`/`marginEnd`; `textAlign: isRtl ? 'right' : 'left'`
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7, 8.2, 8.3, 8.6_

  - [x] 7.2 Write property tests for palette selection
    - **Property 10: Palette selection calls setPaletteOption**
    - **Validates: Requirements 5.2**
    - **Property 11: Palette selection state retention**
    - **Validates: Requirements 5.6**
    - **Property 12: Palette labels are translated**
    - **Validates: Requirements 5.7**
    - File: `mobile/src/features/onboarding/__tests__/onboarding.property.test.ts`
    - Use `fc.constantFrom('blue', 'orange', 'green')` as the arbitrary

- [x] 8. Implement ReadyStep component
  - [x] 8.1 Create `mobile/src/features/onboarding/components/ReadyStep.tsx`
    - Props: `resolvedColors: ThemeColors`, `isRtl: boolean`
    - Display app name and confirmation message using `t()` (current language)
    - Display summary of selected preferences: language name, color mode label, palette label — read from `useUiStore` and `getCurrentLanguage()`
    - Display "Get Started" primary action button (this button is handled by the parent `OnboardingScreen` via the step's primary action)
    - Use `c.text.inverse` for text on the primary button background
    - Use `textAlign: isRtl ? 'right' : 'left'` on all Text elements
    - _Requirements: 7.3, 7.4, 7.5, 8.2, 8.7_

  - [x] 8.2 Write property tests for ReadyStep
    - **Property 13: Ready step displays all selected preferences**
    - **Validates: Requirements 7.3**
    - **Property 14: Ready step content is translated**
    - **Validates: Requirements 7.5**
    - File: `mobile/src/features/onboarding/__tests__/onboarding.property.test.ts`
    - Use `fc.record({ language: fc.constantFrom('en', 'ar'), colorMode: fc.constantFrom('light', 'dark', 'system'), paletteOption: fc.constantFrom('blue', 'orange', 'green') })`

- [x] 9. Implement OnboardingScreen orchestrator
  - [x] 9.1 Create `mobile/src/features/onboarding/OnboardingScreen.tsx`
    - Define `STEPS: OnboardingStep[] = ['welcome', 'language', 'appearance', 'palette', 'ready']`
    - Manage `currentStepIndex` state (0–4)
    - `handleNext`: advance step index for steps 0–3; on step 4 call `markCompleted()` then `router.replace('/(auth)/login')`
    - `handleBack`: decrement step index (only available when index > 0)
    - `handleSkip`: call `markCompleted()` then `router.replace('/(auth)/login')` (available on steps 0–3)
    - Render `OnboardingHeader` with correct `onBack`/`onSkip` callbacks (undefined on step 0 / step 4 respectively)
    - Render the active step component based on `currentStepIndex`
    - Pass `resolvedColors={c}` (from `useThemeColors()`) and `isRtl` (from `useDirection()`) to all step components and header
    - All colors from `useThemeColors()` — no hardcoded hex
    - _Requirements: 2.1, 2.2, 2.3, 2.5, 2.6, 2.7, 2.8, 6.1, 6.2, 6.3, 6.4, 9.3_

  - [x] 9.2 Write property test for step navigation
    - **Property 4: Next advances step**
    - **Validates: Requirements 2.5**
    - File: `mobile/src/features/onboarding/__tests__/onboarding.property.test.ts`
    - Use `fc.integer({ min: 0, max: 3 })` to test all non-final step indices
    - Extract navigation logic into a `useOnboardingNavigation` hook or test via `renderHook`

- [x] 10. Create Expo Router route entry point
  - Create `app/(auth)/onboarding.tsx` as a thin wrapper that renders `<OnboardingScreen />`
  - Import `OnboardingScreen` from `mobile/src/features/onboarding/OnboardingScreen`
  - No logic in this file — orchestration lives in `OnboardingScreen`
  - _Requirements: 9.1, 9.4_

- [x] 11. Checkpoint — Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 12. Integrate onboarding into auth layout routing
  - Modify `app/(auth)/_layout.tsx` to add onboarding redirect logic
  - Import `useOnboardingStore` and check `isCompleted` / `isLoading` state
  - Call `checkCompleted()` on mount (or in the bootstrap sequence) to read the AsyncStorage flag
  - If `isLoading`: render a loading indicator
  - If `isAuthenticated`: redirect to `/(app)` (existing logic — preserve it)
  - If `!isCompleted`: redirect to `/(auth)/onboarding`
  - Otherwise: render the `<Stack>` as before
  - Use `router.replace` semantics via Expo Router's `<Redirect>` component to prevent back-navigation to onboarding
  - _Requirements: 1.1, 1.2, 1.4, 9.2, 9.3, 9.5_

- [x] 13. Write unit tests for onboarding flow
  - Create `mobile/src/features/onboarding/__tests__/onboarding.test.ts`
  - Test: first launch (AsyncStorage returns null) → `isCompleted` is `false`, onboarding shown
  - Test: returning launch (AsyncStorage returns `'true'`) → `isCompleted` is `true`, login shown
  - Test: AsyncStorage read failure → `isCompleted` defaults to `false`, onboarding shown
  - Test: loading state — `isLoading` is `true` until `checkCompleted()` resolves
  - Test: exactly 5 steps in correct order (`STEPS` array)
  - Test: `handleNext` on step 4 calls `markCompleted()` and navigates to `/(auth)/login`
  - Test: `handleSkip` calls `markCompleted()` and navigates to `/(auth)/login`
  - Test: `router.replace` used (not `router.push`) to prevent back-navigation
  - _Requirements: 1.1, 1.2, 1.4, 1.5, 2.1, 2.6, 2.8, 9.3_

- [x] 14. Write property tests for accessibility and persistence
  - [x] 14.1 Write property test for text alignment following language
    - **Property 15: Text alignment follows language**
    - **Validates: Requirements 8.2**
    - File: `mobile/src/features/onboarding/__tests__/onboarding.property.test.ts`
    - Use `fc.constantFrom('en', 'ar')` — verify all Text elements have correct `textAlign`

  - [x] 14.2 Write property test for interactive element accessibility props
    - **Property 16: Interactive elements have accessibility props**
    - **Validates: Requirements 8.6**
    - Verify every `Pressable` / button has non-empty `accessibilityRole` and `accessibilityLabel`

  - [x] 14.3 Write property tests for persistence after completion
    - **Property 17: Preferences persist after onboarding completion**
    - **Validates: Requirements 10.1**
    - **Property 18: Language persists after onboarding completion**
    - **Validates: Requirements 10.2**
    - **Property 19: UiStore rehydration round-trip**
    - **Validates: Requirements 10.4**
    - **Property 20: i18n language and direction round-trip**
    - **Validates: Requirements 10.5**
    - File: `mobile/src/features/onboarding/__tests__/onboarding.property.test.ts`

- [x] 15. Final checkpoint — Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- All colors must use `c.*` tokens from `useThemeColors()` — no hardcoded hex values (Requirement 6.4)
- All horizontal spacing must use `marginStart`/`marginEnd` and `paddingStart`/`paddingEnd` logical properties (Requirements 8.3, 8.4)
- All icons must use `<Ionicons>` from `@expo/vector-icons` — no emoji (Requirement 8.5)
- `router.replace('/(auth)/login')` must be used (not `router.push`) to prevent back-navigation to onboarding (Requirement 9.3)
- Property tests use `fast-check` (already installed) with Jest; minimum 100 iterations per property
- The `OnboardingStore` does NOT use Zustand `persist` middleware — it manages AsyncStorage reads/writes manually to avoid rehydration race conditions
- `uiStore`'s existing `partialize` config handles persistence of `colorMode` and `paletteOption` — no duplication needed (Requirement 10.3)
