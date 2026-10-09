import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ICompanySettings extends Document {
  companyName: string;
  officeStartTime: string; // e.g., "09:00"
  officeEndTime: string; // e.g., "18:00"
  gracePeriodMinutes: number; // e.g., 15
  halfDayThresholdHours: number; // e.g., 4
  fullDayThresholdHours: number; // e.g., 8
  workingDays: number[]; // [1, 2, 3, 4, 5] (Monday to Friday)
  timezone: string; // e.g., "Asia/Karachi"
}

const CompanySettingsSchema = new Schema<ICompanySettings>(
  {
    companyName: { type: String, default: 'Skyland' },
    officeStartTime: { type: String, default: '09:00' },
    officeEndTime: { type: String, default: '18:00' },
    gracePeriodMinutes: { type: Number, default: 15 },
    halfDayThresholdHours: { type: Number, default: 4 },
    fullDayThresholdHours: { type: Number, default: 8 },
    workingDays: { type: [Number], default: [1, 2, 3, 4, 5] },
    timezone: { type: String, default: 'Asia/Karachi' },
  },
  {
    timestamps: true,
  }
);

export const CompanySettings: Model<ICompanySettings> =
  mongoose.models.CompanySettings ||
  mongoose.model<ICompanySettings>('CompanySettings', CompanySettingsSchema);

export default CompanySettings;
