import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { connectToDatabase } from '@/lib/mongodb';
import Attendance from '@/models/Attendance';

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session || !['developer', 'admin', 'ceo', 'manager'].includes(session.role)) {
      return NextResponse.json({ success: false, error: 'Unauthorized: Executive Management only' }, { status: 403 });
    }

    const { userId, date, hasConcession, reason } = await req.json();

    if (!userId || !date) {
      return NextResponse.json({ success: false, error: 'User ID and date are required' }, { status: 400 });
    }

    await connectToDatabase();

    const isGranted = Boolean(hasConcession);
    const updateSet: Record<string, unknown> = {
      hasConcession: isGranted,
      concessionReason: isGranted ? (reason ? String(reason).trim() : 'Approved by Executive Management') : '',
      concessionGrantedBy: isGranted ? session.userId : null,
      concessionGrantedAt: isGranted ? new Date() : null,
    };

    const attendance = await Attendance.findOneAndUpdate(
      { user: userId, date },
      {
        $set: updateSet,
        $setOnInsert: {
          user: userId,
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
      message: isGranted ? 'Executive concession granted successfully' : 'Concession revoked successfully',
      attendance,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error updating concession';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
