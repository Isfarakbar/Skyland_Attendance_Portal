import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import User, { UserRole } from '@/models/User';
import { hashPassword, setSessionCookie } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const { name, email, password, role, department, designation, employeeId } = await req.json();

    if (!name || !email || !password) {
      return NextResponse.json(
        { success: false, error: 'Name, email, and password are required' },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { success: false, error: 'Password must be at least 6 characters' },
        { status: 400 }
      );
    }

    await connectToDatabase();

    const existingUser = await User.findOne({ email: email.toLowerCase().trim() });
    if (existingUser) {
      return NextResponse.json(
        { success: false, error: 'An account with this email already exists' },
        { status: 400 }
      );
    }

    // Auto-generate employeeId if not given
    let empId = employeeId?.trim().toUpperCase();
    if (!empId) {
      const count = await User.countDocuments();
      empId = `SKY-${String(count + 1).padStart(3, '0')}`;
    } else {
      const existingEmpId = await User.findOne({ employeeId: empId });
      if (existingEmpId) {
        return NextResponse.json(
          { success: false, error: 'Employee ID is already in use' },
          { status: 400 }
        );
      }
    }

    // Determine role: if it's the very first user, default to admin
    const totalUsers = await User.countDocuments();
    let assignedRole: UserRole = 'employee';
    if (totalUsers === 0) {
      assignedRole = 'admin';
    } else if (role && ['admin', 'hr', 'employee'].includes(role)) {
      assignedRole = role as UserRole;
    }

    const hashedPassword = await hashPassword(password);

    const newUser = await User.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password: hashedPassword,
      employeeId: empId,
      role: assignedRole,
      department: department?.trim() || 'General',
      designation: designation?.trim() || 'Team Member',
      joinDate: new Date(),
      isActive: true,
      leaveBalance: { sick: 8, casual: 10, annual: 14 },
    });

    const payload = {
      userId: newUser._id.toString(),
      email: newUser.email,
      name: newUser.name,
      role: newUser.role,
      employeeId: newUser.employeeId,
      department: newUser.department,
      designation: newUser.designation,
    };

    await setSessionCookie(payload);

    return NextResponse.json({
      success: true,
      user: {
        id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        employeeId: newUser.employeeId,
        department: newUser.department,
        designation: newUser.designation,
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Server error during registration';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
