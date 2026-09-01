import { useState, useEffect } from 'react';
import axios from 'axios';
import { getApiBaseUrl } from '../../services/apiClient';
import { Search, Filter, ShieldOff, ShieldAlert, RefreshCw } from 'lucide-react';

function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('all');

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const baseURL = getApiBaseUrl();
      const res = await axios.get(`${baseURL}/api/admin/users`, { withCredentials: true });
      if (res.data.success) {
        setUsers(res.data.users);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const toggleStatus = async (id, currentStatus) => {
    try {
      const baseURL = getApiBaseUrl();
      await axios.patch(`${baseURL}/api/admin/users/${id}/status`, { is_active: !currentStatus }, { withCredentials: true });
      fetchUsers();
    } catch (err) {
       console.error(err);
    }
  };

  const resetPassword = async (id) => {
     const newPass = prompt("Enter new password for user:");
     if (!newPass) return;
     try {
      const baseURL = getApiBaseUrl();
      const res = await axios.patch(`${baseURL}/api/admin/users/${id}/reset-password`, { newPassword: newPass }, { withCredentials: true });
      alert(res.data.message);
    } catch (err) {
       alert(err.response?.data?.message || 'Error occurred');
    }
  }

  const filteredUsers = users.filter(user => 
    (user.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) || user.email?.toLowerCase().includes(searchTerm.toLowerCase())) &&
    (filterRole === 'all' || user.role === filterRole || (filterRole === 'customer' && !user.role))
  );

  return (
    <div className="space-y-5 w-full h-full flex flex-col">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-[#171717]">User Management</h1>
          <p className="text-[#6B7280] mt-1 text-sm">Monitor and govern platform users</p>
        </div>
        <button onClick={fetchUsers} className="p-2 bg-white border border-[#E5E7EB] hover:bg-[#FAFAFA] text-[#6B7280] rounded-xl transition-colors">
           <RefreshCw size={16} className={isLoading ? 'animate-spin text-[#EA580C]' : ''} />
        </button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
         <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9CA3AF]" size={16} />
            <input 
              type="text" 
              placeholder="Search users by name or email..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 bg-white border border-[#E5E7EB] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#EA580C]/20 focus:border-[#EA580C] transition-all"
            />
         </div>
         <div className="flex items-center gap-2.5">
             <Filter size={16} className="text-[#9CA3AF]" />
             <select 
                value={filterRole} 
                onChange={e => setFilterRole(e.target.value)}
                className="py-2.5 pl-3 pr-8 bg-white border border-[#E5E7EB] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#EA580C]/20 focus:border-[#EA580C] cursor-pointer font-medium text-[#374151] text-sm"
             >
                 <option value="all">All Roles</option>
                 <option value="customer">Customer</option>
                 <option value="admin">Admin</option>
             </select>
         </div>
      </div>

      <div className="bg-white rounded-xl border border-[#E5E7EB] overflow-hidden flex-1 min-h-[400px] flex flex-col">
         <div className="overflow-x-auto flex-1 h-full">
            <table className="w-full text-left border-collapse whitespace-nowrap">
              <thead className="bg-[#FAFAFA] sticky top-0 z-10 border-b border-[#E5E7EB]">
                <tr>
                  <th className="px-5 py-3.5 text-xs font-semibold text-[#6B7280] uppercase tracking-wider">User</th>
                  <th className="px-5 py-3.5 text-xs font-semibold text-[#6B7280] uppercase tracking-wider">Contact</th>
                  <th className="px-5 py-3.5 text-xs font-semibold text-[#6B7280] uppercase tracking-wider">Campus Details</th>
                  <th className="px-5 py-3.5 text-xs font-semibold text-[#6B7280] uppercase tracking-wider">Role</th>
                  <th className="px-5 py-3.5 text-xs font-semibold text-[#6B7280] uppercase tracking-wider">Status</th>
                  <th className="px-5 py-3.5 text-xs font-semibold text-[#6B7280] uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F3F4F6] text-sm">
                {isLoading ? (
                  <tr><td colSpan="6" className="px-5 py-8 text-center text-[#9CA3AF]">Loading...</td></tr>
                ) : filteredUsers.length === 0 ? (
                  <tr><td colSpan="6" className="px-5 py-8 text-center text-[#9CA3AF] bg-[#FAFAFA]">No users found.</td></tr>
                ) : (
                  filteredUsers.map((user) => (
                    <tr key={user.id} className="hover:bg-[#FAFAFA] transition-colors">
                      <td className="px-5 py-4 font-medium text-[#171717]">{user.full_name}</td>
                      <td className="px-5 py-4">
                         <div className="text-[#374151]">{user.email}</div>
                         <div className="text-[#9CA3AF] text-xs mt-0.5">{user.phone}</div>
                      </td>
                      <td className="px-5 py-4 text-[#374151]">
                          {user.department ? `${user.department} - ${user.course} (${user.year})` : 'N/A'}
                      </td>
                      <td className="px-5 py-4">
                          <span className="px-2.5 py-1 bg-blue-50 text-[#3B82F6] rounded-lg text-xs font-semibold uppercase tracking-wide">
                            {user.role || 'customer'}
                          </span>
                      </td>
                      <td className="px-5 py-4">
                          <span className={`px-2.5 py-1 rounded-lg text-xs font-semibold tracking-wide flex items-center gap-1.5 w-max ${user.is_active ? 'bg-[#DCFCE7] text-[#16A34A]' : 'bg-[#FEE2E2] text-[#DC2626]'}`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${user.is_active ? 'bg-[#16A34A]' : 'bg-[#DC2626]'}`} />
                              {user.is_active ? 'ACTIVE' : 'SUSPENDED'}
                          </span>
                      </td>
                      <td className="px-5 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                             <button 
                                onClick={() => resetPassword(user.id)}
                                className="text-xs font-medium text-[#3B82F6] hover:text-[#2563EB] bg-blue-50 px-2.5 py-1.5 rounded-lg hover:bg-blue-100 transition-colors"
                             >
                               Reset Password
                             </button>
                             <button 
                                onClick={() => toggleStatus(user.id, user.is_active)}
                                className={`text-xs font-medium px-2.5 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 ${
                                  user.is_active ? 'text-[#D97706] bg-[#FEF3C7] hover:bg-[#FDE68A]' : 'text-[#16A34A] bg-[#DCFCE7] hover:bg-[#BBF7D0]'
                                }`}
                             >
                               {user.is_active ? <><ShieldOff size={13} /> Suspend</> : <><ShieldAlert size={13} /> Restore</>}
                             </button>
                          </div>
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

export default AdminUsers;
