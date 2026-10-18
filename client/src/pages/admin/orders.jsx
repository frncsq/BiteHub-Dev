import { useState, useEffect } from 'react';
import axios from 'axios';
import { getApiBaseUrl } from '../../services/apiClient';
import { Search, Filter, RefreshCw, MapPin, Map, Clock, User, Store } from 'lucide-react';

function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const fetchOrders = async () => {
    setIsLoading(true);
    try {
      const baseURL = getApiBaseUrl();
      const res = await axios.get(`${baseURL}/api/admin/orders`, { withCredentials: true });
      if (res.data.success) {
        setOrders(res.data.orders);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const getStatusColor = (status) => {
    switch(status?.toLowerCase()) {
       case 'delivered': return 'bg-[#DCFCE7] text-[#16A34A] border border-[#BBF7D0]';
       case 'completed': return 'bg-[#DCFCE7] text-[#16A34A] border border-[#BBF7D0]';
       case 'cancelled': return 'bg-[#FEE2E2] text-[#DC2626] border border-[#FECACA]';
       case 'failed': return 'bg-[#FEE2E2] text-[#E11D48] border border-[#FECDD3]';
       case 'pending': return 'bg-[#FEF3C7] text-[#D97706] border border-[#FDE68A]';
       default: return 'bg-blue-50 text-[#3B82F6] border border-blue-100';
    }
  };

  const filteredOrders = orders.filter(order => 
    (statusFilter === 'all' || order.order_status?.toLowerCase() === statusFilter.toLowerCase()) &&
    (
        order.id?.toString().includes(searchTerm) ||
        order.customer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.restaurant_name?.toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  return (
    <div className="space-y-5 w-full h-full flex flex-col">
      <div className="flex flex-col gap-4 sm:flex-row sm:justify-between sm:items-center">
        <div className="min-w-0">
          <h1 className="text-xl sm:text-2xl font-bold text-[#171717]">Global Orders history</h1>
          <p className="text-[#6B7280] mt-1 text-sm">Monitor system-wide order fulfillment and disputes</p>
        </div>
        <button type="button" onClick={fetchOrders} className="bh-touch shrink-0 self-end sm:self-auto p-2 bg-white border border-[#E5E7EB] hover:bg-[#FAFAFA] text-[#6B7280] rounded-xl transition-colors" aria-label="Refresh orders">
           <RefreshCw size={16} className={isLoading ? 'animate-spin text-[#EA580C]' : ''} />
        </button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
         <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9CA3AF]" size={16} />
            <input 
              type="text" 
              placeholder="Search by ID, customer name, or vendor..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 bg-white border border-[#E5E7EB] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#EA580C]/20 focus:border-[#EA580C] transition-all"
            />
         </div>
         <div className="flex items-center gap-2.5">
             <Filter size={16} className="text-[#9CA3AF]" />
             <select 
                value={statusFilter} 
                onChange={e => setStatusFilter(e.target.value)}
                className="py-2.5 pl-3 pr-8 bg-white border border-[#E5E7EB] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#EA580C]/20 focus:border-[#EA580C] cursor-pointer font-medium text-[#374151] text-sm"
             >
                 <option value="all">All Statuses</option>
                 <option value="pending">Pending</option>
                 <option value="accepted">Accepted</option>
                 <option value="preparing">Preparing</option>
                 <option value="prepared">Prepared</option>
                 <option value="out_for_delivery">Out for Delivery</option>
                 <option value="delivered">Delivered</option>
                 <option value="cancelled">Cancelled</option>
             </select>
         </div>
      </div>

      <div className="md:hidden space-y-3">
        {isLoading ? (
          <p className="text-center text-[#9CA3AF] py-8">Loading...</p>
        ) : filteredOrders.length === 0 ? (
          <p className="text-center text-[#9CA3AF] py-8 rounded-xl border border-dashed border-[#E5E7EB] bg-[#FAFAFA]">No orders found.</p>
        ) : (
          filteredOrders.map((order) => (
            <div key={order.id} className="rounded-xl border border-[#E5E7EB] bg-white p-4">
              <div className="flex justify-between items-start gap-2 mb-2">
                <span className="font-mono font-semibold text-[#3B82F6]">#{order.id}</span>
                <span className={`px-2.5 py-0.5 rounded-lg text-[10px] font-bold uppercase tracking-wider border ${getStatusColor(order.order_status)}`}>
                  {order.order_status?.replace(/_/g, ' ') || 'UNKNOWN'}
                </span>
              </div>
              <p className="text-sm font-medium text-[#171717] flex items-center gap-2">
                <User size={13} className="text-[#9CA3AF] shrink-0" /> {order.customer_name}
              </p>
              <p className="text-xs text-[#6B7280] flex items-center gap-2 mt-1">
                <Store size={13} className="text-[#EA580C]/70 shrink-0" /> {order.restaurant_name}
              </p>
              <p className="text-xs text-[#374151] mt-2 flex items-start gap-1.5">
                <MapPin size={13} className="text-[#9CA3AF] shrink-0 mt-0.5" />
                <span className="break-words">{order.delivery_address || 'N/A'}</span>
              </p>
              {order.special_instructions && (
                <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-2 py-1.5 mt-2 flex items-start gap-1.5">
                  <span className="shrink-0">📝</span>
                  <span className="break-words whitespace-pre-wrap">{order.special_instructions}</span>
                </p>
              )}
              <div className="mt-3 pt-3 border-t border-[#F3F4F6] flex justify-between items-center">
                <span className="text-xs text-[#9CA3AF] uppercase">{order.payment_method || 'CASH'}</span>
                <span className="text-lg font-bold text-[#171717]">
                  ${parseFloat(order.total_amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="hidden md:flex bg-white rounded-xl border border-[#E5E7EB] overflow-hidden flex-1 min-h-[400px] flex-col">
         <div className="overflow-x-auto flex-1 h-full touch-pan-x -mx-4 px-4 sm:mx-0 sm:px-0">
            <table className="w-full text-left border-collapse whitespace-nowrap min-w-[720px]">
              <thead className="bg-[#FAFAFA] sticky top-0 z-10 border-b border-[#E5E7EB]">
                <tr>
                  <th className="px-5 py-3.5 text-xs font-semibold text-[#6B7280] uppercase tracking-wider">Order Details</th>
                  <th className="px-5 py-3.5 text-xs font-semibold text-[#6B7280] uppercase tracking-wider">Customer & Vendor</th>
                  <th className="px-5 py-3.5 text-xs font-semibold text-[#6B7280] uppercase tracking-wider">Location / Campus</th>
                  <th className="px-5 py-3.5 text-xs font-semibold text-[#6B7280] uppercase tracking-wider">Status</th>
                  <th className="px-5 py-3.5 text-xs font-semibold text-[#6B7280] uppercase tracking-wider text-right">Value</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F3F4F6] text-sm">
                {isLoading ? (
                  <tr><td colSpan="5" className="px-5 py-8 text-center text-[#9CA3AF]">Loading...</td></tr>
                ) : filteredOrders.length === 0 ? (
                  <tr><td colSpan="5" className="px-5 py-8 text-center text-[#9CA3AF] bg-[#FAFAFA]">No orders found matching criteria.</td></tr>
                ) : (
                  filteredOrders.map((order) => (
                    <tr key={order.id} className="hover:bg-[#FAFAFA] transition-colors group">
                      <td className="px-5 py-4">
                         <div className="flex items-center gap-3">
                             <div className="w-10 h-10 bg-blue-50 text-[#3B82F6] rounded-xl flex items-center justify-center font-bold font-mono text-sm">
                                #{order.id}
                             </div>
                             <div>
                               <div className="font-medium text-[#171717] flex items-center gap-1.5">
                                 <Clock size={13} className="text-[#9CA3AF]" />
                                 {new Date(order.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                               </div>
                               <div className="text-[#9CA3AF] text-xs mt-0.5">
                                 {new Date(order.created_at).toLocaleDateString()}
                               </div>
                             </div>
                         </div>
                      </td>
                      <td className="px-5 py-4">
                         <div className="flex flex-col gap-1.5">
                            <span className="flex items-center gap-2 text-[#374151] font-medium whitespace-normal">
                               <User size={13} className="text-[#9CA3AF] shrink-0" /> {order.customer_name}
                            </span>
                            <span className="flex items-center gap-2 text-[#6B7280] text-xs whitespace-normal">
                               <Store size={13} className="text-[#EA580C]/70 shrink-0" /> {order.restaurant_name}
                            </span>
                         </div>
                      </td>
                      <td className="px-5 py-4">
                          <div className="text-[#374151] flex flex-col gap-1">
                             <span className="flex items-center gap-1.5 font-medium whitespace-normal max-w-[200px] truncate">
                               <MapPin size={13} className="text-[#9CA3AF] shrink-0" /> {order.delivery_address || 'N/A'}
                             </span>
                             {(order.department || order.course) && (
                                <span className="flex items-center gap-1.5 text-xs text-[#6B7280] mt-1 whitespace-normal">
                                   <Map size={13} className="text-[#D1D5DB] shrink-0" /> {order.department} {order.course}
                                </span>
                             )}
                             {order.special_instructions && (
                                <span className="flex items-start gap-1.5 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-2 py-1 mt-1 whitespace-pre-wrap max-w-[260px]">
                                   <span className="shrink-0">📝</span> {order.special_instructions}
                                </span>
                             )}
                          </div>
                      </td>
                      <td className="px-5 py-4">
                          <span className={`px-3 py-1 rounded-lg text-[11px] font-bold uppercase tracking-widest border w-max block text-center ${getStatusColor(order.order_status)}`}>
                              {order.order_status?.replace(/_/g, ' ') || 'UNKNOWN'}
                          </span>
                      </td>
                      <td className="px-5 py-4 text-right">
                          <div className="font-bold text-lg text-[#171717] block">
                              ${parseFloat(order.total_amount).toLocaleString(undefined, {minimumFractionDigits: 2})}
                          </div>
                          <div className="text-xs text-[#9CA3AF] uppercase tracking-widest mt-0.5">
                             {order.payment_method || 'CASH'}
                          </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
         </div>
      </div>
    </div>
  );
}

export default AdminOrders;
