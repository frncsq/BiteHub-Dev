import { useState, useEffect } from 'react';
import { createApiClient } from '../../services/apiClient';
import { Package, Clock, CheckCircle2, ChevronRight, AlertCircle, Truck, TrendingUp } from 'lucide-react';

function OwnerOrders() {
  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [expandedOrderId, setExpandedOrderId] = useState(null);

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
      case 'pending': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'accepted': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'preparing': return 'bg-purple-100 text-purple-700 border-purple-200';
      case 'ready': return 'bg-orange-100 text-orange-700 border-orange-200';
      case 'delivered':
      case 'completed': return 'bg-green-100 text-green-700 border-green-200';
      case 'cancelled': return 'bg-red-100 text-red-700 border-red-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
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
    return <div className="flex justify-center items-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div></div>;
  }

  return (
    <div className="p-4 md:p-8">
      <div className="max-w-[1400px] mx-auto space-y-6 md:space-y-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-gray-900">Order Management</h1>
            <p className="text-gray-500 mt-1">Manage incoming orders and update status in real time.</p>
          </div>
          <button
            onClick={() => fetchOrders()}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-white border border-gray-200 rounded-xl font-semibold text-gray-700 hover:bg-gray-50 transition-all duration-200 shadow-sm hover:shadow"
          >
            <TrendingUp size={18} className="text-orange-500" /> Refresh Orders
          </button>
        </div>

        {error && <div className="p-4 bg-red-50 text-red-600 rounded-xl flex items-center gap-2"><AlertCircle size={18} /> {error}</div>}

        <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
          {orders.length === 0 ? (
            <div className="text-center py-16">
              <Package size={44} className="mx-auto text-gray-300 mb-4" />
              <h3 className="text-xl font-bold text-gray-900">No active orders</h3>
              <p className="text-gray-500">When customers place orders, they will appear here.</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {orders.map(order => (
                <div key={order.id} className="group transition-colors hover:bg-gray-50/60">
                  <div
                    className="p-4 sm:p-5 md:p-6 cursor-pointer select-none"
                    onClick={() => setExpandedOrderId(expandedOrderId === order.id ? null : order.id)}
                  >
                    <div className="flex flex-col xl:flex-row xl:items-center gap-4 xl:gap-6">
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                          <h3 className="text-lg sm:text-xl font-bold text-gray-900">Order #{order.id}</h3>
                          <span className={`px-2.5 py-1 text-[11px] font-bold rounded-full border ${getStatusColor(order.order_status)} uppercase tracking-wide`}>
                            {order.order_status}
                          </span>
                        </div>
                        <p className="text-sm text-gray-500 flex flex-wrap items-center gap-2 mt-1.5">
                          <Clock size={14} className="text-gray-400" />
                          {new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          <span className="text-gray-300">•</span>
                          <span className="truncate">{order.customer_name}</span>
                        </p>
                      </div>

                      <div className="flex items-center justify-between xl:justify-end gap-4">
                        <div className="text-left xl:text-right">
                          <p className="text-xs uppercase tracking-wide text-gray-400 font-semibold">Amount</p>
                          <p className="text-xl sm:text-2xl font-bold text-orange-600">₱{parseFloat(order.total_amount).toFixed(2)}</p>
                        </div>

                        <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                          {getNextStatusOptions(order.order_status).length > 0 ? (
                            <div className="flex flex-wrap justify-end gap-2">
                              {getNextStatusOptions(order.order_status).map(status => (
                                <button
                                  key={status}
                                  onClick={() => updateOrderStatus(order.id, status)}
                                  className={`px-3 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all duration-200 border ${status === 'cancelled'
                                    ? 'bg-white border-red-200 text-red-600 hover:bg-red-50'
                                    : 'bg-orange-600 border-orange-600 text-white hover:bg-orange-700'
                                    }`}
                                >
                                  Mark as {status}
                                </button>
                              ))}
                            </div>
                          ) : (
                            <div className="flex items-center gap-1.5 text-green-700 font-semibold bg-green-50 border border-green-200 px-3 py-2 rounded-lg text-xs sm:text-sm">
                              <CheckCircle2 size={14} /> Finalized
                            </div>
                          )}

                          <div className={`ml-1 transition-transform duration-300 ${expandedOrderId === order.id ? 'rotate-90 text-orange-600' : 'text-gray-300'}`}>
                            <ChevronRight size={22} />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {expandedOrderId === order.id && (
                    <div className="px-4 sm:px-5 md:px-6 pb-5 md:pb-6 pt-2 border-t border-gray-100 animate-in slide-in-from-top-4 duration-300">
                      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5 md:gap-6 mt-3">
                        <div className="rounded-2xl border border-gray-100 bg-white p-4 md:p-5 shadow-sm">
                          <h4 className="flex items-center gap-2 font-bold text-gray-900 mb-4">
                            <Package size={17} className="text-orange-500" /> Items Ordered ({(order.items || []).length})
                          </h4>
                          <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1">
                            {(order.items || []).length > 0 ? (
                              order.items.map((item, idx) => (
                                <div key={idx} className="flex justify-between items-center p-3 rounded-xl border border-gray-100 bg-gray-50/60 hover:bg-gray-50 transition-colors">
                                  <div className="flex items-center gap-3 min-w-0">
                                    <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-orange-100 text-orange-700 font-bold text-sm flex-shrink-0">
                                      {item.quantity}x
                                    </span>
                                    <span className="font-medium text-gray-800 truncate">{item.name}</span>
                                  </div>
                                  <span className="font-semibold text-gray-900">₱{(parseFloat(item.price) * item.quantity).toFixed(2)}</span>
                                </div>
                              ))
                            ) : (
                              <div className="text-center py-4 text-gray-400">No items recorded</div>
                            )}
                          </div>
                          <div className="mt-4 pt-3 border-t border-dashed border-gray-200 flex justify-between text-sm">
                            <span className="font-semibold text-gray-500 uppercase tracking-wide">Subtotal</span>
                            <span className="font-bold text-gray-900">₱{parseFloat(order.total_amount).toFixed(2)}</span>
                          </div>
                        </div>

                        <div className="space-y-4">
                          <div className="rounded-2xl border border-gray-100 bg-gray-50/70 p-4 md:p-5 shadow-sm">
                            <h4 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                              <AlertCircle size={17} className="text-orange-500" /> Customer Information
                            </h4>
                            <div className="space-y-3">
                              <div>
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Full Name</p>
                                <p className="font-semibold text-gray-800 text-base">{order.customer_name}</p>
                              </div>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div>
                                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Phone Number</p>
                                  <p className="font-semibold text-blue-600">{order.customer_phone}</p>
                                </div>
                                <div>
                                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Contact Type</p>
                                  <p className="font-semibold text-gray-600">Mobile • WhatsApp</p>
                                </div>
                              </div>
                            </div>
                          </div>

                          <div className="rounded-2xl border border-orange-100 bg-orange-50/50 p-4 md:p-5 shadow-sm">
                            <h4 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                              <Truck size={17} className="text-orange-600" /> Delivery Address
                            </h4>
                            <div className="space-y-3">
                              <div>
                                <p className="text-[10px] font-bold text-orange-500 uppercase tracking-widest">Full Address</p>
                                <p className="font-semibold text-gray-800">{order.delivery_address || 'Mocked Address 123'}</p>
                              </div>
                              <div className="flex justify-between items-center bg-white p-3 rounded-xl border border-orange-100">
                                <div>
                                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">City</p>
                                  <p className="font-semibold text-gray-800">{order.delivery_city || 'Campus Town'}</p>
                                </div>
                                <div className="w-px h-8 bg-gray-200" />
                                <div className="text-right">
                                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Service</p>
                                  <p className="font-semibold text-emerald-600 uppercase text-xs">Standard Delivery</p>
                                </div>
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
          )}
        </div>
      </div>
    </div>
  );
}

export default OwnerOrders;
