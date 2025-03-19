// src/models/ActivityLog.ts
import mongoose, { Schema } from 'mongoose';

export interface IActivityLog {
  _id: string
  action: 'create' | 'update' | 'delete' | 'confirm';
  apartmentNumber: number;
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