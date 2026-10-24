import { NextRequest, NextResponse } from 'next/server';
import { getSession, hashPassword } from '@/lib/auth';
import { connectToDatabase } from '@/lib/mongodb';
import User from '@/models/User';
import { generateNextEmployeeId } from '@/lib/attendanceUtils';

const SENSITIVE_FIELDS = '-password -verificationCode -verificationCodeExpires -resetPasswordCode -resetPasswordExpires';
const PUBLIC_DIRECTORY_FIELDS = '_id name email employeeId department designation role avatarUrl isActive workMode joinDate';

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

    const {
      name,
      email,
      password,
      role,
      department,
      designation,
      phone,
      employeeId,
      baseSalary,
      joinDate,
      workMode,
      weeklyOffDays,
      weeklyHalfDays,
    } = await req.json();

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

    const DAY_MAP: Record<string, number> = {
      SUN: 0, SUNDAY: 0,
      MON: 1, MONDAY: 1,
      TUE: 2, TUESDAY: 2,
      WED: 3, WEDNESDAY: 3,
      THU: 4, THURSDAY: 4,
      FRI: 5, FRIDAY: 5,
      SAT: 6, SATURDAY: 6,
    };

    const sanitizeDays = (arr: unknown, defaultVal: number[] = [0, 6]): number[] => {
      if (!Array.isArray(arr)) return defaultVal;
      const cleaned = arr
        .map((d) => {
          if (typeof d === 'number' && !isNaN(d) && d >= 0 && d <= 6) return d;
          if (typeof d === 'string') {
            const upper = d.trim().toUpperCase();
            if (DAY_MAP[upper] !== undefined) return DAY_MAP[upper];
            const parsed = parseInt(upper, 10);
            if (!isNaN(parsed) && parsed >= 0 && parsed <= 6) return parsed;
          }
          return null;
        })
        .filter((d): d is number => d !== null);
      return cleaned.length > 0 ? cleaned : defaultVal;
    };

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
      workMode: workMode || 'OFFICE',
      weeklyOffDays: sanitizeDays(weeklyOffDays, [0, 6]),
      weeklyHalfDays: sanitizeDays(weeklyHalfDays, []),
      joinDate: joinDate && !isNaN(new Date(joinDate).getTime()) ? new Date(joinDate) : new Date(),
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
