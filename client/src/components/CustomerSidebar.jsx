import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
    Menu,
    ChevronRight,
    Tag,
    ShoppingCart,
    Package,
    Bell,
    User,
    Settings,
    LogOut,
    LayoutDashboard
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

const menuItems = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard, path: "/home" },
    { id: "categories", label: "Categories", icon: Tag, path: "/home" },
    { id: "cart", label: "My Cart", icon: ShoppingCart, path: "/cart" },
    { id: "orders", label: "Orders", icon: Package, path: "/orders" },
    { id: "notifications", label: "Notifications", icon: Bell },
    { id: "profile", label: "Profile", icon: User, path: "/home" },
    { id: "settings", label: "Settings", icon: Settings, path: "/home" },
    { id: "logout", label: "Logout", icon: LogOut, path: "/login" },
];

function CustomerSidebar({ activeTab, onTabChange, sidebarCollapsed, setSidebarCollapsed }) {
    const navigate = useNavigate();
    const location = useLocation();
    const { isDarkMode } = useTheme();

    const handleItemClick = (item) => {
        if (item.id === "logout") {
            if (window.confirm("Are you sure you want to logout?")) {
                navigate("/login");
            }
            return;
        }
        if (item.id === "notifications") {
            // Notifications logic handled by parent or local state
            // For now just navigate if needed or toggle
            return;
        }

        if (item.path) {
            if (location.pathname === item.path) {
                if (onTabChange) onTabChange(item.id);
            } else {
                navigate(item.path, { state: { activeTab: item.id } });
            }
        }
    };

    const currentTab = activeTab || (location.pathname === "/orders" ? "orders" : location.pathname === "/cart" ? "cart" : "dashboard");

    return (
        <aside
            className={`fixed left-0 top-0 h-screen transition-all duration-300 ease-out z-40 shadow-[8px_0_32px_rgba(0,0,0,0.05)] backdrop-blur-2xl border-r ${
                sidebarCollapsed ? "w-20" : "w-64"
            } ${isDarkMode ? "bg-[#1a1a2e]/60 border-[#1a1a2e]/50" : "bg-white/60 border-white/50"}`}
        >
            {/* Decorative glow */}
            <div className={`absolute top-0 left-0 w-full h-32 bg-gradient-to-b pointer-events-none -z-10 ${
                isDarkMode ? "from-orange-500/5 to-transparent" : "from-white/60 to-transparent"
            }`} />

            {/* Logo/Brand */}
            <div className={`flex items-center justify-between h-16 px-4 border-b relative z-20 ${isDarkMode ? 'border-gray-700/50' : 'border-white/40'}`}>
                {!sidebarCollapsed && (
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-gradient-to-br from-orange-400 to-orange-600 rounded-lg flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-orange-500/30 transform transition-transform hover:scale-105 duration-300 ring-1 ring-white/30">
                            B
                        </div>
                        <span className={`font-bold text-lg tracking-tight bg-gradient-to-r bg-clip-text text-transparent ${isDarkMode ? 'from-white to-gray-300' : 'from-gray-900 to-gray-600'}`}>BiteHub</span>
                    </div>
                )}
                <button
                    onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                    className={`p-1 rounded-lg transition hover:shadow-sm ${isDarkMode ? 'hover:bg-gray-800/50 text-gray-400' : 'hover:bg-white/50 text-gray-500'}`}
                >
                    {sidebarCollapsed ? <ChevronRight size={20} /> : <Menu size={20} />}
                </button>
            </div>

            {/* Menu Items */}
            <nav className="flex-1 overflow-y-auto py-4 px-3 flex flex-col gap-1 relative z-20">
                {menuItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = currentTab === item.id;
                    
                    return (
                        <button
                            key={item.id}
                            onClick={() => handleItemClick(item)}
                            className={`group relative w-full flex items-center gap-3 px-4 py-3 text-sm font-medium transition-all duration-300 rounded-xl overflow-hidden ${
                                isActive
                                    ? isDarkMode 
                                        ? "bg-gray-800/80 text-orange-400 shadow-sm border border-gray-700/50"
                                        : "bg-white/80 text-orange-600 shadow-sm border border-white/60"
                                    : isDarkMode
                                        ? "text-gray-400 hover:bg-gray-800/40 hover:text-gray-200 border border-transparent"
                                        : "text-gray-600 hover:bg-white/50 hover:text-gray-900 border border-transparent hover:-translate-y-0.5"
                            }`}
                            title={sidebarCollapsed ? item.label : ""}
                        >
                            {isActive && (
                                <div className={`absolute inset-0 bg-gradient-to-r pointer-events-none -z-10 ${isDarkMode ? 'from-orange-500/10' : 'from-orange-100/40'} to-transparent`} />
                            )}
                            <Icon size={20} className={`flex-shrink-0 transition-all duration-300 group-hover:scale-110 ${isActive ? 'text-orange-500' : 'group-hover:text-orange-400'}`} />
                            {!sidebarCollapsed && <span className="relative z-10 transition-transform duration-300 group-hover:translate-x-1">{item.label}</span>}

                            {/* Tooltip for collapsed sidebar */}
                            {sidebarCollapsed && (
                                <span className="pointer-events-none absolute left-full ml-2 whitespace-nowrap rounded-xl bg-gray-900/90 backdrop-blur-md px-3 py-1 text-xs font-medium text-white opacity-0 shadow-lg transition group-hover:opacity-100 group-hover:translate-x-0 translate-x-1">
                                    {item.label}
                                </span>
                            )}
                        </button>
                    );
                })}
            </nav>
        </aside>
    );
}

export default CustomerSidebar;
