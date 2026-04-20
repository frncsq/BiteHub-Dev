// Mock Data Service for BiteHub
// This provides mock data for testing purposes

// Mock Users Database
const mockUsers = [
	{
		id: 1,
		fullName: 'John Doe',
		department: 'Computer Science',
		course: 'BSc',
		year: '3rd',
		password: 'Demo@123',
		email: 'john@example.com',
		role: 'customer'
	}
];

const mockRestaurants = [
	{
		id: 1,
		email: 'pizza@restaurant.com',
		name: 'Pizza Palace',
		password: 'Demo@123',
		role: 'owner'
	}
];

// Mock Restaurants
export const mockRestaurantsData = [
	{
		id: 1,
		name: 'Pizza Palace',
		type: 'pizza',
		description: 'Authentic Italian Pizza',
		pricePerNight: 15,
		rating: 4.8,
		reviews: 234,
		image: 'https://via.placeholder.com/300x200?text=Pizza+Palace',
		distance: 2.5,
		deliveryTime: '30-45 min',
		cuisines: ['Italian', 'Pizza'],
		address: '123 Main St',
		phone: '+1 234 567 8900'
	},
	{
		id: 2,
		name: 'Burger Barn',
		type: 'burger',
		description: 'Juicy American Burgers',
		pricePerNight: 12,
		rating: 4.6,
		reviews: 189,
		image: 'https://via.placeholder.com/300x200?text=Burger+Barn',
		distance: 1.8,
		deliveryTime: '20-35 min',
		cuisines: ['American', 'Burgers'],
		address: '456 Oak Ave',
		phone: '+1 234 567 8901'
	},
	{
		id: 3,
		name: 'Sushi Sensation',
		type: 'sushi',
		description: 'Fresh Japanese Sushi',
		pricePerNight: 25,
		rating: 4.9,
		reviews: 312,
		image: 'https://via.placeholder.com/300x200?text=Sushi+Sensation',
		distance: 3.2,
		deliveryTime: '35-50 min',
		cuisines: ['Japanese', 'Sushi'],
		address: '789 Pine Rd',
		phone: '+1 234 567 8902'
	},
	{
		id: 4,
		name: 'Taco Fiesta',
		type: 'mexican',
		description: 'Delicious Mexican Tacos',
		pricePerNight: 10,
		rating: 4.7,
		reviews: 276,
		image: 'https://via.placeholder.com/300x200?text=Taco+Fiesta',
		distance: 2.1,
		deliveryTime: '25-40 min',
		cuisines: ['Mexican', 'Tacos'],
		address: '321 Elm St',
		phone: '+1 234 567 8903'
	},
	{
		id: 5,
		name: 'Curry House',
		type: 'indian',
		description: 'Authentic Indian Cuisine',
		pricePerNight: 18,
		rating: 4.8,
		reviews: 198,
		image: 'https://via.placeholder.com/300x200?text=Curry+House',
		distance: 2.8,
		deliveryTime: '30-45 min',
		cuisines: ['Indian', 'Curry'],
		address: '654 Maple Dr',
		phone: '+1 234 567 8904'
	},
	{
		id: 6,
		name: 'Drinks Corner',
		type: 'drinks',
		description: 'Refreshing beverages in small, medium, and large sizes',
		pricePerNight: 8,
		rating: 4.9,
		reviews: 312,
		image: 'https://images.unsplash.com/photo-1544145945-f90425340c7e?w=300&h=200&fit=crop',
		distance: 0.5,
		deliveryTime: '10-20 min',
		cuisines: ['Drinks', 'Beverages'],
		address: '10 Campus Lane',
		phone: '+63 912 345 6789'
	}
];

