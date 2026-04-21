# Device Info Screen — i18n Implementation

## What Was Done

### 1. **Locale Files** (`mobile/src/i18n/locales/`)
Added complete translations for Device Info screen in both English and Arabic:

**Structure:**
```json
{
  "deviceInfo": {
    "title": "Device Info" / "معلومات الجهاز",
    "sections": {
      "device": "Device" / "الجهاز",
      "os": "Operating System" / "نظام التشغيل",
      "battery": "Battery" / "البطارية",
      "network": "Network" / "الشبكة",
      "storage": "Storage" / "التخزين",
      "app": "App" / "التطبيق",
      "updates": "Updates" / "التحديثات",
      "display": "Display" / "الشاشة",
      "runtime": "Runtime" / "بيئة التشغيل"
    },
    "labels": {
      // 54 field labels like "deviceName", "osVersion", etc.
    },
    "values": {
      // Dynamic values: "yes"/"no", "charging"/"full", "wifi"/"cellular", etc.
    }
  }
}
```

### 2. **i18n Setup** (`mobile/src/i18n/index.ts`)
**Best Practice Implementation:**

- **Single source of truth:** `changeLanguage()` syncs both `i18n.language` AND `uiStore.direction`
- **No app reload needed:** Uses `DirectionProvider` with CSS `direction` style instead of `I18nManager.forceRTL()` + `Updates.reloadAsync()`
- **Persists choice:** Saves to AsyncStorage, restores on app boot
- **Instant switching:** All `useTranslation()` consumers re-render immediately

**Key functions:**
```ts
initI18n()         // Called on app boot — loads saved language + syncs direction
changeLanguage()   // Switch language at runtime — no reload
getCurrentLanguage() // Get current 'en' | 'ar'
```

### 3. **Language Switcher Component** (`mobile/src/components/LanguageSwitcher.tsx`)
- Segmented control style (EN | عربي)
- Shows loading spinner during switch
- Adapts to light/dark theme
- Reusable — can be placed anywhere

### 4. **RTL-Aware Components**

**`DeviceInfoHeader.tsx`:**
- Row direction flips: `flexDirection: isRTL ? 'row-reverse' : 'row'`
- Text alignment adapts
- Language switcher in top-right (top-left in RTL)

**`SectionCard.tsx`:**
- Row direction flips for label/value pairs
- Label aligns right in RTL, value aligns left
- Boolean values translated: "✅ Yes" / "✅ نعم"

**`useDeviceInfoSections.ts` hook:**
- All section titles translated via `s(key)`
- All field labels translated via `l(key)`
- All dynamic values translated via `v(key)` (battery state, network type, device type, yes/no)

### 5. **Real-Time Listeners**
All device info updates live without refresh:

| Value | Listener | Update Trigger |
|---|---|---|
| Battery level | `addBatteryLevelListener` | Every % change |
| Battery state | `addBatteryStateListener` | Plug/unplug charger |
| Low power mode | `addLowPowerModeListener` | Toggle power saver |
| Network type/status | `addNetworkStateListener` | Wi-Fi ↔ Cellular ↔ None |
| IP address | Re-fetched on network change | Connectivity change |
| Airplane mode | Re-fetched on network change | Connectivity change |
| Screen dimensions | `Dimensions.addEventListener` | Device rotation |
| Storage | `setInterval` (30s) | Periodic re-read |

## How to Use

### Switch Language Programmatically
```ts
import { changeLanguage } from '@/src/i18n';

await changeLanguage('ar'); // Switch to Arabic — instant, no reload
await changeLanguage('en'); // Switch to English
```

### Get Current Language
```ts
import { getCurrentLanguage } from '@/src/i18n';

const lang = getCurrentLanguage(); // 'en' | 'ar'
```

### Use Translations in Any Component
```ts
import { useTranslation } from 'react-i18next';

const MyComponent = () => {
  const { t } = useTranslation();
  
  return <Text>{t('deviceInfo.title')}</Text>;
};
```

### Check RTL State
```ts
import { I18nManager } from 'react-native';
import { useDirection } from '@/src/providers/DirectionProvider';

// Option 1 — Native API
const isRTL = I18nManager.isRTL;

// Option 2 — Context (preferred)
const { isRtl, direction } = useDirection();
```

## Why This Approach?

### ❌ Old Pattern (Avoid)
```ts
// Requires full app reload — bad UX
I18nManager.forceRTL(true);
await Updates.reloadAsync();
```

### ✅ New Pattern (Best Practice)
```ts
// Instant switch — no reload
await changeLanguage('ar');
// DirectionProvider applies direction: 'rtl' to root View
// All layouts flip immediately via CSS
```

## File Structure
```
mobile/
├── src/
│   ├── i18n/
│   │   ├── index.ts              ← initI18n, changeLanguage
│   │   └── locales/
│   │       ├── en.json           ← English translations
│   │       └── ar.json           ← Arabic translations
│   ├── components/
│   │   └── LanguageSwitcher.tsx  ← Reusable switcher
│   ├── features/
│   │   └── device-info/
│   │       ├── hooks/
│   │       │   └── useDeviceInfoSections.ts  ← Translated sections
│   │       └── components/
│   │           ├── DeviceInfoHeader.tsx      ← RTL-aware header
│   │           └── SectionCard.tsx           ← RTL-aware card
│   ├── providers/
│   │   └── DirectionProvider.tsx ← Applies direction to root
│   └── stores/
│       └── uiStore.ts            ← Persists direction
└── app/
    └── _layout.tsx               ← Calls initI18n() on boot
```

## Adding New Translations

1. **Add keys to locale files:**
```json
// en.json
{
  "myFeature": {
    "title": "My Feature",
    "button": "Click Me"
  }
}

// ar.json
{
  "myFeature": {
    "title": "ميزتي",
    "button": "انقر هنا"
  }
}
```

2. **Use in component:**
```tsx
const { t } = useTranslation();
<Text>{t('myFeature.title')}</Text>
```

3. **Make RTL-aware:**
```tsx
import { I18nManager } from 'react-native';

<View style={{
  flexDirection: I18nManager.isRTL ? 'row-reverse' : 'row',
  textAlign: I18nManager.isRTL ? 'right' : 'left',
}}>
```

## Testing

1. **Open Device Info screen**
2. **Tap language switcher** (EN | عربي)
3. **Verify:**
   - All text switches instantly
   - Layout flips to RTL in Arabic
   - Labels align correctly
   - Values show translated (Yes/No, Charging, Wi-Fi, etc.)
   - No app reload needed
   - Choice persists after app restart

## Notes

- **Storage values** update every 30 seconds (no native listener exists)
- **Battery/Network** update in real-time via native listeners
- **Emojis** stay the same in both languages (universal)
- **Technical values** (IP address, version numbers) stay untranslated
- **Boolean values** translate: Yes/No → نعم/لا
