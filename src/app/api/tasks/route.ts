import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { connectToDatabase } from '@/lib/mongodb';
import DailyTask from '@/models/DailyTask';
import CompanySettings from '@/models/CompanySettings';
import { getTodayDateString, DEFAULT_TIMEZONE } from '@/lib/attendanceUtils';

export async function GET(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();

    const { searchParams } = new URL(req.url);
    const requestedUserId = searchParams.get('userId');
    const date = searchParams.get('date');
    const month = searchParams.get('month'); // e.g. "2026-10"

    const isManagement = ['developer', 'admin', 'manager'].includes(session.role);

    // If regular employee, only allow self lookup
    if (!isManagement && requestedUserId && requestedUserId !== session.userId) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    const targetUserId = !isManagement ? session.userId : (requestedUserId || null);

    const query: Record<string, unknown> = {};
    if (targetUserId) {
      query.user = targetUserId;
    }
    if (date) {
      query.date = date;
    } else if (month) {
      query.date = { $regex: `^${month}` };
    }

    const tasks = await DailyTask.find(query)
      .sort({ date: -1, createdAt: -1 })
      .populate('user', 'name employeeId department designation workMode')
      .lean();

    return NextResponse.json({
      success: true,
      tasks,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error fetching daily tasks';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { title, description, status, hoursSpent, blockers, date: customDate } = await req.json();

    if (!title || !title.trim()) {
      return NextResponse.json({ success: false, error: 'Task title is required' }, { status: 400 });
    }

    await connectToDatabase();

    const settings = await CompanySettings.findOne().lean();
    const timezone = settings?.timezone || DEFAULT_TIMEZONE;
    const taskDate = customDate || getTodayDateString(new Date(), timezone);

    const task = await DailyTask.create({
      user: session.userId,
      date: taskDate,
      title: title.trim(),
      description: description?.trim() || '',
      status: status || 'COMPLETED',
      hoursSpent: typeof hoursSpent === 'number' ? hoursSpent : (Number(hoursSpent) || 0),
      blockers: blockers?.trim() || '',
    });

    return NextResponse.json({
      success: true,
      message: 'Daily task progress submitted successfully',
      task,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error submitting daily task';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ success: false, error: 'Task ID is required' }, { status: 400 });
    }

    await connectToDatabase();

    const task = await DailyTask.findById(id);
    if (!task) {
      return NextResponse.json({ success: false, error: 'Task not found' }, { status: 404 });
    }

    const isOwner = String(task.user) === session.userId;
    const isManagement = ['developer', 'admin', 'manager'].includes(session.role);

    if (!isOwner && !isManagement) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    await DailyTask.findByIdAndDelete(id);

    return NextResponse.json({
      success: true,
      message: 'Task report deleted successfully',
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error deleting task';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
