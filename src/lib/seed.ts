import { connectToDatabase } from './mongodb';
import User from '@/models/User';
import Attendance from '@/models/Attendance';
import CompanySettings from '@/models/CompanySettings';
import LeaveRequest from '@/models/LeaveRequest';
import { hashPassword } from './auth';
import { format, subDays } from 'date-fns';

export async function seedInitialData() {
  await connectToDatabase();

  const userCount = await User.countDocuments();
  if (userCount > 0) {
    return { message: 'Database already initialized' };
  }

  // 1. Create Default Company Settings
  await CompanySettings.create({
    companyName: 'Skyland Corporation',
    officeStartTime: '09:00',
    officeEndTime: '18:00',
    gracePeriodMinutes: 15,
    halfDayThresholdHours: 4,
    fullDayThresholdHours: 8,
    workingDays: [1, 2, 3, 4, 5],
  });

  const defaultPasswordHash = await hashPassword('password123');

  // 2. Create Admin, HR and Employees
  const usersToCreate = [
    {
      name: 'Michael Scott',
      email: 'admin@skyland.com',
      password: defaultPasswordHash,
      employeeId: 'SKY-001',
      role: 'admin',
      department: 'Executive',
      designation: 'Managing Director',
      phone: '+1 (555) 019-2831',
      isEmailVerified: true,
    },
    {
      name: 'Pam Beesly',
      email: 'hr@skyland.com',
      password: defaultPasswordHash,
      employeeId: 'SKY-002',
      role: 'hr',
      department: 'Human Resources',
      designation: 'HR Lead',
      phone: '+1 (555) 019-2832',
      isEmailVerified: true,
    },
    {
      name: 'Jim Halpert',
      email: 'jim@skyland.com',
      password: defaultPasswordHash,
      employeeId: 'SKY-003',
      role: 'employee',
      department: 'Sales',
      designation: 'Senior Sales Executive',
      phone: '+1 (555) 019-2833',
      isEmailVerified: true,
    },
    {
      name: 'Dwight Schrute',
      email: 'dwight@skyland.com',
      password: defaultPasswordHash,
      employeeId: 'SKY-004',
      role: 'employee',
      department: 'Sales',
      designation: 'Assistant to the Regional Director',
      phone: '+1 (555) 019-2834',
      isEmailVerified: true,
    },
    {
      name: 'Angela Martin',
      email: 'angela@skyland.com',
      password: defaultPasswordHash,
      employeeId: 'SKY-005',
      role: 'employee',
      department: 'Finance',
      designation: 'Senior Accountant',
      phone: '+1 (555) 019-2835',
      isEmailVerified: true,
    },
    {
      name: 'Kevin Malone',
      email: 'kevin@skyland.com',
      password: defaultPasswordHash,
      employeeId: 'SKY-006',
      role: 'employee',
      department: 'Finance',
      designation: 'Accountant',
      phone: '+1 (555) 019-2836',
      isEmailVerified: true,
    },
    {
      name: 'Oscar Martinez',
      email: 'oscar@skyland.com',
      password: defaultPasswordHash,
      employeeId: 'SKY-007',
      role: 'employee',
      department: 'Finance',
      designation: 'Financial Analyst',
      phone: '+1 (555) 019-2837',
      isEmailVerified: true,
    },
    {
      name: 'Toby Flenderson',
      email: 'toby@skyland.com',
      password: defaultPasswordHash,
      employeeId: 'SKY-008',
      role: 'hr',
      department: 'Human Resources',
      designation: 'HR Representative',
      phone: '+1 (555) 019-2838',
      isEmailVerified: true,
    },
    {
      name: 'Stanley Hudson',
      email: 'stanley@skyland.com',
      password: defaultPasswordHash,
      employeeId: 'SKY-009',
      role: 'employee',
      department: 'Sales',
      designation: 'Sales Representative',
      phone: '+1 (555) 019-2839',
      isEmailVerified: true,
    },
    {
      name: 'Phyllis Vance',
      email: 'phyllis@skyland.com',
      password: defaultPasswordHash,
      employeeId: 'SKY-010',
      role: 'employee',
      department: 'Sales',
      designation: 'Sales Representative',
      phone: '+1 (555) 019-2840',
      isEmailVerified: true,
    },
  ];

  const createdUsers = await User.insertMany(usersToCreate);

  // 3. Create Sample Attendance History for the past 5 working days
  const today = new Date();
  const attendanceDocs = [];

  for (let i = 4; i >= 0; i--) {
    const day = subDays(today, i);
    const dayStr = format(day, 'yyyy-MM-dd');
    const dayOfWeek = day.getDay();
    if (dayOfWeek === 0 || dayOfWeek === 6) continue; // Skip weekends

    for (const u of createdUsers) {
      // Create realistic attendance pattern
      const isLate = Math.random() < 0.2;
      const isAbsent = Math.random() < 0.08;

      if (isAbsent) {
        continue;
      }

      const clockInTime = new Date(day);
      if (isLate) {
        clockInTime.setHours(9, 25 + Math.floor(Math.random() * 20), 0, 0);
      } else {
        clockInTime.setHours(8, 45 + Math.floor(Math.random() * 20), 0, 0);
      }

      const clockOutTime = new Date(day);
      clockOutTime.setHours(18, Math.floor(Math.random() * 30), 0, 0);

      // If it's today and past current time, don't set clockOut yet for some
      const isToday = i === 0;
      const hasClockedOut = !isToday || Math.random() < 0.3;

      attendanceDocs.push({
        user: u._id,
        date: dayStr,
        clockIn: clockInTime,
        clockOut: hasClockedOut ? clockOutTime : null,
        breaks: [
          {
            startTime: new Date(new Date(day).setHours(13, 0, 0, 0)),
            endTime: new Date(new Date(day).setHours(13, 45, 0, 0)),
            durationMinutes: 45,
            note: 'Lunch break',
          },
        ],
        status: isLate ? 'LATE' : 'PRESENT',
        totalWorkMinutes: hasClockedOut ? 510 : 280,
        totalBreakMinutes: 45,
        ipAddress: '192.168.1.10',
      });
    }
  }

  await Attendance.insertMany(attendanceDocs);

  // 4. Create a sample leave request
  const salesEmployee = createdUsers.find((u) => u.email === 'jim@skyland.com');
  if (salesEmployee) {
    await LeaveRequest.create({
      user: salesEmployee._id,
      leaveType: 'CASUAL',
      startDate: format(subDays(today, -2), 'yyyy-MM-dd'),
      endDate: format(subDays(today, -1), 'yyyy-MM-dd'),
      daysCount: 2,
      reason: 'Family event and personal travel',
      status: 'PENDING',
    });
  }

  return { message: 'Database initialized successfully with sample team and records!' };
}
