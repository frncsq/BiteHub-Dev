import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import {
    Trash2, Plus, Minus, ShoppingCart, ArrowLeft, Utensils, TrendingUp, ChevronDown, MapPin, Truck
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
    const [recommendations, setRecommendations] = useState([])
    const [activeCheckoutStore, setActiveCheckoutStore] = useState(null)

    const navigate = useNavigate()
    const { isDarkMode } = useTheme()
    const apiClient = createApiClient()

    useEffect(() => {
        const token = localStorage.getItem('authToken');
        if (!token) { navigate('/login'); return; }
        fetchCartItems()
        fetchRecommendations()
    }, [])

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
                setRecommendations((res.data.foods || []).sort(() => 0.5 - Math.random()).slice(0, 4))
            }
        } catch (err) { console.error("Failed to fetch recommendations:", err) }
    }

    const handleAddToCart = async (food) => {
        try {
            setIsProcessing(food.id)
            await apiClient.post('/cart/add', { foodId: food.id, quantity: 1 })
            setMessage(`Added "${food.name}" to cart!`)
            setMessageType("success")
            await fetchCartItems()
        } catch (err) {
            setMessage("Failed to add item. Please try again.")
            setMessageType("error")
        } finally { setIsProcessing(null) }
    }

    const fetchCartItems = async () => {
        try {
            setLoading(true)
            const response = await apiClient.get('/cart')
            if (response.data && response.data.cart) {
                setCartItems(response.data.cart
                    .map(item => ({ ...item, id: item.id ?? item.foodId ?? item.food_id }))
                    .filter(item => item.id != null && item.name))
            } else { setCartItems([]); }
        } catch { setCartItems([]); } finally { setLoading(false) }
    }

    const handleUpdateQuantity = async (itemId, quantity) => {
        const item = cartItems.find(i => i.id === itemId);
        const foodId = item?.foodId || itemId;
        const size = item?.size || null;
        const budgetMealComboId = item?.budgetMeal?.combinationId ?? null;
        if (quantity <= 0) {
            setCartItems(prev => prev.filter(item => item.id !== itemId));
        } else {
            setCartItems(prev => prev.map(item => item.id === itemId ? { ...item, quantity } : item));
        }
        try { await apiClient.post('/cart/update', { foodId, quantity, size, budgetMealComboId }); }
        catch { fetchCartItems(); }
    }

    const handleRemoveItem = async (itemId) => {
        const item = cartItems.find(i => i.id === itemId);
        const foodId = item?.foodId || itemId;
        const size = item?.size || null;
        const budgetMealComboId = item?.budgetMeal?.combinationId ?? null;
        setCartItems(prev => prev.filter(item => item.id !== itemId));
        try { await apiClient.post('/cart/remove', { foodId, size, budgetMealComboId }); }
        catch { fetchCartItems(); }
    }

    const calculateStoreSubtotal = (items) => items.reduce((acc, item) => acc + (Number(item.price || 0) * Number(item.quantity || 1)), 0)

    const groupedCart = cartItems.reduce((acc, item) => {
        const storeId = item.restaurant_id || item.restaurantId || item.restaurant || 'Unknown';
        const storeName = item.restaurant || 'KainGo Partner';
        if (!acc[storeId]) acc[storeId] = { storeName, items: [], storeId };
        acc[storeId].items.push(item);
        return acc;
    }, {});

    const deliveryFeeBase = 10;

    const handleCheckout = async (storeId) => {
        const storeGroup = groupedCart[storeId];
        if (!storeGroup || storeGroup.items.length === 0) return;
        if (!department || !course) { setError("Please fill in campus delivery details"); return; }
        try {
            setIsProcessing(storeId);
            const storeSubtotal = calculateStoreSubtotal(storeGroup.items);
            const deliveryFee = deliveryFeeBase;
            const promoDiscount = storeSubtotal > 1000 ? 100 : 0;
            const total = storeSubtotal + deliveryFee - promoDiscount;
            const response = await apiClient.post('/orders/create', {
                items: storeGroup.items.map(item => ({
                    id: item.foodId || item.id, quantity: item.quantity, price: item.price,
                    name: item.name, restaurantId: item.restaurant_id || item.restaurantId || item.restaurant || 1
                })),
                subtotal: storeSubtotal, total, department, course, tax: 0, deliveryFee
            });
            if (response.data?.success) {
                const remainingItems = cartItems.filter(item => {
                    const itemStoreId = item.restaurant_id || item.restaurantId || item.restaurant || 'Unknown';
                    return String(itemStoreId) !== String(storeId);
                });
                setError("");
                setMessage(`Order for ${storeGroup.storeName} placed successfully!`);
                setMessageType("success");
                if (remainingItems.length === 0) navigate("/orders");
                else { setCartItems(remainingItems); setActiveCheckoutStore(null); }
            }
        } catch (err) {
            setError(err.response?.data?.message || "Checkout failed. Try again.")
        } finally { setIsProcessing(null) }
    }

    const bg = isDarkMode ? 'bg-[#111111]' : 'bg-[#FAFAFA]'
    const cardBg = isDarkMode ? 'bg-[#1A1A1A]' : 'bg-white'
    const cardBorder = isDarkMode ? 'border-[#2A2A2A]' : 'border-[#E5E7EB]'
    const textPrimary = isDarkMode ? 'text-[#F5F5F5]' : 'text-[#171717]'
    const textSecondary = isDarkMode ? 'text-[#A0A0A0]' : 'text-[#6B7280]'
    const textTertiary = isDarkMode ? 'text-[#666666]' : 'text-[#9CA3AF]'
    const hoverBg = isDarkMode ? 'hover:bg-[#222222]' : 'hover:bg-[#F5F5F5]'
    const inputBg = isDarkMode ? 'bg-[#222222] border-[#333333] text-[#F5F5F5] placeholder-[#666666]' : 'bg-[#FAFAFA] border-[#E5E7EB] text-[#171717] placeholder-[#9CA3AF]'
    const surfaceBg = isDarkMode ? 'bg-[#222222]' : 'bg-[#F9FAFB]'

    if (loading) return (
        <div className={`min-h-screen flex items-center justify-center ${bg}`}>
            <div className="flex flex-col items-center gap-3">
                <div className="w-8 h-8 border-[3px] border-[#EA580C] border-t-transparent rounded-full animate-spin" />
                <p className={`text-sm font-medium ${textSecondary}`}>Loading your cart...</p>
            </div>
        </div>
    )

    return (
        <div className={`min-h-screen flex ${bg} ${textPrimary} font-sans`}>
            <CustomerSidebar activeTab="cart" sidebarCollapsed={sidebarCollapsed} setSidebarCollapsed={setSidebarCollapsed} />

            <main className={`flex-1 flex flex-col min-h-0 h-[100dvh] overflow-y-auto transition-all duration-300 pb-24 md:pb-8 ${sidebarCollapsed ? 'md:pl-[72px]' : 'md:pl-[240px]'}`}>
                <div className="bh-container max-w-5xl py-6 sm:py-8 md:py-10 w-full space-y-6 relative z-10">
                    {/* Back */}
                    <button
                        type="button"
                        onClick={() => navigate("/home")}
                        className={`mb-2 inline-flex items-center gap-2 h-10 px-3 rounded-lg text-sm font-medium transition-colors ${hoverBg} ${textSecondary}`}
                    >
                        <ArrowLeft size={16} /> Back to Dashboard
                    </button>

                    {/* Toast */}
                    {message && (
                        <div className={`fixed top-6 left-1/2 -translate-x-1/2 z-[100] px-5 py-2.5 rounded-xl shadow-lg text-sm font-semibold flex items-center gap-2 animate-scale-in ${
                            messageType === 'success' ? 'bg-[#16A34A] text-white' : 'bg-[#DC2626] text-white'
                        }`}>
                            <span>{message}</span>
                            <button onClick={() => { setMessage(''); setMessageType(''); }} className="ml-1 opacity-70 hover:opacity-100">✕</button>
                        </div>
                    )}

                    {/* Header */}
                    <div className="mb-8 pb-6 border-b" style={{ borderColor: isDarkMode ? '#2A2A2A' : '#E5E7EB' }}>
                        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                            <div>
                                <h1 className={`text-2xl md:text-3xl font-bold tracking-tight ${textPrimary}`}>My Cart</h1>
                                <p className={`text-sm mt-1 ${textSecondary}`}>Review your items and complete checkout.</p>
                            </div>
                            <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl border ${cardBorder} ${surfaceBg}`}>
                                <ShoppingCart size={16} className="text-[#EA580C]" />
                                <span className={`text-sm font-semibold ${textPrimary}`}>{cartItems.length} items</span>
                            </div>
                        </div>
                    </div>

                    {/* Cart Content */}
                    <div className="space-y-6">
                        {cartItems.length === 0 ? (
                            <div className={`${cardBg} rounded-2xl border ${cardBorder} p-16 sm:p-24 text-center flex flex-col items-center justify-center`}>
                                <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-5 ${surfaceBg}`}>
                                    <ShoppingCart size={28} className={textTertiary} />
                                </div>
                                <h2 className={`text-lg font-semibold mb-2 ${textPrimary}`}>Your cart is empty</h2>
                                <p className={`text-sm mb-6 max-w-xs ${textSecondary}`}>Browse our selection of meals and add something delicious to your cart.</p>
                                <button onClick={() => navigate('/home')} className="bg-[#EA580C] hover:bg-[#DC2626] text-white px-6 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 active:scale-[0.98]">
                                    Browse Menu
                                </button>
                            </div>
                        ) : (
                            <>
                                <div className="flex items-center justify-between px-1">
                                    <p className={`text-xs font-semibold uppercase tracking-wider ${textTertiary}`}>{cartItems.length} items in cart</p>
                                    <button onClick={() => setCartItems([])} className="text-xs font-semibold text-[#DC2626] hover:text-[#B91C1C] transition-colors">Clear Cart</button>
                                </div>

                                {Object.values(groupedCart).map((group) => {
                                    const storeSubtotal = calculateStoreSubtotal(group.items);
                                    const deliveryFee = deliveryFeeBase;
                                    const promoDiscount = storeSubtotal > 1000 ? 10 : 0;
                                    const storeTotal = storeSubtotal + deliveryFee - promoDiscount;

                                    return (
                                        <div key={group.storeId} className={`${cardBg} rounded-2xl border ${cardBorder} overflow-hidden`}>
                                            {/* Store Header */}
                                            <div className={`px-5 py-3.5 flex justify-between items-center border-b ${cardBorder} ${surfaceBg}`}>
                                                <div className="flex items-center gap-2.5">
                                                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${surfaceBg}`}>
                                                        <Utensils size={14} className="text-[#EA580C]" />
                                                    </div>
                                                    <div>
                                                        <h2 className={`text-sm font-semibold ${textPrimary}`}>{group.storeName}</h2>
                                                        <span className={`text-[11px] ${textTertiary}`}>{group.items.length} item{group.items.length > 1 ? 's' : ''}</span>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Items */}
                                            <div className="p-4 space-y-3">
                                                {group.items.map((item) => (
                                                    <div key={item.id} className={`flex items-center gap-4 p-3 rounded-xl border ${cardBorder} transition-all duration-200 ${hoverBg}`}>
                                                        <div className="w-16 h-16 rounded-xl overflow-hidden flex-shrink-0 bg-[#F5F5F5]">
                                                            <img
                                                                src={item.image || "https://images.unsplash.com/photo-1546700854-955607ea004e?w=500&q=80"}
                                                                alt={item.name || "Food Item"}
                                                                className="w-full h-full object-cover"
                                                            />
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <div className="flex items-start justify-between gap-2">
                                                                <div className="min-w-0">
                                                                    <h3 className={`text-sm font-semibold truncate ${textPrimary}`}>{item.name}</h3>
                                                                    <div className="flex flex-wrap gap-1.5 mt-1">
                                                                        {item.size && (
                                                                            <span className={`text-[10px] font-medium px-2 py-0.5 rounded-md ${cardBorder} border`}>{item.size}</span>
                                                                        )}
                                                                        {item.budgetMeal && (
                                                                            <span className={`text-[10px] font-medium px-2 py-0.5 rounded-md ${cardBorder} border`}>Budget: {item.budgetMeal.combinationLabel}</span>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                                <p className={`text-sm font-semibold ${textPrimary} whitespace-nowrap`}>
                                                                    ₱{((Number(item.price) || 0) * (Number(item.quantity) || 1)).toFixed(2)}
                                                                </p>
                                                            </div>
                                                            <div className="flex items-center justify-between mt-2">
                                                                <div className={`flex items-center gap-0.5 p-0.5 rounded-lg border ${cardBorder} ${surfaceBg}`}>
                                                                    <button onClick={() => handleUpdateQuantity(item.id, item.quantity - 1)} className={`w-7 h-7 flex items-center justify-center rounded-md transition-colors ${hoverBg} ${textSecondary}`}>
                                                                        <Minus size={12} />
                                                                    </button>
                                                                    <span className={`text-xs font-semibold w-6 text-center ${textPrimary}`}>{item.quantity}</span>
                                                                    <button onClick={() => handleUpdateQuantity(item.id, item.quantity + 1)} className={`w-7 h-7 flex items-center justify-center rounded-md transition-colors ${hoverBg} ${textSecondary}`}>
                                                                        <Plus size={12} />
                                                                    </button>
                                                                </div>
                                                                <button onClick={() => handleRemoveItem(item.id)} className="p-1.5 rounded-lg text-[#9CA3AF] hover:text-[#DC2626] hover:bg-[#FEF2F2] transition-colors" aria-label="Remove item">
                                                                    <Trash2 size={14} />
                                                                </button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>

                                            {/* Summary & Checkout */}
                                            <div className={`px-5 py-4 border-t ${cardBorder} ${surfaceBg}`}>
                                                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                                                    <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
                                                        <div>
                                                            <span className={`block text-[11px] font-medium uppercase tracking-wider ${textTertiary}`}>Subtotal</span>
                                                            <span className={`font-semibold ${textPrimary}`}>₱{storeSubtotal.toFixed(2)}</span>
                                                        </div>
                                                        <div>
                                                            <span className={`block text-[11px] font-medium uppercase tracking-wider ${textTertiary}`}>Delivery</span>
                                                            <span className={`font-semibold ${textPrimary}`}>₱{deliveryFee.toFixed(2)}</span>
                                                        </div>
                                                        {promoDiscount > 0 && (
                                                            <div>
                                                                <span className="block text-[11px] font-medium uppercase tracking-wider text-[#16A34A]">Discount</span>
                                                                <span className="font-semibold text-[#16A34A]">-₱{promoDiscount.toFixed(2)}</span>
                                                            </div>
                                                        )}
                                                        <div>
                                                            <span className={`block text-[11px] font-medium uppercase tracking-wider ${textPrimary}`}>Total</span>
                                                            <span className={`text-lg font-bold ${textPrimary}`}>₱{storeTotal.toFixed(2)}</span>
                                                        </div>
                                                    </div>
                                                    <button
                                                        onClick={() => { setActiveCheckoutStore(activeCheckoutStore === group.storeId ? null : group.storeId); setError(""); }}
                                                        className={`w-full md:w-auto px-6 py-2.5 rounded-xl font-semibold text-sm transition-all duration-200 flex items-center justify-center gap-2 ${
                                                            activeCheckoutStore === group.storeId
                                                                ? `${surfaceBg} ${textPrimary} ${cardBorder} border`
                                                                : 'bg-[#EA580C] hover:bg-[#DC2626] text-white'
                                                        }`}
                                                    >
                                                        {activeCheckoutStore === group.storeId ? 'Cancel' : `Checkout ${group.storeName}`}
                                                        <ChevronDown size={16} className={`transition-transform duration-200 ${activeCheckoutStore === group.storeId ? 'rotate-180' : ''}`} />
                                                    </button>
                                                </div>

                                                {/* Checkout Panel */}
                                                <div className={`transition-all duration-300 overflow-hidden ${activeCheckoutStore === group.storeId ? 'max-h-[400px] opacity-100 mt-4' : 'max-h-0 opacity-0'}`}>
                                                    <div className={`p-4 rounded-xl border ${cardBorder} ${surfaceBg}`}>
                                                        <div className="flex items-center gap-2 mb-3">
                                                            <Truck size={14} className="text-[#EA580C]" />
                                                            <h3 className={`text-sm font-semibold ${textPrimary}`}>Delivery Details</h3>
                                                        </div>
                                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                            <div>
                                                                <label className={`block text-[11px] font-medium uppercase tracking-wider mb-1 ${textTertiary}`}>Department / Building</label>
                                                                <div className="relative">
                                                                    <MapPin size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9CA3AF]" />
                                                                    <input type="text" value={department} onChange={(e) => { setDepartment(e.target.value); setError(""); }} placeholder="e.g. CAS / CAFC"
                                                                        className={`w-full pl-9 pr-3 py-2 rounded-lg text-sm border ${inputBg} focus:ring-2 focus:ring-[#EA580C]/20 focus:border-[#EA580C] outline-none transition-all`} />
                                                                </div>
                                                            </div>
                                                            <div>
                                                                <label className={`block text-[11px] font-medium uppercase tracking-wider mb-1 ${textTertiary}`}>Course & Room</label>
                                                                <div className="relative">
                                                                    <MapPin size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9CA3AF]" />
                                                                    <input type="text" value={course} onChange={(e) => { setCourse(e.target.value); setError(""); }} placeholder="e.g. BSIT 3A"
                                                                        className={`w-full pl-9 pr-3 py-2 rounded-lg text-sm border ${inputBg} focus:ring-2 focus:ring-[#EA580C]/20 focus:border-[#EA580C] outline-none transition-all`} />
                                                                </div>
                                                            </div>
                                                        </div>
                                                        {error && activeCheckoutStore === group.storeId && (
                                                            <p className="mt-3 text-xs font-medium text-[#DC2626]">{error}</p>
                                                        )}
                                                        <div className="flex justify-end gap-2 mt-4 pt-3 border-t" style={{ borderColor: isDarkMode ? '#333' : '#F3F4F6' }}>
                                                            <button onClick={() => setActiveCheckoutStore(null)} className={`px-4 py-2 rounded-lg text-sm font-medium ${hoverBg} ${textSecondary} transition-colors`}>
                                                                Cancel
                                                            </button>
                                                            <button onClick={() => handleCheckout(group.storeId)} disabled={isProcessing === group.storeId}
                                                                className={`px-5 py-2 rounded-lg bg-[#16A34A] text-white text-sm font-semibold transition-all duration-200 flex items-center gap-2 ${isProcessing === group.storeId ? 'opacity-60 cursor-not-allowed' : 'hover:bg-[#15803D]'}`}>
                                                                {isProcessing === group.storeId ? (
                                                                    <><div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />Processing</>
                                                                ) : 'Confirm Order'}
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )
                                })}
                            </>
                        )}
                    </div>

                    {/* Recommendations */}
                    {recommendations.length > 0 && (
                        <div className="pt-6 border-t" style={{ borderColor: isDarkMode ? '#2A2A2A' : '#E5E7EB' }}>
                            <div className="flex items-center justify-between mb-4 px-1">
                                <h2 className={`text-sm font-semibold flex items-center gap-2 ${textSecondary}`}>
                                    <TrendingUp size={14} className="text-[#EA580C]" /> Suggested for you
                                </h2>
                            </div>
                            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                                {recommendations.map(food => (
                                    <div key={food.id} className={`${cardBg} rounded-xl border ${cardBorder} p-3 transition-all duration-200 group`}>
                                        <div className="relative aspect-video rounded-lg overflow-hidden mb-2 bg-[#F5F5F5]">
                                            <img src={food.image || "https://images.unsplash.com/photo-1546700854-955607ea004e?w=500&q=80"}
                                                alt={food.name || "Food Item"}
                                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                        </div>
                                        <div className="px-0.5">
                                            <div className="flex justify-between items-start mb-0.5">
                                                <h3 className={`font-semibold text-xs truncate ${textPrimary}`}>{food.name || "Item"}</h3>
                                                <span className={`text-[11px] font-semibold ${textSecondary}`}>₱{food.price}</span>
                                            </div>
                                            <p className={`text-[10px] mb-2 ${textTertiary}`}>{food.restaurant}</p>
                                        </div>
                                        <button onClick={() => handleAddToCart(food)} disabled={isProcessing === food.id}
                                            className={`w-full py-2 rounded-lg text-xs font-semibold transition-all duration-200 flex items-center justify-center gap-1.5 border ${cardBorder} ${
                                                isProcessing === food.id ? 'opacity-60 cursor-not-allowed' : 'hover:bg-[#EA580C] hover:text-white hover:border-[#EA580C]'
                                            } ${textSecondary}`}>
                                            {isProcessing === food.id ? (
                                                <div className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
                                            ) : (
                                                <><Plus size={12} /> Add</>
                                            )}
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </main>
        </div>
    )
}

export default Cart
