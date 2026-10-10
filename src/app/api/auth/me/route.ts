import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { connectToDatabase } from '@/lib/mongodb';
import User from '@/models/User';

export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ success: false, user: null }, { status: 401 });
    }

    await connectToDatabase();
    const user = await User.findById(session.userId).select('-password');
    if (!user || !user.isActive) {
      return NextResponse.json({ success: false, user: null }, { status: 401 });
    }

    return NextResponse.json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        employeeId: user.employeeId,
        department: user.department,
        designation: user.designation,
        phone: user.phone,
        baseSalary: user.baseSalary || 30000,
        workMode: user.workMode || 'OFFICE',
        leaveBalance: user.leaveBalance,
        joinDate: user.joinDate,
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to fetch user session';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
