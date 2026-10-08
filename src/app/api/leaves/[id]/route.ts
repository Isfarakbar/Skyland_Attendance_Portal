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
    if (!session || !['developer', 'admin', 'manager'].includes(session.role)) {
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

    // Deduct leave balance if newly APPROVED
    if (status === 'APPROVED' && previousStatus !== 'APPROVED') {
      const user = await User.findById(leave.user);
      if (user) {
        const type = leave.leaveType.toLowerCase() as 'sick' | 'casual' | 'annual';
        if (user.leaveBalance && user.leaveBalance[type] !== undefined) {
          user.leaveBalance[type] = Math.max(0, user.leaveBalance[type] - leave.daysCount);
          await user.save();
        }
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
