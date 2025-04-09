// src/app/api/feedback/route.ts
import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Feedback from '@/models/Feedback';
import ActivityLog from '@/models/ActivityLog';
import { authenticate } from '@/lib/auth-utils';
import { sendEmail } from '@/lib/email-service';
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    // Get session directly
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      console.error("No valid session found in feedback POST route");
      return NextResponse.json(
        { error: "Unauthorized - No valid session" },
        { status: 401 }
      );
    }
    
    const currentUser = session.user;
    
    await connectDB();
    
    const body = await req.json();
    const { name, email, type, content } = body;
    
    // Validate required fields
    if (!name || !email || !type || !content) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }
    
    // Create feedback
    const feedback = await Feedback.create({
      name,
      email,
      type,
      content,
      status: 'new',
      userId: currentUser.id,
      apartmentNumber: currentUser.apartmentNumber,
    });
    
    // Log activity
    await ActivityLog.create({
      action: 'create',
      userId: currentUser.id,
      apartmentNumber: currentUser.apartmentNumber,
      details: `Usuario ${name} ha enviado un feedback de tipo '${type}'`,
    });
    
    // Send email notification to admin
    const emailSent = await sendFeedbackEmail(feedback);
    
    return NextResponse.json(
      { 
        success: true, 
        message: "Feedback submitted successfully",
        emailSent
      },
      { status: 201 }
    );
    
  } catch (error: any) {
    console.error('POST /api/feedback error:', error);
    return NextResponse.json(
      { error: 'Error al enviar el feedback' },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
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
    
    // Get pagination parameters from query
    const url = new URL(req.url);
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '10');
    const status = url.searchParams.get('status') || 'all';
    const type = url.searchParams.get('type') || 'all';
    
    // Validate pagination parameters
    const validPage = page > 0 ? page : 1;
    const validLimit = limit > 0 && limit <= 100 ? limit : 10;
    
    // Calculate skip value for pagination
    const skip = (validPage - 1) * validLimit;
    
    // Build query based on filters
    let query: any = {};
    
    if (status !== 'all') {
      query.status = status;
    }
    
    if (type !== 'all') {
      query.type = type;
    }
    
    // Get total count for pagination based on filters
    const totalCount = await Feedback.countDocuments(query);
    const totalPages = Math.ceil(totalCount / validLimit);
    
    // Fetch paginated feedback
    const feedback = await Feedback.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(validLimit);
    
    return NextResponse.json({
      feedback,
      page: validPage,
      limit: validLimit,
      totalPages,
      totalCount
    });
    
  } catch (error: any) {
    console.error('GET /api/feedback error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch feedback' },
      { status: 500 }
    );
  }
}

// Function to send email notification about new feedback
async function sendFeedbackEmail(feedback: any) {
  const adminEmail = 'martencarlos@gmail.com';
  const subject = `Nuevo feedback: ${getFeedbackTypeLabel(feedback.type)}`;
  
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h1 style="color: #2563eb; margin-bottom: 20px;">Nuevo Feedback Recibido</h1>
      
      <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
        <p><strong>Tipo:</strong> ${getFeedbackTypeLabel(feedback.type)}</p>
        <p><strong>Nombre:</strong> ${feedback.name}</p>
        <p><strong>Email:</strong> ${feedback.email}</p>
        ${feedback.apartmentNumber ? `<p><strong>Apartamento:</strong> #${feedback.apartmentNumber}</p>` : ''}
        <p><strong>Fecha:</strong> ${new Date(feedback.createdAt).toLocaleString('es-ES')}</p>
      </div>
      
      <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; padding: 20px; border-radius: 8px;">
        <h2 style="font-size: 16px; margin-top: 0;">Contenido del Feedback:</h2>
        <p style="white-space: pre-line;">${feedback.content}</p>
      </div>
      
      <p style="margin-top: 20px; font-size: 14px; color: #64748b; text-align: center;">
        Este es un mensaje automático enviado desde el Sistema de Reserva de Espacios Comunitarios.
      </p>
    </div>
  `;
  
  return await sendEmail({
    to: adminEmail,
    subject,
    html
  });
}

// Helper function to get friendly feedback type label
function getFeedbackTypeLabel(type: string): string {
  switch (type) {
    case 'bug':
      return 'Reporte de error';
    case 'feature':
      return 'Sugerencia de funcionalidad';
    case 'question':
      return 'Pregunta';
    case 'other':
      return 'Otro';
    default:
      return type;
  }
}