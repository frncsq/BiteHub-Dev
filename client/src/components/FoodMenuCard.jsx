import { Heart, Plus, Star } from 'lucide-react'

function formatFoodPrice(food) {
	const priceClass = 'text-[15px] font-bold leading-none'

	if (food.category === 'Drinks') {
		return (
			<span className={priceClass}>
				₱{Number(food.half_price || food.price || 0).toFixed(0)}–{Number(food.large_price || food.price || 0).toFixed(0)}
			</span>
		)
	}
	if (food.category === 'Budget Meal') {
		return <span className={priceClass}>From ₱{Number(food.price || 0).toFixed(0)}</span>
	}
	const discounted = (food.price || 0) * (1 - (food.discount || 0) / 100)
	return <span className={priceClass}>₱{discounted.toFixed(0)}</span>
}

export default function FoodMenuCard({
	food,
	isDarkMode,
	isFavorite,
	onToggleFavorite,
	onOpen,
	onAddToCart,
}) {
	const isOOS =
		food.current_stock !== null && food.current_stock !== undefined && food.current_stock <= 0
	const isLowStock =
		!isOOS &&
		food.daily_stock > 0 &&
		food.current_stock !== null &&
		food.current_stock / food.daily_stock <= 0.25

	const stockLabel =
		food.daily_stock !== null && food.daily_stock >= 0
			? isOOS
				? 'Out'
				: isLowStock
					? `${food.current_stock} left`
					: null
			: null

	const cardBg = isDarkMode ? 'bg-[#1A1A1A]' : 'bg-white'
	const border = isDarkMode ? 'border-[#2A2A2A]' : 'border-[#E5E7EB]'
	const textMuted = isDarkMode ? 'text-[#A0A0A0]' : 'text-[#6B7280]'
	const textPrimary = isDarkMode ? 'text-[#F5F5F5]' : 'text-[#171717]'

	return (
		<article
			className={`group relative flex h-full flex-col overflow-hidden rounded-xl border shadow-sm transition-all duration-200 ${cardBg} ${border} ${
				isOOS ? 'opacity-75' : 'hover:-translate-y-0.5 hover:shadow-md'
			}`}
		>
			<div
				role="button"
				tabIndex={isOOS ? -1 : 0}
				aria-disabled={isOOS}
				onClick={() => !isOOS && onOpen?.(food)}
				onKeyDown={(e) => {
					if (!isOOS && (e.key === 'Enter' || e.key === ' ')) {
						e.preventDefault()
						onOpen?.(food)
					}
				}}
				className={`flex flex-1 flex-col text-left ${isOOS ? 'cursor-not-allowed' : 'cursor-pointer'} focus:outline-none`}
			>
				<div
					className={`relative aspect-[4/3] w-full overflow-hidden ${
						isDarkMode ? 'bg-[#111111]' : 'bg-[#F3F4F6]'
					}`}
				>
					<img
						src={food.image}
						alt={food.name}
						loading="lazy"
						className={`h-full w-full object-cover transition-transform duration-500 ${
							isOOS ? 'grayscale' : 'group-hover:scale-[1.04]'
						}`}
						onError={(e) => {
							e.currentTarget.style.display = 'none'
						}}
					/>
					<button
						type="button"
						onClick={(e) => {
							e.stopPropagation()
							onToggleFavorite?.(food.id)
						}}
						className={`absolute right-1.5 top-1.5 flex h-7 w-7 items-center justify-center rounded-full border backdrop-blur-sm transition-transform active:scale-90 ${
							isDarkMode ? 'border-[#2A2A2A] bg-black/40' : 'border-white/80 bg-white/90'
						}`}
						aria-label={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
					>
						<Heart size={13} className={isFavorite ? 'fill-red-500 text-red-500' : textMuted} />
					</button>
					{food.discount > 0 && (
						<span className="absolute left-1.5 top-1.5 rounded-md bg-red-600 px-1.5 py-0.5 text-[9px] font-bold text-white">
							-{food.discount}%
						</span>
					)}
					{stockLabel && (
						<span
							className={`absolute bottom-1.5 left-1.5 rounded-md px-1.5 py-0.5 text-[9px] font-bold text-white ${
								isOOS ? 'bg-red-600' : 'bg-[#EA580C]'
							}`}
						>
							{stockLabel}
						</span>
					)}
					{isOOS && (
						<div className="absolute inset-0 flex items-center justify-center bg-black/45">
							<span className="rounded-full bg-red-600 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-white">
								Sold out
							</span>
						</div>
					)}
				</div>

				<div className="flex flex-1 flex-col p-2">
					<h3 className={`line-clamp-2 min-h-[2.25rem] text-[13px] font-semibold leading-snug ${textPrimary}`}>
						{food.name}
					</h3>
					<div className={`mt-0.5 flex items-center gap-1 text-[11px] ${textMuted}`}>
						<Star size={10} className="shrink-0 fill-amber-400 text-amber-400" />
						<span className={`font-semibold ${isDarkMode ? 'text-[#E5E5E5]' : 'text-[#374151]'}`}>
							{food.rating > 0 ? food.rating : 'New'}
						</span>
						<span className="truncate">
							{food.restaurant ? `· ${food.restaurant}` : food.description ? `· ${food.description}` : ''}
						</span>
					</div>

					<div className="mt-auto flex items-center justify-between gap-1 pt-1.5">
						<span className={textPrimary}>{formatFoodPrice(food)}</span>
						<button
							type="button"
							disabled={isOOS}
							onClick={(e) => {
								e.stopPropagation()
								onAddToCart?.(food)
							}}
							className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg transition active:scale-90 ${
								isOOS
									? 'cursor-not-allowed bg-[#F3F4F6] text-[#9CA3AF]'
									: 'bg-[#EA580C] text-white hover:bg-[#DC2626]'
							}`}
							aria-label="Add to cart"
						>
							<Plus size={15} strokeWidth={2.5} />
						</button>
					</div>
				</div>
			</div>
		</article>
	)
}
