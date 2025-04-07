// src/app/api/auth/new-password/route.ts
import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import User from "@/models/User";
import { PasswordReset } from "@/models/PasswordReset";
import crypto from "crypto";
import { hash } from "bcryptjs";

// This endpoint handles setting a new password using a valid reset token
export async function POST(req: NextRequest) {
  try {
    await connectDB();
    
    const { token, email, password } = await req.json();
    
    // Validate inputs
    if (!token || !email || !password) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }
    
    // Validate password length
    if (password.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters long" },
        { status: 400 }
      );
    }
    
    // Find user by email
    const user = await User.findOne({ email: email.toLowerCase() });
    
    if (!user) {
      return NextResponse.json(
        { error: "Invalid reset request" },
        { status: 400 }
      );
    }
    
    // Hash the provided token for comparison
    const hashedToken = crypto
      .createHash("sha256")
      .update(token)
      .digest("hex");
    
    // Find valid reset token
    const resetRequest = await PasswordReset.findOne({
      userId: user._id,
      token: hashedToken,
      expiresAt: { $gt: new Date() }
    });
    
    if (!resetRequest) {
      return NextResponse.json(
        { error: "Invalid or expired reset link" },
        { status: 400 }
      );
    }
    
    // Hash the new password
    const hashedPassword = await hash(password, 12);
    
    // Update user's password
    await User.findByIdAndUpdate(user._id, {
      hashedPassword: hashedPassword
    });
    
    // Delete the used reset token
    await PasswordReset.deleteOne({ userId: user._id });
    
    return NextResponse.json(
      { success: true, message: "Password updated successfully" },
      { status: 200 }
    );
    
  } catch (error: any) {
    console.error("New password error:", error);
    
    return NextResponse.json(
      { error: "Failed to update password" },
      { status: 500 }
    );
  }
}