import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
    Menu, ChevronRight, Home, ShoppingCart, Package, User, Settings, X,
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import kaingoLogo from '../assets/kaingo-logo.svg';

const menuItems = [
    { id: "home", label: "Home", icon: Home, path: "/home" },
    { id: "cart", label: "My Cart", icon: ShoppingCart, path: "/cart" },
    { id: "orders", label: "Orders", icon: Package, path: "/orders" },
    { id: "profile", label: "Profile", icon: User, path: "/profile" },
    { id: "settings", label: "Settings", icon: Settings, path: "/settings" },
];

const bottomTabs = [
    { id: "home", label: "Home", icon: Home, path: "/home" },
    { id: "cart", label: "Cart", icon: ShoppingCart, path: "/cart" },
    { id: "orders", label: "Orders", icon: Package, path: "/orders" },
    { id: "profile", label: "Profile", icon: User, path: "/profile" },
    { id: "more", label: "More", icon: Menu },
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
            return () => { document.body.style.overflow = prev; };
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
        (location.pathname === '/orders' ? 'orders'
            : location.pathname === '/cart' ? 'cart'
            : location.pathname === '/profile' ? 'profile'
            : location.pathname === '/settings' ? 'settings'
            : 'home');

    const desktopWidth = sidebarCollapsed ? 'md:w-[72px]' : 'md:w-[240px]';

    const sidebarBg = isDarkMode
        ? 'bg-[#1A1A1A] border-[#2A2A2A]'
        : 'bg-white border-[#E5E7EB]';

    const activeItemBg = isDarkMode
        ? 'bg-[#252525] text-[#EA580C]'
        : 'bg-[#FFF7ED] text-[#EA580C]';

    const inactiveItemText = isDarkMode
        ? 'text-[#A0A0A0] hover:text-[#F5F5F5] hover:bg-[#222222]'
        : 'text-[#6B7280] hover:text-[#171717] hover:bg-[#F5F5F5]';

    return (
        <>
            {/* Mobile backdrop */}
            <div
                className={`fixed inset-0 z-40 bg-black/40 backdrop-blur-sm transition-opacity duration-200 md:hidden ${
                    mobileDrawerOpen ? 'opacity-100' : 'pointer-events-none opacity-0'
                }`}
                onClick={() => setMobileDrawerOpen(false)}
                aria-hidden
            />

            {/* Sidebar */}
            <aside
                className={`fixed left-0 top-0 z-50 h-screen flex flex-col border-r ${sidebarBg} transition-all duration-300 ease-out ${desktopWidth} w-[min(240px,calc(100vw-1rem))] max-w-[85vw] -translate-x-full ${
                    mobileDrawerOpen ? 'translate-x-0' : ''
                } md:translate-x-0`}
            >
                {/* Logo area */}
                <div className={`flex h-16 items-center justify-between border-b ${isDarkMode ? 'border-[#2A2A2A]' : 'border-[#E5E7EB]'} px-4`}>
                    <div className="flex min-w-0 items-center gap-2.5">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-lg">
                            <img src={kaingoLogo} alt="KainGo" className="h-full w-full object-contain" />
                        </div>
                        {(!sidebarCollapsed || mobileDrawerOpen) && (
                            <span className={`truncate font-bold text-lg tracking-tight ${
                                isDarkMode ? 'text-white' : 'text-[#171717]'
                            }`}>
                                Kain<span className="text-[#EA580C]">Go</span>
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
                            <X size={20} className={isDarkMode ? 'text-[#A0A0A0]' : 'text-[#6B7280]'} />
                        </button>
                        <button
                            type="button"
                            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                            className={`hidden rounded-lg p-2 transition-colors md:flex md:items-center ${
                                isDarkMode ? 'text-[#666666] hover:bg-[#252525] hover:text-[#A0A0A0]' : 'text-[#9CA3AF] hover:bg-[#F5F5F5] hover:text-[#6B7280]'
                            }`}
                            aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                        >
                            {sidebarCollapsed ? <ChevronRight size={18} /> : <Menu size={18} />}
                        </button>
                    </div>
                </div>

                {/* Navigation */}
                <nav className="relative z-20 flex flex-1 flex-col gap-1 overflow-y-auto px-3 py-4">
                    {menuItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = currentTab === item.id;

                        return (
                            <button
                                key={item.id}
                                type="button"
                                onClick={() => handleItemClick(item)}
                                className={`group relative flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium transition-all duration-200 ${
                                    isActive ? activeItemBg : inactiveItemText
                                }`}
                                title={sidebarCollapsed && !mobileDrawerOpen ? item.label : ''}
                            >
                                <Icon
                                    size={18}
                                    className={`flex-shrink-0 transition-colors duration-200 ${
                                        isActive ? 'text-[#EA580C]' : ''
                                    }`}
                                />
                                {(!sidebarCollapsed || mobileDrawerOpen) && (
                                    <span>{item.label}</span>
                                )}

                                {/* Tooltip when collapsed */}
                                {sidebarCollapsed && !mobileDrawerOpen && (
                                    <span className="pointer-events-none absolute left-full z-50 ml-2 whitespace-nowrap rounded-lg bg-[#171717] px-3 py-1.5 text-xs font-medium text-white opacity-0 shadow-lg transition-all duration-200 group-hover:translate-x-0 group-hover:opacity-100">
                                        {item.label}
                                    </span>
                                )}
                            </button>
                        );
                    })}
                </nav>

                {/* Sidebar footer */}
                {(!sidebarCollapsed || mobileDrawerOpen) && (
                    <div className={`border-t px-4 py-4 ${isDarkMode ? 'border-[#2A2A2A]' : 'border-[#E5E7EB]'}`}>
                        <p className={`text-[11px] font-medium ${isDarkMode ? 'text-[#666666]' : 'text-[#9CA3AF]'}`}>
                            &copy; 2026 KainGo
                        </p>
                    </div>
                )}
            </aside>

            {/* Mobile bottom navigation */}
            <nav
                className={`fixed inset-x-0 bottom-0 z-30 flex items-stretch border-t md:hidden ${sidebarBg}`}
                style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
                aria-label="Mobile primary navigation"
            >
                {bottomTabs.map((item) => {
                    const Icon = item.icon;
                    const isActive = item.id !== 'more' && currentTab === item.id;
                    return (
                        <button
                            key={item.id}
                            type="button"
                            onClick={() => {
                                if (item.id === 'more') {
                                    setMobileDrawerOpen(true);
                                } else {
                                    handleItemClick(item);
                                }
                            }}
                            className={`flex flex-1 flex-col items-center justify-center gap-0.5 py-1.5 text-[10px] font-medium transition-colors ${
                                isActive
                                    ? 'text-[#EA580C]'
                                    : isDarkMode ? 'text-[#A0A0A0] hover:text-[#F5F5F5]' : 'text-[#6B7280] hover:text-[#171717]'
                            }`}
                            aria-current={isActive ? 'page' : undefined}
                        >
                            <Icon size={20} strokeWidth={isActive ? 2.4 : 2} />
                            <span>{item.label}</span>
                        </button>
                    );
                })}
            </nav>
        </>
    );
}

export default CustomerSidebar;
