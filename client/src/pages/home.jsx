import { useState, useEffect, useRef } from "react"
import { useNavigate } from "react-router-dom"
import {
    Menu,
    X,
    Search,
    Bell,
    MessageCircle,
    User,
    Heart,
    ShoppingCart,
    Star,
    MapPin,
    Clock,
    Zap,
    Home,
    Utensils,
    Tag,
    Settings,
    LogOut,
    ChevronDown,
    ChevronRight,
    Plus,
    Minus,
    Truck,
    ChefHat,
    TrendingUp,
    Grid3x3,
    List,
    Sliders,
    ArrowRight,
    Check,
    AlertCircle,
    Package,
    Trophy,
    Percent,
    CreditCard,
    Sun,
    Moon,
    LayoutDashboard,
    Receipt,
    Trash2
} from "lucide-react"
import { useTheme } from "../context/ThemeContext"
import { mockRestaurantsData, mockFoodItems, mockCategories, mockOrderService, mockCartService, mockAuthService } from "../services/mockData"
import { createApiClient } from "../services/apiClient"

const menuItems = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard }, // Changed icon to LayoutDashboard as per instruction's code edit
    { id: "browse", label: "Browse Food", icon: Utensils },
    { id: "categories", label: "Categories", icon: Tag },
    { id: "cart", label: "My Cart", icon: ShoppingCart }, // Modified label and ensured it's a distinct item
    { id: "orders", label: "Orders", icon: Package },
    { id: "notifications", label: "Notifications", icon: Bell },
    { id: "profile", label: "Profile", icon: User },
    { id: "settings", label: "Settings", icon: Settings },
    { id: "logout", label: "Logout", icon: LogOut },
]

