// src/app/api/auth/register/route.ts
import { NextRequest, NextResponse } from "next/server";
import { hash } from "bcryptjs";
import connectDB from "@/lib/mongodb";
import User from "@/models/User";
import ActivityLog from "@/models/ActivityLog";
import { authenticate } from "@/lib/auth-utils";

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    
    const body = await req.json();
    const { name, email, password, apartmentNumber, role = 'user' } = body;
    
    // Get the current user if authenticated (for IT admin creating users)
    const currentUser = await authenticate(req);
    
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
          { error: "Este apartamento ya tiene un usuario registrado" },
          { status: 409 }
        );
      }
    }
    
    // Check if email already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    
    if (existingUser) {
      return NextResponse.json(
        { error: "Correo electrónico ya registrado" },
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
    
    // Log activity if it's an admin creating a user, otherwise it's self-registration
    if (currentUser && currentUser.role === 'it_admin') {
      await ActivityLog.create({
        action: 'user_create',
        userId: currentUser.id,
        targetUserId: user._id,
        apartmentNumber: role === 'user' ? apartmentNumber : undefined,
        details: `Usuario ${currentUser.name} (Admin IT) ha creado una cuenta para ${name} con rol ${role}${role === 'user' ? ` - Apto. #${apartmentNumber}` : ''}`
      });
    } else {
      // Self-registration
      await ActivityLog.create({
        action: 'user_create',
        userId: user._id, // The user created themselves
        targetUserId: user._id,
        apartmentNumber: role === 'user' ? apartmentNumber : undefined,
        details: `Registro de nuevo usuario: ${name}${role === 'user' ? ` - Apto. #${apartmentNumber}` : ''}`
      });
    }
    
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
        { error: "Correo electrónico o apartamento ya registrado" },
        { status: 409 }
      );
    }
    
    return NextResponse.json(
      { error: "Failed to create user" },
      { status: 500 }
    );
  }
}