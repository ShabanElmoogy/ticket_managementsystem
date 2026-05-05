import type { CalloutType } from '../../types/types';
import { useThemeColors } from '@/src/constants/theme';

export const CALLOUT_CFG: Record<CalloutType, { emoji: string; color: string; bg: string; darkBg: string }> = {
  info:    { emoji: 'ℹ️', color: '#3b82f6', bg: '#eff6ff', darkBg: 'rgba(59,130,246,0.1)' },
  warning: { emoji: '⚠️', color: '#f59e0b', bg: '#fffbeb', darkBg: 'rgba(245,158,11,0.1)' },
  success: { emoji: '✅', color: '#10b981', bg: '#f0fdf4', darkBg: 'rgba(16,185,129,0.1)' },
  error:   { emoji: '❌', color: '#ef4444', bg: '#fef2f2', darkBg: 'rgba(239,68,68,0.1)' },
};

export function stripHtml(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .trim();
}

export interface PreviewColors {
  textColor: string;
  mutedColor: string;
  borderColor: string;
}

/** Hook — returns PreviewColors derived from the active theme palette. */
export function usePreviewColors(): PreviewColors {
  const c = useThemeColors();
  return {
    textColor:   c.text.primary,
    mutedColor:  c.text.muted,
    borderColor: c.border.primary,
  };
}

/** @deprecated Use usePreviewColors() hook instead. Kept for backward compat. */
export function getPreviewColors(isDark: boolean): PreviewColors {
  return {
    textColor:   isDark ? '#e2e8f0' : '#1e293b',
    mutedColor:  isDark ? '#94a3b8' : '#64748b',
    borderColor: isDark ? '#334155' : '#e2e8f0',
  };
}
