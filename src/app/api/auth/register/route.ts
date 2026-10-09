import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import User, { UserRole } from '@/models/User';
import { hashPassword } from '@/lib/auth';
import { sendVerificationEmail } from '@/lib/email';

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

    const normalizedEmail = email.toLowerCase().trim();
    const existingUser = await User.findOne({ email: normalizedEmail });
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

    // Determine role securely:
    const totalUsers = await User.countDocuments();
    let assignedRole: UserRole = 'employee';
    if (totalUsers === 0) {
      // First user registered in the system is designated as the developer / system admin
      assignedRole = (role && ['developer', 'admin'].includes(role)) ? (role as UserRole) : 'developer';
    } else {
      // All subsequent public self-registrations MUST strictly be 'employee'
      assignedRole = 'employee';
    }

    const hashedPassword = await hashPassword(password);

    // Generate 6-digit OTP code for verification
    const verificationOtp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    const newUser = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      password: hashedPassword,
      employeeId: empId,
      role: assignedRole,
      department: department?.trim() || 'General',
      designation: designation?.trim() || 'Team Member',
      joinDate: new Date(),
      isActive: true,
      isEmailVerified: false,
      verificationCode: verificationOtp,
      verificationCodeExpires: expiresAt,
      leaveBalance: { sick: 8, casual: 10, annual: 14 },
    });

    // Send transactional verification email via Brevo
    await sendVerificationEmail(newUser.email, newUser.name, verificationOtp);

    return NextResponse.json({
      success: true,
      requiresVerification: true,
      email: newUser.email,
      message: 'Registration successful! Verification code sent to your email.',
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Server error during registration';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
