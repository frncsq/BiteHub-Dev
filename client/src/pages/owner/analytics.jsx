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
    <div className="space-y-8 animate-fade-in max-w-6xl mx-auto pb-12">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-gray-900 to-gray-600 tracking-tight">Analytics & Reports</h1>
          <p className="text-gray-500 mt-1 font-medium">Deep-dive into your restaurant's performance metrics.</p>
        </div>
        <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-xl shadow-sm border border-gray-100">
          <Calendar size={18} className="text-orange-500" />
          <span className="font-semibold text-sm text-gray-700">Last 30 Days</span>
        </div>
      </div>

      {error && <div className="p-4 bg-red-50 border border-red-100 text-red-600 rounded-2xl font-medium shadow-sm">{error}</div>}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="relative overflow-hidden p-6 rounded-3xl shadow-lg border border-gray-100 bg-white group hover:-translate-y-1 hover:shadow-xl transition-all duration-300">
          <div className="absolute top-0 right-0 w-32 h-32 bg-green-50 rounded-full blur-3xl -mr-10 -mt-10 transition-transform group-hover:scale-150 duration-700"></div>
          <div className="flex justify-between items-start relative z-10">
            <div>
              <p className="text-gray-400 text-sm font-bold tracking-wide uppercase">30-Day Revenue</p>
              <h3 className="text-4xl font-extrabold text-gray-900 mt-2 tracking-tight">${totalRevenue.toLocaleString('en-US', {minimumFractionDigits: 2})}</h3>
            </div>
            <div className="p-4 bg-green-50 text-green-600 rounded-2xl shadow-inner border border-green-100/50">
              <DollarSign size={28} />
            </div>
          </div>
          <div className="mt-6 flex items-center gap-2">
            <span className="flex items-center gap-1 text-sm font-bold text-green-600 bg-green-50 px-2 py-1 rounded-lg">
              <TrendingUp size={14} /> Peak
            </span>
          </div>
        </div>

        <div className="relative overflow-hidden p-6 rounded-3xl shadow-lg border border-gray-100 bg-white group hover:-translate-y-1 hover:shadow-xl transition-all duration-300">
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50 rounded-full blur-3xl -mr-10 -mt-10 transition-transform group-hover:scale-150 duration-700"></div>
          <div className="flex justify-between items-start relative z-10">
            <div>
              <p className="text-gray-400 text-sm font-bold tracking-wide uppercase">30-Day Orders</p>
              <h3 className="text-4xl font-extrabold text-gray-900 mt-2 tracking-tight">{totalOrders}</h3>
            </div>
            <div className="p-4 bg-blue-50 text-blue-600 rounded-2xl shadow-inner border border-blue-100/50">
              <Activity size={28} />
            </div>
          </div>
          <div className="mt-6 flex items-center gap-2 text-sm text-gray-500 font-medium">
            <span className="w-2 h-2 rounded-full bg-blue-500 block"></span> Verified Transactions
          </div>
        </div>

        <div className="relative overflow-hidden p-6 rounded-3xl shadow-lg border border-gray-100 bg-white group hover:-translate-y-1 hover:shadow-xl transition-all duration-300">
          <div className="absolute top-0 right-0 w-32 h-32 bg-purple-50 rounded-full blur-3xl -mr-10 -mt-10 transition-transform group-hover:scale-150 duration-700"></div>
          <div className="flex justify-between items-start relative z-10">
            <div>
              <p className="text-gray-400 text-sm font-bold tracking-wide uppercase">Avg Order Value</p>
              <h3 className="text-4xl font-extrabold text-gray-900 mt-2 tracking-tight">${avgOrderValue.toFixed(2)}</h3>
            </div>
            <div className="p-4 bg-purple-50 text-purple-600 rounded-2xl shadow-inner border border-purple-100/50">
              <TrendingUp size={28} />
            </div>
          </div>
          <div className="mt-6 flex items-center gap-2 text-sm text-gray-500 font-medium">
            <span className="w-2 h-2 rounded-full bg-purple-500 block"></span> Per Customer Average
          </div>
        </div>
      </div>

      {/* Revenue Chart (Modern CSS Bars) */}
      <div className="bg-white rounded-3xl shadow-xl shadow-gray-200/40 border border-gray-100 p-8 backdrop-blur-sm relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-gray-50/50 pointer-events-none"></div>
        <div className="relative z-10">
          <div className="flex justify-between items-center mb-8 border-b border-gray-100 pb-4">
            <h2 className="text-2xl font-extrabold text-gray-900 tracking-tight">Daily Revenue Trend</h2>
            <div className="text-sm font-bold text-orange-600 bg-orange-50 px-3 py-1.5 rounded-xl border border-orange-100">
              Visual Timeline
            </div>
          </div>
          
          {analytics.length === 0 ? (
            <div className="text-center py-24 text-gray-400">
              <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-gray-100 inner-shadow">
                <Activity size={32} className="text-gray-300" />
              </div>
              <p className="font-semibold text-lg">Not enough data to map trends.</p>
              <p className="text-sm mt-1">Check back after your first few orders arrive.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {analytics.map((day, index) => {
                const revenue = parseFloat(day.daily_revenue || 0);
                const percentage = Math.max((revenue / maxRevenue) * 100, 1);
                const dateObj = new Date(day.date);
                
                return (
                  <div key={index} className="flex items-center gap-6 group">
                    <div className="w-24 text-sm font-bold text-gray-500 uppercase tracking-widest text-right">
                      {dateObj.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                    </div>
                    <div className="flex-1 h-10 bg-gray-50/80 rounded-2xl overflow-hidden flex items-center relative border border-gray-100/50">
                      <div 
                        className="h-full bg-gradient-to-r from-orange-400 to-orange-500 rounded-2xl relative shadow-sm"
                        style={{ width: `${percentage}%`, animation: `growWidth 1s ease-out forwards`, animationDelay: `${index * 50}ms`, transformOrigin: 'left', opacity: 0 }}
                      >
                         <style jsx>{`
                            @keyframes growWidth {
                              from { transform: scaleX(0); opacity: 0; }
                              to { transform: scaleX(1); opacity: 1; }
                            }
                         `}</style>
                      </div>
                      <span className="absolute left-4 text-sm font-extrabold text-white mix-blend-difference drop-shadow-md z-10 transition-transform group-hover:scale-110 origin-left">
                        ${revenue.toLocaleString('en-US', {minimumFractionDigits: 2})}
                      </span>
                    </div>
                    <div className="w-28 text-left">
                      <p className="text-sm font-bold text-gray-700">{day.daily_orders}</p>
                      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Orders</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default OwnerAnalytics;
