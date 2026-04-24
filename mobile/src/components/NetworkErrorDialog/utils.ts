import { Linking } from 'react-native';
import { Palette } from '@/src/constants/theme';
import type { ErrorState } from './types';

// ── Status helpers ────────────────────────────────────────────────────────────

export function statusLabel(status: number): string {
  if (status >= 500) return 'Server Error';
  if (status === 403) return 'Access Denied';
  if (status === 422) return 'Validation Error';
  if (status === 429) return 'Too Many Requests';
  if (status === 408) return 'Request Timeout';
  return `Error ${status}`;
}

export function statusColor(status?: number): string {
  if (!status)        return Palette.red500;
  if (status >= 500)  return Palette.red600;
  if (status === 403) return Palette.amber500;
  if (status === 429) return Palette.violet500;
  return Palette.red500;
}

export function statusIcon(status?: number): string {
  if (!status)        return '📡';
  if (status >= 500)  return '🔥';
  if (status === 403) return '🔒';
  if (status === 429) return '⏱️';
  if (status === 408) return '⏰';
  return '⚠️';
}

// ── Color helper ──────────────────────────────────────────────────────────────

export function darken(hex: string): string {
  const map: Record<string, string> = {
    [Palette.red500]:    Palette.red600,
    [Palette.red600]:    Palette.red700,
    [Palette.blue500]:   Palette.blue600,
    [Palette.amber500]:  Palette.amber600,
    [Palette.green500]:  Palette.green600,
    [Palette.violet500]: Palette.violet600,
  };
  return map[hex] ?? hex;
}

// ── Share text builder ────────────────────────────────────────────────────────

export function buildShareText(error: ErrorState): string {
  const lines: string[] = [
    `🐛 Error Report — ${error.timestamp}`,
    `─────────────────────────────`,
    `Type:    ${error.kind === 'network' ? 'Network Error' : `API Error (HTTP ${error.status})`}`,
    `Title:   ${error.title}`,
    `Message: ${error.message}`,
  ];
  if (error.details) {
    lines.push('');
    lines.push('Details:');
    lines.push(
      typeof error.details === 'string'
        ? error.details
        : JSON.stringify(error.details, null, 2),
    );
  }
  return lines.join('\n');
}

// ── WhatsApp deep-link helper ─────────────────────────────────────────────────

export async function shareToWhatsApp(phoneNumber: string, message: string): Promise<void> {
  const cleanNumber    = phoneNumber.replace(/\D/g, '');
  const encodedMessage = encodeURIComponent(message);
  const whatsappUrl    = `whatsapp://send?phone=${cleanNumber}&text=${encodedMessage}`;

  const canOpen = await Linking.canOpenURL(whatsappUrl);
  if (!canOpen) throw new Error('WhatsApp not installed');
  await Linking.openURL(whatsappUrl);
}
