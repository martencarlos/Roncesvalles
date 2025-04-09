// src/app/api/dashboard/route.ts
import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import Booking from '@/models/Booking';
import ActivityLog from '@/models/ActivityLog';
import { authenticate } from '@/lib/auth-utils';
import { startOfMonth, subMonths, format, parseISO } from 'date-fns';

export async function GET(req: NextRequest) {
  try {
    // Authenticate user
    const currentUser = await authenticate(req, ["it_admin"]);
    
    if (!currentUser) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }
    
    await connectDB();
    
    // Get current date and first day of the month
    const now = new Date();
    const currentMonth = startOfMonth(now);
    
    // 1. User statistics
    const totalUsers = await User.countDocuments();
    
    const usersByRole = await User.aggregate([
      { $group: { _id: "$role", count: { $sum: 1 } } }
    ]);
    
    const roleCount = {
      user: 0,
      admin: 0,
      it_admin: 0,
      manager: 0
    };
    
    usersByRole.forEach((role: any) => {
      if (role._id in roleCount) {
        roleCount[role._id as keyof typeof roleCount] = role.count;
      }
    });
    
    // New users registered this month
    const newUsersThisMonth = await User.countDocuments({
      createdAt: { $gte: currentMonth }
    });
    
    // New users trend for the last 12 months
    const userTrend = [];
    for (let i = 0; i < 12; i++) {
      const monthStart = startOfMonth(subMonths(now, i));
      const nextMonth = startOfMonth(subMonths(now, i - 1));
      
      const count = await User.countDocuments({
        createdAt: {
          $gte: monthStart,
          $lt: nextMonth
        }
      });
      
      userTrend.unshift(count);
    }
    
    // Count password reset requests
    const passwordResets = await ActivityLog.countDocuments({
      action: { $in: ["user_update"] },
      details: { $regex: "contraseña", $options: "i" }
    });
    
    // Most active users
    const mostActiveUsers = await ActivityLog.aggregate([
      { $group: { _id: "$userId", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 }
    ]);
    
    // Get user details for the most active users
    const activeUserDetails = [];
    for (const user of mostActiveUsers) {
      const userDetails = await User.findById(user._id).select('name apartmentNumber');
      if (userDetails) {
        activeUserDetails.push({
          name: userDetails.name,
          apartmentNumber: userDetails.apartmentNumber,
          actions: user.count
        });
      }
    }
    
    // 2. Booking statistics
    const totalBookings = await Booking.countDocuments();
    const totalConfirmed = await Booking.countDocuments({ status: 'confirmed' });
    const totalPending = await Booking.countDocuments({ status: 'pending' });
    const totalCancelled = await Booking.countDocuments({ status: 'cancelled' });
    
    // Average attendees for confirmed bookings
    const attendeesStats = await Booking.aggregate([
      { $match: { status: 'confirmed', finalAttendees: { $exists: true, $ne: null } } },
      { $group: { _id: null, average: { $avg: "$finalAttendees" } } }
    ]);
    
    const averageAttendees = attendeesStats.length > 0 ? attendeesStats[0].average : 0;
    
    // Bookings by month for the last 12 months
    const bookingsByMonth = [];
    const monthNames = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
    
    for (let i = 0; i < 12; i++) {
      const monthStart = startOfMonth(subMonths(now, i));
      const nextMonth = startOfMonth(subMonths(now, i - 1));
      const monthIndex = monthStart.getMonth();
      
      const count = await Booking.countDocuments({
        date: {
          $gte: monthStart,
          $lt: nextMonth
        }
      });
      
      bookingsByMonth.unshift({
        month: monthNames[monthIndex],
        count: count
      });
    }
    
    // Bookings by type (lunch vs dinner)
    const lunchBookings = await Booking.countDocuments({ mealType: 'lunch' });
    const dinnerBookings = await Booking.countDocuments({ mealType: 'dinner' });
    
    // Most booked apartments
    const mostBookedApartments = await Booking.aggregate([
      { $group: { _id: "$apartmentNumber", bookings: { $sum: 1 } } },
      { $sort: { bookings: -1 } },
      { $limit: 5 }
    ]);
    
    // Format the most booked apartments
    const formattedMostBookedApartments = mostBookedApartments.map((apt) => ({
      apartmentNumber: apt._id,
      bookings: apt.bookings
    }));
    
    // Most used tables
    const tableCounts = await Booking.aggregate([
      { $unwind: "$tables" },
      { $group: { _id: "$tables", count: { $sum: 1 } } },
      { $sort: { _id: 1 } }
    ]);
    
    const mostUsedTables = tableCounts.map((table) => ({
      tableNumber: table._id,
      count: table.count
    }));
    
    // Count booking modifications and cancellations from activity logs
    const bookingModifications = await ActivityLog.countDocuments({ action: 'update' });
    const bookingCancellations = await ActivityLog.countDocuments({ action: 'delete' });
    
    // Count usage of additional services
    const prepararFuegoCount = await Booking.countDocuments({ prepararFuego: true });
    const reservaHornoCount = await Booking.countDocuments({ reservaHorno: true });
    const reservaBrasaCount = await Booking.countDocuments({ reservaBrasa: true });
    
    // Get password reset trends by month
const passwordResetTrends = [];
for (let i = 0; i < 12; i++) {
  const monthStart = startOfMonth(subMonths(now, i));
  const nextMonth = startOfMonth(subMonths(now, i - 1));
  const monthIndex = monthStart.getMonth();
  
  const count = await ActivityLog.countDocuments({
    action: "user_update",
    details: { $regex: "contraseña", $options: "i" },
    timestamp: {
      $gte: monthStart,
      $lt: nextMonth
    }
  });
  
  passwordResetTrends.unshift({
    month: monthNames[monthIndex],
    resets: count
  });
}

    // Create the response with all statistics
    const dashboardData = {
      userStats: {
        totalUsers,
        usersByRole: roleCount,
        newUsersThisMonth,
        newUsersTrend: userTrend,
        passwordResets,
        passwordResetTrends,
        mostActiveUsers: activeUserDetails,
        // Simulated data for these metrics since they're not tracked in the current system
        sessionsByDevice: {
          desktop: 65,
          mobile: 28,
          tablet: 7
        },
        geographicDistribution: [
          { location: "Madrid", count: Math.round(totalUsers * 0.8) },
          { location: "Barcelona", count: Math.round(totalUsers * 0.15) },
          { location: "Otros", count: Math.round(totalUsers * 0.05) }
        ]
      },
      bookingStats: {
        totalBookings,
        totalConfirmed,
        totalPending,
        totalCancelled,
        bookingsByMonth,
        bookingsByType: {
          lunch: lunchBookings,
          dinner: dinnerBookings
        },
        averageAttendees,
        mostBookedApartments: formattedMostBookedApartments,
        bookingModifications,
        bookingCancellations,
        mostUsedTables,
        additionalServices: {
          prepararFuego: prepararFuegoCount,
          reservaHorno: reservaHornoCount,
          reservaBrasa: reservaBrasaCount
        }
      }
    };
    
    return NextResponse.json(dashboardData);
    
  } catch (error: any) {
    console.error("Dashboard API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch dashboard data" },
      { status: 500 }
    );
  }
}