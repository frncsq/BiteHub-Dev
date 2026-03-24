import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { createApiClient } from "../services/apiClient";
import { 
	User, Mail, Lock, Phone, MapPin, Building2, 
	BookOpen, Eye, EyeOff, ArrowRight 
} from "lucide-react";

const Register = () => {
	const [fullName, setFullName] = useState("");
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [confirm, setConfirm] = useState("");
	const [phone, setPhone] = useState("");
	const [address, setAddress] = useState("");
	const [city, setCity] = useState("");
	const [department, setDepartment] = useState("");
	const [course, setCourse] = useState("");
	const [year, setYear] = useState("");
	const [agreeTerms, setAgreeTerms] = useState(false);
	
	const [showPassword, setShowPassword] = useState(false);
	const [showConfirm, setShowConfirm] = useState(false);
	const [isLoading, setIsLoading] = useState(false);
	const [message, setMessage] = useState("");
	const [messageType, setMessageType] = useState("");
	const [errors, setErrors] = useState({});
	const [passwordStrength, setPasswordStrength] = useState("weak");
	const [passwordsMatch, setPasswordsMatch] = useState(false);

	const navigate = useNavigate();

	useEffect(() => {
		if (password) {
			if (password.length > 10 && /[A-Z]/.test(password) && /[0-9]/.test(password)) {
				setPasswordStrength("strong");
			} else if (password.length >= 8) {
				setPasswordStrength("medium");
			} else {
				setPasswordStrength("weak");
			}
		} else {
			setPasswordStrength("weak");
		}
	}, [password]);

	useEffect(() => {
		setPasswordsMatch(password !== "" && password === confirm);
	}, [password, confirm]);

	const handleBackToRoles = () => navigate("/startup");
	const handleLoginLink = () => navigate("/login");

	const validateForm = () => {
		const newErrors = {};
		if (!fullName) newErrors.fullName = "Full name is required";
		if (!email) newErrors.email = "Email is required";
		else if (!/\S+@\S+\.\S+/.test(email)) newErrors.email = "Email is invalid";
		if (!password) newErrors.password = "Password is required";
		else if (password.length < 8) newErrors.password = "Minimum 8 characters";
		if (password !== confirm) newErrors.confirm = "Passwords do not match";
		if (!department) newErrors.department = "Department is required";
		if (!course) newErrors.course = "Course is required";
		if (!year) newErrors.year = "Year is required";
		if (!agreeTerms) newErrors.agreeTerms = "You must agree to the terms";
		
		setErrors(newErrors);
		return Object.keys(newErrors).length === 0;
	};

	const handleRegister = async (e) => {
		e.preventDefault();
		if (!validateForm()) return;

		setIsLoading(true);
		setMessage("");
		
		try {
			const apiClient = createApiClient();
			const response = await apiClient.post('/customer/register', {
				full_name: fullName,
				email,
				password,
				phone,
				address,
				city,
				department,
				course,
				year,
			});

			if (response.data.success) {
				const { token } = response.data;
				if (token) {
					localStorage.setItem('authToken', token);
					console.log("✅ Auth token stored after registration");
				}
				
				setMessageType("success");
				setMessage("Registration successful! Redirecting...");
				setTimeout(() => navigate("/home"), 1500);
			} else {
				setMessageType("error");
				setMessage(response.data.message || "Registration failed");
			}
		} catch (err) {
			console.error("Registration Error:", err);
			setMessageType("error");
			setMessage(err.response?.data?.message || err.message || "Registration failed. Please try again.");
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<div className="min-h-screen bg-gradient-to-br from-white via-orange-50 to-white flex items-center justify-center py-12 px-4 relative overflow-hidden">
			{/* Animated Background Elements */}
			<div className="absolute top-0 right-0 w-80 h-80 bg-orange-100/30 rounded-full -translate-y-1/2 translate-x-1/3 blur-3xl"></div>
			<div className="absolute bottom-0 left-0 w-80 h-80 bg-orange-100/30 rounded-full translate-y-1/2 -translate-x-1/3 blur-3xl"></div>

			<div className="w-full max-w-4xl relative z-10">
				{/* Header Section */}
				<div className="mb-0 px-2 animate-fade-in">
					<button
						onClick={handleBackToRoles}
						className="inline-flex items-center gap-2 text-orange-600 hover:text-orange-700 font-bold text-xs transition-all mb-4"
					>
						← Back to selection
					</button>
					<h1 className="text-3xl font-black text-gray-900 tracking-tight">User Registration</h1>
					<p className="text-gray-500 text-xs mt-1 mb-8">Join the BiteHub community to start ordering</p>
				</div>

				{/* Single Modern Container - Glassmorphic Style */}
				<div className="bg-white/70 backdrop-blur-xl rounded-[2.5rem] shadow-2xl border border-white p-6 md:p-10 animate-fade-in">
					<form onSubmit={handleRegister} className="space-y-8">
						{/* Status Messages */}
						{message && (
							<div className={`p-4 rounded-2xl border-l-4 flex items-start gap-3 animate-fade-in ${messageType === 'success' ? 'bg-emerald-50 border-emerald-500 text-emerald-800' : messageType === 'error' ? 'bg-red-50 border-red-500 text-red-800' : 'bg-blue-50 border-blue-500 text-blue-800'}`}>
								<p className="text-xs font-semibold">{message}</p>
							</div>
						)}

						{/* Form Grid Layout */}
						<div className="grid grid-cols-1 lg:grid-cols-2 gap-x-12 gap-y-10">
							{/* Personal Information (Left) */}
							<section className="space-y-6">
								<div className="flex items-center gap-3 mb-2 pb-2 border-b-2 border-orange-100">
									<div className="p-2 bg-orange-500 rounded-xl text-white shadow-lg shadow-orange-200">
										<User size={18} />
									</div>
									<h2 className="text-xl font-bold text-gray-900 tracking-tight">Personal Details</h2>
								</div>

								<div className="space-y-4">
									<div className="space-y-1.5">
										<label className="block text-[10px] font-bold text-gray-500 uppercase tracking-[0.15em] ml-1">Full Name <span className="text-red-500">*</span></label>
										<input
											type="text" value={fullName}
											onChange={(e) => { setFullName(e.target.value); if (errors.fullName) setErrors({ ...errors, fullName: '' }); }}
											placeholder="Jane Doe"
											className={`w-full px-5 py-3 bg-white border-2 rounded-2xl transition-all text-sm focus:outline-none ${errors.fullName ? 'border-red-400 bg-red-50 shadow-sm shadow-red-100' : 'border-gray-50 hover:border-orange-200 focus:border-orange-500 focus:shadow-lg focus:shadow-orange-100'}`}
										/>
									</div>

									<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
										<div className="space-y-1.5">
											<label className="block text-[10px] font-bold text-gray-500 uppercase tracking-[0.15em] ml-1">Email <span className="text-red-500">*</span></label>
											<input
												type="email" value={email}
												onChange={(e) => { setEmail(e.target.value); if (errors.email) setErrors({ ...errors, email: '' }); }}
												placeholder="jane@example.com"
												className={`w-full px-5 py-3 bg-white border-2 rounded-2xl transition-all text-sm focus:outline-none ${errors.email ? 'border-red-400 bg-red-50 shadow-sm shadow-red-100' : 'border-gray-50 hover:border-orange-200 focus:border-orange-500 focus:shadow-lg focus:shadow-orange-100'}`}
											/>
										</div>
										<div className="space-y-1.5">
											<label className="block text-[10px] font-bold text-gray-500 uppercase tracking-[0.15em] ml-1">Phone</label>
											<input
												type="tel" value={phone} onChange={(e) => setPhone(e.target.value)}
												placeholder="09xx-xxx-xxxx"
												className="w-full px-5 py-3 bg-white border-2 border-gray-50 rounded-2xl transition-all text-sm hover:border-orange-200 focus:border-orange-500 focus:outline-none focus:shadow-lg focus:shadow-orange-100"
											/>
										</div>
									</div>

									<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
										<div className="space-y-1.5">
											<label className="block text-[10px] font-bold text-gray-500 uppercase tracking-[0.15em] ml-1">Address</label>
											<input
												type="text" value={address} onChange={(e) => setAddress(e.target.value)}
												placeholder="Building/Street"
												className="w-full px-5 py-3 bg-white border-2 border-gray-50 rounded-2xl transition-all text-sm hover:border-orange-200 focus:border-orange-500 focus:outline-none focus:shadow-lg focus:shadow-orange-100"
											/>
										</div>
										<div className="space-y-1.5">
											<label className="block text-[10px] font-bold text-gray-500 uppercase tracking-[0.15em] ml-1">City</label>
											<input
												type="text" value={city} onChange={(e) => setCity(e.target.value)}
												placeholder="City"
												className="w-full px-5 py-3 bg-white border-2 border-gray-50 rounded-2xl transition-all text-sm hover:border-orange-200 focus:border-orange-500 focus:outline-none focus:shadow-lg focus:shadow-orange-100"
											/>
										</div>
									</div>
								</div>
							</section>

							{/* Academic Information (Right) */}
							<section className="space-y-6">
								<div className="flex items-center gap-3 mb-2 pb-2 border-b-2 border-orange-100">
									<div className="p-2 bg-orange-500 rounded-xl text-white shadow-lg shadow-orange-200">
										<BookOpen size={18} />
									</div>
									<h2 className="text-xl font-bold text-gray-900 tracking-tight">Academic Details</h2>
								</div>

								<div className="space-y-4">
									<div className="space-y-1.5">
										<label className="block text-[10px] font-bold text-gray-500 uppercase tracking-[0.15em] ml-1">Department <span className="text-red-500">*</span></label>
										<div className="relative">
											<select
												value={department}
												onChange={(e) => setDepartment(e.target.value)}
												className={`w-full px-5 py-3 bg-white border-2 rounded-2xl transition-all text-sm focus:outline-none appearance-none cursor-pointer ${errors.department ? 'border-red-400 bg-red-50 shadow-sm shadow-red-100' : 'border-gray-50 hover:border-orange-200 focus:border-orange-500 focus:shadow-lg focus:shadow-orange-100'}`}
											>
												<option value="">Select Department...</option>
												<option value="College of Mathematics and Computing Sciences">College of Mathematics and Computing Sciences</option>
												<option value="College of Teacher Education">College of Teacher Education</option>
												<option value="College of Agriculture, Forestry and Cooperatives">College of Agriculture, Forestry and Cooperatives</option>
												<option value="Home Technology">Home Technology</option>
												<option value="Administration">Administration</option>
											</select>
											<div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
												<ArrowRight size={16} className="rotate-90" />
											</div>
										</div>
									</div>

									<div className="grid grid-cols-1 sm:grid-cols-12 gap-4">
										<div className="sm:col-span-8 space-y-1.5">
											<label className="block text-[10px] font-bold text-gray-500 uppercase tracking-[0.15em] ml-1">Course <span className="text-red-500">*</span></label>
											<input
												type="text" value={course} onChange={(e) => setCourse(e.target.value)}
												placeholder="e.g. BSIT / BS MATH"
												className={`w-full px-5 py-3 bg-white border-2 rounded-2xl transition-all text-sm focus:outline-none ${errors.course ? 'border-red-400 bg-red-50 shadow-sm shadow-red-100' : 'border-gray-50 hover:border-orange-200 focus:border-orange-500 focus:shadow-lg focus:shadow-orange-100'}`}
											/>
										</div>
										<div className="sm:col-span-4 space-y-1.5">
											<label className="block text-[10px] font-bold text-gray-500 uppercase tracking-[0.15em] ml-1">Year <span className="text-red-500">*</span></label>
											<select
												value={year}
												onChange={(e) => setYear(e.target.value)}
												className={`w-full px-5 py-3 bg-white border-2 rounded-2xl transition-all text-sm focus:outline-none appearance-none cursor-pointer ${errors.year ? 'border-red-400 bg-red-50 shadow-sm shadow-red-100' : 'border-gray-50 hover:border-orange-200 focus:border-orange-500 focus:shadow-lg focus:shadow-orange-100'}`}
											>
												<option value="">Yr</option>
												<option value="1">1st</option>
												<option value="2">2nd</option>
												<option value="3">3rd</option>
												<option value="4">4th</option>
											</select>
										</div>
									</div>

									<div className="p-4 bg-orange-50/70 border border-orange-100 rounded-2xl group transition-all hover:bg-orange-100/70">
										<div className="flex gap-3">
											<div className="text-orange-600 mt-0.5">💡</div>
											<p className="text-[11px] text-orange-800 leading-relaxed font-medium">
												Providing accurate academic details helps restaurants find your current campus location more easily for faster delivery.
											</p>
										</div>
									</div>
								</div>
							</section>
						</div>

						{/* Account Credentials (Bottom Section) */}
						<div className="pt-10 border-t-2 border-orange-50">
							<div className="flex items-center gap-3 mb-8">
								<div className="p-2 bg-orange-100 rounded-xl text-orange-600">
									<Lock size={18} />
								</div>
								<h2 className="text-xl font-bold text-gray-900 tracking-tight">Account Access</h2>
							</div>

							<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 items-end">
								{/* Password */}
								<div className="space-y-2 relative">
									<label className="block text-[10px] font-bold text-gray-500 uppercase tracking-[0.15em] ml-1 flex justify-between">
										<span>Password <span className="text-red-500">*</span></span>
										<span className={`text-[9px] font-black px-2 py-0.5 rounded-full uppercase ${passwordStrength === 'strong' ? 'bg-green-500 text-white' : passwordStrength === 'medium' ? 'bg-yellow-400 text-yellow-900' : 'bg-red-500 text-white'}`}>
											{passwordStrength}
										</span>
									</label>
									<div className="relative">
										<input
											type={showPassword ? "text" : "password"}
											value={password} onChange={(e) => setPassword(e.target.value)}
											placeholder="••••••••"
											className={`w-full px-5 py-3 bg-white border-2 rounded-2xl transition-all text-sm focus:outline-none pr-12 ${errors.password ? 'border-red-400 bg-red-50' : 'border-gray-50 hover:border-orange-200 focus:border-orange-500'}`}
										/>
										<button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-3 text-gray-400 hover:text-orange-500 transition-colors">
											{showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
										</button>
									</div>
								</div>

								{/* Confirm Password */}
								<div className="space-y-2 relative">
									<label className="block text-[10px] font-bold text-gray-500 uppercase tracking-[0.15em] ml-1 flex justify-between">
										<span>Confirm <span className="text-red-500">*</span></span>
										{passwordsMatch && <span className="text-[9px] font-black text-green-600 uppercase">Match confirmed</span>}
									</label>
									<div className="relative">
										<input
											type={showConfirm ? "text" : "password"}
											value={confirm} onChange={(e) => setConfirm(e.target.value)}
											placeholder="••••••••"
											className={`w-full px-5 py-3 bg-white border-2 rounded-2xl transition-all text-sm focus:outline-none pr-12 ${errors.confirm ? 'border-red-400 bg-red-50' : passwordsMatch ? 'border-green-400 bg-green-50' : 'border-gray-50 hover:border-orange-200 focus:border-orange-500'}`}
										/>
										<button type="button" onClick={() => setShowConfirm(!showConfirm)} className="absolute right-4 top-3 text-gray-400 hover:text-orange-500 transition-colors">
											{showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
										</button>
									</div>
								</div>

								{/* Submit & Terms */}
								<div className="flex flex-col gap-4">
									<label className="flex items-center gap-3 cursor-pointer group mb-1">
										<input
											type="checkbox"
											checked={agreeTerms}
											onChange={(e) => setAgreeTerms(e.target.checked)}
											className="w-5 h-5 rounded-lg border-2 border-gray-100 text-orange-600 focus:ring-orange-500 transition-all cursor-pointer"
										/>
										<span className="text-xs text-gray-600 font-medium group-hover:text-gray-900 transition-colors">
											I agree to <button type="button" className="font-bold text-orange-600 hover:underline">Terms</button> & <button type="button" className="font-bold text-orange-600 hover:underline">Privacy</button>
										</span>
									</label>
									<button
										type="submit"
										disabled={isLoading}
										className="w-full py-3.5 bg-gradient-to-r from-orange-600 to-orange-700 hover:from-orange-700 hover:to-orange-800 disabled:from-gray-300 text-white font-black rounded-2xl transition-all shadow-xl shadow-orange-200 hover:shadow-orange-300 hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2 text-sm uppercase tracking-widest"
									>
										{isLoading ? <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div> : <span>Register Now</span>}
										{!isLoading && <ArrowRight size={18} />}
									</button>
								</div>
							</div>
						</div>
					</form>
				</div>

				<div className="mt-10 text-center animate-fade-in group">
					<p className="text-gray-500 text-sm font-semibold">
						Already part of the family?{" "}
						<button onClick={handleLoginLink} className="font-bold text-orange-600 hover:text-orange-700 transition-all hover:underline underline-offset-4">Sign in here</button>
					</p>
				</div>
			</div>

			<style>{`
				@keyframes fade-in {
					from { opacity: 0; transform: translateY(15px); }
					to { opacity: 1; transform: translateY(0); }
				}
				.animate-fade-in {
					animation: fade-in 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards;
				}
			`}</style>
		</div>
	);
};

export default Register;
