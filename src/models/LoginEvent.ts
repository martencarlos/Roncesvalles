// src/models/LoginEvent.ts
import mongoose, { Schema } from 'mongoose';

export interface ILoginEvent {
  _id?: string;
  userId: string;
  timestamp: Date;
  ipAddress: string;
  userAgent: string;
  browser: string;
  deviceType: 'desktop' | 'mobile' | 'tablet';
  location: string;
  geoData?: {
    country?: string;
    city?: string;
    region?: string;
    latitude?: number;
    longitude?: number;
  };
  success: boolean;
  failureReason?: string;
}

const LoginEventSchema = new Schema<ILoginEvent>(
  {
    userId: {
      type: String,
      ref: 'User',
      required: [true, 'User ID is required'],
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
    ipAddress: {
      type: String,
      required: [true, 'IP address is required'],
    },
    userAgent: {
      type: String,
      required: [true, 'User agent is required'],
    },
    browser: {
      type: String,
      required: [true, 'Browser information is required'],
    },
    deviceType: {
      type: String,
      enum: ['desktop', 'mobile', 'tablet'],
      required: [true, 'Device type is required'],
    },
    location: {
      type: String,
      default: 'Unknown',
    },
    geoData: {
      country: String,
      city: String,
      region: String,
      latitude: Number,
      longitude: Number,
    },
    success: {
      type: Boolean,
      required: [true, 'Login success status is required'],
    },
    failureReason: {
      type: String,
    },
  },
  { timestamps: true }
);

// Create indexes for faster querying
LoginEventSchema.index({ userId: 1 });
LoginEventSchema.index({ timestamp: -1 });
LoginEventSchema.index({ success: 1 });

export default mongoose.models.LoginEvent || mongoose.model<ILoginEvent>('LoginEvent', LoginEventSchema);