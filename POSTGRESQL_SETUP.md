# PostgreSQL Setup Guide for BiteHub

## Current Status
- ✅ Node.js server running on `http://localhost:5000`
- ⚠️ Database unavailable - currently using session fallback mode
- 📝 PostgreSQL is installed locally

## Step 1: Check PostgreSQL Installation

```powershell
# Check if PostgreSQL is installed
psql --version

# Expected output: psql (PostgreSQL) 12.x or higher
```

## Step 2: Start PostgreSQL Server

### On Windows with Service
```powershell
# Check if PostgreSQL service is running
Get-Service | Select-String postgres

# If not running, start it:
Start-Service 'postgresql-x64-15'  # version number may vary
```

### Method to Find Your PostgreSQL Version
```powershell
# List all Windows services containing 'postgre'
Get-Service | Where-Object { $_.Name -like '*postgre*' } | Select-Object Name, Status
```

## Step 3: Connect to PostgreSQL

```powershell
# Connect as default PostgreSQL user
psql -U postgres

# If prompted for password, it's usually:
# - Windows integrated auth (no password needed)
# - Or 'postgres' if you set it during installation
```

## Step 4: Create Database

Once in psql prompt (you'll see `postgres=#`):

```sql
-- Create the BiteHub database
CREATE DATABASE bitehub_db;

-- Connect to it
\c bitehub_db

-- Verify connection
\conninfo
-- Output should show: You are connected to database "bitehub_db"
```

## Step 5: Create Database User (Optional but Recommended)

```sql
-- Create dedicated user for BiteHub app
CREATE USER bitehub_user WITH PASSWORD 'bitehub_password';

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE bitehub_db TO bitehub_user;
```

Then update `server/.env`:
```
DB_HOST=localhost
DB_PORT=5432
DB_USER=bitehub_user
DB_PASSWORD=bitehub_password
DB_NAME=bitehub_db
```

## Step 6: Apply Database Schema

In psql terminal (inside bitehub_db):

```sql
-- Apply schema directly
\i 'C:/Users/hpcor/OneDrive/Documents/BiteHub-Dev/server/schema.sql'

-- Or from Windows PowerShell:
psql -U postgres -d bitehub_db -f "c:\Users\hpcor\OneDrive\Documents\BiteHub-Dev\server\schema.sql"
```

## Step 7: Verify Schema Creation

```sql
-- List all tables
\dt

-- Expected output should show:
-- users, restaurants, menu_items, orders, order_items, cart, 
-- reviews, contact_messages, favorites, restaurant_favorites, 
-- deliveries, promo_codes, order_promo_usage

-- Verify users table
\d users

-- Verify restaurants table
\d restaurants
```

## Step 8: Test Connection from Node.js

```powershell
# Make sure .env file is correct in server directory
cat server\.env

# Should show:
# NODE_ENV=development
# DB_HOST=localhost
# DB_PORT=5432
# DB_USER=postgres (or bitehub_user)
# DB_PASSWORD=postgres (or bitehub_password)
# DB_NAME=bitehub_db
# PORT=5000
```

Still in PowerShell, start the server:

```powershell
cd "c:\Users\hpcor\OneDrive\Documents\BiteHub-Dev\server"
node index.js
```

✅ Success: You should see:
```
Server is running on http://localhost:5000
✅ Database connected
```

❌ If it still says "Database not available", check:
1. PostgreSQL service is running: `Get-Service | Select-String postgres`
2. Database exists: `psql -U postgres -l | Select-String bitehub_db`
3. Credentials in .env match your setup
4. Port 5432 is correct: `Test-NetConnection -ComputerName localhost -Port 5432`

## Step 9: Test Registration Endpoint

Once database is connected, test it:

```powershell
$body = @{
    businessName = "Test Pizza"
    businessAddress = "123 Main St"
    city = "Mumbai"
    province = "Maharashtra"
    ownerName = "Raj"
    ownerPhone = "9999999999"
    businessEmail = "pizza@test.com"
    username = "pizzatest"
    password = "Pass123"
} | ConvertTo-Json

Invoke-WebRequest -Uri "http://localhost:5000/api/owner/register" `
  -Method POST `
  -ContentType "application/json" `
  -Body $body
```

**In Database Mode** (expected response):
```json
{
  "success": true,
  "message": "Restaurant registered successfully",
  "user": {
    "id": 1,
    "business_name": "Test Pizza",
    "username": "pizzatest"
  }
}
```

**In Session Mode** (current behavior):
```json
{
  "success": true,
  "message": "Restaurant registered successfully (session mode - database unavailable)",
  "user": {
    "id": "rest_1234567890",
    "business_name": "Test Pizza",
    "username": "pizzatest"
  }
}
```

## Troubleshooting

### psql command not found
```powershell
# Add PostgreSQL to PATH temporarily
$env:PATH += ";C:\Program Files\PostgreSQL\15\bin"
psql --version
```

### Password authentication failed
```sql
-- Reset password for postgres user (in psql as admin)
ALTER USER postgres WITH PASSWORD 'new_password';
```

### Port 5432 already in use
```powershell
# Check what's using port 5432
Get-NetTCPConnection -LocalPort 5432 | Select-Object OwningProcess

# If it's PostgreSQL, that's fine
# If it's something else:
Get-Process -Id (Get-NetTCPConnection -LocalPort 5432).OwningProcess
```

### Database bitehub_db already exists
```sql
-- Drop and recreate (WARNING: loses all data)
DROP DATABASE bitehub_db;
CREATE DATABASE bitehub_db;
\c bitehub_db
\i 'path/to/schema.sql'
```

## Quick Setup Command (All-in-One)

```powershell
# From PowerShell with psql in PATH:
psql -U postgres -c "CREATE DATABASE bitehub_db;"
psql -U postgres -d bitehub_db -f "c:\Users\hpcor\OneDrive\Documents\BiteHub-Dev\server\schema.sql"
Write-Host "✅ Database setup complete!"
```

Then restart the server:
```powershell
cd "c:\Users\hpcor\OneDrive\Documents\BiteHub-Dev\server"
node index.js
```

You should see: `✅ Database connected`

## After Database is Connected

All endpoints automatically switch from fallback mode to database mode:
- ✅ User data persists to PostgreSQL
- ✅ Password hashing and verification enabled
- ✅ Unique constraints enforced (no duplicate emails/usernames)
- ✅ Better error messages and validation
- ✅ Full menu, orders, cart functionality enabled
