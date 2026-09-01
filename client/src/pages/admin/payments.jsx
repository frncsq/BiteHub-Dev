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
        
        let vol = 0; let rev = 0; let pending = 0;
        res.data.transactions.forEach(t => {
            vol += t.amount;
            rev += t.platform_fee;
            pending += t.payout;
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
    <div className="space-y-5 w-full h-full flex flex-col">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-[#171717]">Financial Ledger</h1>
          <p className="text-[#6B7280] mt-1 text-sm">System payments, platform revenue, and vendor payouts</p>
        </div>
        <button onClick={fetchPayments} className="p-2 bg-white border border-[#E5E7EB] hover:bg-[#FAFAFA] text-[#6B7280] rounded-xl transition-colors">
           <RefreshCw size={16} className={isLoading ? 'animate-spin text-[#EA580C]' : ''} />
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-1">
         <div className="bg-white rounded-xl p-5 border border-[#E5E7EB]">
             <div className="flex justify-between items-start">
                 <div>
                    <p className="text-[#6B7280] text-xs font-medium uppercase tracking-wide mb-1">Total Trading Volume</p>
                    <h3 className="text-2xl font-bold text-[#171717]">${metrics.totalVolume.toLocaleString(undefined, {minimumFractionDigits: 2})}</h3>
                 </div>
                 <div className="p-2.5 bg-blue-50 text-[#3B82F6] rounded-xl">
                    <Wallet size={20} />
                 </div>
             </div>
         </div>
         <div className="bg-white rounded-xl p-5 border border-[#E5E7EB]">
             <div className="flex justify-between items-start">
                 <div>
                    <p className="text-[#6B7280] text-xs font-medium uppercase tracking-wide mb-1">Platform Revenue (10% Fee)</p>
                    <h3 className="text-2xl font-bold text-[#16A34A]">${metrics.platformRevenue.toLocaleString(undefined, {minimumFractionDigits: 2})}</h3>
                 </div>
                 <div className="p-2.5 bg-[#DCFCE7] text-[#16A34A] rounded-xl">
                    <ArrowUpRight size={20} />
                 </div>
             </div>
         </div>
         <div className="bg-white rounded-xl p-5 border border-[#E5E7EB]">
             <div className="flex justify-between items-start">
                 <div>
                    <p className="text-[#6B7280] text-xs font-medium uppercase tracking-wide mb-1">Vendor Payouts Accrued</p>
                    <h3 className="text-2xl font-bold text-[#D97706]">${metrics.pendingPayouts.toLocaleString(undefined, {minimumFractionDigits: 2})}</h3>
                 </div>
                 <div className="p-2.5 bg-[#FEF3C7] text-[#D97706] rounded-xl">
                    <ArrowDownRight size={20} />
                 </div>
             </div>
         </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
         <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9CA3AF]" size={16} />
            <input 
              type="text" 
              placeholder="Search by vendor or transaction ID..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 bg-white border border-[#E5E7EB] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#EA580C]/20 focus:border-[#EA580C] transition-all"
            />
         </div>
         <button className="px-5 py-2.5 bg-white border border-[#E5E7EB] rounded-xl text-[#374151] font-medium flex items-center gap-2 hover:bg-[#FAFAFA] transition-colors text-sm">
             <Calendar size={16} /> Filter Date
         </button>
         <button className="px-5 py-2.5 bg-[#EA580C] border border-transparent rounded-xl text-white font-semibold flex items-center gap-2 hover:bg-[#D4500A] transition-colors text-sm">
             Process Payouts
         </button>
      </div>

      <div className="bg-white rounded-xl border border-[#E5E7EB] overflow-hidden flex-1 min-h-[400px] flex flex-col">
         <div className="overflow-x-auto flex-1 h-full">
            <table className="w-full text-left border-collapse whitespace-nowrap">
              <thead className="bg-[#FAFAFA] sticky top-0 z-10 border-b border-[#E5E7EB]">
                <tr>
                  <th className="px-5 py-3.5 text-xs font-semibold text-[#6B7280] uppercase tracking-wider">Transaction ID</th>
                  <th className="px-5 py-3.5 text-xs font-semibold text-[#6B7280] uppercase tracking-wider">Date & Time</th>
                  <th className="px-5 py-3.5 text-xs font-semibold text-[#6B7280] uppercase tracking-wider">Vendor</th>
                  <th className="px-5 py-3.5 text-xs font-semibold text-[#6B7280] uppercase tracking-wider text-right">Total Amount</th>
                  <th className="px-5 py-3.5 text-xs font-semibold text-[#6B7280] uppercase tracking-wider text-right">Platform Fee (<span className="text-[#16A34A]">10%</span>)</th>
                  <th className="px-5 py-3.5 text-xs font-semibold text-[#6B7280] uppercase tracking-wider text-right">Vendor Payout</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F3F4F6] text-sm">
                {isLoading ? (
                  <tr><td colSpan="6" className="px-5 py-8 text-center text-[#9CA3AF]">Loading ledger data...</td></tr>
                ) : filteredPayments.length === 0 ? (
                  <tr><td colSpan="6" className="px-5 py-8 text-center text-[#9CA3AF] bg-[#FAFAFA]">No transactions recorded yet.</td></tr>
                ) : (
                  filteredPayments.map((p) => (
                    <tr key={p.id} className="hover:bg-[#FAFAFA] transition-colors">
                      <td className="px-5 py-4">
                         <div className="font-mono text-[#374151] bg-[#FAFAFA] border border-[#E5E7EB] px-2 py-1 rounded-lg w-max text-xs font-semibold">
                             TXN-ORD-{p.id}
                         </div>
                      </td>
                      <td className="px-5 py-4">
                         <div className="text-[#374151] font-medium">
                            {new Date(p.date).toLocaleDateString()}
                         </div>
                         <div className="text-[#9CA3AF] text-xs mt-0.5">
                            {new Date(p.date).toLocaleTimeString()}
                         </div>
                      </td>
                      <td className="px-5 py-4 font-medium text-[#171717]">
                          {p.restaurant}
                      </td>
                      <td className="px-5 py-4 text-right font-medium text-[#374151]">
                          ${parseFloat(p.amount).toLocaleString(undefined, {minimumFractionDigits: 2})}
                      </td>
                      <td className="px-5 py-4 text-right bg-[#F0FDF4]/50">
                          <span className="font-semibold text-[#16A34A] block">
                             +${parseFloat(p.platform_fee).toLocaleString(undefined, {minimumFractionDigits: 2})}
                          </span>
                      </td>
                      <td className="px-5 py-4 text-right bg-[#FFFBEB]/50">
                          <span className="font-semibold text-[#D97706] block">
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
