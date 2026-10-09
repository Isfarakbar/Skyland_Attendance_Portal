import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { connectToDatabase } from '@/lib/mongodb';
import Attendance from '@/models/Attendance';
import User from '@/models/User';
import LeaveRequest from '@/models/LeaveRequest';
import CompanySettings from '@/models/CompanySettings';
import { getTodayDateString } from '@/lib/attendanceUtils';

export async function GET(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session || !['developer', 'admin', 'manager'].includes(session.role)) {
      return NextResponse.json({ success: false, error: 'Unauthorized: Management only' }, { status: 403 });
    }

    await connectToDatabase();
    const settings = await CompanySettings.findOne();
    const timezone = settings?.timezone || 'Asia/Karachi';

    const { searchParams } = new URL(req.url);
    const date = searchParams.get('date') || getTodayDateString(new Date(), timezone);
    const department = searchParams.get('department');

    // Get all active users
    const userQuery: Record<string, unknown> = { isActive: true };
    if (department && department !== 'All') {
      userQuery.department = department;
    }

    const allUsers = await User.find(userQuery).select('-password').lean();
    const userIds = allUsers.map((u) => u._id);

    // Get attendance records for this date
    const attendanceRecords = await Attendance.find({
      date,
      user: { $in: userIds },
    })
      .populate('user', 'name email employeeId department designation')
      .lean();

    // Check approved leaves for this date
    const approvedLeaves = await LeaveRequest.find({
      status: 'APPROVED',
      startDate: { $lte: date },
      endDate: { $gte: date },
    }).lean();

    const leaveUserMap = new Map();
    approvedLeaves.forEach((l) => leaveUserMap.set(l.user.toString(), l));

    const attendanceMap = new Map();
    attendanceRecords.forEach((att) => {
      if (att.user && typeof att.user === 'object' && '_id' in att.user) {
        attendanceMap.set(att.user._id.toString(), att);
      }
    });

    // Merge roster
    const roster = allUsers.map((u) => {
      const uId = u._id.toString();
      const att = attendanceMap.get(uId);
      const leave = leaveUserMap.get(uId);

      let status = 'ABSENT';
      if (leave) {
        status = 'ON_LEAVE';
      } else if (att) {
        status = att.status;
      }

      return {
        user: u,
        date,
        attendance: att || null,
        leave: leave || null,
        status,
        isClockedIn: !!(att && att.clockIn && !att.clockOut),
        clockIn: att?.clockIn || null,
        clockOut: att?.clockOut || null,
        totalWorkMinutes: att?.totalWorkMinutes || 0,
        totalBreakMinutes: att?.totalBreakMinutes || 0,
      };
    });

    return NextResponse.json({
      success: true,
      date,
      roster,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error fetching roster';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
