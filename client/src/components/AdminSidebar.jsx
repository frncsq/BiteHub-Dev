import { Link, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Store, Users, ClipboardList, CreditCard, BarChart3, Settings, LogOut, ShieldAlert } from 'lucide-react';
import axios from 'axios';

function AdminSidebar() {
  const location = useLocation();
  const navigate = useNavigate();

  const links = [
    { name: 'Dashboard', path: '/admin/dashboard', icon: LayoutDashboard },
    { name: 'Restaurants', path: '/admin/restaurants', icon: Store },
    { name: 'Users', path: '/admin/users', icon: Users },
    { name: 'Orders', path: '/admin/orders', icon: ClipboardList },
    { name: 'Payments', path: '/admin/payments', icon: CreditCard },
    { name: 'Analytics', path: '/admin/analytics', icon: BarChart3 }
  ];

  const handleLogout = async () => {
    try {
      const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      await axios.post(`${baseURL}/api/admin/logout`, {}, { withCredentials: true });
      navigate('/admin-login');
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="w-64 bg-slate-900/95 backdrop-blur-3xl border-r border-white/10 h-screen fixed left-0 top-0 flex flex-col shadow-2xl z-50 transition-all duration-300 ease-in-out text-slate-300">
      {/* Decorative top gradient */}
      <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-blue-500/10 to-transparent pointer-events-none -z-10" />
      
      <div className="p-6 border-b border-white/10 flex items-center gap-3 relative z-20">
        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center text-white font-bold shadow-lg shadow-blue-500/30 transform transition-transform hover:scale-105 duration-300 ring-1 ring-white/20">
          <ShieldAlert size={22} className="text-white drop-shadow-md" />
        </div>
        <div>
           <span className="text-xl font-bold tracking-tight text-white block">System Admin</span>
           <span className="text-xs text-blue-300 tracking-wider uppercase font-semibold">BiteHub Platform</span>
        </div>
      </div>

      <div className="flex-1 py-6 flex flex-col gap-2 px-4 overflow-y-auto">
        {links.map((link) => {
          const Icon = link.icon;
          const isActive = location.pathname.startsWith(link.path);
          return (
            <Link
              key={link.name}
              to={link.path}
              className={`relative flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 font-medium overflow-hidden group ${
                isActive
                  ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30 shadow-inner'
                  : 'text-slate-400 hover:bg-white/5 hover:text-white border border-transparent'
              }`}
            >
              {isActive && (
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-transparent pointer-events-none" />
              )}
              <Icon 
                size={20} 
                className={`transition-all duration-300 group-hover:scale-110 ${
                  isActive ? 'text-blue-400 drop-shadow-sm' : 'text-slate-500 group-hover:text-slate-300'
                }`}
              />
              <span className="relative z-10 translate-x-0 group-hover:translate-x-1 transition-transform duration-300">
                {link.name}
              </span>
            </Link>
          );
        })}
      </div>

      <div className="p-4 border-t border-white/10 mb-4 relative z-20">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-4 py-3 rounded-xl w-full text-red-400 hover:bg-red-500/10 hover:text-red-300 border border-transparent hover:border-red-500/30 transition-all duration-300 font-medium group relative overflow-hidden"
        >
          <LogOut size={20} className="transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:scale-110 text-red-500" />
          <span className="transition-transform duration-300 group-hover:translate-x-1">Logout</span>
        </button>
      </div>
    </div>
  );
}

export default AdminSidebar;
