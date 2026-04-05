import { useState, useEffect } from 'react';
import { createApiClient } from '../../services/apiClient';
import { Package, Clock, CheckCircle2, ChevronRight, AlertCircle, Truck, TrendingUp, User, List, Table2 } from 'lucide-react';

function OwnerOrders() {
  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [expandedOrderId, setExpandedOrderId] = useState(null);
  const [viewMode, setViewMode] = useState('list');

  const fetchOrders = async (showLoading = true) => {
    try {
      if (showLoading) setIsLoading(true);
      const apiClient = createApiClient();
      const response = await apiClient.get('/owner/orders');
      if (response.data.success) {
        setOrders(response.data.orders);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load orders');
    } finally {
      if (showLoading) setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
    const interval = setInterval(() => {
      fetchOrders(false); // Background refresh
    }, 5000); // refresh every 5s for real-time
    return () => clearInterval(interval);
  }, []);

  const updateOrderStatus = async (id, newStatus) => {
    try {
      const apiClient = createApiClient();
      await apiClient.put(`/owner/orders/${id}/status`, { status: newStatus });
      fetchOrders();
    } catch (err) {
      alert(err.response?.data?.message || 'Error updating order status');
    }
  };

  const getStatusColor = (status) => {
    switch (status.toLowerCase()) {
      case 'pending': return 'bg-amber-50 text-amber-600 border-amber-200/80';
      case 'accepted': return 'bg-blue-50 text-blue-600 border-blue-200/80';
      case 'preparing': return 'bg-violet-50 text-violet-600 border-violet-200/80';
      case 'ready': return 'bg-orange-50 text-orange-600 border-orange-200/80';
      case 'delivered':
      case 'completed': return 'bg-emerald-50 text-emerald-600 border-emerald-200/80';
      case 'cancelled': return 'bg-red-50 text-red-600 border-red-200/80';
      default: return 'bg-gray-50 text-gray-600 border-gray-200/80';
    }
  };

  const getStatusDot = (status) => {
    switch (status.toLowerCase()) {
      case 'pending': return 'bg-amber-400';
      case 'accepted': return 'bg-blue-400';
      case 'preparing': return 'bg-violet-400';
      case 'ready': return 'bg-orange-400';
      case 'delivered':
      case 'completed': return 'bg-emerald-400';
      case 'cancelled': return 'bg-red-400';
      default: return 'bg-gray-400';
    }
  };

  const getNextStatusOptions = (status) => {
    switch (status.toLowerCase()) {
      case 'pending': return ['accepted', 'cancelled'];
      case 'accepted': return ['preparing', 'cancelled'];
      case 'preparing': return ['ready'];
      case 'ready': return ['delivered'];
      default: return [];
    }
  };

  if (isLoading && orders.length === 0) {
    return (
      <div className="flex justify-center items-center h-48">
        <div className="animate-spin rounded-full h-6 w-6 border-2 border-orange-500 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="p-3 md:p-6">
      <div className="max-w-[1300px] mx-auto space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-gray-900 tracking-tight">Orders</h1>
            <p className="text-xs text-gray-400 mt-0.5">Real-time order management</p>
          </div>
          <div className="flex items-center gap-2">
            {/* View Toggle */}
            <div className="flex items-center bg-gray-100 rounded-lg p-0.5">
              <button
                onClick={() => setViewMode('list')}
                className={`inline-flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-medium rounded-md transition-all duration-150 ${
                  viewMode === 'list'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <List size={12} /> List
              </button>
              <button
                onClick={() => setViewMode('table')}
                className={`inline-flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-medium rounded-md transition-all duration-150 ${
                  viewMode === 'table'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <Table2 size={12} /> Table
              </button>
            </div>
            <button
              onClick={() => fetchOrders()}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-gray-300 transition-all duration-150 shadow-sm"
            >
              <TrendingUp size={13} className="text-orange-500" /> Refresh
            </button>
          </div>
        </div>

        {error && (
          <div className="px-3 py-2 bg-red-50 text-red-600 rounded-lg flex items-center gap-1.5 text-xs border border-red-100">
            <AlertCircle size={13} /> {error}
          </div>
        )}

        {/* Orders Content */}
        <div className="bg-white border border-gray-200/80 rounded-xl shadow-sm overflow-hidden">
          {orders.length === 0 ? (
            <div className="text-center py-12">
              <Package size={28} className="mx-auto text-gray-300 mb-2" />
              <p className="text-sm font-semibold text-gray-900">No active orders</p>
              <p className="text-xs text-gray-400 mt-0.5">Orders will appear here when placed.</p>
            </div>
          ) : viewMode === 'list' ? (
            /* ===== LIST VIEW ===== */
            <div className="divide-y divide-gray-100">
              {orders.map(order => (
                <div key={order.id} className="transition-colors hover:bg-gray-50/50">
                  {/* Collapsed Row */}
                  <div
                    className="px-3 py-2.5 md:px-4 md:py-3 cursor-pointer select-none"
                    onClick={() => setExpandedOrderId(expandedOrderId === order.id ? null : order.id)}
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-gray-900">#{order.id}</span>
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-semibold rounded-md border ${getStatusColor(order.order_status)} uppercase tracking-wider`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${getStatusDot(order.order_status)}`}></span>
                            {order.order_status}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 mt-0.5 text-[11px] text-gray-400">
                          <Clock size={10} />
                          {new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          <span className="text-gray-300">·</span>
                          <span className="truncate">{order.customer_name}</span>
                        </div>
                      </div>

                      <div className="text-right mr-2">
                        <p className="text-sm font-bold text-gray-900">₱{parseFloat(order.total_amount).toFixed(2)}</p>
                      </div>

                      <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                        {getNextStatusOptions(order.order_status).length > 0 ? (
                          <div className="flex gap-1">
                            {getNextStatusOptions(order.order_status).map(status => (
                              <button
                                key={status}
                                onClick={() => updateOrderStatus(order.id, status)}
                                className={`px-2 py-1 rounded-md text-[10px] font-semibold transition-all duration-150 border ${status === 'cancelled'
                                  ? 'bg-white border-red-200 text-red-500 hover:bg-red-50'
                                  : 'bg-orange-500 border-orange-500 text-white hover:bg-orange-600'
                                  }`}
                              >
                                {status.charAt(0).toUpperCase() + status.slice(1)}
                              </button>
                            ))}
                          </div>
                        ) : (
                          <div className="flex items-center gap-1 text-emerald-600 text-[10px] font-semibold bg-emerald-50 border border-emerald-200/80 px-2 py-1 rounded-md">
                            <CheckCircle2 size={10} /> Done
                          </div>
                        )}
                      </div>

                      <div className={`transition-transform duration-200 ${expandedOrderId === order.id ? 'rotate-90 text-orange-500' : 'text-gray-300'}`}>
                        <ChevronRight size={16} />
                      </div>
                    </div>
                  </div>

                  {/* Expanded Details */}
                  {expandedOrderId === order.id && (
                    <div className="px-3 md:px-4 pb-3 pt-1 border-t border-gray-100 bg-gray-50/30">
                      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 mt-2">
                        <div className="lg:col-span-2 rounded-lg border border-gray-200/80 bg-white p-3">
                          <h4 className="flex items-center gap-1.5 text-xs font-semibold text-gray-700 mb-2">
                            <Package size={12} className="text-orange-500" /> Items ({(order.items || []).length})
                          </h4>
                          <div className="space-y-1 max-h-52 overflow-y-auto">
                            {(order.items || []).length > 0 ? (
                              order.items.map((item, idx) => (
                                <div key={idx} className="flex justify-between items-center py-1.5 px-2 rounded-md hover:bg-gray-50 text-xs transition-colors">
                                  <div className="flex items-center gap-2 min-w-0">
                                    <span className="flex items-center justify-center w-5 h-5 rounded bg-orange-50 text-orange-600 font-bold text-[10px] flex-shrink-0">
                                      {item.quantity}×
                                    </span>
                                    <span className="text-gray-700 truncate">{item.name}</span>
                                  </div>
                                  <span className="font-medium text-gray-900 ml-2">₱{(parseFloat(item.price) * item.quantity).toFixed(2)}</span>
                                </div>
                              ))
                            ) : (
                              <p className="text-center py-3 text-gray-400 text-[11px]">No items recorded</p>
                            )}
                          </div>
                          <div className="mt-2 pt-2 border-t border-dashed border-gray-200 flex justify-between text-xs">
                            <span className="text-gray-400 font-medium">Total</span>
                            <span className="font-bold text-gray-900">₱{parseFloat(order.total_amount).toFixed(2)}</span>
                          </div>
                        </div>

                        <div className="space-y-3">
                          <div className="rounded-lg border border-gray-200/80 bg-white p-3">
                            <h4 className="text-xs font-semibold text-gray-700 mb-2 flex items-center gap-1.5">
                              <User size={12} className="text-orange-500" /> Customer
                            </h4>
                            <div className="space-y-1.5">
                              <div>
                                <p className="text-[9px] font-semibold text-gray-400 uppercase tracking-widest">Name</p>
                                <p className="text-xs font-medium text-gray-800">{order.customer_name}</p>
                              </div>
                              <div>
                                <p className="text-[9px] font-semibold text-gray-400 uppercase tracking-widest">Phone</p>
                                <p className="text-xs font-medium text-blue-600">{order.customer_phone}</p>
                              </div>
                            </div>
                          </div>

                          <div className="rounded-lg border border-orange-200/60 bg-orange-50/30 p-3">
                            <h4 className="text-xs font-semibold text-gray-700 mb-2 flex items-center gap-1.5">
                              <Truck size={12} className="text-orange-500" /> Delivery
                            </h4>
                            <div className="space-y-1.5">
                              <div>
                                <p className="text-[9px] font-semibold text-gray-400 uppercase tracking-widest">Address</p>
                                <p className="text-xs font-medium text-gray-800">{order.delivery_address || 'Mocked Address 123'}</p>
                              </div>
                              <div className="flex items-center justify-between">
                                <div>
                                  <p className="text-[9px] font-semibold text-gray-400 uppercase tracking-widest">City</p>
                                  <p className="text-xs font-medium text-gray-800">{order.delivery_city || 'Campus Town'}</p>
                                </div>
                                <span className="text-[9px] font-semibold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200/60 uppercase tracking-wide">Standard</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            /* ===== TABLE VIEW ===== */
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50/80">
                    <th className="text-left px-3 py-2.5 text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Order</th>
                    <th className="text-left px-3 py-2.5 text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Customer</th>
                    <th className="text-left px-3 py-2.5 text-[10px] font-semibold text-gray-500 uppercase tracking-wider hidden sm:table-cell">Time</th>
                    <th className="text-left px-3 py-2.5 text-[10px] font-semibold text-gray-500 uppercase tracking-wider hidden md:table-cell">Items</th>
                    <th className="text-right px-3 py-2.5 text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Amount</th>
                    <th className="text-left px-3 py-2.5 text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="text-right px-3 py-2.5 text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {orders.map(order => (
                    <tr key={order.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-3 py-2.5">
                        <span className="font-semibold text-gray-900">#{order.id}</span>
                      </td>
                      <td className="px-3 py-2.5">
                        <div>
                          <p className="font-medium text-gray-800 truncate max-w-[140px]">{order.customer_name}</p>
                          <p className="text-[10px] text-gray-400 truncate max-w-[140px]">{order.customer_phone}</p>
                        </div>
                      </td>
                      <td className="px-3 py-2.5 hidden sm:table-cell">
                        <div className="flex items-center gap-1 text-gray-500">
                          <Clock size={10} className="text-gray-400" />
                          {new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </td>
                      <td className="px-3 py-2.5 hidden md:table-cell">
                        <div className="flex flex-wrap gap-1 max-w-[200px]">
                          {(order.items || []).slice(0, 3).map((item, idx) => (
                            <span key={idx} className="inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded text-[10px]">
                              {item.quantity}× {item.name.length > 12 ? item.name.slice(0, 12) + '…' : item.name}
                            </span>
                          ))}
                          {(order.items || []).length > 3 && (
                            <span className="inline-flex items-center px-1.5 py-0.5 bg-gray-100 text-gray-400 rounded text-[10px]">+{order.items.length - 3}</span>
                          )}
                        </div>
                      </td>
                      <td className="px-3 py-2.5 text-right">
                        <span className="font-bold text-gray-900">₱{parseFloat(order.total_amount).toFixed(2)}</span>
                      </td>
                      <td className="px-3 py-2.5">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-semibold rounded-md border ${getStatusColor(order.order_status)} uppercase tracking-wider`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${getStatusDot(order.order_status)}`}></span>
                          {order.order_status}
                        </span>
                      </td>
                      <td className="px-3 py-2.5">
                        <div className="flex justify-end gap-1">
                          {getNextStatusOptions(order.order_status).length > 0 ? (
                            getNextStatusOptions(order.order_status).map(status => (
                              <button
                                key={status}
                                onClick={() => updateOrderStatus(order.id, status)}
                                className={`px-2 py-1 rounded-md text-[10px] font-semibold transition-all duration-150 border ${status === 'cancelled'
                                  ? 'bg-white border-red-200 text-red-500 hover:bg-red-50'
                                  : 'bg-orange-500 border-orange-500 text-white hover:bg-orange-600'
                                  }`}
                              >
                                {status.charAt(0).toUpperCase() + status.slice(1)}
                              </button>
                            ))
                          ) : (
                            <div className="flex items-center gap-1 text-emerald-600 text-[10px] font-semibold bg-emerald-50 border border-emerald-200/80 px-2 py-1 rounded-md">
                              <CheckCircle2 size={10} /> Done
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default OwnerOrders;
