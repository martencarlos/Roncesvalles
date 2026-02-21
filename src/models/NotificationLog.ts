// src/models/NotificationLog.ts
import mongoose, { Schema } from 'mongoose';

export interface INotificationLog {
  _id: string;
  title: string;
  body: string;
  tag?: string;
  sentAt: Date;
}

const NotificationLogSchema = new Schema<INotificationLog>({
  title: { type: String, required: true },
  body: { type: String, required: true },
  tag: { type: String },
  sentAt: { type: Date, default: Date.now },
});

NotificationLogSchema.index({ sentAt: -1 });

const NotificationLog =
  mongoose.models.NotificationLog ||
  mongoose.model<INotificationLog>('NotificationLog', NotificationLogSchema);

export default NotificationLog;
