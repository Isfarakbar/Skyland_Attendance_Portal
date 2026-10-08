import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { connectToDatabase } from '@/lib/mongodb';
import LeaveRequest from '@/models/LeaveRequest';
import { differenceInBusinessDays, parseISO } from 'date-fns';

export async function GET(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');

    await connectToDatabase();

    const query: Record<string, unknown> = {};

    // Employees can only see their own leaves
    if (session.role === 'employee') {
      query.user = session.userId;
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

    const start = parseISO(startDate);
    const end = parseISO(endDate);

    if (end < start) {
      return NextResponse.json({ success: false, error: 'End date cannot be before start date' }, { status: 400 });
    }

    // Calculate days count (inclusive)
    const diff = differenceInBusinessDays(end, start) + 1;
    const daysCount = Math.max(1, diff);

    await connectToDatabase();

    const leave = await LeaveRequest.create({
      user: session.userId,
      leaveType: (leaveType as string).toUpperCase() as import('@/models/LeaveRequest').LeaveType,
      startDate,
      endDate,
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
