import { useState, useEffect } from 'react';
import axios from 'axios';
import { TrendingUp, Calendar, DollarSign, Activity } from 'lucide-react';

function OwnerAnalytics() {
  const [analytics, setAnalytics] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
        const response = await axios.get(`${baseURL}/api/owner/analytics`, { withCredentials: true });
        if (response.data.success) {
          setAnalytics(response.data.analytics);
        }
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load analytics');
      } finally {
        setIsLoading(false);
      }
    };
    fetchAnalytics();
  }, []);

  if (isLoading && analytics.length === 0) {
    return <div className="flex justify-center items-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div></div>;
  }

  // Calculate totals
  const totalRevenue = analytics.reduce((sum, day) => sum + parseFloat(day.daily_revenue || 0), 0);
  const totalOrders = analytics.reduce((sum, day) => sum + parseInt(day.daily_orders || 0), 0);
  const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
  
  // Find max revenue for scaling simple bars
  const maxRevenue = Math.max(...analytics.map(day => parseFloat(day.daily_revenue || 0)), 1); // Avoid division by 0

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Analytics & Reports</h1>
        <p className="text-gray-500 mt-1">Track your restaurant's performance over the last 30 days.</p>
      </div>

      {error && <div className="p-4 bg-red-50 text-red-600 rounded-xl">{error}</div>}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-start gap-4">
          <div className="p-3 bg-green-100 text-green-600 rounded-xl">
            <DollarSign size={24} />
          </div>
          <div>
            <p className="text-gray-500 text-sm font-medium">30-Day Revenue</p>
            <h3 className="text-3xl font-bold text-gray-900">${totalRevenue.toFixed(2)}</h3>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-start gap-4">
          <div className="p-3 bg-blue-100 text-blue-600 rounded-xl">
            <Activity size={24} />
          </div>
          <div>
            <p className="text-gray-500 text-sm font-medium">30-Day Orders</p>
            <h3 className="text-3xl font-bold text-gray-900">{totalOrders}</h3>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-start gap-4">
          <div className="p-3 bg-purple-100 text-purple-600 rounded-xl">
            <TrendingUp size={24} />
          </div>
          <div>
            <p className="text-gray-500 text-sm font-medium">Average Order Value</p>
            <h3 className="text-3xl font-bold text-gray-900">${avgOrderValue.toFixed(2)}</h3>
          </div>
        </div>
      </div>

      {/* Revenue Chart (Simple CSS Bars) */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-gray-900">Daily Revenue Trend</h2>
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Calendar size={16} /> Last 30 Days
          </div>
        </div>
        
        {analytics.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <Activity size={32} className="mx-auto text-gray-300 mb-3" />
            <p>Not enough data to display analytics.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {analytics.map((day, index) => {
              const revenue = parseFloat(day.daily_revenue || 0);
              const percentage = Math.max((revenue / maxRevenue) * 100, 1);
              const dateObj = new Date(day.date);
              
              return (
                <div key={index} className="flex items-center gap-4 group">
                  <div className="w-24 text-sm font-medium text-gray-600">
                    {dateObj.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                  </div>
                  <div className="flex-1 h-8 bg-gray-50 rounded-lg overflow-hidden flex items-center relative">
                    <div 
                      className="h-full bg-orange-200 group-hover:bg-orange-300 transition-colors duration-300 rounded-lg"
                      style={{ width: `${percentage}%` }}
                    ></div>
                    <span className="absolute left-3 text-sm font-bold text-orange-900">
                      ${revenue.toFixed(2)}
                    </span>
                  </div>
                  <div className="w-20 text-right text-sm text-gray-500">
                    {day.daily_orders} orders
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default OwnerAnalytics;