function HomePage() {
    const navigate = useNavigate()
    const { isDarkMode, toggleTheme, colors } = useTheme()
    const API_URL = import.meta.env.VITE_API_URL || "https://to-do-list-1-c0qq.onrender.com"
    const apiClient = createApiClient()
    const MAX_RETRIES = 3

    // State management
    const [sidebarOpen, setSidebarOpen] = useState(true)
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
    const [cartOpen, setCartOpen] = useState(false)
    const [notificationDropdown, setNotificationDropdown] = useState(false)
    const [profileDropdown, setProfileDropdown] = useState(false)
    const [searchQuery, setSearchQuery] = useState("")
    const [activeTab, setActiveTab] = useState("dashboard")
    const [favorites, setFavorites] = useState(new Set())
    const [cart, setCart] = useState([])
    const [orders, setOrders] = useState([])
    const [categories, setCategories] = useState([])
    const [restaurants, setRestaurants] = useState([])
    const [popularFoods, setPopularFoods] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState("")
    const [message, setMessage] = useState("")
    const [messageType, setMessageType] = useState("")
    const [retryCount, setRetryCount] = useState(0)
    const [userRole, setUserRole] = useState("customer")
    const [viewMode, setViewMode] = useState("grid")
    const [priceFilter, setPriceFilter] = useState(50)
    const [minRating, setMinRating] = useState(0)
    const [maxDistance, setMaxDistance] = useState(10)
    const [featuredScrollIndex, setFeaturedScrollIndex] = useState(0)
    const [userName, setUserName] = useState("Guest")
    const [showCheckoutDialog, setShowCheckoutDialog] = useState(false)
    const [checkoutInfo, setCheckoutInfo] = useState({
        deliveryAddress: "",
        deliveryCity: "",
        phone: ""
    })
    const [userProfile, setUserProfile] = useState(null)

    // Restaurant Owner State
    const [liveOrders, setLiveOrders] = useState([])

    const fetchLiveOrders = async () => {
        if (userRole !== 'owner') return;
        try {
            const res = await apiClient.get('/api/owner/orders');
            if (res.data?.success && res.data.orders) {
                const formatted = res.data.orders.map(o => ({
                    id: o.id,
                    status: o.order_status || 'pending',
                    location: `${o.delivery_address || 'Missing Address'}, ${o.delivery_city || ''}`,
                    time: new Date(o.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}),
                    total: Number(o.total_amount) || 0
                }));
                setLiveOrders(formatted);
            }
        } catch (err) {
            console.error("Failed fetching live orders:", err);
        }
    }

    useEffect(() => {
        if (userRole === 'owner') {
            fetchLiveOrders();
            const interval = setInterval(fetchLiveOrders, 10000); // Sync every 10s
            return () => clearInterval(interval);
        }
    }, [userRole]);

    const updateOrderStatus = async (id, newStatus) => {
        setLiveOrders(prev => prev.map(o => o.id === id ? { ...o, status: newStatus } : o))
        try {
            await apiClient.put(`/api/owner/orders/${id}/status`, { status: newStatus });
        } catch(err) {
            console.error("Failed to update status in DB:", err);
            fetchLiveOrders(); // rollback visual if network failed
        }
    }

    const getOrderStatusColor = (status) => {
        switch(status) {
            case "pending": return "bg-yellow-100 text-yellow-700 border-yellow-200"
            case "accepted": return "bg-sky-100 text-sky-700 border-sky-200"
            case "preparing": return "bg-blue-100 text-blue-700 border-blue-200"
            case "prepared": return "bg-purple-100 text-purple-700 border-purple-200"
            case "out_for_delivery": return "bg-orange-100 text-orange-700 border-orange-200"
            case "delivered": return "bg-emerald-100 text-emerald-700 border-emerald-200"
            default: return "bg-gray-100 text-gray-700 border-gray-200"
        }
    }

    const featuredRef = useRef(null)
    const browseFoodRef = useRef(null)

    // Fetch data from backend
    useEffect(() => {
        fetchData()
        // Load cart from localStorage
        const savedCart = mockCartService.getCart()
        setCart(savedCart)
    }, [])

    const validateData = (data, requiredFields) => {
        return Array.isArray(data) && data.every(item => requiredFields.every(field => item.hasOwnProperty(field)))
    }

    const fetchData = async (attempt = 0) => {
        try {
            setLoading(true)
            setError("")
            setMessage("")

            // Fetch data from real APIs
            const [catRes, restRes, foodRes, profileRes] = await Promise.all([
                apiClient.get('/api/categories').catch(() => ({ data: { success: false } })),
                apiClient.get('/api/restaurants').catch(() => ({ data: { success: false } })),
                apiClient.get('/api/food').catch(() => ({ data: { success: false } })),
                apiClient.get('/api/profile').catch(() => ({ data: { success: false } }))
            ])

            if (profileRes.data?.success && profileRes.data.profile) {
                const profile = profileRes.data.profile;
                if (profile.full_name) {
                    setUserName(profile.full_name.split(' ')[0]) // Get first name
                } else if (profile.email) {
                    setUserName(profile.email.split('@')[0])
                }

                setCheckoutInfo({
                    deliveryAddress: profile.address || "",
                    deliveryCity: profile.city || "",
                    phone: profile.phone || ""
                })
                setUserProfile(profile)
            }

            if (catRes.data?.success) setCategories(catRes.data.categories)
            else setCategories(mockCategories)

            if (restRes.data?.success) setRestaurants(restRes.data.restaurants)
            else setRestaurants(mockRestaurantsData)

            if (foodRes.data?.success) {
                const popular = Array.isArray(foodRes.data.foods) ? foodRes.data.foods : [];
                setPopularFoods(popular) // Remove the slice so ALL foods show!
            } else {
                const allFoods = []
                Object.values(mockFoodItems).forEach(restaurantFoods => {
                    allFoods.push(...restaurantFoods)
                })
                setPopularFoods(allFoods.slice(0, 8))
            }

            setRetryCount(0)
            setLoading(false)
            console.log("Successfully loaded data")
        } catch (error) {
            console.error(`Error loading data:`, error.message)
            setError("Unable to load data")
            setLoading(false)
        }
    }

    const handleRetry = () => {
        setRetryCount(0)
        fetchData()
    }

    // Mock order data
    const mockOrders = [
        { id: "ORD001", status: "completed", date: "2024-03-01", total: 35.98, items: 3 },
        { id: "ORD002", status: "out_for_delivery", date: "2024-03-02", total: 28.50, items: 2 },
        { id: "ORD003", status: "preparing", date: "2024-03-02", total: 42.99, items: 4 },
    ]

    // Fetch orders from backend
    const fetchOrders = async () => {
        try {
            const response = await apiClient.get('/orders')
            let rawData = [];
            if (response.data?.success && response.data.orders) {
                rawData = response.data.orders;
            } else if (Array.isArray(response.data)) {
                rawData = response.data;
            }
            
            if (rawData.length > 0) {
                const mappedOrders = rawData.map(o => ({
                    id: `ORD-${o.id}`,
                    status: o.order_status || o.status || "pending",
                    date: o.created_at ? new Date(o.created_at).toLocaleDateString() : new Date().toLocaleDateString(),
                    total: Number(o.total_amount || 0).toFixed(2),
                    items: o.items_count || (o.items ? o.items.length : 1)
                }));
                setOrders(mappedOrders);
            } else {
                setOrders(mockOrders);
            }
        } catch (error) {
            console.warn("Failed to fetch orders:", error.message)
            setOrders(mockOrders)
            // Don't show error for orders - just use mock data silently
        }
    }

    useEffect(() => {
        fetchOrders()
        const interval = setInterval(fetchOrders, 10000);
        return () => clearInterval(interval);
    }, [])

    // Toggle favorite with backend sync
    const toggleFavorite = async (foodId) => {
        const newFavorites = new Set(favorites)
        if (newFavorites.has(foodId)) {
            newFavorites.delete(foodId)
        } else {
            newFavorites.add(foodId)
        }
        setFavorites(newFavorites)

        // Sync with backend
        try {
            const response = await apiClient.post('/favorites/toggle', { foodId })
            if (!response.data?.success) {
                console.warn("Failed to sync favorite status")
            }
        } catch (error) {
            console.warn("Failed to sync favorites with backend:", error.message)
            setMessage("Local favorite saved, but couldn't sync to server")
            setMessageType('warning')
        }
    }

    // Add to cart with backend sync
    const addToCart = async (food) => {
        try {
            const existingItem = cart.find(item => item.id === food.id)
            if (existingItem) {
                setCart(cart.map(item =>
                    item.id === food.id
                        ? { ...item, quantity: item.quantity + 1 }
                        : item
                ))
            } else {
                setCart([...cart, { ...food, quantity: 1 }])
            }

            // Sync with backend
            const response = await apiClient.post('/cart/add', { foodId: food.id, quantity: 1 })
            if (!response.data?.success) {
                console.warn("Failed to add item to backend cart")
            }
        } catch (error) {
            console.warn("Failed to add to cart:", error.message)
            setMessage("Item added locally, but couldn't sync to server")
            setMessageType('warning')
        }
    }

    // Remove from cart with backend sync
    const removeFromCart = async (foodId) => {
        try {
            setCart(cart.filter(item => item.id !== foodId))

            // Sync with backend
            const response = await apiClient.post('/cart/remove', { foodId })
            if (!response.data?.success) {
                console.warn("Failed to remove item from backend cart")
            }
        } catch (error) {
            console.warn("Failed to remove from cart:", error.message)
            setMessage("Item removed locally, but couldn't sync to server")
            setMessageType('warning')
        }
    }

    // Update quantity with backend sync
    const updateQuantity = async (foodId, quantity) => {
        try {
            if (quantity <= 0) {
                removeFromCart(foodId)
            } else {
                setCart(cart.map(item =>
                    item.id === foodId
                        ? { ...item, quantity }
                        : item
                ))

                // Sync with backend
                const response = await apiClient.post('/cart/update', { foodId, quantity })
                if (!response.data?.success) {
                    console.warn("Failed to update cart on backend")
                }
            }
        } catch (error) {
            console.warn("Failed to update quantity:", error.message)
            setMessage("Quantity updated locally, but couldn't sync to server")
            setMessageType('warning')
        }
    }

    // Calculate totals defaults to 0 if missing discount properties to prevent NaN math failure.
    const subtotal = cart.reduce((sum, item) => {
        const itemDiscount = item.discount || 0;
        const finalPrice = item.price * (1 - itemDiscount / 100);
        return sum + (finalPrice * item.quantity);
    }, 0)
    const tax = subtotal * 0.1
    const deliveryFee = cart.length > 0 ? 2.99 : 0
    const total = subtotal + tax + deliveryFee

    // Filter foods (search + price + rating)
    const filteredFoods = popularFoods.filter((food) => {
        const matchesSearch =
            food.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            food.restaurant.toLowerCase().includes(searchQuery.toLowerCase())
        const effectivePrice = food.price * (1 - (food.discount || 0) / 100)
        const withinPrice = effectivePrice <= priceFilter
        const meetsRating = (food.rating || 0) >= minRating
        return matchesSearch && withinPrice && meetsRating
    })

    // Filter nearby restaurants based on distance
    const filteredRestaurants = restaurants.filter((restaurant) => {
        if (!restaurant.distance) return true
        const numericDistance = parseFloat(restaurant.distance)
        return isNaN(numericDistance) ? true : numericDistance <= maxDistance
    })

    // Handle checkout
    const handleCheckout = async () => {
        try {
            if (cart.length === 0) {
                setMessage("Your cart is empty")
                setMessageType("error")
                setShowCheckoutDialog(false)
                return
            }

            const response = await apiClient.post('/orders/create', {
                items: cart,
                subtotal,
                tax,
                deliveryFee,
                total,
                deliveryAddress: checkoutInfo.deliveryAddress,
                deliveryCity: checkoutInfo.deliveryCity
            })

            if (response.data?.success) {
                setMessage("Order placed successfully! 🎉")
                setMessageType("success")
                setCart([])
                setCartOpen(false)
                setShowCheckoutDialog(false)
                // Refresh orders
                await fetchOrders()
                setTimeout(() => {
                    setMessage("")
                }, 3000)
            } else {
                setMessage(response.data?.message || "Failed to place order")
                setMessageType("error")
            }
        } catch (error) {
            const errorMsg = error.response?.data?.message || error.message || "Failed to place order"
            setMessage(`Error: ${errorMsg}`)
            setMessageType("error")
            setShowCheckoutDialog(false)
            console.error("Checkout error:", error)
        }
    }

    // Featured restaurants horizontal scroll controls
    const handleFeaturedScroll = (direction) => {
        if (!featuredRef.current) return
        const container = featuredRef.current
        const scrollAmount = container.clientWidth * 0.8
        const nextIndex = direction === "next" ? featuredScrollIndex + 1 : featuredScrollIndex - 1
        setFeaturedScrollIndex(Math.max(0, nextIndex))
        container.scrollBy({
            left: direction === "next" ? scrollAmount : -scrollAmount,
            behavior: "smooth",
        })
    }

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: colors.background }}>
                <div className="text-center">
                    <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mb-4"></div>
                    <p style={{ color: colors.text }} className="text-lg">Loading BiteHub...</p>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen" style={{ backgroundColor: colors.background }}>
            {/* SIDEBAR */}
            <aside
                className={`fixed left-0 top-0 h-screen transition-all duration-300 ease-out z-40 ${
                    sidebarCollapsed ? "w-20" : "w-64"
                } ${!sidebarOpen && "hidden md:block"}`}
                style={{ backgroundColor: isDarkMode ? '#1a1a2e' : '#ffffff', borderRightColor: colors.border }}
            >
                {/* Logo/Brand */}
                <div className="flex items-center justify-between h-16 px-4 border-b border-gray-200">
                    {!sidebarCollapsed && (
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg flex items-center justify-center text-white font-bold text-lg">
                                B
                            </div>
                            <span className="font-bold text-lg text-gray-900">BiteHub</span>
                        </div>
                    )}
                            <button
                        onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                        className="p-1 hover:bg-gray-100 rounded-lg transition"
                    >
                        {sidebarCollapsed ? <ChevronRight size={20} /> : <Menu size={20} />}
                    </button>
                </div>

                {/* Menu Items */}
                <nav className="flex-1 overflow-y-auto py-4">
                    {menuItems.map((item) => {
                        const Icon = item.icon
                        return (
                            <button
                                key={item.id}
                                onClick={() => {
                                    if (item.id === "logout") {
                                        navigate("/login")
                                        return
                                    }
                                    if (item.id === "cart") {
                                        setCartOpen(true)
                                    } else if (item.id === "notifications") {
                                        setNotificationDropdown(true)
                                    } else if (item.id === "browse") {
                                        setActiveTab("dashboard")
                                        setTimeout(() => {
                                            browseFoodRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
                                        }, 100)
                                    } else if (item.id === "profile") {
                                        setProfileDropdown(true)
                                    } else {
                                        setActiveTab(item.id)
                                    }
                                }}
                                className={`group relative w-full flex items-center gap-3 px-4 py-3 text-sm font-medium transition-all rounded-r-2xl ${
                                    activeTab === item.id
                                        ? "bg-orange-50 text-orange-600 border-l-4 border-orange-500 shadow-sm"
                                        : "text-gray-700 hover:bg-gray-50"
                                }`}
                                title={sidebarCollapsed ? item.label : ""}
                            >
                                <Icon size={20} className="flex-shrink-0" />
                                {!sidebarCollapsed && <span>{item.label}</span>}

                                {/* Tooltip for collapsed sidebar */}
                                {sidebarCollapsed && (
                                    <span className="pointer-events-none absolute left-full ml-2 whitespace-nowrap rounded-xl bg-gray-900 px-3 py-1 text-xs font-medium text-white opacity-0 shadow-lg transition group-hover:opacity-100 group-hover:translate-x-0 translate-x-1">
                                        {item.label}
                                    </span>
                                )}
                            </button>
                        )
                    })}
                </nav>
            </aside>

            {/* Main Content */}
            <div className={`transition-all duration-300 ${sidebarCollapsed ? "md:ml-20" : "md:ml-64"}`}>
                {/* TOP NAVIGATION BAR */}
                <header className="sticky top-0 z-30 bg-white border-b border-gray-200 shadow-sm">
                    <div className="flex items-center justify-between h-16 px-4 gap-4">
                        {/* Mobile Menu Toggle */}
                        <button
                            onClick={() => setSidebarOpen(!sidebarOpen)}
                            className="md:hidden p-2 hover:bg-gray-100 rounded-lg"
                        >
                            {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
                        </button>

                        {/* Search Bar */}
                        <div className="flex-1 max-w-md">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder="Search food, restaurants..."
                                    className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-full focus:outline-none focus:ring-2 focus:ring-orange-500 focus:bg-white transition"
                                />
                            </div>
                        </div>

                        {/* Right Icons */}
                        <div className="flex items-center gap-2">
                            {/* Notification Bell */}
                            <div className="relative">
                                <button
                                    onClick={() => setNotificationDropdown(!notificationDropdown)}
                                    className="relative p-2 hover:bg-gray-100 rounded-lg transition"
                                >
                                    <Bell size={20} className="text-gray-600" />
                                    <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
                                </button>
                                {notificationDropdown && (
                                    <div className="absolute right-0 mt-2 w-80 bg-white border border-gray-200 rounded-xl shadow-lg p-4 animate-fade-in space-y-3">
                                        <h3 className="font-semibold text-gray-900">Notifications</h3>
                                        <div className="space-y-2 max-h-64 overflow-y-auto">
                                            <div className="p-2 bg-blue-50 rounded-lg text-sm text-gray-600">Your order #1234 is ready for delivery</div>
                                            <div className="p-2 bg-green-50 rounded-lg text-sm text-gray-600">Special offer: 20% off on Pizza!</div>
                                            <div className="p-2 bg-orange-50 rounded-lg text-sm text-gray-600">New restaurant added near you</div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Cart Icon */}
                            <button
                                onClick={() => setActiveTab('cart')}
                                className="relative p-2 hover:bg-gray-100 rounded-lg transition"
                            >
                                <ShoppingCart size={20} className="text-gray-600" />
                                {cart.length > 0 && (
                                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-orange-500 text-white text-xs font-bold rounded-full flex items-center justify-center animate-bounce">
                                        {cart.length}
                                    </span>
                                )}
                            </button>

                            {/* Profile Dropdown */}
                            <div className="relative">
                                <button
                                    onClick={() => setProfileDropdown(!profileDropdown)}
                                    className="flex items-center gap-2 p-1 hover:bg-gray-100 rounded-lg transition"
                                >
                                    <div className="w-8 h-8 bg-gradient-to-br from-orange-400 to-orange-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                                        J
                                    </div>
                                    <ChevronDown size={16} className="text-gray-600" />
                                </button>
                                {profileDropdown && (
                                    <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-xl shadow-lg p-4 animate-fade-in space-y-2">
                                        <button 
                                            onClick={() => { setActiveTab("profile"); setProfileDropdown(false); }}
                                            className="w-full text-left px-3 py-2 rounded-lg hover:bg-gray-50 text-sm text-gray-700 flex items-center gap-2"
                                        >
                                            <User size={16} /> My Profile
                                        </button>
                                        <button className="w-full text-left px-3 py-2 rounded-lg hover:bg-gray-50 text-sm text-gray-700 flex items-center gap-2">
                                            <Settings size={16} /> Settings
                                        </button>
                                        <button
                                            onClick={() =>
                                                setUserRole((prev) => (prev === "customer" ? "owner" : "customer"))
                                            }
                                            className="w-full text-left px-3 py-2 rounded-lg hover:bg-orange-50 text-sm text-orange-600 flex items-center gap-2"
                                        >
                                            <ChefHat size={16} />{" "}
                                            {userRole === "customer" ? "Switch to Owner View" : "Switch to Customer View"}
                                        </button>
                                        <button 
                                            onClick={toggleTheme}
                                            className="w-full text-left px-3 py-2 rounded-lg hover:bg-blue-50 text-sm text-blue-600 flex items-center gap-2"
                                        >
                                            {isDarkMode ? <Sun size={16} /> : <Moon size={16} />}
                                            {isDarkMode ? "Light Mode" : "Dark Mode"}
                                        </button>
                                        <hr className="my-2" />
                                        <button
                                            onClick={() => navigate("/login")}
                                            className="w-full text-left px-3 py-2 rounded-lg hover:bg-red-50 text-sm text-red-600 flex items-center gap-2"
                                        >
                                            <LogOut size={16} /> Logout
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </header>

                {/* PAGE CONTENT */}
                <main className="p-4 md:p-8 pb-20">
                    {/* Error/Success Messages */}
                    {(error || message) && (
                        <div className={`mb-4 rounded-lg border px-4 py-3 text-sm shadow-sm flex items-center justify-between ${
                            messageType === 'success'
                                ? 'border-green-200 bg-green-50 text-green-700'
                                : 'border-red-200 bg-red-50 text-red-700'
                        }`}>
                            <div className="flex items-center gap-2">
                                {messageType === 'success' ? <Check size={18} /> : <AlertCircle size={18} />}
                                <span>{message || error}</span>
                                {retryCount > 0 && <span className="text-xs ml-2">(Attempt {retryCount}/{MAX_RETRIES})</span>}
                            </div>
                            <button
                                onClick={() => {
                                    setMessage("")
                                    setError("")
                                }}
                                className="ml-4 hover:opacity-70 transition"
                            >
                                <X size={18} />
                            </button>
                        </div>
                    )}

                    {error && (
                        <button
                            onClick={handleRetry}
                            className="mb-4 inline-flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-lg font-semibold hover:bg-orange-600 transition"
                        >
                            Retry Loading Data
                        </button>
                    )}

                    {activeTab === "dashboard" && (
                        <div className="max-w-7xl mx-auto space-y-8 animate-fade-in">
                            {/* Lightweight Greeting Section */}
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mt-2">
                                <div>
                                    <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Hello, {userName}! 👋</h1>
                                    <p className="text-gray-500 text-sm mt-1">
                                        Find your favorite campus meals & late-night snacks instantly.
                                    </p>
                                </div>
                                <button onClick={() => navigate("/orders")} className="bg-orange-50 text-orange-600 px-5 py-2 rounded-full text-sm font-semibold hover:bg-orange-100 transition-all flex items-center gap-2 w-max">
                                    <MapPin size={16} /> View My Orders
                                </button>
                            </div>

                            {/* Promotional Banner / Slider */}
                            <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="md:col-span-2 bg-gradient-to-r from-orange-50 to-orange-100 rounded-3xl p-6 md:p-8 shadow-sm relative overflow-hidden">
                                    <div className="absolute -right-10 -top-10 w-40 h-40 bg-orange-200 rounded-full opacity-40"></div>
                                    <div className="absolute -right-16 bottom-0 w-48 h-48 bg-orange-300 rounded-full opacity-20"></div>
                                    <div className="relative">
                                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-100 text-xs font-semibold text-orange-700 mb-3">
                                            <Percent size={14} /> Limited Time Student Deal
                                        </div>
                                        <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
                                            Up to 30% OFF on late-night orders
                                        </h2>
                                        <p className="text-sm text-gray-600 mb-4 max-w-xl">
                                            Use code <span className="font-semibold text-orange-600">BITEHUB30</span> at checkout on
                                            orders after 9 PM. Perfect for study sessions and group projects.
                                        </p>
                                        <button className="inline-flex items-center gap-2 bg-orange-500 text-white px-5 py-2.5 rounded-full text-sm font-semibold hover:bg-orange-600 hover:shadow-md hover:-translate-y-0.5 transition-all">
                                            Claim Offer <ArrowRight size={16} />
                                        </button>
                                    </div>
                                </div>
                                <div className="bg-white rounded-3xl p-5 shadow-sm flex flex-col justify-between">
                                    <div>
                                        <h3 className="font-semibold text-gray-900 mb-1">Delivery ETA</h3>
                                        <p className="text-sm text-gray-500 mb-4">Average time to your campus</p>
                                        <div className="space-y-3">
                                            <div>
                                                <div className="flex justify-between text-xs text-gray-500 mb-1">
                                                    <span>Current</span>
                                                    <span>25 min</span>
                                                </div>
                                                <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
                                                    <div className="h-full w-3/4 rounded-full bg-gradient-to-r from-orange-500 to-orange-400"></div>
                                                </div>
                                            </div>
                                            <div>
                                                <div className="flex justify-between text-xs text-gray-500 mb-1">
                                                    <span>Best this week</span>
                                                    <span>18 min</span>
                                                </div>
                                                <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
                                                    <div className="h-full w-2/3 rounded-full bg-gradient-to-r from-emerald-500 to-emerald-400"></div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="mt-4 flex items-center gap-2 text-xs text-gray-500">
                                        <Truck size={14} /> Live-tracked delivery for all orders.
                                    </div>
                                </div>
                            </section>

                            {/* Featured Restaurants Carousel */}
                            <section>
                                <div className="flex items-center justify-between mb-4">
                                    <h2 className="text-2xl font-bold text-gray-900">Featured Restaurants</h2>
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => handleFeaturedScroll("prev")}
                                            className="p-2 rounded-full border border-gray-200 text-gray-500 hover:bg-gray-50 hover:text-gray-700 transition"
                                            aria-label="Previous restaurants"
                                        >
                                            <ChevronRight className="rotate-180" size={18} />
                                        </button>
                                        <button
                                            onClick={() => handleFeaturedScroll("next")}
                                            className="p-2 rounded-full border border-gray-200 text-gray-500 hover:bg-gray-50 hover:text-gray-700 transition"
                                            aria-label="Next restaurants"
                                        >
                                            <ChevronRight size={18} />
                                        </button>
                                    </div>
                                </div>
                                <div
                                    ref={featuredRef}
                                    className="flex gap-4 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent scroll-smooth"
                                >
                                    {restaurants.map((restaurant) => (
                                        <div
                                            key={restaurant.id}
                                            className="min-w-[260px] bg-white border border-gray-200 rounded-2xl overflow-hidden hover:shadow-lg hover:-translate-y-1 transition-all cursor-pointer group"
                                        >
                                            <img
                                                src={restaurant.image}
                                                alt={restaurant.name}
                                                className="h-40 w-full object-cover group-hover:scale-110 transition-transform duration-300"
                                            />
                                            <div className="p-4">
                                                <h3 className="font-bold text-gray-900 text-sm mb-1 truncate">
                                                    {restaurant.name}
                                                </h3>
                                                <p className="text-xs text-gray-500 mb-3">{restaurant.cuisine}</p>
                                                <div className="flex items-center justify-between text-xs mb-3">
                                                    <div className="flex items-center gap-1">
                                                        <Star size={14} className="text-yellow-400 fill-yellow-400" />
                                                        <span className="font-semibold text-gray-900">
                                                            {restaurant.rating}
                                                        </span>
                                                        <span className="text-gray-500">({restaurant.reviews})</span>
                                                    </div>
                                                </div>
                                                <div className="flex items-center justify-between text-xs text-gray-500">
                                                    <span className="flex items-center gap-1">
                                                        <Clock size={12} /> {restaurant.deliveryTime} min
                                                    </span>
                                                    <span className="flex items-center gap-1">
                                                        <MapPin size={12} /> {restaurant.distance}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </section>

                            {/* Categories */}
                            <section>
                                <h2 className="text-2xl font-bold text-gray-900 mb-4">Categories</h2>
                                <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
                                    {categories.map((category) => (
                                        <button
                                            key={category.id}
                                            className={`flex flex-col items-center gap-2 p-4 rounded-2xl transition-all hover:shadow-md ${category.color}`}
                                        >
                                            <span className="text-4xl">{category.icon}</span>
                                            <span className="text-xs font-semibold text-gray-700 text-center">{category.name}</span>
                                        </button>
                                    ))}
                                </div>
                            </section>

                            {/* Filter & View Controls */}
                            <section className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                                <div className="flex flex-wrap items-center gap-3">
                                    <button className="flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-full hover:bg-gray-200 transition text-sm font-medium text-gray-700">
                                        <Sliders size={16} /> Filters
                                    </button>
                                    <div className="flex items-center gap-2 text-xs text-gray-500">
                                        <span>Max price</span>
                                        <input
                                            type="range"
                                            min="5"
                                            max="50"
                                            value={priceFilter}
                                            onChange={(e) => setPriceFilter(Number(e.target.value))}
                                            className="accent-orange-500"
                                        />
                                        <span className="text-gray-700 font-semibold">${priceFilter}</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-xs text-gray-500">
                                        <span>Min rating</span>
                                        <select
                                            value={minRating}
                                            onChange={(e) => setMinRating(Number(e.target.value))}
                                            className="px-3 py-1.5 bg-gray-100 rounded-full border-0 text-xs font-medium text-gray-700 hover:bg-gray-200 transition"
                                        >
                                            <option value={0}>Any</option>
                                            <option value={3}>3.0+</option>
                                            <option value={4}>4.0+</option>
                                            <option value={4.5}>4.5+</option>
                                        </select>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => setViewMode("grid")}
                                        className={`p-2 rounded-2xl transition-all border ${
                                            viewMode === "grid"
                                                ? "bg-orange-50 text-orange-600 border-orange-200 shadow-sm"
                                                : "bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100"
                                        }`}
                                    >
                                        <Grid3x3 size={18} />
                                    </button>
                                    <button
                                        onClick={() => setViewMode("list")}
                                        className={`p-2 rounded-2xl transition-all border ${
                                            viewMode === "list"
                                                ? "bg-orange-50 text-orange-600 border-orange-200 shadow-sm"
                                                : "bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100"
                                        }`}
                                    >
                                        <List size={18} />
                                    </button>
                                </div>
                            </section>

                            {/* Popular Food Items Grid */}
                            <section ref={browseFoodRef} className="scroll-mt-24 pt-4">
                                <div className="flex items-center justify-between mb-4">
                                    <h2 className="text-2xl font-bold text-gray-900">Popular Food Items</h2>
                                    <p className="text-xs text-gray-500">
                                        Showing {filteredFoods.length} of {popularFoods.length} items
                                    </p>
                                </div>
                                <div className={viewMode === "grid" ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4" : "space-y-4"}>
                                    {filteredFoods.map((food) => (
                                        <div
                                            key={food.id}
                                            className={`bg-white border border-gray-200 rounded-2xl overflow-hidden hover:shadow-lg transition-all group ${
                                                viewMode === "list" ? "flex items-center" : ""
                                            }`}
                                        >
                                            {/* Image */}
                                            <div className={`bg-gradient-to-br from-orange-100 to-orange-50 flex items-center justify-center relative overflow-hidden ${
                                                viewMode === "list" ? "h-32 w-32 flex-shrink-0" : "h-40 w-full"
                                            }`}>
                                                <img 
                                                    src={food.image} 
                                                    alt={food.name}
                                                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                                                    onError={(e) => {
                                                        e.target.style.display = 'none';
                                                    }}
                                                />

                                                {/* Discount Badge */}
                                                {food.discount > 0 && (
                                                    <div className="absolute top-2 right-2 bg-red-500 text-white px-2 py-1 rounded-lg text-xs font-bold">
                                                        -{food.discount}%
                                                    </div>
                                                )}

                                                {/* Favorite Button */}
                                                <button
                                                    onClick={() => toggleFavorite(food.id)}
                                                    className="absolute top-2 left-2 p-2 bg-white rounded-full shadow-md hover:scale-110 transition-transform z-10"
                                                >
                                                    <Heart
                                                        size={18}
                                                        className={favorites.has(food.id) ? "text-red-500 fill-red-500" : "text-gray-400"}
                                                    />
                                                </button>
                                            </div>

                                            {/* Content */}
                                            <div className={`flex-1 ${viewMode === "list" ? "p-4" : "p-4"}`}>
                                                <div className="mb-2">
                                                    <h3 className="font-bold text-gray-900 text-sm md:text-base truncate">{food.name}</h3>
                                                    <p className="text-xs text-gray-500 truncate">{food.restaurant}</p>
                                                </div>

                                                {/* Rating */}
                                                <div className="flex items-center gap-2 mb-3 text-xs">
                                                    <div className="flex items-center gap-1">
                                                        <Star size={14} className="text-yellow-400 fill-yellow-400" />
                                                        <span className="font-semibold text-gray-900">{food.rating}</span>
                                                    </div>
                                                    <span className="text-gray-500">({food.reviews})</span>
                                                </div>

                                                {/* Price */}
                                                <div className="flex items-baseline gap-2 mb-3">
                                                    <span className="text-lg font-bold text-orange-600">${(food.price * (1 - food.discount / 100)).toFixed(2)}</span>
                                                    {food.discount > 0 && (
                                                        <span className="text-sm line-through text-gray-400">${food.price}</span>
                                                    )}
                                                </div>

                                                {/* Order & Add to Cart Buttons */}
                                                <div className="flex gap-2 w-full mt-2">
                                                    <button
                                                        onClick={() => addToCart(food)}
                                                        className="flex-1 bg-orange-50 text-orange-600 py-2.5 rounded-xl font-bold hover:bg-orange-100 transition flex items-center justify-center gap-2"
                                                        title="Add to Cart"
                                                    >
                                                        <ShoppingCart size={16} />
                                                    </button>
                                                    <button
                                                        onClick={() => {
                                                            addToCart(food);
                                                            setCartOpen(true);
                                                            setTimeout(() => { setShowCheckoutDialog(true) }, 300);
                                                        }}
                                                        className="flex-[3] bg-gradient-to-r from-orange-500 to-orange-600 text-white py-2.5 rounded-xl font-bold hover:shadow-lg hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2"
                                                    >
                                                        <Zap size={16} /> Order Now
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </section>

                            {/* Special Offers */}
                            <section>
                                <h2 className="text-2xl font-bold text-gray-900 mb-4">Special Offers</h2>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-6 text-white">
                                        <Zap className="mb-3" size={32} />
                                        <h3 className="font-bold text-lg mb-1">Flash Sale</h3>
                                        <p className="text-blue-100 text-sm mb-3">50% off selected items</p>
                                        <button className="bg-white text-blue-600 px-4 py-2 rounded-lg text-sm font-semibold hover:bg-blue-50 transition">
                                            Shop Now
                                        </button>
                                    </div>
                                    <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-2xl p-6 text-white">
                                        <Trophy className="mb-3" size={32} />
                                        <h3 className="font-bold text-lg mb-1">Top Rated</h3>
                                        <p className="text-green-100 text-sm mb-3">Most popular this week</p>
                                        <button className="bg-white text-green-600 px-4 py-2 rounded-lg text-sm font-semibold hover:bg-green-50 transition">
                                            Explore
                                        </button>
                                    </div>
                                    <div className="bg-gradient-to-br from-pink-500 to-pink-600 rounded-2xl p-6 text-white">
                                        <TrendingUp className="mb-3" size={32} />
                                        <h3 className="font-bold text-lg mb-1">Trending</h3>
                                        <p className="text-pink-100 text-sm mb-3">What everyone is ordering</p>
                                        <button className="bg-white text-pink-600 px-4 py-2 rounded-lg text-sm font-semibold hover:bg-pink-50 transition">
                                            Discover
                                        </button>
                                    </div>
                                </div>
                            </section>

                            {/* Nearby Restaurants */}
                            <section>
                                <div className="flex items-center justify-between mb-4">
                                    <h2 className="text-2xl font-bold text-gray-900">Nearby Restaurants</h2>
                                    <div className="flex items-center gap-2 text-xs text-gray-500">
                                        <span>Max distance</span>
                                        <input
                                            type="range"
                                            min="1"
                                            max="10"
                                            value={maxDistance}
                                            onChange={(e) => setMaxDistance(Number(e.target.value))}
                                            className="accent-orange-500"
                                        />
                                        <span className="text-gray-700 font-semibold">{maxDistance} km</span>
                                    </div>
                                </div>
                                <div className="space-y-3">
                                    {filteredRestaurants.map((restaurant) => (
                                        <div key={restaurant.id} className="flex items-center gap-4 bg-white p-4 rounded-2xl border border-gray-200 hover:shadow-md transition cursor-pointer">
                                            <img
                                                src={restaurant.image}
                                                alt={restaurant.name}
                                                className="flex-shrink-0 w-16 h-16 rounded-xl object-cover"
                                                onError={(e) => {
                                                    e.target.style.display = 'none';
                                                }}
                                            />
                                            <div className="flex-1">
                                                <h3 className="font-bold text-gray-900">{restaurant.name}</h3>
                                                <p className="text-xs text-gray-500">{restaurant.cuisine}</p>
                                                <div className="flex items-center gap-2 mt-1 text-xs">
                                                    <Star size={12} className="text-yellow-400 fill-yellow-400" />
                                                    <span className="font-semibold">{restaurant.rating}</span>
                                                    <span className="text-gray-500">({restaurant.reviews})</span>
                                                    <span className="text-gray-500">•</span>
                                                    <Clock size={12} className="text-gray-500" />
                                                    <span className="text-gray-500">{restaurant.deliveryTime} min</span>
                                                </div>
                                            </div>
                                            <button className="px-4 py-2 bg-orange-500 text-white rounded-lg font-semibold hover:bg-orange-600 transition">
                                                Order
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </section>

                            {/* Top Rated Items */}
                            <section>
                                <h2 className="text-2xl font-bold text-gray-900 mb-4">Top Rated Items</h2>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {popularFoods.sort((a, b) => b.rating - a.rating).slice(0, 3).map((food) => (
                                        <div key={food.id} className="bg-white border border-gray-200 rounded-2xl overflow-hidden hover:shadow-lg transition">
                                            <div className="h-32 bg-gradient-to-br from-orange-100 to-orange-50 flex items-center justify-center relative overflow-hidden">
                                                <img
                                                    src={food.image}
                                                    alt={food.name}
                                                    className="w-full h-full object-cover hover:scale-110 transition-transform duration-300"
                                                    onError={(e) => {
                                                        e.target.style.display = 'none';
                                                    }}
                                                />
                                                <div className="absolute top-2 left-2 bg-yellow-400 text-white px-2 py-1 rounded-lg text-xs font-bold flex items-center gap-1">
                                                    <Trophy size={12} /> #{Math.floor(Math.random() * 10) + 1}
                                                </div>
                                            </div>
                                            <div className="p-4">
                                                <h3 className="font-bold text-gray-900 mb-1">{food.name}</h3>
                                                <div className="flex items-center gap-1 mb-2 text-xs">
                                                    <Star size={14} className="text-yellow-400 fill-yellow-400" />
                                                    <span className="font-bold text-gray-900">{food.rating}</span>
                                                    <span className="text-gray-500">({food.reviews})</span>
                                                </div>
                                                <p className="text-xl font-bold text-orange-600 mb-3">${food.price}</p>
                                                
                                                {/* Order & Add to Cart Buttons */}
                                                <div className="flex gap-2 w-full">
                                                    <button
                                                        onClick={() => addToCart(food)}
                                                        className="flex-1 bg-orange-50 text-orange-600 py-2.5 rounded-xl font-bold hover:bg-orange-100 transition flex items-center justify-center gap-2"
                                                        title="Add to Cart"
                                                    >
                                                        <ShoppingCart size={16} />
                                                    </button>
                                                    <button
                                                        onClick={() => {
                                                            addToCart(food);
                                                            setCartOpen(true);
                                                            setTimeout(() => { setShowCheckoutDialog(true) }, 300);
                                                        }}
                                                        className="flex-[3] bg-gradient-to-r from-orange-500 to-orange-600 text-white py-2.5 rounded-xl font-bold hover:shadow-lg hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2"
                                                    >
                                                        <Zap size={16} /> Order Now
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </section>
                        </div>
                    )}

                    {/* Orders Tab */}
                    {activeTab === "orders" && (
                        <div className="max-w-4xl mx-auto animate-fade-in">
                            <h1 className="text-3xl font-bold text-gray-900 mb-2">Your Orders</h1>
                            <p className="text-sm text-gray-500 mb-6">
                                Track your current orders in real time and quickly reorder your campus favorites.
                            </p>
                            <div className="space-y-4">
                                {orders.map((order) => {
                                    const statusConfig = {
                                        pending: { color: "bg-yellow-50", textColor: "text-yellow-700", label: "Pending", step: 1 },
                                        accepted: { color: "bg-sky-50", textColor: "text-sky-700", label: "Accepted", step: 2 },
                                        preparing: { color: "bg-blue-50", textColor: "text-blue-700", label: "Preparing", step: 3 },
                                        prepared: { color: "bg-purple-50", textColor: "text-purple-700", label: "Prepared", step: 4 },
                                        out_for_delivery: { color: "bg-orange-50", textColor: "text-orange-700", label: "Out for Delivery", step: 5 },
                                        delivered: { color: "bg-emerald-50", textColor: "text-emerald-700", label: "Delivered", step: 6 },
                                        completed: { color: "bg-gray-50", textColor: "text-gray-700", label: "Completed", step: 6 },
                                    }
                                    const status = statusConfig[order.status] || statusConfig.pending
                                    return (
                                        <div
                                            key={order.id}
                                            className={`${status.color} border border-gray-200 rounded-2xl p-6 hover:shadow-md transition`}
                                        >
                                            <div className="flex items-center justify-between mb-4">
                                                <div>
                                                    <p className="text-sm text-gray-500">Order ID</p>
                                                    <p className="font-bold text-gray-900">{order.id}</p>
                                                </div>
                                                <div className={`px-4 py-2 rounded-full font-semibold text-sm ${status.textColor}`}>
                                                    {status.label}
                                                </div>
                                            </div>
                                            <div className="grid grid-cols-3 gap-4 mb-4">
                                                <div>
                                                    <p className="text-xs text-gray-500 mb-1">Date</p>
                                                    <p className="font-semibold text-gray-900">{order.date}</p>
                                                </div>
                                                <div>
                                                    <p className="text-xs text-gray-500 mb-1">Items</p>
                                                    <p className="font-semibold text-gray-900">{order.items} items</p>
                                                </div>
                                                <div>
                                                    <p className="text-xs text-gray-500 mb-1">Total</p>
                                                    <p className="font-semibold text-orange-600">${order.total}</p>
                                                </div>
                                            </div>

                                            {/* Order status timeline */}
                                            <div className="mb-4">
                                                <div className="flex items-center justify-between text-[11px] text-gray-500 mb-1">
                                                    <span>Pending</span>
                                                    <span>Preparing</span>
                                                    <span>Out for delivery</span>
                                                    <span>Completed</span>
                                                </div>
                                                <div className="relative h-2 rounded-full bg-white/60 overflow-hidden">
                                                    <div
                                                        className={`absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-orange-500 to-orange-400 transition-all`}
                                                        style={{
                                                            width: `${(status.step / 4) * 100}%`,
                                                        }}
                                                    ></div>
                                                </div>
                                            </div>

                                            <div className="flex gap-2">
                                                <button className="flex-1 px-4 py-2 border border-gray-300 rounded-lg font-semibold text-gray-700 hover:bg-gray-50 transition">
                                                    View Details
                                                </button>
                                                <button className="flex-1 px-4 py-2 bg-orange-500 text-white rounded-lg font-semibold hover:bg-orange-600 transition">
                                                    Reorder
                                                </button>
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        </div>
                    )}

                    {/* Profile Tab */}
                    {activeTab === "profile" && (
                        <div className="max-w-7xl mx-auto space-y-8 animate-fade-in">
                            <h2 className="text-2xl font-bold text-gray-900 mb-2">My Profile</h2>
                            
                            {/* Moved Dashboard Welcome Section */}
                            <section className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-3xl p-8 md:p-12 text-white shadow-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                                <div>
                                    <h1 className="text-3xl md:text-4xl font-bold mb-2">Profile of {userName}</h1>
                                    <p className="text-orange-100 mb-6 max-w-xl">
                                        View your campus dining analytics, default delivery addresses, and recent activity.
                                    </p>
                                    <div className="flex flex-wrap items-center gap-3">
                                        <button onClick={() => { setActiveTab("dashboard"); setProfileDropdown(false); setTimeout(() => browseFoodRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100) }} className="bg-white text-orange-600 px-6 py-2.5 rounded-full font-semibold hover:bg-orange-50 hover:shadow-md hover:-translate-y-0.5 transition-all">
                                            Browse Food
                                        </button>
                                        <button onClick={() => setActiveTab("orders")} className="bg-orange-500/20 text-white px-4 py-2.5 rounded-full text-sm font-medium hover:bg-orange-500/30 transition-all">
                                            View Orders
                                        </button>
                                    </div>
                                </div>
                                <div className="grid grid-cols-3 gap-3 w-full md:w-auto">
                                    <div className="bg-white/10 rounded-2xl px-4 py-3 backdrop-blur-sm">
                                        <p className="text-xs text-orange-100">Active Orders</p>
                                        <p className="text-2xl font-bold">{orders.filter(o => o.status !== 'completed').length}</p>
                                    </div>
                                    <div className="bg-white/10 rounded-2xl px-4 py-3 backdrop-blur-sm">
                                        <p className="text-xs text-orange-100">Saved Items</p>
                                        <p className="text-2xl font-bold">{favorites.size}</p>
                                    </div>
                                    <div className="bg-white/10 rounded-2xl px-4 py-3 backdrop-blur-sm">
                                        <p className="text-xs text-orange-100">This Week</p>
                                        <p className="text-2xl font-bold">$54</p>
                                    </div>
                                </div>
                            </section>

                            {userProfile && (
                                <section className="bg-white border border-gray-100 shadow-sm rounded-3xl p-6 md:p-8">
                                    <h3 className="font-bold text-gray-900 text-xl mb-4">Account Details</h3>
                                    <div className="space-y-4 max-w-lg">
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-500 mb-1">Full Name</label>
                                                <p className="font-semibold text-gray-800 bg-gray-50 p-3 rounded-xl border border-gray-100">{userProfile.full_name || "N/A"}</p>
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-500 mb-1">Email</label>
                                                <p className="font-semibold text-gray-800 bg-gray-50 p-3 rounded-xl border border-gray-100 truncate" title={userProfile.email}>{userProfile.email || "N/A"}</p>
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-500 mb-1">Academic Department</label>
                                            <p className="font-semibold text-gray-800 bg-gray-50 p-3 rounded-xl border border-gray-100">{
                                                userProfile.department === 'cse' ? 'Computer Science & Engineering' : 
                                                userProfile.department === 'ece' ? 'Electronics & Communications' : 
                                                userProfile.department === 'me' ? 'Mechanical Engineering' : 
                                                userProfile.department === 'ce' ? 'Civil Engineering' : 
                                                userProfile.department === 'ee' ? 'Electrical Engineering' : 
                                                (userProfile.department || "N/A").toUpperCase()
                                            }</p>
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-500 mb-1">Course major</label>
                                                <p className="font-semibold text-gray-800 bg-gray-50 p-3 rounded-xl border border-gray-100">{userProfile.course ? userProfile.course.toUpperCase() : "N/A"}</p>
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-500 mb-1">Academic Year</label>
                                                <p className="font-semibold text-gray-800 bg-gray-50 p-3 rounded-xl border border-gray-100">{userProfile.year ? `${userProfile.year}${userProfile.year === 1 ? 'st' : userProfile.year === 2 ? 'nd' : userProfile.year === 3 ? 'rd' : 'th'} Year` : "N/A"}</p>
                                            </div>
                                        </div>
                                    </div>
                                </section>
                            )}

                            <section className="bg-white border border-gray-100 shadow-sm rounded-3xl p-6 md:p-8">
                                <h3 className="font-bold text-gray-900 text-xl mb-4">Saved Contact Data</h3>
                                <div className="space-y-4 max-w-lg">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-500 mb-1">Default Delivery Address</label>
                                        <input
                                            type="text"
                                            value={checkoutInfo.deliveryAddress}
                                            onChange={(e) => setCheckoutInfo(prev => ({ ...prev, deliveryAddress: e.target.value }))}
                                            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none transition"
                                            placeholder="Enter your address"
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-500 mb-1">Default City</label>
                                            <input
                                                type="text"
                                                value={checkoutInfo.deliveryCity}
                                                onChange={(e) => setCheckoutInfo(prev => ({ ...prev, deliveryCity: e.target.value }))}
                                                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none transition"
                                                placeholder="Enter your city"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-500 mb-1">Phone Number</label>
                                            <input
                                                type="tel"
                                                value={checkoutInfo.phone}
                                                onChange={(e) => setCheckoutInfo(prev => ({ ...prev, phone: e.target.value }))}
                                                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none transition"
                                                placeholder="Enter your phone"
                                            />
                                        </div>
                                    </div>
                                    
                                    <div className="pt-4">
                                        <button 
                                            onClick={async () => {
                                                try {
                                                    const res = await apiClient.put('/api/profile', {
                                                        address: checkoutInfo.deliveryAddress,
                                                        city: checkoutInfo.deliveryCity,
                                                        phone: checkoutInfo.phone
                                                    });
                                                    if (res.data?.success) {
                                                        setMessage("Profile contact data saved successfully!");
                                                        setMessageType("success");
                                                    }
                                                } catch (err) {
                                                    setMessage(err.response?.data?.message || err.message || "Failed to update profile");
                                                    setMessageType("error");
                                                }
                                            }}
                                            className="w-full md:w-auto px-6 py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-xl font-bold hover:shadow-lg hover:shadow-orange-500/30 hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2"
                                        >
                                            <Check size={18} /> Save Contact Data
                                        </button>
                                    </div>
                                </div>
                            </section>
                        </div>
                    )}

                    {/* Owner / Restaurant Dashboard (only for owners) */}
                    {userRole === "owner" && (
                        <div className="max-w-7xl mx-auto mt-10 space-y-8 animate-fade-in">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h2 className="text-2xl md:text-3xl font-bold text-gray-900">
                                        Restaurant Owner Dashboard
                                    </h2>
                                    <p className="text-sm text-gray-500 mt-1">
                                        Monitor sales, manage your menu, and respond to student customers in real time.
                                    </p>
                                </div>
                                <div className="inline-flex items-center gap-2 rounded-full bg-orange-50 px-3 py-1 text-xs font-medium text-orange-600">
                                    <ChefHat size={14} /> Owner mode
                                </div>
                            </div>

                            {/* Sales Overview Cards */}
                            <section className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                <div className="bg-gradient-to-br from-emerald-500 to-emerald-700 rounded-3xl p-6 shadow-lg shadow-emerald-500/20 text-white relative overflow-hidden">
                                    <div className="absolute -right-4 -top-4 w-24 h-24 bg-white/10 rounded-full blur-2xl"></div>
                                    <div className="flex items-center justify-between mb-4 relative z-10">
                                        <p className="text-emerald-50 font-medium">Total Revenue</p>
                                        <div className="p-2 bg-emerald-400/30 rounded-xl backdrop-blur-md">
                                            <TrendingUp size={20} className="text-white" />
                                        </div>
                                    </div>
                                    <p className="text-3xl font-black relative z-10">$8,450.25</p>
                                    <p className="text-sm text-emerald-100 mt-2 font-medium relative z-10 flex items-center gap-1">
                                        <ArrowRight size={14} className="-rotate-45" /> +12.4% vs last week
                                    </p>
                                </div>

                                <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 transition hover:shadow-md">
                                    <div className="flex items-center justify-between mb-4">
                                        <p className="text-gray-500 font-medium">Active Orders</p>
                                        <div className="p-2 bg-orange-50 text-orange-600 rounded-xl">
                                            <Package size={20} />
                                        </div>
                                    </div>
                                    <p className="text-3xl font-black text-gray-900">{liveOrders.filter(o => o.status !== 'delivered').length}</p>
                                    <p className="text-sm text-gray-500 mt-2 font-medium">Needing attention</p>
                                </div>

                                <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 transition hover:shadow-md">
                                    <div className="flex items-center justify-between mb-4">
                                        <p className="text-gray-500 font-medium">Avg. Order Value</p>
                                        <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
                                            <Receipt size={20} />
                                        </div>
                                    </div>
                                    <p className="text-3xl font-black text-gray-900">$24.80</p>
                                    <p className="text-sm text-emerald-600 mt-2 font-medium flex items-center gap-1">
                                        <ArrowRight size={14} className="-rotate-45" /> +$2.10 today
                                    </p>
                                </div>

                                <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 transition hover:shadow-md">
                                    <div className="flex items-center justify-between mb-4">
                                        <p className="text-gray-500 font-medium">Unique Customers</p>
                                        <div className="p-2 bg-purple-50 text-purple-600 rounded-xl">
                                            <User size={20} />
                                        </div>
                                    </div>
                                    <p className="text-3xl font-black text-gray-900">142</p>
                                    <p className="text-sm text-purple-600 mt-2 font-medium flex items-center gap-1">
                                        <ArrowRight size={14} className="-rotate-45" /> +18 signups today
                                    </p>
                                </div>
                            </section>

                            <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                {/* Advanced Revenue Analytics */}
                                <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-gray-100 flex flex-col justify-between">
                                    <div>
                                        <div className="flex justify-between items-start mb-6">
                                            <div>
                                                <h3 className="font-bold text-gray-900 text-xl">Weekly Volume Matrix</h3>
                                                <p className="text-sm text-gray-500">Gross sales across the last 7 operating days</p>
                                            </div>
                                            <select className="bg-gray-50 border border-gray-200 text-sm font-medium rounded-lg px-3 py-1 outline-none focus:ring-2 focus:ring-orange-500">
                                                <option>This Week</option>
                                                <option>Last Week</option>
                                                <option>This Month</option>
                                            </select>
                                        </div>
                                        
                                        {/* Modern Data Graph Mockup */}
                                        <div className="relative h-64 flex items-end justify-between gap-1 md:gap-3 px-2 pt-10">
                                            {/* Grid lines */}
                                            <div className="absolute inset-0 flex flex-col justify-between pointer-events-none">
                                                <div className="border-b border-gray-100 w-full h-0"></div>
                                                <div className="border-b border-gray-100 w-full h-0"></div>
                                                <div className="border-b border-gray-100 w-full h-0"></div>
                                                <div className="border-b border-gray-100 w-full h-0"></div>
                                            </div>
                                            
                                            {[
                                                { day: "Mon", rev: 45, ord: 20 },
                                                { day: "Tue", rev: 60, ord: 40 },
                                                { day: "Wed", rev: 55, ord: 35 },
                                                { day: "Thu", rev: 80, ord: 60 },
                                                { day: "Fri", rev: 100, ord: 90 },
                                                { day: "Sat", rev: 85, ord: 80 },
                                                { day: "Sun", rev: 70, ord: 55 },
                                            ].map((data, idx) => (
                                                <div key={idx} className="flex-1 flex flex-col items-center gap-3 relative z-10 group">
                                                    {/* Tooltip */}
                                                    <div className="absolute -top-12 bg-gray-900 text-white text-xs font-bold py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition whitespace-nowrap pointer-events-none">
                                                        ${(data.rev * 15).toFixed(0)}
                                                    </div>
                                                    
                                                    {/* Double Bar System */}
                                                    <div className="w-full flex justify-center items-end gap-1 h-48 bg-transparent">
                                                        <div 
                                                            className="w-1/2 md:w-3 max-w-[12px] bg-gradient-to-t from-orange-500 to-orange-400 rounded-t-sm shadow-sm group-hover:shadow-orange-500/50 transition-all"
                                                            style={{ height: `${data.rev}%` }}
                                                        ></div>
                                                        <div 
                                                            className="w-1/2 md:w-3 max-w-[12px] bg-gradient-to-t from-gray-200 to-gray-300 rounded-t-sm"
                                                            style={{ height: `${data.ord}%` }}
                                                        ></div>
                                                    </div>
                                                    <span className="text-xs font-semibold text-gray-500">{data.day}</span>
                                                </div>
                                            ))}
                                        </div>
                                        <div className="flex items-center justify-center gap-6 mt-6 pt-4 border-t border-gray-100">
                                            <div className="flex items-center gap-2 text-sm font-medium text-gray-600">
                                                <span className="w-3 h-3 rounded-full bg-orange-500"></span> Revenue
                                            </div>
                                            <div className="flex items-center gap-2 text-sm font-medium text-gray-600">
                                                <span className="w-3 h-3 rounded-full bg-gray-300"></span> Orders Count
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Live Terminal Orders */}
                                <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-gray-100 flex flex-col">
                                    <div className="flex items-center justify-between mb-6">
                                        <h3 className="font-bold text-gray-900 text-xl">Active Order Terminal</h3>
                                        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700 border border-emerald-100">
                                            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
                                            LIVE SYSTEM
                                        </span>
                                    </div>
                                    
                                    <div className="flex-1 overflow-y-auto pr-2 space-y-4 max-h-[400px]">
                                        {liveOrders.map((o) => (
                                            <div
                                                key={o.id}
                                                className="rounded-2xl border border-gray-100 bg-white shadow-sm hover:shadow-md transition p-4 md:p-5 relative overflow-hidden group"
                                            >
                                                {/* Left accent color based on status */}
                                                <div className={`absolute left-0 top-0 bottom-0 w-1 ${
                                                    o.status === 'pending' ? 'bg-yellow-400' :
                                                    o.status === 'accepted' ? 'bg-sky-400' :
                                                    o.status === 'preparing' ? 'bg-blue-400' :
                                                    o.status === 'prepared' ? 'bg-purple-400' :
                                                    o.status === 'out_for_delivery' ? 'bg-orange-400' : 'bg-emerald-400'
                                                }`}></div>
                                                
                                                <div className="flex flex-col md:flex-row justify-between gap-4">
                                                    <div>
                                                        <div className="flex gap-3 items-center mb-1">
                                                            <p className="text-sm font-bold text-gray-900">Order #{o.id}</p>
                                                            <p className="text-xs font-semibold text-gray-500">{o.time}</p>
                                                        </div>
                                                        <div className="flex items-center gap-1 text-sm text-gray-600 font-medium mb-2">
                                                            <MapPin size={14} className="text-gray-400" /> {o.location}
                                                        </div>
                                                        <p className="text-lg font-black text-emerald-600">${o.total.toFixed(2)}</p>
                                                    </div>
                                                    
                                                    <div className="flex flex-col items-start md:items-end justify-between">
                                                        <select
                                                            value={o.status}
                                                            onChange={(e) => updateOrderStatus(o.id, e.target.value)}
                                                            className={`text-xs font-bold px-3 py-1.5 rounded-lg border focus:outline-none focus:ring-2 focus:ring-orange-500 transition-colors cursor-pointer ${getOrderStatusColor(o.status)}`}
                                                        >
                                                            <option value="pending">🟡 Pending</option>
                                                            <option value="accepted">🔵 Accepted</option>
                                                            <option value="preparing">🔵 Preparing</option>
                                                            <option value="prepared">🟣 Prepared</option>
                                                            <option value="out_for_delivery">🟠 Out for Delivery</option>
                                                            <option value="delivered">🟢 Delivered</option>
                                                        </select>
                                                        
                                                        {o.status !== 'delivered' && (
                                                            <p className="text-xs text-gray-500 font-medium mt-3 md:mt-0">
                                                                Action Required
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                        {liveOrders.length === 0 && (
                                            <div className="h-full flex items-center justify-center text-gray-400 font-medium pb-10">
                                                No active orders at the moment.
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </section>

                            {/* Menu Management & Categories */}
                            <section className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-gray-100">
                                <div className="flex items-center justify-between mb-6">
                                    <h3 className="font-bold text-gray-900 text-xl">Top Selling Menu Items</h3>
                                    <button className="inline-flex items-center gap-1 rounded-xl bg-gray-900 px-4 py-2 text-sm font-semibold text-white hover:bg-black transition shadow-md">
                                        <Plus size={16} /> Add Item
                                    </button>
                                </div>
                                
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left text-sm whitespace-nowrap">
                                        <thead>
                                            <tr className="border-b border-gray-100 text-gray-500">
                                                <th className="pb-3 font-semibold pr-4">Item Name</th>
                                                <th className="pb-3 font-semibold px-4 text-center">Price</th>
                                                <th className="pb-3 font-semibold px-4 text-center">Monthly Sales</th>
                                                <th className="pb-3 font-semibold px-4 text-center">Revenue</th>
                                                <th className="pb-3 font-semibold pl-4 text-right">Visibility</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-50">
                                            {[
                                                { name: "Double Cheese Burger", price: 12.99, sales: 452, rev: 5871.48, available: true },
                                                { name: "Spicy Chicken Wings (8pc)", price: 9.99, sales: 385, rev: 3846.15, available: true },
                                                { name: "Large Pepperoni Pizza", price: 18.50, sales: 210, rev: 3885.00, available: false },
                                                { name: "Oreo Milkshake", price: 6.50, sales: 189, rev: 1228.50, available: true },
                                            ].map((item, idx) => (
                                                <tr key={idx} className="hover:bg-gray-50 transition group">
                                                    <td className="py-4 font-bold text-gray-900 pr-4">{item.name}</td>
                                                    <td className="py-4 text-gray-600 font-medium text-center px-4">${item.price.toFixed(2)}</td>
                                                    <td className="py-4 text-center px-4">
                                                        <span className="inline-flex items-center gap-1 font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded text-xs">
                                                            <TrendingUp size={12} /> {item.sales}
                                                        </span>
                                                    </td>
                                                    <td className="py-4 text-gray-900 font-bold text-center px-4">${item.rev.toFixed(2)}</td>
                                                    <td className="py-4 pl-4 text-right">
                                                        <label className="inline-flex items-center gap-2 cursor-pointer justify-end">
                                                            <span className={`text-xs font-bold uppercase tracking-wider ${item.available ? 'text-blue-600' : 'text-gray-400'}`}>
                                                                {item.available ? "Active" : "Hidden"}
                                                            </span>
                                                            <input
                                                                type="checkbox"
                                                                defaultChecked={item.available}
                                                                className="h-4 w-4 accent-blue-600 rounded cursor-pointer"
                                                            />
                                                        </label>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </section>

                            <section className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                                <div className="lg:col-span-2 hidden"></div> {/* Spacer for layout balance or future expansion */}
                                <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 space-y-4">
                                    <div>
                                        <h3 className="font-semibold text-gray-900 mb-2">Manage Categories</h3>
                                        <div className="flex flex-wrap gap-2">
                                            {["Burgers", "Pizza", "Sushi", "Desserts"].map((cat) => (
                                                <span
                                                    key={cat}
                                                    className="inline-flex items-center gap-1 rounded-full bg-orange-50 px-3 py-1 text-xs font-medium text-orange-700"
                                                >
                                                    {cat}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-gray-900 mb-2">Customer Reviews</h3>
                                        <div className="space-y-2 text-xs">
                                            <div className="rounded-xl bg-gray-50 p-3">
                                                <p className="font-semibold text-gray-800 mb-1">“Amazing burgers!”</p>
                                                <p className="text-gray-500 mb-1">by Alex • 5.0 ★</p>
                                                <div className="flex gap-2">
                                                    <button className="rounded-full bg-white px-3 py-1 text-[11px] text-gray-600 hover:bg-gray-100 transition">
                                                        Reply
                                                    </button>
                                                    <button className="rounded-full bg-white px-3 py-1 text-[11px] text-gray-600 hover:bg-gray-100 transition">
                                                        Mark as resolved
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </section>
                        </div>
                    )}
                </main>
            </div>

                    {/* CART PAGE TAB */}
                    {activeTab === "cart" && (
                        <div className="max-w-7xl mx-auto space-y-8 animate-fade-in mt-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h2 className="text-2xl md:text-3xl font-bold text-gray-900">Your Cart</h2>
                                    <p className="text-sm text-gray-500 mt-1">Review your items and proceed to checkout.</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                                {/* Left Column: Cart Items */}
                                <div className="lg:col-span-2 space-y-4">
                                    {cart.length === 0 ? (
                                        <div className="bg-white border border-gray-100 shadow-sm rounded-3xl p-12 flex flex-col items-center justify-center text-center">
                                            <ShoppingCart size={64} className="text-gray-200 mb-4" />
                                            <h3 className="text-xl font-bold text-gray-900">Your cart is empty</h3>
                                            <p className="text-gray-500 mt-2 max-w-sm">Looks like you haven't added any delicious food to your cart yet.</p>
                                            <button 
                                                onClick={() => setActiveTab('dashboard')} 
                                                className="mt-6 px-6 py-3 bg-orange-100 text-orange-600 rounded-xl font-bold hover:bg-orange-200 transition"
                                            >
                                                Browse Food
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="bg-white border border-gray-100 shadow-sm rounded-3xl p-6">
                                            <div className="space-y-4">
                                                {cart.map((item) => {
                                                    const itemDiscount = item.discount || 0;
                                                    const discountedPrice = item.price * (1 - itemDiscount / 100);
                                                    return (
                                                        <div key={item.id} className="bg-gray-50 rounded-2xl p-4 md:p-6 flex flex-col md:flex-row gap-4 items-start md:items-center justify-between border border-gray-100 transition hover:shadow-md">
                                                            <div className="flex items-center gap-4 w-full md:w-auto">
                                                                <div className="text-4xl flex-shrink-0 bg-white p-3 rounded-xl shadow-sm">{item.image}</div>
                                                                <div className="flex-1">
                                                                    <h3 className="font-semibold text-gray-900 text-lg leading-tight">{item.name}</h3>
                                                                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mt-0.5">{item.restaurant}</p>
                                                                    <div className="flex items-center gap-2 mt-1">
                                                                        <span className="text-orange-600 font-bold text-lg">${discountedPrice.toFixed(2)}</span>
                                                                        {itemDiscount > 0 && (
                                                                           <span className="text-xs text-gray-400 line-through">${parseFloat(item.price).toFixed(2)}</span>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            <div className="flex items-center justify-between w-full md:w-auto gap-4 pt-4 md:pt-0 border-t border-gray-100 md:border-0">
                                                                <div className="flex items-center gap-1 bg-white rounded-xl border border-gray-200 p-1 shadow-sm">
                                                                    <button
                                                                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                                                                        className="p-2 hover:bg-gray-100 rounded-lg transition"
                                                                    >
                                                                        <Minus size={16} className="text-gray-600" />
                                                                    </button>
                                                                    <span className="w-8 text-center font-semibold text-gray-900">{item.quantity}</span>
                                                                    <button
                                                                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                                                        className="p-2 hover:bg-gray-100 rounded-lg transition"
                                                                    >
                                                                        <Plus size={16} className="text-gray-600" />
                                                                    </button>
                                                                </div>
                                                                <button 
                                                                    onClick={() => updateQuantity(item.id, 0)} 
                                                                    className="p-3 text-red-500 hover:text-red-600 bg-red-50 hover:bg-red-100 rounded-xl transition flex-shrink-0"
                                                                >
                                                                    <Trash2 size={18} />
                                                                </button>
                                                            </div>
                                                        </div>
                                                    )
                                                })}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Right Column: Order Summary */}
                                {cart.length > 0 && (
                                    <div className="lg:col-span-1">
                                        <div className="bg-white border border-gray-100 shadow-sm rounded-3xl p-6 sticky top-24">
                                            <h3 className="font-bold text-gray-900 text-lg mb-6 flex items-center gap-2">
                                                <Receipt size={20} className="text-orange-500" /> Order Summary
                                            </h3>
                                            
                                            <div className="space-y-4 text-gray-600">
                                                <div className="flex justify-between items-center text-sm font-medium">
                                                    <span>Subtotal ({cart.length} items)</span>
                                                    <span className="text-gray-900">${subtotal.toFixed(2)}</span>
                                                </div>
                                                <div className="flex justify-between items-center text-sm font-medium">
                                                    <span>Sales Tax</span>
                                                    <span className="text-gray-900">${tax.toFixed(2)}</span>
                                                </div>
                                                <div className="flex justify-between items-center text-sm font-medium">
                                                    <span>Delivery Fee</span>
                                                    <span className="text-gray-900">${deliveryFee.toFixed(2)}</span>
                                                </div>
                                            </div>

                                            <div className="border-t border-gray-100 mt-6 pt-6">
                                                <div className="flex gap-2 mb-6">
                                                    <input
                                                        type="text"
                                                        placeholder="Promo code"
                                                        className="flex-1 px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-orange-500 transition"
                                                    />
                                                    <button className="px-5 py-3 bg-gray-900 text-white rounded-xl font-bold hover:bg-black transition text-sm">
                                                        Apply
                                                    </button>
                                                </div>

                                                <div className="bg-orange-50 border border-orange-100 rounded-2xl p-5 mb-6">
                                                    <div className="flex justify-between items-center">
                                                        <span className="font-bold text-gray-900">Total</span>
                                                        <span className="text-3xl font-black text-orange-600">${total.toFixed(2)}</span>
                                                    </div>
                                                </div>

                                                <button
                                                    onClick={() => setShowCheckoutDialog(true)}
                                                    className="w-full bg-gradient-to-r from-orange-500 to-orange-600 shadow-orange-500/30 shadow-lg text-white py-4 rounded-2xl font-bold hover:shadow-orange-500/50 hover:-translate-y-1 transition-all flex items-center justify-center gap-2 text-lg"
                                                >
                                                    <CreditCard size={20} /> Proceed to Checkout
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

            {showCheckoutDialog && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fade-in p-4">
                    <div className="bg-white rounded-3xl p-6 md:p-8 max-w-lg w-full shadow-2xl animate-fade-in-scale">
                        <div className="flex justify-between items-center mb-6 border-b border-gray-100 pb-4">
                            <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                                <Truck className="text-orange-500" /> Delivery Details
                            </h2>
                            <button onClick={() => setShowCheckoutDialog(false)} className="text-gray-400 hover:text-gray-600 transition bg-gray-50 rounded-full p-2 hover:bg-gray-100">
                                <X size={20} />
                            </button>
                        </div>

                        <div className="space-y-4 mb-8">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1">Delivery Address</label>
                                <input 
                                    type="text" 
                                    value={checkoutInfo.deliveryAddress}
                                    placeholder="e.g. 123 Campus Dorm, Room 4B"
                                    onChange={(e) => setCheckoutInfo(prev => ({...prev, deliveryAddress: e.target.value}))}
                                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">City</label>
                                    <input 
                                        type="text" 
                                        value={checkoutInfo.deliveryCity}
                                        placeholder="e.g. University Town"
                                        onChange={(e) => setCheckoutInfo(prev => ({...prev, deliveryCity: e.target.value}))}
                                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none transition"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">Phone Number</label>
                                    <input 
                                        type="tel" 
                                        value={checkoutInfo.phone}
                                        placeholder="Mobile number"
                                        onChange={(e) => setCheckoutInfo(prev => ({...prev, phone: e.target.value}))}
                                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none transition"
                                    />
                                </div>
                            </div>
                            <p className="text-xs text-gray-500 italic mt-2">
                                * Your provided information will be explicitly sent to the restaurant for this order. It falls back to your saved profile details if left blank!
                            </p>
                        </div>

                        <div className="flex gap-4">
                            <button 
                                onClick={() => setShowCheckoutDialog(false)}
                                className="flex-1 px-4 py-3 border border-gray-300 rounded-xl font-bold text-gray-700 hover:bg-gray-50 transition"
                            >
                                Cancel
                            </button>
                            <button 
                                onClick={handleCheckout}
                                className="flex-1 px-4 py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-xl font-bold hover:shadow-lg hover:shadow-orange-500/30 transition-all flex justify-center items-center gap-2"
                            >
                                <CreditCard size={18} /> Confirm Order
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* CSS Animations */}
            <style>{`
                @keyframes fadeIn {
                    from {
                        opacity: 0;
                    }
                    to {
                        opacity: 1;
                    }
                }

                @keyframes slideInRight {
                    from {
                        transform: translateX(100%);
                    }
                    to {
                        transform: translateX(0);
                    }
                }

                @keyframes fadeInScale {
                    from {
                        opacity: 0;
                        transform: scale(0.95);
                    }
                    to {
                        opacity: 1;
                        transform: scale(1);
                    }
                }

                .animate-fade-in {
                    animation: fadeIn 0.3s ease-in-out;
                }

                .animate-slide-in-right {
                    animation: slideInRight 0.3s ease-out;
                }
            `}</style>
        </div>
    )
}

export default HomePage