// Mock Food Items
export const mockFoodItems = {
	1: [ // Pizza Palace
		{
			id: 101,
			name: 'Margherita Pizza',
			price: 12.99,
			rating: 4.8,
			reviews: 45,
			discount: 10,
			image: 'https://images.unsplash.com/photo-1604068549290-dea0e4a305ca?w=400&h=400&fit=crop',
			restaurant: 'Pizza Palace'
		},
		{
			id: 102,
			name: 'Pepperoni Pizza',
			price: 14.99,
			rating: 4.9,
			reviews: 67,
			discount: 15,
			image: 'https://images.unsplash.com/photo-1628840042765-356cda07f4ee?w=400&h=400&fit=crop',
			restaurant: 'Pizza Palace'
		},
		{
			id: 103,
			name: 'Veggie Pizza',
			price: 13.99,
			rating: 4.7,
			reviews: 32,
			discount: 0,
			image: 'https://images.unsplash.com/photo-1511689915661-c6ddb56d4fdf?w=400&h=400&fit=crop',
			restaurant: 'Pizza Palace'
		},
		{
			id: 104,
			name: 'Four Cheese Pizza',
			price: 15.99,
			rating: 4.8,
			reviews: 52,
			discount: 20,
			image: 'https://images.unsplash.com/photo-1571407-918f48b1fe38?w=400&h=400&fit=crop',
			restaurant: 'Pizza Palace'
		}
	],
	2: [ // Burger Barn
		{
			id: 201,
			name: 'Classic Cheeseburger',
			price: 10.99,
			rating: 4.6,
			reviews: 89,
			discount: 0,
			image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400&h=400&fit=crop',
			restaurant: 'Burger Barn'
		},
		{
			id: 202,
			name: 'Double Bacon Burger',
			price: 13.99,
			rating: 4.9,
			reviews: 124,
			discount: 25,
			image: 'https://images.unsplash.com/photo-1553979459-d2229ba7433b?w=400&h=400&fit=crop',
			restaurant: 'Burger Barn'
		},
		{
			id: 203,
			name: 'Mushroom Swiss Burger',
			price: 12.99,
			rating: 4.7,
			reviews: 76,
			discount: 10,
			image: 'https://images.unsplash.com/photo-1550547990-9169b8b2d0f8?w=400&h=400&fit=crop',
			restaurant: 'Burger Barn'
		},
		{
			id: 204,
			name: 'Spicy Jalapeño Burger',
			price: 11.99,
			rating: 4.5,
			reviews: 64,
			discount: 0,
			image: 'https://images.unsplash.com/photo-1585238341710-4abb8fca7d1b?w=400&h=400&fit=crop',
			restaurant: 'Burger Barn'
		}
	],
	3: [ // Sushi Sensation
		{
			id: 301,
			name: 'California Roll',
			price: 18.99,
			rating: 4.8,
			reviews: 156,
			discount: 5,
			image: 'https://images.unsplash.com/photo-1579584425555-c3ce17fd4351?w=400&h=400&fit=crop',
			restaurant: 'Sushi Sensation'
		},
		{
			id: 302,
			name: 'Spicy Tuna Roll',
			price: 16.99,
			rating: 4.7,
			reviews: 98,
			discount: 0,
			image: 'https://images.unsplash.com/photo-1579584425555-c3ce17fd4351?w=400&h=400&fit=crop',
			restaurant: 'Sushi Sensation'
		},
		{
			id: 303,
			name: 'Dragon Roll',
			price: 19.99,
			rating: 4.9,
			reviews: 142,
			discount: 12,
			image: 'https://images.unsplash.com/photo-1553621042-f6e147245172?w=400&h=400&fit=crop',
			restaurant: 'Sushi Sensation'
		},
		{
			id: 304,
			name: 'Philadelphia Roll',
			price: 17.99,
			rating: 4.8,
			reviews: 108,
			discount: 8,
			image: 'https://images.unsplash.com/photo-1564686992078-374c0c97e25e?w=400&h=400&fit=crop',
			restaurant: 'Sushi Sensation'
		}
	],
	4: [ // Taco Fiesta
		{
			id: 401,
			name: 'Beef Tacos',
			price: 9.99,
			rating: 4.6,
			reviews: 82,
			discount: 15,
			image: 'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=400&h=400&fit=crop',
			restaurant: 'Taco Fiesta'
		},
		{
			id: 402,
			name: 'Chicken Quesadilla',
			price: 11.99,
			rating: 4.7,
			reviews: 94,
			discount: 0,
			image: 'https://images.unsplash.com/photo-1618653960451-d7f1ae8b0b90?w=400&h=400&fit=crop',
			restaurant: 'Taco Fiesta'
		},
		{
			id: 403,
			name: 'Shrimp Ceviche',
			price: 13.99,
			rating: 4.8,
			reviews: 76,
			discount: 20,
			image: 'https://images.unsplash.com/photo-1596299305844-f8f8537e5dc1?w=400&h=400&fit=crop',
			restaurant: 'Taco Fiesta'
		},
		{
			id: 404,
			name: 'Carnitas Burrito',
			price: 12.99,
			rating: 4.7,
			reviews: 88,
			discount: 0,
			image: 'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=400&h=400&fit=crop',
			restaurant: 'Taco Fiesta'
		}
	],
	5: [ // Curry House
		{
			id: 501,
			name: 'Butter Chicken',
			price: 14.99,
			rating: 4.9,
			reviews: 167,
			discount: 10,
			image: 'https://images.unsplash.com/photo-1565959454675-338e1b0d92d6?w=400&h=400&fit=crop',
			restaurant: 'Curry House',
			category: 'Main Course'
		},
		{
			id: 502,
			name: 'Tikka Masala',
			price: 13.99,
			rating: 4.8,
			reviews: 142,
			discount: 0,
			image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&h=400&fit=crop',
			restaurant: 'Curry House',
			category: 'Main Course'
		},
		{
			id: 503,
			name: 'Biryani',
			price: 12.99,
			rating: 4.7,
			reviews: 98,
			discount: 18,
			image: 'https://images.unsplash.com/photo-1517621707268-085fbf2f93ff?w=400&h=400&fit=crop',
			restaurant: 'Curry House',
			category: 'Main Course'
		},
		{
			id: 504,
			name: 'Samosas',
			price: 8.99,
			rating: 4.6,
			reviews: 134,
			discount: 0,
			image: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=400&h=400&fit=crop',
			restaurant: 'Curry House',
			category: 'Snack'
		}
	],
	6: [ // Drinks Corner
		{
			id: 601,
			name: 'Fresh Mango Shake',
			price: 79,          // Medium
			half_price: 59,     // Small
			large_price: 99,    // Large
			rating: 4.9,
			reviews: 214,
			discount: 0,
			image: 'https://images.unsplash.com/photo-1623065422902-30a2d299bbe4?w=400&h=400&fit=crop',
			restaurant: 'Drinks Corner',
			category: 'Drinks'
		},
		{
			id: 602,
			name: 'Iced Coffee Latte',
			price: 89,          // Medium
			half_price: 69,     // Small
			large_price: 109,   // Large
			rating: 4.8,
			reviews: 187,
			discount: 0,
			image: 'https://images.unsplash.com/photo-1517701550927-30cf4ba1dba5?w=400&h=400&fit=crop',
			restaurant: 'Drinks Corner',
			category: 'Drinks'
		},
		{
			id: 603,
			name: 'Strawberry Milkshake',
			price: 85,          // Medium
			half_price: 65,     // Small
			large_price: 105,   // Large
			rating: 4.7,
			reviews: 156,
			discount: 10,
			image: 'https://images.unsplash.com/photo-1577805947697-89e18249d767?w=400&h=400&fit=crop',
			restaurant: 'Drinks Corner',
			category: 'Drinks'
		},
		{
			id: 604,
			name: 'Classic Lemonade',
			price: 55,          // Medium
			half_price: 40,     // Small
			large_price: 70,    // Large
			rating: 4.6,
			reviews: 124,
			discount: 0,
			image: 'https://images.unsplash.com/photo-1523677011781-c91d1bbe2f9e?w=400&h=400&fit=crop',
			restaurant: 'Drinks Corner',
			category: 'Drinks'
		}
	]
};

