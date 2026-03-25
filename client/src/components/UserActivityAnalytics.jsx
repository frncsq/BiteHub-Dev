import { useMemo } from "react"
import { ShoppingBag, TrendingUp, DollarSign } from "lucide-react"
import {
	XAxis,
	YAxis,
	CartesianGrid,
	Tooltip,
	ResponsiveContainer,
	PieChart,
	Pie,
	Cell,
	AreaChart,
	Area,
	BarChart,
	Bar,
} from "recharts"

export const ACTIVITY_CHART_COLORS = ["#f97316", "#3b82f6", "#10b981", "#f59e0b", "#8b5cf6", "#ec4899"]

/** Order line items may be an array, JSON string, or (legacy) a single object */
function normalizeOrderItems(order) {
	const raw = order?.items
	if (Array.isArray(raw)) return raw
	if (typeof raw === "string") {
		try {
			const parsed = JSON.parse(raw)
			return Array.isArray(parsed) ? parsed : []
		} catch {
			return []
		}
	}
	if (raw && typeof raw === "object") {
		const vals = Object.values(raw)
		if (vals.length > 0 && vals.every((v) => v != null && typeof v === "object" && !Array.isArray(v))) {
			return vals
		}
		return [raw]
	}
	return []
}

/** Pure metrics builder for banners / summaries — same rules as order list UI */
export function buildProfileActivityMetrics(orders) {
	const list = Array.isArray(orders) ? orders : []
	const totalOrders = list.length
	const totalSpent = list.reduce((sum, order) => sum + (parseFloat(order.total_amount) || 0), 0)
	const avgOrderValue = totalOrders > 0 ? totalSpent / totalOrders : 0

	const activeOrdersCount = list.filter((o) => {
		const s = (o.status || "").toLowerCase()
		return !["delivered", "completed", "cancelled"].includes(s)
	}).length

	const weekMs = 7 * 24 * 60 * 60 * 1000
	const cutoff = Date.now() - weekMs
	const thisWeekSpent = list
		.filter((o) => new Date(o.created_at || 0).getTime() >= cutoff)
		.reduce((sum, o) => sum + (parseFloat(o.total_amount) || 0), 0)

	const spendingByDate = list.reduce((acc, order) => {
		const date = new Date(order.created_at || new Date()).toLocaleDateString("en-US", {
			month: "short",
			day: "numeric",
		})
		acc[date] = (acc[date] || 0) + (parseFloat(order.total_amount) || 0)
		return acc
	}, {})

	const chartData = Object.entries(spendingByDate)
		.map(([date, amount]) => ({ date, amount }))
		.sort((a, b) => new Date(a.date) - new Date(b.date))
		.slice(-7)

	const activityByDate = list.reduce((acc, order) => {
		const date = new Date(order.created_at || new Date()).toLocaleDateString("en-US", {
			month: "short",
			day: "numeric",
		})
		if (!acc[date]) acc[date] = { date, orderCount: 0, amount: 0 }
		acc[date].orderCount += 1
		acc[date].amount += parseFloat(order.total_amount) || 0
		return acc
	}, {})

	const barChartData = Object.values(activityByDate)
		.sort((a, b) => new Date(a.date) - new Date(b.date))
		.slice(-7)

	const categoryCounts = list.reduce((acc, order) => {
		normalizeOrderItems(order).forEach((item) => {
			const cat = item.category || "Other"
			acc[cat] = (acc[cat] || 0) + (item.quantity || 1)
		})
		return acc
	}, {})

	const pieData = Object.entries(categoryCounts).map(([name, value]) => ({ name, value }))

	return {
		activeOrdersCount,
		thisWeekSpent,
		totalOrders,
		totalSpent,
		avgOrderValue,
		chartData,
		pieData,
		barChartData,
	}
}

