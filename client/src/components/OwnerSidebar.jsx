import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Menu as MenuIcon, ClipboardList, Package, BarChart3, Settings, LogOut } from 'lucide-react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

function OwnerSidebar() {
  const location = useLocation();
  const navigate = useNavigate();

  const links = [
    { name: 'Dashboard', path: '/owner/dashboard', icon: LayoutDashboard },
    { name: 'Menu', path: '/owner/menu', icon: MenuIcon },
    { name: 'Orders', path: '/owner/orders', icon: ClipboardList },
    { name: 'Inventory', path: '/owner/inventory', icon: Package },
    { name: 'Analytics', path: '/owner/analytics', icon: BarChart3 },
    { name: 'Settings', path: '/owner/settings', icon: Settings },
  ];

  const handleLogout = async () => {
    try {
      const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      await axios.post(`${baseURL}/api/owner/logout`, {}, { withCredentials: true });
      navigate('/restaurant-login');
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="w-64 bg-white/60 backdrop-blur-2xl border-r border-white/50 h-screen fixed left-0 top-0 flex flex-col shadow-[8px_0_32px_rgba(0,0,0,0.03)] z-50 transition-all duration-300 ease-in-out">
      {/* Decorative top gradient */}
      <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-white/60 to-transparent pointer-events-none -z-10" />
      
      <div className="p-6 border-b border-white/40 flex items-center gap-3 relative z-20">
        <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-orange-500/30 transform transition-transform hover:scale-105 duration-300 ring-1 ring-white/50">
          B
        </div>
        <span className="text-xl font-bold font-sans tracking-tight bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">Owner Portal</span>
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
                  ? 'bg-white/80 shadow-sm text-orange-600 border border-white/60'
                  : 'text-gray-600 hover:bg-white/50 hover:shadow-sm hover:text-gray-900 border border-transparent hover:-translate-y-0.5'
              }`}
            >
              {isActive && (
                <div className="absolute inset-0 bg-gradient-to-r from-orange-100/40 to-transparent pointer-events-none" />
              )}
              <Icon 
                size={20} 
                className={`transition-all duration-300 group-hover:scale-110 ${
                  isActive ? 'text-orange-600' : 'text-gray-400 group-hover:text-orange-500'
                }`}
              />
              <span className="relative z-10 translate-x-0 group-hover:translate-x-1 transition-transform duration-300">
                {link.name}
              </span>
            </Link>
          );
        })}
      </div>
      <div className="p-4 border-t border-white/40 mb-4 relative z-20">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-4 py-3 rounded-xl w-full text-red-600 hover:bg-white/60 hover:shadow-sm border border-transparent hover:border-white/60 transition-all duration-300 font-medium group relative overflow-hidden hover:-translate-y-0.5"
        >
          <div className="absolute inset-0 bg-red-50/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
          <LogOut size={20} className="transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:scale-110 text-red-500" />
          <span className="transition-transform duration-300 group-hover:translate-x-1">Logout</span>
        </button>
      </div>
    </div>
  );
}

export default OwnerSidebar;
