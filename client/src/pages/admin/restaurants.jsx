import { useState, useEffect } from 'react';
import axios from 'axios';
import { getApiBaseUrl } from '../../services/apiClient';
import { Search, MapPin, Award, Store, CheckCircle, XCircle, Clock, RefreshCw, AlertTriangle } from 'lucide-react';

const STATUS_TABS = [
  { key: 'pending',  label: 'Pending Review', color: 'amber'   },
  { key: 'approved', label: 'Approved',        color: 'emerald' },
  { key: 'rejected', label: 'Rejected',        color: 'red'     },
  { key: 'all',      label: 'All Vendors',     color: 'blue'    },
];

const statusStyle = {
  pending:  'bg-amber-100 text-amber-700 ring-amber-500/30',
  approved: 'bg-emerald-100 text-emerald-700 ring-emerald-500/30',
  rejected: 'bg-red-100 text-red-700 ring-red-500/30',
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

  const baseURL = getApiBaseUrl();

  const fetchRestaurants = async () => {
    setIsLoading(true);
    try {
      const res = await axios.get(`${baseURL}/api/admin/restaurants`, { withCredentials: true });
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
      await axios.patch(`${baseURL}/api/admin/restaurants/${id}/approval`, { action }, { withCredentials: true });
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
      }, { withCredentials: true });
      fetchRestaurants();
    } catch (err) { console.error(err); }
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
    <div className="space-y-6 animate-fade-in flex flex-col h-full">

      {/* Header */}
      <div className="flex flex-wrap justify-between items-center gap-4 bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Vendor Management</h1>
          <p className="text-slate-500 mt-1 text-sm">Review applications and monitor partner restaurants</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="text"
              placeholder="Search vendors..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all w-56"
            />
          </div>
          <button onClick={fetchRestaurants} className="p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl transition-colors">
            <RefreshCw size={18} className={isLoading ? 'animate-spin text-blue-500' : ''} />
          </button>
        </div>
      </div>

      {/* Status Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {STATUS_TABS.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-2xl text-sm font-semibold whitespace-nowrap transition-all border ${
              activeTab === tab.key
                ? 'bg-slate-800 text-white border-slate-800 shadow-lg'
                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
            }`}
          >
            {tab.label}
            <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
              activeTab === tab.key ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
            }`}>
              {counts[tab.key]}
            </span>
          </button>
        ))}
      </div>

      {/* Pending notice */}
      {activeTab === 'pending' && counts.pending > 0 && (
        <div className="flex items-center gap-3 bg-amber-50 border border-amber-200 text-amber-800 px-5 py-3.5 rounded-2xl text-sm font-medium">
          <AlertTriangle size={18} className="shrink-0" />
          {counts.pending} restaurant application{counts.pending > 1 ? 's' : ''} waiting for your review.
        </div>
      )}

      {/* Cards grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 flex-1 overflow-y-auto min-h-0 pb-4">
        {isLoading ? (
          <div className="col-span-full flex justify-center py-16">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="col-span-full text-center py-16 text-slate-400">
            <Store size={40} className="mx-auto mb-3 opacity-30" />
            <p className="font-medium">No vendors in this category</p>
          </div>
        ) : filtered.map(r => {
          const rStatus = r.approval_status || 'pending';
          return (
            <div key={r.id} className="bg-white rounded-3xl p-5 shadow-sm border border-slate-100 hover:shadow-md transition-shadow flex flex-col gap-4">

              {/* Card header */}
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 bg-orange-100 rounded-2xl flex items-center justify-center text-orange-600 border border-orange-200">
                    <Store size={20} />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-800 leading-tight">{r.business_name}</h3>
                    <div className="flex items-center gap-1 text-xs text-slate-500 mt-0.5">
                      <MapPin size={11} /> {r.city}
                    </div>
                  </div>
                </div>
                <span className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ring-1 ring-inset ${statusStyle[rStatus] || statusStyle.pending}`}>
                  {statusIcon[rStatus]}
                  {rStatus.charAt(0).toUpperCase() + rStatus.slice(1)}
                </span>
              </div>

              {/* Details */}
              <div className="py-3 border-y border-slate-100 space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-slate-500">Owner</span><span className="font-medium text-slate-800">{r.owner_name}</span></div>
                <div className="flex justify-between"><span className="text-slate-500">Email</span><span className="font-medium text-slate-700 text-xs">{r.business_email}</span></div>
                <div className="flex justify-between"><span className="text-slate-500">Contact</span><span className="font-medium text-slate-800">{r.owner_phone}</span></div>
                {rStatus === 'approved' && (
                  <>
                    <div className="flex justify-between"><span className="text-slate-500">Orders</span><span className="font-bold text-emerald-600">{r.total_orders}</span></div>
                    <div className="flex justify-between"><span className="text-slate-500">Revenue</span><span className="font-bold text-blue-600">${parseFloat(r.revenue || 0).toLocaleString()}</span></div>
                  </>
                )}
                <div className="flex justify-between">
                  <span className="text-slate-500">Registered</span>
                  <span className="text-slate-600 text-xs">{new Date(r.created_at).toLocaleDateString()}</span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2 mt-auto">
                {rStatus === 'pending' && (
                  <>
                    <button
                      disabled={!!actionLoading}
                      onClick={() => handleApproval(r.id, 'approved')}
                      className="flex-1 py-2 rounded-xl text-sm font-bold flex items-center justify-center gap-1.5 bg-emerald-500 hover:bg-emerald-600 text-white transition-colors disabled:opacity-50"
                    >
                      {actionLoading === `${r.id}-approved` ? <RefreshCw size={14} className="animate-spin" /> : <CheckCircle size={14} />}
                      Approve
                    </button>
                    <button
                      disabled={!!actionLoading}
                      onClick={() => handleApproval(r.id, 'rejected')}
                      className="flex-1 py-2 rounded-xl text-sm font-bold flex items-center justify-center gap-1.5 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 transition-colors disabled:opacity-50"
                    >
                      {actionLoading === `${r.id}-rejected` ? <RefreshCw size={14} className="animate-spin" /> : <XCircle size={14} />}
                      Reject
                    </button>
                  </>
                )}
                {rStatus === 'approved' && (
                  <>
                    <button
                      onClick={() => toggleOpen(r)}
                      className={`flex-1 py-2 rounded-xl text-sm font-semibold border transition-colors ${r.is_open ? 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50' : 'bg-slate-100 text-slate-500 border-slate-200 hover:bg-slate-200'}`}
                    >
                      {r.is_open ? '🟢 Active' : '🔴 Closed'}
                    </button>
                    <button
                      onClick={() => handleApproval(r.id, 'rejected')}
                      className="px-3 py-2 rounded-xl text-sm font-semibold bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 transition-colors"
                      title="Revoke Approval"
                    >
                      <XCircle size={16} />
                    </button>
                  </>
                )}
                {rStatus === 'rejected' && (
                  <button
                    disabled={!!actionLoading}
                    onClick={() => handleApproval(r.id, 'approved')}
                    className="flex-1 py-2 rounded-xl text-sm font-bold flex items-center justify-center gap-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 transition-colors"
                  >
                    <CheckCircle size={14} /> Re-Approve
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
