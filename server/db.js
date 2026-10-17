
import { Pool } from "pg";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, ".env") });

let newPool;

if (process.env.NODE_ENV === "development") {
  // Local development database
  newPool = new Pool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: Number(process.env.DB_PORT || 5432),
    connectionTimeoutMillis: 5000,
    statement_timeout: 10000,
  });
} else {
  // Production database (Neon)
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is required in production");
  }

  newPool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false,
    },
    connectionTimeoutMillis: 5000,
    statement_timeout: 10000,
  });
}

export const pool = newPool;
