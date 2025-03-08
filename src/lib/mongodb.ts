// src/lib/mongodb.ts
import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/community-space';

// Define our cache interface
interface MongooseConnection {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

// Declare global type extension
declare global {
  var mongoose: MongooseConnection | undefined;
}

// Initialize cache
let cached = global.mongoose || { conn: null, promise: null };

// If not in global, set it
if (!global.mongoose) {
  global.mongoose = cached;
}

async function connectDB() {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
    };

    cached.promise = mongoose.connect(MONGODB_URI, opts).then((mongoose) => {
      return mongoose;
    });
  }

  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    throw e;
  }

  return cached.conn;
}

export default connectDB;