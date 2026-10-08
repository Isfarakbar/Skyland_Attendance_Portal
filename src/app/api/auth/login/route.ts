import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import User from '@/models/User';
import { comparePassword, setSessionCookie } from '@/lib/auth';
import { sendVerificationEmail } from '@/lib/email';

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: 'Email and password are required' },
        { status: 400 }
      );
    }

    await connectToDatabase();

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    if (!user.isActive) {
      return NextResponse.json(
        { success: false, error: 'Account is deactivated. Please contact HR.' },
        { status: 403 }
      );
    }

    const isMatch = await comparePassword(password, user.password);
    if (!isMatch) {
      return NextResponse.json(
        { success: false, error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // Check if email is verified
    if (user.isEmailVerified === false) {
      // Generate and send a fresh OTP
      const verificationOtp = Math.floor(100000 + Math.random() * 900000).toString();
      user.verificationCode = verificationOtp;
      user.verificationCodeExpires = new Date(Date.now() + 15 * 60 * 1000);
      await user.save();

      await sendVerificationEmail(user.email, user.name, verificationOtp);

      return NextResponse.json(
        {
          success: false,
          requiresVerification: true,
          email: user.email,
          error: 'Please verify your email address before logging in. We have sent a new 6-digit code to your inbox.',
        },
        { status: 403 }
      );
    }

    const payload = {
      userId: user._id.toString(),
      email: user.email,
      name: user.name,
      role: user.role,
      employeeId: user.employeeId,
      department: user.department,
      designation: user.designation,
    };

    await setSessionCookie(payload);

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
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Server error during login';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
