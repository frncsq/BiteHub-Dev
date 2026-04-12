import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Menu as MenuIcon, ClipboardList, Package, BarChart3, Settings, X } from 'lucide-react';
import biteLogo from '../assets/bite.png';

function OwnerSidebar({ mobileOpen = false, onNavigate }) {
  const location = useLocation();
  const close = () => onNavigate?.();

  const links = [
    { name: 'Dashboard', path: '/owner/dashboard', icon: LayoutDashboard },
    { name: 'Menu', path: '/owner/menu', icon: MenuIcon },
    { name: 'Orders', path: '/owner/orders', icon: ClipboardList },
    { name: 'Inventory', path: '/owner/inventory', icon: Package },
    { name: 'Analytics', path: '/owner/analytics', icon: BarChart3 },
    { name: 'Settings', path: '/owner/settings', icon: Settings },
  ];

  return (
    <>
      <div
        className={`fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-sm transition-opacity duration-300 lg:hidden ${
          mobileOpen ? 'opacity-100' : 'pointer-events-none opacity-0'
        }`}
        onClick={close}
        aria-hidden
      />

      <aside
        className={`fixed left-0 top-0 z-50 flex h-screen w-64 flex-col border-r border-white/50 bg-white/60 shadow-[8px_0_32px_rgba(0,0,0,0.03)] backdrop-blur-2xl transition-transform duration-300 ease-out ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        } lg:translate-x-0`}
      >
        <div className="pointer-events-none absolute top-0 left-0 -z-10 h-32 w-full bg-gradient-to-b from-white/60 to-transparent" />

        <div className="relative z-20 flex items-center justify-between border-b border-white/40 p-5">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-xl transition-transform duration-300 hover:scale-105">
              <img src={biteLogo} alt="" className="h-full w-full object-contain" />
            </div>
            <span className="truncate bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-xl font-bold tracking-tight text-transparent">
              Owner Portal
            </span>
          </div>
          <button
            type="button"
            className="bh-touch flex shrink-0 items-center justify-center rounded-xl p-2 text-gray-500 hover:bg-white/80 lg:hidden"
            onClick={close}
            aria-label="Close menu"
          >
            <X size={22} />
          </button>
        </div>

        <nav className="flex flex-1 flex-col gap-2 overflow-y-auto px-4 py-6">
          {links.map((link) => {
            const Icon = link.icon;
            const isActive = location.pathname.startsWith(link.path);
            return (
              <Link
                key={link.name}
                to={link.path}
                onClick={close}
                className={`relative flex items-center gap-3 overflow-hidden rounded-xl px-4 py-3 font-medium transition-all duration-300 group ${
                  isActive
                    ? 'border border-white/60 bg-white/80 text-orange-600 shadow-sm'
                    : 'border border-transparent text-gray-600 hover:-translate-y-0.5 hover:border-transparent hover:bg-white/50 hover:text-gray-900 hover:shadow-sm'
                }`}
              >
                {isActive && (
                  <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-orange-100/40 to-transparent" />
                )}
                <Icon
                  size={20}
                  className={`transition-all duration-300 group-hover:scale-110 ${
                    isActive ? 'text-orange-600' : 'text-gray-400 group-hover:text-orange-500'
                  }`}
                />
                <span className="relative z-10 translate-x-0 transition-transform duration-300 group-hover:translate-x-1">
                  {link.name}
                </span>
              </Link>
            );
          })}
        </nav>
      </aside>
    </>
  );
}

export default OwnerSidebar;
