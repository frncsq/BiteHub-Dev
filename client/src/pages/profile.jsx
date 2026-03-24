import CustomerSidebar from "../components/CustomerSidebar"
import { useState, useEffect } from "react"
import { useTheme } from "../context/ThemeContext"
import { mockProfileService, mockAuthService } from "../services/mockData"
import { Edit2, Camera, MapPin, Mail, Phone, User as UserIcon, Calendar, Briefcase, ShoppingBag, CreditCard, TrendingUp, DollarSign } from "lucide-react"
import { createApiClient } from "../services/apiClient"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area } from 'recharts'

function Profile() {
	const { colors, isDarkMode } = useTheme()
	const [profile, setProfile] = useState({
		firstName: "",
		lastName: "",
		email: "",
		phone: "",
		department: "",
		course: "",
		year: "",
		role: "Customer",
		address: "",
		city: "",
		postalCode: "",
		profilePicture: "",
		joinDate: ""
	})
	const [editMode, setEditMode] = useState({
		personal: false,
		address: false
	})
	const [formData, setFormData] = useState(profile)
	const [loading, setLoading] = useState(true)
	const [saving, setSaving] = useState(false)
	const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
	const [orders, setOrders] = useState([])
	const [message, setMessage] = useState("")
	const [messageType, setMessageType] = useState("")

	useEffect(() => {
		fetchProfile()
	}, [])

	const fetchProfile = async () => {
		try {
			setLoading(true)
			const apiClient = createApiClient()
			const res = await apiClient.get('/profile')
			
			if (res.data?.success && res.data.profile) {
				const user = res.data.profile
				// user is { id, fullName, email, phone, address, city, department, course, year }
				const nameParts = (user.fullName || "User").split(" ")
				const firstName = nameParts[0] || ""
				const lastName = nameParts.slice(1).join(" ") || ""

				const profileData = {
					firstName: firstName,
					lastName: lastName,
					email: user.email || "",
					phone: user.phone || "",
					department: user.department || "",
					course: user.course || "",
					year: user.year || "",
					role: "Customer",
					address: user.address || "",
					city: user.city || "",
					postalCode: user.postalCode || "",
					profilePicture: "",
					joinDate: user.joinDate || new Date().toISOString()
				}
				setProfile(profileData)
				setFormData(profileData)
				fetchOrders()
			}
		} catch (error) {
			console.error("Error fetching profile via API:", error)
			setMessage("Failed to load profile from server")
			setMessageType("error")
		} finally {
			setLoading(false)
		}
	}

	const fetchOrders = async () => {
		try {
			const apiClient = createApiClient()
			const response = await apiClient.get('/orders')
			let rawData = []
			if (response.data?.success && response.data.orders) {
				rawData = response.data.orders
			} else if (Array.isArray(response.data)) {
				rawData = response.data
			}
			setOrders(rawData)
		} catch (error) {
			console.error("Error fetching orders for analytics:", error)
		}
	}

	const calculateAnalytics = () => {
		const totalOrders = orders.length
		const totalSpent = orders.reduce((sum, order) => sum + (parseFloat(order.total_amount) || 0), 0)
		const avgOrderValue = totalOrders > 0 ? totalSpent / totalOrders : 0

		// Prepare chart data
		const spendingByDate = orders.reduce((acc, order) => {
			const date = new Date(order.created_at || new Date()).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
			acc[date] = (acc[date] || 0) + (parseFloat(order.total_amount) || 0)
			return acc
		}, {})

		const chartData = Object.entries(spendingByDate)
			.map(([date, amount]) => ({ date, amount }))
			.sort((a, b) => new Date(a.date) - new Date(b.date))
			.slice(-7) // Last 7 days with data

		const categoryCounts = orders.reduce((acc, order) => {
			if (order.items) {
				order.items.forEach(item => {
					const cat = item.category || 'Other'
					acc[cat] = (acc[cat] || 0) + (item.quantity || 1)
				})
			}
			return acc
		}, {})

		const pieData = Object.entries(categoryCounts).map(([name, value]) => ({ name, value }))

		return { totalOrders, totalSpent, avgOrderValue, chartData, pieData }
	}

	const COLORS = ['#f97316', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899']

	const handleChange = (e) => {
		const { name, value } = e.target
		setFormData(prev => ({
			...prev,
			[name]: value
		}))
	}

	const handleSave = async (section) => {
		try {
			setSaving(true)
			const apiClient = createApiClient()
			const response = await apiClient.put('/profile', {
				fullName: `${formData.firstName} ${formData.lastName}`.trim(),
				email: formData.email,
				phone: formData.phone,
				address: formData.address,
				city: formData.city,
				department: formData.department,
				course: formData.course,
				year: formData.year
			})

			if (response.data?.success) {
				setProfile({ ...formData })
				setEditMode(prev => ({ ...prev, [section]: false }))
				setMessage("Profile updated successfully! ✨")
				setMessageType("success")
			}
		} catch (error) {
			console.error("Save profile error:", error)
			setMessage("Failed to save profile")
			setMessageType("error")
		} finally {
			setSaving(false)
			setTimeout(() => setMessage(""), 3000)
		}
	}

	const toggleEdit = (section) => {
		if (editMode[section]) {
			handleSave(section)
		} else {
			setEditMode(prev => ({ ...prev, [section]: true }))
		}
	}

	const handleCancel = (section) => {
		setEditMode(prev => ({ ...prev, [section]: false }))
		setFormData(profile)
	}

	if (loading) {
		return (
			<div className="flex h-screen items-center justify-center bg-gray-50">
				<div className="text-center">
					<div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mb-4"></div>
					<p className="text-lg text-gray-600">Loading Profile...</p>
				</div>
			</div>
		)
	}

	const inputClass = "w-full px-3 py-1.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all text-xs"

	return (
		<div className={`min-h-screen flex ${isDarkMode ? 'bg-[#0a0a0a]' : 'bg-[#f8f9fa]'}`}>
			<CustomerSidebar
				activeTab="profile"
				sidebarCollapsed={sidebarCollapsed}
				setSidebarCollapsed={setSidebarCollapsed}
			/>

			<main className={`flex-1 min-h-screen transition-all duration-300 ${sidebarCollapsed ? 'md:pl-20' : 'md:pl-64'}`}>
				<div className="max-w-3xl mx-auto px-6 py-8 text-gray-900 overflow-hidden">
					<div className="mb-6">
						<h1 className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-[#1a3a3a]'}`}>My Profile</h1>
					</div>

					{/* Message Notification */}
					{message && (
						<div className={`mb-4 rounded-xl border px-4 py-2 text-sm shadow-sm flex items-center justify-between animate-in fade-in slide-in-from-top-4 duration-300 ${messageType === 'success'
							? 'border-green-200 bg-green-50 text-green-700'
							: 'border-red-200 bg-red-50 text-red-700'
							}`}>
							<div className="flex items-center gap-2">
								{messageType === 'success' ? '✅' : '❌'}
								<span>{message}</span>
							</div>
							<button onClick={() => setMessage("")} className="hover:opacity-60 transition">✕</button>
						</div>
					)}

					<div className="space-y-4">
						{/* Overview Card */}
						<div className={`rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.03)] border p-6 flex flex-col md:flex-row items-center gap-6 ${isDarkMode ? 'bg-[#1a1a1a] border-[#2a2a2a]' : 'bg-white border-white'}`}>
							<div className="relative group">
								{profile.profilePicture ? (
									<img src={profile.profilePicture} alt="Profile" className="w-24 h-24 rounded-full object-cover border-4 border-gray-50 shadow-sm" />
								) : (
									<div className="w-24 h-24 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center text-white text-3xl font-bold shadow-lg shadow-orange-500/20">
										{profile.firstName ? profile.firstName.charAt(0) : "U"}
									</div>
								)}
								<button className="absolute bottom-0 right-0 p-1.5 bg-white rounded-full shadow-md border border-gray-100 hover:scale-110 transition group-hover:bg-orange-50">
									<Camera size={14} className="text-orange-600" />
								</button>
							</div>

							<div className="text-center md:text-left">
								<h2 className={`text-xl font-bold mb-1 ${isDarkMode ? 'text-white' : 'text-[#1a3a3a]'}`}>
									{`${profile.firstName} ${profile.lastName}`}
								</h2>
								<div className="flex flex-wrap justify-center md:justify-start items-center gap-x-4 gap-y-1 text-sm text-gray-500">
									<div className="flex items-center gap-1.5">
										<Briefcase size={14} />
										<span>{profile.role}</span>
									</div>
									<div className="flex items-center gap-1.5">
										<MapPin size={14} />
										<span>{profile.city || "No City Set"}</span>
									</div>
								</div>
							</div>
						</div>

						{/* Personal Information Card */}
						<div className={`rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.03)] border overflow-hidden ${isDarkMode ? 'bg-[#1a1a1a] border-[#2a2a2a]' : 'bg-white border-white'}`}>
							<div className="p-6 border-b border-gray-50 flex items-center justify-between">
								<h3 className={`font-bold ${isDarkMode ? 'text-white' : 'text-[#1a3a3a]'}`}>Personal Information</h3>
								<div className="flex items-center gap-2">
									{editMode.personal && (
										<button onClick={() => handleCancel('personal')} className="text-sm px-4 py-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 transition font-medium text-gray-600">Cancel</button>
									)}
									<button
										onClick={() => toggleEdit('personal')}
										className={`flex items-center gap-2 text-sm px-4 py-1.5 rounded-lg transition font-medium shadow-sm ${editMode.personal
											? 'bg-orange-600 text-white hover:bg-orange-700'
											: 'bg-orange-500 text-white hover:bg-orange-600'
											}`}
									>
										{editMode.personal ? (saving ? "Saving..." : "Save") : <><Edit2 size={14} /> Edit</>}
									</button>
								</div>
							</div>
							<div className="p-6">
								<div className="grid grid-cols-1 md:grid-cols-3 gap-y-6 gap-x-8">
									<div>
										<label className="text-[10px] sm:text-xs font-semibold text-gray-400 uppercase tracking-widest mb-1.5 block">First Name</label>
										{editMode.personal ? (
											<input type="text" name="firstName" value={formData.firstName} onChange={handleChange} className={inputClass} />
										) : (
											<p className={`font-medium ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>{profile.firstName}</p>
										)}
									</div>
									<div>
										<label className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-1.5 block">Last Name</label>
										{editMode.personal ? (
											<input type="text" name="lastName" value={formData.lastName} onChange={handleChange} className={inputClass} />
										) : (
											<p className={`font-medium ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>{profile.lastName}</p>
										)}
									</div>
									<div>
										<label className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-1.5 block">Department</label>
										{editMode.personal ? (
											<input type="text" name="department" value={formData.department} onChange={handleChange} className={inputClass} placeholder="e.g. Computer Science" />
										) : (
											<p className={`font-medium ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>{profile.department || "Not Set"}</p>
										)}
									</div>
									<div>
										<label className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-1.5 block">Course</label>
										{editMode.personal ? (
											<input type="text" name="course" value={formData.course} onChange={handleChange} className={inputClass} placeholder="e.g. BSCS" />
										) : (
											<p className={`font-medium ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>{profile.course || "Not Set"}</p>
										)}
									</div>
									<div>
										<label className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-1.5 block">Year</label>
										{editMode.personal ? (
											<input type="text" name="year" value={formData.year} onChange={handleChange} className={inputClass} placeholder="e.g. 3rd Year" />
										) : (
											<p className={`font-medium ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>{profile.year || "Not Set"}</p>
										)}
									</div>

									<div className="md:col-span-1">
										<label className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-1.5 block">Email Address</label>
										{editMode.personal ? (
											<input type="email" name="email" value={formData.email} onChange={handleChange} className={inputClass} />
										) : (
											<div className="flex items-center gap-2">
												{/* <Mail size={14} className="text-gray-400" /> */}
												<p className={`font-medium ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>{profile.email}</p>
											</div>
										)}
									</div>
									<div>
										<label className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-1.5 block">Phone Number</label>
										{editMode.personal ? (
											<input type="tel" name="phone" value={formData.phone} onChange={handleChange} className={inputClass} />
										) : (
											<div className="flex items-center gap-2">
												{/* <Phone size={14} className="text-gray-400" /> */}
												<p className={`font-medium ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>{profile.phone}</p>
											</div>
										)}
									</div>
									<div>
										<label className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-1.5 block">User Role</label>
										<p className={`font-medium ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>{profile.role}</p>
									</div>
								</div>
							</div>
						</div>

						{/* Address Card */}
						<div className={`rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.03)] border overflow-hidden ${isDarkMode ? 'bg-[#1a1a1a] border-[#2a2a2a]' : 'bg-white border-white'}`}>
							<div className="p-6 border-b border-gray-50 flex items-center justify-between">
								<h3 className={`font-bold ${isDarkMode ? 'text-white' : 'text-[#1a3a3a]'}`}>Address</h3>
								<div className="flex items-center gap-2">
									{editMode.address && (
										<button onClick={() => handleCancel('address')} className="text-sm px-4 py-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 transition font-medium text-gray-600">Cancel</button>
									)}
									<button
										onClick={() => toggleEdit('address')}
										className={`flex items-center gap-2 text-sm px-4 py-1.5 rounded-lg transition font-medium shadow-sm ${editMode.address
											? 'bg-orange-600 text-white hover:bg-orange-700'
											: 'bg-orange-500 text-white hover:bg-orange-600'
											}`}
									>
										{editMode.address ? (saving ? "Saving..." : "Save") : <><Edit2 size={14} /> Edit</>}
									</button>
								</div>
							</div>
							<div className="p-6">
								<div className="grid grid-cols-1 md:grid-cols-3 gap-y-6 gap-x-8">
									<div>
										<label className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-1.5 block">City</label>
										{editMode.address ? (
											<input type="text" name="city" value={formData.city} onChange={handleChange} className={inputClass} />
										) : (
											<p className={`font-medium ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>{profile.city || "Not Set"}</p>
										)}
									</div>
									<div>
										<label className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-1.5 block">Postal Code</label>
										{editMode.address ? (
											<input type="text" name="postalCode" value={formData.postalCode} onChange={handleChange} className={inputClass} />
										) : (
											<p className={`font-medium ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>{profile.postalCode || "Not Set"}</p>
										)}
									</div>
									<div className="md:col-span-3">
										<label className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-1.5 block">Street Address</label>
										{editMode.address ? (
											<input type="text" name="address" value={formData.address} onChange={handleChange} className={inputClass} />
										) : (
											<p className={`font-medium ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>{profile.address}</p>
										)}
									</div>
								</div>
							</div>
						</div>

						{/* Orders Analytics Card */}
						<div className={`rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.03)] border overflow-hidden ${isDarkMode ? 'bg-[#1a1a1a] border-[#2a2a2a]' : 'bg-white border-white'}`}>
							<div className="p-4 border-b border-gray-50 flex items-center justify-between">
								<h3 className={`font-bold text-sm ${isDarkMode ? 'text-white' : 'text-[#1a3a3a]'}`}>Orders Insights</h3>
								<div className="flex items-center gap-1.5 text-[10px] font-bold text-orange-500 bg-orange-50 px-2 py-0.5 rounded-full">
									<TrendingUp size={10} />
									<span>LIVE DATA</span>
								</div>
							</div>
							
							<div className="p-6 space-y-8">
								{/* KPI Cards */}
								<div className="grid grid-cols-1 md:grid-cols-3 gap-6">
									<div className={`p-4 rounded-xl border ${isDarkMode ? 'bg-orange-500/5 border-orange-500/20' : 'bg-orange-50 border-orange-100'}`}>
										<div className="flex items-center gap-3 mb-2">
											<div className="p-2 rounded-lg bg-orange-500 text-white shadow-lg shadow-orange-500/20">
												<ShoppingBag size={14} />
											</div>
											<span className="text-[10px] font-bold uppercase tracking-wider text-orange-600">Total Orders</span>
										</div>
										<p className={`text-2xl font-black ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{calculateAnalytics().totalOrders}</p>
									</div>

									<div className={`p-4 rounded-xl border ${isDarkMode ? 'bg-blue-500/5 border-blue-500/20' : 'bg-blue-50 border-blue-100'}`}>
										<div className="flex items-center gap-3 mb-2">
											<div className="p-2 rounded-lg bg-blue-500 text-white shadow-lg shadow-blue-500/20">
												<DollarSign size={14} />
											</div>
											<span className="text-[10px] font-bold uppercase tracking-wider text-blue-600">Total Spent</span>
										</div>
										<p className={`text-2xl font-black ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>₱{calculateAnalytics().totalSpent.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
									</div>

									<div className={`p-4 rounded-xl border ${isDarkMode ? 'bg-green-500/5 border-green-500/20' : 'bg-green-50 border-green-100'}`}>
										<div className="flex items-center gap-3 mb-2">
											<div className="p-2 rounded-lg bg-green-500 text-white shadow-lg shadow-green-500/20">
												<TrendingUp size={14} />
											</div>
											<span className="text-[10px] font-bold uppercase tracking-wider text-green-600">Avg. Value</span>
										</div>
										<p className={`text-2xl font-black ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>₱{calculateAnalytics().avgOrderValue.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
									</div>
								</div>

								{/* Charts Section */}
								<div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
									{/* Spending Chart */}
									<div className="h-[240px]">
										<div className="flex items-center justify-between mb-4">
											<h4 className={`text-xs font-bold uppercase tracking-widest ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Spending Trend</h4>
											<span className="text-[10px] text-gray-400">Past 7 Orders</span>
										</div>
										<ResponsiveContainer width="100%" height="90%">
											<AreaChart data={calculateAnalytics().chartData}>
												<defs>
													<linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
														<stop offset="5%" stopColor="#f97316" stopOpacity={0.3}/>
														<stop offset="95%" stopColor="#f97316" stopOpacity={0}/>
													</linearGradient>
												</defs>
												<CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDarkMode ? '#333' : '#eee'} />
												<XAxis 
													dataKey="date" 
													axisLine={false} 
													tickLine={false} 
													tick={{ fontSize: 10, fill: isDarkMode ? '#666' : '#999' }} 
													dy={10}
												/>
												<YAxis 
													axisLine={false} 
													tickLine={false} 
													tick={{ fontSize: 10, fill: isDarkMode ? '#666' : '#999' }}
												/>
												<Tooltip 
													contentStyle={{ 
														backgroundColor: isDarkMode ? '#1a1a1a' : '#fff', 
														border: 'none', 
														borderRadius: '12px', 
														boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)',
														fontSize: '12px'
													}} 
												/>
												<Area 
													type="monotone" 
													dataKey="amount" 
													stroke="#f97316" 
													strokeWidth={3}
													fillOpacity={1} 
													fill="url(#colorAmount)" 
												/>
											</AreaChart>
										</ResponsiveContainer>
									</div>

									{/* Category Pie Chart */}
									<div className="h-[240px]">
										<h4 className={`text-xs font-bold uppercase tracking-widest mb-4 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Food Preferences</h4>
										<div className="flex items-center h-full">
											<div className="w-1/2 h-full">
												<ResponsiveContainer width="100%" height="90%">
													<PieChart>
														<Pie
															data={calculateAnalytics().pieData}
															innerRadius={50}
															outerRadius={70}
															paddingAngle={5}
															dataKey="value"
														>
															{calculateAnalytics().pieData.map((entry, index) => (
																<Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
															))}
														</Pie>
														<Tooltip />
													</PieChart>
												</ResponsiveContainer>
											</div>
											<div className="w-1/2 space-y-2">
												{calculateAnalytics().pieData.slice(0, 4).map((entry, index) => (
													<div key={index} className="flex items-center justify-between text-[10px]">
														<div className="flex items-center gap-2">
															<div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
															<span className={isDarkMode ? 'text-gray-300' : 'text-gray-600'}>{entry.name}</span>
														</div>
														<span className={`font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{entry.value}</span>
													</div>
												))}
											</div>
										</div>
									</div>
								</div>
							</div>
						</div>
					</div>
				</div>
			</main>
		</div>
	)
}

export default Profile
