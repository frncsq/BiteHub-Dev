import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import pkg from 'pg';
const { Pool } = pkg;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create a direct connection bypassing .env
const tempPool = new Pool({
    host: 'localhost',
    user: 'postgres',
    password: 'password', // Replace with your postgres password if different
    database: 'postgres', // Most default installations have a 'postgres' db
    port: 5432,
});

async function setupDatabase() {
  console.log('Starting automated database setup...');
  console.log('Using default local PostgreSQL credentials: postgres / password');
  
  try {
    // Read the schema.sql file
    const schemaPath = path.join(__dirname, 'schema.sql');
    const schemaSql = fs.readFileSync(schemaPath, 'utf8');
    
    console.log('Executing schema.sql...');
    await tempPool.query(schemaSql);
    
    console.log('✅ Database schema loaded successfully!');
    console.log('All tables and fields have been created.');
  } catch (err) {
    if (err.message.includes('password authentication failed')) {
       console.error('\n❌ Authentication failed! Your postgres password is not "password".');
       console.error('Please open server/setup-db.js and change the password on line 13 to your actual postgres password, then run this command again.');
    } else {
       console.error('❌ Error executing schema:', err.message);
    }
  } finally {
    await tempPool.end();
  }
}

setupDatabase();
