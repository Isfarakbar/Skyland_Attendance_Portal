import { NextRequest, NextResponse } from 'next/server';
import { getSession, hashPassword } from '@/lib/auth';
import { connectToDatabase } from '@/lib/mongodb';
import User from '@/models/User';

export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();

    const employees = await User.find({})
      .select('-password')
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({
      success: true,
      employees,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error fetching employees';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session || !['developer', 'admin', 'manager'].includes(session.role)) {
      return NextResponse.json({ success: false, error: 'Unauthorized: Management only' }, { status: 403 });
    }

    const { name, email, password, role, department, designation, phone, employeeId } = await req.json();

    if (!name || !email || !password) {
      return NextResponse.json({ success: false, error: 'Name, email, and temporary password are required' }, { status: 400 });
    }

    await connectToDatabase();

    const existingUser = await User.findOne({ email: email.toLowerCase().trim() });
    if (existingUser) {
      return NextResponse.json({ success: false, error: 'User with this email already exists' }, { status: 400 });
    }

    let empId = employeeId?.trim().toUpperCase();
    if (!empId) {
      const count = await User.countDocuments();
      empId = `SKY-${String(count + 1).padStart(3, '0')}`;
    }

    const hashedPassword = await hashPassword(password);

    const newEmployee = await User.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password: hashedPassword,
      employeeId: empId,
      role: role || 'employee',
      department: department?.trim() || 'General',
      designation: designation?.trim() || 'Team Member',
      phone: phone?.trim() || '',
      joinDate: new Date(),
      isActive: true,
      isEmailVerified: true,
      leaveBalance: { sick: 8, casual: 10, annual: 14 },
    });

    return NextResponse.json({
      success: true,
      message: 'Employee created successfully',
      employee: {
        id: newEmployee._id,
        name: newEmployee.name,
        email: newEmployee.email,
        employeeId: newEmployee.employeeId,
        role: newEmployee.role,
        department: newEmployee.department,
        designation: newEmployee.designation,
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error creating employee';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
