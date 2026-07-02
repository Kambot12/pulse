import mongoose from "mongoose";

/**
 * Cached MongoDB connection so Next.js hot-reload / serverless invocations
 * reuse a single pooled connection instead of opening one per request.
 */
const MONGODB_URI = process.env.MONGODB_URI;

interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

declare global {
  // eslint-disable-next-line no-var
  var _mongooseCache: MongooseCache | undefined;
}

const cache: MongooseCache = global._mongooseCache ?? { conn: null, promise: null };
global._mongooseCache = cache;

export async function dbConnect(): Promise<typeof mongoose> {
  if (cache.conn) return cache.conn;

  if (!MONGODB_URI) {
    throw new Error(
      "MONGODB_URI is not set. Add it to .env.local (MongoDB Atlas connection string)."
    );
  }

  if (!cache.promise) {
    cache.promise = mongoose.connect(MONGODB_URI, {
      bufferCommands: false,
      dbName: process.env.MONGODB_DB || "pulse",
    });
  }

  cache.conn = await cache.promise;
  return cache.conn;
}
