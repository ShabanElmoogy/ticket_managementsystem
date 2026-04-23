import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import { getDayjsFormat } from '../../stores/tenantStore';

dayjs.extend(relativeTime);

/**
 * Format a date using the tenant's configured date format.
 * The store holds a date-fns token (e.g. 'dd/MM/yyyy');
 * getDayjsFormat() converts it to a dayjs token (e.g. 'DD/MM/YYYY').
 */
export const formatDate = (date: string | Date | null | undefined): string => {
  if (!date) return '—';
  const d = dayjs(date);
  return d.isValid() ? d.format(getDayjsFormat()) : '—';
};

/** Format date + time: tenant date format + HH:mm */
export const formatDateTime = (date: string | Date | null | undefined): string => {
  if (!date) return '—';
  const d = dayjs(date);
  return d.isValid() ? d.format(`${getDayjsFormat()} HH:mm`) : '—';
};

/** Relative duration: "5 minutes ago", "2 days ago", etc. */
export const formatRelativeDuration = (date: string | Date | number | null | undefined): string => {
  if (!date) return '—';
  const d = dayjs(date);
  return d.isValid() ? d.fromNow() : '—';
};

/** Format notification timestamp — compact: "5m ago", "2h ago", "3d ago" */
export const formatNotificationTime = (timestamp: string | null | undefined): string => {
  if (!timestamp) return '';
  const diffMins = Math.floor((Date.now() - new Date(timestamp).getTime()) / 60_000);
  if (diffMins < 1)    return 'Just now';
  if (diffMins < 60)   return `${diffMins}m ago`;
  if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`;
  return `${Math.floor(diffMins / 1440)}d ago`;
};
