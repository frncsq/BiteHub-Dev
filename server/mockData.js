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
	}
];

export const mockFoodItems = {
	1: [ 
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
	2: [ 
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
		},
		{
			id: 205,
			name: 'Fresh Iced Tea',
			price: 35.00,
			half_price: 25.00,
			large_price: 45.00,
			category: 'Drinks',
			rating: 4.9,
			reviews: 120,
			discount: 0,
			image: 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=400&h=400&fit=crop',
			restaurant: 'Burger Barn'
		}
	],
	3: [ 
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
	4: [ 
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
	5: [ 
		{
			id: 501,
			name: 'Butter Chicken',
			price: 14.99,
			rating: 4.9,
			reviews: 167,
			discount: 10,
			image: 'https://images.unsplash.com/photo-1565959454675-338e1b0d92d6?w=400&h=400&fit=crop',
			restaurant: 'Curry House'
		},
		{
			id: 502,
			name: 'Tikka Masala',
			price: 13.99,
			rating: 4.8,
			reviews: 142,
			discount: 0,
			image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&h=400&fit=crop',
			restaurant: 'Curry House'
		},
		{
			id: 503,
			name: 'Biryani',
			price: 12.99,
			rating: 4.7,
			reviews: 98,
			discount: 18,
			image: 'https://images.unsplash.com/photo-1517621707268-085fbf2f93ff?w=400&h=400&fit=crop',
			restaurant: 'Curry House'
		},
		{
			id: 504,
			name: 'Samosas',
			price: 8.99,
			rating: 4.6,
			reviews: 134,
			discount: 0,
			image: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=400&h=400&fit=crop',
			restaurant: 'Curry House'
		}
	]
};

export const mockCategories = [
	{ id: 1, name: 'Pizza', icon: '🍕' },
	{ id: 2, name: 'Burgers', icon: '🍔' },
	{ id: 3, name: 'Sushi', icon: '🍣' },
	{ id: 4, name: 'Mexican', icon: '🌮' },
	{ id: 5, name: 'Indian', icon: '🍛' },
	{ id: 6, name: 'Desserts', icon: '🍰' },
	{ id: 7, name: 'Drinks', icon: '🥤' }
];

export const mockOrders = [];
