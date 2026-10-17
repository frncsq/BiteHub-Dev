import { Outlet, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { Menu } from 'lucide-react';
import { createApiClient } from '../services/apiClient.js';
import AdminSidebar from './AdminSidebar';

function AdminLayout() {
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isChecking, setIsChecking] = useState(true);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  useEffect(() => {
    const onResize = () => {
      if (window.matchMedia('(min-width: 1024px)').matches) setMobileNavOpen(false);
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const apiClient = createApiClient();
        await apiClient.get('/admin/me');
        setIsAuthenticated(true);
      } catch {
        console.warn("🔐 Admin session invalid or expired.");
        navigate('/admin-login');
      } finally {
        setIsChecking(false);
      }
    };
    checkAuth();
  }, [navigate]);

  if (isChecking) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#FAFAFA] dark:bg-[#111111]">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent"></div>
      </div>
    );
  }

  if (!isAuthenticated) return null;

  return (
    <div className="relative flex min-h-[100dvh] overflow-x-hidden bg-[#FAFAFA] font-sans dark:bg-[#111111]">
      <AdminSidebar mobileOpen={mobileNavOpen} onNavigate={() => setMobileNavOpen(false)} />

      <div className="flex min-h-[100dvh] min-w-0 flex-1 flex-col lg:ml-64">
        <header className="sticky top-0 z-[35] flex h-14 shrink-0 items-center gap-3 border-b border-[#E5E7EB] bg-white px-4 lg:hidden dark:border-[#2A2A2A] dark:bg-[#111111]">
          <button
            type="button"
            className="bh-touch inline-flex items-center justify-center rounded-lg border border-[#E5E7EB] bg-white p-2.5 text-[#171717] dark:border-[#2A2A2A] dark:bg-[#1A1A1A] dark:text-[#F5F5F5]"
            onClick={() => setMobileNavOpen(true)}
            aria-expanded={mobileNavOpen}
            aria-label="Open admin navigation"
          >
            <Menu size={22} strokeWidth={2} />
          </button>
          <span className="truncate text-base font-bold text-[#171717] dark:text-[#F5F5F5]">KainGo Admin</span>
        </header>

        <div className="relative flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="mx-auto max-w-7xl min-h-[calc(100dvh-8rem)] rounded-xl border border-[#E5E7EB] bg-white p-4 sm:p-6 lg:min-h-[calc(100dvh-4rem)] dark:border-[#2A2A2A] dark:bg-[#1A1A1A]">
            <Outlet />
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdminLayout;