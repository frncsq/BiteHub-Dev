import Header from "../components/header"
import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { Package, MapPin, Clock, DollarSign, Phone, ArrowLeft, TrendingUp, Utensils } from "lucide-react"
import { useTheme } from "../context/ThemeContext"
import { mockOrderService } from "../services/mockData"

function Orders() {
    const [orders, setOrders] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState("")
    const [statusFilter, setStatusFilter] = useState("all")
    const navigate = useNavigate()
    const { isDarkMode, colors } = useTheme()

    useEffect(() => {
        fetchOrders()
    }, [])

    const fetchOrders = async () => {
        try {
            setLoading(true)
            setError("")
            const result = mockOrderService.getOrders()
            if (result.success) {
                setOrders(result.orders || [])
            } else {
                setError("Failed to load orders")
            }
        } catch (error) {
            console.error("Error fetching orders:", error)
            setError("Error loading orders. Please try again.")
        } finally {
            setLoading(false)
        }
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
        <main className="min-h-screen" style={{ backgroundColor: colors.background }}>
                <div className="max-w-7xl mx-auto px-4 md:px-8 py-8">
                    {/* Back Button */}
                    <button
                        onClick={() => navigate("/home")}
                        className="mb-6 inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold transition-all hover:shadow-md hover:-translate-y-0.5 hover:opacity-90 border border-gray-200"
                        style={{ backgroundColor: isDarkMode ? colors.secondaryBg : '#f3f4f6', color: colors.text }}
                    >
                        <ArrowLeft size={16} /> Back to Home
                    </button>

                    {/* Hero Section */}
                    <section className="mb-8 bg-gradient-to-r from-orange-500 to-orange-600 rounded-3xl p-8 md:p-12 text-white shadow-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                        <div>
                            <h1 className="text-3xl md:text-4xl font-bold mb-2 flex items-center gap-3">
                                <Package size={40} />
                                My Orders
                            </h1>
                            <p className="text-orange-100 mb-4 max-w-xl">
                                Track and manage all your food orders in one place. Stay updated on delivery status and reorder your favorites.
                            </p>
                        </div>
                        <div className="grid grid-cols-2 gap-3 w-full md:w-auto">
                            <div className="bg-white/10 rounded-2xl px-4 py-3 backdrop-blur-sm">
                                <p className="text-xs text-orange-100">Total Orders</p>
                                <p className="text-2xl font-bold">{orders.length}</p>
                            </div>
                            <div className="bg-white/10 rounded-2xl px-4 py-3 backdrop-blur-sm">
                                <p className="text-xs text-orange-100">This Month</p>
                                <p className="text-2xl font-bold">{orders.filter(o => new Date(o.date).getMonth() === new Date().getMonth()).length}</p>
                            </div>
                        </div>
                    </section>

                    {/* Status Filter */}
                    <div className="mb-8 flex gap-2 flex-wrap">
                        {['all', 'preparing', 'out for delivery', 'delivered', 'cancelled'].map((status) => (
                            <button
                                key={status}
                                onClick={() => setStatusFilter(status)}
                                className={`px-4 py-2 rounded-full text-sm font-semibold transition-all capitalize ${
                                    statusFilter === status
                                        ? 'text-white shadow-md'
                                        : isDarkMode ? 'text-gray-300 border border-gray-600 hover:bg-gray-700/50' : 'text-gray-700 border border-gray-200 hover:bg-gray-50'
                                }`}
                                style={
                                    statusFilter === status
                                        ? { backgroundColor: '#f97316' }
                                        : {}
                                }
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
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {filteredOrders.map((order) => (
                                    <div
                                        key={order.id}
                                        className="rounded-2xl shadow-md hover:shadow-lg transition-all overflow-hidden border group hover:-translate-y-1"
                                        style={{ borderColor: colors.border, backgroundColor: colors.secondaryBg }}
                                    >
                                        {/* Card Header with Status */}
                                        <div className="p-5 border-b" style={{ borderColor: colors.border, backgroundColor: colors.tertiary }}>
                                            <div className="flex justify-between items-start gap-3 mb-2">
                                                <div>
                                                    <h3 className="text-lg font-bold" style={{ color: colors.text }}>
                                                        {order.restaurantName}
                                                    </h3>
                                                    <p className="text-xs" style={{ color: colors.textSecondary }}>
                                                        Order #{order.id}
                                                    </p>
                                                </div>
                                                <span className="px-3 py-1 rounded-full text-xs font-semibold text-white" style={{ backgroundColor: getStatusColor(order.status) }}>
                                                    {order.status || 'unknown'}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Card Content */}
                                        <div className="p-5 space-y-4">
                                            {/* Order Date */}
                                            <div className="flex items-start gap-3">
                                                <Clock size={18} style={{ color: '#f97316', flexShrink: 0 }} />
                                                <div>
                                                    <p className="text-xs" style={{ color: colors.textSecondary }}>
                                                        Order Date
                                                    </p>
                                                    <p className="text-sm font-semibold" style={{ color: colors.text }}>
                                                        {formatDate(order.date)}
                                                    </p>
                                                </div>
                                            </div>

                                            {/* Delivery Time */}
                                            {order.deliveryTime && (
                                                <div className="flex items-start gap-3">
                                                    <TrendingUp size={18} style={{ color: '#f97316', flexShrink: 0 }} />
                                                    <div>
                                                        <p className="text-xs" style={{ color: colors.textSecondary }}>
                                                            Estimated Delivery
                                                        </p>
                                                        <p className="text-sm font-semibold" style={{ color: colors.text }}>
                                                            {order.deliveryTime}
                                                        </p>
                                                    </div>
                                                </div>
                                            )}

                                            {/* Items Summary */}
                                            <div className="pt-2 border-t" style={{ borderColor: colors.border }}>
                                                <p className="text-xs font-semibold mb-2" style={{ color: colors.text }}>
                                                    Items ({order.items?.length || 0})
                                                </p>
                                                <p className="text-xs" style={{ color: colors.textSecondary }}>
                                                    {order.items?.slice(0, 2).map(item => item.name).join(', ')}
                                                    {order.items?.length > 2 && ` +${order.items.length - 2} more`}
                                                </p>
                                            </div>

                                            {/* Price */}
                                            <div className="pt-2 border-t flex justify-between items-center" style={{ borderColor: colors.border }}>
                                                <span className="text-xs text-gray-500">Total</span>
                                                <span className="text-2xl font-bold" style={{ color: '#f97316' }}>
                                                    ${(order.total || 0).toFixed(2)}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Card Footer */}
                                        <div className="px-5 pb-5">
                                            {order.status?.toLowerCase() === 'delivered' ? (
                                                <button
                                                    onClick={() => navigate('/home')}
                                                    className="w-full px-4 py-2.5 rounded-full font-semibold transition-all text-white hover:shadow-md hover:-translate-y-0.5 bg-orange-500 hover:bg-orange-600"
                                                >
                                                    Order Again
                                                </button>
                                            ) : (
                                                <div className="w-full px-4 py-2.5 rounded-full text-center font-semibold text-white" style={{ backgroundColor: '#f97316', opacity: 0.7 }}>
                                                    In Progress
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </main>
    )
}

export default Orders
