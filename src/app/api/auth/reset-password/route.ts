import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import User from '@/models/User';
import { hashPassword } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const { email, code, newPassword } = await req.json();

    if (!email || !code || !newPassword) {
      return NextResponse.json(
        { success: false, error: 'Email, security code, and new password are required' },
        { status: 400 }
      );
    }

    if (newPassword.length < 6) {
      return NextResponse.json(
        { success: false, error: 'Password must be at least 6 characters' },
        { status: 400 }
      );
    }

    await connectToDatabase();

    const normalizedEmail = email.toLowerCase().trim();
    const user = await User.findOne({ email: normalizedEmail });

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Invalid email or reset code' },
        { status: 400 }
      );
    }

    if (!user.resetPasswordCode || user.resetPasswordCode !== code.trim()) {
      return NextResponse.json(
        { success: false, error: 'Invalid security code. Please check your email.' },
        { status: 400 }
      );
    }

    if (user.resetPasswordExpires && new Date() > new Date(user.resetPasswordExpires)) {
      return NextResponse.json(
        { success: false, error: 'Reset code has expired. Please request a new code.' },
        { status: 400 }
      );
    }

    // Hash and update password
    const hashedPassword = await hashPassword(newPassword);
    user.password = hashedPassword;
    user.resetPasswordCode = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    return NextResponse.json({
      success: true,
      message: 'Your password has been reset successfully! You can now log in.',
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error resetting password';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
