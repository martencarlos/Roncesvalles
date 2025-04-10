// src/app/api/dashboard/route.ts
import { NextRequest, NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import User from "@/models/User";
import Booking from "@/models/Booking";
import { authenticate } from "@/lib/auth-utils";
import { format, subMonths, startOfMonth, endOfMonth } from "date-fns";

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
    
    // Fetch user statistics
    const userStats = await getUserStats();
    
    // Fetch booking statistics
    const bookingStats = await getBookingStats();
    
    // Fetch login statistics
    const loginStatsResponse = await fetch(new URL('/api/dashboard/login-stats', req.url).toString(), {
      headers: {
        cookie: req.headers.get('cookie') || '' // Forward cookies for auth
      }
    });
    
    const loginStats = await loginStatsResponse.json();
    
    // Combine all statistics
    return NextResponse.json({
      userStats: {
        ...userStats,
        ...loginStats // Add login stats to user stats
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

async function getUserStats() {
  // Get total users
  const totalUsers = await User.countDocuments();
  
  // Get users by role
  const usersByRole = {
    user: await User.countDocuments({ role: "user" }),
    admin: await User.countDocuments({ role: "admin" }),
    it_admin: await User.countDocuments({ role: "it_admin" }),
    manager: await User.countDocuments({ role: "manager" })
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
  
  // Password reset data (simulated)
  const passwordResets = 14;
  const passwordResetTrends = [
    { month: "Ene", resets: 0 },
    { month: "Feb", resets: 1 },
    { month: "Mar", resets: 0 },
    { month: "Abr", resets: 2 },
    { month: "May", resets: 1 },
    { month: "Jun", resets: 0 },
    { month: "Jul", resets: 0 },
    { month: "Ago", resets: 0 },
    { month: "Sep", resets: 4 },
    { month: "Oct", resets: 3 },
    { month: "Nov", resets: 2 },
    { month: "Dic", resets: 1 }
  ];
  
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
  
  // Simulated device usage data
  // In a real implementation, you would track this from login events
  const sessionsByDevice = {
    desktop: 65,
    mobile: 30,
    tablet: 5
  };
  
  // Simulated geographic distribution
  // In a real implementation, you would track this from login events or IP geolocation
  const geographicDistribution = [
    { location: "España", count: 78 },
    { location: "Francia", count: 5 },
    { location: "Reino Unido", count: 3 },
    { location: "Estados Unidos", count: 2 },
    { location: "Otros", count: 2 }
  ];
  
  
  // Return user statistics
  return {
    totalUsers,
    usersByRole,
    newUsersThisMonth,
    newUsersTrend,
    passwordResets,
    passwordResetTrends,
    mostActiveUsers: mostActiveUsersList,
    sessionsByDevice,
    geographicDistribution
  };
}

async function getBookingStats() {
  // Get total bookings
  const totalBookings = await Booking.countDocuments();
  
  // Get bookings by status
  const totalConfirmed = await Booking.countDocuments({ status: "confirmed" });
  const totalPending = await Booking.countDocuments({ status: "pending" });
  const totalCancelled = await Booking.countDocuments({ status: "cancelled" });
  
  // Get bookings by month for the last 12 months
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
  
  // Simulated booking modifications and cancellations
  // In a real implementation, you would track these events
  const bookingModifications = Math.floor(totalBookings * 0.12); // About 12% of bookings are modified
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
  const brasaCount = await Booking.countDocuments({ reservaBrasa: true });
  
  const additionalServices = {
    prepararFuego: fuegoCount,
    reservaHorno: hornoCount,
    reservaBrasa: brasaCount
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