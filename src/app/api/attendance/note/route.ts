import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { connectToDatabase } from '@/lib/mongodb';
import Attendance from '@/models/Attendance';

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { userId, date, note } = await req.json();

    if (!date || typeof date !== 'string') {
      return NextResponse.json({ success: false, error: 'Date is required (YYYY-MM-DD)' }, { status: 400 });
    }

    const isManagement = ['developer', 'admin', 'ceo', 'manager'].includes(session.role);
    const targetUserId = (isManagement && userId) ? userId : session.userId;

    // Enforce 25-character max short note limit
    const trimmedNote = (typeof note === 'string' ? note.trim().slice(0, 25) : '');

    await connectToDatabase();

    const attendance = await Attendance.findOneAndUpdate(
      { user: targetUserId, date },
      {
        $set: {
          employeeNote: trimmedNote,
        },
        $setOnInsert: {
          user: targetUserId,
          date,
          status: 'OFF',
          source: 'WEB',
          totalWorkMinutes: 0,
          totalBreakMinutes: 0,
        },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    return NextResponse.json({
      success: true,
      message: 'Note saved successfully',
      attendance,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error saving calendar note';
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
    const date = searchParams.get('date');
    const targetUserId = (['developer', 'admin', 'ceo', 'manager'].includes(session.role) && searchParams.get('userId'))
      ? searchParams.get('userId')
      : session.userId;

    if (!date) {
      return NextResponse.json({ success: false, error: 'Date is required' }, { status: 400 });
    }

    await connectToDatabase();

    const attendance = await Attendance.findOneAndUpdate(
      { user: targetUserId, date },
      { $set: { employeeNote: '' } },
      { new: true }
    );

    return NextResponse.json({
      success: true,
      message: 'Note cleared',
      attendance,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error deleting note';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
