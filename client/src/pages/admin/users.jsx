import { useState, useEffect } from 'react';
import axios from 'axios';
import { Search, Filter, ShieldOff, ShieldAlert, MoreVertical, RefreshCw } from 'lucide-react';

function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('all');

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
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
      const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
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
      const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
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
    <div className="space-y-6 animate-fade-in w-full h-full flex flex-col">
      <div className="flex justify-between items-center bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">User Management</h1>
          <p className="text-slate-500 mt-1 text-sm">Monitor and govern platform users</p>
        </div>
        <button onClick={fetchUsers} className="p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl transition-colors">
           <RefreshCw size={20} className={isLoading ? 'animate-spin text-blue-500' : ''} />
        </button>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 mb-6">
         <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
            <input 
              type="text" 
              placeholder="Search users by name or email..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-11 pr-4 py-3.5 bg-white border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-sm"
            />
         </div>
         <div className="flex items-center gap-3">
             <Filter size={20} className="text-slate-400" />
             <select 
                value={filterRole} 
                onChange={e => setFilterRole(e.target.value)}
                className="py-3.5 pl-4 pr-10 bg-white border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 cursor-pointer shadow-sm appearance-none font-medium text-slate-700"
             >
                 <option value="all">All Roles</option>
                 <option value="customer">Customer</option>
                 <option value="admin">Admin</option>
             </select>
         </div>
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden flex-1 min-h-[400px] flex flex-col">
         <div className="overflow-x-auto flex-1 h-full">
            <table className="w-full text-left border-collapse whitespace-nowrap">
              <thead className="bg-slate-50 sticky top-0 z-10 shadow-sm">
                <tr>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">User</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Contact</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Campus Details</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Role</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {isLoading ? (
                  <tr><td colSpan="6" className="px-6 py-8 text-center text-slate-400">Loading...</td></tr>
                ) : filteredUsers.length === 0 ? (
                  <tr><td colSpan="6" className="px-6 py-8 text-center text-slate-500 bg-slate-50/50">No users found.</td></tr>
                ) : (
                  filteredUsers.map((user) => (
                    <tr key={user.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-6 py-4 font-medium text-slate-800">{user.full_name}</td>
                      <td className="px-6 py-4">
                         <div className="text-slate-600">{user.email}</div>
                         <div className="text-slate-400 text-xs mt-0.5">{user.phone}</div>
                      </td>
                      <td className="px-6 py-4 text-slate-600">
                          {user.department ? `${user.department} - ${user.course} (${user.year})` : 'N/A'}
                      </td>
                      <td className="px-6 py-4">
                          <span className="px-3 py-1 bg-indigo-50 text-indigo-600 rounded-full text-xs font-semibold uppercase tracking-wide">
                            {user.role || 'customer'}
                          </span>
                      </td>
                      <td className="px-6 py-4">
                          <span className={`px-3 py-1 rounded-full text-xs font-bold font-mono tracking-wide flex items-center gap-1.5 w-max ${user.is_active ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${user.is_active ? 'bg-emerald-500' : 'bg-red-500'}`} />
                              {user.is_active ? 'ACTIVE' : 'SUSPENDED'}
                          </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-3">
                             <button 
                                onClick={() => resetPassword(user.id)}
                                className="text-xs font-medium text-blue-600 hover:text-blue-700 bg-blue-50 px-3 py-1.5 rounded-lg hover:bg-blue-100 transition-colors"
                             >
                               Reset Password
                             </button>
                             <button 
                                onClick={() => toggleStatus(user.id, user.is_active)}
                                className={`text-xs font-medium px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 ${
                                  user.is_active ? 'text-amber-700 bg-amber-50 hover:bg-amber-100' : 'text-emerald-700 bg-emerald-50 hover:bg-emerald-100'
                                }`}
                             >
                               {user.is_active ? <><ShieldOff size={14} /> Suspend</> : <><ShieldAlert size={14} /> Restore</>}
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
