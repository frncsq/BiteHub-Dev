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
    CheckCircle,
    RefreshCw,
    RotateCcw,
    ShoppingBag
} from "lucide-react"
import { useTheme } from "../context/ThemeContext"
import { mockRestaurantsData, mockFoodItems, mockCategories, mockOrderService, mockCartService, mockAuthService } from "../services/mockData"
import { createApiClient } from "../services/apiClient"
import CustomerSidebar from "../components/CustomerSidebar"
import FoodMenuCard from "../components/FoodMenuCard"
import UserActivityAnalytics, { buildProfileActivityMetrics } from "../components/UserActivityAnalytics"
import { calculateDistance, formatDistance } from "../utils/distance"



const HomePage = () => {
    const navigate = useNavigate()
    const { isDarkMode, toggleTheme, colors } = useTheme()
    const apiClient = createApiClient()
    const MAX_RETRIES = 3

    // State management
    const location = useLocation()
    const [sidebarOpen, setSidebarOpen] = useState(false)
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
                title: 'Welcome to KainGo!',
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
    const [recentlyOrdered, setRecentlyOrdered] = useState([])
    const [recentlyOrderedScrollIndex, setRecentlyOrderedScrollIndex] = useState(0)
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
    const [topSellingItems, setTopSellingItems] = useState([])
    const [popularScrollIndex, setPopularScrollIndex] = useState(0)
    const [flashSaleItems, setFlashSaleItems] = useState([])
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
    const [userLocation, setUserLocation] = useState(null)

    // Get user's location
    useEffect(() => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    setUserLocation({
                        lat: position.coords.latitude,
                        lng: position.coords.longitude
                    });
                },
                (error) => {
                    console.warn("Geolocation error:", error.message);
                    // Default to Abra University Main Campus if denied
                    setUserLocation({ lat: 17.5956, lng: 120.6200 });
                }
            );
        } else {
            // Default location
            setUserLocation({ lat: 17.5956, lng: 120.6200 });
        }
    }, []);

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
    const popularRef = useRef(null)
    const flashRef = useRef(null)
    const recentlyOrderedRef = useRef(null)
    const browseFoodRef = useRef(null)

    const handleFlashScroll = (direction) => {
        if (flashRef.current) {
            const container = flashRef.current
            const scrollAmount = container.clientWidth * 0.8
            container.scrollBy({ left: direction === 'next' ? scrollAmount : -scrollAmount, behavior: 'smooth' })
        }
    }

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
        fetchRecentlyOrdered()
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
            const [catRes, restRes, foodRes, profileRes, popularRes, flashRes] = await Promise.all([
                apiClient.get('/categories').catch(() => ({ data: { success: false } })),
                apiClient.get('/restaurants').catch(() => ({ data: { success: false } })),
                apiClient.get('/food').catch(() => ({ data: { success: false } })),
                apiClient.get('/profile').catch(() => ({ data: { success: false } })),
                apiClient.get('/food/popular').catch(() => ({ data: { success: false } })),
                apiClient.get('/food/flash-sale').catch(() => ({ data: { success: false } }))
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

            if (restRes.data?.success && restRes.data.restaurants) {
                let sortedRestaurants = restRes.data.restaurants;
                if (userLocation) {
                    sortedRestaurants = sortedRestaurants.map(r => {
                        const d = calculateDistance(userLocation.lat, userLocation.lng, r.latitude, r.longitude);
                        return {
                            ...r,
                            distance: formatDistance(d),
                            distanceRaw: d
                        };
                    });
                }
                setRestaurants(sortedRestaurants)
            } else {
                setRestaurants(mockRestaurantsData)
            }

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

            if (popularRes.data?.success && popularRes.data.foods) {
                setTopSellingItems(popularRes.data.foods)
            } else {
                // Fallback: pick highest rated from local search
                const fallback = [...popularFoods].sort((a, b) => (b.rating || 0) - (a.rating || 0)).slice(0, 8)
                setTopSellingItems(fallback)
            }

            if (flashRes.data?.success && flashRes.data.foods) {
                setFlashSaleItems(flashRes.data.foods)
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

    const fetchRecentlyOrdered = async () => {
        try {
            const res = await apiClient.get('/orders/recent-items')
            if (res.data?.success && res.data.items) {
                setRecentlyOrdered(res.data.items)
            }
        } catch (err) {
            console.warn("Failed to fetch recently ordered items:", err.message)
        }
    }

    const handleRecentlyOrderedScroll = (direction) => {
        if (!recentlyOrderedRef.current) return
        const container = recentlyOrderedRef.current
        const scrollAmount = container.clientWidth * 0.8
        const nextIndex = direction === "next" ? recentlyOrderedScrollIndex + 1 : recentlyOrderedScrollIndex - 1
        setRecentlyOrderedScrollIndex(Math.max(0, nextIndex))
        container.scrollBy({
            left: direction === "next" ? scrollAmount : -scrollAmount,
            behavior: "smooth",
        })
    }

    const handleOrderAgain = (item) => {
        // Reorder: add to cart and open the direct checkout modal
        addToCart(item, null, true)
    }

    const formatRecentDate = (dateString) => {
        const date = new Date(dateString)
        const now = new Date()
        const diffMs = now - date
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
        if (diffDays === 0) {
            return 'Today'
        } else if (diffDays === 1) {
            return 'Yesterday'
        } else if (diffDays < 7) {
            return `${diffDays} days ago`
        } else if (diffDays < 30) {
            const weeks = Math.floor(diffDays / 7)
            return `${weeks} week${weeks > 1 ? 's' : ''} ago`
        } else {
            return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
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
                fetchRecentlyOrdered()
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
                fetchRecentlyOrdered()
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

    const handlePopularScroll = (direction) => {
        if (!popularRef.current) return
        const container = popularRef.current
        const scrollAmount = container.clientWidth * 0.8
        const nextIndex = direction === "next" ? popularScrollIndex + 1 : popularScrollIndex - 1
        setPopularScrollIndex(Math.max(0, nextIndex))
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
                    <p style={{ color: colors.text }} className="text-lg">Loading KainGo...</p>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen relative" style={{ backgroundColor: isDarkMode ? '#111111' : '#FAFAFA' }}>

            <CustomerSidebar
                activeTab={activeTab === 'dashboard' ? 'home' : activeTab}
                onTabChange={(tabId) => {
                    if (tabId === 'home') setActiveTab('dashboard')
                    else setActiveTab(tabId)
                }}
                sidebarCollapsed={sidebarCollapsed}
                setSidebarCollapsed={setSidebarCollapsed}
                mobileOpen={sidebarOpen}
                setMobileOpen={setSidebarOpen}
            />

            {/* Main Content */}
            <div className={`transition-all duration-300 ${sidebarCollapsed ? 'md:pl-[72px]' : 'md:pl-[240px]'}`}>
                {/* TOP NAVIGATION BAR */}
                <header className={`sticky top-0 z-30 border-b relative ${isDarkMode ? 'bg-[#111111] border-[#2A2A2A]' : 'bg-white border-[#E5E7EB]'}`}>
                    <div className="bh-container flex h-14 sm:h-16 items-center justify-between gap-2 sm:gap-4 !px-3 sm:!px-6">
                        {/* Mobile Menu Toggle */}
                        <button
                            type="button"
                            onClick={() => setSidebarOpen(!sidebarOpen)}
                            className={`bh-touch md:hidden flex items-center justify-center rounded-lg p-2 transition ${isDarkMode ? 'hover:bg-[#1A1A1A] text-[#F5F5F5]' : 'hover:bg-[#F5F5F5] text-[#171717]'}`}
                            aria-expanded={sidebarOpen}
                            aria-label={sidebarOpen ? 'Close navigation menu' : 'Open navigation menu'}
                        >
                            {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
                        </button>

                        {/* Search Bar */}
                        <div className="min-w-0 flex-1 max-w-md">
                            <div className="relative">
                                <Search className="absolute left-3.5 top-1/2 transform -translate-y-1/2 text-[#6B7280] transition-colors pointer-events-none" size={18} />
                                <input
                                    type="search"
                                    enterKeyHint="search"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder="Search food, restaurants..."
                                    className={`w-full min-h-[44px] pl-10 pr-4 py-2.5 text-base sm:text-sm border rounded-xl focus:outline-none focus:ring-2 focus:ring-[#EA580C] transition-all duration-300 ${isDarkMode
                                        ? 'bg-[#1A1A1A] border-[#2A2A2A] text-[#F5F5F5] placeholder-[#A0A0A0]'
                                        : 'bg-white border-[#E5E7EB] text-[#171717] placeholder-[#6B7280]'
                                        }`}
                                />
                            </div>
                        </div>

                        {/* Right Icons */}
                        <div className="flex items-center gap-2">
                            {/* Cart Button */}
                            <button
                                type="button"
                                onClick={() => navigate('/cart')}
                                className={`bh-touch relative flex items-center justify-center rounded-lg p-2 transition ${isDarkMode ? 'hover:bg-[#1A1A1A] text-[#F5F5F5]' : 'hover:bg-[#F5F5F5] text-[#171717]'}`}
                            >
                                <ShoppingCart size={20} />
                                {cart.length > 0 && (
                                    <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-[#EA580C] text-[10px] font-bold text-white">
                                        {cart.reduce((s, i) => s + i.quantity, 0)}
                                    </span>
                                )}
                            </button>

                            {/* Notification Bell */}
                            <div className="relative">
                                <button
                                    type="button"
                                    onClick={() => setNotificationDropdown(!notificationDropdown)}
                                    className={`bh-touch relative flex items-center justify-center rounded-lg p-2 transition ${isDarkMode ? 'hover:bg-[#1A1A1A] text-[#F5F5F5]' : 'hover:bg-[#F5F5F5] text-[#171717]'}`}
                                >
                                    <Bell size={20} />
                                    {unreadCount > 0 && (
                                        <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
                                            {unreadCount}
                                        </span>
                                    )}
                                </button>
                                {notificationDropdown && (
                                    <div className={`absolute right-0 mt-2 w-[min(24rem,calc(100vw-1.5rem))] max-h-[min(24rem,70vh)] border rounded-xl flex flex-col z-50 overflow-hidden animate-fade-in ${isDarkMode ? 'bg-[#1A1A1A] border-[#2A2A2A]' : 'bg-white border-[#E5E7EB]'
                                        }`}>
                                        <div className="p-4 border-b flex justify-between items-center" style={{ borderColor: isDarkMode ? '#2A2A2A' : '#E5E7EB' }}>
                                            <h3 className={`font-bold ${isDarkMode ? 'text-[#F5F5F5]' : 'text-[#171717]'}`}>Notifications</h3>
                                            {unreadCount > 0 && (
                                                <span className="bg-[#EA580C] text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                                                    {unreadCount} New
                                                </span>
                                            )}
                                        </div>
                                        <div className="max-h-80 overflow-y-auto w-full">
                                            {notifications.length > 0 ? notifications.map((notif, idx) => (
                                                <div key={idx} className={`p-4 border-b transition-colors ${isDarkMode ? 'border-[#2A2A2A] hover:bg-[#111111]' : 'border-[#E5E7EB] hover:bg-[#FAFAFA]'}`}>
                                                    <div className="flex gap-3">
                                                        <div className={`mt-1 p-2 rounded-lg flex-shrink-0 h-8 w-8 flex items-center justify-center ${notif.status === 'delivered' ? (isDarkMode ? 'bg-emerald-500/15 text-emerald-400' : 'bg-emerald-100 text-emerald-600') :
                                                            notif.status === 'cancelled' ? (isDarkMode ? 'bg-red-500/15 text-red-400' : 'bg-red-100 text-red-600') :
                                                                notif.type === 'system' ? (isDarkMode ? 'bg-blue-500/15 text-blue-400' : 'bg-blue-100 text-blue-600') :
                                                                    (isDarkMode ? 'bg-[#EA580C]/15 text-[#EA580C]' : 'bg-[#EA580C]/10 text-[#EA580C]')
                                                            }`}>
                                                            {notif.status === 'delivered' ? <CheckCircle size={14} /> :
                                                                notif.status === 'cancelled' ? <X size={14} /> :
                                                                    notif.type === 'system' ? <Info size={14} /> :
                                                                        <Clock size={14} />}
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <div className="flex justify-between items-start mb-0.5">
                                                                <h4 className={`font-semibold text-sm truncate pr-2 ${isDarkMode ? 'text-[#F5F5F5]' : 'text-[#171717]'}`}>{notif.title}</h4>
                                                                <span className={`text-[10px] whitespace-nowrap font-medium ${isDarkMode ? 'text-[#A0A0A0]' : 'text-[#6B7280]'}`}>{formatNotifTime(notif.time)}</span>
                                                            </div>
                                                            <p className={`text-xs leading-relaxed ${isDarkMode ? 'text-[#A0A0A0]' : 'text-[#6B7280]'}`}>{notif.message}</p>
                                                        </div>
                                                    </div>
                                                </div>
                                            )) : (
                                                <div className="flex flex-col items-center justify-center text-center p-8">
                                                    <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-3 ${isDarkMode ? 'bg-[#111111]' : 'bg-[#FAFAFA]'}`}>
                                                        <Bell size={20} className={isDarkMode ? 'text-[#A0A0A0]' : 'text-[#6B7280]'} />
                                                    </div>
                                                    <p className={`text-sm font-medium ${isDarkMode ? 'text-[#F5F5F5]' : 'text-[#171717]'}`}>No notifications yet</p>
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
                <main className="bh-container py-4 pb-24 sm:py-6 sm:pb-24 md:py-8 md:pb-20">
                    {/* Error/Success Messages - Floating Toast */}
                    {(error || message) && (
                        <div className={`fixed top-20 left-4 right-4 z-[100] sm:left-auto sm:right-6 sm:min-w-[300px] sm:w-auto rounded-xl border px-4 py-3 text-sm flex items-center justify-between animate-fade-in font-medium ${messageType === 'success'
                            ? 'border-green-200 bg-green-50 text-green-700'
                            : 'border-red-200 bg-red-50 text-red-700'
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
                                className={`ml-2 p-1.5 rounded-full transition-colors flex-shrink-0 ${isDarkMode ? 'hover:bg-white/10' : 'hover:bg-black/5'}`}
                            >
                                <X size={16} className={messageType === 'success' ? 'text-green-600' : 'text-red-600'} />
                            </button>
                        </div>
                    )}

                    {error && (
                        <button
                            onClick={handleRetry}
                            className="mb-4 inline-flex items-center gap-2 px-4 py-2 bg-[#EA580C] text-white rounded-lg font-semibold hover:bg-orange-600 transition"
                        >
                            Retry Loading Data
                        </button>
                    )}

                    {activeTab === "dashboard" && (
                        <div className="max-w-7xl mx-auto space-y-6 animate-fade-in">
                            {/* Lightweight Greeting Section */}
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mt-2">
                                <div>
                                    <h1 className={`text-xl md:text-2xl font-bold ${isDarkMode ? 'text-[#F5F5F5]' : 'text-[#171717]'}`}>Hello, {userName}! 👋</h1>
                                    <p className={`text-xs mt-1 ${isDarkMode ? 'text-[#A0A0A0]' : 'text-[#6B7280]'}`}>
                                        Find your favorite campus meals & late-night snacks instantly.
                                    </p>
                                </div>
                                <button onClick={() => navigate("/orders")} className="bg-[#EA580C] text-white px-4 py-2 rounded-xl text-xs font-semibold hover:bg-orange-600 transition-all flex items-center gap-2 w-max shadow-sm">
                                    <MapPin size={14} /> View My Orders
                                </button>
                            </div>

                            <section>
                                <div className={`rounded-xl p-4 flex flex-col justify-between border ${isDarkMode ? 'bg-[#1A1A1A] border-[#2A2A2A]' : 'bg-white border-[#E5E7EB]'}`}>
                                    <div>
                                        <h3 className={`text-sm font-bold mb-0.5 ${isDarkMode ? 'text-[#F5F5F5]' : 'text-[#171717]'}`}>Delivery ETA</h3>
                                        <p className={`text-xs mb-3 ${isDarkMode ? 'text-[#A0A0A0]' : 'text-[#6B7280]'}`}>Average time to your campus</p>
                                        <div className="space-y-2.5">
                                            <div>
                                                <div className={`flex justify-between text-[10px] mb-1 ${isDarkMode ? 'text-[#A0A0A0]' : 'text-[#6B7280]'}`}>
                                                    <span>Current Status</span>
                                                    <span className="font-bold text-[#EA580C]">10 min</span>
                                                </div>
                                                <div className={`h-1.5 rounded-full overflow-hidden border ${isDarkMode ? 'bg-[#111111] border-[#2A2A2A]' : 'bg-[#FAFAFA] border-[#E5E7EB]'}`}>
                                                    <div className="h-full w-3/4 rounded-full bg-[#EA580C]"></div>
                                                </div>
                                            </div>
                                            <div>
                                                <div className={`flex justify-between text-[10px] mb-1 ${isDarkMode ? 'text-[#A0A0A0]' : 'text-[#6B7280]'}`}>
                                                    <span>Peak Record</span>
                                                    <span className="font-bold text-emerald-600">5 min</span>
                                                </div>
                                                <div className={`h-1.5 rounded-full overflow-hidden border ${isDarkMode ? 'bg-[#111111] border-[#2A2A2A]' : 'bg-[#FAFAFA] border-[#E5E7EB]'}`}>
                                                    <div className="h-full w-2/3 rounded-full bg-emerald-500"></div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className={`mt-3 flex items-center gap-1.5 text-[10px] font-medium ${isDarkMode ? 'text-[#A0A0A0]' : 'text-[#6B7280]'}`}>
                                        <Truck size={12} className="text-[#EA580C]" /> Real-time tracking enabled.
                                    </div>
                                </div>
                            </section>

                            {/* Featured Restaurants Carousel */}
                            <section>
                                <div className="flex items-center justify-between mb-3">
                                    <h2 className={`text-xl font-bold tracking-tight ${isDarkMode ? 'text-[#F5F5F5]' : 'text-[#171717]'}`}>Featured Restaurants</h2>
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => handleFeaturedScroll("prev")}
                                            className={`p-2 rounded-full border transition ${isDarkMode ? 'border-[#2A2A2A] text-[#A0A0A0] hover:bg-[#1A1A1A] hover:text-[#F5F5F5]' : 'border-[#E5E7EB] text-[#6B7280] hover:bg-[#FAFAFA] hover:text-[#171717]'}`}
                                            aria-label="Previous restaurants"
                                        >
                                            <ChevronRight className="rotate-180" size={18} />
                                        </button>
                                        <button
                                            onClick={() => handleFeaturedScroll("next")}
                                            className={`p-2 rounded-full border transition ${isDarkMode ? 'border-[#2A2A2A] text-[#A0A0A0] hover:bg-[#1A1A1A] hover:text-[#F5F5F5]' : 'border-[#E5E7EB] text-[#6B7280] hover:bg-[#FAFAFA] hover:text-[#171717]'}`}
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
                                            onClick={() => navigate(`/restaurant/${restaurant.id}`, { state: { restaurant } })}
                                            className={`min-w-[220px] max-w-[220px] border rounded-xl overflow-hidden hover:-translate-y-0.5 transition-all cursor-pointer group ${isDarkMode ? 'bg-[#1A1A1A] border-[#2A2A2A]' : 'bg-white border-[#E5E7EB]'}`}
                                        >
                                            <div className={`h-32 w-full overflow-hidden ${isDarkMode ? 'bg-[#111111]' : 'bg-[#FAFAFA]'}`}>
                                                <img
                                                    src={restaurant.image}
                                                    alt={restaurant.name}
                                                    className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500"
                                                />
                                            </div>
                                            <div className="p-3">
                                                <h3 className={`font-bold text-xs mb-0.5 truncate group-hover:text-[#EA580C] transition-colors ${isDarkMode ? 'text-[#F5F5F5]' : 'text-[#171717]'}`}>
                                                    {restaurant.name}
                                                </h3>
                                                <p className={`text-[10px] mb-2 ${isDarkMode ? 'text-[#A0A0A0]' : 'text-[#6B7280]'}`}>{restaurant.cuisine}</p>
                                                <div className="flex items-center justify-between text-[10px] mb-2">
                                                    <div className="flex items-center gap-0.5">
                                                        <Star size={12} className="text-yellow-400 fill-yellow-400" />
                                                        <span className={`font-black ${isDarkMode ? 'text-[#F5F5F5]' : 'text-[#171717]'}`}>
                                                            {restaurant.rating}
                                                        </span>
                                                        <span className={`font-bold ${isDarkMode ? 'text-[#A0A0A0]' : 'text-[#6B7280]'}`}>({restaurant.reviews})</span>
                                                    </div>
                                                </div>
                                                <div className={`flex items-center justify-between text-[11px] font-bold ${isDarkMode ? 'text-[#F5F5F5]' : 'text-[#171717]'}`}>
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

                            {/* Nearby Restaurants */}
                            <section className="mb-4">
                                <div className="flex items-center justify-between mb-3">
                                    <div className="flex flex-col">
                                        <h2 className={`text-xl font-bold tracking-tight flex items-center gap-2 ${isDarkMode ? 'text-[#F5F5F5]' : 'text-[#171717]'}`}>
                                            Nearby Restaurants <MapPin size={20} className="text-[#EA580C]" />
                                        </h2>
                                        <p className={`text-[10px] font-medium uppercase tracking-wider ${isDarkMode ? 'text-[#A0A0A0]' : 'text-[#6B7280]'}`}>Closest to your location</p>
                                    </div>
                                    <div className={`flex items-center gap-2 text-[10px] px-3 py-1.5 rounded-xl border ${isDarkMode ? 'text-[#A0A0A0] bg-[#1A1A1A] border-[#2A2A2A]' : 'text-[#6B7280] bg-white border-[#E5E7EB]'}`}>
                                        <span className="font-semibold">Max</span>
                                        <input
                                            type="range"
                                            min="1"
                                            max="10"
                                            value={maxDistance}
                                            onChange={(e) => setMaxDistance(Number(e.target.value))}
                                            className="accent-[#EA580C] w-16"
                                        />
                                        <span className="text-[#EA580C] font-bold">{maxDistance} km</span>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    {filteredRestaurants.map((restaurant) => (
                                        <div key={restaurant.id} className={`rounded-xl border transition-all overflow-hidden ${isDarkMode ? 'bg-[#1A1A1A] border-[#2A2A2A] hover:border-[#3A3A3A]' : 'bg-white border-[#E5E7EB] hover:border-[#D1D5DB]'}`}>
                                            <div
                                                onClick={() => setExpandedRestaurantId(expandedRestaurantId === restaurant.id ? null : restaurant.id)}
                                                className="flex items-center gap-3 p-3 cursor-pointer group"
                                            >
                                                <img
                                                    src={restaurant.image}
                                                    alt={restaurant.name}
                                                    className="flex-shrink-0 w-14 h-14 rounded-lg object-cover group-hover:scale-105 transition-transform duration-500"
                                                    onError={(e) => { e.target.style.display = 'none'; }}
                                                />
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex justify-between items-start">
                                                        <h3 className={`font-bold text-sm truncate group-hover:text-[#EA580C] transition-colors ${isDarkMode ? 'text-[#F5F5F5]' : 'text-[#171717]'}`}>{restaurant.name}</h3>
                                                        <span className={`flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${isDarkMode ? 'bg-[#EA580C] text-white' : 'bg-[#EA580C]/10 text-[#EA580C]'}`}>
                                                            <MapPin size={10} /> {restaurant.distance}
                                                        </span>
                                                    </div>
                                                    <p className={`text-[10px] truncate ${isDarkMode ? 'text-[#A0A0A0]' : 'text-[#6B7280]'}`}>{restaurant.cuisines ? restaurant.cuisines.join(', ') : (restaurant.cuisine || restaurant.type || 'Restaurant')}</p>
                                                    <div className={`flex items-center gap-2 mt-0.5 text-[10px] ${isDarkMode ? 'text-[#A0A0A0]' : 'text-[#6B7280]'}`}>
                                                        <Star size={10} className="text-yellow-400 fill-yellow-400" />
                                                        <span className="font-semibold">{restaurant.rating}</span>
                                                        <span className={isDarkMode ? 'text-[#6B7280]' : 'text-[#9CA3AF]'}>({restaurant.reviews})</span>
                                                        <span className={isDarkMode ? 'text-[#6B7280]' : 'text-[#9CA3AF]'}>•</span>
                                                        <Clock size={10} className={isDarkMode ? 'text-[#6B7280]' : 'text-[#9CA3AF]'} />
                                                        <span className={isDarkMode ? 'text-[#6B7280]' : 'text-[#9CA3AF]'}>{restaurant.deliveryTime} min</span>
                                                    </div>
                                                </div>
                                                <span className={`p-1 ${isDarkMode ? 'text-[#3A3A3A]' : 'text-[#D1D5DB]'}`}>
                                                    {expandedRestaurantId === restaurant.id ? <ChevronDown size={14} className="rotate-180 transition-transform" /> : <ChevronDown size={14} className="transition-transform" />}
                                                </span>
                                            </div>

                                            {/* Expanded Content */}
                                            {expandedRestaurantId === restaurant.id && (
                                                <div className={`p-4 pt-0 border-t animate-fade-in flex flex-col ${isDarkMode ? 'border-[#2A2A2A] bg-[#111111]' : 'border-[#E5E7EB] bg-[#FAFAFA]'}`}>
                                                    <div className={`w-full h-32 md:h-48 mt-4 rounded-xl overflow-hidden flex-shrink-0 border ${isDarkMode ? 'bg-[#111111] border-[#2A2A2A]' : 'bg-gray-200 border-[#E5E7EB]'}`}>
                                                        <img src={restaurant.image} className="w-full h-full object-cover hover:scale-105 transition-transform duration-500" alt={restaurant.name} onError={(e) => e.target.style.display = 'none'} />
                                                    </div>
                                                    <div className={`mb-4 pt-4 text-sm flex flex-col gap-2 ${isDarkMode ? 'text-[#A0A0A0]' : 'text-[#6B7280]'}`}>
                                                        {restaurant.description && <p className="leading-relaxed">{restaurant.description}</p>}
                                                        <div className="flex flex-wrap gap-3 mt-1 text-xs">
                                                            {restaurant.address && <span className={`flex items-center gap-1 font-medium px-2 py-1 rounded-lg border ${isDarkMode ? 'bg-[#1A1A1A] border-[#2A2A2A]' : 'bg-white border-[#E5E7EB]'}`}><MapPin size={14} className="text-[#EA580C]" /> {restaurant.address}</span>}
                                                            {restaurant.phone && <span className={`flex items-center gap-1 font-medium px-2 py-1 rounded-lg border ${isDarkMode ? 'bg-[#1A1A1A] border-[#2A2A2A]' : 'bg-white border-[#E5E7EB]'}`}>📞 {restaurant.phone}</span>}
                                                        </div>
                                                    </div>
                                                    <h4 className={`font-bold mb-3 text-sm ${isDarkMode ? 'text-[#F5F5F5]' : 'text-[#171717]'}`}>Popular Menu Items</h4>
                                                    <div className="space-y-2">
                                                        {popularFoods.filter(f => f.restaurant === restaurant.name).length > 0 ? (
                                                            popularFoods.filter(f => f.restaurant === restaurant.name).slice(0, 4).map(food => (
                                                                <div key={food.id} className={`flex justify-between items-center p-3 rounded-xl border ${isDarkMode ? 'bg-[#1A1A1A] border-[#2A2A2A]' : 'bg-white border-[#E5E7EB]'}`}>
                                                                    <div className="flex items-center gap-3">
                                                                        <img src={food.image} className="w-12 h-12 rounded-lg object-cover" alt={food.name} onError={(e) => { e.target.style.display = 'none'; }} />
                                                                        <div>
                                                                            <h5 className={`font-bold text-sm ${isDarkMode ? 'text-[#F5F5F5]' : 'text-[#171717]'}`}>{food.name}</h5>
                                                                            <div className="flex flex-col">
                                                                                <p className={`text-sm font-bold ${isDarkMode ? 'text-[#F5F5F5]' : 'text-[#171717]'}`}>₱{food.price}</p>
                                                                                <p className={`text-xs ${isDarkMode ? 'text-[#A0A0A0]' : 'text-[#6B7280]'}`}>₱{(food.price * (1 - (food.discount || 0) / 100)).toFixed(2)}</p>
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                    <button onClick={(e) => { e.stopPropagation(); addToCart(food); }} className={`p-2 rounded-lg transition ${isDarkMode ? 'bg-[#EA580C]/10 text-[#EA580C] hover:bg-[#EA580C]/20' : 'bg-[#EA580C]/10 text-[#EA580C] hover:bg-[#EA580C]/20'}`}>
                                                                        <Plus size={16} />
                                                                    </button>
                                                                </div>
                                                            ))
                                                        ) : (
                                                            <p className={`text-xs italic ${isDarkMode ? 'text-[#6B7280]' : 'text-[#9CA3AF]'}`}>Menu items currently unavailable.</p>
                                                        )}
                                                    </div>
                                                    <div className="mt-4 flex justify-end">
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); navigate(`/restaurant/${restaurant.id}`, { state: { restaurant } }); }}
                                                            className="px-5 py-2.5 bg-[#EA580C] text-white rounded-xl font-semibold hover:bg-orange-600 transition w-full md:w-auto mt-2"
                                                        >
                                                            View All Items
                                                        </button>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                    {filteredRestaurants.length === 0 && (
                                        <div className="text-center py-8">
                                            <p className={`font-medium text-xs ${isDarkMode ? 'text-[#6B7280]' : 'text-[#9CA3AF]'}`}>No restaurants found within {maxDistance} km</p>
                                        </div>
                                    )}
                                </div>
                            </section>

                            {/* Popular Items Carousel */}
                            {topSellingItems.length > 0 && (
                                <section>
                                    <div className="flex items-center justify-between mb-3">
                                        <div className="flex flex-col">
                                            <h2 className={`text-xl font-bold tracking-tight flex items-center gap-2 ${isDarkMode ? 'text-[#F5F5F5]' : 'text-[#171717]'}`}>
                                                Popular Items <TrendingUp size={20} className="text-[#EA580C]" />
                                            </h2>
                                            <p className={`text-[10px] font-medium uppercase tracking-wider ${isDarkMode ? 'text-[#A0A0A0]' : 'text-[#6B7280]'}`}>Most ordered this week</p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => handlePopularScroll("prev")}
                                                className={`p-2 rounded-full border transition ${isDarkMode ? 'border-[#2A2A2A] text-[#A0A0A0] hover:bg-[#1A1A1A] hover:text-[#F5F5F5]' : 'border-[#E5E7EB] text-[#6B7280] hover:bg-[#FAFAFA] hover:text-[#171717]'}`}
                                                aria-label="Previous popular items"
                                            >
                                                <ChevronRight className="rotate-180" size={18} />
                                            </button>
                                            <button
                                                onClick={() => handlePopularScroll("next")}
                                                className={`p-2 rounded-full border transition ${isDarkMode ? 'border-[#2A2A2A] text-[#A0A0A0] hover:bg-[#1A1A1A] hover:text-[#F5F5F5]' : 'border-[#E5E7EB] text-[#6B7280] hover:bg-[#FAFAFA] hover:text-[#171717]'}`}
                                                aria-label="Next popular items"
                                            >
                                                <ChevronRight size={18} />
                                            </button>
                                        </div>
                                    </div>
                                    <div
                                        ref={popularRef}
                                        className="flex gap-4 overflow-x-auto pb-4 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent scroll-smooth no-scrollbar"
                                        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                                    >
                                        {topSellingItems.map((food) => {
                                            const isOOS = food.current_stock !== null && food.current_stock !== undefined && food.current_stock <= 0;
                                            return (
                                                <div
                                                    key={`popular-${food.id}`}
                                                    onClick={() => { if (!isOOS) { setSelectedFood(food); setSelectedModalSize('Medium'); setShowFoodModal(true); } }}
                                                    className={`min-w-[180px] max-w-[180px] border rounded-xl overflow-hidden hover:-translate-y-1 transition-all cursor-pointer group flex flex-col h-full ${isDarkMode ? 'bg-[#1A1A1A] border-[#2A2A2A]' : 'bg-white border-[#E5E7EB]'}`}
                                                >
                                                    <div className="h-28 w-full overflow-hidden relative">
                                                        <img
                                                            src={food.image}
                                                            alt={food.name}
                                                            className={`h-full w-full object-cover group-hover:scale-110 transition-transform duration-700 ${isOOS ? 'grayscale' : ''}`}
                                                        />
                                                        {food.orderCount > 0 && (
                                                            <div className="absolute top-2 right-2 bg-[#171717] text-white text-[9px] font-black px-2 py-0.5 rounded-full flex items-center gap-1">
                                                                <Package size={10} /> {food.orderCount}+ Sold
                                                            </div>
                                                        )}
                                                        {isOOS && (
                                                            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                                                                <span className="text-[10px] font-black text-white bg-red-600 px-2 py-0.5 rounded-full">SOLD OUT</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div className="p-3 flex-1 flex flex-col">
                                                        <h3 className={`font-bold text-xs mb-1 truncate group-hover:text-[#EA580C] transition-colors ${isDarkMode ? 'text-[#F5F5F5]' : 'text-[#171717]'}`}>
                                                            {food.name}
                                                        </h3>
                                                        <p className={`text-[10px] mb-2 truncate ${isDarkMode ? 'text-[#A0A0A0]' : 'text-[#6B7280]'}`}>{food.restaurant}</p>
                                                        <div className="mt-auto flex items-center justify-between">
                                                            <span className={`text-sm font-black ${isDarkMode ? 'text-[#F5F5F5]' : 'text-[#171717]'}`}>₱{Number(food.price).toFixed(2)}</span>
                                                            <div className="flex items-center gap-0.5">
                                                                <Star size={10} className="text-yellow-400 fill-yellow-400" />
                                                                <span className={`text-[10px] font-bold ${isDarkMode ? 'text-[#A0A0A0]' : 'text-[#6B7280]'}`}>{food.rating}</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </section>
                            )}

                            {/* Special Offers - Flash Sale */}
                            {flashSaleItems.length > 0 && (
                                <section className="mb-4">
                                    <div className="flex items-center justify-between mb-3 text-blue-600">
                                        <div className="flex flex-col">
                                            <h2 className={`text-xl font-black tracking-tight flex items-center gap-2 ${isDarkMode ? 'text-[#F5F5F5]' : 'text-[#171717]'}`}>
                                                Flash Sale <Zap size={20} className="fill-blue-600 text-blue-600" />
                                            </h2>
                                            <p className={`text-[10px] font-bold uppercase tracking-widest ${isDarkMode ? 'text-[#A0A0A0]' : 'text-[#6B7280]'}`}>=• 10% Discount • Resets Daily</p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => handleFlashScroll("prev")}
                                                className={`p-2 rounded-full border transition ${isDarkMode ? 'border-[#2A2A2A] text-[#A0A0A0] hover:bg-[#1A1A1A]' : 'border-[#E5E7EB] text-[#6B7280] hover:bg-[#FAFAFA]'}`}
                                            >
                                                <ChevronRight className="rotate-180" size={18} />
                                            </button>
                                            <button
                                                onClick={() => handleFlashScroll("next")}
                                                className={`p-2 rounded-full border transition ${isDarkMode ? 'border-[#2A2A2A] text-[#A0A0A0] hover:bg-[#1A1A1A]' : 'border-[#E5E7EB] text-[#6B7280] hover:bg-[#FAFAFA]'}`}
                                            >
                                                <ChevronRight size={18} />
                                            </button>
                                        </div>
                                    </div>
                                    <div
                                        ref={flashRef}
                                        className="flex gap-4 overflow-x-auto pb-4 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent scroll-smooth no-scrollbar"
                                        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                                    >
                                        {flashSaleItems.map((food) => {
                                            const isOOS = food.current_stock !== null && food.current_stock !== undefined && food.current_stock <= 0;
                                            const discountedPrice = food.price * (1 - (food.discount / 100));
                                            return (
                                                <div
                                                    key={`flash-${food.id}`}
                                                    onClick={() => { if (!isOOS) { setSelectedFood(food); setSelectedModalSize('Medium'); setShowFoodModal(true); } }}
                                                    className={`min-w-[180px] max-w-[180px] border rounded-xl overflow-hidden hover:-translate-y-1 transition-all cursor-pointer group flex flex-col h-full ${isDarkMode ? 'bg-[#1A1A1A] border-[#2A2A2A]' : 'bg-white border-[#E5E7EB]'
                                                        }`}
                                                >
                                                    <div className="h-28 w-full overflow-hidden relative">
                                                        <img
                                                            src={food.image}
                                                            alt={food.name}
                                                            className={`h-full w-full object-cover group-hover:scale-110 transition-transform duration-700 ${isOOS ? 'grayscale' : ''}`}
                                                        />
                                                        <div className="absolute top-2 left-2 bg-blue-600 text-white text-[10px] font-black px-2 py-0.5 rounded-full">
                                                            -{food.discount}%
                                                        </div>
                                                        {isOOS && (
                                                            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                                                                <span className="text-[10px] font-black text-white bg-red-600 px-2 py-0.5 rounded-full">SOLD OUT</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div className="p-3 flex-1 flex flex-col">
                                                        <h3 className={`font-bold text-xs mb-1 truncate group-hover:text-blue-500 transition-colors ${isDarkMode ? 'text-[#F5F5F5]' : 'text-[#171717]'}`}>
                                                            {food.name}
                                                        </h3>
                                                        <p className={`text-[10px] mb-2 truncate ${isDarkMode ? 'text-[#A0A0A0]' : 'text-[#6B7280]'}`}>{food.restaurant}</p>
                                                        <div className="mt-auto flex flex-col">
                                                            <div className="flex items-center gap-1.5">
                                                                <span className="text-sm font-black text-blue-600">₱{discountedPrice.toFixed(2)}</span>
                                                                <span className={`text-[10px] line-through ${isDarkMode ? 'text-[#6B7280]' : 'text-[#9CA3AF]'}`}>₱{Number(food.price).toFixed(2)}</span>
                                                            </div>
                                                            <div className="flex items-center gap-0.5 mt-1">
                                                                <Star size={10} className="text-yellow-400 fill-yellow-400" />
                                                                <span className={`text-[10px] font-bold ${isDarkMode ? 'text-[#A0A0A0]' : 'text-[#6B7280]'}`}>{food.rating}</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </section>
                            )}

                            {/* ====== RECENTLY ORDERED ====== */}
                            <section className="mb-6">
                                <div className="flex items-center justify-between mb-3">
                                    <div className="flex flex-col">
                                        <h2 className={`text-xl font-bold tracking-tight flex items-center gap-2 ${isDarkMode ? 'text-[#F5F5F5]' : 'text-[#171717]'}`}>
                                            Recently Ordered <RotateCcw size={20} className="text-emerald-500" />
                                        </h2>
                                        <p className={`text-[10px] font-medium uppercase tracking-wider ${isDarkMode ? 'text-[#A0A0A0]' : 'text-[#6B7280]'}`}>Quick reorder your favorites</p>
                                    </div>
                                    {recentlyOrdered.length > 0 && (
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => handleRecentlyOrderedScroll("prev")}
                                                className={`p-2 rounded-full border transition ${isDarkMode ? 'border-[#2A2A2A] text-[#A0A0A0] hover:bg-[#1A1A1A]' : 'border-[#E5E7EB] text-[#6B7280] hover:bg-[#FAFAFA] hover:text-[#171717]'}`}
                                                aria-label="Previous recently ordered"
                                            >
                                                <ChevronRight className="rotate-180" size={18} />
                                            </button>
                                            <button
                                                onClick={() => handleRecentlyOrderedScroll("next")}
                                                className={`p-2 rounded-full border transition ${isDarkMode ? 'border-[#2A2A2A] text-[#A0A0A0] hover:bg-[#1A1A1A]' : 'border-[#E5E7EB] text-[#6B7280] hover:bg-[#FAFAFA] hover:text-[#171717]'}`}
                                                aria-label="Next recently ordered"
                                            >
                                                <ChevronRight size={18} />
                                            </button>
                                        </div>
                                    )}
                                </div>

                                {recentlyOrdered.length > 0 ? (
                                    <div
                                        ref={recentlyOrderedRef}
                                        className="flex gap-4 overflow-x-auto pb-4 scroll-smooth no-scrollbar"
                                        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                                    >
                                        {recentlyOrdered.map((item) => {
                                            const isOOS = item.current_stock !== null && item.current_stock !== undefined && item.current_stock <= 0;
                                            return (
                                                <div
                                                    key={`recent-${item.id}`}
                                                    className={`min-w-[220px] max-w-[220px] border rounded-xl overflow-hidden transition-all duration-300 cursor-pointer group flex flex-col h-full
                                                        ${isOOS
                                                            ? isDarkMode ? 'bg-[#1A1A1A] border-[#2A2A2A] opacity-60' : 'bg-[#FAFAFA] border-[#E5E7EB] opacity-60'
                                                            : isDarkMode
                                                                ? 'bg-[#1A1A1A] border-[#2A2A2A] hover:border-emerald-500/60 hover:-translate-y-1'
                                                                : 'bg-white border-[#E5E7EB] hover:border-emerald-300 hover:-translate-y-1'
                                                        }`}
                                                >
                                                    {/* Food Image */}
                                                    <div className="h-32 w-full overflow-hidden relative">
                                                        <img
                                                            src={item.image}
                                                            alt={item.name}
                                                            className={`h-full w-full object-cover group-hover:scale-110 transition-transform duration-700 ${isOOS ? 'grayscale' : ''}`}
                                                            onError={(e) => { e.target.style.display = 'none'; }}
                                                        />
                                                        {/* Time badge */}
                                                        <div className={`absolute top-2 left-2 text-[9px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1 border ${isDarkMode ? 'bg-[#111111] text-[#A0A0A0] border-[#2A2A2A]' : 'bg-white text-[#6B7280] border-[#E5E7EB]'}`}>
                                                            <Clock size={10} />
                                                            {formatRecentDate(item.lastOrderedAt)}
                                                        </div>
                                                        {isOOS && (
                                                            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                                                                <span className="text-[10px] font-black text-white bg-red-600 px-2 py-0.5 rounded-full">SOLD OUT</span>
                                                            </div>
                                                        )}
                                                    </div>

                                                    {/* Card Content */}
                                                    <div className="p-3 flex-1 flex flex-col">
                                                        <h3 className={`font-bold text-xs mb-0.5 truncate group-hover:text-emerald-600 transition-colors ${isDarkMode ? 'text-[#F5F5F5]' : 'text-[#171717]'}`}>
                                                            {item.name}
                                                        </h3>
                                                        <p className={`text-[10px] mb-1.5 line-clamp-2 leading-relaxed ${isDarkMode ? 'text-[#A0A0A0]' : 'text-[#6B7280]'}`}>
                                                            {item.description}
                                                        </p>
                                                        <p className={`text-[10px] mb-2 truncate font-medium ${isDarkMode ? 'text-[#6B7280]' : 'text-[#9CA3AF]'}`}>
                                                            {item.restaurant}
                                                        </p>

                                                        {/* Price + Rating */}
                                                        <div className="flex items-center justify-between mb-2.5">
                                                            <span className={`text-sm font-black ${isDarkMode ? 'text-emerald-400' : 'text-[#171717]'}`}>₱{Number(item.price).toFixed(2)}</span>
                                                            <div className="flex items-center gap-0.5">
                                                                <Star size={10} className="text-yellow-400 fill-yellow-400" />
                                                                <span className={`text-[10px] font-bold ${isDarkMode ? 'text-[#A0A0A0]' : 'text-[#6B7280]'}`}>{item.rating}</span>
                                                            </div>
                                                        </div>

                                                        {/* Order Again Button */}
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                if (!isOOS) handleOrderAgain(item);
                                                            }}
                                                            disabled={isOOS}
                                                            className={`mt-auto w-full flex items-center justify-center gap-1.5 py-2 rounded-xl text-[11px] font-bold transition-all duration-300
                                                                ${isOOS
                                                                    ? isDarkMode ? 'bg-[#111111] text-[#6B7280] cursor-not-allowed' : 'bg-[#F5F5F5] text-[#9CA3AF] cursor-not-allowed'
                                                                    : 'bg-emerald-600 text-white hover:bg-emerald-700 active:scale-[0.97]'
                                                                }`}
                                                        >
                                                            <RefreshCw size={12} className={!isOOS ? 'group-hover:rotate-180 transition-transform duration-500' : ''} />
                                                            {isOOS ? 'Unavailable' : 'Order Again'}
                                                        </button>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                ) : (
                                    /* Empty State */
                                    <div className={`flex flex-col items-center justify-center py-12 rounded-xl border-2 border-dashed transition-colors
                                        ${isDarkMode ? 'border-[#2A2A2A] bg-[#1A1A1A]' : 'border-[#E5E7EB] bg-white'}`}>
                                        <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 ${isDarkMode ? 'bg-[#111111]' : 'bg-[#FAFAFA]'}`}>
                                            <ShoppingBag size={28} className={isDarkMode ? 'text-[#A0A0A0]' : 'text-[#6B7280]'} />
                                        </div>
                                        <h3 className={`text-sm font-bold mb-1 ${isDarkMode ? 'text-[#F5F5F5]' : 'text-[#171717]'}`}>No recent orders yet</h3>
                                        <p className={`text-xs text-center max-w-xs leading-relaxed ${isDarkMode ? 'text-[#A0A0A0]' : 'text-[#6B7280]'}`}>
                                            Your recently ordered items will appear here for quick reordering. Start exploring our menu!
                                        </p>
                                        <button
                                            onClick={() => {
                                                if (browseFoodRef.current) {
                                                    browseFoodRef.current.scrollIntoView({ behavior: 'smooth' })
                                                }
                                            }}
                                            className="mt-4 inline-flex items-center gap-2 px-5 py-2 bg-emerald-600 text-white text-xs font-bold rounded-xl hover:bg-emerald-700 transition-all"
                                        >
                                            <Utensils size={14} /> Browse Menu
                                        </button>
                                    </div>
                                )}
                            </section>

                            {/* ====== EXPLORE MENU ====== */}
                            <section ref={browseFoodRef} className="scroll-mt-24">
                                {/* Header */}
                                <div className="mb-3 flex items-end justify-between gap-3">
                                    <div className="min-w-0">
                                        <h2 className={`text-lg font-black tracking-tight ${isDarkMode ? 'text-[#F5F5F5]' : 'text-[#171717]'}`}>Explore Menu</h2>
                                        <p className={`text-[11px] ${isDarkMode ? 'text-[#A0A0A0]' : 'text-[#6B7280]'}`}>
                                            {activeCategoryFilter === 'All' ? 'All available dishes' : `Showing ${activeCategoryFilter}`}
                                        </p>
                                    </div>
                                    <span className={`shrink-0 text-[11px] font-semibold ${isDarkMode ? 'text-[#A0A0A0]' : 'text-[#6B7280]'}`}>
                                        {filteredFoods.length} items
                                    </span>
                                </div>

                                {/* Category Chips */}
                                <div className="-mx-3 mb-3 flex gap-2 overflow-x-auto px-3 pb-1 scrollbar-none sm:mx-0 sm:flex-wrap sm:px-0">
                                    {['All', 'Main', 'Drinks', 'Snack', 'Dessert', 'Budget Meal', ...categories.map(c => c.name)]
                                        .filter((v, i, a) => a.indexOf(v) === i)
                                        .map(cat => {
                                            const isActive = activeCategoryFilter === cat;
                                            const catIcons = { All: '🍽️', Main: '🍛', Drinks: '🧋', Snack: '🍟', Dessert: '🍰', 'Budget Meal': '🍱' };
                                            const icon = catIcons[cat] || '🏷️';
                                            return (
                                                <button
                                                    key={cat}
                                                    onClick={() => setActiveCategoryFilter(cat)}
                                                    className={`flex h-9 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border px-3 text-[12px] font-semibold transition ${isActive
                                                        ? 'border-[#EA580C] bg-[#EA580C] text-white'
                                                        : isDarkMode
                                                            ? 'border-[#2A2A2A] bg-[#1A1A1A] text-[#A0A0A0] hover:border-[#3A3A3A]'
                                                            : 'border-[#E5E7EB] bg-white text-[#6B7280] hover:border-[#EA580C] hover:text-[#EA580C]'
                                                        }`}
                                                >
                                                    <span className="text-sm leading-none">{icon}</span>
                                                    {cat}
                                                </button>
                                            );
                                        })}
                                </div>

                                {/* Filter Row */}
                                <div className={`mb-3 flex items-center gap-2 overflow-x-auto rounded-xl border px-2.5 py-2 scrollbar-none ${isDarkMode ? 'bg-[#1A1A1A] border-[#2A2A2A]' : 'bg-white border-[#E5E7EB]'}`}>
                                    <div className={`flex h-8 shrink-0 items-center gap-1.5 rounded-lg border px-2.5 text-[11px] ${isDarkMode ? 'bg-[#111111] border-[#2A2A2A] text-[#A0A0A0]' : 'bg-[#FAFAFA] border-[#E5E7EB] text-[#6B7280]'}`}>
                                        <Sliders size={12} />
                                        <span className="font-semibold">Price</span>
                                        <input type="range" min="5" max="2000" value={priceFilter} onChange={(e) => setPriceFilter(Number(e.target.value))} className="w-16 accent-[#EA580C]" aria-label="Maximum price" />
                                        <span className="font-bold text-[#EA580C]">{priceFilter === 2000 ? 'Any' : `≤₱${priceFilter}`}</span>
                                    </div>
                                    <div className={`flex h-8 shrink-0 items-center gap-1 rounded-lg border px-2.5 ${isDarkMode ? 'bg-[#111111] border-[#2A2A2A]' : 'bg-[#FAFAFA] border-[#E5E7EB]'}`}>
                                        <span className={`text-[11px] font-semibold ${isDarkMode ? 'text-[#A0A0A0]' : 'text-[#6B7280]'}`}>Rating</span>
                                        <div className="flex gap-0.5">
                                            {[1, 2, 3, 4, 5].map(n => (
                                                <button key={n} onClick={() => setMinRating(minRating === n ? 0 : n)} aria-label={`Minimum ${n} stars`}>
                                                    <Star size={13} className={n <= minRating ? 'text-yellow-400 fill-yellow-400' : isDarkMode ? 'text-[#3A3A3A] fill-[#3A3A3A]' : 'text-[#D1D5DB] fill-[#D1D5DB]'} />
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                {/* Food Grid */}
                                <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 sm:gap-3 lg:grid-cols-4 xl:grid-cols-5">
                                    {filteredFoods.length === 0 ? (
                                        <div className="col-span-full flex flex-col items-center justify-center gap-3 py-16">
                                            <div className={`flex h-16 w-16 items-center justify-center rounded-full ${isDarkMode ? 'bg-[#1A1A1A]' : 'bg-[#FAFAFA]'}`}>
                                                <Utensils size={28} className={isDarkMode ? 'text-[#A0A0A0]' : 'text-[#6B7280]'} />
                                            </div>
                                            <p className={`text-sm font-bold ${isDarkMode ? 'text-[#A0A0A0]' : 'text-[#6B7280]'}`}>No items in "{activeCategoryFilter}"</p>
                                            <p className={`max-w-xs text-center text-xs ${isDarkMode ? 'text-[#6B7280]' : 'text-[#9CA3AF]'}`}>Try adjusting your filters or select a different category</p>
                                            <button onClick={() => { setPriceFilter(2000); setMinRating(0); }} className="mt-2 text-xs font-semibold text-[#EA580C] transition hover:text-orange-600">Reset Filters</button>
                                        </div>
                                    ) : (
                                        filteredFoods.map((food) => (
                                            <FoodMenuCard
                                                key={food.id}
                                                food={food}
                                                isDarkMode={isDarkMode}
                                                isFavorite={favorites.has(food.id)}
                                                onToggleFavorite={toggleFavorite}
                                                onOpen={(f) => { setSelectedFood(f); setSelectedModalSize('Medium'); setShowFoodModal(true); }}
                                                onAddToCart={(f) => addToCart(f, null, false)}
                                            />
                                        ))
                                    )}
                                </div>
                            </section>

                        </div>
                    )}



                    {/* Profile Tab */}
                    {activeTab === "profile" && (
                        <div className="max-w-7xl mx-auto space-y-6 animate-fade-in">
                            <section className="bg-[#EA580C] rounded-xl p-6 md:p-8 text-white flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
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
                                            className="bg-white text-[#EA580C] px-6 py-2.5 rounded-full text-sm font-semibold flex items-center gap-2 hover:bg-orange-50 transition-all"
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
                                            className="bg-white text-[#EA580C] px-6 py-2.5 flex items-center gap-2 rounded-full text-sm font-semibold hover:bg-orange-50 transition-all"
                                        >
                                            <Utensils size={18} /> Browse Food
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setActiveTab("orders")}
                                            className="bg-white text-[#EA580C] px-4 py-2.5 flex items-center gap-2 rounded-full text-sm font-medium hover:bg-orange-50 transition-all"
                                        >
                                            <Package size={18} /> View Orders
                                        </button>
                                    </div>
                                </div>
                                <div className="grid grid-cols-3 gap-3 w-full md:w-auto md:min-w-[280px]">
                                    <div className="bg-white/10 rounded-xl px-3 py-3 sm:px-4">
                                        <p className="text-[10px] sm:text-xs text-orange-100">Active Orders</p>
                                        <p className="text-xl sm:text-2xl font-bold tabular-nums">{profileActivityMetrics.activeOrdersCount}</p>
                                    </div>
                                    <div className="bg-white/10 rounded-xl px-3 py-3 sm:px-4">
                                        <p className="text-[10px] sm:text-xs text-orange-100">Saved Items</p>
                                        <p className="text-xl sm:text-2xl font-bold tabular-nums">{favorites.size}</p>
                                    </div>
                                    <div className="bg-white/10 rounded-xl px-3 py-3 sm:px-4">
                                        <p className="text-[10px] sm:text-xs text-orange-100">This Week</p>
                                        <p className="text-lg sm:text-2xl font-bold tabular-nums">
                                            ₱{Math.round(profileActivityMetrics.thisWeekSpent).toLocaleString()}
                                        </p>
                                    </div>
                                </div>
                            </section>

                            <h2 className={`text-xl font-bold mb-2 ${isDarkMode ? 'text-[#F5F5F5]' : 'text-[#171717]'}`}>My Profile</h2>

                            {userProfile && (
                                <section className={`rounded-xl p-6 md:p-8 border ${isDarkMode ? 'bg-[#1A1A1A] border-[#2A2A2A]' : 'bg-white border-[#E5E7EB]'}`}>
                                    <h3 className={`font-bold text-xl mb-4 ${isDarkMode ? 'text-[#F5F5F5]' : 'text-[#171717]'}`}>Account Details</h3>
                                    <div className="space-y-4 max-w-lg">
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className={`block text-sm font-medium mb-1 ${isDarkMode ? 'text-[#A0A0A0]' : 'text-[#6B7280]'}`}>Full Name</label>
                                                <p className={`font-semibold p-3 rounded-xl border ${isDarkMode ? 'text-[#F5F5F5] bg-[#111111] border-[#2A2A2A]' : 'text-[#171717] bg-[#FAFAFA] border-[#E5E7EB]'}`}>{userProfile.full_name || "N/A"}</p>
                                            </div>
                                            <div>
                                                <label className={`block text-sm font-medium mb-1 ${isDarkMode ? 'text-[#A0A0A0]' : 'text-[#6B7280]'}`}>Email</label>
                                                <p className={`font-semibold p-3 rounded-xl border truncate ${isDarkMode ? 'text-[#F5F5F5] bg-[#111111] border-[#2A2A2A]' : 'text-[#171717] bg-[#FAFAFA] border-[#E5E7EB]'}`} title={userProfile.email}>{userProfile.email || "N/A"}</p>
                                            </div>
                                        </div>
                                        <div>
                                            <label className={`block text-sm font-medium mb-1 ${isDarkMode ? 'text-[#A0A0A0]' : 'text-[#6B7280]'}`}>Academic Department</label>
                                            <p className={`font-semibold p-3 rounded-xl border ${isDarkMode ? 'text-[#F5F5F5] bg-[#111111] border-[#2A2A2A]' : 'text-[#171717] bg-[#FAFAFA] border-[#E5E7EB]'}`}>
                                                {userProfile.department || "N/A"}
                                            </p>
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className={`block text-sm font-medium mb-1 ${isDarkMode ? 'text-[#A0A0A0]' : 'text-[#6B7280]'}`}>Course / Program</label>
                                                <p className={`font-semibold p-3 rounded-xl border ${isDarkMode ? 'text-[#F5F5F5] bg-[#111111] border-[#2A2A2A]' : 'text-[#171717] bg-[#FAFAFA] border-[#E5E7EB]'}`}>
                                                    {userProfile.course || "N/A"}
                                                </p>
                                            </div>
                                            <div>
                                                <label className={`block text-sm font-medium mb-1 ${isDarkMode ? 'text-[#A0A0A0]' : 'text-[#6B7280]'}`}>Academic Year</label>
                                                <p className={`font-semibold p-3 rounded-xl border ${isDarkMode ? 'text-[#F5F5F5] bg-[#111111] border-[#2A2A2A]' : 'text-[#171717] bg-[#FAFAFA] border-[#E5E7EB]'}`}>
                                                    {userProfile.year || "N/A"}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </section>
                            )}

                            <UserActivityAnalytics orders={orders} isDarkMode={isDarkMode} />

                            <section className={`rounded-xl p-6 md:p-8 border ${isDarkMode ? 'bg-[#1A1A1A] border-[#2A2A2A]' : 'bg-white border-[#E5E7EB]'}`}>
                                <h3 className={`font-bold text-xl mb-4 ${isDarkMode ? 'text-[#F5F5F5]' : 'text-[#171717]'}`}>Saved Contact Data</h3>
                                <div className="space-y-4 max-w-lg">
                                    <div>
                                        <label className={`block text-sm font-medium mb-1 ${isDarkMode ? 'text-[#A0A0A0]' : 'text-[#6B7280]'}`}>Default Delivery Address</label>
                                        <input
                                            type="text"
                                            value={checkoutInfo.deliveryAddress}
                                            onChange={(e) => setCheckoutInfo(prev => ({ ...prev, deliveryAddress: e.target.value }))}
                                            className={`w-full px-4 py-3 rounded-xl focus:ring-2 focus:ring-[#EA580C] outline-none transition border ${isDarkMode ? 'bg-[#111111] border-[#2A2A2A] text-[#F5F5F5]' : 'bg-white border-[#E5E7EB] text-[#171717]'}`}
                                            placeholder="Enter your address"
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className={`block text-sm font-medium mb-1 ${isDarkMode ? 'text-[#A0A0A0]' : 'text-[#6B7280]'}`}>Default City</label>
                                            <input
                                                type="text"
                                                value={checkoutInfo.deliveryCity}
                                                onChange={(e) => setCheckoutInfo(prev => ({ ...prev, deliveryCity: e.target.value }))}
                                                className={`w-full px-4 py-3 rounded-xl focus:ring-2 focus:ring-[#EA580C] outline-none transition border ${isDarkMode ? 'bg-[#111111] border-[#2A2A2A] text-[#F5F5F5]' : 'bg-white border-[#E5E7EB] text-[#171717]'}`}
                                                placeholder="Enter your city"
                                            />
                                        </div>
                                        <div>
                                            <label className={`block text-sm font-medium mb-1 ${isDarkMode ? 'text-[#A0A0A0]' : 'text-[#6B7280]'}`}>Phone Number</label>
                                            <input
                                                type="tel"
                                                value={checkoutInfo.phone}
                                                onChange={(e) => setCheckoutInfo(prev => ({ ...prev, phone: e.target.value }))}
                                                className={`w-full px-4 py-3 rounded-xl focus:ring-2 focus:ring-[#EA580C] outline-none transition border ${isDarkMode ? 'bg-[#111111] border-[#2A2A2A] text-[#F5F5F5]' : 'bg-white border-[#E5E7EB] text-[#171717]'}`}
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
                                            className="w-full md:w-auto px-6 py-3 bg-[#EA580C] text-white rounded-xl font-bold hover:bg-orange-600 transition-all flex items-center justify-center gap-2"
                                        >
                                            <Check size={18} /> Save Contact Data
                                        </button>
                                    </div>
                                </div>
                            </section>

                            <section className={`rounded-xl p-6 md:p-8 border ${isDarkMode ? 'bg-[#1A1A1A] border-[#2A2A2A]' : 'bg-white border-[#E5E7EB]'}`}>
                                <h3 className={`font-bold text-xl mb-4 ${isDarkMode ? 'text-[#F5F5F5]' : 'text-[#171717]'}`}>App Preferences</h3>
                                <div className="space-y-4 max-w-lg">

                                    {!showLogoutConfirm ? (
                                        <button
                                            onClick={() => setShowLogoutConfirm(true)}
                                            className={`w-full text-left px-5 py-3.5 rounded-xl border text-sm font-semibold text-red-600 flex items-center justify-between transition-all group ${isDarkMode ? 'border-[#2A2A2A] hover:border-red-500/40 hover:bg-red-500/10' : 'border-red-100 hover:border-red-200 hover:bg-red-50'}`}
                                        >
                                            <div className="flex items-center gap-3">
                                                <LogOut size={18} className={`group-hover:text-red-500 transition-colors ${isDarkMode ? 'text-[#A0A0A0]' : 'text-[#6B7280]'}`} /> Logout
                                            </div>
                                            <ChevronRight size={18} className={`group-hover:text-red-500 transition-colors ${isDarkMode ? 'text-[#A0A0A0]' : 'text-[#6B7280]'}`} />
                                        </button>
                                    ) : (
                                        <div className={`rounded-xl border p-5 animate-fade-in ${isDarkMode ? 'border-red-500/40 bg-red-500/10' : 'border-red-200 bg-red-50'}`}>
                                            <div className="flex items-center gap-3 mb-3">
                                                <div className="w-9 h-9 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                                                    <LogOut size={18} className="text-red-500" />
                                                </div>
                                                <div>
                                                    <p className={`text-sm font-bold ${isDarkMode ? 'text-[#F5F5F5]' : 'text-[#171717]'}`}>Are you sure you want to logout?</p>
                                                    <p className={`text-xs ${isDarkMode ? 'text-[#A0A0A0]' : 'text-[#6B7280]'}`}>You'll need to sign in again to access your account.</p>
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
                                                    className="px-4 py-2 bg-red-600 text-white text-xs font-bold rounded-xl hover:bg-red-700 transition-all"
                                                >
                                                    Logout
                                                </button>
                                                <button
                                                    onClick={() => setShowLogoutConfirm(false)}
                                                    className={`px-4 py-2 text-xs font-bold rounded-xl border transition-all ${isDarkMode ? 'bg-[#1A1A1A] text-[#A0A0A0] border-[#2A2A2A] hover:bg-[#111111]' : 'bg-white text-[#6B7280] border-[#E5E7EB] hover:bg-[#FAFAFA]'}`}
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
                                <h1 className={`text-3xl font-bold mb-2 ${isDarkMode ? 'text-[#F5F5F5]' : 'text-[#171717]'}`}>Settings</h1>
                                <p className={`${isDarkMode ? 'text-[#A0A0A0]' : 'text-[#6B7280]'}`}>Manage your app display, notifications, and security preferences.</p>
                            </div>

                            <div className="space-y-6">
                                {/* Display Preferences */}
                                <section className={`rounded-xl p-6 md:p-8 border ${isDarkMode ? 'bg-[#1A1A1A] border-[#2A2A2A]' : 'bg-white border-[#E5E7EB]'}`}>
                                    <h3 className={`font-bold text-xl mb-4 flex items-center gap-2 ${isDarkMode ? 'text-[#F5F5F5]' : 'text-[#171717]'}`}>
                                        <Sliders size={20} className="text-[#EA580C]" /> Display Preferences
                                    </h3>
                                    <div className="space-y-4">
                                        <div className={`flex items-center justify-between p-4 rounded-xl border ${isDarkMode ? 'bg-[#111111] border-[#2A2A2A]' : 'bg-[#FAFAFA] border-[#E5E7EB]'}`}>
                                            <div className="flex items-center gap-3">
                                                <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
                                                    {isDarkMode ? <Moon size={20} /> : <Sun size={20} />}
                                                </div>
                                                <div>
                                                    <p className={`font-semibold ${isDarkMode ? 'text-[#F5F5F5]' : 'text-[#171717]'}`}>App Theme</p>
                                                    <p className={`text-sm ${isDarkMode ? 'text-[#A0A0A0]' : 'text-[#6B7280]'}`}>Toggle between dark mode and light mode</p>
                                                </div>
                                            </div>
                                            <button
                                                onClick={toggleTheme}
                                                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-[#EA580C] focus:ring-offset-2 ${isDarkMode ? 'bg-[#EA580C]' : 'bg-gray-300'}`}
                                            >
                                                <span className={`${isDarkMode ? 'translate-x-6' : 'translate-x-1'} inline-block h-4 w-4 transform rounded-full bg-white transition-transform`} />
                                            </button>
                                        </div>
                                    </div>
                                </section>

                                {/* Notification Settings */}
                                <section className={`rounded-xl p-6 md:p-8 border ${isDarkMode ? 'bg-[#1A1A1A] border-[#2A2A2A]' : 'bg-white border-[#E5E7EB]'}`}>
                                    <h3 className={`font-bold text-xl mb-4 flex items-center gap-2 ${isDarkMode ? 'text-[#F5F5F5]' : 'text-[#171717]'}`}>
                                        <Bell size={20} className="text-[#EA580C]" /> Notification Settings
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
                                            <div key={idx} className={`flex items-center justify-between p-4 rounded-xl border transition-colors ${isDarkMode ? 'hover:bg-[#111111] border-[#2A2A2A] hover:border-[#3A3A3A]' : 'hover:bg-[#FAFAFA] border-[#E5E7EB] hover:border-[#D1D5DB]'}`}>
                                                <div>
                                                    <p className={`font-semibold ${isDarkMode ? 'text-[#F5F5F5]' : 'text-[#171717]'}`}>{pref.title}</p>
                                                    <p className={`text-sm ${isDarkMode ? 'text-[#A0A0A0]' : 'text-[#6B7280]'}`}>{pref.desc}</p>
                                                </div>
                                                <button
                                                    onClick={() => pref.setter(!pref.state)}
                                                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-[#EA580C] focus:ring-offset-2 ${pref.state ? 'bg-[#EA580C]' : 'bg-gray-300'}`}
                                                >
                                                    <span className={`${pref.state ? 'translate-x-6' : 'translate-x-1'} inline-block h-4 w-4 transform rounded-full bg-white transition-transform`} />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </section>

                                {/* Account Data Management */}
                                <section className={`rounded-xl p-6 md:p-8 border ${isDarkMode ? 'bg-[#1A1A1A] border-[#2A2A2A]' : 'bg-white border-[#E5E7EB]'}`}>
                                    <h3 className={`font-bold text-xl mb-4 flex items-center gap-2 ${isDarkMode ? 'text-[#F5F5F5]' : 'text-[#171717]'}`}>
                                        <Settings size={20} className="text-[#EA580C]" /> Account Manage
                                    </h3>
                                    <div className="space-y-3">
                                        <button
                                            onClick={() => {
                                                setMessage("Local cache cleared successfully! App may reload soon.")
                                                setMessageType("success")
                                            }}
                                            className={`w-full flex items-center justify-between p-4 rounded-xl border text-left transition-colors ${isDarkMode ? 'hover:bg-[#111111] border-[#2A2A2A]' : 'hover:bg-[#FAFAFA] border-[#E5E7EB]'}`}
                                        >
                                            <div>
                                                <p className={`font-semibold ${isDarkMode ? 'text-[#F5F5F5]' : 'text-[#171717]'}`}>Clear Local App Cache</p>
                                                <p className={`text-sm ${isDarkMode ? 'text-[#A0A0A0]' : 'text-[#6B7280]'}`}>Free up space and resolve display issues</p>
                                            </div>
                                            <Trash2 size={18} className={isDarkMode ? 'text-[#6B7280]' : 'text-[#9CA3AF]'} />
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
                                    <h2 className={`text-2xl md:text-3xl font-bold ${isDarkMode ? 'text-[#F5F5F5]' : 'text-[#171717]'}`}>
                                        Restaurant Owner Dashboard
                                    </h2>
                                    <p className={`text-sm mt-1 ${isDarkMode ? 'text-[#A0A0A0]' : 'text-[#6B7280]'}`}>
                                        Monitor sales, manage your menu, and respond to student customers in real time.
                                    </p>
                                </div>
                                <div className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-medium ${isDarkMode ? 'bg-[#EA580C]/10 text-[#EA580C]' : 'bg-[#EA580C]/10 text-[#EA580C]'}`}>
                                    <ChefHat size={14} /> Owner mode
                                </div>
                            </div>

                            {/* Sales Overview Cards */}
                            <section className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                <div className="bg-emerald-600 rounded-xl p-6 text-white relative overflow-hidden">
                                    <div className="flex items-center justify-between mb-4">
                                        <p className="text-emerald-50 font-medium">Total Revenue</p>
                                        <div className="p-2 bg-emerald-500/40 rounded-xl">
                                            <TrendingUp size={20} className="text-white" />
                                        </div>
                                    </div>
                                    <p className="text-3xl font-black">$8,450.25</p>
                                    <p className="text-sm text-emerald-100 mt-2 font-medium flex items-center gap-1">
                                        <ArrowRight size={14} className="-rotate-45" /> +12.4% vs last week
                                    </p>
                                </div>

                                <div className={`rounded-xl p-6 border transition hover:border-[#3A3A3A] ${isDarkMode ? 'bg-[#1A1A1A] border-[#2A2A2A]' : 'bg-white border-[#E5E7EB]'}`}>
                                    <div className="flex items-center justify-between mb-4">
                                        <p className={`font-medium ${isDarkMode ? 'text-[#A0A0A0]' : 'text-[#6B7280]'}`}>Active Orders</p>
                                        <div className="p-2 bg-[#EA580C]/10 text-[#EA580C] rounded-xl">
                                            <Package size={20} />
                                        </div>
                                    </div>
                                    <p className={`text-3xl font-black ${isDarkMode ? 'text-[#F5F5F5]' : 'text-[#171717]'}`}>{liveOrders.filter(o => o.status !== 'delivered').length}</p>
                                    <p className={`text-sm mt-2 font-medium ${isDarkMode ? 'text-[#A0A0A0]' : 'text-[#6B7280]'}`}>Needing attention</p>
                                </div>

                                <div className={`rounded-xl p-6 border transition hover:border-[#3A3A3A] ${isDarkMode ? 'bg-[#1A1A1A] border-[#2A2A2A]' : 'bg-white border-[#E5E7EB]'}`}>
                                    <div className="flex items-center justify-between mb-4">
                                        <p className={`font-medium ${isDarkMode ? 'text-[#A0A0A0]' : 'text-[#6B7280]'}`}>Avg. Order Value</p>
                                        <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
                                            <Receipt size={20} />
                                        </div>
                                    </div>
                                    <p className={`text-3xl font-black ${isDarkMode ? 'text-[#F5F5F5]' : 'text-[#171717]'}`}>$24.80</p>
                                    <p className="text-sm text-emerald-600 mt-2 font-medium flex items-center gap-1">
                                        <ArrowRight size={14} className="-rotate-45" /> +$2.10 today
                                    </p>
                                </div>

                                <div className={`rounded-xl p-6 border transition hover:border-[#3A3A3A] ${isDarkMode ? 'bg-[#1A1A1A] border-[#2A2A2A]' : 'bg-white border-[#E5E7EB]'}`}>
                                    <div className="flex items-center justify-between mb-4">
                                        <p className={`font-medium ${isDarkMode ? 'text-[#A0A0A0]' : 'text-[#6B7280]'}`}>Unique Customers</p>
                                        <div className="p-2 bg-purple-50 text-purple-600 rounded-xl">
                                            <User size={20} />
                                        </div>
                                    </div>
                                    <p className={`text-3xl font-black ${isDarkMode ? 'text-[#F5F5F5]' : 'text-[#171717]'}`}>142</p>
                                    <p className="text-sm text-purple-600 mt-2 font-medium flex items-center gap-1">
                                        <ArrowRight size={14} className="-rotate-45" /> +18 signups today
                                    </p>
                                </div>
                            </section>

                            <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                {/* Advanced Revenue Analytics */}
                                <div className={`rounded-xl p-6 md:p-8 border flex flex-col justify-between ${isDarkMode ? 'bg-[#1A1A1A] border-[#2A2A2A]' : 'bg-white border-[#E5E7EB]'}`}>
                                    <div>
                                        <div className="flex justify-between items-start mb-6">
                                            <div>
                                                <h3 className={`font-bold text-xl ${isDarkMode ? 'text-[#F5F5F5]' : 'text-[#171717]'}`}>Weekly Volume Matrix</h3>
                                                <p className={`text-sm ${isDarkMode ? 'text-[#A0A0A0]' : 'text-[#6B7280]'}`}>Gross sales across the last 7 operating days</p>
                                            </div>
                                            <select className={`text-sm font-medium rounded-lg px-3 py-1 outline-none focus:ring-2 focus:ring-[#EA580C] border ${isDarkMode ? 'bg-[#111111] border-[#2A2A2A] text-[#F5F5F5]' : 'bg-[#FAFAFA] border-[#E5E7EB] text-[#171717]'}`}>
                                                <option>This Week</option>
                                                <option>Last Week</option>
                                                <option>This Month</option>
                                            </select>
                                        </div>

                                        {/* Modern Data Graph Mockup */}
                                        <div className="relative h-64 flex items-end justify-between gap-1 md:gap-3 px-2 pt-10">
                                            {/* Grid lines */}
                                            <div className="absolute inset-0 flex flex-col justify-between pointer-events-none">
                                                <div className={`border-b w-full h-0 ${isDarkMode ? 'border-[#2A2A2A]' : 'border-[#E5E7EB]'}`}></div>
                                                <div className={`border-b w-full h-0 ${isDarkMode ? 'border-[#2A2A2A]' : 'border-[#E5E7EB]'}`}></div>
                                                <div className={`border-b w-full h-0 ${isDarkMode ? 'border-[#2A2A2A]' : 'border-[#E5E7EB]'}`}></div>
                                                <div className={`border-b w-full h-0 ${isDarkMode ? 'border-[#2A2A2A]' : 'border-[#E5E7EB]'}`}></div>
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
                                                    <div className="absolute -top-12 bg-[#171717] text-white text-xs font-bold py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition whitespace-nowrap pointer-events-none">
                                                        ₱{(data.rev * 15).toFixed(0)}
                                                    </div>

                                                    {/* Double Bar System */}
                                                    <div className="w-full flex justify-center items-end gap-1 h-48 bg-transparent">
                                                        <div
                                                            className="w-1/2 md:w-3 max-w-[12px] bg-[#EA580C] rounded-t-sm transition-all"
                                                            style={{ height: `${data.rev}%` }}
                                                        ></div>
                                                        <div
                                                            className="w-1/2 md:w-3 max-w-[12px] bg-[#E5E7EB] rounded-t-sm"
                                                            style={{ height: `${data.ord}%` }}
                                                        ></div>
                                                    </div>
                                                    <span className={`text-xs font-semibold ${isDarkMode ? 'text-[#A0A0A0]' : 'text-[#6B7280]'}`}>{data.day}</span>
                                                </div>
                                            ))}
                                        </div>
                                        <div className={`flex items-center justify-center gap-6 mt-6 pt-4 border-t ${isDarkMode ? 'border-[#2A2A2A]' : 'border-[#E5E7EB]'}`}>
                                            <div className={`flex items-center gap-2 text-sm font-medium ${isDarkMode ? 'text-[#A0A0A0]' : 'text-[#6B7280]'}`}>
                                                <span className="w-3 h-3 rounded-full bg-[#EA580C]"></span> Revenue
                                            </div>
                                            <div className={`flex items-center gap-2 text-sm font-medium ${isDarkMode ? 'text-[#A0A0A0]' : 'text-[#6B7280]'}`}>
                                                <span className="w-3 h-3 rounded-full bg-[#E5E7EB]"></span> Orders Count
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Live Terminal Orders */}
                                <div className={`rounded-xl p-6 md:p-8 border flex flex-col ${isDarkMode ? 'bg-[#1A1A1A] border-[#2A2A2A]' : 'bg-white border-[#E5E7EB]'}`}>
                                    <div className="flex items-center justify-between mb-6">
                                        <h3 className={`font-bold text-xl ${isDarkMode ? 'text-[#F5F5F5]' : 'text-[#171717]'}`}>Active Order Terminal</h3>
                                        <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold border ${isDarkMode ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' : 'bg-emerald-50 text-emerald-700 border-emerald-100'}`}>
                                            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
                                            LIVE SYSTEM
                                        </span>
                                    </div>

                                    <div className="flex-1 overflow-y-auto pr-2 space-y-4 max-h-[400px]">
                                        {liveOrders.map((o) => (
                                            <div
                                                key={o.id}
                                                className={`rounded-xl border p-4 md:p-5 relative overflow-hidden group ${isDarkMode ? 'border-[#2A2A2A] bg-[#111111]' : 'border-[#E5E7EB] bg-white'}`}
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
                                                            <p className={`text-sm font-bold ${isDarkMode ? 'text-[#F5F5F5]' : 'text-[#171717]'}`}>Order #{o.id}</p>
                                                            <p className={`text-xs font-semibold ${isDarkMode ? 'text-[#A0A0A0]' : 'text-[#6B7280]'}`}>{o.time}</p>
                                                        </div>
                                                        <div className={`flex items-center gap-1 text-sm font-medium mb-2 ${isDarkMode ? 'text-[#A0A0A0]' : 'text-[#6B7280]'}`}>
                                                            <MapPin size={14} className={isDarkMode ? 'text-[#6B7280]' : 'text-[#9CA3AF]'} /> {o.location}
                                                        </div>
                                                        <p className="text-lg font-black text-emerald-600">₱{o.total.toFixed(2)}</p>
                                                    </div>

                                                    <div className="flex flex-col items-start md:items-end justify-between">
                                                        <select
                                                            value={o.status}
                                                            onChange={(e) => updateOrderStatus(o.id, e.target.value)}
                                                            className={`text-xs font-bold px-3 py-1.5 rounded-lg border focus:outline-none focus:ring-2 focus:ring-[#EA580C] transition-colors cursor-pointer ${getOrderStatusColor(o.status)}`}
                                                        >
                                                            <option value="pending">🟡 Pending</option>
                                                            <option value="accepted">🔵 Accepted</option>
                                                            <option value="preparing">🔵 Preparing</option>
                                                            <option value="prepared">🟣 Prepared</option>
                                                            <option value="out_for_delivery">🟠 Out for Delivery</option>
                                                            <option value="delivered">🟢 Delivered</option>
                                                        </select>

                                                        {o.status !== 'delivered' && (
                                                            <p className={`text-xs font-medium mt-3 md:mt-0 ${isDarkMode ? 'text-[#A0A0A0]' : 'text-[#6B7280]'}`}>
                                                                Action Required
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                        {liveOrders.length === 0 && (
                                            <div className={`h-full flex items-center justify-center font-medium pb-10 ${isDarkMode ? 'text-[#6B7280]' : 'text-[#9CA3AF]'}`}>
                                                No active orders at the moment.
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </section>

                            {/* Menu Management & Categories */}
                            <section className={`rounded-xl p-6 md:p-8 border ${isDarkMode ? 'bg-[#1A1A1A] border-[#2A2A2A]' : 'bg-white border-[#E5E7EB]'}`}>
                                <div className="flex items-center justify-between mb-6">
                                    <h3 className={`font-bold text-xl ${isDarkMode ? 'text-[#F5F5F5]' : 'text-[#171717]'}`}>Top Selling Menu Items</h3>
                                    <button className="inline-flex items-center gap-1 rounded-xl bg-[#EA580C] px-4 py-2 text-sm font-semibold text-white hover:bg-orange-600 transition">
                                        <Plus size={16} /> Add Item
                                    </button>
                                </div>

                                <div className="overflow-x-auto">
                                    <table className="w-full text-left text-sm whitespace-nowrap">
                                        <thead>
                                            <tr className={`border-b ${isDarkMode ? 'border-[#2A2A2A] text-[#A0A0A0]' : 'border-[#E5E7EB] text-[#6B7280]'}`}>
                                                <th className="pb-3 font-semibold pr-4">Item Name</th>
                                                <th className="pb-3 font-semibold px-4 text-center">Price</th>
                                                <th className="pb-3 font-semibold px-4 text-center">Monthly Sales</th>
                                                <th className="pb-3 font-semibold px-4 text-center">Revenue</th>
                                                <th className="pb-3 font-semibold pl-4 text-right">Visibility</th>
                                            </tr>
                                        </thead>
                                        <tbody className={`divide-y ${isDarkMode ? 'divide-[#2A2A2A]' : 'divide-[#F5F5F5]'}`}>
                                            {[
                                                { name: "Double Cheese Burger", price: 12.99, sales: 452, rev: 5871.48, available: true },
                                                { name: "Spicy Chicken Wings (8pc)", price: 9.99, sales: 385, rev: 3846.15, available: true },
                                                { name: "Large Pepperoni Pizza", price: 18.50, sales: 210, rev: 3885.00, available: false },
                                                { name: "Oreo Milkshake", price: 6.50, sales: 189, rev: 1228.50, available: true },
                                            ].map((item, idx) => (
                                                <tr key={idx} className={`transition group ${isDarkMode ? 'hover:bg-[#111111]' : 'hover:bg-[#FAFAFA]'}`}>
                                                    <td className={`py-4 font-bold pr-4 ${isDarkMode ? 'text-[#F5F5F5]' : 'text-[#171717]'}`}>{item.name}</td>
                                                    <td className={`py-4 font-medium text-center px-4 ${isDarkMode ? 'text-[#A0A0A0]' : 'text-[#6B7280]'}`}>₱{item.price.toFixed(2)}</td>
                                                    <td className="py-4 text-center px-4">
                                                        <span className="inline-flex items-center gap-1 font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded text-xs">
                                                            <TrendingUp size={12} /> {item.sales}
                                                        </span>
                                                    </td>
                                                    <td className={`py-4 font-bold text-center px-4 ${isDarkMode ? 'text-[#F5F5F5]' : 'text-[#171717]'}`}>₱{item.rev.toFixed(2)}</td>
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
                                <div className={`rounded-xl p-5 border space-y-4 ${isDarkMode ? 'bg-[#1A1A1A] border-[#2A2A2A]' : 'bg-white border-[#E5E7EB]'}`}>
                                    <div>
                                        <h3 className={`font-semibold mb-2 ${isDarkMode ? 'text-[#F5F5F5]' : 'text-[#171717]'}`}>Manage Categories</h3>
                                        <div className="flex flex-wrap gap-2">
                                            {["Burgers", "Pizza", "Sushi", "Desserts"].map((cat) => (
                                                <span
                                                    key={cat}
                                                    className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium ${isDarkMode ? 'bg-[#EA580C]/10 text-[#EA580C]' : 'bg-[#EA580C]/10 text-[#EA580C]'}`}
                                                >
                                                    {cat}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                    <div>
                                        <h3 className={`font-semibold mb-2 ${isDarkMode ? 'text-[#F5F5F5]' : 'text-[#171717]'}`}>Customer Reviews</h3>
                                        <div className="space-y-2 text-xs">
                                            <div className={`rounded-xl p-3 ${isDarkMode ? 'bg-[#111111]' : 'bg-[#FAFAFA]'}`}>
                                                <p className={`font-semibold mb-1 ${isDarkMode ? 'text-[#F5F5F5]' : 'text-[#171717]'}`}>“Amazing burgers!”</p>
                                                <p className={`mb-1 ${isDarkMode ? 'text-[#A0A0A0]' : 'text-[#6B7280]'}`}>by Alex • 5.0 ★</p>
                                                <div className="flex gap-2">
                                                    <button className={`rounded-full px-3 py-1 text-[11px] transition ${isDarkMode ? 'bg-[#1A1A1A] text-[#A0A0A0] border border-[#2A2A2A] hover:bg-[#222222]' : 'bg-white text-[#6B7280] border border-[#E5E7EB] hover:bg-[#FAFAFA]'}`}>
                                                        Reply
                                                    </button>
                                                    <button className={`rounded-full px-3 py-1 text-[11px] transition ${isDarkMode ? 'bg-[#1A1A1A] text-[#A0A0A0] border border-[#2A2A2A] hover:bg-[#222222]' : 'bg-white text-[#6B7280] border border-[#E5E7EB] hover:bg-[#FAFAFA]'}`}>
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
                <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 animate-fade-in p-4">
                    <div className={`rounded-xl p-6 md:p-8 max-w-lg w-full border animate-fade-in-scale ${isDarkMode ? 'bg-[#1A1A1A] border-[#2A2A2A]' : 'bg-white border-[#E5E7EB]'}`}>
                        <div className={`flex justify-between items-center mb-6 border-b pb-4 ${isDarkMode ? 'border-[#2A2A2A]' : 'border-[#E5E7EB]'}`}>
                            <h2 className={`text-2xl font-bold flex items-center gap-2 ${isDarkMode ? 'text-[#F5F5F5]' : 'text-[#171717]'}`}>
                                <Truck className="text-[#EA580C]" /> Delivery Details
                            </h2>
                            <button onClick={() => setShowCheckoutDialog(false)} className={`transition rounded-full p-2 ${isDarkMode ? 'text-[#A0A0A0] hover:text-[#F5F5F5] bg-[#111111] hover:bg-[#2A2A2A]' : 'text-[#6B7280] hover:text-[#171717] bg-[#FAFAFA] hover:bg-[#E5E7EB]'}`}>
                                <X size={20} />
                            </button>
                        </div>

                        <div className="space-y-4 mb-8">
                            <div>
                                <label className={`block text-sm font-semibold mb-1 ${isDarkMode ? 'text-[#F5F5F5]' : 'text-[#171717]'}`}>Delivery Address</label>
                                <input
                                    type="text"
                                    value={checkoutInfo.deliveryAddress}
                                    placeholder="e.g. 123 Campus Dorm, Room 4B"
                                    onChange={(e) => setCheckoutInfo(prev => ({ ...prev, deliveryAddress: e.target.value }))}
                                    className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-[#EA580C] focus:border-[#EA580C] outline-none transition ${isDarkMode ? 'bg-[#111111] border-[#2A2A2A] text-[#F5F5F5] placeholder-[#6B7280]' : 'bg-white border-[#E5E7EB] text-[#171717] placeholder-[#9CA3AF]'}`}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className={`block text-sm font-semibold mb-1 ${isDarkMode ? 'text-[#F5F5F5]' : 'text-[#171717]'}`}>City</label>
                                    <input
                                        type="text"
                                        value={checkoutInfo.deliveryCity}
                                        placeholder="e.g. University Town"
                                        onChange={(e) => setCheckoutInfo(prev => ({ ...prev, deliveryCity: e.target.value }))}
                                        className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-[#EA580C] outline-none transition ${isDarkMode ? 'bg-[#111111] border-[#2A2A2A] text-[#F5F5F5] placeholder-[#6B7280]' : 'bg-white border-[#E5E7EB] text-[#171717] placeholder-[#9CA3AF]'}`}
                                    />
                                </div>
                                <div>
                                    <label className={`block text-sm font-semibold mb-1 ${isDarkMode ? 'text-[#F5F5F5]' : 'text-[#171717]'}`}>Phone Number</label>
                                    <input
                                        type="tel"
                                        value={checkoutInfo.phone}
                                        placeholder="Mobile number"
                                        onChange={(e) => setCheckoutInfo(prev => ({ ...prev, phone: e.target.value }))}
                                        className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-[#EA580C] outline-none transition ${isDarkMode ? 'bg-[#111111] border-[#2A2A2A] text-[#F5F5F5] placeholder-[#6B7280]' : 'bg-white border-[#E5E7EB] text-[#171717] placeholder-[#9CA3AF]'}`}
                                    />
                                </div>
                            </div>
                            <p className={`text-xs italic mt-2 ${isDarkMode ? 'text-[#A0A0A0]' : 'text-[#6B7280]'}`}>
                                * Your provided information will be explicitly sent to the restaurant for this order. It falls back to your saved profile details if left blank!
                            </p>
                        </div>

                        <div className="flex gap-4">
                            <button
                                onClick={() => setShowCheckoutDialog(false)}
                                className={`flex-1 px-4 py-3 border rounded-xl font-bold transition ${isDarkMode ? 'border-[#2A2A2A] text-[#A0A0A0] hover:bg-[#111111]' : 'border-[#E5E7EB] text-[#171717] hover:bg-[#FAFAFA]'}`}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleCheckout}
                                className="flex-1 px-4 py-3 bg-[#EA580C] hover:bg-orange-600 text-white rounded-xl font-bold transition-all flex justify-center items-center gap-2"
                            >
                                <CreditCard size={18} /> Confirm Order
                            </button>
                        </div>
                    </div>
                </div>
            )}
            {/* Food Detail Modal (Matching Modern Aesthetic) */}
            {showFoodModal && selectedFood && !showSizeModal && (
                <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 md:p-6 bg-black/60 animate-fade-in" onClick={() => setShowFoodModal(false)}>
                    <div className={`w-full max-w-4xl rounded-xl border overflow-hidden animate-fade-in-scale flex flex-col md:flex-row relative ${isDarkMode ? 'bg-[#1A1A1A] border-[#2A2A2A]' : 'bg-white border-[#E5E7EB]'}`} onClick={e => e.stopPropagation()}>

                        {/* Left: Big Image */}
                        <div className={`w-full md:w-5/12 h-64 md:h-auto overflow-hidden relative ${isDarkMode ? 'bg-[#111111]' : 'bg-[#FAFAFA]'}`}>
                            <img src={selectedFood.image} alt={selectedFood.name} className="w-full h-full object-cover transition-transform hover:scale-105 duration-700" />

                            {/* Inner Close Button on mobile */}
                            <button onClick={() => setShowFoodModal(false)} className="md:hidden absolute top-4 right-4 z-10 p-2 rounded-full bg-black/60 hover:bg-black/80 text-white transition-all">
                                <X size={18} strokeWidth={2.5} />
                            </button>

                            {selectedFood.discount > 0 && (
                                <div className="absolute top-4 left-4 bg-[#EA580C] text-white px-3 py-1.5 rounded-lg font-bold text-[10px] uppercase tracking-wider border border-[#EA580C]">
                                    -{selectedFood.discount}% OFF
                                </div>
                            )}
                        </div>

                        {/* Right: Details */}
                        <div className={`p-6 md:p-10 md:w-7/12 flex flex-col w-full h-full relative ${isDarkMode ? 'bg-[#1A1A1A]' : 'bg-white'}`}>
                            {/* Close Button Desktop */}
                            <button onClick={() => setShowFoodModal(false)} className={`hidden md:flex absolute top-6 right-6 z-10 p-2.5 rounded-full transition-all ${isDarkMode ? 'bg-[#2A2A2A] hover:bg-[#333333] text-[#A0A0A0] hover:text-white' : 'bg-[#F5F5F5] hover:bg-[#E5E7EB] text-[#6B7280] hover:text-[#171717]'}`}>
                                <X size={18} strokeWidth={2.5} />
                            </button>

                            <div className="mb-8 md:pr-10">
                                <div className="flex items-center gap-3 mb-4">
                                    <span className={`px-2.5 py-1 ${isDarkMode ? 'bg-[#2A2A2A] text-[#A0A0A0]' : 'bg-[#FAFAFA] text-[#6B7280]'} text-[10px] font-bold rounded-lg uppercase tracking-wider`}>
                                        {selectedFood.restaurant}
                                    </span>
                                    <div className={`flex items-center gap-1.5 text-xs font-bold ${isDarkMode ? 'text-[#A0A0A0]' : 'text-[#6B7280]'}`}>
                                        <Star size={14} className="text-yellow-500 fill-yellow-500" /> {selectedFood.rating > 0 ? selectedFood.rating : 'New'}
                                        {selectedFood.reviews > 0 && <span className={`font-medium ${isDarkMode ? 'text-[#6B7280]' : 'text-[#9CA3AF]'}`}>({selectedFood.reviews})</span>}
                                    </div>
                                </div>
                                <h2 className={`text-2xl md:text-3xl font-bold tracking-tight mb-4 ${isDarkMode ? 'text-[#F5F5F5]' : 'text-[#171717]'}`}>{selectedFood.name}</h2>
                                <p className={`text-sm leading-relaxed font-medium ${isDarkMode ? 'text-[#A0A0A0]' : 'text-[#6B7280]'}`}>
                                    {selectedFood.description || "A meticulously prepared meal featuring farm-fresh ingredients and traditional recipes to ensure perfect taste in every bite."}
                                </p>
                            </div>

                            <div className={`mt-auto space-y-6 pt-6 border-t ${isDarkMode ? 'border-[#2A2A2A]' : 'border-[#E5E7EB]'}`}>
                                {/* Pricing Section */}
                                {selectedFood.category === 'Drinks' ? (
                                    <div>
                                        <span className={`text-[11px] font-bold uppercase tracking-widest block mb-4 ${isDarkMode ? 'text-[#A0A0A0]' : 'text-[#6B7280]'}`}>Select Size</span>
                                        <div className="flex gap-3">
                                            {[
                                                { label: 'Small', price: selectedFood.half_price, icon: 'S' },
                                                { label: 'Medium', price: selectedFood.price, icon: 'M' },
                                                { label: 'Large', price: selectedFood.large_price, icon: 'L' }
                                            ].filter(s => s.price != null && Number(s.price) > 0).map((size) => (
                                                <button
                                                    key={size.label}
                                                    onClick={() => setSelectedModalSize(size.label)}
                                                    className={`flex-1 flex items-center justify-between p-3.5 rounded-xl border transition-all ${selectedModalSize === size.label
                                                        ? 'bg-[#EA580C] border-[#EA580C] text-white'
                                                        : isDarkMode
                                                            ? 'border-[#2A2A2A] bg-transparent text-[#A0A0A0] hover:bg-[#222222] hover:text-[#F5F5F5]'
                                                            : 'border-[#E5E7EB] bg-transparent text-[#6B7280] hover:bg-[#FAFAFA] hover:text-[#171717]'
                                                        }`}
                                                >
                                                    <span className={`text-[10px] font-bold uppercase tracking-wider`}>{size.label}</span>
                                                    <span className={`text-sm font-bold`}>₱{Number(size.price).toFixed(2)}</span>
                                                </button>
                                            ))}
                                        </div>
                                        {/* Show selected price */}
                                        <div className="mt-8 flex items-center justify-between">
                                            <span className={`text-[11px] font-bold uppercase tracking-widest ${isDarkMode ? 'text-[#A0A0A0]' : 'text-[#6B7280]'}`}>Total Price</span>
                                            <span className={`text-3xl font-bold tracking-tight ${isDarkMode ? 'text-[#F5F5F5]' : 'text-[#171717]'}`}>
                                                <span className={`text-xl mr-1.5 ${isDarkMode ? 'text-[#6B7280]' : 'text-[#9CA3AF]'}`}>₱</span>
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
                                            <span className={`text-[11px] font-bold uppercase tracking-widest mb-1.5 ${isDarkMode ? 'text-[#A0A0A0]' : 'text-[#6B7280]'}`}>Total Price</span>
                                            <span className={`text-3xl font-bold tracking-tight ${isDarkMode ? 'text-[#F5F5F5]' : 'text-[#171717]'}`}>
                                                <span className={`text-xl mr-1.5 ${isDarkMode ? 'text-[#6B7280]' : 'text-[#9CA3AF]'}`}>₱</span>
                                                {((selectedFood.price || 0) * (1 - (selectedFood.discount || 0) / 100)).toFixed(2)}
                                            </span>
                                        </div>

                                        <div className={`flex items-center gap-5 px-5 py-2.5 rounded-xl border ${isDarkMode ? 'bg-[#111111] border-[#2A2A2A]' : 'bg-[#FAFAFA] border-[#E5E7EB]'}`}>
                                            <button
                                                onClick={() => updateQuantity(selectedFood.id, (cart.find(c => c.id === selectedFood.id)?.quantity || 0) - 1)}
                                                className={`p-1.5 transition-colors ${isDarkMode ? 'text-[#A0A0A0] hover:text-[#F5F5F5]' : 'text-[#6B7280] hover:text-[#171717]'}`}
                                            >
                                                <Minus size={18} strokeWidth={2.5} />
                                            </button>
                                            <span className={`w-6 text-center font-bold text-lg ${isDarkMode ? 'text-[#F5F5F5]' : 'text-[#171717]'}`}>
                                                {cart.find(c => c.id === selectedFood.id)?.quantity || 0}
                                            </span>
                                            <button
                                                onClick={() => addToCart(selectedFood)}
                                                className={`p-1.5 transition-colors ${isDarkMode ? 'text-[#A0A0A0] hover:text-[#F5F5F5]' : 'text-[#6B7280] hover:text-[#171717]'}`}
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
                                        className={`w-14 shrink-0 flex items-center justify-center rounded-xl transition-all active:scale-[0.98] border ${isDarkMode ? 'bg-[#EA580C]/10 hover:bg-[#EA580C]/20 text-[#EA580C] border-[#EA580C]/25' : 'bg-[#EA580C]/10 hover:bg-[#EA580C]/20 text-[#EA580C] border-[#EA580C]/25'}`}
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
                                        className="flex-1 py-4 bg-[#EA580C] hover:bg-orange-600 text-white rounded-xl font-bold text-sm tracking-wide transition-all active:scale-[0.98]"
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
                    className="fixed inset-0 z-[110] flex items-center justify-center p-4 md:p-6 bg-black/60 animate-fade-in"
                    onClick={closeBudgetModal}
                >
                    <div
                        className={`w-full max-w-lg rounded-xl border overflow-hidden animate-fade-in-scale flex flex-col relative ${isDarkMode ? 'bg-[#1A1A1A] border-[#2A2A2A]' : 'bg-white border-[#E5E7EB]'
                            }`}
                        style={{ maxHeight: '90vh' }}
                        onClick={e => e.stopPropagation()}
                    >
                        {/* Modal Header */}
                        <div className={`flex items-center justify-between px-8 py-6 border-b ${isDarkMode ? 'border-[#2A2A2A]' : 'border-[#E5E7EB]'
                            }`}>
                            <div className="flex items-center gap-4">
                                {budgetStep > 1 && (
                                    <button
                                        onClick={() => setBudgetStep(s => s - 1)}
                                        className={`p-2 rounded-xl transition-all ${isDarkMode ? 'bg-[#2A2A2A] hover:bg-[#333333] text-[#A0A0A0]' : 'bg-[#FAFAFA] hover:bg-[#E5E7EB] text-[#6B7280]'
                                            }`}
                                    >
                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M15 18l-6-6 6-6" /></svg>
                                    </button>
                                )}
                                <div>
                                    <h2 className={`text-xl font-bold tracking-tight ${isDarkMode ? 'text-[#F5F5F5]' : 'text-[#171717]'}`}>
                                        {budgetStep === 1 && 'Choose Combination'}
                                        {budgetStep === 2 && 'Select Your Options'}
                                        {budgetStep === 3 && 'Order Summary'}
                                    </h2>
                                    <p className={`text-[10px] font-bold uppercase tracking-widest mt-1 ${isDarkMode ? 'text-[#A0A0A0]' : 'text-[#6B7280]'
                                        }`}>
                                        Step {budgetStep} of 3
                                    </p>
                                </div>
                            </div>
                            <button onClick={closeBudgetModal} className={`p-2 rounded-full transition-all ${isDarkMode ? 'hover:bg-[#2A2A2A] text-[#A0A0A0] hover:text-[#F5F5F5]' : 'hover:bg-[#FAFAFA] text-[#6B7280] hover:text-[#171717]'
                                }`}>
                                <X size={20} strokeWidth={2.5} />
                            </button>
                        </div>

                        {/* Progress Dots */}
                        <div className="flex justify-center gap-2 py-5">
                            {[1, 2, 3].map(step => (
                                <div
                                    key={step}
                                    className={`h-1.5 rounded-full transition-all duration-300 ${step === budgetStep ? 'w-8 bg-[#EA580C]' :
                                        step < budgetStep ? (isDarkMode ? 'w-4 bg-[#3A3A3A]' : 'w-4 bg-[#D1D5DB]') :
                                            (isDarkMode ? 'w-4 bg-[#2A2A2A]' : 'w-4 bg-[#F5F5F5]')
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
                                            <div className={`w-8 h-8 border-4 border-t-transparent rounded-full animate-spin ${isDarkMode ? 'border-[#F5F5F5]' : 'border-[#171717]'}`} />
                                            <p className={`text-sm font-bold ${isDarkMode ? 'text-[#A0A0A0]' : 'text-[#6B7280]'}`}>Loading options...</p>
                                        </div>
                                    ) : budgetCombinations.length === 0 ? (
                                        <div className="flex flex-col items-center py-12 gap-3">
                                            <span className="text-4xl">😔</span>
                                            <p className={`text-sm font-bold text-center ${isDarkMode ? 'text-[#A0A0A0]' : 'text-[#6B7280]'}`}>
                                                No combinations available.<br />The restaurant hasn't set up this Budget Meal yet.
                                            </p>
                                        </div>
                                    ) : (
                                        budgetCombinations.map(combo => (
                                            <button
                                                key={combo.id}
                                                onClick={() => budgetSelectCombo(combo)}
                                                className={`w-full group flex items-center justify-between p-5 rounded-xl border transition-all duration-200 ${budgetSelectedCombo?.id === combo.id
                                                    ? 'border-[#EA580C] bg-[#EA580C] text-white'
                                                    : isDarkMode ? 'border-[#2A2A2A] bg-transparent hover:bg-[#222222]' : 'border-[#E5E7EB] bg-transparent hover:bg-[#FAFAFA]'
                                                    }`}
                                            >
                                                <div className="flex items-center gap-4">
                                                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl transition-all ${budgetSelectedCombo?.id === combo.id
                                                        ? 'bg-white/15'
                                                        : isDarkMode ? 'bg-[#2A2A2A]' : 'bg-[#FAFAFA]'
                                                        }`}>
                                                        🍱
                                                    </div>
                                                    <div className="text-left">
                                                        <p className={`font-bold text-sm ${budgetSelectedCombo?.id === combo.id ? 'text-white' : isDarkMode ? 'text-[#F5F5F5]' : 'text-[#171717]'}`}>
                                                            {combo.label}
                                                        </p>
                                                        <p className={`text-[11px] font-bold tracking-wide mt-1 ${budgetSelectedCombo?.id === combo.id ? 'text-white/80' : isDarkMode ? 'text-[#A0A0A0]' : 'text-[#6B7280]'}`}>
                                                            {combo.slots.map(s => s.component_type).join(' + ')}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="flex flex-col items-end gap-1">
                                                    <span className={`text-lg font-bold ${budgetSelectedCombo?.id === combo.id ? 'text-white' : isDarkMode ? 'text-[#F5F5F5]' : 'text-[#171717]'}`}>
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
                                    <div className={`flex items-center justify-between p-4 rounded-xl border ${isDarkMode ? 'bg-[#111111] border-[#2A2A2A]' : 'bg-[#FAFAFA] border-[#E5E7EB]'
                                        }`}>
                                        <div>
                                            <p className={`text-[10px] font-bold uppercase tracking-widest mb-1 ${isDarkMode ? 'text-[#A0A0A0]' : 'text-[#6B7280]'}`}>Selected</p>
                                            <p className={`font-bold text-sm ${isDarkMode ? 'text-[#F5F5F5]' : 'text-[#171717]'}`}>{budgetSelectedCombo.label}</p>
                                        </div>
                                        <span className={`font-bold text-lg ${isDarkMode ? 'text-[#F5F5F5]' : 'text-[#171717]'}`}>₱{Number(budgetSelectedCombo.price).toFixed(2)}</span>
                                    </div>

                                    {budgetSelectedCombo.slots.map((slot, idx) => (
                                        <div key={idx} className="pt-2">
                                            <div className="flex items-center gap-3 mb-4">
                                                <div className={`w-6 h-6 rounded-md flex items-center justify-center text-[11px] font-bold ${budgetSelections[budgetSlotKey(budgetSelectedCombo, slot)]
                                                    ? 'bg-[#EA580C] text-white'
                                                    : isDarkMode ? 'bg-[#2A2A2A] text-[#A0A0A0]' : 'bg-[#F5F5F5] text-[#9CA3AF]'
                                                    }`}>{idx + 1}</div>
                                                <p className={`text-sm font-bold uppercase tracking-wider ${isDarkMode ? 'text-[#E5E5E5]' : 'text-[#4B4B4B]'}`}>
                                                    Choose your {slot.component_type}
                                                </p>
                                                {budgetSelections[budgetSlotKey(budgetSelectedCombo, slot)] && (
                                                    <span className={`ml-auto text-[10px] font-bold px-2.5 py-1 rounded-md ${isDarkMode ? 'bg-[#2A2A2A] text-[#A0A0A0]' : 'bg-[#F5F5F5] text-[#6B7280]'
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
                                                                ? 'border-[#EA580C] bg-[#EA580C] text-white'
                                                                : isDarkMode ? 'border-[#2A2A2A] bg-transparent text-[#A0A0A0] hover:border-[#3A3A3A] hover:bg-[#222222]' : 'border-[#E5E7EB] bg-transparent text-[#6B7280] hover:border-[#EA580C] hover:bg-[#FAFAFA]'
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
                                        className={`w-full py-4 rounded-xl font-bold text-sm tracking-wide transition-all mt-6 ${budgetAllSelected()
                                            ? 'bg-[#EA580C] text-white hover:bg-orange-600 active:scale-[0.98]'
                                            : isDarkMode ? 'bg-[#232323] text-[#6B7280] cursor-not-allowed border border-[#2A2A2A]' : 'bg-[#F5F5F5] text-[#9CA3AF] cursor-not-allowed border border-[#E5E7EB]'
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
                                        <div className={`w-full h-40 rounded-xl overflow-hidden ${isDarkMode ? 'bg-[#111111]' : 'bg-[#FAFAFA]'}`}>
                                            <img src={budgetFood.image} alt={budgetFood.name} className="w-full h-full object-cover" />
                                        </div>
                                    )}

                                    <div className={`p-6 rounded-xl border ${isDarkMode ? 'bg-[#111111] border-[#2A2A2A]' : 'bg-[#FAFAFA] border-[#E5E7EB]'
                                        }`}>
                                        <p className={`text-[10px] font-bold uppercase tracking-widest mb-4 ${isDarkMode ? 'text-[#A0A0A0]' : 'text-[#6B7280]'}`}>Order Summary</p>

                                        <div className="space-y-3">
                                            <div className="flex justify-between">
                                                <span className={`text-sm font-bold ${isDarkMode ? 'text-[#A0A0A0]' : 'text-[#6B7280]'}`}>Item</span>
                                                <span className={`text-sm font-bold tracking-wide ${isDarkMode ? 'text-[#F5F5F5]' : 'text-[#171717]'}`}>{budgetFood.name}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className={`text-sm font-bold ${isDarkMode ? 'text-[#A0A0A0]' : 'text-[#6B7280]'}`}>Combo</span>
                                                <span className={`text-sm font-bold tracking-wide ${isDarkMode ? 'text-[#E5E5E5]' : 'text-[#4B4B4B]'}`}>{budgetSelectedCombo.label}</span>
                                            </div>

                                            {/* Selected options */}
                                            {budgetSelectedCombo.slots.map((slot, idx) => {
                                                const key = budgetSlotKey(budgetSelectedCombo, slot)
                                                return (
                                                    <div key={idx} className="flex justify-between">
                                                        <span className={`text-sm font-bold ${isDarkMode ? 'text-[#6B7280]' : 'text-[#9CA3AF]'}`}>{slot.component_type}</span>
                                                        <span className={`text-sm font-bold ${isDarkMode ? 'text-[#E5E5E5]' : 'text-[#4B4B4B]'}`}>{budgetSelections[key]}</span>
                                                    </div>
                                                )
                                            })}
                                        </div>

                                        <div className={`mt-6 pt-5 border-t flex justify-between items-end ${isDarkMode ? 'border-[#2A2A2A]' : 'border-[#E5E7EB]'}`}>
                                            <span className={`text-[11px] font-bold uppercase tracking-widest ${isDarkMode ? 'text-[#A0A0A0]' : 'text-[#6B7280]'}`}>Total Price</span>
                                            <span className={`text-2xl font-bold tracking-tight ${isDarkMode ? 'text-[#F5F5F5]' : 'text-[#171717]'}`}>₱{Number(budgetSelectedCombo.price).toFixed(2)}</span>
                                        </div>
                                    </div>

                                    <div className="flex gap-3 pt-2">
                                        <button
                                            onClick={addBudgetMealToCart}
                                            className={`w-14 shrink-0 flex items-center justify-center rounded-xl transition-all active:scale-[0.98] border ${isDarkMode ? 'bg-[#EA580C]/10 hover:bg-[#EA580C]/20 text-[#EA580C] border-[#EA580C]/25' : 'bg-[#EA580C]/10 hover:bg-[#EA580C]/20 text-[#EA580C] border-[#EA580C]/25'}`}
                                        >
                                            <ShoppingCart size={22} strokeWidth={2.5} />
                                        </button>
                                        <button
                                            onClick={() => { addBudgetMealToCart() }}
                                            className="flex-1 py-4 rounded-xl font-bold text-sm tracking-wide transition-all active:scale-[0.98] bg-[#EA580C] hover:bg-orange-600 text-white"
                                        >
                                            Order Now
                                        </button>
                                    </div>
                                    <p className={`text-center text-[11px] font-bold mt-4 ${isDarkMode ? 'text-[#6B7280]' : 'text-[#9CA3AF]'}`}>
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
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 animate-fade-in" onClick={() => setShowSizeModal(false)}>
                    <div className={`w-full max-w-sm rounded-xl border p-8 overflow-hidden animate-fade-in-scale flex flex-col relative ${isDarkMode ? 'bg-[#1A1A1A] border-[#2A2A2A]' : 'bg-white border-[#E5E7EB]'}`} onClick={e => e.stopPropagation()}>

                        <div className="text-center mb-6">
                            {/* Drink Image if available */}
                            {foodForSize.image && (
                                <div className={`w-24 h-24 mx-auto mb-4 rounded-2xl overflow-hidden border ${isDarkMode ? 'border-[#2A2A2A]' : 'border-[#E5E7EB]'}`}>
                                    <img src={foodForSize.image} alt={foodForSize.name} className="w-full h-full object-cover" />
                                </div>
                            )}
                            {!foodForSize.image && (
                                <div className="w-16 h-16 bg-[#EA580C]/10 rounded-2xl flex items-center justify-center text-[#EA580C] mx-auto mb-4 font-black text-2xl">
                                    🧋
                                </div>
                            )}
                            <h2 className={`text-2xl font-black mb-1 ${isDarkMode ? 'text-[#F5F5F5]' : 'text-[#171717]'}`}>Choose Your Size</h2>
                            <p className={`text-sm font-medium ${isDarkMode ? 'text-[#A0A0A0]' : 'text-[#6B7280]'}`}><strong className={isDarkMode ? 'text-[#F5F5F5]' : 'text-[#171717]'}>{foodForSize.name}</strong></p>
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
                                    className={`w-full group relative flex items-center justify-between p-4 rounded-xl border transition-all duration-300 ${isDarkMode
                                        ? 'bg-[#1A1A1A] border-[#2A2A2A] hover:border-[#EA580C] hover:bg-[#222222]'
                                        : 'bg-white border-[#E5E7EB] hover:border-[#EA580C] hover:bg-[#FFF7F0]'
                                        }`}
                                >
                                    <div className="flex items-center gap-4">
                                        <div className={`w-11 h-11 rounded-xl flex items-center justify-center font-black text-base transition-all group-hover:scale-110 group-hover:bg-[#EA580C] group-hover:text-white ${isDarkMode ? 'bg-[#2A2A2A] text-[#EA580C]' : 'bg-[#FFF7F0] text-[#EA580C]'
                                            }`}>
                                            {size.icon}
                                        </div>
                                        <div className="text-left">
                                            <span className={`block font-bold text-sm ${isDarkMode ? 'text-[#F5F5F5]' : 'text-[#171717]'}`}>{size.label}</span>
                                            <span className={`block text-xs font-medium ${isDarkMode ? 'text-[#A0A0A0]' : 'text-[#6B7280]'}`}>{size.desc}</span>
                                        </div>
                                    </div>
                                    <div className="text-right flex flex-col items-end gap-0.5">
                                        <span className="text-lg font-black text-[#EA580C]">₱{Number(size.price).toFixed(2)}</span>
                                        <ChevronRight size={14} className="text-[#EA580C]/0 group-hover:text-[#EA580C] transition-all -translate-x-2 group-hover:translate-x-0" />
                                    </div>
                                </button>
                            ))}
                        </div>

                        {/* Footer hint */}
                        <p className={`text-[11px] text-center font-medium mb-4 ${isDarkMode ? 'text-[#A0A0A0]' : 'text-[#6B7280]'}`}>
                            {sizeModalCheckout ? 'Select a size to checkout' : 'Select a size to add to cart'}
                        </p>

                        <button
                            onClick={() => setShowSizeModal(false)}
                            className={`w-full py-3 font-black text-sm transition-all border border-dashed rounded-xl ${isDarkMode ? 'text-[#A0A0A0] hover:text-[#F5F5F5] border-[#2A2A2A]' : 'text-[#6B7280] hover:text-[#171717] border-[#E5E7EB]'}`}
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            )}
            {/* Direct Checkout Modal (Buy Now / Order Now without Cart) */}
            {showDirectCheckout && directCheckoutItem && (
                <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/60 animate-fade-in" onClick={closeDirectCheckout}>
                    <div
                        className={`w-full max-w-lg rounded-xl border overflow-hidden animate-fade-in-scale relative ${isDarkMode ? 'bg-[#1A1A1A] border-[#2A2A2A]' : 'bg-white border-[#E5E7EB]'}`}
                        onClick={e => e.stopPropagation()}
                    >
                        {/* Header */}
                        <div className={`p-6 border-b flex justify-between items-center ${isDarkMode ? 'border-[#2A2A2A]' : 'border-[#E5E7EB]'}`}>
                            <h2 className={`text-xl font-black flex items-center gap-2 ${isDarkMode ? 'text-[#F5F5F5]' : 'text-[#171717]'}`}>
                                <Truck size={20} className="text-[#EA580C]" />
                                Direct Checkout
                            </h2>
                            <button onClick={closeDirectCheckout} className={`p-2 rounded-full transition-all ${isDarkMode ? 'bg-[#2A2A2A] text-[#A0A0A0] hover:text-[#F5F5F5]' : 'bg-[#F5F5F5] text-[#6B7280] hover:text-[#171717]'}`}>
                                <X size={18} />
                            </button>
                        </div>

                        {/* Order Summary */}
                        <div className={`p-6 border-b ${isDarkMode ? 'bg-[#111111] border-[#2A2A2A]' : 'bg-[#FFF7F0] border-[#E5E7EB]'}`}>
                            <p className={`text-[10px] font-black uppercase tracking-widest mb-3 ${isDarkMode ? 'text-[#A0A0A0]' : 'text-[#6B7280]'}`}>Order Summary</p>
                            <div className="flex gap-4 items-center">
                                <div className={`w-16 h-16 rounded-xl overflow-hidden border shrink-0 ${isDarkMode ? 'border-[#2A2A2A]' : 'border-[#E5E7EB]'}`}>
                                    <img src={directCheckoutItem.image || directCheckoutItem.image_url} alt={directCheckoutItem.name} className="w-full h-full object-cover" />
                                </div>
                                <div className="flex-1">
                                    <h3 className={`font-black text-sm ${isDarkMode ? 'text-[#E5E5E5]' : 'text-[#4B4B4B]'}`}>{directCheckoutItem.name}</h3>
                                    <p className={`text-xs font-bold mt-1 text-[#EA580C]`}>
                                        {directCheckoutItem.restaurant || directCheckoutItem.restaurant_name}
                                    </p>
                                </div>
                                <div className="text-right">
                                    <p className={`text-[10px] font-bold ${isDarkMode ? 'text-[#A0A0A0]' : 'text-[#6B7280]'}`}>Qty 1</p>
                                    <p className="font-black text-[#EA580C]">₱{Number(directCheckoutItem.price).toFixed(2)}</p>
                                </div>
                            </div>
                        </div>

                        {/* Delivery Destination (Cart Style) */}
                        <div className="p-6">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className={`text-sm font-semibold flex items-center gap-2 ${isDarkMode ? 'text-[#F5F5F5]' : 'text-[#171717]'}`}>
                                    <div className={`w-6 h-6 rounded-md flex items-center justify-center ${isDarkMode ? 'bg-[#2A2A2A] text-[#A0A0A0]' : 'bg-[#F5F5F5] text-[#6B7280]'}`}>
                                        <Truck size={14} />
                                    </div>
                                    Delivery destination
                                </h3>
                                <span className="text-[10px] uppercase font-bold tracking-wider text-[#EA580C]">Abra University Main</span>
                            </div>

                            <div className="grid grid-cols-1 gap-4 mb-2">
                                <div className="space-y-1.5">
                                    <label className={`text-[10px] font-semibold uppercase tracking-widest ${isDarkMode ? 'text-[#A0A0A0]' : 'text-[#6B7280]'}`}>Building / Department</label>
                                    <div className="relative group">
                                        <MapPin className={`absolute left-4 top-1/2 -translate-y-1/2 transition-colors ${isDarkMode ? 'text-[#6B7280] group-focus-within:text-[#F5F5F5]' : 'text-[#9CA3AF] group-focus-within:text-[#171717]'}`} size={16} />
                                        <input
                                            type="text"
                                            value={directDepartment}
                                            onChange={(e) => { setDirectDepartment(e.target.value); setDirectCheckoutError(""); }}
                                            placeholder="e.g. CAS / CAFC"
                                            className={`w-full pl-11 pr-4 py-3 rounded-xl text-sm font-medium outline-none border transition-all ${isDarkMode ? 'bg-[#111111] border-[#2A2A2A] focus:border-[#EA580C] text-[#F5F5F5] placeholder-[#6B7280]' : 'bg-white border-[#E5E7EB] focus:border-[#EA580C] text-[#171717] placeholder-[#9CA3AF]'}`}
                                        />
                                    </div>
                                </div>
                                <div className="space-y-1.5">
                                    <label className={`text-[10px] font-semibold uppercase tracking-widest ${isDarkMode ? 'text-[#A0A0A0]' : 'text-[#6B7280]'}`}>Course & Room</label>
                                    <div className="relative group">
                                        <MapPin className={`absolute left-4 top-1/2 -translate-y-1/2 transition-colors ${isDarkMode ? 'text-[#6B7280] group-focus-within:text-[#F5F5F5]' : 'text-[#9CA3AF] group-focus-within:text-[#171717]'}`} size={16} />
                                        <input
                                            type="text"
                                            value={directCourse}
                                            onChange={(e) => { setDirectCourse(e.target.value); setDirectCheckoutError(""); }}
                                            placeholder="e.g. BSIT 3A / Lec Rm 2"
                                            className={`w-full pl-11 pr-4 py-3 rounded-xl text-sm font-medium outline-none border transition-all ${isDarkMode ? 'bg-[#111111] border-[#2A2A2A] focus:border-[#EA580C] text-[#F5F5F5] placeholder-[#6B7280]' : 'bg-white border-[#E5E7EB] focus:border-[#EA580C] text-[#171717] placeholder-[#9CA3AF]'}`}
                                        />
                                    </div>
                                </div>
                            </div>

                            {directCheckoutError && (
                                <p className={`mt-4 text-xs font-bold flex items-center gap-1.5 p-3 rounded-xl ${isDarkMode ? 'text-red-400 bg-red-500/10' : 'text-red-600 bg-red-50'}`}>⚠️ {directCheckoutError}</p>
                            )}

                            {/* Total & Action */}
                            <div className="mt-6 flex items-center gap-4">
                                <div className="flex-1">
                                    <p className={`text-[10px] font-black uppercase tracking-widest ${isDarkMode ? 'text-[#A0A0A0]' : 'text-[#6B7280]'}`}>Total including ₱25 DeliveryFee</p>
                                    <p className="text-xl font-black text-[#EA580C]">₱{(Number(directCheckoutItem.price) + 25).toFixed(2)}</p>
                                </div>
                                <button
                                    onClick={handleDirectCheckoutSubmit}
                                    disabled={directCheckoutProcessing || !directDepartment || !directCourse}
                                    className={`px-8 py-3.5 rounded-xl font-black text-sm transition-all active:scale-[0.98] flex items-center justify-center gap-2 ${directCheckoutProcessing
                                        ? 'bg-orange-400 text-white cursor-not-allowed'
                                        : (!directDepartment || !directCourse)
                                            ? (isDarkMode ? 'bg-[#232323] text-[#6B7280] cursor-not-allowed border border-[#2A2A2A]' : 'bg-[#F5F5F5] text-[#9CA3AF] cursor-not-allowed border border-[#E5E7EB]')
                                            : 'bg-[#EA580C] hover:bg-orange-600 text-white'
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

