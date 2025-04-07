// src/app/api/auth/register/route.ts
import { NextRequest, NextResponse } from "next/server";
import { hash } from "bcryptjs";
import connectDB from "@/lib/mongodb";
import User from "@/models/User";

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    
    const body = await req.json();
    const { name, email, password, apartmentNumber, role = 'user' } = body;
    
    // Validate required fields
    if (!name || !email || !password) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }
    
    // Additional validation for regular users
    if (role === 'user') {
      if (!apartmentNumber) {
        return NextResponse.json(
          { error: "Apartment number is required for regular users" },
          { status: 400 }
        );
      }
      
      if (apartmentNumber < 1 || apartmentNumber > 48) {
        return NextResponse.json(
          { error: "Apartment number must be between 1 and 48" },
          { status: 400 }
        );
      }
      
      // Check if apartment is already registered
      const existingUserWithApartment = await User.findOne({ 
        apartmentNumber, 
        role: 'user' 
      });
      
      if (existingUserWithApartment) {
        return NextResponse.json(
          { error: "This apartment already has a registered user" },
          { status: 409 }
        );
      }
    }
    
    // Check if email already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    
    if (existingUser) {
      return NextResponse.json(
        { error: "Email already registered" },
        { status: 409 }
      );
    }
    
    // Hash password
    const hashedPassword = await hash(password, 12);
    
    // Create user
    const userData = {
      name,
      email: email.toLowerCase(),
      hashedPassword,
      role,
      ...(role === 'user' ? { apartmentNumber } : {})
    };
    
    const user = await User.create(userData);
    
    // Return success without sensitive data
    return NextResponse.json(
      {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        ...(user.apartmentNumber ? { apartmentNumber: user.apartmentNumber } : {})
      },
      { status: 201 }
    );
    
  } catch (error: any) {
    console.error("Registration error:", error);
    
    if (error.code === 11000) {
      // MongoDB duplicate key error
      return NextResponse.json(
        { error: "Email or apartment already registered" },
        { status: 409 }
      );
    }
    
    return NextResponse.json(
      { error: "Failed to create user" },
      { status: 500 }
    );
  }
}