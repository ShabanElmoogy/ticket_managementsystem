// ── Platform-specific components ─────────────────────────────────────────────
//
// Metro automatically resolves platform variants:
//   IconSymbol.ios.tsx  → used on iOS  (native SF Symbols)
//   IconSymbol.tsx      → used on Android + web (MaterialIcons fallback)
//
// Import from this barrel — never import the .ios.tsx file directly.

export { HapticTab }                    from './HapticTab';
export { IconSymbol }                   from './IconSymbol';
export type { IconSymbolName }          from './IconSymbol';
