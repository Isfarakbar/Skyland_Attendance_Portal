import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { connectToDatabase } from '@/lib/mongodb';
import LeaveRequest from '@/models/LeaveRequest';
import CompanySettings from '@/models/CompanySettings';
import { isValidDateParam } from '@/lib/attendanceUtils';
import { parseISO } from 'date-fns';

export async function GET(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');
    const requestedUserId = searchParams.get('userId');

    await connectToDatabase();

    const query: Record<string, unknown> = {};

    const isManagement = ['developer', 'admin', 'ceo', 'manager'].includes(session.role);
    if (!isManagement) {
      query.user = session.userId;
    } else if (requestedUserId) {
      query.user = requestedUserId;
    }

    if (status && status !== 'ALL') {
      query.status = status;
    }

    const leaves = await LeaveRequest.find(query)
      .sort({ createdAt: -1 })
      .populate('user', 'name email employeeId department designation leaveBalance')
      .populate('reviewedBy', 'name email')
      .lean();

    return NextResponse.json({
      success: true,
      leaves,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error fetching leaves';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { leaveType, startDate, endDate, reason } = await req.json();

    if (!leaveType || !startDate || !endDate || !reason) {
      return NextResponse.json({ success: false, error: 'All fields are required' }, { status: 400 });
    }

    if (!isValidDateParam(startDate) || !isValidDateParam(endDate)) {
      return NextResponse.json({ success: false, error: 'Invalid date format (expected YYYY-MM-DD)' }, { status: 400 });
    }

    const isHalfDay = (leaveType as string).toUpperCase() === 'HALF_LEAVE';
    const effectiveEndDate = isHalfDay ? startDate : endDate;

    const start = parseISO(startDate);
    const end = parseISO(effectiveEndDate);

    if (end < start) {
      return NextResponse.json({ success: false, error: 'End date cannot be before start date' }, { status: 400 });
    }

    await connectToDatabase();

    const settings = await CompanySettings.findOne().lean();
    const workingDays = Array.isArray(settings?.workingDays) && settings.workingDays.length > 0
      ? settings.workingDays
      : [1, 2, 3, 4, 5];

    let workingDayCount = 0;
    const cursor = new Date(startDate + 'T00:00:00Z');
    const endCursor = new Date(effectiveEndDate + 'T00:00:00Z');
    while (cursor <= endCursor) {
      if (workingDays.includes(cursor.getUTCDay())) {
        workingDayCount++;
      }
      cursor.setUTCDate(cursor.getUTCDate() + 1);
    }

    const daysCount = isHalfDay ? 0.5 : Math.max(1, workingDayCount);

    // Check for overlapping pending or approved leave requests
    const overlapping = await LeaveRequest.findOne({
      user: session.userId,
      status: { $in: ['PENDING', 'APPROVED'] },
      startDate: { $lte: effectiveEndDate },
      endDate: { $gte: startDate },
    });

    if (overlapping) {
      return NextResponse.json(
        {
          success: false,
          error: `You already have an active ${overlapping.status.toLowerCase()} leave request overlapping this period (${overlapping.startDate} to ${overlapping.endDate}).`,
        },
        { status: 400 }
      );
    }

    const leave = await LeaveRequest.create({
      user: session.userId,
      leaveType: (leaveType as string).toUpperCase() as import('@/models/LeaveRequest').LeaveType,
      startDate,
      endDate: effectiveEndDate,
      daysCount,
      reason: reason.trim(),
      status: 'PENDING',
    });

    return NextResponse.json({
      success: true,
      message: 'Leave request submitted successfully',
      leave,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error creating leave request';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
