import mongoose, { Schema, Document, Model } from 'mongoose';

export type UserRole = 'admin' | 'hr' | 'employee';

export interface IUser extends Document {
  name: string;
  email: string;
  password: string;
  employeeId: string;
  role: UserRole;
  department: string;
  designation: string;
  phone?: string;
  joinDate: Date;
  isActive: boolean;
  leaveBalance: {
    sick: number;
    casual: number;
    annual: number;
  };
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
      enum: ['admin', 'hr', 'employee'],
      default: 'employee',
      required: true,
    },
    department: { type: String, default: 'General', trim: true },
    designation: { type: String, default: 'Team Member', trim: true },
    phone: { type: String, default: '' },
    joinDate: { type: Date, default: () => new Date() },
    isActive: { type: Boolean, default: true },
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
