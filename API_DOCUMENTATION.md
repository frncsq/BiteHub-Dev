# BiteHub API Documentation

## Base URL
```
http://localhost:5000
```

## Response Format
All endpoints return JSON with the following structure:
```json
{
  "success": true/false,
  "message": "Status message",
  "data": { /* response data */ }
}
```

---

## 📋 TABLE OF CONTENTS
1. [Public Endpoints](#public-endpoints)
2. [Customer Authentication](#customer-authentication)
3. [Customer Activity](#customer-activity)
4. [Restaurant Owner Authentication](#restaurant-owner-authentication)
5. [Restaurant Owner Dashboard](#restaurant-owner-dashboard)

---

## 🔓 Public Endpoints
No authentication required.

### Get All Categories
```
GET /api/categories
```
**Response:**
```json
{
  "success": true,
  "categories": [...]
}
```

### Get All Restaurants
```
GET /api/restaurants
```
**Response:**
```json
{
  "success": true,
  "restaurants": [...]
}
```

### Get All Rooms
```
GET /api/rooms
```
**Response:**
```json
{
  "success": true,
  "rooms": [...]
}
```

### Get Food Items by Restaurant
```
GET /api/food/:restaurantId
```
**Parameters:**
- `restaurantId` (URL param): Restaurant ID

**Response:**
```json
{
  "success": true,
  "items": [...],
  "foods": [...]
}
```

---

## 👤 Customer Authentication

### Register Customer
```
POST /api/customer/register
```
**Request Body:**
```json
{
  "fullName": "John Doe",
  "department": "Computer Science",
  "course": "CS101",
  "year": "1st",
  "password": "SecurePass123",
  "confirmPassword": "SecurePass123"
}
```
**Response:**
```json
{
  "success": true,
  "message": "Registration successful",
  "user": {
    "id": 1,
    "name": "John Doe"
  }
}
```

### Login Customer
```
POST /api/customer/login
```
**Request Body:**
```json
{
  "fullName": "John Doe",
  "password": "SecurePass123"
}
```
**Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "user": {
    "id": 1,
    "name": "John Doe"
  }
}
```

### Get Customer Session
```
GET /api/customer/session
```
**Response:**
```json
{
  "session": true,
  "userId": 1,
  "name": "John Doe",
  "role": "customer"
}
```

### Logout Customer
```
POST /api/customer/logout
```
**Response:**
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

---

## 🛒 Customer Activity

### Get Orders
```
GET /api/orders
```
**Response:**
```json
{
  "success": true,
  "orders": [
    {
      "id": "ORD-1234567890",
      "status": "delivered",
      "date": "2026-03-18",
      "items": [...],
      "total": 49.99
    }
  ]
}
```

### Create Order (Checkout)
```
POST /api/orders/create
```
**Request Body:**
```json
{
  "items": [
    { "foodId": 1, "quantity": 2, "price": 12.99 }
  ],
  "subtotal": 25.98,
  "tax": 2.50,
  "deliveryFee": 3.00,
  "total": 31.48
}
```
**Response:**
```json
{
  "success": true,
  "order": {
    "id": "ORD-1234567890",
    "status": "pending",
    "total": 31.48
  }
}
```

### Get Cart
```
GET /api/cart
```
**Response:**
```json
{
  "success": true,
  "cart": [
    { "foodId": 1, "quantity": 2 }
  ]
}
```

### Add Item to Cart
```
POST /api/cart/add
```
**Request Body:**
```json
{
  "foodId": 1,
  "quantity": 2
}
```
**Response:**
```json
{
  "success": true,
  "cart": [...]
}
```

### Update Cart Item
```
POST /api/cart/update
```
**Request Body:**
```json
{
  "foodId": 1,
  "quantity": 5
}
```
**Response:**
```json
{
  "success": true,
  "cart": [...]
}
```

### Remove Item from Cart
```
POST /api/cart/remove
```
**Request Body:**
```json
{
  "foodId": 1
}
```
**Response:**
```json
{
  "success": true,
  "cart": [...]
}
```

### Toggle Favorite
```
POST /api/favorites/toggle
```
**Request Body:**
```json
{
  "foodId": 1
}
```
**Response:**
```json
{
  "success": true,
  "isFavorite": true,
  "favorites": [1, 2, 3]
}
```

### Get Profile
```
GET /api/profile
```
**Response:**
```json
{
  "success": true,
  "profile": {
    "name": "John Doe",
    "email": "john@example.com",
    "phone": "+1-234-567-8900"
  }
}
```

### Update Profile
```
PUT /api/profile
```
**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john.new@example.com",
  "phone": "+1-234-567-8900",
  "address": "123 Main St"
}
```
**Response:**
```json
{
  "success": true,
  "profile": {...}
}
```

---

## 🍽️ Restaurant Owner Authentication

### Register Restaurant
```
POST /api/owner/register
```
**Request Body:**
```json
{
  "businessName": "My Restaurant",
  "businessAddress": "123 Main St",
  "city": "New York",
  "province": "NY",
  "permitNumber": "PERMIT123",
  "taxId": "TAX123",
  "ownerName": "Jane Owner",
  "ownerPhone": "+1-234-567-8900",
  "businessEmail": "owner@restaurant.com",
  "username": "myrestaurant",
  "password": "SecurePass123"
}
```
**Response:**
```json
{
  "success": true,
  "message": "Restaurant registered successfully",
  "user": {
    "id": 1,
    "business_name": "My Restaurant",
    "username": "myrestaurant"
  }
}
```

### Login Restaurant Owner
```
POST /api/owner/login
```
**Request Body:**
```json
{
  "username": "owner@restaurant.com",
  "password": "SecurePass123"
}
```
**Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "user": {
    "id": 1,
    "name": "My Restaurant",
    "email": "owner@restaurant.com"
  }
}
```

### Get Owner Session
```
GET /api/owner/session
```
**Response:**
```json
{
  "session": true,
  "restaurantId": 1,
  "name": "My Restaurant"
}
```

### Logout Restaurant Owner
```
POST /api/owner/logout
```
**Response:**
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

---

## 📊 Restaurant Owner Dashboard
**All endpoints require owner authentication (session)**

### Get Dashboard Metrics
```
GET /api/owner/dashboard
```
**Response:**
```json
{
  "success": true,
  "metrics": {
    "totalOrders": 150,
    "revenue": 5000.00,
    "activeOrders": 12
  }
}
```

### Get Menu Items
```
GET /api/owner/menu
```
**Response:**
```json
{
  "success": true,
  "items": [
    {
      "id": 1,
      "item_name": "Burger",
      "description": "Delicious burger",
      "price": 9.99,
      "category": "Entrees",
      "is_available": true
    }
  ]
}
```

### Create Menu Item
```
POST /api/owner/menu
```
**Request Body:**
```json
{
  "name": "New Burger",
  "description": "Delicious new burger",
  "price": 11.99,
  "category": "Entrees",
  "isAvailable": true,
  "image_url": "https://example.com/burger.jpg",
  "inventory_count": 50
}
```
**Response:**
```json
{
  "success": true,
  "message": "Item added"
}
```

### Update Menu Item
```
PUT /api/owner/menu/:id
```
**Parameters:**
- `id` (URL param): Menu item ID

**Request Body:**
```json
{
  "name": "Updated Burger",
  "description": "Updated description",
  "price": 12.99,
  "category": "Entrees",
  "isAvailable": true,
  "image_url": "https://example.com/burger.jpg",
  "inventory_count": 45
}
```
**Response:**
```json
{
  "success": true,
  "message": "Item updated"
}
```

### Delete Menu Item
```
DELETE /api/owner/menu/:id
```
**Parameters:**
- `id` (URL param): Menu item ID

**Response:**
```json
{
  "success": true,
  "message": "Item deleted"
}
```

### Get Orders
```
GET /api/owner/orders
```
**Response:**
```json
{
  "success": true,
  "orders": [
    {
      "id": 1,
      "customer_name": "John Doe",
      "customer_phone": "+1-234-567-8900",
      "order_status": "pending",
      "total_amount": 31.48,
      "created_at": "2026-03-18T10:30:00Z"
    }
  ]
}
```

### Update Order Status
```
PUT /api/owner/orders/:id/status
```
**Parameters:**
- `id` (URL param): Order ID

**Request Body:**
```json
{
  "status": "preparing"
}
```
**Allowed statuses:** `pending`, `preparing`, `out for delivery`, `delivered`, `cancelled`

**Response:**
```json
{
  "success": true
}
```

### Get Analytics
```
GET /api/owner/analytics
```
**Response:**
```json
{
  "success": true,
  "analytics": [
    {
      "date": "2026-03-18",
      "daily_revenue": 500.00,
      "daily_orders": 20
    }
  ]
}
```

### Get Settings
```
GET /api/owner/settings
```
**Response:**
```json
{
  "success": true,
  "settings": {
    "business_name": "My Restaurant",
    "business_address": "123 Main St",
    "city": "New York",
    "owner_name": "Jane Owner",
    "owner_phone": "+1-234-567-8900",
    "business_email": "owner@restaurant.com",
    "description": "Restaurant description"
  }
}
```

### Update Settings
```
PUT /api/owner/settings
```
**Request Body:**
```json
{
  "business_name": "Updated Restaurant",
  "business_address": "456 Oak Ave",
  "city": "Boston",
  "owner_name": "Jane Owner",
  "owner_phone": "+1-234-567-8900",
  "description": "Updated description"
}
```
**Response:**
```json
{
  "success": true
}
```

---

## ✅ Error Responses

### 400 Bad Request
```json
{
  "success": false,
  "message": "Missing required fields"
}
```

### 401 Unauthorized
```json
{
  "success": false,
  "message": "Invalid credentials"
}
```

### 404 Not Found
```json
{
  "success": false,
  "message": "Route POST /api/invalid not found"
}
```

### 500 Server Error
```json
{
  "success": false,
  "message": "Server error"
}
```

---

## 🧪 Testing with cURL

**Register Customer:**
```bash
curl -X POST http://localhost:5000/api/customer/register \
  -H "Content-Type: application/json" \
  -d '{
    "fullName": "John Doe",
    "password": "SecurePass123",
    "confirmPassword": "SecurePass123"
  }'
```

**Login Customer:**
```bash
curl -X POST http://localhost:5000/api/customer/login \
  -H "Content-Type: application/json" \
  -d '{
    "fullName": "John Doe",
    "password": "SecurePass123"
  }'
```

**Get Categories:**
```bash
curl http://localhost:5000/api/categories
```

---

## 📝 Notes
- All authentication uses session-based cookies
- Use `withCredentials: true` in axios for authentication endpoints
- Server runs on port 5000 by default
- For development, CORS is enabled for localhost:5173 (Vite dev server)

