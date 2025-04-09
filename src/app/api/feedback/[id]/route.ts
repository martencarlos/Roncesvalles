// src/app/api/feedback/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Feedback from '@/models/Feedback';
import ActivityLog from '@/models/ActivityLog';
import { authenticate } from '@/lib/auth-utils';

export async function PUT(
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
    
    const feedbackId = params.id;
    const body = await req.json();
    
    // Check if feedback exists
    const feedback = await Feedback.findById(feedbackId);
    
    if (!feedback) {
      return NextResponse.json(
        { error: "Feedback not found" },
        { status: 404 }
      );
    }
    
    // Update feedback status
    const updatedFeedback = await Feedback.findByIdAndUpdate(
      feedbackId,
      { status: body.status },
      { new: true }
    );
    
    // Log activity
    await ActivityLog.create({
      action: 'update',
      userId: currentUser.id,
      details: `Admin ha actualizado el estado del feedback #${feedbackId} a '${body.status}'`,
    });
    
    return NextResponse.json(updatedFeedback);
    
  } catch (error: any) {
    console.error(`PUT /api/feedback/${params.id} error:`, error);
    return NextResponse.json(
      { error: 'Failed to update feedback status' },
      { status: 500 }
    );
  }
}

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
    
    const feedbackId = params.id;
    
    // Check if feedback exists
    const feedback = await Feedback.findById(feedbackId);
    
    if (!feedback) {
      return NextResponse.json(
        { error: "Feedback not found" },
        { status: 404 }
      );
    }
    
    // Delete feedback
    await Feedback.findByIdAndDelete(feedbackId);
    
    // Log activity
    await ActivityLog.create({
      action: 'delete',
      userId: currentUser.id,
      details: `Admin ha eliminado el feedback #${feedbackId}`,
    });
    
    return NextResponse.json({ message: "Feedback deleted successfully" });
    
  } catch (error: any) {
    console.error(`DELETE /api/feedback/${params.id} error:`, error);
    return NextResponse.json(
      { error: 'Failed to delete feedback' },
      { status: 500 }
    );
  }
}