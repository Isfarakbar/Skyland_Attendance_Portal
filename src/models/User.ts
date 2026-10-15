import mongoose, { Schema, Document, Model } from 'mongoose';

export type UserRole = 'developer' | 'admin' | 'manager' | 'employee';

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
  workMode: 'OFFICE' | 'FIELD';
  biometricUserId?: string;
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
      enum: ['developer', 'admin', 'manager', 'employee'],
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
    reportingManager: { type: String, default: 'Department Lead' },
    employmentType: { type: String, default: 'Full-time Permanent' },
    bankName: { type: String, default: 'Standard Chartered' },
    accountNumber: { type: String, default: '' },
    iban: { type: String, default: '' },
    devices: {
      type: [
        {
          name: { type: String, default: 'MacBook Air' },
          model: { type: String, default: 'Apple M1 / 16GB / 512GB' },
          serialNumber: { type: String, default: 'SKY-MBP-8921' },
          assignedDate: { type: String, default: '2024-01-15' },
          status: { type: String, default: 'Active' },
        },
      ],
      default: [
        {
          name: 'MacBook Air',
          model: 'Version M1',
          serialNumber: 'SKY-MBP-8921',
          assignedDate: '2024-01-15',
          status: 'Active',
        },
      ],
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
    joinDate: { type: Date, default: () => new Date() },
    isActive: { type: Boolean, default: true },
    isEmailVerified: { type: Boolean, default: false },
    verificationCode: { type: String, default: null },
    verificationCodeExpires: { type: Date, default: null },
    resetPasswordCode: { type: String, default: null },
    resetPasswordExpires: { type: Date, default: null },
    baseSalary: { type: Number, default: 30000 },
    workMode: {
      type: String,
      enum: ['OFFICE', 'FIELD'],
      default: 'OFFICE',
    },
    leaveBalance: {
      sick: { type: Number, default: 8 },
      casual: { type: Number, default: 10 },
      annual: { type: Number, default: 14 },
    },
    biometricUserId: { type: String, default: null, trim: true },
  },
  {
    timestamps: true,
  }
);

// Prevent mongoose model recompilation error in Next.js hot reload
export const User: Model<IUser> =
  mongoose.models.User || mongoose.model<IUser>('User', UserSchema);

export default User;
