import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import User from '@/models/User';
import { setSessionCookie } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const { email, code } = await req.json();

    if (!email || !code) {
      return NextResponse.json(
        { success: false, error: 'Email and 6-digit verification code are required' },
        { status: 400 }
      );
    }

    await connectToDatabase();

    const normalizedEmail = email.toLowerCase().trim();
    const user = await User.findOne({ email: normalizedEmail });

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'No account found with this email' },
        { status: 404 }
      );
    }

    if (user.isEmailVerified) {
      // Already verified, just log in
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
        message: 'Email already verified. Logging you in...',
        user: payload,
      });
    }

    if (!user.verificationCode || user.verificationCode !== code.trim()) {
      return NextResponse.json(
        { success: false, error: 'Invalid verification code. Please check your email.' },
        { status: 400 }
      );
    }

    if (user.verificationCodeExpires && new Date() > new Date(user.verificationCodeExpires)) {
      return NextResponse.json(
        { success: false, error: 'Verification code has expired. Please request a new code.' },
        { status: 400 }
      );
    }

    // Mark as verified and clear codes
    user.isEmailVerified = true;
    user.verificationCode = undefined;
    user.verificationCodeExpires = undefined;
    await user.save();

    // Issue session cookie
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
      message: 'Email successfully verified! Welcome to Skyland.',
      user: payload,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error verifying email';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
