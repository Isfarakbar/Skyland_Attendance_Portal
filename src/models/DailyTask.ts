import mongoose, { Schema, Document, Model } from 'mongoose';

export type TaskStatus = 'COMPLETED' | 'IN_PROGRESS' | 'BLOCKED';

export interface IDailyTask extends Document {
  user: mongoose.Types.ObjectId;
  date: string; // "YYYY-MM-DD"
  title: string;
  description: string;
  status: TaskStatus;
  hoursSpent?: number;
  blockers?: string;
  createdAt: Date;
  updatedAt: Date;
}

const DailyTaskSchema = new Schema<IDailyTask>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    date: { type: String, required: true, index: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
    status: {
      type: String,
      enum: ['COMPLETED', 'IN_PROGRESS', 'BLOCKED'],
      default: 'COMPLETED',
      index: true,
    },
    hoursSpent: { type: Number, default: 0 },
    blockers: { type: String, default: '', trim: true },
  },
  {
    timestamps: true,
  }
);

// Compound index for querying a user's tasks by date
DailyTaskSchema.index({ user: 1, date: -1 });

export const DailyTask: Model<IDailyTask> =
  mongoose.models.DailyTask || mongoose.model<IDailyTask>('DailyTask', DailyTaskSchema);

export default DailyTask;
