import { Pool } from "pg";
import dotenv from "dotenv"
dotenv.config();

let newPool;

if (process.env.NODE_ENV === 'development') {
    newPool = new Pool({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
        port: process.env.DB_PORT,
    });
}
else {
    newPool = new Pool({
        ssl: {
            rejectUnauthorized: false,
        },
        connectionString: `postgres://${process.env.DB_USER}:${process.env.DB_PASSWORD}@${process.env.DB_HOST}:5432/${process.env.DB_NAME}?options=project=${process.env.ENDPOINT_ID}`,
    })
}

export const pool = newPool;