import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { createApiClient } from '../../services/apiClient';
import { useOwnerTheme } from '../../context/OwnerThemeContext';
import {
  DollarSign, ShoppingBag, Clock, TrendingUp, List,
  Activity, ChevronRight, Eye, Search, Download,
  Package, BarChart3, Users, ChevronDown, Filter, Banknote
} from 'lucide-react';

function OwnerDashboard() {
  const { isDarkMode } = useOwnerTheme();
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
      delivered: 'bg-emerald-100 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-400',
      ready: 'bg-blue-100 dark:bg-blue-500/15 text-blue-700 dark:text-blue-400',
      preparing: 'bg-cyan-100 text-cyan-700',
      pending: 'bg-orange-100 dark:bg-orange-500/15 text-orange-700 dark:text-orange-400',
      cancelled: 'bg-red-100 dark:bg-red-500/15 text-red-700 dark:text-red-400',
    };
    return map[status] || 'bg-gray-100 dark:bg-[#222222] text-gray-700 dark:text-[#E5E5E5]';
  };

  if (isLoading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="w-14 h-14 border-4 border-orange-100 dark:border-orange-500/25 rounded-full" />
            <div className="absolute inset-0 w-14 h-14 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
          </div>
          <p className="text-sm font-medium text-[#6B7280] dark:text-[#A0A0A0] animate-pulse">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 md:space-y-8 pb-12 max-w-[1400px] mx-auto">

      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 md:gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-extrabold text-[#171717] dark:text-[#F5F5F5] tracking-tight">Dashboard Overview</h1>
          <p className="text-[#6B7280] dark:text-[#A0A0A0] mt-1 text-sm md:text-base">Welcome back! Here's what's happening today.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative hidden md:block">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#6B7280] dark:text-[#A0A0A0]" />
            <input
              type="text"
              placeholder="dishes, restaurants..."
              className="pl-10 pr-5 py-2 rounded-xl border border-[#E5E7EB] dark:border-[#2A2A2A] bg-white dark:bg-[#1A1A1A] text-sm font-medium focus:outline-none focus:border-[#EA580C] focus:ring-4 focus:ring-orange-50 w-52 transition-all"
            />
          </div>
          <button className="px-4 py-2.5 bg-[#EA580C] text-white font-semibold rounded-xl hover:bg-[#DC2626] transition-all duration-200 flex items-center gap-2 text-sm">
            <Download size={16} /> Download Report
          </button>
        </div>
      </div>

      {error && <div className="p-4 bg-red-50 dark:bg-red-500/10 border border-red-100 dark:border-red-500/25 text-red-600 dark:text-red-400 rounded-xl font-medium">{error}</div>}

      {/* 4 KPI Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">

        {/* 1 · Total Revenue */}
        <div className="p-4 sm:p-5 rounded-xl bg-[#EA580C] text-white">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-orange-200 text-[10px] font-black uppercase tracking-[2px] mb-2">Total Revenue</p>
              <h3 className="text-2xl sm:text-3xl font-black tracking-tight leading-none">₱{fmt(metrics.revenue)}</h3>
            </div>
            <div className="p-2.5 bg-white/15 rounded-xl">
              <Banknote size={20} className="text-white" />
            </div>
          </div>
          <div className="mt-4">
            <span className="inline-flex items-center gap-1.5 text-xs font-bold bg-white/15 px-3 py-1.5 rounded-full">
              <TrendingUp size={12} /> Peak Performance
            </span>
          </div>
        </div>

        {/* 2 · Total Orders */}
        <div className="p-4 sm:p-5 rounded-xl bg-white dark:bg-[#1A1A1A] border border-[#E5E7EB] dark:border-[#2A2A2A]">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-[#6B7280] dark:text-[#A0A0A0] text-[10px] font-black uppercase tracking-[2px] mb-2">Total Orders</p>
              <h3 className="text-2xl sm:text-3xl font-black text-[#171717] dark:text-[#F5F5F5] tracking-tight leading-none">{metrics.totalOrders}</h3>
            </div>
            <div className="flex items-end gap-1.5 h-12">
              <div className="flex flex-col items-center gap-0.5">
                <div
                  className="w-5 rounded-t-md bg-[#16A34A] transition-all duration-500"
                  style={{ height: `${Math.max((metrics.todayOrders / Math.max(metrics.todayOrders, metrics.yesterdayOrders, 1)) * 40, 4)}px` }}
                />
                <span className="text-[7px] font-black text-[#6B7280] dark:text-[#A0A0A0] uppercase">Today</span>
              </div>
              <div className="flex flex-col items-center gap-0.5">
                <div
                  className="w-5 rounded-t-md bg-gray-200 transition-all duration-500"
                  style={{ height: `${Math.max((metrics.yesterdayOrders / Math.max(metrics.todayOrders, metrics.yesterdayOrders, 1)) * 40, 4)}px` }}
                />
                <span className="text-[7px] font-black text-[#6B7280] dark:text-[#A0A0A0] uppercase">Yest.</span>
              </div>
            </div>
          </div>
          <div className="mt-4 flex items-center gap-2 text-xs font-medium text-[#6B7280] dark:text-[#A0A0A0]">
            <span className="w-2 h-2 rounded-full bg-[#EA580C]" />
            Since Launch &middot; {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </div>
        </div>

        {/* 3 · Menu Items */}
        <div className="p-4 sm:p-5 rounded-xl bg-white dark:bg-[#1A1A1A] border border-[#E5E7EB] dark:border-[#2A2A2A]">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-[#6B7280] dark:text-[#A0A0A0] text-[10px] font-black uppercase tracking-[2px] mb-2">Menu Items</p>
              <h3 className="text-2xl sm:text-3xl font-black text-[#171717] dark:text-[#F5F5F5] tracking-tight leading-none">{metrics.menuItems}</h3>
            </div>
            <div className="relative">
              <svg width="46" height="46" viewBox="0 0 52 52">
                  <circle cx="26" cy="26" r="20" fill="none" strokeWidth="5" className="stroke-[#F3F4F6] dark:stroke-[#2A2A2A]" />
                <circle cx="26" cy="26" r="20" fill="none" stroke="#EA580C" strokeWidth="5"
                  strokeDasharray={`${Math.min(metrics.menuItems / 20, 1) * 125.6} 125.6`}
                  strokeLinecap="round"
                  transform="rotate(-90 26 26)"
                  className="transition-all duration-700"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <List size={16} className="text-[#EA580C]" />
              </div>
            </div>
          </div>
          <div className="mt-4 flex items-center gap-2 text-xs font-medium text-[#6B7280] dark:text-[#A0A0A0]">
            <span className="w-2 h-2 rounded-full bg-[#EA580C]" /> Active Database
          </div>
        </div>

        {/* 4 · Live Orders */}
        <div className="p-4 sm:p-5 rounded-xl bg-[#111111] text-white">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-[#A0A0A0] text-[10px] font-black uppercase tracking-[2px] mb-2">Live Orders</p>
              <h3 className="text-2xl sm:text-3xl font-black tracking-tight leading-none">{metrics.activeOrders}</h3>
            </div>
            <div className="relative">
              <div className="p-2.5 bg-white/10 rounded-xl">
                <Clock size={20} className="text-white" />
              </div>
              {metrics.activeOrders > 0 && (
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-[#DC2626] rounded-full animate-ping" />
              )}
            </div>
          </div>
          <div className="mt-4">
            <span className={`inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full ${metrics.activeOrders > 0 ? 'bg-[#DC2626]/20 text-red-300 animate-pulse' : 'bg-white/10 text-[#A0A0A0]'
              }`}>
              <span className="w-1.5 h-1.5 rounded-full bg-current" />
              {metrics.activeOrders > 0 ? 'Requires Attention' : 'All Clear'}
            </span>
          </div>
        </div>
      </div>

      {/* KPIs Section */}
      <div className="bg-white dark:bg-[#1A1A1A] rounded-xl border border-[#E5E7EB] dark:border-[#2A2A2A] p-6 md:p-8">
        <h2 className="text-2xl font-extrabold text-[#171717] dark:text-[#F5F5F5] tracking-tight mb-1">Key Performance Indicators (KPIs)</h2>
                  <div className="h-px bg-[#E5E7EB] dark:bg-[#2A2A2A] my-5" />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">

          {/* ── Weekly Revenue Trend ── */}
          <div className="min-w-0">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-black text-[#171717] dark:text-[#F5F5F5]">Weekly Revenue Trend</h3>
              <span className="text-[10px] font-bold text-[#6B7280] dark:text-[#A0A0A0] uppercase tracking-wider">Past week</span>
            </div>

            <div className="relative h-48">
              <div className="absolute left-0 top-0 bottom-6 w-14 sm:w-16 flex flex-col justify-between text-[9px] font-bold text-[#6B7280] dark:text-[#A0A0A0] text-right pr-2">
                <span>₱{fmt(weeklyMax)}</span>
                <span>₱{fmt(weeklyMax * 0.75)}</span>
                <span>₱{fmt(weeklyMax * 0.5)}</span>
                <span>₱{fmt(weeklyMax * 0.25)}</span>
                <span>0</span>
              </div>

              <div className="ml-14 sm:ml-16 h-full relative">
                {[0, 25, 50, 75, 100].map(pct => (
                  <div key={pct} className="absolute w-full border-t border-dashed border-[#E5E7EB] dark:border-[#2A2A2A]" style={{ bottom: `${pct}%` }} />
                ))}

                <svg viewBox="0 0 300 160" className="w-full h-[calc(100%-24px)]" preserveAspectRatio="none">
                  <defs>
                    <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#EA580C" stopOpacity="0.2" />
                      <stop offset="100%" stopColor="#EA580C" stopOpacity="0" />
                    </linearGradient>
                  </defs>
                  <polygon
                    points={`0,160 ${weeklyChartData.map((v, i) => `${(i / 6) * 300},${160 - (v / weeklyMax) * 150}`).join(' ')} 300,160`}
                    fill="url(#revGrad)"
                  />
                  <polyline
                    points={weeklyChartData.map((v, i) => `${(i / 6) * 300},${160 - (v / weeklyMax) * 150}`).join(' ')}
                    fill="none"
                    stroke="#EA580C"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  {weeklyChartData.map((v, i) => (
                    <circle
                      key={i}
                      cx={(i / 6) * 300}
                      cy={160 - (v / weeklyMax) * 150}
                      r="4"
                      fill="white"
                      stroke="#EA580C"
                      strokeWidth="2.5"
                    />
                  ))}
                </svg>

                <div className="flex justify-between mt-1">
                  {DAY_LABELS.map(d => (
                    <span key={d} className="text-[9px] font-bold text-[#6B7280] dark:text-[#A0A0A0] text-center flex-1">{d}</span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* ── Popular Order Times (Heatmap) ── */}
          <div className="min-w-0">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-black text-[#171717] dark:text-[#F5F5F5]">Popular Order Times</h3>
              <div className="flex items-center gap-1.5 text-[8px] font-bold text-[#6B7280] dark:text-[#A0A0A0] uppercase tracking-wider">
                <span className="w-2.5 h-2.5 rounded-sm bg-orange-100 dark:bg-orange-500/15" /> Low
                <span className="w-2.5 h-2.5 rounded-sm bg-[#EA580C] ml-1" /> High
              </div>
            </div>

            <div className="overflow-x-auto">
              <div className="min-w-[280px]">
                <div className="flex mb-1 pl-10">
                  {DAY_LABELS.map(d => (
                    <div key={d} className="flex-1 text-center text-[8px] font-black text-[#6B7280] dark:text-[#A0A0A0] uppercase">{d}</div>
                  ))}
                </div>

                <div className="space-y-[3px]">
                  {HEAT_HOURS.filter((_, i) => i % 2 === 0).map(hour => (
                    <div key={hour} className="flex items-center gap-1">
                      <span className="w-9 text-right text-[8px] font-bold text-[#6B7280] dark:text-[#A0A0A0] flex-shrink-0">{formatHour(hour)}</span>
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
                                  ? (isDarkMode ? '#2A2A2A' : '#F3F4F6')
                                  : `rgba(234, 88, 12, ${0.15 + intensity * 0.85})`,
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
          <div className="min-w-0">
            <h3 className="text-sm font-black text-[#171717] dark:text-[#F5F5F5] mb-4">Top-Selling Menu Items</h3>

            {topItems.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-gray-300 dark:text-[#555555]">
                <Package size={32} className="mb-2" />
                <p className="text-xs font-bold">No sales data yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {topItems.map((item, i) => (
                  <div key={i} className="flex items-center gap-3 group hover:bg-orange-50/50 p-2 -mx-2 rounded-xl transition-colors">
                    <div className="w-12 h-12 rounded-xl overflow-hidden flex-shrink-0 bg-gray-100 dark:bg-[#222222] border border-[#E5E7EB] dark:border-[#2A2A2A]">
                      <img
                        src={item.image || "https://images.unsplash.com/photo-1546700854-955607ea004e?w=100&q=60"}
                        alt={item.name}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-black text-[#171717] dark:text-[#F5F5F5] truncate">{item.name}</p>
                      <p className="text-xs font-bold text-[#EA580C]">₱{fmt(item.price)}</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-[10px] font-black text-[#6B7280] dark:text-[#A0A0A0]">{item.order_count} sold</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Recent Activity Feed */}
      <div className="bg-white dark:bg-[#1A1A1A] rounded-xl border border-[#E5E7EB] dark:border-[#2A2A2A] p-5 sm:p-6 md:p-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 md:mb-8">
          <div>
            <h2 className="text-2xl md:text-3xl font-extrabold text-[#171717] dark:text-[#F5F5F5] tracking-tight">Recent Activity</h2>
            <p className="text-sm text-[#6B7280] dark:text-[#A0A0A0] mt-1">Monitor your latest customer orders in real time.</p>
          </div>
          <span className="inline-flex items-center gap-2 rounded-full border border-[#E5E7EB] dark:border-[#2A2A2A] bg-gray-50 dark:bg-[#222222] px-3 py-1.5 text-xs font-semibold text-[#6B7280] dark:text-[#A0A0A0]">
            <Activity size={14} className="text-[#EA580C]" />
            Live Feed
          </span>
        </div>

        {recentOrders.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 sm:py-20 bg-[#FAFAFA] dark:bg-[#111111] rounded-xl border border-[#E5E7EB] dark:border-[#2A2A2A]">
            <div className="w-16 h-16 bg-orange-100 dark:bg-orange-500/15 rounded-xl flex items-center justify-center mb-4">
              <Clock className="text-[#EA580C]" size={28} />
            </div>
            <p className="text-[#171717] dark:text-[#F5F5F5] font-bold text-base">No recent activity detected</p>
            <p className="text-xs text-[#6B7280] dark:text-[#A0A0A0] font-medium mt-1">Awaiting incoming orders...</p>
          </div>
        ) : (
          <div className="relative">
            <div className="absolute left-[19px] top-2 bottom-2 w-px bg-orange-200 hidden sm:block" />
            <div className="space-y-3 sm:space-y-4">
              {recentOrders.map((order, index) => {
                const mainItem = order.items?.[0]?.name || 'Menu item';
                const moreCount = (order.items?.length || 0) > 1 ? ` + ${order.items.length - 1}` : '';

                return (
                  <div
                    key={order.id}
                    className="group relative rounded-xl border border-[#E5E7EB] dark:border-[#2A2A2A] bg-white dark:bg-[#1A1A1A] p-4 sm:p-5 transition-all duration-200 hover:border-[#EA580C]/30"
                    style={{ animation: `fadeSlideIn 0.6s cubic-bezier(0.2, 0.8, 0.2, 1) ${index * 80}ms both` }}
                  >
                    <div className="flex gap-3 sm:gap-4">
                      <div className="relative flex-shrink-0 pt-0.5">
                        <div className="h-10 w-10 rounded-xl border border-orange-100 dark:border-orange-500/25 bg-orange-50 dark:bg-orange-500/10 text-[#EA580C] flex items-center justify-center transition-colors group-hover:bg-orange-100">
                          <ShoppingBag size={16} />
                        </div>
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-6">
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 min-w-0">
                              <h4 className="font-semibold text-[#171717] dark:text-[#F5F5F5] text-sm sm:text-base truncate">
                                {order.customer_name || 'Anonymous'}
                              </h4>
                              <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide border border-transparent ${statusColor(order.status)}`}>
                                {order.status}
                              </span>
                            </div>
                            <p className="mt-1 text-sm text-gray-600 dark:text-[#A0A0A0] truncate">
                              <span className="font-medium text-gray-800">{mainItem}</span>
                              <span className="text-[#6B7280] dark:text-[#A0A0A0]">{moreCount}</span>
                            </p>
                            <div className="mt-2 flex items-center gap-2 text-xs text-[#6B7280] dark:text-[#A0A0A0]">
                              <Eye size={13} className="text-gray-400 dark:text-[#6B7280]" />
                              <span>{order.total_amount > 1000 ? 'Bulk Action' : 'Payment'}</span>
                            </div>
                          </div>

                          <div className="flex sm:block items-center justify-between sm:text-right flex-shrink-0 sm:min-w-[110px]">
                            <p className="font-bold text-[#171717] dark:text-[#F5F5F5] text-lg sm:text-xl tracking-tight">
                              ₱{fmt(order.total_amount)}
                            </p>
                            <p className="inline-flex sm:flex items-center gap-1 text-[11px] text-[#6B7280] dark:text-[#A0A0A0] font-medium mt-0.5 sm:justify-end">
                              <Clock size={12} className="text-gray-400 dark:text-[#6B7280]" />
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
