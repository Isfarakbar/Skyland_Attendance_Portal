import { NextRequest, NextResponse } from 'next/server';
import { getSession, hashPassword } from '@/lib/auth';
import { connectToDatabase } from '@/lib/mongodb';
import User from '@/models/User';
import { generateNextEmployeeId } from '@/lib/attendanceUtils';

const SENSITIVE_FIELDS = '-password -verificationCode -verificationCodeExpires -resetPasswordCode -resetPasswordExpires';
const PUBLIC_DIRECTORY_FIELDS = '_id name email employeeId department designation role avatarUrl isActive';

export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    await connectToDatabase();

    const isManagement = ['developer', 'admin', 'ceo', 'manager'].includes(session.role);
    const query: Record<string, unknown> = {};

    if (!isManagement) {
      query.role = 'employee';
      query.isActive = true;
    } else if (session.role !== 'developer') {
      query.role = { $ne: 'developer' };
    }

    const employees = await User.find(query)
      .select(isManagement ? SENSITIVE_FIELDS : PUBLIC_DIRECTORY_FIELDS)
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
    if (!session || !['developer', 'admin', 'ceo', 'manager'].includes(session.role)) {
      return NextResponse.json({ success: false, error: 'Unauthorized: Management only' }, { status: 403 });
    }

    const { name, email, password, role, department, designation, phone, employeeId, baseSalary } = await req.json();

    if (!name || !email || !password) {
      return NextResponse.json({ success: false, error: 'Name, email, and temporary password are required' }, { status: 400 });
    }

    const targetRole = role || 'employee';
    if (targetRole === 'developer' && session.role !== 'developer') {
      return NextResponse.json({ success: false, error: 'Only a Developer can assign the developer role' }, { status: 403 });
    }
    if (['admin', 'ceo'].includes(targetRole) && !['developer', 'admin', 'ceo'].includes(session.role)) {
      return NextResponse.json({ success: false, error: 'Insufficient permissions to create an Admin or CEO account' }, { status: 403 });
    }

    await connectToDatabase();

    const normalizedEmail = email.toLowerCase().trim();
    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      return NextResponse.json({ success: false, error: 'User with this email already exists' }, { status: 400 });
    }

    let empId = employeeId?.trim().toUpperCase();
    if (!empId) {
      empId = await generateNextEmployeeId();
    } else {
      const existingEmpId = await User.findOne({ employeeId: empId });
      if (existingEmpId) {
        return NextResponse.json({ success: false, error: `Employee ID ${empId} is already assigned to ${existingEmpId.name}` }, { status: 400 });
      }
    }

    const hashedPassword = await hashPassword(password);

    const newEmployee = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      password: hashedPassword,
      employeeId: empId,
      role: targetRole,
      department: department?.trim() || 'General',
      designation: designation?.trim() || 'Team Member',
      phone: phone?.trim() || '',
      baseSalary: typeof baseSalary === 'number' ? baseSalary : (Number(baseSalary) || 30000),
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
