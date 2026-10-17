import { useNavigate, useLocation } from "react-router-dom"
import axios from "axios"
import { useState, useRef, useEffect } from "react"
import { getApiBaseUrl } from "../services/apiClient"
import { Menu, X, Home, ShoppingCart, Package, User, Settings, LogOut, Utensils } from "lucide-react"

const navLinks = [
    { label: 'Home', path: '/home', icon: Home },
    { label: 'Cart', path: '/cart', icon: ShoppingCart },
    { label: 'Orders', path: '/orders', icon: Package },
    { label: 'Profile', path: '/profile', icon: User },
]

function Header() {
    const navigate = useNavigate()
    const location = useLocation()
    const API_URL = getApiBaseUrl()
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
    const [showLogoutConfirm, setShowLogoutConfirm] = useState(false)
    const logoutRef = useRef(null)

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (logoutRef.current && !logoutRef.current.contains(e.target)) {
                setShowLogoutConfirm(false)
            }
        }
        if (showLogoutConfirm) {
            document.addEventListener("mousedown", handleClickOutside)
        }
        return () => document.removeEventListener("mousedown", handleClickOutside)
    }, [showLogoutConfirm])

    const handleLogout = async () => {
        try {
            const response = await axios.post(`${API_URL}/api/customer/logout`, {}, {
                withCredentials: true
            })
            if (response.data.success) {
                localStorage.removeItem('authToken');
                navigate("/")
            }
        } catch (error) {
            localStorage.removeItem('authToken');
            navigate("/")
        }
    }

    const isActive = (path) => location.pathname === path

    return (
        <header className="sticky top-0 z-50 border-b border-[#E5E7EB] bg-white/80 backdrop-blur-xl">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-16">
                    {/* Logo */}
                    <button
                        onClick={() => navigate('/home')}
                        className="flex items-center gap-2.5 hover:opacity-80 transition-opacity"
                    >
                        <div className="w-8 h-8 rounded-lg bg-[#EA580C] flex items-center justify-center">
                            <Utensils size={16} className="text-white" />
                        </div>
                        <span className="text-lg font-bold tracking-tight text-[#171717]">
                            Kain<span className="text-[#EA580C]">Go</span>
                        </span>
                    </button>

                    {/* Desktop Navigation */}
                    <nav className="hidden md:flex items-center gap-1">
                        {navLinks.map((link) => (
                            <button
                                key={link.path}
                                onClick={() => navigate(link.path)}
                                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                                    isActive(link.path)
                                        ? 'bg-[#FFF7ED] text-[#EA580C]'
                                        : 'text-[#6B7280] hover:text-[#171717] hover:bg-[#F5F5F5]'
                                }`}
                            >
                                <link.icon size={16} />
                                {link.label}
                            </button>
                        ))}
                    </nav>

                    {/* Desktop Actions */}
                    <div className="hidden md:flex items-center gap-3" ref={logoutRef}>
                        <div className="relative">
                            <button
                                onClick={() => setShowLogoutConfirm(!showLogoutConfirm)}
                                className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-[#6B7280] border border-[#E5E7EB] hover:border-[#D1D5DB] hover:bg-[#F9FAFB] transition-all duration-200"
                            >
                                <LogOut size={16} />
                                Logout
                            </button>
                            {showLogoutConfirm && (
                                <div className="absolute right-0 top-full mt-2 w-64 rounded-xl border border-[#E5E7EB] bg-white p-4 shadow-lg z-50">
                                    <p className="text-sm font-semibold text-[#171717] mb-1">Are you sure?</p>
                                    <p className="text-xs text-[#6B7280] mb-3">You'll need to sign in again to access your account.</p>
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => { setShowLogoutConfirm(false); handleLogout(); }}
                                            className="flex-1 px-3 py-2 text-xs font-semibold rounded-lg bg-[#EA580C] text-white hover:bg-[#DC2626] transition-colors"
                                        >
                                            Yes, Logout
                                        </button>
                                        <button
                                            onClick={() => setShowLogoutConfirm(false)}
                                            className="flex-1 px-3 py-2 text-xs font-semibold rounded-lg border border-[#E5E7EB] text-[#6B7280] hover:bg-[#F5F5F5] transition-colors"
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Mobile Menu Button */}
                    <button
                        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                        className="md:hidden p-2 rounded-lg text-[#6B7280] hover:bg-[#F5F5F5] transition-colors"
                        aria-label="Toggle menu"
                    >
                        {isMobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
                    </button>
                </div>

                {/* Mobile Navigation */}
                {isMobileMenuOpen && (
                    <div className="md:hidden border-t border-[#E5E7EB] py-3">
                        <div className="flex flex-col gap-1">
                            {navLinks.map((link) => (
                                <button
                                    key={link.path}
                                    onClick={() => {
                                        navigate(link.path)
                                        setIsMobileMenuOpen(false)
                                    }}
                                    className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                                        isActive(link.path)
                                            ? 'bg-[#FFF7ED] text-[#EA580C]'
                                            : 'text-[#6B7280] hover:bg-[#F5F5F5] hover:text-[#171717]'
                                    }`}
                                >
                                    <link.icon size={18} />
                                    {link.label}
                                </button>
                            ))}
                            <div className="border-t border-[#E5E7EB] mt-2 pt-2">
                                <button
                                    onClick={() => { setIsMobileMenuOpen(false); setShowLogoutConfirm(true); }}
                                    className="flex items-center gap-3 w-full px-4 py-3 rounded-lg text-sm font-medium text-[#DC2626] hover:bg-[#FEF2F2] transition-colors"
                                >
                                    <LogOut size={18} />
                                    Logout
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </header>
    )
}

export default Header
