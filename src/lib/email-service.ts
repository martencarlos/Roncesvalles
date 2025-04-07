// src/lib/email-service.ts
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