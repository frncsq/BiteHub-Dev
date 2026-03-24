import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Eye, EyeOff, Mail, Lock, ArrowRight, CheckCircle, AlertCircle } from 'lucide-react'
import axios from 'axios'
import { createApiClient } from './services/apiClient'

function Login() {
	const navigate = useNavigate();
	const [fullName, setFullName] = useState('');
	const [password, setPassword] = useState('');
	const [showPassword, setShowPassword] = useState(false);
	const [rememberMe, setRememberMe] = useState(false);
	const [isLoading, setIsLoading] = useState(false);
	const [message, setMessage] = useState('');
	const [messageType, setMessageType] = useState('');
	const [errors, setErrors] = useState({});

	const validateForm = () => {
		const newErrors = {};
		if (!fullName.trim()) {
			newErrors.fullName = 'Full name is required';
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
				fullName: fullName.trim(),
				password: password
			});

			if (response.data.success) {
				const { token, profile } = response.data;
				
				// Store token for Authorization header
				if (token) {
					localStorage.setItem('authToken', token);
					console.log("✅ Auth token stored in localStorage");
				}

				setMessage('Login successful! Redirecting...');
				setMessageType('success');
				
				if (rememberMe) {
					localStorage.setItem('rememberMe', JSON.stringify({
						fullName: fullName.trim()
					}));
				}
				setTimeout(() => {
					navigate('/home');
				}, 800);
			} else {
				setMessage(response.data.message || 'Login failed');
				setMessageType('error');
			}
		} catch (error) {
			console.error("Login Error:", error);
			setMessage(error.response?.data?.message || error.message || 'An error occurred during login');
			setMessageType('error');
		} finally {
			setIsLoading(false);
		}
	};

	const handleRegisterLink = () => {
		navigate('/register');
	};

	const handleBackToRoles = () => {
		navigate('/');
	};

	const handleSocialLogin = (provider) => {
		setMessage(`${provider} login is coming soon!`);
		setMessageType('info');
	};

	return (
		<div className="min-h-screen bg-gradient-to-br from-white via-orange-50 to-white flex items-center justify-center py-12 px-4">
			{/* Animated Background */}
			<div className="absolute top-0 right-0 w-96 h-96 bg-orange-100/30 rounded-full -translate-y-1/2 translate-x-1/3 blur-3xl"></div>
			<div className="absolute bottom-0 left-0 w-96 h-96 bg-orange-100/30 rounded-full translate-y-1/2 -translate-x-1/3 blur-3xl"></div>

			{/* Main Container */}
			<div className="w-full max-w-3xl relative z-10">
				{/* Desktop Two-Column Layout */}
				<div className="hidden lg:grid lg:grid-cols-2 gap-6 items-center">
					{/* Left Column - Form */}
					<div className="animate-fade-in pr-6">
						<button
							onClick={handleBackToRoles}
							className="mb-6 text-orange-600 hover:text-orange-700 font-semibold flex items-center gap-2 transition-colors text-sm"
						>
							← Back to role selection
						</button>

						<div className="space-y-1 mb-6">
							<h1 className="text-3xl font-bold text-gray-900 tracking-tight">Welcome Back</h1>
							<p className="text-sm text-gray-600">Sign in to access your account</p>
						</div>

						<form onSubmit={handleLogin} className="space-y-4">
							{/* Global Status Messages */}
							{message && (
								<div className={`p-3 rounded-lg border-l-4 flex items-start gap-3 animate-fade-in ${messageType === 'success'
									? 'bg-emerald-50 border-emerald-500 text-emerald-800'
									: messageType === 'error'
										? 'bg-red-50 border-red-500 text-red-800'
										: 'bg-blue-50 border-blue-500 text-blue-800'
									}`}>
									<p className="text-xs font-medium">{message}</p>
								</div>
							)}

							{/* Full Name Input */}
							<div className="space-y-1.5">
								<label htmlFor="fullName" className="block text-xs font-semibold text-gray-900 flex items-center gap-2">
									<Mail size={16} className="text-orange-600" />
									Full Name
								</label>
								<div className="relative">
									<input
										id="fullName"
										type="text"
										value={fullName}
										onChange={(e) => {
											setFullName(e.target.value);
											if (errors.fullName) {
												setErrors({ ...errors, fullName: '' });
											}
										}}
										placeholder="John Doe"
										className={`w-full px-3.5 py-2.5 bg-white border-2 rounded-xl transition-all duration-200 placeholder-gray-400 focus:outline-none text-sm ${errors.fullName
											? 'border-red-400 focus:ring-2 focus:ring-red-300 bg-red-50'
											: 'border-gray-200 focus:border-orange-500 focus:ring-2 focus:ring-orange-100'
											}`}
									/>
								</div>
							</div>

							{/* Password Input */}
							<div className="space-y-1.5">
								<label htmlFor="password" className="block text-xs font-semibold text-gray-900 flex items-center gap-2">
									<Lock size={16} className="text-orange-600" />
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
										className={`w-full px-3.5 py-2.5 bg-white border-2 rounded-xl transition-all duration-200 placeholder-gray-400 focus:outline-none pr-11 text-sm ${errors.password
											? 'border-red-400 focus:ring-2 focus:ring-red-300 bg-red-50'
											: 'border-gray-200 focus:border-orange-500 focus:ring-2 focus:ring-orange-100'
											}`}
									/>
									<button
										type="button"
										onClick={() => setShowPassword(!showPassword)}
										className="absolute right-3 top-2.5 text-gray-500 hover:text-gray-700 transition-colors"
									>
										{showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
									</button>
								</div>
							</div>

							{/* Remember Me & Forgot Password */}
							<div className="flex items-center justify-between pt-1">
								<label className="flex items-center gap-2 cursor-pointer group">
									<input
										type="checkbox"
										checked={rememberMe}
										onChange={(e) => setRememberMe(e.target.checked)}
										className="w-3.5 h-3.5 rounded border-2 border-gray-300 text-orange-600 focus:ring-2 focus:ring-orange-300 transition-colors"
									/>
									<span className="text-xs font-medium text-gray-600 group-hover:text-gray-900 transition-colors">Remember me</span>
								</label>
								<button
									type="button"
									className="text-xs font-semibold text-orange-600 hover:text-orange-700 transition-colors"
								>
									Forgot password?
								</button>
							</div>

							{/* Primary Login Button */}
							<button
								type="submit"
								disabled={isLoading}
								className="w-full py-2.5 px-4 bg-gradient-to-r from-orange-600 to-orange-700 hover:from-orange-700 hover:to-orange-800 disabled:from-gray-400 disabled:to-gray-400 text-white font-semibold rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl hover:scale-[1.01] active:scale-[0.99] disabled:scale-100 flex items-center justify-center gap-2 text-sm"
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

							{/* Divider */}
							<div className="relative py-2">
								<div className="absolute inset-0 flex items-center">
									<div className="w-full border-t border-gray-200"></div>
								</div>
								<div className="relative flex justify-center text-[10px]">
									<span className="px-2 bg-white text-gray-400 font-bold uppercase tracking-widest">Or</span>
								</div>
							</div>

							{/* Social Login Buttons */}
							<div className="grid grid-cols-2 gap-3">
								<button
									type="button"
									onClick={() => handleSocialLogin('Google')}
									className="py-2.5 px-3 border border-gray-200 hover:border-orange-500/30 rounded-xl font-bold text-xs text-gray-700 hover:text-orange-600 transition-all duration-200 hover:bg-orange-50/50 flex items-center justify-center gap-2"
								>
									<span className="text-lg">🔷</span>
									<span>Google</span>
								</button>
								<button
									type="button"
									onClick={() => handleSocialLogin('GitHub')}
									className="py-2.5 px-3 border border-gray-200 hover:border-orange-500/30 rounded-xl font-bold text-xs text-gray-700 hover:text-orange-600 transition-all duration-200 hover:bg-orange-50/50 flex items-center justify-center gap-2"
								>
									<span className="text-lg">⚫</span>
									<span>GitHub</span>
								</button>
							</div>

							{/* Register Link */}
							<p className="text-center text-gray-500 text-xs font-medium pt-2">
								Don't have an account?{" "}
								<button
									type="button"
									onClick={handleRegisterLink}
									className="font-bold text-orange-600 hover:text-orange-700 transition-colors hover:underline"
								>
									Create account
								</button>
							</p>
						</form>
					</div>

					{/* Right Column - Illustration/Branding */}
					<div className="hidden lg:flex flex-col items-center justify-center space-y-4 animate-fade-in" style={{ animationDelay: '0.2s' }}>
						<div className="relative w-full h-64 bg-gradient-to-br from-orange-50/50 to-orange-100/50 rounded-2xl flex items-center justify-center overflow-hidden border border-orange-100">
							{/* decorative circles */}
							<div className="absolute top-4 left-4 w-12 h-12 bg-orange-200/20 rounded-full"></div>
							<div className="absolute bottom-4 right-4 w-20 h-20 bg-orange-200/20 rounded-full"></div>
							<div className="relative z-10 text-6xl drop-shadow-sm">🍽️</div>
						</div>

						<div className="space-y-1 text-center">
							<h2 className="text-2xl font-bold text-gray-900 tracking-tight">BiteHub</h2>
							<p className="text-gray-500 text-xs max-w-[200px] leading-relaxed">
								Delicious food delivery right to your doorstep.
							</p>
						</div>
					</div>
				</div>

				{/* Mobile Single Column Layout */}
				<div className="lg:hidden">
					<button
						onClick={handleBackToRoles}
						className="mb-6 text-orange-600 hover:text-orange-700 font-semibold flex items-center gap-2 transition-colors"
					>
						← Back
					</button>

					<div className="bg-white rounded-2xl shadow-xl overflow-hidden backdrop-blur-sm border border-gray-200 animate-fade-in">
						{/* Header */}
						<div className="bg-gradient-to-br from-orange-600 to-orange-700 px-6 py-8 relative overflow-hidden">
							<div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full -mr-20 -mt-20"></div>
							<div className="absolute bottom-0 left-0 w-32 h-32 bg-white/10 rounded-full -ml-16 -mb-16"></div>
							<div className="relative z-10 space-y-2">
								<h1 className="text-3xl font-bold text-white">Welcome Back</h1>
								<p className="text-orange-100 text-sm">Sign in to your account</p>
							</div>
						</div>

						{/* Form Container */}
						<div className="px-6 py-8 space-y-5">
							{/* Status Messages */}
							{message && (
								<div className={`p-4 rounded-xl border-l-4 flex items-start gap-3 animate-fade-in ${messageType === 'success'
									? 'bg-emerald-50 border-emerald-500 text-emerald-800'
									: messageType === 'error'


										? 'bg-red-50 border-red-500 text-red-800'
										: 'bg-blue-50 border-blue-500 text-blue-800'
									}`}>
									<div className="mt-0.5">
										{messageType === 'success' && <CheckCircle size={20} />}
										{messageType === 'error' && <AlertCircle size={20} />}
										{messageType === 'info' && <Mail size={20} />}
									</div>
									<p className="text-sm font-medium">{message}</p>
								</div>
							)}

							<form onSubmit={handleLogin} className="space-y-4">
								{/* Full Name Input */}
								<div className="space-y-2">
									<label htmlFor="mobile-fullName" className="block text-sm font-semibold text-gray-900 flex items-center gap-2">
										<Mail size={18} className="text-orange-600" />
										Full Name
									</label>
									<div className="relative">
										<input
											id="mobile-fullName"
											type="text"
											value={fullName}
											onChange={(e) => {
												setFullName(e.target.value);
												if (errors.fullName) {
													setErrors({ ...errors, fullName: '' });
												}
											}}
											placeholder="John Doe"
											aria-label="Full Name"
											className={`w-full px-4 py-3 bg-white border-2 rounded-xl transition-all duration-200 placeholder-gray-400 focus:outline-none ${errors.fullName
												? 'border-red-400 focus:ring-2 focus:ring-red-300 bg-red-50'
												: 'border-gray-200 focus:border-orange-500 focus:ring-2 focus:ring-orange-100'
												}`}
										/>
										{errors.fullName && (
											<div className="absolute right-3 top-3">
												<AlertCircle size={20} className="text-red-500" />
											</div>
										)}
									</div>
									{errors.fullName && (
										<p className="text-sm text-red-600 flex items-center gap-1">
											<span>•</span> {errors.fullName}
										</p>
									)}
								</div>

								{/* Password Input */}
								<div className="space-y-2">
									<label htmlFor="mobile-password" className="block text-sm font-semibold text-gray-900 flex items-center gap-2">
										<Lock size={18} className="text-orange-600" />
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
											aria-label="Password"
											className={`w-full px-4 py-3 bg-white border-2 rounded-xl transition-all duration-200 placeholder-gray-400 focus:outline-none pr-12 ${errors.password
												? 'border-red-400 focus:ring-2 focus:ring-red-300 bg-red-50'
												: 'border-gray-200 focus:border-orange-500 focus:ring-2 focus:ring-orange-100'
												}`}
										/>
										<button
											type="button"
											onClick={() => setShowPassword(!showPassword)}
											className="absolute right-3 top-3 text-gray-500 hover:text-gray-700 transition-colors"
											aria-label={showPassword ? "Hide password" : "Show password"}
										>
											{showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
										</button>
									</div>
									{errors.password && (
										<p className="text-sm text-red-600 flex items-center gap-1">
											<span>•</span> {errors.password}
										</p>
									)}
								</div>

								{/* Remember Me & Forgot Password */}
								<div className="space-y-2 pt-2">
									<label className="flex items-center gap-2 cursor-pointer group">
										<input
											type="checkbox"
											checked={rememberMe}
											onChange={(e) => setRememberMe(e.target.checked)}
											className="w-4 h-4 rounded border-2 border-gray-300 text-orange-600 focus:ring-2 focus:ring-orange-300 transition-colors"
										/>
										<span className="text-sm font-medium text-gray-700 group-hover:text-gray-900 transition-colors">Remember me</span>
									</label>
									<button
										type="button"
										className="w-full text-sm font-semibold text-orange-600 hover:text-orange-700 transition-colors py-2"
									>
										Forgot password?
									</button>
								</div>

								{/* Submit Button */}
								<button
									type="submit"
									disabled={isLoading}
									className="w-full py-3 px-4 bg-gradient-to-r from-orange-600 to-orange-700 hover:from-orange-700 hover:to-orange-800 disabled:from-gray-400 disabled:to-gray-400 text-white font-semibold rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl disabled:scale-100 flex items-center justify-center gap-2 mt-6"
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

								{/* Divider */}
								<div className="relative py-3">
									<div className="absolute inset-0 flex items-center">
										<div className="w-full border-t border-gray-300"></div>
									</div>
									<div className="relative flex justify-center text-sm">
										<span className="px-3 bg-white text-gray-600 font-medium">Or</span>
									</div>
								</div>

								{/* Social Buttons */}
								<div className="grid grid-cols-2 gap-3">
									<button
										type="button"
										onClick={() => handleSocialLogin('Google')}
										className="py-3 px-4 border-2 border-gray-300 hover:border-orange-400 rounded-xl font-semibold text-gray-700 hover:text-orange-600 transition-all duration-200 hover:bg-orange-50 flex items-center justify-center gap-2"
									>
										<span className="text-xl">🔷</span>
										<span>Google</span>
									</button>
									<button
										type="button"
										onClick={() => handleSocialLogin('GitHub')}
										className="py-3 px-4 border-2 border-gray-300 hover:border-orange-400 rounded-xl font-semibold text-gray-700 hover:text-orange-600 transition-all duration-200 hover:bg-orange-50 flex items-center justify-center gap-2"
									>
										<span className="text-xl">⚫</span>
										<span>GitHub</span>
									</button>
								</div>
							</form>

							{/* Register Link */}
							<p className="text-center text-gray-700 text-sm pt-4 border-t border-gray-200">
								Don't have an account?{" "}
								<button
									onClick={handleRegisterLink}
									className="font-semibold text-orange-600 hover:text-orange-700 transition-colors hover:underline"
								>
									Create account
								</button>
							</p>
						</div>
					</div>
				</div>
			</div>

			{/* Custom CSS for animations */}
			<style>{`
				@keyframes fade-in {
					from {
						opacity: 0;
						transform: translateY(20px);
					}
					to {
						opacity: 1;
						transform: translateY(0);
					}
				}
				.animate-fade-in {
					animation: fade-in 0.6s ease-out forwards;
				}
			`}</style>
		</div>
	)
}

export default Login
