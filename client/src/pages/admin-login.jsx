import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Lock, ArrowRight, ShieldAlert, CheckCircle, AlertCircle } from 'lucide-react';
import axios from 'axios';
import { getApiBaseUrl } from '../services/apiClient';

function AdminLogin() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setMessage('Please fill in both email and password');
      setMessageType('error');
      return;
    }

    setIsLoading(true);
    setMessage('');

    try {
      const baseURL = getApiBaseUrl();
      const response = await axios.post(`${baseURL}/api/admin/login`, { email, password }, { withCredentials: true });
      
      if (response.data.success) {
        const { token } = response.data;
        if (token) {
          localStorage.setItem('authToken', token);
          console.log("✅ Admin auth token stored");
        }
        setMessage('Admin login successful. Redirecting...');
        setMessageType('success');
        setTimeout(() => navigate('/admin/dashboard'), 800);
      } else {
        setMessage(response.data.message || 'Login failed');
        setMessageType('error');
      }
    } catch (error) {
      setMessage(error.response?.data?.message || 'An error occurred during login');
      setMessageType('error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Decorative background */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/20 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-600/20 rounded-full blur-[120px] pointer-events-none" />

      <div className="w-full max-w-md bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl relative z-10 animate-fade-in scale-100">
        
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-blue-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-blue-500/30 shadow-inner">
            <ShieldAlert size={32} className="text-blue-400" />
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">System Admin</h1>
          <p className="text-slate-400 text-sm mt-1">Authorized personnel only</p>
        </div>

        {message && (
          <div className={`mb-6 p-4 rounded-xl border flex items-start gap-3 backdrop-blur-sm ${
            messageType === 'success' 
            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' 
            : 'bg-red-500/10 border-red-500/30 text-red-400'
          }`}>
            <div className="mt-0.5">
              {messageType === 'success' ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
            </div>
            <p className="text-sm font-medium">{message}</p>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-5">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-slate-300">Email Address</label>
            <input 
              type="email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@bitehub.com"
              className="w-full px-4 py-3 bg-slate-900/50 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50 transition-all font-mono"
            />
          </div>

          <div className="space-y-2 relative">
            <label className="block text-sm font-medium text-slate-300 flex items-center gap-2">
               Password
            </label>
            <div className="relative">
              <input 
                type={showPassword ? "text" : "password"} 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-3 bg-slate-900/50 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50 transition-all pr-12 font-mono tracking-widest"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-3 text-slate-500 hover:text-slate-300 transition-colors"
                tabIndex="-1"
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          <button 
            type="submit" 
            disabled={isLoading}
            className="w-full py-3.5 px-4 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 text-white font-semibold rounded-xl transition-all duration-200 shadow-lg shadow-blue-500/20 hover:shadow-blue-500/40 flex items-center justify-center gap-2 mt-8 ring-1 ring-white/10 group"
          >
            {isLoading ? (
              <div className="animate-spin rounded-full h-5 w-5 border-2 border-white/30 border-t-white" />
            ) : (
              <>
                <span>Authenticate</span>
                <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
              </>
            )}
          </button>
        </form>

        <div className="mt-8 text-center">
            <button onClick={() => navigate('/')} className="text-sm text-slate-500 hover:text-white transition-colors">
              Return to Public Portal
            </button>
        </div>
      </div>
      <style>{`
        @keyframes fade-in { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        .animate-fade-in { animation: fade-in 0.6s ease-out forwards; }
      `}</style>
    </div>
  );
}

export default AdminLogin;
