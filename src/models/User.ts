import mongoose, { Schema, Document, Model } from 'mongoose';

export type UserRole = 'developer' | 'admin' | 'ceo' | 'manager' | 'employee';

export interface IUserDevice {
  name: string;
  model: string;
  serialNumber: string;
  assignedDate?: string;
  status?: string;
}

export interface IUserPension {
  enrolled: boolean;
  contributionPercent: number;
  monthlyAmount: number;
}

export interface IUser extends Document {
  name: string;
  email: string;
  password: string;
  employeeId: string;
  role: UserRole;
  department: string;
  designation: string;
  phone?: string;
  avatarUrl?: string;
  bio?: string;
  emergencyContact?: string;
  emergencyRelation?: string;
  address?: string;
  dateOfBirth?: string;
  gender?: string;
  cnic?: string;
  shiftTiming?: string;
  reportingManager?: string;
  employmentType?: string;
  bankName?: string;
  accountNumber?: string;
  iban?: string;
  devices?: IUserDevice[];
  pensionFund?: IUserPension;
  taxSettings?: {
    isExempt?: boolean;
    customRate?: number;
    customFixedAmount?: number;
  };
  workMode?: 'OFFICE' | 'FIELD' | 'WFH' | 'HYBRID';
  weeklyOffDays?: number[];
  weeklyHalfDays?: number[];
  joinDate: Date;
  isActive: boolean;
  isEmailVerified: boolean;
  verificationCode?: string;
  verificationCodeExpires?: Date;
  resetPasswordCode?: string;
  resetPasswordExpires?: Date;
  leaveBalance: {
    sick: number;
    casual: number;
    annual: number;
  };
  baseSalary: number;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true },
    employeeId: { type: String, required: true, unique: true, uppercase: true, trim: true },
    role: {
      type: String,
      enum: ['developer', 'admin', 'ceo', 'manager', 'employee'],
      default: 'employee',
      required: true,
    },
    department: { type: String, default: 'General', trim: true },
    designation: { type: String, default: 'Team Member', trim: true },
    phone: { type: String, default: '' },
    avatarUrl: { type: String, default: '' },
    bio: { type: String, default: '' },
    emergencyContact: { type: String, default: '' },
    emergencyRelation: { type: String, default: 'Family' },
    address: { type: String, default: '' },
    dateOfBirth: { type: String, default: '' },
    gender: { type: String, default: 'Unspecified' },
    cnic: { type: String, default: '' },
    shiftTiming: { type: String, default: '09:00 AM - 06:00 PM' },
    reportingManager: { type: String, default: 'CEO' },
    employmentType: { type: String, default: 'Full-time Permanent' },
    bankName: { type: String, default: 'Standard Chartered' },
    accountNumber: { type: String, default: '' },
    iban: { type: String, default: '' },
    devices: {
      type: [
        {
          name: { type: String, required: true },
          model: { type: String, default: '' },
          serialNumber: { type: String, default: '' },
          assignedDate: { type: String, default: () => new Date().toISOString().slice(0, 10) },
          status: { type: String, default: 'Active' },
        },
      ],
      default: [],
    },
    pensionFund: {
      type: {
        enrolled: { type: Boolean, default: true },
        contributionPercent: { type: Number, default: 8 },
        monthlyAmount: { type: Number, default: 7600 },
      },
      default: {
        enrolled: true,
        contributionPercent: 8,
        monthlyAmount: 7600,
      },
    },
    taxSettings: {
      type: {
        isExempt: { type: Boolean, default: false },
        customRate: { type: Number, default: null },
        customFixedAmount: { type: Number, default: null },
      },
      default: { isExempt: false },
    },
    workMode: {
      type: String,
      enum: ['OFFICE', 'FIELD', 'WFH', 'HYBRID'],
      default: 'OFFICE',
    },
    weeklyOffDays: {
      type: [Number],
      default: [0, 6],
    },
    weeklyHalfDays: {
      type: [Number],
      default: [],
    },
    joinDate: { type: Date, default: () => new Date() },
    isActive: { type: Boolean, default: true },
    isEmailVerified: { type: Boolean, default: false },
    verificationCode: { type: String, default: null },
    verificationCodeExpires: { type: Date, default: null },
    resetPasswordCode: { type: String, default: null },
    resetPasswordExpires: { type: Date, default: null },
    baseSalary: { type: Number, default: 30000 },
    leaveBalance: {
      sick: { type: Number, default: 8 },
      casual: { type: Number, default: 10 },
      annual: { type: Number, default: 14 },
    },
  },
  {
    timestamps: true,
  }
);

// Prevent mongoose model recompilation error in Next.js hot reload
export const User: Model<IUser> =
  mongoose.models.User || mongoose.model<IUser>('User', UserSchema);

export default User;
