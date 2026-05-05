# Requirements Document

## Introduction

The Onboarding Screen is a first-launch experience for the TicketFlow Pro mobile app. It guides new users through selecting their preferred language (English or Arabic), color mode (light, dark, or system), and accent palette (blue, orange, or green) before they reach the login screen. The screen is shown exactly once — on the very first app launch — and is never shown again once the user completes or skips it. Preferences selected during onboarding are applied immediately and persisted so the app opens with the correct settings on every subsequent launch.

---

## Glossary

- **Onboarding_Screen**: The multi-step welcome screen shown on first app launch, before the login screen.
- **OnboardingStore**: The Zustand-backed persistence layer (via AsyncStorage) that tracks whether onboarding has been completed.
- **UiStore**: The existing Zustand store (`uiStore.ts`) that holds `colorMode`, `paletteOption`, and `direction`.
- **DirectionProvider**: The root `View`-based provider that applies `direction: 'rtl' | 'ltr'` to the entire app tree, enabling instant RTL/LTR layout switching without an app reload.
- **Language**: The user's preferred display language — `en` (English, LTR) or `ar` (Arabic, RTL).
- **Color_Mode**: The app's brightness mode — `light`, `dark`, or `system` (follows device setting).
- **Palette**: The accent color family — `blue`, `orange`, or `green` — used throughout the app's interactive elements.
- **Step**: A single page within the multi-step onboarding flow (Welcome, Language, Appearance, Palette, Ready).
- **ThemeColors**: The reactive token object returned by `useThemeColors()`, providing all semantic color values for the current palette and mode.
- **AsyncStorage**: The React Native key-value persistence layer used to store the onboarding completion flag and language preference.

---

## Requirements

### Requirement 1: First-Launch Detection

**User Story:** As a new user, I want the onboarding screen to appear automatically on my first app launch, so that I can configure my preferences before using the app.

#### Acceptance Criteria

1. WHEN the app launches for the first time and no onboarding completion flag exists in AsyncStorage, THE Onboarding_Screen SHALL be displayed before the login screen.
2. WHEN the app launches and the onboarding completion flag is present in AsyncStorage, THE Onboarding_Screen SHALL NOT be displayed and the app SHALL navigate directly to the login screen.
3. THE OnboardingStore SHALL persist the completion flag using the key `onboarding_completed` in AsyncStorage.
4. WHEN the onboarding completion flag is being read from AsyncStorage, THE Onboarding_Screen SHALL display a loading indicator until the flag value is resolved.
5. IF AsyncStorage read fails, THEN THE Onboarding_Screen SHALL default to showing the onboarding flow rather than skipping it.

---

### Requirement 2: Multi-Step Flow Structure

**User Story:** As a new user, I want to move through onboarding one step at a time, so that each preference choice feels focused and not overwhelming.

#### Acceptance Criteria

1. THE Onboarding_Screen SHALL present preferences across exactly five sequential steps: Welcome, Language, Appearance, Palette, and Ready.
2. WHEN the user is on any step after the first, THE Onboarding_Screen SHALL display a back button that navigates to the previous step.
3. WHEN the user is on the Welcome step, THE Onboarding_Screen SHALL NOT display a back button.
4. THE Onboarding_Screen SHALL display a step progress indicator showing the current step position relative to the total number of steps.
5. WHEN the user taps the primary action button on any step except the last, THE Onboarding_Screen SHALL advance to the next step.
6. WHEN the user taps the primary action button on the Ready step, THE Onboarding_Screen SHALL write the completion flag to AsyncStorage and navigate to the login screen.
7. THE Onboarding_Screen SHALL display a skip button on all steps except the Ready step, allowing the user to bypass remaining steps and proceed directly to the login screen with default or already-selected preferences applied.
8. WHEN the user taps the skip button, THE Onboarding_Screen SHALL write the completion flag to AsyncStorage and navigate to the login screen.

---

### Requirement 3: Language Selection

**User Story:** As a new user, I want to choose my preferred language during onboarding, so that the app is immediately displayed in the language I understand.

#### Acceptance Criteria

