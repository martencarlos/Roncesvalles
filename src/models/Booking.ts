// src/models/Booking.ts
import mongoose, { Schema } from 'mongoose';

export type MealType = 'lunch' | 'dinner';
export type BookingStatus = 'pending' | 'confirmed' | 'cancelled';

export interface IBooking {
  apartmentNumber: number;
  date: Date;
  mealType: MealType;
  numberOfPeople: number;
  tables: number[];
  prepararFuego: boolean;
  reservaHorno: boolean;
  reservaBrasa: boolean;
  status: BookingStatus;
  finalAttendees?: number;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
  userId: string; // Reference to the User who created the booking
  noCleaningService?: boolean; // New field to track if cleaning service applies
  _id?: string;
}

const BookingSchema = new Schema<IBooking>(
  {
    apartmentNumber: {
      type: Number,
      required: [true, 'Apartment number is required'],
      min: [1, 'Apartment number must be between 1 and 48'],
      max: [48, 'Apartment number must be between 1 and 48'],
    },
    date: {
      type: Date,
      required: [true, 'Date is required'],
    },
    mealType: {
      type: String,
      enum: ['lunch', 'dinner'],
      required: [true, 'Meal type is required'],
    },
    numberOfPeople: {
      type: Number,
      required: [true, 'Number of people is required'],
      min: [1, 'Number of people must be at least 1'],
    },
    tables: {
      type: [Number],
      required: [true, 'Tables selection is required'],
      validate: {
        validator: function(tables: number[]) {
          const validTables = tables.every(table => table >= 1 && table <= 6);
          const uniqueTables = new Set(tables).size === tables.length;
          return validTables && uniqueTables;
        },
        message: 'Selected tables must be between 1 and 6 and not duplicated'
      }
    },
    prepararFuego: {
      type: Boolean,
      default: false
    },
    reservaHorno: {
      type: Boolean,
      default: false
    },
    reservaBrasa: {
      type: Boolean,
      default: false
    },
    status: {
      type: String,
      enum: ['pending', 'confirmed', 'cancelled'],
      default: 'pending'
    },
    finalAttendees: {
      type: Number,
      min: [0, 'Final number of attendees cannot be negative']
    },
    notes: {
      type: String
    },
    userId: {
      type: String,
      ref: 'User',
      required: [true, 'User ID is required']
    },
    noCleaningService: {
      type: Boolean,
      default: false
    }
  },
  { timestamps: true }
);

// Create index to ensure uniqueness of tables on the same date and meal type
BookingSchema.index({ date: 1, mealType: 1, tables: 1 }, { unique: true });

export default mongoose.models.Booking || mongoose.model<IBooking>('Booking', BookingSchema);