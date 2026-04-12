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
      <div className="flex h-screen items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent shadow-lg text-blue-500"></div>
      </div>
    );
  }

  if (!isAuthenticated) return null;

  return (
    <div className="relative flex min-h-[100dvh] overflow-x-hidden bg-slate-50 font-sans">
      <div className="pointer-events-none fixed top-0 left-0 -z-10 h-full w-full overflow-hidden bg-slate-50">
        <div className="absolute -top-[20%] -left-[10%] h-[50%] w-[50%] rounded-full bg-blue-200/40 blur-[120px]" />
        <div className="absolute top-[60%] right-[10%] h-[60%] w-[40%] rounded-full bg-indigo-200/30 blur-[120px]" />
        <div className="absolute bottom-[-10%] left-[20%] h-[30%] w-[30%] rounded-full bg-slate-300/40 blur-[100px]" />
      </div>

      <AdminSidebar mobileOpen={mobileNavOpen} onNavigate={() => setMobileNavOpen(false)} />

      <div className="flex min-h-[100dvh] min-w-0 flex-1 flex-col lg:ml-64">
        <header className="sticky top-0 z-[35] flex h-14 shrink-0 items-center gap-3 border-b border-slate-200/80 bg-white/90 px-4 backdrop-blur-md lg:hidden">
          <button
            type="button"
            className="bh-touch inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white p-2.5 text-slate-700 shadow-sm"
            onClick={() => setMobileNavOpen(true)}
            aria-expanded={mobileNavOpen}
            aria-label="Open admin navigation"
          >
            <Menu size={22} strokeWidth={2} />
          </button>
          <span className="truncate text-base font-bold text-slate-800">BiteHub Admin</span>
        </header>

        <div className="relative z-10 flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="mx-auto max-w-7xl min-h-[calc(100dvh-8rem)] rounded-3xl bg-white/40 p-4 shadow-[0_8px_32px_rgba(0,0,0,0.04)] ring-1 ring-white/60 backdrop-blur-md sm:p-6 lg:min-h-[calc(100dvh-4rem)]">
            <Outlet />
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdminLayout;
