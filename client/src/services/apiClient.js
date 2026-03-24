// API Client Helper with Mock Data Support
// Provides API functionality with fallback to mock data

import axios from 'axios'
import {
	mockFoodService,
	mockOrderService,
	mockCartService,
	mockRestaurantsData,
	mockFoodItems,
	mockCategories
} from './mockData'

// Check if we're in mock mode with fallback data support
const MOCK_MODE_ENABLED = false; // Set to false to use real backend API

/** Empty string in Vite dev uses the dev-server proxy (see vite.config.js) so the browser never cross-posts to :5000. */
export function getApiBaseUrl() {
	// If VITE_API_URL is explicitly set to something else, use it.
	// Otherwise, in DEV, we MUST return an empty string to use the Vite proxy (vite.config.js).
	const raw = import.meta.env.VITE_API_URL
	if (raw != null && String(raw).trim() !== '' && !import.meta.env.DEV) {
		return String(raw).replace(/\/$/, '')
	}
	
	if (import.meta.env.DEV) {
		// Empty string makes axios use the current origin (localhost:5173),
		// which Vite proxies to the backend (localhost:5000).
		return ''
	}
	
	return window.location.origin // Fallback for production if not set
}

export const createApiClient = () => {
	// Dynamically resolve baseURL to leverage Vite's proxy in development. 
	// If getApiBaseUrl() returns '' (dev), baseURL becomes '/api'.
	const base = getApiBaseUrl()
	const baseURL = base === '' ? '/api' : `${base}/api`
	
	const client = axios.create({
		baseURL: baseURL, 
		timeout: 15000,
		headers: {
			'Content-Type': 'application/json',
		}
	})

	// INTERCEPTOR: Attach Authorization header (JWT) automatically
	client.interceptors.request.use(
		(config) => {
			const token = localStorage.getItem('authToken')
			if (token && token !== 'null' && token !== 'undefined') {
				// Attach token as Bearer <token>
				config.headers.Authorization = `Bearer ${token}`
			}
			return config
		},
		(error) => Promise.reject(error)
	)

	// INTERCEPTOR: Handle responses
	client.interceptors.response.use(
		(response) => response,
		(error) => {
			const status = error.response?.status;
			
			if (status === 401) {
				// Only clear and redirect if we're not already on the login page
				// to avoid infinite loops.
				console.warn("🔒 Unauthorized access - 401");
				
				const isLoginPath = window.location.pathname === '/login' || 
								  window.location.pathname === '/restaurant-login' ||
								  window.location.pathname === '/admin-login';
				
				if (!isLoginPath) {
					console.warn("Clearing invalid token and redirecting to login.");
					localStorage.removeItem('authToken');
					
					// Smart redirect based on current path
					const path = window.location.pathname;
					if (path.includes('/owner')) {
						window.location.href = '/restaurant-login?expired=true';
					} else if (path.includes('/admin')) {
						window.location.href = '/admin-login?expired=true';
					} else {
						window.location.href = '/login?expired=true';
					}
				}
			}
			
			if (status === 431) {
				console.error("⛔ HTTP 431 Header Too Large - Clearing storage.");
				localStorage.clear();
			}

			// If there's a network error and mock mode is enabled, use mock data
			if (MOCK_MODE_ENABLED && (error.message === 'Network Error' || !error.response)) {
				return handleMockResponse(error.config);
			}

			return Promise.reject(error)
		}
	)

	return client
}

// Handle mock responses based on the requested URL
const handleMockResponse = (config) => {
	const url = config.url || ''
	
	// Simulate network delay
	return new Promise((resolve) => {
		setTimeout(() => {
			if (url.includes('/categories')) {
				resolve({ data: { success: true, categories: mockCategories } })
			} else if (url.includes('/restaurants') || url.includes('/rooms')) {
				resolve({ data: { success: true, restaurants: mockRestaurantsData, rooms: mockRestaurantsData } })
			} else if (url.includes('/food') && url.includes('/')) {
				const restaurantId = parseInt(url.split('/').pop())
				const foods = mockFoodItems[restaurantId] || []
				resolve({ data: { success: true, items: foods, foods } })
			} else {
				resolve({ data: { success: true, data: [] } })
			}
		}, 300)
	})
}

// Mock API service wrapper
export const mockApi = {
	get: async (url) => {
		try {
			const client = createApiClient()
			return await client.get(url)
		} catch (error) {
			return handleMockResponse({ url })
		}
	},
	
	post: async (url, data) => {
		try {
			const client = createApiClient()
			return await client.post(url, data)
		} catch (error) {
			return handleMockResponse({ url })
		}
	}
}

// Direct mock data getters
export const getMockData = {
	getRestaurants: () => ({ data: { success: true, restaurants: mockRestaurantsData } }),
	getFoodItems: (restaurantId) => ({ data: { success: true, items: mockFoodItems[restaurantId] || [] } }),
	getCategories: () => ({ data: { success: true, categories: mockCategories } }),
	getOrders: () => mockOrderService.getOrders(),
	getCart: () => ({ data: { success: true, cart: mockCartService.getCart() } })
}

export default {
	createApiClient,
	mockApi,
	getMockData,
	MOCK_MODE_ENABLED
};
