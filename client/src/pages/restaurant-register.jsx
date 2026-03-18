import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Eye, EyeOff, Mail, Lock, Phone, Building2, FileText, User, CheckCircle, AlertCircle, ArrowRight, Upload, X } from 'lucide-react'
import axios from 'axios';

function RestaurantRegister() {
	const navigate = useNavigate();
	const [formData, setFormData] = useState({
		// Business Information
		businessName: '',
		businessAddress: '',
		city: '',
		province: '',
		permitNumber: '',
		taxId: '',
		permitDocument: null,
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
			const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
			const response = await axios.post(`${baseURL}/api/owner/register`, {
				businessName: formData.businessName.trim(),
				businessAddress: formData.businessAddress.trim(),
				city: formData.city.trim(),
				province: formData.province.trim(),
				permitNumber: formData.permitNumber.trim(),
				taxId: formData.taxId.trim(),
				ownerName: formData.ownerName.trim(),
				ownerPhone: formData.ownerPhone.trim(),
				businessEmail: formData.businessEmail.trim(),
				username: formData.username.trim(),
				password: formData.password
			}, { withCredentials: true });
			
			if (response.data.success) {
				setMessage('Registration successful! Redirecting to dashboard...');
				setMessageType('success');
				setTimeout(() => {
					navigate('/owner/dashboard');
				}, 2000);
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

			<div className="w-full max-w-5xl relative z-10">
				{/* Header */}
				<div className="mb-8">
					<button
						onClick={handleBackToRoles}
						className="text-orange-600 hover:text-orange-700 font-semibold flex items-center gap-2 transition-colors mb-6"
					>
						← Back to role selection
					</button>
					<h1 className="text-4xl font-bold text-gray-900 mb-2">Register Your Restaurant</h1>
					<p className="text-lg text-gray-600">Complete information to join BiteHub and start receiving orders</p>
				</div>

				{/* Status Messages */}
				{message && (
					<div className={`p-4 rounded-xl border-l-4 flex items-start gap-3 mb-8 animate-fade-in ${
						messageType === 'success' 
							? 'bg-emerald-50 border-emerald-500 text-emerald-800' 
							: messageType === 'error'
							? 'bg-red-50 border-red-500 text-red-800'
							: 'bg-blue-50 border-blue-500 text-blue-800'
					}`}>
						<div className="mt-0.5">
							{messageType === 'success' && <CheckCircle size={20} />}
							{messageType === 'error' && <AlertCircle size={20} />}
						</div>
						<p className="text-sm font-medium">{message}</p>
					</div>
				)}

				<form onSubmit={handleRegister} className="space-y-8">
					{/* Business Information Section */}
					<div className="bg-white rounded-2xl p-6 md:p-8 shadow-lg border border-gray-200">
						<div className="flex items-center gap-3 mb-6 pb-4 border-b-2 border-orange-200">
							<Building2 size={24} className="text-orange-600" />
							<h2 className="text-2xl font-bold text-gray-900">Business Information</h2>
						</div>

						<div className="space-y-5">
							{/* Business Name */}
							<div>
								<label className="block text-sm font-semibold text-gray-900 mb-2">
									Business Name <span className="text-red-600">*</span>
								</label>
								<input
									type="text"
									name="businessName"
									value={formData.businessName}
									onChange={handleInputChange}
									placeholder="Your Restaurant Name"
									className={`w-full px-4 py-3 border-2 rounded-xl transition-all duration-200 focus:outline-none ${
										errors.businessName
											? 'border-red-400 bg-red-50 focus:ring-2 focus:ring-red-300'
											: 'border-gray-200 focus:border-orange-500 focus:ring-2 focus:ring-orange-100'
									}`}
								/>
								{errors.businessName && (
									<p className="text-sm text-red-600 mt-1 flex items-center gap-1">
										<span>•</span> {errors.businessName}
									</p>
								)}
							</div>

							{/* Business Address */}
							<div>
								<label className="block text-sm font-semibold text-gray-900 mb-2">
									Business Address <span className="text-red-600">*</span>
								</label>
								<input
									type="text"
									name="businessAddress"
									value={formData.businessAddress}
									onChange={handleInputChange}
									placeholder="Street address"
									className={`w-full px-4 py-3 border-2 rounded-xl transition-all duration-200 focus:outline-none ${
										errors.businessAddress
											? 'border-red-400 bg-red-50 focus:ring-2 focus:ring-red-300'
											: 'border-gray-200 focus:border-orange-500 focus:ring-2 focus:ring-orange-100'
									}`}
								/>
								{errors.businessAddress && (
									<p className="text-sm text-red-600 mt-1 flex items-center gap-1">
										<span>•</span> {errors.businessAddress}
									</p>
								)}
							</div>

							{/* City & Province */}
							<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
								<div>
									<label className="block text-sm font-semibold text-gray-900 mb-2">
										City <span className="text-red-600">*</span>
									</label>
									<input
										type="text"
										name="city"
										value={formData.city}
										onChange={handleInputChange}
										placeholder="City"
										className={`w-full px-4 py-3 border-2 rounded-xl transition-all duration-200 focus:outline-none ${
											errors.city
												? 'border-red-400 bg-red-50 focus:ring-2 focus:ring-red-300'
												: 'border-gray-200 focus:border-orange-500 focus:ring-2 focus:ring-orange-100'
										}`}
									/>
									{errors.city && (
										<p className="text-sm text-red-600 mt-1 flex items-center gap-1">
											<span>•</span> {errors.city}
										</p>
									)}
								</div>
								<div>
									<label className="block text-sm font-semibold text-gray-900 mb-2">
										Province/State <span className="text-red-600">*</span>
									</label>
									<input
										type="text"
										name="province"
										value={formData.province}
										onChange={handleInputChange}
										placeholder="Province or State"
										className={`w-full px-4 py-3 border-2 rounded-xl transition-all duration-200 focus:outline-none ${
											errors.province
												? 'border-red-400 bg-red-50 focus:ring-2 focus:ring-red-300'
												: 'border-gray-200 focus:border-orange-500 focus:ring-2 focus:ring-orange-100'
										}`}
									/>
									{errors.province && (
										<p className="text-sm text-red-600 mt-1 flex items-center gap-1">
											<span>•</span> {errors.province}
										</p>
									)}
								</div>
							</div>

							{/* Permit & Tax ID */}
							<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
								<div>
									<label className="block text-sm font-semibold text-gray-900 mb-2">
										Business Permit Number <span className="text-red-600">*</span>
									</label>
									<input
										type="text"
										name="permitNumber"
										value={formData.permitNumber}
										onChange={handleInputChange}
										placeholder="Permit #123456"
										className={`w-full px-4 py-3 border-2 rounded-xl transition-all duration-200 focus:outline-none ${
											errors.permitNumber
												? 'border-red-400 bg-red-50 focus:ring-2 focus:ring-red-300'
												: 'border-gray-200 focus:border-orange-500 focus:ring-2 focus:ring-orange-100'
										}`}
									/>
									{errors.permitNumber && (
										<p className="text-sm text-red-600 mt-1 flex items-center gap-1">
											<span>•</span> {errors.permitNumber}
										</p>
									)}
								</div>
								<div>
									<label className="block text-sm font-semibold text-gray-900 mb-2">
										Tax ID <span className="text-gray-500">(Optional)</span>
									</label>
									<input
										type="text"
										name="taxId"
										value={formData.taxId}
										onChange={handleInputChange}
										placeholder="Tax ID"
										className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl transition-all duration-200 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
									/>
								</div>
							</div>

							{/* Document Upload */}
							<div>
								<label className="block text-sm font-semibold text-gray-900 mb-2">
									Upload Business Permit Document <span className="text-gray-500">(Optional for testing)</span>
								</label>
								<div className={`border-2 border-dashed rounded-xl p-6 transition-all duration-200 text-center ${
									errors.permitDocument
										? 'border-red-400 bg-red-50'
										: permitPreview
										? 'border-orange-400 bg-orange-50'
										: 'border-gray-300 hover:border-orange-400'
								}`}>
									{permitPreview ? (
										<div className="space-y-3">
											<img src={permitPreview} alt="Document preview" className="max-h-40 mx-auto rounded-lg" />
											<button
												type="button"
												onClick={removePermitDocument}
												className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
											>
												<X size={16} />
												Remove Document
											</button>
										</div>
									) : (
										<label className="cursor-pointer block space-y-2">
											<Upload size={32} className="mx-auto text-orange-600" />
											<p className="font-semibold text-gray-900">Click to upload or drag and drop</p>
											<p className="text-sm text-gray-600">PNG, JPG, PDF up to 10MB</p>
											<input
												type="file"
												name="permitDocument"
												onChange={handleFileUpload}
												accept=".pdf,.jpg,.jpeg,.png"
												className="hidden"
											/>
										</label>
									)}
								</div>
								{errors.permitDocument && (
									<p className="text-sm text-red-600 mt-2 flex items-center gap-1">
										<span>•</span> {errors.permitDocument}
									</p>
								)}
							</div>
						</div>
					</div>

					{/* Owner Information Section */}
					<div className="bg-white rounded-2xl p-6 md:p-8 shadow-lg border border-gray-200">
						<div className="flex items-center gap-3 mb-6 pb-4 border-b-2 border-orange-200">
							<User size={24} className="text-orange-600" />
							<h2 className="text-2xl font-bold text-gray-900">Owner Information</h2>
						</div>

						<div className="space-y-5">
							{/* Owner Name */}
							<div>
								<label className="block text-sm font-semibold text-gray-900 mb-2">
									Owner Full Name <span className="text-red-600">*</span>
								</label>
								<input
									type="text"
									name="ownerName"
									value={formData.ownerName}
									onChange={handleInputChange}
									placeholder="Your Full Name"
									className={`w-full px-4 py-3 border-2 rounded-xl transition-all duration-200 focus:outline-none ${
										errors.ownerName
											? 'border-red-400 bg-red-50 focus:ring-2 focus:ring-red-300'
											: 'border-gray-200 focus:border-orange-500 focus:ring-2 focus:ring-orange-100'
									}`}
								/>
								{errors.ownerName && (
									<p className="text-sm text-red-600 mt-1 flex items-center gap-1">
										<span>•</span> {errors.ownerName}
									</p>
								)}
							</div>

							{/* Contact & Email */}
							<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
								<div>
									<label className="block text-sm font-semibold text-gray-900 mb-2">
										Contact Number <span className="text-red-600">*</span>
									</label>
									<input
										type="tel"
										name="ownerPhone"
										value={formData.ownerPhone}
										onChange={handleInputChange}
										placeholder="+1 (555) 123-4567"
										className={`w-full px-4 py-3 border-2 rounded-xl transition-all duration-200 focus:outline-none ${
											errors.ownerPhone
												? 'border-red-400 bg-red-50 focus:ring-2 focus:ring-red-300'
												: 'border-gray-200 focus:border-orange-500 focus:ring-2 focus:ring-orange-100'
										}`}
									/>
									{errors.ownerPhone && (
										<p className="text-sm text-red-600 mt-1 flex items-center gap-1">
											<span>•</span> {errors.ownerPhone}
										</p>
									)}
								</div>
								<div>
									<label className="block text-sm font-semibold text-gray-900 mb-2">
										Business Email <span className="text-red-600">*</span>
									</label>
									<input
										type="email"
										name="businessEmail"
										value={formData.businessEmail}
										onChange={handleInputChange}
										placeholder="admin@restaurant.com"
										className={`w-full px-4 py-3 border-2 rounded-xl transition-all duration-200 focus:outline-none ${
											errors.businessEmail
												? 'border-red-400 bg-red-50 focus:ring-2 focus:ring-red-300'
												: 'border-gray-200 focus:border-orange-500 focus:ring-2 focus:ring-orange-100'
										}`}
									/>
									{errors.businessEmail && (
										<p className="text-sm text-red-600 mt-1 flex items-center gap-1">
											<span>•</span> {errors.businessEmail}
										</p>
									)}
								</div>
							</div>
						</div>
					</div>

					{/* Account Credentials Section */}
					<div className="bg-white rounded-2xl p-6 md:p-8 shadow-lg border border-gray-200">
						<div className="flex items-center gap-3 mb-6 pb-4 border-b-2 border-orange-200">
							<Lock size={24} className="text-orange-600" />
							<h2 className="text-2xl font-bold text-gray-900">Account Credentials</h2>
						</div>

						<div className="space-y-5">
							{/* Username */}
							<div>
								<label className="block text-sm font-semibold text-gray-900 mb-2">
									Username <span className="text-red-600">*</span>
								</label>
								<input
									type="text"
									name="username"
									value={formData.username}
									onChange={handleInputChange}
									placeholder="restaurant_admin"
									className={`w-full px-4 py-3 border-2 rounded-xl transition-all duration-200 focus:outline-none ${
										errors.username
											? 'border-red-400 bg-red-50 focus:ring-2 focus:ring-red-300'
											: 'border-gray-200 focus:border-orange-500 focus:ring-2 focus:ring-orange-100'
									}`}
								/>
								{errors.username && (
									<p className="text-sm text-red-600 mt-1 flex items-center gap-1">
										<span>•</span> {errors.username}
									</p>
								)}
							</div>

							{/* Password */}
							<div>
								<label className="block text-sm font-semibold text-gray-900 mb-2 flex items-center gap-2">
									Password <span className="text-red-600">*</span>
									<span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
										passwordStrength === 'strong' ? 'bg-green-100 text-green-700' :
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
										placeholder="Min. 8 characters with uppercase, lowercase, and numbers"
										className={`w-full px-4 py-3 border-2 rounded-xl transition-all duration-200 focus:outline-none pr-12 ${
											errors.password
												? 'border-red-400 bg-red-50 focus:ring-2 focus:ring-red-300'
												: 'border-gray-200 focus:border-orange-500 focus:ring-2 focus:ring-orange-100'
										}`}
									/>
									<button
										type="button"
										onClick={() => setShowPassword(!showPassword)}
										className="absolute right-3 top-3 text-gray-500 hover:text-gray-700 transition-colors"
									>
										{showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
									</button>
								</div>
								{errors.password && (
									<p className="text-sm text-red-600 mt-1 flex items-center gap-1">
										<span>•</span> {errors.password}
									</p>
								)}
							</div>

							{/* Confirm Password */}
							<div>
								<label className="block text-sm font-semibold text-gray-900 mb-2 flex items-center gap-2">
									Confirm Password <span className="text-red-600">*</span>
									{passwordsMatch && <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-green-100 text-green-700">Match</span>}
								</label>
								<div className="relative">
									<input
										type={showConfirm ? "text" : "password"}
										name="confirmPassword"
										value={formData.confirmPassword}
										onChange={handleInputChange}
										placeholder="Repeat your password"
										className={`w-full px-4 py-3 border-2 rounded-xl transition-all duration-200 focus:outline-none pr-12 ${
											errors.confirmPassword
												? 'border-red-400 bg-red-50 focus:ring-2 focus:ring-red-300'
												: passwordsMatch
												? 'border-green-400 focus:border-green-500 focus:ring-2 focus:ring-green-100'
												: 'border-gray-200 focus:border-orange-500 focus:ring-2 focus:ring-orange-100'
										}`}
									/>
									<button
										type="button"
										onClick={() => setShowConfirm(!showConfirm)}
										className="absolute right-3 top-3 text-gray-500 hover:text-gray-700 transition-colors"
									>
										{showConfirm ? <EyeOff size={20} /> : <Eye size={20} />}
									</button>
								</div>
								{errors.confirmPassword && (
									<p className="text-sm text-red-600 mt-1 flex items-center gap-1">
										<span>•</span> {errors.confirmPassword}
									</p>
								)}
							</div>
						</div>
					</div>

					{/* Confirmation Section */}
					<div className="bg-orange-50 rounded-2xl p-6 md:p-8 border-2 border-orange-200">
						<label className="flex items-start gap-3 cursor-pointer group">
							<input
								type="checkbox"
								name="agreeTerms"
								checked={formData.agreeTerms}
								onChange={handleInputChange}
								className="w-5 h-5 mt-1 rounded border-2 border-orange-600 text-orange-600 focus:ring-2 focus:ring-orange-300 transition-colors"
							/>
							<span className="text-sm text-gray-700 group-hover:text-gray-900 transition-colors leading-relaxed">
								I certify that the information provided is accurate and complete. I confirm that my business complies with all local, state, and federal regulations including health and safety standards. I agree to the <button type="button" className="font-semibold text-orange-600 hover:underline">Terms of Service</button> and <button type="button" className="font-semibold text-orange-600 hover:underline">Privacy Policy</button>.
							</span>
						</label>
						{errors.agreeTerms && (
							<p className="text-sm text-red-600 mt-3 flex items-center gap-1">
								<span>•</span> {errors.agreeTerms}
							</p>
						)}
					</div>

					{/* Form Actions */}
					<div className="flex gap-4">
						<button
							type="submit"
							disabled={isLoading}
							className="flex-1 py-4 px-6 bg-gradient-to-r from-orange-600 to-orange-700 hover:from-orange-700 hover:to-orange-800 disabled:from-gray-400 disabled:to-gray-400 text-white font-semibold rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl disabled:scale-100 flex items-center justify-center gap-2"
						>
							{isLoading ? (
								<>
									<div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
									<span>Creating account...</span>
								</>
							) : (
								<>
									<span>Create Restaurant Account</span>
									<ArrowRight size={20} />
								</>
							)}
						</button>
					</div>

					{/* Login Link */}
					<p className="text-center text-gray-700 text-sm">
						Already have a restaurant account?{" "}
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
