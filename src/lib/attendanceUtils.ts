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

export function getClockInMinutesInTimezone(date: Date, timezone: string = DEFAULT_TIMEZONE): number {
  try {
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: timezone || DEFAULT_TIMEZONE,
      hour: 'numeric',
      minute: 'numeric',
      hourCycle: 'h23',
    });
    const parts = formatter.formatToParts(new Date(date));
    let h = 0;
    let m = 0;
    for (const part of parts) {
      if (part.type === 'hour') h = parseInt(part.value, 10);
      if (part.type === 'minute') m = parseInt(part.value, 10);
    }
    return h * 60 + m;
  } catch {
    const d = new Date(date);
    return d.getHours() * 60 + d.getMinutes();
  }
}

export function formatTimeInTimezone(
  date: Date | string | null | undefined,
  timezone: string = DEFAULT_TIMEZONE
): string {
  if (!date) return '--';
  try {
    return new Intl.DateTimeFormat('en-US', {
      timeZone: timezone || DEFAULT_TIMEZONE,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true,
    }).format(new Date(date));
  } catch {
    return format(new Date(date), 'hh:mm:ss a');
  }
}

export function isValidMonthParam(month: string | null | undefined): month is string {
  return typeof month === 'string' && /^\d{4}-(0[1-9]|1[0-2])$/.test(month.trim());
}

export function isValidDateParam(date: string | null | undefined): date is string {
  return typeof date === 'string' && /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/.test(date.trim());
}

export async function generateNextEmployeeId(): Promise<string> {
  const User = (await import('@/models/User')).default;
  const users = await User.find({}, { employeeId: 1 }).lean();
  let maxNum = 0;
  const existingSet = new Set<string>();

  for (const u of users) {
    if (u.employeeId) {
      const upper = String(u.employeeId).trim().toUpperCase();
      existingSet.add(upper);
      const match = upper.match(/^SKY-(\d+)$/);
      if (match) {
        const num = parseInt(match[1], 10);
        if (!isNaN(num) && num > maxNum) {
          maxNum = num;
        }
      }
    }
  }

  let candidateNum = maxNum + 1;
  let candidate = `SKY-${String(candidateNum).padStart(3, '0')}`;
  while (existingSet.has(candidate)) {
    candidateNum++;
    candidate = `SKY-${String(candidateNum).padStart(3, '0')}`;
  }
  return candidate;
}

