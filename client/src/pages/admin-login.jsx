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
    <div className="min-h-screen bg-[#111111] flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-[#1A1A1A] rounded-xl p-8 border border-[#2A2A2A] shadow-2xl">
        <div className="text-center mb-8">
          <div className="w-14 h-14 bg-[#EA580C]/10 rounded-xl flex items-center justify-center mx-auto mb-4">
            <ShieldAlert size={28} className="text-[#EA580C]" />
          </div>
          <h1 className="text-2xl font-bold text-[#F5F5F5] tracking-tight">System Admin</h1>
          <p className="text-[#A0A0A0] text-sm mt-1">Authorized personnel only</p>
        </div>

        {message && (
          <div className={`mb-6 p-3.5 rounded-lg border flex items-start gap-3 ${
            messageType === 'success'
            ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
            : 'bg-red-500/10 border-red-500/20 text-red-400'
          }`}>
            <div className="mt-0.5 shrink-0">
              {messageType === 'success' ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
            </div>
            <p className="text-sm font-medium">{message}</p>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-5">
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-[#A0A0A0]">Email Address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@bitehub.com"
              className="w-full px-4 py-3 bg-[#222222] border border-[#2A2A2A] rounded-xl text-[#F5F5F5] placeholder-[#6B7280] focus:outline-none focus:border-[#EA580C] focus:ring-1 focus:ring-[#EA580C]/30 transition-all text-sm"
            />
          </div>

          <div className="space-y-1.5 relative">
            <label className="block text-sm font-medium text-[#A0A0A0]">Password</label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-3 bg-[#222222] border border-[#2A2A2A] rounded-xl text-[#F5F5F5] placeholder-[#6B7280] focus:outline-none focus:border-[#EA580C] focus:ring-1 focus:ring-[#EA580C]/30 transition-all pr-12 text-sm tracking-wide"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-3 text-[#6B7280] hover:text-[#A0A0A0] transition-colors"
                tabIndex="-1"
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 px-4 bg-[#EA580C] hover:bg-[#EA580C]/90 disabled:bg-[#2A2A2A] disabled:text-[#6B7280] text-white font-semibold rounded-xl transition-all duration-200 shadow-lg shadow-[#EA580C]/20 hover:shadow-[#EA580C]/30 flex items-center justify-center gap-2 mt-6 text-sm"
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

        <div className="mt-8 text-center space-y-3">
          <button onClick={() => navigate('/')} className="text-sm text-[#6B7280] hover:text-[#F5F5F5] transition-colors">
            Return to Public Portal
          </button>
          <p className="text-xs text-[#6B7280]">
            By signing in, you agree to our{" "}
            <button type="button" onClick={() => navigate('/legal/terms')} className="font-medium text-[#A0A0A0] hover:text-[#EA580C] underline underline-offset-2 transition-colors">Terms &amp; Conditions</button>{" "}
            and{" "}
            <button type="button" onClick={() => navigate('/legal/privacy')} className="font-medium text-[#A0A0A0] hover:text-[#EA580C] underline underline-offset-2 transition-colors">Privacy Policy</button>.
          </p>
        </div>
      </div>
    </div>
  );
}

export default AdminLogin;
