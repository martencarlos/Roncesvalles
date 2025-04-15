// src/models/PasswordReset.ts
import mongoose, { Schema } from 'mongoose';

export interface IPasswordReset {
  userId: string;
  token: string;
  expiresAt: Date;
  status: 'pending' | 'completed' | 'expired';
  createdAt: Date;
}

const PasswordResetSchema = new Schema<IPasswordReset>(
  {
    userId: {
      type: String,
      required: [true, 'User ID is required'],
      ref: 'User'
    },
    token: {
      type: String,
      required: [true, 'Token is required']
    },
    expiresAt: {
      type: Date,
      required: [true, 'Expiration date is required']
    },
    status: {
      type: String,
      enum: ['pending', 'completed', 'expired'],
      default: 'pending'
    }
  },
  { timestamps: true }
);

// Set index to automatically expire tokens, but only remove them physically after a longer period
// to maintain statistics (e.g., 30 days after expiration)
PasswordResetSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 30 * 24 * 60 * 60 }); // 30 days after expiration

export const PasswordReset = mongoose.models.PasswordReset || 
  mongoose.model<IPasswordReset>('PasswordReset', PasswordResetSchema);