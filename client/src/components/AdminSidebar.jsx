import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Store, Users, ClipboardList, CreditCard, BarChart3, Megaphone, X } from 'lucide-react';
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
    { name: 'Advertisements', path: '/admin/ads', icon: Megaphone },
    { name: 'Analytics', path: '/admin/analytics', icon: BarChart3 }
  ];

  return (
    <>
      <div
        className={`fixed inset-0 z-40 bg-black/50 transition-opacity duration-300 lg:hidden ${
          mobileOpen ? 'opacity-100' : 'pointer-events-none opacity-0'
        }`}
        onClick={close}
        aria-hidden
      />

      <aside
        className={`fixed left-0 top-0 z-50 flex h-screen w-64 flex-col border-r border-[#2A2A2A] bg-[#111111] text-[#F5F5F5] transition-transform duration-300 ease-out ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        } lg:translate-x-0`}
      >
        <div className="flex items-center justify-between border-b border-[#2A2A2A] p-5">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-lg ring-1 ring-white/10">
              <img src={biteLogo} alt="" className="h-full w-full object-contain" />
            </div>
            <div className="min-w-0">
              <span className="block truncate text-lg font-bold tracking-tight text-[#F5F5F5]">System Admin</span>
              <span className="text-xs font-semibold tracking-wider text-blue-400 uppercase">BiteHub</span>
            </div>
          </div>
          <button
            type="button"
            className="bh-touch flex shrink-0 items-center justify-center rounded-lg p-2 text-[#A0A0A0] hover:bg-white/5 hover:text-[#F5F5F5] lg:hidden"
            onClick={close}
            aria-label="Close menu"
          >
            <X size={22} />
          </button>
        </div>

        <nav className="flex flex-1 flex-col gap-1.5 overflow-y-auto px-4 py-6">
          {links.map((link) => {
            const Icon = link.icon;
            const isActive = location.pathname.startsWith(link.path);
            return (
              <Link
                key={link.name}
                to={link.path}
                onClick={close}
                className={`flex items-center gap-3 rounded-lg px-4 py-3 font-medium transition-colors ${
                  isActive
                    ? 'bg-blue-500/15 text-blue-400'
                    : 'text-[#A0A0A0] hover:bg-white/5 hover:text-[#F5F5F5]'
                }`}
              >
                <Icon
                  size={20}
                  className={isActive ? 'text-blue-400' : 'text-[#A0A0A0]'}
                />
                <span>{link.name}</span>
              </Link>
            );
          })}
        </nav>
      </aside>
    </>
  );
}

export default AdminSidebar;