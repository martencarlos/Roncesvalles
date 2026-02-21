export const dynamic = 'force-dynamic';
// src/app/api/dashboard/route.ts
import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import User from "@/models/User";
import Booking from "@/models/Booking";
import { authenticate } from "@/lib/auth-utils";
import LoginEvent from "@/models/LoginEvent";
import { format, subMonths, startOfMonth, endOfMonth } from "date-fns";
import ActivityLog from "@/models/ActivityLog";
import { PasswordReset } from "@/models/PasswordReset";

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
    
    // Run these major operations in parallel
    const [userStats, bookingStats, loginStats] = await Promise.all([
      getUserStats(),
      getBookingStats(),
      getLoginStats() // Direct function call instead of nested API request
    ]);
    
    return NextResponse.json({
      userStats: {
        ...userStats,
        loginActivity: loginStats.loginActivity 
      },
      bookingStats
    });
    
  } catch (error) {
    console.error('Error in dashboard API:', error);
    return NextResponse.json(
      { error: "Failed to fetch dashboard data" },
      { status: 500 }
    );
  }
}

// New function to get login stats directly instead of via API call
async function getLoginStats() {
  try {
    // Calculate monthly login counts for the past 12 months
    const today = new Date();
    const twelveMonthsAgo = new Date();
    twelveMonthsAgo.setMonth(today.getMonth() - 11);
    twelveMonthsAgo.setDate(1);
    twelveMonthsAgo.setHours(0, 0, 0, 0);
    
    // Run these operations in parallel
    const [monthlyLoginData, userLoginCounts, totalLogins] = await Promise.all([
      // Get monthly login counts
      LoginEvent.aggregate([
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
      ]),
      
      // Get logins per user
      LoginEvent.aggregate([
        { $match: { success: true } },
        { 
          $group: {
            _id: "$userId",
            count: { $sum: 1 }
          }
        },
        { $sort: { count: -1 } },
        { $limit: 50 } // Get top 50 users
      ]),
      
      // Calculate total logins
      LoginEvent.countDocuments({ success: true })
    ]);
    
    // Get user details for the login counts - OPTIMIZED VERSION
    const userIds = userLoginCounts.map(entry => entry._id);
    const users = await User.find({ _id: { $in: userIds } }, {
      _id: 1,
      name: 1,
      apartmentNumber: 1
    });
    
    // Create a map for quick user lookup
    const userMap = new Map();
    users.forEach(user => {
      userMap.set(user._id.toString(), user);
    });
    
    // Map user details to login counts using the map for faster lookups
    const loginsByUser = userLoginCounts.map(loginEntry => {
      const userDetails = userMap.get(loginEntry._id);
      return {
        userId: loginEntry._id,
        name: userDetails?.name || "Usuario desconocido",
        apartmentNumber: userDetails?.apartmentNumber,
        count: loginEntry.count
      };
    });
    
    // OPTIMIZED RECENT LOGINS - Get user data in bulk instead of per login
    // Get recent logins
    const recentLogins = await LoginEvent.find({ success: true })
      .sort({ timestamp: -1 })
      .limit(100);
    
    // Extract unique user IDs from recent logins
    const recentUserIds = [...new Set(recentLogins.map(login => login.userId))];
    
    // Fetch all needed users in a single query
    const recentUsers = await User.find({ _id: { $in: recentUserIds } }, {
      _id: 1,
      name: 1,
      apartmentNumber: 1
    });
    
    // Create a map for quick lookups
    const recentUserMap = new Map();
    recentUsers.forEach(user => {
      recentUserMap.set(user._id.toString(), user);
    });
    
    // Map user data to logins without additional queries
    const processedRecentLogins = recentLogins.map(login => {
      const user = recentUserMap.get(login.userId);
      
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
    });
    
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
    
    // Return login statistics
    return {
      loginActivity: {
        totalLogins,
        loginsByUser,
        recentLogins: processedRecentLogins,
        loginsByMonth: loginsByMonth.map(month => ({
          month: `${month.month}`,
          count: month.count
        }))
      }
    };
    
  } catch (error) {
    console.error('Error getting login statistics:', error);
    throw error;
  }
}


