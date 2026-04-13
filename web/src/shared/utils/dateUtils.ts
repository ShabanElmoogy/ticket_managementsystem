import {
  format,
  differenceInMinutes, differenceInHours,
  differenceInDays, differenceInMonths, differenceInYears,
} from 'date-fns';
import { getDateFormat } from '../../stores/tenantStore';

/** Format a date using the tenant's configured date format */
export const formatDate = (date: string | Date): string =>
  format(new Date(date), getDateFormat());

/** Format date+time: tenant date format + HH:mm */
export const formatDateTime = (date: string | Date): string =>
  format(new Date(date), `${getDateFormat()} HH:mm`);

/** Relative duration: "5 minutes ago", "2 days ago", etc. */
export const formatRelativeDuration = (date: string | Date | number): string => {
  const d = date instanceof Date ? date : new Date(date);
  if (isNaN(d.getTime())) return String(date);
  const now = new Date();
  const mins = differenceInMinutes(now, d);
  if (mins < 1)  return 'just now';
  if (mins < 60) return `${mins} minute${mins !== 1 ? 's' : ''} ago`;
  const hours = differenceInHours(now, d);
  if (hours < 24) return `${hours} hour${hours !== 1 ? 's' : ''} ago`;
  const days = differenceInDays(now, d);
  if (days < 30)  return `${days} day${days !== 1 ? 's' : ''} ago`;
  const months = differenceInMonths(now, d);
  if (months < 12) return `${months} month${months !== 1 ? 's' : ''} ago`;
  const years = differenceInYears(now, d);
  return `${years} year${years !== 1 ? 's' : ''} ago`;
};
