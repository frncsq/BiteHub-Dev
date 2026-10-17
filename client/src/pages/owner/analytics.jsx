import { useState, useEffect, useMemo } from 'react';
import { createApiClient } from '../../services/apiClient';
import {
  TrendingUp, TrendingDown, Calendar, Banknote, Activity,
  ShoppingBag, Users, ArrowUpRight, ArrowDownRight, BarChart3,
  PieChart, Award, RefreshCw, Package, Zap, Target
} from 'lucide-react';

const fmt = (n) => Number(n || 0).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const pctChange = (curr, prev) => {
  if (!prev || prev === 0) return curr > 0 ? 100 : 0;
  return ((curr - prev) / prev * 100);
};

const STATUS_COLORS = {
  delivered: '#16A34A', ready: '#3B82F6', preparing: '#D97706',
  pending: '#EA580C', cancelled: '#DC2626',
};

/* ── Sparkline ──────────────────────────────────────────────────────────────── */
function Sparkline({ data, width = 72, height = 28, color = '#EA580C' }) {
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
        <linearGradient id={`sp-${color.replace('#','')}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.15" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon points={`0,${height} ${points} ${width},${height}`} fill={`url(#sp-${color.replace('#','')})`} />
      <polyline points={points} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/* ── Donut Chart ────────────────────────────────────────────────────────────── */
function DonutChart({ segments, size = 110 }) {
  const total = segments.reduce((sum, s) => sum + s.value, 0) || 1;
  const r = (size - 12) / 2;
  const circumference = 2 * Math.PI * r;
  const arcs = segments.map((seg, i) => {
    const before = segments.slice(0, i).reduce((sum, s) => sum + s.value, 0);
    return {
      color: seg.color,
      dashLen: (seg.value / total) * circumference,
      offset: -(before / total) * circumference + circumference * 0.25,
    };
  });
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#F3F4F6" strokeWidth="10" />
      {arcs.map((arc, i) => (
        <circle key={i} cx={size/2} cy={size/2} r={r} fill="none" stroke={arc.color}
          strokeWidth="10" strokeDasharray={`${arc.dashLen} ${circumference - arc.dashLen}`}
          strokeDashoffset={arc.offset} strokeLinecap="round"
          className="transition-all duration-700" />
      ))}
      <text x={size/2} y={size/2 - 4} textAnchor="middle" className="fill-[#171717] font-semibold" style={{ fontSize: '18px' }}>{total}</text>
      <text x={size/2} y={size/2 + 12} textAnchor="middle" className="fill-[#6B7280]" style={{ fontSize: '9px', fontWeight: 600, letterSpacing: '1px', textTransform: 'uppercase' }}>orders</text>
    </svg>
  );
}

/* ── KPI Card ───────────────────────────────────────────────────────────────── */
function KpiCard({ icon: Icon, label, value, subtitle, change, sparkData, sparkColor, accentColor }) {
  const isPositive = change >= 0;
  return (
    <div className="min-w-0 bg-white rounded-xl border border-[#E5E7EB] p-4 sm:p-5 transition-all duration-200">
      <div className="flex items-center justify-between mb-3">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: `${accentColor}12` }}>
          <Icon size={17} style={{ color: accentColor }} />
        </div>
        {change !== undefined && change !== null && (
          <div className={`flex items-center gap-0.5 text-[11px] font-semibold shrink-0 ${isPositive ? 'text-[#16A34A]' : 'text-[#DC2626]'}`}>
            {isPositive ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
            {Math.abs(change).toFixed(1)}%
          </div>
        )}
      </div>
      <p className="text-[11px] font-medium text-[#6B7280] uppercase tracking-wide mb-0.5 truncate">{label}</p>
      <h3 className="text-lg sm:text-xl font-bold text-[#171717] break-words leading-tight">{value}</h3>
      {subtitle && <p className="text-xs text-[#6B7280] mt-1 break-words">{subtitle}</p>}
      {sparkData && sparkData.length > 1 && (
        <div className="mt-3"><Sparkline data={sparkData} color={sparkColor || '#EA580C'} /></div>
      )}
    </div>
  );
}

/* ── Main ───────────────────────────────────────────────────────────────────── */
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
      const apiClient = createApiClient();
      const response = await apiClient.get('/owner/analytics');
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
    return statusBreakdown.map(s => ({ value: parseInt(s.count || 0), color: STATUS_COLORS[s.status] || '#94a3b8', label: s.status }));
  }, [statusBreakdown]);

  const filteredAnalytics = useMemo(() => {
    if (activeRange === '7d') return analytics.slice(-7);
    if (activeRange === '14d') return analytics.slice(-14);
    return analytics;
  }, [analytics, activeRange]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] gap-3">
        <div className="w-10 h-10 border-2 border-gray-200 border-t-[#EA580C] rounded-full animate-spin" />
        <p className="text-sm text-[#6B7280]">Loading analytics…</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <h1 className="text-2xl font-bold text-[#171717] flex items-center gap-2.5">
            <div className="w-8 h-8 bg-[#EA580C] rounded-xl flex items-center justify-center text-white">
              <BarChart3 size={15} />
            </div>
            Analytics
          </h1>
          <p className="text-sm text-[#6B7280] mt-0.5">Performance overview</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex bg-[#FAFAFA] border border-[#E5E7EB] rounded-lg p-0.5">
            {[{ key: '7d', label: '7D' }, { key: '14d', label: '14D' }, { key: '30d', label: '30D' }].map(r => (
              <button key={r.key} onClick={() => setActiveRange(r.key)}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                  activeRange === r.key ? 'bg-white text-[#171717] shadow-sm' : 'text-[#6B7280] hover:text-[#171717]'
                }`}>
                {r.label}
              </button>
            ))}
          </div>
          <button onClick={fetchAnalytics} className="p-2 rounded-lg text-[#6B7280] hover:bg-[#FAFAFA] hover:text-[#171717] transition-colors">
            <RefreshCw size={16} />
          </button>
        </div>
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-100 text-[#DC2626] rounded-xl text-sm flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-[#DC2626]" />{error}
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 min-[480px]:grid-cols-2 lg:grid-cols-4 gap-3">
        <KpiCard icon={Banknote} accentColor="#16A34A" label="Revenue" value={`₱${fmt(totalRevenue)}`}
          subtitle={`This week: ₱${fmt(periods.thisWeek)}`} change={weeklyChange}
          sparkData={revenueSparkData} sparkColor="#16A34A" />
        <KpiCard icon={ShoppingBag} accentColor="#3B82F6" label="Orders" value={totalOrders.toLocaleString()}
          subtitle={`Avg ₱${fmt(avgOrderValue)}/order`} sparkData={ordersSparkData} sparkColor="#3B82F6" />
        <KpiCard icon={Users} accentColor="#8B5CF6" label="Customers" value={customersThisMonth}
          subtitle="Unique this month" sparkColor="#8B5CF6" />
        <KpiCard icon={Target} accentColor="#EA580C" label="Monthly" value={`₱${fmt(periods.thisMonth)}`}
          subtitle={`Last: ₱${fmt(periods.lastMonth)}`} change={monthlyChange} sparkColor="#EA580C" />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Revenue Chart */}
        <div className="lg:col-span-2 min-w-0 bg-white rounded-xl border border-[#E5E7EB] p-4 sm:p-5">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-base font-semibold text-[#171717] flex items-center gap-2">
                <Activity size={15} className="text-[#EA580C]" /> Revenue Trend
              </h2>
              <p className="text-xs text-[#6B7280] mt-0.5">Daily completed order revenue</p>
            </div>
            <div className="text-right">
              <p className="text-lg font-bold text-[#171717]">₱{fmt(totalRevenue)}</p>
              <p className="text-[10px] text-[#6B7280] uppercase tracking-wider">Period total</p>
            </div>
          </div>

          {filteredAnalytics.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-[#6B7280]">
              <Activity size={24} className="text-gray-300 mb-2" />
              <p className="text-sm font-medium">No data yet</p>
              <p className="text-xs mt-0.5">Revenue data appears after completed orders</p>
            </div>
          ) : (
            <div className="space-y-1.5">
              {filteredAnalytics.map((day, index) => {
                const revenue = parseFloat(day.daily_revenue || 0);
                const percentage = Math.max((revenue / maxRevenue) * 100, 2);
                const dateObj = new Date(day.date);
                const isToday = new Date().toDateString() === dateObj.toDateString();
                return (
                  <div key={index} className="flex items-center gap-2 sm:gap-3 group">
                    <div className={`w-14 sm:w-16 text-right flex-shrink-0 ${isToday ? 'text-[#EA580C] font-semibold' : 'text-[#6B7280]'}`}>
                      <p className="text-[11px] leading-tight">
                        {dateObj.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                      </p>
                      {isToday && <p className="text-[8px] font-bold text-[#EA580C] uppercase">Today</p>}
                    </div>
                    <div className="flex-1 min-w-0 h-6 bg-[#FAFAFA] rounded-md overflow-hidden relative border border-[#E5E7EB]">
                      <div className="h-full rounded-md transition-all duration-700 ease-out"
                        style={{
                          width: `${percentage}%`,
                          background: isToday
                            ? '#EA580C'
                            : `rgba(234, 88, 12, ${0.15 + (percentage / 100) * 0.55})`,
                          animation: `barGrow 0.6s ease-out ${index * 30}ms both`,
                        }} />
                      <span className={`absolute left-2.5 top-1/2 -translate-y-1/2 text-[10px] font-semibold z-10 ${
                        percentage > 40 ? 'text-white' : 'text-gray-500'
                      }`}>₱{fmt(revenue)}</span>
                    </div>
                    <div className="w-10 sm:w-12 flex-shrink-0 text-right">
                      <p className="text-[11px] font-semibold text-[#6B7280]">{day.daily_orders}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Sidebar: Status + Top Items */}
        <div className="min-w-0 space-y-4">
          {/* Order Status */}
          <div className="bg-white rounded-xl border border-[#E5E7EB] p-4 sm:p-5">
            <h2 className="text-sm font-semibold text-[#171717] flex items-center gap-2 mb-4">
              <PieChart size={14} className="text-[#3B82F6]" /> Order Status
            </h2>
            <div className="flex justify-center mb-4">
              {donutSegments.length > 0 ? (
                <DonutChart segments={donutSegments} />
              ) : (
                <div className="w-28 h-28 rounded-full bg-[#FAFAFA] border border-dashed border-[#E5E7EB] flex items-center justify-center">
                  <p className="text-[10px] text-gray-300 text-center font-medium">No orders<br/>yet</p>
                </div>
              )}
            </div>
            <div className="space-y-1.5">
              {statusBreakdown.map((s, i) => {
                const pct = totalStatusOrders > 0 ? ((parseInt(s.count) / totalStatusOrders) * 100).toFixed(0) : 0;
                const color = STATUS_COLORS[s.status] || '#94a3b8';
                return (
                  <div key={i} className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-[#FAFAFA] transition-colors text-xs">
                    <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
                    <span className="capitalize text-gray-600 flex-1">{s.status}</span>
                    <span className="font-semibold text-[#171717]">{s.count}</span>
                    <span className="text-[#6B7280] w-8 text-right">{pct}%</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Top Sellers */}
          <div className="bg-white rounded-xl border border-[#E5E7EB] p-4 sm:p-5">
            <h2 className="text-sm font-semibold text-[#171717] flex items-center gap-2 mb-4">
              <Award size={14} className="text-[#D97706]" /> Top Sellers
            </h2>
            {topItems.length === 0 ? (
              <div className="py-6 text-center">
                <Package size={22} className="text-gray-200 mx-auto mb-1.5" />
                <p className="text-xs text-gray-300">Sales data will appear here</p>
              </div>
            ) : (
              <div className="space-y-3">
                {topItems.map((item, i) => {
                  const maxItemRevenue = Math.max(...topItems.map(t => parseFloat(t.revenue || 0)), 1);
                  const barPct = (parseFloat(item.revenue || 0) / maxItemRevenue) * 100;
                  return (
                    <div key={i}>
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2 min-w-0 flex-1">
                          <span className="text-xs font-semibold text-gray-300 w-4">{i + 1}</span>
                          <p className="text-xs font-medium text-gray-700 truncate">{item.name}</p>
                        </div>
                        <div className="flex items-center gap-1.5 flex-shrink-0 ml-2">
                          <span className="text-xs font-semibold text-[#171717]">₱{fmt(item.revenue)}</span>
                          <span className="text-[10px] text-[#6B7280]">· {item.orders}</span>
                        </div>
                      </div>
                      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full rounded-full transition-all duration-700"
                          style={{
                            width: `${barPct}%`,
                            backgroundColor: i === 0 ? '#D97706' : i === 1 ? '#94a3b8' : '#d4d4d8',
                            animation: `barGrow 0.5s ease-out ${i * 80}ms both`,
                          }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Period Comparison */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-[#EA580C] rounded-xl p-6 text-white">
          <div className="flex items-center gap-2 mb-4">
            <Zap size={14} />
            <p className="text-xs font-semibold uppercase tracking-wider text-orange-200">Weekly</p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-[10px] text-orange-200 mb-0.5">This Week</p>
              <p className="text-2xl font-bold">₱{fmt(periods.thisWeek)}</p>
            </div>
            <div>
              <p className="text-[10px] text-orange-200 mb-0.5">Last Week</p>
              <p className="text-lg font-semibold text-orange-200">₱{fmt(periods.lastWeek)}</p>
            </div>
          </div>
          <div className="mt-4">
            <span className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-full ${weeklyChange >= 0 ? 'bg-white/15' : 'bg-[#DC2626]/25'}`}>
              {weeklyChange >= 0 ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
              {Math.abs(weeklyChange).toFixed(1)}% {weeklyChange >= 0 ? 'growth' : 'decline'}
            </span>
          </div>
        </div>

        <div className="bg-[#111111] rounded-xl p-6 text-white">
          <div className="flex items-center gap-2 mb-4">
            <Calendar size={14} />
            <p className="text-xs font-semibold uppercase tracking-wider text-[#A0A0A0]">Monthly</p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-[10px] text-[#A0A0A0] mb-0.5">This Month</p>
              <p className="text-2xl font-bold">₱{fmt(periods.thisMonth)}</p>
            </div>
            <div>
              <p className="text-[10px] text-[#A0A0A0] mb-0.5">Last Month</p>
              <p className="text-lg font-semibold text-[#A0A0A0]">₱{fmt(periods.lastMonth)}</p>
            </div>
          </div>
          <div className="mt-4">
            <span className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-full ${monthlyChange >= 0 ? 'bg-white/15' : 'bg-[#DC2626]/25'}`}>
              {monthlyChange >= 0 ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
              {Math.abs(monthlyChange).toFixed(1)}% {monthlyChange >= 0 ? 'growth' : 'decline'}
            </span>
          </div>
        </div>
      </div>

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