async function getUserStats() {
  // Get total users
  const totalUsers = await User.countDocuments();
  
  // Get users by role
  const usersByRole = {
    user: await User.countDocuments({ role: "user" }),
    admin: await User.countDocuments({ role: "admin" }),
    it_admin: await User.countDocuments({ role: "it_admin" })
  };
  
  // Get new users this month
  const now = new Date();
  const startOfCurrentMonth = startOfMonth(now);
  const newUsersThisMonth = await User.countDocuments({
    createdAt: { $gte: startOfCurrentMonth }
  });
  
  // Get new users trend for the last 12 months
  const newUsersTrend = [];
  for (let i = 11; i >= 0; i--) {
    const monthStart = startOfMonth(subMonths(now, i));
    const monthEnd = endOfMonth(subMonths(now, i));
    
    const count = await User.countDocuments({
      createdAt: {
        $gte: monthStart,
        $lte: monthEnd
      }
    });
    
    newUsersTrend.push(count);
  }
  
  // Get real device usage statistics from LoginEvent
  const deviceUsageStats = await LoginEvent.aggregate([
    { $match: { success: true } },
    {
      $group: {
        _id: "$deviceType",
        count: { $sum: 1 }
      }
    }
  ]);
  
  // Calculate percentages for device usage
  const totalDeviceCount = deviceUsageStats.reduce((sum, item) => sum + item.count, 0);
  const sessionsByDevice = {
    desktop: 0,
    mobile: 0,
    tablet: 0
  };
  
  if (totalDeviceCount > 0) {
    deviceUsageStats.forEach(item => {
      if (item._id in sessionsByDevice) {
        const deviceType = item._id as keyof typeof sessionsByDevice;
        sessionsByDevice[deviceType] = Math.round((item.count / totalDeviceCount) * 100);
      }
    });
  }
  
  // Get total password resets count - updated to count all resets regardless of status
  const totalPasswordResets = await PasswordReset.countDocuments();
  
  // Get password reset trends for the last 12 months - updated to include completed resets
  const monthNames = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
  const passwordResetTrends = [];
  
  for (let i = 11; i >= 0; i--) {
    const monthStart = startOfMonth(subMonths(now, i));
    const monthEnd = endOfMonth(subMonths(now, i));
    const monthIndex = (now.getMonth() - i + 12) % 12; // Calculate which month this is
    
    const count = await PasswordReset.countDocuments({
      createdAt: {
        $gte: monthStart,
        $lte: monthEnd
      }
    });
    
    passwordResetTrends.push({
      month: monthNames[monthIndex],
      resets: count
    });
  }
  
  // Get most active users based on bookings
  const bookingsPerUser = await Booking.aggregate([
    {
      $group: {
        _id: "$userId",
        bookings: { $sum: 1 }
      }
    },
    { $sort: { bookings: -1 } },
    { $limit: 6 }
  ]);
  
  // Get user details for the most active users
  const mostActiveUserIds = bookingsPerUser.map(user => user._id);
  const mostActiveUsers = await User.find(
    { _id: { $in: mostActiveUserIds } },
    { name: 1, apartmentNumber: 1 }
  );
  
  // Map booking counts to user details
  const mostActiveUsersList = mostActiveUsers.map(user => {
    const bookingCount = bookingsPerUser.find(
      b => b._id.toString() === user._id.toString()
    );
    return {
      name: user.name,
      apartmentNumber: user.apartmentNumber,
      actions: bookingCount ? bookingCount.bookings : 0
    };
  }).sort((a, b) => b.actions - a.actions);
  
  // Get actual geographic distribution from LoginEvent
  const geographicData = await LoginEvent.aggregate([
    { $match: { success: true } },
    {
      $group: {
        _id: "$location",
        count: { $sum: 1 }
      }
    },
    { $sort: { count: -1 } },
    { $limit: 5 }
  ]);
  
  // Transform geographic data to the required format
  const geographicDistribution = geographicData.map(item => ({
    location: item._id || "Desconocido",
    count: item.count
  }));
  
  // Add "Otros" category if we have more than 5 locations
  const totalLogins = await LoginEvent.countDocuments({ success: true });
  const topLocationsCount = geographicDistribution.reduce((sum, item) => sum + item.count, 0);
  
  if (topLocationsCount < totalLogins) {
    geographicDistribution.push({
      location: "Otros",
      count: totalLogins - topLocationsCount
    });
  }
  
  // Return user statistics
  return {
    totalUsers,
    usersByRole,
    newUsersThisMonth,
    newUsersTrend,
    passwordResets: totalPasswordResets,
    passwordResetTrends,
    mostActiveUsers: mostActiveUsersList,
    sessionsByDevice,
    geographicDistribution
  };
}

