import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
    Menu,
    ChevronRight,
    Home,
    ShoppingCart,
    Package,
    Bell,
    User,
    Settings,
    LogOut,
    LayoutDashboard,
    X,
    Clock,
    CheckCircle,
    Info
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import biteLogo from '../assets/bite.png';
import { createApiClient } from '../services/apiClient';

const menuItems = [
    { id: "home", label: "Home", icon: Home, path: "/home" },
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

    const [showNotifications, setShowNotifications] = useState(false);
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);

    useEffect(() => {
        const fetchNotifications = async () => {
            const token = localStorage.getItem('authToken');
            if (!token) return;
            try {
                const apiClient = createApiClient();
                const res = await apiClient.get('/orders');
                
                let rawData = [];
                if (res.data?.success && res.data.orders) {
                    rawData = res.data.orders;
                } else if (Array.isArray(res.data)) {
                    rawData = res.data;
                }
                
                // Sort by date descending
                rawData.sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
                
                const notifs = rawData.map(o => {
                    const status = o.order_status || 'pending';
                    let message = `Your order from ${o.restaurant_name || 'the restaurant'} is in progress.`;
                    
                    if (status.toLowerCase() === 'pending') message = `Your order is pending confirmation.`;
                    else if (status.toLowerCase() === 'preparing') message = `Your order is currently being prepared.`;
                    else if (status.toLowerCase() === 'ready') message = `Your order is ready.`;
                    else if (status.toLowerCase() === 'out_for_delivery') message = `Your order is out for delivery!`;
                    else if (status.toLowerCase() === 'delivered') message = `Your order has been delivered! Enjoy your meal.`;
                    else if (status.toLowerCase() === 'cancelled') message = `Your order has been cancelled.`;
                    
                    return {
                        id: o.id,
                        title: `Order Update #${String(o.id || '').replace('ORD-','')}`,
                        message,
                        time: o.created_at || new Date().toISOString(),
                        status: status.toLowerCase(),
                        type: 'order'
                    };
                });
                
                const active = notifs.filter(n => !['delivered', 'cancelled'].includes(n.status));
                setUnreadCount(active.length);
                
                setNotifications([
                    {
                        id: 'sys-1',
                        title: 'Welcome to BiteHub!',
                        message: 'Explore our wide variety of restaurants and place your first order today!',
                        time: new Date().toISOString(),
                        type: 'system',
                        status: 'info'
                    },
                    ...notifs
                ].slice(0, 15));
            } catch (error) {
                console.error("Error fetching notifications via orders:", error);
            }
        };

        fetchNotifications();
        const interval = setInterval(fetchNotifications, 30000);
        return () => clearInterval(interval);
    }, []);

    const formatTime = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    const handleItemClick = (item) => {
        if (item.id === "logout") {
            if (window.confirm("Are you sure you want to logout?")) {
                localStorage.removeItem('authToken');
                console.log("🔒 Auth token removed on logout");
                navigate("/login");
            }
            return;
        }
        if (item.id === "notifications") {
            setShowNotifications(!showNotifications);
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

    const currentTab = activeTab || 
        (location.pathname === "/orders" ? "orders" : 
         location.pathname === "/cart" ? "cart" : "home");

    return (
        <>
        {/* Overlay for mobile to close sidebar/notifications */}
        {showNotifications && (
            <div 
                className="fixed inset-0 z-20 bg-black/20 backdrop-blur-sm lg:hidden"
                onClick={() => setShowNotifications(false)}
            />
        )}
        <aside
            className={`fixed left-0 top-0 h-screen transition-all duration-300 ease-out z-40 shadow-[8px_0_32px_rgba(0,0,0,0.05)] backdrop-blur-2xl border-r ${sidebarCollapsed ? "w-20" : "w-64"
                } ${isDarkMode ? "bg-[#1a1a2e]/60 border-[#1a1a2e]/50" : "bg-white/60 border-white/50"}`}
        >
            {/* Decorative glow */}
            <div className={`absolute top-0 left-0 w-full h-32 bg-gradient-to-b pointer-events-none -z-10 ${isDarkMode ? "from-orange-500/5 to-transparent" : "from-white/60 to-transparent"
                }`} />

            {/* Logo/Brand */}
            <div className={`flex items-center justify-between h-16 px-4 border-b relative z-20 ${isDarkMode ? 'border-gray-700/50' : 'border-white/40'}`}>
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center overflow-hidden transform transition-transform hover:scale-110 duration-300">
                        <img src={biteLogo} alt="BiteHub Logo" className="w-full h-full object-contain" />
                    </div>
                    {!sidebarCollapsed && (
                        <span className={`font-bold text-lg tracking-tight bg-gradient-to-r bg-clip-text text-transparent ${isDarkMode ? 'from-white to-gray-300' : 'from-gray-900 to-gray-600'}`}>BiteHub</span>
                    )}
                </div>
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
                            className={`group relative w-full flex items-center gap-3 px-4 py-3 text-sm font-medium transition-all duration-300 rounded-xl overflow-hidden ${isActive
                                    ? isDarkMode
                                        ? "bg-gray-800/80 text-orange-400 shadow-sm border border-gray-700/50"
                                        : "bg-white/80 text-orange-600 shadow-sm border border-white/60"
                                    : isDarkMode
                                        ? "text-gray-200 hover:bg-gray-800/40 hover:text-white border border-transparent"
                                        : "text-black hover:bg-white/50 hover:text-orange-600 border border-transparent hover:-translate-y-0.5"
                                }`}
                            title={sidebarCollapsed ? item.label : ""}
                        >
                            {isActive && (
                                <div className={`absolute inset-0 bg-gradient-to-r pointer-events-none -z-10 ${isDarkMode ? 'from-orange-500/10' : 'from-orange-100/40'} to-transparent`} />
                            )}
                            <div className="relative">
                                <Icon size={20} className={`flex-shrink-0 transition-all duration-300 group-hover:scale-110 ${isActive ? 'text-orange-500' : 'group-hover:text-orange-400'}`} />
                                {item.id === "notifications" && unreadCount > 0 && (
                                    <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span>
                                    </span>
                                )}
                            </div>
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

        {/* Notifications Panel */}
        <div className={`fixed top-0 bottom-0 ${sidebarCollapsed ? "left-20" : "left-64"} w-80 z-30 transition-transform duration-300 ease-in-out ${showNotifications ? "translate-x-0" : "-translate-x-full"} ${isDarkMode ? "bg-[#1a1a2e] border-r border-[#1a1a2e]/50 text-white" : "bg-white border-r border-gray-200 text-gray-900"} shadow-2xl overflow-hidden flex flex-col`}>
            {/* Panel Header */}
            <div className="p-5 border-b flex justify-between items-center bg-white/50 dark:bg-black/20 backdrop-blur-md relative z-10" style={{ borderColor: isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }}>
                <div className="flex items-center gap-2">
                    <Bell size={20} className="text-orange-500" />
                    <h3 className="font-bold text-lg tracking-tight">Notifications</h3>
                    {unreadCount > 0 && (
                        <span className="bg-orange-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full ml-1">
                            {unreadCount} New
                        </span>
                    )}
                </div>
                <button onClick={() => setShowNotifications(false)} className={`p-1.5 rounded-full transition-colors ${isDarkMode ? 'hover:bg-white/10' : 'hover:bg-black/5'}`}>
                    <X size={18} />
                </button>
            </div>
            
            {/* Panel Body */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 relative z-10">
                {/* Background glow for Panel */}
                <div className={`absolute top-0 right-0 w-32 h-32 rounded-full blur-[100px] pointer-events-none -z-10 ${isDarkMode ? 'bg-orange-500/10' : 'bg-orange-100/40'}`} />
                
                {notifications.length > 0 ? notifications.map((notif, idx) => (
                    <div key={idx} className={`p-4 rounded-xl border transition-all hover:-translate-y-0.5 ${isDarkMode ? 'bg-gray-800/40 border-gray-700/50 hover:bg-gray-800/80 cursor-default' : 'bg-gray-50/50 border-gray-100 hover:bg-white hover:shadow-md cursor-default'}`}>
                        <div className="flex items-start gap-3">
                            <div className={`mt-0.5 p-2 rounded-lg flex-shrink-0 ${
                                notif.status === 'delivered' ? 'bg-green-100 text-green-600 dark:bg-green-500/10 dark:text-green-400' :
                                notif.status === 'cancelled' ? 'bg-red-100 text-red-600 dark:bg-red-500/10 dark:text-red-400' :
                                notif.type === 'system' ? 'bg-blue-100 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400' :
                                'bg-orange-100 text-orange-600 dark:bg-orange-500/10 dark:text-orange-400'
                            }`}>
                                {notif.status === 'delivered' ? <CheckCircle size={16} /> :
                                 notif.status === 'cancelled' ? <X size={16} /> :
                                 notif.type === 'system' ? <Info size={16} /> :
                                 <Clock size={16} />}
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex justify-between items-start mb-1">
                                    <h4 className={`font-semibold text-sm truncate pr-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{notif.title}</h4>
                                    <span className={`text-[10px] whitespace-nowrap font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>{formatTime(notif.time)}</span>
                                </div>
                                <p className={`text-xs leading-relaxed ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>{notif.message}</p>
                            </div>
                        </div>
                    </div>
                )) : (
                    <div className="h-full flex flex-col items-center justify-center text-center p-6 mt-10">
                        <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 ${isDarkMode ? 'bg-gray-800' : 'bg-gray-100'}`}>
                            <Bell size={24} className={isDarkMode ? 'text-gray-600' : 'text-gray-400'} />
                        </div>
                        <p className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>No notifications yet</p>
                        <p className={`text-sm mt-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>We'll let you know when there's an update to your orders.</p>
                    </div>
                )}
            </div>
        </div>
        </>
    );
}

export default CustomerSidebar;
