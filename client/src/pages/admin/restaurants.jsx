import { useState, useEffect } from 'react';
import axios from 'axios';
import { getApiBaseUrl } from '../../services/apiClient';
import { Search, MapPin, Store, CheckCircle, XCircle, Clock, RefreshCw, AlertTriangle, Power } from 'lucide-react';

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

  const handleApproval = async (id, action) => {
    setActionLoading(`${id}-${action}`);
    try {
      await axios.patch(`${baseURL}/api/admin/restaurants/${id}/approval`, { action }, authConfig());
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

  return (
    <div className="space-y-5 flex flex-col h-full">

      {/* Header */}
      <div className="flex flex-wrap justify-between items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#171717]">Vendor Management</h1>
          <p className="text-[#6B7280] mt-1 text-sm">Review applications and control restaurant visibility</p>
        </div>
        <div className="flex items-center gap-3">
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
        </div>
      </div>

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
                    <div className="flex justify-between"><span className="text-[#6B7280]">Orders</span><span className="font-bold text-[#16A34A]">{r.total_orders}</span></div>
                    <div className="flex justify-between"><span className="text-[#6B7280]">Revenue</span><span className="font-bold text-[#3B82F6]">${parseFloat(r.revenue || 0).toLocaleString()}</span></div>
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
    </div>
  );
}

export default AdminRestaurants;
