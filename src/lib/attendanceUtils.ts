import { format, differenceInMinutes } from 'date-fns';
import { AttendanceStatus, IBreak } from '@/models/Attendance';

export const DEFAULT_TIMEZONE = 'Asia/Karachi';

export function parseTimeToDate(
  dateStr: string,
  timeStrOrIso?: string | null,
  timezoneOffset: string = '+05:00'
): Date | null {
  if (!timeStrOrIso || !timeStrOrIso.trim()) return null;
  const str = timeStrOrIso.trim();
  // Case 1: "HH:mm" or "HH:mm:ss"
  if (/^\d{1,2}:\d{2}(:\d{2})?$/.test(str)) {
    const parts = str.split(':');
    const h = parts[0].padStart(2, '0');
    const m = parts[1].padStart(2, '0');
    const s = (parts[2] || '00').padStart(2, '0');
    return new Date(`${dateStr}T${h}:${m}:${s}${timezoneOffset}`);
  }
  // Case 2: Full ISO string with timezone indicator (Z or + or -)
  if (str.includes('Z') || /[+-]\d{2}:\d{2}$/.test(str)) {
    return new Date(str);
  }
  // Case 3: "YYYY-MM-DDTHH:mm:ss" without offset
  if (str.includes('T')) {
    return new Date(`${str}${timezoneOffset}`);
  }
  return new Date(str);
}

export function getTodayDateString(date: Date = new Date(), timezone: string = DEFAULT_TIMEZONE): string {
  try {
    const formatter = new Intl.DateTimeFormat('en-CA', {
      timeZone: timezone || DEFAULT_TIMEZONE,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
    return formatter.format(date);
  } catch {
    return format(date, 'yyyy-MM-dd');
  }
}

export function calculateBreakMinutes(breaks: IBreak[]): number {
  return breaks.reduce((sum, b) => {
    if (b.durationMinutes && b.durationMinutes > 0) {
      return sum + b.durationMinutes;
    }
    if (b.startTime && b.endTime) {
      return sum + Math.max(0, differenceInMinutes(new Date(b.endTime), new Date(b.startTime)));
    }
    return sum;
  }, 0);
}

export function calculateWorkMinutes(
  clockIn: Date | null,
  clockOut: Date | null,
  totalBreakMinutes: number
): number {
  if (!clockIn) return 0;
  const end = clockOut ? new Date(clockOut) : new Date();
  const rawDiff = differenceInMinutes(end, new Date(clockIn));
  return Math.max(0, rawDiff - totalBreakMinutes);
}

export function evaluateAttendanceStatus(
  clockIn: Date,
  officeStartTimeStr: string = '09:00',
  gracePeriodMinutes: number = 15,
  timezone: string = DEFAULT_TIMEZONE
): AttendanceStatus {
  try {
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: timezone || DEFAULT_TIMEZONE,
      hour: 'numeric',
      minute: 'numeric',
      hourCycle: 'h23',
    });
    const parts = formatter.formatToParts(new Date(clockIn));
    let localHour = 0;
    let localMinute = 0;
    for (const part of parts) {
      if (part.type === 'hour') localHour = parseInt(part.value, 10);
      if (part.type === 'minute') localMinute = parseInt(part.value, 10);
    }

    const [targetHour, targetMinute] = officeStartTimeStr.split(':').map(Number);
    const clockInMinutes = localHour * 60 + localMinute;
    const thresholdMinutes = targetHour * 60 + targetMinute + gracePeriodMinutes;

    if (clockInMinutes > thresholdMinutes) {
      return 'LATE';
    }
    return 'PRESENT';
  } catch {
    const clockInDate = new Date(clockIn);
    const [targetHour, targetMinute] = officeStartTimeStr.split(':').map(Number);
    const thresholdDate = new Date(clockInDate);
    thresholdDate.setHours(targetHour, targetMinute + gracePeriodMinutes, 0, 0);
    return clockInDate > thresholdDate ? 'LATE' : 'PRESENT';
  }
}

export function formatMinutesToHours(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours}h ${mins}m`;
}
