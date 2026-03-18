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
    <div className="w-64 bg-white border-r border-gray-200 h-screen fixed left-0 top-0 flex flex-col shadow-sm z-10">
      <div className="p-6 border-b border-gray-200 flex items-center gap-3">
        <div className="w-10 h-10 bg-orange-600 rounded-xl flex items-center justify-center text-white font-bold text-xl">
          B
        </div>
        <span className="text-xl font-bold font-sans text-gray-900 tracking-tight">Owner Portal</span>
      </div>
      <div className="flex-1 py-6 flex flex-col gap-2 px-4">
        {links.map((link) => {
          const Icon = link.icon;
          const isActive = location.pathname.startsWith(link.path);
          return (
            <Link
              key={link.name}
              to={link.path}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 font-medium ${
                isActive
                  ? 'bg-orange-50 text-orange-600'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <Icon size={20} className={isActive ? 'text-orange-600' : 'text-gray-400'} />
              {link.name}
            </Link>
          );
        })}
      </div>
      <div className="p-4 border-t border-gray-200">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-4 py-3 rounded-xl w-full text-red-600 hover:bg-red-50 transition-colors font-medium"
        >
          <LogOut size={20} />
          Logout
        </button>
      </div>
    </div>
  );
}

export default OwnerSidebar;
