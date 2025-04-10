// src/lib/auth.ts 
import { AuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { compare } from "bcryptjs";
import connectDB from "./mongodb";
import User, { IUser } from "@/models/User";
import LoginEvent from "@/models/LoginEvent"; 
import { UAParser } from 'ua-parser-js'

// Helper function to determine device type
function getDeviceType(userAgent: string): 'desktop' | 'mobile' | 'tablet' {
  const parser = new UAParser(userAgent);
  const device = parser.getDevice();
  
  if (device.type === 'tablet') return 'tablet';
  if (device.type === 'mobile') return 'mobile';
  return 'desktop';
}

// Helper function to get browser info
function getBrowserInfo(userAgent: string): string {
  const parser = new UAParser(userAgent);
  const browser = parser.getBrowser();
  return `${browser.name || 'Unknown'} ${browser.version || ''}`.trim();
}

// Function to track login events
async function trackLoginEvent(
  userId: string, 
  success: boolean, 
  req: any, 
  failureReason?: string
) {
  try {
    const userAgent = req.headers['user-agent'] || '';
    const ipAddress = 
      req.headers['x-forwarded-for']?.split(',')[0] || 
      req.connection.remoteAddress || 
      '0.0.0.0';
    
    // Parse user agent to get device info
    const parser = new UAParser(userAgent);
    const device = parser.getDevice();
    const deviceModel = device.model || 'Unknown device';
    const deviceVendor = device.vendor || '';
    
    // Create device info string
    const deviceInfo = deviceVendor 
      ? `${deviceVendor} ${deviceModel}`
      : deviceModel;
    
    // Create login event
    const loginEvent = new LoginEvent({
      userId,
      timestamp: new Date(),
      ipAddress,
      userAgent,
      browser: getBrowserInfo(userAgent),
      deviceType: getDeviceType(userAgent),
      location: deviceInfo, // Use device info instead of location
      success,
      failureReason,
    });
    
    await loginEvent.save();
  } catch (error) {
    console.error('Error tracking login event:', error);
    // Don't throw - we don't want to interrupt the login process if tracking fails
  }
}

export const authOptions: AuthOptions = {
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials, req) {
        if (!credentials?.email || !credentials?.password) {
          await trackLoginEvent('unknown', false, req, 'Missing credentials');
          throw new Error("Invalid credentials");
        }

        await connectDB();

        const user = await User.findOne({ email: credentials.email.toLowerCase() });

        if (!user || !user.hashedPassword) {
          await trackLoginEvent('unknown', false, req, 'User not found');
          throw new Error("Invalid credentials");
        }

        const isPasswordMatch = await compare(
          credentials.password,
          user.hashedPassword
        );

        if (!isPasswordMatch) {
          await trackLoginEvent(user._id.toString(), false, req, 'Incorrect password');
          throw new Error("Invalid credentials");
        }

        // Track successful login
        await trackLoginEvent(user._id.toString(), true, req);

        return {
          id: user._id.toString(),
          email: user.email,
          name: user.name,
          apartmentNumber: user.apartmentNumber,
          role: user.role,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      // Initial sign in
      if (user) {
        token.id = user.id;
        token.apartmentNumber = user.apartmentNumber;
        token.role = user.role;
      }
      
      // Handle session updates
      if (trigger === 'update' && session) {
        // Update the token with new session data
        if (session.user?.name) {
          token.name = session.user.name;
        }
        // You can add other fields here if they need to be updated
      }
      
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.name = token.name as string;
        session.user.apartmentNumber = token.apartmentNumber as number | undefined;
        session.user.role = token.role as string;
      }
      return session;
    },
  },
  pages: {
    signIn: "/auth/signin",
    error: "/auth/error",
  },
  session: {
    strategy: "jwt",
  },
  secret: process.env.NEXTAUTH_SECRET,
};