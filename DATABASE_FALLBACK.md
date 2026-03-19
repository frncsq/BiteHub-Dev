# Database Fallback Mechanism

## Overview
The application now has automatic fallback to session-based storage when PostgreSQL database is unavailable. This allows development and testing to continue even if the database hasn't been set up yet.

## Implemented Fallback Endpoints

### Customer Authentication
1. **POST /api/customer/register**
   - **Database Mode**: Stores user data in `users` table
   - **Fallback Mode**: Stores session data in `req.session.userData`
   - **Behavior**: Returns session ID (`user_<timestamp>`) and success message indicating fallback mode
   - **Session Fields**: `userId`, `userName`, `userRole` set to `'customer'`

2. **POST /api/customer/login**
   - **Database Mode**: Validates credentials against `users` table with bcrypt password hashing
   - **Fallback Mode**: Accepts any password and generates session ID from username
   - **Behavior**: Returns session ID and "session mode" message
   - **Session Fields**: `userId`, `userName`, `userRole` set to `'customer'`

### Owner (Restaurant) Authentication
1. **POST /api/owner/register**
   - **Database Mode**: Stores restaurant in `restaurants` table with unique constraints on username/email
   - **Fallback Mode**: Stores session data in `req.session.restaurantData`
   - **Behavior**: Returns restaurant ID (`rest_<timestamp>`) and fallback status message
   - **Session Fields**: `restaurantId`, `restaurantName`, `userRole` set to `'owner'`, `restaurantData` object with full info

2. **POST /api/owner/login**
   - **Database Mode**: Validates username/email + password against `restaurants` table
   - **Fallback Mode**: Accepts any password and generates session ID from username
   - **Behavior**: Returns restaurant ID and fallback status message
   - **Session Fields**: `restaurantId`, `restaurantName`, `userRole` set to `'owner'`

## Database Availability Detection

The application attempts a simple health check before each database operation:

```javascript
let dbAvailable = false;
try {
  await pool.query('SELECT NOW()');
  dbAvailable = true;
} catch (dbTest) {
  dbAvailable = false;
}
```

### What Triggers Fallback?
- PostgreSQL server not running
- Database credentials incorrect in `.env`
- Database `bitehub_db` doesn't exist
- Connection timeout or network error
- Any database connectivity error

### Error Detection
- Connection refused (ECONNREFUSED)
- Database doesn't exist (ENOTFOUND)
- Invalid credentials (EACCES)
- Query timeout

## Session Storage Structure

### When Database is Unavailable:

**Customer Session:**
```javascript
{
  userId: "user_1234567890",
  userName: "John Doe",
  userRole: "customer",
  userData: {
    fullName: "John Doe",
    department: "CSE",
    course: "B.Tech",
    year: 3,
    passwordHash: "bcrypt_hashed_password"
  }
}
```

**Owner Session:**
```javascript
{
  restaurantId: "rest_1234567890",
  restaurantName: "Pizza Palace",
  userRole: "owner",
  restaurantData: {
    businessName: "Pizza Palace",
    businessAddress: "123 Main St",
    city: "Mumbai",
    province: "Maharashtra",
    permitNumber: "PERM123",
    taxId: "TAX456",
    ownerName: "Raj Kumar",
    ownerPhone: "9876543210",
    businessEmail: "pizzapalace@example.com",
    username: "pizzapalace",
    passwordHash: "bcrypt_hashed_password"
  }
}
```

## Testing the Fallback

### Without Database (Session Mode)
```bash
# These should work and return "(session mode)" in the message
curl -X POST http://localhost:5000/api/customer/register \
  -H "Content-Type: application/json" \
  -d '{
    "fullName": "Test User",
    "department": "CSE",
    "course": "B.Tech",
    "year": 3,
    "password": "pass123",
    "confirmPassword": "pass123"
  }'

curl -X POST http://localhost:5000/api/owner/register \
  -H "Content-Type: application/json" \
  -d '{
    "businessName": "Test Restaurant",
    "businessAddress": "456 Oak St",
    "city": "Delhi",
    "province": "Delhi",
    "ownerName": "Owner Name",
    "ownerPhone": "9999999999",
    "businessEmail": "test@rest.com",
    "username": "testrest",
    "password": "pass123"
  }'
```

### With Database (Database Mode)
1. Install PostgreSQL locally
2. Create database: `CREATE DATABASE bitehub_db;`
3. Run schema: `\i server/schema.sql`
4. Restart server
5. Same requests should return database IDs without "(session mode)" message

## Limitations in Fallback Mode

- **No Data Persistence**: Session data is lost when server restarts
- **No Unique Constraints**: Multiple users/restaurants with same email/username allowed
- **No Password Verification**: Any password accepted in fallback mode
- **No Database Queries**: Other features requiring database queries won't work
- **Protected Routes**: Routes with `requireOwner` middleware will work but won't access real data

## Migration Path: Fallback → Database

1. Install PostgreSQL Server
2. Create database user and configure `.env`
3. Create database and run schema.sql
4. Restart server
5. All routes will automatically switch to database mode
6. Session data will be persisted in database for future loggins

## Error Messages

The application now returns clear error messages indicating the mode:

**Success Messages:**
- `"Registration successful"` → Database mode
- `"Registration successful (session mode)"` → Fallback mode
- `"Login successful"` → Database mode
- `"Login successful (session mode - database unavailable)"` → Fallback mode

**Error Messages:**
- `"Database not initialized. Please run schema.sql"` → Database exists but schema doesn't
- `"Error registering restaurant: [error details]"` → Database error with details
- `"Username or email already exists"` → Unique constraint violation

## Configuration

The fallback mechanism detects database availability automatically. No configuration needed.

Recommendations:
- In **development**: Use fallback mode for quick testing without database setup
- In **staging/production**: Always require database connection and remove fallback code
- For testing: Create separate test database or use fallback for integration tests