// Mock Categories
export const mockCategories = [
	{ id: 1, name: 'Pizza', icon: '🍕' },
	{ id: 2, name: 'Burgers', icon: '🍔' },
	{ id: 3, name: 'Sushi', icon: '🍣' },
	{ id: 4, name: 'Mexican', icon: '🌮' },
	{ id: 5, name: 'Indian', icon: '🍛' },
	{ id: 6, name: 'Desserts', icon: '🍰' },
	{ id: 7, name: 'Drinks', icon: '🥤' }
];

// Mock Orders
export const createMockOrder = (id, items, restaurant) => ({
	id,
	restaurantId: restaurant.id,
	restaurantName: restaurant.name,
	items,
	total: items.reduce((sum, item) => sum + item.price * item.quantity, 0),
	status: 'delivered',
	date: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
	deliveryTime: '30-45 min',
	address: '123 Customer Ave'
});

// Authentication Actions
export const mockAuthService = {
	// Customer Login
	login: (email, password) => {
		const user = mockUsers.find(u => u.email === email && u.password === password);
		if (user) {
			localStorage.setItem('authToken', JSON.stringify({
				...user,
				loginTime: new Date().toISOString()
			}));
			return { success: true, user };
		}
		return { success: false, message: 'Invalid credentials' };
	},


	// Customer Register
	register: (fullName, department, course, year, password) => {
		const newUser = {
			id: mockUsers.length + 1,
			fullName,
			department,
			course,
			year,
			password,
			email: `${fullName.toLowerCase().replace(/\s+/g, '')}@example.com`,
			role: 'customer'
		};
		mockUsers.push(newUser);
		localStorage.setItem('authToken', JSON.stringify({
			...newUser,
			loginTime: new Date().toISOString()
		}));
		return { success: true, user: newUser };
	},

	// Restaurant Login
	restaurantLogin: (email, password) => {
		const restaurant = mockRestaurants.find(r => r.email === email && r.password === password);
		if (restaurant) {
			localStorage.setItem('authToken', JSON.stringify({
				...restaurant,
				loginTime: new Date().toISOString()
			}));
			return { success: true, user: restaurant };
		}
		return { success: false, message: 'Invalid credentials' };
	},

	// Restaurant Register
	restaurantRegister: (restaurantName, email, password, cuisines, address, phone) => {
		const newRestaurant = {
			id: mockRestaurants.length + 1,
			name: restaurantName,
			email,
			password,
			cuisines: cuisines || [],
			address,
			phone,
			role: 'owner'
		};
		mockRestaurants.push(newRestaurant);
		localStorage.setItem('authToken', JSON.stringify({
			...newRestaurant,
			loginTime: new Date().toISOString()
		}));
		return { success: true, user: newRestaurant };
	},

	// Logout
	logout: () => {
		localStorage.removeItem('authToken');
		localStorage.removeItem('cart');
		return { success: true };
	},

	// Get Current User
	getCurrentUser: () => {
		const token = localStorage.getItem('authToken');
		return token ? JSON.parse(token) : null;
	}
};

