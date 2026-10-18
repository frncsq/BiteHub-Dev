import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { getApiBaseUrl, invalidateApiCache } from '../../services/apiClient';
import { Search, MapPin, Store, CheckCircle, XCircle, Clock, RefreshCw, AlertTriangle, Power, TrendingUp, DollarSign, ClipboardList, BarChart3, List, Eye, X } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip as RechartsTooltip, ResponsiveContainer,
} from 'recharts';

const STATUS_TABS = [
  { key: 'pending',  label: 'Pending Review' },
  { key: 'approved', label: 'Approved' },
  { key: 'rejected', label: 'Rejected' },
  { key: 'all',      label: 'All Vendors' },
];

const statusStyle = {
  pending:  'bg-[#FEF3C7] text-[#D97706] border border-[#FDE68A]',
  approved: 'bg-[#DCFCE7] text-[#16A34A] border border-[#BBF7D0]',
  rejected: 'bg-[#FEE2E2] text-[#DC2626] border border-[#FECACA]',
};

const statusIcon = {
  pending:  <Clock size={12} />,
  approved: <CheckCircle size={12} />,
  rejected: <XCircle size={12} />,
};

function AdminRestaurants() {
  const [restaurants, setRestaurants] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('pending');
  const [actionLoading, setActionLoading] = useState(null);
  const [statusTogglingId, setStatusTogglingId] = useState(null);
  const [view, setView] = useState('vendors');
  const [analytics, setAnalytics] = useState(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [vendor, setVendor] = useState(null);
  const [vendorAnalytics, setVendorAnalytics] = useState(null);
  const [vendorLoading, setVendorLoading] = useState(false);

  const baseURL = getApiBaseUrl();

  const authConfig = () => {
    const token = localStorage.getItem('authToken');
    const headers = {};
    if (token) headers.Authorization = `Bearer ${token}`;
    return { withCredentials: true, headers };
  };

  const fetchRestaurants = async () => {
    setIsLoading(true);
    try {
      const res = await axios.get(`${baseURL}/api/admin/restaurants`, authConfig());
      if (res.data.success) setRestaurants(res.data.restaurants);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchRestaurants(); }, []);

  const fetchAnalytics = useCallback(async () => {
    setAnalyticsLoading(true);
    try {
      const res = await axios.get(`${baseURL}/api/admin/restaurant-analytics?days=14&weeks=8`, authConfig());
      if (res.data.success) setAnalytics(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setAnalyticsLoading(false);
    }
  }, [baseURL]);

  useEffect(() => {
    if (view === 'analytics' && !analytics) fetchAnalytics();
  }, [view, analytics, fetchAnalytics]);

  const openVendor = useCallback(async (row) => {
    setVendor(row);
    setVendorAnalytics(null);
    setVendorLoading(true);
    try {
      const res = await axios.get(`${baseURL}/api/admin/restaurant-analytics/${row.id}?days=14&weeks=8`, authConfig());
      if (res.data.success) setVendorAnalytics(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setVendorLoading(false);
    }
  }, [baseURL]);

  const handleApproval = async (id, action) => {
    setActionLoading(`${id}-${action}`);
    try {
      await axios.patch(`${baseURL}/api/admin/restaurants/${id}/approval`, { action }, authConfig());
      invalidateApiCache(['/restaurants', '/food']);
      fetchRestaurants();
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(null);
    }
  };

  const toggleOpen = async (restaurant) => {
    try {
      await axios.put(`${baseURL}/api/admin/restaurants/${restaurant.id}`, {
        business_name: restaurant.business_name,
        owner_name: restaurant.owner_name,
        owner_phone: restaurant.owner_phone,
        city: restaurant.city,
        is_verified: restaurant.is_verified,
        is_open: !restaurant.is_open,
      }, authConfig());
      invalidateApiCache(['/restaurants', '/food']);
      fetchRestaurants();
    } catch (err) { console.error(err); }
  };

  const toggleActiveStatus = async (restaurant) => {
    const newStatus = !(restaurant.is_active !== false);
    setRestaurants(prev =>
      prev.map(r => r.id === restaurant.id ? { ...r, is_active: newStatus } : r)
    );
    setStatusTogglingId(restaurant.id);
    try {
      await axios.patch(
        `${baseURL}/api/admin/restaurants/${restaurant.id}/status`,
        { is_active: newStatus },
        authConfig()
      );
      invalidateApiCache(['/restaurants', '/food']);
    } catch (err) {
      console.error(err);
      setRestaurants(prev =>
        prev.map(r => r.id === restaurant.id ? { ...r, is_active: !newStatus } : r)
      );
    } finally {
      setStatusTogglingId(null);
    }
  };

  const counts = {
    pending:  restaurants.filter(r => (r.approval_status || 'pending') === 'pending').length,
    approved: restaurants.filter(r => r.approval_status === 'approved').length,
    rejected: restaurants.filter(r => r.approval_status === 'rejected').length,
    all:      restaurants.length,
  };

  const filtered = restaurants.filter(r => {
    const matchTab = activeTab === 'all' || (r.approval_status || 'pending') === activeTab;
    const matchSearch = r.business_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        r.owner_name?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchTab && matchSearch;
  });

  const salesTotals = (analytics?.restaurants || []).reduce(
    (acc, r) => {
      acc.today += r.today_sales;
      acc.week += r.week_sales;
      acc.total += r.total_revenue;
      acc.orders += r.total_orders;
      return acc;
    },
    { today: 0, week: 0, total: 0, orders: 0 }
  );

  return (
    <div className="space-y-5 flex flex-col h-full">

      {/* Header */}
      <div className="flex flex-wrap justify-between items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#171717]">Vendor Management</h1>
          <p className="text-[#6B7280] mt-1 text-sm">Review applications, control visibility, and track sales</p>
        </div>
        <div className="flex items-center gap-3">
          {view === 'vendors' && (
            <>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9CA3AF]" size={16} />
                <input
                  type="text"
                  placeholder="Search vendors..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="pl-9 pr-4 py-2 bg-white border border-[#E5E7EB] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#EA580C]/20 focus:border-[#EA580C] transition-all w-52"
                />
              </div>
              <button onClick={fetchRestaurants} className="p-2 bg-white border border-[#E5E7EB] hover:bg-[#FAFAFA] text-[#6B7280] rounded-xl transition-colors">
                <RefreshCw size={16} className={isLoading ? 'animate-spin text-[#EA580C]' : ''} />
              </button>
            </>
          )}
          {view === 'analytics' && (
            <button onClick={fetchAnalytics} className="p-2 bg-white border border-[#E5E7EB] hover:bg-[#FAFAFA] text-[#6B7280] rounded-xl transition-colors">
              <RefreshCw size={16} className={analyticsLoading ? 'animate-spin text-[#EA580C]' : ''} />
            </button>
          )}
          <div className="flex items-center bg-[#F3F4F6] rounded-xl p-1">
            <button
              onClick={() => setView('vendors')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                view === 'vendors' ? 'bg-white text-[#171717] shadow-sm' : 'text-[#6B7280] hover:text-[#374151]'
              }`}
            >
              <List size={14} /> Vendors
            </button>
            <button
              onClick={() => setView('analytics')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                view === 'analytics' ? 'bg-white text-[#171717] shadow-sm' : 'text-[#6B7280] hover:text-[#374151]'
              }`}
            >
              <BarChart3 size={14} /> Analytics
            </button>
          </div>
        </div>
      </div>

      {view === 'vendors' && (
        <>
      {/* Status Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {STATUS_TABS.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-colors ${
              activeTab === tab.key
                ? 'bg-[#111111] text-white'
                : 'bg-white text-[#6B7280] border border-[#E5E7EB] hover:bg-[#FAFAFA]'
            }`}
          >
            {tab.label}
            <span className={`px-1.5 py-0.5 rounded-md text-xs font-semibold ${
              activeTab === tab.key ? 'bg-white/20 text-white' : 'bg-[#FAFAFA] text-[#6B7280]'
            }`}>
              {counts[tab.key]}
            </span>
          </button>
        ))}
      </div>

      {/* Pending notice */}
      {activeTab === 'pending' && counts.pending > 0 && (
        <div className="flex items-center gap-3 bg-[#FEF3C7] border border-[#FDE68A] text-[#92400E] px-4 py-3 rounded-xl text-sm font-medium">
          <AlertTriangle size={16} className="shrink-0" />
          {counts.pending} restaurant application{counts.pending > 1 ? 's' : ''} waiting for your review.
        </div>
      )}

      {/* Cards grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 flex-1 overflow-y-auto min-h-0 pb-4">
        {isLoading ? (
          <div className="col-span-full flex justify-center py-16">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#EA580C]" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="col-span-full text-center py-16 text-[#9CA3AF]">
            <Store size={36} className="mx-auto mb-3 opacity-30" />
            <p className="font-medium">No vendors in this category</p>
          </div>
        ) : filtered.map(r => {
          const rStatus = r.approval_status || 'pending';
          const isActive = r.is_active !== false;
          const isToggling = statusTogglingId === r.id;

          return (
            <div
              key={r.id}
              className={`bg-white rounded-xl p-5 border transition-colors flex flex-col gap-3 ${
                isActive ? 'border-[#E5E7EB]' : 'border-[#E5E7EB] opacity-60'
              }`}
            >
              {/* Card header */}
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${
                    isActive
                      ? 'bg-[#EA580C]/10 text-[#EA580C] border-[#EA580C]/20'
                      : 'bg-[#FAFAFA] text-[#9CA3AF] border-[#E5E7EB]'
                  }`}>
                    <Store size={18} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-[#171717] leading-tight text-sm">{r.business_name}</h3>
                    <div className="flex items-center gap-1 text-xs text-[#6B7280] mt-0.5">
                      <MapPin size={10} /> {r.city}
                    </div>
                  </div>
                </div>
                <span className={`flex items-center gap-1.5 px-2 py-0.5 rounded-lg text-xs font-semibold ${statusStyle[rStatus] || statusStyle.pending}`}>
                  {statusIcon[rStatus]}
                  {rStatus.charAt(0).toUpperCase() + rStatus.slice(1)}
                </span>
              </div>

              {/* Details */}
              <div className="py-2.5 border-y border-[#F3F4F6] space-y-1.5 text-sm">
                <div className="flex justify-between"><span className="text-[#6B7280]">Owner</span><span className="font-medium text-[#171717]">{r.owner_name}</span></div>
                <div className="flex justify-between"><span className="text-[#6B7280]">Email</span><span className="font-medium text-[#374151] text-xs">{r.business_email}</span></div>
                <div className="flex justify-between"><span className="text-[#6B7280]">Contact</span><span className="font-medium text-[#171717]">{r.owner_phone}</span></div>
                {rStatus === 'approved' && (
                  <>
                    <div className="flex justify-between"><span className="text-[#6B7280]">Today's Sales</span><span className="font-bold text-[#16A34A]">${parseFloat(r.today_sales || 0).toLocaleString()}</span></div>
                    <div className="flex justify-between"><span className="text-[#6B7280]">Today's Orders</span><span className="font-medium text-[#374151]">{r.today_orders || 0}</span></div>
                    <div className="flex justify-between"><span className="text-[#6B7280]">Total Orders</span><span className="font-bold text-[#16A34A]">{r.total_orders}</span></div>
                    <div className="flex justify-between"><span className="text-[#6B7280]">Total Revenue</span><span className="font-bold text-[#3B82F6]">${parseFloat(r.revenue || 0).toLocaleString()}</span></div>
                    <div className="flex justify-between"><span className="text-[#6B7280]">Avg Order</span><span className="font-medium text-[#374151]">${parseFloat(r.avg_order_value || 0).toLocaleString(undefined, { maximumFractionDigits: 2 })}</span></div>
                    <div className="flex justify-between"><span className="text-[#6B7280]">Last Order</span><span className="text-[#9CA3AF] text-xs">{r.last_order_at ? new Date(r.last_order_at).toLocaleDateString() : '—'}</span></div>
                  </>
                )}
                <div className="flex justify-between">
                  <span className="text-[#6B7280]">Registered</span>
                  <span className="text-[#9CA3AF] text-xs">{new Date(r.created_at).toLocaleDateString()}</span>
                </div>
              </div>

              {/* Admin Visibility Toggle */}
              {rStatus === 'approved' && (
                <div className="flex items-center justify-between bg-[#FAFAFA] rounded-xl px-3.5 py-2.5 border border-[#F3F4F6]">
                  <div className="flex items-center gap-2">
                    <Power size={13} className={isActive ? 'text-[#16A34A]' : 'text-[#9CA3AF]'} />
                    <span className="text-xs font-medium text-[#6B7280]">User Visibility</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-semibold ${isActive ? 'text-[#16A34A]' : 'text-[#9CA3AF]'}`}>
                      {isToggling ? '...' : isActive ? 'Active' : 'Inactive'}
                    </span>
                    <button
                      onClick={() => toggleActiveStatus(r)}
                      disabled={isToggling}
                      title={isActive ? 'Click to Deactivate' : 'Click to Activate'}
                      className={`relative inline-flex items-center w-10 h-5 rounded-full transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-offset-1 disabled:opacity-60 ${
                        isActive
                          ? 'bg-[#16A34A] focus:ring-[#16A34A]/40'
                          : 'bg-[#D1D5DB] focus:ring-[#9CA3AF]/40'
                      }`}
                    >
                      <span
                        className={`inline-block w-3.5 h-3.5 bg-white rounded-full shadow-sm transform transition-transform duration-300 ${
                          isActive ? 'translate-x-5.5 ml-[22px]' : 'translate-x-1'
                        } ${isToggling ? 'animate-pulse' : ''}`}
                      />
                    </button>
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-2 mt-auto">
                {rStatus === 'pending' && (
                  <>
                    <button
                      disabled={!!actionLoading}
                      onClick={() => handleApproval(r.id, 'approved')}
                      className="flex-1 py-2 rounded-xl text-sm font-semibold flex items-center justify-center gap-1.5 bg-[#3B82F6] hover:bg-[#2563EB] text-white transition-colors disabled:opacity-50"
                    >
                      {actionLoading === `${r.id}-approved` ? <RefreshCw size={13} className="animate-spin" /> : <CheckCircle size={13} />}
                      Approve
                    </button>
                    <button
                      disabled={!!actionLoading}
                      onClick={() => handleApproval(r.id, 'rejected')}
                      className="flex-1 py-2 rounded-xl text-sm font-semibold flex items-center justify-center gap-1.5 bg-[#FEE2E2] hover:bg-[#FECACA] text-[#DC2626] border border-[#FECACA] transition-colors disabled:opacity-50"
                    >
                      {actionLoading === `${r.id}-rejected` ? <RefreshCw size={13} className="animate-spin" /> : <XCircle size={13} />}
                      Reject
                    </button>
                  </>
                )}
                {rStatus === 'approved' && (
                  <>
                    <button
                      onClick={() => toggleOpen(r)}
                      className={`flex-1 py-2 rounded-xl text-sm font-medium border transition-colors ${r.is_open ? 'bg-white text-[#374151] border-[#E5E7EB] hover:bg-[#FAFAFA]' : 'bg-[#FAFAFA] text-[#9CA3AF] border-[#E5E7EB] hover:bg-[#F3F4F6]'}`}
                    >
                      {r.is_open ? '🟢 Open' : '🔴 Closed'}
                    </button>
                    <button
                      onClick={() => handleApproval(r.id, 'rejected')}
                      className="px-3 py-2 rounded-xl text-sm font-medium bg-[#FEE2E2] text-[#DC2626] border border-[#FECACA] hover:bg-[#FECACA] transition-colors"
                      title="Revoke Approval"
                    >
                      <XCircle size={15} />
                    </button>
                  </>
                )}
                {rStatus === 'rejected' && (
                  <button
                    disabled={!!actionLoading}
                    onClick={() => handleApproval(r.id, 'approved')}
                    className="flex-1 py-2 rounded-xl text-sm font-semibold flex items-center justify-center gap-1.5 bg-[#DCFCE7] hover:bg-[#BBF7D0] text-[#16A34A] border border-[#BBF7D0] transition-colors"
                  >
                    <CheckCircle size={13} /> Re-Approve
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
        </>
      )}

      {view === 'analytics' && (
        <div className="flex-1 overflow-y-auto min-h-0 space-y-4 pb-4">
          {analyticsLoading || !analytics ? (
            <div className="flex justify-center py-16">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#EA580C]" />
            </div>
          ) : (
            <>
              {/* KPI row */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  { label: "Today's Sales", value: salesTotals.today, icon: DollarSign, color: 'text-[#16A34A]', bg: 'bg-green-50' },
                  { label: 'This Week Sales', value: salesTotals.week, icon: TrendingUp, color: 'text-[#3B82F6]', bg: 'bg-blue-50' },
                  { label: 'Total Revenue', value: salesTotals.total, icon: DollarSign, color: 'text-[#D97706]', bg: 'bg-amber-50' },
                  { label: 'Total Orders', value: salesTotals.orders, icon: ClipboardList, color: 'text-[#EA580C]', bg: 'bg-orange-50', isCurrency: false },
                ].map((k, i) => {
                  const Icon = k.icon;
                  return (
                    <div key={i} className="bg-white rounded-xl p-4 border border-[#E5E7EB]">
                      <div className="flex items-center gap-3">
                        <div className={`p-3 rounded-xl ${k.bg} ${k.color} shrink-0`}><Icon size={20} /></div>
                        <div className="min-w-0">
                          <p className="text-[#6B7280] text-xs font-medium uppercase tracking-wide truncate">{k.label}</p>
                          <p className={`text-xl font-bold mt-0.5 ${k.color}`}>
                            {k.isCurrency === false ? k.value.toLocaleString() : `$${k.value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Charts */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className="bg-white rounded-xl p-4 sm:p-5 border border-[#E5E7EB]">
                  <h2 className="text-base font-semibold text-[#171717] mb-4 flex items-center gap-2">
                    <BarChart3 size={18} className="text-[#EA580C]" /> Daily Sales (Last 14 Days)
                  </h2>
                  <div className="h-[280px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={analytics.daily} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                        <XAxis dataKey="date"
                          tickFormatter={(v) => new Date(v).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                          axisLine={false} tickLine={false} tick={{ fill: '#6B7280', fontSize: 11 }} dy={10}
                          minTickGap={20} interval="preserveStartEnd" />
                        <YAxis axisLine={false} tickLine={false} tick={{ fill: '#6B7280', fontSize: 11 }} width={48}
                          tickFormatter={(v) => `$${v}`} />
                        <RechartsTooltip
                          contentStyle={{ borderRadius: '8px', border: '1px solid #E5E7EB', boxShadow: 'none', fontSize: '13px' }}
                          formatter={(value) => [`$${value}`, 'Revenue']}
                          labelFormatter={(l) => new Date(l).toLocaleDateString()} />
                        <Bar dataKey="revenue" fill="#EA580C" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="bg-white rounded-xl p-4 sm:p-5 border border-[#E5E7EB]">
                  <h2 className="text-base font-semibold text-[#171717] mb-4 flex items-center gap-2">
                    <TrendingUp size={18} className="text-[#3B82F6]" /> Weekly Sales (Last 8 Weeks)
                  </h2>
                  <div className="h-[280px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={analytics.weekly} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                        <XAxis dataKey="week"
                          tickFormatter={(v) => new Date(v).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                          axisLine={false} tickLine={false} tick={{ fill: '#6B7280', fontSize: 11 }} dy={10}
                          minTickGap={16} interval="preserveStartEnd" />
                        <YAxis axisLine={false} tickLine={false} tick={{ fill: '#6B7280', fontSize: 11 }} width={48}
                          tickFormatter={(v) => `$${v}`} />
                        <RechartsTooltip
                          contentStyle={{ borderRadius: '8px', border: '1px solid #E5E7EB', boxShadow: 'none', fontSize: '13px' }}
                          formatter={(value) => [`$${value}`, 'Revenue']}
                          labelFormatter={(l) => 'Week of ' + new Date(l).toLocaleDateString()} />
                        <Bar dataKey="revenue" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

              {/* Per-vendor table */}
              <div className="bg-white rounded-xl border border-[#E5E7EB] overflow-hidden">
                <div className="px-4 sm:px-5 py-4 border-b border-[#F3F4F6]">
                  <h2 className="text-base font-semibold text-[#171717] flex items-center gap-2">
                    <ClipboardList size={18} className="text-[#16A34A]" /> Sales by Vendor
                  </h2>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-[#FAFAFA] text-[#6B7280] text-xs uppercase tracking-wide">
                        <th className="text-left font-semibold px-4 sm:px-5 py-3">Vendor</th>
                        <th className="text-right font-semibold px-4 py-3">Today</th>
                        <th className="text-right font-semibold px-4 py-3">This Week</th>
                        <th className="text-right font-semibold px-4 py-3">Total Orders</th>
                        <th className="text-right font-semibold px-4 sm:px-5 py-3">Total Revenue</th>
                      </tr>
                    </thead>
                    <tbody>
                      {analytics.restaurants.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="text-center text-[#9CA3AF] py-10">No sales recorded yet</td>
                        </tr>
                      ) : analytics.restaurants.map(r => (
                        <tr key={r.id} onClick={() => openVendor(r)}
                          className="group border-t border-[#F3F4F6] hover:bg-[#FFF7ED] cursor-pointer transition-colors">
                          <td className="px-4 sm:px-5 py-3">
                            <div className="font-medium text-[#171717] flex items-center gap-1.5">
                              {r.business_name}
                              <Eye size={13} className="text-[#EA580C] opacity-0 group-hover:opacity-100" />
                            </div>
                            <div className="text-xs text-[#9CA3AF]">{r.city}</div>
                          </td>
                          <td className="text-right px-4 py-3 font-semibold text-[#16A34A]">${r.today_sales.toLocaleString()}</td>
                          <td className="text-right px-4 py-3 font-semibold text-[#3B82F6]">${r.week_sales.toLocaleString()}</td>
                          <td className="text-right px-4 py-3 text-[#374151]">{r.total_orders}</td>
                          <td className="text-right px-4 sm:px-5 py-3 font-bold text-[#171717]">${r.total_revenue.toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* Vendor drill-down modal */}
      {vendor && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
          onClick={() => setVendor(null)}
        >
          <div
            className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-xl"
            onClick={e => e.stopPropagation()}
          >
            <div className="sticky top-0 z-10 flex items-start justify-between gap-4 bg-white border-b border-[#E5E7EB] px-5 py-4">
              <div>
                <h2 className="text-lg font-bold text-[#171717]">{vendor.business_name}</h2>
                <p className="text-sm text-[#6B7280]">{vendor.city} · Sales Analytics</p>
              </div>
              <button onClick={() => setVendor(null)} className="p-2 rounded-xl hover:bg-[#F3F4F6] text-[#6B7280] transition-colors">
                <X size={18} />
              </button>
            </div>

            <div className="p-5 space-y-5">
              {vendorLoading ? (
                <div className="flex justify-center py-20">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#EA580C]" />
                </div>
              ) : !vendorAnalytics ? (
                <div className="text-center py-16 text-[#9CA3AF]">Could not load analytics</div>
              ) : (
                <>
                  {/* KPI row */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {[
                      { label: "Today's Sales", value: vendorAnalytics.summary.today_sales, color: 'text-[#16A34A]' },
                      { label: 'This Week', value: vendorAnalytics.summary.week_sales, color: 'text-[#3B82F6]' },
                      { label: 'Total Revenue', value: vendorAnalytics.summary.total_revenue, color: 'text-[#D97706]' },
                      { label: 'Avg Order', value: vendorAnalytics.summary.avg_order_value, color: 'text-[#EA580C]' },
                    ].map((k, i) => (
                      <div key={i} className="bg-[#FAFAFA] rounded-xl p-3.5 border border-[#E5E7EB]">
                        <p className="text-[#6B7280] text-xs font-medium uppercase tracking-wide">{k.label}</p>
                        <p className={`text-lg font-bold mt-1 ${k.color}`}>${k.value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                      </div>
                    ))}
                  </div>

                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 text-sm">
                    <div className="bg-[#FAFAFA] rounded-xl p-3.5 border border-[#E5E7EB] flex items-center justify-between">
                      <span className="text-[#6B7280]">Total Orders</span>
                      <span className="font-bold text-[#171717]">{vendorAnalytics.summary.total_orders}</span>
                    </div>
                    <div className="bg-[#FAFAFA] rounded-xl p-3.5 border border-[#E5E7EB] flex items-center justify-between">
                      <span className="text-[#6B7280]">This Week Orders</span>
                      <span className="font-bold text-[#171717]">{vendorAnalytics.summary.week_orders}</span>
                    </div>
                  </div>

                  {/* Daily chart */}
                  <div className="border border-[#E5E7EB] rounded-xl p-4">
                    <h3 className="text-sm font-semibold text-[#171717] mb-3 flex items-center gap-2">
                      <BarChart3 size={16} className="text-[#EA580C]" /> Daily Sales (Last 14 Days)
                    </h3>
                    <div className="h-[220px] w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={vendorAnalytics.daily} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                          <XAxis dataKey="date"
                            tickFormatter={(v) => new Date(v).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                            axisLine={false} tickLine={false} tick={{ fill: '#6B7280', fontSize: 11 }} dy={8}
                            minTickGap={18} interval="preserveStartEnd" />
                          <YAxis axisLine={false} tickLine={false} tick={{ fill: '#6B7280', fontSize: 11 }} width={44} tickFormatter={(v) => `$${v}`} />
                          <RechartsTooltip
                            contentStyle={{ borderRadius: '8px', border: '1px solid #E5E7EB', boxShadow: 'none', fontSize: '13px' }}
                            formatter={(value) => [`$${value}`, 'Revenue']}
                            labelFormatter={(l) => new Date(l).toLocaleDateString()} />
                          <Bar dataKey="revenue" fill="#EA580C" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Weekly chart */}
                  <div className="border border-[#E5E7EB] rounded-xl p-4">
                    <h3 className="text-sm font-semibold text-[#171717] mb-3 flex items-center gap-2">
                      <TrendingUp size={16} className="text-[#3B82F6]" /> Weekly Sales (Last 8 Weeks)
                    </h3>
                    <div className="h-[220px] w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={vendorAnalytics.weekly} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                          <XAxis dataKey="week"
                            tickFormatter={(v) => new Date(v).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                            axisLine={false} tickLine={false} tick={{ fill: '#6B7280', fontSize: 11 }} dy={8}
                            minTickGap={14} interval="preserveStartEnd" />
                          <YAxis axisLine={false} tickLine={false} tick={{ fill: '#6B7280', fontSize: 11 }} width={44} tickFormatter={(v) => `$${v}`} />
                          <RechartsTooltip
                            contentStyle={{ borderRadius: '8px', border: '1px solid #E5E7EB', boxShadow: 'none', fontSize: '13px' }}
                            formatter={(value) => [`$${value}`, 'Revenue']}
                            labelFormatter={(l) => 'Week of ' + new Date(l).toLocaleDateString()} />
                          <Bar dataKey="revenue" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Top items */}
                  <div className="border border-[#E5E7EB] rounded-xl overflow-hidden">
                    <div className="px-4 py-3 border-b border-[#F3F4F6]">
                      <h3 className="text-sm font-semibold text-[#171717] flex items-center gap-2">
                        <ClipboardList size={16} className="text-[#EA580C]" /> Top Selling Items
                      </h3>
                    </div>
                    {vendorAnalytics.top_items.length === 0 ? (
                      <p className="text-center text-[#9CA3AF] text-sm py-8">No item sales yet</p>
                    ) : (
                      <table className="w-full text-sm">
                        <thead className="bg-[#FAFAFA] text-[#6B7280] text-xs uppercase tracking-wide">
                          <tr>
                            <th className="text-left font-semibold px-4 py-2">Item</th>
                            <th className="text-right font-semibold px-4 py-2">Qty Sold</th>
                            <th className="text-right font-semibold px-4 py-2">Revenue</th>
                          </tr>
                        </thead>
                        <tbody>
                          {vendorAnalytics.top_items.map((it, i) => (
                            <tr key={i} className="border-t border-[#F3F4F6]">
                              <td className="px-4 py-2.5 font-medium text-[#171717]">{it.item_name}</td>
                              <td className="text-right px-4 py-2.5 text-[#374151]">{it.qty}</td>
                              <td className="text-right px-4 py-2.5 font-semibold text-[#171717]">${it.revenue.toLocaleString()}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminRestaurants;
