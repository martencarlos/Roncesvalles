// src/models/User.ts
import mongoose, { Schema } from 'mongoose';
import { Model } from 'mongoose';

export type UserRole = 'user' | 'admin' | 'manager' | 'it_admin';

export interface IUser {
  _id?: string;
  email: string;
  name: string;
  apartmentNumber?: number; // Optional for admin/manager users
  hashedPassword: string;
  role: UserRole;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      trim: true,
      lowercase: true,
    },
    name: {
      type: String,
      required: [true, 'Name is required'],
    },
    apartmentNumber: {
      type: Number,
      min: [1, 'Apartment number must be between 1 and 48'],
      max: [48, 'Apartment number must be between 1 and 48'],
      // Only required for regular users
      validate: {
        validator: function(this: IUser) {
          return this.role === 'user' ? this.apartmentNumber !== undefined : true;
        },
        message: 'Apartment number is required for regular users'
      }
    },
    hashedPassword: {
      type: String,
      required: [true, 'Password is required'],
    },
    role: {
      type: String,
      enum: ['user', 'admin', 'manager', 'it_admin'],
      default: 'user',
    },
  },
  { timestamps: true }
);

// Create unique index on apartmentNumber for role='user'
UserSchema.index(
  { apartmentNumber: 1 },
  { 
    unique: true,
    partialFilterExpression: { 
      role: 'user',
      apartmentNumber: { $exists: true } 
    } 
  }
);

// Create model
const User = (mongoose.models.User || mongoose.model<IUser>('User', UserSchema)) as Model<IUser>;

export default User;