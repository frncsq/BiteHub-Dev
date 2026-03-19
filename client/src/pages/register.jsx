import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Eye, EyeOff, Mail, Lock, User, Building2, BookOpen, Calendar, CheckCircle, AlertCircle, ArrowRight, Phone, MapPin } from 'lucide-react'
import axios from 'axios'

function Register() {
	const [fullName, setFullName] = useState('');
	const [email, setEmail] = useState('');
	const [phone, setPhone] = useState('');
	const [address, setAddress] = useState('');
	const [city, setCity] = useState('');
	const [department, setDepartment] = useState('');
	const [course, setCourse] = useState('');
	const [year, setYear] = useState('');
	const [password, setPassword] = useState('');
	const [confirm, setConfirm] = useState('');
	const [showPassword, setShowPassword] = useState(false);
	const [showConfirm, setShowConfirm] = useState(false);
	const [agreeTerms, setAgreeTerms] = useState(false);
	const [isLoading, setIsLoading] = useState(false);
	const [message, setMessage] = useState('');
	const [messageType, setMessageType] = useState('');
	const [errors, setErrors] = useState({});
	const navigate = useNavigate();

	const validateForm = () => {
		const newErrors = {};
		if (!fullName.trim()) {
			newErrors.fullName = 'Full name is required';
		}
		if (!email.trim() || !/\S+@\S+\.\S+/.test(email)) {
			newErrors.email = 'Valid email is required';
		}
		if (!password) {
			newErrors.password = 'Password is required';
		} else if (password.length < 8) {
			newErrors.password = 'Password must be at least 8 characters';
		} else if (!/[A-Z]/.test(password) || !/[a-z]/.test(password) || !/[0-9]/.test(password)) {
			newErrors.password = 'Password must contain uppercase, lowercase, and numbers';
		}
		if (!confirm) {
			newErrors.confirm = 'Please confirm your password';
		} else if (password !== confirm) {
			newErrors.confirm = 'Passwords do not match';
		}
		if (!agreeTerms) {
			newErrors.agreeTerms = 'You must agree to the terms and conditions';
		}
		return newErrors;
	};

	const passwordsMatch = password && confirm && password === confirm;
	const passwordStrength = password.length >= 8 ? 'strong' : password.length >= 6 ? 'medium' : 'weak';

	const handleRegister = async (e) => {
		e.preventDefault();
		const newErrors = validateForm();
		
		if (Object.keys(newErrors).length > 0) {
			setErrors(newErrors);
			setMessage('Please fill in all fields correctly');
			setMessageType('error');
			return;
		}

		setIsLoading(true);
		setMessage('');

		try {
			const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
			const response = await axios.post(`${baseURL}/api/customer/register`, {
				full_name: fullName.trim(),
				email: email.trim(),
				phone: phone.trim(),
				address: address.trim(),
				city: city.trim(),
				department,
				course,
				year: Number(year),
				password
			}, { withCredentials: true });
			
			if (response.data.success) {
				setMessage('Registration successful! Redirecting to login...');
				setMessageType('success');
				setTimeout(() => {
					navigate('/login');
				}, 2000);
			}
			else {
				setMessage(response.data.message || 'Registration failed');
				setMessageType('error');
			}
		} catch (error) {
			setMessage(error.response?.data?.message || error.message || 'An error occurred during registration');
			setMessageType('error');
		} finally {
			setIsLoading(false);
		}
	};

	const handleLoginLink = () => {
		navigate('/login');
	};

	const handleBackToRoles = () => {
		navigate('/');
	};

	const handleSocialRegister = (provider) => {
		setMessage(`${provider} sign up is coming soon!`);
		setMessageType('info');
	};

	return (
		<div className="min-h-screen bg-gradient-to-br from-slate-50 via-orange-50 to-slate-100 flex items-center justify-center py-12 px-4">
			{/* Main Container */}
			<div className="w-full max-w-4xl">
				{/* Desktop Two-Column Layout */}
				<div className="hidden lg:grid lg:grid-cols-2 gap-8 items-start">
					{/* Left Column - Branding (Reversed for visual balance) */}
					<div className="hidden lg:flex flex-col items-center justify-center space-y-8 animate-fade-in order-2">
						<div className="relative w-full h-80 bg-gradient-to-br from-orange-100 to-orange-100 rounded-3xl flex items-center justify-center overflow-hidden group">
							<div className="absolute inset-0 bg-gradient-to-br from-orange-500/10 to-orange-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
							
							{/* Decorative Elements */}
							<div className="absolute top-8 left-8 w-20 h-20 bg-orange-300 rounded-full opacity-20 animate-bounce" style={{animationDelay: '0s'}}></div>
							<div className="absolute bottom-12 right-8 w-32 h-32 bg-orange-300 rounded-full opacity-20 animate-bounce" style={{animationDelay: '0.5s'}}></div>
							<div className="absolute top-1/2 right-1/4 w-16 h-16 bg-orange-400 rounded-full opacity-10 animate-pulse"></div>
							
							{/* Center Icon */}
							<div className="relative z-10 text-8xl animate-pulse">
								👨‍💼
							</div>
						</div>

						<div className="space-y-3 text-center">
							<h2 className="text-3xl font-bold text-gray-900">Join BiteHub</h2>
							<p className="text-gray-600 max-w-xs">
								Create your account and start enjoying delicious food delivered straight to your location.
							</p>
							<div className="flex items-center justify-center gap-4 pt-2 text-sm text-gray-600">
								<div className="flex items-center gap-1">
									<CheckCircle size={18} className="text-orange-600" />
									<span>Quick signup</span>
								</div>
								<div className="flex items-center gap-1">
									<CheckCircle size={18} className="text-orange-600" />
									<span>Secure</span>
								</div>
							</div>
						</div>
					</div>

					{/* Right Column - Form */}
					<div className="animate-fade-in order-1">
						<button
							onClick={handleBackToRoles}
							className="mb-8 text-orange-600 hover:text-orange-700 font-semibold flex items-center gap-2 transition-colors"
						>
							← Back to role selection
						</button>

						<div className="space-y-2 mb-8">
							<h1 className="text-4xl font-bold text-gray-900 tracking-tight">Create Account</h1>
							<p className="text-lg text-gray-600">Join thousands of users already enjoying great food</p>
						</div>

						<form onSubmit={handleRegister} className="space-y-4">
							{/* Global Status Messages */}
							{message && (
								<div className={`p-4 rounded-xl border-l-4 flex items-start gap-3 animate-fade-in ${
									messageType === 'success' 
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

							{/* Row 1: Full Name */}
							<div className="space-y-2">
								<label htmlFor="fullName" className="block text-sm font-semibold text-gray-900 flex items-center gap-2">
									<User size={18} className="text-orange-600" />
									Full Name
								</label>
								<div className="relative">
									<input 
										id="fullName"
										type="text" 
										value={fullName} 
										onChange={(e) => {
											setFullName(e.target.value);
											if (errors.fullName) setErrors({...errors, fullName: ''});
										}}
										placeholder="John Doe" 
										aria-label="Full Name"
										className={`w-full px-4 py-3 bg-white border-2 rounded-xl transition-all duration-200 placeholder-gray-400 focus:outline-none ${
											errors.fullName 
												? 'border-red-400 focus:ring-2 focus:ring-red-300 bg-red-50' 
												: 'border-gray-200 focus:border-orange-500 focus:ring-2 focus:ring-orange-100'
										}`}
									/>
									{errors.fullName && <AlertCircle size={20} className="absolute right-3 top-3 text-red-500" />}
								</div>
								{errors.fullName && <p className="text-sm text-red-600 flex items-center gap-1"><span>•</span> {errors.fullName}</p>}
							</div>

							{/* Contact Info Row */}
							<div className="grid grid-cols-2 gap-4">
								<div className="space-y-2">
									<label htmlFor="email" className="block text-sm font-semibold text-gray-900 flex items-center gap-2">
										<Mail size={18} className="text-orange-600" /> Email
									</label>
									<input 
										id="email" type="email" value={email} 
										onChange={(e) => { setEmail(e.target.value); if (errors.email) setErrors({...errors, email: ''}); }}
										placeholder="john@example.com" 
										className={`w-full px-4 py-3 bg-white border-2 rounded-xl transition-all duration-200 focus:outline-none ${errors.email ? 'border-red-400 bg-red-50' : 'border-gray-200 focus:border-orange-500'}`}
									/>
									{errors.email && <p className="text-sm text-red-600"><span>•</span> {errors.email}</p>}
								</div>
								<div className="space-y-2">
									<label htmlFor="phone" className="block text-sm font-semibold text-gray-900 flex items-center gap-2">
										<Phone size={18} className="text-orange-600" /> Phone
									</label>
									<input 
										id="phone" type="tel" value={phone} 
										onChange={(e) => setPhone(e.target.value)}
										placeholder="+1 234..." 
										className={`w-full px-4 py-3 bg-white border-2 rounded-xl transition-all duration-200 focus:outline-none border-gray-200 focus:border-orange-500`}
									/>
								</div>
							</div>

							{/* Address Info Row */}
							<div className="grid grid-cols-2 gap-4">
								<div className="space-y-2">
									<label htmlFor="address" className="block text-sm font-semibold text-gray-900 flex items-center gap-2">
										<MapPin size={18} className="text-orange-600" /> Address
									</label>
									<input 
										id="address" type="text" value={address} 
										onChange={(e) => setAddress(e.target.value)}
										placeholder="123 Campus St" 
										className={`w-full px-4 py-3 bg-white border-2 rounded-xl transition-all duration-200 focus:outline-none border-gray-200 focus:border-orange-500`}
									/>
								</div>
								<div className="space-y-2">
									<label htmlFor="city" className="block text-sm font-semibold text-gray-900 flex items-center gap-2">
										<Building2 size={18} className="text-orange-600" /> City
									</label>
									<input 
										id="city" type="text" value={city} 
										onChange={(e) => setCity(e.target.value)}
										placeholder="Campus City" 
										className={`w-full px-4 py-3 bg-white border-2 rounded-xl transition-all duration-200 focus:outline-none border-gray-200 focus:border-orange-500`}
									/>
								</div>
							</div>

							{/* Row 2: Department & Course */}
							<div className="grid grid-cols-2 gap-4">
								<div className="space-y-2">
									<label htmlFor="department" className="block text-sm font-semibold text-gray-900 flex items-center gap-2">
										<Building2 size={18} className="text-orange-600" />
										Department
									</label>
									<select 
										id="department"
										value={department} 
										onChange={(e) => {
											setDepartment(e.target.value);
											if (errors.department) setErrors({...errors, department: ''});
										}}
										aria-label="Department"
										className={`w-full px-4 py-3 bg-white border-2 rounded-xl transition-all duration-200 focus:outline-none appearance-none cursor-pointer ${
											errors.department 
												? 'border-red-400 focus:ring-2 focus:ring-red-300 bg-red-50' 
												: 'border-gray-200 focus:border-orange-500 focus:ring-2 focus:ring-orange-100'
										}`}
									>
										<option value="">Select...</option>
										<option value="cse">College of Mathematics and Computing Sciences</option>
										<option value="ece">College of Teacher Education</option>
										<option value="me">College of Agriculture, Forestry and Cooperatives</option>
										<option value="ce">Home Technology</option>
										<option value="ee">Administration</option>
									</select>
									{errors.department && <p className="text-sm text-red-600 flex items-center gap-1"><span>•</span> Required</p>}
								</div>

								<div className="space-y-2">
									<label htmlFor="course" className="block text-sm font-semibold text-gray-900 flex items-center gap-2">
										<BookOpen size={18} className="text-orange-600" />
										Course
									</label>
									<input 
										id="course"
										type="text" 
										value={course} 
										onChange={(e) => {
											setCourse(e.target.value);
											if (errors.course) setErrors({...errors, course: ''});
										}}
										placeholder="BSIT, BS MATH" 
										aria-label="Course"
										className={`w-full px-4 py-3 bg-white border-2 rounded-xl transition-all duration-200 placeholder-gray-400 focus:outline-none ${
											errors.course 
												? 'border-red-400 focus:ring-2 focus:ring-red-300 bg-red-50' 
												: 'border-gray-200 focus:border-orange-500 focus:ring-2 focus:ring-orange-100'
										}`}
									/>
									{errors.course && <p className="text-sm text-red-600 flex items-center gap-1"><span>•</span> Required</p>}
								</div>
							</div>

							{/* Row 3: Year */}
							<div className="space-y-2">
								<label htmlFor="year" className="block text-sm font-semibold text-gray-900 flex items-center gap-2">
									<Calendar size={18} className="text-orange-600" />
									Year
								</label>
								<select 
									id="year"
									value={year} 
									onChange={(e) => {
										setYear(e.target.value);
										if (errors.year) setErrors({...errors, year: ''});
									}}
									aria-label="Year"
									className={`w-full px-4 py-3 bg-white border-2 rounded-xl transition-all duration-200 focus:outline-none appearance-none cursor-pointer ${
										errors.year 
											? 'border-red-400 focus:ring-2 focus:ring-red-300 bg-red-50' 
											: 'border-gray-200 focus:border-orange-500 focus:ring-2 focus:ring-orange-100'
									}`}
								>
									<option value="">Select year...</option>
									<option value="1">1st Year</option>
									<option value="2">2nd Year</option>
									<option value="3">3rd Year</option>
									<option value="4">4th Year</option>
								</select>
								{errors.year && <p className="text-sm text-red-600 flex items-center gap-1"><span>•</span> Required</p>}
							</div>

							{/* Row 4: Password */}
							<div className="space-y-2">
								<label htmlFor="password" className="block text-sm font-semibold text-gray-900 flex items-center gap-2">
									<Lock size={18} className="text-orange-600" />
									Password
									<span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
										passwordStrength === 'strong' ? 'bg-orange-100 text-orange-700' :
										passwordStrength === 'medium' ? 'bg-yellow-100 text-yellow-700' :
										'bg-red-100 text-red-700'
									}`}>
										{passwordStrength}
									</span>
								</label>
								<div className="relative">
									<input 
										id="password"
										type={showPassword ? "text" : "password"} 
										value={password}
										onChange={(e) => {
											setPassword(e.target.value);
											if (errors.password) setErrors({...errors, password: ''});
										}}
										placeholder="Min. 8 characters, mix of upper/lower/numbers" 
										aria-label="Password"
										className={`w-full px-4 py-3 bg-white border-2 rounded-xl transition-all duration-200 placeholder-gray-400 focus:outline-none pr-12 ${
											errors.password 
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
								{errors.password && <p className="text-sm text-red-600 flex items-center gap-1"><span>•</span> {errors.password}</p>}
							</div>

							{/* Row 5: Confirm Password */}
							<div className="space-y-2">
								<label htmlFor="confirm" className="block text-sm font-semibold text-gray-900 flex items-center gap-2">
									<CheckCircle size={18} className={passwordsMatch ? "text-orange-600" : "text-gray-400"} />
									Confirm Password
									{passwordsMatch && <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-orange-100 text-orange-700">Match</span>}
								</label>
								<div className="relative">
									<input 
										id="confirm"
										type={showConfirm ? "text" : "password"} 
										value={confirm}
										onChange={(e) => {
											setConfirm(e.target.value);
											if (errors.confirm) setErrors({...errors, confirm: ''});
										}}
										placeholder="Repeat your password" 
										aria-label="Confirm Password"
										className={`w-full px-4 py-3 bg-white border-2 rounded-xl transition-all duration-200 placeholder-gray-400 focus:outline-none pr-12 ${
											errors.confirm 
												? 'border-red-400 focus:ring-2 focus:ring-red-300 bg-red-50' 
												: passwordsMatch
												? 'border-orange-400 focus:border-orange-500 focus:ring-2 focus:ring-orange-100'
												: 'border-gray-200 focus:border-orange-500 focus:ring-2 focus:ring-orange-100'
										}`}
									/>
									<button
										type="button"
										onClick={() => setShowConfirm(!showConfirm)}
										className="absolute right-3 top-3 text-gray-500 hover:text-gray-700 transition-colors"
										aria-label={showConfirm ? "Hide password" : "Show password"}
									>
										{showConfirm ? <EyeOff size={20} /> : <Eye size={20} />}
									</button>
								</div>
								{errors.confirm && <p className="text-sm text-red-600 flex items-center gap-1"><span>•</span> {errors.confirm}</p>}
							</div>

							{/* Terms & Conditions */}
							<div className="space-y-2 pt-2">
								<label className="flex items-start gap-3 cursor-pointer group">
									<input 
										type="checkbox" 
										checked={agreeTerms}
										onChange={(e) => {
											setAgreeTerms(e.target.checked);
											if (errors.agreeTerms) setErrors({...errors, agreeTerms: ''});
										}}
										className="w-4 h-4 mt-1 rounded border-2 border-gray-300 text-orange-600 focus:ring-2 focus:ring-orange-300 transition-colors" 
										aria-label="Agree to terms"
									/>
									<span className="text-sm text-gray-700 group-hover:text-gray-900 transition-colors">
										I agree to the <button type="button" className="font-semibold text-orange-600 hover:underline">Terms of Service</button> and <button type="button" className="font-semibold text-orange-600 hover:underline">Privacy Policy</button>
									</span>
								</label>
								{errors.agreeTerms && <p className="text-sm text-red-600 flex items-center gap-1"><span>•</span> {errors.agreeTerms}</p>}
							</div>

							{/* Submit Button */}
							<button 
								type="submit" 
								disabled={isLoading}
								className="w-full py-3 px-4 bg-gradient-to-r from-orange-600 to-orange-700 hover:from-orange-700 hover:to-orange-800 disabled:from-gray-400 disabled:to-gray-400 text-white font-semibold rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl hover:scale-[1.02] disabled:scale-100 flex items-center justify-center gap-2 mt-6"
							>
								{isLoading ? (
									<>
										<div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
										<span>Creating account...</span>
									</>
								) : (
									<>
										<span>Create Account</span>
										<ArrowRight size={18} />
									</>
								)}
							</button>

							{/* Divider */}
							<div className="relative py-4">
								<div className="absolute inset-0 flex items-center">
									<div className="w-full border-t border-gray-300"></div>
								</div>
								<div className="relative flex justify-center text-sm">
									<span className="px-3 bg-white text-gray-600 font-medium">Or sign up with</span>
								</div>
							</div>

							{/* Social Buttons */}
							<div className="grid grid-cols-2 gap-3">
								<button
									type="button"
									onClick={() => handleSocialRegister('Google')}
									className="py-3 px-4 border-2 border-gray-300 hover:border-orange-400 rounded-xl font-semibold text-gray-700 hover:text-orange-600 transition-all duration-200 hover:bg-orange-50 flex items-center justify-center gap-2"
								>
									<span className="text-xl">🔷</span>
									<span className="hidden sm:inline">Google</span>
								</button>
								<button
									type="button"
									onClick={() => handleSocialRegister('GitHub')}
									className="py-3 px-4 border-2 border-gray-300 hover:border-orange-400 rounded-xl font-semibold text-gray-700 hover:text-orange-600 transition-all duration-200 hover:bg-orange-50 flex items-center justify-center gap-2"
								>
									<span className="text-xl">⚫</span>
									<span className="hidden sm:inline">GitHub</span>
								</button>
							</div>

							{/* Login Link */}
							<p className="text-center text-gray-700 text-sm">
								Already have an account?{" "}
								<button 
									type="button"
									onClick={handleLoginLink} 
									className="font-semibold text-orange-600 hover:text-orange-700 transition-colors hover:underline"
								>
									Sign in
								</button>
							</p>
						</form>
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

				<div className="bg-gradient-to-br from-orange-600 to-orange-700 px-6 py-8 relative overflow-hidden">
					<div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full -mr-20 -mt-20"></div>
					<div className="absolute bottom-0 left-0 w-32 h-32 bg-white/10 rounded-full -ml-16 -mb-16"></div>
					<div className="relative z-10 space-y-2">
						<h1 className="text-3xl font-bold text-white">Create Account</h1>
						<p className="text-orange-100 text-sm">Join BiteHub today</p>
					</div>
				</div>

				{/* Form Container */}
				<div className="px-6 py-8 space-y-4">
							{/* Status Messages */}
							{message && (
								<div className={`p-4 rounded-xl border-l-4 flex items-start gap-3 animate-fade-in ${
									messageType === 'success' 
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

							<form onSubmit={handleRegister} className="space-y-3">
								{/* Full Name */}
								<div className="space-y-2">
									<label htmlFor="m-fullName" className="block text-sm font-semibold text-gray-900 flex items-center gap-2">
										<User size={18} className="text-orange-600" />
										Full Name
									</label>
									<input 
										id="m-fullName"
										type="text" 
										value={fullName} 
										onChange={(e) => {
											setFullName(e.target.value);
											if (errors.fullName) setErrors({...errors, fullName: ''});
										}}
										placeholder="John Doe" 
										className={`w-full px-4 py-3 bg-white border-2 rounded-xl transition-all placeholder-gray-400 focus:outline-none ${
											errors.fullName 
												? 'border-red-400 bg-red-50' 
												: 'border-gray-200 focus:border-orange-500 focus:ring-2 focus:ring-orange-100'
										}`}
									/>
									{errors.fullName && <p className="text-sm text-red-600">• {errors.fullName}</p>}
								</div>

								{/* Mobile - Local Contact Grouping */}
								<div className="grid grid-cols-2 gap-3">
									<div className="space-y-2">
										<label htmlFor="m-email" className="block text-sm font-semibold text-gray-900 flex items-center gap-2">
											<Mail size={16} className="text-orange-600" /> Email
										</label>
										<input 
											id="m-email" type="email" value={email} 
											onChange={(e) => { setEmail(e.target.value); if (errors.email) setErrors({...errors, email: ''}); }}
											placeholder="john@..." 
											className={`w-full px-3 py-3 bg-white border-2 rounded-xl transition-all outline-none ${errors.email ? 'border-red-400 bg-red-50' : 'border-gray-200 focus:border-orange-500'}`}
										/>
										{errors.email && <p className="text-sm text-red-600 font-medium whitespace-nowrap overflow-hidden text-ellipsis w-full max-w-[150px]" title={errors.email}>• Req</p>}
									</div>
									<div className="space-y-2">
										<label htmlFor="m-phone" className="block text-sm font-semibold text-gray-900 flex items-center gap-2">
											<Phone size={16} className="text-orange-600" /> Phone
										</label>
										<input 
											id="m-phone" type="tel" value={phone} 
											onChange={(e) => setPhone(e.target.value)}
											placeholder="+1..." 
											className={`w-full px-3 py-3 bg-white border-2 rounded-xl transition-all outline-none border-gray-200 focus:border-orange-500`}
										/>
									</div>
								</div>

								<div className="grid grid-cols-2 gap-3">
									<div className="space-y-2">
										<label htmlFor="m-address" className="block text-sm font-semibold text-gray-900 flex items-center gap-2">
											<MapPin size={16} className="text-orange-600" /> Addr
										</label>
										<input 
											id="m-address" type="text" value={address} 
											onChange={(e) => setAddress(e.target.value)}
											placeholder="Apt 2B..." 
											className={`w-full px-3 py-3 bg-white border-2 rounded-xl transition-all outline-none border-gray-200 focus:border-orange-500`}
										/>
									</div>
									<div className="space-y-2">
										<label htmlFor="m-city" className="block text-sm font-semibold text-gray-900 flex items-center gap-2">
											<Building2 size={16} className="text-orange-600" /> City
										</label>
										<input 
											id="m-city" type="text" value={city} 
											onChange={(e) => setCity(e.target.value)}
											placeholder="City..." 
											className={`w-full px-3 py-3 bg-white border-2 rounded-xl transition-all outline-none border-gray-200 focus:border-orange-500`}
										/>
									</div>
								</div>

								{/* Department */}
								<div className="space-y-2">
									<label htmlFor="m-department" className="block text-sm font-semibold text-gray-900 flex items-center gap-2">
										<Building2 size={18} className="text-orange-600" />
										Department
									</label>
									<select 
										id="m-department"
										value={department} 
										onChange={(e) => {
											setDepartment(e.target.value);
											if (errors.department) setErrors({...errors, department: ''});
										}}
										className={`w-full px-4 py-3 bg-white border-2 rounded-xl transition-all focus:outline-none appearance-none cursor-pointer ${
											errors.department 
												? 'border-red-400 bg-red-50' 
												: 'border-gray-200 focus:border-orange-500 focus:ring-2 focus:ring-orange-100'
										}`}
									>
										<option value="">Select...</option>
										<option value="cse">Computer Science</option>
										<option value="ece">Electronics</option>
										<option value="me">Mechanical</option>
										<option value="ce">Civil</option>
										<option value="ee">Electrical</option>
									</select>
									{errors.department && <p className="text-sm text-red-600">• Required</p>}
								</div>

								{/* Course */}
								<div className="space-y-2">
									<label htmlFor="m-course" className="block text-sm font-semibold text-gray-900 flex items-center gap-2">
										<BookOpen size={18} className="text-orange-600" />
										Course
									</label>
									<input 
										id="m-course"
										type="text" 
										value={course} 
										onChange={(e) => {
											setCourse(e.target.value);
											if (errors.course) setErrors({...errors, course: ''});
										}}
										placeholder="B.Tech" 
										className={`w-full px-4 py-3 bg-white border-2 rounded-xl transition-all placeholder-gray-400 focus:outline-none ${
											errors.course 
												? 'border-red-400 bg-red-50' 
												: 'border-gray-200 focus:border-orange-500 focus:ring-2 focus:ring-orange-100'
										}`}
									/>
									{errors.course && <p className="text-sm text-red-600">• Required</p>}
								</div>

								{/* Year */}
								<div className="space-y-2">
									<label htmlFor="m-year" className="block text-sm font-semibold text-gray-900 flex items-center gap-2">
										<Calendar size={18} className="text-orange-600" />
										Year
									</label>
									<select 
										id="m-year"
										value={year} 
										onChange={(e) => {
											setYear(e.target.value);
											if (errors.year) setErrors({...errors, year: ''});
										}}
										className={`w-full px-4 py-3 bg-white border-2 rounded-xl transition-all focus:outline-none appearance-none cursor-pointer ${
											errors.year 
												? 'border-red-400 bg-red-50' 
												: 'border-gray-200 focus:border-orange-500 focus:ring-2 focus:ring-orange-100'
										}`}
									>
										<option value="">Select...</option>
										<option value="1">1st Year</option>
										<option value="2">2nd Year</option>
										<option value="3">3rd Year</option>
										<option value="4">4th Year</option>
									</select>
									{errors.year && <p className="text-sm text-red-600">• Required</p>}
								</div>

								{/* Password */}
								<div className="space-y-2">
									<label htmlFor="m-password" className="block text-sm font-semibold text-gray-900 flex items-center gap-2">
										<Lock size={18} className="text-orange-600" />
										Password
										<span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
											passwordStrength === 'strong' ? 'bg-orange-100 text-orange-700' :
											passwordStrength === 'medium' ? 'bg-yellow-100 text-yellow-700' :
											'bg-red-100 text-red-700'
										}`}>
											{passwordStrength}
										</span>
									</label>
									<div className="relative">
										<input 
											id="m-password"
											type={showPassword ? "text" : "password"} 
											value={password}
											onChange={(e) => {
												setPassword(e.target.value);
												if (errors.password) setErrors({...errors, password: ''});
											}}
											placeholder="Min. 8 characters" 
											className={`w-full px-4 py-3 bg-white border-2 rounded-xl transition-all placeholder-gray-400 focus:outline-none pr-12 ${
												errors.password 
													? 'border-red-400 bg-red-50' 
													: 'border-gray-200 focus:border-orange-500 focus:ring-2 focus:ring-orange-100'
											}`}
										/>
										<button
											type="button"
											onClick={() => setShowPassword(!showPassword)}
											className="absolute right-3 top-3 text-gray-500"
										>
											{showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
										</button>
									</div>
									{errors.password && <p className="text-sm text-red-600">• {errors.password}</p>}
								</div>

								{/* Confirm Password */}
								<div className="space-y-2">
									<label htmlFor="m-confirm" className="block text-sm font-semibold text-gray-900 flex items-center gap-2">
										<CheckCircle size={18} className={passwordsMatch ? "text-orange-600" : "text-gray-400"} />
										Confirm Password
										{passwordsMatch && <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-orange-100 text-orange-700">Match</span>}
									</label>
									<div className="relative">
										<input 
											id="m-confirm"
											type={showConfirm ? "text" : "password"} 
											value={confirm}
											onChange={(e) => {
												setConfirm(e.target.value);
												if (errors.confirm) setErrors({...errors, confirm: ''});
											}}
											placeholder="Repeat password" 
											className={`w-full px-4 py-3 bg-white border-2 rounded-xl transition-all placeholder-gray-400 focus:outline-none pr-12 ${
												errors.confirm 
													? 'border-red-400 bg-red-50' 
													: passwordsMatch
													? 'border-orange-400 focus:border-orange-500 focus:ring-2 focus:ring-orange-100'
													: 'border-gray-200 focus:border-orange-500 focus:ring-2 focus:ring-orange-100'
											}`}
										/>
										<button
											type="button"
											onClick={() => setShowConfirm(!showConfirm)}
											className="absolute right-3 top-3 text-gray-500"
										>
											{showConfirm ? <EyeOff size={20} /> : <Eye size={20} />}
										</button>
									</div>
									{errors.confirm && <p className="text-sm text-red-600">• {errors.confirm}</p>}
								</div>

								{/* Terms */}
								<div className="space-y-2">
									<label className="flex items-start gap-2 cursor-pointer group">
										<input 
											type="checkbox" 
											checked={agreeTerms}
											onChange={(e) => {
												setAgreeTerms(e.target.checked);
												if (errors.agreeTerms) setErrors({...errors, agreeTerms: ''});
											}}
											className="w-4 h-4 mt-1 rounded border-2 border-gray-300 text-orange-600"
										/>
										<span className="text-sm text-gray-700">
											I agree to the <button type="button" className="font-semibold text-orange-600">Terms</button> and <button type="button" className="font-semibold text-orange-600">Privacy</button>
										</span>
									</label>
									{errors.agreeTerms && <p className="text-sm text-red-600">• {errors.agreeTerms}</p>}
								</div>

								{/* Submit */}
								<button 
									type="submit" 
									disabled={isLoading}
									className="w-full py-3 px-4 bg-gradient-to-r from-orange-600 to-orange-700 hover:from-orange-700 hover:to-orange-800 disabled:from-gray-400 disabled:to-gray-400 text-white font-semibold rounded-xl transition-all shadow-lg flex items-center justify-center gap-2 mt-6"
								>
									{isLoading ? (
										<>
											<div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
											<span>Creating...</span>
										</>
									) : (
										<>
											<span>Create Account</span>
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
										<span className="px-3 bg-white text-gray-600">Or</span>
									</div>
								</div>

								{/* Social */}
								<div className="grid grid-cols-2 gap-3">
									<button
										type="button"
										onClick={() => handleSocialRegister('Google')}
										className="py-3 px-4 border-2 border-gray-300 hover:border-orange-400 rounded-xl text-gray-700 hover:text-orange-600 transition-all hover:bg-orange-50 flex items-center justify-center gap-2"
									>
										<span className="text-xl">🔷</span>
										<span>Google</span>
									</button>
									<button
										type="button"
										onClick={() => handleSocialRegister('GitHub')}
										className="py-3 px-4 border-2 border-gray-300 hover:border-orange-400 rounded-xl text-gray-700 hover:text-orange-600 transition-all hover:bg-orange-50 flex items-center justify-center gap-2"
									>
										<span className="text-xl">⚫</span>
										<span>GitHub</span>
									</button>
								</div>
							</form>

							{/* Login Link */}
							<p className="text-center text-gray-700 text-sm pt-4 border-t border-gray-200">
								Already have an account?{" "}
								<button 
									onClick={handleLoginLink} 
									className="font-semibold text-orange-600 hover:text-orange-700 transition-colors hover:underline"
								>
									Sign in
								</button>
							</p>
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

export default Register
