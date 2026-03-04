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
      </Routes>
    </ThemeProvider>
  );
}

export default App;
