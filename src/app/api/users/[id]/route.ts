// src/app/api/users/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import User from "@/models/User";
import { authenticate } from "@/lib/auth-utils";
import { hash } from "bcryptjs";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Authenticate user
    const currentUser = await authenticate(req);
    
    if (!currentUser) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }
    
    await connectDB();
    
    // Only allow users to access their own data unless they're admins
    if (
      params.id !== currentUser.id && 
      !["admin", "it_admin"].includes(currentUser.role)
    ) {
      return NextResponse.json(
        { error: "Forbidden" },
        { status: 403 }
      );
    }
    
    const user = await User.findById(params.id).select("-hashedPassword");
    
    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }
    
    return NextResponse.json(user);
    
  } catch (error) {
    console.error(`GET /api/users/${params.id} error:`, error);
    return NextResponse.json(
      { error: "Failed to fetch user" },
      { status: 500 }
    );
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Authenticate user
    const currentUser = await authenticate(req);
    
    if (!currentUser) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }
    
    await connectDB();
    
    // Only allow users to update their own data unless they're IT admins
    if (
      params.id !== currentUser.id && 
      currentUser.role !== "it_admin"
    ) {
      return NextResponse.json(
        { error: "Forbidden" },
        { status: 403 }
      );
    }
    
    const body = await req.json();
    
    // Don't allow changing role or apartment unless IT admin
    if (currentUser.role !== "it_admin") {
      delete body.role;
      delete body.apartmentNumber;
    }
    
    // Hash password if provided
    if (body.password) {
      body.hashedPassword = await hash(body.password, 12);
      delete body.password;
    }
    
    // Prevent email changing if not IT admin
    if (currentUser.role !== "it_admin" && body.email) {
      delete body.email;
    }
    
    const updatedUser = await User.findByIdAndUpdate(
      params.id,
      body,
      { new: true, runValidators: true }
    ).select("-hashedPassword");
    
    if (!updatedUser) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }
    
    return NextResponse.json(updatedUser);
    
  } catch (error) {
    console.error(`PUT /api/users/${params.id} error:`, error);
    return NextResponse.json(
      { error: "Failed to update user" },
      { status: 500 }
    );
  }
}

// Only IT admins can delete users
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Authenticate as IT admin
    const currentUser = await authenticate(req, ["it_admin"]);
    
    if (!currentUser) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }
    
    await connectDB();
    
    const deletedUser = await User.findByIdAndDelete(params.id);
    
    if (!deletedUser) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ message: "User deleted successfully" });
    
  } catch (error) {
    console.error(`DELETE /api/users/${params.id} error:`, error);
    return NextResponse.json(
      { error: "Failed to delete user" },
      { status: 500 }
    );
  }
}