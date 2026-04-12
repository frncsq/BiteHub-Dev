import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Store, Users, ClipboardList, CreditCard, BarChart3, X } from 'lucide-react';
import biteLogo from '../assets/bite.png';

function AdminSidebar({ mobileOpen = false, onNavigate }) {
  const location = useLocation();
  const close = () => onNavigate?.();

  const links = [
    { name: 'Dashboard', path: '/admin/dashboard', icon: LayoutDashboard },
    { name: 'Restaurants', path: '/admin/restaurants', icon: Store },
    { name: 'Users', path: '/admin/users', icon: Users },
    { name: 'Orders', path: '/admin/orders', icon: ClipboardList },
    { name: 'Payments', path: '/admin/payments', icon: CreditCard },
    { name: 'Analytics', path: '/admin/analytics', icon: BarChart3 }
  ];

  return (
    <>
      <div
        className={`fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-sm transition-opacity duration-300 lg:hidden ${
          mobileOpen ? 'opacity-100' : 'pointer-events-none opacity-0'
        }`}
        onClick={close}
        aria-hidden
      />

      <aside
        className={`fixed left-0 top-0 z-50 flex h-screen w-64 flex-col border-r border-white/10 bg-slate-900/95 shadow-2xl backdrop-blur-3xl transition-transform duration-300 ease-out text-slate-300 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        } lg:translate-x-0`}
      >
        <div className="pointer-events-none absolute top-0 left-0 -z-10 h-32 w-full bg-gradient-to-b from-blue-500/10 to-transparent" />

        <div className="relative z-20 flex items-center justify-between border-b border-white/10 p-5">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-xl ring-1 ring-white/20 transition-transform duration-300 hover:scale-105">
              <img src={biteLogo} alt="" className="h-full w-full object-contain" />
            </div>
            <div className="min-w-0">
              <span className="block truncate text-lg font-bold tracking-tight text-white">System Admin</span>
              <span className="text-xs font-semibold tracking-wider text-blue-300 uppercase">BiteHub</span>
            </div>
          </div>
          <button
            type="button"
            className="bh-touch flex shrink-0 items-center justify-center rounded-xl p-2 text-slate-400 hover:bg-white/10 hover:text-white lg:hidden"
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
                    ? 'border border-blue-500/30 bg-blue-600/20 text-blue-400 shadow-inner'
                    : 'border border-transparent text-slate-400 hover:border-transparent hover:bg-white/5 hover:text-white'
                }`}
              >
                {isActive && (
                  <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-blue-500/10 to-transparent" />
                )}
                <Icon
                  size={20}
                  className={`transition-all duration-300 group-hover:scale-110 ${
                    isActive ? 'text-blue-400 drop-shadow-sm' : 'text-slate-500 group-hover:text-slate-300'
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

export default AdminSidebar;
