import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Menu, X, Search, Star, ChevronRight, ShoppingBag, ShoppingCart,
  MapPin, Check, CheckCircle2, Zap, ChefHat, Utensils, Salad,
  Wallet, Bell, ArrowRight, Store, Package, BarChart3, TrendingUp,
  ClipboardList, Flame, Plus, RefreshCw,
} from "lucide-react";
import biteLogo from "../assets/bite.png";
import { createApiClient } from "../services/apiClient";

const foodImages = {
  burger: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=800&q=70",
  fries: "https://images.unsplash.com/photo-1573080496219-bb080dd4f877?auto=format&fit=crop&w=800&q=70",
  pizza: "https://images.unsplash.com/photo-1604382354936-07c5d9983bd3?auto=format&fit=crop&w=800&q=70",
  drink: "https://images.unsplash.com/photo-1544145945-f90425340c7e?auto=format&fit=crop&w=800&q=70",
  rice: "https://images.unsplash.com/photo-1512058564366-18510be2db19?auto=format&fit=crop&w=800&q=70",
  adobo: "https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=800&q=70",
  sinigang: "https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=800&q=70",
  dessert: "https://images.unsplash.com/photo-1551024506-0bccd828d307?auto=format&fit=crop&w=800&q=70",
  halo: "https://images.unsplash.com/photo-1563805042-7684c019e1cb?auto=format&fit=crop&w=800&q=70",
  tapsilog: "https://images.unsplash.com/photo-1603133872878-684f208fb84b?auto=format&fit=crop&w=800&q=70",
  ricebowl: "https://images.unsplash.com/photo-1512058564366-18510be2db19?auto=format&fit=crop&w=800&q=70",
  milktea: "https://images.unsplash.com/photo-1556679343-c7306c1976bc?auto=format&fit=crop&w=800&q=70",
  pancit: "https://images.unsplash.com/photo-1585032226651-759b368d7246?auto=format&fit=crop&w=800&q=70",
  lumpia: "https://images.unsplash.com/photo-1562967914-608f82629710?auto=format&fit=crop&w=800&q=70",
  ramen: "https://images.unsplash.com/photo-1569718212165-3a8278d5f624?auto=format&fit=crop&w=800&q=70",
  coffee: "https://images.unsplash.com/photo-1504754524776-8f4f37790ca0?auto=format&fit=crop&w=800&q=70",
  sandwich: "https://images.unsplash.com/photo-1528735602780-2552fd46c7af?auto=format&fit=crop&w=800&q=70",
  friedchicken: "https://images.unsplash.com/photo-1626645738196-c2a7c87a8f58?auto=format&fit=crop&w=800&q=70",
};

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
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  return scrolled;
}

