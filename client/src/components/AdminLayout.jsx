import { Outlet, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { createApiClient } from '../services/apiClient.js';
import AdminSidebar from './AdminSidebar';

function AdminLayout() {
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const apiClient = createApiClient();
        await apiClient.get('/admin/me');
        setIsAuthenticated(true);
      } catch (err) {
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
    <div className="flex min-h-screen bg-slate-50 font-sans relative overflow-hidden">
      {/* Background ambient light blobs for glassmorphism effect */}
      <div className="fixed top-0 left-0 w-full h-full overflow-hidden pointer-events-none -z-10 bg-slate-50">
        <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] rounded-full bg-blue-200/40 blur-[120px]" />
        <div className="absolute top-[60%] right-[10%] w-[40%] h-[60%] rounded-full bg-indigo-200/30 blur-[120px]" />
        <div className="absolute bottom-[-10%] left-[20%] w-[30%] h-[30%] rounded-full bg-slate-300/40 blur-[100px]" />
      </div>
      
      <AdminSidebar />
      
      <div className="flex-1 ml-64 p-8 overflow-y-auto relative z-10 transition-all duration-300">
        <div className="max-w-7xl mx-auto backdrop-blur-md bg-white/40 rounded-3xl p-6 shadow-[0_8px_32px_rgba(0,0,0,0.04)] ring-1 ring-white/60 min-h-[calc(100vh-4rem)]">
           <Outlet />
        </div>
      </div>
    </div>
  );
}

export default AdminLayout;
