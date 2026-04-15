import { Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider } from "./context/ThemeContext";
import StartUp from "./pages/startup.jsx";
import Login from "./login.jsx";
import Register from "./pages/register.jsx";
import RestaurantLogin from "./pages/restaurant-login.jsx";
import RestaurantRegister from "./pages/restaurant-register.jsx";
import Home from "./pages/home.jsx";
import Cart from "./pages/cart.jsx";
import Orders from "./pages/orders.jsx";
import Profile from "./pages/profile.jsx";
import CustomerSettings from "./pages/settings.jsx";
import OwnerLayout from "./components/OwnerLayout.jsx";
import OwnerDashboard from "./pages/owner/dashboard.jsx";
import OwnerMenu from "./pages/owner/menu.jsx";
import OwnerOrders from "./pages/owner/orders.jsx";
import OwnerInventory from "./pages/owner/inventory.jsx";
import OwnerAnalytics from "./pages/owner/analytics.jsx";
import OwnerSettings from "./pages/owner/settings.jsx";
import AdminLogin from "./pages/admin-login.jsx";
import AdminLayout from "./components/AdminLayout.jsx";
import AdminDashboard from "./pages/admin/dashboard.jsx";
import AdminRestaurants from "./pages/admin/restaurants.jsx";
import AdminUsers from "./pages/admin/users.jsx";
import AdminOrders from "./pages/admin/orders.jsx";
import AdminPayments from "./pages/admin/payments.jsx";

function App() {
  return (
    <ThemeProvider>
      <Routes>
        {/* Startup & Role Selection */}
        <Route path="/" element={<StartUp />} />
        
        {/* Customer Authentication */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        
        {/* Restaurant Owner Authentication */}
        <Route path="/restaurant-login" element={<RestaurantLogin />} />
        <Route path="/restaurant-register" element={<RestaurantRegister />} />
        
        {/* Customer Pages */}
        <Route path="/home" element={<Home />} />
        <Route path="/cart" element={<Cart />} />
        <Route path="/orders" element={<Orders />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/settings" element={<CustomerSettings />} />
        
        {/* Owner Dashboard */}
        <Route path="/owner" element={<OwnerLayout />}>
          <Route path="dashboard" element={<OwnerDashboard />} />
          <Route path="menu" element={<OwnerMenu />} />
          <Route path="orders" element={<OwnerOrders />} />
          <Route path="inventory" element={<OwnerInventory />} />
          <Route path="analytics" element={<OwnerAnalytics />} />
          <Route path="settings" element={<OwnerSettings />} />
        </Route>

        {/* Admin Portal */}
        <Route path="/admin-login" element={<AdminLogin />} />
        <Route path="/admin" element={<AdminLayout />}>
           <Route path="dashboard" element={<AdminDashboard />} />
           <Route path="restaurants" element={<AdminRestaurants />} />
           <Route path="users" element={<AdminUsers />} />
           <Route path="orders" element={<AdminOrders />} />
           <Route path="payments" element={<AdminPayments />} />
           <Route path="analytics" element={<AdminDashboard />} /> {/* Maps to dashboard for now */}
           {/* Fallback internal redirect */}
           <Route index element={<Navigate to="/admin/dashboard" replace />} />
        </Route>

        {/* Catch-all route - redirect to home */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </ThemeProvider>
  );
}

export default App;
