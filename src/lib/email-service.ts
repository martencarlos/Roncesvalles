// src/lib/email-service.ts - Update with feedback email function
import nodemailer from 'nodemailer';

// Configure nodemailer with SMTP settings
const transporter = nodemailer.createTransport({
  host: 'smtp.zoho.eu',
  port: 587,
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
  tls: {
    // Do not fail on invalid certs
    rejectUnauthorized: false,
  },
});

interface SendEmailParams {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

/**
 * Send an email using nodemailer
 */
export async function sendEmail({ to, subject, html, text }: SendEmailParams): Promise<boolean> {
  try {
    const info = await transporter.sendMail({
      from: `"Sociedad Roncesvalles" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      text: text || html.replace(/<[^>]*>/g, ''), // Strip HTML for text version
      html,
    });

    console.log('Message sent: %s', info.messageId);
    return true;
  } catch (error) {
    console.error('Error sending email:', error);
    return false;
  }
}

/**
 * Send a password reset email
 */
export async function sendPasswordResetEmail(
  email: string,
  resetUrl: string,
  userName: string
): Promise<boolean> {
  const subject = 'Restablecimiento de Contraseña - Sociedad Roncesvalles';

  // Create HTML content with a clean, responsive design
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333;">
      <div style="text-align: center; margin-bottom: 30px;">
        <h1 style="color: #2563eb; margin-bottom: 10px;">Sociedad Roncesvalles</h1>
        <p style="font-size: 16px;">Sistema de Reserva de Espacios Comunitarios</p>
      </div>
      
      <div style="background-color: #f9fafb; padding: 20px; border-radius: 10px; border: 1px solid #e5e7eb;">
        <h2 style="margin-top: 0;">Restablecimiento de Contraseña</h2>
        
        <p>Hola ${userName},</p>
        
        <p>Recibimos una solicitud para restablecer la contraseña de su cuenta. Para crear una nueva contraseña, haga clic en el botón a continuación:</p>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetUrl}" style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">Restablecer Contraseña</a>
        </div>
        
        <p>Si no solicitó un restablecimiento de contraseña, puede ignorar este correo electrónico y su contraseña permanecerá sin cambios.</p>
        
        <p>Por razones de seguridad, este enlace expirará en 1 hora.</p>
      </div>
      
      <div style="text-align: center; margin-top: 30px; color: #6b7280; font-size: 14px;">
        <p>Este es un correo automático, por favor no responda a este mensaje.</p>
        <p>&copy; ${new Date().getFullYear()} Sociedad Roncesvalles. Todos los derechos reservados.</p>
      </div>
    </div>
  `;

  return sendEmail({ to: email, subject, html });
}

/**
 * Send a feedback notification email to the admin
 */
export async function sendFeedbackEmail(feedback: any): Promise<boolean> {
  const adminEmail = 'martencarlos@gmail.com';
  const subject = `Nuevo feedback: ${getFeedbackTypeLabel(feedback.type)}`;
  
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333;">
      <div style="text-align: center; margin-bottom: 30px;">
        <h1 style="color: #2563eb; margin-bottom: 10px;">Sociedad Roncesvalles</h1>
        <p style="font-size: 16px;">Sistema de Reserva de Espacios Comunitarios</p>
      </div>
      
      <div style="background-color: #f9fafb; padding: 20px; border-radius: 10px; border: 1px solid #e5e7eb;">
        <h2 style="margin-top: 0; color: #2563eb;">Nuevo Feedback Recibido</h2>
        
        <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
          <tr>
            <td style="padding: 10px; border-bottom: 1px solid #e5e7eb; font-weight: bold; width: 40%;">Tipo:</td>
            <td style="padding: 10px; border-bottom: 1px solid #e5e7eb;">${getFeedbackTypeLabel(feedback.type)}</td>
          </tr>
          <tr>
            <td style="padding: 10px; border-bottom: 1px solid #e5e7eb; font-weight: bold;">Nombre:</td>
            <td style="padding: 10px; border-bottom: 1px solid #e5e7eb;">${feedback.name}</td>
          </tr>
          <tr>
            <td style="padding: 10px; border-bottom: 1px solid #e5e7eb; font-weight: bold;">Email:</td>
            <td style="padding: 10px; border-bottom: 1px solid #e5e7eb;">${feedback.email}</td>
          </tr>
          ${feedback.apartmentNumber ? `
          <tr>
            <td style="padding: 10px; border-bottom: 1px solid #e5e7eb; font-weight: bold;">Apartamento:</td>
            <td style="padding: 10px; border-bottom: 1px solid #e5e7eb;">#${feedback.apartmentNumber}</td>
          </tr>
          ` : ''}
          <tr>
            <td style="padding: 10px; border-bottom: 1px solid #e5e7eb; font-weight: bold;">Fecha:</td>
            <td style="padding: 10px; border-bottom: 1px solid #e5e7eb;">${new Date(feedback.createdAt).toLocaleString('es-ES')}</td>
          </tr>
        </table>
        
        <div style="background-color: #ffffff; padding: 15px; border-radius: 8px; border: 1px solid #e5e7eb;">
          <h3 style="font-size: 16px; margin-top: 0; margin-bottom: 10px;">Contenido del Feedback:</h3>
          <p style="white-space: pre-line; margin: 0;">${feedback.content}</p>
        </div>
      </div>
      
      <div style="margin-top: 20px; text-align: center;">
        <p style="margin-bottom: 5px;">Puede gestionar este feedback en el panel de administración:</p>
        <a href="${process.env.NEXTAUTH_URL}/admin/feedback" style="background-color: #2563eb; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">Ver en el Panel</a>
      </div>
      
      <div style="text-align: center; margin-top: 30px; color: #6b7280; font-size: 14px;">
        <p>Este es un mensaje automático enviado desde el Sistema de Reserva de Espacios Comunitarios.</p>
        <p>&copy; ${new Date().getFullYear()} Sociedad Roncesvalles. Todos los derechos reservados.</p>
      </div>
    </div>
  `;
  
  return sendEmail({
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