1. THE Onboarding_Screen SHALL present two language options on the Language step: English (`en`) and Arabic (`ar`).
2. WHEN the user selects a language option, THE Onboarding_Screen SHALL call `changeLanguage()` from `@/src/i18n` immediately, causing all visible text to re-render in the selected language without an app reload.
3. WHEN the user selects Arabic, THE DirectionProvider SHALL apply `direction: 'rtl'` to the root View, causing all layout rows to flip to right-to-left instantly.
4. WHEN the user selects English, THE DirectionProvider SHALL apply `direction: 'ltr'` to the root View.
5. THE Onboarding_Screen SHALL display each language option in its own native script — English option labeled "English" and Arabic option labeled "العربية".
6. WHEN a language is selected, THE Onboarding_Screen SHALL visually highlight the selected option using `c.interactive.primary` as the active border and background tint.
7. THE Onboarding_Screen SHALL default to English as the pre-selected language when the Language step is first shown.
8. WHEN the user navigates back to the Language step after having selected a language, THE Onboarding_Screen SHALL retain the previously selected language as the active selection.

---

### Requirement 4: Color Mode Selection

**User Story:** As a new user, I want to choose between light mode, dark mode, or system-default appearance during onboarding, so that the app matches my visual preference from the start.

#### Acceptance Criteria

1. THE Onboarding_Screen SHALL present three color mode options on the Appearance step: Light, Dark, and System.
2. WHEN the user selects a color mode option, THE UiStore SHALL call `setColorMode()` immediately, causing the onboarding screen itself to re-render with the new color mode applied.
3. THE Onboarding_Screen SHALL represent the Light option with the `sunny-outline` Ionicon, the Dark option with the `moon-outline` Ionicon, and the System option with the `phone-portrait-outline` Ionicon.
4. WHEN a color mode is selected, THE Onboarding_Screen SHALL visually highlight the selected option using `c.interactive.primary` as the active border and background tint.
5. THE Onboarding_Screen SHALL default to `system` as the pre-selected color mode when the Appearance step is first shown, matching the initial value in UiStore.
6. WHEN the user navigates back to the Appearance step after having selected a color mode, THE Onboarding_Screen SHALL retain the previously selected color mode as the active selection.

---

### Requirement 5: Accent Palette Selection

**User Story:** As a new user, I want to choose my preferred accent color palette during onboarding, so that the app's interactive elements match my aesthetic preference from the start.

#### Acceptance Criteria

1. THE Onboarding_Screen SHALL present three palette options on the Palette step: Blue, Orange, and Green.
2. WHEN the user selects a palette option, THE UiStore SHALL call `setPaletteOption()` immediately, causing the onboarding screen itself to re-render with the new palette applied.
3. THE Onboarding_Screen SHALL display each palette option as a tappable card containing a color swatch circle and a label.
4. WHEN a palette is selected, THE Onboarding_Screen SHALL visually highlight the selected option using the palette's own primary color as the active border and background tint, consistent with the existing `PaletteSelector` component behavior.
5. THE Onboarding_Screen SHALL default to `blue` as the pre-selected palette when the Palette step is first shown, matching the initial value in UiStore.
6. WHEN the user navigates back to the Palette step after having selected a palette, THE Onboarding_Screen SHALL retain the previously selected palette as the active selection.
7. THE Onboarding_Screen SHALL display palette option labels using the current language (translated via `t()`).

---

### Requirement 6: Live Preview

**User Story:** As a new user, I want to see my preference choices applied to the onboarding screen in real time, so that I can make an informed decision before entering the app.

#### Acceptance Criteria

1. WHEN the user selects a color mode on the Appearance step, THE Onboarding_Screen SHALL immediately re-render all surfaces, text, and icons using the updated `ThemeColors` tokens from `useThemeColors()`.
2. WHEN the user selects a palette on the Palette step, THE Onboarding_Screen SHALL immediately re-render all accent-colored elements (buttons, active borders, tints) using the updated `ThemeColors` tokens.
3. WHEN the user selects a language on the Language step, THE Onboarding_Screen SHALL immediately re-render all visible text in the selected language.
4. THE Onboarding_Screen SHALL use only `c.*` tokens from `useThemeColors()` for all colors — no hardcoded hex values.

