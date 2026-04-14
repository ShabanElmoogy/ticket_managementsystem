import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import { getDateFormat } from '../../stores/tenantStore';

dayjs.extend(relativeTime);

/** Format a date using the tenant's configured date format */
export const formatDate = (date: string | Date): string =>
  dayjs(date).format(getDateFormat());

/** Format date + time: tenant date format + HH:mm */
export const formatDateTime = (date: string | Date): string =>
  dayjs(date).format(`${getDateFormat()} HH:mm`);

/** Relative duration: "5 minutes ago", "2 days ago", etc. */
export const formatRelativeDuration = (date: string | Date | number): string => {
  const d = dayjs(date);
  if (!d.isValid()) return String(date);
  return d.fromNow();
};

/** Format notification timestamp — compact: "5m ago", "2h ago", "3d ago" */
export const formatNotificationTime = (timestamp: string): string => {
  const diffMins = Math.floor((Date.now() - new Date(timestamp).getTime()) / 60_000);
  if (diffMins < 1)    return 'Just now';
  if (diffMins < 60)   return `${diffMins}m ago`;
  if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`;
  return `${Math.floor(diffMins / 1440)}d ago`;
};
