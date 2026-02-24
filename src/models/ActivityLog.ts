// src/models/ActivityLog.ts
import mongoose, { Schema } from 'mongoose';

export interface IActivityLog {
  _id: string;
  action: 'create' | 'update' | 'delete' | 'user_create' | 'user_update' | 'user_delete';
  apartmentNumber?: number; // Optional for user management activities
  userId: string; // The user who performed the action
  targetUserId?: string; // For user management activities - the affected user
  details: string;
  timestamp: Date;
}

const ActivityLogSchema = new Schema<IActivityLog>({
  action: {
    type: String,
    enum: ['create', 'update', 'delete', 'user_create', 'user_update', 'user_delete'],
    required: true,
  },
  apartmentNumber: {
    type: Number
  },
  userId: {
    type: Schema.Types.String,
    ref: 'User',
    required: true
  },
  targetUserId: {
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

// Make this work with existing models by not requiring a strict schema match
const ActivityLog = mongoose.models.ActivityLog || 
  mongoose.model<IActivityLog>('ActivityLog', ActivityLogSchema);

export default ActivityLog;