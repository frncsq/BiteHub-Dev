import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import {
    Trash2, Plus, Minus, ShoppingCart, ArrowLeft, Star, Heart, Clock, Search, Bell,
    Home, Utensils, Package, User, Heart as HeartIcon, Settings, LogOut, ChevronRight,
    MapPin, CreditCard, Menu, Tag, Truck, TrendingUp, ChevronDown
} from "lucide-react"
import { useTheme } from "../context/ThemeContext"
import { createApiClient } from "../services/apiClient"
import CustomerSidebar from "../components/CustomerSidebar"



function Cart() {
    const [cartItems, setCartItems] = useState([])
    const [loading, setLoading] = useState(true)
    const [isProcessing, setIsProcessing] = useState(false)
    const [error, setError] = useState("")
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
    const [department, setDepartment] = useState("")
    const [course, setCourse] = useState("")
    const [activeTab, setActiveTab] = useState("cart")
    const [recommendations, setRecommendations] = useState([])

    const navigate = useNavigate()
    const { isDarkMode, toggleTheme } = useTheme()
    const apiClient = createApiClient()

    useEffect(() => {
        fetchCartItems()
        fetchRecommendations()
    }, [])

    const fetchRecommendations = async () => {
        try {
            const res = await apiClient.get('/api/food')
            if (res.data?.success) {
                const allFood = res.data.foods || []
                // Pick 3 random items for recommendations
                setRecommendations(allFood.sort(() => 0.5 - Math.random()).slice(0, 3))
            }
        } catch (err) {
            console.error("Failed to fetch recommendations:", err)
        }
    }

    const fetchCartItems = async () => {
        try {
            setLoading(true)
            const response = await apiClient.get('/api/cart')
            if (response.data && response.data.cart) {
                const validItems = response.data.cart
                    .map(item => ({
                        ...item,
                        // Normalize: server returns `id` for hydrated items
                        id: item.id ?? item.foodId ?? item.food_id
                    }))
                    // Filter out items that are missing a valid id or name
                    .filter(item => item.id != null && item.name)
                setCartItems(validItems)
            } else {
                setCartItems([]);
            }
        } catch (error) {
            console.error("Error fetching cart:", error)
            setCartItems([]);
        } finally {
            setLoading(false)
        }
    }

    const handleUpdateQuantity = async (itemId, quantity) => {
        try {
            const item = cartItems.find(i => i.id === itemId);
            const foodId = item?.foodId || itemId;
            const size = item?.size || null;
            const budgetMealComboId = item?.budgetMeal?.combinationId ?? null;

            // Optimistic update: reflect immediately in UI
            if (quantity <= 0) {
                setCartItems(prev => prev.filter(item => item.id !== itemId));
            } else {
                setCartItems(prev => prev.map(item =>
                    item.id === itemId ? { ...item, quantity } : item
                ));
            }

            // Sync with backend
            await apiClient.post('/api/cart/update', { foodId, quantity, size, budgetMealComboId });
        } catch (err) {
            console.error("Update quantity failed:", err);
            fetchCartItems();
        }
    }

    const handleRemoveItem = async (itemId) => {
        try {
            const item = cartItems.find(i => i.id === itemId);
            const foodId = item?.foodId || itemId;
            const size = item?.size || null;
            const budgetMealComboId = item?.budgetMeal?.combinationId ?? null;

            // Optimistic update
            setCartItems(prev => prev.filter(item => item.id !== itemId));
            await apiClient.post('/api/cart/remove', { foodId, size, budgetMealComboId });
        } catch (err) {
            console.error("Remove item failed:", err);
            fetchCartItems();
        }
    }

    const calculateSubtotal = () => {
        return cartItems.reduce((acc, item) => acc + (Number(item.price || 0) * Number(item.quantity || 1)), 0)
    }

    const subtotal = calculateSubtotal()
    const deliveryFee = cartItems.length > 0 ? 25 : 0
    const promoDiscount = subtotal > 1000 ? 100 : 0
    const total = subtotal + deliveryFee - promoDiscount

    const handleCheckout = async () => {
        if (cartItems.length === 0) return
        if (!department || !course) {
            setError("Please fill in campus delivery details below")
            return
        }

        try {
            setIsProcessing(true)
            const orderData = {
                items: cartItems.map(item => ({
                    id: item.foodId || item.id,
                    quantity: item.quantity,
                    price: item.price,
                    name: item.name,
                    restaurantId: item.restaurant_id || item.restaurantId || 1
                })),
                subtotal, total, department, course,
                tax: 0,
                deliveryFee
            }
            const response = await apiClient.post('/api/orders/create', orderData)
            if (response.data?.success) {
                // Remove cart after success
                setCartItems([])
                navigate("/orders")
            }
        } catch (err) {
            setError("Checkout failed. Try again.")
        } finally {
            setIsProcessing(false)
        }
    }

    if (loading) return (
        <div className={`min-h-screen flex items-center justify-center ${isDarkMode ? 'bg-gray-950 text-white' : 'bg-gray-50 text-gray-900'}`}>
            <div className="flex flex-col items-center gap-4">
                <div className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
                <p className="font-bold animate-pulse text-orange-500">Preparing your cart...</p>
            </div>
        </div>
    )

    return (
        <div className={`min-h-screen flex font-sans ${isDarkMode ? 'bg-gray-950 text-white' : 'bg-[#fafafa] text-gray-900'}`}>
            {/* Ambient background glows */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden select-none">
                <div className={`absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full blur-[120px] transition-colors duration-1000 ${isDarkMode ? 'bg-orange-600/10' : 'bg-orange-500/5'}`} />
                <div className={`absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full blur-[120px] transition-colors duration-1000 ${isDarkMode ? 'bg-orange-500/10' : 'bg-orange-400/5'}`} />
            </div>

            <CustomerSidebar
                activeTab="cart"
                sidebarCollapsed={sidebarCollapsed}
                setSidebarCollapsed={setSidebarCollapsed}
            />

            {/* Main Content Area */}
            <main className={`flex-1 flex flex-col relative z-20 overflow-x-hidden h-screen overflow-y-auto scroll-smooth transition-all duration-300 ${sidebarCollapsed ? 'md:pl-20' : 'md:pl-64'}`}>
                {/* Modern Header (Matching Home.jsx) */}
                <header className={`sticky top-0 z-40 backdrop-blur-xl border-b h-20 px-6 flex items-center justify-between ${isDarkMode ? 'bg-gray-950/70 border-gray-800' : 'bg-white/70 border-gray-200'
                    }`}>
                    <div className="flex items-center gap-4">
                        <button onClick={() => navigate('/home')} className={`p-2 rounded-xl transition-all ${isDarkMode ? 'bg-gray-900 border-gray-800 hover:bg-gray-800' : 'bg-gray-100 border-gray-200 hover:bg-gray-200'} border`}>
                            <ArrowLeft size={18} />
                        </button>
                        <h1 className="text-xl md:text-2xl font-black tracking-tight">Checkout My Cart</h1>
                    </div>

                    <div className="flex items-center gap-3">
                        <div className={`hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full border ${isDarkMode ? 'bg-gray-900/50 border-gray-800' : 'bg-gray-100/50 border-gray-200'}`}>
                            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                            <span className="text-[11px] font-black tracking-widest opacity-60 uppercase">System Active</span>
                        </div>
                        <button className={`p-2.5 rounded-xl transition-all ${isDarkMode ? 'bg-gray-900 hover:bg-gray-800 text-gray-400' : 'bg-gray-100 hover:bg-gray-200 text-gray-500'}`}>
                            <Bell size={20} />
                        </button>
                        <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-orange-400 to-orange-600 overflow-hidden border-2 border-white/20 shadow-lg cursor-pointer transform hover:scale-105 transition-transform active:scale-95">
                            <img src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&q=80" alt="ME" className="w-full h-full object-cover" />
                        </div>
                    </div>
                </header>

                <div className="p-6 md:p-10 max-w-7xl mx-auto w-full">
                    <div className="flex flex-col xl:flex-row gap-10 items-start">
                        {/* Cart Items Area */}
                        <div className="flex-1 space-y-6 w-full animate-fade-in">
                            {cartItems.length === 0 ? (
                                <div className={`rounded-[40px] p-20 text-center border-2 border-dashed ${isDarkMode ? 'bg-gray-900/40 border-gray-800' : 'bg-white border-gray-200'} flex flex-col items-center justify-center`}>
                                    <div className={`w-24 h-24 rounded-full flex items-center justify-center mb-6 ${isDarkMode ? 'bg-gray-800' : 'bg-orange-50'}`}>
                                        <ShoppingCart size={40} className="text-orange-500 opacity-40" />
                                    </div>
                                    <h2 className="text-2xl font-black mb-3">Your cart is empty</h2>
                                    <p className={`text-sm mb-8 max-w-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>Looks like you haven't picked anything mouth-watering yet.</p>
                                    <button onClick={() => navigate('/home')} className="bg-orange-500 hover:bg-orange-600 text-white px-10 py-4 rounded-2xl font-black transition-all shadow-lg shadow-orange-500/30">Explore Menu</button>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between px-4">
                                        <p className="text-sm font-black opacity-40 uppercase tracking-widest">{cartItems.length} Products in bag</p>
                                        <button onClick={() => { }} className="text-xs font-black text-orange-500 hover:underline">Clear all items</button>
                                    </div>
                                    {cartItems.map((item) => (
                                        <div
                                            key={item.id}
                                            className={`rounded-[32px] p-5 border transition-all duration-500 group flex flex-col md:flex-row items-center gap-6 ${isDarkMode ? 'bg-gray-900/40 border-gray-800/50 hover:bg-gray-900/60' : 'bg-white border-gray-100 hover:shadow-xl'
                                                }`}
                                        >
                                            <div className="w-32 h-32 rounded-3xl overflow-hidden flex-shrink-0 shadow-xl ring-1 ring-black/5">
                                                <img
                                                    src={item.image || "https://images.unsplash.com/photo-1546700854-955607ea004e?w=500&q=80"}
                                                    alt={item.name || "Food Item"}
                                                    className="w-full h-full object-cover transition-transform group-hover:scale-110 duration-700"
                                                />
                                            </div>

                                            <div className="flex-1 text-center md:text-left">
                                                <p className="text-[10px] font-black tracking-[2px] uppercase text-orange-500 mb-1">{item.restaurant}</p>
                                                <h3 className="text-xl font-black mb-2 tracking-tight">{item.name}</h3>
                                                {/* Size badge */}
                                                {item.size && (
                                                    <span className={`inline-flex items-center gap-1 text-[10px] font-black px-2.5 py-1 rounded-full mb-2 ${isDarkMode ? 'bg-blue-500/15 text-blue-300 border border-blue-500/20' : 'bg-blue-50 text-blue-600 border border-blue-100'
                                                        }`}>
                                                        🧋 {item.size} size
                                                    </span>
                                                )}
                                                {/* Budget Meal badge + selections */}
                                                {item.budgetMeal && (
                                                    <div className={`inline-flex flex-col gap-1 text-left mb-2 p-2 rounded-xl border ${isDarkMode ? 'bg-purple-500/10 border-purple-500/20' : 'bg-purple-50 border-purple-100'
                                                        }`}>
                                                        <span className={`text-[10px] font-black uppercase tracking-widest ${isDarkMode ? 'text-purple-400' : 'text-purple-600'}`}>
                                                            🍱 {item.budgetMeal.combinationLabel}
                                                        </span>
                                                        {Array.isArray(item.budgetMeal.selectedOptions) && item.budgetMeal.selectedOptions.map((opt, i) => (
                                                            <span key={i} className={`text-[11px] font-semibold ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                                                {opt.component_type}: <strong>{opt.chosen}</strong>
                                                            </span>
                                                        ))}
                                                    </div>
                                                )}
                                                <p className={`text-xs font-medium line-clamp-1 mb-4 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                                                    {item.budgetMeal
                                                        ? `Budget Meal from ${item.restaurant}`
                                                        : (item.description || "Freshly made with premium ingredients and delivered hot to your doorstep.")}
                                                </p>
                                            </div>

                                            <div className="flex flex-col items-center md:items-end gap-4 min-w-[140px]">
                                                <div className={`flex items-center gap-4 p-1.5 rounded-2xl border ${isDarkMode ? 'bg-gray-950/50 border-gray-800' : 'bg-gray-50 border-gray-100'}`}>
                                                    <button onClick={() => handleUpdateQuantity(item.id, item.quantity - 1)} className={`w-8 h-8 flex items-center justify-center rounded-xl transition-all ${isDarkMode ? 'hover:bg-gray-800 text-gray-500 hover:text-white' : 'hover:bg-white text-gray-400 hover:text-orange-500'}`}>
                                                        <Minus size={16} className="stroke-[3]" />
                                                    </button>
                                                    <span className="text-lg font-black min-w-[24px] text-center">{item.quantity}</span>
                                                    <button onClick={() => handleUpdateQuantity(item.id, item.quantity + 1)} className={`w-8 h-8 flex items-center justify-center rounded-xl transition-all ${isDarkMode ? 'hover:bg-gray-800 text-gray-500 hover:text-white' : 'hover:bg-white text-gray-400 hover:text-orange-500'}`}>
                                                        <Plus size={16} className="stroke-[3]" />
                                                    </button>
                                                </div>
                                                <div className="flex items-center gap-4">
                                                    <p className="text-2xl font-black tracking-tight text-orange-500">
                                                        ₱{((Number(item.price) || 0) * (Number(item.quantity) || 1)).toFixed(2)}
                                                    </p>
                                                    <button onClick={() => handleRemoveItem(item.id)} className={`p-2.5 rounded-xl transition-all ${isDarkMode ? 'bg-red-500/10 text-red-400 hover:bg-red-500/20' : 'bg-red-50 text-red-400 hover:bg-red-100'}`}>
                                                        <Trash2 size={18} />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Delivery Location Section */}
                            <div className={`rounded-[40px] p-8 md:p-10 border transition-all ${isDarkMode ? 'bg-gray-900/30 border-gray-800' : 'bg-white border-gray-100 shadow-sm'}`}>
                                <div className="flex items-center justify-between mb-8">
                                    <h2 className="text-2xl font-black flex items-center gap-3">
                                        <div className="w-10 h-10 bg-orange-500/10 rounded-xl flex items-center justify-center shadow-inner">
                                            <Truck className="text-orange-500" size={20} />
                                        </div>
                                        Delivery details
                                    </h2>
                                    <span className="text-[10px] font-black uppercase tracking-widest opacity-40">University of Abra</span>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-3">
                                        <label className={`text-[10px] font-black uppercase tracking-[2px] ml-2 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>Department</label>
                                        <div className="relative group">
                                            <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-orange-500/40 group-focus-within:text-orange-500 transition-colors" size={18} />
                                            <input
                                                type="text"
                                                value={department}
                                                onChange={(e) => setDepartment(e.target.value)}
                                                placeholder="e.g. CAS Building"
                                                className={`w-full pl-12 pr-6 py-4.5 rounded-[22px] font-bold text-sm outline-none border-2 transition-all ${isDarkMode ? 'bg-gray-950/50 border-gray-800 focus:border-orange-500/50' : 'bg-[#fcfcfc] border-gray-50 focus:border-orange-500/20'
                                                    }`}
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-3">
                                        <label className={`text-[10px] font-black uppercase tracking-[2px] ml-2 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>Course / Room</label>
                                        <div className="relative group">
                                            <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-orange-500/40 group-focus-within:text-orange-500 transition-colors" size={18} />
                                            <input
                                                type="text"
                                                value={course}
                                                onChange={(e) => setCourse(e.target.value)}
                                                placeholder="e.g. BSIT 1-1"
                                                className={`w-full pl-12 pr-6 py-4.5 rounded-[22px] font-bold text-sm outline-none border-2 transition-all ${isDarkMode ? 'bg-gray-950/50 border-gray-800 focus:border-orange-500/50' : 'bg-[#fcfcfc] border-gray-50 focus:border-orange-500/20'
                                                    }`}
                                            />
                                        </div>
                                    </div>
                                </div>
                                {error && <p className="mt-4 text-xs font-bold text-red-500 flex items-center gap-1.5 ml-2"><span className="w-1.5 h-1.5 rounded-full bg-red-500" /> {error}</p>}
                            </div>

                            {/* Recommendations Section */}
                            <div className="pt-8">
                                <div className="flex items-center justify-between mb-8 px-2">
                                    <h2 className="text-2xl font-black tracking-tight flex items-center gap-2">
                                        <TrendingUp className="text-orange-500" size={24} /> Recommended
                                    </h2>
                                    <button className="text-xs font-black uppercase tracking-widest text-orange-500 flex items-center gap-1">SEE ALL <ChevronRight size={14} /></button>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    {recommendations.map(food => (
                                        <div key={food.id} className={`rounded-[36px] p-5 border transition-all duration-500 group flex flex-col h-full ${isDarkMode ? 'bg-gray-900/30 border-gray-800 hover:bg-gray-900/50' : 'bg-white border-gray-100 hover:shadow-2xl'
                                            }`}>
                                            <div className="relative aspect-[4/3] rounded-[24px] overflow-hidden mb-5">
                                                <img
                                                    src={food.image || "https://images.unsplash.com/photo-1546700854-955607ea004e?w=500&q=80"}
                                                    alt={food.name || "Food Item"}
                                                    className="w-full h-full object-cover transition-transform group-hover:scale-110 duration-700"
                                                />
                                                <div className="absolute top-4 right-4 bg-white/95 dark:bg-black/80 w-10 h-10 rounded-full flex items-center justify-center shadow-lg backdrop-blur-md">
                                                    <Star size={16} className="text-orange-500 fill-orange-500" />
                                                </div>
                                            </div>
                                            <div className="flex-1 px-1">
                                                <div className="flex justify-between items-start mb-1">
                                                    <h3 className="font-black text-lg tracking-tight">{food.name || "Item"}</h3>
                                                    <span className="flex items-center gap-1 text-[11px] font-black opacity-40">
                                                        <Clock size={12} /> 25'
                                                    </span>
                                                </div>
                                                <p className={`text-[11px] font-bold mb-6 opacity-40`}>From {food.restaurant}</p>
                                            </div>
                                            <div className="flex items-center justify-between px-1 mt-auto">
                                                <span className="text-2xl font-black">₱{food.price}</span>
                                                <button className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all active:scale-90 ${isDarkMode ? 'bg-orange-500 text-white shadow-orange-500/20 shadow-lg' : 'bg-orange-500 text-white shadow-orange-500/30 shadow-lg'
                                                    }`}>
                                                    <Plus size={20} />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Order Summary Sidebar */}
                        <div className="w-full xl:w-[400px] flex flex-col gap-6 sticky top-[104px] animate-fade-in-scale">
                            <div className={`rounded-[48px] p-8 md:p-10 border transition-all ${isDarkMode ? 'bg-gray-900/40 border-gray-800/50 backdrop-blur-xl' : 'bg-white border-gray-100 shadow-2xl shadow-gray-200/50'
                                }`}>
                                <h2 className="text-2xl font-black mb-10 tracking-tight">Bill Overview</h2>

                                <div className="space-y-6 mb-10">
                                    <div className="flex justify-between items-center group">
                                        <span className={`text-sm font-bold opacity-60`}>Item Total</span>
                                        <div className="flex flex-col items-end">
                                            <span className="text-lg font-black tracking-tight">₱{subtotal.toFixed(2)}</span>
                                            <span className="text-[10px] font-black opacity-30 uppercase tracking-[2px]">{cartItems.length} ITEMS</span>
                                        </div>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className={`text-sm font-bold opacity-60`}>Delivery Fee</span>
                                        <span className="text-lg font-black">₱{deliveryFee.toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className={`text-sm font-bold text-emerald-500`}>Discount Rate</span>
                                        <span className="text-lg font-black text-emerald-500">-₱{promoDiscount.toFixed(2)}</span>
                                    </div>
                                    <div className={`mt-8 pt-8 border-t flex justify-between items-center ${isDarkMode ? 'border-gray-800' : 'border-gray-100'}`}>
                                        <div className="flex flex-col">
                                            <span className="text-sm font-black opacity-40 uppercase tracking-[3px]">Total Payable</span>
                                            <span className="text-4xl font-black tracking-tighter text-orange-500">
                                                ₱{total.toFixed(2)}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <div className={`p-4 rounded-3xl mb-8 flex items-center gap-4 ${isDarkMode ? 'bg-gray-950/50' : 'bg-gray-50'}`}>
                                    <div className="w-12 h-12 bg-emerald-500/10 rounded-2xl flex items-center justify-center text-emerald-500 border border-emerald-500/20">
                                        <CreditCard size={20} />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black opacity-30 uppercase tracking-[2px]">PAYMENT METHOD</p>
                                        <p className="font-black text-sm">Cash on Delivery</p>
                                    </div>
                                    <button className="ml-auto text-orange-500 font-black text-xs">Edit</button>
                                </div>

                                <button
                                    onClick={handleCheckout}
                                    disabled={isProcessing || cartItems.length === 0}
                                    className={`w-full py-6 rounded-[32px] bg-gradient-to-r from-orange-400 to-orange-600 text-white font-black text-xl transition-all shadow-xl shadow-orange-500/40 active:scale-[0.98] flex items-center justify-center gap-3 ${(isProcessing || cartItems.length === 0) ? 'opacity-50 grayscale' : 'hover:shadow-orange-500/60 hover:-translate-y-1'
                                        }`}
                                >
                                    {isProcessing ? (
                                        <>
                                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                            <span>Processing...</span>
                                        </>
                                    ) : (
                                        <>
                                            <span>Place Order Now</span>
                                            <ChevronRight size={24} />
                                        </>
                                    )}
                                </button>

                                <div className="mt-8 flex flex-col items-center gap-4">
                                    <div className="flex items-center gap-2 opacity-30">
                                        <div className="w-3 h-3 rounded-full bg-emerald-500" />
                                        <span className="text-[10px] font-black tracking-[4px] uppercase">Secure Checkout</span>
                                    </div>
                                    <button
                                        onClick={() => navigate('/home')}
                                        className={`text-xs font-black uppercase tracking-widest transition-all hover:text-orange-500 border-b-2 border-transparent hover:border-orange-500 pb-1`}
                                    >
                                        Back to Browsing
                                    </button>
                                </div>
                            </div>

                            {/* Trust badges footer */}
                            <div className="flex justify-center gap-8 opacity-20 grayscale hover:opacity-100 hover:grayscale-0 transition-all duration-700">
                                <img src="https://upload.wikimedia.org/wikipedia/commons/5/5e/Visa_Inc._logo.svg" alt="Visa" className="h-4" />
                                <img src="https://upload.wikimedia.org/wikipedia/commons/2/2a/Mastercard-logo.svg" alt="Mastercard" className="h-6" />
                                <img src="https://upload.wikimedia.org/wikipedia/commons/b/b5/PayPal.svg" alt="PayPal" className="h-5" />
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            <style jsx>{`
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                @keyframes fade-in-scale {
                    from { opacity: 0; transform: scale(0.95); }
                    to { opacity: 1; transform: scale(1); }
                }
                .animate-fade-in {
                    animation: fadeIn 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards;
                }
                .animate-fade-in-scale {
                    animation: fade-in-scale 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
                }
            `}</style>
        </div>
    )
}

export default Cart
