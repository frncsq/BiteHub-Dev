import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createApiClient } from '../../services/apiClient';
import { Users, Store, ClipboardList, TrendingUp, DollarSign, ArrowRight } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer } from 'recharts';

function AdminDashboard() {
  const navigate = useNavigate();
  const [data, setData] = useState({
    totalUsers: 0,
    totalRestaurants: 0,
    totalOrders: 0,
    totalRevenue: 0,
    revenueTrend: []
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('authToken');
    if (!token) {
      console.warn("Unauthorized Admin Access attempt.");
      navigate('/admin-login');
      return;
    }

    const fetchData = async () => {
      try {
        const apiClient = createApiClient();
        const res = await apiClient.get('/admin/analytics');
        if (res.data.success) {
          setData(res.data.analytics);
        }
      } catch (err) {
        console.error("Failed to fetch analytics", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-full min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  const kpis = [
    { title: 'Total Users', value: data.totalUsers.toLocaleString(), icon: Users, color: 'text-indigo-600', bg: 'bg-indigo-100', trend: '+12% this month' },
    { title: 'Total Vendors', value: data.totalRestaurants.toLocaleString(), icon: Store, color: 'text-blue-600', bg: 'bg-blue-100', trend: '+4 new this week' },
    { title: 'Total Orders', value: data.totalOrders.toLocaleString(), icon: ClipboardList, color: 'text-emerald-600', bg: 'bg-emerald-100', trend: '+18% vs last week' },
    { title: 'Platform Revenue', value: `$${parseFloat(data.totalRevenue).toLocaleString(undefined, {minimumFractionDigits: 2})}`, icon: DollarSign, color: 'text-amber-600', bg: 'bg-amber-100', trend: '+22.5% vs last month' },
  ];

  return (
    <div className="space-y-8 animate-fade-in relative z-10 w-full h-full flex flex-col">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-4xl font-extrabold text-slate-800 tracking-tight">System Status</h1>
          <p className="text-slate-500 mt-2 text-sm font-medium">BiteHub Platform Overview</p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {kpis.map((kpi, index) => {
          const Icon = kpi.icon;
          return (
            <div key={index} className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 hover:shadow-lg transition-all duration-300 hover:-translate-y-1 relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-slate-50 rounded-full -mr-16 -mt-16 transition-transform group-hover:scale-110" />
              <div className="flex items-center gap-4 relative z-10">
                <div className={`p-4 rounded-2xl ${kpi.bg} ${kpi.color}`}>
                  <Icon size={24} />
                </div>
                <div>
                  <h3 className="text-slate-500 text-sm font-semibold">{kpi.title}</h3>
                  <p className="text-2xl font-bold text-slate-800 tracking-tight mt-1">{kpi.value}</p>
                </div>
              </div>
              <div className="mt-4 flex items-center gap-1.5 text-emerald-600 text-sm font-medium relative z-10 bg-emerald-50 w-max px-2.5 py-1 rounded-full">
                <TrendingUp size={14} />
                {kpi.trend}
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 min-h-0">
         <div className="lg:col-span-2 bg-white rounded-3xl p-6 shadow-sm border border-slate-100 flex flex-col h-[400px]">
            <h2 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
               <TrendingUp size={20} className="text-blue-500" /> Revenue Growth (30 Days)
            </h2>
            <div className="flex-1 min-h-0 relative -ml-4">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data.revenueTrend}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                  <XAxis dataKey="date" 
                    tickFormatter={(val) => new Date(val).toLocaleDateString(undefined, {month: 'short', day: 'numeric'})} 
                    axisLine={false} tickLine={false} tick={{fill: '#64748B', fontSize: 12}} dy={10} 
                  />
                  <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748B', fontSize: 12}} 
                         tickFormatter={(val) => `$${val}`} />
                  <RechartsTooltip 
                     contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                     formatter={(value) => [`$${value}`, 'Revenue']}
                     labelFormatter={(label) => new Date(label).toLocaleDateString()}
                  />
                  <Line type="monotone" dataKey="revenue" stroke="#3B82F6" strokeWidth={4} dot={{ r: 4, strokeWidth: 2, fill: '#fff' }} activeDot={{ r: 8, strokeWidth: 0 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
         </div>

         <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-3xl p-6 shadow-lg text-white flex flex-col justify-between relative overflow-hidden h-[400px]">
             <div className="absolute -top-24 -right-24 w-64 h-64 bg-blue-500/20 rounded-full blur-3xl pointer-events-none" />
             <div>
                <h2 className="text-xl font-bold mb-2">Quick Actions</h2>
                <p className="text-slate-400 text-sm">Manage system resources instantly</p>
             </div>
             
             <div className="space-y-3 mt-6 relative z-10 w-full">
                <button className="w-full bg-white/10 hover:bg-white/20 border border-white/20 text-left px-4 py-3 rounded-xl transition-colors font-medium text-sm flex justify-between items-center group">
                   Add New Vendor <ArrowRight size={16} className="text-slate-400 group-hover:text-white" />
                </button>
                <button className="w-full bg-white/10 hover:bg-white/20 border border-white/20 text-left px-4 py-3 rounded-xl transition-colors font-medium text-sm flex justify-between items-center group">
                   Broadcast System Message <ArrowRight size={16} className="text-slate-400 group-hover:text-white" />
                </button>
                <button className="w-full bg-white/10 hover:bg-white/20 border border-white/20 text-left px-4 py-3 rounded-xl transition-colors font-medium text-sm flex justify-between items-center group">
                   Generate Payout Report <ArrowRight size={16} className="text-slate-400 group-hover:text-white" />
                </button>
             </div>
         </div>
      </div>
    </div>
  );
}

export default AdminDashboard;
