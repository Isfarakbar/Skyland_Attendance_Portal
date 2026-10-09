import mongoose, { Schema, Document, Model } from 'mongoose';

export type AttendanceStatus = 'PRESENT' | 'LATE' | 'HALF_DAY' | 'HALF_LEAVE' | 'ABSENT' | 'OFF' | 'ON_LEAVE';

export interface IBreak {
  _id?: mongoose.Types.ObjectId;
  startTime: Date;
  endTime?: Date | null;
  durationMinutes: number;
  note?: string;
}

export interface IAttendance extends Document {
  user: mongoose.Types.ObjectId;
  date: string; // "YYYY-MM-DD"
  clockIn: Date | null;
  clockOut: Date | null;
  breaks: IBreak[];
  status: AttendanceStatus;
  totalWorkMinutes: number;
  totalBreakMinutes: number;
  notes?: string;
  ipAddress?: string;
  isRegularized: boolean;
  regularizedReason?: string;
  regularizedBy?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const BreakSchema = new Schema<IBreak>({
  startTime: { type: Date, required: true },
  endTime: { type: Date, default: null },
  durationMinutes: { type: Number, default: 0 },
  note: { type: String, default: '' },
});

const AttendanceSchema = new Schema<IAttendance>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    date: { type: String, required: true, index: true }, // Format: YYYY-MM-DD
    clockIn: { type: Date, default: null },
    clockOut: { type: Date, default: null },
    breaks: [BreakSchema],
    status: {
      type: String,
      enum: ['PRESENT', 'LATE', 'HALF_DAY', 'HALF_LEAVE', 'ABSENT', 'OFF', 'ON_LEAVE'],
      default: 'PRESENT',
    },
    totalWorkMinutes: { type: Number, default: 0 },
    totalBreakMinutes: { type: Number, default: 0 },
    notes: { type: String, default: '' },
    ipAddress: { type: String, default: '' },
    isRegularized: { type: Boolean, default: false },
    regularizedReason: { type: String, default: '' },
    regularizedBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
  },
  {
    timestamps: true,
  }
);

// Compound unique index so a user only has one attendance entry per calendar day
AttendanceSchema.index({ user: 1, date: 1 }, { unique: true });

export const Attendance: Model<IAttendance> =
  mongoose.models.Attendance || mongoose.model<IAttendance>('Attendance', AttendanceSchema);

export default Attendance;
