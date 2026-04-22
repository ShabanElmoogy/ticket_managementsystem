import { Linking } from 'react-native';
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
  if (!status) return '#ef4444';
  if (status >= 500) return '#dc2626';
  if (status === 403) return '#f59e0b';
  if (status === 429) return '#8b5cf6';
  return '#ef4444';
}

export function statusIcon(status?: number): string {
  if (!status) return '📡';
  if (status >= 500) return '🔥';
  if (status === 403) return '🔒';
  if (status === 429) return '⏱️';
  if (status === 408) return '⏰';
  return '⚠️';
}

// ── Color helper ──────────────────────────────────────────────────────────────

export function darken(hex: string): string {
  const map: Record<string, string> = {
    '#ef4444': '#dc2626', '#dc2626': '#b91c1c',
    '#3b82f6': '#2563eb', '#f59e0b': '#d97706',
    '#10b981': '#059669', '#8b5cf6': '#7c3aed',
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
