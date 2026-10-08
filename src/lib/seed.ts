import { connectToDatabase } from './mongodb';
import CompanySettings from '@/models/CompanySettings';

export async function seedInitialData() {
  await connectToDatabase();

  const settingsExist = await CompanySettings.findOne();
  if (!settingsExist) {
    await CompanySettings.create({
      companyName: 'Skyland Corporation',
      officeStartTime: '09:00',
      officeEndTime: '18:00',
      gracePeriodMinutes: 15,
      halfDayThresholdHours: 4,
      fullDayThresholdHours: 8,
      workingDays: [1, 2, 3, 4, 5],
    });
    return { message: 'Company settings initialized' };
  }

  return { message: 'Settings already present' };
}
