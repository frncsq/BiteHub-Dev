
import { Pool } from "pg";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, ".env") });

const baseConfig = {
  connectionTimeoutMillis: 5000,
  statement_timeout: 10000,
};

// Prefer an explicit connection string whenever one is provided (Neon / Render /
// Supabase / etc.). This is independent of NODE_ENV so a stray NODE_ENV value
// can't silently switch the app onto a localhost database.
const connectionString = (process.env.DATABASE_URL || "").trim();
const isLocalHost = /(localhost|127\.0\.0\.1)/i.test(connectionString);

let newPool;

if (connectionString) {
  if (!/^postgres(ql)?:\/\//i.test(connectionString)) {
    throw new Error(
      `DATABASE_URL is invalid. It must be a full Postgres URL like ` +
        `postgresql://user:password@host:5432/dbname (got: "${connectionString.slice(0, 40)}").`
    );
  }

  newPool = new Pool({
    connectionString,
    ssl: isLocalHost ? false : { rejectUnauthorized: false },
    ...baseConfig,
  });
  console.log(`🔌 Database: using DATABASE_URL (${new URL(connectionString).host})`);
} else {
  newPool = new Pool({
    host: process.env.DB_HOST || "localhost",
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: Number(process.env.DB_PORT || 5432),
    ...baseConfig,
  });
  console.log(`🔌 Database: using DB_* vars (${process.env.DB_HOST || "localhost"})`);
}

export const pool = newPool;
