// src/app/api/auth/reset-password/route.ts
import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import User from "@/models/User";
import crypto from "crypto";
import { PasswordReset } from "@/models/PasswordReset";
import { sendPasswordResetEmail } from "@/lib/email-service";

// This endpoint handles the initial password reset request
export async function POST(req: NextRequest) {
  try {
    await connectDB();
    
    const { email } = await req.json();
    
    // Validate email
    if (!email) {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
      );
    }
    
    // Find the user by email
    const user = await User.findOne({ email: email.toLowerCase() });
    
    // Even if user doesn't exist, don't reveal this information
    // Simply return success to prevent email enumeration attacks
    if (!user) {
      return NextResponse.json(
        { success: true, message: "If your email exists in our system, you will receive reset instructions." },
        { status: 200 }
      );
    }
    
    // Generate a reset token
    const resetToken = crypto.randomBytes(32).toString("hex");
    const hashedToken = crypto
      .createHash("sha256")
      .update(resetToken)
      .digest("hex");
    
    // Save the token in the database
    await PasswordReset.findOneAndUpdate(
      { userId: user._id, status: 'pending' },
      {
        userId: user._id,
        token: hashedToken,
        expiresAt: new Date(Date.now() + 1 * 60 * 60 * 1000), // 1 hour expiration
        status: 'pending'
      },
      { upsert: true, new: true }
    );
    
    // Create reset URL with base URL from environment or request origin
    const baseUrl = process.env.NEXTAUTH_URL || req.headers.get('origin') || 'http://localhost:3000';
    const resetUrl = `${baseUrl}/auth/new-password?token=${resetToken}&email=${encodeURIComponent(
      user.email
    )}`;
    
    // Send password reset email
    const emailSent = await sendPasswordResetEmail(
      user.email,
      resetUrl,
      user.name
    );
    
    // Return response
    return NextResponse.json(
      { 
        success: true, 
        message: "If your email exists in our system, you will receive reset instructions.",
        emailSent,
        // Include resetUrl in dev environment only (remove in production)
        ...(process.env.NODE_ENV === "development" && { resetUrl })
      },
      { status: 200 }
    );
    
  } catch (error: any) {
    console.error("Reset password error:", error);
    
    return NextResponse.json(
      { error: "Failed to process password reset request" },
      { status: 500 }
    );
  }
}