import { useState, useEffect } from 'react';
import axios from 'axios';
import { DollarSign, ShoppingBag, Clock, TrendingUp, List } from 'lucide-react';

function OwnerDashboard() {
  const [metrics, setMetrics] = useState({
    totalOrders: 0,
    revenue: 0,
    activeOrders: 0,
    menuItems: 0
  });
  const [recentOrders, setRecentOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
        const response = await axios.get(`${baseURL}/api/owner/dashboard`, { withCredentials: true });
        if (response.data.success) {
          setMetrics(response.data.metrics);
          if (response.data.recentOrders) setRecentOrders(response.data.recentOrders);
        } else {
          setError('Failed to fetch dashboard data');
        }
      } catch (err) {
        setError(err.response?.data?.message || 'Error loading dashboard');
      } finally {
        setIsLoading(false);
      }
    };
    fetchDashboardData();
  }, []);

  if (isLoading) {
    return <div className="flex h-64 items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-4 border-orange-500 border-t-transparent"></div></div>;
  }

  if (error) {
    return <div className="text-red-500 font-medium p-4 bg-red-50 rounded-xl">{error}</div>;
  }

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-gray-900 to-gray-600 tracking-tight">Dashboard Overview</h1>
          <p className="text-gray-500 mt-1 font-medium">Welcome back! Here's what's happening today.</p>
        </div>
        <button className="px-6 py-2.5 bg-gradient-to-r from-orange-600 to-orange-500 text-white font-bold rounded-xl shadow-lg shadow-orange-500/30 hover:shadow-orange-500/50 hover:-translate-y-0.5 transition-all duration-300">
          Download Report
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Revenue Card (Gradient) */}
        <div className="relative overflow-hidden p-6 rounded-3xl shadow-xl shadow-green-900/10 bg-gradient-to-br from-emerald-500 to-green-700 text-white transform hover:-translate-y-1 hover:shadow-2xl hover:shadow-green-900/20 transition-all duration-300">
          <div className="absolute top-0 right-0 -mt-4 -mr-4 bg-white/20 rounded-full w-24 h-24 blur-2xl"></div>
          <div className="flex justify-between items-start relative z-10">
            <div>
              <p className="text-emerald-100 text-sm font-semibold tracking-wide uppercase">Total Revenue</p>
              <h3 className="text-4xl font-extrabold mt-2 tracking-tight">${metrics.revenue.toLocaleString('en-US', {minimumFractionDigits: 2})}</h3>
            </div>
            <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-sm">
              <DollarSign size={24} className="text-white" />
            </div>
          </div>
          <p className="text-sm text-emerald-100 flex items-center gap-1 mt-6 font-medium bg-black/10 w-max px-3 py-1 rounded-full">
            <TrendingUp size={14} /> Peak Performance
          </p>
        </div>

        {/* Total Orders */}
        <div className="relative overflow-hidden p-6 rounded-3xl shadow-xl shadow-blue-900/10 bg-white border border-gray-100 transform hover:-translate-y-1 hover:shadow-2xl hover:shadow-blue-900/5 transition-all duration-300">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-gray-400 text-sm font-bold tracking-wide uppercase">Total Orders</p>
              <h3 className="text-4xl font-extrabold text-gray-900 mt-2 tracking-tight">{metrics.totalOrders}</h3>
            </div>
            <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl">
              <ShoppingBag size={24} />
            </div>
          </div>
          <p className="text-sm text-gray-500 mt-6 font-medium flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-blue-500 block"></span> Since Launch
          </p>
        </div>

        {/* Total Menu Items */}
        <div className="relative overflow-hidden p-6 rounded-3xl shadow-xl shadow-purple-900/10 bg-white border border-gray-100 transform hover:-translate-y-1 hover:shadow-2xl hover:shadow-purple-900/5 transition-all duration-300">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-gray-400 text-sm font-bold tracking-wide uppercase">Menu Items</p>
              <h3 className="text-4xl font-extrabold text-gray-900 mt-2 tracking-tight">{metrics.menuItems}</h3>
            </div>
            <div className="p-3 bg-purple-50 text-purple-600 rounded-2xl">
              <List size={24} />
            </div>
          </div>
          <p className="text-sm text-gray-500 mt-6 font-medium flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-purple-500 block"></span> Active Database
          </p>
        </div>

        {/* Active Orders (Gradient) */}
        <div className="relative overflow-hidden p-6 rounded-3xl shadow-xl shadow-orange-900/10 bg-gradient-to-br from-orange-500 to-red-600 text-white transform hover:-translate-y-1 hover:shadow-2xl hover:shadow-orange-900/20 transition-all duration-300">
          <div className="absolute top-0 right-0 -mt-4 -mr-4 bg-white/20 rounded-full w-24 h-24 blur-2xl"></div>
          <div className="flex justify-between items-start relative z-10">
            <div>
              <p className="text-orange-100 text-sm font-semibold tracking-wide uppercase">Live Orders</p>
              <h3 className="text-4xl font-extrabold mt-2 tracking-tight">{metrics.activeOrders}</h3>
            </div>
            <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-sm">
              <Clock size={24} className="text-white" />
            </div>
          </div>
          <p className="text-sm text-orange-100 flex items-center gap-1 mt-6 font-medium bg-black/10 w-max px-3 py-1 rounded-full animate-pulse">
            <span className="w-2 h-2 rounded-full bg-white block"></span> Requires Attention
          </p>
        </div>
      </div>
      
      {/* Real-time Order Feed */}
      <div className="bg-white rounded-3xl shadow-xl shadow-gray-200/40 border border-gray-100/50 overflow-hidden backdrop-blur-md">
        <div className="p-8 border-b border-gray-50 flex justify-between items-center bg-gradient-to-r from-gray-50/50 to-white">
           <div>
             <h2 className="text-2xl font-extrabold text-gray-900 tracking-tight">Recent Activity Feed</h2>
             <p className="text-sm text-gray-500 mt-1 font-medium">Watch your orders arrive in real-time.</p>
           </div>
           <a href="/owner/orders" className="text-orange-600 font-bold text-sm bg-orange-50 px-4 py-2 rounded-xl hover:bg-orange-100 hover:shadow-md transition-all duration-300 flex items-center gap-2">
             View All Orders
           </a>
        </div>
        
        {recentOrders.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 bg-gray-50/30">
             <div className="w-20 h-20 bg-orange-50 rounded-full flex items-center justify-center mb-4 inner-shadow">
               <Clock className="text-orange-300" size={32} />
             </div>
             <p className="text-gray-500 font-medium">Awaiting incoming orders...</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {recentOrders.map((order, index) => (
              <div 
                key={order.id} 
                className="p-6 flex items-center justify-between hover:bg-orange-50/30 transition-all duration-300 group"
                style={{ animationDelay: `${index * 50}ms`, animationFillMode: 'both' }}
              >
                <div className="flex items-center gap-5">
                  <div className="w-12 h-12 rounded-2xl bg-gray-50 border border-gray-100 flex items-center justify-center font-bold text-gray-500 group-hover:bg-orange-100 group-hover:text-orange-600 transition-colors">
                    #{order.id}
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900 text-lg flex items-center gap-3">
                      {order.customer_name || 'Customer'}
                      <span className={`text-[10px] px-3 py-1 rounded-full uppercase font-extrabold tracking-wider ${
                        order.status === 'delivered' ? 'bg-green-100 text-green-700' :
                        order.status === 'cancelled' ? 'bg-red-100 text-red-700' :
                        order.status === 'preparing' ? 'bg-blue-100 text-blue-700' :
                        'bg-orange-100 text-orange-700'
                      }`}>
                        {order.status}
                      </span>
                    </h4>
                    <p className="text-sm text-gray-400 font-medium mt-0.5 flex items-center gap-1">
                      <Clock size={12}/> {new Date(order.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • Delivery Order
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-extrabold text-gray-900 tracking-tight transition-transform group-hover:scale-105 origin-right">
                    ${parseFloat(order.total_amount).toLocaleString('en-US', {minimumFractionDigits: 2})}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default OwnerDashboard;
