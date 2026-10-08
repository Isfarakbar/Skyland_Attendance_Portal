import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { connectToDatabase } from '@/lib/mongodb';
import User from '@/models/User';

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session || !['admin', 'hr'].includes(session.role)) {
      return NextResponse.json({ success: false, error: 'Unauthorized: Admin or HR only' }, { status: 403 });
    }

    const { id } = await params;
    const body = await req.json();

    await connectToDatabase();

    const allowedFields = ['name', 'role', 'department', 'designation', 'phone', 'isActive', 'leaveBalance'];
    const updateData: Record<string, unknown> = {};

    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updateData[field] = body[field];
      }
    }

    const updatedUser = await User.findByIdAndUpdate(id, updateData, { new: true }).select('-password');
    if (!updatedUser) {
      return NextResponse.json({ success: false, error: 'Employee not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: 'Employee updated successfully',
      employee: updatedUser,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error updating employee';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
