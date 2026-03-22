import { Outlet, useNavigate } from 'react-router-dom';
import { useEffect, useState, createContext, useContext, useRef, useCallback } from 'react';
import axios from 'axios';
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
      <div className="border-l-4 border-red-400 bg-red-50 px-5 py-4 rounded-2xl mb-6 flex items-start gap-4 shadow-sm">
        <XCircle size={20} className="text-red-600 shrink-0 mt-0.5" />
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h3 className="font-bold text-slate-800 text-sm">❌ Registration Rejected</h3>
            <span className="text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full bg-red-100 text-red-700">REJECTED</span>
          </div>
          <p className="text-slate-600 text-sm">Your registration was rejected by an administrator. Please contact BiteHub support for more information or to appeal this decision.</p>
        </div>
      </div>
    );
  }

  // pending
  return (
    <div className="border-l-4 border-amber-400 bg-amber-50 px-5 py-4 rounded-2xl mb-6 flex items-start gap-4 shadow-sm">
      <Clock size={20} className="text-amber-600 shrink-0 mt-0.5 animate-pulse" />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-3 mb-1 flex-wrap">
          <h3 className="font-bold text-slate-800 text-sm">⏳ Account Pending Approval</h3>
          <span className="text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">PENDING REVIEW</span>
        </div>
        <p className="text-slate-600 text-sm leading-relaxed">
          Your registration is under review by the BiteHub admin team. You can explore your dashboard, but posting menus and managing inventory will be unlocked once approved.
          <span className="ml-1 font-medium text-amber-700">This page checks automatically — you'll be notified the moment you're approved!</span>
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
    <div className="fixed bottom-6 right-6 z-50 max-w-sm w-full animate-slide-up">
      <div className="bg-emerald-600 text-white rounded-3xl shadow-2xl p-5 flex items-start gap-4">
        <div className="bg-white/20 rounded-2xl p-2 shrink-0">
          <CheckCircle size={24} className="text-white" />
        </div>
        <div className="flex-1">
          <p className="font-bold text-base">🎉 You're Approved!</p>
          <p className="text-emerald-100 text-sm mt-0.5">
            Congratulations! Your BiteHub restaurant account has been approved. You now have full access — start adding your menu!
          </p>
          <button
            onClick={onDismiss}
            className="mt-3 text-xs font-bold bg-white/20 hover:bg-white/30 transition-colors px-3 py-1.5 rounded-xl"
          >
            Got it, let's go! →
          </button>
        </div>
        <button onClick={onDismiss} className="text-white/60 hover:text-white transition-colors shrink-0">
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
  const pollRef = useRef(null);

  const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

  const checkSession = useCallback(async (isPoll = false) => {
    try {
      const res = await axios.get(`${baseURL}/api/owner/session`, { withCredentials: true });

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
  }, [baseURL, navigate]);

  useEffect(() => {
    checkSession(false);

    // Poll every 5 seconds for a snappy "real-time" approval experience
    pollRef.current = setInterval(() => checkSession(true), 5000);

    return () => clearInterval(pollRef.current);
  }, [checkSession]);

  if (isChecking) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-orange-500 border-t-transparent" />
      </div>
    );
  }

  if (!isAuthenticated) return null;

  return (
    <ApprovalContext.Provider value={{ approvalStatus }}>
      <div className="flex min-h-screen bg-slate-50 font-sans relative overflow-hidden">
        <div className="fixed top-0 left-0 w-full h-full overflow-hidden pointer-events-none -z-10">
          <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] rounded-full bg-orange-200/30 blur-[120px]" />
          <div className="absolute top-[60%] -right-[10%] w-[40%] h-[60%] rounded-full bg-blue-200/20 blur-[120px]" />
        </div>

        <OwnerSidebar />

        <div className="flex-1 ml-64 p-8 overflow-y-auto relative z-10">
          <StatusBanner status={approvalStatus} />
          <Outlet />
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
