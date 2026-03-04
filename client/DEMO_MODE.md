# BiteHub - Demo Mode Guide

## Overview

BiteHub is now fully functional in **Demo Mode** without requiring a backend server. All features work using mock data stored locally in your browser.

## Demo Credentials

### Customer Login
- **Name:** John Doe
- **Password:** Demo@123

### Restaurant Owner Login
- **Email:** pizza@restaurant.com
- **Password:** Demo@123

## Features Available in Demo Mode

### ✅ Authentication
- **Customer Login/Register:** Sign up and log in as a customer
- **Restaurant Owner Login/Register:** Sign up and log in as a restaurant owner
- **Session Management:** Authentication tokens stored in localStorage
- **Remember Me:** Save login preferences locally

### ✅ Customer Features
- **Browse Restaurants:** View 5 demo restaurants with full details
- **Browse Food Items:** View food items for each restaurant
- **Search:** Search for restaurants by name or cuisine
- **Categories:** Filter by food categories
- **Add to Cart:** Add items to your shopping cart
- **Manage Cart:** Update quantities, remove items
- **View Orders:** See your order history
- **Place Orders:** Complete mock orders
- **Profile:** View and manage customer profile
- **Bookings:** View and manage reservations

### ✅ Restaurant Owner Features
- **Login:** Access restaurant owner dashboard
- **Order Management:** View incoming orders
- **Restaurant Details:** Manage restaurant information

### ✅ Additional Features
- **Contact Form:** Submit contact/support requests
- **Frequently Asked Questions:** Browse FAQ section
- **Notifications:** Mock notification system
- **Cart Persistence:** Cart data persists across page refreshes

## Demo Data

### Restaurants Available
1. **Pizza Palace** - Authentic Italian Pizza ($15)
2. **Burger Barn** - Juicy American Burgers ($12)
3. **Sushi Sensation** - Fresh Japanese Sushi ($25)
4. **Taco Fiesta** - Delicious Mexican Tacos ($10)
5. **Curry House** - Authentic Indian Cuisine ($18)

### Food Categories
- Pizza
- Burgers
- Sushi
- Mexican
- Indian
- Desserts
- Drinks

## How Data is Stored

All data is stored in your browser's **localStorage**:

- **Authentication:** `authToken` - Current logged-in user
- **Cart:** `cart` - Items in shopping cart
- **Orders:** `orders` - Order history
- **Bookings:** `bookings` - Reservation history
- **Contacts:** `contacts` - Submitted contact forms

## Testing the Application

### 1. Customer Journey
```
1. Visit http://localhost:5173/
2. Click "Order Food" as Customer
3. Login with: John Doe / Demo@123
4. Browse restaurants and food items
5. Add items to cart
6. Place an order
7. View order in "Orders" section
```

### 2. Restaurant Owner Journey
```
1. Visit http://localhost:5173/
2. Click "Grow Your Business" as Restaurant
3. Login with: pizza@restaurant.com / Demo@123
4. View restaurant dashboard
5. Check incoming orders
6. Manage restaurant details
```

### 3. New User Registration
```
1. Go to login page
2. Click "Create Account"
3. Fill in the registration form
4. You'll be immediately logged in and redirected to home
```

## Clearing Demo Data

To reset all demo data and start fresh:

1. Open **Developer Console** (F12 or Ctrl+Shift+I)
2. Go to **Application** → **Local Storage**
3. Delete these items:
   - `authToken`
   - `cart`
   - `orders`
   - `bookings`
   - `contacts`
   - `rememberMe`
4. Refresh the page

Or use the console command:
```javascript
localStorage.clear()
```

## Mock Services

The app uses mock services located in `src/services/mockData.js`:

- **mockAuthService** - User authentication
- **mockFoodService** - Restaurant and food data
- **mockOrderService** - Order management
- **mockCartService** - Shopping cart
- **mockBookingService** - Booking management
- **mockProfileService** - User profile
- **mockContactService** - Contact submissions

## Transitioning to Backend

When you're ready to connect to a real backend:

1. Update `src/services/mockData.js` to use actual API calls
2. Or remove mock data and restore original axios calls
3. Update environment variables in `.env`:
   ```
   VITE_API_URL=https://your-backend-url.com
   ```

## File Locations

- **Mock Data Service:** `src/services/mockData.js`
- **API Client Helper:** `src/services/apiClient.js`
- **Updated Pages:**
  - `src/login.jsx`
  - `src/pages/register.jsx`
  - `src/pages/restaurant-login.jsx`
  - `src/pages/restaurant-register.jsx`
  - `src/pages/home.jsx`
  - `src/pages/rooms.jsx`
  - `src/pages/profile.jsx`
  - `src/pages/bookings.jsx`
  - `src/pages/contact.jsx`
  - `src/pages/room-detail.jsx`

## Notes

- **Network Delays:** Mock API calls include 300-500ms delays to simulate real network behavior
- **Data Persistence:** All changes are saved to localStorage and persist across sessions
- **No Server Required:** The entire app works offline without any backend server
- **Full Functionality:** All features work exactly as they would with a real backend

## Troubleshooting

### Auth Token Issues
If you can't log in:
```javascript
localStorage.removeItem('authToken')
```

### Cart Not Showing
If cart items disappear:
```javascript
localStorage.removeItem('cart')
```

### Page Not Loading Data
If data doesn't load:
1. Check browser console for errors (F12)
2. Try refreshing the page
3. Clear localStorage and restart

## Support

For issues or questions about the demo:
- Check the console (F12) for error messages
- Review the mock data structure in `mockData.js`
- All mock services are console-logged for debugging

---

**Happy Testing! 🎉**
