export const dynamic = 'force-dynamic';
// src/app/api/dashboard/login-stats/route.ts
import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import LoginEvent from "@/models/LoginEvent";
import User from "@/models/User";
import { authenticate } from "@/lib/auth-utils";

export async function GET(req: NextRequest) {
  try {
    // Authenticate the request
    const user = await authenticate(req, ["it_admin"]);
    
    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }
    
    await connectDB();
    
    // Calculate monthly login counts for the past 12 months
    const today = new Date();
    const twelveMonthsAgo = new Date();
    twelveMonthsAgo.setMonth(today.getMonth() - 11);
    twelveMonthsAgo.setDate(1);
    twelveMonthsAgo.setHours(0, 0, 0, 0);
    
    // Get monthly login counts
    const monthlyLoginData = await LoginEvent.aggregate([
      { 
        $match: { 
          success: true,
          timestamp: { $gte: twelveMonthsAgo } 
        } 
      },
      {
        $group: {
          _id: { 
            year: { $year: "$timestamp" },
            month: { $month: "$timestamp" }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { "_id.year": 1, "_id.month": 1 } }
    ]);
    
    // Get logins per user
    const userLoginCounts = await LoginEvent.aggregate([
      { $match: { success: true } },
      { 
        $group: {
          _id: "$userId",
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } },
      { $limit: 50 } // Get top 50 users
    ]);
    
    console.log('User login counts from DB:', userLoginCounts);
    
    // Get user details for the login counts
    const userIds = userLoginCounts.map(entry => entry._id);
    const users = await User.find({ _id: { $in: userIds } }, {
      _id: 1,
      name: 1,
      apartmentNumber: 1
    });
    
    console.log('Users found:', users.length);
    
    // Map user details to login counts - improved with better error handling
    const loginsByUser = userLoginCounts.map(loginEntry => {
      const userDetails = users.find(u => u._id.toString() === loginEntry._id);
      return {
        userId: loginEntry._id,
        name: userDetails?.name || "Usuario desconocido",
        apartmentNumber: userDetails?.apartmentNumber,
        count: loginEntry.count
      };
    });
    
    console.log('Processed loginsByUser:', loginsByUser);
    
    // Get recent logins - simplified query to ensure it works
    const recentLogins = await LoginEvent.find({ success: true })
      .sort({ timestamp: -1 })
      .limit(100);
    
    // Now, manually map user information to logins
    const processedRecentLogins = await Promise.all(
      recentLogins.map(async (login) => {
        // Fetch the user info for each login
        const user = await User.findById(login.userId).select('name apartmentNumber');
        
        return {
          id: login._id,
          userId: login.userId,
          userName: user?.name || "Usuario desconocido",
          apartmentNumber: user?.apartmentNumber,
          timestamp: login.timestamp,
          deviceType: login.deviceType,
          browser: login.browser,
          location: login.location,
          ipAddress: login.ipAddress
        };
      })
    );
    
    console.log('Recent logins processed:', processedRecentLogins.length);
    
    // Transform monthly data into proper format
    const monthNames = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
    
    // Create array with all 12 months
    const loginsByMonth = Array(12).fill(0).map((_, index) => {
      const monthIndex = (today.getMonth() - 11 + index + 12) % 12;
      const year = today.getFullYear() - (monthIndex > today.getMonth() ? 1 : 0);
      
      return {
        month: monthNames[monthIndex],
        year,
        count: 0
      };
    });
    
    // Fill in actual data
    monthlyLoginData.forEach(item => {
      const monthIndex = item._id.month - 1; // MongoDB months are 1-12
      const year = item._id.year;
      
      // Find corresponding month in our array
      const targetIndex = loginsByMonth.findIndex(m => {
        return m.month === monthNames[monthIndex] && m.year === year;
      });
      
      if (targetIndex !== -1) {
        loginsByMonth[targetIndex].count = item.count;
      }
    });
    
    // Calculate total logins
    const totalLogins = await LoginEvent.countDocuments({ success: true });
    
    // Return login statistics
    return NextResponse.json({
      loginActivity: {
        totalLogins,
        loginsByUser,
        recentLogins: processedRecentLogins,
        loginsByMonth: loginsByMonth.map(month => ({
          month: `${month.month}`,
          count: month.count
        }))
      }
    });
    
  } catch (error) {
    console.error('Error getting login statistics:', error);
    return NextResponse.json(
      { error: "Failed to fetch login statistics" },
      { status: 500 }
    );
  }
}