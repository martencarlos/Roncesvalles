// src/models/PushSubscription.ts
import mongoose, { Schema } from 'mongoose';
import { Model } from 'mongoose';

export interface IPushSubscription {
  _id?: string;
  userId: string;      // ref to User._id (the conserje)
  endpoint: string;    // unique per browser/device
  keys: {
    p256dh: string;    // public key for payload encryption
    auth: string;      // authentication secret
  };
  createdAt: Date;
  updatedAt: Date;
}

const PushSubscriptionSchema = new Schema<IPushSubscription>(
  {
    userId: {
      type: String,
      ref: 'User',
      required: true,
    },
    endpoint: {
      type: String,
      required: true,
      unique: true,
    },
    keys: {
      p256dh: { type: String, required: true },
      auth: { type: String, required: true },
    },
  },
  { timestamps: true }
);

// Fast lookup of all subscriptions for a given user
PushSubscriptionSchema.index({ userId: 1 });

const PushSubscription = (mongoose.models.PushSubscription ||
  mongoose.model<IPushSubscription>('PushSubscription', PushSubscriptionSchema)) as Model<IPushSubscription>;

export default PushSubscription;
