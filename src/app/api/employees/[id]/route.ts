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
    if (!session || !['developer', 'admin', 'manager'].includes(session.role)) {
      return NextResponse.json({ success: false, error: 'Unauthorized: Management only' }, { status: 403 });
    }

    const { id } = await params;
    const body = await req.json();

    await connectToDatabase();

    const allowedFields = ['name', 'role', 'department', 'designation', 'phone', 'isActive', 'leaveBalance', 'baseSalary', 'workMode'];
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

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session || !['developer', 'admin'].includes(session.role)) {
      return NextResponse.json({ success: false, error: 'Unauthorized: Super Admin/Developer only' }, { status: 403 });
    }

    const { id } = await params;
    if (id === session.userId) {
      return NextResponse.json({ success: false, error: 'Cannot delete your own master account' }, { status: 400 });
    }

    await connectToDatabase();

    const user = await User.findById(id);
    if (!user) {
      return NextResponse.json({ success: false, error: 'Employee not found' }, { status: 404 });
    }

    // Cascade delete related records
    const mongoose = (await import('mongoose')).default;
    await mongoose.connection.collection('attendances').deleteMany({ user: user._id });
    await mongoose.connection.collection('dailytasks').deleteMany({ user: user._id });
    await mongoose.connection.collection('leaverequests').deleteMany({ user: user._id });
    await User.findByIdAndDelete(id);

    return NextResponse.json({
      success: true,
      message: `Employee ${user.name} and all their records successfully deleted`,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error deleting employee';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

