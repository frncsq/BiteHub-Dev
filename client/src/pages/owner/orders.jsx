import { useState, useEffect } from 'react';
import axios from 'axios';
import { Package, Clock, CheckCircle2, ChevronRight, AlertCircle } from 'lucide-react';

function OwnerOrders() {
  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchOrders = async () => {
    try {
      setIsLoading(true);
      const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      const response = await axios.get(`${baseURL}/api/owner/orders`, { withCredentials: true });
      if (response.data.success) {
        setOrders(response.data.orders);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load orders');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
    const interval = setInterval(fetchOrders, 30000); // refresh every 30s
    return () => clearInterval(interval);
  }, []);

  const updateOrderStatus = async (id, newStatus) => {
    try {
      const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      await axios.put(`${baseURL}/api/owner/orders/${id}/status`, { status: newStatus }, { withCredentials: true });
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
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Live Orders</h1>
          <p className="text-gray-500 mt-1">Manage incoming orders in real-time.</p>
        </div>
        <button onClick={fetchOrders} className="px-4 py-2 bg-white border border-gray-200 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 transition shadow-sm">
          Refresh List
        </button>
      </div>

      {error && <div className="p-4 bg-red-50 text-red-600 rounded-xl flex items-center gap-2"><AlertCircle size={20} /> {error}</div>}

      <div className="space-y-4">
        {orders.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-gray-300">
            <Package size={48} className="mx-auto text-gray-300 mb-4" />
            <h3 className="text-xl font-bold text-gray-900">No active orders</h3>
            <p className="text-gray-500">When customers place orders, they will appear here.</p>
          </div>
        ) : (
          orders.map(order => (
            <div key={order.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex flex-col md:flex-row gap-6 hover:shadow-md transition">
              {/* Order Info */}
              <div className="flex-1 space-y-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                      Order #{order.id}
                      <span className={`px-3 py-1 text-xs font-bold rounded-full border ${getStatusColor(order.order_status)} uppercase tracking-wider`}>
                        {order.order_status}
                      </span>
                    </h3>
                    <p className="text-gray-500 flex items-center gap-2 mt-1">
                      <Clock size={16} /> {new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-500">Total Amount</p>
                    <p className="text-2xl font-bold text-orange-600">${parseFloat(order.total_amount).toFixed(2)}</p>
                  </div>
                </div>

                <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                  <h4 className="font-semibold text-gray-900 mb-2">Customer Details</h4>
                  <p className="text-gray-700">{order.customer_name}</p>
                  <p className="text-gray-500 text-sm">{order.delivery_address || 'Pickup'}</p>
                  <p className="text-gray-500 text-sm">{order.customer_phone}</p>
                </div>
              </div>

              {/* Order Actions */}
              <div className="w-full md:w-64 border-t md:border-t-0 md:border-l border-gray-100 pt-6 md:pt-0 md:pl-6 flex flex-col justify-center gap-3">
                <h4 className="text-sm font-semibold text-gray-500 mb-1 uppercase tracking-wider">Update Status</h4>
                {getNextStatusOptions(order.order_status).length > 0 ? (
                  getNextStatusOptions(order.order_status).map(status => (
                    <button
                      key={status}
                      onClick={() => updateOrderStatus(order.id, status)}
                      className={`w-full py-3 px-4 rounded-xl font-bold flex items-center justify-between transition-all ${
                        status === 'cancelled' 
                          ? 'bg-red-50 text-red-600 hover:bg-red-100' 
                          : 'bg-orange-600 text-white hover:bg-orange-700 shadow-md hover:shadow-lg'
                      }`}
                    >
                      <span className="capitalize">Mark as {status}</span>
                      {status !== 'cancelled' && <ChevronRight size={18} />}
                    </button>
                  ))
                ) : (
                  <div className="flex items-center gap-2 text-green-600 font-bold bg-green-50 p-3 rounded-xl justify-center">
                    <CheckCircle2 size={20} /> Order Finalized
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default OwnerOrders;
