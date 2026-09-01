import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createApiClient } from '../../services/apiClient';
import { Users, Store, ClipboardList, TrendingUp, DollarSign, ArrowRight, Zap } from 'lucide-react';
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
  const [rotatingFlashSale, setRotatingFlashSale] = useState(false);
  const [flashResult, setFlashResult] = useState("");

  const handleRotateFlashSale = async () => {
    setRotatingFlashSale(true);
    setFlashResult("");
    try {
      const apiClient = createApiClient();
      const res = await apiClient.post('/admin/flash-sale/rotate');
      if (res.data.success) {
        setFlashResult(res.data.message);
      }
    } catch (err) {
      console.error("Failed to rotate flash sale", err);
      setFlashResult("Rotation failed.");
    } finally {
      setRotatingFlashSale(false);
      setTimeout(() => setFlashResult(""), 3000);
    }
  };

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
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#EA580C]"></div>
      </div>
    );
  }

  const kpis = [
    { title: 'Total Users', value: data.totalUsers.toLocaleString(), icon: Users, color: 'text-[#3B82F6]', bg: 'bg-blue-50', border: 'border-blue-100', trend: '+12% this month' },
    { title: 'Total Vendors', value: data.totalRestaurants.toLocaleString(), icon: Store, color: 'text-[#EA580C]', bg: 'bg-orange-50', border: 'border-orange-100', trend: '+4 new this week' },
    { title: 'Total Orders', value: data.totalOrders.toLocaleString(), icon: ClipboardList, color: 'text-[#16A34A]', bg: 'bg-green-50', border: 'border-green-100', trend: '+18% vs last week' },
    { title: 'Platform Revenue', value: `$${parseFloat(data.totalRevenue).toLocaleString(undefined, {minimumFractionDigits: 2})}`, icon: DollarSign, color: 'text-[#D97706]', bg: 'bg-amber-50', border: 'border-amber-100', trend: '+22.5% vs last month' },
  ];

  return (
    <div className="space-y-6 w-full h-full flex flex-col">
        <div className="flex justify-between items-center">
          <div className="min-w-0 pr-2">
            <h1 className="text-2xl sm:text-3xl font-bold text-[#171717] tracking-tight">System Status</h1>
            <p className="text-[#6B7280] mt-1 text-sm">BiteHub Platform Overview</p>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {kpis.map((kpi, index) => {
            const Icon = kpi.icon;
            return (
              <div key={index} className={`bg-white rounded-xl p-5 border ${kpi.border} transition-colors hover:border-[#E5E7EB]`}>
                <div className="flex items-center gap-3">
                  <div className={`p-3 rounded-xl ${kpi.bg} ${kpi.color}`}>
                    <Icon size={20} />
                  </div>
                  <div>
                    <p className="text-[#6B7280] text-xs font-medium uppercase tracking-wide">{kpi.title}</p>
                    <p className="text-xl font-bold text-[#171717] mt-0.5">{kpi.value}</p>
                  </div>
                </div>
                <div className="mt-3 flex items-center gap-1.5 text-[#16A34A] text-xs font-medium">
                  <TrendingUp size={12} />
                  {kpi.trend}
                </div>
              </div>
            );
          })}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 flex-1 min-h-0">
          <div className="lg:col-span-2 bg-white rounded-xl p-5 border border-[#E5E7EB] flex flex-col h-[400px]">
            <h2 className="text-base font-semibold text-[#171717] mb-4 flex items-center gap-2">
              <TrendingUp size={18} className="text-[#3B82F6]" /> Revenue Growth (30 Days)
            </h2>
            <div className="flex-1 min-h-0 relative -ml-4">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data.revenueTrend}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                  <XAxis dataKey="date"
                    tickFormatter={(val) => new Date(val).toLocaleDateString(undefined, {month: 'short', day: 'numeric'})}
                    axisLine={false} tickLine={false} tick={{fill: '#6B7280', fontSize: 12}} dy={10}
                  />
                  <YAxis axisLine={false} tickLine={false} tick={{fill: '#6B7280', fontSize: 12}}
                         tickFormatter={(val) => `$${val}`} />
                  <RechartsTooltip
                     contentStyle={{ borderRadius: '8px', border: '1px solid #E5E7EB', boxShadow: 'none', fontSize: '13px' }}
                     formatter={(value) => [`$${value}`, 'Revenue']}
                     labelFormatter={(label) => new Date(label).toLocaleDateString()}
                  />
                  <Line type="monotone" dataKey="revenue" stroke="#EA580C" strokeWidth={3} dot={{ r: 3, strokeWidth: 2, fill: '#fff' }} activeDot={{ r: 6, strokeWidth: 0 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-[#111111] rounded-xl p-5 text-white flex flex-col justify-between h-[400px]">
              <div>
                 <h2 className="text-lg font-bold mb-1">Quick Actions</h2>
                 <p className="text-[#A0A0A0] text-sm">Manage system resources instantly</p>
              </div>

              <div className="space-y-2.5 mt-4 w-full">
                 <button className="w-full bg-[#1A1A1A] border border-[#2A2A2A] hover:bg-[#222] text-left px-4 py-3 rounded-xl transition-colors font-medium text-sm flex justify-between items-center group">
                    Add New Vendor <ArrowRight size={14} className="text-[#A0A0A0] group-hover:text-white" />
                 </button>
                 <button className="w-full bg-[#1A1A1A] border border-[#2A2A2A] hover:bg-[#222] text-left px-4 py-3 rounded-xl transition-colors font-medium text-sm flex justify-between items-center group">
                    Broadcast System Message <ArrowRight size={14} className="text-[#A0A0A0] group-hover:text-white" />
                 </button>
                 <button className="w-full bg-[#1A1A1A] border border-[#2A2A2A] hover:bg-[#222] text-left px-4 py-3 rounded-xl transition-colors font-medium text-sm flex justify-between items-center group">
                    Generate Payout Report <ArrowRight size={14} className="text-[#A0A0A0] group-hover:text-white" />
                 </button>
                 <div className="pt-1">
                    <button
                        onClick={handleRotateFlashSale}
                        disabled={rotatingFlashSale}
                        className="w-full bg-[#EA580C] hover:bg-[#D4500A] text-left px-4 py-3 rounded-xl transition-colors font-bold text-sm flex justify-between items-center group disabled:opacity-50"
                    >
                        {rotatingFlashSale ? "Rotating System..." : "Rotate Daily Flash Sales"}
                        <Zap size={14} className="text-white group-hover:scale-110 transition-transform duration-300 fill-white" />
                    </button>
                    {flashResult && <p className="text-[10px] text-[#16A34A] font-semibold mt-2 px-1 animate-pulse">{flashResult}</p>}
                 </div>
              </div>
           </div>
         </div>
      </div>
  );
}

export default AdminDashboard;
