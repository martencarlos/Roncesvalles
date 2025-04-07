// Also update ActivityLog model
// src/models/ActivityLog.ts (updated)
import mongoose, { Schema } from 'mongoose';

export interface IActivityLog {
  _id: string;
  action: 'create' | 'update' | 'delete' | 'confirm';
  apartmentNumber: number;
  userId?: string; // Add user ID reference
  details: string;
  timestamp: Date;
}

const ActivityLogSchema = new Schema<IActivityLog>({
  action: {
    type: String,
    enum: ['create', 'update', 'delete', 'confirm'],
    required: true,
  },
  apartmentNumber: {
    type: Number,
    required: true,
  },
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  details: {
    type: String,
    required: true,
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
});

export default mongoose.models.ActivityLog || mongoose.model<IActivityLog>('ActivityLog', ActivityLogSchema);
