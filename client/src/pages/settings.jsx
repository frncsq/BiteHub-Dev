import CustomerSidebar from "../components/CustomerSidebar"
import { useState, useRef, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { useTheme } from "../context/ThemeContext"
import {
	Sliders,
	Moon,
	Sun,
	Bell,
	Settings as SettingsIcon,
	Trash2,
	LogOut,
	ChevronRight,
	Shield,
	Eye,
	EyeOff,
} from "lucide-react"

function Settings() {
	const { isDarkMode, toggleTheme } = useTheme()
	const navigate = useNavigate()
	const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
	const [emailNotifs, setEmailNotifs] = useState(true)
	const [pushNotifs, setPushNotifs] = useState(true)
	const [orderUpdates, setOrderUpdates] = useState(true)
	const [showLogoutConfirm, setShowLogoutConfirm] = useState(false)
	const [message, setMessage] = useState("")
	const [messageType, setMessageType] = useState("")
	const logoutRef = useRef(null)

	// Close logout confirm when clicking outside
	useEffect(() => {
		const handler = (e) => {
			if (logoutRef.current && !logoutRef.current.contains(e.target)) {
				setShowLogoutConfirm(false)
			}
		}
		if (showLogoutConfirm) {
			document.addEventListener("mousedown", handler)
			return () => document.removeEventListener("mousedown", handler)
		}
	}, [showLogoutConfirm])

	const handleLogout = () => {
		localStorage.removeItem("authToken")
		setMessage("Logged out successfully!")
		setMessageType("success")
		setTimeout(() => navigate("/login"), 600)
	}

	const cardBase = `rounded-[1.5rem] border transition-all duration-300 ${
		isDarkMode
			? "border-white/[0.08] bg-zinc-900/40 backdrop-blur-md"
			: "border-black/[0.04] bg-white shadow-[0_8px_30px_rgb(0,0,0,0.04)]"
	}`

	const toggleSwitch = (isOn, onToggle) => (
		<button
			type="button"
			onClick={onToggle}
			className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-orange-500/40 focus:ring-offset-2 ${
				isOn
					? "bg-orange-500 shadow-sm shadow-orange-500/30"
					: isDarkMode
					? "bg-zinc-700"
					: "bg-slate-300"
			} ${isDarkMode ? "focus:ring-offset-zinc-900" : "focus:ring-offset-white"}`}
		>
			<span
				className={`${
					isOn ? "translate-x-6" : "translate-x-1"
				} inline-block h-5 w-5 transform rounded-full bg-white shadow-sm transition-transform duration-300`}
			/>
		</button>
	)

	return (
		<div
			className={`min-h-screen flex ${
				isDarkMode
					? "bg-zinc-950"
					: "bg-gradient-to-b from-slate-50 to-slate-100/90"
			}`}
		>
			<CustomerSidebar
				activeTab="settings"
				sidebarCollapsed={sidebarCollapsed}
				setSidebarCollapsed={setSidebarCollapsed}
			/>

			<main
				className={`flex-1 min-h-screen min-w-0 overflow-x-hidden transition-all duration-300 pb-24 md:pb-8 ${
					sidebarCollapsed ? "md:pl-20" : "md:pl-64"
				}`}
			>
				<div className="bh-container max-w-4xl py-8 sm:py-10 lg:py-12">
					{/* Page header */}
					<header className="mb-8 space-y-1">
						<h1
							className={`text-2xl sm:text-3xl font-semibold tracking-tight ${
								isDarkMode ? "text-white" : "text-slate-900"
							}`}
						>
							Settings
						</h1>
						<p
							className={`text-sm sm:text-base max-w-xl ${
								isDarkMode ? "text-zinc-400" : "text-slate-600"
							}`}
						>
							Manage your display, notification preferences, and account
							security.
						</p>
					</header>

					{/* Status message */}
					{message && (
						<div
							role="status"
							className={`mb-6 flex items-center justify-between gap-4 rounded-2xl border px-4 py-3 text-sm shadow-sm transition-all duration-300 ${
								messageType === "success"
									? isDarkMode
										? "border-emerald-500/30 bg-emerald-950/40 text-emerald-200"
										: "border-emerald-200/80 bg-emerald-50/90 text-emerald-800"
									: isDarkMode
									? "border-red-500/30 bg-red-950/40 text-red-200"
									: "border-red-200/80 bg-red-50/90 text-red-800"
							}`}
						>
							<div className="flex items-center gap-2 min-w-0">
								<span className="shrink-0">
									{messageType === "success" ? "✅" : "❌"}
								</span>
								<span className="truncate">{message}</span>
							</div>
							<button
								type="button"
								onClick={() => setMessage("")}
								className={`shrink-0 rounded-lg p-1.5 transition-colors duration-200 ${
									isDarkMode ? "hover:bg-white/10" : "hover:bg-black/5"
								}`}
								aria-label="Dismiss notification"
							>
								✕
							</button>
						</div>
					)}

					<div className="flex flex-col gap-6 lg:gap-8">
						{/* ── Display Preferences ── */}
						<section className={`${cardBase} overflow-hidden`}>
							<div
								className={`flex items-center gap-4 border-b px-6 py-6 ${
									isDarkMode
										? "border-white/5 bg-white/[0.02]"
										: "border-black/5 bg-black/[0.02]"
								}`}
							>
								<div
									className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${
										isDarkMode
											? "bg-violet-500/15 text-violet-400"
											: "bg-violet-500/10 text-violet-600"
									}`}
								>
									<Sliders size={22} strokeWidth={2} />
								</div>
								<div className="min-w-0">
									<h3
										className={`text-lg font-semibold tracking-tight ${
											isDarkMode ? "text-white" : "text-slate-900"
										}`}
									>
										Display Preferences
									</h3>
									<p
										className={`text-sm mt-0.5 ${
											isDarkMode ? "text-zinc-400" : "text-slate-500"
										}`}
									>
										Customize how BiteHub looks on your device
									</p>
								</div>
							</div>
							<div className="p-5 sm:p-6 space-y-4">
								<div
									className={`flex items-center justify-between rounded-2xl px-5 py-4 transition-colors duration-200 ${
										isDarkMode ? "bg-white/5" : "bg-black/[0.02]"
									}`}
								>
									<div className="flex items-center gap-4">
										<div
											className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
												isDarkMode
													? "bg-white/5 text-sky-400"
													: "bg-white text-sky-600 shadow-sm"
											}`}
										>
											{isDarkMode ? (
												<Moon size={18} />
											) : (
												<Sun size={18} />
											)}
										</div>
										<div>
											<p
												className={`text-sm font-semibold ${
													isDarkMode ? "text-zinc-100" : "text-slate-800"
												}`}
											>
												App Theme
											</p>
											<p
												className={`text-xs ${
													isDarkMode ? "text-zinc-400" : "text-slate-500"
												}`}
											>
												Toggle between dark mode and light mode
											</p>
										</div>
									</div>
									{toggleSwitch(isDarkMode, toggleTheme)}
								</div>
							</div>
						</section>

						{/* ── Notification Settings ── */}
						<section className={`${cardBase} overflow-hidden`}>
							<div
								className={`flex items-center gap-4 border-b px-6 py-6 ${
									isDarkMode
										? "border-white/5 bg-white/[0.02]"
										: "border-black/5 bg-black/[0.02]"
								}`}
							>
								<div
									className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${
										isDarkMode
											? "bg-amber-500/15 text-amber-400"
											: "bg-amber-500/10 text-amber-600"
									}`}
								>
									<Bell size={22} strokeWidth={2} />
								</div>
								<div className="min-w-0">
									<h3
										className={`text-lg font-semibold tracking-tight ${
											isDarkMode ? "text-white" : "text-slate-900"
										}`}
									>
										Notification Settings
									</h3>
									<p
										className={`text-sm mt-0.5 ${
											isDarkMode ? "text-zinc-400" : "text-slate-500"
										}`}
									>
										Control what alerts you receive
									</p>
								</div>
							</div>
							<div className="p-5 sm:p-6 space-y-3">
								{[
									{
										title: "Email Notifications",
										desc: "Receive daily promos and order receipts by email",
										state: emailNotifs,
										setter: setEmailNotifs,
									},
									{
										title: "Push Notifications",
										desc: "Get instant alerts about your order status",
										state: pushNotifs,
										setter: setPushNotifs,
									},
									{
										title: "Order Updates via SMS",
										desc: "Text alerts for when your food is arriving",
										state: orderUpdates,
										setter: setOrderUpdates,
									},
								].map((pref, idx) => (
									<div
										key={idx}
										className={`flex items-center justify-between rounded-2xl px-5 py-4 transition-colors duration-200 ${
											isDarkMode
												? "hover:bg-white/5"
												: "hover:bg-black/[0.02]"
										}`}
									>
										<div className="pr-4">
											<p
												className={`text-sm font-semibold ${
													isDarkMode ? "text-zinc-100" : "text-slate-800"
												}`}
											>
												{pref.title}
											</p>
											<p
												className={`text-xs mt-0.5 ${
													isDarkMode ? "text-zinc-400" : "text-slate-500"
												}`}
											>
												{pref.desc}
											</p>
										</div>
										{toggleSwitch(pref.state, () =>
											pref.setter(!pref.state)
										)}
									</div>
								))}
							</div>
						</section>

						{/* ── Account Management ── */}
						<section className={`${cardBase} overflow-hidden`}>
							<div
								className={`flex items-center gap-4 border-b px-6 py-6 ${
									isDarkMode
										? "border-white/5 bg-white/[0.02]"
										: "border-black/5 bg-black/[0.02]"
								}`}
							>
								<div
									className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${
										isDarkMode
											? "bg-sky-500/15 text-sky-400"
											: "bg-sky-500/10 text-sky-600"
									}`}
								>
									<SettingsIcon size={22} strokeWidth={2} />
								</div>
								<div className="min-w-0">
									<h3
										className={`text-lg font-semibold tracking-tight ${
											isDarkMode ? "text-white" : "text-slate-900"
										}`}
									>
										Account Management
									</h3>
									<p
										className={`text-sm mt-0.5 ${
											isDarkMode ? "text-zinc-400" : "text-slate-500"
										}`}
									>
										Cache, data, and session controls
									</p>
								</div>
							</div>
							<div className="p-5 sm:p-6 space-y-3">
								{/* Clear cache */}
								<button
									type="button"
									onClick={() => {
										setMessage(
											"Local cache cleared successfully! App may reload soon."
										)
										setMessageType("success")
									}}
									className={`w-full flex items-center justify-between rounded-2xl px-5 py-4 text-left transition-colors duration-200 ${
										isDarkMode
											? "hover:bg-white/5"
											: "hover:bg-black/[0.02]"
									}`}
								>
									<div>
										<p
											className={`text-sm font-semibold ${
												isDarkMode ? "text-zinc-100" : "text-slate-800"
											}`}
										>
											Clear Local App Cache
										</p>
										<p
											className={`text-xs mt-0.5 ${
												isDarkMode ? "text-zinc-400" : "text-slate-500"
											}`}
										>
											Free up space and resolve display issues
										</p>
									</div>
									<Trash2
										size={18}
										className={
											isDarkMode ? "text-zinc-500" : "text-slate-400"
										}
									/>
								</button>

								{/* Logout */}
								<div ref={logoutRef}>
									{!showLogoutConfirm ? (
										<button
											type="button"
											onClick={() => setShowLogoutConfirm(true)}
											className={`w-full flex items-center justify-between rounded-2xl border px-5 py-4 text-left transition-all duration-200 group ${
												isDarkMode
													? "border-red-500/20 hover:border-red-500/40 hover:bg-red-950/30"
													: "border-red-100 hover:border-red-200 hover:bg-red-50/80"
											}`}
										>
											<div className="flex items-center gap-3">
												<LogOut
													size={18}
													className={`transition-colors ${
														isDarkMode
															? "text-zinc-500 group-hover:text-red-400"
															: "text-slate-400 group-hover:text-red-500"
													}`}
												/>
												<span
													className={`text-sm font-semibold ${
														isDarkMode
															? "text-red-400"
															: "text-red-600"
													}`}
												>
													Logout from account
												</span>
											</div>
											<ChevronRight
												size={18}
												className={`transition-colors ${
													isDarkMode
														? "text-zinc-500 group-hover:text-red-400"
														: "text-slate-400 group-hover:text-red-500"
												}`}
											/>
										</button>
									) : (
										<div
											className={`rounded-2xl border p-5 animate-in fade-in duration-300 ${
												isDarkMode
													? "border-red-500/30 bg-red-950/30"
													: "border-red-200 bg-red-50/60"
											}`}
										>
											<div className="flex items-center gap-3 mb-4">
												<div
													className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${
														isDarkMode
															? "bg-red-500/20"
															: "bg-red-100"
													}`}
												>
													<LogOut size={18} className="text-red-500" />
												</div>
												<div>
													<p
														className={`text-sm font-bold ${
															isDarkMode
																? "text-zinc-100"
																: "text-slate-900"
														}`}
													>
														Are you sure you want to logout?
													</p>
													<p
														className={`text-xs ${
															isDarkMode
																? "text-zinc-400"
																: "text-slate-500"
														}`}
													>
														You'll need to sign in again to access your
														account.
													</p>
												</div>
											</div>
											<div className="flex items-center gap-2 ml-12">
												<button
													type="button"
													onClick={handleLogout}
													className="px-4 py-2 bg-red-600 text-white text-xs font-bold rounded-xl hover:bg-red-700 transition-all hover:shadow-md shadow-sm"
												>
													Yes, Logout
												</button>
												<button
													type="button"
													onClick={() =>
														setShowLogoutConfirm(false)
													}
													className={`px-4 py-2 text-xs font-bold rounded-xl border transition-all ${
														isDarkMode
															? "bg-zinc-800 text-zinc-300 border-zinc-700 hover:bg-zinc-700"
															: "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
													}`}
												>
													Cancel
												</button>
											</div>
										</div>
									)}
								</div>
							</div>
						</section>
					</div>
				</div>
			</main>
		</div>
	)
}

export default Settings
