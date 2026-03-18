import { useState, useEffect } from 'react';
import axios from 'axios';
import { DollarSign, ShoppingBag, Clock, TrendingUp } from 'lucide-react';

function OwnerDashboard() {
  const [metrics, setMetrics] = useState({
    totalOrders: 0,
    revenue: 0,
    activeOrders: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
        const response = await axios.get(`${baseURL}/api/owner/dashboard`, { withCredentials: true });
        if (response.data.success) {
          setMetrics(response.data.metrics);
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
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard Overview</h1>
        <button className="px-4 py-2 bg-orange-100 text-orange-600 font-semibold rounded-lg hover:bg-orange-200 transition">
          Download Report
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Revenue Card */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-start gap-4 hover:shadow-md transition">
          <div className="p-3 bg-green-100 text-green-600 rounded-xl">
            <DollarSign size={24} />
          </div>
          <div>
            <p className="text-gray-500 text-sm font-medium">Total Revenue</p>
            <h3 className="text-3xl font-bold text-gray-900">${metrics.revenue.toFixed(2)}</h3>
            <p className="text-sm text-green-600 flex items-center gap-1 mt-1 font-medium">
              <TrendingUp size={16} /> +12% this week
            </p>
          </div>
        </div>

        {/* Total Orders */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-start gap-4 hover:shadow-md transition">
          <div className="p-3 bg-blue-100 text-blue-600 rounded-xl">
            <ShoppingBag size={24} />
          </div>
          <div>
            <p className="text-gray-500 text-sm font-medium">Total Orders</p>
            <h3 className="text-3xl font-bold text-gray-900">{metrics.totalOrders}</h3>
            <p className="text-sm text-gray-400 mt-1">All time</p>
          </div>
        </div>

        {/* Active Orders */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-start gap-4 hover:shadow-md transition">
          <div className="p-3 bg-orange-100 text-orange-600 rounded-xl">
            <Clock size={24} />
          </div>
          <div>
            <p className="text-gray-500 text-sm font-medium">Active Orders</p>
            <h3 className="text-3xl font-bold text-gray-900">{metrics.activeOrders}</h3>
            <p className="text-sm text-orange-600 font-medium mt-1">Requires attention</p>
          </div>
        </div>
      </div>
      
      {/* Real-time Order Feed Placeholder */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100">
           <h2 className="text-xl font-bold text-gray-900">Recent Activity</h2>
        </div>
        <div className="p-6 text-center text-gray-500 py-12">
           <p>Your recent orders and notifications will appear here.</p>
        </div>
      </div>
    </div>
  );
}

export default OwnerDashboard;
