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

	const cardBase = `rounded-xl border transition-all duration-300 ${
		isDarkMode
			? "border-[#2A2A2A] bg-[#1A1A1A]"
			: "border-[#E5E7EB] bg-white"
	}`

	const toggleSwitch = (isOn, onToggle) => (
		<button
			type="button"
			onClick={onToggle}
			className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-[#EA580C]/30 focus:ring-offset-2 ${
				isOn
					? "bg-[#EA580C]"
					: isDarkMode
					? "bg-[#2A2A2A]"
					: "bg-[#E5E7EB]"
			} ${isDarkMode ? "focus:ring-offset-[#1A1A1A]" : "focus:ring-offset-white"}`}
		>
			<span
				className={`${
					isOn ? "translate-x-5" : "translate-x-1"
				} inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200`}
			/>
		</button>
	)

	return (
		<div
			className={`min-h-screen flex ${
				isDarkMode ? "bg-[#111111]" : "bg-[#FAFAFA]"
			}`}
		>
			<CustomerSidebar
				activeTab="settings"
				sidebarCollapsed={sidebarCollapsed}
				setSidebarCollapsed={setSidebarCollapsed}
			/>

			<main
				className={`flex-1 min-h-screen min-w-0 overflow-x-hidden transition-all duration-300 pb-24 md:pb-8 ${
					sidebarCollapsed ? "md:pl-[72px]" : "md:pl-[240px]"
				}`}
			>
				<div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 lg:py-12">
					<header className="mb-8 space-y-1">
						<h1
							className={`text-2xl sm:text-3xl font-semibold tracking-tight ${
								isDarkMode ? "text-[#F5F5F5]" : "text-[#171717]"
							}`}
						>
							Settings
						</h1>
						<p
							className={`text-sm sm:text-base max-w-xl ${
								isDarkMode ? "text-[#A0A0A0]" : "text-[#6B7280]"
							}`}
						>
							Manage your display, notification preferences, and account
							security.
						</p>
					</header>

					{message && (
						<div
							role="status"
							className={`mb-6 flex items-center justify-between gap-4 rounded-xl border px-4 py-3 text-sm transition-all duration-300 ${
								messageType === "success"
									? isDarkMode
										? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
										: "border-emerald-200 bg-emerald-50 text-emerald-700"
									: isDarkMode
									? "border-red-500/30 bg-red-500/10 text-red-400"
									: "border-red-200 bg-red-50 text-red-700"
							}`}
						>
							<div className="flex items-center gap-2 min-w-0">
								<span className="shrink-0">
									{messageType === "success" ? "✓" : "✕"}
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
						<section className={`${cardBase} overflow-hidden`}>
							<div
								className={`flex items-center gap-4 border-b px-6 py-6 ${
									isDarkMode ? "border-[#2A2A2A]" : "border-[#E5E7EB]"
								}`}
							>
								<div
									className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-lg ${
										isDarkMode
											? "bg-[#EA580C]/10 text-[#EA580C]"
											: "bg-[#EA580C]/10 text-[#EA580C]"
									}`}
								>
									<Sliders size={22} strokeWidth={2} />
								</div>
								<div className="min-w-0">
									<h3
										className={`text-lg font-semibold tracking-tight ${
											isDarkMode ? "text-[#F5F5F5]" : "text-[#171717]"
										}`}
									>
										Display Preferences
									</h3>
									<p
										className={`text-sm mt-0.5 ${
											isDarkMode ? "text-[#A0A0A0]" : "text-[#6B7280]"
										}`}
									>
										Customize how BiteHub looks on your device
									</p>
								</div>
							</div>
							<div className="p-5 sm:p-6 space-y-4">
								<div
									className={`flex items-center justify-between rounded-xl px-5 py-4 transition-colors duration-200 ${
										isDarkMode ? "bg-[#222222]" : "bg-[#FAFAFA]"
									}`}
								>
									<div className="flex items-center gap-4">
										<div
											className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${
												isDarkMode
													? "bg-[#EA580C]/10 text-[#EA580C]"
													: "bg-[#EA580C]/10 text-[#EA580C]"
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
													isDarkMode ? "text-[#F5F5F5]" : "text-[#171717]"
												}`}
											>
												App Theme
											</p>
											<p
												className={`text-xs ${
													isDarkMode ? "text-[#A0A0A0]" : "text-[#6B7280]"
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

						<section className={`${cardBase} overflow-hidden`}>
							<div
								className={`flex items-center gap-4 border-b px-6 py-6 ${
									isDarkMode ? "border-[#2A2A2A]" : "border-[#E5E7EB]"
								}`}
							>
								<div
									className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-lg ${
										isDarkMode
											? "bg-[#EA580C]/10 text-[#EA580C]"
											: "bg-[#EA580C]/10 text-[#EA580C]"
									}`}
								>
									<Bell size={22} strokeWidth={2} />
								</div>
								<div className="min-w-0">
									<h3
										className={`text-lg font-semibold tracking-tight ${
											isDarkMode ? "text-[#F5F5F5]" : "text-[#171717]"
										}`}
									>
										Notification Settings
									</h3>
									<p
										className={`text-sm mt-0.5 ${
											isDarkMode ? "text-[#A0A0A0]" : "text-[#6B7280]"
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
										className={`flex items-center justify-between rounded-xl px-5 py-4 transition-colors duration-200 ${
											isDarkMode
												? "hover:bg-[#222222]"
												: "hover:bg-[#FAFAFA]"
										}`}
									>
										<div className="pr-4">
											<p
												className={`text-sm font-semibold ${
													isDarkMode ? "text-[#F5F5F5]" : "text-[#171717]"
												}`}
											>
												{pref.title}
											</p>
											<p
												className={`text-xs mt-0.5 ${
													isDarkMode ? "text-[#A0A0A0]" : "text-[#6B7280]"
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

						<section className={`${cardBase} overflow-hidden`}>
							<div
								className={`flex items-center gap-4 border-b px-6 py-6 ${
									isDarkMode ? "border-[#2A2A2A]" : "border-[#E5E7EB]"
								}`}
							>
								<div
									className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-lg ${
										isDarkMode
											? "bg-[#EA580C]/10 text-[#EA580C]"
											: "bg-[#EA580C]/10 text-[#EA580C]"
									}`}
								>
									<SettingsIcon size={22} strokeWidth={2} />
								</div>
								<div className="min-w-0">
									<h3
										className={`text-lg font-semibold tracking-tight ${
											isDarkMode ? "text-[#F5F5F5]" : "text-[#171717]"
										}`}
									>
										Account Management
									</h3>
									<p
										className={`text-sm mt-0.5 ${
											isDarkMode ? "text-[#A0A0A0]" : "text-[#6B7280]"
										}`}
									>
										Cache, data, and session controls
									</p>
								</div>
							</div>
							<div className="p-5 sm:p-6 space-y-3">
								<button
									type="button"
									onClick={() => {
										setMessage(
											"Local cache cleared successfully! App may reload soon."
										)
										setMessageType("success")
									}}
									className={`w-full flex items-center justify-between rounded-xl px-5 py-4 text-left transition-colors duration-200 ${
										isDarkMode
											? "hover:bg-[#222222]"
											: "hover:bg-[#FAFAFA]"
									}`}
								>
									<div>
										<p
											className={`text-sm font-semibold ${
												isDarkMode ? "text-[#F5F5F5]" : "text-[#171717]"
											}`}
										>
											Clear Local App Cache
										</p>
										<p
											className={`text-xs mt-0.5 ${
												isDarkMode ? "text-[#A0A0A0]" : "text-[#6B7280]"
											}`}
										>
											Free up space and resolve display issues
										</p>
									</div>
									<Trash2
										size={18}
										className={
											isDarkMode ? "text-[#666666]" : "text-[#9CA3AF]"
										}
									/>
								</button>

								<div ref={logoutRef}>
									{!showLogoutConfirm ? (
										<button
											type="button"
											onClick={() => setShowLogoutConfirm(true)}
											className={`w-full flex items-center justify-between rounded-xl border px-5 py-4 text-left transition-all duration-200 group ${
												isDarkMode
													? "border-red-500/20 hover:border-red-500/40 hover:bg-red-500/5"
													: "border-red-200 hover:border-red-300 hover:bg-red-50"
											}`}
										>
											<div className="flex items-center gap-3">
												<LogOut
													size={18}
													className={`transition-colors ${
														isDarkMode
															? "text-[#666666] group-hover:text-red-400"
															: "text-[#9CA3AF] group-hover:text-red-500"
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
														? "text-[#666666] group-hover:text-red-400"
														: "text-[#9CA3AF] group-hover:text-red-500"
												}`}
											/>
										</button>
									) : (
										<div
											className={`rounded-xl border p-5 transition-all duration-300 ${
												isDarkMode
													? "border-red-500/30 bg-red-500/5"
													: "border-red-200 bg-red-50"
											}`}
										>
											<div className="flex items-center gap-3 mb-4">
												<div
													className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${
														isDarkMode
															? "bg-red-500/10"
															: "bg-red-100"
													}`}
												>
													<LogOut size={18} className="text-red-500" />
												</div>
												<div>
													<p
														className={`text-sm font-bold ${
															isDarkMode
																? "text-[#F5F5F5]"
																: "text-[#171717]"
														}`}
													>
														Are you sure you want to logout?
													</p>
													<p
														className={`text-xs ${
															isDarkMode
																? "text-[#A0A0A0]"
																: "text-[#6B7280]"
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
													className="px-4 py-2 bg-red-600 text-white text-xs font-bold rounded-lg hover:bg-red-700 transition-all"
												>
													Yes, Logout
												</button>
												<button
													type="button"
													onClick={() =>
														setShowLogoutConfirm(false)
													}
													className={`px-4 py-2 text-xs font-bold rounded-lg border transition-all ${
														isDarkMode
															? "bg-[#222222] text-[#A0A0A0] border-[#2A2A2A] hover:bg-[#2A2A2A]"
															: "bg-white text-[#6B7280] border-[#E5E7EB] hover:bg-[#FAFAFA]"
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
