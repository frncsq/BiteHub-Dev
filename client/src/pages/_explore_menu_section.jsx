                            {/* ====== EXPLORE MENU ====== */}
                            <section ref={browseFoodRef} className="scroll-mt-24">
                                {/* Header */}
                                <div className="mb-5">
                                    <h2 className={`text-xl font-black mb-0.5 ${isDarkMode ? 'text-white' : 'text-gray-900'} tracking-tight`}>Explore Menu</h2>
                                    <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                        {activeCategoryFilter ? `Showing ${activeCategoryFilter} items` : 'Pick a category to start browsing'}
                                    </p>
                                </div>

                                {/* Category Grid - Always visible */}
                                <div className="mb-6">
                                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
                                        {['All', 'Main', 'Drinks', 'Snack', 'Dessert', 'Budget Meal', ...categories.map(c => c.name)]
                                            .filter((v, i, a) => a.indexOf(v) === i)
                                            .map(cat => {
                                                const isActive = activeCategoryFilter === cat;
                                                const catIcons = { All: '🍽️', Main: '🍛', Drinks: '🧋', Snack: '🍟', Dessert: '🍰', 'Budget Meal': '🍱' };
                                                const icon = catIcons[cat] || '🏷️';
                                                const itemCount = cat === 'All' ? popularFoods.length : popularFoods.filter(f => (f.category || '').toLowerCase() === cat.toLowerCase()).length;
                                                return (
                                                    <button
                                                        key={cat}
                                                        onClick={() => setActiveCategoryFilter(isActive ? null : cat)}
                                                        className={`relative flex flex-col items-center gap-1.5 p-3 sm:p-4 rounded-2xl border-2 transition-all duration-300 group
                                                            ${isActive
                                                                ? 'border-orange-500 bg-gradient-to-br from-orange-500 to-orange-600 text-white shadow-lg shadow-orange-500/25 scale-[1.03]'
                                                                : isDarkMode
                                                                    ? 'border-gray-700/50 bg-gray-800/50 text-gray-300 hover:border-gray-600 hover:bg-gray-800 hover:-translate-y-0.5 hover:shadow-md'
                                                                    : 'border-gray-100 bg-white text-gray-700 hover:border-orange-200 hover:bg-orange-50/50 hover:-translate-y-0.5 hover:shadow-md'
                                                            }`}
                                                    >
                                                        <span className={`text-2xl sm:text-3xl transition-transform duration-300 ${isActive ? 'scale-110' : 'group-hover:scale-110'}`}>{icon}</span>
                                                        <span className={`text-[11px] sm:text-xs font-bold text-center leading-tight ${isActive ? 'text-white' : ''}`}>{cat}</span>
                                                        <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded-full ${isActive
                                                            ? 'bg-white/20 text-white'
                                                            : isDarkMode ? 'bg-gray-700 text-gray-400' : 'bg-gray-100 text-gray-500'
                                                        }`}>{itemCount} items</span>
                                                    </button>
                                                );
                                            })}
                                    </div>
                                </div>

                                {/* Items Area - Only shows after category selection */}
                                {activeCategoryFilter !== null && (
                                    <div className="animate-fade-in">
                                        {/* Search & Filter Bar */}
                                        <div className={`flex flex-wrap gap-3 items-center mb-5 p-3 rounded-2xl border ${isDarkMode ? 'bg-gray-800/50 border-gray-700' : 'bg-white border-gray-100 shadow-sm'}`}>
                                            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-sm ${isDarkMode ? 'bg-gray-700 border-gray-600 text-gray-200' : 'bg-gray-50 border-gray-200 text-gray-700'}`}>
                                                <span className="font-medium text-xs">Price</span>
                                                <input type="range" min="5" max="2000" value={priceFilter} onChange={(e) => setPriceFilter(Number(e.target.value))} className="w-20 accent-orange-500" />
                                                <span className="text-orange-600 font-bold text-xs">{priceFilter === 2000 ? 'Any' : `≤₱${priceFilter}`}</span>
                                            </div>
                                            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-sm ${isDarkMode ? 'bg-gray-700 border-gray-600 text-gray-200' : 'bg-gray-50 border-gray-200 text-gray-700'}`}>
                                                <span className="text-xs font-medium">Rating</span>
                                                <div className="flex gap-0.5">
                                                    {[1, 2, 3, 4, 5].map(n => (
                                                        <button key={n} onClick={() => setMinRating(minRating === n ? 0 : n)}>
                                                            <Star size={14} className={n <= minRating ? 'text-yellow-400 fill-yellow-400' : isDarkMode ? 'text-gray-600 fill-gray-600' : 'text-gray-300 fill-gray-300'} />
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                            <span className={`ml-auto text-xs font-bold ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                                                {filteredFoods.length} items
                                            </span>
                                        </div>

                                        {/* Food Grid */}
                                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-5">
                                            {filteredFoods.length === 0 ? (
                                                <div className="col-span-full flex flex-col items-center justify-center py-16 gap-3">
                                                    <div className={`w-16 h-16 rounded-full flex items-center justify-center ${isDarkMode ? 'bg-gray-800' : 'bg-gray-100'}`}>
                                                        <Utensils size={28} className={isDarkMode ? 'text-gray-600' : 'text-gray-400'} />
                                                    </div>
                                                    <p className={`font-bold text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>No items in "{activeCategoryFilter}"</p>
                                                    <p className={`text-xs max-w-xs text-center ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>Try adjusting your filters or select a different category</p>
                                                    <button onClick={() => { setPriceFilter(2000); setMinRating(0); }} className="mt-2 text-xs font-semibold text-orange-500 hover:text-orange-600 transition">Reset Filters</button>
                                                </div>
                                            ) : filteredFoods.map((food) => {
                                                const isOOS = food.current_stock !== null && food.current_stock !== undefined && food.current_stock <= 0;
                                                const isLowStock = !isOOS && food.daily_stock > 0 && food.current_stock !== null && (food.current_stock / food.daily_stock) <= 0.25;
                                                const stockLabel = food.daily_stock !== null && food.daily_stock >= 0
                                                    ? isOOS ? 'Out of Stock' : isLowStock ? `Low: ${food.current_stock} left` : `${food.current_stock} left`
                                                    : null;
                                                return (
                                                    <div
                                                        key={food.id}
                                                        onMouseEnter={() => setHoveredFoodId(food.id)}
                                                        onMouseLeave={() => setHoveredFoodId(null)}
                                                        className={`relative border rounded-2xl overflow-hidden transition-all duration-300 cursor-pointer group flex flex-col h-full ${isOOS
                                                            ? isDarkMode ? 'bg-gray-800/30 border-gray-800 opacity-75' : 'bg-gray-50 border-gray-100 opacity-75'
                                                            : isDarkMode
                                                                ? 'bg-gray-800/50 border-gray-800 hover:border-gray-700 hover:shadow-xl hover:shadow-black/20 hover:-translate-y-1'
                                                                : 'bg-white border-gray-100/50 shadow-sm hover:shadow-xl hover:shadow-gray-200/40 hover:border-gray-200 hover:-translate-y-1'
                                                            }`}
                                                    >
                                                        <div className="relative h-32 overflow-hidden bg-gray-50">
                                                            <img src={food.image} alt={food.name} className={`w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ${isOOS ? 'grayscale' : ''}`} onError={e => e.target.style.display = 'none'} />
                                                            <button onClick={(e) => { e.stopPropagation(); toggleFavorite(food.id); }} className="absolute top-2 right-2 p-1.5 rounded-full bg-white shadow-md hover:scale-110 transition-transform z-10">
                                                                <Heart size={14} className={favorites.has(food.id) ? 'text-red-500 fill-red-500' : 'text-gray-950'} />
                                                            </button>
                                                            {food.discount > 0 && (<div className="absolute top-2 left-2 bg-red-600 text-white text-[10px] font-black px-2 py-0.5 rounded-full shadow-sm">-{food.discount}%</div>)}
                                                            {stockLabel && (
                                                                <div className={`absolute bottom-1.5 left-1.5 text-[9px] font-bold px-1.5 py-0.5 rounded-full backdrop-blur-sm ${isOOS ? 'bg-red-600/90 text-white' : isLowStock ? 'bg-orange-500/90 text-white' : 'bg-emerald-600/90 text-white'}`}>{stockLabel}</div>
                                                            )}
                                                            {isOOS && (<div className="absolute inset-0 flex items-center justify-center bg-gray-900/30 backdrop-blur-[1px]"><span className="bg-red-600 text-white text-[10px] font-black px-3 py-1 rounded-full shadow-md">OUT OF STOCK</span></div>)}
                                                        </div>
                                                        <div className="p-2.5" onClick={() => { if (!isOOS) { setSelectedFood(food); setSelectedModalSize('Medium'); setShowFoodModal(true); } }}>
                                                            <div className="flex items-start justify-between gap-2 mb-1">
                                                                <h3 className={`font-bold text-[13px] leading-tight truncate flex-1 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{food.name}</h3>
                                                                <div className={`flex items-center gap-1 flex-shrink-0 px-1.5 py-0.5 rounded-md border ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-100'}`}>
                                                                    <Star size={10} className="text-yellow-400 fill-yellow-400" />
                                                                    <span className={`text-[10px] font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{food.rating > 0 ? food.rating : 'New'}</span>
                                                                    {food.reviews > 0 && (<span className={`text-[9px] font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>({food.reviews})</span>)}
                                                                </div>
                                                            </div>
                                                            <p className={`text-[11px] font-medium mb-3 truncate ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>{food.description || food.restaurant}</p>
                                                            <div className="flex items-end justify-between mb-1 mt-auto">
                                                                <div className="flex flex-col">
                                                                    {food.category === 'Drinks' ? (
                                                                        <>
                                                                            <span className={`text-[9.5px] font-semibold px-2 py-0.5 rounded-md mb-1 w-fit ${isDarkMode ? 'bg-blue-500/10 text-blue-400' : 'bg-blue-50/80 text-blue-600'}`}>🧋 View Sizes</span>
                                                                            <span className={`text-sm font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>₱{Number(food.half_price || food.price || 0).toFixed(2)}–₱{Number(food.large_price || food.price || 0).toFixed(2)}</span>
                                                                        </>
                                                                    ) : food.category === 'Budget Meal' ? (
                                                                        <>
                                                                            <span className={`text-[9.5px] font-semibold px-2 py-0.5 rounded-md mb-1 w-fit ${isDarkMode ? 'bg-purple-500/10 text-purple-400' : 'bg-purple-50/80 text-purple-600'}`}>🍱 Combo</span>
                                                                            <span className={`text-sm font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>From ₱{Number(food.price || 0).toFixed(2)}</span>
                                                                        </>
                                                                    ) : (
                                                                        <span className={`text-sm font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>₱{((food.price || 0) * (1 - (food.discount || 0) / 100)).toFixed(2)}</span>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <div className="px-3 pb-3 mt-auto flex gap-2">
                                                            <button onClick={(e) => { e.stopPropagation(); addToCart(food, null, false); }} disabled={isOOS}
                                                                className={`w-10 h-10 shrink-0 flex items-center justify-center rounded-xl transition-all ${isOOS ? 'bg-gray-100 text-gray-400 cursor-not-allowed border border-transparent' : isDarkMode ? 'bg-orange-500/10 border border-orange-500/20 text-orange-400 hover:bg-orange-500/20' : 'bg-orange-50 border border-orange-200 text-orange-600 hover:bg-orange-100'}`}>
                                                                <ShoppingCart size={16} strokeWidth={2.5} />
                                                            </button>
                                                            <button onClick={(e) => { e.stopPropagation(); addToCart(food, null, true); }} disabled={isOOS}
                                                                className={`flex-1 flex items-center justify-center text-[11px] font-semibold py-2 rounded-xl transition-all shadow-sm ${isOOS ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : 'bg-gray-900 text-white hover:bg-black hover:shadow-md dark:bg-orange-500 dark:text-white dark:hover:bg-orange-600'}`}>
                                                                {food.category === 'Budget Meal' ? 'Order' : 'Checkout'}
                                                            </button>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}
                            </section>
