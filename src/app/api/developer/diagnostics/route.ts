import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { connectToDatabase } from '@/lib/mongodb';
import mongoose from 'mongoose';
import User from '@/models/User';
import Attendance from '@/models/Attendance';
import LeaveRequest from '@/models/LeaveRequest';
import CompanySettings from '@/models/CompanySettings';

export async function GET() {
  try {
    const session = await getSession();
    if (!session || session.role !== 'developer') {
      return NextResponse.json(
        { success: false, error: 'Access Denied: Developer role required.' },
        { status: 403 }
      );
    }

    const startTime = Date.now();
    await connectToDatabase();
    const ping = Date.now() - startTime;

    const [usersCount, attendanceCount, leavesCount, settingsDoc] = await Promise.all([
      User.countDocuments(),
      Attendance.countDocuments(),
      LeaveRequest.countDocuments(),
      CompanySettings.findOne(),
    ]);

    const memoryUsage = process.memoryUsage();

    return NextResponse.json({
      success: true,
      diagnostics: {
        database: {
          status: 'CONNECTED',
          name: mongoose.connection.name || 'skyland_attendance',
          host: mongoose.connection.host || 'MongoDB Atlas Cluster',
          pingMs: ping,
          collections: {
            users: usersCount,
            attendances: attendanceCount,
            leaveRequests: leavesCount,
          },
        },
        server: {
          nodeVersion: process.version,
          platform: process.platform,
          uptimeSeconds: Math.floor(process.uptime()),
          memory: {
            heapUsedMB: Math.round(memoryUsage.heapUsed / 1024 / 1024),
            heapTotalMB: Math.round(memoryUsage.heapTotal / 1024 / 1024),
            rssMB: Math.round(memoryUsage.rss / 1024 / 1024),
          },
          environment: process.env.NODE_ENV || 'production',
          hasBrevoKey: !!process.env.BREVO_API_KEY,
          hasJwtSecret: !!process.env.JWT_SECRET,
        },
        companyConfig: settingsDoc,
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error generating diagnostics';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
