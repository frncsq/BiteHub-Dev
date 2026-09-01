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
    const [reviewedItems, setReviewedItems] = useState({})
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
                    rawId: o.id,
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
                return '#16A34A'
            case 'preparing':
                return '#D97706'
            case 'out for delivery':
                return '#2563EB'
            case 'cancelled':
                return '#DC2626'
            default:
                return '#6B7280'
        }
    }

    const getStatusBg = (status) => {
        switch (status?.toLowerCase()) {
            case 'delivered':
                return 'rgba(22, 163, 74, 0.1)'
            case 'preparing':
                return 'rgba(217, 119, 6, 0.1)'
            case 'out for delivery':
                return 'rgba(37, 99, 235, 0.1)'
            case 'cancelled':
                return 'rgba(220, 38, 38, 0.1)'
            default:
                return 'rgba(107, 114, 128, 0.1)'
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
                setReviewSuccess(`Review submitted for "${item.name}"!`)
                setReviewedItems(prev => ({
                    ...prev,
                    [reviewOrder.id]: {
                        ...(prev[reviewOrder.id] || {}),
                        [item.menu_item_id]: { rating: reviewRating, comment: reviewComment }
                    }
                }))

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
                        setReviewSuccess("All items reviewed! Thank you for your feedback!")
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
            <div className="min-h-screen" style={{ backgroundColor: isDarkMode ? '#111111' : '#FAFAFA' }}>
                <div className="flex items-center justify-center min-h-screen">
                    <div className="flex flex-col items-center gap-4">
                        <div className="w-10 h-10 border-2 border-[#E5E7EB] border-t-[#EA580C] rounded-full animate-spin"></div>
                        <p className="text-sm font-medium" style={{ color: '#6B7280' }}>Loading orders...</p>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen flex" style={{ backgroundColor: isDarkMode ? '#111111' : '#FAFAFA' }}>
            <CustomerSidebar sidebarCollapsed={sidebarCollapsed} setSidebarCollapsed={setSidebarCollapsed} />

            <main className={`flex-1 min-h-screen min-w-0 relative overflow-x-hidden transition-all duration-300 pb-24 md:pb-8 ${sidebarCollapsed ? 'md:pl-[72px]' : 'md:pl-[240px]'}`}>

                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 md:py-12">
                    {/* Back Button */}
                    <button
                        onClick={() => navigate("/home")}
                        className="mb-6 inline-flex items-center gap-2 text-sm font-medium transition-colors rounded-lg px-3 py-1.5 hover:bg-black/5 dark:hover:bg-white/5"
                        style={{ color: '#6B7280' }}
                    >
                        <ArrowLeft size={16} /> Back to Dashboard
                    </button>

                    {/* Header */}
                    <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b" style={{ borderColor: isDarkMode ? '#2A2A2A' : '#E5E7EB' }}>
                        <div>
                            <h1 className="text-2xl md:text-3xl font-bold tracking-tight mb-1" style={{ color: isDarkMode ? '#F5F5F5' : '#171717' }}>Order History</h1>
                            <p className="text-sm" style={{ color: '#6B7280' }}>View and track your recent orders</p>
                        </div>
                        <div className="flex gap-6 items-center p-4 rounded-xl border" style={{ backgroundColor: isDarkMode ? '#1A1A1A' : '#FFFFFF', borderColor: isDarkMode ? '#2A2A2A' : '#E5E7EB' }}>
                            <div className="flex flex-col">
                                <span className="text-[11px] font-semibold text-gray-500 mb-1 uppercase tracking-wider">Total Orders</span>
                                <span className="text-2xl font-bold leading-none" style={{ color: '#EA580C' }}>{orders.length}</span>
                            </div>
                            <div className="w-px h-10" style={{ backgroundColor: isDarkMode ? '#2A2A2A' : '#E5E7EB' }} />
                            <div className="flex flex-col">
                                <span className="text-[11px] font-semibold text-gray-500 mb-1 uppercase tracking-wider">This Month</span>
                                <span className="text-2xl font-bold leading-none" style={{ color: isDarkMode ? '#F5F5F5' : '#171717' }}>
                                    {orders.filter(o => new Date(o.date).getMonth() === new Date().getMonth()).length}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Filter Bar & View Toggle */}
                    <div className="mb-6 flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
                        <div className="flex gap-2 flex-wrap">
                            {['all', 'preparing', 'out for delivery', 'delivered', 'cancelled'].map((status) => (
                                <button
                                    key={status}
                                    onClick={() => setStatusFilter(status)}
                                    className={`px-4 py-2 rounded-lg text-xs font-semibold capitalize transition-all duration-150 ${statusFilter === status
                                        ? 'bg-[#EA580C] text-white'
                                        : 'border hover:bg-black/5 dark:hover:bg-white/5'
                                    }`}
                                    style={statusFilter !== status ? {
                                        color: '#6B7280',
                                        borderColor: isDarkMode ? '#2A2A2A' : '#E5E7EB',
                                        backgroundColor: isDarkMode ? '#1A1A1A' : '#FFFFFF'
                                    } : {}}
                                >
                                    {status}
                                </button>
                            ))}
                        </div>
                        <div className="flex items-center gap-1 p-1 rounded-lg border" style={{ borderColor: isDarkMode ? '#2A2A2A' : '#E5E7EB', backgroundColor: isDarkMode ? '#1A1A1A' : '#FFFFFF' }}>
                            <button
                                onClick={() => setViewFormat('grid')}
                                className={`p-2 rounded-md transition-all duration-150 ${viewFormat === 'grid' ? 'bg-[#EA580C] text-white' : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'}`}
                                title="Grid View"
                            >
                                <LayoutGrid size={16} />
                            </button>
                            <button
                                onClick={() => setViewFormat('table')}
                                className={`p-2 rounded-md transition-all duration-150 ${viewFormat === 'table' ? 'bg-[#EA580C] text-white' : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'}`}
                                title="Table View"
                            >
                                <List size={16} />
                            </button>
                        </div>
                    </div>

                    {/* Error Message */}
                    {error && (
                        <div className="mb-6 p-4 rounded-xl border flex items-center justify-between" style={{ backgroundColor: 'rgba(220, 38, 38, 0.05)', borderColor: 'rgba(220, 38, 38, 0.2)' }}>
                            <span className="text-sm font-medium" style={{ color: '#DC2626' }}>{error}</span>
                            <button onClick={() => setError("")} className="hover:opacity-70" style={{ color: '#DC2626' }}>
                                <X size={18} />
                            </button>
                        </div>
                    )}

                    {/* Empty State */}
                    {!loading && filteredOrders.length === 0 && (
                        <div className="text-center py-20 flex flex-col items-center justify-center rounded-xl border border-dashed" style={{ borderColor: isDarkMode ? '#2A2A2A' : '#E5E7EB', backgroundColor: isDarkMode ? '#1A1A1A' : '#FFFFFF' }}>
                            <div className="w-16 h-16 rounded-xl flex items-center justify-center mb-5" style={{ backgroundColor: 'rgba(234, 88, 12, 0.1)' }}>
                                <ShoppingBag style={{ color: '#EA580C' }} size={28} />
                            </div>
                            <h2 className="text-lg font-bold mb-2" style={{ color: isDarkMode ? '#F5F5F5' : '#171717' }}>
                                No orders found
                            </h2>
                            <p className="mb-6 max-w-sm mx-auto text-sm" style={{ color: '#6B7280' }}>
                                {statusFilter === 'all'
                                    ? "You haven't placed any orders yet. Discover delicious meals and place your first order today!"
                                    : `No ${statusFilter} orders at the moment. Check back later or adjust your filters.`}
                            </p>
                            <button
                                onClick={() => navigate('/home')}
                                className="px-6 py-2.5 rounded-lg text-sm font-semibold transition-colors inline-flex items-center gap-2 bg-[#EA580C] text-white hover:bg-[#D94A0A]"
                            >
                                <Utensils size={15} /> Start Exploring
                            </button>
                        </div>
                    )}

                    {/* Orders Grid / Table */}
                    {!loading && filteredOrders.length > 0 && (
                        <div>
                            <div className="mb-4">
                                <p className="text-xs font-medium" style={{ color: '#6B7280' }}>
                                    Showing {filteredOrders.length} order{filteredOrders.length !== 1 ? 's' : ''}
                                </p>
                            </div>

                            {viewFormat === 'grid' ? (
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                                    {filteredOrders.map((order) => (
                                    <div
                                        key={order.id}
                                        className="rounded-xl border transition-all duration-200 hover:shadow-md overflow-hidden"
                                        style={{
                                            backgroundColor: isDarkMode ? '#1A1A1A' : '#FFFFFF',
                                            borderColor: isDarkMode ? '#2A2A2A' : '#E5E7EB'
                                        }}
                                    >
                                        {/* Card Header */}
                                        <div className="p-4 border-b" style={{ borderColor: isDarkMode ? '#2A2A2A' : '#E5E7EB' }}>
                                            <div className="flex justify-between items-center mb-3">
                                                <span className="text-[11px] font-semibold tracking-wider" style={{ color: '#6B7280' }}>ORDER #{order.id}</span>
                                                <span
                                                    className="px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider"
                                                    style={{ backgroundColor: getStatusBg(order.status), color: getStatusColor(order.status) }}
                                                >
                                                    {order.status || 'unknown'}
                                                </span>
                                            </div>
                                            <h3 className="text-base font-bold truncate mb-1" style={{ color: isDarkMode ? '#F5F5F5' : '#171717' }}>{order.restaurantName}</h3>
                                            <p className="text-xs flex items-center gap-1.5" style={{ color: '#6B7280' }}>
                                                <Clock size={12} style={{ color: '#EA580C' }} />
                                                {formatDate(order.date)}
                                            </p>
                                        </div>

                                        {/* Content */}
                                        <div className="p-4">
                                            <div className="flex justify-between items-center mb-4">
                                                <span className="text-xs font-medium" style={{ color: '#6B7280' }}>Total Amount</span>
                                                <span className="text-lg font-bold" style={{ color: '#EA580C' }}>
                                                    ₱{(order.total || 0).toFixed(2)}
                                                </span>
                                            </div>

                                            {/* Expandable Order Details */}
                                            <div className={`overflow-hidden transition-all duration-200 ease-in-out ${expandedOrderId === order.id ? 'max-h-[800px] opacity-100 mb-4' : 'max-h-0 opacity-0'}`}>
                                                <div className="pt-4 border-t" style={{ borderColor: isDarkMode ? '#2A2A2A' : '#E5E7EB' }}>
                                                    <div className="mb-4">
                                                        <p className="text-[10px] font-bold uppercase tracking-wider mb-2" style={{ color: '#6B7280' }}>Items</p>
                                                        <div className="space-y-2">
                                                            {order.items?.map((item, idx) => (
                                                                <div key={idx} className="flex justify-between items-start">
                                                                    <div className="flex items-start gap-2">
                                                                        <span className="text-xs font-bold" style={{ color: '#EA580C' }}>{item.quantity}x</span>
                                                                        <span className="text-sm" style={{ color: isDarkMode ? '#F5F5F5' : '#171717' }}>{item.name}</span>
                                                                    </div>
                                                                    <span className="text-sm font-semibold" style={{ color: isDarkMode ? '#F5F5F5' : '#171717' }}>
                                                                        ₱{(Number(item.price_at_order || 0) * item.quantity).toFixed(2)}
                                                                    </span>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>

                                                    <div className="p-3 rounded-lg border" style={{ backgroundColor: isDarkMode ? '#111111' : '#FAFAFA', borderColor: isDarkMode ? '#2A2A2A' : '#E5E7EB' }}>
                                                        <div className="flex items-start gap-2 mb-2">
                                                            <MapPin size={14} className="flex-shrink-0 mt-0.5" style={{ color: '#EA580C' }} />
                                                            <div>
                                                                <p className="text-sm font-medium" style={{ color: isDarkMode ? '#F5F5F5' : '#171717' }}>
                                                                    {order.deliveryAddress || "University Main Campus"}
                                                                </p>
                                                                {(order.department || order.course) && (
                                                                    <p className="text-xs mt-0.5" style={{ color: '#6B7280' }}>
                                                                        {order.department}{order.course ? ` • ${order.course}` : ''}
                                                                    </p>
                                                                )}
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <Clock size={14} style={{ color: '#EA580C' }} />
                                                            <p className="text-sm font-medium" style={{ color: isDarkMode ? '#F5F5F5' : '#171717' }}>
                                                                Arriving in {order.deliveryTime || "25-30 min"}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Actions */}
                                            <div className="space-y-2">
                                                <button
                                                    onClick={() => toggleOrderExpansion(order.id)}
                                                    className="w-full py-2 rounded-lg font-medium text-xs flex items-center justify-center gap-1.5 transition-colors border"
                                                    style={{
                                                        color: expandedOrderId === order.id ? '#EA580C' : (isDarkMode ? '#F5F5F5' : '#171717'),
                                                        borderColor: expandedOrderId === order.id ? '#EA580C' : (isDarkMode ? '#2A2A2A' : '#E5E7EB'),
                                                        backgroundColor: expandedOrderId === order.id ? 'rgba(234, 88, 12, 0.05)' : 'transparent'
                                                    }}
                                                >
                                                    {expandedOrderId === order.id ? (
                                                        <><ChevronUp size={14} /> Hide Details</>
                                                    ) : (
                                                        <><ChevronDown size={14} /> View Details</>
                                                    )}
                                                </button>

                                                {['delivered', 'completed'].includes(order.status?.toLowerCase()) ? (
                                                    <div className="grid grid-cols-2 gap-2">
                                                        <button
                                                            onClick={() => navigate('/home')}
                                                            className="w-full py-2 rounded-lg font-semibold text-xs transition-colors text-white bg-[#EA580C] hover:bg-[#D94A0A] flex items-center justify-center gap-1.5"
                                                        >
                                                            <ShoppingBag size={13} /> Reorder
                                                        </button>
                                                        <button
                                                            onClick={() => openReviewModal(order)}
                                                            className={`w-full py-2 rounded-lg font-semibold text-xs transition-colors flex items-center justify-center gap-1.5 ${
                                                                allItemsReviewed(order)
                                                                    ? 'border text-[#16A34A] bg-[rgba(22,163,74,0.1)]'
                                                                    : 'border text-[#EA580C] bg-[rgba(234,88,12,0.1)] hover:bg-[rgba(234,88,12,0.15)]'
                                                            }`}
                                                            style={!allItemsReviewed(order) ? { borderColor: 'rgba(234, 88, 12, 0.2)' } : { borderColor: 'rgba(22, 163, 74, 0.2)' }}
                                                        >
                                                            {allItemsReviewed(order) ? (
                                                                <><Check size={13} /> Reviewed</>
                                                            ) : (
                                                                <><Star size={13} /> Review</>
                                                            )}
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <div className="w-full py-2 rounded-lg text-center font-semibold text-xs flex items-center justify-center gap-1.5" style={{ color: '#D97706', backgroundColor: 'rgba(217, 119, 6, 0.1)' }}>
                                                        <Clock size={14} /> {order.status === 'cancelled' ? 'Order Cancelled' : 'Order in Progress'}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                                </div>
                            ) : (
                                <>
                                {/* Mobile List View */}
                                <div className="md:hidden space-y-3">
                                    {filteredOrders.map((order) => (
                                        <div
                                            key={order.id}
                                            className="rounded-xl border p-4"
                                            style={{
                                                backgroundColor: isDarkMode ? '#1A1A1A' : '#FFFFFF',
                                                borderColor: isDarkMode ? '#2A2A2A' : '#E5E7EB',
                                            }}
                                        >
                                            <div className="flex justify-between items-start gap-2 mb-2">
                                                <span className="text-[11px] font-semibold tracking-wider" style={{ color: '#6B7280' }}>#{order.id}</span>
                                                <span
                                                    className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider shrink-0"
                                                    style={{ backgroundColor: getStatusBg(order.status), color: getStatusColor(order.status) }}
                                                >
                                                    {order.status || 'unknown'}
                                                </span>
                                            </div>
                                            <p className="font-bold text-sm mb-1 break-words" style={{ color: isDarkMode ? '#F5F5F5' : '#171717' }}>{order.restaurantName}</p>
                                            <p className="text-xs flex items-center gap-1.5 mb-3" style={{ color: '#6B7280' }}>
                                                <Clock size={11} style={{ color: '#EA580C' }} className="shrink-0" />
                                                {formatDate(order.date)}
                                            </p>
                                            <div className="flex justify-between items-center pt-3 border-t" style={{ borderColor: isDarkMode ? '#2A2A2A' : '#E5E7EB' }}>
                                                <span className="text-xs font-medium" style={{ color: '#6B7280' }}>Total</span>
                                                <span className="text-base font-bold" style={{ color: '#EA580C' }}>₱{(order.total || 0).toFixed(2)}</span>
                                            </div>
                                            <div className="mt-3 flex flex-col gap-2">
                                                <button
                                                    type="button"
                                                    onClick={() => setSelectedOrder(order)}
                                                    className="w-full py-2 rounded-lg text-xs font-semibold transition-colors"
                                                    style={{ backgroundColor: 'rgba(234, 88, 12, 0.1)', color: '#EA580C' }}
                                                >
                                                    View Details
                                                </button>
                                                {['delivered', 'completed'].includes(order.status?.toLowerCase()) && (
                                                    <button
                                                        type="button"
                                                        onClick={() => openReviewModal(order)}
                                                        className="w-full py-2 rounded-lg text-xs font-semibold transition-colors"
                                                        style={{ backgroundColor: 'rgba(234, 88, 12, 0.1)', color: '#EA580C' }}
                                                    >
                                                        Review
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {/* Desktop Table View */}
                                <div className="hidden md:block overflow-x-auto rounded-xl border" style={{ backgroundColor: isDarkMode ? '#1A1A1A' : '#FFFFFF', borderColor: isDarkMode ? '#2A2A2A' : '#E5E7EB' }}>
                                    <table className="w-full text-left border-collapse min-w-[800px]">
                                        <thead>
                                            <tr className="border-b" style={{ borderColor: isDarkMode ? '#2A2A2A' : '#E5E7EB', backgroundColor: isDarkMode ? '#111111' : '#FAFAFA' }}>
                                                <th className="p-4 text-[11px] font-bold uppercase tracking-wider" style={{ color: '#6B7280' }}>Order ID</th>
                                                <th className="p-4 text-[11px] font-bold uppercase tracking-wider" style={{ color: '#6B7280' }}>Restaurant</th>
                                                <th className="p-4 text-[11px] font-bold uppercase tracking-wider" style={{ color: '#6B7280' }}>Date & Time</th>
                                                <th className="p-4 text-[11px] font-bold uppercase tracking-wider" style={{ color: '#6B7280' }}>Total</th>
                                                <th className="p-4 text-[11px] font-bold uppercase tracking-wider" style={{ color: '#6B7280' }}>Status</th>
                                                <th className="p-4 text-[11px] font-bold uppercase tracking-wider text-center" style={{ color: '#6B7280' }}>Action</th>
                                            </tr>
                                        </thead>
                                        <tbody className="text-sm">
                                            {filteredOrders.map(order => (
                                                <tr key={order.id} className="border-b last:border-none transition-colors hover:bg-black/[0.02] dark:hover:bg-white/[0.02]" style={{ borderColor: isDarkMode ? '#2A2A2A' : '#E5E7EB' }}>
                                                    <td className="p-4 font-medium" style={{ color: '#6B7280' }}>{order.id}</td>
                                                    <td className="p-4 font-bold" style={{ color: isDarkMode ? '#F5F5F5' : '#171717' }}>{order.restaurantName}</td>
                                                    <td className="p-4 font-medium flex items-center gap-2" style={{ color: '#6B7280' }}>
                                                        <Clock size={13} style={{ color: '#EA580C' }} />
                                                        {formatDate(order.date)}
                                                    </td>
                                                    <td className="p-4 font-bold" style={{ color: '#EA580C' }}>₱{(order.total || 0).toFixed(2)}</td>
                                                    <td className="p-4">
                                                        <span className="px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider inline-block" style={{ backgroundColor: getStatusBg(order.status), color: getStatusColor(order.status) }}>
                                                            {order.status || 'unknown'}
                                                        </span>
                                                    </td>
                                                    <td className="p-4 text-center">
                                                        <div className="flex items-center justify-center gap-2">
                                                            <button onClick={() => setSelectedOrder(order)} className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap" style={{ backgroundColor: 'rgba(234, 88, 12, 0.1)', color: '#EA580C' }}>
                                                                View Details
                                                            </button>
                                                            {['delivered', 'completed'].includes(order.status?.toLowerCase()) && (
                                                                <button
                                                                    onClick={() => openReviewModal(order)}
                                                                    className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap flex items-center gap-1"
                                                                    style={{ backgroundColor: 'rgba(234, 88, 12, 0.1)', color: '#EA580C' }}
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
                                </>
                            )}
                        </div>
                    )}
                </div>

                {/* Modal Order Details */}
                {selectedOrder && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 animate-fade-in">
                        <div
                            className="w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden animate-slide-up border max-h-[90vh] flex flex-col"
                            style={{ backgroundColor: isDarkMode ? '#1A1A1A' : '#FFFFFF', borderColor: isDarkMode ? '#2A2A2A' : '#E5E7EB' }}
                        >
                            {/* Modal Header */}
                            <div className="px-6 py-5 border-b flex justify-between items-center" style={{ borderColor: isDarkMode ? '#2A2A2A' : '#E5E7EB' }}>
                                <div>
                                    <h2 className="text-lg font-bold mb-0.5" style={{ color: isDarkMode ? '#F5F5F5' : '#171717' }}>Order Details</h2>
                                    <p className="text-xs font-medium tracking-wide" style={{ color: '#6B7280' }}>ORDER #{selectedOrder.id}</p>
                                </div>
                                <button
                                    onClick={() => setSelectedOrder(null)}
                                    className="p-2 rounded-lg transition-colors"
                                    style={{ color: '#6B7280', backgroundColor: isDarkMode ? '#111111' : '#F5F5F5' }}
                                >
                                    <X size={18} />
                                </button>
                            </div>

                            {/* Modal Body */}
                            <div className="px-6 py-5 overflow-y-auto space-y-6 flex-1">
                                {/* Restaurant & Status */}
                                <div className="flex justify-between items-start gap-4">
                                    <div>
                                        <h3 className="text-lg font-bold mb-1" style={{ color: isDarkMode ? '#F5F5F5' : '#171717' }}>{selectedOrder.restaurantName}</h3>
                                        <p className="text-xs font-medium flex items-center gap-1.5" style={{ color: '#6B7280' }}>
                                            <Clock size={13} style={{ color: '#EA580C' }} /> {formatDate(selectedOrder.date)}
                                        </p>
                                    </div>
                                    <span className="px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider shrink-0" style={{ backgroundColor: getStatusBg(selectedOrder.status), color: getStatusColor(selectedOrder.status) }}>
                                        {selectedOrder.status}
                                    </span>
                                </div>

                                {/* Order Items */}
                                <div>
                                    <h4 className="text-[11px] font-bold uppercase tracking-wider mb-3" style={{ color: '#6B7280' }}>
                                        Order Summary
                                    </h4>
                                    <div className="space-y-3">
                                        {selectedOrder.items && selectedOrder.items.length > 0 ? (
                                            selectedOrder.items.map((item, idx) => (
                                                <div key={idx} className="flex justify-between items-center">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-9 h-9 rounded-lg flex items-center justify-center text-sm font-bold" style={{ backgroundColor: 'rgba(234, 88, 12, 0.1)', color: '#EA580C' }}>
                                                            {item.quantity}
                                                        </div>
                                                        <div>
                                                            <p className="text-sm font-semibold" style={{ color: isDarkMode ? '#F5F5F5' : '#171717' }}>{item.name}</p>
                                                            <p className="text-xs mt-0.5" style={{ color: '#6B7280' }}>₱{Number(item.price_at_order || 0).toFixed(2)} each</p>
                                                        </div>
                                                    </div>
                                                    <p className="text-sm font-bold" style={{ color: isDarkMode ? '#F5F5F5' : '#171717' }}>
                                                        ₱{(Number(item.price_at_order || 0) * item.quantity).toFixed(2)}
                                                    </p>
                                                </div>
                                            ))
                                        ) : (
                                            <p className="text-center py-4 italic text-sm" style={{ color: '#6B7280' }}>No items available</p>
                                        )}
                                    </div>
                                </div>

                                {/* Delivery Info */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t" style={{ borderColor: isDarkMode ? '#2A2A2A' : '#E5E7EB' }}>
                                    <div className="space-y-1">
                                        <p className="text-[11px] font-bold uppercase tracking-wider" style={{ color: '#6B7280' }}>Delivery Address</p>
                                        <p className="text-sm font-medium flex items-start gap-1.5 leading-relaxed" style={{ color: isDarkMode ? '#F5F5F5' : '#171717' }}>
                                            <MapPin size={15} className="flex-shrink-0 mt-0.5" style={{ color: '#EA580C' }} />
                                            {selectedOrder.deliveryAddress}, {selectedOrder.deliveryCity}
                                        </p>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-[11px] font-bold uppercase tracking-wider" style={{ color: '#6B7280' }}>Est. Delivery Time</p>
                                        <p className="text-sm font-medium flex items-center gap-1.5" style={{ color: isDarkMode ? '#F5F5F5' : '#171717' }}>
                                            <TrendingUp size={15} style={{ color: '#EA580C' }} />
                                            {selectedOrder.estimatedDeliveryTime ? `${selectedOrder.estimatedDeliveryTime} mins` : '30-45 mins'}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Modal Footer */}
                            <div className="px-6 py-4 border-t flex justify-between items-center" style={{ borderColor: isDarkMode ? '#2A2A2A' : '#E5E7EB', backgroundColor: isDarkMode ? '#111111' : '#FAFAFA' }}>
                                <span className="text-sm font-semibold" style={{ color: '#6B7280' }}>Total Paid</span>
                                <span className="text-xl font-bold" style={{ color: '#EA580C' }}>
                                    ₱{selectedOrder.total.toFixed(2)}
                                </span>
                            </div>
                        </div>
                    </div>
                )}

                {/* ═══ Review Modal ═══ */}
                {showReviewModal && reviewOrder && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 animate-fade-in">
                        <div
                            className="w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-slide-up border max-h-[90vh] flex flex-col"
                            style={{ backgroundColor: isDarkMode ? '#1A1A1A' : '#FFFFFF', borderColor: isDarkMode ? '#2A2A2A' : '#E5E7EB' }}
                        >
                            {/* Review Header */}
                            <div className="px-6 py-5 border-b flex justify-between items-center" style={{ borderColor: isDarkMode ? '#2A2A2A' : '#E5E7EB' }}>
                                <div>
                                    <h2 className="text-lg font-bold mb-0.5" style={{ color: isDarkMode ? '#F5F5F5' : '#171717' }}>Rate Your Order</h2>
                                    <p className="text-xs font-medium" style={{ color: '#6B7280' }}>ORDER #{reviewOrder.id} • {reviewOrder.restaurantName}</p>
                                </div>
                                <button
                                    onClick={closeReviewModal}
                                    className="p-2 rounded-lg transition-colors"
                                    style={{ color: '#6B7280', backgroundColor: isDarkMode ? '#111111' : '#F5F5F5' }}
                                >
                                    <X size={18} />
                                </button>
                            </div>

                            {/* Review Body */}
                            <div className="px-6 py-5 overflow-y-auto flex-1">
                                {/* Item Tabs */}
                                {reviewOrder.items && reviewOrder.items.length > 0 && (
                                    <div className="mb-5">
                                        <p className="text-[11px] font-bold uppercase tracking-wider mb-2" style={{ color: '#6B7280' }}>Select Item to Review</p>
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
                                                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 border ${
                                                            reviewed
                                                                ? 'text-[#16A34A]'
                                                                : reviewItemIndex === idx
                                                                    ? 'bg-[#EA580C] text-white border-[#EA580C]'
                                                                    : 'text-gray-600 hover:bg-black/5 dark:text-gray-300 dark:hover:bg-white/5'
                                                        }`}
                                                        style={(!reviewed && reviewItemIndex !== idx) ? { borderColor: isDarkMode ? '#2A2A2A' : '#E5E7EB' } : reviewed ? { borderColor: 'rgba(22, 163, 74, 0.2)', backgroundColor: 'rgba(22, 163, 74, 0.05)' } : {}}
                                                    >
                                                        {reviewed ? <Check size={12} /> : <Star size={12} />}
                                                        <span className="truncate max-w-[110px]">{item.name}</span>
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
                                                <div className="w-14 h-14 rounded-xl flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: 'rgba(22, 163, 74, 0.1)' }}>
                                                    <Check size={24} style={{ color: '#16A34A' }} />
                                                </div>
                                                <p className="font-bold text-base mb-1" style={{ color: isDarkMode ? '#F5F5F5' : '#171717' }}>Already Reviewed!</p>
                                                <p className="text-sm" style={{ color: '#6B7280' }}>
                                                    You've already submitted a review for "{reviewOrder.items[reviewItemIndex].name}"
                                                </p>
                                            </div>
                                        ) : (
                                            <>
                                                {/* Item Info */}
                                                <div className="flex items-center gap-3 p-3 rounded-lg border mb-5" style={{ backgroundColor: isDarkMode ? '#111111' : '#FAFAFA', borderColor: isDarkMode ? '#2A2A2A' : '#E5E7EB' }}>
                                                    <div className="w-10 h-10 rounded-lg flex items-center justify-center text-sm font-bold" style={{ backgroundColor: 'rgba(234, 88, 12, 0.1)', color: '#EA580C' }}>
                                                        {reviewOrder.items[reviewItemIndex].quantity}x
                                                    </div>
                                                    <div>
                                                        <p className="font-semibold text-sm" style={{ color: isDarkMode ? '#F5F5F5' : '#171717' }}>{reviewOrder.items[reviewItemIndex].name}</p>
                                                        <p className="text-xs" style={{ color: '#6B7280' }}>
                                                            ₱{Number(reviewOrder.items[reviewItemIndex].price_at_order || 0).toFixed(2)} each
                                                        </p>
                                                    </div>
                                                </div>

                                                {/* Star Rating */}
                                                <div className="mb-5">
                                                    <p className="text-sm font-semibold mb-2" style={{ color: isDarkMode ? '#F5F5F5' : '#171717' }}>Your Rating</p>
                                                    <div className="flex items-center gap-1">
                                                        {[1, 2, 3, 4, 5].map(star => (
                                                            <button
                                                                key={star}
                                                                onClick={() => setReviewRating(star)}
                                                                onMouseEnter={() => setReviewHoverRating(star)}
                                                                onMouseLeave={() => setReviewHoverRating(0)}
                                                                className="p-1 transition-transform hover:scale-110"
                                                            >
                                                                <Star
                                                                    size={28}
                                                                    className={`transition-colors ${
                                                                        star <= (reviewHoverRating || reviewRating)
                                                                            ? 'text-yellow-400 fill-yellow-400'
                                                                            : isDarkMode ? 'text-gray-600' : 'text-gray-300'
                                                                    }`}
                                                                />
                                                            </button>
                                                        ))}
                                                        <span className="ml-2 text-xs font-semibold" style={{ color: '#6B7280' }}>
                                                            {reviewRating > 0 ? ['', 'Poor', 'Fair', 'Good', 'Very Good', 'Excellent'][reviewRating] : 'Select'}
                                                        </span>
                                                    </div>
                                                </div>

                                                {/* Comment */}
                                                <div className="mb-5">
                                                    <p className="text-sm font-semibold mb-2" style={{ color: isDarkMode ? '#F5F5F5' : '#171717' }}>Your Review <span className="font-normal" style={{ color: '#6B7280' }}>(optional)</span></p>
                                                    <textarea
                                                        value={reviewComment}
                                                        onChange={(e) => setReviewComment(e.target.value)}
                                                        placeholder="Share your experience with this dish..."
                                                        rows={3}
                                                        className="w-full px-3 py-2.5 border rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[#EA580C] focus:border-[#EA580C] transition-all"
                                                        style={{
                                                            backgroundColor: isDarkMode ? '#111111' : '#FFFFFF',
                                                            borderColor: isDarkMode ? '#2A2A2A' : '#E5E7EB',
                                                            color: isDarkMode ? '#F5F5F5' : '#171717'
                                                        }}
                                                        maxLength={500}
                                                    />
                                                    <p className="text-xs mt-1 text-right" style={{ color: '#6B7280' }}>{reviewComment.length}/500</p>
                                                </div>

                                                {/* Submit Button */}
                                                <button
                                                    onClick={submitReview}
                                                    disabled={reviewSubmitting || reviewRating < 1}
                                                    className={`w-full py-3 rounded-lg font-semibold text-sm transition-all flex items-center justify-center gap-2 ${
                                                        reviewSubmitting || reviewRating < 1
                                                            ? 'bg-gray-200 text-gray-400 cursor-not-allowed dark:bg-gray-800 dark:text-gray-600'
                                                            : 'bg-[#EA580C] text-white hover:bg-[#D94A0A]'
                                                    }`}
                                                >
                                                    {reviewSubmitting ? (
                                                        <>
                                                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                                            Submitting...
                                                        </>
                                                    ) : (
                                                        <>
                                                            <MessageSquare size={15} />
                                                            Submit Review
                                                        </>
                                                    )}
                                                </button>
                                            </>
                                        )}

                                        {/* Success Message */}
                                        {reviewSuccess && (
                                            <div className="mt-4 p-3 rounded-lg text-sm font-medium flex items-center gap-2 animate-fade-in" style={{ backgroundColor: 'rgba(22, 163, 74, 0.1)', color: '#16A34A', border: '1px solid rgba(22, 163, 74, 0.2)' }}>
                                                <Check size={15} /> {reviewSuccess}
                                            </div>
                                        )}

                                        {/* Error Message */}
                                        {reviewError && (
                                            <div className="mt-4 p-3 rounded-lg text-sm font-medium flex items-center gap-2 animate-fade-in" style={{ backgroundColor: 'rgba(220, 38, 38, 0.1)', color: '#DC2626', border: '1px solid rgba(220, 38, 38, 0.2)' }}>
                                                <X size={15} /> {reviewError}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* Review Footer - progress */}
                            <div className="px-6 py-3 border-t flex items-center justify-between" style={{ borderColor: isDarkMode ? '#2A2A2A' : '#E5E7EB', backgroundColor: isDarkMode ? '#111111' : '#FAFAFA' }}>
                                <span className="text-xs font-medium" style={{ color: '#6B7280' }}>
                                    {reviewOrder.items ? `${Object.keys(reviewedItems[reviewOrder.id] || {}).length} of ${reviewOrder.items.length} items reviewed` : ''}
                                </span>
                                <button
                                    onClick={closeReviewModal}
                                    className="px-4 py-1.5 rounded-lg text-xs font-semibold transition-colors hover:bg-black/5 dark:hover:bg-white/5"
                                    style={{ color: '#6B7280' }}
                                >
                                    Done
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                <style>{`
                    @keyframes fadeIn {
                        from { opacity: 0; }
                        to { opacity: 1; }
                    }
                    @keyframes slideUp {
                        from { opacity: 0; transform: translateY(12px); }
                        to { opacity: 1; transform: translateY(0); }
                    }
                    .animate-fade-in {
                        animation: fadeIn 0.2s ease-out forwards;
                    }
                    .animate-slide-up {
                        animation: slideUp 0.25s cubic-bezier(0.16, 1, 0.3, 1) forwards;
                    }
                `}</style>
            </main>
        </div>
    )
}

export default Orders
