import { Outlet, useNavigate } from 'react-router-dom';
import { useEffect, useState, createContext, useContext, useRef, useCallback } from 'react';
import { Menu } from 'lucide-react';
import { createApiClient } from '../services/apiClient.js';
import OwnerSidebar from './OwnerSidebar';
import { Clock, XCircle, CheckCircle, PartyPopper, X } from 'lucide-react';

// Context so any child page can read approvalStatus
export const ApprovalContext = createContext({ approvalStatus: 'approved' });
export const useApproval = () => useContext(ApprovalContext);

// ─── Pending / Rejected persistent banner ────────────────────────────────────
function StatusBanner({ status }) {
  if (status === 'approved') return null;

  if (status === 'rejected') {
    return (
      <div className="mb-6 flex items-start gap-4 rounded-xl border border-red-200 dark:border-red-500/30 bg-red-50 dark:bg-red-500/10 px-5 py-4">
        <XCircle size={20} className="mt-0.5 shrink-0 text-red-600 dark:text-red-400" />
        <div>
          <div className="mb-1 flex items-center gap-3">
            <h3 className="text-sm font-bold text-[#171717] dark:text-[#F5F5F5]">Registration Rejected</h3>
            <span className="rounded-full bg-red-100 dark:bg-red-500/20 px-2 py-0.5 text-[10px] font-black uppercase tracking-widest text-red-700 dark:text-red-400">REJECTED</span>
          </div>
          <p className="text-sm text-[#6B7280] dark:text-[#A0A0A0]">Your registration was rejected by an administrator. Please contact KainGo support for more information or to appeal this decision.</p>
        </div>
      </div>
    );
  }

  // pending
  return (
    <div className="mb-6 flex items-start gap-4 rounded-xl border border-amber-200 dark:border-amber-500/30 bg-amber-50 dark:bg-amber-500/10 px-5 py-4">
      <Clock size={20} className="mt-0.5 shrink-0 animate-pulse text-amber-600 dark:text-amber-400" />
      <div className="min-w-0 flex-1">
        <div className="mb-1 flex items-center gap-3 flex-wrap">
          <h3 className="text-sm font-bold text-[#171717] dark:text-[#F5F5F5]">Account Pending Approval</h3>
          <span className="rounded-full bg-amber-100 dark:bg-amber-500/20 px-2 py-0.5 text-[10px] font-black uppercase tracking-widest text-amber-700 dark:text-amber-400">PENDING REVIEW</span>
        </div>
        <p className="text-sm leading-relaxed text-[#6B7280] dark:text-[#A0A0A0]">
          Your registration is under review by the KainGo admin team. You can explore your dashboard, but posting menus and managing inventory will be unlocked once approved.
          <span className="ml-1 font-medium text-amber-700 dark:text-amber-400">This page checks automatically — you'll be notified the moment you're approved!</span>
        </p>
      </div>
    </div>
  );
}

// ─── One-time Approval Celebration Toast ─────────────────────────────────────
function ApprovalToast({ onDismiss }) {
  useEffect(() => {
    const t = setTimeout(onDismiss, 12000); // auto-dismiss after 12s
    return () => clearTimeout(t);
  }, [onDismiss]);

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 max-w-sm w-auto sm:left-auto sm:right-6 sm:w-full animate-slide-up">
      <div className="flex items-start gap-4 rounded-xl bg-[#EA580C] p-5 text-white">
        <div className="shrink-0 rounded-lg bg-white/15 p-2">
          <CheckCircle size={24} />
        </div>
        <div className="flex-1">
          <p className="text-base font-bold">You're Approved!</p>
          <p className="mt-0.5 text-sm text-[#F5F5F5]/90">
            Congratulations! Your KainGo restaurant account has been approved. You now have full access — start adding your menu!
          </p>
          <button
            onClick={onDismiss}
            className="mt-3 rounded-lg px-3 py-1.5 text-xs font-bold transition-colors hover:bg-white/20"
          >
            Got it, let's go! →
          </button>
        </div>
        <button onClick={onDismiss} className="shrink-0 text-[#F5F5F5]/70 transition-colors hover:text-white">
          <X size={18} />
        </button>
      </div>
    </div>
  );
}

