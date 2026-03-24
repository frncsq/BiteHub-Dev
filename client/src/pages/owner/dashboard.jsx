import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { createApiClient } from '../../services/apiClient';
import {
  DollarSign, ShoppingBag, Clock, TrendingUp, List,
  Activity, ChevronRight, Eye, Search, Download,
  Package, BarChart3, Users, ChevronDown, Filter, Banknote
} from 'lucide-react';

function OwnerDashboard() {
  const [metrics, setMetrics] = useState({
    totalOrders: 0, revenue: 0, activeOrders: 0,
    menuItems: 0, todayOrders: 0, yesterdayOrders: 0
  });
  const [recentOrders, setRecentOrders] = useState([]);
  const [weeklyRevenue, setWeeklyRevenue] = useState([]);
  const [orderHeatmap, setOrderHeatmap] = useState([]);
  const [topItems, setTopItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchDashboardData = async (showLoading = true) => {
    try {
      if (showLoading) setIsLoading(true);
      const apiClient = createApiClient();
      const response = await apiClient.get('/owner/dashboard');
      if (response.data.success) {
        setMetrics(response.data.metrics);
        if (response.data.recentOrders) setRecentOrders(response.data.recentOrders);
        if (response.data.weeklyRevenue) setWeeklyRevenue(response.data.weeklyRevenue);
        if (response.data.orderHeatmap) setOrderHeatmap(response.data.orderHeatmap);
        if (response.data.topItems) setTopItems(response.data.topItems);
      } else {
        setError('Failed to fetch dashboard data');
      }
    } catch (err) {
      console.error("Dashboard error:", err);
      setError(err.response?.data?.message || 'Error loading dashboard');
    } finally {
      if (showLoading) setIsLoading(false);
    }
  };

  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('authToken');
    if (!token) {
      console.warn("No token for dashboard. Redirecting.");
      navigate('/restaurant-login');
      return;
    }
    fetchDashboardData();
    const interval = setInterval(() => fetchDashboardData(false), 30000);
    return () => clearInterval(interval);
  }, []);

  // ── Helpers ──────────────────────────────────────────────────────────────
  const fmt = (n) => Number(n || 0).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  // Build weekly chart data (7 days, fill missing with 0)
  const weeklyChartData = useMemo(() => {
    const data = Array(7).fill(0);
    weeklyRevenue.forEach(r => {
      const dow = parseInt(r.dow);
      data[dow] = parseFloat(r.revenue || 0);
    });
    return data;
  }, [weeklyRevenue]);

  const weeklyMax = Math.max(...weeklyChartData, 1);

  // Build heatmap grid: rows = hours (6am-10pm), cols = days (Sun-Sat)
  const HEAT_HOURS = [6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22];
  const heatmapGrid = useMemo(() => {
    const grid = {};
    let maxCount = 1;
    orderHeatmap.forEach(r => {
      const key = `${parseInt(r.dow)}_${parseInt(r.hour)}`;
      const c = parseInt(r.count || 0);
      grid[key] = c;
      if (c > maxCount) maxCount = c;
    });
    return { grid, maxCount };
  }, [orderHeatmap]);

  const formatHour = (h) => {
    if (h === 0 || h === 12) return h === 0 ? '12am' : '12pm';
    return h < 12 ? `${h}am` : `${h - 12}pm`;
  };

  const statusColor = (status) => {
    const map = {
      delivered: 'bg-emerald-100 text-emerald-700',
      ready: 'bg-blue-100 text-blue-700',
      preparing: 'bg-cyan-100 text-cyan-700',
      pending: 'bg-orange-100 text-orange-700',
      cancelled: 'bg-red-100 text-red-700',
    };
    return map[status] || 'bg-gray-100 text-gray-700';
  };

  if (isLoading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="w-14 h-14 border-4 border-orange-100 rounded-full" />
            <div className="absolute inset-0 w-14 h-14 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
          </div>
          <p className="text-sm font-bold text-gray-400 animate-pulse">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-12 max-w-[1400px] mx-auto">

      {/* ══════════════════════════════════════════════════════════════════
          Header
      ══════════════════════════════════════════════════════════════════ */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight">Dashboard Overview</h1>
          <p className="text-gray-400 mt-1 font-medium">Welcome back! Here's what's happening today.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative hidden md:block">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="dishes, restaurants..."
              className="pl-10 pr-5 py-2.5 rounded-2xl border border-gray-200 bg-white text-sm font-medium focus:outline-none focus:border-orange-300 focus:ring-4 focus:ring-orange-50 w-56 transition-all"
            />
          </div>
          <button className="px-5 py-2.5 bg-gradient-to-r from-orange-500 to-red-500 text-white font-bold rounded-2xl shadow-lg shadow-orange-500/25 hover:shadow-orange-500/40 hover:-translate-y-0.5 transition-all duration-300 flex items-center gap-2 text-sm">
            <Download size={16} /> Download Report
          </button>
        </div>
      </div>

      {error && <div className="p-4 bg-red-50 border border-red-100 text-red-600 rounded-2xl font-medium">{error}</div>}

      {/* ══════════════════════════════════════════════════════════════════
          4 KPI Cards Row
      ══════════════════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">

        {/* 1 · Total Revenue — Green gradient */}
        <div className="relative overflow-hidden p-6 rounded-[28px] bg-gradient-to-br from-emerald-500 via-emerald-600 to-green-700 text-white shadow-xl shadow-emerald-500/20 group hover:-translate-y-1 hover:shadow-2xl transition-all duration-300">
          <div className="absolute top-0 right-0 -mt-6 -mr-6 w-28 h-28 bg-white/15 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700" />
          <div className="relative z-10">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-emerald-100 text-[10px] font-black uppercase tracking-[2px] mb-2">Total Revenue</p>
                <h3 className="text-4xl font-black tracking-tight leading-none">₱{fmt(metrics.revenue)}</h3>
              </div>
              <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-sm shadow-inner">
                <Banknote size={22} className="text-white" />
              </div>
            </div>
            <div className="mt-5">
              <span className="inline-flex items-center gap-1.5 text-xs font-bold bg-white/20 backdrop-blur-sm px-3 py-1.5 rounded-full">
                <TrendingUp size={12} /> Peak Performance
              </span>
            </div>
          </div>
        </div>

        {/* 2 · Total Orders — White card with mini bar chart */}
        <div className="relative overflow-hidden p-6 rounded-[28px] bg-white border border-gray-100 shadow-sm group hover:-translate-y-1 hover:shadow-xl transition-all duration-300">
          <div className="relative z-10">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-gray-400 text-[10px] font-black uppercase tracking-[2px] mb-2">Total Orders</p>
                <h3 className="text-4xl font-black text-gray-900 tracking-tight leading-none">{metrics.totalOrders}</h3>
              </div>
              {/* Mini bar chart showing Today vs Yesterday */}
              <div className="flex items-end gap-1.5 h-14">
                <div className="flex flex-col items-center gap-0.5">
                  <div
                    className="w-5 rounded-t-md bg-gradient-to-t from-emerald-400 to-emerald-500 transition-all duration-500"
                    style={{ height: `${Math.max((metrics.todayOrders / Math.max(metrics.todayOrders, metrics.yesterdayOrders, 1)) * 40, 4)}px` }}
                  />
                  <span className="text-[7px] font-black text-gray-400 uppercase">Today</span>
                </div>
                <div className="flex flex-col items-center gap-0.5">
                  <div
                    className="w-5 rounded-t-md bg-gradient-to-t from-gray-200 to-gray-300 transition-all duration-500"
                    style={{ height: `${Math.max((metrics.yesterdayOrders / Math.max(metrics.todayOrders, metrics.yesterdayOrders, 1)) * 40, 4)}px` }}
                  />
                  <span className="text-[7px] font-black text-gray-400 uppercase">Yest.</span>
                </div>
              </div>
            </div>
            <div className="mt-5 flex items-center gap-2 text-xs font-medium text-gray-500">
              <span className="w-2 h-2 rounded-full bg-blue-500" />
              Since Launch &middot; {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </div>
          </div>
        </div>

        {/* 3 · Menu Items — White card with circle accent */}
        <div className="relative overflow-hidden p-6 rounded-[28px] bg-white border border-gray-100 shadow-sm group hover:-translate-y-1 hover:shadow-xl transition-all duration-300">
          <div className="relative z-10">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-gray-400 text-[10px] font-black uppercase tracking-[2px] mb-2">Menu Items</p>
                <h3 className="text-4xl font-black text-gray-900 tracking-tight leading-none">{metrics.menuItems}</h3>
              </div>
              <div className="relative">
                {/* Animated ring */}
                <svg width="52" height="52" viewBox="0 0 52 52" className="drop-shadow-sm">
                  <circle cx="26" cy="26" r="20" fill="none" stroke="#f3f4f6" strokeWidth="5" />
                  <circle cx="26" cy="26" r="20" fill="none" stroke="url(#menuGrad)" strokeWidth="5"
                    strokeDasharray={`${Math.min(metrics.menuItems / 20, 1) * 125.6} 125.6`}
                    strokeLinecap="round"
                    transform="rotate(-90 26 26)"
                    className="transition-all duration-700"
                  />
                  <defs>
                    <linearGradient id="menuGrad" x1="0" y1="0" x2="1" y2="1">
                      <stop offset="0%" stopColor="#818cf8" />
                      <stop offset="100%" stopColor="#6366f1" />
                    </linearGradient>
                  </defs>
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <List size={18} className="text-indigo-500" />
                </div>
              </div>
            </div>
            <div className="mt-5 flex items-center gap-2 text-xs font-medium text-gray-500">
              <span className="w-2 h-2 rounded-full bg-indigo-500" /> Active Database
            </div>
          </div>
        </div>

        {/* 4 · Live Orders — Dark / Red gradient */}
        <div className="relative overflow-hidden p-6 rounded-[28px] bg-gradient-to-br from-gray-800 via-gray-900 to-red-900 text-white shadow-xl shadow-gray-900/30 group hover:-translate-y-1 hover:shadow-2xl transition-all duration-300">
          <div className="absolute top-0 right-0 -mt-6 -mr-6 w-28 h-28 bg-red-500/20 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700" />
          <div className="relative z-10">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-gray-400 text-[10px] font-black uppercase tracking-[2px] mb-2">Live Orders</p>
                <h3 className="text-4xl font-black tracking-tight leading-none">{metrics.activeOrders}</h3>
              </div>
              {/* Pulsing ring icon */}
              <div className="relative">
                <div className="p-3 bg-white/10 rounded-2xl backdrop-blur-sm">
                  <Clock size={22} className="text-white" />
                </div>
                {metrics.activeOrders > 0 && (
                  <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-ping" />
                )}
              </div>
            </div>
            <div className="mt-5">
              <span className={`inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full ${metrics.activeOrders > 0 ? 'bg-red-500/30 text-red-300 animate-pulse' : 'bg-white/10 text-gray-400'
                }`}>
                <span className="w-1.5 h-1.5 rounded-full bg-current" />
                {metrics.activeOrders > 0 ? 'Requires Attention' : 'All Clear'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════
          Key Performance Indicators (KPIs) Section
      ══════════════════════════════════════════════════════════════════ */}
      <div className="bg-white rounded-[28px] border border-gray-100 shadow-sm p-6 md:p-8">
        <h2 className="text-2xl font-extrabold text-gray-900 tracking-tight mb-1">Key Performance Indicators (KPIs)</h2>
        <div className="h-px bg-gray-100 my-5" />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* ── Weekly Revenue Trend ── */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-black text-gray-900">Weekly Revenue Trend</h3>
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Past week</span>
            </div>

            {/* Y-axis labels + line chart area */}
            <div className="relative h-48">
              {/* Y-axis labels */}
              <div className="absolute left-0 top-0 bottom-6 w-16 flex flex-col justify-between text-[9px] font-bold text-gray-400 text-right pr-2">
                <span>₱{fmt(weeklyMax)}</span>
                <span>₱{fmt(weeklyMax * 0.75)}</span>
                <span>₱{fmt(weeklyMax * 0.5)}</span>
                <span>₱{fmt(weeklyMax * 0.25)}</span>
                <span>0</span>
              </div>

              {/* Chart area */}
              <div className="ml-16 h-full relative">
                {/* Horizontal grid lines */}
                {[0, 25, 50, 75, 100].map(pct => (
                  <div key={pct} className="absolute w-full border-t border-dashed border-gray-100" style={{ bottom: `${pct}%` }} />
                ))}

                {/* SVG Line Chart */}
                <svg viewBox="0 0 300 160" className="w-full h-[calc(100%-24px)]" preserveAspectRatio="none">
                  <defs>
                    <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#14b8a6" stopOpacity="0.3" />
                      <stop offset="100%" stopColor="#14b8a6" stopOpacity="0" />
                    </linearGradient>
                  </defs>
                  {/* Area fill */}
                  <polygon
                    points={`0,160 ${weeklyChartData.map((v, i) => `${(i / 6) * 300},${160 - (v / weeklyMax) * 150}`).join(' ')} 300,160`}
                    fill="url(#revGrad)"
                  />
                  {/* Line */}
                  <polyline
                    points={weeklyChartData.map((v, i) => `${(i / 6) * 300},${160 - (v / weeklyMax) * 150}`).join(' ')}
                    fill="none"
                    stroke="#14b8a6"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  {/* Dots */}
                  {weeklyChartData.map((v, i) => (
                    <circle
                      key={i}
                      cx={(i / 6) * 300}
                      cy={160 - (v / weeklyMax) * 150}
                      r="4"
                      fill="white"
                      stroke="#14b8a6"
                      strokeWidth="2.5"
                    />
                  ))}
                </svg>

                {/* Day labels */}
                <div className="flex justify-between mt-1">
                  {DAY_LABELS.map(d => (
                    <span key={d} className="text-[9px] font-bold text-gray-400 text-center flex-1">{d}</span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* ── Popular Order Times (Heatmap) ── */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-black text-gray-900">Popular Order Times</h3>
              <div className="flex items-center gap-1.5 text-[8px] font-bold text-gray-400 uppercase tracking-wider">
                <span className="w-2.5 h-2.5 rounded-sm bg-teal-100" /> Low
                <span className="w-2.5 h-2.5 rounded-sm bg-teal-500 ml-1" /> High
              </div>
            </div>

            <div className="overflow-x-auto">
              <div className="min-w-[280px]">
                {/* Day column headers */}
                <div className="flex mb-1 pl-10">
                  {DAY_LABELS.map(d => (
                    <div key={d} className="flex-1 text-center text-[8px] font-black text-gray-400 uppercase">{d}</div>
                  ))}
                </div>

                {/* Hour rows */}
                <div className="space-y-[3px]">
                  {HEAT_HOURS.filter((_, i) => i % 2 === 0).map(hour => (
                    <div key={hour} className="flex items-center gap-1">
                      <span className="w-9 text-right text-[8px] font-bold text-gray-400 flex-shrink-0">{formatHour(hour)}</span>
                      <div className="flex flex-1 gap-[3px]">
                        {DAY_LABELS.map((_, dow) => {
                          const count = heatmapGrid.grid[`${dow}_${hour}`] || 0;
                          const intensity = heatmapGrid.maxCount > 0 ? count / heatmapGrid.maxCount : 0;
                          return (
                            <div
                              key={dow}
                              className="flex-1 h-5 rounded-[4px] transition-all duration-300 hover:scale-110 cursor-default relative group/cell"
                              style={{
                                backgroundColor: intensity === 0
                                  ? '#f3f4f6'
                                  : `rgba(20, 184, 166, ${0.15 + intensity * 0.85})`,
                              }}
                              title={`${DAY_LABELS[dow]} ${formatHour(hour)}: ${count} orders`}
                            >
                              {count > 0 && (
                                <span className="absolute inset-0 flex items-center justify-center text-[7px] font-black text-white opacity-0 group-hover/cell:opacity-100 transition-opacity">
                                  {count}
                                </span>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* ── Top-Selling Menu Items ── */}
          <div>
            <h3 className="text-sm font-black text-gray-900 mb-4">Top-Selling Menu Items</h3>

            {topItems.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-gray-300">
                <Package size={32} className="mb-2" />
                <p className="text-xs font-bold">No sales data yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {topItems.map((item, i) => (
                  <div key={i} className="flex items-center gap-3 group hover:bg-orange-50/50 p-2 -mx-2 rounded-2xl transition-colors">
                    <div className="w-12 h-12 rounded-2xl overflow-hidden flex-shrink-0 bg-gray-100 shadow-sm ring-1 ring-black/5">
                      <img
                        src={item.image || "https://images.unsplash.com/photo-1546700854-955607ea004e?w=100&q=60"}
                        alt={item.name}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-black text-gray-900 truncate">{item.name}</p>
                      <p className="text-xs font-bold text-orange-500">₱{fmt(item.price)}</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-[10px] font-black text-gray-400">{item.order_count} sold</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════
          Recent Activity Feed
      ══════════════════════════════════════════════════════════════════ */}
      <div className="bg-white rounded-[28px] border border-gray-100 shadow-sm p-5 sm:p-6 md:p-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 md:mb-8">
          <div>
            <h2 className="text-2xl md:text-3xl font-extrabold text-gray-900 tracking-tight">Recent Activity</h2>
            <p className="text-sm text-gray-500 mt-1">Monitor your latest customer orders in real time.</p>
          </div>
          <span className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-gray-50 px-3 py-1.5 text-xs font-semibold text-gray-600">
            <Activity size={14} className="text-orange-500" />
            Live Feed
          </span>
        </div>

        {recentOrders.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 sm:py-20 bg-gray-50 rounded-3xl border border-gray-100">
            <div className="w-16 h-16 bg-orange-100 rounded-2xl flex items-center justify-center mb-4 shadow-sm">
              <Clock className="text-orange-500" size={28} />
            </div>
            <p className="text-gray-700 font-bold text-base">No recent activity detected</p>
            <p className="text-xs text-gray-400 font-medium mt-1">Awaiting incoming orders...</p>
          </div>
        ) : (
          <div className="relative">
            <div className="absolute left-[19px] top-2 bottom-2 w-px bg-gradient-to-b from-orange-100 via-orange-200 to-transparent hidden sm:block" />
            <div className="space-y-3 sm:space-y-4">
              {recentOrders.map((order, index) => {
                const mainItem = order.items?.[0]?.name || 'Menu item';
                const moreCount = (order.items?.length || 0) > 1 ? ` + ${order.items.length - 1}` : '';

                return (
                  <div
                    key={order.id}
                    className="group relative rounded-2xl border border-gray-100 bg-white p-4 sm:p-5 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md"
                    style={{ animation: `fadeSlideIn 0.6s cubic-bezier(0.2, 0.8, 0.2, 1) ${index * 80}ms both` }}
                  >
                    <div className="flex gap-3 sm:gap-4">
                      <div className="relative flex-shrink-0 pt-0.5">
                        <div className="h-10 w-10 rounded-xl border border-orange-100 bg-orange-50 text-orange-600 flex items-center justify-center shadow-sm transition-colors group-hover:bg-orange-100">
                          <ShoppingBag size={16} />
                        </div>
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-6">
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 min-w-0">
                              <h4 className="font-semibold text-gray-900 text-sm sm:text-base truncate">
                                {order.customer_name || 'Anonymous'}
                              </h4>
                              <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide border border-transparent ${statusColor(order.status)}`}>
                                {order.status}
                              </span>
                            </div>
                            <p className="mt-1 text-sm text-gray-600 truncate">
                              <span className="font-medium text-gray-800">{mainItem}</span>
                              <span className="text-gray-500">{moreCount}</span>
                            </p>
                            <div className="mt-2 flex items-center gap-2 text-xs text-gray-500">
                              <Eye size={13} className="text-gray-400" />
                              <span>{order.total_amount > 1000 ? 'Bulk Action' : 'Payment'}</span>
                            </div>
                          </div>

                          <div className="flex sm:block items-center justify-between sm:text-right flex-shrink-0 sm:min-w-[110px]">
                            <p className="font-bold text-gray-900 text-lg sm:text-xl tracking-tight">
                              ₱{fmt(order.total_amount)}
                            </p>
                            <p className="inline-flex sm:flex items-center gap-1 text-[11px] text-gray-500 font-medium mt-0.5 sm:justify-end">
                              <Clock size={12} className="text-gray-400" />
                              {new Date(order.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* CSS */}
      <style>{`
        @keyframes fadeSlideIn {
          from { opacity: 0; transform: translateY(20px) scale(0.98); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>
    </div>
  );
}

export default OwnerDashboard;