function Landing() {
  const navigate = useNavigate();
  const scrolled = useScrollTop();
  const [menuOpen, setMenuOpen] = useState(false);

  // ── Real food data from the BiteHub PostgreSQL backend ──
  const [featuredFoods, setFeaturedFoods] = useState([]);
  const [foodsLoading, setFoodsLoading] = useState(true);
  const [foodsError, setFoodsError] = useState("");

  const loadFeaturedFoods = async () => {
    setFoodsLoading(true);
    setFoodsError("");
    try {
      const api = createApiClient();
      const res = await api.get("/foods/featured?limit=8");
      // Backend returns { success, foods: [...] }
      const foods = Array.isArray(res?.data?.foods) ? res.data.foods : [];
      setFeaturedFoods(foods);
    } catch (err) {
      console.error("Failed to load featured foods:", err);
      setFoodsError("Unable to load featured foods. Please try again.");
    } finally {
      setFoodsLoading(false);
    }
  };

  useEffect(() => {
    loadFeaturedFoods();
  }, []);

  const foodImage = (food) => {
    // Use the real image stored in PostgreSQL (base64 data URL or path).
    if (food?.image && food.image.trim() !== "") return food.image;
    return fallbackImg; // clean default placeholder
  };

  const formatPrice = (price) => {
    const num = Number(price);
    if (Number.isNaN(num)) return "—";
    return "₱" + num.toLocaleString("en-PH", { maximumFractionDigits: 2 });
  };

  const goToFood = (food) => {
    // Existing food/menu browsing lives at /home. Navigating there keeps
    // using the existing marketplace rather than a duplicate food page.
    setMenuOpen(false);
    navigate("/home", {
      state: food?.restaurantId ? { focusRestaurant: food.restaurantId } : undefined,
    });
  };

  const handleAddToCart = async (food) => {
    // Uses the existing BiteHub cart API. If the user isn't logged in the
    // API returns 401, so route them to login to keep the flow working
    // without introducing a second cart system.
    const token = localStorage.getItem("authToken");
    if (!token || token === "null" || token === "undefined") {
      navigate("/login");
      return;
    }
    try {
      const api = createApiClient();
      await api.post("/cart/add", { foodId: food.id, quantity: 1 });
    } catch (err) {
      console.error("Add to cart failed:", err);
    }
  };

  const navLinks = [
    { label: "Home", href: "#home" },
    { label: "Restaurants", href: "#restaurants" },
    { label: "How It Works", href: "#how-it-works" },
    { label: "About", href: "#about" },
  ];

  const go = (path) => {
    setMenuOpen(false);
    navigate(path);
  };

  return (
    <div className="min-h-screen bg-white text-[#1c1917] font-sans">
      {/* ── NAVBAR ─────────────────────────────────────────────── */}
      <header
        className={`sticky top-0 z-50 transition-all duration-300 ${
          scrolled
            ? "bg-white/85 backdrop-blur-xl shadow-lg shadow-orange-100/40 border-b border-orange-50"
            : "bg-transparent border-b border-transparent"
        }`}
      >
        <nav className="mx-auto flex h-[72px] max-w-7xl items-center justify-between px-5 sm:px-8">
          {/* Logo */}
          <button onClick={() => go("/")} className="flex items-center gap-2.5">
            <img src={biteLogo} alt="BiteHub" className="h-10 w-10 object-contain" />
            <span className="text-[22px] font-extrabold tracking-tight text-[#1c1917]">
              Bite<span className="text-orange-500">Hub</span>
            </span>
          </button>

          {/* Desktop nav */}
          <div className="hidden items-center gap-8 lg:flex">
            {navLinks.map((l) => (
              <a
                key={l.label}
                href={l.href}
                className="text-[15px] font-medium text-[#57534e] transition-colors hover:text-orange-500"
              >
                {l.label}
              </a>
            ))}
          </div>

          {/* Desktop actions */}
          <div className="hidden items-center gap-3 lg:flex">
            <button
              onClick={() => go("/login")}
              className="rounded-full px-5 py-2.5 text-[15px] font-semibold text-[#1c1917] transition-colors hover:text-orange-500"
            >
              Log In
            </button>
            <button
              onClick={() => go("/register")}
              className="group rounded-full bg-orange-500 px-6 py-2.5 text-[15px] font-semibold text-white shadow-lg shadow-orange-500/30 transition-all hover:-translate-y-0.5 hover:bg-orange-600 hover:shadow-xl hover:shadow-orange-500/40"
            >
              Get Started
              <ArrowRight className="ml-1.5 inline h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </button>
          </div>

          {/* Mobile menu button */}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="rounded-lg p-2 text-[#1c1917] transition-colors hover:bg-orange-50 lg:hidden"
            aria-label="Toggle menu"
          >
            {menuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </nav>

        {/* Mobile menu */}
        {menuOpen && (
          <div className="border-t border-orange-50 bg-white/95 backdrop-blur-xl lg:hidden">
            <div className="mx-auto flex max-w-7xl flex-col gap-1 px-6 py-4">
              {navLinks.map((l) => (
                <a
                  key={l.label}
                  href={l.href}
                  onClick={() => setMenuOpen(false)}
                  className="rounded-xl px-3 py-3 text-[15px] font-medium text-[#57534e] transition-colors hover:bg-orange-50 hover:text-orange-500"
                >
                  {l.label}
                </a>
              ))}
              <div className="mt-3 flex flex-col gap-2 border-t border-orange-50 pt-4">
                <button
                  onClick={() => go("/login")}
                  className="rounded-xl border border-orange-200 px-4 py-3 text-[15px] font-semibold text-orange-600 transition-colors hover:bg-orange-50"
                >
                  Log In
                </button>
                <button
                  onClick={() => go("/register")}
                  className="rounded-xl bg-orange-500 px-4 py-3 text-[15px] font-semibold text-white shadow-lg shadow-orange-500/30"
                >
                  Get Started
                </button>
              </div>
            </div>
          </div>
        )}
      </header>

      {/* ── HERO ───────────────────────────────────────────────── */}
      <section id="home" className="relative overflow-hidden">
        {/* Soft background washes */}
        <div className="pointer-events-none absolute -top-32 -right-24 h-[480px] w-[480px] rounded-full bg-orange-100/70 blur-3xl" />
        <div className="pointer-events-none absolute top-40 -left-32 h-[420px] w-[420px] rounded-full bg-amber-50 blur-3xl" />

        <div className="relative mx-auto grid max-w-7xl items-center gap-14 px-5 pt-14 pb-20 sm:px-8 lg:grid-cols-2 lg:pt-20 lg:pb-28">
          {/* Hero text */}
          <div>
            <Reveal>
              <span className="inline-flex items-center gap-2 rounded-full border border-orange-200 bg-orange-50 px-4 py-1.5 text-[13px] font-semibold tracking-wide text-orange-600">
                <span className="text-sm">🍴</span> UNIVERSITY FOOD MARKETPLACE
              </span>
            </Reveal>
            <Reveal delay={80}>
              <h1 className="mt-6 text-[42px] font-extrabold leading-[1.05] tracking-tight text-[#1c1917] sm:text-[52px] lg:text-[60px]">
                Your Campus. <br />
                Your <span className="text-orange-500">Food.</span> <br />
                Your <span className="relative inline-block">Bite.
                  <svg className="absolute -bottom-2 left-0 w-full text-orange-300" viewBox="0 0 200 12" fill="none" preserveAspectRatio="none"><path d="M2 9C50 3 150 3 198 9" stroke="currentColor" strokeWidth="5" strokeLinecap="round"/></svg>
                </span>
              </h1>
            </Reveal>
            <Reveal delay={160}>
              <p className="mt-7 max-w-xl text-lg leading-relaxed text-[#57534e]">
                Discover your favorite campus restaurants, explore delicious meals, and order
                everything you need from one place.
              </p>
            </Reveal>
            <Reveal delay={240}>
              <div className="mt-9 flex flex-wrap items-center gap-4">
                <button
                  onClick={() => go("/register")}
                  className="group inline-flex items-center rounded-full bg-orange-500 px-8 py-4 text-base font-bold text-white shadow-xl shadow-orange-500/30 transition-all hover:-translate-y-0.5 hover:bg-orange-600 hover:shadow-2xl hover:shadow-orange-500/40"
                >
                  Get Started
                  <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
                </button>
                <button
                  onClick={() => go("/home")}
                  className="inline-flex items-center rounded-full border border-[#e7e5e4] bg-white px-8 py-4 text-base font-semibold text-[#1c1917] transition-all hover:-translate-y-0.5 hover:border-orange-300 hover:text-orange-600 hover:shadow-lg"
                >
                  Explore BiteHub
                  <ChevronRight className="ml-1 h-5 w-5" />
                </button>
              </div>
            </Reveal>
            <Reveal delay={320}>
              <p className="mt-6 text-[15px] text-[#78716c]">
                Already have an account?{" "}
                <button onClick={() => go("/login")} className="font-semibold text-orange-500 transition-colors hover:text-orange-600">
                  Log in
                </button>
              </p>
            </Reveal>
          </div>

          {/* Hero visual */}
          <Reveal delay={150} className="relative">
            <div className="relative">
              {/* Main app mockup */}
              <div className="relative mx-auto w-full max-w-[460px] rounded-[32px] border border-orange-100 bg-white p-4 shadow-2xl shadow-orange-100/60">
                {/* Mockup header */}
                <div className="flex items-center justify-between rounded-2xl bg-gradient-to-r from-orange-500 to-orange-600 px-4 py-3">
                  <div className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/20">
                      <ShoppingBag className="h-4 w-4 text-white" />
                    </div>
                    <span className="text-sm font-bold text-white">BiteHub</span>
                  </div>
                  <div className="relative">
                    <ShoppingCart className="h-5 w-5 text-white" />
                    <span className="absolute -right-1.5 -top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-white text-[10px] font-bold text-orange-600">
                      3
                    </span>
                  </div>
                </div>

                {/* Mockup search */}
                <div className="mt-4 flex items-center gap-2 rounded-full border border-[#f0eeed] bg-[#faf9f8] px-4 py-2.5">
                  <Search className="h-4 w-4 text-[#a8a29e]" />
                  <span className="text-[13px] text-[#a8a29e]">Search for food, restaurants...</span>
                </div>

                {/* Mockup categories */}
                <div className="mt-4 flex gap-2 overflow-hidden">
                  {["All", "Fast Food", "Filipino", "Drinks", "Desserts"].map((c, i) => (
                    <span
                      key={c}
                      className={`whitespace-nowrap rounded-full px-3 py-1.5 text-[11px] font-semibold ${
                        i === 0 ? "bg-orange-500 text-white" : "bg-[#f4f2f1] text-[#78716c]"
                      }`}
                    >
                      {c}
                    </span>
                  ))}
                </div>

                {/* Mockup restaurant cards */}
                <div className="mt-4 space-y-3">
                  {[
                    { img: foodImages.burger, name: "Campus Fast Food", cat: "Fast Food", time: "15-20 min", price: "₱85", rating: "4.8", item: "Classic Burger" },
                    { img: foodImages.adobo, name: "Kanto Grille", cat: "Filipino", time: "10-15 min", price: "₱65", rating: "4.7", item: "Pork Adobo Rice" },
                    { img: foodImages.milktea, name: "Brew & Chill", cat: "Drinks", time: "5-10 min", price: "₱49", rating: "4.9", item: "Fresh Milk Tea" },
                  ].map((r) => (
                    <div key={r.name} className="flex items-center gap-3 rounded-2xl border border-[#f0eeed] bg-white p-3 shadow-sm">
                      <img src={r.img} onError={(e) => (e.currentTarget.src = fallbackImg)} alt={r.name} className="h-14 w-14 rounded-xl object-cover" />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <p className="truncate text-[13px] font-bold text-[#1c1917]">{r.name}</p>
                          <span className="flex shrink-0 items-center gap-0.5 rounded-full bg-green-50 px-1.5 py-0.5 text-[10px] font-bold text-green-700">
                            <Star className="h-2.5 w-2.5 fill-current" /> {r.rating}
                          </span>
                        </div>
                        <p className="truncate text-[11px] text-[#a8a29e]">{r.item} · {r.cat} · {r.time}</p>
                        <p className="mt-0.5 text-[12px] font-bold text-orange-500">{r.price}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Floating card: Order confirmed */}
              <div className="bh-float absolute -left-6 top-14 hidden w-[170px] rounded-2xl border border-green-100 bg-white p-3 shadow-xl shadow-green-100/40 sm:block">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-100">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                  </div>
                  <div>
                    <p className="text-[11px] font-bold text-[#1c1917]">Order Confirmed</p>
                    <p className="text-[10px] text-[#78716c]">Your food is being prepared</p>
                  </div>
                </div>
              </div>

              {/* Floating card: Fast ordering */}
              <div className="bh-float-slow absolute -right-4 top-40 hidden w-[150px] rounded-2xl border border-orange-100 bg-white p-3 shadow-xl shadow-orange-100/40 md:block">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-orange-100">
                    <Zap className="h-4 w-4 text-orange-500" />
                  </div>
                  <div>
                    <p className="text-[11px] font-bold text-[#1c1917]">Fast Ordering</p>
                    <p className="text-[10px] text-[#78716c]">Order in a few clicks</p>
                  </div>
                </div>
              </div>

              {/* Floating card: Popular near you */}
              <div className="bh-float-alt absolute -bottom-6 left-6 hidden w-[160px] rounded-2xl border border-amber-100 bg-white p-3 shadow-xl shadow-amber-100/50 sm:block">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-100">
                    <Flame className="h-4 w-4 text-amber-600" />
                  </div>
                  <div>
                    <p className="text-[11px] font-bold text-[#1c1917]">Popular Near You</p>
                    <p className="text-[10px] text-[#78716c]">Student favorites</p>
                  </div>
                </div>
              </div>

              {/* Floating food elements */}
              <div className="bh-float-slow pointer-events-none absolute -right-8 top-4 hidden rounded-2xl bg-white p-2.5 text-4xl shadow-lg shadow-orange-100/60 lg:block">
                🍔
              </div>
              <div className="bh-float pointer-events-none absolute -left-10 bottom-24 hidden rounded-2xl bg-white p-2.5 text-4xl shadow-lg shadow-orange-100/60 lg:block">
                🍟
              </div>
              <div className="bh-float-alt pointer-events-none absolute -right-10 bottom-16 hidden rounded-2xl bg-white p-2.5 text-4xl shadow-lg shadow-orange-100/60 lg:block">
                🍕
              </div>
              <div className="bh-float pointer-events-none absolute -left-6 top-2 hidden rounded-2xl bg-white p-2.5 text-4xl shadow-lg shadow-orange-100/60 lg:block">
                🥤
              </div>
            </div>
          </Reveal>
        </div>

        {/* Hero trust strip */}
        <div className="relative mx-auto max-w-7xl px-5 pb-16 sm:px-8">
          <Reveal>
            <div className="grid grid-cols-1 gap-4 rounded-3xl border border-orange-50 bg-gradient-to-br from-orange-50/60 to-white p-6 sm:grid-cols-2 lg:grid-cols-4">
              {[
                { icon: <Store className="h-5 w-5" />, title: "Multiple Restaurants", desc: "Explore food from different campus restaurants" },
                { icon: <Zap className="h-5 w-5" />, title: "Easy Ordering", desc: "Order your favorite meals in just a few clicks" },
                { icon: <Bell className="h-5 w-5" />, title: "Order Updates", desc: "Stay updated from preparation to delivery" },
                { icon: <Wallet className="h-5 w-5" />, title: "Student-Friendly Meals", desc: "Discover affordable meals for your campus budget" },
              ].map((b) => (
                <div key={b.title} className="flex items-start gap-3 rounded-2xl bg-white p-4 shadow-sm">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-orange-50 text-orange-500">
                    {b.icon}
                  </div>
                  <div>
                    <p className="font-bold text-[#1c1917]">{b.title}</p>
                    <p className="mt-0.5 text-[13px] leading-snug text-[#78716c]">{b.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── FEATURES ───────────────────────────────────────────── */}
      <section id="about" className="relative bg-[#faf8f6] py-20 lg:py-28">
        <div className="mx-auto max-w-7xl px-5 sm:px-8">
          <Reveal className="mx-auto max-w-2xl text-center">
            <span className="inline-block rounded-full border border-orange-200 bg-orange-50 px-4 py-1.5 text-[13px] font-semibold text-orange-600">
              WHY BITEHUB
            </span>
            <h2 className="mt-5 text-3xl font-extrabold tracking-tight text-[#1c1917] sm:text-4xl lg:text-[42px]">
              Everything You Need to Eat Better on Campus
            </h2>
            <p className="mt-4 text-lg text-[#78716c]">
              BiteHub makes campus food ordering simple, convenient, and accessible.
            </p>
          </Reveal>

          <div className="mt-14 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[
              { icon: <Store className="h-6 w-6" />, title: "Discover Restaurants", desc: "Browse available campus restaurants and food vendors in one marketplace." },
              { icon: <ClipboardList className="h-6 w-6" />, title: "Browse Menus", desc: "Explore menus, food descriptions, prices, categories, and available sizes." },
              { icon: <ShoppingBag className="h-6 w-6" />, title: "Smart Cart", desc: "Add multiple food items to your cart without being redirected away from the current page." },
              { icon: <Zap className="h-6 w-6" />, title: "Easy Ordering", desc: "Place food orders quickly with a simple and intuitive checkout experience." },
              { icon: <MapPin className="h-6 w-6" />, title: "Order Tracking", desc: "Follow the progress of your order from confirmation to preparation and delivery." },
              { icon: <Wallet className="h-6 w-6" />, title: "Budget-Friendly Meals", desc: "Easily discover affordable meals designed for students and university employees." },
            ].map((f, i) => (
              <Reveal key={f.title} delay={(i % 3) * 90}>
                <div className="group h-full rounded-3xl border border-[#eeeceb] bg-white p-7 shadow-sm transition-all duration-300 hover:-translate-y-1.5 hover:border-orange-200 hover:shadow-xl hover:shadow-orange-100/50">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-orange-50 text-orange-500 transition-all duration-300 group-hover:bg-orange-500 group-hover:text-white group-hover:shadow-lg group-hover:shadow-orange-200/50">
                    {f.icon}
                  </div>
                  <h3 className="mt-6 text-xl font-bold text-[#1c1917]">{f.title}</h3>
                  <p className="mt-2.5 leading-relaxed text-[#78716c]">{f.desc}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ───────────────────────────────────────── */}
      <section id="how-it-works" className="py-20 lg:py-28">
        <div className="mx-auto max-w-7xl px-5 sm:px-8">
          <Reveal className="mx-auto max-w-2xl text-center">
            <span className="inline-block rounded-full border border-orange-200 bg-orange-50 px-4 py-1.5 text-[13px] font-semibold text-orange-600">
              HOW IT WORKS
            </span>
            <h2 className="mt-5 text-3xl font-extrabold tracking-tight text-[#1c1917] sm:text-4xl">
              From Discovery to Your Doorstep
            </h2>
            <p className="mt-4 text-lg text-[#78716c]">
              Ordering food on campus has never been easier.
            </p>
          </Reveal>

          <div className="relative mt-16">
            {/* connecting line */}
            <div className="absolute left-1/2 top-8 hidden h-0.5 w-2/3 -translate-x-1/2 bg-gradient-to-r from-orange-200 via-orange-400 to-orange-200 lg:block" />
            <div className="grid grid-cols-1 gap-12 lg:grid-cols-3 lg:gap-8">
              {[
                { num: "01", title: "DISCOVER", desc: "Find restaurants and meals available around your campus.", icon: <Search className="h-6 w-6" /> },
                { num: "02", title: "ORDER", desc: "Choose your food, customize your order, and add it to your cart.", icon: <ShoppingBag className="h-6 w-6" /> },
                { num: "03", title: "ENJOY", desc: "Track your order and enjoy your meal when it arrives.", icon: <Salad className="h-6 w-6" /> },
              ].map((s, i) => (
                <Reveal key={s.num} delay={i * 120}>
                  <div className="relative text-center lg:pt-0">
                    <div className="relative mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-orange-500 text-white shadow-xl shadow-orange-500/30">
                      {s.icon}
                      <span className="absolute -right-2 -top-2 rounded-full bg-white px-2 py-0.5 text-[11px] font-bold text-orange-500 shadow">
                        {s.num}
                      </span>
                    </div>
                    <h3 className="text-2xl font-bold tracking-wide text-[#1c1917]">{s.title}</h3>
                    <p className="mx-auto mt-3 max-w-xs text-[#78716c]">{s.desc}</p>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── RESTAURANT SHOWCASE ────────────────────────────────── */}
      <section id="restaurants" className="bg-[#faf8f6] py-20 lg:py-28">
        <div className="mx-auto max-w-7xl px-5 sm:px-8">
          <Reveal className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-extrabold tracking-tight text-[#1c1917] sm:text-4xl lg:text-[42px]">
              Your Favorite Food, All in One Place.
            </h2>
            <p className="mt-4 text-lg text-[#78716c]">
              Discover delicious meals from restaurants and food vendors around your campus.
            </p>
          </Reveal>

          <div className="mt-14 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {/* Loading skeletons */}
            {foodsLoading &&
              Array.from({ length: 8 }).map((_, i) => (
                <div key={`skeleton-${i}`} className="overflow-hidden rounded-3xl border border-[#eeeceb] bg-white shadow-sm">
                  <div className="h-44 animate-pulse bg-[#f2f0ef]" />
                  <div className="p-5">
                    <div className="h-4 w-2/3 animate-pulse rounded bg-[#eeeceb]" />
                    <div className="mt-2 h-3.5 w-full animate-pulse rounded bg-[#f4f3f2]" />
                    <div className="mt-4 h-3.5 w-1/3 animate-pulse rounded bg-[#f4f3f2]" />
                  </div>
                </div>
              ))}

            {/* Error state */}
            {!foodsLoading && foodsError && (
              <div className="col-span-full rounded-3xl border border-orange-100 bg-orange-50/60 p-10 text-center">
                <p className="text-[#a16207]">{foodsError}</p>
                <button
                  onClick={loadFeaturedFoods}
                  className="mt-4 inline-flex items-center rounded-full bg-orange-500 px-6 py-2.5 text-sm font-bold text-white transition-colors hover:bg-orange-600"
                >
                  <RefreshCw className="mr-2 h-4 w-4" /> Try Again
                </button>
              </div>
            )}

            {/* Empty state */}
            {!foodsLoading && !foodsError && featuredFoods.length === 0 && (
              <div className="col-span-full rounded-3xl border border-[#eeeceb] bg-white p-10 text-center">
                <Salad className="mx-auto h-10 w-10 text-orange-300" />
                <p className="mt-3 text-[#78716c]">No featured foods available yet.</p>
              </div>
            )}

            {/* Real food cards from the BiteHub backend */}
            {!foodsLoading &&
              !foodsError &&
              featuredFoods.map((food, i) => (
                <Reveal key={food.id} delay={(i % 4) * 80}>
                  <button
                    onClick={() => goToFood(food)}
                    className="group w-full overflow-hidden rounded-3xl border border-[#eeeceb] bg-white text-left shadow-sm transition-all duration-300 hover:-translate-y-1.5 hover:border-orange-200 hover:shadow-xl hover:shadow-orange-100/50"
                  >
                    <div className="relative h-44 overflow-hidden">
                      <img
                        src={foodImage(food)}
                        onError={(e) => (e.currentTarget.src = fallbackImg)}
                        alt={food.name}
                        loading="lazy"
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                      />
                      <span className="absolute left-3 top-3 rounded-full bg-white/90 px-2.5 py-1 text-[11px] font-bold text-[#1c1917] backdrop-blur">
                        {food.category}
                      </span>
                      {Number(food.rating) > 0 && (
                        <span className="absolute right-3 top-3 flex items-center gap-1 rounded-full bg-green-500 px-2 py-1 text-[11px] font-bold text-white">
                          <Star className="h-3 w-3 fill-current" /> {food.rating}
                        </span>
                      )}
                    </div>
                    <div className="p-5">
                      <h3 className="truncate text-lg font-bold text-[#1c1917] group-hover:text-orange-500">{food.name}</h3>
                      <p className="mt-1 truncate text-sm text-[#78716c]">{food.restaurant}</p>
                      <div className="mt-3 flex items-center justify-between">
                        <span className="text-sm font-bold text-[#78716c]">{food.category}</span>
                        <span className="text-lg font-extrabold text-orange-500">{formatPrice(food.price)}</span>
                      </div>
                    </div>
                  </button>
                </Reveal>
              ))}
          </div>

          <Reveal className="mt-12 text-center">
            <button
              onClick={() => go("/home")}
              className="group inline-flex items-center rounded-full bg-orange-500 px-8 py-4 text-base font-bold text-white shadow-xl shadow-orange-500/30 transition-all hover:-translate-y-0.5 hover:bg-orange-600 hover:shadow-2xl"
            >
              Explore Restaurants
              <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
            </button>
          </Reveal>
        </div>
      </section>

      {/* ── BUDGET MEALS ───────────────────────────────────────── */}
      <section className="py-20 lg:py-28">
        <div className="mx-auto max-w-7xl px-5 sm:px-8">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <Reveal>
              <span className="inline-block rounded-full border border-orange-200 bg-orange-50 px-4 py-1.5 text-[13px] font-semibold text-orange-600">
                STUDENT-FRIENDLY
              </span>
              <h2 className="mt-5 text-3xl font-extrabold tracking-tight text-[#1c1917] sm:text-4xl lg:text-[42px]">
                Good Food Without Breaking Your Budget.
              </h2>
              <p className="mt-4 text-lg text-[#78716c]">
                Find affordable meals and student-friendly food options available around campus — without
                compromising on taste.
              </p>
              <button
                onClick={() => go("/home")}
                className="group mt-8 inline-flex items-center rounded-full bg-orange-500 px-8 py-4 text-base font-bold text-white shadow-xl shadow-orange-500/30 transition-all hover:-translate-y-0.5 hover:bg-orange-600 hover:shadow-2xl"
              >
                Find Budget Meals
                <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
              </button>
            </Reveal>

            <Reveal delay={120}>
              <div className="grid gap-4 sm:grid-cols-2">
                {/* Skeleton */}
                {foodsLoading &&
                  Array.from({ length: 4 }).map((_, i) => (
                    <div key={`bs-${i}`} className="overflow-hidden rounded-3xl border border-[#eeeceb] bg-white shadow-sm">
                      <div className="h-32 animate-pulse bg-[#f2f0ef]" />
                      <div className="p-4">
                        <div className="h-4 w-2/3 animate-pulse rounded bg-[#eeeceb]" />
                        <div className="mt-2 h-3 w-1/2 animate-pulse rounded bg-[#f4f3f2]" />
                      </div>
                    </div>
                  ))}

                {/* Error / empty for the budget section */}
                {!foodsLoading && (foodsError || featuredFoods.length === 0) && (
                  <div className="col-span-2 rounded-3xl border border-[#eeeceb] bg-[#faf8f6] p-8 text-center">
                    <p className="text-[#a8a29e]">
                      {foodsError ? "Budget meals aren't available right now." : "No budget-friendly meals available yet."}
                    </p>
                    {foodsError && (
                      <button
                        onClick={loadFeaturedFoods}
                        className="mt-3 inline-flex items-center rounded-full bg-orange-500 px-6 py-2.5 text-sm font-bold text-white transition-colors hover:bg-orange-600"
                      >
                        <RefreshCw className="mr-2 h-4 w-4" /> Try Again
                      </button>
                    )}
                  </div>
                )}

                {/* Real budget-friendly food cards */}
                {!foodsLoading &&
                  !foodsError &&
                  featuredFoods
                    .filter(
                      (f) =>
                        Number(f.price) > 0
                    )
                    .slice()
                    .sort(
                      (a, b) =>
                        (String(a.category).toLowerCase() === "budget meal" ? 0 : 1) -
                        (String(b.category).toLowerCase() === "budget meal" ? 0 : 1) ||
                        Number(a.price) - Number(b.price)
                    )
                    .slice(0, 4)
                    .map((b) => (
                      <button
                        key={b.id}
                        onClick={() => goToFood(b)}
                        className="overflow-hidden rounded-3xl border border-[#eeeceb] bg-white text-left shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
                      >
                        <div className="relative h-32 overflow-hidden">
                          <img
                            src={foodImage(b)}
                            onError={(e) => (e.currentTarget.src = fallbackImg)}
                            alt={b.name}
                            loading="lazy"
                            className="h-full w-full object-cover transition-transform duration-500 hover:scale-110"
                          />
                          <span className="absolute left-3 top-3 rounded-full bg-white/90 px-2 py-0.5 text-[11px] font-bold text-[#1c1917]">{b.category}</span>
                        </div>
                        <div className="p-4">
                          <div className="flex items-center justify-between">
                            <h3 className="truncate font-bold text-[#1c1917]">{b.name}</h3>
                            <span className="text-lg font-extrabold text-orange-500">{formatPrice(b.price)}</span>
                          </div>
                          <div className="mt-1 flex items-center justify-between">
                            <p className="truncate text-[12px] text-[#a8a29e]">{b.restaurant}</p>
                            <span className="flex items-center gap-1 rounded-full bg-orange-50 px-3 py-1.5 text-[12px] font-bold text-orange-600">
                              <Plus size={14} /> Order
                            </span>
                          </div>
                        </div>
                      </button>
                    ))}
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ── RESTAURANT OWNERS ──────────────────────────────────── */}
      <section id="for-owners" className="relative overflow-hidden bg-[#1c1917] py-20 lg:py-28">
        <div className="pointer-events-none absolute -right-24 -top-24 h-96 w-96 rounded-full bg-orange-500/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 -left-24 h-96 w-96 rounded-full bg-orange-500/10 blur-3xl" />
        <div className="relative mx-auto grid max-w-7xl items-center gap-14 px-5 sm:px-8 lg:grid-cols-2">
          <div>
            <Reveal>
              <span className="inline-block rounded-full border border-orange-500/40 bg-orange-500/10 px-4 py-1.5 text-[13px] font-semibold text-orange-400">
                FOR RESTAURANT OWNERS
              </span>
            </Reveal>
            <Reveal delay={80}>
              <h2 className="mt-5 text-3xl font-extrabold tracking-tight text-white sm:text-4xl lg:text-[42px]">
                Own a Food Business?
              </h2>
            </Reveal>
            <Reveal delay={150}>
              <p className="mt-4 max-w-lg text-lg leading-relaxed text-[#a8a29e]">
                Bring your restaurant to the BiteHub marketplace and reach more students and university
                customers. Manage orders, menus, and sales all in one place.
              </p>
            </Reveal>
            <Reveal delay={220}>
              <ul className="mt-7 space-y-3">
                {["Reach thousands of hungry students", "Manage orders in real time", "Track sales and popular items"].map((t) => (
                  <li key={t} className="flex items-center gap-3 text-[#e7e5e4]">
                    <Check className="h-5 w-5 shrink-0 text-orange-400" /> <span>{t}</span>
                  </li>
                ))}
              </ul>
            </Reveal>
            <Reveal delay={300}>
              <button
                onClick={() => go("/restaurant-register")}
                className="group mt-9 inline-flex items-center rounded-full bg-orange-500 px-8 py-4 text-base font-bold text-white shadow-xl shadow-orange-500/30 transition-all hover:-translate-y-0.5 hover:bg-orange-600 hover:shadow-2xl"
              >
                Become a Restaurant Partner
                <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
              </button>
            </Reveal>
          </div>

          {/* Owner dashboard mockup */}
          <Reveal delay={150}>
            <div className="relative">
              <div className="rounded-3xl border border-white/10 bg-white p-4 shadow-2xl shadow-black/40">
                <div className="flex items-center justify-between border-b border-[#f0eeed] pb-3">
                  <span className="text-sm font-bold text-[#1c1917]">Restaurant Dashboard</span>
                  <span className="flex items-center gap-1.5 rounded-full bg-green-100 px-2.5 py-1 text-[11px] font-bold text-green-700">
                    <span className="h-1.5 w-1.5 rounded-full bg-green-500" /> Open
                  </span>
                </div>
                {/* stat row */}
                <div className="mt-4 grid grid-cols-3 gap-3">
                  {[
                    { icon: <Package className="h-4 w-4" />, label: "Orders", value: "24" },
                    { icon: <TrendingUp className="h-4 w-4" />, label: "Sales", value: "₱1.2k" },
                    { icon: <Flame className="h-4 w-4" />, label: "Popular", value: "Adobo" },
                  ].map((s) => (
                    <div key={s.label} className="rounded-xl bg-orange-50 p-3">
                      <div className="text-orange-500">{s.icon}</div>
                      <p className="mt-1 text-lg font-extrabold text-[#1c1917]">{s.value}</p>
                      <p className="text-[11px] text-[#a8a29e]">{s.label}</p>
                    </div>
                  ))}
                </div>
                {/* orders list */}
                <div className="mt-4 space-y-2">
                  {[
                    { name: "Beef Tapsilog", amt: "₱65", qty: "×2", status: "Preparing" },
                    { name: "Chicken Rice Bowl", amt: "₱55", qty: "×1", status: "New" },
                    { name: "Fresh Milk Tea", amt: "₱49", qty: "×3", status: "Out for delivery" },
                  ].map((o) => (
                    <div key={o.name} className="flex items-center justify-between rounded-xl border border-[#f0eeed] p-2.5">
                      <div className="flex items-center gap-2">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-100 text-orange-500">
                          <Utensils className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="text-[12px] font-bold text-[#1c1917]">{o.name} {o.qty}</p>
                          <p className="text-[11px] text-orange-500">{o.amt}</p>
                        </div>
                      </div>
                      <span className="rounded-full bg-orange-50 px-2 py-0.5 text-[10px] font-bold text-orange-600">{o.status}</span>
                    </div>
                  ))}
                </div>
                {/* bottom summary */}
                <div className="mt-4 flex items-center justify-between rounded-xl bg-[#faf9f8] p-3">
                  <div className="flex items-center gap-2 text-[12px] text-[#78716c]">
                    <BarChart3 className="h-4 w-4 text-orange-500" /> Sales this week
                  </div>
                  <span className="text-sm font-extrabold text-[#1c1917]">₱8,420</span>
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── FINAL CTA ──────────────────────────────────────────── */}
      <section className="px-5 py-20 sm:px-8 lg:py-28">
        <Reveal className="mx-auto max-w-5xl">
          <div className="relative overflow-hidden rounded-[40px] bg-gradient-to-br from-orange-500 to-orange-600 px-8 py-16 text-center shadow-2xl shadow-orange-500/30 sm:px-16">
            <div className="pointer-events-none absolute -left-10 -top-10 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
            <div className="pointer-events-none absolute -bottom-10 -right-10 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
            <div className="relative">
              <h2 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl lg:text-[44px]">
                Ready to Find Your Next Favorite Meal?
              </h2>
              <p className="mx-auto mt-4 max-w-xl text-lg text-orange-50">
                Join BiteHub and make campus food ordering easier.
              </p>
              <div className="mt-9 flex flex-wrap items-center justify-center gap-4">
                <button
                  onClick={() => go("/register")}
                  className="rounded-full bg-white px-8 py-4 text-base font-bold text-orange-600 shadow-xl transition-all hover:-translate-y-0.5 hover:shadow-2xl"
                >
                  Get Started
                </button>
                <button
                  onClick={() => go("/login")}
                  className="rounded-full border-2 border-white/60 px-8 py-4 text-base font-bold text-white transition-all hover:-translate-y-0.5 hover:bg-white/10"
                >
                  Log In
                </button>
              </div>
            </div>
          </div>
        </Reveal>
      </section>

      {/* ── FOOTER ─────────────────────────────────────────────── */}
      <footer className="border-t border-[#f0eeed] bg-[#faf9f8] py-14">
        <div className="mx-auto max-w-7xl px-5 sm:px-8">
          <div className="flex flex-col gap-10 md:flex-row md:justify-between">
            <div className="max-w-xs">
              <div className="flex items-center gap-2.5">
                <img src={biteLogo} alt="BiteHub" className="h-10 w-10 object-contain" />
                <span className="text-xl font-extrabold tracking-tight text-[#1c1917]">
                  Bite<span className="text-orange-500">Hub</span>
                </span>
              </div>
              <p className="mt-3 text-sm text-[#78716c]">Your university food marketplace.</p>
            </div>
            <div className="grid grid-cols-2 gap-x-16 gap-y-3 sm:grid-cols-3">
              {[
                { label: "Home", href: "#home" },
                { label: "Restaurants", href: "#restaurants" },
                { label: "How It Works", href: "#how-it-works" },
                { label: "About", href: "#about" },
                { label: "Contact", href: "#contact" },
                { label: "Login", href: "#", action: "login" },
                { label: "Sign Up", href: "#", action: "register" },
              ].map((l) => (
                <a
                  key={l.label}
                  href={l.href}
                  onClick={(e) => {
                    if (l.action) {
                      e.preventDefault();
                      go(l.action === "login" ? "/login" : "/register");
                    }
                  }}
                  className="text-sm font-medium text-[#57534e] transition-colors hover:text-orange-500"
                >
                  {l.label}
                </a>
              ))}
            </div>
          </div>
          <div id="contact" className="mt-12 border-t border-[#eeeceb] pt-6" />
          <p className="text-sm text-[#a8a29e]">© 2026 BiteHub. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}

export default Landing;
