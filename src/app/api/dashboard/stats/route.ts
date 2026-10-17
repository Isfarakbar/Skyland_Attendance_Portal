import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { connectToDatabase } from '@/lib/mongodb';
import Attendance from '@/models/Attendance';
import User from '@/models/User';
import LeaveRequest from '@/models/LeaveRequest';
import DailyTask from '@/models/DailyTask';
import CompanySettings from '@/models/CompanySettings';
import { getTodayDateString, getClockInMinutesInTimezone } from '@/lib/attendanceUtils';

export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    if (!['developer', 'admin', 'ceo', 'manager'].includes(session.role)) {
      return NextResponse.json({ success: false, error: 'Forbidden: Management access required' }, { status: 403 });
    }

    await connectToDatabase();
    const settings = await CompanySettings.findOne();
    const timezone = settings?.timezone || 'Asia/Karachi';
    const todayStr = getTodayDateString(new Date(), timezone);
    const officeStartTime = settings?.officeStartTime || '09:00';
    const gracePeriodMinutes = settings?.gracePeriodMinutes || 15;

    // Parse office start threshold in minutes from midnight
    const [startH, startM] = officeStartTime.split(':').map(Number);
    const startMinutes = (startH || 9) * 60 + (startM || 0);

    const [allEmployees, todayAttendances, pendingLeaves, approvedLeaves] = await Promise.all([
      User.find({
        isActive: true,
        role: { $nin: ['admin', 'developer', 'ceo'] },
      })
        .select('_id name email employeeId department designation avatarUrl phone')
        .sort({ name: 1 })
        .lean(),
      Attendance.find({ date: todayStr })
        .populate('user', '_id name email employeeId department designation avatarUrl phone')
        .lean(),
      LeaveRequest.countDocuments({ status: 'PENDING' }),
      LeaveRequest.find({
        status: 'APPROVED',
        startDate: { $lte: todayStr },
        endDate: { $gte: todayStr },
      })
        .populate('user', '_id name email employeeId department designation')
        .lean(),
    ]);

    const approvedLeaveUserIds = new Set(
      approvedLeaves.map((l) => (l.user as any)?._id?.toString() || (l.user as any)?.toString())
    );

    // Map attendances by userId
    const attendanceMap = new Map<string, any>();
    for (const att of todayAttendances) {
      const uId = (att.user as any)?._id?.toString() || att.user?.toString();
      if (uId) {
        attendanceMap.set(uId, att);
      }
    }

    const lateEmployees: any[] = [];
    const presentEmployees: any[] = [];
    const absentEmployees: any[] = [];

    for (const emp of allEmployees) {
      const empIdStr = emp._id.toString();
      const att = attendanceMap.get(empIdStr);
      const isOnLeave = approvedLeaveUserIds.has(empIdStr);

      if (att && att.clockIn) {
        // Calculate late minutes if applicable
        const clockInDate = new Date(att.clockIn);
        const clockInMinutes = getClockInMinutesInTimezone(clockInDate, timezone);
        const minutesLate = Math.max(0, clockInMinutes - startMinutes);

        const record = {
          user: emp,
          attendanceId: att._id,
          clockIn: att.clockIn,
          clockOut: att.clockOut,
          status: att.status,
          source: att.source || 'WEB',
          location: att.location || null,
          isFieldCheckIn: !!att.isFieldCheckIn,
          notes: att.notes || '',
          minutesLate,
        };

        presentEmployees.push(record);

        if (att.status === 'LATE' || minutesLate > gracePeriodMinutes) {
          lateEmployees.push(record);
        }
      } else if (!isOnLeave) {
        absentEmployees.push(emp);
      }
    }

    // Sort late employees by who arrived latest
    lateEmployees.sort((a, b) => (b.minutesLate || 0) - (a.minutesLate || 0));

    // Sort present employees by most recent clock-in
    presentEmployees.sort(
      (a, b) => new Date(b.clockIn).getTime() - new Date(a.clockIn).getTime()
    );

    // Fetch recent tasks submitted today
    const recentTasks = await DailyTask.find({ date: todayStr })
      .populate('user', 'name employeeId department designation avatarUrl')
      .sort({ createdAt: -1 })
      .limit(10)
      .lean();

    const totalEmployees = allEmployees.length;
    const presentToday = presentEmployees.length;
    const lateToday = lateEmployees.length;
    const onLeaveToday = approvedLeaves.length;
    const absentToday = absentEmployees.length;

    return NextResponse.json({
      success: true,
      stats: {
        totalEmployees,
        presentToday,
        lateToday,
        onLeaveToday,
        absentToday,
        pendingLeaves,
      },
      lateEmployees,
      presentEmployees,
      absentEmployees,
      approvedLeavesToday: approvedLeaves,
      recentTasks,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error fetching dashboard stats';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