// ─── Main Layout ─────────────────────────────────────────────────────────────
function OwnerLayout() {
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isChecking, setIsChecking] = useState(true);
  const [approvalStatus, setApprovalStatus] = useState('approved');
  const [showApprovalToast, setShowApprovalToast] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const pollRef = useRef(null);

  useEffect(() => {
    const onResize = () => {
      if (window.matchMedia('(min-width: 1024px)').matches) setMobileNavOpen(false);
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const checkSession = useCallback(async (isPoll = false) => {
    try {
      const apiClient = createApiClient();
      const res = await apiClient.get('/owner/session');

      if (!res.data.session) {
        navigate('/restaurant-login');
        return;
      }

      const newStatus = res.data.approvalStatus || 'approved';

      setApprovalStatus(prev => {
        // Detect transition from pending → approved (while on page)
        if (isPoll && prev === 'pending' && newStatus === 'approved') {
          // Show toast only once per session
          const TOAST_KEY = `approval_toast_shown_${res.data.restaurantId}`;
          if (!sessionStorage.getItem(TOAST_KEY)) {
            sessionStorage.setItem(TOAST_KEY, '1');
            setShowApprovalToast(true);
          }
        }
        return newStatus;
      });

      setIsAuthenticated(true);
    } catch {
      if (!isPoll) navigate('/restaurant-login');
    } finally {
      if (!isPoll) setIsChecking(false);
    }
  }, [navigate]);

  useEffect(() => {
    checkSession(false);

    // Poll every 5 seconds for a snappy "real-time" approval experience
    pollRef.current = setInterval(() => checkSession(true), 5000);

    return () => clearInterval(pollRef.current);
  }, [checkSession]);

  if (isChecking) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#FAFAFA] dark:bg-[#111111]">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-[#EA580C] border-t-transparent" />
      </div>
    );
  }

  if (!isAuthenticated) return null;

  return (
    <ApprovalContext.Provider value={{ approvalStatus }}>
      <div className="relative flex min-h-[100dvh] overflow-x-hidden bg-[#FAFAFA] font-sans dark:bg-[#111111]">
        <OwnerSidebar mobileOpen={mobileNavOpen} onNavigate={() => setMobileNavOpen(false)} />

        <div className="relative flex min-h-[100dvh] min-w-0 flex-1 flex-col lg:ml-64">
          <header className="sticky top-0 z-[35] flex h-14 shrink-0 items-center gap-3 border-b border-[#E5E7EB] bg-white px-4 lg:hidden dark:border-[#2A2A2A] dark:bg-[#111111]">
            <button
              type="button"
              className="bh-touch inline-flex items-center justify-center rounded-lg border border-[#E5E7EB] bg-white p-2.5 text-[#171717] dark:border-[#2A2A2A] dark:bg-[#1A1A1A] dark:text-[#F5F5F5]"
              onClick={() => setMobileNavOpen(true)}
              aria-expanded={mobileNavOpen}
              aria-label="Open owner navigation"
            >
              <Menu size={22} strokeWidth={2} />
            </button>
            <span className="truncate text-base font-bold text-[#171717] dark:text-[#F5F5F5]">Restaurant</span>
          </header>

          <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
            <StatusBanner status={approvalStatus} />
            <Outlet />
          </div>
        </div>

        {showApprovalToast && (
          <ApprovalToast onDismiss={() => setShowApprovalToast(false)} />
        )}
      </div>

      <style>{`
        @keyframes slide-up {
          from { opacity: 0; transform: translateY(24px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .animate-slide-up { animation: slide-up 0.4s ease-out forwards; }
      `}</style>
    </ApprovalContext.Provider>
  );
}

export default OwnerLayout;