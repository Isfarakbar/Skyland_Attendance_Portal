import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { connectToDatabase } from '@/lib/mongodb';
import CompanySettings from '@/models/CompanySettings';

export async function GET() {
  try {
    await connectToDatabase();
    let settings = await CompanySettings.findOne();
    if (!settings) {
      settings = await CompanySettings.create({
        companyName: 'Skyland Corporation',
        officeStartTime: '09:00',
        officeEndTime: '18:00',
        gracePeriodMinutes: 15,
        halfDayThresholdHours: 4,
        fullDayThresholdHours: 8,
      });
    }

    return NextResponse.json({ success: true, settings });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error fetching settings';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session || !['developer', 'admin'].includes(session.role)) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized: Only Developer or Administrator can modify company settings' },
        { status: 403 }
      );
    }

    const body = await req.json();
    await connectToDatabase();

    let settings = await CompanySettings.findOne();
    if (!settings) {
      settings = new CompanySettings();
    }

    if (body.companyName !== undefined) settings.companyName = body.companyName;
    if (body.officeStartTime !== undefined) settings.officeStartTime = body.officeStartTime;
    if (body.officeEndTime !== undefined) settings.officeEndTime = body.officeEndTime;
    if (body.gracePeriodMinutes !== undefined) settings.gracePeriodMinutes = Number(body.gracePeriodMinutes);
    if (body.halfDayThresholdHours !== undefined) settings.halfDayThresholdHours = Number(body.halfDayThresholdHours);
    if (body.fullDayThresholdHours !== undefined) settings.fullDayThresholdHours = Number(body.fullDayThresholdHours);

    await settings.save();

    return NextResponse.json({
      success: true,
      message: 'Company settings updated successfully',
      settings,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error updating settings';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
