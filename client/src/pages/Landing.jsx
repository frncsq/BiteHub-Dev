import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Menu, X, Search, Star, ChevronRight, ShoppingCart, Check, Utensils,
  UtensilsCrossed, Flame, ArrowRight, Store, RefreshCw, CheckCircle2,
  User, LogIn, ClipboardList, Package, TrendingUp, Salad, Pizza, Hamburger,
  Sandwich, Fish, Soup, CupSoda, Coffee, EggFried, Drumstick, Wheat, Croissant,
  IceCreamCone, Cookie, Wallet, CakeSlice, Sparkles, Heart, BadgeCheck, AlertCircle,
} from "lucide-react";
import kaingoLogo from "../assets/kaingo-logo.svg";
import { createApiClient } from "../services/apiClient";

/* Neutral placeholder shown when an image is missing or fails to load. */
const fallbackImg =
  "data:image/svg+xml;charset=UTF-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='300'%3E%3Crect width='100%25' height='100%25' fill='%23FBF1E7'/%3E%3Cg fill='none' stroke='%23EA580C' stroke-width='8' stroke-linecap='round'%3E%3Ccircle cx='200' cy='150' r='52'/%3E%3Ccircle cx='200' cy='150' r='30'/%3E%3C/g%3E%3C/svg%3E";

const HERO_MAIN = "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&q=75";
const HERO_SIDE = "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&q=75";

/* Shared button styles for a consistent visual language. */
const BTN_PRIMARY =
  "group inline-flex items-center justify-center gap-2 rounded-xl bg-[#EA580C] px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-orange-200/60 transition-all hover:bg-[#D6530B] hover:shadow-xl active:scale-[0.97] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#EA580C] focus-visible:ring-offset-2";
const BTN_SECONDARY =
  "inline-flex items-center justify-center gap-2 rounded-xl border border-[#E5E5E5] bg-white px-6 py-3 text-sm font-semibold text-[#141414] transition-all hover:border-[#EA580C] hover:text-[#EA580C] active:scale-[0.97] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#EA580C]/40 focus-visible:ring-offset-2";

// Maps a category name to a professional line icon (checked in order).
const CATEGORY_ICON_MAP = [
  { match: /pizza/i, Icon: Pizza },
  { match: /burger|hamburger|cheeseburger/i, Icon: Hamburger },
  { match: /sandwich|sub\b|wrap|panini/i, Icon: Sandwich },
  { match: /sushi|sashimi|maki|japanese|seafood|fish/i, Icon: Fish },
  { match: /mexican|taco|burrito|quesadilla|nachos/i, Icon: Flame },
  { match: /indian|curry|masala|biryani|tandoor/i, Icon: Soup },
  { match: /dessert|sweet|cake|pastry|bakery|ice cream/i, Icon: IceCreamCone },
  { match: /coffee|tea\b|latte|espresso|brew|cappuccino/i, Icon: Coffee },
  { match: /drink|beverage|juice|soda|shake|smoothie|inumin/i, Icon: CupSoda },
  { match: /breakfast|egg\b|brunch|silog/i, Icon: EggFried },
  { match: /chicken|wing|poultry|drumstick|ihaw/i, Icon: Drumstick },
  { match: /grill|bbq|barbecue|roast|steak/i, Icon: Flame },
  { match: /noodle|ramen|pasta|soup|stew|broth|pancit|mami/i, Icon: Soup },
  { match: /salad|veggie|vegetable|healthy|green/i, Icon: Salad },
  { match: /rice|grain|wheat|pares/i, Icon: Wheat },
  { match: /bread|bakery|toast|dough|pastry|pandesal/i, Icon: Croissant },
  { match: /cake|cupcake|sliced/i, Icon: CakeSlice },
  { match: /snack|appetizer|starter|finger|merienda|pulutan/i, Icon: Cookie },
  { match: /budget|value|affordable|combo|deal|bundle|sulit/i, Icon: Wallet },
  { match: /main|course|entree|dish|meal|platter|signature|special|ulam|viand/i, Icon: UtensilsCrossed },
];

const categoryIcon = (name) => {
  const n = String(name || "");
  const found = CATEGORY_ICON_MAP.find(({ match }) => match.test(n));
  return found ? found.Icon : UtensilsCrossed;
};

const year = new Date().getFullYear();

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

/* Image with graceful fallback. Fills its (relative, sized) wrapper. */
function FoodImage({ src, alt, className, wrapperClassName, priority = false }) {
  const [imgSrc, setImgSrc] = useState(src);
  return (
    <div className={`relative overflow-hidden ${wrapperClassName || ""}`}>
      <img
        src={imgSrc || fallbackImg}
        alt={alt || ""}
        loading={priority ? "eager" : "lazy"}
        decoding="async"
        onError={() => setImgSrc(fallbackImg)}
        className={`absolute inset-0 h-full w-full object-cover ${className || ""}`}
      />
    </div>
  );
}

