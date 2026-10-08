import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { connectToDatabase } from '@/lib/mongodb';
import Attendance from '@/models/Attendance';
import User from '@/models/User';
import LeaveRequest from '@/models/LeaveRequest';
import { getTodayDateString } from '@/lib/attendanceUtils';

export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();
    const todayStr = getTodayDateString();

    const [totalEmployees, todayAttendances, pendingLeaves, approvedLeavesToday] = await Promise.all([
      User.countDocuments({ isActive: true }),
      Attendance.find({ date: todayStr }).populate('user', 'name email employeeId department designation').lean(),
      LeaveRequest.countDocuments({ status: 'PENDING' }),
      LeaveRequest.countDocuments({
        status: 'APPROVED',
        startDate: { $lte: todayStr },
        endDate: { $gte: todayStr },
      }),
    ]);

    const presentCount = todayAttendances.filter((a) => a.clockIn).length;
    const lateCount = todayAttendances.filter((a) => a.status === 'LATE').length;
    const currentlyClockedIn = todayAttendances.filter((a) => a.clockIn && !a.clockOut).length;
    const absentCount = Math.max(0, totalEmployees - presentCount - approvedLeavesToday);

    // Recent activity logs (latest punches today)
    const recentActivity = todayAttendances
      .filter((a) => a.clockIn)
      .sort((a, b) => new Date(b.clockIn || 0).getTime() - new Date(a.clockIn || 0).getTime())
      .slice(0, 8);

    return NextResponse.json({
      success: true,
      stats: {
        totalEmployees,
        presentToday: presentCount,
        lateToday: lateCount,
        onLeaveToday: approvedLeavesToday,
        absentToday: absentCount,
        currentlyClockedIn,
        pendingLeaves,
      },
      recentActivity,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error fetching dashboard stats';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
