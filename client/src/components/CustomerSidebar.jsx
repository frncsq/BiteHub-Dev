import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
    Menu,
    ChevronRight,
    Home,
    ShoppingCart,
    Package,
    User,
    Settings,
    X,
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import biteLogo from '../assets/bite.png';

const menuItems = [
    { id: "home", label: "Home", icon: Home, path: "/home" },
    { id: "cart", label: "My Cart", icon: ShoppingCart, path: "/cart" },
    { id: "orders", label: "Orders", icon: Package, path: "/orders" },
    { id: "profile", label: "Profile", icon: User, path: "/profile" },
    { id: "settings", label: "Settings", icon: Settings, path: "/settings" },
];

function CustomerSidebar({
    activeTab,
    onTabChange,
    sidebarCollapsed,
    setSidebarCollapsed,
    mobileOpen: controlledMobileOpen,
    setMobileOpen: setControlledMobileOpen,
}) {
    const navigate = useNavigate();
    const location = useLocation();
    const { isDarkMode } = useTheme();

    const isControlled =
        controlledMobileOpen !== undefined && setControlledMobileOpen !== undefined;
    const [internalMobileOpen, setInternalMobileOpen] = useState(false);
    const mobileDrawerOpen = isControlled ? controlledMobileOpen : internalMobileOpen;
    const setMobileDrawerOpen = isControlled ? setControlledMobileOpen : setInternalMobileOpen;

    useEffect(() => {
        const onKey = (e) => {
            if (e.key === 'Escape') setMobileDrawerOpen(false);
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [setMobileDrawerOpen]);

    useEffect(() => {
        if (mobileDrawerOpen) {
            const prev = document.body.style.overflow;
            document.body.style.overflow = 'hidden';
            return () => {
                document.body.style.overflow = prev;
            };
        }
    }, [mobileDrawerOpen]);

    const closeMobile = () => {
        if (typeof window !== 'undefined' && window.matchMedia('(max-width: 767px)').matches) {
            setMobileDrawerOpen(false);
        }
    };

    const handleItemClick = (item) => {
        if (item.path) {
            if (location.pathname === item.path) {
                if (onTabChange) onTabChange(item.id);
            } else {
                navigate(item.path, { state: { activeTab: item.id } });
            }
        }
        closeMobile();
    };

    const currentTab =
        activeTab ||
        (location.pathname === '/orders'
            ? 'orders'
            : location.pathname === '/cart'
              ? 'cart'
              : location.pathname === '/profile'
                ? 'profile'
                : location.pathname === '/settings'
                  ? 'settings'
                  : 'home');

    const desktopWidth = sidebarCollapsed ? 'md:w-20' : 'md:w-64';

    return (
        <>
            {/* Mobile FAB — pages without a top-bar hamburger (cart, orders, profile) */}
            {!isControlled && (
                <button
                    type="button"
                    className={`bh-touch fixed bottom-5 right-5 z-40 flex items-center justify-center rounded-full bg-orange-500 text-white shadow-lg shadow-orange-500/30 transition hover:bg-orange-600 md:hidden ${
                        mobileDrawerOpen ? 'pointer-events-none opacity-0' : 'opacity-100'
                    }`}
                    onClick={() => setMobileDrawerOpen(true)}
                    aria-label="Open navigation menu"
                >
                    <Menu size={22} strokeWidth={2} />
                </button>
            )}

            {/* Dimmed backdrop (mobile only) */}
            <div
                className={`fixed inset-0 z-40 bg-black/50 backdrop-blur-sm transition-opacity duration-300 md:hidden ${
                    mobileDrawerOpen ? 'opacity-100' : 'pointer-events-none opacity-0'
                }`}
                onClick={() => setMobileDrawerOpen(false)}
                aria-hidden
            />

            <aside
                className={`fixed left-0 top-0 z-50 flex h-screen flex-col border-r shadow-[8px_0_32px_rgba(0,0,0,0.05)] backdrop-blur-2xl transition-transform duration-300 ease-out ${desktopWidth} w-[min(20rem,calc(100vw-1rem))] max-w-[85vw] -translate-x-full ${
                    mobileDrawerOpen ? 'translate-x-0' : ''
                } md:translate-x-0 ${
                    isDarkMode
                        ? 'border-[#1a1a2e]/50 bg-[#1a1a2e]/60'
                        : 'border-white/50 bg-white/60'
                }`}
            >
                <div
                    className={`absolute top-0 left-0 h-32 w-full bg-gradient-to-b pointer-events-none -z-10 ${
                        isDarkMode ? 'from-orange-500/5 to-transparent' : 'from-white/60 to-transparent'
                    }`}
                />

                <div
                    className={`relative z-20 flex h-16 items-center justify-between border-b px-4 ${
                        isDarkMode ? 'border-gray-700/50' : 'border-white/40'
                    }`}
                >
                    <div className="flex min-w-0 items-center gap-2">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-lg transition-transform duration-300 hover:scale-105">
                            <img src={biteLogo} alt="" className="h-full w-full object-contain" />
                        </div>
                        {(!sidebarCollapsed || mobileDrawerOpen) && (
                            <span
                                className={`truncate font-bold text-lg tracking-tight bg-gradient-to-r bg-clip-text text-transparent md:inline ${
                                    isDarkMode ? 'from-white to-gray-300' : 'from-gray-900 to-gray-600'
                                }`}
                            >
                                BiteHub
                            </span>
                        )}
                    </div>
                    <div className="flex items-center gap-1">
                        <button
                            type="button"
                            className="bh-touch flex items-center justify-center rounded-lg p-2 md:hidden"
                            onClick={() => setMobileDrawerOpen(false)}
                            aria-label="Close menu"
                        >
                            <X size={20} className={isDarkMode ? 'text-gray-300' : 'text-gray-600'} />
                        </button>
                        <button
                            type="button"
                            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                            className={`hidden rounded-lg p-2 transition hover:shadow-sm md:flex md:items-center ${
                                isDarkMode ? 'hover:bg-gray-800/50 text-gray-400' : 'hover:bg-white/50 text-gray-500'
                            }`}
                            aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                        >
                            {sidebarCollapsed ? <ChevronRight size={20} /> : <Menu size={20} />}
                        </button>
                    </div>
                </div>

                <nav className="relative z-20 flex flex-1 flex-col gap-1 overflow-y-auto px-3 py-4">
                    {menuItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = currentTab === item.id;

                        return (
                            <button
                                key={item.id}
                                type="button"
                                onClick={() => handleItemClick(item)}
                                className={`group relative flex w-full items-center gap-3 overflow-hidden rounded-xl px-4 py-3 text-left text-sm font-medium transition-all duration-300 ${
                                    isActive
                                        ? isDarkMode
                                            ? 'border border-gray-700/50 bg-gray-800/80 text-orange-400 shadow-sm'
                                            : 'border border-white/60 bg-white/80 text-orange-600 shadow-sm'
                                        : isDarkMode
                                          ? 'border border-transparent text-gray-200 hover:bg-gray-800/40 hover:text-white'
                                          : 'border border-transparent text-black hover:bg-white/50 hover:text-orange-600 hover:-translate-y-0.5'
                                }`}
                                title={sidebarCollapsed && !mobileDrawerOpen ? item.label : ''}
                            >
                                {isActive && (
                                    <div
                                        className={`pointer-events-none absolute inset-0 -z-10 bg-gradient-to-r ${
                                            isDarkMode ? 'from-orange-500/10' : 'from-orange-100/40'
                                        } to-transparent`}
                                    />
                                )}
                                <div className="relative">
                                    <Icon
                                        size={20}
                                        className={`flex-shrink-0 transition-all duration-300 group-hover:scale-110 ${
                                            isActive ? 'text-orange-500' : 'group-hover:text-orange-400'
                                        }`}
                                    />
                                </div>
                                {(!sidebarCollapsed || mobileDrawerOpen) && (
                                    <span className="relative z-10 transition-transform duration-300 group-hover:translate-x-1">
                                        {item.label}
                                    </span>
                                )}

                                {sidebarCollapsed && !mobileDrawerOpen && (
                                    <span className="pointer-events-none absolute left-full z-50 ml-2 translate-x-1 whitespace-nowrap rounded-xl bg-gray-900/90 px-3 py-1 text-xs font-medium text-white opacity-0 shadow-lg transition group-hover:translate-x-0 group-hover:opacity-100">
                                        {item.label}
                                    </span>
                                )}
                            </button>
                        );
                    })}
                </nav>
            </aside>
        </>
    );
}

export default CustomerSidebar;
