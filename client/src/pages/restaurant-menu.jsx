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
import { createApiClient } from "../services/apiClient"
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
    const [loading, setLoading] = useState(true)
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
            setLoading(true)
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
                total: Number(directCheckoutItem.price) + 25,
                department: directDepartment,
                course: directCourse,
                deliveryFee: 25
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

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#0a0a0f]">
                <div className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
        )
    }

    if (!restaurant) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center bg-[#0a0a0f]">
                <div className="w-24 h-24 bg-gray-900 rounded-full flex items-center justify-center mb-6">
                    <Utensils size={40} className="text-gray-700" />
                </div>
                <h1 className="text-2xl font-black text-white mb-4">Restaurant Not Found</h1>
                <button onClick={() => navigate('/home')} className="bg-orange-500 text-white px-8 py-3 rounded-2xl font-bold shadow-lg shadow-orange-500/20 active:scale-95 transition-all">
                    Return to Home
                </button>
            </div>
        )
    }

    return (
        <div className="min-h-screen relative font-sans transition-colors duration-500" style={{ backgroundColor: isDarkMode ? '#0a0a0f' : '#f8fafc' }}>
            <CustomerSidebar
                activeTab="home"
                onTabChange={(tabId) => navigate('/home', { state: { activeTab: tabId } })}
                sidebarCollapsed={sidebarCollapsed}
                setSidebarCollapsed={setSidebarCollapsed}
                mobileOpen={sidebarOpen}
                setMobileOpen={setSidebarOpen}
            />

            <div className={`transition-all duration-500 ${sidebarCollapsed ? "md:ml-24" : "md:ml-72"}`}>
                {/* High-Contrast Professional Header */}
                <div className="relative h-[220px] w-full overflow-hidden border-b border-gray-100 dark:border-gray-800/20">
                    <div className="absolute inset-0 z-0">
                        <img 
                            src={restaurant.image} 
                            alt={restaurant.name} 
                            className="w-full h-full object-cover blur-none opacity-40"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-gray-950 via-gray-950/60 to-gray-900/40"></div>
                    </div>
                    
                    <div className="relative z-10 h-full max-w-5xl mx-auto px-6 flex flex-col items-center justify-center">
                        <button 
                            onClick={() => navigate(-1)}
                            className="absolute top-8 left-6 md:left-0 flex items-center justify-center w-10 h-10 rounded-2xl bg-white/10 backdrop-blur-md border border-white/10 text-white hover:bg-white/20 transition-all"
                        >
                            <ArrowLeft size={18} />
                        </button>

                        <div className="flex flex-col items-center text-center">
                            <div className="relative mb-5 group">
                                <div className="absolute inset-0 bg-orange-500 blur-xl opacity-20 group-hover:opacity-40 transition-opacity"></div>
                                <div className="relative w-24 h-24 rounded-3xl p-[2px] bg-gradient-to-br from-orange-400 to-red-600 shadow-2xl">
                                    <div className="w-full h-full rounded-[22px] overflow-hidden bg-white flex items-center justify-center">
                                        <img 
                                            src={restaurant.image} 
                                            className="w-full h-full object-contain p-1" 
                                            alt={restaurant.name} 
                                        />
                                    </div>
                                </div>
                            </div>

                            <h1 className="text-3xl md:text-4xl font-black text-white mb-2 tracking-tight drop-shadow-lg">{restaurant.name}</h1>
                            <div className="flex items-center gap-6 px-6 py-2 rounded-2xl bg-white/5 backdrop-blur-md border border-white/5 text-[10px] font-black text-white uppercase tracking-[0.2em]">
                                <div className="flex items-center gap-1.5">
                                    <Star size={12} className="text-orange-400 fill-orange-400" />
                                    <span className="text-orange-400">{restaurant.rating}</span>
                                </div>
                                <div className="w-[1px] h-3 bg-white/10"></div>
                                <span className="text-white/80">{restaurant.distance}</span>
                                <div className="w-[1px] h-3 bg-white/10"></div>
                                <span className="text-white/80">30-45 MIN</span>
                            </div>
                        </div>
                    </div>
                </div>

                <main className="max-w-5xl mx-auto px-6 py-10">
                    {/* Small Search & Filter Strip */}
                    <div className="flex items-baseline justify-between mb-10 border-b border-gray-800/10 pb-4">
                        <div className="flex items-center gap-6 overflow-x-auto scrollbar-none">
                            {categories.map(cat => (
                                <button
                                    key={cat}
                                    onClick={() => setActiveCategory(cat)}
                                    className={`text-[9px] font-black tracking-[0.3em] uppercase transition-all pb-1.5 ${
                                        activeCategory === cat 
                                        ? 'text-orange-500 border-b border-orange-500' 
                                        : isDarkMode 
                                            ? 'text-gray-600 hover:text-gray-400' 
                                            : 'text-gray-400 hover:text-gray-600'
                                    }`}
                                >
                                    {cat}
                                </button>
                            ))}
                        </div>
                        <div className="relative hidden md:block">
                            <input
                                type="text"
                                placeholder="SEARCH..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className={`bg-transparent outline-none font-black text-[9px] tracking-[0.3em] uppercase transition-all w-32 focus:w-48 ${
                                    isDarkMode ? 'text-white border-b border-white/5 focus:border-orange-500' : 'text-gray-900 border-b border-gray-100 focus:border-orange-500'
                                }`}
                            />
                        </div>
                    </div>

                    {/* Menu Grid - Minimalist Cards */}
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                        {filteredMenu.length === 0 ? (
                            <div className="col-span-full py-32 text-center">
                                <div className="w-20 h-20 bg-gray-900/50 rounded-full flex items-center justify-center mx-auto mb-6">
                                    <Utensils size={32} className="text-gray-700" />
                                </div>
                                <p className="text-gray-500 font-bold text-lg">No items found matching your filter</p>
                            </div>
                        ) : (
                            filteredMenu.map(item => (
                                <div 
                                    key={item.id}
                                    className={`group flex flex-col transition-all cursor-pointer ${isDarkMode ? 'hover:bg-white/[0.02]' : 'hover:bg-black/[0.02]'} rounded-xl p-2`}
                                    onClick={() => { 
                                        setSelectedFood(item); 
                                        setFoodQuantity(1);
                                        setShowFoodModal(true); 
                                    }}
                                >
                                    <div className="relative aspect-[4/3] overflow-hidden rounded-lg mb-3">
                                        <img 
                                            src={item.image} 
                                            alt={item.name} 
                                            className="w-full h-full object-cover grayscale-[0.3] group-hover:grayscale-0 group-hover:scale-105 transition-all duration-700"
                                        />
                                        <div className="absolute top-2 right-2">
                                            <button 
                                                onClick={(e) => { e.stopPropagation(); toggleFavorite(item.id); }}
                                                className="w-6 h-6 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center text-white"
                                            >
                                                <Heart size={10} className={favorites.has(item.id) ? 'fill-red-500 text-red-500' : ''} />
                                            </button>
                                        </div>
                                    </div>

                                    <div className="flex flex-col px-1">
                                        <h3 className={`text-[11px] font-black tracking-tight mb-1 transition-colors ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                            {item.name.toUpperCase()}
                                        </h3>
                                        <div className="flex items-center justify-between mt-auto">
                                            <span className="text-[12px] font-black text-orange-500">₱{Number(item.price).toFixed(2)}</span>
                                            <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                                                <Plus size={12} className="text-gray-500" />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </main>
            </div>

            {/* Premium Food Modal */}
            {showFoodModal && selectedFood && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in" onClick={() => setShowFoodModal(false)}>
                    <div 
                        className={`w-full max-w-xl rounded-[32px] overflow-hidden shadow-2xl animate-fade-in-scale relative border ${isDarkMode ? 'bg-[#0a0a0f] border-gray-800' : 'bg-white border-white'}`}
                        onClick={e => e.stopPropagation()}
                    >
                        <button onClick={() => setShowFoodModal(false)} className="absolute top-4 right-4 z-20 w-8 h-8 rounded-full bg-black/20 backdrop-blur-md flex items-center justify-center text-white hover:bg-black/40 transition-all border border-white/10">
                            <X size={16} />
                        </button>
                        
                        <div className="flex flex-col">
                            {/* Visual Header */}
                            <div className="w-full h-48 relative">
                                <img src={selectedFood.image} alt={selectedFood.name} className="w-full h-full object-cover" />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
                                <div className="absolute bottom-4 left-6">
                                    <span className="px-2 py-0.5 bg-orange-500 text-white rounded-md text-[7px] font-black tracking-widest uppercase">
                                        {selectedFood.category}
                                    </span>
                                </div>
                            </div>
                            
                            {/* Content Area */}
                            <div className="p-6 md:p-8 flex flex-col">
                                <div className="flex items-center justify-between mb-4">
                                    <h2 className={`text-xl md:text-2xl font-black tracking-tight leading-tight ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                        {selectedFood.name}
                                    </h2>
                                    <div className="px-2 py-1 bg-green-500/10 text-green-500 border border-green-500/20 rounded text-[7px] font-black tracking-[0.2em] uppercase">
                                        {selectedFood.current_stock > 0 ? 'In Stock' : 'Out of Stock'}
                                    </div>
                                </div>

                                <p className={`text-xs leading-relaxed mb-6 font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                    {selectedFood.description || "Indulge in a masterpiece of flavor, handcrafted with locally sourced ingredients."}
                                </p>

                                <div className="grid grid-cols-3 gap-3 mb-6">
                                    <div className={`p-3 rounded-xl border ${isDarkMode ? 'bg-white/5 border-white/5' : 'bg-gray-50 border-gray-100'}`}>
                                        <div className="flex items-center gap-1 text-orange-500 mb-0.5">
                                            <Clock size={10} />
                                            <span className="text-[7px] font-black uppercase tracking-widest">Time</span>
                                        </div>
                                        <span className={`text-[10px] font-black ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>15 MIN</span>
                                    </div>
                                    <div className={`p-3 rounded-xl border ${isDarkMode ? 'bg-white/5 border-white/5' : 'bg-gray-50 border-gray-100'}`}>
                                        <div className="flex items-center gap-1 text-yellow-500 mb-0.5">
                                            <Star size={10} className="fill-yellow-500" />
                                            <span className="text-[7px] font-black uppercase tracking-widest">Rate</span>
                                        </div>
                                        <span className={`text-[10px] font-black ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>4.8</span>
                                    </div>
                                    <div className={`p-3 rounded-xl border ${isDarkMode ? 'bg-white/5 border-white/5' : 'bg-gray-50 border-gray-100'}`}>
                                        <div className="flex items-center gap-1 text-blue-500 mb-0.5">
                                            <Info size={10} />
                                            <span className="text-[7px] font-black uppercase tracking-widest">Type</span>
                                        </div>
                                        <span className={`text-[10px] font-black ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>FRESH</span>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <div className="flex flex-col">
                                            <span className="text-[8px] font-black text-gray-500 uppercase tracking-widest mb-0.5">Payable</span>
                                            <span className="text-2xl font-black text-orange-500 tracking-tight">₱{(Number(selectedFood.price) * foodQuantity).toFixed(2)}</span>
                                        </div>
                                        
                                        <div className={`flex items-center gap-3 p-1 rounded-xl border ${isDarkMode ? 'bg-white/5 border-white/5' : 'bg-gray-100 border-gray-200'}`}>
                                            <button 
                                                onClick={() => setFoodQuantity(Math.max(1, foodQuantity - 1))}
                                                className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${isDarkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-900 shadow-sm'}`}
                                            >
                                                <Minus size={12} />
                                            </button>
                                            <span className={`w-4 text-center font-black text-sm ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{foodQuantity}</span>
                                            <button 
                                                onClick={() => setFoodQuantity(foodQuantity + 1)}
                                                className="w-8 h-8 rounded-lg bg-orange-500 text-white flex items-center justify-center shadow-lg shadow-orange-500/20"
                                            >
                                                <Plus size={12} />
                                            </button>
                                        </div>
                                    </div>

                                    <div className="flex gap-2">
                                        <button 
                                            onClick={() => addToCart(selectedFood, foodQuantity, true)}
                                            className="flex-1 py-3 bg-gray-900 dark:bg-orange-500 text-white font-black text-[8px] tracking-[0.2em] uppercase rounded-xl hover:bg-orange-600 transition-all"
                                        >
                                            Order Now
                                        </button>
                                        <button 
                                            onClick={() => addToCart(selectedFood, foodQuantity)}
                                            className={`flex-1 py-3 border font-black text-[8px] tracking-[0.2em] uppercase rounded-xl transition-all ${isDarkMode ? 'border-white/10 text-white hover:bg-white/5' : 'border-gray-200 text-gray-900 hover:bg-gray-50'}`}
                                        >
                                            Add to Bag
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {showDirectCheckout && directCheckoutItem && (
                <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in" onClick={() => setShowDirectCheckout(false)}>
                    <div 
                        className={`w-full max-w-xs rounded-none p-8 shadow-2xl animate-fade-in-scale relative ${isDarkMode ? 'bg-[#0a0a0f] text-white' : 'bg-white text-gray-900'}`}
                        onClick={e => e.stopPropagation()}
                    >
                        <button onClick={() => setShowDirectCheckout(false)} className="absolute top-4 right-4 z-10 w-6 h-6 flex items-center justify-center text-gray-500 hover:text-orange-500 transition-all">
                            <X size={14} />
                        </button>

                        <div className="flex flex-col items-center text-center mb-6">
                            <h3 className="text-xs font-black tracking-[0.3em] uppercase mb-4">CHECKOUT</h3>
                            <div className="w-10 h-[1px] bg-orange-500 mb-6"></div>
                        </div>

                        <div className="space-y-3 mb-8">
                            <input
                                type="text"
                                placeholder="DEPARTMENT"
                                value={directDepartment}
                                onChange={(e) => { setDirectDepartment(e.target.value); setDirectCheckoutError(""); }}
                                className={`w-full px-0 py-2 bg-transparent border-b border-gray-800/20 outline-none font-black text-[9px] tracking-[0.3em] uppercase transition-all focus:border-orange-500`}
                            />
                            <input
                                type="text"
                                placeholder="SECTION / ROOM"
                                value={directCourse}
                                onChange={(e) => { setDirectCourse(e.target.value); setDirectCheckoutError(""); }}
                                className={`w-full px-0 py-2 bg-transparent border-b border-gray-800/20 outline-none font-black text-[9px] tracking-[0.3em] uppercase transition-all focus:border-orange-500`}
                            />
                        </div>

                        <div className="space-y-6">
                            <div className="flex items-center justify-between border-t border-gray-800/10 pt-4">
                                <span className="text-[8px] font-black text-gray-500 uppercase tracking-widest">PAYABLE</span>
                                <span className="text-lg font-black text-orange-500">₱{(Number(directCheckoutItem.price) + 25).toFixed(2)}</span>
                            </div>
                            <button
                                onClick={handleDirectCheckoutSubmit}
                                disabled={directCheckoutProcessing || !directDepartment || !directCourse}
                                className="w-full py-4 bg-orange-500 text-white font-black text-[9px] tracking-[0.3em] uppercase hover:bg-orange-600 transition-all disabled:opacity-30"
                            >
                                {directCheckoutProcessing ? "PROCESSING..." : "CONFIRM ORDER"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Notification Toast */}
            {message && (
                <div className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-[200] px-6 py-3 rounded-none shadow-2xl animate-fade-in-up flex items-center gap-3 border ${
                    messageType === "success" 
                        ? 'bg-[#0a0a0f] border-orange-500 text-orange-500' 
                        : 'bg-[#0a0a0f] border-red-500 text-red-500'
                }`}>
                    <span className="font-black text-[9px] tracking-[0.2em] uppercase">{message}</span>
                </div>
            )}

            <style>{`
                @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
                @keyframes fadeInScale { from { opacity: 0; transform: scale(0.9); } to { opacity: 1; transform: scale(1); } }
                @keyframes fadeInUp { from { opacity: 0; transform: translate(-50%, 20px); } to { opacity: 1; transform: translate(-50%, 0); } }
                @keyframes bounceSlow { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-10px); } }
                .animate-fade-in { animation: fadeIn 0.4s ease-out; }
                .animate-fade-in-scale { animation: fadeInScale 0.5s cubic-bezier(0.16, 1, 0.3, 1); }
                .animate-fade-in-up { animation: fadeInUp 0.4s cubic-bezier(0.16, 1, 0.3, 1); }
                .animate-bounce-slow { animation: bounceSlow 3s infinite ease-in-out; }
                .scrollbar-none::-webkit-scrollbar { display: none; }
                .scrollbar-none { -ms-overflow-style: none; scrollbar-width: none; }
            `}</style>
        </div>
    )
}

export default RestaurantMenuPage
