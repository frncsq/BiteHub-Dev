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

export const createApiClient = () => {
	const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:5000'
	
	const client = axios.create({
		baseURL,
		timeout: 10000,
		headers: {
			'Content-Type': 'application/json',
		}
	})

	// Request interceptor
	client.interceptors.request.use((config) => {
		const token = localStorage.getItem('authToken')
		if (token) {
			config.headers.Authorization = `Bearer ${token}`
		}
		return config
	})

	// Response interceptor with mock data fallback
	client.interceptors.response.use(
		(response) => response,
		(error) => {
			// If there's a network error and mock mode is enabled, use mock data
			if (MOCK_MODE_ENABLED && (error.message === 'Network Error' || !error.response)) {
				return handleMockResponse(error.config)
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
