import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { getSession } from '@/lib/auth';
import { connectToDatabase } from '@/lib/mongodb';
import User from '@/models/User';

const SENSITIVE_FIELDS = '-password -verificationCode -verificationCodeExpires -resetPasswordCode -resetPasswordExpires';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session || !['developer', 'admin', 'ceo', 'manager'].includes(session.role)) {
      return NextResponse.json({ success: false, error: 'Unauthorized: Management only' }, { status: 403 });
    }

    const { id } = await params;
    await connectToDatabase();

    const employee = await User.findById(id).select(SENSITIVE_FIELDS).lean();
    if (!employee) {
      return NextResponse.json({ success: false, error: 'Employee not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      employee,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error fetching employee profile';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session || !['developer', 'admin', 'ceo', 'manager'].includes(session.role)) {
      return NextResponse.json({ success: false, error: 'Unauthorized: Management only' }, { status: 403 });
    }

    const { id } = await params;
    const body = await req.json();

    await connectToDatabase();

    const targetEmployee = await User.findById(id);
    if (!targetEmployee) {
      return NextResponse.json({ success: false, error: 'Employee not found' }, { status: 404 });
    }

    if (targetEmployee.role === 'developer' && session.role !== 'developer') {
      return NextResponse.json({ success: false, error: 'Cannot modify a Developer account' }, { status: 403 });
    }

    if (body.role !== undefined) {
      if (body.role === 'developer' && session.role !== 'developer') {
        return NextResponse.json({ success: false, error: 'Only a Developer can assign the developer role' }, { status: 403 });
      }
      if (['admin', 'ceo'].includes(body.role) && !['developer', 'admin', 'ceo'].includes(session.role)) {
        return NextResponse.json({ success: false, error: 'Insufficient permissions to assign Admin or CEO role' }, { status: 403 });
      }
    }

    if (body.email !== undefined) {
      const normalizedEmail = String(body.email).toLowerCase().trim();
      const emailConflict = await User.findOne({ email: normalizedEmail, _id: { $ne: id } });
      if (emailConflict) {
        return NextResponse.json({ success: false, error: `Email ${normalizedEmail} is already used by ${emailConflict.name}` }, { status: 400 });
      }
      body.email = normalizedEmail;
    }

    if (body.employeeId !== undefined) {
      const normalizedEmpId = String(body.employeeId).toUpperCase().trim();
      const empIdConflict = await User.findOne({ employeeId: normalizedEmpId, _id: { $ne: id } });
      if (empIdConflict) {
        return NextResponse.json({ success: false, error: `Employee ID ${normalizedEmpId} is already assigned to ${empIdConflict.name}` }, { status: 400 });
      }
      body.employeeId = normalizedEmpId;
    }

    const allowedFields = [
      'name',
      'email',
      'employeeId',
      'role',
      'department',
      'designation',
      'phone',
      'isActive',
      'leaveBalance',
      'baseSalary',
      'avatarUrl',
      'bio',
      'emergencyContact',
      'emergencyRelation',
      'address',
      'dateOfBirth',
      'gender',
      'cnic',
      'shiftTiming',
      'reportingManager',
      'employmentType',
      'bankName',
      'accountNumber',
      'iban',
      'devices',
      'pensionFund',
      'taxSettings',
    ];
    const updateData: Record<string, unknown> = {};

    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updateData[field] = body[field];
      }
    }

    if (typeof body.newPassword === 'string' && body.newPassword.trim().length > 0) {
      if (body.newPassword.trim().length < 6) {
        return NextResponse.json({ success: false, error: 'New password must be at least 6 characters' }, { status: 400 });
      }
      updateData.password = await bcrypt.hash(body.newPassword.trim(), 10);
      updateData.isEmailVerified = true;
    }

    const updatedUser = await User.findByIdAndUpdate(id, updateData, { new: true }).select(SENSITIVE_FIELDS);
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
    if (!session || !['developer', 'admin', 'ceo'].includes(session.role)) {
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

