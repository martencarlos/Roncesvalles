// src/app/api/notifications/route.ts
import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import NotificationLog from '@/models/NotificationLog';
import { authenticate } from '@/lib/auth-utils';

export async function GET(req: NextRequest) {
  try {
    const currentUser = await authenticate(req);

    if (!currentUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (currentUser.role !== 'conserje') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await connectDB();

    const url = new URL(req.url);
    const page = Math.max(1, parseInt(url.searchParams.get('page') || '1'));
    const limit = Math.min(100, Math.max(1, parseInt(url.searchParams.get('limit') || '15')));
    const skip = (page - 1) * limit;

    const [notifications, totalCount] = await Promise.all([
      NotificationLog.find().sort({ sentAt: -1 }).skip(skip).limit(limit),
      NotificationLog.countDocuments(),
    ]);

    return NextResponse.json({
      notifications,
      page,
      limit,
      totalPages: Math.ceil(totalCount / limit),
      totalCount,
    });
  } catch (error) {
    console.error('GET /api/notifications error:', error);
    return NextResponse.json({ error: 'Failed to fetch notifications' }, { status: 500 });
  }
}
