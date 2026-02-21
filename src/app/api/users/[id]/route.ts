export const dynamic = 'force-dynamic';
// src/app/api/users/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import User from "@/models/User";
import ActivityLog from "@/models/ActivityLog"; // Import ActivityLog
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
    
    // Get original user data for logging changes
    const originalUser = await User.findById(params.id);
    
    if (!originalUser) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }
    
    const body = await req.json();
    
    // Track changes for activity log
    const changes = [];
    if (body.name && body.name !== originalUser.name) {
      changes.push(`nombre: "${originalUser.name}" ➔ "${body.name}"`);
    }
    
    if (body.role && body.role !== originalUser.role && currentUser.role === "it_admin") {
      changes.push(`rol: "${originalUser.role}" ➔ "${body.role}"`);
    }
    
    if (body.password) {
      changes.push("contraseña");
    }
    
    // Don't allow changing role or apartment unless IT admin
    if (currentUser.role !== "it_admin") {
      delete body.role;
      delete body.apartmentNumber;
    } else if (body.apartmentNumber && body.apartmentNumber !== originalUser.apartmentNumber) {
      changes.push(`apartamento: ${originalUser.apartmentNumber || 'N/A'} ➔ ${body.apartmentNumber}`);
    }
    
    // Hash password if provided
    if (body.password) {
      body.hashedPassword = await hash(body.password, 12);
      delete body.password;
    }
    
    // Prevent email changing if not IT admin
    if (currentUser.role !== "it_admin" && body.email) {
      delete body.email;
    } else if (body.email && body.email !== originalUser.email) {
      changes.push(`correo: "${originalUser.email}" ➔ "${body.email}"`);
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
    
    // Log the activity if there were changes
    if (changes.length > 0) {
      let logDetails = '';
      
      if (currentUser.id === params.id) {
        // User updating their own profile
        logDetails = `Usuario ${originalUser.name} actualizó su perfil (${changes.join(', ')})`;
      } else {
        // Admin updating another user
        logDetails = `Admin ${currentUser.name} actualizó la información de ${originalUser.name} (${changes.join(', ')})`;
      }
      
      await ActivityLog.create({
        action: 'user_update',
        userId: currentUser.id,
        targetUserId: params.id,
        apartmentNumber: updatedUser.apartmentNumber,
        details: logDetails
      });
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
    
    // Get user data before deletion for logging
    const userToDelete = await User.findById(params.id);
    
    if (!userToDelete) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }
    
    // Delete the user
    await User.findByIdAndDelete(params.id);
    
    // Log the deletion
    await ActivityLog.create({
      action: 'user_delete',
      userId: currentUser.id,
      targetUserId: params.id,
      apartmentNumber: userToDelete.apartmentNumber,
      details: `Admin ${currentUser.name} ha eliminado el usuario ${userToDelete.name}${userToDelete.apartmentNumber ? ` (Apto. #${userToDelete.apartmentNumber})` : ''}`
    });
    
    return NextResponse.json({ message: "User deleted successfully" });
    
  } catch (error) {
    console.error(`DELETE /api/users/${params.id} error:`, error);
    return NextResponse.json(
      { error: "Failed to delete user" },
      { status: 500 }
    );
  }
}