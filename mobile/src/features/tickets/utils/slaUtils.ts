/**
 * slaUtils.ts — Pure SLA computation utilities.
 *
 * No side effects, no React hooks, no API calls.
 */

// ─────────────────────────────────────────────────────────────────────────────
// Interfaces
// ─────────────────────────────────────────────────────────────────────────────

export interface SlaState {
  isOverdue: boolean;
  displayText: string; // e.g. "2h 30m left" or "1h overdue"
  colorToken: 'warning' | 'error' | 'success';
}

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Statuses that are considered "programming phase".
 * Also includes RESOLVED — once resolved, the SLA clock stops.
 */
export const PROGRAMMING_STATUSES = [
  'PROGRAMMING',
  'UNDER_DEVELOPMENT',
  'CODE_REVIEW',
  'TESTING',
  'RESOLVED',
] as const;

const TERMINAL_STATUSES = ['RESOLVED', 'CLOSED'] as const;

const TWO_HOURS_MS = 2 * 60 * 60 * 1000;

// ─────────────────────────────────────────────────────────────────────────────
// isProgrammingPhase
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Returns true if the given status is one of the programming-phase statuses:
 * PROGRAMMING, UNDER_DEVELOPMENT, CODE_REVIEW, TESTING, RESOLVED.
 */
export function isProgrammingPhase(status: string): boolean {
  return (PROGRAMMING_STATUSES as readonly string[]).includes(status);
}

// ─────────────────────────────────────────────────────────────────────────────
// computeSlaState
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Computes the SLA state for a ticket given the current time.
 *
 * Logic:
 *   - If no slaDeadline → { isOverdue: false, displayText: '', colorToken: 'success' }
 *   - isOverdue = slaDeadline < now AND status NOT in ['RESOLVED', 'CLOSED']
 *   - displayText: "Xh Ym left" or "Xh Ym overdue"
 *   - colorToken: 'error' if overdue, 'warning' if < 2 hours left, 'success' otherwise
 */
export function computeSlaState(
  ticket: { slaDeadline?: string | null; status: string },
  now: Date,
): SlaState {
  if (!ticket.slaDeadline) {
    return { isOverdue: false, displayText: '', colorToken: 'success' };
  }

  const deadline = new Date(ticket.slaDeadline);
  const isTerminal = (TERMINAL_STATUSES as readonly string[]).includes(ticket.status);
  const isOverdue = deadline < now && !isTerminal;

  const diffMs = Math.abs(deadline.getTime() - now.getTime());
  const displayText = formatDuration(diffMs, isOverdue);

  let colorToken: SlaState['colorToken'];
  if (isOverdue) {
    colorToken = 'error';
  } else if (!isTerminal && deadline.getTime() - now.getTime() < TWO_HOURS_MS) {
    colorToken = 'warning';
  } else {
    colorToken = 'success';
  }

  return { isOverdue, displayText, colorToken };
}

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function formatDuration(ms: number, isOverdue: boolean): string {
  const totalMinutes = Math.floor(ms / (1000 * 60));
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  const parts: string[] = [];
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0 || hours === 0) parts.push(`${minutes}m`);

  const timeStr = parts.join(' ');
  return isOverdue ? `${timeStr} overdue` : `${timeStr} left`;
}
