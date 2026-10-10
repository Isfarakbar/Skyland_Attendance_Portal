import { NextRequest, NextResponse } from 'next/server';
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
        phone: user.phone || '',
        avatarUrl: user.avatarUrl || '',
        bio: user.bio || '',
        emergencyContact: user.emergencyContact || '',
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

export async function PUT(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { name, phone, avatarUrl, bio, emergencyContact } = await req.json();

    if (name !== undefined && !name.trim()) {
      return NextResponse.json({ success: false, error: 'Name cannot be empty' }, { status: 400 });
    }

    await connectToDatabase();

    const updateFields: Record<string, unknown> = {};
    if (name !== undefined) updateFields.name = name.trim();
    if (phone !== undefined) updateFields.phone = phone.trim();
    if (avatarUrl !== undefined) updateFields.avatarUrl = avatarUrl.trim();
    if (bio !== undefined) updateFields.bio = bio.trim();
    if (emergencyContact !== undefined) updateFields.emergencyContact = emergencyContact.trim();

    const updatedUser = await User.findByIdAndUpdate(
      session.userId,
      { $set: updateFields },
      { new: true }
    ).select('-password');

    if (!updatedUser) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: 'Profile updated successfully',
      user: {
        id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        role: updatedUser.role,
        employeeId: updatedUser.employeeId,
        department: updatedUser.department,
        designation: updatedUser.designation,
        phone: updatedUser.phone || '',
        avatarUrl: updatedUser.avatarUrl || '',
        bio: updatedUser.bio || '',
        emergencyContact: updatedUser.emergencyContact || '',
        baseSalary: updatedUser.baseSalary,
        workMode: updatedUser.workMode,
        leaveBalance: updatedUser.leaveBalance,
        joinDate: updatedUser.joinDate,
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error updating profile';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
