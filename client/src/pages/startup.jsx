import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChefHat, Users, ArrowRight } from 'lucide-react'
import logo from '../assets/bite.png'

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
		<div className="min-h-screen bg-gradient-to-br from-white via-orange-50 to-white flex items-center justify-center py-12 px-4">
			{/* Animated Background Elements */}
			<div className="absolute top-0 left-0 w-96 h-96 bg-orange-100/30 rounded-full -translate-x-1/2 -translate-y-1/2 blur-3xl"></div>
			<div className="absolute bottom-0 right-0 w-96 h-96 bg-orange-100/30 rounded-full translate-x-1/2 translate-y-1/2 blur-3xl"></div>

			<div className="relative z-10 w-full max-w-4xl">
				{/* Header Section */}
				<div className="text-center mb-10 animate-fade-in">
					<img
						src={logo}
						alt="BiteHub"
						className="w-56 h-56 object-contain mx-auto mb-0 hover:scale-110 transition-transform duration-500 drop-shadow-sm"
					/>
					<h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2 tracking-tight">
						Welcome to <span className="text-orange-600">BiteHub</span>
					</h1>
					<p className="text-lg text-gray-500 max-w-lg mx-auto font-medium">
						Choose your journey and start your food experience
					</p>
				</div>

				{/* Role Selection Cards */}
				<div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10 text-center md:text-left">
					{/* Customer Card */}
					<div
						className="group relative"
						onMouseEnter={() => setHoveredRole('customer')}
						onMouseLeave={() => setHoveredRole(null)}
						onClick={() => handleRoleSelect('customer')}
					>
						<div className="absolute inset-0 bg-orange-500/10 rounded-[32px] blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
						<div className={`relative bg-white/80 backdrop-blur-xl rounded-[32px] p-8 shadow-sm hover:shadow-2xl transition-all duration-500 cursor-pointer border border-gray-100 ${hoveredRole === 'customer'
							? 'ring-2 ring-orange-500/50 -translate-y-1'
							: 'hover:border-orange-200'
							}`}>
							{/* Icon Container */}
							<div className={`mx-auto md:mx-0 inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-6 transition-all duration-500 ${hoveredRole === 'customer'
								? 'bg-orange-500 shadow-lg scale-110'
								: 'bg-orange-50'
								}`}>
								<Users size={32} className={hoveredRole === 'customer' ? 'text-white' : 'text-orange-600'} />
							</div>

							{/* Content */}
							<h2 className="text-2xl font-bold text-gray-900 mb-2">
								Order Food
							</h2>
							<p className="text-gray-500 text-sm mb-6 leading-relaxed">
								Browse campus restaurants, discover delicious meals, and get fast delivery. Enjoy exclusive deals.
							</p>

							{/* Features */}
							<div className="space-y-2 mb-8 text-left inline-block md:block">
								<div className="flex items-center gap-3">
									<div className="flex-shrink-0 w-1.5 h-1.5 bg-orange-400 rounded-full"></div>
									<span className="text-gray-600 text-xs font-medium">Browse campus restaurants</span>
								</div>
								<div className="flex items-center gap-3">
									<div className="flex-shrink-0 w-1.5 h-1.5 bg-orange-400 rounded-full"></div>
									<span className="text-gray-600 text-xs font-medium">Fast and reliable delivery</span>
								</div>
								<div className="flex items-center gap-3">
									<div className="flex-shrink-0 w-1.5 h-1.5 bg-orange-400 rounded-full"></div>
									<span className="text-gray-600 text-xs font-medium">Secure local payments</span>
								</div>
							</div>

							{/* Button */}
							<button
								className={`w-full py-3.5 px-6 rounded-2xl font-bold text-sm transition-all duration-300 flex items-center justify-center gap-2 group/btn ${hoveredRole === 'customer'
									? 'bg-orange-500 text-white shadow-lg shadow-orange-500/30'
									: 'bg-gray-50 text-gray-600 hover:bg-orange-50 hover:text-orange-600'
									}`}
							>
								<span>Continue as Customer</span>
								<ArrowRight size={16} className={`transition-transform duration-300 ${hoveredRole === 'customer' ? 'translate-x-1' : ''}`} />
							</button>
						</div>
					</div>

					{/* Restaurant Owner Card */}
					<div
						className="group relative"
						onMouseEnter={() => setHoveredRole('restaurant')}
						onMouseLeave={() => setHoveredRole(null)}
						onClick={() => handleRoleSelect('restaurant')}
					>
						<div className="absolute inset-0 bg-orange-500/10 rounded-[32px] blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
						<div className={`relative bg-white/80 backdrop-blur-xl rounded-[32px] p-8 shadow-sm hover:shadow-2xl transition-all duration-500 cursor-pointer border border-gray-100 ${hoveredRole === 'restaurant'
							? 'ring-2 ring-orange-500/50 -translate-y-1'
							: 'hover:border-orange-200'
							}`}>
							{/* Icon Container */}
							<div className={`mx-auto md:mx-0 inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-6 transition-all duration-500 ${hoveredRole === 'restaurant'
								? 'bg-orange-500 shadow-lg scale-110'
								: 'bg-orange-50'
								}`}>
								<ChefHat size={32} className={hoveredRole === 'restaurant' ? 'text-white' : 'text-orange-600'} />
							</div>

							{/* Content */}
							<h2 className="text-2xl font-bold text-gray-900 mb-2">
								Grow Business
							</h2>
							<p className="text-gray-500 text-sm mb-6 leading-relaxed">
								Join our network, manage orders efficiently, and reach hungry customers. Increase your sales today.
							</p>

							{/* Features */}
							<div className="space-y-2 mb-8 text-left inline-block md:block">
								<div className="flex items-center gap-3">
									<div className="flex-shrink-0 w-1.5 h-1.5 bg-orange-400 rounded-full"></div>
									<span className="text-gray-600 text-xs font-medium">Easy order management</span>
								</div>
								<div className="flex items-center gap-3">
									<div className="flex-shrink-0 w-1.5 h-1.5 bg-orange-400 rounded-full"></div>
									<span className="text-gray-600 text-xs font-medium">Real-time reports</span>
								</div>
								<div className="flex items-center gap-3">
									<div className="flex-shrink-0 w-1.5 h-1.5 bg-orange-400 rounded-full"></div>
									<span className="text-gray-600 text-xs font-medium">Dedicated support</span>
								</div>
							</div>

							{/* Button */}
							<button
								className={`w-full py-3.5 px-6 rounded-2xl font-bold text-sm transition-all duration-300 flex items-center justify-center gap-2 group/btn ${hoveredRole === 'restaurant'
									? 'bg-orange-500 text-white shadow-lg shadow-orange-500/30'
									: 'bg-gray-50 text-gray-600 hover:bg-orange-50 hover:text-orange-600'
									}`}
							>
								<span>Continue as Restaurant</span>
								<ArrowRight size={16} className={`transition-transform duration-300 ${hoveredRole === 'restaurant' ? 'translate-x-1' : ''}`} />
							</button>
						</div>
					</div>
				</div>

				{/* Footer Section */}
				<div className="text-center space-y-4 animate-fade-in" style={{ animationDelay: '0.2s' }}>
					<p className="text-sm text-gray-500 flex flex-wrap justify-center gap-2 items-center">
						New customer?{' '}
						<button
							onClick={() => navigate('/register')}
							className="font-bold text-orange-600 hover:text-orange-700 transition-colors"
						>
							Create Account
						</button>

					</p>
					<p className="text-sm text-gray-500 flex flex-wrap justify-center gap-2 items-center">
						Restaurant owner?{' '}
						<button
							onClick={() => navigate('/restaurant-register')}
							className="font-bold text-orange-600 hover:text-orange-700 transition-colors"
						>
							Partner with us
						</button>

					</p>
				</div>
			</div>

			{/* Custom Animations */}
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

export default StartUp
