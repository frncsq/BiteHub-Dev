import CustomerSidebar from "../components/CustomerSidebar"
import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { Package, MapPin, Clock, Phone, ArrowLeft, TrendingUp, Utensils, Info, X, Receipt, ShoppingBag, Star, Bell, Search, User, ChevronDown, ChevronUp } from "lucide-react"
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
            fetchOrders(false) // Pass false to skip full loading state on background refresh
        }, 30000) // Increase to 30s to reduce unnecessary load
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
                    date: o.created_at || new Date().toISOString(),
                    items: Array.isArray(o.items) ? o.items : [],
                    total: parseFloat(o.total_amount) || 0,
                    status: o.order_status || 'pending',
                    restaurantName: o.restaurant_name || "Unknown Restaurant",
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
                {/* Ambient Glassmorphism Light Blobs */}
                <div className="fixed top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
                    <div className={`absolute -top-[20%] -left-[10%] w-[50%] h-[50%] rounded-full blur-[120px] ${isDarkMode ? 'bg-orange-500/10' : 'bg-orange-400/20'}`} />
                    <div className={`absolute top-[60%] -right-[10%] w-[40%] h-[60%] rounded-full blur-[120px] ${isDarkMode ? 'bg-blue-500/10' : 'bg-blue-400/15'}`} />
                </div>


            <div className="max-w-7xl mx-auto px-4 md:px-8 py-8 relative z-10">
                {/* Back Button */}
                <button
                    onClick={() => navigate("/home")}
                    className="mb-6 inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold transition-all hover:shadow-md hover:-translate-y-0.5 hover:opacity-90 border border-gray-200"
                    style={{ backgroundColor: isDarkMode ? colors.secondaryBg : '#f3f4f6', color: colors.text }}
                >
                    <ArrowLeft size={16} /> Back to Home
                </button>

                {/* Compact Status Header */}
                <section className={`mb-6 p-6 rounded-[32px] border flex flex-col md:flex-row items-center justify-between gap-6 transition-all ${isDarkMode ? 'bg-gray-900/40 border-gray-800' : 'bg-white border-gray-100 shadow-sm'}`}>
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-orange-500 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-orange-500/20">
                            <Package size={24} />
                        </div>
                        <div>
                            <h1 className="text-xl font-black tracking-tight leading-none mb-1">My Orders</h1>
                            <p className={`text-[10px] font-black uppercase tracking-[2px] ${isDarkMode ? 'text-white' : 'text-black'}`}>Track Selections</p>
                        </div>
                    </div>
                    <div className="flex gap-4">
                        <div className="text-right">
                            <p className={`text-[9px] font-bold uppercase tracking-[1px] ${isDarkMode ? 'text-gray-100' : 'text-black'}`}>Total Records</p>
                            <p className="text-xl font-black leading-none">{orders.length}</p>
                        </div>
                        <div className="w-px h-8 bg-gray-200 dark:bg-gray-800" />
                        <div className="text-right">
                            <p className={`text-[9px] font-bold uppercase tracking-[1px] ${isDarkMode ? 'text-gray-100' : 'text-black'}`}>This Month</p>
                            <p className="text-xl font-black leading-none">{orders.filter(o => new Date(o.date).getMonth() === new Date().getMonth()).length}</p>
                        </div>
                    </div>
                </section>

                {/* Minimalist Filter Bar */}
                <div className="mb-6 flex gap-2 flex-wrap px-1">
                    {['all', 'preparing', 'out for delivery', 'delivered', 'cancelled'].map((status) => (
                        <button
                            key={status}
                            onClick={() => setStatusFilter(status)}
                            className={`px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${statusFilter === status
                                    ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/20 active:scale-95'
                                    : isDarkMode ? 'text-gray-100 border border-gray-800 hover:bg-gray-800' : 'text-black border border-gray-100 hover:bg-gray-50'
                                }`}
                        >
                            {status}
                        </button>
                    ))}
                </div>

                {/* Error Message */}
                {error && (
                    <div className="mb-6 p-4 rounded-lg border border-red-200 bg-red-50 text-red-700 flex items-center justify-between">
                        <span>{error}</span>
                        <button onClick={() => setError("")} className="hover:opacity-70">
                            <ArrowLeft size={18} className="rotate-180" />
                        </button>
                    </div>
                )}

                {/* Empty State */}
                {!loading && filteredOrders.length === 0 && (
                    <div className="text-center py-20">
                        <div className="text-6xl mb-4">📦</div>
                        <h2 className="text-2xl font-bold mb-2" style={{ color: colors.text }}>
                            No orders found
                        </h2>
                        <p style={{ color: colors.textSecondary }} className="mb-6 max-w-md mx-auto">
                            {statusFilter === 'all'
                                ? "You haven't placed any orders yet. Start ordering your favorite food now!"
                                : `No ${statusFilter} orders. Check other order statuses.`}
                        </p>
                        <button
                            onClick={() => navigate('/home')}
                            className="px-6 py-3 rounded-full font-semibold transition-all hover:shadow-md hover:-translate-y-0.5 inline-flex items-center gap-2 bg-orange-500 text-white hover:bg-orange-600"
                        >
                            <Utensils size={18} /> Order Food Now
                        </button>
                    </div>
                )}

                {/* Orders Grid */}
                {!loading && filteredOrders.length > 0 && (
                    <div>
                        <div className="mb-4">
                            <p style={{ color: colors.textSecondary }} className="text-sm">
                                Showing {filteredOrders.length} order{filteredOrders.length !== 1 ? 's' : ''}
                            </p>
                        </div>                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                            {filteredOrders.map((order) => (
                                <div
                                    key={order.id}
                                    className={`rounded-[28px] border transition-all duration-300 group hover:-translate-y-1 ${isDarkMode ? 'bg-gray-900/30 border-gray-800 hover:bg-gray-900/50' : 'bg-white border-gray-100/50 hover:shadow-xl shadow-sm'}`}
                                >
                                    {/* Compact Card Header */}
                                    <div className={`p-4 border-b ${isDarkMode ? 'border-gray-800/50' : 'border-gray-100/50'}`}>
                                        <div className="flex justify-between items-start mb-1">
                                            <p className={`text-[9px] font-bold uppercase tracking-[1px] ${isDarkMode ? 'text-gray-200' : 'text-black'}`}>ID: #{order.id}</p>
                                            <span className="px-2 py-0.5 rounded-lg text-[8px] font-black uppercase tracking-widest text-white shadow-sm" style={{ backgroundColor: getStatusColor(order.status) }}>
                                                {order.status || 'unknown'}
                                            </span>
                                        </div>
                                        <h3 className={`text-[15px] font-black tracking-tight leading-tight truncate ${isDarkMode ? 'text-white' : 'text-black'}`}>{order.restaurantName}</h3>
                                    </div>
                                    
                                    {/* High-density Content */}
                                    <div className="p-4 space-y-3">
                                        <div className="flex items-center gap-2">
                                            <div className="w-6 h-6 rounded-lg bg-orange-500/10 flex items-center justify-center text-orange-500">
                                                <Clock size={12} />
                                            </div>
                                            <p className={`text-[11px] font-bold ${isDarkMode ? 'text-gray-100' : 'text-black'}`}>{formatDate(order.date)}</p>
                                        </div>

                                        <div className="pt-3 border-t border-dashed border-gray-100 dark:border-gray-800 flex justify-between items-center">
                                            <span className={`text-[9px] font-bold uppercase tracking-[1px] ${isDarkMode ? 'text-gray-200' : 'text-black'}`}>Amount</span>
                                            <span className="text-lg font-black text-orange-500">
                                                ₱{(order.total || 0).toFixed(2)}
                                            </span>
                                        </div>

                                        {/* Expandable Order Details (Drop Down) */}
                                        {expandedOrderId === order.id && (
                                            <div className="pt-4 border-t space-y-4 animate-fade-in" style={{ borderColor: colors.border }}>
                                                <div>
                                                    <p className="text-[10px] font-black uppercase tracking-widest text-orange-500 mb-2">Order Breakdown</p>
                                                    <div className="space-y-2">
                                                        {order.items?.map((item, idx) => (
                                                            <div key={idx} className={`flex justify-between items-center p-2 rounded-xl ${isDarkMode ? 'bg-white/5' : 'bg-gray-50'}`}>
                                                                <div className="flex items-center gap-2">
                                                                    <span className="text-xs font-black text-orange-500">{item.quantity}x</span>
                                                                    <span className={`text-xs font-bold ${isDarkMode ? 'text-white' : 'text-black'}`}>{item.name}</span>
                                                                </div>
                                                                <span className={`text-xs font-black ${isDarkMode ? 'text-white' : 'text-black'}`}>
                                                                    ₱{(Number(item.price_at_order || 0) * item.quantity).toFixed(2)}
                                                                </span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>

                                                <div className="p-3 rounded-xl border flex flex-col gap-2" style={{ borderColor: colors.border, backgroundColor: isDarkMode ? 'rgba(0,0,0,0.2)' : 'rgba(0,0,0,0.02)' }}>
                                                    <div className="flex items-start gap-2">
                                                        <MapPin size={14} className="text-orange-500 flex-shrink-0 mt-0.5" />
                                                        <div className="flex flex-col gap-0.5">
                                                            <p className={`text-[10px] font-bold ${isDarkMode ? 'text-gray-200' : 'text-black'}`}>
                                                                {order.deliveryAddress || "University Main Campus"}
                                                            </p>
                                                            {(order.department || order.course) && (
                                                                <p className={`text-[9px] font-black uppercase tracking-tight text-orange-500`}>
                                                                    {order.department}{order.course ? ` • ${order.course}` : ''}
                                                                </p>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <Clock size={14} className="text-orange-500" />
                                                        <p className={`text-[10px] font-bold ${isDarkMode ? 'text-gray-200' : 'text-black'}`}>
                                                            Arriving in {order.deliveryTime || "25-30 min"}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {/* Card Footer */}
                                    <div className="px-5 pb-5 space-y-3">
                                        <button
                                            onClick={() => toggleOrderExpansion(order.id)}
                                            className={`w-full px-4 py-2.5 rounded-full font-black text-[11px] uppercase tracking-widest transition-all border flex items-center justify-center gap-2 ${expandedOrderId === order.id ? 'bg-orange-500 text-white border-orange-500' : 'hover:bg-gray-50 border-gray-200'}`}
                                            style={expandedOrderId !== order.id ? { color: colors.text } : {}}
                                        >
                                            {expandedOrderId === order.id ? (
                                                <><ChevronUp size={16} /> Hide Details</>
                                            ) : (
                                                <><ChevronDown size={16} /> Order Details</>
                                            )}
                                        </button>

                                        {['delivered', 'completed'].includes(order.status?.toLowerCase()) ? (
                                            <div className="space-y-3">
                                                <button
                                                    onClick={() => navigate('/home')}
                                                    className="w-full px-4 py-2.5 rounded-full font-semibold transition-all text-white hover:shadow-md hover:-translate-y-0.5 bg-orange-500 hover:bg-orange-600 flex items-center justify-center gap-2"
                                                >
                                                    <ShoppingBag size={18} /> Order Again
                                                </button>
                                                <button
                                                    onClick={() => alert("Review functionality coming soon! Thank you for your feedback.")}
                                                    className="w-full px-4 py-2.5 rounded-full font-semibold transition-all border border-orange-500 text-orange-500 hover:bg-orange-50 flex items-center justify-center gap-2"
                                                >
                                                    <Star size={18} /> Review Order
                                                </button>
                                            </div>
                                        ) : (
                                            <div className="w-full px-4 py-2.5 rounded-full text-center font-semibold text-white flex items-center justify-center gap-2" style={{ backgroundColor: '#f97316', opacity: 0.7 }}>
                                                <Clock size={18} /> {order.status === 'cancelled' ? 'Order Cancelled' : 'In Progress'}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Order Details Modal */}
            {selectedOrder && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
                    <div
                        className="w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden animate-slide-up border max-h-[90vh] flex flex-col"
                        style={{ backgroundColor: colors.secondaryBg, borderColor: colors.border }}
                    >
                        {/* Modal Header */}
                        <div className="p-6 border-b flex justify-between items-center" style={{ borderColor: colors.border, backgroundColor: colors.tertiary }}>
                            <div>
                                <h2 className="text-2xl font-bold" style={{ color: colors.text }}>Order Details</h2>
                                <p className="text-sm" style={{ color: colors.textSecondary }}>Order #{selectedOrder.id}</p>
                            </div>
                            <button
                                onClick={() => setSelectedOrder(null)}
                                className="p-2 rounded-full hover:bg-black/10 transition-colors"
                                style={{ color: colors.text }}
                            >
                                <X size={24} />
                            </button>
                        </div>

                        {/* Modal Body */}
                        <div className="p-6 overflow-y-auto space-y-6">
                            {/* Restaurant & Status */}
                            <div className="flex justify-between items-start gap-4 p-4 rounded-2xl border" style={{ borderColor: colors.border, backgroundColor: isDarkMode ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)' }}>
                                <div>
                                    <h3 className="text-xl font-bold mb-1" style={{ color: colors.text }}>{selectedOrder.restaurantName}</h3>
                                    <p className="text-sm flex items-center gap-2" style={{ color: colors.textSecondary }}>
                                        <Clock size={16} /> {formatDate(selectedOrder.date)}
                                    </p>
                                </div>
                                <span className="px-4 py-1.5 rounded-full text-sm font-bold text-white shadow-sm" style={{ backgroundColor: getStatusColor(selectedOrder.status) }}>
                                    {selectedOrder.status.toUpperCase()}
                                </span>
                            </div>

                            {/* Order Items */}
                            <div>
                                <h4 className="text-lg font-bold mb-4 flex items-center gap-2" style={{ color: colors.text }}>
                                    <Receipt size={20} className="text-orange-500" />
                                    Order Summary
                                </h4>
                                <div className="space-y-3">
                                    {selectedOrder.items && selectedOrder.items.length > 0 ? (
                                        selectedOrder.items.map((item, idx) => (
                                            <div key={idx} className="flex justify-between items-center p-3 rounded-xl bg-orange-500/5 border border-orange-500/10">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center text-orange-600 font-bold">
                                                        {item.quantity}x
                                                    </div>
                                                    <div>
                                                        <p className="font-semibold" style={{ color: colors.text }}>{item.name}</p>
                                                        <p className="text-xs" style={{ color: colors.textSecondary }}>₱{Number(item.price_at_order || 0).toFixed(2)} each</p>
                                                    </div>
                                                </div>
                                                <p className="font-bold" style={{ color: colors.text }}>
                                                    ₱{(Number(item.price_at_order || 0) * item.quantity).toFixed(2)}
                                                </p>
                                            </div>
                                        ))
                                    ) : (
                                        <p className="text-center py-4 text-gray-400 italic">No item details available</p>
                                    )}
                                </div>
                            </div>

                            {/* Delivery Info */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t" style={{ borderColor: colors.border }}>
                                <div className="space-y-1">
                                    <p className="text-xs font-bold uppercase tracking-wider text-gray-500">Delivery Address</p>
                                    <p className="text-sm font-medium flex items-start gap-2" style={{ color: colors.text }}>
                                        <MapPin size={16} className="text-orange-500 flex-shrink-0 mt-0.5" />
                                        {selectedOrder.deliveryAddress}, {selectedOrder.deliveryCity}
                                    </p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-xs font-bold uppercase tracking-wider text-gray-500">Est. Delivery Time</p>
                                    <p className="text-sm font-medium flex items-center gap-2" style={{ color: colors.text }}>
                                        <TrendingUp size={16} className="text-orange-500" />
                                        {selectedOrder.estimatedDeliveryTime ? `${selectedOrder.estimatedDeliveryTime} mins` : '30-45 mins'}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Modal Footer */}
                        <div className="p-6 border-t bg-orange-500/5 flex justify-between items-center" style={{ borderColor: colors.border }}>
                            <span className="text-lg font-bold" style={{ color: colors.text }}>Total Paid</span>
                            <span className="text-3xl font-black text-orange-500">
                                ₱{selectedOrder.total.toFixed(2)}
                            </span>
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
