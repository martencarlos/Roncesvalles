// src/models/Feedback.ts
import mongoose, { Schema } from 'mongoose';

export type FeedbackType = 'bug' | 'feature' | 'question' | 'other';

export interface IFeedback {
  _id?: string;
  name: string;
  apartmentNumber?: number; // Optional for admin users
  email: string;
  type: FeedbackType;
  content: string;
  status: 'new' | 'in-progress' | 'resolved';
  userId: string; // Reference to the User who created the feedback
  createdAt: Date;
  updatedAt: Date;
}

const FeedbackSchema = new Schema<IFeedback>(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
    },
    apartmentNumber: {
      type: Number,
      min: [1, 'Apartment number must be between 1 and 48'],
      max: [48, 'Apartment number must be between 1 and 48'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
    },
    type: {
      type: String,
      enum: ['bug', 'feature', 'question', 'other'],
      required: [true, 'Feedback type is required'],
    },
    content: {
      type: String,
      required: [true, 'Feedback content is required'],
    },
    status: {
      type: String,
      enum: ['new', 'in-progress', 'resolved'],
      default: 'new',
    },
    userId: {
      type: String,
      ref: 'User',
      required: [true, 'User ID is required'],
    },
  },
  { timestamps: true }
);

export default mongoose.models.Feedback || mongoose.model<IFeedback>('Feedback', FeedbackSchema);