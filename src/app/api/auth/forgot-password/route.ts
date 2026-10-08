import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import User from '@/models/User';
import { sendPasswordResetEmail } from '@/lib/email';

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

    if (user && user.isActive) {
      const resetCode = Math.floor(100000 + Math.random() * 900000).toString();
      const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 mins

      user.resetPasswordCode = resetCode;
      user.resetPasswordExpires = expiresAt;
      await user.save();

      await sendPasswordResetEmail(user.email, user.name, resetCode);
    }

    // Always return success for security (prevents user enumeration)
    return NextResponse.json({
      success: true,
      message: 'If an account exists with that email, a 6-digit reset code has been sent.',
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error processing request';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