export default function UserActivityAnalytics({ orders, isDarkMode }) {
	const metrics = useMemo(() => buildProfileActivityMetrics(orders), [orders])

	const cardBase = `rounded-2xl border shadow-sm transition-all duration-300 hover:shadow-md ${
		isDarkMode ? "border-zinc-800/80 bg-zinc-900/60" : "border-slate-200/80 bg-white"
	}`

	const a = metrics

	return (
		<section id="user-activity" className={`${cardBase} overflow-hidden scroll-mt-24`}>
			<div
				className={`flex flex-col gap-3 border-b px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6 ${
					isDarkMode ? "border-zinc-800/80 bg-zinc-900/40" : "border-slate-100 bg-slate-50/50"
				}`}
			>
				<div>
					<h3 className={`font-semibold tracking-tight ${isDarkMode ? "text-white" : "text-slate-900"}`}>User activity</h3>
					<p className={`text-xs mt-0.5 ${isDarkMode ? "text-zinc-500" : "text-slate-500"}`}>
						Orders, spending, and preferences from your account
					</p>
				</div>
				<div
					className={`inline-flex w-fit items-center gap-1.5 rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wider ${
						isDarkMode ? "bg-orange-500/15 text-orange-400" : "bg-orange-500/10 text-orange-600"
					}`}
				>
					<TrendingUp size={12} />
					<span>Live data</span>
				</div>
			</div>

			<div className="p-5 sm:p-6 space-y-8">
				<div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
					<div
						className={`group rounded-xl border p-4 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md ${
							isDarkMode ? "border-orange-500/20 bg-orange-500/[0.07]" : "border-orange-100 bg-orange-50/80"
						}`}
					>
						<div className="flex items-center gap-3 mb-2">
							<div className="rounded-lg bg-orange-500 p-2 text-white shadow-md shadow-orange-500/20 transition-transform duration-300 group-hover:scale-105">
								<ShoppingBag size={14} />
							</div>
							<span className="text-[10px] font-bold uppercase tracking-wider text-orange-600 dark:text-orange-400">
								Total orders
							</span>
						</div>
						<p className={`text-2xl font-bold tabular-nums ${isDarkMode ? "text-white" : "text-slate-900"}`}>{a.totalOrders}</p>
					</div>

					<div
						className={`group rounded-xl border p-4 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md ${
							isDarkMode ? "border-sky-500/20 bg-sky-500/[0.07]" : "border-sky-100 bg-sky-50/80"
						}`}
					>
						<div className="flex items-center gap-3 mb-2">
							<div className="rounded-lg bg-sky-500 p-2 text-white shadow-md shadow-sky-500/20 transition-transform duration-300 group-hover:scale-105">
								<DollarSign size={14} />
							</div>
							<span className="text-[10px] font-bold uppercase tracking-wider text-sky-600 dark:text-sky-400">Total spent</span>
						</div>
						<p className={`text-2xl font-bold tabular-nums ${isDarkMode ? "text-white" : "text-slate-900"}`}>
							₱{a.totalSpent.toLocaleString(undefined, { minimumFractionDigits: 2 })}
						</p>
					</div>

					<div
						className={`group rounded-xl border p-4 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md ${
							isDarkMode ? "border-emerald-500/20 bg-emerald-500/[0.07]" : "border-emerald-100 bg-emerald-50/80"
						}`}
					>
						<div className="flex items-center gap-3 mb-2">
							<div className="rounded-lg bg-emerald-500 p-2 text-white shadow-md shadow-emerald-500/20 transition-transform duration-300 group-hover:scale-105">
								<TrendingUp size={14} />
							</div>
							<span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
								Avg. value
							</span>
						</div>
						<p className={`text-2xl font-bold tabular-nums ${isDarkMode ? "text-white" : "text-slate-900"}`}>
							₱{a.avgOrderValue.toLocaleString(undefined, { minimumFractionDigits: 2 })}
						</p>
					</div>
				</div>

				<div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
					<div className="h-[240px] min-h-[220px]">
						<div className="mb-4 flex items-center justify-between">
							<h4 className={`text-xs font-bold uppercase tracking-widest ${isDarkMode ? "text-zinc-400" : "text-slate-500"}`}>
								Spending trend
							</h4>
							<span className={`text-[10px] ${isDarkMode ? "text-zinc-500" : "text-slate-400"}`}>By day</span>
						</div>
						<ResponsiveContainer width="100%" height="90%">
							<AreaChart data={a.chartData}>
								<defs>
									<linearGradient id="userActivityColorAmount" x1="0" y1="0" x2="0" y2="1">
										<stop offset="5%" stopColor="#f97316" stopOpacity={0.3} />
										<stop offset="95%" stopColor="#f97316" stopOpacity={0} />
									</linearGradient>
								</defs>
								<CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDarkMode ? "#333" : "#eee"} />
								<XAxis
									dataKey="date"
									axisLine={false}
									tickLine={false}
									tick={{ fontSize: 10, fill: isDarkMode ? "#666" : "#999" }}
									dy={10}
								/>
								<YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: isDarkMode ? "#666" : "#999" }} />
								<Tooltip
									contentStyle={{
										backgroundColor: isDarkMode ? "#1a1a1a" : "#fff",
										border: "none",
										borderRadius: "12px",
										boxShadow: "0 10px 15px -3px rgba(0,0,0,0.1)",
										fontSize: "12px",
									}}
								/>
								<Area
									type="monotone"
									dataKey="amount"
									stroke="#f97316"
									strokeWidth={3}
									fillOpacity={1}
									fill="url(#userActivityColorAmount)"
								/>
							</AreaChart>
						</ResponsiveContainer>
					</div>

					<div className="h-[240px] min-h-[220px]">
						<h4 className={`mb-4 text-xs font-bold uppercase tracking-widest ${isDarkMode ? "text-zinc-400" : "text-slate-500"}`}>
							Food preferences
						</h4>
						<div className="flex flex-col items-stretch gap-4 min-[400px]:flex-row min-[400px]:items-center h-full">
							<div className="min-h-[180px] flex-1">
								<ResponsiveContainer width="100%" height="100%">
									<PieChart>
										<Pie
											data={a.pieData}
											innerRadius={50}
											outerRadius={70}
											paddingAngle={5}
											dataKey="value"
										>
											{a.pieData.map((entry, index) => (
												<Cell key={`cell-${index}`} fill={ACTIVITY_CHART_COLORS[index % ACTIVITY_CHART_COLORS.length]} />
											))}
										</Pie>
										<Tooltip />
									</PieChart>
								</ResponsiveContainer>
							</div>
							<div className="flex-1 space-y-2 min-w-[140px]">
								{a.pieData.slice(0, 4).map((entry, index) => (
									<div key={index} className="flex items-center justify-between gap-2 text-[10px]">
										<div className="flex min-w-0 items-center gap-2">
											<div
												className="h-2 w-2 shrink-0 rounded-full"
												style={{ backgroundColor: ACTIVITY_CHART_COLORS[index % ACTIVITY_CHART_COLORS.length] }}
											/>
											<span className={`truncate ${isDarkMode ? "text-zinc-300" : "text-slate-600"}`}>{entry.name}</span>
										</div>
										<span className={`shrink-0 font-bold tabular-nums ${isDarkMode ? "text-white" : "text-slate-900"}`}>
											{entry.value}
										</span>
									</div>
								))}
							</div>
						</div>
					</div>
				</div>

				<div className="h-[260px] min-h-[220px]">
					<div className="mb-4 flex items-center justify-between">
						<h4 className={`text-xs font-bold uppercase tracking-widest ${isDarkMode ? "text-zinc-400" : "text-slate-500"}`}>
							Orders & spend by day
						</h4>
						<span className={`text-[10px] ${isDarkMode ? "text-zinc-500" : "text-slate-400"}`}>Recent days</span>
					</div>
					<ResponsiveContainer width="100%" height="88%">
						<BarChart data={a.barChartData} margin={{ top: 4, right: 8, left: 8, bottom: 4 }}>
							<CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDarkMode ? "#333" : "#eee"} />
							<XAxis
								dataKey="date"
								axisLine={false}
								tickLine={false}
								tick={{ fontSize: 10, fill: isDarkMode ? "#666" : "#999" }}
							/>
							<YAxis yAxisId="left" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: isDarkMode ? "#666" : "#999" }} />
							<YAxis
								yAxisId="right"
								orientation="right"
								axisLine={false}
								tickLine={false}
								tick={{ fontSize: 10, fill: isDarkMode ? "#666" : "#999" }}
							/>
							<Tooltip
								contentStyle={{
									backgroundColor: isDarkMode ? "#1a1a1a" : "#fff",
									border: "none",
									borderRadius: "12px",
									boxShadow: "0 10px 15px -3px rgba(0,0,0,0.1)",
									fontSize: "12px",
								}}
							/>
							<Bar yAxisId="left" dataKey="orderCount" name="Orders" fill="#f97316" radius={[6, 6, 0, 0]} maxBarSize={36} />
							<Bar yAxisId="right" dataKey="amount" name="Spend (₱)" fill="#3b82f6" radius={[6, 6, 0, 0]} maxBarSize={36} />
						</BarChart>
					</ResponsiveContainer>
				</div>
			</div>
		</section>
	)
}
