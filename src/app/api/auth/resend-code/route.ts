import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import User from '@/models/User';
import { sendVerificationEmail } from '@/lib/email';

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json(
        { success: false, error: 'Email address is required' },
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
      return NextResponse.json(
        { success: false, error: 'This email is already verified. You can log in.' },
        { status: 400 }
      );
    }

    // Generate new OTP
    const verificationOtp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

    user.verificationCode = verificationOtp;
    user.verificationCodeExpires = expiresAt;
    await user.save();

    await sendVerificationEmail(user.email, user.name, verificationOtp);

    return NextResponse.json({
      success: true,
      message: 'A fresh 6-digit verification code has been sent to your email.',
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error resending verification code';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
