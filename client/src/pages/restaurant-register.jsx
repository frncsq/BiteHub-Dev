import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Eye, EyeOff, Mail, Lock, Phone, Building2, FileText, User, CheckCircle, AlertCircle, ArrowRight, Upload, X } from 'lucide-react'
import axios from 'axios';
import { getApiBaseUrl } from '../services/apiClient';

function RestaurantRegister() {
	const navigate = useNavigate();
	const [formData, setFormData] = useState({
		// Business Information
		businessName: '',
		businessAddress: '',
		city: '',
		province: '',
		permitNumber: '',
		permitDocument: null,
		restaurantLogoUrl: '',
		// Owner Information
		ownerName: '',
		ownerPhone: '',
		businessEmail: '',
		// Account Credentials
		username: '',
		password: '',
		confirmPassword: '',
		// Agreement
		agreeTerms: false
	});

	const [permitPreview, setPermitPreview] = useState(null);
	const [showPassword, setShowPassword] = useState(false);
	const [showConfirm, setShowConfirm] = useState(false);
	const [isLoading, setIsLoading] = useState(false);
	const [message, setMessage] = useState('');
	const [messageType, setMessageType] = useState('');
	const [errors, setErrors] = useState({});
	const [passwordStrength, setPasswordStrength] = useState('weak');

	const calculatePasswordStrength = (pwd) => {
		if (pwd.length >= 12 && /[A-Z]/.test(pwd) && /[a-z]/.test(pwd) && /[0-9]/.test(pwd) && /[!@#$%^&*]/.test(pwd)) {
			return 'strong';
		}
		if (pwd.length >= 8 && /[A-Z]/.test(pwd) && /[a-z]/.test(pwd) && /[0-9]/.test(pwd)) {
			return 'medium';
		}
		return 'weak';
	};

	const handleInputChange = (e) => {
		const { name, value, type, checked } = e.target;
		const newValue = type === 'checkbox' ? checked : value;

		setFormData(prev => ({
			...prev,
			[name]: newValue
		}));

		if (errors[name]) {
			setErrors(prev => ({
				...prev,
				[name]: ''
			}));
		}

		if (name === 'password') {
			setPasswordStrength(calculatePasswordStrength(value));
		}
	};

	const handleFileUpload = (e) => {
		const file = e.target.files?.[0];
		if (file) {
			setFormData(prev => ({
				...prev,
				permitDocument: file
			}));

			const reader = new FileReader();
			reader.onload = (event) => {
				setPermitPreview(event.target?.result);
			};
			reader.readAsDataURL(file);

			if (errors.permitDocument) {
				setErrors(prev => ({
					...prev,
					permitDocument: ''
				}));
			}
		}
	};

	const handlePhotoUpload = (e) => {
		const file = e.target.files?.[0];
		if (file) {
			if (file.size > 2 * 1024 * 1024) {
				setMessage('Logo file size should be less than 2MB');
				setMessageType('error');
				return;
			}
			const reader = new FileReader();
			reader.onload = (event) => {
				setFormData(prev => ({
					...prev,
					restaurantLogoUrl: event.target?.result
				}));
			};
			reader.readAsDataURL(file);
		}
	};

	const removePermitDocument = () => {
		setFormData(prev => ({
			...prev,
			permitDocument: null
		}));
		setPermitPreview(null);
	};

	const validateForm = () => {
		const newErrors = {};

		// Business Information
		if (!formData.businessName.trim()) {
			newErrors.businessName = 'Business name is required';
		}
		if (!formData.businessAddress.trim()) {
			newErrors.businessAddress = 'Business address is required';
		}
		if (!formData.city.trim()) {
			newErrors.city = 'City is required';
		}
		if (!formData.province.trim()) {
			newErrors.province = 'Province/State is required';
		}
		if (!formData.permitNumber.trim()) {
			newErrors.permitNumber = 'Business permit number is required';
		}

		// Owner Information
		if (!formData.ownerName.trim()) {
			newErrors.ownerName = 'Owner name is required';
		}
		if (!formData.ownerPhone.trim()) {
			newErrors.ownerPhone = 'Contact number is required';
		} else if (!/^[\d\s\-\+\(\)]{10,}$/.test(formData.ownerPhone.replace(/\s/g, ''))) {
			newErrors.ownerPhone = 'Please enter a valid phone number';
		}
		if (!formData.businessEmail.trim()) {
			newErrors.businessEmail = 'Business email is required';
		} else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.businessEmail)) {
			newErrors.businessEmail = 'Please enter a valid email';
		}

		// Account Credentials
		if (!formData.username.trim()) {
			newErrors.username = 'Username is required';
		} else if (formData.username.length < 4) {
			newErrors.username = 'Username must be at least 4 characters';
		}
		if (!formData.password) {
			newErrors.password = 'Password is required';
		} else if (formData.password.length < 8) {
			newErrors.password = 'Password must be at least 8 characters';
		} else if (!/[A-Z]/.test(formData.password) || !/[a-z]/.test(formData.password) || !/[0-9]/.test(formData.password)) {
			newErrors.password = 'Password must contain uppercase, lowercase, and numbers';
		}
		if (!formData.confirmPassword) {
			newErrors.confirmPassword = 'Please confirm your password';
		} else if (formData.password !== formData.confirmPassword) {
			newErrors.confirmPassword = 'Passwords do not match';
		}

		// Agreement
		if (!formData.agreeTerms) {
			newErrors.agreeTerms = 'You must agree to the terms';
		}

		return newErrors;
	};

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
			const baseURL = getApiBaseUrl();
			const response = await axios.post(`${baseURL}/api/owner/register`, {
				businessName: formData.businessName.trim(),
				businessAddress: formData.businessAddress.trim(),
				city: formData.city.trim(),
				province: formData.province.trim(),
				permitNumber: formData.permitNumber.trim(),
				ownerName: formData.ownerName.trim(),
				ownerPhone: formData.ownerPhone.trim(),
				businessEmail: formData.businessEmail.trim(),
				username: formData.username.trim(),
				password: formData.password,
				restaurant_logo_url: formData.restaurantLogoUrl.trim()
			}, { withCredentials: true });

			if (response.data.success) {
				if (response.data.pending) {
					// Account created but pending approval — do NOT redirect
					setMessage('✅ Registration submitted! Your account is pending admin approval. You will be notified once approved. You may close this page.');
					setMessageType('success');
				} else {
					setMessage('Registration successful! Redirecting to dashboard...');
					setMessageType('success');
					setTimeout(() => {
						navigate('/owner/dashboard');
					}, 2000);
				}
			} else {
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
		navigate('/restaurant-login');
	};

	const handleBackToRoles = () => {
		navigate('/');
	};

	const passwordsMatch = formData.password && formData.confirmPassword && formData.password === formData.confirmPassword;

	return (
		<div className="min-h-screen bg-gradient-to-br from-white via-orange-50 to-white flex items-center justify-center py-12 px-4">
			{/* Animated Background */}
			<div className="absolute top-0 right-0 w-96 h-96 bg-orange-100/30 rounded-full -translate-y-1/2 translate-x-1/3 blur-3xl"></div>

			<div className="w-full max-w-3xl relative z-10 px-4">
				{/* Header */}
				<div className="mb-6">
					<button
						onClick={handleBackToRoles}
						className="text-orange-600 hover:text-orange-700 font-semibold flex items-center gap-2 transition-colors mb-4 text-sm"
					>
						← Back to role selection
					</button>
					<h1 className="text-3xl font-bold text-gray-900 mb-1">Register Your Restaurant</h1>
					<p className="text-gray-600 text-sm">Join BiteHub and start receiving orders</p>
				</div>

				{/* Status Messages */}
				{message && (
					<div className={`p-4 rounded-xl border-l-4 flex items-start gap-3 mb-6 animate-fade-in ${messageType === 'success'
						? 'bg-emerald-50 border-emerald-500 text-emerald-800'
						: messageType === 'error'
							? 'bg-red-50 border-red-500 text-red-800'
							: 'bg-blue-50 border-blue-500 text-blue-800'
						}`}>
						<p className="text-sm font-medium">{message}</p>
					</div>
				)}

				<form onSubmit={handleRegister} className="space-y-6">
					{/* Combined Registration Form Container */}
					<div className="bg-white/80 backdrop-blur-xl rounded-3xl p-6 md:p-8 shadow-2xl border border-white/20 space-y-8">
						{/* Grid for Business & Owner Info */}
						<div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
							{/* Business Information Section (Left) */}
							<section className="space-y-4">
								<div className="flex items-center gap-3 mb-4 pb-3 border-b border-orange-100">
									<div className="p-1.5 bg-orange-100 rounded-lg">
										<Building2 size={20} className="text-orange-600" />
									</div>
									<h2 className="text-xl font-bold text-gray-900">Business Information</h2>
								</div>

								<div className="space-y-4">
									{/* Business Name */}
									<div>
										<label className="block text-xs font-semibold text-gray-900 mb-1.5">
											Business Name <span className="text-red-600">*</span>
										</label>
										<input
											type="text"
											name="businessName"
											value={formData.businessName}
											onChange={handleInputChange}
											placeholder="Your Restaurant Name"
											className={`w-full px-3.5 py-2.5 border-2 rounded-xl transition-all duration-200 focus:outline-none text-sm ${errors.businessName
												? 'border-red-400 bg-red-50 focus:ring-2 focus:ring-red-300'
												: 'border-gray-200 focus:border-orange-500 focus:ring-2 focus:ring-orange-100'
												}`}
										/>
									</div>

									{/* Business Address */}
									<div>
										<label className="block text-xs font-semibold text-gray-900 mb-1.5">
											Business Address <span className="text-red-600">*</span>
										</label>
										<input
											type="text"
											name="businessAddress"
											value={formData.businessAddress}
											onChange={handleInputChange}
											placeholder="Street address"
											className={`w-full px-3.5 py-2.5 border-2 rounded-xl transition-all duration-200 focus:outline-none text-sm ${errors.businessAddress
												? 'border-red-400 bg-red-50 focus:ring-2 focus:ring-red-300'
												: 'border-gray-200 focus:border-orange-500 focus:ring-2 focus:ring-orange-100'
												}`}
										/>
									</div>

									{/* City & Province */}
									<div className="grid grid-cols-1 md:grid-cols-2 gap-3">
										<div>
											<label className="block text-xs font-semibold text-gray-900 mb-1.5">
												City <span className="text-red-600">*</span>
											</label>
											<input
												type="text"
												name="city"
												value={formData.city}
												onChange={handleInputChange}
												placeholder="City"
												className={`w-full px-3.5 py-2.5 border-2 rounded-xl transition-all duration-200 focus:outline-none text-sm ${errors.city
													? 'border-red-400 bg-red-50 focus:ring-2 focus:ring-red-300'
													: 'border-gray-200 focus:border-orange-500 focus:ring-2 focus:ring-orange-100'
													}`}
											/>
										</div>
										<div>
											<label className="block text-xs font-semibold text-gray-900 mb-1.5">
												Province/State <span className="text-red-600">*</span>
											</label>
											<input
												type="text"
												name="province"
												value={formData.province}
												onChange={handleInputChange}
												placeholder="Province"
												className={`w-full px-3.5 py-2.5 border-2 rounded-xl transition-all duration-200 focus:outline-none text-sm ${errors.province
													? 'border-red-400 bg-red-50 focus:ring-2 focus:ring-red-300'
													: 'border-gray-200 focus:border-orange-500 focus:ring-2 focus:ring-orange-100'
													}`}
											/>
										</div>
									</div>

									{/* Restaurant Logo URL */}
									<div>
										<label className="block text-xs font-semibold text-gray-900 mb-1.5">
											Restaurant Logo / Cover Photo
										</label>
										<input
											type="file"
											accept="image/*"
											onChange={handlePhotoUpload}
											className="w-full px-3.5 py-2 bg-white border-2 border-gray-100 rounded-xl text-xs file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-orange-50 file:text-orange-700 hover:file:bg-orange-100 cursor-pointer"
										/>
									</div>
								</div>
							</section>

							{/* Owner & Permit Information Section (Right) */}
							<section className="space-y-4">
								<div className="flex items-center gap-3 mb-4 pb-3 border-b border-orange-100">
									<div className="p-1.5 bg-orange-100 rounded-lg">
										<User size={20} className="text-orange-600" />
									</div>
									<h2 className="text-xl font-bold text-gray-900">Owner & Permit Information</h2>
								</div>

								<div className="space-y-4">
									{/* Row for Owner Name & Detail */}
									<div className="grid grid-cols-1 md:grid-cols-2 gap-3">
										<div>
											<label className="block text-xs font-semibold text-gray-900 mb-1.5">
												Owner Full Name <span className="text-red-600">*</span>
											</label>
											<input
												type="text"
												name="ownerName"
												value={formData.ownerName}
												onChange={handleInputChange}
												placeholder="Full Name"
												className={`w-full px-3.5 py-2.5 border-2 rounded-xl transition-all duration-200 focus:outline-none text-sm ${errors.ownerName
													? 'border-red-400 bg-red-50 focus:ring-2 focus:ring-red-300'
													: 'border-gray-200 focus:border-orange-500 focus:ring-2 focus:ring-orange-100'
													}`}
											/>
										</div>
										<div>
											<label className="block text-xs font-semibold text-gray-900 mb-1.5">
												Contact Number <span className="text-red-600">*</span>
											</label>
											<input
												type="tel"
												name="ownerPhone"
												value={formData.ownerPhone}
												onChange={handleInputChange}
												placeholder="Phone"
												className={`w-full px-3.5 py-2.5 border-2 rounded-xl transition-all duration-200 focus:outline-none text-sm ${errors.ownerPhone
													? 'border-red-400 bg-red-50 focus:ring-2 focus:ring-red-300'
													: 'border-gray-200 focus:border-orange-500 focus:ring-2 focus:ring-orange-100'
													}`}
											/>
										</div>
									</div>

									{/* Business Email */}
									<div>
										<label className="block text-xs font-semibold text-gray-900 mb-1.5">
											Business Email <span className="text-red-600">*</span>
										</label>
										<input
											type="email"
											name="businessEmail"
											value={formData.businessEmail}
											onChange={handleInputChange}
											placeholder="admin@restaurant.com"
											className={`w-full px-3.5 py-2.5 border-2 rounded-xl transition-all duration-200 focus:outline-none text-sm ${errors.businessEmail
												? 'border-red-400 bg-red-50 focus:ring-2 focus:ring-red-300'
												: 'border-gray-200 focus:border-orange-500 focus:ring-2 focus:ring-orange-100'
												}`}
										/>
									</div>

									{/* Permit Number */}
									<div className="pt-3 border-t border-orange-50">
										<label className="block text-xs font-semibold text-gray-900 mb-1.5">
											Permit Number <span className="text-red-600">*</span>
										</label>
										<input
											type="text"
											name="permitNumber"
											value={formData.permitNumber}
											onChange={handleInputChange}
											placeholder="Permit #123456"
											className={`w-full px-3.5 py-2.5 border-2 rounded-xl transition-all duration-200 focus:outline-none text-sm ${errors.permitNumber
												? 'border-red-400 bg-red-50 focus:ring-2 focus:ring-red-300'
												: 'border-gray-200 focus:border-orange-500 focus:ring-2 focus:ring-orange-100'
												}`}
										/>
									</div>

									{/* Document Upload */}
									<div className="pt-1">
										<div className={`border-2 border-dashed rounded-xl p-4 transition-all duration-200 text-center ${errors.permitDocument ? 'border-red-400 bg-red-50' : 'border-gray-200 hover:border-orange-300'}`}>
											<label className="cursor-pointer block space-y-1">
												<Upload size={20} className="mx-auto text-orange-600" />
												<p className="text-[10px] font-bold text-gray-600">Upload Business Permit</p>
												<input type="file" name="permitDocument" onChange={handleFileUpload} accept=".pdf,.jpg,.jpeg,.png" className="hidden" />
											</label>
										</div>
									</div>
								</div>
							</section>
						</div>

						{/* Account Credentials Section (Bottom) */}
						<section className="pt-6 border-t border-orange-100">
							<div className="flex items-center gap-3 mb-4 pb-3 border-b border-orange-100">
								<div className="p-1.5 bg-orange-100 rounded-lg">
									<Lock size={20} className="text-orange-600" />
								</div>
								<h2 className="text-xl font-bold text-gray-900">Account Credentials</h2>
							</div>

							<div className="grid grid-cols-1 md:grid-cols-3 gap-5">
								{/* Username */}
								<div>
									<label className="block text-xs font-semibold text-gray-900 mb-1.5">
										Username <span className="text-red-600">*</span>
									</label>
									<input
										type="text"
										name="username"
										value={formData.username}
										onChange={handleInputChange}
										placeholder="restaurant_admin"
										className={`w-full px-3.5 py-2.5 border-2 rounded-xl transition-all duration-200 focus:outline-none text-sm ${errors.username
											? 'border-red-400 bg-red-50 focus:ring-2 focus:ring-red-300'
											: 'border-gray-200 focus:border-orange-500 focus:ring-2 focus:ring-orange-100'
											}`}
									/>
								</div>

								{/* Password */}
								<div>
									<label className="block text-xs font-semibold text-gray-900 mb-1.5 flex items-center gap-2">
										Password <span className="text-red-600">*</span>
										<span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${passwordStrength === 'strong' ? 'bg-green-100 text-green-700' :
											passwordStrength === 'medium' ? 'bg-yellow-100 text-yellow-700' :
												'bg-red-100 text-red-700'
											}`}>
											{passwordStrength}
										</span>
									</label>
									<div className="relative">
										<input
											type={showPassword ? "text" : "password"}
											name="password"
											value={formData.password}
											onChange={handleInputChange}
											placeholder="Min. 8 chars"
											className={`w-full px-3.5 py-2.5 border-2 rounded-xl transition-all duration-200 focus:outline-none pr-11 text-sm ${errors.password
												? 'border-red-400 bg-red-50 focus:ring-2 focus:ring-red-300'
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

								{/* Confirm Password */}
								<div>
									<label className="block text-xs font-semibold text-gray-900 mb-1.5 flex items-center gap-2">
										Confirm Password <span className="text-red-600">*</span>
										{passwordsMatch && <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-green-100 text-green-700">Match</span>}
									</label>
									<div className="relative">
										<input
											type={showConfirm ? "text" : "password"}
											name="confirmPassword"
											value={formData.confirmPassword}
											onChange={handleInputChange}
											placeholder="Repeat password"
											className={`w-full px-3.5 py-2.5 border-2 rounded-xl transition-all duration-200 focus:outline-none pr-11 text-sm ${errors.confirmPassword
												? 'border-red-400 bg-red-50 focus:ring-2 focus:ring-red-300'
												: passwordsMatch
													? 'border-green-400 focus:border-green-500 focus:ring-2 focus:ring-green-100'
													: 'border-gray-200 focus:border-orange-500 focus:ring-2 focus:ring-orange-100'
												}`}
										/>
										<button
											type="button"
											onClick={() => setShowConfirm(!showConfirm)}
											className="absolute right-3 top-2.5 text-gray-500 hover:text-gray-700 transition-colors"
										>
											{showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
										</button>
									</div>
								</div>
							</div>
						</section>
					</div>

					{/* Agreement & Privacy Policy */}
					<div className="max-w-xl mx-auto text-center space-y-6 pt-6 border-t border-orange-50">
						<label className="inline-flex items-start gap-3 cursor-pointer group text-left max-w-md mx-auto">
							<input
								type="checkbox"
								name="agreeTerms"
								checked={formData.agreeTerms}
								onChange={handleInputChange}
								className="w-5 h-5 mt-0.5 rounded-lg border-2 border-gray-200 text-orange-600 focus:ring-orange-500 transition-all cursor-pointer"
							/>
							<span className="text-xs text-gray-500 group-hover:text-gray-900 transition-colors leading-relaxed">
								I certify that the information provided is accurate and complies with all regulations. I agree to the
								<button type="button" className="mx-1 font-bold text-orange-600 hover:text-orange-700 underline underline-offset-4 decoration-2 decoration-orange-100 decoration-offset-2">Terms</button>
								and
								<button type="button" className="mx-1 font-bold text-orange-600 hover:text-orange-700 underline underline-offset-4 decoration-2 decoration-orange-100 decoration-offset-2">Privacy Policy</button>.
							</span>
						</label>
						
						{errors.agreeTerms && (
							<p className="text-xs text-red-600 flex items-center justify-center gap-1 font-bold bg-red-50/50 py-2 rounded-xl border border-red-100">
								<AlertCircle size={14} /> {errors.agreeTerms}
							</p>
						)}

						{/* Form Actions */}
						<div className="space-y-6 pt-2">
							<button
								type="submit"
								disabled={isLoading}
								className="w-full py-4 px-8 bg-gradient-to-r from-orange-600 to-orange-700 hover:from-orange-700 hover:to-orange-800 disabled:from-gray-300 disabled:to-gray-200 text-white font-black rounded-2xl transition-all duration-300 shadow-xl shadow-orange-500/10 hover:shadow-orange-500/30 hover:scale-[1.01] active:scale-[0.99] flex items-center justify-center gap-3 group/btn uppercase tracking-widest text-sm"
							>
								{isLoading ? (
									<>
										<div className="animate-spin rounded-full h-5 w-5 border-2 border-white/30 border-t-white"></div>
										<span>Processing Application...</span>
									</>
								) : (
									<>
										<span>Submit Registration</span>
										<ArrowRight size={20} className="transition-transform duration-300 group-hover/btn:translate-x-1" />
									</>
								)}
							</button>

							<p className="text-center text-gray-500 font-bold text-xs">
								Already have a partner account?{" "}
								<button
									type="button"
									onClick={handleLoginLink}
									className="text-orange-600 hover:text-orange-700 font-black transition-all hover:underline underline-offset-4"
								>
									Log in here
								</button>
							</p>
						</div>
					</div>
				</form>
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

export default RestaurantRegister
