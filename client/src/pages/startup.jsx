import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChefHat, Users, ArrowRight } from 'lucide-react'

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

			<div className="relative z-10 w-full max-w-6xl">
				{/* Header Section */}
				<div className="text-center mb-16 animate-fade-in">
					<div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl shadow-xl mb-6">
						<span className="text-4xl">bite.</span>
					</div>
					<h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-3 tracking-tight">
						Welcome to <span className="text-orange-600">BiteHub</span>
					</h1>
					<p className="text-xl md:text-2xl text-gray-600 max-w-2xl mx-auto">
						Choose your role to get started with amazing food experiences
					</p>
				</div>

				{/* Role Selection Cards */}
				<div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12 mb-12">
					{/* Customer Card */}
					<div
						className="group relative"
						onMouseEnter={() => setHoveredRole('customer')}
						onMouseLeave={() => setHoveredRole(null)}
						onClick={() => handleRoleSelect('customer')}
					>
						<div className="absolute inset-0 bg-gradient-to-br from-orange-500 to-orange-600 rounded-3xl opacity-0 group-hover:opacity-10 transition-opacity duration-500 blur-xl"></div>
						<div className={`relative bg-white rounded-3xl p-8 md:p-12 shadow-lg hover:shadow-2xl transition-all duration-300 cursor-pointer border-2 ${
							hoveredRole === 'customer' 
								? 'border-orange-500 scale-105' 
								: 'border-gray-200 hover:border-orange-300'
						}`}>
							{/* Icon Container */}
							<div className={`inline-flex items-center justify-center w-24 h-24 rounded-2xl mb-6 transition-all duration-300 ${
								hoveredRole === 'customer'
									? 'bg-gradient-to-br from-orange-500 to-orange-600 shadow-lg scale-110'
									: 'bg-orange-100'
							}`}>
								<Users size={48} className={hoveredRole === 'customer' ? 'text-white' : 'text-orange-600'} />
							</div>

							{/* Content */}
							<h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">
								Order Food
							</h2>
							<p className="text-gray-600 text-lg mb-6 leading-relaxed">
								Browse restaurants, discover delicious meals, and get fast delivery to your doorstep. Enjoy exclusive deals and track your orders in real-time.
							</p>

							{/* Features */}
							<div className="space-y-3 mb-8">
								<div className="flex items-center gap-3">
									<div className="flex-shrink-0 w-1.5 h-1.5 bg-orange-600 rounded-full"></div>
									<span className="text-gray-700">Browse thousand of restaurants</span>
								</div>
								<div className="flex items-center gap-3">
									<div className="flex-shrink-0 w-1.5 h-1.5 bg-orange-600 rounded-full"></div>
									<span className="text-gray-700">Fast and reliable delivery</span>
								</div>
								<div className="flex items-center gap-3">
									<div className="flex-shrink-0 w-1.5 h-1.5 bg-orange-600 rounded-full"></div>
									<span className="text-gray-700">Secure payments & great offers</span>
								</div>
							</div>

							{/* Button */}
							<button
								className={`w-full py-4 px-6 rounded-xl font-semibold transition-all duration-300 flex items-center justify-center gap-2 group/btn ${
									hoveredRole === 'customer'
										? 'bg-gradient-to-r from-orange-600 to-orange-700 text-white shadow-lg hover:shadow-xl'
										: 'bg-orange-50 text-orange-600 hover:bg-orange-100'
								}`}
							>
								<span>Continue as Customer</span>
								<ArrowRight size={20} className={`transition-transform duration-300 ${hoveredRole === 'customer' ? 'translate-x-1' : ''}`} />
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
						<div className="absolute inset-0 bg-gradient-to-br from-orange-500 to-orange-600 rounded-3xl opacity-0 group-hover:opacity-10 transition-opacity duration-500 blur-xl"></div>
						<div className={`relative bg-white rounded-3xl p-8 md:p-12 shadow-lg hover:shadow-2xl transition-all duration-300 cursor-pointer border-2 ${
							hoveredRole === 'restaurant'
								? 'border-orange-500 scale-105'
								: 'border-gray-200 hover:border-orange-300'
						}`}>
							{/* Icon Container */}
							<div className={`inline-flex items-center justify-center w-24 h-24 rounded-2xl mb-6 transition-all duration-300 ${
								hoveredRole === 'restaurant'
									? 'bg-gradient-to-br from-orange-500 to-orange-600 shadow-lg scale-110'
									: 'bg-orange-100'
							}`}>
								<ChefHat size={48} className={hoveredRole === 'restaurant' ? 'text-white' : 'text-orange-600'} />
							</div>

							{/* Content */}
							<h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">
								Grow Your Business
							</h2>
							<p className="text-gray-600 text-lg mb-6 leading-relaxed">
								Join our restaurant network, manage orders efficiently, and reach thousands of hungry customers. Increase sales and expand your customer base.
							</p>

							{/* Features */}
							<div className="space-y-3 mb-8">
								<div className="flex items-center gap-3">
									<div className="flex-shrink-0 w-1.5 h-1.5 bg-orange-600 rounded-full"></div>
									<span className="text-gray-700">Easy order management</span>
								</div>
								<div className="flex items-center gap-3">
									<div className="flex-shrink-0 w-1.5 h-1.5 bg-orange-600 rounded-full"></div>
									<span className="text-gray-700">Real-time analytics & reports</span>
								</div>
								<div className="flex items-center gap-3">
									<div className="flex-shrink-0 w-1.5 h-1.5 bg-orange-600 rounded-full"></div>
									<span className="text-gray-700">Dedicated support team</span>
								</div>
							</div>

							{/* Button */}
							<button
								className={`w-full py-4 px-6 rounded-xl font-semibold transition-all duration-300 flex items-center justify-center gap-2 group/btn ${
									hoveredRole === 'restaurant'
										? 'bg-gradient-to-r from-orange-600 to-orange-700 text-white shadow-lg hover:shadow-xl'
										: 'bg-orange-50 text-orange-600 hover:bg-orange-100'
								}`}
							>
								<span>Continue as Restaurant</span>
								<ArrowRight size={20} className={`transition-transform duration-300 ${hoveredRole === 'restaurant' ? 'translate-x-1' : ''}`} />
							</button>
						</div>
					</div>
				</div>

				{/* Footer Section */}
				<div className="text-center">
					<p className="text-gray-600">
						Already have an account? Go to{' '}
						<button
							onClick={() => navigate('/login')}
							className="font-semibold text-orange-600 hover:text-orange-700 transition-colors"
						>
							login
						</button>
					</p>
					<p className="text-gray-600">
						Already have an owner account? Go to{' '}
						<button
							onClick={() => navigate('/restaurant-login')}
							className="font-semibold text-orange-600 hover:text-orange-700 transition-colors"
						>
							restaurant login
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
