// src/app/api/activity/route.ts
import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import ActivityLog from '@/models/ActivityLog';
import { authenticate } from '@/lib/auth-utils';

export async function GET(req: NextRequest) {
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
    
    // Get pagination and filter parameters from query
    const url = new URL(req.url);
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '10');
    const actionType = url.searchParams.get('action');
    const userOnly = url.searchParams.get('userOnly') === 'true';
    const apartmentFilter = url.searchParams.get('apartment');
    
    // Validate pagination parameters
    const validPage = page > 0 ? page : 1;
    const validLimit = limit > 0 && limit <= 100 ? limit : 10;
    
    // Calculate skip value for pagination
    const skip = (validPage - 1) * validLimit;
    
    // Build query based on filters
    let query: any = {};
    
    // If it's a regular user, only show their own apartment's logs
    if (currentUser.role === 'user') {
      query.apartmentNumber = currentUser.apartmentNumber;
    } 
    // For admins , allow filtering by apartment
    else if (apartmentFilter && !isNaN(parseInt(apartmentFilter))) {
      query.apartmentNumber = parseInt(apartmentFilter);
    }
    
    // Filter by action type if specified
    if (actionType) {
      if (actionType === 'booking') {
        // Show only booking-related actions
        query.action = { $in: ['create', 'update', 'delete', 'confirm'] };
      } else if (actionType === 'user') {
        // Show only user-related actions
        query.action = { $in: ['user_create', 'user_update', 'user_delete'] };
      } else if (['create', 'update', 'delete', 'confirm', 'user_create', 'user_update', 'user_delete'].includes(actionType)) {
        // Show a specific action type
        query.action = actionType;
      }
    }
    
    // If userOnly flag is true and current user is not a normal user,
    // only show activities performed by the current user
    if (userOnly && currentUser.role !== 'user') {
      query.userId = currentUser.id;
    }
    
    // Get total count for pagination based on filters
    const totalCount = await ActivityLog.countDocuments(query);
    const totalPages = Math.ceil(totalCount / validLimit);
    
    // Fetch paginated activity logs with filters - REMOVED THE POPULATE CALLS
    const activityLogs = await ActivityLog.find(query)
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