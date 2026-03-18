import { Routes, Route } from "react-router-dom";
import { ThemeProvider } from "./context/ThemeContext";
import StartUp from "./pages/startup.jsx";
import Login from "./login.jsx";
import Register from "./pages/register.jsx";
import RestaurantLogin from "./pages/restaurant-login.jsx";
import RestaurantRegister from "./pages/restaurant-register.jsx";
import Home from "./pages/home.jsx";
import Cart from "./pages/cart.jsx";
import Orders from "./pages/orders.jsx";
import Contact from "./pages/contact.jsx";
import Profile from "./pages/profile.jsx";
import OwnerLayout from "./components/OwnerLayout.jsx";
import OwnerDashboard from "./pages/owner/dashboard.jsx";
import OwnerMenu from "./pages/owner/menu.jsx";
import OwnerOrders from "./pages/owner/orders.jsx";
import OwnerInventory from "./pages/owner/inventory.jsx";
import OwnerAnalytics from "./pages/owner/analytics.jsx";
import OwnerSettings from "./pages/owner/settings.jsx";

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
        <Route path="/contact" element={<Contact />} />
        <Route path="/profile" element={<Profile />} />
        
        {/* Owner Dashboard */}
        <Route path="/owner" element={<OwnerLayout />}>
          <Route path="dashboard" element={<OwnerDashboard />} />
          <Route path="menu" element={<OwnerMenu />} />
          <Route path="orders" element={<OwnerOrders />} />
          <Route path="inventory" element={<OwnerInventory />} />
          <Route path="analytics" element={<OwnerAnalytics />} />
          <Route path="settings" element={<OwnerSettings />} />
        </Route>
      </Routes>
    </ThemeProvider>
  );
}

export default App;
