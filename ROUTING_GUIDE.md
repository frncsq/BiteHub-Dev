# BiteHub Routing Guide

## Application Routes Overview

### Setup Instructions
1. Ensure `.env` file exists in `/client` directory:
   ```
   VITE_API_URL=http://localhost:5000
   ```
2. Start the backend server: `npm start` in `/server`
3. Start the frontend: `npm run dev` in `/client`

---

## Complete Route Structure

### 1. **Initial Entry Point** (Startup & Role Selection)
| Route | Component | Purpose |
|-------|-----------|---------|
| `/` | `StartUp` | Role selection page - Customer or Restaurant Owner |

**Navigation from `/`:**
- "Continue as Customer" → `/login`
- "New customer? Sign up" → `/register`
- "Continue as Restaurant" → `/restaurant-login`
- "New restaurant owner? Register" → `/restaurant-register`

---

### 2. **Customer Authentication Flow**
| Route | Component | Function |
|-------|-----------|----------|
| `/login` | `Login` | Customer login page - email/password auth |
| `/register` | `Register` | Customer registration - name, dept, course, year, password |

**Login Flow:**
- Fill credentials and click "Sign In"
- Redirects to → `/home`

**Register Flow:**
- Fill all required fields
- Agree to terms and conditions
- Click "Create Account"
- Redirects to → `/home`

---

### 3. **Restaurant Owner Authentication Flow**
| Route | Component | Function |
|-------|-----------|----------|
| `/restaurant-login` | `RestaurantLogin` | Owner login - username/password auth |
| `/restaurant-register` | `RestaurantRegister` | Owner registration - business info + credentials |

**Login Flow:**
- Enter username and password
- Click "Sign In"
- Redirects to → `/owner/dashboard`

**Register Flow:**
- Business Information: name, address, city, permit #, tax ID
- Owner Information: name, phone, email
- Account Credentials: username, password
- Upload permit document
- Agree to terms
- Click "Register Your Restaurant"
- Redirects to → `/owner/dashboard`

---

### 4. **Customer Activity Pages**
| Route | Component | Purpose |
|-------|-----------|---------|
| `/home` | `Home` | Main customer dashboard - browse restaurants, food items |
| `/rooms` | `Rooms` | Browse dining rooms/restaurant spaces |
| `/cart` | `Cart` | View and manage shopping cart |
| `/orders` | `Orders` | View order history and status |
| `/profile` | `Profile` | View and edit customer profile |
| `/contact` | `Contact` | Contact support page |

**Customer Navigation Flow:**
```
/home
├── Browse restaurants & food
├── Add items to cart → /cart
├── View previous orders → /orders
├── Manage profile → /profile
├── Browse rooms → /rooms
└── Contact support → /contact
```

---

### 5. **Restaurant Owner Dashboard**
Base Route: `/owner`

| Route | Component | Purpose |
|-------|-----------|---------|
| `/owner/dashboard` | `OwnerDashboard` | Main dashboard view - overview & stats |
| `/owner/menu` | `OwnerMenu` | Manage restaurant menu items and categories |
| `/owner/orders` | `OwnerOrders` | View incoming orders and manage fulfillment |
| `/owner/inventory` | `OwnerInventory` | Track and manage food inventory |
| `/owner/analytics` | `OwnerAnalytics` | View sales reports and analytics |
| `/owner/settings` | `OwnerSettings` | Configure restaurant settings and profile |

**Owner Navigation Flow:**
```
/owner/dashboard
├── View analytics → /owner/analytics
├── Manage menu → /owner/menu
├── View orders → /owner/orders
├── Manage inventory → /owner/inventory
└── Settings → /owner/settings
```

---

## Error Handling

### Common Issues & Solutions

**Issue:** "getaddrinfo ENOTFOUND undefined"
- **Cause:** Missing `.env` file or incorrect `VITE_API_URL`
- **Solution:** Create `.env` file with `VITE_API_URL=http://localhost:5000`

**Issue:** Routes not working
- **Cause:** `main.jsx` conflicts with App routing
- **Solution:** Ensure `main.jsx` only renders `<BrowserRouter><App /></BrowserRouter>`

**Issue:** API calls failing
- **Cause:** Backend server not running
- **Solution:** Start backend with `npm start` in `/server` directory

---

## Navigation Flow Diagrams

### Customer Journey
```
START (/) 
  ↓
CHOOSE ROLE (Sign up / Login)
  ↓
/register or /login
  ↓
/home (Main Feed)
  ├→ Browse restaurants
  ├→ View rooms (/rooms)
  ├→ Add to cart
  ├→ Checkout → /cart
  ├→ View orders (/orders)
  ├→ Manage profile (/profile)
  └→ Contact support (/contact)
```

### Restaurant Owner Journey
```
START (/)
  ↓
CHOOSE ROLE (Sign up / Login)
  ↓
/restaurant-register or /restaurant-login
  ↓
/owner/dashboard (Dashboard)
  ├→ View/manage menu (/owner/menu)
  ├→ Process orders (/owner/orders)
  ├→ Track inventory (/owner/inventory)
  ├→ View analytics (/owner/analytics)
  └→ Configure settings (/owner/settings)
```

---

## Protected Routes (Future Enhancement)

Routes that should be protected by authentication:
- `/home` - Requires customer login
- `/cart` - Requires customer login
- `/orders` - Requires customer login
- `/profile` - Requires customer login
- `/owner/*` - Requires restaurant owner login

**Implementation:** Add middleware/context to check auth tokens before rendering.

---

## State Management

### Using ThemeContext
All pages use `ThemeContext` for dark/light mode and color theming:
```javascript
const { isDarkMode, toggleTheme, colors } = useTheme()
```

### Mock Data Services
Authentication and data are handled by mock services:
- `mockAuthService` - User login/registration
- `mockOrderService` - Order data
- `mockCartService` - Shopping cart
- `mockRestaurantsData` - Restaurant listings
- `mockFoodItems` - Food menu items

---

## File Structure
```
client/src/
├── main.jsx              # Entry point with routing setup
├── App.jsx               # Route definitions
├── login.jsx             # Customer login
├── pages/
│   ├── startup.jsx       # Role selection
│   ├── register.jsx      # Customer registration
│   ├── restaurant-login.jsx       # Owner login
│   ├── restaurant-register.jsx    # Owner registration
│   ├── home.jsx          # Main customer dashboard
│   ├── rooms.jsx         # Room browsing
│   ├── cart.jsx          # Shopping cart
│   ├── orders.jsx        # Order history
│   ├── profile.jsx       # User profile
│   ├── contact.jsx       # Contact page
│   └── owner/
│       ├── dashboard.jsx # Owner dashboard
│       ├── menu.jsx      # Menu management
│       ├── orders.jsx    # Order management
│       ├── inventory.jsx # Inventory tracking
│       ├── analytics.jsx # Analytics
│       └── settings.jsx  # Settings
├── components/
│   ├── header.jsx        # Navigation header
│   ├── OwnerLayout.jsx   # Layout wrapper for owner pages
│   └── OwnerSidebar.jsx  # Navigation sidebar for owner
└── context/
    └── ThemeContext.jsx  # Theme provider
```

---

## Next Steps for Full Implementation

1. **Authentication Protection:** Add route guards for protected pages
2. **Database Integration:** Replace mock services with real API calls
3. **Session Management:** Store and validate auth tokens
4. **Error Pages:** Add 404 and error boundary components
5. **Loading States:** Add skeleton loaders for data fetching
6. **Form Validation:** Enhance client-side validation
7. **Mobile Responsiveness:** Complete mobile optimization

