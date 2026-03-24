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
        const token = localStorage.getItem('authToken');
        if (!token) {
            navigate('/login');
            return;
        }
        fetchCartItems()
        fetchRecommendations()
    }, [])

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
            const response = await apiClient.post('/orders/create', orderData)
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
                {/* Professional Compact Header */}
                <header className={`sticky top-0 z-40 backdrop-blur-md border-b h-16 px-6 flex items-center justify-between ${isDarkMode ? 'bg-gray-950/80 border-gray-800/50' : 'bg-white/80 border-gray-100'}`}>
                    <div className="flex items-center gap-3">
                        <button onClick={() => navigate('/home')} className={`p-1.5 rounded-lg transition-all ${isDarkMode ? 'bg-gray-900/50 border-gray-800 hover:bg-gray-800/80' : 'bg-gray-50 border-gray-200/50 hover:bg-gray-100'} border`}>
                            <ArrowLeft size={16} />
                        </button>
                        <div>
                            <h1 className="text-xl font-black tracking-tight leading-none mb-1">Cart</h1>
                            <p className={`text-[10px] font-black uppercase tracking-[2px] leading-none ${isDarkMode ? 'text-gray-100' : 'text-black'}`}>Checkout Process</p>
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
                                    <div className="flex items-center justify-between px-2">
                                        <p className={`text-[10px] font-black uppercase tracking-[4px] ${isDarkMode ? 'text-gray-100' : 'text-black'}`}>{cartItems.length} Selections</p>
                                        <button onClick={() => { }} className="text-[10px] font-black text-orange-500 hover:text-orange-600 uppercase tracking-widest transition-colors">Clear Bag</button>
                                    </div>
                                    {cartItems.map((item) => (
                                        <div
                                            key={item.id}
                                            className={`rounded-[28px] p-4 border transition-all duration-500 group flex flex-col sm:flex-row items-center gap-4 ${isDarkMode ? 'bg-gray-900/40 border-gray-800/40 hover:bg-gray-900/60' : 'bg-white border-gray-100/60 hover:shadow-xl hover:shadow-gray-200/50'
                                                }`}
                                        >
                                            <div className="w-24 h-24 rounded-2xl overflow-hidden flex-shrink-0 shadow-lg ring-1 ring-black/5">
                                                <img
                                                    src={item.image || "https://images.unsplash.com/photo-1546700854-955607ea004e?w=500&q=80"}
                                                    alt={item.name || "Food Item"}
                                                    className="w-full h-full object-cover transition-transform group-hover:scale-105 duration-700"
                                                />
                                            </div>

                                            <div className="flex-1 text-center sm:text-left">
                                                <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-1 gap-1">
                                                    <div>
                                                        <p className="text-[9px] font-black tracking-[2px] uppercase text-orange-500 mb-0.5">{item.restaurant}</p>
                                                        <h3 className="text-base font-black tracking-tight leading-tight">{item.name}</h3>
                                                    </div>
                                                    <p className="text-lg font-black tracking-tighter text-orange-500">
                                                        ₱{((Number(item.price) || 0) * (Number(item.quantity) || 1)).toFixed(2)}
                                                    </p>
                                                </div>

                                                <div className="flex flex-wrap justify-center sm:justify-start gap-2 mb-3">
                                                    {item.size && (
                                                        <span className={`inline-flex items-center gap-1 text-[9px] font-black px-2 py-0.5 rounded-full ${isDarkMode ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' : 'bg-blue-50 text-blue-600 border border-blue-100'}`}>
                                                            {item.size}
                                                        </span>
                                                    )}
                                                    {item.budgetMeal && (
                                                        <span className={`inline-flex items-center gap-1 text-[9px] font-black px-2 py-0.5 rounded-full ${isDarkMode ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20' : 'bg-purple-50 text-purple-600 border border-purple-100'}`}>
                                                            🍱 {item.budgetMeal.combinationLabel}
                                                        </span>
                                                    )}
                                                </div>

                                                <div className="flex items-center justify-center sm:justify-start gap-4">
                                                    <div className={`flex items-center gap-3 p-1 rounded-xl border ${isDarkMode ? 'bg-gray-950/30 border-gray-800' : 'bg-gray-50/50 border-gray-100'}`}>
                                                        <button onClick={() => handleUpdateQuantity(item.id, item.quantity - 1)} className={`w-6 h-6 flex items-center justify-center rounded-lg transition-all ${isDarkMode ? 'hover:bg-gray-800 text-gray-500 hover:text-white' : 'hover:bg-white text-gray-400 hover:text-orange-500'} border border-transparent hover:border-current/10`}>
                                                            <Minus size={12} className="stroke-[3]" />
                                                        </button>
                                                        <span className="text-sm font-black min-w-[20px] text-center">{item.quantity}</span>
                                                        <button onClick={() => handleUpdateQuantity(item.id, item.quantity + 1)} className={`w-6 h-6 flex items-center justify-center rounded-lg transition-all ${isDarkMode ? 'hover:bg-gray-800 text-gray-500 hover:text-white' : 'hover:bg-white text-gray-400 hover:text-orange-500'} border border-transparent hover:border-current/10`}>
                                                            <Plus size={12} className="stroke-[3]" />
                                                        </button>
                                                    </div>
                                                    <button onClick={() => handleRemoveItem(item.id)} className={`p-2 rounded-xl transition-all ${isDarkMode ? 'text-white hover:text-red-400 hover:bg-red-400/10' : 'text-black hover:text-red-500 hover:bg-red-50'}`}>
                                                        <Trash2 size={15} />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Delivery Location Section */}
                            <div className={`rounded-[24px] p-6 border transition-all ${isDarkMode ? 'bg-gray-900/20 border-gray-800' : 'bg-white border-gray-100 shadow-sm'}`}>
                                <div className="flex items-center justify-between mb-4">
                                    <h2 className="text-lg font-black flex items-center gap-2">
                                        <div className="w-8 h-8 bg-orange-500/10 rounded-lg flex items-center justify-center">
                                            <Truck className="text-orange-500" size={16} />
                                        </div>
                                        Delivery Target
                                    </h2>
                                    <p className={`text-[9px] font-black uppercase tracking-[2px] ${isDarkMode ? 'text-white' : 'text-black'}`}>Abra University Main</p>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <label className={`text-[9px] font-bold uppercase tracking-[1px] ml-1 ${isDarkMode ? 'text-gray-100' : 'text-black'}`}>Building / Department</label>
                                        <div className="relative group">
                                            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-orange-500/30 group-focus-within:text-orange-500 transition-colors" size={14} />
                                            <input
                                                type="text"
                                                value={department}
                                                onChange={(e) => setDepartment(e.target.value)}
                                                placeholder="e.g. CAS / CAFC"
                                                className={`w-full pl-9 pr-4 py-2.5 rounded-[14px] font-semibold text-xs outline-none border transition-all ${isDarkMode ? 'bg-gray-950/40 border-gray-800/80 focus:border-orange-500/40' : 'bg-[#fafafa] border-gray-100 focus:border-orange-500/20'
                                                    }`}
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className={`text-[9px] font-bold uppercase tracking-[1px] ml-1 ${isDarkMode ? 'text-gray-100' : 'text-black'}`}>Course & Room</label>
                                        <div className="relative group">
                                            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-orange-500/30 group-focus-within:text-orange-500 transition-colors" size={14} />
                                            <input
                                                type="text"
                                                value={course}
                                                onChange={(e) => setCourse(e.target.value)}
                                                placeholder="e.g. BSIT 3A / Lec Rm 2"
                                                className={`w-full pl-9 pr-4 py-2.5 rounded-[14px] font-semibold text-xs outline-none border transition-all ${isDarkMode ? 'bg-gray-950/40 border-gray-800/80 focus:border-orange-500/40' : 'bg-[#fafafa] border-gray-100 focus:border-orange-500/20'
                                                    }`}
                                            />
                                        </div>
                                    </div>
                                </div>
                                {error && <p className="mt-3 text-[10px] font-black text-red-500 flex items-center gap-1 ml-1 animate-bounce">⚠️ {error}</p>}
                            </div>

                            {/* High-density Recommendations Section */}
                            <div className="pt-6">
                                <div className="flex items-center justify-between mb-4 px-2">
                                    <h2 className="text-base font-black tracking-tight flex items-center gap-2 uppercase tracking-[2px]">
                                        <TrendingUp className="text-orange-500" size={16} /> <span className={isDarkMode ? 'text-white' : 'text-black'}>Suggestions</span>
                                    </h2>
                                    <button className="text-[9px] font-black uppercase tracking-widest text-orange-500 hover:underline">Explore More</button>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                                    {recommendations.map(food => (
                                        <div key={food.id} className={`rounded-[22px] p-3 border transition-all duration-500 group flex flex-col h-full ${isDarkMode ? 'bg-gray-900/20 border-gray-800 hover:bg-gray-900/40' : 'bg-white border-gray-100 hover:shadow-lg'
                                            }`}>
                                            <div className="relative aspect-video rounded-xl overflow-hidden mb-3">
                                                <img
                                                    src={food.image || "https://images.unsplash.com/photo-1546700854-955607ea004e?w=500&q=80"}
                                                    alt={food.name || "Food Item"}
                                                    className="w-full h-full object-cover transition-transform group-hover:scale-105 duration-700"
                                                />
                                            </div>
                                            <div className="flex-1 px-1">
                                                <div className="flex justify-between items-start mb-0.5">
                                                    <h3 className={`font-black text-xs tracking-tight line-clamp-1 ${isDarkMode ? 'text-white' : 'text-black'}`}>{food.name || "Item"}</h3>
                                                    <span className={`text-[8px] font-black ${isDarkMode ? 'text-gray-100' : 'text-black'}`}>₱{food.price}</span>
                                                </div>
                                                <p className={`text-[9px] font-bold mb-3 ${isDarkMode ? 'text-gray-300' : 'text-gray-900'}`}>From {food.restaurant}</p>
                                            </div>
                                            <button className={`w-full py-2 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${isDarkMode ? 'bg-gray-800 text-white hover:bg-orange-500' : 'bg-gray-50 text-gray-500 hover:bg-orange-500 hover:text-white'}`}>
                                                Quick Add
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Compact Checkout Sidebar */}
                        <div className="w-full xl:w-[320px] flex flex-col gap-4 sticky top-[80px] animate-fade-in-scale">
                            <div className={`rounded-[32px] p-6 border transition-all ${isDarkMode ? 'bg-gray-900/40 border-gray-800/50 backdrop-blur-xl' : 'bg-white border-gray-100 shadow-xl'
                                }`}>
                                <div className="flex items-center justify-between mb-6">
                                    <h2 className={`text-base font-black tracking-tight uppercase ${isDarkMode ? 'text-white' : 'text-black'}`}>Summary</h2>
                                    <Package className="text-orange-500 opacity-20" size={16} />
                                </div>

                                <div className="space-y-3 mb-6">
                                    <div className="flex justify-between items-center">
                                        <span className={`text-[10px] font-bold uppercase tracking-widest ${isDarkMode ? 'text-gray-100' : 'text-black'}`}>Items ({cartItems.length})</span>
                                        <span className={`text-sm font-black tracking-tight ${isDarkMode ? 'text-white' : 'text-black'}`}>₱{subtotal.toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className={`text-[10px] font-bold uppercase tracking-widest ${isDarkMode ? 'text-gray-100' : 'text-black'}`}>Delivery</span>
                                        <span className={`text-sm font-black ${isDarkMode ? 'text-white' : 'text-black'}`}>₱{deliveryFee.toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className={`text-[9px] font-black text-emerald-500 uppercase tracking-widest`}>Discounts</span>
                                        <span className="text-sm font-black text-emerald-500">-₱{promoDiscount.toFixed(2)}</span>
                                    </div>
                                    <div className={`mt-4 pt-4 border-t border-dashed flex justify-between items-center ${isDarkMode ? 'border-gray-800' : 'border-gray-100'}`}>
                                        <div>
                                            <span className={`text-[9px] font-bold uppercase tracking-[2px] ${isDarkMode ? 'text-gray-100' : 'text-black'}`}>Payable</span>
                                            <p className="text-3xl font-black tracking-tighter text-orange-500 leading-none mt-1">₱{total.toFixed(2)}</p>
                                        </div>
                                    </div>
                                </div>

                                <div className={`p-3 rounded-2xl mb-4 flex items-center gap-3 ${isDarkMode ? 'bg-gray-950/40 border border-gray-800' : 'bg-gray-50 border border-gray-100'}`}>
                                    <div className="w-8 h-8 bg-emerald-500/10 rounded-lg flex items-center justify-center text-emerald-500">
                                        <CreditCard size={14} />
                                    </div>
                                    <div className="flex-1">
                                        <p className={`text-[7px] font-black uppercase tracking-[1px] ${isDarkMode ? 'text-gray-100' : 'text-black'}`}>Method</p>
                                        <p className={`font-black text-[10px] uppercase ${isDarkMode ? 'text-white' : 'text-black'}`}>Cash on Delivery</p>
                                    </div>
                                </div>

                                <button
                                    onClick={handleCheckout}
                                    disabled={isProcessing || cartItems.length === 0}
                                    className={`w-full py-3.5 rounded-xl bg-gradient-to-r from-orange-400 to-orange-600 text-white font-black text-[10px] uppercase tracking-widest transition-all shadow-lg active:scale-[0.98] flex items-center justify-center gap-2 ${(isProcessing || cartItems.length === 0) ? 'opacity-50 grayscale' : 'hover:shadow-orange-500/40 hover:-translate-y-0.5'
                                        }`}
                                >
                                    {isProcessing ? (
                                        <>
                                            <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                            <span>Processing</span>
                                        </>
                                    ) : (
                                        <>
                                            <span>Place Order</span>
                                            <ChevronRight size={12} />
                                        </>
                                    )}
                                </button>
                            </div>

                            {/* Trust badges footer */}
                            <div className="flex justify-center gap-8 opacity-20 grayscale hover:opacity-100 hover:grayscale-0 transition-all duration-700">
                                <img src="https://upload.wikimedia.org/wikipedia/commons/5/5e/Visa_Inc._logo.svg" alt="Visa" className="h-4" />
                                <img src="https://upload.wikimedia.org/wikipedia/commons/2/2a/MasterCard-logo.svg" alt="MasterCard" className="h-6" />
                                <img src="https://upload.wikimedia.org/wikipedia/commons/b/b5/PayPal.svg" alt="PayPal" className="h-5" />
                            </div>
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
