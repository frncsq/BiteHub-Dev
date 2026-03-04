# Hotel Management - API Specification

## Overview
This document outlines the API endpoints and response structures required by the hotel management client application.

## Base URL
Set the `VITE_API_URL` environment variable to point to your backend server.

Example: `VITE_API_URL=http://localhost:3000/api`

## Endpoints

### 1. Get All Rooms
**Endpoint:** `GET /rooms`

**Description:** Retrieves a list of all available rooms with their details.

**Headers:**
```
Content-Type: application/json
Accept: application/json
```

**Response (Success - 200 OK):**
```json
{
  "success": true,
  "rooms": [
    {
      "id": 1,
      "roomNumber": "101",
      "type": "Single",
      "price": 80,
      "availability": "available",
      "amenities": ["WiFi", "AC", "TV"]
    },
    {
      "id": 2,
      "roomNumber": "102",
      "type": "Double",
      "price": 120,
      "availability": "available",
      "amenities": ["WiFi", "AC", "TV", "Minibar"]
    }
  ]
}
```

**Alternative Response Format (Array):**
The API also accepts returning the array directly:
```json
[
  {
    "id": 1,
    "roomNumber": "101",
    "type": "Single",
    "price": 80,
    "availability": "available",
    "amenities": ["WiFi", "AC", "TV"]
  }
]
```

**Response Field Descriptions:**
- `id` (number, required): Unique room identifier
- `roomNumber` (string, required): Room number (e.g., "101", "305")
- `type` (string, required): Room type (Single, Double, Suite, Deluxe)
- `price` (number, required): Price per night in dollars
- `availability` (string, required): Room status ("available" or "booked")
- `amenities` (array, required): List of amenities (e.g., ["WiFi", "AC", "TV"])

**Error Response (500 Internal Server Error):**
```json
{
  "success": false,
  "error": "Failed to fetch rooms"
}
```

**Timeout:** 10 seconds

**Retry Strategy:**
- The client automatically retries failed requests up to 3 times
- Uses exponential backoff: 1s, 2s, 4s
- Falls back to mock data if all retries fail

## Data Validation

The client validates all room data before using it. Each room must have:
- `id` (number)
- `roomNumber` (string)
- `type` (string)
- `price` (number)
- `availability` (string)
- `amenities` (array of strings)

Invalid data will be rejected and error message will be shown to the user.

## Environment Variables

Create a `.env` file in the root of the client directory:

```env
VITE_API_URL=http://localhost:3000/api
```

## Testing the Integration

1. **Mock Data Fallback:** If the backend is not available, the app uses mock data with a warning banner notifying the user.

2. **Error Messages:** Users will see:
   - "Failed to load rooms from server after 3 attempts. Displaying cached data. Server is not responding."
   - Manual retry button available

3. **Success:** When backend is properly configured, no error message appears and real data is displayed.

## Future Endpoints (Recommended Implementation)

In the future, consider adding these endpoints:

### Get Room Details
```
GET /rooms/:id
```

### Book a Room
```
POST /bookings
Body: { roomId, checkInDate, checkOutDate, guestInfo }
```

### List Bookings
```
GET /bookings
```

### Register User
```
POST /auth/register
Body: { email, password, name }
```

### Login
```
POST /auth/login
Body: { email, password }
```

## CORS Requirements

Ensure your backend allows CORS requests from the client domain:
- Development: `http://localhost:5173`
- Production: Your deployed client URL

Example CORS header:
```
Access-Control-Allow-Origin: http://localhost:5173
Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS
Access-Control-Allow-Headers: Content-Type, Authorization
```