// Food/Restaurant Actions
export const mockFoodService = {
	// Get all restaurants
	getRestaurants: () => {
		return { success: true, restaurants: mockRestaurantsData };
	},

	// Get single restaurant
	getRestaurant: (id) => {
		const restaurant = mockRestaurantsData.find(r => r.id === id);
		return restaurant
			? { success: true, restaurant }
			: { success: false, message: 'Restaurant not found' };
	},

	// Get food items for restaurant
	getFoodItems: (restaurantId) => {
		const items = mockFoodItems[restaurantId] || [];
		return { success: true, items };
	},

	// Get categories
	getCategories: () => {
		return { success: true, categories: mockCategories };
	},

	// Search restaurants
	searchRestaurants: (query) => {
		const results = mockRestaurantsData.filter(r =>
			r.name.toLowerCase().includes(query.toLowerCase()) ||
			r.cuisines.some(c => c.toLowerCase().includes(query.toLowerCase()))
		);
		return { success: true, restaurants: results };
	}
};

// Order Actions
export const mockOrderService = {
	// Get user orders
	getOrders: () => {
		const orders = localStorage.getItem('orders');
		if (orders) {
			return { success: true, orders: JSON.parse(orders) };
		}
		// Return some mock orders
		const mockOrders = [
			createMockOrder(1, [{ name: 'Margherita Pizza', price: 12.99, quantity: 2 }], mockRestaurantsData[0]),
			createMockOrder(2, [{ name: 'Double Bacon Burger', price: 13.99, quantity: 1 }], mockRestaurantsData[1])
		];
		localStorage.setItem('orders', JSON.stringify(mockOrders));
		return { success: true, orders: mockOrders };
	},

	// Place order
	placeOrder: (cartItems, deliveryAddress) => {
		const orders = JSON.parse(localStorage.getItem('orders') || '[]');
		const newOrder = {
			id: orders.length + 1,
			items: cartItems,
			total: cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0),
			status: 'confirmed',
			date: new Date().toISOString(),
			deliveryTime: '30-45 min',
			address: deliveryAddress
		};
		orders.push(newOrder);
		localStorage.setItem('orders', JSON.stringify(orders));
		localStorage.removeItem('cart');
		return { success: true, order: newOrder };
	},

	// Get single order
	getOrder: (id) => {
		const orders = JSON.parse(localStorage.getItem('orders') || '[]');
		const order = orders.find(o => o.id === parseInt(id));
		return order
			? { success: true, order }
			: { success: false, message: 'Order not found' };
	}
};

