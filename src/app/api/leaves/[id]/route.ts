import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { connectToDatabase } from '@/lib/mongodb';
import LeaveRequest from '@/models/LeaveRequest';
import User from '@/models/User';

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session || !['developer', 'admin', 'ceo', 'manager'].includes(session.role)) {
      return NextResponse.json({ success: false, error: 'Unauthorized: Management only' }, { status: 403 });
    }

    const { id } = await params;
    const { status, reviewNote } = await req.json();

    if (!['APPROVED', 'REJECTED'].includes(status)) {
      return NextResponse.json({ success: false, error: 'Status must be APPROVED or REJECTED' }, { status: 400 });
    }

    await connectToDatabase();

    const leave = await LeaveRequest.findById(id);
    if (!leave) {
      return NextResponse.json({ success: false, error: 'Leave request not found' }, { status: 404 });
    }

    const previousStatus = leave.status;
    leave.status = status;
    leave.reviewNote = reviewNote || '';
    leave.reviewedBy = session.userId as unknown as import('mongoose').Types.ObjectId;

    await leave.save();

    // Deduct leave balance & sync Attendance if newly APPROVED
    if (status === 'APPROVED' && previousStatus !== 'APPROVED') {
      const user = await User.findById(leave.user);
      if (user) {
        const type = leave.leaveType.toLowerCase() as 'sick' | 'casual' | 'annual';
        if (user.leaveBalance && user.leaveBalance[type] !== undefined) {
          user.leaveBalance[type] = Math.max(0, user.leaveBalance[type] - leave.daysCount);
          await user.save();
        }
      }

      // Automatically sync to Attendance (skip non-working days on multi-day leaves & preserve real punches)
      const Attendance = (await import('@/models/Attendance')).default;
      const CompanySettings = (await import('@/models/CompanySettings')).default;
      const settings = await CompanySettings.findOne().lean();
      const workingDays = Array.isArray(settings?.workingDays) && settings.workingDays.length > 0
        ? settings.workingDays
        : [1, 2, 3, 4, 5];

      const attStatus = leave.leaveType === 'HALF_LEAVE' ? 'HALF_LEAVE' : 'ON_LEAVE';
      const isSingleDay = leave.startDate === leave.endDate;
      const curr = new Date(leave.startDate + 'T00:00:00Z');
      const end = new Date(leave.endDate + 'T00:00:00Z');

      while (curr <= end) {
        const dayOfWeek = curr.getUTCDay();
        if (isSingleDay || workingDays.includes(dayOfWeek)) {
          const dateStr = curr.toISOString().substring(0, 10);
          const existingAtt = await Attendance.findOne({ user: leave.user, date: dateStr });

          if (!existingAtt || !existingAtt.clockIn || attStatus === 'HALF_LEAVE') {
            await Attendance.findOneAndUpdate(
              { user: leave.user, date: dateStr },
              {
                $set: {
                  status: attStatus,
                  notes: `Approved Leave: ${leave.leaveType} (${leave.reason || 'Management Approved'})`,
                  ...(existingAtt?.source ? {} : { source: 'WEB' }),
                },
              },
              { upsert: true, new: true }
            );
          }
        }
        curr.setUTCDate(curr.getUTCDate() + 1);
      }
    }
    // Refund leave balance and revert Attendance if changing from APPROVED to REJECTED
    else if (previousStatus === 'APPROVED' && status === 'REJECTED') {
      const user = await User.findById(leave.user);
      if (user) {
        const type = leave.leaveType.toLowerCase() as 'sick' | 'casual' | 'annual';
        if (user.leaveBalance && user.leaveBalance[type] !== undefined) {
          user.leaveBalance[type] = user.leaveBalance[type] + leave.daysCount;
          await user.save();
        }
      }

      // Remove auto-generated leave attendance records without punches
      const Attendance = (await import('@/models/Attendance')).default;
      const curr = new Date(leave.startDate + 'T00:00:00Z');
      const end = new Date(leave.endDate + 'T00:00:00Z');
      while (curr <= end) {
        const dateStr = curr.toISOString().substring(0, 10);
        await Attendance.deleteOne({
          user: leave.user,
          date: dateStr,
          clockIn: null,
          status: { $in: ['ON_LEAVE', 'HALF_LEAVE'] },
        });
        curr.setUTCDate(curr.getUTCDate() + 1);
      }
    }

    return NextResponse.json({
      success: true,
      message: `Leave request has been ${status.toLowerCase()}`,
      leave,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error updating leave request';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    await connectToDatabase();

    const leave = await LeaveRequest.findById(id);
    if (!leave) {
      return NextResponse.json({ success: false, error: 'Leave request not found' }, { status: 404 });
    }

    const isOwner = leave.user.toString() === session.userId;
    const isManagement = ['developer', 'admin', 'ceo', 'manager'].includes(session.role);

    if (!isOwner && !isManagement) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    if (isOwner && !isManagement && leave.status !== 'PENDING') {
      return NextResponse.json(
        { success: false, error: 'Only pending leave requests can be cancelled by employee' },
        { status: 400 }
      );
    }

    // If deleting an approved leave, refund balance & clean up Attendance
    if (leave.status === 'APPROVED') {
      const user = await User.findById(leave.user);
      if (user) {
        const type = leave.leaveType.toLowerCase() as 'sick' | 'casual' | 'annual';
        if (user.leaveBalance && user.leaveBalance[type] !== undefined) {
          user.leaveBalance[type] = user.leaveBalance[type] + leave.daysCount;
          await user.save();
        }
      }

      const Attendance = (await import('@/models/Attendance')).default;
      const curr = new Date(leave.startDate + 'T00:00:00Z');
      const end = new Date(leave.endDate + 'T00:00:00Z');
      while (curr <= end) {
        const dateStr = curr.toISOString().substring(0, 10);
        await Attendance.deleteOne({
          user: leave.user,
          date: dateStr,
          clockIn: null,
          status: { $in: ['ON_LEAVE', 'HALF_LEAVE'] },
        });
        curr.setUTCDate(curr.getUTCDate() + 1);
      }
    }

    await LeaveRequest.findByIdAndDelete(id);

    return NextResponse.json({
      success: true,
      message: 'Leave request cancelled successfully',
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error cancelling leave request';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
