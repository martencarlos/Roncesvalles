// src/app/api/activity/route.ts
import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import ActivityLog from '@/models/ActivityLog';

export async function GET(req: NextRequest) {
  try {
    await connectDB();
    
    // Get pagination parameters from query
    const url = new URL(req.url);
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '10');
    
    // Validate pagination parameters
    const validPage = page > 0 ? page : 1;
    const validLimit = limit > 0 && limit <= 100 ? limit : 10;
    
    // Calculate skip value for pagination
    const skip = (validPage - 1) * validLimit;
    
    // Get total count for pagination
    const totalCount = await ActivityLog.countDocuments();
    const totalPages = Math.ceil(totalCount / validLimit);
    
    // Fetch paginated activity logs
    const activityLogs = await ActivityLog.find()
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(validLimit);
    
    return NextResponse.json({
      logs: activityLogs,
      page: validPage,
      limit: validLimit,
      totalPages,
      totalCount
    });
  } catch (error) {
    console.error('GET /api/activity error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch activity logs' },
      { status: 500 }
    );
  }
}