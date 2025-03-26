import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";

// Database connection
if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is not set");
}

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
});

export const db = drizzle(pool);