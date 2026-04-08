import { useState, useEffect, useRef, useMemo } from "react"
import { useNavigate, useLocation } from "react-router-dom"
import {
    Menu,
    X,
    Search,
    Bell,
    MessageCircle,
    User,
    Heart,
    ShoppingCart,
    Star,
    MapPin,
    Clock,
    Zap,
    Home,
    Utensils,
    Tag,
    Settings,
    LogOut,
    ChevronDown,
    ChevronRight,
    Plus,
    Minus,
    Truck,
    ChefHat,
    TrendingUp,
    Grid3x3,
    List,
    Sliders,
    ArrowRight,
    Check,
    AlertCircle,
    Package,
    Percent,
    CreditCard,
    Sun,
    Moon,
    LayoutDashboard,
    Receipt,
    Trash2,
    Info,
    CheckCircle
} from "lucide-react"
import { useTheme } from "../context/ThemeContext"
import { mockRestaurantsData, mockFoodItems, mockCategories, mockOrderService, mockCartService, mockAuthService } from "../services/mockData"
import { createApiClient } from "../services/apiClient"
import biteLogo from "../assets/bite.png"
import CustomerSidebar from "../components/CustomerSidebar"
import UserActivityAnalytics, { buildProfileActivityMetrics } from "../components/UserActivityAnalytics"



