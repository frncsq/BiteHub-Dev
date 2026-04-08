import CustomerSidebar from "../components/CustomerSidebar"
import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { Package, MapPin, Clock, Phone, ArrowLeft, TrendingUp, Utensils, Info, X, Receipt, ShoppingBag, Star, Bell, Search, User, ChevronDown, ChevronUp, LayoutGrid, List, MessageSquare, Check } from "lucide-react"
import { useTheme } from "../context/ThemeContext"
import { createApiClient } from "../services/apiClient"

function Orders() {
    const [orders, setOrders] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState("")
    const [statusFilter, setStatusFilter] = useState("all")
    const [selectedOrder, setSelectedOrder] = useState(null)
    const [expandedOrderId, setExpandedOrderId] = useState(null)
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
    const [viewFormat, setViewFormat] = useState('grid')
    // Review modal state
    const [showReviewModal, setShowReviewModal] = useState(false)
    const [reviewOrder, setReviewOrder] = useState(null)
    const [reviewItemIndex, setReviewItemIndex] = useState(0)
    const [reviewRating, setReviewRating] = useState(0)
    const [reviewHoverRating, setReviewHoverRating] = useState(0)
    const [reviewComment, setReviewComment] = useState("")
    const [reviewSubmitting, setReviewSubmitting] = useState(false)
    const [reviewSuccess, setReviewSuccess] = useState("")
    const [reviewError, setReviewError] = useState("")
    const [reviewedItems, setReviewedItems] = useState({}) // { orderId: { menu_item_id: review } }
    const navigate = useNavigate()
    const { isDarkMode, colors } = useTheme()

    useEffect(() => {
        const token = localStorage.getItem('authToken');
        if (!token) {
            navigate('/login');
            return;
        }
        fetchOrders()
        const interval = setInterval(() => {
            fetchOrders(false)
        }, 30000)
        return () => clearInterval(interval)
    }, [])

    const fetchOrders = async (showLoading = true) => {
        try {
            if (showLoading) setLoading(true)
            setError("")
            const apiClient = createApiClient();
            const response = await apiClient.get('/orders')

            let rawData = [];
            if (response.data?.success && response.data.orders) {
                rawData = response.data.orders;
            } else if (Array.isArray(response.data)) {
                rawData = response.data;
            }

            if (rawData.length > 0) {
                const mappedOrders = rawData.map(o => ({
                    id: o.id.toString().startsWith('ORD-') ? o.id : `ORD-${o.id}`,
                    rawId: o.id, // Keep the raw numeric ID for API calls
                    date: o.created_at || new Date().toISOString(),
                    items: Array.isArray(o.items) ? o.items : [],
                    total: parseFloat(o.total_amount) || 0,
                    status: o.order_status || 'pending',
                    restaurantName: o.restaurant_name || "Unknown Restaurant",
                    restaurantId: o.restaurant_id,
                    deliveryAddress: o.delivery_address,
                    deliveryCity: o.delivery_city,
                    department: o.department,
                    course: o.course,
                    deliveryTime: o.estimated_delivery_time || "30-45 min"
                }));
                setOrders(mappedOrders);
            } else {
                setOrders([]);
            }
        } catch (error) {
            console.error("Error fetching orders:", error)
            setError("Error loading orders. Please try again.")
        } finally {
            setLoading(false)
        }
    }

    const toggleOrderExpansion = (orderId) => {
        setExpandedOrderId(expandedOrderId === orderId ? null : orderId)
    }

    const filteredOrders = statusFilter === 'all'
        ? orders
        : orders.filter(o => o.status?.toLowerCase() === statusFilter.toLowerCase())

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A'
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        })
    }

    const getStatusColor = (status) => {
        switch (status?.toLowerCase()) {
            case 'delivered':
                return '#22c55e'
            case 'preparing':
                return '#f59e0b'
            case 'out for delivery':
                return '#3b82f6'
            case 'cancelled':
                return '#ef4444'
            default:
                return '#8b0000'
        }
    }

    // ── Review Functions ──
    const openReviewModal = async (order) => {
        setReviewOrder(order)
        setReviewItemIndex(0)
        setReviewRating(0)
        setReviewHoverRating(0)
        setReviewComment("")
        setReviewSuccess("")
        setReviewError("")
        setShowReviewModal(true)

        // Fetch already-reviewed items for this order
        try {
            const apiClient = createApiClient();
            const numericId = typeof order.rawId === 'number' ? order.rawId : parseInt(String(order.id).replace('ORD-', ''), 10);
            const res = await apiClient.get(`/reviews/order/${numericId}`)
            if (res.data?.success) {
                setReviewedItems(prev => ({ ...prev, [order.id]: res.data.reviewed }))
            }
        } catch (err) {
            console.warn("Could not fetch existing reviews:", err.message)
        }
    }

    const closeReviewModal = () => {
        setShowReviewModal(false)
        setReviewOrder(null)
        setReviewRating(0)
        setReviewComment("")
        setReviewSuccess("")
        setReviewError("")
    }

    const submitReview = async () => {
        if (!reviewOrder || !reviewOrder.items || reviewOrder.items.length === 0) return
        const item = reviewOrder.items[reviewItemIndex]
        if (!item) return

        if (reviewRating < 1) {
            setReviewError("Please select a star rating (1–5)")
            return
        }

        setReviewSubmitting(true)
        setReviewError("")
        setReviewSuccess("")

        try {
            const apiClient = createApiClient();
            const numericOrderId = typeof reviewOrder.rawId === 'number' ? reviewOrder.rawId : parseInt(String(reviewOrder.id).replace('ORD-', ''), 10);
            const payload = {
                order_id: numericOrderId,
                menu_item_id: item.menu_item_id,
                restaurant_id: reviewOrder.restaurantId || null,
                rating: reviewRating,
                comment: reviewComment.trim() || null
            }

            const res = await apiClient.post('/reviews', payload)
            if (res.data?.success) {
                setReviewSuccess(`Review submitted for "${item.name}"! 🎉`)
                // Mark this item as reviewed
                setReviewedItems(prev => ({
                    ...prev,
                    [reviewOrder.id]: {
                        ...(prev[reviewOrder.id] || {}),
                        [item.menu_item_id]: { rating: reviewRating, comment: reviewComment }
                    }
                }))

                // Auto-advance to next un-reviewed item after a short delay
                setTimeout(() => {
                    const reviewed = {
                        ...(reviewedItems[reviewOrder.id] || {}),
                        [item.menu_item_id]: true
                    }
                    const nextIdx = reviewOrder.items.findIndex((it, idx) =>
                        idx > reviewItemIndex && !reviewed[it.menu_item_id]
                    )
                    if (nextIdx !== -1) {
                        setReviewItemIndex(nextIdx)
                        setReviewRating(0)
                        setReviewHoverRating(0)
                        setReviewComment("")
                        setReviewSuccess("")
                    } else {
                        // All items reviewed
                        setReviewSuccess("All items reviewed! Thank you for your feedback! 🎉")
                    }
                }, 1500)
            } else {
                setReviewError(res.data?.message || "Failed to submit review")
            }
        } catch (err) {
            const msg = err.response?.data?.message || err.message || "Failed to submit review"
            setReviewError(msg)
        } finally {
            setReviewSubmitting(false)
        }
    }

    const isItemReviewed = (orderId, menuItemId) => {
        return !!reviewedItems[orderId]?.[menuItemId]
    }

    const allItemsReviewed = (order) => {
        if (!order.items || order.items.length === 0) return false
        return order.items.every(item => isItemReviewed(order.id, item.menu_item_id))
    }

    if (loading) {
        return (
            <main className="min-h-screen" style={{ backgroundColor: colors.background }}>
                <div className="text-center py-12">
                    <div className="inline-block">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2" style={{ borderColor: colors.accent }}></div>
                    </div>
                    <p style={{ color: colors.textSecondary }} className="mt-4">Loading orders...</p>
                </div>
            </main>
        )
    }

    return (
        <div className="min-h-screen flex" style={{ backgroundColor: colors.background }}>
            <CustomerSidebar sidebarCollapsed={sidebarCollapsed} setSidebarCollapsed={setSidebarCollapsed} />
            
            <main className={`flex-1 min-h-screen relative overflow-hidden transition-all duration-300 ${sidebarCollapsed ? 'md:pl-20' : 'md:pl-64'}`}>
                {/* Ambient Highlight */}
                <div className="fixed top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
                    <div className={`absolute -top-[20%] -left-[10%] w-[50%] h-[50%] rounded-full blur-[150px] ${isDarkMode ? 'bg-orange-500/5' : 'bg-orange-400/10'}`} />
                </div>

            <div className="max-w-7xl mx-auto px-4 md:px-8 py-8 md:py-12 relative z-10">
                {/* Back Button */}
                <button
                    onClick={() => navigate("/home")}
                    className="mb-8 inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-colors hover:bg-black/5 dark:hover:bg-white/5"
                    style={{ color: colors.textSecondary }}
                >
                    <ArrowLeft size={16} /> Back to Dashboard
                </button>

                {/* Minimalist Header */}
                <div className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b" style={{ borderColor: isDarkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)' }}>
                    <div>
                        <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-2" style={{ color: colors.text }}>Order History</h1>
                        <p className="text-sm font-medium" style={{ color: colors.textSecondary }}>View and track your recent orders.</p>
                    </div>
                    <div className="flex gap-8 items-center bg-white/50 dark:bg-black/20 p-5 rounded-2xl border backdrop-blur-sm" style={{ borderColor: isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }}>
                        <div className="flex flex-col">
                            <span className="text-xs font-medium text-gray-500 mb-1 uppercase tracking-wide">Total Orders</span>
                            <span className="text-3xl font-bold text-orange-500 leading-none">{orders.length}</span>
                        </div>
                        <div className="w-px h-12 bg-gray-200 dark:bg-gray-800" />
                        <div className="flex flex-col">
                            <span className="text-xs font-medium text-gray-500 mb-1 uppercase tracking-wide">This Month</span>
                            <span className="text-3xl font-bold leading-none" style={{ color: colors.text }}>
                                {orders.filter(o => new Date(o.date).getMonth() === new Date().getMonth()).length}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Minimalist Filter Bar & Format Toggle */}
                <div className="mb-8 flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
                    <div className="flex gap-3 flex-wrap">
                        {['all', 'preparing', 'out for delivery', 'delivered', 'cancelled'].map((status) => (
                            <button
                                key={status}
                                onClick={() => setStatusFilter(status)}
                                className={`px-5 py-2 rounded-full text-sm font-medium capitalize transition-all duration-200 ${statusFilter === status
                                        ? 'bg-orange-500 text-white shadow-md shadow-orange-500/20'
                                        : 'bg-transparent border hover:bg-black/5 dark:hover:bg-white/5'
                                    }`}
                                style={statusFilter !== status ? {
                                    color: colors.textSecondary,
                                    borderColor: isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'
                                } : {}}
                            >
                                {status}
                            </button>
                        ))}
                    </div>
                    <div className="flex items-center gap-1.5 p-1 rounded-xl border bg-white/50 dark:bg-black/20 backdrop-blur-sm self-end sm:self-auto" style={{ borderColor: isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }}>
                        <button 
                            onClick={() => setViewFormat('grid')} 
                            className={`p-2 rounded-lg transition-all duration-200 ${viewFormat === 'grid' ? 'bg-orange-500 text-white shadow-sm' : 'text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'}`}
                            title="Grid View"
                        >
                            <LayoutGrid size={18} />
                        </button>
                        <button 
                            onClick={() => setViewFormat('table')} 
                            className={`p-2 rounded-lg transition-all duration-200 ${viewFormat === 'table' ? 'bg-orange-500 text-white shadow-sm' : 'text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'}`}
                            title="Table View"
                        >
                            <List size={18} />
                        </button>
                    </div>
                </div>

                {/* Error Message */}
                {error && (
                    <div className="mb-6 p-4 rounded-xl border border-red-200 bg-red-50 text-red-700 flex items-center justify-between">
                        <span className="text-sm font-medium">{error}</span>
                        <button onClick={() => setError("")} className="hover:opacity-70">
                            <X size={18} />
                        </button>
                    </div>
                )}

                {/* Empty State */}
                {!loading && filteredOrders.length === 0 && (
                    <div className="text-center py-24 flex flex-col items-center justify-center rounded-3xl border border-dashed" style={{ borderColor: isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)', backgroundColor: isDarkMode ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.5)' }}>
                        <div className="w-20 h-20 bg-orange-500/10 rounded-full flex items-center justify-center mb-6">
                            <ShoppingBag className="text-orange-500" size={32} />
                        </div>
                        <h2 className="text-2xl font-bold mb-3" style={{ color: colors.text }}>
                            No orders found
                        </h2>
                        <p style={{ color: colors.textSecondary }} className="mb-8 max-w-md mx-auto text-sm font-medium leading-relaxed">
                            {statusFilter === 'all'
                                ? "You haven't placed any orders yet. Discover delicious meals and place your first order today!"
                                : `No ${statusFilter} orders at the moment. Check back later or adjust your filters.`}
                        </p>
                        <button
                            onClick={() => navigate('/home')}
                            className="px-8 py-3.5 rounded-full text-sm font-semibold transition-all hover:shadow-lg hover:-translate-y-0.5 inline-flex items-center gap-2 bg-orange-500 text-white hover:bg-orange-600"
                        >
                            <Utensils size={16} /> Start Exploring
                        </button>
                    </div>
                )}

                {/* Orders Grid */}
                {!loading && filteredOrders.length > 0 && (
                    <div>
                        <div className="mb-6">
                            <p style={{ color: colors.textSecondary }} className="text-sm font-medium">
                                Showing {filteredOrders.length} order{filteredOrders.length !== 1 ? 's' : ''}
                            </p>
                        </div>
                        
                        {viewFormat === 'grid' ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                                {filteredOrders.map((order) => (
                                <div
                                    key={order.id}
                                    className="rounded-2xl border transition-all duration-300 hover:shadow-xl hover:-translate-y-1 overflow-hidden"
                                    style={{ 
                                        backgroundColor: isDarkMode ? '#111827' : '#ffffff', 
                                        borderColor: isDarkMode ? '#1f2937' : '#f3f4f6' 
                                    }}
                                >
                                    {/* Card Header */}
                                    <div className="p-5 border-b" style={{ borderColor: isDarkMode ? '#1f2937' : '#f3f4f6' }}>
                                        <div className="flex justify-between items-center mb-4">
                                            <span className="text-xs font-semibold text-gray-500 tracking-wider">ORDER #{order.id}</span>
                                            <span 
                                                className="px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest text-white shadow-sm" 
                                                style={{ backgroundColor: getStatusColor(order.status) }}
                                            >
                                                {order.status || 'unknown'}
                                            </span>
                                        </div>
                                        <h3 className="text-lg font-bold truncate mb-1" style={{ color: colors.text }}>{order.restaurantName}</h3>
                                        <p className="text-xs font-medium flex items-center gap-2" style={{ color: colors.textSecondary }}>
                                            <Clock size={12} className="text-orange-500" />
                                            {formatDate(order.date)}
                                        </p>
                                    </div>
                                    
                                    {/* Content Info */}
                                    <div className="p-5">
                                        <div className="flex justify-between items-center mb-5">
                                            <span className="text-sm font-medium" style={{ color: colors.textSecondary }}>Total Amount</span>
                                            <span className="text-xl font-bold text-orange-500">
                                                ₱{(order.total || 0).toFixed(2)}
                                            </span>
                                        </div>

                                        {/* Expandable Order Details */}
                                        <div className={`overflow-hidden transition-all duration-300 ease-in-out ${expandedOrderId === order.id ? 'max-h-[800px] opacity-100 mb-5' : 'max-h-0 opacity-0'}`}>
                                            <div className="pt-4 border-t border-dashed" style={{ borderColor: isDarkMode ? '#374151' : '#e5e7eb' }}>
                                                <div className="mb-5">
                                                    <p className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-3">Order Details</p>
                                                    <div className="space-y-2.5">
                                                        {order.items?.map((item, idx) => (
                                                            <div key={idx} className="flex justify-between items-start">
                                                                <div className="flex items-start gap-2">
                                                                    <span className="text-xs font-bold text-orange-500 mt-0.5">{item.quantity}x</span>
                                                                    <span className="text-sm font-medium" style={{ color: colors.text }}>{item.name}</span>
                                                                </div>
                                                                <span className="text-sm font-semibold" style={{ color: colors.text }}>
                                                                    ₱{(Number(item.price_at_order || 0) * item.quantity).toFixed(2)}
                                                                </span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>

                                                <div className="p-3.5 rounded-xl flex flex-col gap-3 border" style={{ backgroundColor: isDarkMode ? 'rgba(0,0,0,0.2)' : '#f9fafb', borderColor: isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }}>
                                                    <div className="flex items-start gap-2.5">
                                                        <MapPin size={16} className="text-orange-500 flex-shrink-0 mt-0.5" />
                                                        <div>
                                                            <p className="text-sm font-medium" style={{ color: colors.text }}>
                                                                {order.deliveryAddress || "University Main Campus"}
                                                            </p>
                                                            {(order.department || order.course) && (
                                                                <p className="text-xs font-semibold text-gray-500 mt-0.5">
                                                                    {order.department}{order.course ? ` • ${order.course}` : ''}
                                                                </p>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-2.5">
                                                        <Clock size={16} className="text-orange-500" />
                                                        <p className="text-sm font-medium" style={{ color: colors.text }}>
                                                            Arriving in {order.deliveryTime || "25-30 min"}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Actions */}
                                        <div className="space-y-2.5">
                                            <button
                                                onClick={() => toggleOrderExpansion(order.id)}
                                                className="w-full py-2.5 rounded-xl font-medium text-sm flex items-center justify-center gap-2 transition-colors border"
                                                style={{ 
                                                    color: colors.text,
                                                    borderColor: expandedOrderId === order.id ? '#f97316' : (isDarkMode ? '#374151' : '#e5e7eb'),
                                                    backgroundColor: expandedOrderId === order.id ? 'rgba(249, 115, 22, 0.05)' : 'transparent'
                                                }}
                                            >
                                                {expandedOrderId === order.id ? (
                                                    <><ChevronUp size={16} className="text-orange-500" /> Hide Details</>
                                                ) : (
                                                    <><ChevronDown size={16} /> View Details</>
                                                )}
                                            </button>

                                            {['delivered', 'completed'].includes(order.status?.toLowerCase()) ? (
                                                <div className="grid grid-cols-2 gap-2 mt-2">
                                                    <button
                                                        onClick={() => navigate('/home')}
                                                        className="w-full py-2.5 rounded-xl font-semibold text-xs transition-all text-white bg-orange-500 hover:bg-orange-600 flex items-center justify-center gap-1.5 shadow-sm"
                                                    >
                                                        <ShoppingBag size={14} /> Reorder
                                                    </button>
                                                    <button
                                                        onClick={() => openReviewModal(order)}
                                                        className={`w-full py-2.5 rounded-xl font-semibold text-xs transition-all flex items-center justify-center gap-1.5 ${
                                                            allItemsReviewed(order)
                                                                ? 'border border-green-200 text-green-600 bg-green-50 dark:border-none dark:bg-green-500/10 dark:text-green-400'
                                                                : 'border border-orange-200 text-orange-600 bg-orange-50 hover:bg-orange-100 dark:border-none dark:bg-orange-500/10 dark:text-orange-400 dark:hover:bg-orange-500/20'
                                                        }`}
                                                    >
                                                        {allItemsReviewed(order) ? (
                                                            <><Check size={14} /> Reviewed</>
                                                        ) : (
                                                            <><Star size={14} /> Review</>
                                                        )}
                                                    </button>
                                                </div>
                                            ) : (
                                                <div className="w-full py-2.5 rounded-xl text-center font-semibold text-xs flex items-center justify-center gap-1.5 text-orange-600 bg-orange-50 dark:bg-orange-500/10 dark:text-orange-400 mt-2">
                                                    <Clock size={16} /> {order.status === 'cancelled' ? 'Order Cancelled' : 'Order in Progress'}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                        ) : (
                            <div className="overflow-x-auto rounded-2xl border shadow-sm" style={{ backgroundColor: isDarkMode ? '#111827' : '#ffffff', borderColor: isDarkMode ? '#1f2937' : '#f3f4f6' }}>
                                <table className="w-full text-left border-collapse min-w-[800px]">
                                    <thead>
                                        <tr className="border-b text-xs font-semibold uppercase tracking-wider text-gray-500" style={{ borderColor: isDarkMode ? '#1f2937' : '#e5e7eb', backgroundColor: isDarkMode ? 'rgba(255,255,255,0.02)' : '#f9fafb' }}>
                                            <th className="p-5 font-bold">Order ID</th>
                                            <th className="p-5 font-bold">Restaurant</th>
                                            <th className="p-5 font-bold">Date & Time</th>
                                            <th className="p-5 font-bold">Total</th>
                                            <th className="p-5 font-bold">Status</th>
                                            <th className="p-5 font-bold text-center">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody className="text-sm">
                                        {filteredOrders.map(order => (
                                            <tr key={order.id} className="border-b last:border-none transition-colors hover:bg-black/5 dark:hover:bg-white/5" style={{ borderColor: isDarkMode ? '#1f2937' : '#f3f4f6', color: colors.text }}>
                                                <td className="p-5 font-medium text-gray-500">{order.id}</td>
                                                <td className="p-5 font-bold">{order.restaurantName}</td>
                                                <td className="p-5 font-medium flex items-center gap-2" style={{ color: colors.textSecondary }}>
                                                    <Clock size={14} className="text-orange-500" />
                                                    {formatDate(order.date)}
                                                </td>
                                                <td className="p-5 font-bold text-orange-500">₱{(order.total || 0).toFixed(2)}</td>
                                                <td className="p-5">
                                                    <span className="px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest text-white shadow-sm inline-block" style={{ backgroundColor: getStatusColor(order.status) }}>
                                                        {order.status || 'unknown'}
                                                    </span>
                                                </td>
                                                <td className="p-5 text-center">
                                                    <div className="flex items-center justify-center gap-2">
                                                        <button onClick={() => setSelectedOrder(order)} className="px-4 py-2 rounded-xl text-xs font-bold bg-orange-50 text-orange-600 hover:bg-orange-100 dark:bg-orange-500/10 dark:text-orange-400 dark:hover:bg-orange-500/20 transition-colors shadow-sm whitespace-nowrap">
                                                            View Details
                                                        </button>
                                                        {['delivered', 'completed'].includes(order.status?.toLowerCase()) && (
                                                            <button
                                                                onClick={() => openReviewModal(order)}
                                                                className="px-4 py-2 rounded-xl text-xs font-bold bg-yellow-50 text-yellow-700 hover:bg-yellow-100 dark:bg-yellow-500/10 dark:text-yellow-400 dark:hover:bg-yellow-500/20 transition-colors shadow-sm whitespace-nowrap flex items-center gap-1"
                                                            >
                                                                <Star size={12} /> Review
                                                            </button>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Modal Order Details */}
            {selectedOrder && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
                    <div
                        className="w-full max-w-xl rounded-[2rem] shadow-2xl overflow-hidden animate-slide-up border max-h-[90vh] flex flex-col"
                        style={{ backgroundColor: isDarkMode ? '#111827' : '#ffffff', borderColor: isDarkMode ? '#1f2937' : '#e5e7eb' }}
                    >
                        {/* Modal Header */}
                        <div className="px-8 py-6 border-b flex justify-between items-center" style={{ borderColor: isDarkMode ? '#1f2937' : '#f3f4f6' }}>
                            <div>
                                <h2 className="text-2xl font-bold mb-1" style={{ color: colors.text }}>Order Details</h2>
                                <p className="text-sm font-medium tracking-wide text-gray-500">ORDER #{selectedOrder.id}</p>
                            </div>
                            <button
                                onClick={() => setSelectedOrder(null)}
                                className="p-2.5 rounded-full bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 transition-colors"
                                style={{ color: colors.text }}
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Modal Body */}
                        <div className="px-8 py-6 overflow-y-auto space-y-8 flex-1">
                            {/* Restaurant & Status */}
                            <div className="flex justify-between items-start gap-4">
                                <div>
                                    <h3 className="text-2xl font-bold mb-2" style={{ color: colors.text }}>{selectedOrder.restaurantName}</h3>
                                    <p className="text-sm font-medium flex items-center gap-2" style={{ color: colors.textSecondary }}>
                                        <Clock size={16} className="text-orange-500" /> {formatDate(selectedOrder.date)}
                                    </p>
                                </div>
                                <span className="px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider text-white shadow-sm" style={{ backgroundColor: getStatusColor(selectedOrder.status) }}>
                                    {selectedOrder.status}
                                </span>
                            </div>

                            {/* Order Items */}
                            <div>
                                <h4 className="text-sm font-bold uppercase tracking-widest text-gray-500 mb-5">
                                    Order Summary
                                </h4>
                                <div className="space-y-4">
                                    {selectedOrder.items && selectedOrder.items.length > 0 ? (
                                        selectedOrder.items.map((item, idx) => (
                                            <div key={idx} className="flex justify-between items-center">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-10 h-10 rounded-xl bg-orange-50 dark:bg-orange-500/10 flex items-center justify-center text-orange-600 font-bold shadow-sm">
                                                        {item.quantity}
                                                    </div>
                                                    <div>
                                                        <p className="font-semibold text-md" style={{ color: colors.text }}>{item.name}</p>
                                                        <p className="text-sm font-medium mt-0.5" style={{ color: colors.textSecondary }}>₱{Number(item.price_at_order || 0).toFixed(2)} each</p>
                                                    </div>
                                                </div>
                                                <p className="font-bold text-lg" style={{ color: colors.text }}>
                                                    ₱{(Number(item.price_at_order || 0) * item.quantity).toFixed(2)}
                                                </p>
                                            </div>
                                        ))
                                    ) : (
                                        <p className="text-center py-4 text-gray-400 italic font-medium">No items available</p>
                                    )}
                                </div>
                            </div>

                            {/* Delivery Info */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-6 border-t" style={{ borderColor: isDarkMode ? '#1f2937' : '#f3f4f6' }}>
                                <div className="space-y-2">
                                    <p className="text-xs font-bold uppercase tracking-widest text-gray-500">Delivery Address</p>
                                    <p className="text-sm font-medium flex items-start gap-2 leading-relaxed" style={{ color: colors.text }}>
                                        <MapPin size={18} className="text-orange-500 flex-shrink-0 mt-0.5" />
                                        {selectedOrder.deliveryAddress}, {selectedOrder.deliveryCity}
                                    </p>
                                </div>
                                <div className="space-y-2">
                                    <p className="text-xs font-bold uppercase tracking-widest text-gray-500">Est. Delivery Time</p>
                                    <p className="text-sm font-medium flex items-center gap-2" style={{ color: colors.text }}>
                                        <TrendingUp size={18} className="text-orange-500" />
                                        {selectedOrder.estimatedDeliveryTime ? `${selectedOrder.estimatedDeliveryTime} mins` : '30-45 mins'}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Modal Footer */}
                        <div className="px-8 py-6 border-t bg-gray-50 dark:bg-black/20 flex justify-between items-center" style={{ borderColor: isDarkMode ? '#1f2937' : '#e5e7eb' }}>
                            <span className="text-lg font-bold" style={{ color: colors.textSecondary }}>Total Paid</span>
                            <span className="text-3xl font-black text-orange-500">
                                ₱{selectedOrder.total.toFixed(2)}
                            </span>
                        </div>
                    </div>
                </div>
            )}

            {/* ═══ Review Modal ═══ */}
            {showReviewModal && reviewOrder && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
                    <div
                        className="w-full max-w-lg rounded-[2rem] shadow-2xl overflow-hidden animate-slide-up border max-h-[90vh] flex flex-col"
                        style={{ backgroundColor: isDarkMode ? '#111827' : '#ffffff', borderColor: isDarkMode ? '#1f2937' : '#e5e7eb' }}
                    >
                        {/* Review Header */}
                        <div className="px-8 py-6 border-b flex justify-between items-center" style={{ borderColor: isDarkMode ? '#1f2937' : '#f3f4f6' }}>
                            <div>
                                <h2 className="text-xl font-bold mb-1" style={{ color: colors.text }}>Rate Your Order</h2>
                                <p className="text-xs font-medium text-gray-500">ORDER #{reviewOrder.id} • {reviewOrder.restaurantName}</p>
                            </div>
                            <button
                                onClick={closeReviewModal}
                                className="p-2.5 rounded-full bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 transition-colors"
                                style={{ color: colors.text }}
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Review Body */}
                        <div className="px-8 py-6 overflow-y-auto flex-1">
                            {/* Item Tabs */}
                            {reviewOrder.items && reviewOrder.items.length > 0 && (
                                <div className="mb-6">
                                    <p className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-3">Select Item to Review</p>
                                    <div className="flex flex-wrap gap-2">
                                        {reviewOrder.items.map((item, idx) => {
                                            const reviewed = isItemReviewed(reviewOrder.id, item.menu_item_id)
                                            return (
                                                <button
                                                    key={idx}
                                                    onClick={() => {
                                                        if (!reviewed) {
                                                            setReviewItemIndex(idx)
                                                            setReviewRating(0)
                                                            setReviewHoverRating(0)
                                                            setReviewComment("")
                                                            setReviewSuccess("")
                                                            setReviewError("")
                                                        }
                                                    }}
                                                    className={`px-3 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 ${
                                                        reviewed
                                                            ? 'bg-green-50 text-green-600 border border-green-200 dark:bg-green-500/10 dark:text-green-400 dark:border-green-500/20'
                                                            : reviewItemIndex === idx
                                                                ? 'bg-orange-500 text-white shadow-md'
                                                                : 'border text-gray-600 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-800'
                                                    }`}
                                                    style={(!reviewed && reviewItemIndex !== idx) ? { borderColor: isDarkMode ? '#374151' : '#e5e7eb' } : {}}
                                                >
                                                    {reviewed ? <Check size={12} /> : <Star size={12} />}
                                                    <span className="truncate max-w-[120px]">{item.name}</span>
                                                </button>
                                            )
                                        })}
                                    </div>
                                </div>
                            )}

                            {/* Current Item Review Form */}
                            {reviewOrder.items && reviewOrder.items[reviewItemIndex] && (
                                <div>
                                    {isItemReviewed(reviewOrder.id, reviewOrder.items[reviewItemIndex].menu_item_id) ? (
                                        <div className="text-center py-8">
                                            <div className="w-16 h-16 bg-green-100 dark:bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                                                <Check className="text-green-600 dark:text-green-400" size={28} />
                                            </div>
                                            <p className="font-bold text-lg mb-1" style={{ color: colors.text }}>Already Reviewed!</p>
                                            <p className="text-sm" style={{ color: colors.textSecondary }}>
                                                You've already submitted a review for "{reviewOrder.items[reviewItemIndex].name}"
                                            </p>
                                        </div>
                                    ) : (
                                        <>
                                            {/* Item Info */}
                                            <div className="flex items-center gap-4 p-4 rounded-2xl border mb-6" style={{ backgroundColor: isDarkMode ? 'rgba(0,0,0,0.2)' : '#f9fafb', borderColor: isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }}>
                                                <div className="w-12 h-12 rounded-xl bg-orange-50 dark:bg-orange-500/10 flex items-center justify-center text-orange-600 font-bold shadow-sm">
                                                    {reviewOrder.items[reviewItemIndex].quantity}x
                                                </div>
                                                <div>
                                                    <p className="font-bold" style={{ color: colors.text }}>{reviewOrder.items[reviewItemIndex].name}</p>
                                                    <p className="text-xs font-medium" style={{ color: colors.textSecondary }}>
                                                        ₱{Number(reviewOrder.items[reviewItemIndex].price_at_order || 0).toFixed(2)} each
                                                    </p>
                                                </div>
                                            </div>

                                            {/* Star Rating */}
                                            <div className="mb-6">
                                                <p className="text-sm font-bold mb-3" style={{ color: colors.text }}>Your Rating</p>
                                                <div className="flex items-center gap-1.5">
                                                    {[1, 2, 3, 4, 5].map(star => (
                                                        <button
                                                            key={star}
                                                            onClick={() => setReviewRating(star)}
                                                            onMouseEnter={() => setReviewHoverRating(star)}
                                                            onMouseLeave={() => setReviewHoverRating(0)}
                                                            className="p-1 transition-transform hover:scale-110"
                                                        >
                                                            <Star
                                                                size={32}
                                                                className={`transition-colors ${
                                                                    star <= (reviewHoverRating || reviewRating)
                                                                        ? 'text-yellow-400 fill-yellow-400 drop-shadow-sm'
                                                                        : isDarkMode ? 'text-gray-600' : 'text-gray-300'
                                                                }`}
                                                            />
                                                        </button>
                                                    ))}
                                                    <span className="ml-3 text-sm font-bold" style={{ color: colors.textSecondary }}>
                                                        {reviewRating > 0 ? ['', 'Poor', 'Fair', 'Good', 'Very Good', 'Excellent'][reviewRating] : 'Select'}
                                                    </span>
                                                </div>
                                            </div>

                                            {/* Comment */}
                                            <div className="mb-6">
                                                <p className="text-sm font-bold mb-2" style={{ color: colors.text }}>Your Review <span className="text-gray-400 font-normal">(optional)</span></p>
                                                <textarea
                                                    value={reviewComment}
                                                    onChange={(e) => setReviewComment(e.target.value)}
                                                    placeholder="Share your experience with this dish..."
                                                    rows={3}
                                                    className={`w-full px-4 py-3 border rounded-xl text-sm resize-none focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all ${
                                                        isDarkMode
                                                            ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-500'
                                                            : 'bg-white border-gray-200 text-gray-900 placeholder-gray-400'
                                                    }`}
                                                    maxLength={500}
                                                />
                                                <p className="text-xs text-gray-400 mt-1 text-right">{reviewComment.length}/500</p>
                                            </div>

                                            {/* Submit Button */}
                                            <button
                                                onClick={submitReview}
                                                disabled={reviewSubmitting || reviewRating < 1}
                                                className={`w-full py-3.5 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 ${
                                                    reviewSubmitting || reviewRating < 1
                                                        ? 'bg-gray-200 text-gray-400 cursor-not-allowed dark:bg-gray-800 dark:text-gray-600'
                                                        : 'bg-orange-500 text-white hover:bg-orange-600 shadow-md shadow-orange-500/20 hover:shadow-lg hover:-translate-y-0.5'
                                                }`}
                                            >
                                                {reviewSubmitting ? (
                                                    <>
                                                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                                        Submitting...
                                                    </>
                                                ) : (
                                                    <>
                                                        <MessageSquare size={16} />
                                                        Submit Review
                                                    </>
                                                )}
                                            </button>
                                        </>
                                    )}

                                    {/* Success Message */}
                                    {reviewSuccess && (
                                        <div className="mt-4 p-3 rounded-xl bg-green-50 border border-green-200 text-green-700 text-sm font-medium flex items-center gap-2 dark:bg-green-500/10 dark:border-green-500/20 dark:text-green-400 animate-fade-in">
                                            <Check size={16} /> {reviewSuccess}
                                        </div>
                                    )}

                                    {/* Error Message */}
                                    {reviewError && (
                                        <div className="mt-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm font-medium flex items-center gap-2 dark:bg-red-500/10 dark:border-red-500/20 dark:text-red-400 animate-fade-in">
                                            <X size={16} /> {reviewError}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Review Footer - progress */}
                        <div className="px-8 py-4 border-t bg-gray-50 dark:bg-black/20 flex items-center justify-between" style={{ borderColor: isDarkMode ? '#1f2937' : '#e5e7eb' }}>
                            <span className="text-xs font-medium" style={{ color: colors.textSecondary }}>
                                {reviewOrder.items ? `${Object.keys(reviewedItems[reviewOrder.id] || {}).length} of ${reviewOrder.items.length} items reviewed` : ''}
                            </span>
                            <button
                                onClick={closeReviewModal}
                                className="px-5 py-2 rounded-xl text-xs font-bold text-gray-500 hover:text-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 dark:hover:text-gray-300 transition-colors"
                            >
                                Done
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <style>{`
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                @keyframes slideUp {
                    from { opacity: 0; transform: translateY(20px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .animate-fade-in {
                    animation: fadeIn 0.4s ease-out forwards;
                }
                .animate-slide-up {
                    animation: slideUp 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards;
                }
            `}</style>
            </main>
        </div>
    )
}

export default Orders
