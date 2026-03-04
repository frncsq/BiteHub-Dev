import Header from "../components/header"
import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { Trash2, Plus, Minus, ShoppingCart, ArrowLeft } from "lucide-react"
import { useTheme } from "../context/ThemeContext"
import { mockCartService } from "../services/mockData"

function Cart() {
    const [cartItems, setCartItems] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState("")
    const [promoCode, setPromoCode] = useState("")
    const [discount, setDiscount] = useState(0)
    const navigate = useNavigate()
    const { isDarkMode, colors } = useTheme()

    useEffect(() => {
        fetchCartItems()
    }, [])

    const fetchCartItems = async () => {
        try {
            setLoading(true)
            setError("")
            const result = mockCartService.getCartItems()
            if (result.success) {
                setCartItems(result.items || [])
            } else {
                setError("Failed to load cart items")
            }
        } catch (error) {
            console.error("Error fetching cart:", error)
            setError("Error loading cart. Please try again.")
        } finally {
            setLoading(false)
        }
    }

    const handleQuantityChange = (itemId, quantity) => {
        if (quantity <= 0) {
            handleRemoveItem(itemId)
            return
        }
        setCartItems(cartItems.map(item =>
            item.id === itemId ? { ...item, quantity } : item
        ))
    }

    const handleRemoveItem = (itemId) => {
        setCartItems(cartItems.filter(item => item.id !== itemId))
    }

    const calculateSubtotal = () => {
        return cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0)
    }

    const handleApplyPromo = () => {
        if (promoCode.toLowerCase() === 'save10') {
            setDiscount(Math.floor(calculateSubtotal() * 0.1 * 100) / 100)
        } else {
            setDiscount(0)
        }
    }

    const handleCheckout = async (e) => {
        e.preventDefault()
        if (cartItems.length === 0) {
            setError("Your cart is empty")
            return
        }

        try {
            const subtotal = calculateSubtotal()
            const total = subtotal - discount + (subtotal - discount) * 0.08 // 8% tax

            // Create order with cart items
            alert("Order placed successfully! Your food will be delivered soon.")
            setCartItems([])
            navigate("/orders")
        } catch (error) {
            console.error("Error creating order:", error)
            setError("Error processing order. Please try again.")
        }
    }

    if (loading) {
        return (
            <>
                <Header />
                <main className="min-h-screen" style={{ backgroundColor: colors.background }}>
                    <div className="text-center py-12">
                        <div className="inline-block">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2" style={{ borderColor: colors.accent }}></div>
                        </div>
                        <p style={{ color: colors.textSecondary }} className="mt-4">Loading cart...</p>
                    </div>
                </main>
            </>
        )
    }

    const subtotal = calculateSubtotal()
    const tax = Math.round((subtotal - discount) * 0.08 * 100) / 100
    const total = subtotal - discount + tax

    return (
        <>
            <Header />
            <main className="min-h-screen" style={{ backgroundColor: colors.background }}>
                <div className="max-w-4xl mx-auto px-4 sm:px-8 py-12">
                    {/* Back Button */}
                    <button
                        onClick={() => navigate("/home")}
                        className="mb-6 inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition"
                        style={{ backgroundColor: colors.buttonBg, color: 'white' }}
                    >
                        <ArrowLeft size={16} /> Back to Home
                    </button>

                    {/* Page Title */}
                    <div className="mb-8">
                        <h1 className="text-4xl font-bold flex items-center gap-3" style={{ color: colors.text, textShadow: `0 0 10px ${isDarkMode ? 'rgba(255, 107, 107, 0.3)' : 'rgba(0,0,0,0.1)'}` }}>
                            <ShoppingCart size={40} />
                            Your Cart
                        </h1>
                        <p style={{ color: colors.textSecondary }} className="mt-2">Review and confirm your order</p>
                    </div>

                    {error && (
                        <div className="mb-6 p-4 rounded-lg" style={{ borderColor: colors.accent, backgroundColor: isDarkMode ? 'rgba(139, 0, 0, 0.2)' : 'rgba(255, 107, 107, 0.1)', color: colors.accent, border: `1px solid ${colors.accent}` }}>
                            {error}
                        </div>
                    )}

                    {cartItems.length === 0 ? (
                        <div className="text-center py-12 rounded-3xl border-2 p-8" style={{ borderColor: colors.border, backgroundColor: colors.secondaryBg }}>
                            <div className="text-6xl mb-4">🛒</div>
                            <h2 className="text-2xl font-semibold mb-2" style={{ color: colors.text }}>
                                Your cart is empty
                            </h2>
                            <p style={{ color: colors.textSecondary }} className="mb-6">
                                Start adding delicious food items to your cart
                            </p>
                            <button
                                onClick={() => navigate('/home')}
                                className="px-6 py-3 rounded-lg font-semibold transition-all hover:shadow-lg"
                                style={{ backgroundColor: colors.buttonBg, color: 'white' }}
                            >
                                Browse Restaurants
                            </button>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            {/* Cart Items */}
                            <div className="lg:col-span-2">
                                <div className="rounded-3xl border-2 p-6" style={{ borderColor: colors.border, backgroundColor: colors.secondaryBg }}>
                                    <h2 className="text-xl font-semibold mb-4" style={{ color: colors.text }}>
                                        Order Items ({cartItems.length})
                                    </h2>
                                    <div className="space-y-4">
                                        {cartItems.map((item) => (
                                            <div
                                                key={item.id}
                                                className="flex items-center gap-4 p-4 rounded-lg"
                                                style={{ backgroundColor: 'rgba(40, 40, 60, 0.8)' }}
                                            >
                                                {item.image && (
                                                    <img
                                                        src={item.image}
                                                        alt={item.name}
                                                        className="w-20 h-20 rounded-lg object-cover"
                                                    />
                                                )}
                                                <div className="flex-1">
                                                    <h3 className="font-semibold" style={{ color: colors.text }}>
                                                        {item.name}
                                                    </h3>
                                                    <p style={{ color: colors.textSecondary }} className="text-sm">
                                                        {item.restaurant}
                                                    </p>
                                                    <p style={{ color: colors.accent }} className="font-semibold">
                                                        ${(item.price * item.quantity).toFixed(2)}
                                                    </p>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <button
                                                        onClick={() => handleQuantityChange(item.id, item.quantity - 1)}
                                                        className="p-1 rounded hover:opacity-70"
                                                        style={{ backgroundColor: colors.hoverBg }}
                                                    >
                                                        <Minus size={16} style={{ color: colors.accent }} />
                                                    </button>
                                                    <span style={{ color: colors.text }} className="w-8 text-center">
                                                        {item.quantity}
                                                    </span>
                                                    <button
                                                        onClick={() => handleQuantityChange(item.id, item.quantity + 1)}
                                                        className="p-1 rounded hover:opacity-70"
                                                        style={{ backgroundColor: colors.hoverBg }}
                                                    >
                                                        <Plus size={16} style={{ color: colors.accent }} />
                                                    </button>
                                                </div>
                                                <button
                                                    onClick={() => handleRemoveItem(item.id)}
                                                    className="p-2 rounded hover:opacity-70"
                                                    style={{ backgroundColor: isDarkMode ? 'rgba(255, 107, 107, 0.2)' : 'rgba(255, 107, 107, 0.1)' }}
                                                >
                                                    <Trash2 size={18} style={{ color: colors.accent }} />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Order Summary */}
                            <div className="rounded-3xl border-2 p-6 h-fit sticky top-6" style={{ borderColor: colors.border, backgroundColor: colors.secondaryBg }}>
                                <h2 className="text-xl font-semibold mb-6" style={{ color: colors.text }}>
                                    Order Summary
                                </h2>

                                {/* Promo Code */}
                                <div className="mb-6 pb-6" style={{ borderBottomColor: colors.border, borderBottomWidth: '1px' }}>
                                    <label className="block text-sm font-medium mb-2" style={{ color: colors.textSecondary }}>
                                        Promo Code
                                    </label>
                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            value={promoCode}
                                            onChange={(e) => setPromoCode(e.target.value)}
                                            placeholder="Enter code"
                                            className="flex-1 rounded-lg border-2 px-3 py-2 text-sm"
                                            style={{ borderColor: colors.buttonBg, backgroundColor: colors.tertiary, color: colors.text }}
                                        />
                                        <button
                                            onClick={handleApplyPromo}
                                            className="px-4 py-2 rounded-lg font-semibold"
                                            style={{ backgroundColor: colors.buttonBg, color: 'white' }}
                                        >
                                            Apply
                                        </button>
                                    </div>
                                    <p style={{ color: colors.textSecondary }} className="text-xs mt-2">
                                        Try "SAVE10" for 10% off
                                    </p>
                                </div>

                                {/* Price Breakdown */}
                                <div className="space-y-3 mb-6">
                                    <div className="flex justify-between">
                                        <span style={{ color: colors.textSecondary }}>Subtotal:</span>
                                        <span style={{ color: colors.text }}>${subtotal.toFixed(2)}</span>
                                    </div>
                                    {discount > 0 && (
                                        <div className="flex justify-between text-green-400">
                                            <span>Discount:</span>
                                            <span>-${discount.toFixed(2)}</span>
                                        </div>
                                    )}
                                    <div className="flex justify-between">
                                        <span style={{ color: colors.textSecondary }}>Tax (8%):</span>
                                        <span style={{ color: colors.text }}>${tax.toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between pt-3" style={{ borderTopColor: colors.border, borderTopWidth: '1px' }}>
                                        <span style={{ color: colors.textSecondary }} className="font-semibold">Total:</span>
                                        <span className="text-2xl font-bold" style={{ color: colors.accent }}>
                                            ${total.toFixed(2)}
                                        </span>
                                    </div>
                                </div>

                                {/* Checkout Button */}
                                <button
                                    onClick={handleCheckout}
                                    className="w-full rounded-lg px-6 py-3 text-sm font-semibold transition"
                                    style={{ backgroundColor: colors.buttonBg, color: 'white' }}
                                >
                                    Place Order
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </main>
        </>
    )
}

export default Cart
