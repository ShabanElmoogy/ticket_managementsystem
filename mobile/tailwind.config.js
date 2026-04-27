/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,jsx,ts,tsx}',
    './src/**/*.{js,jsx,ts,tsx}',
    './components/**/*.{js,jsx,ts,tsx}',
  ],
  presets: [require('nativewind/preset')],
  // Dark mode via class — controlled by our uiStore colorMode
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // ── Brand ──────────────────────────────────────────────────────────
        primary: {
          50:  '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          400: '#60a5fa',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
          800: '#1e40af',
        },
        // ── Semantic surfaces ───────────────────────────────────────────────
        surface: {
          DEFAULT: '#ffffff',
          secondary: '#f8fafc',
          tertiary:  '#f1f5f9',
          elevated:  '#f3f4f6',
        },
        // ── Dark surfaces ───────────────────────────────────────────────────
        'surface-dark': {
          DEFAULT:   '#1e293b',
          secondary: '#0f172a',
          tertiary:  '#273549',
          elevated:  '#334155',
        },
        // ── Status ──────────────────────────────────────────────────────────
        status: {
          open:        '#f59e0b',
          in_progress: '#7c3aed',
          resolved:    '#10b981',
          closed:      '#6b7280',
        },
        // ── Priority ────────────────────────────────────────────────────────
        priority: {
          low:    '#10b981',
          medium: '#f59e0b',
          high:   '#ef4444',
          urgent: '#dc2626',
        },
      },
      // ── Spacing scale ──────────────────────────────────────────────────────
      spacing: {
        '4.5': '18px',
        '13':  '52px',
        '15':  '60px',
        '18':  '72px',
      },
      // ── Border radius ──────────────────────────────────────────────────────
      borderRadius: {
        '2xl': '16px',
        '3xl': '20px',
      },
      // ── Font sizes ─────────────────────────────────────────────────────────
      fontSize: {
        '2xs': ['10px', { lineHeight: '14px' }],
        'xs':  ['11px', { lineHeight: '16px' }],
        'sm':  ['13px', { lineHeight: '18px' }],
        'base':['14px', { lineHeight: '20px' }],
        'md':  ['15px', { lineHeight: '22px' }],
        'lg':  ['16px', { lineHeight: '24px' }],
        'xl':  ['18px', { lineHeight: '26px' }],
        '2xl': ['20px', { lineHeight: '28px' }],
        '3xl': ['24px', { lineHeight: '32px' }],
      },
    },
  },
  plugins: [],
};
