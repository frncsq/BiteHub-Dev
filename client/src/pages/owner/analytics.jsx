import { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import {
  TrendingUp, TrendingDown, Calendar, Banknote, Activity,
  ShoppingBag, Users, ArrowUpRight, ArrowDownRight, BarChart3,
  PieChart, Award, RefreshCw, ChevronRight, Package, Clock,
  Zap, Target
} from 'lucide-react';

const BASE_URL = () => import.meta.env.VITE_API_URL || 'http://localhost:5000';

// ── Utility: format currency ─────────────────────────────────────────────────
const fmt = (n) => Number(n || 0).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const pctChange = (curr, prev) => {
  if (!prev || prev === 0) return curr > 0 ? 100 : 0;
  return ((curr - prev) / prev * 100);
};

// ── Status color map ─────────────────────────────────────────────────────────
const STATUS_COLORS = {
  delivered: { bg: 'bg-emerald-500', light: 'bg-emerald-50 text-emerald-700', ring: 'ring-emerald-500' },
  ready:     { bg: 'bg-blue-500',    light: 'bg-blue-50 text-blue-700',       ring: 'ring-blue-500' },
  preparing: { bg: 'bg-amber-500',   light: 'bg-amber-50 text-amber-700',     ring: 'ring-amber-500' },
  pending:   { bg: 'bg-orange-500',  light: 'bg-orange-50 text-orange-700',   ring: 'ring-orange-500' },
  cancelled: { bg: 'bg-red-500',     light: 'bg-red-50 text-red-700',         ring: 'ring-red-500' },
};

// ── Sparkline SVG (tiny line chart) ──────────────────────────────────────────
function Sparkline({ data, width = 80, height = 24, color = '#f97316' }) {
  if (!data || data.length < 2) return null;
  const max = Math.max(...data, 1);
  const min = Math.min(...data, 0);
  const range = max - min || 1;
  const points = data.map((v, i) => {
    const x = (i / (data.length - 1)) * width;
    const y = height - ((v - min) / range) * (height - 4) - 2;
    return `${x},${y}`;
  }).join(' ');

  return (
    <svg width={width} height={height} className="overflow-visible">
      <defs>
        <linearGradient id={`spark-${color.replace('#','')}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.3" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon
        points={`0,${height} ${points} ${width},${height}`}
        fill={`url(#spark-${color.replace('#','')})`}
      />
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// ── Donut Chart SVG ──────────────────────────────────────────────────────────
function DonutChart({ segments, size = 120 }) {
  const total = segments.reduce((sum, s) => sum + s.value, 0) || 1;
  const r = (size - 16) / 2;
  const circumference = 2 * Math.PI * r;
  let accum = 0;

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="drop-shadow-sm">
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#f3f4f6" strokeWidth="14" />
      {segments.map((seg, i) => {
        const pct = seg.value / total;
        const dashLen = pct * circumference;
        const offset = -accum * circumference + circumference * 0.25; // start at top
        accum += pct;
        return (
          <circle
            key={i}
            cx={size/2} cy={size/2} r={r}
            fill="none"
            stroke={seg.color}
            strokeWidth="14"
            strokeDasharray={`${dashLen} ${circumference - dashLen}`}
            strokeDashoffset={offset}
            strokeLinecap="round"
            className="transition-all duration-700"
            style={{ animationDelay: `${i * 100}ms` }}
          />
        );
      })}
      <text x={size/2} y={size/2 - 6} textAnchor="middle" className="fill-gray-900 text-2xl font-black">{total}</text>
      <text x={size/2} y={size/2 + 14} textAnchor="middle" className="fill-gray-400 text-[10px] font-bold uppercase tracking-widest">Orders</text>
    </svg>
  );
}

// ── KPI Card ─────────────────────────────────────────────────────────────────
function KpiCard({ icon: Icon, iconBg, label, value, subtitle, change, sparkData, sparkColor }) {
  const isPositive = change >= 0;
  return (
    <div className="relative group bg-white rounded-[20px] border border-gray-100 p-4 shadow-sm hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300 overflow-hidden">
      <div className="absolute -top-8 -right-8 w-28 h-28 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" style={{ background: sparkColor || '#f97316' }} />
      <div className="relative z-10">
        <div className="flex items-start justify-between mb-4">
          <div className={`p-3 rounded-2xl ${iconBg} shadow-inner`}>
            <Icon size={22} />
          </div>
          {change !== undefined && change !== null && (
            <div className={`flex items-center gap-1 text-xs font-black px-2.5 py-1 rounded-full ${isPositive ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
              {isPositive ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
              {Math.abs(change).toFixed(1)}%
            </div>
          )}
        </div>
        <p className="text-[9px] font-black text-gray-400 uppercase tracking-[2px] mb-1">{label}</p>
        <h3 className="text-xl font-black text-gray-900 tracking-tight">{value}</h3>
        {subtitle && <p className="text-xs font-medium text-gray-400 mt-1">{subtitle}</p>}
        {sparkData && sparkData.length > 1 && (
          <div className="mt-3 -mb-1">
            <Sparkline data={sparkData} color={sparkColor || '#f97316'} />
          </div>
        )}
      </div>
    </div>
  );
}

// ── Main Component ───────────────────────────────────────────────────────────
function OwnerAnalytics() {
  const [analytics, setAnalytics] = useState([]);
  const [periods, setPeriods] = useState({});
  const [statusBreakdown, setStatusBreakdown] = useState([]);
  const [topItems, setTopItems] = useState([]);
  const [customersThisMonth, setCustomersThisMonth] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeRange, setActiveRange] = useState('30d');

  const fetchAnalytics = async () => {
    try {
      setIsLoading(true);
      const response = await axios.get(`${BASE_URL()}/api/owner/analytics`, { withCredentials: true });
      if (response.data.success) {
        setAnalytics(response.data.analytics || []);
        setPeriods(response.data.periods || {});
        setStatusBreakdown(response.data.statusBreakdown || []);
        setTopItems(response.data.topItems || []);
        setCustomersThisMonth(response.data.customersThisMonth || 0);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load analytics');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchAnalytics(); }, []);

  // Derived metrics
  const totalRevenue = useMemo(() => analytics.reduce((s, d) => s + parseFloat(d.daily_revenue || 0), 0), [analytics]);
  const totalOrders = useMemo(() => analytics.reduce((s, d) => s + parseInt(d.daily_orders || 0), 0), [analytics]);
  const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
  const maxRevenue = useMemo(() => Math.max(...analytics.map(d => parseFloat(d.daily_revenue || 0)), 1), [analytics]);
  const revenueSparkData = useMemo(() => analytics.map(d => parseFloat(d.daily_revenue || 0)), [analytics]);
  const ordersSparkData  = useMemo(() => analytics.map(d => parseInt(d.daily_orders || 0)), [analytics]);
  const weeklyChange = pctChange(periods.thisWeek, periods.lastWeek);
  const monthlyChange = pctChange(periods.thisMonth, periods.lastMonth);

  const totalStatusOrders = useMemo(() => statusBreakdown.reduce((s, r) => s + parseInt(r.count || 0), 0), [statusBreakdown]);
  const donutSegments = useMemo(() => {
    const colorMap = { delivered: '#10b981', ready: '#3b82f6', preparing: '#f59e0b', pending: '#f97316', cancelled: '#ef4444' };
    return statusBreakdown.map(s => ({ value: parseInt(s.count || 0), color: colorMap[s.status] || '#94a3b8', label: s.status }));
  }, [statusBreakdown]);

  // Filtered analytics (for range toggle)
  const filteredAnalytics = useMemo(() => {
    if (activeRange === '7d') return analytics.slice(-7);
    if (activeRange === '14d') return analytics.slice(-14);
    return analytics;
  }, [analytics, activeRange]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
        <div className="relative">
          <div className="w-16 h-16 border-4 border-orange-100 rounded-full" />
          <div className="absolute inset-0 w-16 h-16 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
        </div>
        <p className="text-sm font-bold text-gray-400 animate-pulse">Loading analytics...</p>
      </div>
    );
  }

  return (
    <div className="space-y-5 max-w-7xl mx-auto pb-16">
      {/* ── Header ── */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-4xl font-black text-gray-900 tracking-tight flex items-center gap-3">
            <div className="p-2.5 bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl text-white shadow-lg shadow-orange-500/30">
              <BarChart3 size={18} />
            </div>
            Analytics
          </h1>
          <p className="text-gray-400 mt-1 font-medium text-[10px]">Restaurant performance metrics at a glance</p>
        </div>
        <div className="flex items-center gap-3">
          {/* Range Toggle */}
          <div className="flex bg-gray-100 rounded-xl p-0.5 gap-0.5">
            {[{ key: '7d', label: '7 Days' }, { key: '14d', label: '14 Days' }, { key: '30d', label: '30 Days' }].map(r => (
              <button
                key={r.key}
                onClick={() => setActiveRange(r.key)}
                className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wide transition-all ${
                  activeRange === r.key ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {r.label}
              </button>
            ))}
          </div>
          <button
            onClick={fetchAnalytics}
            className="p-2.5 rounded-2xl bg-gray-100 text-gray-500 hover:bg-gray-200 hover:text-gray-700 transition-all"
          >
            <RefreshCw size={18} />
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-100 text-red-600 rounded-2xl font-medium flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-red-500" />{error}
        </div>
      )}

      {/* ── KPI Cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
        <KpiCard
          icon={Banknote}
          iconBg="bg-emerald-50 text-emerald-600"
          label="Total Revenue"
          value={`₱${fmt(totalRevenue)}`}
          subtitle={`This week: ₱${fmt(periods.thisWeek)}`}
          change={weeklyChange}
          sparkData={revenueSparkData}
          sparkColor="#10b981"
        />
        <KpiCard
          icon={ShoppingBag}
          iconBg="bg-blue-50 text-blue-600"
          label="Total Orders"
          value={totalOrders.toLocaleString()}
          subtitle={`Avg ₱${fmt(avgOrderValue)} per order`}
          sparkData={ordersSparkData}
          sparkColor="#3b82f6"
        />
        <KpiCard
          icon={Users}
          iconBg="bg-purple-50 text-purple-600"
          label="Customers"
          value={customersThisMonth}
          subtitle="Unique this month"
          sparkColor="#8b5cf6"
        />
        <KpiCard
          icon={Target}
          iconBg="bg-orange-50 text-orange-600"
          label="Monthly Performance"
          value={`₱${fmt(periods.thisMonth)}`}
          subtitle={`Last month: ₱${fmt(periods.lastMonth)}`}
          change={monthlyChange}
          sparkColor="#f97316"
        />
      </div>

      {/* ── Charts Row ── */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

        {/* Revenue Chart (takes 2 cols) */}
        <div className="xl:col-span-2 bg-white rounded-[20px] border border-gray-100 shadow-sm p-5 md:p-6">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-xl font-black text-gray-900 tracking-tight flex items-center gap-2">
                <Activity size={18} className="text-orange-500" /> Revenue Trend
              </h2>
              <p className="text-xs text-gray-400 font-medium mt-0.5">Daily completed order revenue</p>
            </div>
            <div className="text-right">
              <p className="text-lg font-black text-gray-900">₱{fmt(totalRevenue)}</p>
              <p className="text-[8px] font-bold text-gray-400 uppercase tracking-widest">Period Total</p>
            </div>
          </div>

          {filteredAnalytics.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-gray-400">
              <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-3 border border-gray-100">
                <Activity size={28} className="text-gray-300" />
              </div>
              <p className="font-bold">No data yet</p>
              <p className="text-xs mt-1">Revenue data will appear after completed orders</p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {filteredAnalytics.map((day, index) => {
                const revenue = parseFloat(day.daily_revenue || 0);
                const percentage = Math.max((revenue / maxRevenue) * 100, 2);
                const dateObj = new Date(day.date);
                const isToday = new Date().toDateString() === dateObj.toDateString();

                return (
                  <div key={index} className="flex items-center gap-4 group">
                    <div className={`w-20 text-right flex-shrink-0 ${isToday ? 'font-black text-orange-600' : 'font-bold text-gray-400'}`}>
                      <p className="text-[11px] uppercase tracking-wider leading-tight">
                        {dateObj.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                      </p>
                      {isToday && <p className="text-[8px] font-black text-orange-400 uppercase tracking-widest">Today</p>}
                    </div>
                    <div className="flex-1 h-7 bg-gray-50 rounded-lg overflow-hidden relative border border-gray-100/60">
                      <div
                        className="h-full rounded-xl relative transition-all duration-700 ease-out"
                        style={{
                          width: `${percentage}%`,
                          background: isToday
                            ? 'linear-gradient(90deg, #f97316, #ea580c)'
                            : `linear-gradient(90deg, rgba(249,115,22,${0.3 + (percentage / 100) * 0.7}), rgba(234,88,12,${0.3 + (percentage / 100) * 0.7}))`,
                          animation: `barGrow 0.8s ease-out ${index * 40}ms both`,
                        }}
                      />
                      <span className={`absolute left-3 top-1/2 -translate-y-1/2 text-[11px] font-black z-10 transition-transform group-hover:scale-105 origin-left ${
                        percentage > 40 ? 'text-white drop-shadow-sm' : 'text-gray-600'
                      }`}>
                        ₱{fmt(revenue)}
                      </span>
                    </div>
                    <div className="w-16 flex-shrink-0 text-right">
                      <p className="text-xs font-black text-gray-600">{day.daily_orders}</p>
                      <p className="text-[9px] font-bold text-gray-300 uppercase">orders</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Order Status Donut + Top Items */}
        <div className="space-y-6">
          {/* Order Status Distribution */}
          <div className="bg-white rounded-[28px] border border-gray-100 shadow-sm p-6">
            <h2 className="text-sm font-black text-gray-900 tracking-tight flex items-center gap-2 mb-4">
              <PieChart size={12} className="text-blue-500" /> Order Status
            </h2>
            <div className="flex justify-center mb-6">
              {donutSegments.length > 0 ? (
                <DonutChart segments={donutSegments} />
              ) : (
                <div className="w-[160px] h-[160px] rounded-full bg-gray-50 border-2 border-dashed border-gray-200 flex items-center justify-center">
                  <p className="text-xs font-bold text-gray-300 text-center">No orders<br/>yet</p>
                </div>
              )}
            </div>
            <div className="grid grid-cols-2 gap-2">
              {statusBreakdown.map((s, i) => {
                const colors = STATUS_COLORS[s.status] || { light: 'bg-gray-50 text-gray-700' };
                const pct = totalStatusOrders > 0 ? ((parseInt(s.count) / totalStatusOrders) * 100).toFixed(1) : 0;
                return (
                  <div key={i} className={`flex items-center gap-2 px-3 py-2 rounded-xl ${colors.light} text-xs font-bold`}>
                    <span className="capitalize flex-1">{s.status}</span>
                    <span className="font-black">{s.count}</span>
                    <span className="opacity-50">({pct}%)</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Top Selling Items */}
          <div className="bg-white rounded-[28px] border border-gray-100 shadow-sm p-6">
            <h2 className="text-lg font-black text-gray-900 tracking-tight flex items-center gap-2 mb-5">
              <Award size={16} className="text-amber-500" /> Top Sellers
            </h2>
            {topItems.length === 0 ? (
              <div className="py-8 text-center">
                <Package size={28} className="text-gray-200 mx-auto mb-2" />
                <p className="text-xs font-bold text-gray-300">Sales data will appear here</p>
              </div>
            ) : (
              <div className="space-y-3">
                {topItems.map((item, i) => {
                  const maxItemRevenue = Math.max(...topItems.map(t => parseFloat(t.revenue || 0)), 1);
                  const barPct = (parseFloat(item.revenue || 0) / maxItemRevenue) * 100;
                  const medals = ['🥇', '🥈', '🥉'];
                  return (
                    <div key={i} className="group">
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <span className="text-sm">{medals[i] || `#${i+1}`}</span>
                          <p className="text-sm font-black text-gray-800 truncate">{item.name}</p>
                        </div>
                        <div className="text-right flex-shrink-0 ml-2">
                          <span className="text-xs font-black text-gray-900">₱{fmt(item.revenue)}</span>
                          <span className="text-[10px] font-bold text-gray-400 ml-1.5">({item.orders} sold)</span>
                        </div>
                      </div>
                      <div className="h-2 bg-gray-50 rounded-full overflow-hidden border border-gray-100/60">
                        <div
                          className="h-full rounded-full transition-all duration-700"
                          style={{
                            width: `${barPct}%`,
                            background: i === 0 ? 'linear-gradient(90deg, #f59e0b, #d97706)' :
                                       i === 1 ? 'linear-gradient(90deg, #94a3b8, #64748b)' :
                                       i === 2 ? 'linear-gradient(90deg, #d97706, #b45309)' :
                                       'linear-gradient(90deg, #cbd5e1, #94a3b8)',
                            animation: `barGrow 0.6s ease-out ${i * 100}ms both`,
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Period Comparison Cards ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="relative overflow-hidden bg-gradient-to-br from-orange-500 via-orange-600 to-red-600 rounded-[28px] p-8 text-white shadow-xl shadow-orange-500/20">
          <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full blur-3xl -mr-10 -mt-10" />
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-4">
              <Zap size={18} />
              <p className="text-sm font-black uppercase tracking-widest text-orange-100">Weekly Snapshot</p>
            </div>
            <div className="grid grid-cols-2 gap-6">
              <div>
                <p className="text-xs font-bold text-orange-200 mb-1">This Week</p>
                <p className="text-3xl font-black">₱{fmt(periods.thisWeek)}</p>
              </div>
              <div>
                <p className="text-xs font-bold text-orange-200 mb-1">Last Week</p>
                <p className="text-xl font-black text-orange-200">₱{fmt(periods.lastWeek)}</p>
              </div>
            </div>
            <div className="mt-5 flex items-center gap-2">
              <div className={`flex items-center gap-1 text-xs font-black px-3 py-1.5 rounded-full ${weeklyChange >= 0 ? 'bg-white/20' : 'bg-red-900/30'}`}>
                {weeklyChange >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                {Math.abs(weeklyChange).toFixed(1)}% {weeklyChange >= 0 ? 'growth' : 'decline'}
              </div>
            </div>
          </div>
        </div>

        <div className="relative overflow-hidden bg-gradient-to-br from-violet-500 via-purple-600 to-indigo-700 rounded-[28px] p-8 text-white shadow-xl shadow-purple-500/20">
          <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full blur-3xl -mr-10 -mt-10" />
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-4">
              <Calendar size={18} />
              <p className="text-sm font-black uppercase tracking-widest text-purple-100">Monthly Snapshot</p>
            </div>
            <div className="grid grid-cols-2 gap-6">
              <div>
                <p className="text-xs font-bold text-purple-200 mb-1">This Month</p>
                <p className="text-xl font-black">₱{fmt(periods.thisMonth)}</p>
              </div>
              <div>
                <p className="text-xs font-bold text-purple-200 mb-1">Last Month</p>
                <p className="text-3xl font-black text-purple-200">₱{fmt(periods.lastMonth)}</p>
              </div>
            </div>
            <div className="mt-5 flex items-center gap-2">
              <div className={`flex items-center gap-1 text-xs font-black px-3 py-1.5 rounded-full ${monthlyChange >= 0 ? 'bg-white/20' : 'bg-red-900/30'}`}>
                {monthlyChange >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                {Math.abs(monthlyChange).toFixed(1)}% {monthlyChange >= 0 ? 'growth' : 'decline'}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* CSS Animations */}
      <style>{`
        @keyframes barGrow {
          from { transform: scaleX(0); opacity: 0; }
          to   { transform: scaleX(1); opacity: 1; }
        }
      `}</style>
    </div>
  );
}

export default OwnerAnalytics;