---

### Requirement 7: Welcome and Ready Steps

**User Story:** As a new user, I want a welcoming introduction and a clear confirmation at the end of onboarding, so that I understand what the app is and feel ready to log in.

#### Acceptance Criteria

1. THE Onboarding_Screen SHALL display the app name "TicketFlow Pro" and a brief tagline on the Welcome step.
2. THE Onboarding_Screen SHALL display the `ticket-outline` Ionicon as the app logo on the Welcome step, colored with `c.interactive.primary`.
3. THE Onboarding_Screen SHALL display a summary of the user's selected preferences (language, color mode, palette) on the Ready step.
4. THE Onboarding_Screen SHALL display a "Get Started" primary action button on the Ready step.
5. THE Onboarding_Screen SHALL display the app name and a confirmation message on the Ready step using the current language.

---

### Requirement 8: Accessibility and RTL Compliance

**User Story:** As a user who reads Arabic, I want the onboarding screen to fully support right-to-left layout, so that the interface feels natural and readable in my language.

#### Acceptance Criteria

1. THE Onboarding_Screen SHALL use `flexDirection: 'row'` without manual RTL overrides, relying on `DirectionProvider` for automatic layout flipping.
2. WHEN the selected language is Arabic, THE Onboarding_Screen SHALL set `textAlign` to `'right'` on all `Text` elements and `writingDirection` to `'rtl'` on all `TextInput` elements.
3. THE Onboarding_Screen SHALL use `marginStart` and `marginEnd` (logical properties) instead of `marginLeft` and `marginRight` for all horizontal spacing.
4. THE Onboarding_Screen SHALL use `paddingStart` and `paddingEnd` instead of `paddingLeft` and `paddingRight` for all horizontal padding.
5. THE Onboarding_Screen SHALL use `Ionicons` for all icons — no emoji characters in any UI element.
6. ALL interactive elements on the Onboarding_Screen SHALL include `accessibilityRole` and `accessibilityLabel` props.
7. THE Onboarding_Screen SHALL use `c.text.inverse` for text rendered on colored (accent) backgrounds such as the primary action button.

---

### Requirement 9: Navigation Integration

**User Story:** As a developer, I want the onboarding screen to integrate cleanly into the existing Expo Router navigation structure, so that it does not disrupt the existing auth and app routing logic.

#### Acceptance Criteria

1. THE Onboarding_Screen SHALL be registered as a route within the `(auth)` route group in Expo Router.
2. WHEN the app bootstraps and the onboarding completion flag is absent, THE RootLayout SHALL redirect to the onboarding route before rendering the login screen.
3. WHEN the onboarding flow is completed or skipped, THE Onboarding_Screen SHALL navigate to `/(auth)/login` using Expo Router's `router.replace()` to prevent back-navigation to onboarding.
4. THE Onboarding_Screen SHALL be rendered outside the `(app)` route group so it is accessible before authentication.
5. IF the user is already authenticated when the onboarding route is accessed, THEN THE Onboarding_Screen SHALL redirect to `/(app)` instead of showing the onboarding flow.

---

### Requirement 10: Persistence and State Consistency

**User Story:** As a returning user, I want my onboarding preferences to be remembered across app restarts, so that I never have to reconfigure my settings after the first launch.

#### Acceptance Criteria

1. WHEN the user completes or skips onboarding, THE UiStore SHALL persist `colorMode` and `paletteOption` to AsyncStorage via its existing `partialize` configuration.
2. WHEN the user completes or skips onboarding, THE i18n module SHALL persist the selected language to AsyncStorage via the existing `LANG_KEY` mechanism in `changeLanguage()`.
3. THE Onboarding_Screen SHALL NOT introduce a separate persistence mechanism for `colorMode` or `paletteOption` — it SHALL rely exclusively on UiStore's existing persist middleware.
4. WHEN the app restarts after onboarding is completed, THE UiStore SHALL rehydrate `colorMode` and `paletteOption` from AsyncStorage before any screen renders.
5. WHEN the app restarts after onboarding is completed, THE i18n module's `initI18n()` SHALL restore the persisted language and set the correct `direction` in UiStore before any screen renders.
