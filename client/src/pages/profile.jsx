import CustomerSidebar from "../components/CustomerSidebar"
import UserActivityAnalytics, { buildProfileActivityMetrics } from "../components/UserActivityAnalytics"
import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { useTheme } from "../context/ThemeContext"
import { Edit2, Camera, MapPin, Mail, Phone, User as UserIcon, Calendar, Briefcase, LayoutDashboard, Utensils, Package } from "lucide-react"
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
			<div className={`flex min-h-screen items-center justify-center transition-colors duration-300 ${isDarkMode ? 'bg-zinc-950' : 'bg-slate-50'}`}>
				<div className="text-center px-6">
					<div className={`mx-auto mb-5 h-12 w-12 rounded-full border-2 border-orange-500/30 border-t-orange-500 animate-spin shadow-sm`} aria-hidden />
					<p className={`text-base font-medium tracking-tight ${isDarkMode ? 'text-zinc-300' : 'text-slate-600'}`}>Loading your profile…</p>
				</div>
			</div>
		)
	}

	const cardBase = `rounded-[1.5rem] border transition-all duration-300 ${isDarkMode ? 'border-white/[0.08] bg-zinc-900/40 backdrop-blur-md' : 'border-black/[0.04] bg-white shadow-[0_8px_30px_rgb(0,0,0,0.04)]'}`

	const inputClass = `w-full rounded-2xl px-4 py-3 text-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500/50 bg-transparent ${
		isDarkMode ? 'border border-white/10 text-zinc-100 placeholder:text-zinc-600 focus:bg-white/5' : 'border border-black/10 text-slate-900 placeholder:text-slate-400 focus:bg-black/5'
	}`

	const labelClass = `mb-1.5 block text-xs font-medium ${isDarkMode ? 'text-zinc-400' : 'text-slate-500'}`

	const valueClass = `text-sm font-medium leading-relaxed ${isDarkMode ? 'text-zinc-100' : 'text-slate-800'}`

	const secondaryBtn = `inline-flex items-center justify-center rounded-2xl border px-4 py-2.5 text-sm font-medium transition-all duration-200 active:scale-[0.98] ${
		isDarkMode
			? 'border-white/10 text-zinc-300 hover:bg-white/5'
			: 'border-black/10 text-slate-700 hover:bg-black/5'
	}`

	const primaryBtnBase =
		'inline-flex items-center justify-center gap-2 rounded-2xl px-4 py-2.5 text-sm font-medium transition-all duration-200 active:scale-[0.98]'

	const primaryBtnClass = (editing) =>
		`${primaryBtnBase} ${
			editing ? 'bg-orange-500 text-white hover:bg-orange-600 shadow-lg shadow-orange-500/20' : isDarkMode ? 'bg-white text-zinc-950 hover:bg-zinc-200' : 'bg-slate-900 text-white hover:bg-slate-800'
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
		<div className={`min-h-screen flex ${isDarkMode ? 'bg-zinc-950' : 'bg-gradient-to-b from-slate-50 to-slate-100/90'}`}>
			<CustomerSidebar
				activeTab="profile"
				sidebarCollapsed={sidebarCollapsed}
				setSidebarCollapsed={setSidebarCollapsed}
			/>

			<main className={`flex-1 min-h-screen transition-all duration-300 ${sidebarCollapsed ? 'md:pl-20' : 'md:pl-64'}`}>
				<div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8 text-gray-900 overflow-hidden">
					<div className={`mb-8 overflow-hidden rounded-[2rem] border p-6 sm:p-8 transition-all duration-300 ${isDarkMode ? 'bg-zinc-900/40 border-white/[0.08] backdrop-blur-xl shadow-2xl shadow-black/40' : 'bg-white border-black/[0.04] shadow-[0_20px_40px_rgb(0,0,0,0.04)]'}`}>
						<div className="flex flex-col gap-8 md:flex-row md:items-center md:justify-between">
							<div className="min-w-0 flex-1">
								<h3 className={`text-2xl font-semibold tracking-tight sm:text-3xl ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>Profile of {displayName}</h3>
								<p className={`mt-2.5 max-w-xl text-sm leading-relaxed sm:text-base ${isDarkMode ? 'text-zinc-400' : 'text-slate-500'}`}>
									View your campus dining analytics, default delivery addresses, and recent activity.
								</p>
								<div className="mt-6 flex flex-wrap items-center gap-3">
									<button
										type="button"
										onClick={scrollToUserActivity}
										className={`inline-flex items-center gap-2 rounded-2xl px-5 py-2.5 text-sm font-medium transition-all duration-200 hover:-translate-y-0.5 border ${isDarkMode ? 'bg-white/5 text-white border-white/10 hover:bg-white/10 hover:border-white/20' : 'bg-white text-slate-800 border-black/10 hover:bg-black/5'}`}
									>
										<LayoutDashboard size={18} strokeWidth={2} aria-hidden />
										Dashboard
									</button>
									<button
										type="button"
										onClick={() => navigate("/home")}
										className="inline-flex items-center gap-2 rounded-2xl bg-orange-500 px-5 py-2.5 text-sm font-medium text-white transition-all duration-200 hover:bg-orange-600 hover:shadow-lg hover:shadow-orange-500/25 hover:-translate-y-0.5"
									>
										<Utensils size={18} strokeWidth={2} aria-hidden />
										Browse food
									</button>
									<button
										type="button"
										onClick={() => navigate("/orders")}
										className={`inline-flex items-center gap-2 rounded-2xl px-5 py-2.5 text-sm font-medium transition-all duration-200 ${isDarkMode ? 'text-zinc-400 hover:text-white hover:bg-white/5' : 'text-slate-600 hover:text-slate-900 hover:bg-black/5'}`}
									>
										<Package size={18} strokeWidth={2} aria-hidden />
										View orders
									</button>
								</div>
							</div>
							<div className="grid w-full grid-cols-3 gap-3 md:w-auto md:min-w-[320px]">
								<div className={`rounded-2xl p-4 md:p-5 transition-all ${isDarkMode ? 'bg-white/5' : 'bg-black/[0.03]'}`}>
									<p className={`text-xs font-medium ${isDarkMode ? 'text-zinc-400' : 'text-slate-500'}`}>Active orders</p>
									<p className={`text-2xl font-semibold mt-1 tracking-tight ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>{activityMetrics.activeOrdersCount}</p>
								</div>
								<div className={`rounded-2xl p-4 md:p-5 transition-all ${isDarkMode ? 'bg-white/5' : 'bg-black/[0.03]'}`}>
									<p className={`text-xs font-medium ${isDarkMode ? 'text-zinc-400' : 'text-slate-500'}`}>Total orders</p>
									<p className={`text-2xl font-semibold mt-1 tracking-tight ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>{activityMetrics.totalOrders}</p>
								</div>
								<div className={`rounded-2xl p-4 md:p-5 transition-all ${isDarkMode ? 'bg-white/5' : 'bg-black/[0.03]'}`}>
									<p className={`text-xs font-medium ${isDarkMode ? 'text-zinc-400' : 'text-slate-500'}`}>Total spent</p>
									<p className={`text-2xl font-semibold mt-1 tracking-tight ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
										₱{Math.round(activityMetrics.totalSpent).toLocaleString()}
									</p>
								</div>
							</div>
						</div>
					</div>

					<header className="mb-8 space-y-1">
						<h1 className={`text-2xl sm:text-3xl font-semibold tracking-tight ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
							Profile
						</h1>
						<p className={`text-sm sm:text-base max-w-xl ${isDarkMode ? 'text-zinc-400' : 'text-slate-600'}`}>
							Manage your account details and see how you use BiteHub.
						</p>
					</header>

					{message && (
						<div
							role="status"
							className={`mb-6 flex items-center justify-between gap-4 rounded-2xl border px-4 py-3 text-sm shadow-sm transition-all duration-300 ${
								messageType === 'success'
									? isDarkMode
										? 'border-emerald-500/30 bg-emerald-950/40 text-emerald-200'
										: 'border-emerald-200/80 bg-emerald-50/90 text-emerald-800'
									: isDarkMode
										? 'border-red-500/30 bg-red-950/40 text-red-200'
										: 'border-red-200/80 bg-red-50/90 text-red-800'
							}`}
						>
							<div className="flex items-center gap-2 min-w-0">
								<span className="shrink-0">{messageType === 'success' ? '✅' : '❌'}</span>
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
									<div className="rounded-full bg-gradient-to-br from-orange-400/20 to-orange-600/10 p-1 shadow-inner ring-1 ring-black/5 dark:ring-white/10">
										{profile.profilePicture ? (
											<img
												src={profile.profilePicture}
												alt=""
												className="h-28 w-28 sm:h-32 sm:w-32 rounded-full object-cover shadow-md"
											/>
										) : (
											<div className="flex h-28 w-28 sm:h-32 sm:w-32 items-center justify-center rounded-full bg-gradient-to-br from-orange-400 to-orange-600 text-3xl sm:text-4xl font-semibold text-white shadow-lg shadow-orange-500/25">
												{profile.firstName ? profile.firstName.charAt(0).toUpperCase() : 'U'}
											</div>
										)}
									</div>
									<button
										type="button"
										className={`absolute bottom-1 right-1 flex h-9 w-9 items-center justify-center rounded-full border shadow-md transition-all duration-200 group-hover:scale-105 ${
											isDarkMode
												? 'border-zinc-600 bg-zinc-900 text-orange-400 hover:bg-zinc-800'
												: 'border-slate-200 bg-white text-orange-600 hover:bg-orange-50'
										}`}
										aria-label="Change photo (coming soon)"
									>
										<Camera size={16} strokeWidth={2} />
									</button>
								</div>

								<div className="min-w-0 flex-1 text-center sm:text-left space-y-4">
									<div>
										<h2 className={`text-xl sm:text-2xl font-semibold tracking-tight ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
											{`${profile.firstName} ${profile.lastName}`.trim() || 'Member'}
										</h2>
										<p className={`mt-1.5 text-sm ${isDarkMode ? 'text-zinc-400' : 'text-slate-600'}`}>
											{profile.email || 'No email on file'}
										</p>
									</div>

									<div className="flex flex-col sm:flex-row sm:flex-wrap gap-3 justify-center sm:justify-start">
										<div
											className={`inline-flex items-center justify-center gap-2 rounded-full px-3.5 py-1.5 text-xs font-medium ${
												isDarkMode ? 'bg-zinc-800/80 text-zinc-200' : 'bg-slate-100 text-slate-700'
											}`}
										>
											<Briefcase size={14} className="opacity-80 shrink-0" />
											<span>{profile.role}</span>
										</div>
										<div
											className={`inline-flex items-center justify-center gap-2 rounded-full px-3.5 py-1.5 text-xs font-medium ${
												isDarkMode ? 'bg-zinc-800/80 text-zinc-200' : 'bg-slate-100 text-slate-700'
											}`}
										>
											<MapPin size={14} className="opacity-80 shrink-0" />
											<span>{profile.city || 'No city set'}</span>
										</div>
										{joinLabel && (
											<div
												className={`inline-flex items-center justify-center gap-2 rounded-full px-3.5 py-1.5 text-xs font-medium ${
													isDarkMode ? 'bg-zinc-800/80 text-zinc-200' : 'bg-slate-100 text-slate-700'
												}`}
											>
												<Calendar size={14} className="opacity-80 shrink-0" />
												<span>Joined {joinLabel}</span>
											</div>
										)}
									</div>

									<dl className="grid grid-cols-1 gap-3 sm:grid-cols-2 pt-2">
										<div
											className={`flex items-start gap-4 rounded-2xl px-5 py-4 transition-colors duration-200 ${
												isDarkMode ? 'bg-white/5' : 'bg-black/[0.02]'
											}`}
										>
											<div className={`mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${isDarkMode ? 'bg-white/5 text-orange-400' : 'bg-white text-orange-600 shadow-sm'}`}>
												<Mail size={18} />
											</div>
											<div className="min-w-0">
												<dt className={`text-xs font-medium ${isDarkMode ? 'text-zinc-400' : 'text-slate-500'}`}>Email</dt>
												<dd className={`mt-1 truncate text-sm font-semibold ${isDarkMode ? 'text-zinc-100' : 'text-slate-800'}`}>
													{profile.email || '—'}
												</dd>
											</div>
										</div>
										<div
											className={`flex items-start gap-4 rounded-2xl px-5 py-4 transition-colors duration-200 ${
												isDarkMode ? 'bg-white/5' : 'bg-black/[0.02]'
											}`}
										>
											<div className={`mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${isDarkMode ? 'bg-white/5 text-orange-400' : 'bg-white text-orange-600 shadow-sm'}`}>
												<Phone size={18} />
											</div>
											<div className="min-w-0">
												<dt className={`text-xs font-medium ${isDarkMode ? 'text-zinc-400' : 'text-slate-500'}`}>Phone</dt>
												<dd className={`mt-1 truncate text-sm font-semibold ${isDarkMode ? 'text-zinc-100' : 'text-slate-800'}`}>
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
										isDarkMode ? 'border-white/5 bg-white/[0.02]' : 'border-black/5 bg-black/[0.02]'
									}`}
								>
									<div className="flex items-center gap-4 min-w-0">
										<div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${isDarkMode ? 'bg-orange-500/15 text-orange-400' : 'bg-orange-500/10 text-orange-600'}`}>
											<UserIcon size={22} strokeWidth={2} />
										</div>
										<div className="min-w-0">
											<h3 className={`text-lg font-semibold tracking-tight ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>Personal information</h3>
											<p className={`text-sm mt-0.5 ${isDarkMode ? 'text-zinc-400' : 'text-slate-500'}`}>Name, school details, and contact</p>
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
												saving ? 'Saving…' : 'Save changes'
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
													<Mail size={15} className={isDarkMode ? 'text-zinc-500' : 'text-slate-400'} />
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
													<Phone size={15} className={isDarkMode ? 'text-zinc-500' : 'text-slate-400'} />
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
										isDarkMode ? 'border-white/5 bg-white/[0.02]' : 'border-black/5 bg-black/[0.02]'
									}`}
								>
									<div className="flex items-center gap-4 min-w-0">
										<div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${isDarkMode ? 'bg-sky-500/15 text-sky-400' : 'bg-sky-500/10 text-sky-600'}`}>
											<MapPin size={22} strokeWidth={2} />
										</div>
										<div className="min-w-0">
											<h3 className={`text-lg font-semibold tracking-tight ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>Address</h3>
											<p className={`text-sm mt-0.5 ${isDarkMode ? 'text-zinc-400' : 'text-slate-500'}`}>Where we can reach you</p>
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
												saving ? 'Saving…' : 'Save changes'
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
					</div>
				</div>
			</main>
		</div>
	)
}

export default Profile