// Update the getBookingStats function to track cancellations from activity logs
async function getBookingStats() {
  // Existing code for basic stats
  const totalBookings = await Booking.countDocuments();
  const totalConfirmed = await Booking.countDocuments({ status: "confirmed" });
  const totalPending = await Booking.countDocuments({ status: "pending" });
  
  // For cancelled bookings, get both the ones with cancelled status and count from activity logs
  const totalCancelledStatus = await Booking.countDocuments({ status: "cancelled" });
  
  // Get cancellations from activity logs (this captures the deleted bookings)
  const cancellationLogs = await ActivityLog.countDocuments({ action: "delete" });
  
  // Total cancelled is the sum of currently cancelled bookings plus deleted bookings
  const totalCancelled = totalCancelledStatus + cancellationLogs;
  
  // The rest of your existing code...
  const now = new Date();
  const bookingsByMonth = [];
  const monthNames = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
  
  for (let i = 11; i >= 0; i--) {
    const monthStart = startOfMonth(subMonths(now, i));
    const monthEnd = endOfMonth(subMonths(now, i));
    
    const count = await Booking.countDocuments({
      date: {
        $gte: monthStart,
        $lte: monthEnd
      }
    });
    
    const monthIndex = (now.getMonth() - i + 12) % 12;
    bookingsByMonth.push({
      month: monthNames[monthIndex],
      count
    });
  }
  
  // Get bookings by meal type
  const lunchBookings = await Booking.countDocuments({ mealType: "lunch" });
  const dinnerBookings = await Booking.countDocuments({ mealType: "dinner" });
  
  const bookingsByType = {
    lunch: lunchBookings,
    dinner: dinnerBookings
  };
  
  // Get average attendees
  const attendeesData = await Booking.aggregate([
    {
      $match: { status: "confirmed", finalAttendees: { $exists: true } }
    },
    {
      $group: {
        _id: null,
        totalAttendees: { $sum: "$finalAttendees" },
        count: { $sum: 1 }
      }
    }
  ]);
  
  const averageAttendees = attendeesData.length > 0
    ? attendeesData[0].totalAttendees / attendeesData[0].count
    : 0;
  
  // Get most booked apartments
  const bookingsPerApartment = await Booking.aggregate([
    {
      $group: {
        _id: "$apartmentNumber",
        bookings: { $sum: 1 }
      }
    },
    { $sort: { bookings: -1 } },
    { $limit: 5 }
  ]);
  
  const mostBookedApartments = bookingsPerApartment.map(apt => ({
    apartmentNumber: apt._id,
    bookings: apt.bookings
  }));
  
  // Get booking modifications from activity logs
  const bookingModifications = await ActivityLog.countDocuments({ action: "update" });
  
  // Cancellations are now properly tracked
  const bookingCancellations = totalCancelled;
  
  // Get most used tables
  const tableData = await Booking.aggregate([
    { $unwind: "$tables" },
    {
      $group: {
        _id: "$tables",
        count: { $sum: 1 }
      }
    },
    { $sort: { count: -1 } }
  ]);
  
  const mostUsedTables = tableData.map(table => ({
    tableNumber: table._id,
    count: table.count
  }));
  
  // Get additional services usage
  const fuegoCount = await Booking.countDocuments({ prepararFuego: true });
  const hornoCount = await Booking.countDocuments({ reservaHorno: true });
  
  const additionalServices = {
    prepararFuego: fuegoCount,
    reservaHorno: hornoCount
  };
  
  // Return booking statistics
  return {
    totalBookings,
    totalConfirmed,
    totalPending,
    totalCancelled,
    bookingsByMonth,
    bookingsByType,
    averageAttendees,
    mostBookedApartments,
    bookingModifications,
    bookingCancellations,
    mostUsedTables,
    additionalServices
  };
}