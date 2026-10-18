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
					setMessage('Registration submitted! Your account is pending admin approval. You will be notified once approved. You may close this page.');
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

	const inputClass = (error) => `w-full px-3.5 py-2.5 bg-[#FAFAFA] border rounded-xl transition-all duration-200 focus:outline-none text-sm ${error
		? 'border-red-400 focus:ring-2 focus:ring-red-100 bg-red-50/50'
		: 'border-[#E5E7EB] focus:border-[#EA580C] focus:ring-2 focus:ring-[#EA580C]/10'
	}`;

	return (
		<div className="min-h-screen bg-[#FAFAFA] flex items-center justify-center py-12 px-4">
			<div className="w-full max-w-3xl relative z-10 px-4">
				{/* Header */}
				<div className="mb-6">
					<button
						onClick={handleBackToRoles}
						className="text-[#EA580C] hover:text-[#EA580C]/80 font-semibold flex items-center gap-2 transition-colors mb-4 text-sm"
					>
						← Back to role selection
					</button>
					<h1 className="text-3xl font-bold text-[#171717] mb-1">Register Your Restaurant</h1>
					<p className="text-[#6B7280] text-sm">Join KainGo and start receiving orders</p>
				</div>

				{/* Status Messages */}
				{message && (
					<div className={`p-4 rounded-lg border flex items-start gap-3 mb-6 ${messageType === 'success'
						? 'bg-emerald-50 border-emerald-200 text-emerald-700'
						: messageType === 'error'
							? 'bg-red-50 border-red-200 text-red-700'
							: 'bg-blue-50 border-blue-200 text-blue-700'
						}`}>
						<p className="text-sm font-medium">{message}</p>
					</div>
				)}

				<form onSubmit={handleRegister} className="space-y-6">
					{/* Combined Registration Form Container */}
					<div className="bg-white rounded-xl p-6 md:p-8 shadow-sm border border-[#E5E7EB] space-y-8">
						{/* Grid for Business & Owner Info */}
						<div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
							{/* Business Information Section (Left) */}
							<section className="space-y-4">
								<div className="flex items-center gap-3 mb-4 pb-3 border-b border-[#F3F4F6]">
									<div className="p-2 bg-[#EA580C]/10 rounded-lg">
										<Building2 size={18} className="text-[#EA580C]" />
									</div>
									<h2 className="text-lg font-bold text-[#171717]">Business Information</h2>
								</div>

								<div className="space-y-4">
									{/* Business Name */}
									<div>
										<label className="block text-xs font-semibold text-[#171717] mb-1.5">
											Business Name <span className="text-red-500">*</span>
										</label>
										<input
											type="text"
											name="businessName"
											value={formData.businessName}
											onChange={handleInputChange}
											placeholder="Your Restaurant Name"
											className={inputClass(errors.businessName)}
										/>
									</div>

									{/* Business Address */}
									<div>
										<label className="block text-xs font-semibold text-[#171717] mb-1.5">
											Business Address <span className="text-red-500">*</span>
										</label>
										<input
											type="text"
											name="businessAddress"
											value={formData.businessAddress}
											onChange={handleInputChange}
											placeholder="Street address"
											className={inputClass(errors.businessAddress)}
										/>
									</div>

									{/* City & Province */}
									<div className="grid grid-cols-1 md:grid-cols-2 gap-3">
										<div>
											<label className="block text-xs font-semibold text-[#171717] mb-1.5">
												City <span className="text-red-500">*</span>
											</label>
											<input
												type="text"
												name="city"
												value={formData.city}
												onChange={handleInputChange}
												placeholder="City"
												className={inputClass(errors.city)}
											/>
										</div>
										<div>
											<label className="block text-xs font-semibold text-[#171717] mb-1.5">
												Province/State <span className="text-red-500">*</span>
											</label>
											<input
												type="text"
												name="province"
												value={formData.province}
												onChange={handleInputChange}
												placeholder="Province"
												className={inputClass(errors.province)}
											/>
										</div>
									</div>

									{/* Restaurant Logo URL */}
									<div>
										<label className="block text-xs font-semibold text-[#171717] mb-1.5">
											Restaurant Logo / Cover Photo
										</label>
										<input
											type="file"
											accept="image/*"
											onChange={handlePhotoUpload}
											className="w-full px-3.5 py-2 bg-[#FAFAFA] border border-[#E5E7EB] rounded-xl text-xs file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-[#EA580C]/10 file:text-[#EA580C] hover:file:bg-[#EA580C]/20 cursor-pointer transition-colors"
										/>
									</div>
								</div>
							</section>

							{/* Owner & Permit Information Section (Right) */}
							<section className="space-y-4">
								<div className="flex items-center gap-3 mb-4 pb-3 border-b border-[#F3F4F6]">
									<div className="p-2 bg-[#EA580C]/10 rounded-lg">
										<User size={18} className="text-[#EA580C]" />
									</div>
									<h2 className="text-lg font-bold text-[#171717]">Owner & Permit Information</h2>
								</div>

								<div className="space-y-4">
									{/* Row for Owner Name & Detail */}
									<div className="grid grid-cols-1 md:grid-cols-2 gap-3">
										<div>
											<label className="block text-xs font-semibold text-[#171717] mb-1.5">
												Owner Full Name <span className="text-red-500">*</span>
											</label>
											<input
												type="text"
												name="ownerName"
												value={formData.ownerName}
												onChange={handleInputChange}
												placeholder="Full Name"
												className={inputClass(errors.ownerName)}
											/>
										</div>
										<div>
											<label className="block text-xs font-semibold text-[#171717] mb-1.5">
												Contact Number <span className="text-red-500">*</span>
											</label>
											<input
												type="tel"
												name="ownerPhone"
												value={formData.ownerPhone}
												onChange={handleInputChange}
												placeholder="Phone"
												className={inputClass(errors.ownerPhone)}
											/>
										</div>
									</div>

									{/* Business Email */}
									<div>
										<label className="block text-xs font-semibold text-[#171717] mb-1.5">
											Business Email <span className="text-red-500">*</span>
										</label>
										<input
											type="email"
											name="businessEmail"
											value={formData.businessEmail}
											onChange={handleInputChange}
											placeholder="admin@restaurant.com"
											className={inputClass(errors.businessEmail)}
										/>
									</div>

									{/* Permit Number */}
									<div className="pt-3 border-t border-[#F3F4F6]">
										<label className="block text-xs font-semibold text-[#171717] mb-1.5">
											Permit Number <span className="text-red-500">*</span>
										</label>
										<input
											type="text"
											name="permitNumber"
											value={formData.permitNumber}
											onChange={handleInputChange}
											placeholder="Permit #123456"
											className={inputClass(errors.permitNumber)}
										/>
									</div>

									{/* Document Upload */}
									<div className="pt-1">
										<div className={`border border-dashed rounded-xl p-4 transition-all duration-200 text-center ${errors.permitDocument ? 'border-red-400 bg-red-50/50' : 'border-[#E5E7EB] hover:border-[#EA580C]/30 bg-[#FAFAFA]'}`}>
											<label className="cursor-pointer block space-y-1">
												<Upload size={20} className="mx-auto text-[#EA580C]" />
												<p className="text-xs font-semibold text-[#6B7280]">Upload Business Permit</p>
												<input type="file" name="permitDocument" onChange={handleFileUpload} accept=".pdf,.jpg,.jpeg,.png" className="hidden" />
											</label>
										</div>
									</div>
								</div>
							</section>
						</div>

						{/* Account Credentials Section (Bottom) */}
						<section className="pt-6 border-t border-[#F3F4F6]">
							<div className="flex items-center gap-3 mb-4 pb-3 border-b border-[#F3F4F6]">
								<div className="p-2 bg-[#EA580C]/10 rounded-lg">
									<Lock size={18} className="text-[#EA580C]" />
								</div>
								<h2 className="text-lg font-bold text-[#171717]">Account Credentials</h2>
							</div>

							<div className="grid grid-cols-1 md:grid-cols-3 gap-5">
								{/* Username */}
								<div>
									<label className="block text-xs font-semibold text-[#171717] mb-1.5">
										Username <span className="text-red-500">*</span>
									</label>
									<input
										type="text"
										name="username"
										value={formData.username}
										onChange={handleInputChange}
										placeholder="restaurant_admin"
										className={inputClass(errors.username)}
									/>
								</div>

								{/* Password */}
								<div>
									<label className="block text-xs font-semibold text-[#171717] mb-1.5 flex items-center gap-2">
										Password <span className="text-red-500">*</span>
										<span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${passwordStrength === 'strong' ? 'bg-emerald-100 text-emerald-700' :
											passwordStrength === 'medium' ? 'bg-amber-100 text-amber-700' :
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
											className={`w-full px-3.5 py-2.5 bg-[#FAFAFA] border rounded-xl transition-all duration-200 focus:outline-none pr-11 text-sm ${errors.password
												? 'border-red-400 focus:ring-2 focus:ring-red-100 bg-red-50/50'
												: 'border-[#E5E7EB] focus:border-[#EA580C] focus:ring-2 focus:ring-[#EA580C]/10'
												}`}
										/>
										<button
											type="button"
											onClick={() => setShowPassword(!showPassword)}
											className="absolute right-3 top-2.5 text-[#9CA3AF] hover:text-[#6B7280] transition-colors"
										>
											{showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
										</button>
									</div>
								</div>

								{/* Confirm Password */}
								<div>
									<label className="block text-xs font-semibold text-[#171717] mb-1.5 flex items-center gap-2">
										Confirm Password <span className="text-red-500">*</span>
										{passwordsMatch && <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700">Match</span>}
									</label>
									<div className="relative">
										<input
											type={showConfirm ? "text" : "password"}
											name="confirmPassword"
											value={formData.confirmPassword}
											onChange={handleInputChange}
											placeholder="Repeat password"
											className={`w-full px-3.5 py-2.5 bg-[#FAFAFA] border rounded-xl transition-all duration-200 focus:outline-none pr-11 text-sm ${errors.confirmPassword
												? 'border-red-400 focus:ring-2 focus:ring-red-100 bg-red-50/50'
												: passwordsMatch
													? 'border-emerald-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100'
													: 'border-[#E5E7EB] focus:border-[#EA580C] focus:ring-2 focus:ring-[#EA580C]/10'
												}`}
										/>
										<button
											type="button"
											onClick={() => setShowConfirm(!showConfirm)}
											className="absolute right-3 top-2.5 text-[#9CA3AF] hover:text-[#6B7280] transition-colors"
										>
											{showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
										</button>
									</div>
								</div>
							</div>
						</section>
					</div>

					{/* Agreement & Privacy Policy */}
					<div className="max-w-xl mx-auto text-center space-y-6 pt-6 border-t border-[#F3F4F6]">
						<label className="inline-flex items-start gap-3 cursor-pointer group text-left max-w-md mx-auto">
							<input
								type="checkbox"
								name="agreeTerms"
								checked={formData.agreeTerms}
								onChange={handleInputChange}
								className="w-5 h-5 mt-0.5 rounded-lg border-[#D1D5DB] text-[#EA580C] focus:ring-[#EA580C]/30 transition-all cursor-pointer"
							/>
							<span className="text-xs text-[#6B7280] group-hover:text-[#171717] transition-colors leading-relaxed">
								I certify that the information provided is accurate and complies with all regulations. I agree to the
								<button type="button" onClick={() => navigate('/legal/terms')} className="mx-1 font-semibold text-[#EA580C] hover:text-[#EA580C]/80 underline underline-offset-2 decoration-[#EA580C]/30">Terms</button>
								and
								<button type="button" onClick={() => navigate('/legal/privacy')} className="mx-1 font-semibold text-[#EA580C] hover:text-[#EA580C]/80 underline underline-offset-2 decoration-[#EA580C]/30">Privacy Policy</button>.
							</span>
						</label>

						{errors.agreeTerms && (
							<p className="text-xs text-red-600 flex items-center justify-center gap-1 font-semibold bg-red-50 py-2 rounded-lg border border-red-100">
								<AlertCircle size={14} /> {errors.agreeTerms}
							</p>
						)}

						{/* Form Actions */}
						<div className="space-y-5 pt-2">
							<button
								type="submit"
								disabled={isLoading}
								className="w-full py-3.5 px-8 bg-[#EA580C] hover:bg-[#EA580C]/90 disabled:bg-[#D1D5DB] disabled:text-[#9CA3AF] text-white font-bold rounded-xl transition-all duration-200 shadow-md shadow-[#EA580C]/15 hover:shadow-lg hover:shadow-[#EA580C]/20 disabled:shadow-none flex items-center justify-center gap-2 text-sm"
							>
								{isLoading ? (
									<>
										<div className="animate-spin rounded-full h-5 w-5 border-2 border-white/30 border-t-white"></div>
										<span>Processing Application...</span>
									</>
								) : (
									<>
										<span>Submit Registration</span>
										<ArrowRight size={18} />
									</>
								)}
							</button>

							<p className="text-center text-[#6B7280] font-medium text-xs">
								Already have a partner account?{" "}
								<button
									type="button"
									onClick={handleLoginLink}
									className="text-[#EA580C] hover:text-[#EA580C]/80 font-semibold transition-colors"
								>
									Log in here
								</button>
							</p>
						</div>
					</div>
				</form>
			</div>
		</div>
	)
}

export default RestaurantRegister
