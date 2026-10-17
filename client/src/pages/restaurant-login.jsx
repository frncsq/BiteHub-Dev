import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Eye, EyeOff, Mail, Lock, ArrowRight, CheckCircle, AlertCircle, ChefHat, Clock } from 'lucide-react'
import axios from 'axios';
import { getApiBaseUrl } from '../services/apiClient';

function RestaurantLogin() {
	const navigate = useNavigate();
	const [email, setEmail] = useState('');
	const [password, setPassword] = useState('');
	const [showPassword, setShowPassword] = useState(false);
	const [rememberMe, setRememberMe] = useState(false);
	const [isLoading, setIsLoading] = useState(false);
	const [message, setMessage] = useState('');
	const [messageType, setMessageType] = useState('');
	const [errors, setErrors] = useState({});
	const [approvalStatus, setApprovalStatus] = useState(null); // 'pending' | 'rejected' | null

	const validateForm = () => {
		const newErrors = {};
		if (!email.trim()) {
			newErrors.email = 'Business email is required';
		} else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
			newErrors.email = 'Please enter a valid email address';
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
			const baseURL = getApiBaseUrl();
			const response = await axios.post(`${baseURL}/api/owner/login`, {
				username: email.trim(),
				password: password
			}, { withCredentials: true });

			if (response.data.success) {
				const { token } = response.data;
				if (token) {
					localStorage.setItem('authToken', token);
					console.log("✅ Owner auth token stored");
				}

				// Both pending and approved: redirect to dashboard
				if (rememberMe) {
					localStorage.setItem('rememberMe', JSON.stringify({ email: email.trim() }));
				}
				navigate('/owner/dashboard');
			} else {
				setMessage(response.data.message || 'Login failed');
				setMessageType('error');
			}
		} catch (error) {
			const errData = error.response?.data;
			if (errData?.approvalStatus === 'rejected') {
				// Hard block: only rejected accounts are blocked at login
				setApprovalStatus('rejected');
				setMessage(errData.message);
				setMessageType('error');
			} else {
				setApprovalStatus(null);
				setMessage(errData?.message || error.message || 'An error occurred during login');
				setMessageType('error');
			}
		} finally {
			setIsLoading(false);
		}
	};

	const handleRegisterLink = () => {
		navigate('/restaurant-register');
	};

	const handleBackToRoles = () => {
		navigate('/');
	};

	return (
		<div className="min-h-screen bg-[#FAFAFA] flex items-center justify-center py-12 px-4">
			<div className="w-full max-w-3xl relative z-10">
				{/* Desktop Two-Column Layout */}
				<div className="hidden lg:grid lg:grid-cols-2 gap-8 items-center">
					{/* Left Column - Form */}
					<div>
						<button
							onClick={handleBackToRoles}
							className="mb-6 text-[#EA580C] hover:text-[#EA580C]/80 font-semibold flex items-center gap-2 transition-colors text-sm"
						>
							← Back to role selection
						</button>

						<div className="mb-6">
							<h1 className="text-3xl font-bold text-[#171717] tracking-tight">Restaurant Login</h1>
							<p className="text-sm text-[#6B7280] mt-1">Access your restaurant dashboard and manage orders</p>
						</div>

						<form onSubmit={handleLogin} className="space-y-4">
							{/* Global Status Messages */}
							{message && (
								<div className={`p-3.5 rounded-lg border flex items-start gap-3 ${messageType === 'success'
										? 'bg-emerald-50 border-emerald-200 text-emerald-700'
										: messageType === 'warning'
											? 'bg-amber-50 border-amber-200 text-amber-700'
											: messageType === 'error'
												? 'bg-red-50 border-red-200 text-red-700'
												: 'bg-blue-50 border-blue-200 text-blue-700'
									}`}>
									<div className="mt-0.5 shrink-0">
										{messageType === 'success' && <CheckCircle size={18} />}
										{messageType === 'warning' && <Clock size={18} />}
										{messageType === 'error' && <AlertCircle size={18} />}
										{messageType === 'info' && <Mail size={18} />}
									</div>
									<p className="text-sm font-medium">{message}</p>
								</div>
							)}

							{/* Email Input */}
							<div className="space-y-1.5">
								<label htmlFor="email" className="block text-xs font-semibold text-[#171717]">
									Business Email
								</label>
								<div className="relative">
									<input
										id="email"
										type="email"
										value={email}
										onChange={(e) => {
											setEmail(e.target.value);
											if (errors.email) {
												setErrors({ ...errors, email: '' });
											}
										}}
										placeholder="admin@restaurant.com"
										aria-label="Business Email"
										aria-invalid={!!errors.email}
										aria-describedby={errors.email ? 'email-error' : undefined}
										className={`w-full px-3.5 py-2.5 bg-[#FAFAFA] border rounded-xl transition-all duration-200 placeholder-[#9CA3AF] focus:outline-none text-sm ${errors.email
												? 'border-red-400 focus:ring-2 focus:ring-red-100 bg-red-50/50'
												: 'border-[#E5E7EB] focus:border-[#EA580C] focus:ring-2 focus:ring-[#EA580C]/10'
											}`}
									/>
									{errors.email && (
										<div className="absolute right-3 top-3">
											<AlertCircle size={18} className="text-red-500" />
										</div>
									)}
								</div>
								{errors.email && (
									<p id="email-error" className="text-sm text-red-600 flex items-center gap-1">
										<span>•</span> {errors.email}
									</p>
								)}
							</div>

							{/* Password Input */}
							<div className="space-y-1.5">
								<label htmlFor="password" className="block text-xs font-semibold text-[#171717]">
									Password
								</label>
								<div className="relative">
									<input
										id="password"
										type={showPassword ? "text" : "password"}
										value={password}
										onChange={(e) => {
											setPassword(e.target.value);
											if (errors.password) {
												setErrors({ ...errors, password: '' });
											}
										}}
										placeholder="••••••••"
										aria-label="Password"
										aria-invalid={!!errors.password}
										aria-describedby={errors.password ? 'password-error' : undefined}
										className={`w-full px-3.5 py-2.5 bg-[#FAFAFA] border rounded-xl transition-all duration-200 placeholder-[#9CA3AF] focus:outline-none pr-12 text-sm ${errors.password
												? 'border-red-400 focus:ring-2 focus:ring-red-100 bg-red-50/50'
												: 'border-[#E5E7EB] focus:border-[#EA580C] focus:ring-2 focus:ring-[#EA580C]/10'
											}`}
									/>
									<button
										type="button"
										onClick={() => setShowPassword(!showPassword)}
										className="absolute right-3 top-3 text-[#9CA3AF] hover:text-[#6B7280] transition-colors"
										aria-label={showPassword ? "Hide password" : "Show password"}
									>
										{showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
									</button>
								</div>
								{errors.password && (
									<p id="password-error" className="text-sm text-red-600 flex items-center gap-1">
										<span>•</span> {errors.password}
									</p>
								)}
							</div>

							{/* Remember Me & Forgot Password */}
							<div className="flex items-center justify-between pt-1">
								<label className="flex items-center gap-2 cursor-pointer group">
									<input
										type="checkbox"
										checked={rememberMe}
										onChange={(e) => setRememberMe(e.target.checked)}
										className="w-4 h-4 rounded border-[#D1D5DB] text-[#EA580C] focus:ring-[#EA580C]/30 transition-colors"
										aria-label="Remember me"
									/>
									<span className="text-sm text-[#6B7280] group-hover:text-[#171717] transition-colors">Remember me</span>
								</label>
								<button
									type="button"
									className="text-xs font-semibold text-[#EA580C] hover:text-[#EA580C]/80 transition-colors"
								>
									Forgot password?
								</button>
							</div>

							{/* Primary Login Button */}
							<button
								type="submit"
								disabled={isLoading}
								className="w-full py-3 px-4 bg-[#EA580C] hover:bg-[#EA580C]/90 disabled:bg-[#D1D5DB] disabled:text-[#9CA3AF] text-white font-semibold rounded-xl transition-all duration-200 shadow-md shadow-[#EA580C]/15 hover:shadow-lg hover:shadow-[#EA580C]/20 disabled:shadow-none flex items-center justify-center gap-2 text-sm mt-2"
								aria-label="Sign in"
							>
								{isLoading ? (
									<>
										<div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
										<span>Signing in...</span>
									</>
								) : (
									<>
										<span>Sign In</span>
										<ArrowRight size={16} />
									</>
								)}
							</button>

							{/* Register Link */}
							<p className="text-center text-[#6B7280] text-sm pt-4 border-t border-[#E5E7EB]">
								Don't have a restaurant account?{" "}
								<button
									type="button"
									onClick={handleRegisterLink}
									className="font-semibold text-[#EA580C] hover:text-[#EA580C]/80 transition-colors"
								>
									Register here
								</button>
							</p>
						</form>
					</div>

					{/* Right Column - Illustration */}
					<div className="hidden lg:flex flex-col items-center justify-center space-y-4">
						<div className="relative w-full h-64 bg-[#FAFAFA] rounded-xl flex items-center justify-center overflow-hidden border border-[#E5E7EB]">
							<div className="absolute top-4 left-4 w-12 h-12 bg-[#EA580C]/5 rounded-full"></div>
							<div className="absolute bottom-4 right-4 w-20 h-20 bg-[#EA580C]/5 rounded-full"></div>
							<div className="relative z-10 text-6xl">
								👨‍🍳
							</div>
						</div>

						<div className="space-y-1 text-center">
							<h2 className="text-xl font-bold text-[#171717] tracking-tight">Manage Your Restaurant</h2>
							<p className="text-[#6B7280] text-xs max-w-[200px] leading-relaxed">
								Access your dashboard to manage orders, menu items, delivery settings, and grow your business with KainGo.
							</p>
							<div className="flex items-center justify-center gap-1.5 pt-2 text-[11px] text-[#6B7280] font-medium">
								<CheckCircle size={14} className="text-[#EA580C]" />
								<span>Secure & Reliable</span>
							</div>
						</div>
					</div>
				</div>

				{/* Mobile Single Column Layout */}
				<div className="lg:hidden">
					<button
						onClick={handleBackToRoles}
						className="mb-6 text-[#EA580C] hover:text-[#EA580C]/80 font-semibold flex items-center gap-2 transition-colors text-sm"
					>
						← Back
					</button>

					<div className="bg-white rounded-xl shadow-sm overflow-hidden border border-[#E5E7EB]">
						{/* Header */}
						<div className="bg-[#111111] px-6 py-6 relative overflow-hidden">
							<div className="absolute top-0 right-0 w-32 h-32 bg-[#EA580C]/10 rounded-full -mr-16 -mt-16"></div>
							<div className="absolute bottom-0 left-0 w-24 h-24 bg-[#EA580C]/10 rounded-full -ml-12 -mb-12"></div>
							<div className="relative z-10 flex items-center gap-3">
								<ChefHat size={28} className="text-[#EA580C]" />
								<div>
									<h1 className="text-2xl font-bold text-[#F5F5F5]">Restaurant Login</h1>
									<p className="text-[#A0A0A0] text-sm">Manage your business</p>
								</div>
							</div>
						</div>

						{/* Form Container */}
						<div className="px-6 py-6 space-y-5">
							{/* Status Messages */}
							{message && (
								<div className={`p-3.5 rounded-lg border flex items-start gap-3 ${messageType === 'success'
										? 'bg-emerald-50 border-emerald-200 text-emerald-700'
										: messageType === 'warning'
											? 'bg-amber-50 border-amber-200 text-amber-700'
											: messageType === 'error'
												? 'bg-red-50 border-red-200 text-red-700'
												: 'bg-blue-50 border-blue-200 text-blue-700'
									}`}>
									<div className="mt-0.5 shrink-0">
										{messageType === 'success' && <CheckCircle size={18} />}
										{messageType === 'warning' && <Clock size={18} />}
										{messageType === 'error' && <AlertCircle size={18} />}
										{messageType === 'info' && <Mail size={18} />}
									</div>
									<p className="text-sm font-medium">{message}</p>
								</div>
							)}

							<form onSubmit={handleLogin} className="space-y-4">
								{/* Email Input */}
								<div className="space-y-1.5">
									<label htmlFor="mobile-email" className="block text-sm font-semibold text-[#171717]">
										Business Email
									</label>
									<input
										id="mobile-email"
										type="email"
										value={email}
										onChange={(e) => {
											setEmail(e.target.value);
											if (errors.email) {
												setErrors({ ...errors, email: '' });
											}
										}}
										placeholder="admin@restaurant.com"
										className={`w-full px-4 py-3 bg-[#FAFAFA] border rounded-xl transition-all duration-200 placeholder-[#9CA3AF] focus:outline-none text-sm ${errors.email
												? 'border-red-400 focus:ring-2 focus:ring-red-100 bg-red-50/50'
												: 'border-[#E5E7EB] focus:border-[#EA580C] focus:ring-2 focus:ring-[#EA580C]/10'
											}`}
									/>
									{errors.email && (
										<p className="text-sm text-red-600 flex items-center gap-1">
											<span>•</span> {errors.email}
										</p>
									)}
								</div>

								{/* Password Input */}
								<div className="space-y-1.5">
									<label htmlFor="mobile-password" className="block text-sm font-semibold text-[#171717]">
										Password
									</label>
									<div className="relative">
										<input
											id="mobile-password"
											type={showPassword ? "text" : "password"}
											value={password}
											onChange={(e) => {
												setPassword(e.target.value);
												if (errors.password) {
													setErrors({ ...errors, password: '' });
												}
											}}
											placeholder="••••••••"
											className={`w-full px-4 py-3 bg-[#FAFAFA] border rounded-xl transition-all duration-200 placeholder-[#9CA3AF] focus:outline-none pr-12 text-sm ${errors.password
													? 'border-red-400 focus:ring-2 focus:ring-red-100 bg-red-50/50'
													: 'border-[#E5E7EB] focus:border-[#EA580C] focus:ring-2 focus:ring-[#EA580C]/10'
												}`}
										/>
										<button
											type="button"
											onClick={() => setShowPassword(!showPassword)}
											className="absolute right-3 top-3 text-[#9CA3AF] hover:text-[#6B7280] transition-colors"
										>
											{showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
										</button>
									</div>
									{errors.password && (
										<p className="text-sm text-red-600 flex items-center gap-1">
											<span>•</span> {errors.password}
										</p>
									)}
								</div>

								{/* Remember Me */}
								<div className="space-y-3 pt-1">
									<label className="flex items-center gap-2 cursor-pointer group">
										<input
											type="checkbox"
											checked={rememberMe}
											onChange={(e) => setRememberMe(e.target.checked)}
											className="w-4 h-4 rounded border-[#D1D5DB] text-[#EA580C] focus:ring-[#EA580C]/30 transition-colors"
										/>
										<span className="text-sm text-[#6B7280] group-hover:text-[#171717] transition-colors">Remember me</span>
									</label>
									<button
										type="button"
										className="w-full text-sm font-semibold text-[#EA580C] hover:text-[#EA580C]/80 transition-colors py-1"
									>
										Forgot password?
									</button>
								</div>

								{/* Submit Button */}
								<button
									type="submit"
									disabled={isLoading}
									className="w-full py-3 px-4 bg-[#EA580C] hover:bg-[#EA580C]/90 disabled:bg-[#D1D5DB] disabled:text-[#9CA3AF] text-white font-semibold rounded-xl transition-all duration-200 shadow-md shadow-[#EA580C]/15 hover:shadow-lg disabled:shadow-none flex items-center justify-center gap-2 mt-4"
								>
									{isLoading ? (
										<>
											<div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
											<span>Signing in...</span>
										</>
									) : (
										<>
											<span>Sign In</span>
											<ArrowRight size={18} />
										</>
									)}
								</button>
							</form>

							{/* Register Link */}
							<p className="text-center text-[#6B7280] text-sm pt-4 border-t border-[#E5E7EB]">
								Don't have an account?{" "}
								<button
									onClick={handleRegisterLink}
									className="font-semibold text-[#EA580C] hover:text-[#EA580C]/80 transition-colors"
								>
									Register your restaurant
								</button>
							</p>
						</div>
					</div>
				</div>
			</div>
		</div>
	)
}

export default RestaurantLogin
