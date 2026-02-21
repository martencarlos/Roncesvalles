export const dynamic = 'force-dynamic';
// src/app/api/users/route.ts
import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import User from "@/models/User";
import { authenticate } from "@/lib/auth-utils";

export async function GET(req: NextRequest) {
  try {
    // Authenticate and check if admin or IT admin
    const user = await authenticate(req, ["admin", "it_admin"]);
    
    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }
    
    await connectDB();
    
    // Get all users without password info
    const users = await User.find().select("-hashedPassword");
    
    return NextResponse.json(users);
    
  } catch (error) {
    console.error("GET /api/users error:", error);
    return NextResponse.json(
      { error: "Failed to fetch users" },
      { status: 500 }
    );
  }
}
