import mongoose from "mongoose";

const DEFAULT_MAX_POOL_SIZE = 10;
const DEFAULT_SERVER_SELECTION_TIMEOUT_MS = 5_000;
const DEFAULT_SOCKET_TIMEOUT_MS = 45_000;

type MongooseCache = {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
};

declare global {
  var mongooseCache: MongooseCache | undefined;
}

const cached: MongooseCache = globalThis.mongooseCache ?? {
  conn: null,
  promise: null,
};

globalThis.mongooseCache = cached;

export async function connectToDatabase(): Promise<typeof mongoose> {
  if (cached.conn) {
    return cached.conn;
  }

  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error("MONGODB_URI is not configured");
  }

  if (!cached.promise) {
    cached.promise = mongoose.connect(uri, {
      bufferCommands: false,
      maxIdleTimeMS: 30_000,
      maxPoolSize: DEFAULT_MAX_POOL_SIZE,
      minPoolSize: 0,
      serverSelectionTimeoutMS: DEFAULT_SERVER_SELECTION_TIMEOUT_MS,
      socketTimeoutMS: DEFAULT_SOCKET_TIMEOUT_MS,
    });
  }

  try {
    cached.conn = await cached.promise;
  } catch (error) {
    cached.promise = null;
    throw error;
  }

  return cached.conn;
}