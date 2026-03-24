import { useState, useEffect } from 'react';
import axios from 'axios';
import { getApiBaseUrl } from '../../services/apiClient';
import { Search, Filter, RefreshCw, Package, MapPin, Map, Clock, User, Store } from 'lucide-react';

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
       case 'delivered': return 'bg-emerald-100 text-emerald-700 ring-emerald-600/20';
       case 'completed': return 'bg-emerald-100 text-emerald-700 ring-emerald-600/20';
       case 'cancelled': return 'bg-red-100 text-red-700 ring-red-600/20';
       case 'failed': return 'bg-rose-100 text-rose-700 ring-rose-600/20';
       case 'pending': return 'bg-amber-100 text-amber-700 ring-amber-600/20';
       default: return 'bg-blue-100 text-blue-700 ring-blue-600/20';
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
    <div className="space-y-6 animate-fade-in w-full h-full flex flex-col">
      <div className="flex justify-between items-center bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Global Orders Tracking</h1>
          <p className="text-slate-500 mt-1 text-sm">Monitor system-wide order fulfillment and disputes</p>
        </div>
        <button onClick={fetchOrders} className="p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl transition-colors">
           <RefreshCw size={20} className={isLoading ? 'animate-spin text-blue-500' : ''} />
        </button>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 mb-6">
         <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
            <input 
              type="text" 
              placeholder="Search by ID, customer name, or vendor..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-11 pr-4 py-3.5 bg-white border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-sm"
            />
         </div>
         <div className="flex items-center gap-3">
             <Filter size={20} className="text-slate-400" />
             <select 
                value={statusFilter} 
                onChange={e => setStatusFilter(e.target.value)}
                className="py-3.5 pl-4 pr-10 bg-white border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 cursor-pointer shadow-sm appearance-none font-medium text-slate-700"
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

      <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden flex-1 min-h-[400px] flex flex-col">
         <div className="overflow-x-auto flex-1 h-full">
            <table className="w-full text-left border-collapse whitespace-nowrap">
              <thead className="bg-slate-50 sticky top-0 z-10 shadow-sm border-b border-slate-100">
                <tr>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Order Details</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Customer & Vendor</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Location / Campus</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Value</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {isLoading ? (
                  <tr><td colSpan="5" className="px-6 py-8 text-center text-slate-400">Loading...</td></tr>
                ) : filteredOrders.length === 0 ? (
                  <tr><td colSpan="5" className="px-6 py-8 text-center text-slate-500 bg-slate-50/50">No orders found matching criteria.</td></tr>
                ) : (
                  filteredOrders.map((order) => (
                    <tr key={order.id} className="hover:bg-slate-50/80 transition-colors group">
                      <td className="px-6 py-4">
                         <div className="flex items-center gap-3">
                             <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center font-bold font-mono">
                                #{order.id}
                             </div>
                             <div>
                               <div className="font-semibold text-slate-800 flex items-center gap-1.5">
                                 <Clock size={14} className="text-slate-400" />
                                 {new Date(order.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                               </div>
                               <div className="text-slate-400 text-xs mt-0.5">
                                 {new Date(order.created_at).toLocaleDateString()}
                               </div>
                             </div>
                         </div>
                      </td>
                      <td className="px-6 py-4">
                         <div className="flex flex-col gap-1.5">
                            <span className="flex items-center gap-2 text-slate-700 font-medium whitespace-normal">
                               <User size={14} className="text-slate-400 shrink-0" /> {order.customer_name}
                            </span>
                            <span className="flex items-center gap-2 text-slate-500 text-xs whitespace-normal">
                               <Store size={14} className="text-orange-400 shrink-0" /> {order.restaurant_name}
                            </span>
                         </div>
                      </td>
                      <td className="px-6 py-4">
                          <div className="text-slate-700 flex flex-col gap-1">
                             <span className="flex items-center gap-1.5 font-medium whitespace-normal max-w-[200px] truncate">
                               <MapPin size={14} className="text-slate-400 shrink-0" /> {order.delivery_address || 'N/A'}
                             </span>
                             {(order.department || order.course) && (
                                <span className="flex items-center gap-1.5 text-xs text-slate-500 mt-1 whitespace-normal">
                                   <Map size={14} className="text-slate-300 shrink-0" /> {order.department} {order.course}
                                </span>
                             )}
                          </div>
                      </td>
                      <td className="px-6 py-4">
                          <span className={`px-3 py-1.5 rounded-full text-[11px] font-bold uppercase tracking-widest ring-1 ring-inset w-max block text-center ${getStatusColor(order.order_status)}`}>
                              {order.order_status?.replace(/_/g, ' ') || 'UNKNOWN'}
                          </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                          <div className="font-bold text-lg text-slate-800 block">
                              ${parseFloat(order.total_amount).toLocaleString(undefined, {minimumFractionDigits: 2})}
                          </div>
                          <div className="text-xs text-slate-400 uppercase tracking-widest mt-0.5">
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
