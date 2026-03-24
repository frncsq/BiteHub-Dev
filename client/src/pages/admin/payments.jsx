import { useState, useEffect } from 'react';
import axios from 'axios';
import { getApiBaseUrl } from '../../services/apiClient';
import { Search, DollarSign, Wallet, ArrowUpRight, ArrowDownRight, RefreshCw, Calendar } from 'lucide-react';

function AdminPayments() {
  const [payments, setPayments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [metrics, setMetrics] = useState({
      totalVolume: 0,
      platformRevenue: 0,
      pendingPayouts: 0
  });

  const fetchPayments = async () => {
    setIsLoading(true);
    try {
      const baseURL = getApiBaseUrl();
      const res = await axios.get(`${baseURL}/api/admin/payments`, { withCredentials: true });
      if (res.data.success) {
        setPayments(res.data.transactions);
        
        // Calculate metrics
        let vol = 0; let rev = 0; let pending = 0;
        res.data.transactions.forEach(t => {
            vol += t.amount;
            rev += t.platform_fee;
            pending += t.payout; // Simplify: all payouts are outstanding in this view
        });
        setMetrics({ totalVolume: vol, platformRevenue: rev, pendingPayouts: pending });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, []);

  const filteredPayments = payments.filter(p => 
      p.restaurant?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.id?.toString().includes(searchTerm)
  );

  return (
    <div className="space-y-6 animate-fade-in w-full h-full flex flex-col">
      <div className="flex justify-between items-center bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Financial Ledger</h1>
          <p className="text-slate-500 mt-1 text-sm">System payments, platform revenue, and vendor payouts</p>
        </div>
        <button onClick={fetchPayments} className="p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl transition-colors">
           <RefreshCw size={20} className={isLoading ? 'animate-spin text-blue-500' : ''} />
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-2">
         <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 relative overflow-hidden group">
             <div className="flex justify-between items-start relative z-10">
                 <div>
                    <p className="text-slate-500 text-sm font-semibold mb-1">Total Trading Volume</p>
                    <h3 className="text-3xl font-bold text-slate-800">${metrics.totalVolume.toLocaleString(undefined, {minimumFractionDigits: 2})}</h3>
                 </div>
                 <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl">
                    <Wallet size={24} />
                 </div>
             </div>
             <div className="absolute right-0 bottom-0 w-24 h-24 bg-blue-50 rounded-full -mr-8 -mb-8 transition-transform group-hover:scale-150 duration-500 opacity-50" />
         </div>
         <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 relative overflow-hidden group">
             <div className="flex justify-between items-start relative z-10">
                 <div>
                    <p className="text-slate-500 text-sm font-semibold mb-1">Platform Revenue (10% Fee)</p>
                    <h3 className="text-3xl font-bold text-emerald-600">${metrics.platformRevenue.toLocaleString(undefined, {minimumFractionDigits: 2})}</h3>
                 </div>
                 <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl">
                    <ArrowUpRight size={24} />
                 </div>
             </div>
             <div className="absolute right-0 bottom-0 w-24 h-24 bg-emerald-50 rounded-full -mr-8 -mb-8 transition-transform group-hover:scale-150 duration-500 opacity-50" />
         </div>
         <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 relative overflow-hidden group">
             <div className="flex justify-between items-start relative z-10">
                 <div>
                    <p className="text-slate-500 text-sm font-semibold mb-1">Vendor Payouts Accrued</p>
                    <h3 className="text-3xl font-bold text-amber-600">${metrics.pendingPayouts.toLocaleString(undefined, {minimumFractionDigits: 2})}</h3>
                 </div>
                 <div className="p-3 bg-amber-50 text-amber-600 rounded-2xl">
                    <ArrowDownRight size={24} />
                 </div>
             </div>
             <div className="absolute right-0 bottom-0 w-24 h-24 bg-amber-50 rounded-full -mr-8 -mb-8 transition-transform group-hover:scale-150 duration-500 opacity-50" />
         </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 mb-2">
         <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
            <input 
              type="text" 
              placeholder="Search by vendor or transaction ID..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-11 pr-4 py-3.5 bg-white border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-sm"
            />
         </div>
         <button className="px-6 py-3.5 bg-white border border-slate-200 rounded-2xl text-slate-700 font-semibold flex items-center gap-2 hover:bg-slate-50 transition-colors shadow-sm">
             <Calendar size={18} /> Filter Date
         </button>
         <button className="px-6 py-3.5 bg-blue-600 border border-transparent rounded-2xl text-white font-semibold flex items-center gap-2 hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/30">
             Process Payouts
         </button>
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden flex-1 min-h-[400px] flex flex-col">
         <div className="overflow-x-auto flex-1 h-full">
            <table className="w-full text-left border-collapse whitespace-nowrap">
              <thead className="bg-slate-50 sticky top-0 z-10 shadow-sm border-b border-slate-100">
                <tr>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Transaction ID</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Date & Time</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Vendor</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Total Amount</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Platform Fee (<span className="text-emerald-600">10%</span>)</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Vendor Payout</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {isLoading ? (
                  <tr><td colSpan="6" className="px-6 py-8 text-center text-slate-400">Loading ledger data...</td></tr>
                ) : filteredPayments.length === 0 ? (
                  <tr><td colSpan="6" className="px-6 py-8 text-center text-slate-500 bg-slate-50/50">No transactions recorded yet.</td></tr>
                ) : (
                  filteredPayments.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-6 py-4">
                         <div className="font-mono text-slate-500 bg-slate-100 px-2 py-1 rounded w-max text-xs font-semibold">
                             TXN-ORD-{p.id}
                         </div>
                      </td>
                      <td className="px-6 py-4">
                         <div className="text-slate-700 font-medium">
                            {new Date(p.date).toLocaleDateString()}
                         </div>
                         <div className="text-slate-400 text-xs mt-0.5">
                            {new Date(p.date).toLocaleTimeString()}
                         </div>
                      </td>
                      <td className="px-6 py-4 font-semibold text-slate-800">
                          {p.restaurant}
                      </td>
                      <td className="px-6 py-4 text-right font-medium text-slate-600">
                          ${parseFloat(p.amount).toLocaleString(undefined, {minimumFractionDigits: 2})}
                      </td>
                      <td className="px-6 py-4 text-right bg-emerald-50/30">
                          <span className="font-bold text-emerald-600 block">
                             +${parseFloat(p.platform_fee).toLocaleString(undefined, {minimumFractionDigits: 2})}
                          </span>
                      </td>
                      <td className="px-6 py-4 text-right bg-amber-50/30">
                          <span className="font-bold text-amber-700 block">
                             ${parseFloat(p.payout).toLocaleString(undefined, {minimumFractionDigits: 2})}
                          </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
         </div>
      </div>
    </div>
  );
}

export default AdminPayments;
