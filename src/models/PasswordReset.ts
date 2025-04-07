// src/models/PasswordReset.ts
import mongoose, { Schema } from 'mongoose';

export interface IPasswordReset {
  userId: string;
  token: string;
  expiresAt: Date;
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
    }
  },
  { timestamps: true }
);

// Set index to automatically remove expired tokens
PasswordResetSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const PasswordReset = mongoose.models.PasswordReset || 
  mongoose.model<IPasswordReset>('PasswordReset', PasswordResetSchema);