const HomePage = () => {
    const navigate = useNavigate()
    const { isDarkMode, toggleTheme, colors } = useTheme()
    const apiClient = createApiClient()
    const MAX_RETRIES = 3

    // State management
    const location = useLocation()
    const [sidebarOpen, setSidebarOpen] = useState(true)
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
    const [notificationDropdown, setNotificationDropdown] = useState(false)
    const [profileDropdown, setProfileDropdown] = useState(false)
    const [searchQuery, setSearchQuery] = useState("")
    const [activeTab, setActiveTab] = useState(location.state?.activeTab || "dashboard")

    // Sync active tab from location state when it changes
    useEffect(() => {
        if (location.state?.activeTab) {
            setActiveTab(location.state.activeTab)
        }
    }, [location.state])
    const [recommendations, setRecommendations] = useState([])
    const [favorites, setFavorites] = useState(new Set())
    const [cart, setCart] = useState([])
    const [orders, setOrders] = useState([])
    const [notifications, setNotifications] = useState([])
    const [unreadCount, setUnreadCount] = useState(0)

    useEffect(() => {
        const notifs = orders.map(o => {
            const status = o.status || 'pending';
            let message = `Your order is in progress.`;

            if (status === 'pending') message = `Your order is pending confirmation.`;
            else if (status === 'preparing') message = `Your order is currently being prepared.`;
            else if (status === 'prepared') message = `Your order is ready.`;
            else if (status === 'out_for_delivery') message = `Your order is out for delivery!`;
            else if (status === 'delivered') message = `Your order has been delivered! Enjoy your meal.`;
            else if (status === 'cancelled') message = `Your order has been cancelled.`;
            else if (status === 'accepted') message = `Your order was accepted.`;

            return {
                id: o.id,
                title: `Order Update ${o.id}`,
                message,
                time: o.createdAt || new Date().toISOString(),
                status: status,
                type: 'order'
            };
        });

        // Sort by time descending
        notifs.sort((a, b) => new Date(b.time) - new Date(a.time));

        const active = notifs.filter(n => !['delivered', 'cancelled'].includes(n.status));
        setUnreadCount(active.length);

        setNotifications([
            {
                id: 'sys-1',
                title: 'Welcome to BiteHub!',
                message: 'Explore our wide variety of restaurants and place your first order today!',
                time: new Date().toISOString(),
                type: 'system',
                status: 'info'
            },
            ...notifs
        ].slice(0, 15));
    }, [orders]);

    const formatNotifTime = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    const profileActivityMetrics = useMemo(() => buildProfileActivityMetrics(orders), [orders])
    const [categories, setCategories] = useState([])
    const [restaurants, setRestaurants] = useState([])
    const [popularFoods, setPopularFoods] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState("")
    const [message, setMessage] = useState("")
    const [messageType, setMessageType] = useState("")
    const [retryCount, setRetryCount] = useState(0)
    const [userRole, setUserRole] = useState("customer")
    const [viewMode, setViewMode] = useState("grid")
    const [priceFilter, setPriceFilter] = useState(2000)
    const [minRating, setMinRating] = useState(0)
    const [maxDistance, setMaxDistance] = useState(10)
    const [featuredScrollIndex, setFeaturedScrollIndex] = useState(0)
    const [userName, setUserName] = useState("Guest")
    const [showCheckoutDialog, setShowCheckoutDialog] = useState(false)
    const [checkoutInfo, setCheckoutInfo] = useState({
        deliveryAddress: "",
        deliveryCity: "",
        phone: ""
    })
    // Direct checkout state (Buy Now / Order Now without cart)
    const [showDirectCheckout, setShowDirectCheckout] = useState(false)
    const [directCheckoutItem, setDirectCheckoutItem] = useState(null)
    const [directCheckoutQty, setDirectCheckoutQty] = useState(1)
    const [directDepartment, setDirectDepartment] = useState("")
    const [directCourse, setDirectCourse] = useState("")
    const [directCheckoutProcessing, setDirectCheckoutProcessing] = useState(false)
    const [directCheckoutError, setDirectCheckoutError] = useState("")
    const [userProfile, setUserProfile] = useState(null)
    const [emailNotifs, setEmailNotifs] = useState(true)
    const [pushNotifs, setPushNotifs] = useState(true)
    const [orderUpdates, setOrderUpdates] = useState(true)
    const [expandedRestaurantId, setExpandedRestaurantId] = useState(null)
    const [showRestaurantDialog, setShowRestaurantDialog] = useState(false)
    const [selectedRestaurant, setSelectedRestaurant] = useState(null)
    // Explore Menu state
    const [activeCategoryFilter, setActiveCategoryFilter] = useState('All')
    const [cuisineFilter, setCuisineFilter] = useState('All')
    const [hoveredFoodId, setHoveredFoodId] = useState(null)
    // Restaurant Owner State
    const [liveOrders, setLiveOrders] = useState([])
    // Food Detail Modal State
    const [showFoodModal, setShowFoodModal] = useState(false)
    const [selectedFood, setSelectedFood] = useState(null)
    const [showSizeModal, setShowSizeModal] = useState(false)
    const [foodForSize, setFoodForSize] = useState(null)
    const [sizeModalCheckout, setSizeModalCheckout] = useState(false)
    const [selectedModalSize, setSelectedModalSize] = useState('Medium')
    // ── Budget Meal ordering state ──
    const [showBudgetModal, setShowBudgetModal] = useState(false)
    const [budgetFood, setBudgetFood] = useState(null)          // the menu_item being ordered
    const [budgetCombinations, setBudgetCombinations] = useState([])  // fetched from API
    const [budgetStep, setBudgetStep] = useState(1)             // 1=choose combo, 2=select options, 3=confirm
    const [budgetSelectedCombo, setBudgetSelectedCombo] = useState(null) // the chosen combo object
    const [budgetSelections, setBudgetSelections] = useState({}) // slotKey -> chosen option name
    const [budgetLoadingCombos, setBudgetLoadingCombos] = useState(false)
    const [budgetGoToCart, setBudgetGoToCart] = useState(false)
    const [showLogoutConfirm, setShowLogoutConfirm] = useState(false)

    const fetchLiveOrders = async () => {
        if (userRole !== 'owner') return;
        try {
            const res = await apiClient.get('/owner/orders');
            if (res.data?.success && res.data.orders) {
                const formatted = res.data.orders.map(o => ({
                    id: o.id,
                    status: o.order_status || 'pending',
                    location: `${o.delivery_address || 'Missing Address'}, ${o.delivery_city || ''}`,
                    time: new Date(o.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                    total: Number(o.total_amount) || 0
                }));
                setLiveOrders(formatted);
            }
        } catch (err) {
            console.error("Failed fetching live orders:", err);
        }
    }

    useEffect(() => {
        if (userRole === 'owner') {
            fetchLiveOrders();
            const interval = setInterval(fetchLiveOrders, 5000); // Sync every 5s for real-time feel
            return () => clearInterval(interval);
        }
    }, [userRole]);

    const updateOrderStatus = async (id, newStatus) => {
        setLiveOrders(prev => prev.map(o => o.id === id ? { ...o, status: newStatus } : o))
        try {
            await apiClient.put(`/owner/orders/${id}/status`, { status: newStatus });
        } catch (err) {
            console.error("Failed to update status in DB:", err);
            fetchLiveOrders(); // rollback visual if network failed
        }
    }

    const getOrderStatusColor = (status) => {
        switch (status) {
            case "pending": return "bg-yellow-100 text-yellow-700 border-yellow-200"
            case "accepted": return "bg-sky-100 text-sky-700 border-sky-200"
            case "preparing": return "bg-blue-100 text-blue-700 border-blue-200"
            case "prepared": return "bg-purple-100 text-purple-700 border-purple-200"
            case "out_for_delivery": return "bg-orange-100 text-orange-700 border-orange-200"
            case "delivered": return "bg-emerald-100 text-emerald-700 border-emerald-200"
            default: return "bg-gray-100 text-gray-700 border-gray-200"
        }
    }

    const featuredRef = useRef(null)
    const browseFoodRef = useRef(null)

    // Fetch data from backend
    useEffect(() => {
        const token = localStorage.getItem('authToken');
        if (!token) {
            console.warn("[GUEST] No token found. Redirecting to login.");
            navigate('/login');
            return;
        }
        fetchData()
        fetchOrders()
        fetchCartItems()
        fetchRecommendations()
    }, [])

    useEffect(() => {
        if (!localStorage.getItem('authToken')) return;

        const interval = setInterval(() => {
            fetchOrders()
            fetchCartItems()
        }, 30000); // 30s interval for background updates

        return () => clearInterval(interval);
    }, [])

    useEffect(() => {
        if (location.state?.activeTab) {
            setActiveTab(location.state.activeTab)
            // Clear location state to avoid re-triggering on future refreshes
            window.history.replaceState({}, document.title)
        }
    }, [location.state])

    const validateData = (data, requiredFields) => {
        return Array.isArray(data) && data.every(item => requiredFields.every(field => item.hasOwnProperty(field)))
    }

    const fetchData = async (attempt = 0) => {
        try {
            setLoading(true)
            setError("")
            setMessage("")

            // Fetch data from real APIs
            const [catRes, restRes, foodRes, profileRes] = await Promise.all([
                apiClient.get('/categories').catch(() => ({ data: { success: false } })),
                apiClient.get('/restaurants').catch(() => ({ data: { success: false } })),
                apiClient.get('/food').catch(() => ({ data: { success: false } })),
                apiClient.get('/profile').catch(() => ({ data: { success: false } }))
            ])

            if (profileRes.data?.success && profileRes.data.profile) {
                const profile = profileRes.data.profile;
                if (profile.full_name) {
                    setUserName(profile.full_name.split(' ')[0]) // Get first name
                } else if (profile.email) {
                    setUserName(profile.email.split('@')[0])
                }

                setCheckoutInfo({
                    deliveryAddress: profile.address || "",
                    deliveryCity: profile.city || "",
                    phone: profile.phone || ""
                })
                setUserProfile(profile)
            }

            if (catRes.data?.success) setCategories(catRes.data.categories)
            else setCategories(mockCategories)

            if (restRes.data?.success) setRestaurants(restRes.data.restaurants)
            else setRestaurants(mockRestaurantsData)

            if (foodRes.data?.success) {
                const popular = Array.isArray(foodRes.data.foods)
                    ? foodRes.data.foods
                    : Array.isArray(foodRes.data.items)
                        ? foodRes.data.items
                        : [];
                setPopularFoods(popular)
            } else {
                const allFoods = []
                Object.values(mockFoodItems).forEach(restaurantFoods => {
                    allFoods.push(...restaurantFoods)
                })
                setPopularFoods(allFoods) // Show all mock items including drinks
            }

            setRetryCount(0)
            setLoading(false)
            console.log("Successfully loaded data")
        } catch (error) {
            console.error(`Error loading data:`, error.message)
            setError("Unable to load data")
            setLoading(false)
        }
    }

    const handleRetry = () => {
        setRetryCount(0)
        fetchData()
    }

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
            const response = await apiClient.get('/cart')
            if (response.data && response.data.cart) {
                setCart(response.data.cart.map(item => ({
                    ...item,
                    id: item.id ?? item.foodId ?? item.food_id
                })).filter(item => item.id != null && item.name))
            } else {
                setCart([]);
            }
        } catch (error) {
            console.error("Error fetching cart:", error)
            setCart([]);
        }
    }

    // Mock order data
    const mockOrders = [
        { id: "ORD001", status: "completed", date: "2024-03-01", total: 35.98, items: 3 },
        { id: "ORD002", status: "out_for_delivery", date: "2024-03-02", total: 28.50, items: 2 },
        { id: "ORD003", status: "preparing", date: "2024-03-02", total: 42.99, items: 4 },
    ]

    // Fetch orders from backend
    const fetchOrders = async () => {
        try {
            const response = await apiClient.get('/orders')
            let rawData = [];
            if (response.data?.success && response.data.orders) {
                rawData = response.data.orders;
            } else if (Array.isArray(response.data)) {
                rawData = response.data;
            }

            if (rawData.length > 0) {
                const mappedOrders = rawData.map(o => ({
                    id: `ORD-${o.id}`,
                    status: o.order_status || o.status || "pending",
                    date: o.created_at ? new Date(o.created_at).toLocaleDateString() : new Date().toLocaleDateString(),
                    createdAt: o.created_at,
                    total: Number(o.total_amount || 0).toFixed(2),
                    items: o.items_count || (o.items ? o.items.length : 1)
                }));
                setOrders(mappedOrders);
            } else {
                setOrders(mockOrders);
            }
        } catch (error) {
            console.warn("Failed to fetch orders:", error.message)
            setOrders(mockOrders)
            // Don't show error for orders - just use mock data silently
        }
    }

    useEffect(() => {
        fetchOrders()
        const interval = setInterval(fetchOrders, 5000); // Sync every 5s for real-time feel
        return () => clearInterval(interval);
    }, [])

    // Toggle favorite with backend sync
    const toggleFavorite = async (foodId) => {
        const newFavorites = new Set(favorites)
        if (newFavorites.has(foodId)) {
            newFavorites.delete(foodId)
        } else {
            newFavorites.add(foodId)
        }
        setFavorites(newFavorites)

        // Sync with backend
        try {
            const response = await apiClient.post('/favorites/toggle', { foodId })
            if (!response.data?.success) {
                console.warn("Failed to sync favorite status")
            }
        } catch (error) {
            console.warn("Failed to sync favorites with backend:", error.message)
            setMessage("Local favorite saved, but couldn't sync to server")
            setMessageType('warning')
        }
    }

    // Add to cart with backend sync - Expanded for Drink sizes
    const addToCart = async (food, selectedSize = null, goToCart = false) => {
        // Check stock before showing modal / adding
        if (food.current_stock !== null && food.current_stock !== undefined && food.current_stock <= 0) {
            setMessage(`"${food.name}" is out of stock. Please try again tomorrow.`);
            setMessageType('error');
            setTimeout(() => setMessage(''), 3000);
            return;
        }
        // If it's a budget meal, open the budget meal modal instead
        if (food.category === 'Budget Meal') {
            openBudgetMealModal(food, goToCart);
            return;
        }
        // If it's a drink and no size is selected yet, show the size modal
        if (food.category === 'Drinks' && !selectedSize) {
            setFoodForSize(food);
            setSizeModalCheckout(goToCart);
            setShowSizeModal(true);
            return;
        }

        const sizeLabel = selectedSize ? ` (${selectedSize})` : '';
        const effectivePrice = selectedSize === 'Small' ? (food.half_price || food.price) :
            selectedSize === 'Large' ? (food.large_price || food.price) :
                selectedSize === 'Medium' ? food.price :
                    food.price;

        const cartItem = {
            ...food,
            id: selectedSize ? `${food.id}-${selectedSize}` : food.id,
            baseId: food.id,
            name: `${food.name}${sizeLabel}`,
            price: effectivePrice,
            selectedSize: selectedSize
        };

        try {
            const existingItem = cart.find(item => item.id === cartItem.id)
            if (existingItem) {
                setCart(cart.map(item =>
                    item.id === cartItem.id
                        ? { ...item, quantity: item.quantity + 1 }
                        : item
                ))
            } else {
                setCart([...cart, { ...cartItem, quantity: 1 }])
            }

            // Success Feedback
            setMessage(`Added ${cartItem.name} to cart!`)
            setMessageType('success')
            setTimeout(() => setMessage(''), 2000)
            setShowSizeModal(false)
            setShowFoodModal(false)

            // Sync with backend - use baseId for server identification
            // Also optimistically deduct stock in local state
            setPopularFoods(prev => prev.map(f => {
                if (f.id === food.id && f.current_stock !== null && f.current_stock >= 0) {
                    return { ...f, current_stock: Math.max(0, f.current_stock - 1) };
                }
                return f;
            }));

            apiClient.post('/cart/add', { foodId: food.id, quantity: 1, size: selectedSize }).catch(err => {
                console.warn('Failed to sync cart add:', err.message)
            })

            // Open direct checkout modal if this was a checkout action
            if (goToCart) {
                openDirectCheckout(cartItem);
            }
        } catch (error) {
            console.warn('Failed to add to cart:', error.message)
            setMessage('Item added locally, but couldn\'t sync to server')
            setMessageType('warning')
        }
    }

    // ── Open Budget Meal Modal ─────────────────────────────────────────────
    const openBudgetMealModal = async (food, goToCart = false) => {
        setBudgetFood(food)
        setBudgetGoToCart(goToCart)
        setBudgetStep(1)
        setBudgetSelectedCombo(null)
        setBudgetSelections({})
        setShowBudgetModal(true)
        setBudgetLoadingCombos(true)
        try {
            const res = await apiClient.get(`/food/budget-meal/${food.id}`)
            if (res.data?.success) {
                setBudgetCombinations(res.data.combinations || [])
            } else {
                setBudgetCombinations([])
            }
        } catch {
            setBudgetCombinations([])
        } finally {
            setBudgetLoadingCombos(false)
        }
    }

    const closeBudgetModal = () => {
        setShowBudgetModal(false)
        setBudgetFood(null)
        setBudgetCombinations([])
        setBudgetStep(1)
        setBudgetSelectedCombo(null)
        setBudgetSelections({})
    }

    const budgetSelectCombo = (combo) => {
        setBudgetSelectedCombo(combo)
        setBudgetSelections({})
        setBudgetStep(2)
    }

    // Unique key per slot so users can pick one option per slot
    const budgetSlotKey = (combo, slot) => `${combo.id}_${slot.slot_index}_${slot.component_type}`

    const budgetAllSelected = () => {
        if (!budgetSelectedCombo) return false
        return budgetSelectedCombo.slots.every(slot => {
            const key = budgetSlotKey(budgetSelectedCombo, slot)
            return budgetSelections[key]
        })
    }

    const addBudgetMealToCart = async () => {
        if (!budgetFood || !budgetSelectedCombo) return
        const selectedOptions = budgetSelectedCombo.slots.map(slot => ({
            component_type: slot.component_type,
            slot_index: slot.slot_index,
            chosen: budgetSelections[budgetSlotKey(budgetSelectedCombo, slot)]
        }))
        const budgetMeta = {
            combinationId: budgetSelectedCombo.id,
            combinationLabel: budgetSelectedCombo.label,
            selectedOptions,
            price: budgetSelectedCombo.price
        }
        const cartItem = {
            ...budgetFood,
            id: `${budgetFood.id}-bm-${budgetSelectedCombo.id}`,
            baseId: budgetFood.id,
            name: `${budgetFood.name} (${budgetSelectedCombo.label})`,
            price: budgetSelectedCombo.price,
            budgetMeal: budgetMeta
        }
        const existing = cart.find(i => i.id === cartItem.id)
        if (existing) {
            setCart(cart.map(i => i.id === cartItem.id ? { ...i, quantity: i.quantity + 1 } : i))
        } else {
            setCart([...cart, { ...cartItem, quantity: 1 }])
        }
        setMessage(`Added ${cartItem.name} to cart! 🎉`)
        setMessageType('success')
        setTimeout(() => setMessage(''), 2500)
        // Sync with backend
        apiClient.post('/cart/add', { foodId: budgetFood.id, quantity: 1, budgetMeal: budgetMeta }).catch(() => { })
        closeBudgetModal()
        if (budgetGoToCart) {
            openDirectCheckout(cartItem);
        }
    }

    // Remove from cart with backend sync
    const removeFromCart = async (cartId) => {
        try {
            const item = cart.find(i => i.id === cartId);
            const syncId = item?.baseId || cartId;
            setCart(prev => prev.filter(item => item.id !== cartId));
            await apiClient.post('/cart/remove', { foodId: syncId, cartId: cartId });
        } catch (err) {
            console.error("Remove item failed:", err);
            fetchCartItems(); // Re-fetch on failure to keep state consistent
        }
    }

    // Update quantity with backend sync
    const updateQuantity = async (cartId, quantity) => {
        try {
            const item = cart.find(i => i.id === cartId);
            const syncId = item?.baseId || cartId;

            if (quantity <= 0) {
                removeFromCart(cartId)
            } else {
                setCart(prev => prev.map(item =>
                    item.id === cartId
                        ? { ...item, quantity }
                        : item
                ))

                // Sync with backend - mapping variants back to base items
                await apiClient.post('/cart/update', { foodId: syncId, quantity, size: item?.selectedSize })
            }
        } catch (error) {
            console.warn("Failed to update quantity:", error.message)
            setMessage("Quantity updated locally, but couldn't sync to server")
            setMessageType('warning')
        }
    }

    // Calculate totals defaults to 0 if missing discount properties to prevent NaN math failure.
    const subtotal = cart.reduce((sum, item) => {
        const itemDiscount = item.discount || 0;
        const finalPrice = item.price * (1 - itemDiscount / 100);
        return sum + (finalPrice * item.quantity);
    }, 0)
    const tax = subtotal * 0.1
    const deliveryFee = cart.length > 0 ? 2.99 : 0
    const total = subtotal + tax + deliveryFee

    // Filter foods (search + price + rating + category + cuisine)
    const filteredFoods = popularFoods.filter((food) => {
        const name = food.name || ''
        const restaurantName = food.restaurant || ''
        const matchesSearch =
            name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            restaurantName.toLowerCase().includes(searchQuery.toLowerCase())
        const effectivePrice = (food.price || 0) * (1 - (food.discount || 0) / 100)
        const withinPrice = effectivePrice <= priceFilter
        const meetsRating = (food.rating || 0) >= minRating
        const meetsCategory = activeCategoryFilter === 'All' ||
            (food.category || '').toLowerCase() === activeCategoryFilter.toLowerCase()
        const meetsCuisine = cuisineFilter === 'All' ||
            (food.category || '').toLowerCase() === cuisineFilter.toLowerCase()
        return matchesSearch && withinPrice && meetsRating && meetsCategory && meetsCuisine
    })

    // Filter nearby restaurants based on distance
    const filteredRestaurants = restaurants.filter((restaurant) => {
        if (!restaurant.distance) return true
        const numericDistance = parseFloat(restaurant.distance)
        return isNaN(numericDistance) ? true : numericDistance <= maxDistance
    })

    // Handle checkout (legacy – cart checkout dialog)
    const handleCheckout = async () => {
        try {
            if (cart.length === 0) {
                setMessage("Your cart is empty")
                setMessageType("error")
                setShowCheckoutDialog(false)
                return
            }

            const response = await apiClient.post('/orders/create', {
                items: cart,
                subtotal,
                tax,
                deliveryFee,
                total,
                deliveryAddress: checkoutInfo.deliveryAddress,
                deliveryCity: checkoutInfo.deliveryCity
            })

            if (response.data?.success) {
                setMessage("Order placed successfully! 🎉")
                setMessageType("success")
                setCart([])
                setShowCheckoutDialog(false)
                // Refresh orders
                await fetchOrders()
                setTimeout(() => {
                    setMessage("")
                }, 3000)
            } else {
                setMessage(response.data?.message || "Failed to place order")
                setMessageType("error")
            }
        } catch (error) {
            const errorMsg = error.response?.data?.message || error.message || "Failed to place order"
            setMessage(`Error: ${errorMsg}`)
            setMessageType("error")
            setShowCheckoutDialog(false)
            console.error("Checkout error:", error)
        }
    }

    // ── Direct Checkout (Buy Now / Order Now) ──────────────────────────────
    const openDirectCheckout = (item) => {
        setDirectCheckoutItem(item)
        setDirectCheckoutQty(1)
        setDirectDepartment("")
        setDirectCourse("")
        setDirectCheckoutError("")
        setDirectCheckoutProcessing(false)
        setShowDirectCheckout(true)
        // Close other modals
        setShowFoodModal(false)
        setShowSizeModal(false)
    }

    const closeDirectCheckout = () => {
        setShowDirectCheckout(false)
        setDirectCheckoutItem(null)
        setDirectCheckoutError("")
    }

    const handleDirectCheckoutSubmit = async () => {
        if (!directCheckoutItem) return

        if (!directDepartment || !directCourse) {
            setDirectCheckoutError("Please fill in both Building / Department and Course & Room")
            return
        }

        setDirectCheckoutProcessing(true)
        setDirectCheckoutError("")

        const itemPrice = Number(directCheckoutItem.price || 0)
        const itemSubtotal = itemPrice * directCheckoutQty
        const deliveryFeeVal = 25
        const promoDiscount = itemSubtotal > 1000 ? 100 : 0
        const orderTotal = itemSubtotal + deliveryFeeVal - promoDiscount

        const orderData = {
            items: [{
                id: directCheckoutItem.baseId || directCheckoutItem.id,
                quantity: directCheckoutQty,
                price: itemPrice,
                name: directCheckoutItem.name,
                restaurantId: directCheckoutItem.restaurantId || directCheckoutItem.restaurant_id || 1
            }],
            subtotal: itemSubtotal,
            total: orderTotal,
            department: directDepartment,
            course: directCourse,
            tax: 0,
            deliveryFee: deliveryFeeVal
        }

        try {
            const response = await apiClient.post('/orders/create', orderData)
            if (response.data?.success) {
                // Remove item from local cart state if it was added
                const removeId = directCheckoutItem.id
                setCart(prev => prev.filter(i => i.id !== removeId))

                setMessage(`Order for ${directCheckoutItem.name} placed successfully! 🎉`)
                setMessageType('success')
                closeDirectCheckout()
                await fetchOrders()
                await fetchCartItems()
                setTimeout(() => setMessage(''), 4000)
            } else {
                setDirectCheckoutError(response.data?.message || 'Failed to place order')
            }
        } catch (err) {
            const errorMsg = err.response?.data?.message || err.message || 'Failed to place order'
            setDirectCheckoutError(errorMsg)
            console.error('Direct checkout error:', err)
        } finally {
            setDirectCheckoutProcessing(false)
        }
    }

    // Featured restaurants horizontal scroll controls
    const handleFeaturedScroll = (direction) => {
        if (!featuredRef.current) return
        const container = featuredRef.current
        const scrollAmount = container.clientWidth * 0.8
        const nextIndex = direction === "next" ? featuredScrollIndex + 1 : featuredScrollIndex - 1
        setFeaturedScrollIndex(Math.max(0, nextIndex))
        container.scrollBy({
            left: direction === "next" ? scrollAmount : -scrollAmount,
            behavior: "smooth",
        })
    }

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: colors.background }}>
                <div className="text-center">
                    <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mb-4"></div>
                    <p style={{ color: colors.text }} className="text-lg">Loading BiteHub...</p>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen relative overflow-hidden" style={{ backgroundColor: colors.background }}>
            {/* Ambient Glassmorphism Light Blobs */}
            <div className="fixed top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
                <div className={`absolute -top-[20%] -left-[10%] w-[50%] h-[50%] rounded-full blur-[120px] ${isDarkMode ? 'bg-orange-500/10' : 'bg-orange-400/20'}`} />
                <div className={`absolute top-[60%] -right-[10%] w-[40%] h-[60%] rounded-full blur-[120px] ${isDarkMode ? 'bg-blue-500/10' : 'bg-blue-400/15'}`} />
            </div>

            <CustomerSidebar
                activeTab={activeTab === 'dashboard' ? 'home' : activeTab}
                onTabChange={(tabId) => {
                    if (tabId === 'home') setActiveTab('dashboard')
                    else setActiveTab(tabId)
                }}
                sidebarCollapsed={sidebarCollapsed}
                setSidebarCollapsed={setSidebarCollapsed}
            />

            {/* Main Content */}
            <div className={`transition-all duration-300 ${sidebarCollapsed ? "md:ml-20" : "md:ml-64"}`}>
                {/* TOP NAVIGATION BAR */}
                <header className={`sticky top-0 z-30 border-b backdrop-blur-2xl shadow-sm relative ${isDarkMode ? 'bg-[#1a1a2e]/60 border-[#1a1a2e]/50' : 'bg-white/60 border-white/50'}`}>
                    <div className="flex items-center justify-between h-16 px-4 gap-4">
                        {/* Mobile Menu Toggle */}
                        <button
                            onClick={() => setSidebarOpen(!sidebarOpen)}
                            className={`md:hidden p-2 rounded-lg transition hover:shadow-sm ${isDarkMode ? 'hover:bg-gray-800/50' : 'hover:bg-white/50'}`}
                        >
                            {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
                        </button>

                        {/* Search Bar */}
                        <div className="flex-1 max-w-md">
                            <div className="relative group">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 group-focus-within:text-orange-500 transition-colors" size={18} />
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder="Search food, restaurants..."
                                    className={`w-full pl-10 pr-4 py-2 border rounded-full focus:outline-none focus:ring-2 focus:ring-orange-500 focus:shadow-sm transition-all duration-300 backdrop-blur-md ${isDarkMode
                                        ? 'bg-gray-800/40 border-gray-700/50 text-white placeholder-gray-400 focus:bg-gray-800/80'
                                        : 'bg-white/40 border-white/50 text-gray-900 placeholder-gray-500 focus:bg-white/80'
                                        }`}
                                />
                            </div>
                        </div>

                        {/* Right Icons */}
                        <div className="flex items-center gap-2">
                            {/* Cart Button */}
                            <button
                                onClick={() => navigate('/cart')}
                                className={`relative p-2 rounded-lg transition hover:shadow-sm hover:-translate-y-0.5 ${isDarkMode ? 'hover:bg-gray-800/50 text-gray-300' : 'hover:bg-white/50 text-gray-600'}`}
                            >
                                <ShoppingCart size={20} />
                                {cart.length > 0 && (
                                    <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-orange-500 text-[10px] font-bold text-white shadow-sm ring-1 ring-white">
                                        {cart.reduce((s, i) => s + i.quantity, 0)}
                                    </span>
                                )}
                            </button>

                            {/* Notification Bell */}
                            <div className="relative">
                                <button
                                    onClick={() => setNotificationDropdown(!notificationDropdown)}
                                    className={`relative p-2 rounded-lg transition hover:shadow-sm hover:-translate-y-0.5 ${isDarkMode ? 'hover:bg-gray-800/50 text-gray-300' : 'hover:bg-white/50 text-gray-600'}`}
                                >
                                    <Bell size={20} />
                                    {unreadCount > 0 && (
                                        <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white shadow-sm ring-1 ring-white">
                                            {unreadCount}
                                        </span>
                                    )}
                                </button>
                                {notificationDropdown && (
                                    <div className={`absolute right-0 mt-2 w-96 border rounded-2xl shadow-2xl p-0 animate-fade-in flex flex-col z-50 backdrop-blur-3xl overflow-hidden ${isDarkMode ? 'bg-gray-900/95 border-gray-700/50' : 'bg-white/95 border-white/50'
                                        }`}>
                                        <div className="p-4 border-b flex justify-between items-center" style={{ borderColor: isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }}>
                                            <h3 className={`font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Notifications</h3>
                                            {unreadCount > 0 && (
                                                <span className="bg-orange-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                                                    {unreadCount} New
                                                </span>
                                            )}
                                        </div>
                                        <div className="max-h-80 overflow-y-auto w-full">
                                            {notifications.length > 0 ? notifications.map((notif, idx) => (
                                                <div key={idx} className={`p-4 border-b transition-colors ${isDarkMode ? 'border-gray-800 hover:bg-gray-800/80' : 'border-gray-100 hover:bg-gray-50'}`}>
                                                    <div className="flex gap-3">
                                                        <div className={`mt-1 p-2 rounded-lg flex-shrink-0 h-8 w-8 flex items-center justify-center ${notif.status === 'delivered' ? 'bg-green-100 text-green-600 dark:bg-green-500/20 dark:text-green-400' :
                                                            notif.status === 'cancelled' ? 'bg-red-100 text-red-600 dark:bg-red-500/20 dark:text-red-400' :
                                                                notif.type === 'system' ? 'bg-blue-100 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400' :
                                                                    'bg-orange-100 text-orange-600 dark:bg-orange-500/20 dark:text-orange-400'
                                                            }`}>
                                                            {notif.status === 'delivered' ? <CheckCircle size={14} /> :
                                                                notif.status === 'cancelled' ? <X size={14} /> :
                                                                    notif.type === 'system' ? <Info size={14} /> :
                                                                        <Clock size={14} />}
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <div className="flex justify-between items-start mb-0.5">
                                                                <h4 className={`font-semibold text-sm truncate pr-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{notif.title}</h4>
                                                                <span className={`text-[10px] whitespace-nowrap font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>{formatNotifTime(notif.time)}</span>
                                                            </div>
                                                            <p className={`text-xs leading-relaxed ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>{notif.message}</p>
                                                        </div>
                                                    </div>
                                                </div>
                                            )) : (
                                                <div className="flex flex-col items-center justify-center text-center p-8">
                                                    <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-3 ${isDarkMode ? 'bg-gray-800' : 'bg-gray-100'}`}>
                                                        <Bell size={20} className={isDarkMode ? 'text-gray-600' : 'text-gray-400'} />
                                                    </div>
                                                    <p className={`text-sm font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>No notifications yet</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </header>

                {/* PAGE CONTENT */}
                <main className="p-4 md:p-8 pb-20">
                    {/* Error/Success Messages - Floating Toast */}
                    {(error || message) && (
                        <div className={`fixed top-24 right-6 z-[100] min-w-[300px] rounded-2xl border px-4 py-3 text-sm shadow-xl flex items-center justify-between animate-fade-in font-medium transition-all ${messageType === 'success'
                            ? 'border-green-200 bg-green-50 text-green-700 shadow-green-500/20'
                            : 'border-red-200 bg-red-50 text-red-700 shadow-red-500/20'
                            }`}>
                            <div className="flex items-center gap-3">
                                <div className={`flex items-center justify-center w-8 h-8 rounded-full ${messageType === 'success' ? 'bg-green-100' : 'bg-red-100'}`}>
                                    {messageType === 'success' ? <Check size={18} className="text-green-600" /> : <AlertCircle size={18} className="text-red-600" />}
                                </div>
                                <span className="pr-4">{message || error}</span>
                                {retryCount > 0 && <span className="text-xs ml-1 opacity-75">(Attempt {retryCount}/{MAX_RETRIES})</span>}
                            </div>
                            <button
                                onClick={() => {
                                    setMessage("")
                                    setError("")
                                }}
                                className="ml-2 hover:bg-black/5 p-1.5 rounded-full transition-colors flex-shrink-0"
                            >
                                <X size={16} className={messageType === 'success' ? 'text-green-600' : 'text-red-600'} />
                            </button>
                        </div>
                    )}

                    {error && (
                        <button
                            onClick={handleRetry}
                            className="mb-4 inline-flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-lg font-semibold hover:bg-orange-600 transition"
                        >
                            Retry Loading Data
                        </button>
                    )}

                    {activeTab === "dashboard" && (
                        <div className="max-w-7xl mx-auto space-y-6 animate-fade-in">
                            {/* Lightweight Greeting Section */}
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mt-2">
                                <div>
                                    <h1 className="text-xl md:text-2xl font-bold text-gray-900">Hello, {userName}! 👋</h1>
                                    <p className="text-gray-500 text-xs mt-1">
                                        Find your favorite campus meals & late-night snacks instantly.
                                    </p>
                                </div>
                                <button onClick={() => navigate("/orders")} className="bg-orange-50 text-orange-600 px-4 py-1.5 rounded-full text-xs font-semibold hover:bg-orange-100 transition-all flex items-center gap-2 w-max">
                                    <MapPin size={14} /> View My Orders
                                </button>
                            </div>

                            {/* Promotional Banner / Slider */}
                            <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="md:col-span-2 bg-gradient-to-r from-orange-50 to-orange-100 rounded-2xl p-5 md:p-6 shadow-sm relative overflow-hidden border border-orange-200/50">
                                    <div className="absolute -right-6 -top-6 w-32 h-32 bg-orange-200 rounded-full opacity-40"></div>
                                    <div className="absolute -right-10 bottom-0 w-40 h-40 bg-orange-300 rounded-full opacity-20"></div>
                                    <div className="relative">
                                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-orange-100/80 text-[10px] font-bold text-orange-700 mb-2">
                                            <Percent size={12} /> Limited Time Student Deal
                                        </div>
                                        <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-1.5 tracking-tight">
                                            Up to 10% OFF on late-night orders
                                        </h2>
                                        <p className="text-xs text-gray-600 mb-4 max-w-lg leading-relaxed">
                                            Use code <span className="font-bold text-orange-600">BITE10</span> at checkout on
                                            orders after 9 PM. Perfect for study sessions and group projects.
                                        </p>
                                        <button className="inline-flex items-center gap-2 bg-orange-500 text-white px-4 py-2 rounded-full text-xs font-bold hover:bg-orange-600 hover:shadow-md hover:-translate-y-0.5 transition-all shadow-sm">
                                            Claim Offer <ArrowRight size={14} />
                                        </button>
                                    </div>
                                </div>
                                <div className="bg-white rounded-2xl p-4 shadow-sm flex flex-col justify-between border border-gray-100">
                                    <div>
                                        <h3 className="text-sm font-bold text-gray-900 mb-0.5">Delivery ETA</h3>
                                        <p className="text-xs text-gray-500 mb-3">Average time to your campus</p>
                                        <div className="space-y-2.5">
                                            <div>
                                                <div className="flex justify-between text-[10px] text-gray-500 mb-1">
                                                    <span>Current Status</span>
                                                    <span className="font-bold text-orange-600">10 min</span>
                                                </div>
                                                <div className="h-1.5 rounded-full bg-gray-50 overflow-hidden border border-gray-100">
                                                    <div className="h-full w-3/4 rounded-full bg-gradient-to-r from-orange-500 to-orange-400"></div>
                                                </div>
                                            </div>
                                            <div>
                                                <div className="flex justify-between text-[10px] text-gray-500 mb-1">
                                                    <span>Peak Record</span>
                                                    <span className="font-bold text-emerald-600">5 min</span>
                                                </div>
                                                <div className="h-1.5 rounded-full bg-gray-50 overflow-hidden border border-gray-100">
                                                    <div className="h-full w-2/3 rounded-full bg-gradient-to-r from-emerald-500 to-emerald-400"></div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="mt-3 flex items-center gap-1.5 text-[10px] text-gray-400 font-medium">
                                        <Truck size={12} className="text-orange-400" /> Real-time tracking enabled.
                                    </div>
                                </div>
                            </section>

                            {/* Special Offers */}
                            <section>
                                <h2 className="text-lg font-bold text-gray-900 mb-2">Special Offers</h2>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                    <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-3 text-white">
                                        <Zap className="mb-1.5" size={20} />
                                        <h3 className="font-bold text-sm mb-0.5">Flash Sale</h3>
                                        <p className="text-blue-100 text-[11px] mb-2.5">50% off selected items</p>
                                        <button className="bg-white text-blue-600 px-2.5 py-1 rounded-lg text-[11px] font-semibold hover:bg-blue-50 transition">
                                            Shop Now
                                        </button>
                                    </div>
                                    <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-2xl p-3 text-white">
                                        <Star className="mb-1.5" size={20} />
                                        <h3 className="font-bold text-sm mb-0.5">Top Rated</h3>
                                        <p className="text-green-100 text-[11px] mb-2.5">Most popular this week</p>
                                        <button className="bg-white text-green-600 px-2.5 py-1 rounded-lg text-[11px] font-semibold hover:bg-green-50 transition">
                                            Explore
                                        </button>
                                    </div>
                                    <div className="bg-gradient-to-br from-pink-500 to-pink-600 rounded-2xl p-3 text-white">
                                        <TrendingUp className="mb-1.5" size={20} />
                                        <h3 className="font-bold text-sm mb-0.5">Trending</h3>
                                        <p className="text-pink-100 text-[11px] mb-2.5">What everyone is ordering</p>
                                        <button className="bg-white text-pink-600 px-2.5 py-1 rounded-lg text-[11px] font-semibold hover:bg-pink-50 transition">
                                            Discover
                                        </button>
                                    </div>
                                </div>
                            </section>

                            {/* Featured Restaurants Carousel */}
                            <section>
                                <div className="flex items-center justify-between mb-3">
                                    <h2 className="text-xl font-bold text-gray-900 tracking-tight">Featured Restaurants</h2>
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => handleFeaturedScroll("prev")}
                                            className="p-2 rounded-full border border-gray-200 text-gray-500 hover:bg-gray-50 hover:text-gray-700 transition"
                                            aria-label="Previous restaurants"
                                        >
                                            <ChevronRight className="rotate-180" size={18} />
                                        </button>
                                        <button
                                            onClick={() => handleFeaturedScroll("next")}
                                            className="p-2 rounded-full border border-gray-200 text-gray-500 hover:bg-gray-50 hover:text-gray-700 transition"
                                            aria-label="Next restaurants"
                                        >
                                            <ChevronRight size={18} />
                                        </button>
                                    </div>
                                </div>
                                <div
                                    ref={featuredRef}
                                    className="flex gap-4 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent scroll-smooth"
                                >
                                    {restaurants.map((restaurant) => (
                                        <div
                                            key={restaurant.id}
                                            className="min-w-[220px] max-w-[220px] bg-white border border-gray-100 rounded-xl overflow-hidden hover:shadow-md hover:-translate-y-0.5 transition-all cursor-pointer group"
                                        >
                                            <div className="h-32 w-full overflow-hidden bg-gray-50">
                                                <img
                                                    src={restaurant.image}
                                                    alt={restaurant.name}
                                                    className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500"
                                                />
                                            </div>
                                            <div className="p-3">
                                                <h3 className="font-bold text-gray-900 text-xs mb-0.5 truncate group-hover:text-orange-600 transition-colors">
                                                    {restaurant.name}
                                                </h3>
                                                <p className="text-[10px] text-gray-500 mb-2">{restaurant.cuisine}</p>
                                                <div className="flex items-center justify-between text-[10px] mb-2">
                                                    <div className="flex items-center gap-0.5">
                                                        <Star size={12} className="text-yellow-400 fill-yellow-400" />
                                                        <span className={`font-black ${isDarkMode ? 'text-white' : 'text-black'}`}>
                                                            {restaurant.rating}
                                                        </span>
                                                        <span className={`${isDarkMode ? 'text-gray-300' : 'text-gray-950'} font-bold`}>({restaurant.reviews})</span>
                                                    </div>
                                                </div>
                                                <div className={`flex items-center justify-between text-[11px] font-bold ${isDarkMode ? 'text-gray-100' : 'text-black'}`}>
                                                    <span className="flex items-center gap-1">
                                                        <Clock size={11} /> {restaurant.deliveryTime} min
                                                    </span>
                                                    <span className="flex items-center gap-1">
                                                        <MapPin size={11} /> {restaurant.distance}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </section>

                            {/* ====== EXPLORE MENU ====== */}
                            <section ref={browseFoodRef} className="scroll-mt-24">
                                {/* Header */}
                                <div className="mb-3">
                                    <h2 className={`text-xl font-black mb-0.5 ${isDarkMode ? 'text-white' : 'text-black'} tracking-tight`}>Explore Menu</h2>
                                    <p className={`text-[12px] font-bold ${isDarkMode ? 'text-gray-100' : 'text-black'}`}>Browse all dishes from every restaurant on campus</p>
                                </div>

                                {/* Category Pills */}
                                <div className="mb-4">
                                    <p className={`text-[10px] font-black uppercase tracking-[2px] mb-2 ${isDarkMode ? 'text-orange-400' : 'text-black'}`}>Filter &amp; Categories</p>
                                    <div className="flex flex-wrap gap-2">
                                        {['All', 'Main', 'Drinks', 'Snack', 'Dessert', 'Budget Meal', ...categories.map(c => c.name)]
                                            .filter((v, i, a) => a.indexOf(v) === i)
                                            .map(cat => (
                                                <button
                                                    key={cat}
                                                    onClick={() => setActiveCategoryFilter(cat)}
                                                    className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-semibold border transition-all ${activeCategoryFilter === cat
                                                        ? 'bg-orange-500 text-white border-orange-500 shadow-sm shadow-orange-200'
                                                        : isDarkMode
                                                            ? 'bg-gray-800 text-white border-gray-700 hover:bg-gray-700'
                                                            : 'bg-white text-black border-gray-200 hover:bg-gray-50'
                                                        }`}
                                                >
                                                    {cat === 'All' && <Grid3x3 size={13} />}
                                                    {cat}
                                                </button>
                                            ))}
                                    </div>
                                </div>

                                {/* Filter Bar */}
                                <div className={`flex flex-wrap gap-3 items-center mb-6 p-3 rounded-2xl border ${isDarkMode ? 'bg-gray-800/50 border-gray-700' : 'bg-white border-gray-100 shadow-sm'
                                    }`}>
                                    {/* Price Range */}
                                    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-sm ${isDarkMode ? 'bg-gray-700 border-gray-600 text-gray-200' : 'bg-gray-50 border-gray-200 text-gray-700'
                                        }`}>
                                        <span className="font-medium text-xs">Price Range</span>
                                        <input
                                            type="range" min="5" max="2000" value={priceFilter}
                                            onChange={(e) => setPriceFilter(Number(e.target.value))}
                                            className="w-20 accent-orange-500"
                                        />
                                        <span className="text-orange-600 font-bold text-xs">{priceFilter === 2000 ? 'Any Price' : `≤₱${priceFilter}`}</span>
                                    </div>

                                    {/* Cuisine */}
                                    <select
                                        value={cuisineFilter}
                                        onChange={e => setCuisineFilter(e.target.value)}
                                        className={`px-3 py-1.5 rounded-xl border text-sm font-medium transition ${isDarkMode ? 'bg-gray-700 border-gray-600 text-gray-200' : 'bg-gray-50 border-gray-200 text-gray-700'
                                            }`}
                                    >
                                        <option value="All">Cuisine: All</option>
                                        {[...new Set(popularFoods.map(f => f.category).filter(Boolean))].map(c => (
                                            <option key={c} value={c}>{c}</option>
                                        ))}
                                    </select>

                                    {/* Rating */}
                                    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-sm ${isDarkMode ? 'bg-gray-700 border-gray-600 text-gray-200' : 'bg-gray-50 border-gray-200 text-gray-700'
                                        }`}>
                                        <span className="text-xs font-medium">Rating (1–5)</span>
                                        <div className="flex gap-0.5">
                                            {[1, 2, 3, 4, 5].map(n => (
                                                <button key={n} onClick={() => setMinRating(minRating === n ? 0 : n)}>
                                                    <Star size={14} className={n <= minRating ? 'text-yellow-400 fill-yellow-400' : isDarkMode ? 'text-gray-600 fill-gray-600' : 'text-gray-300 fill-gray-300'} />
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <span className={`ml-auto text-xs font-black uppercase tracking-widest ${isDarkMode ? 'text-gray-100' : 'text-black'}`}>
                                        {filteredFoods.length} of {popularFoods.length} items
                                    </span>
                                </div>

                                {/* Main Content Layout */}
                                <div className="w-full">
                                    {/* Main Food Grid */}
                                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-5">
                                        {filteredFoods.length === 0 ? (
                                            <div className="col-span-full flex flex-col items-center justify-center py-20 gap-3">
                                                <Utensils size={40} className="text-gray-300" />
                                                <p className={`font-semibold text-lg ${isDarkMode ? 'text-gray-400' : 'text-gray-400'}`}>No menu items found</p>
                                                <p className={`text-sm ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}>Try adjusting your filters or check back later</p>
                                            </div>
                                        ) : filteredFoods.map((food) => {
                                            const isOOS = food.current_stock !== null && food.current_stock !== undefined && food.current_stock <= 0;
                                            const isLowStock = !isOOS && food.daily_stock > 0 && food.current_stock !== null && (food.current_stock / food.daily_stock) <= 0.25;
                                            const stockLabel = food.daily_stock !== null && food.daily_stock >= 0
                                                ? isOOS ? 'Out of Stock'
                                                    : isLowStock ? `Low: ${food.current_stock} left`
                                                        : `${food.current_stock} left`
                                                : null;

                                            return (
                                                <div
                                                    key={food.id}
                                                    onMouseEnter={() => setHoveredFoodId(food.id)}
                                                    onMouseLeave={() => setHoveredFoodId(null)}
                                                    className={`relative border rounded-2xl overflow-hidden transition-all duration-300 cursor-pointer group flex flex-col h-full ${isOOS
                                                        ? isDarkMode ? 'bg-gray-800/30 border-gray-800 opacity-75' : 'bg-gray-50 border-gray-100 opacity-75'
                                                        : isDarkMode
                                                            ? 'bg-gray-800/50 border-gray-800 hover:border-gray-700 hover:shadow-xl hover:shadow-black/20 hover:-translate-y-1'
                                                            : 'bg-white border-gray-100/50 shadow-sm hover:shadow-xl hover:shadow-gray-200/40 hover:border-gray-200 hover:-translate-y-1'
                                                        }`}
                                                >
                                                    {/* Food Image */}
                                                    <div className="relative h-32 overflow-hidden bg-gray-50">
                                                        <img
                                                            src={food.image}
                                                            alt={food.name}
                                                            className={`w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ${isOOS ? 'grayscale' : ''}`}
                                                            onError={e => e.target.style.display = 'none'}
                                                        />
                                                        {/* Favorite */}
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); toggleFavorite(food.id); }}
                                                            className="absolute top-2 right-2 p-1.5 rounded-full bg-white shadow-md hover:scale-110 transition-transform z-10"
                                                        >
                                                            <Heart size={14} className={favorites.has(food.id) ? 'text-red-500 fill-red-500' : 'text-gray-950'} />
                                                        </button>
                                                        {food.discount > 0 && (
                                                            <div className="absolute top-2 left-2 bg-red-600 text-white text-[10px] font-black px-2 py-0.5 rounded-full shadow-sm">
                                                                -{food.discount}%
                                                            </div>
                                                        )}
                                                        {stockLabel && (
                                                            <div className={`absolute bottom-1.5 left-1.5 text-[9px] font-bold px-1.5 py-0.5 rounded-full backdrop-blur-sm ${isOOS ? 'bg-red-600/90 text-white'
                                                                : isLowStock ? 'bg-orange-500/90 text-white'
                                                                    : 'bg-emerald-600/90 text-white'
                                                                }`}>
                                                                {stockLabel}
                                                            </div>
                                                        )}
                                                        {isOOS && (
                                                            <div className="absolute inset-0 flex items-center justify-center bg-gray-900/30 backdrop-blur-[1px]">
                                                                <span className="bg-red-600 text-white text-[10px] font-black px-3 py-1 rounded-full shadow-md">
                                                                    OUT OF STOCK
                                                                </span>
                                                            </div>
                                                        )}
                                                    </div>

                                                    <div className="p-2.5" onClick={() => { if (!isOOS) { setSelectedFood(food); setSelectedModalSize('Medium'); setShowFoodModal(true); } }}>
                                                        <div className="flex items-start justify-between gap-2 mb-1">
                                                            <h3 className={`font-bold text-[13px] leading-tight truncate flex-1 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{food.name}</h3>
                                                            <div className={`flex items-center gap-1 flex-shrink-0 px-1.5 py-0.5 rounded-md border ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-100'}`}>
                                                                <Star size={10} className="text-yellow-400 fill-yellow-400" />
                                                                <span className={`text-[10px] font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{food.rating > 0 ? food.rating : 'New'}</span>
                                                                {food.reviews > 0 && (
                                                                    <span className={`text-[9px] font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>({food.reviews})</span>
                                                                )}
                                                            </div>
                                                        </div>
                                                        <p className={`text-[11px] font-medium mb-3 truncate ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                                            {food.description || food.restaurant}
                                                        </p>

                                                        <div className="flex items-end justify-between mb-1 mt-auto">
                                                            <div className="flex flex-col">
                                                                {food.category === 'Drinks' ? (
                                                                    <>
                                                                        <span className={`text-[9.5px] font-semibold px-2 py-0.5 rounded-md mb-1 w-fit ${isDarkMode ? 'bg-blue-500/10 text-blue-400' : 'bg-blue-50/80 text-blue-600'
                                                                            }`}>🧋 View Sizes</span>
                                                                        <span className={`text-sm font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                                                            ₱{Number(food.half_price || food.price || 0).toFixed(2)}–₱{Number(food.large_price || food.price || 0).toFixed(2)}
                                                                        </span>
                                                                    </>
                                                                ) : food.category === 'Budget Meal' ? (
                                                                    <>
                                                                        <span className={`text-[9.5px] font-semibold px-2 py-0.5 rounded-md mb-1 w-fit ${isDarkMode ? 'bg-purple-500/10 text-purple-400' : 'bg-purple-50/80 text-purple-600'
                                                                            }`}>🍱 Combo</span>
                                                                        <span className={`text-sm font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                                                            From ₱{Number(food.price || 0).toFixed(2)}
                                                                        </span>
                                                                    </>
                                                                ) : (
                                                                    <span className={`text-sm font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                                                        ₱{((food.price || 0) * (1 - (food.discount || 0) / 100)).toFixed(2)}
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div className="px-3 pb-3 mt-auto flex gap-2">
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); addToCart(food, null, false); }}
                                                            disabled={isOOS}
                                                            className={`w-10 h-10 shrink-0 flex items-center justify-center rounded-xl transition-all ${isOOS
                                                                ? 'bg-gray-100 text-gray-400 cursor-not-allowed border border-transparent'
                                                                : isDarkMode
                                                                    ? 'bg-orange-500/10 border border-orange-500/20 text-orange-400 hover:bg-orange-500/20'
                                                                    : 'bg-orange-50 border border-orange-200 text-orange-600 hover:bg-orange-100'
                                                                }`}
                                                        >
                                                            <ShoppingCart size={16} strokeWidth={2.5} />
                                                        </button>
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); addToCart(food, null, true); }}
                                                            disabled={isOOS}
                                                            className={`flex-1 flex items-center justify-center text-[11px] font-semibold py-2 rounded-xl transition-all shadow-sm ${isOOS
                                                                ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                                                                : 'bg-gray-900 text-white hover:bg-black hover:shadow-md dark:bg-orange-500 dark:text-white dark:hover:bg-orange-600'
                                                                }`}
                                                        >
                                                            {food.category === 'Budget Meal' ? 'Order' : 'Checkout'}
                                                        </button>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            </section>

                            {/* Nearby Restaurants */}
                            <section>
                                <div className="flex items-center justify-between mb-3">
                                    <h2 className="text-xl font-bold text-gray-900">Nearby Restaurants</h2>
                                    <div className="flex items-center gap-2 text-[10px] text-gray-500">
                                        <span>Max distance</span>
                                        <input
                                            type="range"
                                            min="1"
                                            max="10"
                                            value={maxDistance}
                                            onChange={(e) => setMaxDistance(Number(e.target.value))}
                                            className="accent-orange-500 w-16"
                                        />
                                        <span className="text-gray-700 font-semibold">{maxDistance} km</span>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    {filteredRestaurants.map((restaurant) => (
                                        <div key={restaurant.id} className="bg-white rounded-xl border border-gray-100 hover:shadow-sm transition overflow-hidden">
                                            <div
                                                onClick={() => setExpandedRestaurantId(expandedRestaurantId === restaurant.id ? null : restaurant.id)}
                                                className="flex items-center gap-3 p-3 cursor-pointer"
                                            >
                                                <img
                                                    src={restaurant.image}
                                                    alt={restaurant.name}
                                                    className="flex-shrink-0 w-14 h-14 rounded-lg object-cover"
                                                    onError={(e) => {
                                                        e.target.style.display = 'none';
                                                    }}
                                                />
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex justify-between items-start">
                                                        <h3 className="font-bold text-gray-900 text-sm truncate">{restaurant.name}</h3>
                                                        <span className="text-gray-400 p-1">
                                                            {expandedRestaurantId === restaurant.id ? <ChevronDown size={14} className="rotate-180 transition-transform" /> : <ChevronDown size={14} className="transition-transform" />}
                                                        </span>
                                                    </div>
                                                    <p className="text-[10px] text-gray-500 truncate">{restaurant.cuisines ? restaurant.cuisines.join(', ') : (restaurant.cuisine || restaurant.type || 'Restaurant')}</p>
                                                    <div className="flex items-center gap-2 mt-0.5 text-[10px]">
                                                        <Star size={10} className="text-yellow-400 fill-yellow-400" />
                                                        <span className="font-semibold">{restaurant.rating}</span>
                                                        <span className="text-gray-400">({restaurant.reviews})</span>
                                                        <span className="text-gray-400">•</span>
                                                        <Clock size={10} className="text-gray-400" />
                                                        <span className="text-gray-400">{restaurant.deliveryTime} min</span>
                                                    </div>
                                                </div>
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); setExpandedRestaurantId(restaurant.id); browseFoodRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }); }}
                                                    className="px-3 py-1.5 bg-orange-500 text-white rounded-lg text-xs font-semibold hover:bg-orange-600 transition hidden md:block"
                                                >
                                                    Order
                                                </button>
                                            </div>

                                            {/* Expanded Content */}
                                            {expandedRestaurantId === restaurant.id && (
                                                <div className="p-4 pt-0 border-t border-gray-100 bg-gray-50/50 animate-fade-in flex flex-col">
                                                    {/* Restaurant Cover Photo inner banner */}
                                                    <div className="w-full h-32 md:h-48 mt-4 rounded-xl overflow-hidden shadow-sm flex-shrink-0 bg-gray-200 border border-gray-200">
                                                        <img src={restaurant.image} className="w-full h-full object-cover hover:scale-105 transition-transform duration-500" alt={restaurant.name} onError={(e) => e.target.style.display = 'none'} />
                                                    </div>

                                                    <div className="mb-4 pt-4 text-sm text-gray-600 flex flex-col gap-2">
                                                        {restaurant.description && <p className="leading-relaxed">{restaurant.description}</p>}
                                                        <div className="flex flex-wrap gap-3 mt-1 text-xs">
                                                            {restaurant.address && <span className="flex items-center gap-1 font-medium bg-white px-2 py-1 p-2 rounded-lg border border-gray-100"><MapPin size={14} className="text-orange-500" /> {restaurant.address}</span>}
                                                            {restaurant.phone && <span className="flex items-center gap-1 font-medium bg-white px-2 py-1 p-2 rounded-lg border border-gray-100">📞 {restaurant.phone}</span>}
                                                        </div>
                                                    </div>
                                                    <h4 className="font-bold text-gray-900 mb-3 text-sm">Popular Menu Items</h4>
                                                    <div className="space-y-2">
                                                        {popularFoods.filter(f => f.restaurant === restaurant.name).length > 0 ? (
                                                            popularFoods.filter(f => f.restaurant === restaurant.name).slice(0, 4).map(food => (
                                                                <div key={food.id} className="flex justify-between items-center bg-white p-3 rounded-xl border border-gray-100 shadow-sm">
                                                                    <div className="flex items-center gap-3">
                                                                        <img src={food.image} className="w-12 h-12 rounded-lg object-cover" alt={food.name} onError={(e) => { e.target.style.display = 'none'; }} />
                                                                        <div>
                                                                            <h5 className="font-bold text-sm text-gray-900">{food.name}</h5>
                                                                            <div className="flex flex-col">
                                                                                <p className="text-sm font-bold text-gray-800">₱{food.price}</p>
                                                                                <p className="text-xs text-gray-500">₱{(food.price * (1 - (food.discount || 0) / 100)).toFixed(2)}</p>
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                    <button onClick={(e) => { e.stopPropagation(); addToCart(food); }} className="p-2 bg-orange-50 text-orange-600 rounded-lg hover:bg-orange-100 transition">
                                                                        <Plus size={16} />
                                                                    </button>
                                                                </div>
                                                            ))
                                                        ) : (
                                                            <p className="text-xs text-gray-400 italic">Menu items currently unavailable.</p>
                                                        )}
                                                    </div>
                                                    <div className="mt-4 flex justify-end">
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); setSelectedRestaurant(restaurant); setShowRestaurantDialog(true); }}
                                                            className="px-5 py-2.5 bg-orange-500 text-white rounded-xl font-semibold hover:bg-orange-600 transition shadow-sm hover:shadow-orange-500/30 w-full md:w-auto mt-2"
                                                        >
                                                            View All Items
                                                        </button>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </section>


                        </div>
                    )}



                    {/* Profile Tab */}
                    {activeTab === "profile" && (
                        <div className="max-w-7xl mx-auto space-y-6 animate-fade-in">
                            <section className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-2xl p-6 md:p-8 text-white shadow-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                                <div className="min-w-0 flex-1">
                                    <h3 className="text-xl md:text-2xl font-bold mb-1">Profile of {userName}</h3>
                                    <p className="text-orange-100 text-xs mb-4 max-w-xl">
                                        View your campus dining analytics, default delivery addresses, and recent activity.
                                    </p>
                                    <div className="flex flex-wrap items-center gap-3">
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setProfileDropdown(false)
                                                document.getElementById("user-activity")?.scrollIntoView({ behavior: "smooth", block: "start" })
                                            }}
                                            className="bg-white text-orange-600 px-6 py-2.5 rounded-full text-sm font-semibold flex items-center gap-2 hover:bg-orange-50 hover:shadow-md hover:-translate-y-0.5 transition-all"
                                        >
                                            <LayoutDashboard size={18} /> Dashboard
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setActiveTab("dashboard")
                                                setProfileDropdown(false)
                                                setTimeout(() => browseFoodRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 100)
                                            }}
                                            className="bg-orange-500/20 text-white px-6 py-2.5 flex items-center gap-2 rounded-full text-sm font-semibold hover:bg-orange-500/30 hover:shadow-md hover:-translate-y-0.5 transition-all"
                                        >
                                            <Utensils size={18} /> Browse Food
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setActiveTab("orders")}
                                            className="bg-orange-500/20 text-white px-4 py-2.5 flex items-center gap-2 rounded-full text-sm font-medium hover:bg-orange-500/30 transition-all"
                                        >
                                            <Package size={18} /> View Orders
                                        </button>
                                    </div>
                                </div>
                                <div className="grid grid-cols-3 gap-3 w-full md:w-auto md:min-w-[280px]">
                                    <div className="bg-white/10 rounded-2xl px-3 py-3 sm:px-4 backdrop-blur-sm">
                                        <p className="text-[10px] sm:text-xs text-orange-100">Active Orders</p>
                                        <p className="text-xl sm:text-2xl font-bold tabular-nums">{profileActivityMetrics.activeOrdersCount}</p>
                                    </div>
                                    <div className="bg-white/10 rounded-2xl px-3 py-3 sm:px-4 backdrop-blur-sm">
                                        <p className="text-[10px] sm:text-xs text-orange-100">Saved Items</p>
                                        <p className="text-xl sm:text-2xl font-bold tabular-nums">{favorites.size}</p>
                                    </div>
                                    <div className="bg-white/10 rounded-2xl px-3 py-3 sm:px-4 backdrop-blur-sm">
                                        <p className="text-[10px] sm:text-xs text-orange-100">This Week</p>
                                        <p className="text-lg sm:text-2xl font-bold tabular-nums">
                                            ₱{Math.round(profileActivityMetrics.thisWeekSpent).toLocaleString()}
                                        </p>
                                    </div>
                                </div>
                            </section>

                            <h2 className="text-xl font-bold text-gray-900 mb-2">My Profile</h2>

                            {userProfile && (
                                <section className="bg-white border border-gray-100 shadow-sm rounded-3xl p-6 md:p-8">
                                    <h3 className="font-bold text-gray-900 text-xl mb-4">Account Details</h3>
                                    <div className="space-y-4 max-w-lg">
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-500 mb-1">Full Name</label>
                                                <p className="font-semibold text-gray-800 bg-gray-50 p-3 rounded-xl border border-gray-100">{userProfile.full_name || "N/A"}</p>
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-500 mb-1">Email</label>
                                                <p className="font-semibold text-gray-800 bg-gray-50 p-3 rounded-xl border border-gray-100 truncate" title={userProfile.email}>{userProfile.email || "N/A"}</p>
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-500 mb-1">Academic Department</label>
                                            <p className="font-semibold text-gray-800 bg-gray-50 p-3 rounded-xl border border-gray-100">
                                                {userProfile.department || "N/A"}
                                            </p>
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-500 mb-1">Course / Program</label>
                                                <p className="font-semibold text-gray-800 bg-gray-50 p-3 rounded-xl border border-gray-100">
                                                    {userProfile.course || "N/A"}
                                                </p>
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-500 mb-1">Academic Year</label>
                                                <p className="font-semibold text-gray-800 bg-gray-50 p-3 rounded-xl border border-gray-100">
                                                    {userProfile.year || "N/A"}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </section>
                            )}

                            <UserActivityAnalytics orders={orders} isDarkMode={isDarkMode} />

                            <section className="bg-white border border-gray-100 shadow-sm rounded-3xl p-6 md:p-8">
                                <h3 className="font-bold text-gray-900 text-xl mb-4">Saved Contact Data</h3>
                                <div className="space-y-4 max-w-lg">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-500 mb-1">Default Delivery Address</label>
                                        <input
                                            type="text"
                                            value={checkoutInfo.deliveryAddress}
                                            onChange={(e) => setCheckoutInfo(prev => ({ ...prev, deliveryAddress: e.target.value }))}
                                            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none transition"
                                            placeholder="Enter your address"
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-500 mb-1">Default City</label>
                                            <input
                                                type="text"
                                                value={checkoutInfo.deliveryCity}
                                                onChange={(e) => setCheckoutInfo(prev => ({ ...prev, deliveryCity: e.target.value }))}
                                                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none transition"
                                                placeholder="Enter your city"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-500 mb-1">Phone Number</label>
                                            <input
                                                type="tel"
                                                value={checkoutInfo.phone}
                                                onChange={(e) => setCheckoutInfo(prev => ({ ...prev, phone: e.target.value }))}
                                                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none transition"
                                                placeholder="Enter your phone"
                                            />
                                        </div>
                                    </div>

                                    <div className="pt-4">
                                        <button
                                            onClick={async () => {
                                                try {
                                                    const res = await apiClient.put('/api/profile', {
                                                        address: checkoutInfo.deliveryAddress,
                                                        city: checkoutInfo.deliveryCity,
                                                        phone: checkoutInfo.phone
                                                    });
                                                    if (res.data?.success) {
                                                        setMessage("Profile contact data saved successfully!");
                                                        setMessageType("success");
                                                    }
                                                } catch (err) {
                                                    setMessage(err.response?.data?.message || err.message || "Failed to update profile");
                                                    setMessageType("error");
                                                }
                                            }}
                                            className="w-full md:w-auto px-6 py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-xl font-bold hover:shadow-lg hover:shadow-orange-500/30 hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2"
                                        >
                                            <Check size={18} /> Save Contact Data
                                        </button>
                                    </div>
                                </div>
                            </section>

                            <section className="bg-white border border-gray-100 shadow-sm rounded-3xl p-6 md:p-8">
                                <h3 className="font-bold text-gray-900 text-xl mb-4">App Preferences</h3>
                                <div className="space-y-4 max-w-lg">

                                    {!showLogoutConfirm ? (
                                        <button
                                            onClick={() => setShowLogoutConfirm(true)}
                                            className="w-full text-left px-5 py-3.5 rounded-2xl border border-red-100 hover:border-red-200 hover:bg-red-50 text-sm font-semibold text-red-600 flex items-center justify-between transition-all group"
                                        >
                                            <div className="flex items-center gap-3">
                                                <LogOut size={18} className="text-gray-400 group-hover:text-red-500 transition-colors" /> Logout
                                            </div>
                                            <ChevronRight size={18} className="text-gray-400 group-hover:text-red-500 transition-colors" />
                                        </button>
                                    ) : (
                                        <div className="rounded-2xl border border-red-200 bg-red-50/60 p-5 animate-fade-in">
                                            <div className="flex items-center gap-3 mb-3">
                                                <div className="w-9 h-9 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                                                    <LogOut size={18} className="text-red-500" />
                                                </div>
                                                <div>
                                                    <p className="text-sm font-bold text-gray-900">Are you sure you want to logout?</p>
                                                    <p className="text-xs text-gray-500">You'll need to sign in again to access your account.</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2 ml-12">
                                                <button
                                                    onClick={() => {
                                                        localStorage.removeItem('authToken');
                                                        setMessage("Logged out successfully!");
                                                        setMessageType("success");
                                                        setTimeout(() => navigate("/login"), 600);
                                                    }}
                                                    className="px-4 py-2 bg-red-600 text-white text-xs font-bold rounded-xl hover:bg-red-700 transition-all hover:shadow-md"
                                                >
                                                    Logout
                                                </button>
                                                <button
                                                    onClick={() => setShowLogoutConfirm(false)}
                                                    className="px-4 py-2 bg-white text-gray-600 text-xs font-bold rounded-xl border border-gray-200 hover:bg-gray-50 transition-all"
                                                >
                                                    Cancel
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </section>

                        </div>
                    )}

                    {/* Settings Tab */}
                    {activeTab === "settings" && (
                        <div className="max-w-4xl mx-auto space-y-8 animate-fade-in">
                            <div>
                                <h1 className="text-3xl font-bold text-gray-900 mb-2">Settings</h1>
                                <p className="text-gray-500">Manage your app display, notifications, and security preferences.</p>
                            </div>

                            <div className="space-y-6">
                                {/* Display Preferences */}
                                <section className="bg-white border border-gray-100 shadow-sm rounded-3xl p-6 md:p-8">
                                    <h3 className="font-bold text-gray-900 text-xl mb-4 flex items-center gap-2">
                                        <Sliders size={20} className="text-orange-500" /> Display Preferences
                                    </h3>
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-gray-100">
                                            <div className="flex items-center gap-3">
                                                <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
                                                    {isDarkMode ? <Moon size={20} /> : <Sun size={20} />}
                                                </div>
                                                <div>
                                                    <p className="font-semibold text-gray-900">App Theme</p>
                                                    <p className="text-sm text-gray-500">Toggle between dark mode and light mode</p>
                                                </div>
                                            </div>
                                            <button
                                                onClick={toggleTheme}
                                                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 ${isDarkMode ? 'bg-orange-500' : 'bg-gray-300'}`}
                                            >
                                                <span className={`${isDarkMode ? 'translate-x-6' : 'translate-x-1'} inline-block h-4 w-4 transform rounded-full bg-white transition-transform`} />
                                            </button>
                                        </div>
                                    </div>
                                </section>

                                {/* Notification Settings */}
                                <section className="bg-white border border-gray-100 shadow-sm rounded-3xl p-6 md:p-8">
                                    <h3 className="font-bold text-gray-900 text-xl mb-4 flex items-center gap-2">
                                        <Bell size={20} className="text-orange-500" /> Notification Settings
                                    </h3>
                                    <div className="space-y-3">
                                        {[{
                                            title: "Email Notifications",
                                            desc: "Receive daily promos and order receipts by email",
                                            state: emailNotifs,
                                            setter: setEmailNotifs
                                        }, {
                                            title: "Push Notifications",
                                            desc: "Get instant alerts about your order status directly on your device",
                                            state: pushNotifs,
                                            setter: setPushNotifs
                                        }, {
                                            title: "Order Updates via SMS",
                                            desc: "Text alerts for when your food is arriving",
                                            state: orderUpdates,
                                            setter: setOrderUpdates
                                        }].map((pref, idx) => (
                                            <div key={idx} className="flex items-center justify-between p-4 hover:bg-gray-50 rounded-2xl border border-transparent hover:border-gray-100 transition-colors">
                                                <div>
                                                    <p className="font-semibold text-gray-900">{pref.title}</p>
                                                    <p className="text-sm text-gray-500">{pref.desc}</p>
                                                </div>
                                                <button
                                                    onClick={() => pref.setter(!pref.state)}
                                                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 ${pref.state ? 'bg-orange-500' : 'bg-gray-300'}`}
                                                >
                                                    <span className={`${pref.state ? 'translate-x-6' : 'translate-x-1'} inline-block h-4 w-4 transform rounded-full bg-white transition-transform`} />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </section>

                                {/* Account Data Management */}
                                <section className="bg-white border border-gray-100 shadow-sm rounded-3xl p-6 md:p-8">
                                    <h3 className="font-bold text-gray-900 text-xl mb-4 flex items-center gap-2">
                                        <Settings size={20} className="text-orange-500" /> Account Manage
                                    </h3>
                                    <div className="space-y-3">
                                        <button
                                            onClick={() => {
                                                setMessage("Local cache cleared successfully! App may reload soon.")
                                                setMessageType("success")
                                            }}
                                            className="w-full flex items-center justify-between p-4 hover:bg-gray-50 rounded-2xl border border-gray-100 text-left transition-colors"
                                        >
                                            <div>
                                                <p className="font-semibold text-gray-900">Clear Local App Cache</p>
                                                <p className="text-sm text-gray-500">Free up space and resolve display issues</p>
                                            </div>
                                            <Trash2 size={18} className="text-gray-400" />
                                        </button>

                                    </div>
                                </section>
                            </div>
                        </div>
                    )}

                    {/* Owner / Restaurant Dashboard (only for owners) */}
                    {userRole === "owner" && (
                        <div className="max-w-7xl mx-auto mt-10 space-y-8 animate-fade-in">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h2 className="text-2xl md:text-3xl font-bold text-gray-900">
                                        Restaurant Owner Dashboard
                                    </h2>
                                    <p className="text-sm text-gray-500 mt-1">
                                        Monitor sales, manage your menu, and respond to student customers in real time.
                                    </p>
                                </div>
                                <div className="inline-flex items-center gap-2 rounded-full bg-orange-50 px-3 py-1 text-xs font-medium text-orange-600">
                                    <ChefHat size={14} /> Owner mode
                                </div>
                            </div>

                            {/* Sales Overview Cards */}
                            <section className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                <div className="bg-gradient-to-br from-emerald-500 to-emerald-700 rounded-3xl p-6 shadow-lg shadow-emerald-500/20 text-white relative overflow-hidden">
                                    <div className="absolute -right-4 -top-4 w-24 h-24 bg-white/10 rounded-full blur-2xl"></div>
                                    <div className="flex items-center justify-between mb-4 relative z-10">
                                        <p className="text-emerald-50 font-medium">Total Revenue</p>
                                        <div className="p-2 bg-emerald-400/30 rounded-xl backdrop-blur-md">
                                            <TrendingUp size={20} className="text-white" />
                                        </div>
                                    </div>
                                    <p className="text-3xl font-black relative z-10">$8,450.25</p>
                                    <p className="text-sm text-emerald-100 mt-2 font-medium relative z-10 flex items-center gap-1">
                                        <ArrowRight size={14} className="-rotate-45" /> +12.4% vs last week
                                    </p>
                                </div>

                                <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 transition hover:shadow-md">
                                    <div className="flex items-center justify-between mb-4">
                                        <p className="text-gray-500 font-medium">Active Orders</p>
                                        <div className="p-2 bg-orange-50 text-orange-600 rounded-xl">
                                            <Package size={20} />
                                        </div>
                                    </div>
                                    <p className="text-3xl font-black text-gray-900">{liveOrders.filter(o => o.status !== 'delivered').length}</p>
                                    <p className="text-sm text-gray-500 mt-2 font-medium">Needing attention</p>
                                </div>

                                <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 transition hover:shadow-md">
                                    <div className="flex items-center justify-between mb-4">
                                        <p className="text-gray-500 font-medium">Avg. Order Value</p>
                                        <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
                                            <Receipt size={20} />
                                        </div>
                                    </div>
                                    <p className="text-3xl font-black text-gray-900">$24.80</p>
                                    <p className="text-sm text-emerald-600 mt-2 font-medium flex items-center gap-1">
                                        <ArrowRight size={14} className="-rotate-45" /> +$2.10 today
                                    </p>
                                </div>

                                <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 transition hover:shadow-md">
                                    <div className="flex items-center justify-between mb-4">
                                        <p className="text-gray-500 font-medium">Unique Customers</p>
                                        <div className="p-2 bg-purple-50 text-purple-600 rounded-xl">
                                            <User size={20} />
                                        </div>
                                    </div>
                                    <p className="text-3xl font-black text-gray-900">142</p>
                                    <p className="text-sm text-purple-600 mt-2 font-medium flex items-center gap-1">
                                        <ArrowRight size={14} className="-rotate-45" /> +18 signups today
                                    </p>
                                </div>
                            </section>

                            <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                {/* Advanced Revenue Analytics */}
                                <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-gray-100 flex flex-col justify-between">
                                    <div>
                                        <div className="flex justify-between items-start mb-6">
                                            <div>
                                                <h3 className="font-bold text-gray-900 text-xl">Weekly Volume Matrix</h3>
                                                <p className="text-sm text-gray-500">Gross sales across the last 7 operating days</p>
                                            </div>
                                            <select className="bg-gray-50 border border-gray-200 text-sm font-medium rounded-lg px-3 py-1 outline-none focus:ring-2 focus:ring-orange-500">
                                                <option>This Week</option>
                                                <option>Last Week</option>
                                                <option>This Month</option>
                                            </select>
                                        </div>

                                        {/* Modern Data Graph Mockup */}
                                        <div className="relative h-64 flex items-end justify-between gap-1 md:gap-3 px-2 pt-10">
                                            {/* Grid lines */}
                                            <div className="absolute inset-0 flex flex-col justify-between pointer-events-none">
                                                <div className="border-b border-gray-100 w-full h-0"></div>
                                                <div className="border-b border-gray-100 w-full h-0"></div>
                                                <div className="border-b border-gray-100 w-full h-0"></div>
                                                <div className="border-b border-gray-100 w-full h-0"></div>
                                            </div>

                                            {[
                                                { day: "Mon", rev: 45, ord: 20 },
                                                { day: "Tue", rev: 60, ord: 40 },
                                                { day: "Wed", rev: 55, ord: 35 },
                                                { day: "Thu", rev: 80, ord: 60 },
                                                { day: "Fri", rev: 100, ord: 90 },
                                                { day: "Sat", rev: 85, ord: 80 },
                                                { day: "Sun", rev: 70, ord: 55 },
                                            ].map((data, idx) => (
                                                <div key={idx} className="flex-1 flex flex-col items-center gap-3 relative z-10 group">
                                                    {/* Tooltip */}
                                                    <div className="absolute -top-12 bg-gray-900 text-white text-xs font-bold py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition whitespace-nowrap pointer-events-none">
                                                        ₱{(data.rev * 15).toFixed(0)}
                                                    </div>

                                                    {/* Double Bar System */}
                                                    <div className="w-full flex justify-center items-end gap-1 h-48 bg-transparent">
                                                        <div
                                                            className="w-1/2 md:w-3 max-w-[12px] bg-gradient-to-t from-orange-500 to-orange-400 rounded-t-sm shadow-sm group-hover:shadow-orange-500/50 transition-all"
                                                            style={{ height: `${data.rev}%` }}
                                                        ></div>
                                                        <div
                                                            className="w-1/2 md:w-3 max-w-[12px] bg-gradient-to-t from-gray-200 to-gray-300 rounded-t-sm"
                                                            style={{ height: `${data.ord}%` }}
                                                        ></div>
                                                    </div>
                                                    <span className="text-xs font-semibold text-gray-500">{data.day}</span>
                                                </div>
                                            ))}
                                        </div>
                                        <div className="flex items-center justify-center gap-6 mt-6 pt-4 border-t border-gray-100">
                                            <div className="flex items-center gap-2 text-sm font-medium text-gray-600">
                                                <span className="w-3 h-3 rounded-full bg-orange-500"></span> Revenue
                                            </div>
                                            <div className="flex items-center gap-2 text-sm font-medium text-gray-600">
                                                <span className="w-3 h-3 rounded-full bg-gray-300"></span> Orders Count
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Live Terminal Orders */}
                                <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-gray-100 flex flex-col">
                                    <div className="flex items-center justify-between mb-6">
                                        <h3 className="font-bold text-gray-900 text-xl">Active Order Terminal</h3>
                                        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700 border border-emerald-100">
                                            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
                                            LIVE SYSTEM
                                        </span>
                                    </div>

                                    <div className="flex-1 overflow-y-auto pr-2 space-y-4 max-h-[400px]">
                                        {liveOrders.map((o) => (
                                            <div
                                                key={o.id}
                                                className="rounded-2xl border border-gray-100 bg-white shadow-sm hover:shadow-md transition p-4 md:p-5 relative overflow-hidden group"
                                            >
                                                {/* Left accent color based on status */}
                                                <div className={`absolute left-0 top-0 bottom-0 w-1 ${o.status === 'pending' ? 'bg-yellow-400' :
                                                    o.status === 'accepted' ? 'bg-sky-400' :
                                                        o.status === 'preparing' ? 'bg-blue-400' :
                                                            o.status === 'prepared' ? 'bg-purple-400' :
                                                                o.status === 'out_for_delivery' ? 'bg-orange-400' : 'bg-emerald-400'
                                                    }`}></div>

                                                <div className="flex flex-col md:flex-row justify-between gap-4">
                                                    <div>
                                                        <div className="flex gap-3 items-center mb-1">
                                                            <p className="text-sm font-bold text-gray-900">Order #{o.id}</p>
                                                            <p className="text-xs font-semibold text-gray-500">{o.time}</p>
                                                        </div>
                                                        <div className="flex items-center gap-1 text-sm text-gray-600 font-medium mb-2">
                                                            <MapPin size={14} className="text-gray-400" /> {o.location}
                                                        </div>
                                                        <p className="text-lg font-black text-emerald-600">₱{o.total.toFixed(2)}</p>
                                                    </div>

                                                    <div className="flex flex-col items-start md:items-end justify-between">
                                                        <select
                                                            value={o.status}
                                                            onChange={(e) => updateOrderStatus(o.id, e.target.value)}
                                                            className={`text-xs font-bold px-3 py-1.5 rounded-lg border focus:outline-none focus:ring-2 focus:ring-orange-500 transition-colors cursor-pointer ${getOrderStatusColor(o.status)}`}
                                                        >
                                                            <option value="pending">🟡 Pending</option>
                                                            <option value="accepted">🔵 Accepted</option>
                                                            <option value="preparing">🔵 Preparing</option>
                                                            <option value="prepared">🟣 Prepared</option>
                                                            <option value="out_for_delivery">🟠 Out for Delivery</option>
                                                            <option value="delivered">🟢 Delivered</option>
                                                        </select>

                                                        {o.status !== 'delivered' && (
                                                            <p className="text-xs text-gray-500 font-medium mt-3 md:mt-0">
                                                                Action Required
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                        {liveOrders.length === 0 && (
                                            <div className="h-full flex items-center justify-center text-gray-400 font-medium pb-10">
                                                No active orders at the moment.
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </section>

                            {/* Menu Management & Categories */}
                            <section className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-gray-100">
                                <div className="flex items-center justify-between mb-6">
                                    <h3 className="font-bold text-gray-900 text-xl">Top Selling Menu Items</h3>
                                    <button className="inline-flex items-center gap-1 rounded-xl bg-gray-900 px-4 py-2 text-sm font-semibold text-white hover:bg-black transition shadow-md">
                                        <Plus size={16} /> Add Item
                                    </button>
                                </div>

                                <div className="overflow-x-auto">
                                    <table className="w-full text-left text-sm whitespace-nowrap">
                                        <thead>
                                            <tr className="border-b border-gray-100 text-gray-500">
                                                <th className="pb-3 font-semibold pr-4">Item Name</th>
                                                <th className="pb-3 font-semibold px-4 text-center">Price</th>
                                                <th className="pb-3 font-semibold px-4 text-center">Monthly Sales</th>
                                                <th className="pb-3 font-semibold px-4 text-center">Revenue</th>
                                                <th className="pb-3 font-semibold pl-4 text-right">Visibility</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-50">
                                            {[
                                                { name: "Double Cheese Burger", price: 12.99, sales: 452, rev: 5871.48, available: true },
                                                { name: "Spicy Chicken Wings (8pc)", price: 9.99, sales: 385, rev: 3846.15, available: true },
                                                { name: "Large Pepperoni Pizza", price: 18.50, sales: 210, rev: 3885.00, available: false },
                                                { name: "Oreo Milkshake", price: 6.50, sales: 189, rev: 1228.50, available: true },
                                            ].map((item, idx) => (
                                                <tr key={idx} className="hover:bg-gray-50 transition group">
                                                    <td className="py-4 font-bold text-gray-900 pr-4">{item.name}</td>
                                                    <td className="py-4 text-gray-600 font-medium text-center px-4">₱{item.price.toFixed(2)}</td>
                                                    <td className="py-4 text-center px-4">
                                                        <span className="inline-flex items-center gap-1 font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded text-xs">
                                                            <TrendingUp size={12} /> {item.sales}
                                                        </span>
                                                    </td>
                                                    <td className="py-4 text-gray-900 font-bold text-center px-4">₱{item.rev.toFixed(2)}</td>
                                                    <td className="py-4 pl-4 text-right">
                                                        <label className="inline-flex items-center gap-2 cursor-pointer justify-end">
                                                            <span className={`text-xs font-bold uppercase tracking-wider ${item.available ? 'text-blue-600' : 'text-gray-400'}`}>
                                                                {item.available ? "Active" : "Hidden"}
                                                            </span>
                                                            <input
                                                                type="checkbox"
                                                                defaultChecked={item.available}
                                                                className="h-4 w-4 accent-blue-600 rounded cursor-pointer"
                                                            />
                                                        </label>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </section>

                            <section className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                                <div className="lg:col-span-2 hidden"></div> {/* Spacer for layout balance or future expansion */}
                                <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 space-y-4">
                                    <div>
                                        <h3 className="font-semibold text-gray-900 mb-2">Manage Categories</h3>
                                        <div className="flex flex-wrap gap-2">
                                            {["Burgers", "Pizza", "Sushi", "Desserts"].map((cat) => (
                                                <span
                                                    key={cat}
                                                    className="inline-flex items-center gap-1 rounded-full bg-orange-50 px-3 py-1 text-xs font-medium text-orange-700"
                                                >
                                                    {cat}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-gray-900 mb-2">Customer Reviews</h3>
                                        <div className="space-y-2 text-xs">
                                            <div className="rounded-xl bg-gray-50 p-3">
                                                <p className="font-semibold text-gray-800 mb-1">“Amazing burgers!”</p>
                                                <p className="text-gray-500 mb-1">by Alex • 5.0 ★</p>
                                                <div className="flex gap-2">
                                                    <button className="rounded-full bg-white px-3 py-1 text-[11px] text-gray-600 hover:bg-gray-100 transition">
                                                        Reply
                                                    </button>
                                                    <button className="rounded-full bg-white px-3 py-1 text-[11px] text-gray-600 hover:bg-gray-100 transition">
                                                        Mark as resolved
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </section>
                        </div>
                    )}
                </main>
            </div>

            {showCheckoutDialog && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fade-in p-4">
                    <div className="bg-white rounded-3xl p-6 md:p-8 max-w-lg w-full shadow-2xl animate-fade-in-scale">
                        <div className="flex justify-between items-center mb-6 border-b border-gray-100 pb-4">
                            <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                                <Truck className="text-orange-500" /> Delivery Details
                            </h2>
                            <button onClick={() => setShowCheckoutDialog(false)} className="text-gray-400 hover:text-gray-600 transition bg-gray-50 rounded-full p-2 hover:bg-gray-100">
                                <X size={20} />
                            </button>
                        </div>

                        <div className="space-y-4 mb-8">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1">Delivery Address</label>
                                <input
                                    type="text"
                                    value={checkoutInfo.deliveryAddress}
                                    placeholder="e.g. 123 Campus Dorm, Room 4B"
                                    onChange={(e) => setCheckoutInfo(prev => ({ ...prev, deliveryAddress: e.target.value }))}
                                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">City</label>
                                    <input
                                        type="text"
                                        value={checkoutInfo.deliveryCity}
                                        placeholder="e.g. University Town"
                                        onChange={(e) => setCheckoutInfo(prev => ({ ...prev, deliveryCity: e.target.value }))}
                                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none transition"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">Phone Number</label>
                                    <input
                                        type="tel"
                                        value={checkoutInfo.phone}
                                        placeholder="Mobile number"
                                        onChange={(e) => setCheckoutInfo(prev => ({ ...prev, phone: e.target.value }))}
                                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 outline-none transition"
                                    />
                                </div>
                            </div>
                            <p className="text-xs text-gray-500 italic mt-2">
                                * Your provided information will be explicitly sent to the restaurant for this order. It falls back to your saved profile details if left blank!
                            </p>
                        </div>

                        <div className="flex gap-4">
                            <button
                                onClick={() => setShowCheckoutDialog(false)}
                                className="flex-1 px-4 py-3 border border-gray-300 rounded-xl font-bold text-gray-700 hover:bg-gray-50 transition"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleCheckout}
                                className="flex-1 px-4 py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-xl font-bold hover:shadow-lg hover:shadow-orange-500/30 transition-all flex justify-center items-center gap-2"
                            >
                                <CreditCard size={18} /> Confirm Order
                            </button>
                        </div>
                    </div>
                </div>
            )}
            {/* Food Detail Modal (Matching Modern Aesthetic) */}
            {showFoodModal && selectedFood && !showSizeModal && (
                <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 md:p-6 bg-black/60 backdrop-blur-sm animate-fade-in" onClick={() => setShowFoodModal(false)}>
                    <div className={`w-full max-w-4xl rounded-3xl overflow-hidden shadow-2xl animate-fade-in-scale flex flex-col md:flex-row relative ${isDarkMode ? 'bg-[#0f0f13] border border-gray-800' : 'bg-white'}`} onClick={e => e.stopPropagation()}>

                        {/* Left: Big Image */}
                        <div className="w-full md:w-5/12 h-64 md:h-auto overflow-hidden relative bg-gray-100 dark:bg-gray-900">
                            <img src={selectedFood.image} alt={selectedFood.name} className="w-full h-full object-cover transition-transform hover:scale-105 duration-700" />

                            {/* Inner Close Button on mobile */}
                            <button onClick={() => setShowFoodModal(false)} className={`md:hidden absolute top-4 right-4 z-10 p-2 rounded-full backdrop-blur-md transition-all bg-black/30 hover:bg-black/50 text-white`}>
                                <X size={18} strokeWidth={2.5} />
                            </button>

                            {selectedFood.discount > 0 && (
                                <div className="absolute top-4 left-4 bg-black/80 backdrop-blur-md text-white px-3 py-1.5 rounded-lg font-bold text-[10px] uppercase tracking-wider shadow-md border border-white/10">
                                    -{selectedFood.discount}% OFF
                                </div>
                            )}
                        </div>

                        {/* Right: Details */}
                        <div className="p-6 md:p-10 md:w-7/12 flex flex-col w-full h-full relative">
                            {/* Close Button Desktop */}
                            <button onClick={() => setShowFoodModal(false)} className={`hidden md:flex absolute top-6 right-6 z-10 p-2.5 rounded-full transition-all ${isDarkMode ? 'bg-gray-800/80 hover:bg-gray-700 text-gray-400 hover:text-white' : 'bg-gray-100 hover:bg-gray-200 text-gray-500 hover:text-gray-900'}`}>
                                <X size={18} strokeWidth={2.5} />
                            </button>

                            <div className="mb-8 md:pr-10">
                                <div className="flex items-center gap-3 mb-4">
                                    <span className={`px-2.5 py-1 ${isDarkMode ? 'bg-gray-800 text-gray-300' : 'bg-gray-100 text-gray-600'} text-[10px] font-bold rounded-lg uppercase tracking-wider`}>
                                        {selectedFood.restaurant}
                                    </span>
                                    <div className="flex items-center gap-1.5 text-xs font-bold text-gray-500">
                                        <Star size={14} className="text-yellow-500 fill-yellow-500" /> {selectedFood.rating > 0 ? selectedFood.rating : 'New'}
                                        {selectedFood.reviews > 0 && <span className="font-medium text-gray-400">({selectedFood.reviews})</span>}
                                    </div>
                                </div>
                                <h2 className={`text-2xl md:text-3xl font-bold tracking-tight mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{selectedFood.name}</h2>
                                <p className={`text-sm leading-relaxed font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                    {selectedFood.description || "A meticulously prepared meal featuring farm-fresh ingredients and traditional recipes to ensure perfect taste in every bite."}
                                </p>
                            </div>

                            <div className="mt-auto space-y-6 pt-6 border-t border-gray-100 dark:border-gray-800/50">
                                {/* Pricing Section */}
                                {selectedFood.category === 'Drinks' ? (
                                    <div>
                                        <span className="text-[11px] font-bold text-gray-400 uppercase tracking-widest block mb-4">Select Size</span>
                                        <div className="flex gap-3">
                                            {[
                                                { label: 'Small', price: selectedFood.half_price, icon: 'S' },
                                                { label: 'Medium', price: selectedFood.price, icon: 'M' },
                                                { label: 'Large', price: selectedFood.large_price, icon: 'L' }
                                            ].filter(s => s.price != null && Number(s.price) > 0).map((size) => (
                                                <button
                                                    key={size.label}
                                                    onClick={() => setSelectedModalSize(size.label)}
                                                    className={`flex-1 flex items-center justify-between p-3.5 rounded-xl transition-all ${selectedModalSize === size.label
                                                        ? isDarkMode
                                                            ? 'bg-white text-black shadow-lg shadow-white/5 border border-white'
                                                            : 'bg-gray-900 text-white shadow-xl shadow-black/10 border border-gray-900'
                                                        : isDarkMode
                                                            ? 'border border-gray-800 bg-transparent text-gray-400 hover:bg-gray-800 hover:text-white'
                                                            : 'border border-gray-200 bg-transparent text-gray-500 hover:bg-gray-50 hover:text-gray-900'
                                                        }`}
                                                >
                                                    <span className={`text-[10px] font-bold uppercase tracking-wider`}>{size.label}</span>
                                                    <span className={`text-sm font-bold`}>₱{Number(size.price).toFixed(2)}</span>
                                                </button>
                                            ))}
                                        </div>
                                        {/* Show selected price */}
                                        <div className="mt-8 flex items-center justify-between">
                                            <span className={`text-[11px] font-bold uppercase tracking-widest ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>Total Price</span>
                                            <span className={`text-3xl font-bold tracking-tight ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                                <span className="text-xl text-gray-400 mr-1.5">₱</span>
                                                {Number(
                                                    selectedModalSize === 'Small' ? (selectedFood.half_price || selectedFood.price) :
                                                        selectedModalSize === 'Large' ? (selectedFood.large_price || selectedFood.price) :
                                                            selectedFood.price || 0
                                                ).toFixed(2)}
                                            </span>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
                                        <div className="flex flex-col">
                                            <span className={`text-[11px] font-bold uppercase tracking-widest mb-1.5 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>Total Price</span>
                                            <span className={`text-3xl font-bold tracking-tight ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                                <span className="text-xl text-gray-400 mr-1.5">₱</span>
                                                {((selectedFood.price || 0) * (1 - (selectedFood.discount || 0) / 100)).toFixed(2)}
                                            </span>
                                        </div>

                                        <div className={`flex items-center gap-5 px-5 py-2.5 rounded-2xl border ${isDarkMode ? 'bg-gray-800/50 border-gray-700/50' : 'bg-gray-50 border-gray-200'}`}>
                                            <button
                                                onClick={() => updateQuantity(selectedFood.id, (cart.find(c => c.id === selectedFood.id)?.quantity || 0) - 1)}
                                                className={`p-1.5 transition-colors hover:text-black dark:hover:text-white ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}
                                            >
                                                <Minus size={18} strokeWidth={2.5} />
                                            </button>
                                            <span className={`w-6 text-center font-bold text-lg ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                                {cart.find(c => c.id === selectedFood.id)?.quantity || 0}
                                            </span>
                                            <button
                                                onClick={() => addToCart(selectedFood)}
                                                className={`p-1.5 transition-colors hover:text-black dark:hover:text-white ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}
                                            >
                                                <Plus size={18} strokeWidth={2.5} />
                                            </button>
                                        </div>
                                    </div>
                                )}

                                <div className="flex gap-3 pt-2">
                                    <button
                                        onClick={() => {
                                            if (selectedFood.category === 'Drinks') {
                                                addToCart(selectedFood, selectedModalSize, false);
                                            } else {
                                                addToCart(selectedFood);
                                            }
                                        }}
                                        className={`w-14 shrink-0 flex items-center justify-center rounded-2xl transition-all active:scale-[0.98] border ${isDarkMode ? 'bg-orange-500/10 hover:bg-orange-500/20 text-orange-400 border-orange-500/20' : 'bg-orange-50 hover:bg-orange-100 text-orange-600 border-orange-200'}`}
                                    >
                                        <ShoppingCart size={22} strokeWidth={2.5} />
                                    </button>
                                    <button
                                        onClick={() => {
                                            if (selectedFood.category === 'Drinks') {
                                                addToCart(selectedFood, selectedModalSize, true);
                                            } else {
                                                addToCart(selectedFood, null, true);
                                            }
                                        }}
                                        className="flex-1 py-4 bg-orange-500 hover:bg-orange-600 text-white rounded-2xl font-bold text-sm tracking-wide transition-all active:scale-[0.98] shadow-lg shadow-orange-500/30"
                                    >
                                        Order Now
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* CSS Animations */}
            <style>{`
                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                @keyframes slideInRight {
                    from { transform: translateX(100%); }
                    to { transform: translateX(0); }
                }
                @keyframes fadeInScale {
                    from { opacity: 0; transform: scale(0.95); }
                    to { opacity: 1; transform: scale(1); }
                }
                .animate-fade-in { animation: fadeIn 0.3s ease-in-out; }
                .animate-slide-in-right { animation: slideInRight 0.3s ease-out; }
                @keyframes slideUp {
                    from { opacity: 0; transform: translateY(20px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .animate-slide-up { animation: slideUp 0.35s cubic-bezier(0.16,1,0.3,1) forwards; }
            `}</style>

            {/* ════════════════════════════════════════════════════════
                Budget Meal 3-Step Modal
            ════════════════════════════════════════════════════════ */}
            {showBudgetModal && budgetFood && (
                <div
                    className="fixed inset-0 z-[110] flex items-center justify-center p-4 md:p-6 bg-black/60 backdrop-blur-sm animate-fade-in"
                    onClick={closeBudgetModal}
                >
                    <div
                        className={`w-full max-w-lg rounded-3xl overflow-hidden shadow-2xl animate-fade-in-scale flex flex-col relative ${isDarkMode ? 'bg-[#0f0f13] border border-gray-800' : 'bg-white'
                            }`}
                        style={{ maxHeight: '90vh' }}
                        onClick={e => e.stopPropagation()}
                    >
                        {/* Modal Header */}
                        <div className={`flex items-center justify-between px-8 py-6 border-b ${isDarkMode ? 'border-gray-800/50' : 'border-gray-100'
                            }`}>
                            <div className="flex items-center gap-4">
                                {budgetStep > 1 && (
                                    <button
                                        onClick={() => setBudgetStep(s => s - 1)}
                                        className={`p-2 rounded-xl transition-all ${isDarkMode ? 'bg-gray-800/50 hover:bg-gray-700 text-gray-300' : 'bg-gray-50 hover:bg-gray-100 text-gray-600'
                                            }`}
                                    >
                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M15 18l-6-6 6-6" /></svg>
                                    </button>
                                )}
                                <div>
                                    <h2 className={`text-xl font-bold tracking-tight ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                        {budgetStep === 1 && 'Choose Combination'}
                                        {budgetStep === 2 && 'Select Your Options'}
                                        {budgetStep === 3 && 'Order Summary'}
                                    </h2>
                                    <p className={`text-[10px] font-bold uppercase tracking-widest mt-1 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'
                                        }`}>
                                        Step {budgetStep} of 3
                                    </p>
                                </div>
                            </div>
                            <button onClick={closeBudgetModal} className={`p-2 rounded-full transition-all ${isDarkMode ? 'hover:bg-gray-800 text-gray-500 hover:text-gray-300' : 'hover:bg-gray-100 text-gray-400 hover:text-gray-800'
                                }`}>
                                <X size={20} strokeWidth={2.5} />
                            </button>
                        </div>

                        {/* Progress Dots */}
                        <div className="flex justify-center gap-2 py-5">
                            {[1, 2, 3].map(step => (
                                <div
                                    key={step}
                                    className={`h-1.5 rounded-full transition-all duration-300 ${step === budgetStep ? 'w-8 bg-gray-900 dark:bg-white' :
                                        step < budgetStep ? 'w-4 bg-gray-300 dark:bg-gray-600' :
                                            'w-4 bg-gray-100 dark:bg-gray-800'
                                        }`}
                                />
                            ))}
                        </div>

                        {/* Modal Body – scrollable */}
                        <div className="overflow-y-auto flex-1 px-8 pb-8">

                            {/* ── Step 1: Choose Combination Type ── */}
                            {budgetStep === 1 && (
                                <div className="space-y-4">
                                    {budgetLoadingCombos ? (
                                        <div className="flex flex-col items-center py-12 gap-3">
                                            <div className="w-8 h-8 border-4 border-gray-900 dark:border-white border-t-transparent rounded-full animate-spin" />
                                            <p className={`text-sm font-bold ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Loading options...</p>
                                        </div>
                                    ) : budgetCombinations.length === 0 ? (
                                        <div className="flex flex-col items-center py-12 gap-3">
                                            <span className="text-4xl">😔</span>
                                            <p className={`text-sm font-bold text-center ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                                No combinations available.<br />The restaurant hasn't set up this Budget Meal yet.
                                            </p>
                                        </div>
                                    ) : (
                                        budgetCombinations.map(combo => (
                                            <button
                                                key={combo.id}
                                                onClick={() => budgetSelectCombo(combo)}
                                                className={`w-full group flex items-center justify-between p-5 rounded-2xl border transition-all duration-200 ${budgetSelectedCombo?.id === combo.id
                                                    ? isDarkMode ? 'border-transparent bg-gray-800 text-white shadow-lg' : 'border-transparent bg-gray-900 text-white shadow-xl shadow-black/5'
                                                    : isDarkMode ? 'border-gray-800 bg-transparent hover:bg-gray-800/50' : 'border-gray-200 bg-transparent hover:bg-gray-50'
                                                    }`}
                                            >
                                                <div className="flex items-center gap-4">
                                                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl transition-all ${budgetSelectedCombo?.id === combo.id
                                                        ? isDarkMode ? 'bg-gray-700' : 'bg-gray-800'
                                                        : isDarkMode ? 'bg-gray-800' : 'bg-gray-100'
                                                        }`}>
                                                        🍱
                                                    </div>
                                                    <div className="text-left">
                                                        <p className={`font-bold text-sm ${budgetSelectedCombo?.id === combo.id ? 'text-white' : isDarkMode ? 'text-gray-200' : 'text-gray-900'}`}>
                                                            {combo.label}
                                                        </p>
                                                        <p className={`text-[11px] font-bold tracking-wide mt-1 ${budgetSelectedCombo?.id === combo.id ? 'text-gray-400' : isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                                                            {combo.slots.map(s => s.component_type).join(' + ')}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="flex flex-col items-end gap-1">
                                                    <span className={`text-lg font-bold ${budgetSelectedCombo?.id === combo.id ? 'text-white' : isDarkMode ? 'text-gray-200' : 'text-gray-900'}`}>
                                                        ₱{Number(combo.price).toFixed(2)}
                                                    </span>
                                                </div>
                                            </button>
                                        ))
                                    )}
                                </div>
                            )}

                            {/* ── Step 2: Select Options per Slot ── */}
                            {budgetStep === 2 && budgetSelectedCombo && (
                                <div className="space-y-6">
                                    {/* Combo summary badge */}
                                    <div className={`flex items-center justify-between p-4 rounded-2xl ${isDarkMode ? 'bg-gray-800/50 border border-gray-700/50' : 'bg-gray-50 border border-gray-200'
                                        }`}>
                                        <div>
                                            <p className={`text-[10px] font-bold uppercase tracking-widest mb-1 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>Selected</p>
                                            <p className={`font-bold text-sm ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{budgetSelectedCombo.label}</p>
                                        </div>
                                        <span className={`font-bold text-lg ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>₱{Number(budgetSelectedCombo.price).toFixed(2)}</span>
                                    </div>

                                    {budgetSelectedCombo.slots.map((slot, idx) => (
                                        <div key={idx} className="pt-2">
                                            <div className="flex items-center gap-3 mb-4">
                                                <div className={`w-6 h-6 rounded-md flex items-center justify-center text-[11px] font-bold ${budgetSelections[budgetSlotKey(budgetSelectedCombo, slot)]
                                                    ? 'bg-gray-900 text-white dark:bg-white dark:text-gray-900'
                                                    : isDarkMode ? 'bg-gray-800 text-gray-400' : 'bg-gray-100 text-gray-400'
                                                    }`}>{idx + 1}</div>
                                                <p className={`text-sm font-bold uppercase tracking-wider ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                                    Choose your {slot.component_type}
                                                </p>
                                                {budgetSelections[budgetSlotKey(budgetSelectedCombo, slot)] && (
                                                    <span className={`ml-auto text-[10px] font-bold px-2.5 py-1 rounded-md ${isDarkMode ? 'bg-gray-800/80 text-gray-300' : 'bg-gray-100 text-gray-600'
                                                        }`}> ✓ Selected</span>
                                                )}
                                            </div>
                                            <div className="grid grid-cols-2 gap-3">
                                                {slot.options.map(opt => {
                                                    const key = budgetSlotKey(budgetSelectedCombo, slot)
                                                    const isChosen = budgetSelections[key] === opt.name
                                                    return (
                                                        <button
                                                            key={opt.id}
                                                            onClick={() => setBudgetSelections(prev => ({ ...prev, [key]: opt.name }))}
                                                            className={`flex flex-col items-center justify-center gap-2 p-4 rounded-xl border transition-all duration-200 ${isChosen
                                                                ? isDarkMode ? 'border-white bg-gray-800 text-white shadow-lg' : 'border-gray-900 bg-gray-900 text-white shadow-lg'
                                                                : isDarkMode ? 'border-gray-800 bg-transparent text-gray-400 hover:border-gray-700 hover:bg-gray-800/30' : 'border-gray-200 bg-transparent text-gray-500 hover:border-gray-300 hover:bg-gray-50'
                                                                }`}
                                                        >
                                                            <span className="font-bold text-sm text-center">{opt.name}</span>
                                                        </button>
                                                    )
                                                })}
                                            </div>
                                        </div>
                                    ))}

                                    <button
                                        onClick={() => { if (budgetAllSelected()) setBudgetStep(3) }}
                                        disabled={!budgetAllSelected()}
                                        className={`w-full py-4 rounded-2xl font-bold text-sm tracking-wide transition-all mt-6 ${budgetAllSelected()
                                            ? isDarkMode ? 'bg-white text-black shadow-lg shadow-white/10 active:scale-[0.98]' : 'bg-gray-900 text-white shadow-xl shadow-black/10 active:scale-[0.98]'
                                            : isDarkMode ? 'bg-gray-800/50 text-gray-600 cursor-not-allowed border border-gray-800/50' : 'bg-gray-100 text-gray-400 cursor-not-allowed border border-transparent'
                                            }`}
                                    >
                                        {budgetAllSelected() ? 'Review My Order →' : `Select all ${budgetSelectedCombo.slots.length} item${budgetSelectedCombo.slots.length > 1 ? 's' : ''} to continue`}
                                    </button>
                                </div>
                            )}

                            {/* ── Step 3: Confirm Summary ── */}
                            {budgetStep === 3 && budgetSelectedCombo && (
                                <div className="space-y-6">
                                    {/* Food image + name */}
                                    {budgetFood.image && (
                                        <div className="w-full h-40 rounded-2xl overflow-hidden bg-gray-100 dark:bg-gray-900">
                                            <img src={budgetFood.image} alt={budgetFood.name} className="w-full h-full object-cover" />
                                        </div>
                                    )}

                                    <div className={`p-6 rounded-2xl border ${isDarkMode ? 'bg-gray-800/30 border-gray-800' : 'bg-gray-50/50 border-gray-200'
                                        }`}>
                                        <p className={`text-[10px] font-bold uppercase tracking-widest mb-4 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>Order Summary</p>

                                        <div className="space-y-3">
                                            <div className="flex justify-between">
                                                <span className={`text-sm font-bold ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Item</span>
                                                <span className={`text-sm font-bold tracking-wide ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{budgetFood.name}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className={`text-sm font-bold ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Combo</span>
                                                <span className={`text-sm font-bold tracking-wide ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>{budgetSelectedCombo.label}</span>
                                            </div>

                                            {/* Selected options */}
                                            {budgetSelectedCombo.slots.map((slot, idx) => {
                                                const key = budgetSlotKey(budgetSelectedCombo, slot)
                                                return (
                                                    <div key={idx} className="flex justify-between">
                                                        <span className={`text-sm font-bold ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>{slot.component_type}</span>
                                                        <span className={`text-sm font-bold ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>{budgetSelections[key]}</span>
                                                    </div>
                                                )
                                            })}
                                        </div>

                                        <div className={`mt-6 pt-5 border-t flex justify-between items-end ${isDarkMode ? 'border-gray-800' : 'border-gray-200'}`}>
                                            <span className={`text-[11px] font-bold uppercase tracking-widest ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>Total Price</span>
                                            <span className={`text-2xl font-bold tracking-tight ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>₱{Number(budgetSelectedCombo.price).toFixed(2)}</span>
                                        </div>
                                    </div>

                                    <div className="flex gap-3 pt-2">
                                        <button
                                            onClick={addBudgetMealToCart}
                                            className={`w-14 shrink-0 flex items-center justify-center rounded-2xl transition-all active:scale-[0.98] border ${isDarkMode ? 'bg-orange-500/10 hover:bg-orange-500/20 text-orange-400 border-orange-500/20' : 'bg-orange-50 hover:bg-orange-100 text-orange-600 border-orange-200'}`}
                                        >
                                            <ShoppingCart size={22} strokeWidth={2.5} />
                                        </button>
                                        <button
                                            onClick={() => { addBudgetMealToCart() }}
                                            className="flex-1 py-4 rounded-2xl font-bold text-sm tracking-wide transition-all active:scale-[0.98] shadow-lg shadow-orange-500/30 border border-transparent bg-orange-500 hover:bg-orange-600 text-white"
                                        >
                                            Order Now
                                        </button>
                                    </div>
                                    <p className={`text-center text-[11px] font-bold mt-4 ${isDarkMode ? 'text-gray-600' : 'text-gray-400'}`}>
                                        You can adjust quantity directly from the cart
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Size Selection Modal (For Drinks) */}
            {showSizeModal && foodForSize && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-fade-in" onClick={() => setShowSizeModal(false)}>
                    <div className={`w-full max-w-sm rounded-2xl overflow-hidden shadow-2xl animate-fade-in-scale flex flex-col relative ${isDarkMode ? 'bg-[#1a1a2e] border border-gray-700/50' : 'bg-white p-8 px-6'}`} onClick={e => e.stopPropagation()}>

                        <div className="text-center mb-6">
                            {/* Drink Image if available */}
                            {foodForSize.image && (
                                <div className="w-24 h-24 mx-auto mb-4 rounded-[20px] overflow-hidden shadow-lg">
                                    <img src={foodForSize.image} alt={foodForSize.name} className="w-full h-full object-cover" />
                                </div>
                            )}
                            {!foodForSize.image && (
                                <div className="w-16 h-16 bg-orange-100 dark:bg-orange-500/10 rounded-2xl flex items-center justify-center text-orange-600 dark:text-orange-400 mx-auto mb-4 font-black text-2xl">
                                    🧋
                                </div>
                            )}
                            <h2 className={`text-2xl font-black mb-1 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Choose Your Size</h2>
                            <p className="text-sm text-gray-400 font-medium"><strong className={isDarkMode ? 'text-gray-200' : 'text-gray-700'}>{foodForSize.name}</strong></p>
                        </div>

                        <div className="space-y-3 mb-6">
                            {[
                                { label: 'Small', price: foodForSize.half_price, icon: 'S', desc: 'Perfect for light sipping' },
                                { label: 'Medium', price: foodForSize.price, icon: 'M', desc: 'Most popular choice' },
                                { label: 'Large', price: foodForSize.large_price, icon: 'L', desc: 'Big thirst? Go large!' }
                            ].filter(s => s.price != null && Number(s.price) > 0).map((size) => (
                                <button
                                    key={size.label}
                                    onClick={() => addToCart(foodForSize, size.label, sizeModalCheckout)}
                                    className={`w-full group relative flex items-center justify-between p-4 rounded-2xl border-2 transition-all duration-300 ${isDarkMode
                                        ? 'bg-gray-800/40 border-gray-700 hover:border-orange-500 hover:bg-orange-500/5'
                                        : 'bg-white border-gray-100 hover:border-orange-400 hover:bg-orange-50'
                                        }`}
                                >
                                    <div className="flex items-center gap-4">
                                        <div className={`w-11 h-11 rounded-xl flex items-center justify-center font-black text-base transition-all group-hover:scale-110 group-hover:bg-orange-500 group-hover:text-white ${isDarkMode ? 'bg-gray-700 text-orange-400' : 'bg-orange-50 text-orange-600'
                                            }`}>
                                            {size.icon}
                                        </div>
                                        <div className="text-left">
                                            <span className={`block font-bold text-sm ${isDarkMode ? 'text-gray-200' : 'text-gray-900'}`}>{size.label}</span>
                                            <span className="block text-xs text-gray-400 font-medium">{size.desc}</span>
                                        </div>
                                    </div>
                                    <div className="text-right flex flex-col items-end gap-0.5">
                                        <span className="text-lg font-black text-orange-500">₱{Number(size.price).toFixed(2)}</span>
                                        <ChevronRight size={14} className="text-orange-300/0 group-hover:text-orange-500 transition-all -translate-x-2 group-hover:translate-x-0" />
                                    </div>
                                </button>
                            ))}
                        </div>

                        {/* Footer hint */}
                        <p className="text-[11px] text-center text-gray-400 font-medium mb-4">
                            {sizeModalCheckout ? 'Select a size to checkout' : 'Select a size to add to cart'}
                        </p>

                        <button
                            onClick={() => setShowSizeModal(false)}
                            className="w-full py-3 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 font-black text-sm transition-all border border-dashed border-gray-200 dark:border-gray-700 rounded-2xl"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            )}
            {/* Direct Checkout Modal (Buy Now / Order Now without Cart) */}
            {showDirectCheckout && directCheckoutItem && (
                <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-fade-in" onClick={closeDirectCheckout}>
                    <div
                        className={`w-full max-w-lg rounded-[32px] overflow-hidden shadow-2xl animate-fade-in-scale relative ${isDarkMode ? 'bg-[#1a1a2e] border border-gray-700/50' : 'bg-white'}`}
                        onClick={e => e.stopPropagation()}
                    >
                        {/* Header */}
                        <div className={`p-6 border-b flex justify-between items-center ${isDarkMode ? 'border-gray-800' : 'border-gray-100'}`}>
                            <h2 className={`text-xl font-black flex items-center gap-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                <Truck size={20} className="text-orange-500" />
                                Direct Checkout
                            </h2>
                            <button onClick={closeDirectCheckout} className={`p-2 rounded-full transition-all ${isDarkMode ? 'bg-gray-800 text-gray-400 hover:text-white' : 'bg-gray-100 text-gray-500 hover:text-gray-900'}`}>
                                <X size={18} />
                            </button>
                        </div>

                        {/* Order Summary */}
                        <div className={`p-6 border-b ${isDarkMode ? 'bg-gray-800/20 border-gray-800' : 'bg-orange-50/50 border-gray-100'}`}>
                            <p className={`text-[10px] font-black uppercase tracking-widest mb-3 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>Order Summary</p>
                            <div className="flex gap-4 items-center">
                                <div className="w-16 h-16 rounded-2xl overflow-hidden shadow-md shrink-0">
                                    <img src={directCheckoutItem.image || directCheckoutItem.image_url} alt={directCheckoutItem.name} className="w-full h-full object-cover" />
                                </div>
                                <div className="flex-1">
                                    <h3 className={`font-black text-sm ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>{directCheckoutItem.name}</h3>
                                    <p className={`text-xs font-bold mt-1 ${isDarkMode ? 'text-orange-400' : 'text-orange-600'}`}>
                                        {directCheckoutItem.restaurant || directCheckoutItem.restaurant_name}
                                    </p>
                                </div>
                                <div className="text-right">
                                    <p className={`text-[10px] font-bold ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>Qty 1</p>
                                    <p className="font-black text-orange-500">₱{Number(directCheckoutItem.price).toFixed(2)}</p>
                                </div>
                            </div>
                        </div>

                        {/* Delivery Destination (Cart Style) */}
                        <div className="p-6">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className={`text-sm font-semibold flex items-center gap-2 ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                                    <div className={`w-6 h-6 rounded-md flex items-center justify-center ${isDarkMode ? 'bg-zinc-800 text-zinc-300' : 'bg-slate-200 text-slate-600'}`}>
                                        <Truck size={14} />
                                    </div>
                                    Delivery destination
                                </h3>
                                <span className={`text-[10px] uppercase font-bold tracking-wider ${isDarkMode ? 'text-orange-400' : 'text-orange-600'}`}>Abra University Main</span>
                            </div>

                            <div className="grid grid-cols-1 gap-4 mb-2">
                                <div className="space-y-1.5">
                                    <label className={`text-[10px] font-semibold uppercase tracking-widest ${isDarkMode ? 'text-zinc-400' : 'text-slate-500'}`}>Building / Department</label>
                                    <div className="relative group">
                                        <MapPin className={`absolute left-4 top-1/2 -translate-y-1/2 transition-colors ${isDarkMode ? 'text-zinc-500 group-focus-within:text-white' : 'text-slate-400 group-focus-within:text-slate-800'}`} size={16} />
                                        <input
                                            type="text"
                                            value={directDepartment}
                                            onChange={(e) => { setDirectDepartment(e.target.value); setDirectCheckoutError(""); }}
                                            placeholder="e.g. CAS / CAFC"
                                            className={`w-full pl-11 pr-4 py-3 rounded-xl text-sm font-medium outline-none border-2 transition-all ${isDarkMode ? 'bg-zinc-900 border-zinc-700/50 focus:border-orange-500/50 text-white placeholder-zinc-600' : 'bg-white border-slate-200 focus:border-orange-400 text-slate-900 placeholder-slate-400'}`}
                                        />
                                    </div>
                                </div>
                                <div className="space-y-1.5">
                                    <label className={`text-[10px] font-semibold uppercase tracking-widest ${isDarkMode ? 'text-zinc-400' : 'text-slate-500'}`}>Course & Room</label>
                                    <div className="relative group">
                                        <MapPin className={`absolute left-4 top-1/2 -translate-y-1/2 transition-colors ${isDarkMode ? 'text-zinc-500 group-focus-within:text-white' : 'text-slate-400 group-focus-within:text-slate-800'}`} size={16} />
                                        <input
                                            type="text"
                                            value={directCourse}
                                            onChange={(e) => { setDirectCourse(e.target.value); setDirectCheckoutError(""); }}
                                            placeholder="e.g. BSIT 3A / Lec Rm 2"
                                            className={`w-full pl-11 pr-4 py-3 rounded-xl text-sm font-medium outline-none border-2 transition-all ${isDarkMode ? 'bg-zinc-900 border-zinc-700/50 focus:border-orange-500/50 text-white placeholder-zinc-600' : 'bg-white border-slate-200 focus:border-orange-400 text-slate-900 placeholder-slate-400'}`}
                                        />
                                    </div>
                                </div>
                            </div>

                            {directCheckoutError && (
                                <p className="mt-4 text-xs font-bold text-red-500 flex items-center gap-1.5 bg-red-50 dark:bg-red-500/10 p-3 rounded-xl">⚠️ {directCheckoutError}</p>
                            )}

                            {/* Total & Action */}
                            <div className="mt-6 flex items-center gap-4">
                                <div className="flex-1">
                                    <p className={`text-[10px] font-black uppercase tracking-widest ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>Total including ₱25 DeliveryFee</p>
                                    <p className="text-xl font-black text-orange-500">₱{(Number(directCheckoutItem.price) + 25).toFixed(2)}</p>
                                </div>
                                <button
                                    onClick={handleDirectCheckoutSubmit}
                                    disabled={directCheckoutProcessing || !directDepartment || !directCourse}
                                    className={`px-8 py-3.5 rounded-2xl font-black text-sm transition-all shadow-lg active:scale-[0.98] flex items-center justify-center gap-2 ${directCheckoutProcessing
                                        ? 'bg-orange-400 text-white cursor-not-allowed shadow-orange-500/20'
                                        : (!directDepartment || !directCourse)
                                            ? (isDarkMode ? 'bg-gray-800 text-gray-500 cursor-not-allowed border-2 border-gray-700' : 'bg-gray-100 text-gray-400 cursor-not-allowed border-2 border-gray-200')
                                            : 'bg-orange-500 hover:bg-orange-600 text-white shadow-orange-500/30'
                                        }`}
                                >
                                    {directCheckoutProcessing ? (
                                        <>
                                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                            <span>Processing...</span>
                                        </>
                                    ) : (
                                        <>
                                            <CreditCard size={18} />
                                            Confirm Order
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

export default HomePage

