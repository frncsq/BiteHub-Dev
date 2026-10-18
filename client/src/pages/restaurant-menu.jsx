import { useState, useEffect, useRef } from "react"
import { useParams, useNavigate, useLocation } from "react-router-dom"
import {
    ArrowLeft,
    Star,
    Clock,
    MapPin,
    ShoppingCart,
    Heart,
    Search,
    Plus,
    Minus,
    CheckCircle,
    X,
    Utensils,
    Info,
    ChevronRight,
    CreditCard
} from "lucide-react"
import { useTheme } from "../context/ThemeContext"
import { createApiClient, hasFreshApiResponse } from "../services/apiClient"
import CustomerSidebar from "../components/CustomerSidebar"
import { calculateDistance, formatDistance } from "../utils/distance"

const RestaurantMenuPage = () => {
    const { id } = useParams()
    const navigate = useNavigate()
    const location = useLocation()
    const { isDarkMode, colors } = useTheme()
    const apiClient = createApiClient()

    const [restaurant, setRestaurant] = useState(location.state?.restaurant || null)
    const [menu, setMenu] = useState([])
    const [categories, setCategories] = useState([])
    const [activeCategory, setActiveCategory] = useState("All")
    const [searchQuery, setSearchQuery] = useState("")
    // Skip the full-page spinner when this restaurant's menu is fresh locally.
    const [loading, setLoading] = useState(() => !hasFreshApiResponse(`/food/${id}`))
    const [cart, setCart] = useState([])
    const [favorites, setFavorites] = useState(new Set())
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
    const [sidebarOpen, setSidebarOpen] = useState(false)
    const [message, setMessage] = useState("")
    const [messageType, setMessageType] = useState("")
    const [userLocation, setUserLocation] = useState(null)

    // Get user's location
    useEffect(() => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    setUserLocation({
                        lat: position.coords.latitude,
                        lng: position.coords.longitude
                    });
                },
                (error) => {
                    console.warn("Geolocation error:", error.message);
                    setUserLocation({ lat: 17.5956, lng: 120.6200 });
                }
            );
        } else {
            setUserLocation({ lat: 17.5956, lng: 120.6200 });
        }
    }, []);

    // Update restaurant distance once location is ready
    useEffect(() => {
        if (userLocation && restaurant && restaurant.latitude) {
            const d = calculateDistance(userLocation.lat, userLocation.lng, restaurant.latitude, restaurant.longitude);
            setRestaurant(prev => ({
                ...prev,
                distance: formatDistance(d)
            }));
        }
    }, [userLocation]);

    // Food Modal state
    const [showFoodModal, setShowFoodModal] = useState(false)
    const [selectedFood, setSelectedFood] = useState(null)
    const [foodQuantity, setFoodQuantity] = useState(1)
    
    // Direct Checkout state
    const [showDirectCheckout, setShowDirectCheckout] = useState(false)
    const [directCheckoutItem, setDirectCheckoutItem] = useState(null)
    const [directDepartment, setDirectDepartment] = useState("")
    const [directCourse, setDirectCourse] = useState("")
    const [directCheckoutProcessing, setDirectCheckoutProcessing] = useState(false)
    const [directCheckoutError, setDirectCheckoutError] = useState("")

    useEffect(() => {
        fetchData()
        fetchCart()
    }, [id])

    const fetchData = async () => {
        try {
            if (!hasFreshApiResponse(`/food/${id}`)) setLoading(true)
            const [restRes, menuRes] = await Promise.all([
                apiClient.get('/restaurants'),
                apiClient.get(`/food/${id}`)
            ])

            if (restRes.data.success) {
                const found = restRes.data.restaurants.find(r => r.id === parseInt(id))
                if (found) {
                    if (userLocation) {
                        const d = calculateDistance(userLocation.lat, userLocation.lng, found.latitude, found.longitude);
                        found.distance = formatDistance(d);
                    }
                    setRestaurant(found)
                }
            }

            if (menuRes.data.success) {
                const items = menuRes.data.foods || menuRes.data.items || []
                setMenu(items)
                const cats = ["All", ...new Set(items.map(i => i.category).filter(Boolean))]
                setCategories(cats)
            }
        } catch (err) {
            console.error("Error fetching restaurant data:", err)
        } finally {
            setLoading(false)
        }
    }

    const fetchCart = async () => {
        try {
            const res = await apiClient.get('/cart')
            if (res.data.success && res.data.cart) {
                setCart(res.data.cart)
            }
        } catch (err) {
            console.error("Error fetching cart:", err)
        }
    }

    const toggleFavorite = async (foodId) => {
        const newFavorites = new Set(favorites)
        if (newFavorites.has(foodId)) {
            newFavorites.delete(foodId)
        } else {
            newFavorites.add(foodId)
        }
        setFavorites(newFavorites)
        try {
            await apiClient.post('/favorites/toggle', { foodId })
        } catch (err) {
            console.error("Failed to sync favorite:", err)
        }
    }

    const addToCart = async (food, quantity = 1, goToCheckout = false) => {
        if (food.current_stock !== null && food.current_stock <= 0) {
            showMessage("Item out of stock", "error")
            return
        }

        try {
            await apiClient.post('/cart/add', { 
                foodId: food.id, 
                quantity: quantity 
            })
            showMessage(`Added to cart!`, "success")
            fetchCart()
            
            if (goToCheckout) {
                openDirectCheckout(food)
            } else {
                setShowFoodModal(false)
            }
        } catch (err) {
            console.error("Failed to add to cart:", err)
            showMessage("Failed to add item", "error")
        }
    }

    const showMessage = (msg, type) => {
        setMessage(msg)
        setMessageType(type)
        setTimeout(() => setMessage(""), 3000)
    }

    const openDirectCheckout = (item) => {
        setDirectCheckoutItem(item)
        setShowDirectCheckout(true)
        setShowFoodModal(false)
    }

    const handleDirectCheckoutSubmit = async () => {
        if (!directDepartment || !directCourse) {
            setDirectCheckoutError("Location details required")
            return
        }
        setDirectCheckoutProcessing(true)
        try {
            const res = await apiClient.post('/orders/create', {
                items: [{
                    id: directCheckoutItem.id,
                    quantity: 1,
                    price: directCheckoutItem.price,
                    name: directCheckoutItem.name,
                    restaurantId: id
                }],
                total: Number(directCheckoutItem.price) + 10,
                department: directDepartment,
                course: directCourse,
                deliveryFee: 10
            })
            if (res.data.success) {
                showMessage("Order placed!", "success")
                setShowDirectCheckout(false)
                fetchCart()
            }
        } catch (err) {
            setDirectCheckoutError(err.response?.data?.message || "Checkout failed")
        } finally {
            setDirectCheckoutProcessing(false)
        }
    }

    const filteredMenu = menu.filter(item => {
        const matchesCategory = activeCategory === "All" || item.category === activeCategory
        const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase())
        return matchesCategory && matchesSearch
    })

    const bg = isDarkMode ? '#111111' : '#FAFAFA'
    const cardBg = isDarkMode ? '#1A1A1A' : '#FFFFFF'
    const borderColor = isDarkMode ? '#2A2A2A' : '#E5E7EB'
    const textPrimary = isDarkMode ? '#F5F5F5' : '#171717'
    const textSecondary = isDarkMode ? '#A0A0A0' : '#6B7280'

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: bg }}>
                <div className="w-10 h-10 border-[3px] border-[#EA580C] border-t-transparent rounded-full animate-spin"></div>
            </div>
        )
    }

    if (!restaurant) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center" style={{ backgroundColor: bg }}>
                <div className="w-20 h-20 rounded-full flex items-center justify-center mb-5" style={{ backgroundColor: cardBg, border: `1px solid ${borderColor}` }}>
                    <Utensils size={32} style={{ color: textSecondary }} />
                </div>
                <h1 className="text-xl font-semibold mb-3" style={{ color: textPrimary }}>Restaurant Not Found</h1>
                <button onClick={() => navigate('/home')} className="bg-[#EA580C] text-white px-7 py-2.5 rounded-xl text-sm font-semibold hover:bg-[#C2410C] transition-all">
                    Return to Home
                </button>
            </div>
        )
    }

    return (
        <div className="min-h-screen relative font-sans transition-colors duration-300" style={{ backgroundColor: bg }}>
            <CustomerSidebar
                activeTab="home"
                onTabChange={(tabId) => navigate('/home', { state: { activeTab: tabId } })}
                sidebarCollapsed={sidebarCollapsed}
                setSidebarCollapsed={setSidebarCollapsed}
                mobileOpen={sidebarOpen}
                setMobileOpen={setSidebarOpen}
            />

            <div className={`transition-all duration-300 ${sidebarCollapsed ? 'md:pl-[72px]' : 'md:pl-[240px]'}`}>
                {/* Restaurant Header */}
                <div className="relative h-[168px] sm:h-[200px] w-full overflow-hidden">
                    <div className="absolute inset-0 z-0">
                        <img 
                            src={restaurant.image} 
                            alt={restaurant.name} 
                            className="w-full h-full object-cover opacity-60"
                        />
                        <div className="absolute inset-0" style={{ background: isDarkMode 
                            ? 'linear-gradient(to top, rgba(17,17,17,0.95) 0%, rgba(17,17,17,0.5) 50%, rgba(17,17,17,0.2) 100%)'
                            : 'linear-gradient(to top, rgba(250,250,250,0.98) 0%, rgba(250,250,250,0.5) 50%, rgba(250,250,250,0.1) 100%)'
                        }}></div>
                    </div>
                    
                    <div className="relative z-10 h-full max-w-5xl mx-auto px-4 sm:px-6 flex flex-col justify-end pb-5">
                        <button 
                            onClick={() => navigate(-1)}
                            className="absolute top-5 left-4 sm:left-6 md:left-0 flex items-center justify-center w-9 h-9 rounded-xl transition-all"
                            style={{ backgroundColor: cardBg, border: `1px solid ${borderColor}`, color: textPrimary }}
                        >
                            <ArrowLeft size={16} />
                        </button>

                        <div className="flex items-center gap-4">
                            <div className="w-16 h-16 rounded-2xl overflow-hidden flex-shrink-0 shadow-md" style={{ border: `2px solid ${borderColor}` }}>
                                <img 
                                    src={restaurant.image} 
                                    className="w-full h-full object-cover" 
                                    alt={restaurant.name} 
                                />
                            </div>
                            <div className="flex flex-col">
                                <h1 className="text-xl md:text-2xl font-bold tracking-tight" style={{ color: textPrimary }}>{restaurant.name}</h1>
                                <div className="flex items-center gap-4 mt-1">
                                    <div className="flex items-center gap-1">
                                        <Star size={13} className="text-[#EA580C] fill-[#EA580C]" />
                                        <span className="text-xs font-semibold" style={{ color: textPrimary }}>{restaurant.rating}</span>
                                    </div>
                                    <span className="text-xs" style={{ color: textSecondary }}>{restaurant.distance}</span>
                                    <span className="text-xs" style={{ color: textSecondary }}>30-45 min</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                                <main className="max-w-5xl mx-auto px-4 sm:px-6 py-5 pb-24 md:pb-6">
                    {/* Search (mobile) */}
                    <div className="relative mb-3 flex items-center md:hidden">
                        <Search size={15} className="absolute left-3" style={{ color: textSecondary }} />
                        <input
                            type="text"
                            placeholder="Search menu..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="h-11 w-full rounded-xl pl-9 pr-3 text-sm outline-none"
                            style={{ backgroundColor: cardBg, border: `1px solid ${borderColor}`, color: textPrimary }}
                        />
                    </div>

                    {/* Category Tabs & Search */}
                    <div className="mb-4 flex items-center gap-4">
                        <div className="-mx-1 flex flex-1 items-center gap-1.5 overflow-x-auto px-1 pb-1 scrollbar-none">
                            {categories.map(cat => (
                                <button
                                    key={cat}
                                    onClick={() => setActiveCategory(cat)}
                                    className={`h-9 whitespace-nowrap rounded-full px-3.5 text-[13px] font-semibold transition-all ${
                                        activeCategory === cat ? 'bg-[#EA580C] text-white' : ''
                                    }`}
                                    style={activeCategory !== cat ? {
                                        color: textSecondary,
                                        backgroundColor: isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)'
                                    } : {}}
                                >
                                    {cat}
                                </button>
                            ))}
                        </div>
                        <div className="relative hidden md:flex items-center">
                            <Search size={14} className="absolute left-3" style={{ color: textSecondary }} />
                            <input
                                type="text"
                                placeholder="Search menu..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-8 pr-3 py-2 rounded-xl text-xs outline-none transition-all w-40 focus:w-56"
                                style={{
                                    backgroundColor: cardBg,
                                    border: `1px solid ${borderColor}`,
                                    color: textPrimary
                                }}
                            />
                        </div>
                    </div>

                    {/* Menu Grid */}
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5 sm:gap-3">
                        {filteredMenu.length === 0 ? (
                            <div className="col-span-full py-24 text-center">
                                <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: cardBg, border: `1px solid ${borderColor}` }}>
                                    <Utensils size={28} style={{ color: textSecondary }} />
                                </div>
                                <p className="text-sm font-medium" style={{ color: textSecondary }}>No items found</p>
                            </div>
                        ) : (
                            filteredMenu.map(item => {
                                const isOOS = item.current_stock !== null && item.current_stock !== undefined && item.current_stock <= 0;
                                return (
                                    <div
                                        key={item.id}
                                        className="group flex flex-col rounded-xl overflow-hidden cursor-pointer transition-all hover:shadow-md"
                                        style={{ backgroundColor: cardBg, border: `1px solid ${borderColor}`, opacity: isOOS ? 0.75 : 1 }}
                                        onClick={() => {
                                            if (isOOS) return;
                                            setSelectedFood(item);
                                            setFoodQuantity(1);
                                            setShowFoodModal(true);
                                        }}
                                    >
                                        <div className="relative aspect-[4/3] overflow-hidden">
                                            <img
                                                src={item.image}
                                                alt={item.name}
                                                loading="lazy"
                                                className={`w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ${isOOS ? 'grayscale' : ''}`}
                                            />
                                            <button
                                                onClick={(e) => { e.stopPropagation(); toggleFavorite(item.id); }}
                                                className="absolute top-1.5 right-1.5 w-7 h-7 rounded-full flex items-center justify-center transition-all"
                                                style={{ backgroundColor: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(8px)' }}
                                                aria-label="Toggle favorite"
                                            >
                                                <Heart size={13} className={favorites.has(item.id) ? 'fill-red-500 text-red-500' : 'text-white'} />
                                            </button>
                                            {isOOS && (
                                                <div className="absolute inset-0 flex items-center justify-center bg-black/45">
                                                    <span className="rounded-full bg-red-600 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-white">Sold out</span>
                                                </div>
                                            )}
                                        </div>

                                        <div className="p-2 sm:p-2.5 flex flex-col flex-1">
                                            <h3 className="text-[13px] font-semibold leading-snug line-clamp-2 min-h-[2.25rem]" style={{ color: textPrimary }}>{item.name}</h3>
                                            <div className="mt-0.5 flex items-center gap-1 text-[11px]" style={{ color: textSecondary }}>
                                                <Star size={10} className="shrink-0 text-amber-400 fill-amber-400" />
                                                <span className="font-semibold" style={{ color: textPrimary }}>{item.rating > 0 ? item.rating : 'New'}</span>
                                                <span className="truncate">{item.category ? `· ${item.category}` : ''}</span>
                                            </div>
                                            <div className="flex items-center justify-between mt-auto pt-1.5">
                                                <span className="text-[15px] font-bold text-[#EA580C]">₱{Number(item.price).toFixed(0)}</span>
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); addToCart(item, 1); }}
                                                    disabled={isOOS}
                                                    className={`w-7 h-7 rounded-lg flex items-center justify-center transition active:scale-90 ${isOOS ? 'cursor-not-allowed' : 'hover:opacity-90'}`}
                                                    style={isOOS ? { backgroundColor: isDarkMode ? 'rgba(255,255,255,0.06)' : '#F3F4F6', color: isDarkMode ? '#6B7280' : '#9CA3AF' } : { backgroundColor: '#EA580C', color: '#fff' }}
                                                    aria-label="Add to cart"
                                                >
                                                    <Plus size={15} />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </main>
            </div>

            {/* Food Modal */}
            {showFoodModal && selectedFood && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 animate-fade-in" style={{ backgroundColor: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }} onClick={() => setShowFoodModal(false)}>
                    <div 
                        className="w-full max-w-lg rounded-2xl overflow-hidden shadow-2xl animate-fade-in-scale relative"
                        style={{ backgroundColor: cardBg, border: `1px solid ${borderColor}` }}
                        onClick={e => e.stopPropagation()}
                    >
                        <button onClick={() => setShowFoodModal(false)} className="absolute top-3 right-3 z-20 w-8 h-8 rounded-xl flex items-center justify-center transition-all" style={{ backgroundColor: cardBg, border: `1px solid ${borderColor}`, color: textPrimary }}>
                            <X size={16} />
                        </button>
                        
                        <div className="flex flex-col">
                            {/* Food Image */}
                            <div className="w-full h-52 relative">
                                <img src={selectedFood.image} alt={selectedFood.name} className="w-full h-full object-cover" />
                                <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.4) 0%, transparent 60%)' }}></div>
                                <div className="absolute bottom-3 left-4">
                                    <span className="px-2.5 py-1 rounded-lg text-[11px] font-semibold text-white" style={{ backgroundColor: '#EA580C' }}>
                                        {selectedFood.category}
                                    </span>
                                </div>
                            </div>
                            
                            {/* Content */}
                            <div className="p-5 md:p-6 flex flex-col">
                                <div className="flex items-start justify-between gap-3 mb-3">
                                    <h2 className="text-lg md:text-xl font-bold leading-tight" style={{ color: textPrimary }}>{selectedFood.name}</h2>
                                    <span className={`px-2 py-0.5 rounded-md text-[10px] font-semibold whitespace-nowrap ${selectedFood.current_stock > 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-500'}`}>
                                        {selectedFood.current_stock > 0 ? 'In Stock' : 'Out of Stock'}
                                    </span>
                                </div>

                                <p className="text-sm leading-relaxed mb-5" style={{ color: textSecondary }}>
                                    {selectedFood.description || "Freshly prepared with quality ingredients."}
                                </p>

                                <div className="grid grid-cols-3 gap-3 mb-5">
                                    <div className="p-3 rounded-xl" style={{ backgroundColor: isDarkMode ? 'rgba(255,255,255,0.04)' : '#F9FAFB', border: `1px solid ${borderColor}` }}>
                                        <div className="flex items-center gap-1 mb-1">
                                            <Clock size={12} className="text-[#EA580C]" />
                                            <span className="text-[10px] font-medium" style={{ color: textSecondary }}>Time</span>
                                        </div>
                                        <span className="text-xs font-semibold" style={{ color: textPrimary }}>15 min</span>
                                    </div>
                                    <div className="p-3 rounded-xl" style={{ backgroundColor: isDarkMode ? 'rgba(255,255,255,0.04)' : '#F9FAFB', border: `1px solid ${borderColor}` }}>
                                        <div className="flex items-center gap-1 mb-1">
                                            <Star size={12} className="text-amber-500 fill-amber-500" />
                                            <span className="text-[10px] font-medium" style={{ color: textSecondary }}>Rating</span>
                                        </div>
                                        <span className="text-xs font-semibold" style={{ color: textPrimary }}>4.8</span>
                                    </div>
                                    <div className="p-3 rounded-xl" style={{ backgroundColor: isDarkMode ? 'rgba(255,255,255,0.04)' : '#F9FAFB', border: `1px solid ${borderColor}` }}>
                                        <div className="flex items-center gap-1 mb-1">
                                            <Info size={12} className="text-blue-500" />
                                            <span className="text-[10px] font-medium" style={{ color: textSecondary }}>Type</span>
                                        </div>
                                        <span className="text-xs font-semibold" style={{ color: textPrimary }}>Fresh</span>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <div className="flex flex-col">
                                            <span className="text-[10px] font-medium mb-0.5" style={{ color: textSecondary }}>Total</span>
                                            <span className="text-xl font-bold text-[#EA580C]">₱{(Number(selectedFood.price) * foodQuantity).toFixed(2)}</span>
                                        </div>
                                        
                                        <div className="flex items-center gap-2 p-1 rounded-xl" style={{ backgroundColor: isDarkMode ? 'rgba(255,255,255,0.04)' : '#F3F4F6', border: `1px solid ${borderColor}` }}>
                                            <button 
                                                onClick={() => setFoodQuantity(Math.max(1, foodQuantity - 1))}
                                                className="w-8 h-8 rounded-lg flex items-center justify-center transition-all"
                                                style={{ backgroundColor: cardBg, color: textPrimary, border: `1px solid ${borderColor}` }}
                                            >
                                                <Minus size={14} />
                                            </button>
                                            <span className="w-5 text-center text-sm font-semibold" style={{ color: textPrimary }}>{foodQuantity}</span>
                                            <button 
                                                onClick={() => setFoodQuantity(foodQuantity + 1)}
                                                className="w-8 h-8 rounded-lg bg-[#EA580C] text-white flex items-center justify-center"
                                            >
                                                <Plus size={14} />
                                            </button>
                                        </div>
                                    </div>

                                    <div className="flex gap-2">
                                        <button 
                                            onClick={() => addToCart(selectedFood, foodQuantity, true)}
                                            className="flex-1 py-3 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90"
                                            style={{ backgroundColor: '#EA580C' }}
                                        >
                                            Order Now
                                        </button>
                                        <button 
                                            onClick={() => addToCart(selectedFood, foodQuantity)}
                                            className="flex-1 py-3 rounded-xl text-sm font-semibold transition-all"
                                            style={{ backgroundColor: isDarkMode ? 'rgba(255,255,255,0.06)' : '#F3F4F6', color: textPrimary, border: `1px solid ${borderColor}` }}
                                        >
                                            Add to Cart
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Direct Checkout Modal */}
            {showDirectCheckout && directCheckoutItem && (
                <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 animate-fade-in" style={{ backgroundColor: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }} onClick={() => setShowDirectCheckout(false)}>
                    <div 
                        className="w-full max-w-sm rounded-2xl p-6 shadow-2xl animate-fade-in-scale relative"
                        style={{ backgroundColor: cardBg, border: `1px solid ${borderColor}` }}
                        onClick={e => e.stopPropagation()}
                    >
                        <button onClick={() => setShowDirectCheckout(false)} className="absolute top-3 right-3 w-7 h-7 flex items-center justify-center rounded-lg transition-all" style={{ color: textSecondary }}>
                            <X size={14} />
                        </button>

                        <div className="flex flex-col items-center text-center mb-5">
                            <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-3" style={{ backgroundColor: isDarkMode ? 'rgba(234,88,12,0.15)' : 'rgba(234,88,12,0.08)' }}>
                                <CreditCard size={18} className="text-[#EA580C]" />
                            </div>
                            <h3 className="text-sm font-bold" style={{ color: textPrimary }}>Direct Checkout</h3>
                            <p className="text-xs mt-1" style={{ color: textSecondary }}>Enter your delivery details</p>
                        </div>

                        <div className="space-y-3 mb-5">
                            <div>
                                <label className="text-[10px] font-semibold uppercase tracking-wider mb-1 block" style={{ color: textSecondary }}>Department</label>
                                <input
                                    type="text"
                                    placeholder="e.g. CICT"
                                    value={directDepartment}
                                    onChange={(e) => { setDirectDepartment(e.target.value); setDirectCheckoutError(""); }}
                                    className="w-full px-3 py-2.5 rounded-xl text-sm outline-none transition-all"
                                    style={{ backgroundColor: isDarkMode ? 'rgba(255,255,255,0.04)' : '#F9FAFB', border: `1px solid ${borderColor}`, color: textPrimary }}
                                />
                            </div>
                            <div>
                                <label className="text-[10px] font-semibold uppercase tracking-wider mb-1 block" style={{ color: textSecondary }}>Section / Room</label>
                                <input
                                    type="text"
                                    placeholder="e.g. Room 301"
                                    value={directCourse}
                                    onChange={(e) => { setDirectCourse(e.target.value); setDirectCheckoutError(""); }}
                                    className="w-full px-3 py-2.5 rounded-xl text-sm outline-none transition-all"
                                    style={{ backgroundColor: isDarkMode ? 'rgba(255,255,255,0.04)' : '#F9FAFB', border: `1px solid ${borderColor}`, color: textPrimary }}
                                />
                            </div>
                        </div>

                        {directCheckoutError && (
                            <p className="text-xs text-red-500 text-center mb-3">{directCheckoutError}</p>
                        )}

                        <div className="space-y-4">
                            <div className="flex items-center justify-between pt-1" style={{ borderTop: `1px solid ${borderColor}` }}>
                                <span className="text-xs font-medium" style={{ color: textSecondary }}>Total</span>
                                <span className="text-lg font-bold text-[#EA580C]">₱{(Number(directCheckoutItem.price) + 10).toFixed(2)}</span>
                            </div>
                            <button
                                onClick={handleDirectCheckoutSubmit}
                                disabled={directCheckoutProcessing || !directDepartment || !directCourse}
                                className="w-full py-3 rounded-xl text-sm font-semibold text-white transition-all disabled:opacity-40"
                                style={{ backgroundColor: '#EA580C' }}
                            >
                                {directCheckoutProcessing ? "Processing..." : "Confirm Order"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Notification Toast */}
            {message && (
                <div className={`fixed bottom-20 md:bottom-6 left-1/2 -translate-x-1/2 z-[200] px-5 py-3 rounded-xl shadow-xl animate-fade-in-up flex items-center gap-2 ${
                    messageType === "success" ? 'bg-emerald-500 text-white' : 'bg-red-500 text-white'
                }`}>
                    <span className="text-sm font-medium">{message}</span>
                </div>
            )}

            <style>{`
                @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
                @keyframes fadeInScale { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
                @keyframes fadeInUp { from { opacity: 0; transform: translate(-50%, 12px); } to { opacity: 1; transform: translate(-50%, 0); } }
                .animate-fade-in { animation: fadeIn 0.3s ease-out; }
                .animate-fade-in-scale { animation: fadeInScale 0.3s cubic-bezier(0.16, 1, 0.3, 1); }
                .animate-fade-in-up { animation: fadeInUp 0.3s cubic-bezier(0.16, 1, 0.3, 1); }
                .scrollbar-none::-webkit-scrollbar { display: none; }
                .scrollbar-none { -ms-overflow-style: none; scrollbar-width: none; }
            `}</style>
        </div>
    )
}

export default RestaurantMenuPage
