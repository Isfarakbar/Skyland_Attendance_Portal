import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ICompanySettings extends Document {
  companyName: string;
  portalTitle?: string;
  portalTagline?: string;
  officeStartTime: string; // e.g., "09:00"
  officeEndTime: string; // e.g., "18:00"
  gracePeriodMinutes: number; // e.g., 15
  halfDayThresholdHours: number; // e.g., 4
  fullDayThresholdHours: number; // e.g., 8
  workingDays: number[]; // [1, 2, 3, 4, 5] (Monday to Friday)
  timezone: string; // e.g., "Asia/Karachi"
  allowedFreeLeaves?: number; // default: 1
  allowedFreeHalfLeaves?: number; // default: 2
  salaryCalculationDays?: number; // default: 30
  taxDeductionEnabled?: boolean; // default: true
  taxCalculationMode?: 'FBR_SLABS' | 'FLAT_RATE'; // default: 'FBR_SLABS'
  taxYear?: string; // default: '2026-27'
  taxExemptionThreshold?: number; // default: 50000 (PKR, used for flat rate mode)
  taxRate?: number; // default: 2.5 (%, used for flat rate mode)
}

const CompanySettingsSchema = new Schema<ICompanySettings>(
  {
    companyName: { type: String, default: 'Skyland' },
    portalTitle: { type: String, default: 'Skyland Attendance Portal' },
    portalTagline: { type: String, default: 'Solar Energy Workforce & Attendance Hub' },
    officeStartTime: { type: String, default: '09:00' },
    officeEndTime: { type: String, default: '18:00' },
    gracePeriodMinutes: { type: Number, default: 15 },
    halfDayThresholdHours: { type: Number, default: 4 },
    fullDayThresholdHours: { type: Number, default: 8 },
    workingDays: { type: [Number], default: [1, 2, 3, 4, 5] },
    timezone: { type: String, default: 'Asia/Karachi' },
    allowedFreeLeaves: { type: Number, default: 1 },
    allowedFreeHalfLeaves: { type: Number, default: 2 },
    salaryCalculationDays: { type: Number, default: 30 },
    taxDeductionEnabled: { type: Boolean, default: true },
    taxCalculationMode: { type: String, enum: ['FBR_SLABS', 'FLAT_RATE'], default: 'FBR_SLABS' },
    taxYear: { type: String, default: '2026-27' },
    taxExemptionThreshold: { type: Number, default: 50000 },
    taxRate: { type: Number, default: 2.5 },
  },
  {
    timestamps: true,
  }
);

export const CompanySettings: Model<ICompanySettings> =
  mongoose.models.CompanySettings ||
  mongoose.model<ICompanySettings>('CompanySettings', CompanySettingsSchema);

export default CompanySettings;
