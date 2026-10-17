import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChefHat, Users, ArrowRight } from 'lucide-react'
import kaingoLogo from '../assets/kaingo-logo.svg'

function StartUp() {
	const navigate = useNavigate();
	const [hoveredRole, setHoveredRole] = useState(null);

	const handleRoleSelect = (role) => {
		if (role === 'customer') {
			navigate('/login');
		} else if (role === 'restaurant') {
			navigate('/restaurant-login');
		}
	};

	return (
		<div className="min-h-screen bg-[#FAFAFA] flex items-center justify-center py-12 px-4">
			<div className="w-full max-w-4xl">
				{/* Header Section */}
				<div className="text-center mb-10">
					<img
						src={kaingoLogo}
						alt="KainGo"
						className="w-48 h-48 object-contain mx-auto mb-4 hover:scale-105 transition-transform duration-300"
					/>
					<h1 className="text-3xl md:text-4xl font-bold text-[#171717] mb-2 tracking-tight">
						Welcome to <span className="text-[#EA580C]">KainGo</span>
					</h1>
					<p className="text-base text-[#6B7280] max-w-md mx-auto">
						Choose your journey and start your food experience
					</p>
				</div>

				{/* Role Selection Cards */}
				<div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-10 text-center md:text-left">
					{/* Customer Card */}
					<div
						className="group"
						onMouseEnter={() => setHoveredRole('customer')}
						onMouseLeave={() => setHoveredRole(null)}
						onClick={() => handleRoleSelect('customer')}
					>
						<div className={`bg-white rounded-xl p-8 border transition-all duration-200 cursor-pointer ${hoveredRole === 'customer'
							? 'border-[#EA580C]/30 shadow-lg shadow-[#EA580C]/5 -translate-y-0.5'
							: 'border-[#E5E7EB] shadow-sm hover:border-[#EA580C]/20 hover:shadow-md'
							}`}>
							<div className={`mx-auto md:mx-0 inline-flex items-center justify-center w-14 h-14 rounded-xl mb-5 transition-colors duration-200 ${hoveredRole === 'customer'
								? 'bg-[#EA580C]'
								: 'bg-[#EA580C]/10'
								}`}>
								<Users size={26} className={hoveredRole === 'customer' ? 'text-white' : 'text-[#EA580C]'} />
							</div>

							<h2 className="text-xl font-bold text-[#171717] mb-2">
								Order Food
							</h2>
							<p className="text-[#6B7280] text-sm mb-5 leading-relaxed">
								Browse campus restaurants, discover delicious meals, and get fast delivery. Enjoy exclusive deals.
							</p>

							<div className="space-y-2.5 mb-7 text-left inline-block md:block">
								{['Browse campus restaurants', 'Fast and reliable delivery', 'Secure local payments'].map((feature) => (
									<div key={feature} className="flex items-center gap-2.5">
										<div className="flex-shrink-0 w-1.5 h-1.5 bg-[#EA580C] rounded-full"></div>
										<span className="text-[#6B7280] text-xs font-medium">{feature}</span>
									</div>
								))}
							</div>

							<button
								className={`w-full py-3 px-5 rounded-xl font-semibold text-sm transition-all duration-200 flex items-center justify-center gap-2 ${hoveredRole === 'customer'
									? 'bg-[#EA580C] text-white shadow-md shadow-[#EA580C]/20'
									: 'bg-[#FAFAFA] text-[#6B7280] border border-[#E5E7EB] hover:bg-[#EA580C] hover:text-white hover:border-[#EA580C]'
									}`}
							>
								<span>Continue as Customer</span>
								<ArrowRight size={16} className={`transition-transform duration-200 ${hoveredRole === 'customer' ? 'translate-x-0.5' : ''}`} />
							</button>
						</div>
					</div>

					{/* Restaurant Owner Card */}
					<div
						className="group"
						onMouseEnter={() => setHoveredRole('restaurant')}
						onMouseLeave={() => setHoveredRole(null)}
						onClick={() => handleRoleSelect('restaurant')}
					>
						<div className={`bg-white rounded-xl p-8 border transition-all duration-200 cursor-pointer ${hoveredRole === 'restaurant'
							? 'border-[#EA580C]/30 shadow-lg shadow-[#EA580C]/5 -translate-y-0.5'
							: 'border-[#E5E7EB] shadow-sm hover:border-[#EA580C]/20 hover:shadow-md'
							}`}>
							<div className={`mx-auto md:mx-0 inline-flex items-center justify-center w-14 h-14 rounded-xl mb-5 transition-colors duration-200 ${hoveredRole === 'restaurant'
								? 'bg-[#EA580C]'
								: 'bg-[#EA580C]/10'
								}`}>
								<ChefHat size={26} className={hoveredRole === 'restaurant' ? 'text-white' : 'text-[#EA580C]'} />
							</div>

							<h2 className="text-xl font-bold text-[#171717] mb-2">
								Grow Business
							</h2>
							<p className="text-[#6B7280] text-sm mb-5 leading-relaxed">
								Join our network, manage orders efficiently, and reach hungry customers. Increase your sales today.
							</p>

							<div className="space-y-2.5 mb-7 text-left inline-block md:block">
								{['Easy order management', 'Real-time reports', 'Dedicated support'].map((feature) => (
									<div key={feature} className="flex items-center gap-2.5">
										<div className="flex-shrink-0 w-1.5 h-1.5 bg-[#EA580C] rounded-full"></div>
										<span className="text-[#6B7280] text-xs font-medium">{feature}</span>
									</div>
								))}
							</div>

							<button
								className={`w-full py-3 px-5 rounded-xl font-semibold text-sm transition-all duration-200 flex items-center justify-center gap-2 ${hoveredRole === 'restaurant'
									? 'bg-[#EA580C] text-white shadow-md shadow-[#EA580C]/20'
									: 'bg-[#FAFAFA] text-[#6B7280] border border-[#E5E7EB] hover:bg-[#EA580C] hover:text-white hover:border-[#EA580C]'
									}`}
							>
								<span>Continue as Restaurant</span>
								<ArrowRight size={16} className={`transition-transform duration-200 ${hoveredRole === 'restaurant' ? 'translate-x-0.5' : ''}`} />
							</button>
						</div>
					</div>
				</div>

				{/* Footer Section */}
				<div className="text-center space-y-3">
					<p className="text-sm text-[#6B7280] flex flex-wrap justify-center gap-1.5 items-center">
						New customer?{' '}
						<button
							onClick={() => navigate('/register')}
							className="font-semibold text-[#EA580C] hover:text-[#EA580C]/80 transition-colors"
						>
							Create Account
						</button>
					</p>
					<p className="text-sm text-[#6B7280] flex flex-wrap justify-center gap-1.5 items-center">
						Restaurant owner?{' '}
						<button
							onClick={() => navigate('/restaurant-register')}
							className="font-semibold text-[#EA580C] hover:text-[#EA580C]/80 transition-colors"
						>
							Partner with us
						</button>
					</p>
				</div>
			</div>
		</div>
	)
}

export default StartUp
