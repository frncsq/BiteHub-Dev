import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Menu as MenuIcon, ClipboardList, Package, BarChart3, Settings, X } from 'lucide-react';
import kaingoLogo from '../assets/kaingo-logo.svg';

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
        className={`fixed inset-0 z-40 bg-slate-900/40 transition-opacity duration-300 lg:hidden ${
          mobileOpen ? 'opacity-100' : 'pointer-events-none opacity-0'
        }`}
        onClick={close}
        aria-hidden
      />

      <aside
        className={`fixed left-0 top-0 z-50 flex h-screen w-64 flex-col border-r border-[#E5E7EB] bg-white transition-transform duration-300 ease-out dark:border-[#2A2A2A] dark:bg-[#1A1A1A] ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        } lg:translate-x-0`}
      >
        <div className="flex items-center justify-between border-b border-[#E5E7EB] p-5 dark:border-[#2A2A2A]">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-lg">
              <img src={kaingoLogo} alt="" className="h-full w-full object-contain" />
            </div>
            <span className="truncate text-lg font-bold tracking-tight text-[#171717] dark:text-[#F5F5F5]">
              Owner Portal
            </span>
          </div>
          <button
            type="button"
            className="bh-touch flex shrink-0 items-center justify-center rounded-lg p-2 text-[#6B7280] hover:bg-[#FAFAFA] hover:text-[#171717] lg:hidden dark:text-[#A0A0A0] dark:hover:bg-white/5 dark:hover:text-[#F5F5F5]"
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
                    ? 'bg-[#EA580C]/10 text-[#EA580C] dark:bg-[#EA580C]/15 dark:text-[#EA580C]'
                    : 'text-[#6B7280] hover:bg-[#FAFAFA] hover:text-[#171717] dark:text-[#A0A0A0] dark:hover:bg-white/5 dark:hover:text-[#F5F5F5]'
                }`}
              >
                <Icon
                  size={20}
                  className={isActive ? 'text-[#EA580C]' : 'text-[#6B7280] dark:text-[#A0A0A0]'}
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

export default OwnerSidebar;