function SectionHeading({ eyebrow, icon: EyebrowIcon, title, subtitle, align = "left", action }) {
  const centered = align === "center";
  return (
    <Reveal
      className={
        centered
          ? "mx-auto max-w-2xl text-center"
          : "flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"
      }
    >
      <div className={centered ? "" : "max-w-2xl"}>
        {eyebrow && (
          <span
            className={`inline-flex items-center gap-1.5 rounded-full border border-orange-100 bg-orange-50 px-3 py-1 text-xs font-bold uppercase tracking-wide text-[#EA580C] ${
              centered ? "mx-auto" : ""
            }`}
          >
            {EyebrowIcon && <EyebrowIcon className="h-3.5 w-3.5" aria-hidden="true" />}
            {eyebrow}
          </span>
        )}
        <h2 className="mt-3 text-2xl font-extrabold tracking-tight text-[#141414] sm:text-3xl lg:text-[34px]">
          {title}
        </h2>
        {subtitle && <p className="mt-2 text-base text-[#6B7280]">{subtitle}</p>}
      </div>
      {action}
    </Reveal>
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
  const [categoriesLoaded, setCategoriesLoaded] = useState(false);
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
    } finally {
      setCategoriesLoaded(true);
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
      showToast("Added to cart");
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

  const categoryCard = (cat) => {
    const name = String(cat?.name || cat || "Food");
    return { name, Icon: categoryIcon(name) };
  };

  const navLinks = [
    { label: "Home", href: "#home" },
    { label: "Restaurants", href: "#restaurants" },
    { label: "How It Works", href: "#how" },
    { label: "About", href: "#about" },
  ];

  const heroFood = foods.length > 0 ? foods[0] : null;
  const orderPath = isLoggedIn ? "/home" : "/register";

  return (
    <div className="min-h-screen bg-white text-[#141414] font-sans antialiased">

      {/* TOAST */}
      {toast && (
        <div
          role="status"
          aria-live="polite"
          className={`fixed left-1/2 top-5 z-[100] flex -translate-x-1/2 items-center gap-2.5 rounded-xl px-4 py-3 text-sm font-semibold text-white shadow-xl animate-slide-up ${
            toast.type === "error" ? "bg-[#DC2626]" : "bg-[#EA580C]"
          }`}
        >
          {toast.type === "error" ? (
            <AlertCircle className="h-4 w-4 text-white" />
          ) : (
            <CheckCircle2 className="h-4 w-4 text-white" />
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
          <button
            onClick={() => go("/")}
            aria-label="KainGo home"
            className="flex shrink-0 items-center gap-2.5 rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-[#EA580C]/40"
          >
            <img src={kaingoLogo} alt="" className="h-8 w-8 object-contain" />
            <span className="text-lg font-bold tracking-tight text-[#141414]">
              Kain<span className="text-[#EA580C]">Go</span>
            </span>
          </button>

          {/* Center nav */}
          <div className="mx-auto hidden items-center gap-7 lg:flex">
            {navLinks.map((l) => (
              <a
                key={l.label}
                href={l.href}
                className="rounded-md text-sm font-medium text-[#6B7280] transition-colors hover:text-[#EA580C] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#EA580C]/40"
              >
                {l.label}
              </a>
            ))}
          </div>

          {/* Right actions */}
          <div className="hidden items-center gap-2.5 lg:flex">
            <button
              onClick={() => goMarketplace()}
              aria-label="Search restaurants and dishes"
              className="flex h-10 w-10 items-center justify-center rounded-full text-[#6B7280] transition-colors hover:bg-[#F5F5F5] hover:text-[#EA580C] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#EA580C]/40"
            >
              <Search className="h-5 w-5" />
            </button>
            <button
              onClick={() => go(isLoggedIn ? "/cart" : "/login")}
              aria-label={`Cart${cartCount > 0 ? `, ${cartCount} items` : ""}`}
              className="relative flex h-10 w-10 items-center justify-center rounded-full text-[#6B7280] transition-colors hover:bg-[#F5F5F5] hover:text-[#EA580C] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#EA580C]/40"
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
                className="flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-[#141414] transition-colors hover:bg-[#F5F5F5] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#EA580C]/40"
              >
                <User className="h-4 w-4" /> Account
              </button>
            ) : (
              <button
                onClick={() => go("/login")}
                className="flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-[#141414] transition-colors hover:bg-[#F5F5F5] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#EA580C]/40"
              >
                <LogIn className="h-4 w-4" /> Log In
              </button>
            )}

            <button
              onClick={() => go(isLoggedIn ? "/home" : "/register")}
              className="rounded-xl bg-[#EA580C] px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-[#D6530B] hover:shadow-md active:scale-[0.97] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#EA580C] focus-visible:ring-offset-2"
            >
              {isLoggedIn ? "Order Now" : "Get Started"}
            </button>
          </div>

          {/* Mobile actions */}
          <div className="flex items-center gap-1 lg:hidden">
            <button
              onClick={() => go(isLoggedIn ? "/cart" : "/login")}
              aria-label={`Cart${cartCount > 0 ? `, ${cartCount} items` : ""}`}
              className="relative flex h-10 w-10 items-center justify-center rounded-full text-[#6B7280] hover:bg-[#F5F5F5] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#EA580C]/40"
            >
              <ShoppingCart className="h-5 w-5" />
              {cartCount > 0 && (
                <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-[#EA580C] px-1 text-[11px] font-bold text-white">
                  {cartCount}
                </span>
              )}
            </button>
            <button
              onClick={() => setMenuOpen((o) => !o)}
              className="flex h-10 w-10 items-center justify-center rounded-full text-[#141414] hover:bg-[#F5F5F5] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#EA580C]/40"
              aria-label={menuOpen ? "Close menu" : "Open menu"}
              aria-expanded={menuOpen}
            >
              {menuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </nav>

        {/* Mobile menu (animated open/close) */}
        <div
          className={`overflow-hidden border-[#EEEEEE] bg-white transition-[max-height,opacity] duration-300 ease-out lg:hidden ${
            menuOpen ? "max-h-[520px] border-t opacity-100" : "max-h-0 opacity-0"
          }`}
          aria-hidden={!menuOpen}
        >
          <div className="mx-auto flex max-w-7xl flex-col gap-1 px-5 py-4">
            {navLinks.map((l) => (
              <a
                key={l.label}
                href={l.href}
                tabIndex={menuOpen ? 0 : -1}
                onClick={() => setMenuOpen(false)}
                className="rounded-lg px-3 py-3 text-sm font-medium text-[#6B7280] transition-colors hover:bg-[#F9F9F9] hover:text-[#EA580C]"
              >
                {l.label}
              </a>
            ))}
            <div className="mt-3 flex flex-col gap-2 border-t border-[#EEEEEE] pt-4">
              <button
                onClick={() => (isLoggedIn ? go("/profile") : go("/login"))}
                tabIndex={menuOpen ? 0 : -1}
                className="flex items-center justify-center gap-2 rounded-xl border border-[#E5E5E5] px-4 py-3 text-sm font-semibold text-[#141414]"
              >
                {isLoggedIn ? <><User className="h-4 w-4" /> Account</> : <><LogIn className="h-4 w-4" /> Log In</>}
              </button>
              <button
                onClick={() => go(isLoggedIn ? "/home" : "/register")}
                tabIndex={menuOpen ? 0 : -1}
                className="rounded-xl bg-[#EA580C] px-4 py-3 text-sm font-semibold text-white"
              >
                {isLoggedIn ? "Order Now" : "Get Started"}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* ─── HERO ───────────────────────────────────────────────────────── */}
      <section
        id="home"
        aria-label="Introduction"
        className="relative scroll-mt-20 overflow-hidden bg-gradient-to-b from-orange-50/60 via-white to-white"
      >
        <div className="pointer-events-none absolute inset-0" aria-hidden="true">
          <div className="absolute -left-32 -top-32 h-80 w-80 rounded-full bg-orange-100/40 blur-3xl" />
          <div className="absolute -right-24 top-40 h-72 w-72 rounded-full bg-amber-100/40 blur-3xl" />
        </div>

        <div className="relative mx-auto grid max-w-7xl items-center gap-12 px-5 pb-16 pt-14 sm:px-8 lg:grid-cols-2 lg:gap-10 lg:pb-24 lg:pt-20">
          {/* Left */}
          <div>
            <Reveal>
              <span className="inline-flex items-center gap-2 rounded-full border border-orange-200 bg-white px-4 py-1.5 text-xs font-bold uppercase tracking-wide text-[#EA580C] shadow-sm">
                <Sparkles className="h-3.5 w-3.5" aria-hidden="true" /> Hali na, order na!
              </span>
            </Reveal>
            <Reveal delay={80}>
              <h1 className="mt-6 text-[38px] font-extrabold leading-[1.08] tracking-tight text-[#141414] sm:text-5xl lg:text-[54px]">
                Good food. Great choices.
                <br />
                <span className="text-[#EA580C]">One order away.</span>
              </h1>
            </Reveal>
            <Reveal delay={160}>
              <p className="mt-6 max-w-lg text-lg leading-relaxed text-[#6B7280]">
                KainGo brings local restaurants and their menus together in one place.
                Discover dishes you love, build your order, and check out online in a
                few simple taps.
              </p>
            </Reveal>
            <Reveal delay={240}>
              <div className="mt-8 flex flex-wrap items-center gap-4">
                <button
                  onClick={() => go(orderPath)}
                  className="group inline-flex items-center rounded-xl bg-[#EA580C] px-7 py-3.5 text-base font-semibold text-white shadow-lg shadow-orange-200 transition-all hover:bg-[#D6530B] hover:shadow-xl active:scale-[0.97] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#EA580C] focus-visible:ring-offset-2"
                >
                  Order Now
                  <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
                </button>
                <a
                  href="#restaurants"
                  className="inline-flex items-center rounded-xl border border-[#E5E5E5] bg-white px-7 py-3.5 text-base font-semibold text-[#141414] transition-all hover:border-[#EA580C] hover:text-[#EA580C] active:scale-[0.97] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#EA580C]/40 focus-visible:ring-offset-2"
                >
                  Explore Restaurants
                </a>
              </div>
            </Reveal>
            <Reveal delay={320}>
              <ul className="mt-10 flex flex-wrap items-center gap-x-7 gap-y-3">
                <li className="flex items-center gap-2 text-sm text-[#6B7280]">
                  <Store className="h-4 w-4 text-[#EA580C]" aria-hidden="true" />
                  Discover local restaurants
                </li>
                <li className="flex items-center gap-2 text-sm text-[#6B7280]">
                  <ShoppingCart className="h-4 w-4 text-[#EA580C]" aria-hidden="true" />
                  Order online in a few taps
                </li>
                <li className="flex items-center gap-2 text-sm text-[#6B7280]">
                  <ClipboardList className="h-4 w-4 text-[#EA580C]" aria-hidden="true" />
                  Manage your orders
                </li>
              </ul>
            </Reveal>
          </div>

          {/* Right visual */}
          <Reveal delay={120} className="relative">
            <div className="relative mx-auto w-full max-w-md lg:max-w-[460px]">
              <div className="overflow-hidden rounded-[28px] border border-[#F0F0F0] bg-white shadow-2xl shadow-orange-100/50">
                <img
                  src={`${HERO_MAIN}&w=900`}
                  srcSet={`${HERO_MAIN}&w=600 600w, ${HERO_MAIN}&w=900 900w, ${HERO_MAIN}&w=1200 1200w`}
                  sizes="(min-width: 1024px) 460px, 90vw"
                  width="900"
                  height="1125"
                  alt="A table spread of freshly prepared dishes"
                  loading="eager"
                  fetchPriority="high"
                  decoding="async"
                  className="aspect-[4/5] w-full object-cover"
                />
              </div>

              <div className="absolute -bottom-6 -left-5 hidden w-44 overflow-hidden rounded-[22px] border-4 border-white bg-white shadow-xl sm:block">
                <img
                  src={`${HERO_SIDE}&w=400`}
                  width="400"
                  height="400"
                  alt="A freshly made burger"
                  loading="eager"
                  decoding="async"
                  className="aspect-square w-full object-cover"
                />
              </div>

              {heroFood && (
                <div className="absolute -right-3 top-8 w-48 rounded-2xl border border-[#F0F0F0] bg-white/95 p-2.5 shadow-xl backdrop-blur sm:-right-5">
                  <div className="flex items-center gap-2.5">
                    <FoodImage
                      src={heroFood.image}
                      alt={heroFood.name}
                      wrapperClassName="h-12 w-12 shrink-0 rounded-xl"
                      priority
                    />
                    <div className="min-w-0">
                      <p className="text-[10px] font-bold uppercase tracking-wide text-[#EA580C]">
                        Popular now
                      </p>
                      <p className="truncate text-[13px] font-bold text-[#141414]">{heroFood.name}</p>
                      <p className="text-[12px] font-semibold text-[#6B7280]">
                        {formatPrice(heroFood.price)}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </Reveal>
        </div>
      </section>

      {/* ─── CATEGORIES ─────────────────────────────────────────────────── */}
      {(categories.length > 0 || !categoriesLoaded) && (
        <section id="categories" className="scroll-mt-20 py-14 lg:py-20">
          <div className="mx-auto max-w-7xl px-5 sm:px-8">
            <SectionHeading
              eyebrow="Browse the menu"
              icon={UtensilsCrossed}
              title="What are you craving?"
              subtitle="Pick a category and start exploring dishes."
              action={
                <button
                  onClick={() => goMarketplace()}
                  className="hidden items-center gap-1 text-sm font-semibold text-[#EA580C] hover:underline sm:inline-flex"
                >
                  View all <ChevronRight className="h-4 w-4" />
                </button>
              }
            />

            <div className="mt-7 grid grid-cols-3 gap-3 min-[420px]:grid-cols-4 lg:grid-cols-8">
              {categories.length > 0
                ? categories.slice(0, 8).map((cat, i) => {
                    const c = categoryCard(cat);
                    return (
                      <Reveal key={c.name + i} delay={(i % 8) * 40}>
                        <button
                          onClick={() => goMarketplace()}
                          className="group flex w-full flex-col items-center gap-2.5 rounded-2xl border border-[#EEEEEE] bg-white px-2 py-4 transition-all hover:-translate-y-0.5 hover:border-[#EA580C]/40 hover:shadow-lg hover:shadow-orange-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#EA580C]/40"
                        >
                          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#FBF1E7] text-[#EA580C] transition-all duration-200 group-hover:scale-110 group-hover:bg-[#EA580C] group-hover:text-white">
                            <c.Icon className="h-6 w-6" strokeWidth={1.75} aria-hidden="true" />
                          </span>
                          <span className="line-clamp-2 text-xs font-semibold text-[#141414] group-hover:text-[#EA580C]">
                            {c.name}
                          </span>
                        </button>
                      </Reveal>
                    );
                  })
                : Array.from({ length: 8 }).map((_, i) => (
                    <div
                      key={i}
                      className="flex flex-col items-center gap-2.5 rounded-2xl border border-[#EEEEEE] bg-white px-2 py-4"
                    >
                      <div className="h-12 w-12 rounded-2xl bg-[#F3F3F3] animate-pulse" />
                      <div className="h-3 w-14 rounded bg-[#F3F3F3] animate-pulse" />
                    </div>
                  ))}
            </div>
          </div>
        </section>
      )}

      {/* ─── FEATURED RESTAURANTS ───────────────────────────────────────── */}
      <section id="restaurants" className="scroll-mt-20 py-14 lg:py-20">
        <div className="mx-auto max-w-7xl px-5 sm:px-8">
          <SectionHeading
            eyebrow="Explore"
            icon={Store}
            title="Discover your next favorite"
            subtitle="Browse restaurants and explore their full menus."
            action={
              <button
                onClick={() => goMarketplace()}
                className="inline-flex items-center gap-1 text-sm font-semibold text-[#EA580C] hover:underline"
              >
                View all restaurants <ChevronRight className="h-4 w-4" />
              </button>
            }
          />

          {loadingRestaurants && (
            <div className="mt-7 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="overflow-hidden rounded-2xl border border-[#EEEEEE] bg-white">
                  <div className="aspect-[16/10] w-full bg-[#F3F3F3] animate-pulse" />
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
              <AlertCircle className="mx-auto h-8 w-8 text-[#EA580C]" />
              <p className="mt-2 text-[#9A3412]">{restaurantError}</p>
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
              <p className="mt-3 text-[#6B7280]">No restaurants are available right now.</p>
              <p className="mt-1 text-sm text-[#9CA3AF]">Please check back soon.</p>
            </div>
          )}

          {!loadingRestaurants && !restaurantError && restaurants.length > 0 && (
            <div className="mt-7 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {restaurants.slice(0, 8).map((r, i) => {
                const rating = Number(r.rating);
                const cuisine = r.type || r.cuisines?.[0] || "Restaurant";
                return (
                  <Reveal key={r.id} delay={(i % 4) * 70}>
                    <button
                      onClick={() => navigate(`/restaurant/${r.id}`, { state: { restaurant: r } })}
                      aria-label={`${r.name}, ${cuisine}`}
                      className="group flex h-full w-full flex-col overflow-hidden rounded-2xl border border-[#EEEEEE] bg-white text-left transition-all hover:-translate-y-1 hover:border-[#EA580C]/30 hover:shadow-xl hover:shadow-orange-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#EA580C]/40"
                    >
                      <div className="relative">
                        <FoodImage
                          src={r.image}
                          alt={r.name}
                          wrapperClassName="aspect-[16/10] w-full"
                          className="transition-transform duration-500 group-hover:scale-105"
                        />
                        <span className="absolute left-3 top-3 flex items-center gap-1 rounded-full bg-white/95 px-2 py-1 text-[11px] font-bold text-[#141414] shadow-sm backdrop-blur">
                          <Star className="h-3 w-3 fill-[#F5A623] text-[#F5A623]" aria-hidden="true" />
                          {rating > 0 ? rating.toFixed(1) : "New"}
                        </span>
                      </div>
                      <div className="flex flex-1 flex-col p-4">
                        <h3 className="truncate text-base font-bold text-[#141414] transition-colors group-hover:text-[#EA580C]">
                          {r.name}
                        </h3>
                        <p className="mt-1 truncate text-[13px] text-[#6B7280]">{cuisine}</p>
                        <span className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-[#EA580C]">
                          View menu
                          <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                        </span>
                      </div>
                    </button>
                  </Reveal>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* ─── POPULAR FOOD ───────────────────────────────────────────────── */}
      <section id="popular" className="scroll-mt-20 bg-[#FAFAFA] py-14 lg:py-20">
        <div className="mx-auto max-w-7xl px-5 sm:px-8">
          <SectionHeading
            eyebrow="Trending"
            icon={Flame}
            title="Popular right now"
            subtitle="Dishes customers are ordering most."
            action={
              <button
                onClick={() => goMarketplace()}
                className="inline-flex items-center gap-1 text-sm font-semibold text-[#EA580C] hover:underline"
              >
                View all <ChevronRight className="h-4 w-4" />
              </button>
            }
          />

          {loadingFoods && (
            <div className="mt-7 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
              {Array.from({ length: 10 }).map((_, i) => (
                <div key={i} className="overflow-hidden rounded-2xl border border-[#EEEEEE] bg-white">
                  <div className="aspect-[4/3] w-full bg-[#F3F3F3] animate-pulse" />
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
              <AlertCircle className="mx-auto h-8 w-8 text-[#EA580C]" />
              <p className="mt-2 text-[#9A3412]">{foodError}</p>
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
              <p className="mt-3 text-[#6B7280]">No popular dishes are available right now.</p>
            </div>
          )}

          {!loadingFoods && !foodError && foods.length > 0 && (
            <div className="mt-7 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
              {foods.slice(0, 10).map((food, i) => {
                const isOOS = food.current_stock != null && Number(food.current_stock) <= 0;
                const rating = Number(food.rating);
                return (
                  <Reveal key={food.id} delay={(i % 5) * 60}>
                    <div className="group flex h-full flex-col overflow-hidden rounded-2xl border border-[#EEEEEE] bg-white transition-all hover:-translate-y-0.5 hover:border-[#EA580C]/30 hover:shadow-lg hover:shadow-orange-50">
                      <FoodImage
                        src={food.image}
                        alt={food.name}
                        wrapperClassName="aspect-[4/3] w-full"
                        className="transition-transform duration-500 group-hover:scale-105"
                      />
                      <div className="flex flex-1 flex-col p-3.5">
                        <div className="flex items-start justify-between gap-2">
                          <h3 className="line-clamp-1 text-sm font-bold text-[#141414]">{food.name}</h3>
                          {rating > 0 && (
                            <span className="flex shrink-0 items-center gap-0.5 text-[11px] font-semibold text-[#141414]">
                              <Star className="h-3 w-3 fill-[#F5A623] text-[#F5A623]" aria-hidden="true" />
                              {rating.toFixed(1)}
                            </span>
                          )}
                        </div>
                        <p className="mt-0.5 line-clamp-1 text-xs leading-snug text-[#6B7280]">
                          {food.restaurant || food.description}
                        </p>
                        <div className="mt-auto flex items-center justify-between gap-2 pt-3">
                          <span className="text-sm font-extrabold text-[#141414]">
                            {formatPrice(food.price)}
                          </span>
                          <button
                            onClick={() => addToCart(food)}
                            disabled={isOOS}
                            aria-label={isOOS ? `${food.name} is sold out` : `Add ${food.name} to cart`}
                            className={`flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-all active:scale-[0.96] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#EA580C]/40 ${
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
      <section id="how" className="scroll-mt-20 py-14 lg:py-20">
        <div className="mx-auto max-w-7xl px-5 sm:px-8">
          <SectionHeading
            eyebrow="Getting started"
            icon={Search}
            align="center"
            title="How KainGo works"
            subtitle="Ordering your next meal takes just three steps."
          />

          <div className="relative mt-12 grid grid-cols-1 gap-8 sm:grid-cols-3">
            <div
              className="pointer-events-none absolute left-[16.66%] right-[16.66%] top-8 hidden border-t-2 border-dashed border-orange-200 sm:block"
              aria-hidden="true"
            />
            {[
              { num: "01", title: "Discover", desc: "Browse restaurants and dishes available on KainGo.", icon: Search },
              { num: "02", title: "Choose Your Favorites", desc: "Explore menus, pick the dishes you love, and add them to your cart.", icon: Heart },
              { num: "03", title: "Place Your Order", desc: "Review your cart and complete your order online.", icon: ShoppingCart },
            ].map((s, i) => (
              <Reveal key={s.num} delay={i * 90}>
                <div className="relative flex flex-col items-center text-center">
                  <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl bg-[#FBF1E7] text-[#EA580C]">
                    <s.icon className="h-6 w-6" aria-hidden="true" />
                    <span className="absolute -right-2 -top-2 rounded-lg bg-[#EA580C] px-2 py-0.5 text-[11px] font-bold text-white">
                      {s.num}
                    </span>
                  </div>
                  <h3 className="mt-5 text-lg font-bold text-[#141414]">{s.title}</h3>
                  <p className="mx-auto mt-1.5 max-w-[260px] text-sm leading-relaxed text-[#6B7280]">
                    {s.desc}
                  </p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ─── WHY CHOOSE US ──────────────────────────────────────────────── */}
      <section id="about" className="scroll-mt-20 bg-[#FAFAFA] py-14 lg:py-20">
        <div className="mx-auto max-w-7xl px-5 sm:px-8">
          <SectionHeading
            eyebrow="About KainGo"
            icon={BadgeCheck}
            align="center"
            title="Why choose KainGo"
            subtitle="Everything you need to discover food and order with ease."
          />

          <div className="mt-12 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {[
              { icon: Store, title: "Browse Local Restaurants", desc: "Explore restaurants and their full menus in one place." },
              { icon: UtensilsCrossed, title: "Variety of Dishes", desc: "Discover a wide range of cuisines and categories to match your cravings." },
              { icon: ShoppingCart, title: "Simple Cart & Checkout", desc: "Add items to your cart and complete your order online in a few steps." },
              { icon: Heart, title: "Save Your Favorites", desc: "Bookmark the dishes you love and find them again easily." },
              { icon: ClipboardList, title: "Order History", desc: "Review your current and past orders whenever you need." },
              { icon: BadgeCheck, title: "Trusted Partners", desc: "Order from reviewed and active restaurant partners." },
            ].map((f, i) => (
              <Reveal key={f.title} delay={(i % 3) * 80}>
                <div className="group flex h-full items-start gap-4 rounded-2xl border border-[#EEEEEE] bg-white p-6 transition-all hover:-translate-y-0.5 hover:border-[#EA580C]/30 hover:shadow-lg hover:shadow-orange-50">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#FBF1E7] text-[#EA580C] transition-colors group-hover:bg-[#EA580C] group-hover:text-white">
                    <f.icon className="h-5 w-5" aria-hidden="true" />
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
      <section id="partner" className="scroll-mt-20 py-14 lg:py-20">
        <div className="mx-auto max-w-7xl px-5 sm:px-8">
          <div className="grid items-center gap-14 lg:grid-cols-2">
            {/* Left copy */}
            <div>
              <Reveal>
                <span className="inline-flex items-center gap-2 rounded-full border border-orange-100 bg-orange-50 px-3 py-1 text-xs font-bold uppercase tracking-wide text-[#EA580C]">
                  <Store className="h-3.5 w-3.5" aria-hidden="true" /> For Restaurants
                </span>
              </Reveal>
              <Reveal delay={80}>
                <h2 className="mt-6 text-2xl font-extrabold tracking-tight text-[#141414] sm:text-3xl lg:text-4xl">
                  Grow your restaurant with KainGo
                </h2>
              </Reveal>
              <Reveal delay={160}>
                <p className="mt-4 max-w-lg text-lg leading-relaxed text-[#6B7280]">
                  Put your menu in front of more customers and manage every order from a
                  single dashboard — from your dishes and stock to your daily operations.
                </p>
              </Reveal>
              <Reveal delay={220}>
                <ul className="mt-7 space-y-3.5">
                  {[
                    "Reach more hungry customers in your area",
                    "Manage incoming orders from one dashboard",
                    "Keep your menu, prices, and stock up to date",
                    "Review your sales and top-selling dishes",
                  ].map((t) => (
                    <li key={t} className="flex items-center gap-3 text-[#374151]">
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#FBF1E7]">
                        <Check className="h-3.5 w-3.5 text-[#EA580C]" aria-hidden="true" />
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
                    className="group inline-flex items-center rounded-xl bg-[#EA580C] px-7 py-3.5 text-base font-semibold text-white shadow-lg shadow-orange-200 transition-all hover:bg-[#D6530B] hover:shadow-xl active:scale-[0.97] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#EA580C] focus-visible:ring-offset-2"
                  >
                    Become a Partner
                    <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
                  </button>
                  <button
                    onClick={() => go("/restaurant-login")}
                    className="inline-flex items-center rounded-xl border border-[#E5E5E5] bg-white px-7 py-3.5 text-base font-semibold text-[#141414] transition-all hover:border-[#EA580C] hover:text-[#EA580C] active:scale-[0.97] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#EA580C]/40 focus-visible:ring-offset-2"
                  >
                    Restaurant Login
                  </button>
                </div>
              </Reveal>
            </div>

            {/* Right feature panel (illustrative — no fabricated figures) */}
            <Reveal delay={120}>
              <div className="overflow-hidden rounded-3xl border border-[#EEEEEE] bg-white shadow-xl shadow-orange-100/40">
                <div className="flex items-center justify-between border-b border-[#F0F0F0] px-5 py-4">
                  <span className="flex items-center gap-2 text-sm font-bold text-[#141414]">
                    <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#FBF1E7]">
                      <Utensils className="h-4 w-4 text-[#EA580C]" aria-hidden="true" />
                    </span>
                    Restaurant Dashboard
                  </span>
                  <span className="rounded-full bg-[#F5F5F5] px-3 py-1 text-[11px] font-bold text-[#6B7280]">
                    Preview
                  </span>
                </div>

                <div className="space-y-3 p-5">
                  {[
                    { icon: Utensils, title: "Menu management", desc: "Add dishes, update prices, and set availability." },
                    { icon: ClipboardList, title: "Order tracking", desc: "See new and in-progress orders as they come in." },
                    { icon: Package, title: "Inventory", desc: "Monitor stock levels for every item on your menu." },
                    { icon: TrendingUp, title: "Sales analytics", desc: "Review your performance and top-selling dishes." },
                  ].map((f) => (
                    <div
                      key={f.title}
                      className="flex items-center gap-3.5 rounded-2xl border border-[#F0F0F0] p-3.5"
                    >
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#FBF1E7] text-[#EA580C]">
                        <f.icon className="h-5 w-5" aria-hidden="true" />
                      </span>
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-[#141414]">{f.title}</p>
                        <p className="truncate text-[12px] text-[#6B7280]">{f.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="border-t border-[#F0F0F0] px-5 py-4">
                  <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-[#6B7280]">
                    <TrendingUp className="h-4 w-4 text-[#EA580C]" aria-hidden="true" /> Sales overview
                  </p>
                  <div className="mt-3 flex h-16 items-end gap-1.5" aria-hidden="true">
                    {[38, 55, 42, 68, 50, 80, 62].map((h, idx) => (
                      <div
                        key={idx}
                        className="flex-1 rounded-t-md bg-gradient-to-t from-orange-200 to-[#EA580C]"
                        style={{ height: `${h}%` }}
                      />
                    ))}
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
            <div className="pointer-events-none absolute inset-0" aria-hidden="true">
              <div className="absolute -left-16 -top-16 h-56 w-56 rounded-full bg-white/5" />
              <div className="absolute -bottom-16 -right-16 h-56 w-56 rounded-full bg-white/5" />
              <Sparkles className="absolute left-[12%] top-8 h-8 w-8 text-white/15" />
              <UtensilsCrossed className="absolute bottom-8 right-[12%] h-8 w-8 text-white/15" />
            </div>
            <div className="relative">
              <h2 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
                Your next favorite meal is waiting
              </h2>
              <p className="mx-auto mt-4 max-w-xl text-lg text-orange-100">
                Explore local restaurants on KainGo, find something you'll love, and
                place your order in a few taps.
              </p>
              <button
                onClick={() => go(orderPath)}
                className="group mt-8 inline-flex items-center rounded-xl bg-white px-8 py-4 text-base font-semibold text-[#EA580C] shadow-lg transition-all hover:bg-orange-50 active:scale-[0.97] focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#EA580C]"
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
          <div className="grid grid-cols-2 gap-8 md:grid-cols-3 lg:grid-cols-6">
            {/* Brand */}
            <div className="col-span-2">
              <div className="flex items-center gap-2.5">
                <img src={kaingoLogo} alt="" className="h-8 w-8 object-contain" />
                <span className="text-lg font-bold tracking-tight text-[#141414]">
                  Kain<span className="text-[#EA580C]">Go</span>
                </span>
              </div>
              <p className="mt-3 max-w-xs text-sm leading-relaxed text-[#6B7280]">
                Good food, great choices — all in one place. Discover restaurants,
                explore their menus, and order online.
              </p>
            </div>

            {/* Platform */}
            <div>
              <h3 className="text-sm font-bold text-[#141414]">Platform</h3>
              <div className="mt-4 flex flex-col gap-2.5">
                {[
                  { label: "Home", href: "#home" },
                  { label: "Restaurants", href: "#restaurants" },
                  { label: "How It Works", href: "#how" },
                  { label: "About", href: "#about" },
                ].map((l) => (
                  <FooterLink key={l.label} item={l} />
                ))}
              </div>
            </div>

            {/* Account */}
            <div>
              <h3 className="text-sm font-bold text-[#141414]">Account</h3>
              <div className="mt-4 flex flex-col gap-2.5">
                {[
                  { label: isLoggedIn ? "Account" : "Log In", action: () => go(isLoggedIn ? "/profile" : "/login") },
                  { label: "Sign Up", action: () => go("/register") },
                  { label: "My Orders", action: () => go(isLoggedIn ? "/orders" : "/login") },
                  { label: "My Cart", action: () => go(isLoggedIn ? "/cart" : "/login") },
                ].map((l) => (
                  <FooterLink key={l.label} item={l} />
                ))}
              </div>
            </div>

            {/* For restaurants */}
            <div>
              <h3 className="text-sm font-bold text-[#141414]">For Restaurants</h3>
              <div className="mt-4 flex flex-col gap-2.5">
                {[
                  { label: "Become a Partner", action: () => go("/restaurant-register") },
                  { label: "Restaurant Login", action: () => go("/restaurant-login") },
                ].map((l) => (
                  <FooterLink key={l.label} item={l} />
                ))}
              </div>
            </div>

            {/* Legal */}
            <div>
              <h3 className="text-sm font-bold text-[#141414]">Legal</h3>
              <div className="mt-4 flex flex-col gap-2.5">
                {[
                  { label: "Terms of Service", action: () => go("/legal/terms") },
                  { label: "Privacy Policy", action: () => go("/legal/privacy") },
                  { label: "Cookie Policy", action: () => go("/legal/cookies") },
                  { label: "Refund & Cancellation", action: () => go("/legal/refunds") },
                  { label: "Acceptable Use", action: () => go("/legal/acceptable-use") },
                  { label: "Partner Agreement", action: () => go("/legal/partner-agreement") },
                ].map((l) => (
                  <FooterLink key={l.label} item={l} />
                ))}
              </div>
            </div>
          </div>

          <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-[#EEEEEE] pt-6 sm:flex-row">
            <p className="text-sm text-[#9CA3AF]">© {year} KainGo. All rights reserved.</p>
            <p className="text-sm text-[#9CA3AF]">Sarap na, order na!</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

function FooterLink({ item }) {
  const className =
    "text-left text-sm text-[#6B7280] transition-colors hover:text-[#EA580C] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#EA580C]/40 rounded";
  if (item.href) {
    return (
      <a href={item.href} className={className}>
        {item.label}
      </a>
    );
  }
  return (
    <button onClick={item.action} className={className}>
      {item.label}
    </button>
  );
}

export default Landing;
