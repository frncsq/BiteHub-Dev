import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Menu, X, Search, Star, ChevronRight, ShoppingBag, ShoppingCart,
  MapPin, Check, CheckCircle2, Zap, ChefHat, Utensils, Salad,
  Wallet, Bell, ArrowRight, Store, Package, BarChart3, TrendingUp,
  ClipboardList, Flame, Plus, RefreshCw, Quote,
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

  const [featuredFoods, setFeaturedFoods] = useState([]);
  const [foodsLoading, setFoodsLoading] = useState(true);
  const [foodsError, setFoodsError] = useState("");

  const loadFeaturedFoods = async () => {
    setFoodsLoading(true);
    setFoodsError("");
    try {
      const api = createApiClient();
      const res = await api.get("/foods/featured?limit=8");
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
    if (food?.image && food.image.trim() !== "") return food.image;
    return fallbackImg;
  };

  const formatPrice = (price) => {
    const num = Number(price);
    if (Number.isNaN(num)) return "—";
    return "₱" + num.toLocaleString("en-PH", { maximumFractionDigits: 2 });
  };

  const goToFood = (food) => {
    setMenuOpen(false);
    navigate("/home", {
      state: food?.restaurantId ? { focusRestaurant: food.restaurantId } : undefined,
    });
  };

  const handleAddToCart = async (food) => {
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
    <div className="min-h-screen bg-[#FAFAFA] text-[#171717] font-sans">

      {/* NAVBAR */}
      <header
        className={`sticky top-0 z-50 transition-all duration-200 ${
          scrolled
            ? "bg-white border-b border-[#E5E7EB]"
            : "bg-[#FAFAFA] border-b border-transparent"
        }`}
      >
        <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5 sm:px-8">
          <button onClick={() => go("/")} className="flex items-center gap-2.5">
            <img src={biteLogo} alt="BiteHub" className="h-9 w-9 object-contain" />
            <span className="text-[20px] font-bold tracking-tight text-[#171717]">
              Bite<span className="text-[#EA580C]">Hub</span>
            </span>
          </button>

          <div className="hidden items-center gap-8 lg:flex">
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

          <div className="hidden items-center gap-3 lg:flex">
            <button
              onClick={() => go("/login")}
              className="rounded-lg px-5 py-2 text-sm font-medium text-[#171717] transition-colors hover:text-[#EA580C]"
            >
              Log In
            </button>
            <button
              onClick={() => go("/register")}
              className="rounded-lg bg-[#EA580C] px-5 py-2 text-sm font-medium text-white transition-all hover:bg-[#C2410C]"
            >
              Get Started
            </button>
          </div>

          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="rounded-lg p-2 text-[#171717] transition-colors hover:bg-[#E5E7EB] lg:hidden"
            aria-label="Toggle menu"
          >
            {menuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </nav>

        {menuOpen && (
          <div className="border-t border-[#E5E7EB] bg-white lg:hidden">
            <div className="mx-auto flex max-w-7xl flex-col gap-1 px-6 py-4">
              {navLinks.map((l) => (
                <a
                  key={l.label}
                  href={l.href}
                  onClick={() => setMenuOpen(false)}
                  className="rounded-lg px-3 py-3 text-sm font-medium text-[#6B7280] transition-colors hover:bg-[#F3F4F6] hover:text-[#EA580C]"
                >
                  {l.label}
                </a>
              ))}
              <div className="mt-3 flex flex-col gap-2 border-t border-[#E5E7EB] pt-4">
                <button
                  onClick={() => go("/login")}
                  className="rounded-lg border border-[#E5E7EB] px-4 py-3 text-sm font-medium text-[#171717] transition-colors hover:bg-[#F3F4F6]"
                >
                  Log In
                </button>
                <button
                  onClick={() => go("/register")}
                  className="rounded-lg bg-[#EA580C] px-4 py-3 text-sm font-medium text-white"
                >
                  Get Started
                </button>
              </div>
            </div>
          </div>
        )}
      </header>

      {/* HERO */}
      <section id="home" className="relative overflow-hidden bg-gradient-to-b from-orange-50 to-[#FAFAFA]">
        <div className="relative mx-auto grid max-w-7xl items-center gap-12 px-5 pt-16 pb-20 sm:px-8 lg:grid-cols-2 lg:pt-24 lg:pb-28">
          <div>
            <Reveal>
              <span className="inline-flex items-center gap-2 rounded-full border border-orange-200 bg-white px-4 py-1.5 text-xs font-semibold tracking-wide text-[#EA580C]">
                <span className="text-sm">🍴</span> UNIVERSITY FOOD MARKETPLACE
              </span>
            </Reveal>
            <Reveal delay={80}>
              <h1 className="mt-6 text-[40px] font-extrabold leading-[1.08] tracking-tight text-[#171717] sm:text-[50px] lg:text-[58px]">
                Your Campus. <br />
                Your <span className="text-[#EA580C]">Food.</span> <br />
                Your <span className="relative inline-block">Bite.
                  <svg className="absolute -bottom-2 left-0 w-full text-orange-300" viewBox="0 0 200 12" fill="none" preserveAspectRatio="none"><path d="M2 9C50 3 150 3 198 9" stroke="currentColor" strokeWidth="5" strokeLinecap="round"/></svg>
                </span>
              </h1>
            </Reveal>
            <Reveal delay={160}>
              <p className="mt-7 max-w-xl text-lg leading-relaxed text-[#6B7280]">
                Discover your favorite campus restaurants, explore delicious meals, and order
                everything you need from one place.
              </p>
            </Reveal>
            <Reveal delay={240}>
              <div className="mt-9 flex flex-wrap items-center gap-4">
                <button
                  onClick={() => go("/register")}
                  className="group inline-flex items-center rounded-lg bg-[#EA580C] px-7 py-3.5 text-base font-semibold text-white transition-all hover:bg-[#C2410C]"
                >
                  Get Started
                  <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
                </button>
                <button
                  onClick={() => go("/home")}
                  className="inline-flex items-center rounded-lg border border-[#E5E7EB] bg-white px-7 py-3.5 text-base font-semibold text-[#171717] transition-all hover:border-[#EA580C] hover:text-[#EA580C]"
                >
                  Explore BiteHub
                  <ChevronRight className="ml-1 h-5 w-5" />
                </button>
              </div>
            </Reveal>
            <Reveal delay={320}>
              <p className="mt-6 text-sm text-[#6B7280]">
                Already have an account?{" "}
                <button onClick={() => go("/login")} className="font-semibold text-[#EA580C] transition-colors hover:text-[#C2410C]">
                  Log in
                </button>
              </p>
            </Reveal>
          </div>

          <Reveal delay={150} className="relative">
            <div className="relative">
              <div className="relative mx-auto w-full max-w-[440px] rounded-2xl border border-[#E5E7EB] bg-white p-4">
                <div className="flex items-center justify-between rounded-lg bg-[#EA580C] px-4 py-3">
                  <div className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-md bg-white/20">
                      <ShoppingBag className="h-4 w-4 text-white" />
                    </div>
                    <span className="text-sm font-bold text-white">BiteHub</span>
                  </div>
                  <div className="relative">
                    <ShoppingCart className="h-5 w-5 text-white" />
                    <span className="absolute -right-1.5 -top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-white text-[10px] font-bold text-[#EA580C]">
                      3
                    </span>
                  </div>
                </div>

                <div className="mt-4 flex items-center gap-2 rounded-lg border border-[#E5E7EB] bg-[#FAFAFA] px-4 py-2.5">
                  <Search className="h-4 w-4 text-[#A0A0A0]" />
                  <span className="text-[13px] text-[#A0A0A0]">Search for food, restaurants...</span>
                </div>

                <div className="mt-4 flex gap-2 overflow-hidden">
                  {["All", "Fast Food", "Filipino", "Drinks", "Desserts"].map((c, i) => (
                    <span
                      key={c}
                      className={`whitespace-nowrap rounded-lg px-3 py-1.5 text-[11px] font-semibold ${
                        i === 0 ? "bg-[#EA580C] text-white" : "bg-[#F3F4F6] text-[#6B7280]"
                      }`}
                    >
                      {c}
                    </span>
                  ))}
                </div>

                <div className="mt-4 space-y-3">
                  {[
                    { img: foodImages.burger, name: "Campus Fast Food", cat: "Fast Food", time: "15-20 min", price: "₱85", rating: "4.8", item: "Classic Burger" },
                    { img: foodImages.adobo, name: "Kanto Grille", cat: "Filipino", time: "10-15 min", price: "₱65", rating: "4.7", item: "Pork Adobo Rice" },
                    { img: foodImages.milktea, name: "Brew & Chill", cat: "Drinks", time: "5-10 min", price: "₱49", rating: "4.9", item: "Fresh Milk Tea" },
                  ].map((r) => (
                    <div key={r.name} className="flex items-center gap-3 rounded-xl border border-[#E5E7EB] bg-white p-3">
                      <img src={r.img} onError={(e) => (e.currentTarget.src = fallbackImg)} alt={r.name} className="h-14 w-14 rounded-lg object-cover" />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <p className="truncate text-[13px] font-bold text-[#171717]">{r.name}</p>
                          <span className="flex shrink-0 items-center gap-0.5 rounded-full bg-green-50 px-1.5 py-0.5 text-[10px] font-bold text-green-700">
                            <Star className="h-2.5 w-2.5 fill-current" /> {r.rating}
                          </span>
                        </div>
                        <p className="truncate text-[11px] text-[#A0A0A0]">{r.item} · {r.cat} · {r.time}</p>
                        <p className="mt-0.5 text-[12px] font-bold text-[#EA580C]">{r.price}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bh-float absolute -left-6 top-14 hidden w-[170px] rounded-xl border border-[#E5E7EB] bg-white p-3 sm:block">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-50">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                  </div>
                  <div>
                    <p className="text-[11px] font-bold text-[#171717]">Order Confirmed</p>
                    <p className="text-[10px] text-[#6B7280]">Your food is being prepared</p>
                  </div>
                </div>
              </div>

              <div className="bh-float-slow absolute -right-4 top-40 hidden w-[150px] rounded-xl border border-[#E5E7EB] bg-white p-3 md:block">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-orange-50">
                    <Zap className="h-4 w-4 text-[#EA580C]" />
                  </div>
                  <div>
                    <p className="text-[11px] font-bold text-[#171717]">Fast Ordering</p>
                    <p className="text-[10px] text-[#6B7280]">Order in a few clicks</p>
                  </div>
                </div>
              </div>

              <div className="bh-float-alt absolute -bottom-6 left-6 hidden w-[160px] rounded-xl border border-[#E5E7EB] bg-white p-3 sm:block">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-orange-50">
                    <Flame className="h-4 w-4 text-[#EA580C]" />
                  </div>
                  <div>
                    <p className="text-[11px] font-bold text-[#171717]">Popular Near You</p>
                    <p className="text-[10px] text-[#6B7280]">Student favorites</p>
                  </div>
                </div>
              </div>

              <div className="bh-float-slow pointer-events-none absolute -right-8 top-4 hidden rounded-xl bg-white border border-[#E5E7EB] p-2.5 text-4xl lg:block">
                🍔
              </div>
              <div className="bh-float pointer-events-none absolute -left-10 bottom-24 hidden rounded-xl bg-white border border-[#E5E7EB] p-2.5 text-4xl lg:block">
                🍟
              </div>
              <div className="bh-float-alt pointer-events-none absolute -right-10 bottom-16 hidden rounded-xl bg-white border border-[#E5E7EB] p-2.5 text-4xl lg:block">
                🍕
              </div>
              <div className="bh-float pointer-events-none absolute -left-6 top-2 hidden rounded-xl bg-white border border-[#E5E7EB] p-2.5 text-4xl lg:block">
                🥤
              </div>
            </div>
          </Reveal>
        </div>

        <div className="relative mx-auto max-w-7xl px-5 pb-16 sm:px-8">
          <Reveal>
            <div className="grid grid-cols-1 gap-4 rounded-xl border border-[#E5E7EB] bg-white p-6 sm:grid-cols-2 lg:grid-cols-4">
              {[
                { icon: <Store className="h-5 w-5" />, title: "Multiple Restaurants", desc: "Explore food from different campus restaurants" },
                { icon: <Zap className="h-5 w-5" />, title: "Easy Ordering", desc: "Order your favorite meals in just a few clicks" },
                { icon: <Bell className="h-5 w-5" />, title: "Order Updates", desc: "Stay updated from preparation to delivery" },
                { icon: <Wallet className="h-5 w-5" />, title: "Student-Friendly Meals", desc: "Discover affordable meals for your campus budget" },
              ].map((b) => (
                <div key={b.title} className="flex items-start gap-3 rounded-xl bg-[#FAFAFA] p-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-orange-50 text-[#EA580C]">
                    {b.icon}
                  </div>
                  <div>
                    <p className="font-semibold text-[#171717]">{b.title}</p>
                    <p className="mt-0.5 text-[13px] leading-snug text-[#6B7280]">{b.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      {/* FEATURES */}
      <section id="about" className="bg-[#FAFAFA] py-20 lg:py-28">
        <div className="mx-auto max-w-7xl px-5 sm:px-8">
          <Reveal className="mx-auto max-w-2xl text-center">
            <span className="inline-block rounded-full border border-orange-200 bg-orange-50 px-4 py-1.5 text-xs font-semibold text-[#EA580C]">
              WHY BITEHUB
            </span>
            <h2 className="mt-5 text-3xl font-extrabold tracking-tight text-[#171717] sm:text-4xl lg:text-[42px]">
              Everything You Need to Eat Better on Campus
            </h2>
            <p className="mt-4 text-lg text-[#6B7280]">
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
                <div className="group h-full rounded-xl border border-[#E5E7EB] bg-white p-7 transition-all duration-200 hover:border-[#EA580C] hover:shadow-lg hover:shadow-orange-50">
                  <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-orange-50 text-[#EA580C] transition-all duration-200 group-hover:bg-[#EA580C] group-hover:text-white">
                    {f.icon}
                  </div>
                  <h3 className="mt-6 text-xl font-bold text-[#171717]">{f.title}</h3>
                  <p className="mt-2.5 leading-relaxed text-[#6B7280]">{f.desc}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="how-it-works" className="bg-white py-20 lg:py-28">
        <div className="mx-auto max-w-7xl px-5 sm:px-8">
          <Reveal className="mx-auto max-w-2xl text-center">
            <span className="inline-block rounded-full border border-orange-200 bg-orange-50 px-4 py-1.5 text-xs font-semibold text-[#EA580C]">
              HOW IT WORKS
            </span>
            <h2 className="mt-5 text-3xl font-extrabold tracking-tight text-[#171717] sm:text-4xl">
              From Discovery to Your Doorstep
            </h2>
            <p className="mt-4 text-lg text-[#6B7280]">
              Ordering food on campus has never been easier.
            </p>
          </Reveal>

          <div className="relative mt-16">
            <div className="absolute left-1/2 top-8 hidden h-0.5 w-2/3 -translate-x-1/2 bg-gradient-to-r from-orange-200 via-[#EA580C]/30 to-orange-200 lg:block" />
            <div className="grid grid-cols-1 gap-12 lg:grid-cols-3 lg:gap-8">
              {[
                { num: "01", title: "DISCOVER", desc: "Find restaurants and meals available around your campus.", icon: <Search className="h-6 w-6" /> },
                { num: "02", title: "ORDER", desc: "Choose your food, customize your order, and add it to your cart.", icon: <ShoppingBag className="h-6 w-6" /> },
                { num: "03", title: "ENJOY", desc: "Track your order and enjoy your meal when it arrives.", icon: <Salad className="h-6 w-6" /> },
              ].map((s, i) => (
                <Reveal key={s.num} delay={i * 120}>
                  <div className="relative text-center lg:pt-0">
                    <div className="relative mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-xl bg-[#EA580C] text-white">
                      {s.icon}
                      <span className="absolute -right-2 -top-2 rounded-lg bg-white px-2 py-0.5 text-[11px] font-bold text-[#EA580C] border border-[#E5E7EB]">
                        {s.num}
                      </span>
                    </div>
                    <h3 className="text-2xl font-bold tracking-wide text-[#171717]">{s.title}</h3>
                    <p className="mx-auto mt-3 max-w-xs text-[#6B7280]">{s.desc}</p>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* RESTAURANT SHOWCASE */}
      <section id="restaurants" className="bg-[#FAFAFA] py-20 lg:py-28">
        <div className="mx-auto max-w-7xl px-5 sm:px-8">
          <Reveal className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-extrabold tracking-tight text-[#171717] sm:text-4xl lg:text-[42px]">
              Your Favorite Food, All in One Place.
            </h2>
            <p className="mt-4 text-lg text-[#6B7280]">
              Discover delicious meals from restaurants and food vendors around your campus.
            </p>
          </Reveal>

          <div className="mt-14 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {foodsLoading &&
              Array.from({ length: 8 }).map((_, i) => (
                <div key={`skeleton-${i}`} className="overflow-hidden rounded-xl border border-[#E5E7EB] bg-white">
                  <div className="h-44 animate-pulse bg-[#F3F4F6]" />
                  <div className="p-5">
                    <div className="h-4 w-2/3 animate-pulse rounded bg-[#E5E7EB]" />
                    <div className="mt-2 h-3.5 w-full animate-pulse rounded bg-[#F3F4F6]" />
                    <div className="mt-4 h-3.5 w-1/3 animate-pulse rounded bg-[#F3F4F6]" />
                  </div>
                </div>
              ))}

            {!foodsLoading && foodsError && (
              <div className="col-span-full rounded-xl border border-orange-200 bg-orange-50 p-10 text-center">
                <p className="text-[#9A3412]">{foodsError}</p>
                <button
                  onClick={loadFeaturedFoods}
                  className="mt-4 inline-flex items-center rounded-lg bg-[#EA580C] px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#C2410C]"
                >
                  <RefreshCw className="mr-2 h-4 w-4" /> Try Again
                </button>
              </div>
            )}

            {!foodsLoading && !foodsError && featuredFoods.length === 0 && (
              <div className="col-span-full rounded-xl border border-[#E5E7EB] bg-white p-10 text-center">
                <Salad className="mx-auto h-10 w-10 text-[#A0A0A0]" />
                <p className="mt-3 text-[#6B7280]">No featured foods available yet.</p>
              </div>
            )}

            {!foodsLoading &&
              !foodsError &&
              featuredFoods.map((food, i) => (
                <Reveal key={food.id} delay={(i % 4) * 80}>
                  <button
                    onClick={() => goToFood(food)}
                    className="group w-full overflow-hidden rounded-xl border border-[#E5E7EB] bg-white text-left transition-all duration-200 hover:-translate-y-1 hover:border-[#EA580C] hover:shadow-lg hover:shadow-orange-50"
                  >
                    <div className="relative h-44 overflow-hidden">
                      <img
                        src={foodImage(food)}
                        onError={(e) => (e.currentTarget.src = fallbackImg)}
                        alt={food.name}
                        loading="lazy"
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                      />
                      <span className="absolute left-3 top-3 rounded-lg bg-white px-2.5 py-1 text-[11px] font-bold text-[#171717]">
                        {food.category}
                      </span>
                      {Number(food.rating) > 0 && (
                        <span className="absolute right-3 top-3 flex items-center gap-1 rounded-full bg-[#EA580C] px-2 py-1 text-[11px] font-bold text-white">
                          <Star className="h-3 w-3 fill-current" /> {food.rating}
                        </span>
                      )}
                    </div>
                    <div className="p-5">
                      <h3 className="truncate text-lg font-bold text-[#171717] group-hover:text-[#EA580C]">{food.name}</h3>
                      <p className="mt-1 truncate text-sm text-[#6B7280]">{food.restaurant}</p>
                      <div className="mt-3 flex items-center justify-between">
                        <span className="text-sm font-medium text-[#6B7280]">{food.category}</span>
                        <span className="text-lg font-extrabold text-[#EA580C]">{formatPrice(food.price)}</span>
                      </div>
                    </div>
                  </button>
                </Reveal>
              ))}
          </div>

          <Reveal className="mt-12 text-center">
            <button
              onClick={() => go("/home")}
              className="group inline-flex items-center rounded-lg bg-[#EA580C] px-8 py-3.5 text-base font-semibold text-white transition-all hover:bg-[#C2410C]"
            >
              Explore Restaurants
              <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
            </button>
          </Reveal>
        </div>
      </section>

      {/* BUDGET MEALS */}
      <section className="bg-white py-20 lg:py-28">
        <div className="mx-auto max-w-7xl px-5 sm:px-8">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <Reveal>
              <span className="inline-block rounded-full border border-orange-200 bg-orange-50 px-4 py-1.5 text-xs font-semibold text-[#EA580C]">
                STUDENT-FRIENDLY
              </span>
              <h2 className="mt-5 text-3xl font-extrabold tracking-tight text-[#171717] sm:text-4xl lg:text-[42px]">
                Good Food Without Breaking Your Budget.
              </h2>
              <p className="mt-4 text-lg text-[#6B7280]">
                Find affordable meals and student-friendly food options available around campus — without
                compromising on taste.
              </p>
              <button
                onClick={() => go("/home")}
                className="group mt-8 inline-flex items-center rounded-lg bg-[#EA580C] px-8 py-3.5 text-base font-semibold text-white transition-all hover:bg-[#C2410C]"
              >
                Find Budget Meals
                <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
              </button>
            </Reveal>

            <Reveal delay={120}>
              <div className="grid gap-4 sm:grid-cols-2">
                {foodsLoading &&
                  Array.from({ length: 4 }).map((_, i) => (
                    <div key={`bs-${i}`} className="overflow-hidden rounded-xl border border-[#E5E7EB] bg-white">
                      <div className="h-32 animate-pulse bg-[#F3F4F6]" />
                      <div className="p-4">
                        <div className="h-4 w-2/3 animate-pulse rounded bg-[#E5E7EB]" />
                        <div className="mt-2 h-3 w-1/2 animate-pulse rounded bg-[#F3F4F6]" />
                      </div>
                    </div>
                  ))}

                {!foodsLoading && (foodsError || featuredFoods.length === 0) && (
                  <div className="col-span-2 rounded-xl border border-[#E5E7EB] bg-[#FAFAFA] p-8 text-center">
                    <p className="text-[#A0A0A0]">
                      {foodsError ? "Budget meals aren't available right now." : "No budget-friendly meals available yet."}
                    </p>
                    {foodsError && (
                      <button
                        onClick={loadFeaturedFoods}
                        className="mt-3 inline-flex items-center rounded-lg bg-[#EA580C] px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#C2410C]"
                      >
                        <RefreshCw className="mr-2 h-4 w-4" /> Try Again
                      </button>
                    )}
                  </div>
                )}

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
                        className="overflow-hidden rounded-xl border border-[#E5E7EB] bg-white text-left transition-all duration-200 hover:-translate-y-1 hover:shadow-lg hover:shadow-orange-50"
                      >
                        <div className="relative h-32 overflow-hidden">
                          <img
                            src={foodImage(b)}
                            onError={(e) => (e.currentTarget.src = fallbackImg)}
                            alt={b.name}
                            loading="lazy"
                            className="h-full w-full object-cover transition-transform duration-500 hover:scale-110"
                          />
                          <span className="absolute left-3 top-3 rounded-lg bg-white px-2 py-0.5 text-[11px] font-bold text-[#171717]">{b.category}</span>
                        </div>
                        <div className="p-4">
                          <div className="flex items-center justify-between">
                            <h3 className="truncate font-bold text-[#171717]">{b.name}</h3>
                            <span className="text-lg font-extrabold text-[#EA580C]">{formatPrice(b.price)}</span>
                          </div>
                          <div className="mt-1 flex items-center justify-between">
                            <p className="truncate text-[12px] text-[#A0A0A0]">{b.restaurant}</p>
                            <span className="flex items-center gap-1 rounded-lg bg-orange-50 px-3 py-1.5 text-[12px] font-bold text-[#EA580C]">
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

      {/* TESTIMONIALS */}
      <section className="bg-[#FAFAFA] py-20 lg:py-28">
        <div className="mx-auto max-w-7xl px-5 sm:px-8">
          <Reveal className="mx-auto max-w-2xl text-center">
            <span className="inline-block rounded-full border border-orange-200 bg-orange-50 px-4 py-1.5 text-xs font-semibold text-[#EA580C]">
              TESTIMONIALS
            </span>
            <h2 className="mt-5 text-3xl font-extrabold tracking-tight text-[#171717] sm:text-4xl lg:text-[42px]">
              What Students Are Saying
            </h2>
            <p className="mt-4 text-lg text-[#6B7280]">
              Hear from students and restaurant owners who love using BiteHub.
            </p>
          </Reveal>

          <div className="mt-14 grid grid-cols-1 gap-6 md:grid-cols-3">
            {[
              {
                quote: "BiteHub changed how I get food on campus. I can order between classes and it's ready by the time I walk over. No more long lines!",
                name: "Maria Santos",
                role: "3rd Year, BS Computer Science",
                rating: 5,
              },
              {
                quote: "As a restaurant owner, BiteHub brought in so many student orders we weren't getting before. The dashboard makes tracking everything super easy.",
                name: "Jun Reyes",
                role: "Owner, Kanto Grille",
                rating: 5,
              },
              {
                quote: "I love that I can see all the menus and prices in one place. The budget meals section is a lifesaver during exam weeks.",
                name: "Angela Cruz",
                role: "2nd Year, BS Business Administration",
                rating: 5,
              },
            ].map((t, i) => (
              <Reveal key={t.name} delay={i * 100}>
                <div className="h-full rounded-xl border border-[#E5E7EB] bg-white p-7 transition-all duration-200 hover:border-[#EA580C]">
                  <Quote className="h-8 w-8 text-orange-200" />
                  <p className="mt-4 text-[15px] leading-relaxed text-[#6B7280]">{t.quote}</p>
                  <div className="mt-5 flex items-center gap-0.5">
                    {Array.from({ length: t.rating }).map((_, j) => (
                      <Star key={j} className="h-4 w-4 fill-[#EA580C] text-[#EA580C]" />
                    ))}
                  </div>
                  <div className="mt-4 flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-orange-50 text-sm font-bold text-[#EA580C]">
                      {t.name.split(" ").map((n) => n[0]).join("")}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-[#171717]">{t.name}</p>
                      <p className="text-xs text-[#A0A0A0]">{t.role}</p>
                    </div>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* RESTAURANT OWNERS */}
      <section id="for-owners" className="bg-[#111111] py-20 lg:py-28">
        <div className="relative mx-auto grid max-w-7xl items-center gap-14 px-5 sm:px-8 lg:grid-cols-2">
          <div>
            <Reveal>
              <span className="inline-block rounded-full border border-[#EA580C]/30 bg-[#EA580C]/10 px-4 py-1.5 text-xs font-semibold text-[#EA580C]">
                FOR RESTAURANT OWNERS
              </span>
            </Reveal>
            <Reveal delay={80}>
              <h2 className="mt-5 text-3xl font-extrabold tracking-tight text-white sm:text-4xl lg:text-[42px]">
                Own a Food Business?
              </h2>
            </Reveal>
            <Reveal delay={150}>
              <p className="mt-4 max-w-lg text-lg leading-relaxed text-[#A0A0A0]">
                Bring your restaurant to the BiteHub marketplace and reach more students and university
                customers. Manage orders, menus, and sales all in one place.
              </p>
            </Reveal>
            <Reveal delay={220}>
              <ul className="mt-7 space-y-3">
                {["Reach thousands of hungry students", "Manage orders in real time", "Track sales and popular items"].map((t) => (
                  <li key={t} className="flex items-center gap-3 text-[#D4D4D4]">
                    <Check className="h-5 w-5 shrink-0 text-[#EA580C]" /> <span>{t}</span>
                  </li>
                ))}
              </ul>
            </Reveal>
            <Reveal delay={300}>
              <button
                onClick={() => go("/restaurant-register")}
                className="group mt-9 inline-flex items-center rounded-lg bg-[#EA580C] px-8 py-3.5 text-base font-semibold text-white transition-all hover:bg-[#C2410C]"
              >
                Become a Restaurant Partner
                <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
              </button>
            </Reveal>
          </div>

          <Reveal delay={150}>
            <div className="relative">
              <div className="rounded-xl border border-[#2A2A2A] bg-[#1A1A1A] p-4">
                <div className="flex items-center justify-between border-b border-[#2A2A2A] pb-3">
                  <span className="text-sm font-bold text-white">Restaurant Dashboard</span>
                  <span className="flex items-center gap-1.5 rounded-full bg-green-500/10 px-2.5 py-1 text-[11px] font-bold text-green-400">
                    <span className="h-1.5 w-1.5 rounded-full bg-green-500" /> Open
                  </span>
                </div>
                <div className="mt-4 grid grid-cols-3 gap-3">
                  {[
                    { icon: <Package className="h-4 w-4" />, label: "Orders", value: "24" },
                    { icon: <TrendingUp className="h-4 w-4" />, label: "Sales", value: "₱1.2k" },
                    { icon: <Flame className="h-4 w-4" />, label: "Popular", value: "Adobo" },
                  ].map((s) => (
                    <div key={s.label} className="rounded-lg bg-[#2A2A2A] p-3">
                      <div className="text-[#EA580C]">{s.icon}</div>
                      <p className="mt-1 text-lg font-extrabold text-white">{s.value}</p>
                      <p className="text-[11px] text-[#A0A0A0]">{s.label}</p>
                    </div>
                  ))}
                </div>
                <div className="mt-4 space-y-2">
                  {[
                    { name: "Beef Tapsilog", amt: "₱65", qty: "×2", status: "Preparing" },
                    { name: "Chicken Rice Bowl", amt: "₱55", qty: "×1", status: "New" },
                    { name: "Fresh Milk Tea", amt: "₱49", qty: "×3", status: "Out for delivery" },
                  ].map((o) => (
                    <div key={o.name} className="flex items-center justify-between rounded-lg border border-[#2A2A2A] p-2.5">
                      <div className="flex items-center gap-2">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#EA580C]/10 text-[#EA580C]">
                          <Utensils className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="text-[12px] font-bold text-white">{o.name} {o.qty}</p>
                          <p className="text-[11px] text-[#EA580C]">{o.amt}</p>
                        </div>
                      </div>
                      <span className="rounded-full bg-[#EA580C]/10 px-2 py-0.5 text-[10px] font-bold text-[#EA580C]">{o.status}</span>
                    </div>
                  ))}
                </div>
                <div className="mt-4 flex items-center justify-between rounded-lg bg-[#2A2A2A] p-3">
                  <div className="flex items-center gap-2 text-[12px] text-[#A0A0A0]">
                    <BarChart3 className="h-4 w-4 text-[#EA580C]" /> Sales this week
                  </div>
                  <span className="text-sm font-extrabold text-white">₱8,420</span>
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="px-5 py-20 sm:px-8 lg:py-28">
        <Reveal className="mx-auto max-w-5xl">
          <div className="relative overflow-hidden rounded-2xl bg-[#EA580C] px-8 py-16 text-center sm:px-16">
            <div className="relative">
              <h2 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl lg:text-[44px]">
                Ready to Find Your Next Favorite Meal?
              </h2>
              <p className="mx-auto mt-4 max-w-xl text-lg text-orange-100">
                Join BiteHub and make campus food ordering easier.
              </p>
              <div className="mt-9 flex flex-wrap items-center justify-center gap-4">
                <button
                  onClick={() => go("/register")}
                  className="rounded-lg bg-white px-8 py-3.5 text-base font-semibold text-[#EA580C] transition-all hover:bg-orange-50"
                >
                  Get Started
                </button>
                <button
                  onClick={() => go("/login")}
                  className="rounded-lg border-2 border-white/40 px-8 py-3.5 text-base font-semibold text-white transition-all hover:bg-white/10"
                >
                  Log In
                </button>
              </div>
            </div>
          </div>
        </Reveal>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-[#E5E7EB] bg-white py-14">
        <div className="mx-auto max-w-7xl px-5 sm:px-8">
          <div className="flex flex-col gap-10 md:flex-row md:justify-between">
            <div className="max-w-xs">
              <div className="flex items-center gap-2.5">
                <img src={biteLogo} alt="BiteHub" className="h-9 w-9 object-contain" />
                <span className="text-xl font-bold tracking-tight text-[#171717]">
                  Bite<span className="text-[#EA580C]">Hub</span>
                </span>
              </div>
              <p className="mt-3 text-sm text-[#6B7280]">Your university food marketplace.</p>
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
                  className="text-sm font-medium text-[#6B7280] transition-colors hover:text-[#EA580C]"
                >
                  {l.label}
                </a>
              ))}
            </div>
          </div>
          <div id="contact" className="mt-12 border-t border-[#E5E7EB] pt-6" />
          <p className="text-sm text-[#A0A0A0]">© 2026 BiteHub. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}

export default Landing;
