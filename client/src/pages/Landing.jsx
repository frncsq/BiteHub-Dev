import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Menu, X, Search, Star, ChevronRight, ShoppingCart, Check, Zap,
  Utensils, Clock, Flame, ArrowRight, Store, Package, ClipboardList,
  MapPin, Salad, RefreshCw, CheckCircle2, Truck, User, LogIn,
  BarChart3, TrendingUp,
} from "lucide-react";
import kaingoLogo from "../assets/kaingo-logo.svg";
import { createApiClient } from "../services/apiClient";

const fallbackImg = "data:image/svg+xml;charset=UTF-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='300'%3E%3Crect width='100%25' height='100%25' fill='%23fff3e6'/%3E%3Ctext x='50%25' y='50%25' font-size='60' fill='%23f97316' text-anchor='middle' dominant-baseline='middle'%3E%F0%9F%8D%94%3C/text%3E%3C/svg%3E";

function Reveal({ children, className = "", delay = 0 }) {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            el.classList.add("bh-in-view");
            observer.unobserve(el);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);
  return (
    <div ref={ref} className={`bh-reveal ${className}`} style={{ transitionDelay: `${delay}ms` }}>
      {children}
    </div>
  );
}

function useScrollTop() {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  return scrolled;
}

/* Smart fallback for broken/missing images */
function FoodImage({ src, alt, className, wrapperClassName }) {
  const [imgSrc, setImgSrc] = useState(src);
  return (
    <div className={`relative overflow-hidden ${wrapperClassName || ""}`}>
      <img
        src={imgSrc || fallbackImg}
        alt={alt || ""}
        loading="lazy"
        onError={() => setImgSrc(fallbackImg)}
        className={`h-full w-full object-cover ${className || ""}`}
      />
    </div>
  );
}