// Cart Actions
export const mockCartService = {
	// Get cart
	getCart: () => {
		const cart = localStorage.getItem('cart');
		return cart ? JSON.parse(cart) : [];
	},

	// Add to cart
	addToCart: (item) => {
		const cart = mockCartService.getCart();
		const existingItem = cart.find(i => i.id === item.id);
		
		if (existingItem) {
			existingItem.quantity += item.quantity || 1;
		} else {
			cart.push({ ...item, quantity: item.quantity || 1 });
		}
		
		localStorage.setItem('cart', JSON.stringify(cart));
		return { success: true, cart };
	},

	// Remove from cart
	removeFromCart: (itemId) => {
		let cart = mockCartService.getCart();
		cart = cart.filter(i => i.id !== itemId);
		localStorage.setItem('cart', JSON.stringify(cart));
		return { success: true, cart };
	},

	// Update cart item quantity
	updateQuantity: (itemId, quantity) => {
		const cart = mockCartService.getCart();
		const item = cart.find(i => i.id === itemId);
		
		if (item) {
			if (quantity <= 0) {
				return mockCartService.removeFromCart(itemId);
			}
			item.quantity = quantity;
		}
		
		localStorage.setItem('cart', JSON.stringify(cart));
		return { success: true, cart };
	},

	// Clear cart
	clearCart: () => {
		localStorage.removeItem('cart');
		return { success: true, cart: [] };
	}
};

// Profile Service
export const mockProfileService = {
	// Get user profile
	getProfile: () => {
		const user = mockAuthService.getCurrentUser();
		if (user) {
			return { success: true, profile: user };
		}
		return { success: false, message: 'Not authenticated' };
	},

	// Update profile
	updateProfile: (updates) => {
		const user = mockAuthService.getCurrentUser();
		if (user) {
			const updated = { ...user, ...updates };
			localStorage.setItem('authToken', JSON.stringify(updated));
			return { success: true, profile: updated };
		}
		return { success: false, message: 'Not authenticated' };
	}
};

// Contact/Support Service removed

export default {
	mockAuthService,
	mockFoodService,
	mockOrderService,
	mockCartService,
	mockProfileService
};
