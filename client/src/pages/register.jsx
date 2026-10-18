import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { createApiClient } from "../services/apiClient";
import {
	User, Mail, Lock, Phone, MapPin, Building2,
	BookOpen, Eye, EyeOff, ArrowRight
} from "lucide-react";
import kaingoLogo from "../assets/kaingo-logo.svg";

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
				full_name: fullName, email, password, phone, address, city, department, course, year,
			});
			if (response.data.success) {
				const { token } = response.data;
				if (token) localStorage.setItem('authToken', token);
				setMessageType("success");
				setMessage("Registration successful! Redirecting...");
				setTimeout(() => navigate("/home"), 1500);
			} else {
				setMessageType("error");
				setMessage(response.data.message || "Registration failed");
			}
		} catch (err) {
			setMessageType("error");
			setMessage(err.response?.data?.message || err.message || "Registration failed. Please try again.");
		} finally {
			setIsLoading(false);
		}
	};

	const inputClass = (hasError) =>
		`w-full px-3.5 py-2.5 bg-[#FAFAFA] border rounded-xl text-sm text-[#171717] placeholder-[#9CA3AF] transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#EA580C]/20 focus:border-[#EA580C] ${
			hasError ? 'border-[#DC2626] bg-[#FEF2F2]' : 'border-[#E5E7EB]'
		}`;

	const labelClass = "block text-sm font-medium text-[#374151] mb-1.5";
	const sectionTitle = "text-lg font-semibold text-[#171717] tracking-tight";

	return (
		<div className="min-h-screen bg-[#FAFAFA] flex items-center justify-center py-12 px-4 relative overflow-hidden">
			<div className="absolute top-0 right-0 w-80 h-80 bg-[#FFF7ED] rounded-full -translate-y-1/2 translate-x-1/3 blur-3xl opacity-60" />
			<div className="absolute bottom-0 left-0 w-80 h-80 bg-[#FFF7ED] rounded-full translate-y-1/2 -translate-x-1/3 blur-3xl opacity-60" />

			<div className="w-full max-w-3xl relative z-10">
				<button
					onClick={handleBackToRoles}
					className="mb-8 text-sm font-medium text-[#6B7280] hover:text-[#EA580C] flex items-center gap-1.5 transition-colors"
				>
					← Back to selection
				</button>

				<div className="flex items-center gap-2.5 mb-8">
					<div className="w-10 h-10 rounded-xl overflow-hidden flex items-center justify-center">
						<img src={kaingoLogo} alt="" className="w-10 h-10 object-contain" />
					</div>
					<span className="text-xl font-bold tracking-tight text-[#171717]">
						Kain<span className="text-[#EA580C]">Go</span>
					</span>
				</div>

				<div className="bg-white rounded-2xl border border-[#E5E7EB] p-8 shadow-sm">
					<div className="mb-8">
						<h1 className="text-2xl font-bold text-[#171717] tracking-tight">Create your account</h1>
						<p className="text-sm text-[#6B7280] mt-1">Join the KainGo community to start ordering</p>
					</div>

					{/* Status Message */}
					{message && (
						<div className={`mb-6 p-3 rounded-xl flex items-start gap-3 text-sm font-medium ${
							messageType === 'success'
								? 'bg-[#F0FDF4] text-[#16A34A] border border-[#BBF7D0]'
								: messageType === 'error'
									? 'bg-[#FEF2F2] text-[#DC2626] border border-[#FECACA]'
									: 'bg-[#EFF6FF] text-[#2563EB] border border-[#BFDBFE]'
						}`}>
							<p>{message}</p>
						</div>
					)}

					<form onSubmit={handleRegister} className="space-y-8">
						{/* Personal Details */}
						<section className="space-y-5">
							<h2 className={sectionTitle}>Personal Details</h2>
							<div className="space-y-4">
								<div>
									<label className={labelClass}>Full Name <span className="text-[#DC2626]">*</span></label>
									<input
										type="text" value={fullName}
										onChange={(e) => { setFullName(e.target.value); if (errors.fullName) setErrors({ ...errors, fullName: '' }); }}
										placeholder="Jane Doe"
										className={inputClass(errors.fullName)}
									/>
									{errors.fullName && <p className="mt-1 text-xs text-[#DC2626]">{errors.fullName}</p>}
								</div>
								<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
									<div>
										<label className={labelClass}>Email <span className="text-[#DC2626]">*</span></label>
										<input
											type="email" value={email}
											onChange={(e) => { setEmail(e.target.value); if (errors.email) setErrors({ ...errors, email: '' }); }}
											placeholder="jane@university.edu"
											className={inputClass(errors.email)}
										/>
										{errors.email && <p className="mt-1 text-xs text-[#DC2626]">{errors.email}</p>}
									</div>
									<div>
										<label className={labelClass}>Phone</label>
										<input
											type="tel" value={phone} onChange={(e) => setPhone(e.target.value)}
											placeholder="09xx-xxx-xxxx"
											className={inputClass(false)}
										/>
									</div>
								</div>
								<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
									<div>
										<label className={labelClass}>Address</label>
										<input
											type="text" value={address} onChange={(e) => setAddress(e.target.value)}
											placeholder="Building/Street"
											className={inputClass(false)}
										/>
									</div>
									<div>
										<label className={labelClass}>City</label>
										<input
											type="text" value={city} onChange={(e) => setCity(e.target.value)}
											placeholder="City"
											className={inputClass(false)}
										/>
									</div>
								</div>
							</div>
						</section>

						{/* Academic Details */}
						<section className="space-y-5">
							<h2 className={sectionTitle}>Academic Details</h2>
							<div className="space-y-4">
								<div>
									<label className={labelClass}>Department <span className="text-[#DC2626]">*</span></label>
									<select
										value={department}
										onChange={(e) => setDepartment(e.target.value)}
										className={inputClass(errors.department)}
									>
										<option value="">Select Department...</option>
										<option value="College of Mathematics and Computing Sciences">College of Mathematics and Computing Sciences</option>
										<option value="College of Teacher Education">College of Teacher Education</option>
										<option value="College of Agriculture, Forestry and Cooperatives">College of Agriculture, Forestry and Cooperatives</option>
										<option value="Home Technology">Home Technology</option>
										<option value="Administration">Administration</option>
									</select>
									{errors.department && <p className="mt-1 text-xs text-[#DC2626]">{errors.department}</p>}
								</div>
								<div className="grid grid-cols-1 sm:grid-cols-12 gap-4">
									<div className="sm:col-span-8">
										<label className={labelClass}>Course <span className="text-[#DC2626]">*</span></label>
										<input
											type="text" value={course} onChange={(e) => setCourse(e.target.value)}
											placeholder="e.g. BSIT / BS MATH"
											className={inputClass(errors.course)}
										/>
										{errors.course && <p className="mt-1 text-xs text-[#DC2626]">{errors.course}</p>}
									</div>
									<div className="sm:col-span-4">
										<label className={labelClass}>Year <span className="text-[#DC2626]">*</span></label>
										<select
											value={year}
											onChange={(e) => setYear(e.target.value)}
											className={inputClass(errors.year)}
										>
											<option value="">Yr</option>
											<option value="1">1st</option>
											<option value="2">2nd</option>
											<option value="3">3rd</option>
											<option value="4">4th</option>
										</select>
										{errors.year && <p className="mt-1 text-xs text-[#DC2626]">{errors.year}</p>}
									</div>
								</div>
							</div>
						</section>

						{/* Account Access */}
						<section className="space-y-5">
							<h2 className={sectionTitle}>Account Access</h2>
							<div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-end">
								<div>
									<label className={`${labelClass} flex justify-between`}>
										<span>Password <span className="text-[#DC2626]">*</span></span>
										<span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase ${
											passwordStrength === 'strong' ? 'bg-[#DCFCE7] text-[#16A34A]' :
											passwordStrength === 'medium' ? 'bg-[#FEF9C3] text-[#CA8A04]' :
											'bg-[#FEE2E2] text-[#DC2626]'
										}`}>
											{passwordStrength}
										</span>
									</label>
									<div className="relative">
										<input
											type={showPassword ? "text" : "password"}
											value={password} onChange={(e) => setPassword(e.target.value)}
											placeholder="Min. 8 characters"
											className={`${inputClass(errors.password)} pr-11`}
										/>
										<button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9CA3AF] hover:text-[#6B7280] transition-colors">
											{showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
										</button>
									</div>
									{errors.password && <p className="mt-1 text-xs text-[#DC2626]">{errors.password}</p>}
								</div>
								<div>
									<label className={`${labelClass} flex justify-between`}>
										<span>Confirm <span className="text-[#DC2626]">*</span></span>
										{passwordsMatch && <span className="text-[10px] font-semibold text-[#16A34A]">Match confirmed</span>}
									</label>
									<div className="relative">
										<input
											type={showConfirm ? "text" : "password"}
											value={confirm} onChange={(e) => setConfirm(e.target.value)}
											placeholder="Confirm password"
											className={`${inputClass(errors.confirm)} ${passwordsMatch && !errors.confirm ? 'border-[#16A34A] bg-[#F0FDF4]' : ''} pr-11`}
										/>
										<button type="button" onClick={() => setShowConfirm(!showConfirm)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9CA3AF] hover:text-[#6B7280] transition-colors">
											{showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
										</button>
									</div>
									{errors.confirm && <p className="mt-1 text-xs text-[#DC2626]">{errors.confirm}</p>}
								</div>
							</div>

							{/* Terms & Submit */}
							<div className="flex flex-col sm:flex-row items-start sm:items-end gap-4 pt-2">
								<label className="flex items-center gap-2.5 cursor-pointer">
									<input
										type="checkbox"
										checked={agreeTerms}
										onChange={(e) => setAgreeTerms(e.target.checked)}
										className="w-4 h-4 rounded border-[#D1D5DB] text-[#EA580C] focus:ring-[#EA580C]"
									/>
									<span className="text-sm text-[#6B7280]">
										I agree to <button type="button" onClick={() => navigate('/legal/terms')} className="font-semibold text-[#EA580C] hover:underline">Terms</button> & <button type="button" onClick={() => navigate('/legal/privacy')} className="font-semibold text-[#EA580C] hover:underline">Privacy</button>
									</span>
								</label>
								<div className="flex-1" />
								<button
									type="submit"
									disabled={isLoading}
									className="w-full sm:w-auto px-8 py-2.5 bg-[#EA580C] hover:bg-[#DC2626] disabled:bg-[#D1D5DB] disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-all duration-200 shadow-sm hover:shadow-md active:scale-[0.98] flex items-center justify-center gap-2 text-sm"
								>
									{isLoading ? (
										<div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
									) : (
										<>
											Create Account
											<ArrowRight size={16} />
										</>
									)}
								</button>
							</div>
							{errors.agreeTerms && <p className="text-xs text-[#DC2626]">{errors.agreeTerms}</p>}
						</section>
					</form>
				</div>

				<p className="text-center text-sm text-[#6B7280] mt-6">
					Already have an account?{" "}
					<button onClick={handleLoginLink} className="font-semibold text-[#EA580C] hover:text-[#DC2626] transition-colors">
						Sign in
					</button>
				</p>
			</div>
		</div>
	);
};

export default Register;
