import { parseISO, format, differenceInMinutes } from 'date-fns';
import { AttendanceStatus, IBreak } from '@/models/Attendance';

export function getTodayDateString(date: Date = new Date()): string {
  return format(date, 'yyyy-MM-dd');
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
  gracePeriodMinutes: number = 15
): AttendanceStatus {
  const clockInDate = new Date(clockIn);
  const [targetHour, targetMinute] = officeStartTimeStr.split(':').map(Number);

  const thresholdDate = new Date(clockInDate);
  thresholdDate.setHours(targetHour, targetMinute + gracePeriodMinutes, 0, 0);

  if (clockInDate > thresholdDate) {
    return 'LATE';
  }
  return 'PRESENT';
}

export function formatMinutesToHours(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours}h ${mins}m`;
}
