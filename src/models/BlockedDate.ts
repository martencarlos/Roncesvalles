// src/models/BlockedDate.ts
import mongoose, { Schema } from "mongoose";

export type BlockedMealType = "lunch" | "dinner" | "both";
export type JuntaReason =
  | "Junta general ordinaria"
  | "Junta general extraordinaria";

export interface IBlockedDate {
  _id?: string;
  date: Date;
  mealType: BlockedMealType;
  reason: JuntaReason;
  prepararFuego: boolean;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

const BlockedDateSchema = new Schema<IBlockedDate>(
  {
    date: {
      type: Date,
      required: [true, "La fecha es obligatoria"],
    },
    mealType: {
      type: String,
      enum: ["lunch", "dinner", "both"],
      required: [true, "El tipo de servicio es obligatorio"],
    },
    reason: {
      type: String,
      enum: ["Junta general ordinaria", "Junta general extraordinaria"],
      required: [true, "El motivo es obligatorio"],
    },
    prepararFuego: {
      type: Boolean,
      default: false,
    },
    createdBy: {
      type: String,
      ref: "User",
      required: [true, "El usuario creador es obligatorio"],
    },
  },
  { timestamps: true }
);

// Index for fast lookup by date + mealType
BlockedDateSchema.index({ date: 1, mealType: 1 });

export default mongoose.models.BlockedDate ||
  mongoose.model<IBlockedDate>("BlockedDate", BlockedDateSchema);
