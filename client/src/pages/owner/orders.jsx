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
      fetchOrders(false);
    }, 5000);
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
      case 'pending': return 'bg-orange-50 dark:bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-200 dark:border-orange-500/30';
      case 'accepted': return 'bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-500/30';
      case 'preparing': return 'bg-violet-50 dark:bg-violet-500/10 text-violet-600 dark:text-violet-400 border-violet-200 dark:border-violet-500/30';
      case 'ready': return 'bg-orange-50 dark:bg-orange-500/10 text-[#EA580C] border-orange-200 dark:border-orange-500/30';
      case 'delivered':
      case 'completed': return 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/30';
      case 'cancelled': return 'bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 border-red-200 dark:border-red-500/30';
      default: return 'bg-gray-50 dark:bg-[#222222] text-gray-600 dark:text-[#A0A0A0] border-gray-200';
    }
  };

  const getStatusDot = (status) => {
    switch (status.toLowerCase()) {
      case 'pending': return 'bg-orange-400';
      case 'accepted': return 'bg-blue-400';
      case 'preparing': return 'bg-violet-400';
      case 'ready': return 'bg-[#EA580C]';
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
        <div className="animate-spin rounded-full h-6 w-6 border-2 border-[#EA580C] border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="p-3 md:p-6">
      <div className="max-w-[1300px] mx-auto space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-[#171717] dark:text-[#F5F5F5] tracking-tight">Orders</h1>
            <p className="text-xs text-[#6B7280] dark:text-[#A0A0A0] mt-0.5">Real-time order management</p>
          </div>
          <div className="flex items-center gap-2">
            {/* View Toggle */}
            <div className="flex items-center bg-[#FAFAFA] dark:bg-[#111111] border border-[#E5E7EB] dark:border-[#2A2A2A] rounded-lg p-0.5">
              <button
                onClick={() => setViewMode('list')}
                className={`inline-flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-medium rounded-md transition-all duration-150 ${
                  viewMode === 'list'
                    ? 'bg-white dark:bg-[#1A1A1A] text-[#171717] dark:text-[#F5F5F5] shadow-sm'
                    : 'text-[#6B7280] dark:text-[#A0A0A0] hover:text-[#171717]'
                }`}
              >
                <List size={12} /> List
              </button>
              <button
                onClick={() => setViewMode('table')}
                className={`inline-flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-medium rounded-md transition-all duration-150 ${
                  viewMode === 'table'
                    ? 'bg-white dark:bg-[#1A1A1A] text-[#171717] dark:text-[#F5F5F5] shadow-sm'
                    : 'text-[#6B7280] dark:text-[#A0A0A0] hover:text-[#171717]'
                }`}
              >
                <Table2 size={12} /> Table
              </button>
            </div>
            <button
              onClick={() => fetchOrders()}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-600 dark:text-[#A0A0A0] bg-white dark:bg-[#1A1A1A] border border-[#E5E7EB] dark:border-[#2A2A2A] rounded-lg hover:bg-[#FAFAFA] dark:hover:bg-white/5 transition-all duration-150"
            >
              <TrendingUp size={13} className="text-[#EA580C]" /> Refresh
            </button>
          </div>
        </div>

        {error && (
          <div className="px-3 py-2 bg-red-50 dark:bg-red-500/10 border border-red-100 dark:border-red-500/25 text-red-600 dark:text-red-400 rounded-lg flex items-center gap-1.5 text-xs">
            <AlertCircle size={13} /> {error}
          </div>
        )}

        {/* Orders Content */}
        <div className="bg-white dark:bg-[#1A1A1A] border border-[#E5E7EB] dark:border-[#2A2A2A] rounded-xl overflow-hidden">
          {orders.length === 0 ? (
            <div className="text-center py-12">
              <Package size={28} className="mx-auto text-gray-300 dark:text-[#555555] mb-2" />
              <p className="text-sm font-semibold text-[#171717] dark:text-[#F5F5F5]">No active orders</p>
              <p className="text-xs text-[#6B7280] dark:text-[#A0A0A0] mt-0.5">Orders will appear here when placed.</p>
            </div>
          ) : viewMode === 'list' ? (
            /* ===== LIST VIEW ===== */
            <div className="divide-y divide-[#E5E7EB] dark:divide-[#2A2A2A]">
              {orders.map(order => (
                <div key={order.id} className="transition-colors hover:bg-[#FAFAFA] dark:hover:bg-white/5">
                  {/* Collapsed Row */}
                  <div
                    className="px-3 py-2.5 md:px-4 md:py-3 cursor-pointer select-none"
                    onClick={() => setExpandedOrderId(expandedOrderId === order.id ? null : order.id)}
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-[#171717] dark:text-[#F5F5F5]">#{order.id}</span>
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-semibold rounded-md border ${getStatusColor(order.order_status)} uppercase tracking-wider`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${getStatusDot(order.order_status)}`}></span>
                            {order.order_status}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 mt-0.5 text-[11px] text-[#6B7280] dark:text-[#A0A0A0]">
                          <Clock size={10} />
                          {new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          <span className="text-gray-300 dark:text-[#555555]">·</span>
                          <span className="truncate">{order.customer_name}</span>
                        </div>
                      </div>

                      <div className="text-right mr-2">
                        <p className="text-sm font-bold text-[#171717] dark:text-[#F5F5F5]">₱{parseFloat(order.total_amount).toFixed(2)}</p>
                      </div>

                      <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                        {getNextStatusOptions(order.order_status).length > 0 ? (
                          <div className="flex gap-1">
                            {getNextStatusOptions(order.order_status).map(status => (
                              <button
                                key={status}
                                onClick={() => updateOrderStatus(order.id, status)}
                                className={`px-2 py-1 rounded-md text-[10px] font-semibold transition-all duration-150 border ${status === 'cancelled'
                                  ? 'bg-white dark:bg-[#1A1A1A] border-red-200 dark:border-red-500/30 text-red-500 hover:bg-red-50'
                                  : 'bg-[#EA580C] border-[#EA580C] text-white hover:bg-[#DC2626]'
                                  }`}
                              >
                                {status.charAt(0).toUpperCase() + status.slice(1)}
                              </button>
                            ))}
                          </div>
                        ) : (
                          <div className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 text-[10px] font-semibold bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/30 px-2 py-1 rounded-md">
                            <CheckCircle2 size={10} /> Done
                          </div>
                        )}
                      </div>

                      <div className={`transition-transform duration-200 ${expandedOrderId === order.id ? 'rotate-90 text-[#EA580C]' : 'text-gray-300 dark:text-[#555555]'}`}>
                        <ChevronRight size={16} />
                      </div>
                    </div>
                  </div>

                  {/* Expanded Details */}
                  {expandedOrderId === order.id && (
                    <div className="px-3 md:px-4 pb-3 pt-1 border-t border-[#E5E7EB] dark:border-[#2A2A2A] bg-[#FAFAFA] dark:bg-[#111111]">
                      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 mt-2">
                        <div className="lg:col-span-2 rounded-lg border border-[#E5E7EB] dark:border-[#2A2A2A] bg-white dark:bg-[#1A1A1A] p-3">
                          <h4 className="flex items-center gap-1.5 text-xs font-semibold text-gray-700 dark:text-[#E5E5E5] mb-2">
                            <Package size={12} className="text-[#EA580C]" /> Items ({(order.items || []).length})
                          </h4>
                          <div className="space-y-1 max-h-52 overflow-y-auto">
                            {(order.items || []).length > 0 ? (
                              order.items.map((item, idx) => (
                                <div key={idx} className="flex justify-between items-center py-1.5 px-2 rounded-md hover:bg-[#FAFAFA] dark:hover:bg-white/5 text-xs transition-colors">
                                  <div className="flex items-center gap-2 min-w-0">
                                    <span className="flex items-center justify-center w-5 h-5 rounded bg-orange-50 dark:bg-orange-500/10 text-[#EA580C] font-bold text-[10px] flex-shrink-0">
                                      {item.quantity}×
                                    </span>
                                    <span className="text-gray-700 dark:text-[#E5E5E5] truncate">{item.name}</span>
                                  </div>
                                  <span className="font-medium text-[#171717] dark:text-[#F5F5F5] ml-2">₱{(parseFloat(item.price) * item.quantity).toFixed(2)}</span>
                                </div>
                              ))
                            ) : (
                              <p className="text-center py-3 text-[#6B7280] dark:text-[#A0A0A0] text-[11px]">No items recorded</p>
                            )}
                          </div>
                          <div className="mt-2 pt-2 border-t border-dashed border-[#E5E7EB] dark:border-[#2A2A2A] flex justify-between text-xs">
                            <span className="text-[#6B7280] dark:text-[#A0A0A0] font-medium">Total</span>
                            <span className="font-bold text-[#171717] dark:text-[#F5F5F5]">₱{parseFloat(order.total_amount).toFixed(2)}</span>
                          </div>
                        </div>

                        <div className="space-y-3">
                          <div className="rounded-lg border border-[#E5E7EB] dark:border-[#2A2A2A] bg-white dark:bg-[#1A1A1A] p-3">
                            <h4 className="text-xs font-semibold text-gray-700 dark:text-[#E5E5E5] mb-2 flex items-center gap-1.5">
                              <User size={12} className="text-[#EA580C]" /> Customer
                            </h4>
                            <div className="space-y-1.5">
                              <div>
                                <p className="text-[9px] font-semibold text-[#6B7280] dark:text-[#A0A0A0] uppercase tracking-widest">Name</p>
                                <p className="text-xs font-medium text-[#171717] dark:text-[#F5F5F5]">{order.customer_name}</p>
                              </div>
                              <div>
                                <p className="text-[9px] font-semibold text-[#6B7280] dark:text-[#A0A0A0] uppercase tracking-widest">Phone</p>
                                <p className="text-xs font-medium text-[#3B82F6]">{order.customer_phone}</p>
                              </div>
                            </div>
                          </div>

                          <div className="rounded-lg border border-orange-200 dark:border-orange-500/30 bg-orange-50/50 p-3">
                            <h4 className="text-xs font-semibold text-gray-700 dark:text-[#E5E5E5] mb-2 flex items-center gap-1.5">
                              <Truck size={12} className="text-[#EA580C]" /> Delivery
                            </h4>
                            <div className="space-y-1.5">
                              <div>
                                <p className="text-[9px] font-semibold text-[#6B7280] dark:text-[#A0A0A0] uppercase tracking-widest">Address</p>
                                <p className="text-xs font-medium text-[#171717] dark:text-[#F5F5F5]">{order.delivery_address || 'Mocked Address 123'}</p>
                              </div>
                              {order.special_instructions && (
                                <div className="rounded-md bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/30 px-2 py-1.5">
                                  <p className="text-[9px] font-semibold text-amber-700 dark:text-amber-400 uppercase tracking-widest">Delivery Note</p>
                                  <p className="text-xs font-medium text-[#171717] dark:text-[#F5F5F5] whitespace-pre-wrap">{order.special_instructions}</p>
                                </div>
                              )}
                              <div className="flex items-center justify-between">
                                <div>
                                  <p className="text-[9px] font-semibold text-[#6B7280] dark:text-[#A0A0A0] uppercase tracking-widest">City</p>
                                  <p className="text-xs font-medium text-[#171717] dark:text-[#F5F5F5]">{order.delivery_city || 'Campus Town'}</p>
                                </div>
                                <span className="text-[9px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-200 dark:border-emerald-500/30 uppercase tracking-wide">Standard</span>
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
                  <tr className="border-b border-[#E5E7EB] dark:border-[#2A2A2A] bg-[#FAFAFA] dark:bg-[#111111]">
                    <th className="text-left px-3 py-2.5 text-[10px] font-semibold text-[#6B7280] dark:text-[#A0A0A0] uppercase tracking-wider">Order</th>
                    <th className="text-left px-3 py-2.5 text-[10px] font-semibold text-[#6B7280] dark:text-[#A0A0A0] uppercase tracking-wider">Customer</th>
                    <th className="text-left px-3 py-2.5 text-[10px] font-semibold text-[#6B7280] dark:text-[#A0A0A0] uppercase tracking-wider hidden sm:table-cell">Time</th>
                    <th className="text-left px-3 py-2.5 text-[10px] font-semibold text-[#6B7280] dark:text-[#A0A0A0] uppercase tracking-wider hidden md:table-cell">Items</th>
                    <th className="text-right px-3 py-2.5 text-[10px] font-semibold text-[#6B7280] dark:text-[#A0A0A0] uppercase tracking-wider">Amount</th>
                    <th className="text-left px-3 py-2.5 text-[10px] font-semibold text-[#6B7280] dark:text-[#A0A0A0] uppercase tracking-wider">Status</th>
                    <th className="text-right px-3 py-2.5 text-[10px] font-semibold text-[#6B7280] dark:text-[#A0A0A0] uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E5E7EB] dark:divide-[#2A2A2A]">
                  {orders.map(order => (
                    <tr key={order.id} className="hover:bg-[#FAFAFA] dark:hover:bg-white/5 transition-colors">
                      <td className="px-3 py-2.5">
                        <span className="font-semibold text-[#171717] dark:text-[#F5F5F5]">#{order.id}</span>
                      </td>
                      <td className="px-3 py-2.5">
                        <div>
                          <p className="font-medium text-[#171717] dark:text-[#F5F5F5] truncate max-w-[140px]">{order.customer_name}</p>
                          <p className="text-[10px] text-[#6B7280] dark:text-[#A0A0A0] truncate max-w-[140px]">{order.customer_phone}</p>
                        </div>
                      </td>
                      <td className="px-3 py-2.5 hidden sm:table-cell">
                        <div className="flex items-center gap-1 text-[#6B7280] dark:text-[#A0A0A0]">
                          <Clock size={10} className="text-gray-400 dark:text-[#6B7280]" />
                          {new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </td>
                      <td className="px-3 py-2.5 hidden md:table-cell">
                        <div className="flex flex-wrap gap-1 max-w-[200px]">
                          {(order.items || []).slice(0, 3).map((item, idx) => (
                            <span key={idx} className="inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-gray-100 dark:bg-[#222222] text-gray-600 dark:text-[#A0A0A0] rounded text-[10px]">
                              {item.quantity}× {item.name.length > 12 ? item.name.slice(0, 12) + '…' : item.name}
                            </span>
                          ))}
                          {(order.items || []).length > 3 && (
                            <span className="inline-flex items-center px-1.5 py-0.5 bg-gray-100 dark:bg-[#222222] text-gray-400 dark:text-[#6B7280] rounded text-[10px]">+{order.items.length - 3}</span>
                          )}
                        </div>
                      </td>
                      <td className="px-3 py-2.5 text-right">
                        <span className="font-bold text-[#171717] dark:text-[#F5F5F5]">₱{parseFloat(order.total_amount).toFixed(2)}</span>
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
                                  ? 'bg-white dark:bg-[#1A1A1A] border-red-200 dark:border-red-500/30 text-red-500 hover:bg-red-50'
                                  : 'bg-[#EA580C] border-[#EA580C] text-white hover:bg-[#DC2626]'
                                  }`}
                              >
                                {status.charAt(0).toUpperCase() + status.slice(1)}
                              </button>
                            ))
                          ) : (
                            <div className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 text-[10px] font-semibold bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/30 px-2 py-1 rounded-md">
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
