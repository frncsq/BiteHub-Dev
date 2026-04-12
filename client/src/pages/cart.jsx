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
    const [isProcessing, setIsProcessing] = useState(null)
    const [error, setError] = useState("")
    const [message, setMessage] = useState("")
    const [messageType, setMessageType] = useState("")
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
    const [department, setDepartment] = useState("")
    const [course, setCourse] = useState("")
    const [activeTab, setActiveTab] = useState("cart")
    const [recommendations, setRecommendations] = useState([])
    const [activeCheckoutStore, setActiveCheckoutStore] = useState(null)

    const navigate = useNavigate()
    const { isDarkMode, toggleTheme } = useTheme()
    const apiClient = createApiClient()

    useEffect(() => {
        const token = localStorage.getItem('authToken');
        if (!token) {
            navigate('/login');
            return;
        }
        fetchCartItems()
        fetchRecommendations()
    }, [])

    // Auto-dismiss success/error message after 4 seconds
    useEffect(() => {
        if (message) {
            const timer = setTimeout(() => { setMessage(""); setMessageType(""); }, 4000);
            return () => clearTimeout(timer);
        }
    }, [message])

    const fetchRecommendations = async () => {
        try {
            const res = await apiClient.get('/food')
            if (res.data?.success) {
                const allFood = res.data.foods || []
                // Pick 3 random items for recommendations
                setRecommendations(allFood.sort(() => 0.5 - Math.random()).slice(0, 3))
            }
        } catch (err) {
            console.error("Failed to fetch recommendations:", err)
        }
    }

    const handleAddToCart = async (food) => {
        try {
            setIsProcessing(food.id)
            await apiClient.post('/cart/add', { foodId: food.id, quantity: 1 })
            setMessage(`Added "${food.name}" to cart!`)
            setMessageType("success")
            await fetchCartItems()
        } catch (err) {
            console.error("Failed to add to cart:", err)
            setMessage("Failed to add item. Please try again.")
            setMessageType("error")
        } finally {
            setIsProcessing(null)
        }
    }

    const fetchCartItems = async () => {
        try {
            setLoading(true)
            const response = await apiClient.get('/cart')
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

            // Sync with backend (Note: apiClient baseURL already includes /api)
            await apiClient.post('/cart/update', { foodId, quantity, size, budgetMealComboId });
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
            await apiClient.post('/cart/remove', { foodId, size, budgetMealComboId });
        } catch (err) {
            console.error("Remove item failed:", err);
            fetchCartItems();
        }
    }

    const calculateStoreSubtotal = (items) => {
        return items.reduce((acc, item) => acc + (Number(item.price || 0) * Number(item.quantity || 1)), 0)
    }

    const groupedCart = cartItems.reduce((acc, item) => {
        const storeId = item.restaurant_id || item.restaurantId || item.restaurant || 'Unknown Store';
        const storeName = item.restaurant || 'BiteHub Partner';
        if (!acc[storeId]) {
            acc[storeId] = { storeName, items: [], storeId };
        }
        acc[storeId].items.push(item);
        return acc;
    }, {});

    const deliveryFeeBase = 25;

    const handleCheckout = async (storeId) => {
        const storeGroup = groupedCart[storeId];
        if (!storeGroup || storeGroup.items.length === 0) return;

        if (!department || !course) {
            setError("Please fill in campus delivery details");
            return;
        }

        try {
            setIsProcessing(storeId);
            const storeSubtotal = calculateStoreSubtotal(storeGroup.items);
            const deliveryFee = deliveryFeeBase;
            const promoDiscount = storeSubtotal > 1000 ? 100 : 0;
            const total = storeSubtotal + deliveryFee - promoDiscount;

            const orderData = {
                items: storeGroup.items.map(item => ({
                    id: item.foodId || item.id,
                    quantity: item.quantity,
                    price: item.price,
                    name: item.name,
                    restaurantId: item.restaurant_id || item.restaurantId || item.restaurant || 1
                })),
                subtotal: storeSubtotal, total, department, course,
                tax: 0,
                deliveryFee
            }
            const response = await apiClient.post('/orders/create', orderData)
            if (response.data?.success) {
                // Update local cart state to remove only the checked out store's items
                const remainingItems = cartItems.filter(item => {
                    const itemStoreId = item.restaurant_id || item.restaurantId || item.restaurant || 'Unknown Store';
                    return String(itemStoreId) !== String(storeId);
                });

                setError("");

                setMessage(`Order for ${storeGroup.storeName} placed successfully!`);
                setMessageType("success");

                if (remainingItems.length === 0) {
                    navigate("/orders");
                } else {
                    setCartItems(remainingItems);
                    setActiveCheckoutStore(null);
                }
            }
        } catch (err) {
            setError("Checkout failed. Try again.")
        } finally {
            setIsProcessing(null)
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
        <div className={`min-h-screen flex font-sans transition-colors duration-300 ${isDarkMode ? 'bg-zinc-950 text-white' : 'bg-slate-50 text-slate-900'}`}>            <CustomerSidebar
            activeTab="cart"
            sidebarCollapsed={sidebarCollapsed}
            setSidebarCollapsed={setSidebarCollapsed}
        />

            {/* Main Content Area */}
            <main className={`flex-1 flex flex-col relative z-20 overflow-x-hidden min-h-0 h-[100dvh] overflow-y-auto scroll-smooth transition-all duration-300 pb-24 md:pb-8 ${sidebarCollapsed ? 'md:pl-20' : 'md:pl-64'}`}>
                {/* Ambient Highlight */}
                <div className="fixed top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
                    <div className={`absolute -top-[20%] -left-[10%] w-[50%] h-[50%] rounded-full blur-[150px] ${isDarkMode ? 'bg-orange-500/10' : 'bg-orange-500/5'}`} />
                </div>

                <div className="bh-container max-w-5xl py-6 sm:py-8 md:py-10 w-full space-y-6 sm:space-y-8 relative z-10">
                    {/* Back Button */}
                    <button
                        type="button"
                        onClick={() => navigate("/home")}
                        className={`mb-2 inline-flex items-center gap-2 min-h-[44px] px-4 py-2 rounded-full text-sm font-medium transition-colors touch-manipulation ${isDarkMode ? 'hover:bg-white/5 text-zinc-400' : 'hover:bg-black/5 text-slate-500'}`}
                    >
                        <ArrowLeft size={16} /> Back to Dashboard
                    </button>

                    {/* Toast Message */}
                    {message && (
                        <div className={`fixed top-6 left-1/2 -translate-x-1/2 z-[100] px-6 py-3 rounded-xl shadow-lg text-sm font-semibold flex items-center gap-3 animate-fade-in-scale ${
                            messageType === 'success'
                                ? 'bg-emerald-500 text-white shadow-emerald-500/30'
                                : 'bg-red-500 text-white shadow-red-500/30'
                        }`}>
                            <span>{messageType === 'success' ? '✓' : '✕'}</span>
                            <span>{message}</span>
                            <button onClick={() => { setMessage(''); setMessageType(''); }} className="ml-2 opacity-70 hover:opacity-100 transition-opacity">✕</button>
                        </div>
                    )}

                    {/* Minimalist Header */}
                    <div className={`mb-8 flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b ${isDarkMode ? 'border-white/10' : 'border-black/5'}`}>
                        <div>
                            <h1 className={`text-3xl md:text-4xl font-bold tracking-tight mb-2 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>Bite Cart</h1>
                            <p className={`text-sm font-medium ${isDarkMode ? 'text-zinc-500' : 'text-slate-500'}`}>Review your items and complete checkout.</p>
                        </div>
                        <div className={`flex gap-6 items-center p-4 rounded-2xl border backdrop-blur-sm ${isDarkMode ? 'bg-black/20 border-white/5' : 'bg-white/50 border-black/5'}`}>
                            <div className="flex flex-col">
                                <span className="text-xs font-medium uppercase tracking-wide mb-1 text-gray-500">Cart Items</span>
                                <span className="text-2xl font-bold text-orange-500 leading-none">{cartItems.length}</span>
                            </div>
                        </div>
                    </div>
                    {/* Cart Items Area */}
                    <div className="w-full animate-fade-in space-y-6">
                        {cartItems.length === 0 ? (
                            <div className={`rounded-2xl p-16 sm:p-24 text-center border shadow-sm ${isDarkMode ? 'bg-zinc-900/40 border-zinc-800/80' : 'bg-white border-slate-200'} flex flex-col items-center justify-center`}>
                                <div className={`w-20 h-20 rounded-2xl flex items-center justify-center mb-6 border ${isDarkMode ? 'bg-zinc-800/50 border-zinc-700 text-zinc-500' : 'bg-slate-50 border-slate-100 text-slate-400'} shadow-sm`}>
                                    <ShoppingCart size={30} />
                                </div>
                                <h2 className={`text-xl font-semibold mb-2 tracking-tight ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>Your cart is empty</h2>
                                <p className={`text-sm mb-8 max-w-sm ${isDarkMode ? 'text-zinc-500' : 'text-slate-500'}`}>Browse our robust selection of meals and add something to your cart.</p>
                                <button onClick={() => navigate('/home')} className="bg-orange-500 hover:bg-orange-600 text-white px-8 py-3 rounded-xl text-sm font-semibold transition-all shadow-sm active:scale-[0.98]">Browse menu</button>
                            </div>
                        ) : (
                            <div className="space-y-6">
                                <div className="flex items-center justify-between px-1">
                                    <p className={`text-[11px] font-semibold uppercase tracking-widest ${isDarkMode ? 'text-zinc-400' : 'text-slate-500'}`}>{cartItems.length} Selections</p>
                                    <button onClick={() => setCartItems([])} className="text-[11px] font-semibold text-orange-500 hover:text-orange-600 uppercase tracking-widest transition-colors focus:outline-none">Clear Bag</button>
                                </div>

                                {Object.values(groupedCart).map((group) => {
                                    const storeSubtotal = calculateStoreSubtotal(group.items);
                                    const deliveryFee = deliveryFeeBase;
                                    const promoDiscount = storeSubtotal > 1000 ? 10 : 0;
                                    const storeTotal = storeSubtotal + deliveryFee - promoDiscount;

                                    return (
                                        <div key={group.storeId} className={`rounded-2xl overflow-hidden border transition-all duration-300 ${isDarkMode ? 'bg-zinc-900/60 border-zinc-800/80 shadow-md shadow-black/20' : 'bg-white border-slate-200 shadow-sm'}`}>
                                            <div className={`px-6 py-4 flex justify-between items-center border-b ${isDarkMode ? 'bg-zinc-900/80 border-zinc-800' : 'bg-slate-50/50 border-slate-200'}`}>
                                                <div className="flex items-center gap-3">
                                                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${isDarkMode ? 'bg-zinc-800 text-zinc-300' : 'bg-slate-200 text-slate-600'}`}>
                                                        <Utensils size={14} />
                                                    </div>
                                                    <div>
                                                        <h2 className={`text-base font-semibold tracking-tight ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>{group.storeName}</h2>
                                                        <span className={`text-[10px] font-medium uppercase tracking-widest ${isDarkMode ? 'text-zinc-500' : 'text-slate-500'}`}>{group.items.length} Items</span>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="p-5 sm:p-6 space-y-4">
                                                {group.items.map((item) => (
                                                    <div
                                                        key={item.id}
                                                        className={`rounded-xl p-4 border transition-all duration-300 group flex flex-col sm:flex-row items-center gap-5 ${isDarkMode ? 'bg-zinc-950/40 border-zinc-800/50 hover:border-zinc-700 hover:bg-zinc-900/50' : 'bg-white border-slate-200 hover:border-slate-300 hover:shadow-sm'
                                                            }`}
                                                    >
                                                        <div className="w-20 h-20 sm:w-20 sm:h-20 rounded-lg overflow-hidden flex-shrink-0 shadow-sm border border-black/5 dark:border-white/5">
                                                            <img
                                                                src={item.image || "https://images.unsplash.com/photo-1546700854-955607ea004e?w=500&q=80"}
                                                                alt={item.name || "Food Item"}
                                                                className="w-full h-full object-cover transition-transform group-hover:scale-105 duration-700"
                                                            />
                                                        </div>

                                                        <div className="flex-1 text-center sm:text-left w-full">
                                                            <div className="flex flex-col sm:flex-row sm:items-start justify-between mb-1 gap-2">
                                                                <div>
                                                                    <h3 className={`text-sm font-semibold tracking-tight ${isDarkMode ? 'text-zinc-100' : 'text-slate-800'}`}>{item.name}</h3>
                                                                    <div className="flex flex-wrap justify-center sm:justify-start gap-2 mt-2">
                                                                        {item.size && (
                                                                            <span className={`inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-md ${isDarkMode ? 'bg-zinc-800 text-zinc-300 border border-zinc-700' : 'bg-slate-100 text-slate-600 border border-slate-200'}`}>
                                                                                {item.size}
                                                                            </span>
                                                                        )}
                                                                        {item.budgetMeal && (
                                                                            <span className={`inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-md ${isDarkMode ? 'bg-zinc-800 text-zinc-300 border border-zinc-700' : 'bg-slate-100 text-slate-600 border border-slate-200'}`}>
                                                                                🍱 {item.budgetMeal.combinationLabel}
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                                <p className={`text-base font-semibold ${isDarkMode ? 'text-zinc-100' : 'text-slate-900'}`}>
                                                                    ₱{((Number(item.price) || 0) * (Number(item.quantity) || 1)).toFixed(2)}
                                                                </p>
                                                            </div>

                                                            <div className="flex items-center justify-center sm:justify-start gap-2 mt-1">
                                                                <div className={`flex items-center gap-1 p-0.5 rounded-md border ${isDarkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-slate-50 border-slate-200 shadow-sm'}`}>
                                                                    <button onClick={() => handleUpdateQuantity(item.id, item.quantity - 1)} className={`w-6 h-6 flex items-center justify-center rounded transition-all ${isDarkMode ? 'hover:bg-zinc-800 text-zinc-400 hover:text-white' : 'hover:bg-white text-slate-500 hover:text-slate-800'} border border-transparent hover:border-black/5 dark:hover:border-white/5`}>
                                                                        <Minus size={12} />
                                                                    </button>
                                                                    <span className="text-xs font-semibold min-w-[16px] text-center">{item.quantity}</span>
                                                                    <button onClick={() => handleUpdateQuantity(item.id, item.quantity + 1)} className={`w-6 h-6 flex items-center justify-center rounded transition-all ${isDarkMode ? 'hover:bg-zinc-800 text-zinc-400 hover:text-white' : 'hover:bg-white text-slate-500 hover:text-slate-800'} border border-transparent hover:border-black/5 dark:hover:border-white/5`}>
                                                                        <Plus size={12} />
                                                                    </button>
                                                                </div>
                                                                <button onClick={() => handleRemoveItem(item.id)} className={`p-1.5 rounded-md transition-all ${isDarkMode ? 'text-zinc-500 hover:text-red-400 hover:bg-red-500/10' : 'text-slate-400 hover:text-red-600 hover:bg-red-50'}`} aria-label="Remove item">
                                                                    <Trash2 size={14} />
                                                                </button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>

                                            <div className={`p-6 border-t flex flex-col md:flex-row justify-between items-center gap-6 ${isDarkMode ? 'bg-zinc-900/80 border-zinc-800' : 'bg-slate-50/50 border-slate-200'}`}>
                                                <div className="w-full md:w-auto flex flex-wrap gap-x-8 gap-y-4 text-sm justify-center md:justify-start">
                                                    <div>
                                                        <span className={`block text-[10px] font-semibold uppercase tracking-widest ${isDarkMode ? 'text-zinc-400' : 'text-slate-500'}`}>Subtotal</span>
                                                        <span className={`font-semibold ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>₱{storeSubtotal.toFixed(2)}</span>
                                                    </div>
                                                    <div>
                                                        <span className={`block text-[10px] font-semibold uppercase tracking-widest ${isDarkMode ? 'text-zinc-400' : 'text-slate-500'}`}>Delivery</span>
                                                        <span className={`font-semibold ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>₱{deliveryFee.toFixed(2)}</span>
                                                    </div>
                                                    {promoDiscount > 0 && (
                                                        <div>
                                                            <span className="block text-[10px] font-semibold uppercase tracking-widest text-emerald-500">Discount</span>
                                                            <span className="font-semibold text-emerald-500">-₱{promoDiscount.toFixed(2)}</span>
                                                        </div>
                                                    )}
                                                    <div>
                                                        <span className={`block text-[10px] font-semibold uppercase tracking-widest ${isDarkMode ? 'text-zinc-200' : 'text-slate-800'}`}>Total</span>
                                                        <span className={`text-xl font-bold leading-none block mt-0.5 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>₱{storeTotal.toFixed(2)}</span>
                                                    </div>
                                                </div>

                                                <button
                                                    onClick={() => {
                                                        if (activeCheckoutStore === group.storeId) {
                                                            setActiveCheckoutStore(null);
                                                        } else {
                                                            setActiveCheckoutStore(group.storeId);
                                                            setError(""); // clear error when open new panel
                                                        }
                                                    }}
                                                    className={`w-full md:w-auto px-8 py-3 rounded-xl ${activeCheckoutStore === group.storeId ? (isDarkMode ? 'bg-zinc-800 text-white hover:bg-zinc-700' : 'bg-slate-200 text-slate-800 hover:bg-slate-300') : 'bg-orange-500 hover:bg-orange-600 text-white'} font-semibold text-sm transition-all shadow-sm active:scale-[0.98] flex items-center justify-center gap-2`}
                                                >
                                                    <span>{activeCheckoutStore === group.storeId ? 'Cancel Checkout' : `Checkout ${group.storeName}`}</span>
                                                    <ChevronDown size={16} className={`transition-transform duration-300 ${activeCheckoutStore === group.storeId ? 'rotate-180' : ''}`} />
                                                </button>
                                            </div>

                                            {/* Expandable Checkout Details */}
                                            <div className={`transition-all duration-300 ease-in-out overflow-hidden ${activeCheckoutStore === group.storeId ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'}`}>
                                                <div className={`p-6 border-t ${isDarkMode ? 'bg-zinc-950/80 border-zinc-800' : 'bg-slate-50/50 border-slate-200'}`}>
                                                    <div className="flex items-center justify-between mb-4">
                                                        <h3 className={`text-sm font-semibold flex items-center gap-2 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                                                            <div className={`w-6 h-6 rounded-md flex items-center justify-center ${isDarkMode ? 'bg-zinc-800 text-zinc-300' : 'bg-slate-200 text-slate-600'}`}>
                                                                <Truck size={14} />
                                                            </div>
                                                            Delivery destination
                                                        </h3>
                                                        <span className={`text-[10px] uppercase font-bold tracking-wider ${isDarkMode ? 'text-orange-400' : 'text-orange-600'}`}>Abra University Main</span>
                                                    </div>

                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                        <div className="space-y-1.5">
                                                            <label className={`text-[10px] font-semibold uppercase tracking-widest ${isDarkMode ? 'text-zinc-400' : 'text-slate-500'}`}>Building / Department</label>
                                                            <div className="relative group">
                                                                <MapPin className={`absolute left-3 top-1/2 -translate-y-1/2 transition-colors ${isDarkMode ? 'text-zinc-500 group-focus-within:text-white' : 'text-slate-400 group-focus-within:text-slate-800'}`} size={14} />
                                                                <input
                                                                    type="text"
                                                                    value={department}
                                                                    onChange={(e) => { setDepartment(e.target.value); setError(""); }}
                                                                    placeholder="e.g. CAS / CAFC"
                                                                    className={`w-full pl-9 pr-3 py-2 rounded-lg text-sm font-medium outline-none border transition-all ${isDarkMode ? 'bg-zinc-900 border-zinc-700 focus:border-zinc-500 text-white placeholder-zinc-600' : 'bg-white border-slate-300 focus:border-slate-400 text-slate-900 placeholder-slate-400'}`}
                                                                />
                                                            </div>
                                                        </div>
                                                        <div className="space-y-1.5">
                                                            <label className={`text-[10px] font-semibold uppercase tracking-widest ${isDarkMode ? 'text-zinc-400' : 'text-slate-500'}`}>Course & Room</label>
                                                            <div className="relative group">
                                                                <MapPin className={`absolute left-3 top-1/2 -translate-y-1/2 transition-colors ${isDarkMode ? 'text-zinc-500 group-focus-within:text-white' : 'text-slate-400 group-focus-within:text-slate-800'}`} size={14} />
                                                                <input
                                                                    type="text"
                                                                    value={course}
                                                                    onChange={(e) => { setCourse(e.target.value); setError(""); }}
                                                                    placeholder="e.g. BSIT 3A / Lec Rm 2"
                                                                    className={`w-full pl-9 pr-3 py-2 rounded-lg text-sm font-medium outline-none border transition-all ${isDarkMode ? 'bg-zinc-900 border-zinc-700 focus:border-zinc-500 text-white placeholder-zinc-600' : 'bg-white border-slate-300 focus:border-slate-400 text-slate-900 placeholder-slate-400'}`}
                                                                />
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {error && activeCheckoutStore === group.storeId && (
                                                        <p className="mt-4 text-xs font-medium text-red-500 flex items-center gap-1.5">⚠️ {error}</p>
                                                    )}

                                                    <div className="mt-5 flex flex-col-reverse sm:flex-row items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-zinc-800/50">
                                                        <button
                                                            onClick={() => setActiveCheckoutStore(null)}
                                                            className={`w-full sm:w-auto px-5 py-2 rounded-lg text-sm font-semibold transition-all ${isDarkMode ? 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                                                        >
                                                            Cancel
                                                        </button>
                                                        <button
                                                            onClick={() => handleCheckout(group.storeId)}
                                                            disabled={isProcessing === group.storeId}
                                                            className={`w-full sm:w-auto min-w-[140px] px-6 py-2 rounded-lg bg-emerald-500 text-white font-semibold text-sm transition-all shadow-sm active:scale-[0.98] flex items-center justify-center gap-2 ${isProcessing === group.storeId ? 'opacity-70 cursor-not-allowed' : 'hover:bg-emerald-600 hover:shadow-md'}`}
                                                        >
                                                            {isProcessing === group.storeId ? (
                                                                <>
                                                                    <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                                                    <span>Processing</span>
                                                                </>
                                                            ) : (
                                                                'Confirm Order'
                                                            )}
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        )}
                    </div>

                    {/* High-density Recommendations Section */}
                    <div className="pt-4 border-t border-slate-200 dark:border-zinc-800">
                        <div className="flex items-center justify-between mb-5 px-1">
                            <h2 className={`text-sm font-semibold tracking-tight flex items-center gap-2 uppercase tracking-widest ${isDarkMode ? 'text-zinc-300' : 'text-slate-600'}`}>
                                <TrendingUp className="text-zinc-400" size={14} /> Suggestions for you
                            </h2>
                            <button className={`text-[10px] font-semibold uppercase tracking-widest hover:underline ${isDarkMode ? 'text-orange-400' : 'text-orange-500'}`}>Explore More</button>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                            {recommendations.map(food => (
                                <div key={food.id} className={`rounded-2xl p-3 border transition-all duration-300 group flex flex-col h-full ${isDarkMode ? 'bg-zinc-900/40 border-zinc-800 hover:bg-zinc-900' : 'bg-white border-slate-200 hover:shadow-md'
                                    }`}>
                                    <div className="relative aspect-video rounded-xl overflow-hidden mb-3 bg-zinc-100 dark:bg-zinc-800">
                                        <img
                                            src={food.image || "https://images.unsplash.com/photo-1546700854-955607ea004e?w=500&q=80"}
                                            alt={food.name || "Food Item"}
                                            className="w-full h-full object-cover transition-transform group-hover:scale-105 duration-700"
                                        />
                                    </div>
                                    <div className="flex-1 px-1">
                                        <div className="flex justify-between items-start mb-0.5">
                                            <h3 className={`font-semibold text-xs tracking-tight line-clamp-1 ${isDarkMode ? 'text-zinc-100' : 'text-slate-900'}`}>{food.name || "Item"}</h3>
                                            <span className={`text-[10px] font-semibold ${isDarkMode ? 'text-zinc-300' : 'text-slate-700'}`}>₱{food.price}</span>
                                        </div>
                                        <p className={`text-[10px] font-medium mb-3 ${isDarkMode ? 'text-zinc-500' : 'text-slate-500'}`}>{food.restaurant}</p>
                                    </div>
                                    <button
                                        onClick={() => handleAddToCart(food)}
                                        disabled={isProcessing === food.id}
                                        className={`w-full py-2.5 rounded-lg text-[10px] font-semibold transition-all flex items-center justify-center gap-1.5 ${isProcessing === food.id ? 'opacity-70 cursor-not-allowed' : ''} ${isDarkMode ? 'bg-zinc-800 text-zinc-300 hover:bg-orange-600 hover:text-white border border-zinc-700 hover:border-orange-500' : 'bg-slate-50 text-slate-600 hover:bg-orange-500 hover:text-white border border-slate-200 hover:border-orange-500'}`}>
                                        {isProcessing === food.id ? (
                                            <>
                                                <div className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                                                Adding...
                                            </>
                                        ) : (
                                            <>
                                                <Plus size={12} />
                                                Add to Cart
                                            </>
                                        )}
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </main>

            <style>{`
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
