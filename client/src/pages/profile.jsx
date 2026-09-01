import CustomerSidebar from "../components/CustomerSidebar"
import UserActivityAnalytics, { buildProfileActivityMetrics } from "../components/UserActivityAnalytics"
import { useState, useEffect, useRef } from "react"
import { useNavigate } from "react-router-dom"
import { useTheme } from "../context/ThemeContext"
import { Edit2, Camera, MapPin, Mail, Phone, User as UserIcon, Calendar, Briefcase, LayoutDashboard, Utensils, Package, LogOut, ChevronRight } from "lucide-react"
import { createApiClient } from "../services/apiClient"

function Profile() {
	const { isDarkMode } = useTheme()
	const navigate = useNavigate()
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
	const [showLogoutConfirm, setShowLogoutConfirm] = useState(false)
	const logoutRef = useRef(null)

	useEffect(() => {
		fetchProfile()
	}, [])

	useEffect(() => {
		const handler = (e) => {
			if (logoutRef.current && !logoutRef.current.contains(e.target)) {
				setShowLogoutConfirm(false)
			}
		}
		if (showLogoutConfirm) {
			document.addEventListener('mousedown', handler)
			return () => document.removeEventListener('mousedown', handler)
		}
	}, [showLogoutConfirm])

	const handleLogout = () => {
		localStorage.removeItem('authToken')
		setMessage('Logged out successfully!')
		setMessageType('success')
		setTimeout(() => navigate('/login'), 600)
	}

	const fetchProfile = async () => {
		try {
			setLoading(true)
			const apiClient = createApiClient()
			const res = await apiClient.get('/profile')
			
			if (res.data?.success && res.data.profile) {
				const user = res.data.profile
				console.log("DEBUG: Profile data received:", user)
				
				const rawName = (user.fullName && user.fullName !== "N/A") ? user.fullName : "User"
				const nameParts = rawName.split(" ")
				const firstName = nameParts[0] || "User"
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
				setMessage("Profile updated successfully!")
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
			<div className={`flex min-h-screen items-center justify-center transition-colors duration-300 ${isDarkMode ? 'bg-[#111111]' : 'bg-[#FAFAFA]'}`}>
				<div className="text-center px-6">
					<div className={`mx-auto mb-5 h-12 w-12 rounded-full border-2 border-[#EA580C]/30 border-t-[#EA580C] animate-spin`} aria-hidden />
					<p className={`text-base font-medium tracking-tight ${isDarkMode ? 'text-[#A0A0A0]' : 'text-[#6B7280]'}`}>Loading your profile...</p>
				</div>
			</div>
		)
	}

	const cardBase = `rounded-xl border transition-all duration-300 ${isDarkMode ? 'border-[#2A2A2A] bg-[#1A1A1A]' : 'border-[#E5E7EB] bg-white'}`

	const inputClass = `w-full rounded-lg px-4 py-3 text-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#EA580C]/20 focus:border-[#EA580C]/50 ${
		isDarkMode ? 'border border-[#2A2A2A] bg-[#222222] text-[#F5F5F5] placeholder:text-[#666666]' : 'border border-[#E5E7EB] bg-[#FAFAFA] text-[#171717] placeholder:text-[#9CA3AF]'
	}`

	const labelClass = `mb-1.5 block text-xs font-medium ${isDarkMode ? 'text-[#A0A0A0]' : 'text-[#6B7280]'}`

	const valueClass = `text-sm font-medium leading-relaxed ${isDarkMode ? 'text-[#F5F5F5]' : 'text-[#171717]'}`

	const secondaryBtn = `inline-flex items-center justify-center rounded-lg border px-4 py-2.5 text-sm font-medium transition-all duration-200 active:scale-[0.98] ${
		isDarkMode
			? 'border-[#2A2A2A] text-[#A0A0A0] hover:bg-[#222222]'
			: 'border-[#E5E7EB] text-[#6B7280] hover:bg-[#FAFAFA]'
	}`

	const primaryBtnBase =
		'inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-all duration-200 active:scale-[0.98]'

	const primaryBtnClass = (editing) =>
		`${primaryBtnBase} ${
			editing ? 'bg-[#EA580C] text-white hover:bg-[#EA580C]/90' : isDarkMode ? 'bg-[#F5F5F5] text-[#111111] hover:bg-white' : 'bg-[#171717] text-white hover:bg-[#171717]/90'
		}`

	const joinLabel = profile.joinDate
		? (() => {
				try {
					return new Date(profile.joinDate).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })
				} catch {
					return profile.joinDate
				}
			})()
		: null

	const activityMetrics = buildProfileActivityMetrics(orders)
	const displayName = `${profile.firstName} ${profile.lastName}`.trim() || "Member"

	const scrollToUserActivity = () => {
		document.getElementById("user-activity")?.scrollIntoView({ behavior: "smooth", block: "start" })
	}

	return (
		<div className={`min-h-screen flex ${isDarkMode ? 'bg-[#111111]' : 'bg-[#FAFAFA]'}`}>
			<CustomerSidebar
				activeTab="profile"
				sidebarCollapsed={sidebarCollapsed}
				setSidebarCollapsed={setSidebarCollapsed}
			/>

			<main className={`flex-1 min-h-screen min-w-0 overflow-x-hidden transition-all duration-300 pb-24 md:pb-8 ${sidebarCollapsed ? 'md:pl-[72px]' : 'md:pl-[240px]'}`}>
				<div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 lg:py-12">
					<div className={`mb-8 overflow-hidden rounded-xl border p-6 sm:p-8 transition-all duration-300 ${isDarkMode ? 'bg-[#1A1A1A] border-[#2A2A2A]' : 'bg-white border-[#E5E7EB]'}`}>
						<div className="flex flex-col gap-8 md:flex-row md:items-center md:justify-between">
							<div className="min-w-0 flex-1">
								<h3 className={`text-2xl font-semibold tracking-tight sm:text-3xl ${isDarkMode ? 'text-[#F5F5F5]' : 'text-[#171717]'}`}>Profile of {displayName}</h3>
								<p className={`mt-2.5 max-w-xl text-sm leading-relaxed sm:text-base ${isDarkMode ? 'text-[#A0A0A0]' : 'text-[#6B7280]'}`}>
									View your campus dining analytics, default delivery addresses, and recent activity.
								</p>
								<div className="mt-6 flex flex-wrap items-center gap-3">
									<button
										type="button"
										onClick={scrollToUserActivity}
										className={`inline-flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-medium transition-all duration-200 border ${isDarkMode ? 'bg-[#222222] text-[#F5F5F5] border-[#2A2A2A] hover:bg-[#2A2A2A]' : 'bg-[#FAFAFA] text-[#171717] border-[#E5E7EB] hover:bg-[#F5F5F5]'}`}
									>
										<LayoutDashboard size={18} strokeWidth={2} aria-hidden />
										Dashboard
									</button>
									<button
										type="button"
										onClick={() => navigate("/home")}
										className="inline-flex items-center gap-2 rounded-lg bg-[#EA580C] px-5 py-2.5 text-sm font-medium text-white transition-all duration-200 hover:bg-[#EA580C]/90"
									>
										<Utensils size={18} strokeWidth={2} aria-hidden />
										Browse food
									</button>
									<button
										type="button"
										onClick={() => navigate("/orders")}
										className={`inline-flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-medium transition-all duration-200 ${isDarkMode ? 'text-[#A0A0A0] hover:text-[#F5F5F5] hover:bg-[#222222]' : 'text-[#6B7280] hover:text-[#171717] hover:bg-[#FAFAFA]'}`}
									>
										<Package size={18} strokeWidth={2} aria-hidden />
										View orders
									</button>
								</div>
							</div>
							<div className="grid w-full grid-cols-3 gap-3 md:w-auto md:min-w-[320px]">
								<div className={`rounded-xl p-4 md:p-5 transition-all ${isDarkMode ? 'bg-[#222222]' : 'bg-[#FAFAFA]'}`}>
									<p className={`text-xs font-medium ${isDarkMode ? 'text-[#A0A0A0]' : 'text-[#6B7280]'}`}>Active orders</p>
									<p className={`text-2xl font-semibold mt-1 tracking-tight ${isDarkMode ? 'text-[#F5F5F5]' : 'text-[#171717]'}`}>{activityMetrics.activeOrdersCount}</p>
								</div>
								<div className={`rounded-xl p-4 md:p-5 transition-all ${isDarkMode ? 'bg-[#222222]' : 'bg-[#FAFAFA]'}`}>
									<p className={`text-xs font-medium ${isDarkMode ? 'text-[#A0A0A0]' : 'text-[#6B7280]'}`}>Total orders</p>
									<p className={`text-2xl font-semibold mt-1 tracking-tight ${isDarkMode ? 'text-[#F5F5F5]' : 'text-[#171717]'}`}>{activityMetrics.totalOrders}</p>
								</div>
								<div className={`rounded-xl p-4 md:p-5 transition-all ${isDarkMode ? 'bg-[#222222]' : 'bg-[#FAFAFA]'}`}>
									<p className={`text-xs font-medium ${isDarkMode ? 'text-[#A0A0A0]' : 'text-[#6B7280]'}`}>Total spent</p>
									<p className={`text-2xl font-semibold mt-1 tracking-tight ${isDarkMode ? 'text-[#F5F5F5]' : 'text-[#171717]'}`}>
										₱{Math.round(activityMetrics.totalSpent).toLocaleString()}
									</p>
								</div>
							</div>
						</div>
					</div>

					<header className="mb-8 space-y-1">
						<h1 className={`text-2xl sm:text-3xl font-semibold tracking-tight ${isDarkMode ? 'text-[#F5F5F5]' : 'text-[#171717]'}`}>
							Profile
						</h1>
						<p className={`text-sm sm:text-base max-w-xl ${isDarkMode ? 'text-[#A0A0A0]' : 'text-[#6B7280]'}`}>
							Manage your account details and see how you use BiteHub.
						</p>
					</header>

					{message && (
						<div
							role="status"
							className={`mb-6 flex items-center justify-between gap-4 rounded-xl border px-4 py-3 text-sm transition-all duration-300 ${
								messageType === 'success'
									? isDarkMode
										? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400'
										: 'border-emerald-200 bg-emerald-50 text-emerald-700'
									: isDarkMode
										? 'border-red-500/30 bg-red-500/10 text-red-400'
										: 'border-red-200 bg-red-50 text-red-700'
							}`}
						>
							<div className="flex items-center gap-2 min-w-0">
								<span className="shrink-0">{messageType === 'success' ? '✓' : '✕'}</span>
								<span className="truncate">{message}</span>
							</div>
							<button
								type="button"
								onClick={() => setMessage('')}
								className={`shrink-0 rounded-lg p-1.5 transition-colors duration-200 ${isDarkMode ? 'hover:bg-white/10' : 'hover:bg-black/5'}`}
								aria-label="Dismiss notification"
							>
								✕
							</button>
						</div>
					)}

					<div className="flex flex-col gap-6 lg:gap-8">
						<section className={`${cardBase} p-6 sm:p-8`}>
							<div className="flex flex-col items-center gap-8 sm:flex-row sm:items-start">
								<div className="relative group shrink-0">
									<div className={`rounded-full p-1 ${isDarkMode ? 'bg-[#EA580C]/10 ring-1 ring-[#2A2A2A]' : 'bg-[#EA580C]/10 ring-1 ring-[#E5E7EB]'}`}>
										{profile.profilePicture ? (
											<img
												src={profile.profilePicture}
												alt=""
												className="h-28 w-28 sm:h-32 sm:w-32 rounded-full object-cover"
											/>
										) : (
											<div className="flex h-28 w-28 sm:h-32 sm:w-32 items-center justify-center rounded-full bg-[#EA580C] text-3xl sm:text-4xl font-semibold text-white">
												{profile.firstName ? profile.firstName.charAt(0).toUpperCase() : 'U'}
											</div>
										)}
									</div>
									<button
										type="button"
										className={`absolute bottom-1 right-1 flex h-9 w-9 items-center justify-center rounded-full border transition-all duration-200 group-hover:scale-105 ${
											isDarkMode
												? 'border-[#2A2A2A] bg-[#1A1A1A] text-[#EA580C] hover:bg-[#222222]'
												: 'border-[#E5E7EB] bg-white text-[#EA580C] hover:bg-[#FAFAFA]'
										}`}
										aria-label="Change photo (coming soon)"
									>
										<Camera size={16} strokeWidth={2} />
									</button>
								</div>

								<div className="min-w-0 flex-1 text-center sm:text-left space-y-4">
									<div>
										<h2 className={`text-xl sm:text-2xl font-semibold tracking-tight ${isDarkMode ? 'text-[#F5F5F5]' : 'text-[#171717]'}`}>
											{`${profile.firstName} ${profile.lastName}`.trim() || 'Member'}
										</h2>
										<p className={`mt-1.5 text-sm ${isDarkMode ? 'text-[#A0A0A0]' : 'text-[#6B7280]'}`}>
											{profile.email || 'No email on file'}
										</p>
									</div>

									<div className="flex flex-col sm:flex-row sm:flex-wrap gap-3 justify-center sm:justify-start">
										<div
											className={`inline-flex items-center justify-center gap-2 rounded-full px-3.5 py-1.5 text-xs font-medium ${
												isDarkMode ? 'bg-[#222222] text-[#A0A0A0]' : 'bg-[#FAFAFA] text-[#6B7280]'
											}`}
										>
											<Briefcase size={14} className="opacity-80 shrink-0" />
											<span>{profile.role}</span>
										</div>
										<div
											className={`inline-flex items-center justify-center gap-2 rounded-full px-3.5 py-1.5 text-xs font-medium ${
												isDarkMode ? 'bg-[#222222] text-[#A0A0A0]' : 'bg-[#FAFAFA] text-[#6B7280]'
											}`}
										>
											<MapPin size={14} className="opacity-80 shrink-0" />
											<span>{profile.city || 'No city set'}</span>
										</div>
										{joinLabel && (
											<div
												className={`inline-flex items-center justify-center gap-2 rounded-full px-3.5 py-1.5 text-xs font-medium ${
													isDarkMode ? 'bg-[#222222] text-[#A0A0A0]' : 'bg-[#FAFAFA] text-[#6B7280]'
												}`}
											>
												<Calendar size={14} className="opacity-80 shrink-0" />
												<span>Joined {joinLabel}</span>
											</div>
										)}
									</div>

									<dl className="grid grid-cols-1 gap-3 sm:grid-cols-2 pt-2">
										<div
											className={`flex items-start gap-4 rounded-xl px-5 py-4 transition-colors duration-200 ${
												isDarkMode ? 'bg-[#222222]' : 'bg-[#FAFAFA]'
											}`}
										>
											<div className={`mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${isDarkMode ? 'bg-[#EA580C]/10 text-[#EA580C]' : 'bg-[#EA580C]/10 text-[#EA580C]'}`}>
												<Mail size={18} />
											</div>
											<div className="min-w-0">
												<dt className={`text-xs font-medium ${isDarkMode ? 'text-[#A0A0A0]' : 'text-[#6B7280]'}`}>Email</dt>
												<dd className={`mt-1 truncate text-sm font-semibold ${isDarkMode ? 'text-[#F5F5F5]' : 'text-[#171717]'}`}>
													{profile.email || '—'}
												</dd>
											</div>
										</div>
										<div
											className={`flex items-start gap-4 rounded-xl px-5 py-4 transition-colors duration-200 ${
												isDarkMode ? 'bg-[#222222]' : 'bg-[#FAFAFA]'
											}`}
										>
											<div className={`mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${isDarkMode ? 'bg-[#EA580C]/10 text-[#EA580C]' : 'bg-[#EA580C]/10 text-[#EA580C]'}`}>
												<Phone size={18} />
											</div>
											<div className="min-w-0">
												<dt className={`text-xs font-medium ${isDarkMode ? 'text-[#A0A0A0]' : 'text-[#6B7280]'}`}>Phone</dt>
												<dd className={`mt-1 truncate text-sm font-semibold ${isDarkMode ? 'text-[#F5F5F5]' : 'text-[#171717]'}`}>
													{profile.phone || '—'}
												</dd>
											</div>
										</div>
									</dl>
								</div>
							</div>
						</section>

						<div className="grid grid-cols-1 gap-6 lg:grid-cols-2 lg:items-start lg:gap-8">
							<section className={`${cardBase} overflow-hidden`}>
								<div
									className={`flex flex-col gap-4 border-b px-6 py-6 sm:flex-row sm:items-center sm:justify-between ${
										isDarkMode ? 'border-[#2A2A2A]' : 'border-[#E5E7EB]'
									}`}
								>
									<div className="flex items-center gap-4 min-w-0">
										<div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-lg ${isDarkMode ? 'bg-[#EA580C]/10 text-[#EA580C]' : 'bg-[#EA580C]/10 text-[#EA580C]'}`}>
											<UserIcon size={22} strokeWidth={2} />
										</div>
										<div className="min-w-0">
											<h3 className={`text-lg font-semibold tracking-tight ${isDarkMode ? 'text-[#F5F5F5]' : 'text-[#171717]'}`}>Personal information</h3>
											<p className={`text-sm mt-0.5 ${isDarkMode ? 'text-[#A0A0A0]' : 'text-[#6B7280]'}`}>Name, school details, and contact</p>
										</div>
									</div>
									<div className="flex flex-wrap items-center gap-2 sm:justify-end">
										{editMode.personal && (
											<button type="button" onClick={() => handleCancel('personal')} className={secondaryBtn}>
												Cancel
											</button>
										)}
										<button type="button" onClick={() => toggleEdit('personal')} className={primaryBtnClass(editMode.personal)}>
											{editMode.personal ? (
												saving ? 'Saving...' : 'Save changes'
											) : (
												<>
													<Edit2 size={16} strokeWidth={2} />
													Edit profile
												</>
											)}
										</button>
									</div>
								</div>
								<div className="p-5 sm:p-6">
									<div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
										<div>
											<label className={labelClass} htmlFor="profile-firstName">First name</label>
											{editMode.personal ? (
												<input id="profile-firstName" type="text" name="firstName" value={formData.firstName} onChange={handleChange} className={inputClass} />
											) : (
												<p className={valueClass}>{profile.firstName}</p>
											)}
										</div>
										<div>
											<label className={labelClass} htmlFor="profile-lastName">Last name</label>
											{editMode.personal ? (
												<input id="profile-lastName" type="text" name="lastName" value={formData.lastName} onChange={handleChange} className={inputClass} />
											) : (
												<p className={valueClass}>{profile.lastName}</p>
											)}
										</div>
										<div>
											<label className={labelClass} htmlFor="profile-department">Department</label>
											{editMode.personal ? (
												<input id="profile-department" type="text" name="department" value={formData.department} onChange={handleChange} className={inputClass} placeholder="e.g. Computer Science" />
											) : (
												<p className={valueClass}>{profile.department || 'Not set'}</p>
											)}
										</div>
										<div>
											<label className={labelClass} htmlFor="profile-course">Course</label>
											{editMode.personal ? (
												<input id="profile-course" type="text" name="course" value={formData.course} onChange={handleChange} className={inputClass} placeholder="e.g. BSCS" />
											) : (
												<p className={valueClass}>{profile.course || 'Not set'}</p>
											)}
										</div>
										<div>
											<label className={labelClass} htmlFor="profile-year">Year</label>
											{editMode.personal ? (
												<input id="profile-year" type="text" name="year" value={formData.year} onChange={handleChange} className={inputClass} placeholder="e.g. 3rd Year" />
											) : (
												<p className={valueClass}>{profile.year || 'Not set'}</p>
											)}
										</div>
										<div className="sm:col-span-2">
											<label className={labelClass} htmlFor="profile-email">Email</label>
											{editMode.personal ? (
												<input id="profile-email" type="email" name="email" value={formData.email} onChange={handleChange} className={inputClass} />
											) : (
												<div className="flex items-center gap-2">
													<Mail size={15} className={isDarkMode ? 'text-[#666666]' : 'text-[#9CA3AF]'} />
													<p className={valueClass}>{profile.email}</p>
												</div>
											)}
										</div>
										<div>
											<label className={labelClass} htmlFor="profile-phone">Phone</label>
											{editMode.personal ? (
												<input id="profile-phone" type="tel" name="phone" value={formData.phone} onChange={handleChange} className={inputClass} />
											) : (
												<div className="flex items-center gap-2">
													<Phone size={15} className={isDarkMode ? 'text-[#666666]' : 'text-[#9CA3AF]'} />
													<p className={valueClass}>{profile.phone}</p>
												</div>
											)}
										</div>
										<div>
											<label className={labelClass}>Role</label>
											<p className={valueClass}>{profile.role}</p>
										</div>
									</div>
								</div>
							</section>

							<section className={`${cardBase} overflow-hidden`}>
								<div
									className={`flex flex-col gap-4 border-b px-6 py-6 sm:flex-row sm:items-center sm:justify-between ${
										isDarkMode ? 'border-[#2A2A2A]' : 'border-[#E5E7EB]'
									}`}
								>
									<div className="flex items-center gap-4 min-w-0">
										<div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-lg ${isDarkMode ? 'bg-[#EA580C]/10 text-[#EA580C]' : 'bg-[#EA580C]/10 text-[#EA580C]'}`}>
											<MapPin size={22} strokeWidth={2} />
										</div>
										<div className="min-w-0">
											<h3 className={`text-lg font-semibold tracking-tight ${isDarkMode ? 'text-[#F5F5F5]' : 'text-[#171717]'}`}>Address</h3>
											<p className={`text-sm mt-0.5 ${isDarkMode ? 'text-[#A0A0A0]' : 'text-[#6B7280]'}`}>Where we can reach you</p>
										</div>
									</div>
									<div className="flex flex-wrap items-center gap-2 sm:justify-end">
										{editMode.address && (
											<button type="button" onClick={() => handleCancel('address')} className={secondaryBtn}>
												Cancel
											</button>
										)}
										<button type="button" onClick={() => toggleEdit('address')} className={primaryBtnClass(editMode.address)}>
											{editMode.address ? (
												saving ? 'Saving...' : 'Save changes'
											) : (
												<>
													<Edit2 size={16} strokeWidth={2} />
													Edit address
												</>
											)}
										</button>
									</div>
								</div>
								<div className="p-5 sm:p-6">
									<div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
										<div>
											<label className={labelClass} htmlFor="profile-city">City</label>
											{editMode.address ? (
												<input id="profile-city" type="text" name="city" value={formData.city} onChange={handleChange} className={inputClass} />
											) : (
												<p className={valueClass}>{profile.city || 'Not set'}</p>
											)}
										</div>
										<div>
											<label className={labelClass} htmlFor="profile-postal">Postal code</label>
											{editMode.address ? (
												<input id="profile-postal" type="text" name="postalCode" value={formData.postalCode} onChange={handleChange} className={inputClass} />
											) : (
												<p className={valueClass}>{profile.postalCode || 'Not set'}</p>
											)}
										</div>
										<div className="sm:col-span-2">
											<label className={labelClass} htmlFor="profile-address">Street address</label>
											{editMode.address ? (
												<input id="profile-address" type="text" name="address" value={formData.address} onChange={handleChange} className={inputClass} />
											) : (
												<p className={valueClass}>{profile.address}</p>
											)}
										</div>
									</div>
								</div>
							</section>
						</div>

						<UserActivityAnalytics orders={orders} isDarkMode={isDarkMode} />

						<section className={`${cardBase} overflow-hidden`}>
							<div
								className={`flex items-center gap-4 border-b px-6 py-6 ${
									isDarkMode ? 'border-[#2A2A2A]' : 'border-[#E5E7EB]'
								}`}
							>
								<div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-lg ${isDarkMode ? 'bg-red-500/10 text-red-400' : 'bg-red-50 text-red-600'}`}>
									<LogOut size={22} strokeWidth={2} />
								</div>
								<div className="min-w-0">
									<h3 className={`text-lg font-semibold tracking-tight ${isDarkMode ? 'text-[#F5F5F5]' : 'text-[#171717]'}`}>Session</h3>
									<p className={`text-sm mt-0.5 ${isDarkMode ? 'text-[#A0A0A0]' : 'text-[#6B7280]'}`}>Manage your login session</p>
								</div>
							</div>
							<div className="p-5 sm:p-6" ref={logoutRef}>
								{!showLogoutConfirm ? (
									<button
										type="button"
										onClick={() => setShowLogoutConfirm(true)}
										className={`w-full flex items-center justify-between rounded-xl border px-5 py-4 text-left transition-all duration-200 group ${
											isDarkMode
												? 'border-red-500/20 hover:border-red-500/40 hover:bg-red-500/5'
												: 'border-red-200 hover:border-red-300 hover:bg-red-50'
										}`}
									>
										<div className="flex items-center gap-3">
											<LogOut size={18} className={`transition-colors ${isDarkMode ? 'text-[#666666] group-hover:text-red-400' : 'text-[#9CA3AF] group-hover:text-red-500'}`} />
											<span className={`text-sm font-semibold ${isDarkMode ? 'text-red-400' : 'text-red-600'}`}>Logout from account</span>
										</div>
										<ChevronRight size={18} className={`transition-colors ${isDarkMode ? 'text-[#666666] group-hover:text-red-400' : 'text-[#9CA3AF] group-hover:text-red-500'}`} />
									</button>
								) : (
									<div className={`rounded-xl border p-5 transition-all duration-300 ${isDarkMode ? 'border-red-500/30 bg-red-500/5' : 'border-red-200 bg-red-50'}`}>
										<div className="flex items-center gap-3 mb-4">
											<div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${isDarkMode ? 'bg-red-500/10' : 'bg-red-100'}`}>
												<LogOut size={18} className="text-red-500" />
											</div>
											<div>
												<p className={`text-sm font-bold ${isDarkMode ? 'text-[#F5F5F5]' : 'text-[#171717]'}`}>Are you sure you want to logout?</p>
												<p className={`text-xs ${isDarkMode ? 'text-[#A0A0A0]' : 'text-[#6B7280]'}`}>You'll need to sign in again to access your account.</p>
											</div>
										</div>
										<div className="flex items-center gap-2 ml-12">
											<button
												type="button"
												onClick={handleLogout}
												className="px-4 py-2 bg-red-600 text-white text-xs font-bold rounded-lg hover:bg-red-700 transition-all"
											>
												Yes, Logout
											</button>
											<button
												type="button"
												onClick={() => setShowLogoutConfirm(false)}
												className={`px-4 py-2 text-xs font-bold rounded-lg border transition-all ${isDarkMode ? 'bg-[#222222] text-[#A0A0A0] border-[#2A2A2A] hover:bg-[#2A2A2A]' : 'bg-white text-[#6B7280] border-[#E5E7EB] hover:bg-[#FAFAFA]'}`}
											>
												Cancel
											</button>
										</div>
									</div>
								)}
							</div>
						</section>
					</div>
				</div>
			</main>
		</div>
	)
}

export default Profile
