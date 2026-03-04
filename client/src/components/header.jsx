import { useNavigate, useLocation } from "react-router-dom"
import axios from "axios"
import { useState } from "react"

function Header() {
    const navigate = useNavigate()
    const location = useLocation()
    const API_URL = import.meta.env.VITE_API_URL
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

    const handleLogout = async () => {
        if (!window.confirm("Are you sure you want to logout?")) return

        try {
            const response = await axios.post(`${API_URL}/logout`, {}, {
                withCredentials: true
            })
            if (response.data.success) {
                navigate("/") 
            } else {
                console.error("Logout failed:", response.data.message)
            }
        } catch (error) {
            console.error("Logout failed:", error)
        }
    }

    const navLinks = [
        { label: 'Home', path: '/home' },
        { label: 'Bookings', path: '/bookings' },
        { label: 'Rooms', path: '/rooms' },
        { label: 'Profile', path: '/profile' },
        { label: 'Contact', path: '/contact' }
    ]

    const isActive = (path) => location.pathname === path

    return (
        <header className="shadow-lg text-white sticky top-0 z-50" style={{background: 'linear-gradient(135deg, rgba(20, 20, 40, 0.95) 0%, rgba(75, 0, 130, 0.2) 100%)', borderBottom: '2px solid rgba(139, 0, 0, 0.6)'}}>
            <div className="max-w-7xl mx-auto px-4 sm:px-8">
                <div className="flex justify-between items-center py-4">
                    {/* Logo */}
                    <div 
                        onClick={() => navigate('/home')}
                        className="flex items-center cursor-pointer hover:opacity-80 transition-opacity"
                    >
                        <h2 className="text-2xl font-bold" style={{color: '#ff6b6b', textShadow: '0 0 10px rgba(255, 107, 107, 0.5)'}}>
                            🏨 Hotel Transylvania
                        </h2>
                    </div>

                    {/* Desktop Navigation */}
                    <nav className="hidden md:flex items-center gap-8">
                        {navLinks.map((link) => (
                            <button
                                key={link.path}
                                onClick={() => navigate(link.path)}
                                className={`text-sm font-semibold transition-all pb-2 ${
                                    isActive(link.path)
                                        ? 'border-b-2'
                                        : 'hover:text-red-400'
                                }`}
                                style={{
                                    color: isActive(link.path) ? '#ff6b6b' : '#c0c0c0',
                                    borderColor: isActive(link.path) ? '#8b0000' : 'transparent'
                                }}
                            >
                                {link.label}
                            </button>
                        ))}
                    </nav>

                    {/* Logout Button */}
                    <button
                        onClick={handleLogout}
                        className="hidden md:block rounded-lg px-4 py-2 text-sm font-semibold transition-all hover:shadow-lg"
                        style={{backgroundColor: '#8b0000', color: '#fff'}}
                    >
                        Logout
                    </button>

                    {/* Mobile Menu Button */}
                    <button
                        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                        className="md:hidden text-white focus:outline-none"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                        </svg>
                    </button>
                </div>

                {/* Mobile Navigation */}
                {isMobileMenuOpen && (
                    <nav className="md:hidden pb-4 border-t" style={{borderColor: 'rgba(139, 0, 0, 0.3)'}}>
                        {navLinks.map((link) => (
                            <button
                                key={link.path}
                                onClick={() => {
                                    navigate(link.path)
                                    setIsMobileMenuOpen(false)
                                }}
                                className={`block w-full text-left py-3 px-4 text-sm font-semibold transition-all ${
                                    isActive(link.path)
                                        ? 'border-l-4'
                                        : 'hover:bg-white hover:bg-opacity-5'
                                }`}
                                style={{
                                    color: isActive(link.path) ? '#ff6b6b' : '#c0c0c0',
                                    borderColor: isActive(link.path) ? '#8b0000' : 'transparent'
                                }}
                            >
                                {link.label}
                            </button>
                        ))}
                        <button
                            onClick={() => {
                                handleLogout()
                                setIsMobileMenuOpen(false)
                            }}
                            className="w-full text-left py-3 px-4 text-sm font-semibold mt-2"
                            style={{backgroundColor: '#8b0000', color: '#fff', borderTop: '1px solid rgba(139, 0, 0, 0.3)'}}
                        >
                            Logout
                        </button>
                    </nav>
                )}
            </div>
        </header>
    )
}

export default Header