function Landing() {
  const navigate = useNavigate();
  const scrolled = useScrollTop();
  const [menuOpen, setMenuOpen] = useState(false);

  // Auth + cart
  const [isLoggedIn, setIsLoggedIn] = useState(() => {
    const token = localStorage.getItem("authToken");
    return !!(token && token !== "null" && token !== "undefined");
  });
  const [cartCount, setCartCount] = useState(0);

  // Data
  const [categories, setCategories] = useState([]);
  const [restaurants, setRestaurants] = useState([]);
  const [foods, setFoods] = useState([]);

  const [loadingRestaurants, setLoadingRestaurants] = useState(true);
  const [loadingFoods, setLoadingFoods] = useState(true);
  const [restaurantError, setRestaurantError] = useState("");
  const [foodError, setFoodError] = useState("");

  // Toast
  const [toast, setToast] = useState(null);
  const toastTimer = useRef(null);

  const showToast = (message, type = "success") => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast({ message, type });
    toastTimer.current = setTimeout(() => setToast(null), 2600);
  };

  // Determine auth state (lazy init above)

  const go = (path) => {
    setMenuOpen(false);
    navigate(path);
  };

  const goMarketplace = (extra) => {
    setMenuOpen(false);
    navigate("/home", { state: { activeTab: "home", ...extra } });
  };

  // Load landing data (minimal requests)
  const loadAll = useCallback(async () => {
    const api = createApiClient();
    // Food + restaurants
    const [foodRes, restRes] = await Promise.allSettled([
      api.get("/food/popular"),
      api.get("/restaurants"),
    ]);
    if (foodRes.status === "fulfilled") {
      setFoods(Array.isArray(foodRes.value?.data?.foods) ? foodRes.value.data.foods : []);
      setFoodError("");
    } else {
      setFoodError("Unable to load popular dishes.");
    }
    if (restRes.status === "fulfilled") {
      setRestaurants(Array.isArray(restRes.value?.data?.restaurants) ? restRes.value.data.restaurants : []);
      setRestaurantError("");
    } else {
      setRestaurantError("Unable to load restaurants.");
    }
    setLoadingFoods(false);
    setLoadingRestaurants(false);

    // Categories
    try {
      const catRes = await api.get("/categories");
      const cats = Array.isArray(catRes?.data?.categories) ? catRes.data.categories : [];
      setCategories(cats);
    } catch {
      setCategories([]);
    }

    // Cart count (only if authenticated)
    const token = localStorage.getItem("authToken");
    if (token && token !== "null" && token !== "undefined") {
      try {
        const cartRes = await api.get("/cart");
        const items = Array.isArray(cartRes?.data?.cart) ? cartRes.data.cart : [];
        const count = items.reduce((s, i) => s + (Number(i.quantity) || 1), 0);
        setCartCount(count);
      } catch {
        setCartCount(0);
      }
    }
  }, []);

  useEffect(() => {
    const id = setTimeout(loadAll, 0);
    return () => clearTimeout(id);
  }, [loadAll]);

  const formatPrice = (price) => {
    const num = Number(price);
    if (Number.isNaN(num)) return "—";
    return "₱" + num.toLocaleString("en-PH", { maximumFractionDigits: 0 });
  };

  // Add to cart - reuses existing backend endpoint
  const addToCart = async (food) => {
    if (!isLoggedIn) {
      showToast("Please sign in to add items to your cart", "error");
      setTimeout(() => go("/login"), 1100);
      return;
    }
    try {
      const api = createApiClient();
      await api.post("/cart/add", { foodId: food.id, quantity: 1 });
      setCartCount((c) => c + 1);
      showToast(`Added to cart`);
    } catch (err) {
      if (err?.response?.status === 401) {
        setIsLoggedIn(false);
        showToast("Session expired. Please sign in.", "error");
        setTimeout(() => go("/login"), 1100);
      } else {
        showToast("Couldn't add to cart. Please try again.", "error");
      }
    }
  };

  const categoryCard = (cat) => ({
    name: String(cat?.name || cat || "Food"),
    emoji: cat?.icon || "🍽️",
  });

  const navLinks = [
    { label: "Home", href: "#home" },
    { label: "Restaurants", href: "#restaurants" },
    { label: "Explore", href: "#explore" },
    { label: "About", href: "#about" },
  ];

  return (
    <div className="min-h-screen bg-white text-[#141414] font-sans antialiased">

      {/* TOAST */}
      {toast && (
        <div
          role="status"
          className={`fixed left-1/2 top-5 z-[100] flex -translate-x-1/2 items-center gap-2.5 rounded-xl px-4 py-3 text-sm font-semibold text-white shadow-xl animate-slide-up ${
            toast.type === "error" ? "bg-[#DC2626]" : "bg-[#EA580C]"
          }`}
        >
          {toast.type === "error" ? (
            <CheckCircle2 className="h-4 w-4 text-white" />
          ) : (
            <Check className="h-4 w-4 text-white" />
          )}
          {toast.message}
        </div>
      )}

      {/* ─── NAVBAR ─────────────────────────────────────────────────────── */}
      <header
        className={`sticky top-0 z-50 transition-all duration-300 ${
          scrolled
            ? "bg-white/95 backdrop-blur-md border-b border-[#EEEEEE] shadow-sm"
            : "bg-white border-b border-transparent"
        }`}
      >
        <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-5 sm:px-8">
          {/* Brand */}
          <button onClick={() => go("/")} className="flex shrink-0 items-center gap-2.5">
            <img src={kaingoLogo} alt="KainGo" className="h-8 w-8 object-contain" />
            <span className="text-lg font-bold tracking-tight text-[#141414]">
              Kain<span className="text-[#EA580C]">Go</span>
            </span>
          </button>

          {/* Center nav */}
          <div className="hidden items-center gap-7 lg:flex">
            {navLinks.map((l) => (
              <a
                key={l.label}
                href={l.href}
                className="text-sm font-medium text-[#6B7280] transition-colors hover:text-[#EA580C]"
              >
                {l.label}
              </a>
            ))}
          </div>

          {/* Right actions */}
          <div className="hidden items-center gap-2.5 lg:flex">
            <button
              onClick={() => goMarketplace()}
              aria-label="Search food"
              className="flex h-10 w-10 items-center justify-center rounded-full text-[#6B7280] transition-colors hover:bg-[#F5F5F5] hover:text-[#EA580C]"
            >
              <Search className="h-5 w-5" />
            </button>
            <button
              onClick={() => go(isLoggedIn ? "/cart" : "/login")}
              aria-label="Cart"
              className="relative flex h-10 w-10 items-center justify-center rounded-full text-[#6B7280] transition-colors hover:bg-[#F5F5F5] hover:text-[#EA580C]"
            >
              <ShoppingCart className="h-5 w-5" />
              {cartCount > 0 && (
                <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-[#EA580C] px-1 text-[11px] font-bold text-white">
                  {cartCount}
                </span>
              )}
            </button>

            {isLoggedIn ? (
              <button
                onClick={() => go("/profile")}
                className="flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-[#141414] transition-colors hover:bg-[#F5F5F5]"
              >
                <User className="h-4 w-4" /> Account
              </button>
            ) : (
              <button
                onClick={() => go("/login")}
                className="flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-[#141414] transition-colors hover:bg-[#F5F5F5]"
              >
                <LogIn className="h-4 w-4" /> Sign In
              </button>
            )}

            <button
              onClick={() => go(isLoggedIn ? "/home" : "/register")}
              className="rounded-xl bg-[#EA580C] px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-[#D6530B] hover:shadow-md active:scale-[0.97]"
            >
              Order Now
            </button>
          </div>

          {/* Mobile toggle */}
          <div className="flex items-center gap-1 lg:hidden">
            <button
              onClick={() => go(isLoggedIn ? "/cart" : "/login")}
              aria-label="Cart"
              className="relative flex h-10 w-10 items-center justify-center rounded-full text-[#6B7280] hover:bg-[#F5F5F5]"
            >
              <ShoppingCart className="h-5 w-5" />
              {cartCount > 0 && (
                <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-[#EA580C] px-1 text-[11px] font-bold text-white">
                  {cartCount}
                </span>
              )}
            </button>
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="flex h-10 w-10 items-center justify-center rounded-full text-[#141414] hover:bg-[#F5F5F5]"
              aria-label="Toggle menu"
            >
              {menuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </nav>

        {/* Mobile menu */}
        {menuOpen && (
          <div className="border-t border-[#EEEEEE] bg-white lg:hidden animate-slide-up">
            <div className="mx-auto flex max-w-7xl flex-col gap-1 px-5 py-4">
              {navLinks.map((l) => (
                <a
                  key={l.label}
                  href={l.href}
                  onClick={() => setMenuOpen(false)}
                  className="rounded-lg px-3 py-3 text-sm font-medium text-[#6B7280] transition-colors hover:bg-[#F9F9F9] hover:text-[#EA580C]"
                >
                  {l.label}
                </a>
              ))}
              <div className="mt-3 flex flex-col gap-2 border-t border-[#EEEEEE] pt-4">
                <button
                  onClick={() => (isLoggedIn ? go("/profile") : go("/login"))}
                  className="flex items-center justify-center gap-2 rounded-xl border border-[#E5E5E5] px-4 py-3 text-sm font-semibold text-[#141414]"
                >
                  {isLoggedIn ? <><User className="h-4 w-4" /> Account</> : <><LogIn className="h-4 w-4" /> Sign In</>}
                </button>
                <button
                  onClick={() => (isLoggedIn ? go("/home") : go("/register"))}
                  className="rounded-xl bg-[#EA580C] px-4 py-3 text-sm font-semibold text-white"
                >
                  Order Now
                </button>
              </div>
            </div>
          </div>
        )}
      </header>

      {/* ─── HERO ───────────────────────────────────────────────────────── */}
      <section id="home" className="relative overflow-hidden bg-gradient-to-b from-orange-50/60 via-white to-white">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -left-32 -top-32 h-80 w-80 rounded-full bg-orange-100/40 blur-3xl" />
          <div className="absolute -right-24 top-40 h-72 w-72 rounded-full bg-amber-100/40 blur-3xl" />
        </div>

        <div className="relative mx-auto grid max-w-7xl items-center gap-12 px-5 pt-14 pb-16 sm:px-8 lg:grid-cols-2 lg:pt-20 lg:pb-24">
          {/* Left */}
          <div>
            <Reveal>
              <span className="inline-flex items-center gap-2 rounded-full border border-orange-200 bg-white px-4 py-1.5 text-xs font-semibold tracking-wide text-[#EA580C] shadow-sm">
                <Flame className="h-3.5 w-3.5" /> SARAP NA, ORDER NA!
              </span>
            </Reveal>
            <Reveal delay={80}>
              <h1 className="mt-6 text-[38px] font-extrabold leading-[1.08] tracking-tight text-[#141414] sm:text-5xl lg:text-[54px]">
                Your cravings,
                <br />
                <span className="text-[#EA580C]">one order</span> away.
              </h1>
            </Reveal>
            <Reveal delay={160}>
              <p className="mt-6 max-w-lg text-lg leading-relaxed text-[#6B7280]">
                Discover delicious meals from your favorite restaurants and order
                everything you love in just a few clicks.
              </p>
            </Reveal>
            <Reveal delay={240}>
              <div className="mt-8 flex flex-wrap items-center gap-4">
                <button
                  onClick={() => go(isLoggedIn ? "/home" : "/register")}
                  className="group inline-flex items-center rounded-xl bg-[#EA580C] px-7 py-3.5 text-base font-semibold text-white shadow-lg shadow-orange-200 transition-all hover:bg-[#D6530B] hover:shadow-xl active:scale-[0.97]"
                >
                  Order Now
                  <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
                </button>
                <button
                  onClick={() => goMarketplace()}
                  className="inline-flex items-center rounded-xl border border-[#E5E5E5] bg-white px-7 py-3.5 text-base font-semibold text-[#141414] transition-all hover:border-[#EA580C] hover:text-[#EA580C] active:scale-[0.97]"
                >
                  Explore Food
                </button>
              </div>
            </Reveal>
            <Reveal delay={320}>
              <div className="mt-10 flex flex-wrap items-center gap-x-7 gap-y-3">
                <div className="flex items-center gap-2">
                  <span className="flex items-center gap-0.5">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star key={i} className="h-4 w-4 fill-[#F5A623] text-[#F5A623]" />
                    ))}
                  </span>
                  <span className="text-sm font-semibold text-[#141414]">4.8</span>
                  <span className="text-sm text-[#6B7280]">rated</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-[#6B7280]">
                  <Truck className="h-4 w-4 text-[#EA580C]" />
                  Fast delivery
                </div>
                <div className="flex items-center gap-2 text-sm text-[#6B7280]">
                  <Store className="h-4 w-4 text-[#EA580C]" />
                  Top restaurants
                </div>
              </div>
            </Reveal>
          </div>

          {/* Right visual */}
          <Reveal delay={120} className="relative">
            <div className="relative mx-auto w-full max-w-[440px]">
              {/* Collage of real food images */}
              <div className="grid grid-cols-2 gap-3">
                <div className="overflow-hidden rounded-3xl shadow-xl shadow-orange-100/60">
                  <FoodImage
                    src="https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=600&q=70"
                    alt="Burger"
                    className="aspect-square transition-transform duration-500 hover:scale-105"
                  />
                </div>
                <div className="mt-8 overflow-hidden rounded-3xl shadow-xl shadow-orange-100/60">
                  <FoodImage
                    src="https://images.unsplash.com/photo-1604382354936-07c5d9983bd3?auto=format&fit=crop&w=600&q=70"
                    alt="Pizza"
                    className="aspect-square transition-transform duration-500 hover:scale-105"
                  />
                </div>
                <div className="-mt-4 overflow-hidden rounded-3xl shadow-xl shadow-orange-100/60">
                  <FoodImage
                    src="https://images.unsplash.com/photo-1569718212165-3a8278d5f624?auto=format&fit=crop&w=600&q=70"
                    alt="Ramen"
                    className="aspect-square transition-transform duration-500 hover:scale-105"
                  />
                </div>
                <div className="overflow-hidden rounded-3xl shadow-xl shadow-orange-100/60">
                  <FoodImage
                    src="https://images.unsplash.com/photo-1551024506-0bccd828d307?auto=format&fit=crop&w=600&q=70"
                    alt="Dessert"
                    className="aspect-square transition-transform duration-500 hover:scale-105"
                  />
                </div>
              </div>

              {/* Floating cards */}
              <div className="bh-float absolute -left-6 top-10 flex items-center gap-2.5 rounded-2xl border border-[#EEEEEE] bg-white px-4 py-3 shadow-lg sm:-left-8">
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-amber-100">
                  <Star className="h-4 w-4 fill-[#F5A623] text-[#F5A623]" />
                </span>
                <div>
                  <p className="text-sm font-bold text-[#141414]">4.9 rating</p>
                  <p className="text-[11px] text-[#6B7280]">from real users</p>
                </div>
              </div>

              <div className="bh-float-slow absolute -right-4 bottom-16 flex items-center gap-2.5 rounded-2xl border border-[#EEEEEE] bg-white px-4 py-3 shadow-lg sm:-right-8">
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-orange-100">
                  <Zap className="h-4 w-4 text-[#EA580C]" />
                </span>
                <div>
                  <p className="text-sm font-bold text-[#141414]">Fast delivery</p>
                  <p className="text-[11px] text-[#6B7280]">In under 30 min</p>
                </div>
              </div>

              <div className="bh-float-alt absolute -bottom-4 left-6 flex items-center gap-2.5 rounded-2xl border border-[#EEEEEE] bg-white px-4 py-3 shadow-lg">
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-green-100">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                </span>
                <div>
                  <p className="text-sm font-bold text-[#141414]">Order confirmed</p>
                  <p className="text-[11px] text-[#6B7280]">Being prepared</p>
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ─── CATEGORIES ─────────────────────────────────────────────────── */}
      <section className="py-14 lg:py-20">
        <div className="mx-auto max-w-7xl px-5 sm:px-8">
          <Reveal className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className="text-2xl font-extrabold tracking-tight text-[#141414] sm:text-3xl">
                What's on your mind?
              </h2>
              <p className="mt-1.5 text-[#6B7280]">Pick a category to start exploring</p>
            </div>
            <button
              onClick={() => goMarketplace()}
              className="hidden items-center gap-1 text-sm font-semibold text-[#EA580C] hover:underline sm:flex"
            >
              View all <ChevronRight className="h-4 w-4" />
            </button>
          </Reveal>

          <div className="mt-7 flex gap-3 overflow-x-auto pb-2 lg:grid lg:grid-cols-8 lg:overflow-visible">
            {categories.length > 0 ? (
              categories.slice(0, 8).map((cat, i) => {
                const c = categoryCard(cat);
                return (
                  <Reveal key={c.name + i} delay={(i % 8) * 40} className="shrink-0 w-[104px] lg:w-auto">
                    <button
                      onClick={() => goMarketplace()}
                      className="group flex w-full flex-col items-center gap-2.5 rounded-2xl border border-[#EEEEEE] bg-white px-2 py-4 transition-all hover:-translate-y-0.5 hover:border-[#EA580C]/40 hover:shadow-lg hover:shadow-orange-50"
                    >
                      <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#FBF1E7] text-2xl transition-transform group-hover:scale-110">
                        {c.emoji}
                      </span>
                      <span className="text-xs font-semibold text-[#141414] group-hover:text-[#EA580C]">
                        {c.name}
                      </span>
                    </button>
                  </Reveal>
                );
              })
            ) : (
              Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="shrink-0 w-[104px] lg:w-auto">
                  <div className="flex flex-col items-center gap-2.5 rounded-2xl border border-[#EEEEEE] bg-white px-2 py-4">
                    <div className="h-12 w-12 rounded-2xl bg-[#F3F3F3] animate-pulse" />
                    <div className="h-3 w-14 rounded bg-[#F3F3F3] animate-pulse" />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </section>

      {/* ─── FEATURED RESTAURANTS ───────────────────────────────────────── */}
      <section id="restaurants" className="py-14 lg:py-20">
        <div className="mx-auto max-w-7xl px-5 sm:px-8">
          <Reveal className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className="text-2xl font-extrabold tracking-tight text-[#141414] sm:text-3xl">
                Explore popular restaurants
              </h2>
              <p className="mt-1.5 text-[#6B7280]">Hungry? We've got you covered</p>
            </div>
          </Reveal>

          {loadingRestaurants && (
            <div className="mt-7 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="overflow-hidden rounded-2xl border border-[#EEEEEE] bg-white">
                  <div className="h-36 bg-[#F3F3F3] animate-pulse" />
                  <div className="space-y-2 p-4">
                    <div className="h-4 w-3/4 rounded bg-[#F3F3F3] animate-pulse" />
                    <div className="h-3 w-1/2 rounded bg-[#F3F3F3] animate-pulse" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {!loadingRestaurants && restaurantError && (
            <div className="mt-7 rounded-2xl border border-orange-100 bg-orange-50 p-8 text-center">
              <p className="text-[#9A3412]">{restaurantError}</p>
              <button
                onClick={loadAll}
                className="mt-3 inline-flex items-center rounded-xl bg-[#EA580C] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#D6530B]"
              >
                <RefreshCw className="mr-2 h-4 w-4" /> Try Again
              </button>
            </div>
          )}

          {!loadingRestaurants && !restaurantError && restaurants.length === 0 && (
            <div className="mt-7 rounded-2xl border border-[#EEEEEE] bg-white p-10 text-center">
              <Store className="mx-auto h-10 w-10 text-[#B0B0B0]" />
              <p className="mt-3 text-[#6B7280]">No restaurants available right now.</p>
            </div>
          )}

          {!loadingRestaurants && !restaurantError && restaurants.length > 0 && (
            <div className="mt-7 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {restaurants.slice(0, 8).map((r, i) => (
                <Reveal key={r.id} delay={(i % 4) * 70}>
                  <button
                    onClick={() => navigate(`/restaurant/${r.id}`, { state: { restaurant: r } })}
                    className="group w-full overflow-hidden rounded-2xl border border-[#EEEEEE] bg-white text-left transition-all hover:-translate-y-1 hover:border-[#EA580C]/30 hover:shadow-xl hover:shadow-orange-50"
                  >
                    <FoodImage
                      src={r.image}
                      alt={r.name}
                      wrapperClassName="h-36 w-full"
                      className="transition-transform duration-500 group-hover:scale-105"
                    />
                    <div className="p-4">
                      <h3 className="truncate text-base font-bold text-[#141414] group-hover:text-[#EA580C]">
                        {r.name}
                      </h3>
                      <div className="mt-1.5 flex items-center gap-2 text-[13px] text-[#6B7280]">
                        <span className="flex items-center gap-1 font-semibold text-[#141414]">
                          <Star className="h-3.5 w-3.5 fill-[#F5A623] text-[#F5A623]" />
                          {Number(r.rating) > 0 ? Number(r.rating).toFixed(1) : "New"}
                        </span>
                        <span aria-hidden="true">·</span>
                        <span className="truncate">{r.type || r.cuisines?.[0] || "Restaurant"}</span>
                      </div>
                      <div className="mt-2 flex items-center gap-1.5 text-[13px] text-[#6B7280]">
                        <Truck className="h-3.5 w-3.5 text-[#EA580C]" />
                        {r.deliveryTime || "15-30 min"}
                      </div>
                    </div>
                  </button>
                </Reveal>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ─── POPULAR FOOD ───────────────────────────────────────────────── */}
      <section id="explore" className="bg-[#FAFAFA] py-14 lg:py-20">
        <div className="mx-auto max-w-7xl px-5 sm:px-8">
          <Reveal className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className="text-2xl font-extrabold tracking-tight text-[#141414] sm:text-3xl">
                Popular right now
              </h2>
              <p className="mt-1.5 text-[#6B7280]">Loved by our customers</p>
            </div>
            <button
              onClick={() => goMarketplace()}
              className="hidden items-center gap-1 text-sm font-semibold text-[#EA580C] hover:underline sm:flex"
            >
              View all <ChevronRight className="h-4 w-4" />
            </button>
          </Reveal>

          {loadingFoods && (
            <div className="mt-7 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
              {Array.from({ length: 10 }).map((_, i) => (
                <div key={i} className="overflow-hidden rounded-2xl border border-[#EEEEEE] bg-white">
                  <div className="h-32 bg-[#F3F3F3] animate-pulse" />
                  <div className="space-y-2 p-3.5">
                    <div className="h-3.5 w-2/3 rounded bg-[#F3F3F3] animate-pulse" />
                    <div className="h-3 w-full rounded bg-[#F3F3F3] animate-pulse" />
                    <div className="h-3 w-1/3 rounded bg-[#F3F3F3] animate-pulse" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {!loadingFoods && foodError && (
            <div className="mt-7 rounded-2xl border border-orange-100 bg-orange-50 p-8 text-center">
              <p className="text-[#9A3412]">{foodError}</p>
              <button
                onClick={loadAll}
                className="mt-3 inline-flex items-center rounded-xl bg-[#EA580C] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#D6530B]"
              >
                <RefreshCw className="mr-2 h-4 w-4" /> Try Again
              </button>
            </div>
          )}

          {!loadingFoods && !foodError && foods.length === 0 && (
            <div className="mt-7 rounded-2xl border border-[#EEEEEE] bg-white p-10 text-center">
              <Utensils className="mx-auto h-10 w-10 text-[#B0B0B0]" />
              <p className="mt-3 text-[#6B7280]">No popular dishes available right now.</p>
            </div>
          )}

          {!loadingFoods && !foodError && foods.length > 0 && (
            <div className="mt-7 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
              {foods.slice(0, 10).map((food, i) => {
                const isOOS = food.current_stock != null && Number(food.current_stock) <= 0;
                return (
                  <Reveal key={food.id} delay={(i % 5) * 60}>
                    <div className="group flex h-full flex-col overflow-hidden rounded-2xl border border-[#EEEEEE] bg-white transition-all hover:-translate-y-0.5 hover:border-[#EA580C]/30 hover:shadow-lg hover:shadow-orange-50">
                      <FoodImage
                        src={food.image}
                        alt={food.name}
                        wrapperClassName="h-28 w-full"
                        className="transition-transform duration-500 group-hover:scale-105"
                      />
                      <div className="flex flex-1 flex-col p-3">
                        <div className="flex items-start justify-between gap-2">
                          <h3 className="line-clamp-1 text-sm font-bold text-[#141414]">{food.name}</h3>
                          {Number(food.rating) > 0 && (
                            <span className="flex shrink-0 items-center gap-0.5 text-[11px] font-semibold text-[#141414]">
                              <Star className="h-3 w-3 fill-[#F5A623] text-[#F5A623]" />
                              {Number(food.rating).toFixed(1)}
                            </span>
                          )}
                        </div>
                        <p className="mt-0.5 line-clamp-1 text-xs leading-snug text-[#6B7280]">
                          {food.description || food.restaurant}
                        </p>
                        <div className="mt-auto flex items-center justify-between gap-2 pt-2.5">
                          <span className="text-sm font-extrabold text-[#141414]">
                            {formatPrice(food.price)}
                          </span>
                          <button
                            onClick={() => addToCart(food)}
                            disabled={isOOS}
                            aria-label={isOOS ? `${food.name} sold out` : `Add ${food.name} to cart`}
                            className={`flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-all active:scale-[0.96] ${
                              isOOS
                                ? "cursor-not-allowed bg-[#F5F5F5] text-[#9CA3AF]"
                                : "bg-[#EA580C] text-white shadow-sm hover:bg-[#D6530B] hover:shadow-md"
                            }`}
                          >
                            {isOOS ? "Sold out" : <ShoppingCart className="h-3.5 w-3.5" />}
                          </button>
                        </div>
                      </div>
                    </div>
                  </Reveal>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* ─── HOW IT WORKS ───────────────────────────────────────────────── */}
      <section className="py-14 lg:py-20">
        <div className="mx-auto max-w-7xl px-5 sm:px-8">
          <Reveal className="mx-auto max-w-2xl text-center">
            <h2 className="text-2xl font-extrabold tracking-tight text-[#141414] sm:text-3xl">
              How KainGo works
            </h2>
            <p className="mt-2 text-[#6B7280]">Get food delivered in four simple steps</p>
          </Reveal>

          <div className="mt-12 grid grid-cols-2 gap-6 lg:grid-cols-4">
            {[
              { num: "01", title: "Discover", desc: "Find restaurants and dishes you love.", icon: Search },
              { num: "02", title: "Choose", desc: "Browse menus and customize your order.", icon: ClipboardList },
              { num: "03", title: "Order", desc: "Add favorites to your cart and checkout.", icon: ShoppingCart },
              { num: "04", title: "Enjoy", desc: "Sit back and enjoy your meal.", icon: Salad },
            ].map((s, i) => (
              <Reveal key={s.num} delay={i * 90}>
                <div className="text-center">
                  <div className="relative mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#FBF1E7] text-[#EA580C]">
                    <s.icon className="h-6 w-6" />
                    <span className="absolute -right-2 -top-2 rounded-lg bg-[#EA580C] px-2 py-0.5 text-[11px] font-bold text-white">
                      {s.num}
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-[#141414]">{s.title}</h3>
                  <p className="mx-auto mt-1.5 max-w-[200px] text-sm leading-relaxed text-[#6B7280]">{s.desc}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ─── WHY CHOOSE US ──────────────────────────────────────────────── */}
      <section id="about" className="bg-[#FAFAFA] py-14 lg:py-20">
        <div className="mx-auto max-w-7xl px-5 sm:px-8">
          <Reveal className="mx-auto max-w-2xl text-center">
            <h2 className="text-2xl font-extrabold tracking-tight text-[#141414] sm:text-3xl">
              Why choose KainGo
            </h2>
            <p className="mt-2 text-[#6B7280]">Fast, reliable, and made for food lovers</p>
          </Reveal>

          <div className="mt-12 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {[
              { icon: Zap, title: "Fast & Convenient Ordering", desc: "Place your order quickly with a simple, intuitive checkout." },
              { icon: Store, title: "Wide Food Selection", desc: "Browse many restaurants and cuisines all in one place." },
              { icon: MapPin, title: "Easy Order Tracking", desc: "Follow your order from confirmation to delivery." },
              { icon: CheckCircle2, title: "Trusted Restaurants", desc: "Order from reviewed and active restaurant partners." },
              { icon: Package, title: "Affordable Options", desc: "Discover meals and deals that fit a range of budgets." },
              { icon: Clock, title: "Simple & Reliable", desc: "A clean experience that's easy to use whenever you're hungry." },
            ].map((f, i) => (
              <Reveal key={f.title} delay={(i % 3) * 80}>
                <div className="group flex h-full items-start gap-4 rounded-2xl border border-[#EEEEEE] bg-white p-6 transition-all hover:-translate-y-0.5 hover:border-[#EA580C]/30 hover:shadow-lg hover:shadow-orange-50">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#FBF1E7] text-[#EA580C] transition-colors group-hover:bg-[#EA580C] group-hover:text-white">
                    <f.icon className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-[#141414]">{f.title}</h3>
                    <p className="mt-1.5 text-sm leading-relaxed text-[#6B7280]">{f.desc}</p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ─── FOR RESTAURANTS ───────────────────────────────────────────── */}
      <section className="py-14 lg:py-20">
        <div className="mx-auto max-w-7xl px-5 sm:px-8">
          <div className="grid items-center gap-14 lg:grid-cols-2">
            {/* Left copy */}
            <div>
              <Reveal>
                <span className="inline-flex items-center gap-2 rounded-full border border-orange-200 bg-white px-4 py-1.5 text-xs font-semibold tracking-wide text-[#EA580C] shadow-sm">
                  <Store className="h-3.5 w-3.5" /> FOR RESTAURANTS
                </span>
              </Reveal>
              <Reveal delay={80}>
                <h2 className="mt-6 text-2xl font-extrabold tracking-tight text-[#141414] sm:text-3xl lg:text-4xl">
                  Grow your restaurant with KainGo
                </h2>
              </Reveal>
              <Reveal delay={160}>
                <p className="mt-4 max-w-lg text-lg leading-relaxed text-[#6B7280]">
                  Reach more customers, showcase your menu, and manage every order in one
                  simple dashboard — from confirmation to delivery.
                </p>
              </Reveal>
              <Reveal delay={220}>
                <ul className="mt-7 space-y-3.5">
                  {[
                    "Reach a wider base of hungry customers",
                    "Manage orders in real time",
                    "Track sales and your most popular dishes",
                    "Keep your menu and stock up to date",
                  ].map((t) => (
                    <li key={t} className="flex items-center gap-3 text-[#374151]">
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#FBF1E7]">
                        <Check className="h-3.5 w-3.5 text-[#EA580C]" />
                      </span>
                      <span className="font-medium">{t}</span>
                    </li>
                  ))}
                </ul>
              </Reveal>
              <Reveal delay={300}>
                <div className="mt-8 flex flex-wrap gap-4">
                  <button
                    onClick={() => go("/restaurant-register")}
                    className="group inline-flex items-center rounded-xl bg-[#EA580C] px-7 py-3.5 text-base font-semibold text-white shadow-lg shadow-orange-200 transition-all hover:bg-[#D6530B] hover:shadow-xl active:scale-[0.97]"
                  >
                    Become a Partner
                    <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
                  </button>
                  <button
                    onClick={() => go("/restaurant-login")}
                    className="inline-flex items-center rounded-xl border border-[#E5E5E5] bg-white px-7 py-3.5 text-base font-semibold text-[#141414] transition-all hover:border-[#EA580C] hover:text-[#EA580C] active:scale-[0.97]"
                  >
                    Restaurant Login
                  </button>
                </div>
              </Reveal>
            </div>

            {/* Right dashboard mockup */}
            <Reveal delay={120}>
              <div className="relative">
                <div className="overflow-hidden rounded-3xl border border-[#EEEEEE] bg-white shadow-xl shadow-orange-100/40">
                  {/* Top bar */}
                  <div className="flex items-center justify-between border-b border-[#F0F0F0] px-5 py-4">
                    <span className="flex items-center gap-2 text-sm font-bold text-[#141414]">
                      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#FBF1E7]">
                        <Utensils className="h-4 w-4 text-[#EA580C]" />
                      </span>
                      Restaurant Dashboard
                    </span>
                    <span className="flex items-center gap-1.5 rounded-full bg-green-50 px-3 py-1 text-[11px] font-bold text-green-600">
                      <span className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" /> Open
                    </span>
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-3 gap-3 p-5">
                    {[
                      { icon: <Package className="h-4 w-4" />, label: "Orders", value: "24" },
                      { icon: <TrendingUp className="h-4 w-4" />, label: "Revenue", value: "₱12.5k" },
                      { icon: <Flame className="h-4 w-4" />, label: "Top item", value: "Burger" },
                    ].map((s) => (
                      <div key={s.label} className="rounded-2xl bg-[#FAFAFA] p-3.5">
                        <div className="text-[#EA580C]">{s.icon}</div>
                        <p className="mt-1.5 text-lg font-extrabold text-[#141414]">{s.value}</p>
                        <p className="text-[11px] text-[#6B7280]">{s.label}</p>
                      </div>
                    ))}
                  </div>

                  {/* Orders */}
                  <div className="px-5 pb-5">
                    <p className="text-xs font-bold uppercase tracking-wide text-[#6B7280]">
                      Recent orders
                    </p>
                    <div className="mt-3 space-y-2.5">
                      {[
                        { name: "Classic Cheeseburger", qty: "×2", status: "Preparing" },
                        { name: "Pepperoni Pizza", qty: "×1", status: "New" },
                        { name: "Special Ramen", qty: "×3", status: "Delivered" },
                      ].map((o) => (
                        <div
                          key={o.name}
                          className="flex items-center justify-between rounded-xl border border-[#F0F0F0] p-3"
                        >
                          <div className="flex items-center gap-3">
                            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#FBF1E7]">
                              <Utensils className="h-4 w-4 text-[#EA580C]" />
                            </span>
                            <p className="text-[13px] font-semibold text-[#141414]">
                              {o.name} <span className="font-normal text-[#6B7280]">{o.qty}</span>
                            </p>
                          </div>
                          <span
                            className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${
                              o.status === "Delivered"
                                ? "bg-green-50 text-green-600"
                                : o.status === "New"
                                ? "bg-orange-50 text-[#EA580C]"
                                : "bg-amber-50 text-amber-600"
                            }`}
                          >
                            {o.status}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Weekly sales */}
                  <div className="flex items-center justify-between border-t border-[#F0F0F0] px-5 py-4">
                    <span className="flex items-center gap-2 text-sm text-[#6B7280]">
                      <BarChart3 className="h-4 w-4 text-[#EA580C]" /> Sales this week
                    </span>
                    <span className="text-base font-extrabold text-[#141414]">₱42,950</span>
                  </div>
                </div>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ─── PROMOTIONAL CTA ────────────────────────────────────────────── */}
      <section className="px-5 py-16 sm:px-8 lg:py-24">
        <Reveal className="mx-auto max-w-5xl">
          <div className="relative overflow-hidden rounded-3xl bg-[#EA580C] px-8 py-14 text-center sm:px-16">
            <div className="pointer-events-none absolute inset-0">
              <div className="absolute -left-16 -top-16 h-56 w-56 rounded-full bg-white/5" />
              <div className="absolute -bottom-16 -right-16 h-56 w-56 rounded-full bg-white/5" />
              <div className="absolute left-1/4 top-6 text-4xl opacity-15">🍔</div>
              <div className="absolute bottom-8 right-1/4 text-4xl opacity-15">🍕</div>
            </div>
            <div className="relative">
              <h2 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
                Ready to satisfy your cravings?
              </h2>
              <p className="mx-auto mt-4 max-w-xl text-lg text-orange-100">
                Discover delicious food and place your next order in just a few clicks.
              </p>
              <button
                onClick={() => go(isLoggedIn ? "/home" : "/register")}
                className="group mt-8 inline-flex items-center rounded-xl bg-white px-8 py-4 text-base font-semibold text-[#EA580C] shadow-lg transition-all hover:bg-orange-50 active:scale-[0.97]"
              >
                Start Ordering
                <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
              </button>
            </div>
          </div>
        </Reveal>
      </section>

      {/* ─── FOOTER ─────────────────────────────────────────────────────── */}
      <footer className="border-t border-[#EEEEEE] bg-white">
        <div className="mx-auto max-w-7xl px-5 pb-10 pt-14 sm:px-8">
          <div className="grid grid-cols-2 gap-8 md:grid-cols-4 lg:grid-cols-5">
            {/* Brand */}
            <div className="col-span-2 lg:col-span-2">
              <div className="flex items-center gap-2.5">
                <img src={kaingoLogo} alt="KainGo" className="h-8 w-8 object-contain" />
                <span className="text-lg font-bold tracking-tight text-[#141414]">
                  Kain<span className="text-[#EA580C]">Go</span>
                </span>
              </div>
              <p className="mt-3 max-w-xs text-sm leading-relaxed text-[#6B7280]">
                Your cravings, your way. Discover, order, and enjoy great meals from
                the best restaurants.
              </p>
            </div>

            {/* Platform */}
            <div>
              <h4 className="text-sm font-bold text-[#141414]">Platform</h4>
              <div className="mt-4 flex flex-col gap-2.5">
                {[
                  { label: "Home", href: "#home" },
                  { label: "Restaurants", href: "#restaurants" },
                  { label: "Explore", href: "#explore" },
                  { label: "My Orders", action: () => go(isLoggedIn ? "/orders" : "/login") },
                ].map((l) => (
                  <FooterLink key={l.label} item={l} />
                ))}
              </div>
            </div>

            {/* Support */}
            <div>
              <h4 className="text-sm font-bold text-[#141414]">Support</h4>
              <div className="mt-4 flex flex-col gap-2.5">
                {[
                  { label: "Help Center", action: () => go("/home") },
                  { label: "Contact", action: () => go("/home") },
                  { label: "FAQs", action: () => go("/home") },
                ].map((l) => (
                  <FooterLink key={l.label} item={l} />
                ))}
              </div>
            </div>

            {/* Legal */}
            <div>
              <h4 className="text-sm font-bold text-[#141414]">Legal</h4>
              <div className="mt-4 flex flex-col gap-2.5">
                {[
                  { label: "Privacy Policy", action: () => go("/home") },
                  { label: "Terms & Conditions", action: () => go("/home") },
                  { label: "Login", action: () => go("/login") },
                ].map((l) => (
                  <FooterLink key={l.label} item={l} />
                ))}
              </div>
            </div>
          </div>

          <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-[#EEEEEE] pt-6 sm:flex-row">
            <p className="text-sm text-[#9CA3AF]">© 2026 KainGo. All rights reserved.</p>
            <div className="flex gap-5">
              {["Twitter", "Instagram", "Facebook"].map((s) => (
                <button
                  key={s}
                  className="text-sm text-[#6B7280] transition-colors hover:text-[#EA580C]"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

function FooterLink({ item }) {
  if (item.href) {
    return (
      <a href={item.href} className="text-sm text-[#6B7280] transition-colors hover:text-[#EA580C]">
        {item.label}
      </a>
    );
  }
  return (
    <button onClick={item.action} className="text-left text-sm text-[#6B7280] transition-colors hover:text-[#EA580C]">
      {item.label}
    </button>
  );
}

export default Landing;
