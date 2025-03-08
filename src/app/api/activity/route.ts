// src/app/api/activity/route.ts
import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import ActivityLog from '@/models/ActivityLog';

export async function GET(req: NextRequest) {
  try {
    await connectDB();
    
    const activityLogs = await ActivityLog.find().sort({ timestamp: -1 }).limit(100);
    return NextResponse.json(activityLogs);
  } catch (error) {
    console.error('GET /api/activity error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch activity logs' },
      { status: 500 }
    );
  }
}