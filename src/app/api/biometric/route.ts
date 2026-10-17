import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { connectToDatabase } from '@/lib/mongodb';
import User from '@/models/User';
import Attendance from '@/models/Attendance';
import CompanySettings from '@/models/CompanySettings';
import { getTodayDateString, evaluateAttendanceStatus, calculateBreakMinutes, calculateWorkMinutes } from '@/lib/attendanceUtils';
import { differenceInMinutes } from 'date-fns';

export async function GET() {
  try {
    const session = await getSession();
    if (!session || !['developer', 'admin', 'ceo', 'manager'].includes(session.role)) {
      return NextResponse.json({ success: false, error: 'Unauthorized: Management only' }, { status: 403 });
    }

    await connectToDatabase();

    const employees = await User.find({
      role: { $in: ['employee', 'manager'] },
    })
      .select('name email employeeId department designation biometricUserId workMode avatarUrl isActive phone')
      .sort({ employeeId: 1, name: 1 })
      .lean();

    const recentPunches = await Attendance.find({
      source: 'BIOMETRIC',
    })
      .populate('user', 'name employeeId department avatarUrl biometricUserId')
      .sort({ updatedAt: -1, clockIn: -1 })
      .limit(20)
      .lean();

    const settings = await CompanySettings.findOne().lean();

    const totalStaff = employees.length;
    const linkedCount = employees.filter((e) => Boolean(e.biometricUserId)).length;
    const unlinkedCount = totalStaff - linkedCount;

    return NextResponse.json({
      success: true,
      employees,
      stats: {
        totalStaff,
        linkedCount,
        unlinkedCount,
      },
      device: {
        model: 'Dahua DHI-ASA1222GL-D Attendance Device',
        ipAddress: '192.168.100.110',
        port: 37777,
        serialNumber: '9L0D364PAJ7FEC8',
        protocol: 'TCP / IP & Dahua NetSDK',
        endpoint: '/api/attendance/device-sync',
        timezone: settings?.timezone || 'Asia/Karachi',
        status: 'ONLINE',
      },
      recentPunches,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error fetching biometric data';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session || !['developer', 'admin', 'ceo'].includes(session.role)) {
      return NextResponse.json({ success: false, error: 'Unauthorized: Admin only' }, { status: 403 });
    }

    const body = await req.json();
    const { action } = body;

    await connectToDatabase();

    if (action === 'auto-assign-sequential') {
      const staff = await User.find({ role: { $in: ['employee', 'manager'] } })
        .sort({ employeeId: 1, createdAt: 1 });

      let counter = 1;
      for (const emp of staff) {
        emp.biometricUserId = String(counter);
        await emp.save();
        counter++;
      }

      return NextResponse.json({
        success: true,
        message: `Successfully auto-assigned sequential biometric IDs (1 to ${staff.length})`,
      });
    }

    if (action === 'auto-assign-code') {
      const staff = await User.find({ role: { $in: ['employee', 'manager'] } }).sort({ employeeId: 1 });
      let updatedCount = 0;

      for (const emp of staff) {
        if (!emp.biometricUserId && emp.employeeId) {
          const numMatch = emp.employeeId.match(/\d+/);
          if (numMatch) {
            const parsedNum = String(parseInt(numMatch[0], 10));
            const conflict = await User.findOne({ _id: { $ne: emp._id }, biometricUserId: parsedNum });
            if (!conflict) {
              emp.biometricUserId = parsedNum;
              await emp.save();
              updatedCount++;
            }
          }
        }
      }

      return NextResponse.json({
        success: true,
        message: `Mapped ${updatedCount} unlinked employees using employee code numeric suffix (preserving existing device links)`,
      });
    }

    if (action === 'update-single') {
      const { userId, biometricUserId } = body;
      if (!userId) {
        return NextResponse.json({ success: false, error: 'Employee ID required' }, { status: 400 });
      }

      const cleanBioId = biometricUserId ? String(biometricUserId).trim() : null;

      if (cleanBioId) {
        // Check uniqueness
        const duplicate = await User.findOne({
          _id: { $ne: userId },
          biometricUserId: cleanBioId,
        });

        if (duplicate) {
          return NextResponse.json({
            success: false,
            error: `Biometric ID #${cleanBioId} is already assigned to ${duplicate.name} (${duplicate.employeeId})`,
          }, { status: 400 });
        }
      }

      const user = await User.findByIdAndUpdate(
        userId,
        { biometricUserId: cleanBioId },
        { new: true }
      ).select('-password');

      return NextResponse.json({
        success: true,
        message: cleanBioId
          ? `Biometric ID #${cleanBioId} assigned to ${user?.name}`
          : `Biometric ID unlinked from ${user?.name}`,
        employee: user,
      });
    }

    if (action === 'clear-all') {
      await User.updateMany(
        { role: { $in: ['employee', 'manager'] } },
        { $set: { biometricUserId: null } }
      );

      return NextResponse.json({
        success: true,
        message: 'All biometric device IDs have been cleared',
      });
    }

    if (action === 'test-punch') {
      const { employeeId, biometricUserId, type = 'AUTO', timestamp } = body;

      let user = null;
      if (biometricUserId) {
        user = await User.findOne({ biometricUserId: String(biometricUserId).trim() });
      }
      if (!user && employeeId) {
        user = await User.findOne({ employeeId: String(employeeId).trim().toUpperCase() });
      }

      if (!user) {
        return NextResponse.json({
          success: false,
          error: `No employee found with Biometric ID #${biometricUserId || employeeId}`,
        }, { status: 404 });
      }

      const settings = await CompanySettings.findOne();
      const timezone = settings?.timezone || 'Asia/Karachi';
      const startTimeStr = settings?.officeStartTime || '09:00';
      const graceMinutes = settings?.gracePeriodMinutes ?? 15;
      const halfDayHours = settings?.halfDayThresholdHours || 4;

      const punchDate = timestamp ? new Date(timestamp) : new Date();
      const dateStr = getTodayDateString(punchDate, timezone);

      let attendance = await Attendance.findOne({ user: user._id, date: dateStr });

      let actionTaken = 'CLOCKED_IN';
      let statusResult = 'PRESENT';

      if (!attendance) {
        const evaluatedStatus = evaluateAttendanceStatus(punchDate, startTimeStr, graceMinutes, timezone);
        attendance = await Attendance.create({
          user: user._id,
          date: dateStr,
          clockIn: punchDate,
          clockOut: null,
          status: evaluatedStatus,
          source: 'BIOMETRIC',
          breaks: [],
          totalWorkMinutes: 0,
          totalBreakMinutes: 0,
          notes: `Punch simulated via Dahua ASA1222G Device Manager (${type})`,
        });
        statusResult = evaluatedStatus;
      } else if (!attendance.clockIn || type === 'IN') {
        const evaluatedStatus = evaluateAttendanceStatus(punchDate, startTimeStr, graceMinutes, timezone);
        attendance.clockIn = punchDate;
        attendance.status = evaluatedStatus;
        attendance.source = 'BIOMETRIC';
        await attendance.save();
        statusResult = evaluatedStatus;
      } else {
        const totalBreak = calculateBreakMinutes(attendance.breaks || []);
        const totalWork = calculateWorkMinutes(attendance.clockIn, punchDate, totalBreak);

        attendance.clockOut = punchDate;
        attendance.totalBreakMinutes = totalBreak;
        attendance.totalWorkMinutes = totalWork;

        if (totalWork < halfDayHours * 60) {
          attendance.status = 'HALF_DAY';
        } else {
          attendance.status = evaluateAttendanceStatus(attendance.clockIn, startTimeStr, graceMinutes, timezone);
        }
        await attendance.save();

        actionTaken = 'CLOCKED_OUT';
        statusResult = attendance.status;
      }

      return NextResponse.json({
        success: true,
        message: `Biometric punch processed for ${user.name}: ${actionTaken} (${statusResult})`,
        punch: {
          employeeName: user.name,
          employeeId: user.employeeId,
          biometricUserId: user.biometricUserId,
          action: actionTaken,
          status: statusResult,
          time: punchDate.toISOString(),
        },
      });
    }

    return NextResponse.json({ success: false, error: 'Invalid action provided' }, { status: 400 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error managing biometric configuration';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
