import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Eye, EyeOff, Mail, Lock, ArrowRight, CheckCircle, AlertCircle } from 'lucide-react'
import { createApiClient, getStoredAuthToken } from './services/apiClient'
import kaingoLogo from './assets/kaingo-logo.svg'

function Login() {
	const navigate = useNavigate();
	const [email, setEmail] = useState('');
	const [password, setPassword] = useState('');
	const [showPassword, setShowPassword] = useState(false);
	const [rememberMe, setRememberMe] = useState(false);
	const [isLoading, setIsLoading] = useState(false);
	const [message, setMessage] = useState('');
	const [messageType, setMessageType] = useState('');
	const [errors, setErrors] = useState({});

	const validateForm = () => {
		const newErrors = {};
		if (!email.trim()) {
			newErrors.email = 'Email address is required';
		} else if (!/\S+@\S+\.\S+/.test(email)) {
			newErrors.email = 'Email address is invalid';
		}
		if (!password) {
			newErrors.password = 'Password is required';
		} else if (password.length < 6) {
			newErrors.password = 'Password must be at least 6 characters';
		}
		return newErrors;
	};

	const handleLogin = async (e) => {
		e.preventDefault();
		const newErrors = validateForm();
		if (Object.keys(newErrors).length > 0) {
			setErrors(newErrors);
			setMessage('Please fill in all fields correctly');
			setMessageType('error');
			return;
		}
		setIsLoading(true);
		setErrors({});
		setMessage('');
		try {
			const apiClient = createApiClient();
			const response = await apiClient.post('/customer/login', {
				email: email.trim(),
				password: password
			});
			if (response.data.success) {
				const { token } = response.data;
				if (token) {
					localStorage.setItem('authToken', String(token).trim());
				}
				if (!getStoredAuthToken()) {
					setMessage('Login succeeded but no auth token was returned. Please try again.');
					setMessageType('error');
					return;
				}
				setMessage('Login successful! Redirecting...');
				setMessageType('success');
				if (rememberMe) {
					localStorage.setItem('rememberMe', JSON.stringify({ email: email.trim() }));
				}
				setTimeout(() => navigate('/home'), 800);
			} else {
				setMessage(response.data.message || 'Login failed');
				setMessageType('error');
			}
		} catch (error) {
			setMessage(error.response?.data?.message || error.message || 'An error occurred during login');
			setMessageType('error');
		} finally {
			setIsLoading(false);
		}
	};

	const handleSocialLogin = (provider) => {
		setMessage(`${provider} login is coming soon!`);
		setMessageType('info');
	};

	return (
		<div className="min-h-screen bg-[#FAFAFA] flex items-center justify-center py-12 px-4 relative overflow-hidden">
			{/* Subtle background accents */}
			<div className="absolute top-0 right-0 w-96 h-96 bg-[#FFF7ED] rounded-full -translate-y-1/2 translate-x-1/3 blur-3xl opacity-60" />
			<div className="absolute bottom-0 left-0 w-96 h-96 bg-[#FFF7ED] rounded-full translate-y-1/2 -translate-x-1/3 blur-3xl opacity-60" />

			<div className="w-full max-w-md relative z-10">
				{/* Back link */}
				<button
					onClick={() => navigate('/')}
					className="mb-8 text-sm font-medium text-[#6B7280] hover:text-[#EA580C] flex items-center gap-1.5 transition-colors"
				>
					← Back to KainGo
				</button>

				{/* Logo */}
				<div className="flex items-center gap-2.5 mb-8">
					<div className="w-10 h-10 rounded-xl overflow-hidden flex items-center justify-center">
						<img src={kaingoLogo} alt="" className="w-10 h-10 object-contain" />
					</div>
					<span className="text-xl font-bold tracking-tight text-[#171717]">
						Kain<span className="text-[#EA580C]">Go</span>
					</span>
				</div>

				{/* Card */}
				<div className="bg-white rounded-2xl border border-[#E5E7EB] p-8 shadow-sm">
					<div className="mb-6">
						<h1 className="text-2xl font-bold text-[#171717] tracking-tight">Welcome back</h1>
						<p className="text-sm text-[#6B7280] mt-1">Sign in to your account to continue</p>
					</div>

					{/* Status Message */}
					{message && (
						<div className={`mb-5 p-3 rounded-xl flex items-start gap-3 text-sm font-medium ${
							messageType === 'success'
								? 'bg-[#F0FDF4] text-[#16A34A] border border-[#BBF7D0]'
								: messageType === 'error'
									? 'bg-[#FEF2F2] text-[#DC2626] border border-[#FECACA]'
									: 'bg-[#EFF6FF] text-[#2563EB] border border-[#BFDBFE]'
						}`}>
							{messageType === 'success' && <CheckCircle size={18} className="mt-0.5 shrink-0" />}
							{messageType === 'error' && <AlertCircle size={18} className="mt-0.5 shrink-0" />}
							{messageType === 'info' && <Mail size={18} className="mt-0.5 shrink-0" />}
							<p>{message}</p>
						</div>
					)}

					<form onSubmit={handleLogin} className="space-y-4">
						{/* Email */}
						<div>
							<label htmlFor="email" className="block text-sm font-medium text-[#374151] mb-1.5">
								Email address
							</label>
							<div className="relative">
								<Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#9CA3AF]" />
								<input
									id="email"
									type="email"
									value={email}
									onChange={(e) => { setEmail(e.target.value); if (errors.email) setErrors({ ...errors, email: '' }); }}
									placeholder="you@university.edu"
									className={`w-full pl-10 pr-4 py-2.5 bg-[#FAFAFA] border rounded-xl text-sm text-[#171717] placeholder-[#9CA3AF] transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#EA580C]/20 focus:border-[#EA580C] ${
										errors.email ? 'border-[#DC2626] bg-[#FEF2F2]' : 'border-[#E5E7EB]'
									}`}
								/>
							</div>
							{errors.email && <p className="mt-1 text-xs text-[#DC2626]">{errors.email}</p>}
						</div>

						{/* Password */}
						<div>
							<label htmlFor="password" className="block text-sm font-medium text-[#374151] mb-1.5">
								Password
							</label>
							<div className="relative">
								<Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#9CA3AF]" />
								<input
									id="password"
									type={showPassword ? "text" : "password"}
									value={password}
									onChange={(e) => { setPassword(e.target.value); if (errors.password) setErrors({ ...errors, password: '' }); }}
									placeholder="Enter your password"
									className={`w-full pl-10 pr-11 py-2.5 bg-[#FAFAFA] border rounded-xl text-sm text-[#171717] placeholder-[#9CA3AF] transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#EA580C]/20 focus:border-[#EA580C] ${
										errors.password ? 'border-[#DC2626] bg-[#FEF2F2]' : 'border-[#E5E7EB]'
									}`}
								/>
								<button
									type="button"
									onClick={() => setShowPassword(!showPassword)}
									className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9CA3AF] hover:text-[#6B7280] transition-colors"
									aria-label={showPassword ? "Hide password" : "Show password"}
								>
									{showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
								</button>
							</div>
							{errors.password && <p className="mt-1 text-xs text-[#DC2626]">{errors.password}</p>}
						</div>

						{/* Remember & Forgot */}
						<div className="flex items-center justify-between">
							<label className="flex items-center gap-2 cursor-pointer">
								<input
									type="checkbox"
									checked={rememberMe}
									onChange={(e) => setRememberMe(e.target.checked)}
									className="w-4 h-4 rounded border-[#D1D5DB] text-[#EA580C] focus:ring-[#EA580C] transition-colors"
								/>
								<span className="text-sm text-[#6B7280]">Remember me</span>
							</label>
							<button type="button" className="text-sm font-medium text-[#EA580C] hover:text-[#DC2626] transition-colors">
								Forgot password?
							</button>
						</div>

						{/* Submit */}
						<button
							type="submit"
							disabled={isLoading}
							className="w-full py-2.5 px-4 bg-[#EA580C] hover:bg-[#DC2626] disabled:bg-[#D1D5DB] disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-all duration-200 shadow-sm hover:shadow-md active:scale-[0.98] flex items-center justify-center gap-2 text-sm"
						>
							{isLoading ? (
								<div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
							) : (
								<>
									Sign In
									<ArrowRight size={16} />
								</>
							)}
						</button>
					</form>

					{/* Divider */}
					<div className="relative my-6">
						<div className="absolute inset-0 flex items-center">
							<div className="w-full border-t border-[#E5E7EB]" />
						</div>
						<div className="relative flex justify-center text-[11px]">
							<span className="px-3 bg-white text-[#9CA3AF] font-medium uppercase tracking-wider">or continue with</span>
						</div>
					</div>

					{/* Social */}
					<div className="grid grid-cols-2 gap-3">
						<button
							type="button"
							onClick={() => handleSocialLogin('Google')}
							className="py-2.5 px-4 border border-[#E5E7EB] rounded-xl text-sm font-medium text-[#374151] hover:bg-[#F9FAFB] hover:border-[#D1D5DB] transition-all duration-200 flex items-center justify-center gap-2"
						>
							<span className="text-base">G</span>
							Google
						</button>
						<button
							type="button"
							onClick={() => handleSocialLogin('GitHub')}
							className="py-2.5 px-4 border border-[#E5E7EB] rounded-xl text-sm font-medium text-[#374151] hover:bg-[#F9FAFB] hover:border-[#D1D5DB] transition-all duration-200 flex items-center justify-center gap-2"
						>
							<span className="text-base">Gh</span>
							GitHub
						</button>
					</div>
				</div>

				{/* Register link */}
				<p className="text-center text-sm text-[#6B7280] mt-6">
					Don't have an account?{" "}
					<button
						onClick={() => navigate('/register')}
						className="font-semibold text-[#EA580C] hover:text-[#DC2626] transition-colors"
					>
						Create account
					</button>
				</p>
			</div>
		</div>
	)
}

export default Login
