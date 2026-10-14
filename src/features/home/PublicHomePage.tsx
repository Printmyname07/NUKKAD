import React, { useState } from 'react';
import {
  Store,
  ShoppingBag,
  MapPin,
  Users,
  Clock,
  ShieldCheck,
  ArrowRight,
  CheckCircle2,
  Package,
  ChevronRight,
  Search,
  Sparkles,
  TrendingUp,
  Zap,
  CreditCard,
  Coffee,
  Apple,
  Pill,
  Shirt,
  Home as HomeIcon,
  Cpu,
  Grid,
  Facebook,
  Instagram,
  Youtube,
} from 'lucide-react';
import { useTranslation } from '../../i18n/LanguageContext.tsx';
import { DEMO_CATEGORIES } from '../../services/api/index.ts';
import { getPrototypeShops } from '../../services/storage/prototypeStorage.ts';
import { Button } from '../../components/ui/Button.tsx';
import { Card, CardBody } from '../../components/ui/Card.tsx';

interface PublicHomePageProps {
  onNavigate: (route: string) => void;
  onOpenSetupGuide: () => void;
}

export const PublicHomePage: React.FC<PublicHomePageProps> = ({
  onNavigate,
  onOpenSetupGuide,
}) => {
  const { language, setLanguage, t } = useTranslation();
  const toggleLanguage = () => setLanguage(language === 'en' ? 'hi' : 'en');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLocation, setSelectedLocation] = useState('Jaipur, Rajasthan');

  const shops = getPrototypeShops();

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onNavigate('customer');
  };

  const categoriesWithIcons = [
    { nameEn: 'Groceries', nameHi: 'किराना', icon: ShoppingBag, color: 'bg-emerald-50 text-emerald-600' },
    { nameEn: 'Bakery & Snacks', nameHi: 'बेकरी व स्नैक्स', icon: Coffee, color: 'bg-amber-50 text-amber-600' },
    { nameEn: 'Beverages', nameHi: 'पेय पदार्थ', icon: Zap, color: 'bg-sky-50 text-sky-600' },
    { nameEn: 'Fresh Produce', nameHi: 'ताज़ी सब्ज़ियाँ', icon: Apple, color: 'bg-emerald-50 text-emerald-700' },
    { nameEn: 'Pharmacy', nameHi: 'दवाइयाँ', icon: Pill, color: 'bg-teal-50 text-teal-600' },
    { nameEn: 'Fashion', nameHi: 'फैशन', icon: Shirt, color: 'bg-purple-50 text-purple-600' },
    { nameEn: 'Home Essentials', nameHi: 'घरेलू सामान', icon: HomeIcon, color: 'bg-blue-50 text-blue-600' },
    { nameEn: 'Electronics', nameHi: 'इलेक्ट्रॉनिक्स', icon: Cpu, color: 'bg-indigo-50 text-indigo-600' },
    { nameEn: 'More', nameHi: 'अन्य', icon: Grid, color: 'bg-slate-100 text-slate-700' },
  ];

  const showcaseShops = [
    {
      id: 'shop-jaipur-1',
      name: 'Sharma General Store',
      category: 'Groceries, Daily Essentials',
      rating: 4.5,
      reviews: 124,
      distance: '0.3 km',
      image: 'https://images.unsplash.com/photo-1578916171728-46686eac8d58?auto=format&fit=crop&w=600&q=80',
      open: true,
    },
    {
      id: 'shop-jaipur-2',
      name: 'Fresh Bakery',
      category: 'Bakery, Snacks, Beverages',
      rating: 4.7,
      reviews: 89,
      distance: '0.5 km',
      image: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=600&q=80',
      open: true,
    },
    {
      id: 'shop-jaipur-3',
      name: 'City Pharmacy',
      category: 'Medicines, Health & Wellness',
      rating: 4.3,
      reviews: 76,
      distance: '0.7 km',
      image: 'https://images.unsplash.com/photo-1586015518255-b73b8a504a37?auto=format&fit=crop&w=600&q=80',
      open: true,
    },
    {
      id: 'shop-jaipur-4',
      name: 'Trendy Fashion',
      category: 'Clothing, Accessories',
      rating: 4.6,
      reviews: 112,
      distance: '1.1 km',
      image: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=600&q=80',
      open: true,
    },
  ];

  return (
    <div className="space-y-16 pb-20 bg-white font-sans text-slate-900 selection:bg-emerald-100 selection:text-emerald-900">
      {/* 1. Visually Striking Hero Section matching reference */}
      <section className="relative overflow-hidden bg-slate-900 text-white min-h-[520px] lg:min-h-[580px] flex items-center">
        {/* Background Street Image with Dark Gradient Overlay */}
        <div className="absolute inset-0 z-0">
          <img
            src="https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=1800&q=80"
            alt="Local Market Jaipur"
            className="w-full h-full object-cover object-center opacity-40 mix-blend-overlay"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-slate-950/95 via-slate-900/80 to-transparent" />
        </div>

        <div className="container mx-auto px-4 sm:px-6 max-w-7xl relative z-10 py-12 lg:py-16">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-7 space-y-6">
              <span className="text-xs font-bold uppercase tracking-widest text-emerald-400">
                WELCOME TO AASPASS
              </span>

              <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-white leading-[1.1]">
                Support Local.<br />
                <span className="text-emerald-400">Shop Local.</span>
              </h1>

              <p className="text-base sm:text-lg text-slate-200 max-w-xl leading-relaxed">
                Discover nearby shops, great products and hassle-free pickup. A better way to shop local.
              </p>

              {/* Search Bar matching reference */}
              <div className="max-w-xl pt-2">
                <form onSubmit={handleSearchSubmit} className="relative flex items-center bg-white rounded-2xl shadow-2xl p-2 border border-slate-200">
                  <div className="absolute left-4 text-slate-400">
                    <Search className="w-5 h-5" />
                  </div>
                  <input
                    type="text"
                    placeholder="Search for shops, products or categories..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-12 pr-28 py-3.5 text-sm text-slate-800 placeholder-slate-400 focus:outline-none bg-transparent"
                  />
                  <div className="absolute right-2">
                    <button
                      type="submit"
                      className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm rounded-xl transition-colors shadow-md cursor-pointer flex items-center justify-center"
                    >
                      <Search className="w-4 h-4" />
                    </button>
                  </div>
                </form>

                {/* Location indicator */}
                <div className="flex items-center gap-1.5 mt-3 text-xs text-slate-300">
                  <MapPin className="w-3.5 h-3.5 text-emerald-400" />
                  <span>{selectedLocation}</span>
                  <span aria-hidden="true">·</span>
                  <button
                    type="button"
                    onClick={() => {
                      const loc = prompt('Enter your city or neighborhood:', selectedLocation);
                      if (loc) setSelectedLocation(loc);
                    }}
                    className="text-emerald-400 hover:underline font-semibold cursor-pointer"
                  >
                    Change
                  </button>
                </div>
              </div>
            </div>

            {/* Right Side Illustration Tag on Hero */}
            <div className="lg:col-span-5 hidden lg:flex justify-end relative">
              <div className="bg-white/10 backdrop-blur-md border border-white/20 p-6 rounded-3xl shadow-2xl text-white space-y-3 max-w-xs transform rotate-2 hover:rotate-0 transition-transform">
                <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
                  <Sparkles className="w-4 h-4" />
                  <span>Community Commerce</span>
                </div>
                <p className="text-xs text-slate-200 leading-relaxed italic">
                  &ldquo;Local shops. Local people. Stronger community.&rdquo;
                </p>
                <div className="flex items-center gap-2 pt-2 text-[11px] text-slate-300 border-t border-white/10">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span>Verified Jaipur Merchants Online</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Five Feature Highlights Bar */}
      <section className="container mx-auto px-4 sm:px-6 max-w-7xl -mt-8 relative z-20">
        <div className="bg-white rounded-2xl shadow-xl border border-slate-200/80 p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6 divide-y sm:divide-y-0 sm:divide-x divide-slate-100">
          <div className="flex items-center gap-4 pt-4 sm:pt-0">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
              <Store className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Nearby Shops</h3>
              <p className="text-xs text-slate-500 mt-0.5">Find stores close to you</p>
            </div>
          </div>

          <div className="flex items-center gap-4 pt-4 sm:pt-0 sm:pl-4">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
              <Package className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Real-time Stock</h3>
              <p className="text-xs text-slate-500 mt-0.5">See what&apos;s available</p>
            </div>
          </div>

          <div className="flex items-center gap-4 pt-4 lg:pt-0 lg:pl-4">
            <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
              <ShoppingBag className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Easy Pickup</h3>
              <p className="text-xs text-slate-500 mt-0.5">Order and collect in store</p>
            </div>
          </div>

          <div className="flex items-center gap-4 pt-4 lg:pt-0 lg:pl-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
              <CreditCard className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Secure Payments</h3>
              <p className="text-xs text-slate-500 mt-0.5">Multiple payment options</p>
            </div>
          </div>

          <div className="flex items-center gap-4 pt-4 lg:pt-0 lg:pl-4 sm:col-span-2 lg:col-span-1">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Support Local</h3>
              <p className="text-xs text-slate-500 mt-0.5">Keep your community strong</p>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Popular Nearby Shops Section matching reference */}
      <section className="container mx-auto px-4 sm:px-6 max-w-7xl space-y-6 pt-4">
        <div className="flex items-end justify-between">
          <div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-950 tracking-tight">
              Popular Nearby Shops
            </h2>
            <p className="text-sm text-slate-500 mt-1">
              Discover top-rated stores in your area
            </p>
          </div>
          <button
            type="button"
            onClick={() => onNavigate('customer')}
            className="text-xs sm:text-sm font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-1 cursor-pointer"
          >
            <span>View all shops</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        {/* 4 Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {showcaseShops.map((shop) => (
            <div
              key={shop.id}
              onClick={() => onNavigate('customer')}
              className="bg-white rounded-2xl border border-slate-200/90 shadow-xs hover:shadow-lg transition-all overflow-hidden group cursor-pointer flex flex-col justify-between"
            >
              <div>
                {/* Shop Image with Open Badge */}
                <div className="relative h-44 overflow-hidden bg-slate-100">
                  <img
                    src={shop.image}
                    alt={shop.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute top-3 right-3">
                    <span className="px-2.5 py-1 rounded-full text-[11px] font-extrabold bg-emerald-500 text-white shadow-xs">
                      Open
                    </span>
                  </div>
                </div>

                {/* Content */}
                <div className="p-4 space-y-2">
                  <h3 className="font-bold text-slate-900 text-base group-hover:text-emerald-600 transition-colors">
                    {shop.name}
                  </h3>

                  <div className="flex items-center gap-3 text-xs text-slate-500">
                    <div className="flex items-center gap-1 font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded">
                      <span>★ {shop.rating}</span>
                      <span className="text-slate-400 font-normal">({shop.reviews})</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" />
                      <span>{shop.distance}</span>
                    </div>
                  </div>

                  <p className="text-xs text-slate-500 line-clamp-1 pt-1">
                    {shop.category}
                  </p>
                </div>
              </div>

              <div className="px-4 pb-4 pt-0 flex items-center justify-between border-t border-slate-100 mt-2 pt-3">
                <span className="text-xs font-bold text-emerald-600">Browse Products</span>
                <div className="w-7 h-7 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                  <ChevronRight className="w-4 h-4" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 4. Shop by Category Section matching reference */}
      <section className="container mx-auto px-4 sm:px-6 max-w-7xl space-y-6 pt-6">
        <div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-950 tracking-tight">
            Shop by Category
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Everything you need, just around the corner
          </p>
        </div>

        <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-9 gap-4">
          {categoriesWithIcons.map((cat, idx) => {
            const IconComp = cat.icon;
            return (
              <button
                key={idx}
                type="button"
                onClick={() => onNavigate('customer')}
                className="bg-white p-4 rounded-2xl border border-slate-200/80 hover:border-emerald-500 hover:shadow-md transition-all flex flex-col items-center text-center group cursor-pointer"
              >
                <div className={`w-14 h-14 rounded-2xl ${cat.color} flex items-center justify-center mb-3 group-hover:scale-110 transition-transform`}>
                  <IconComp className="w-7 h-7" />
                </div>
                <span className="text-xs font-bold text-slate-800 group-hover:text-emerald-600 transition-colors line-clamp-1">
                  {language === 'hi' ? cat.nameHi : cat.nameEn}
                </span>
              </button>
            );
          })}
        </div>
      </section>

      {/* 5. How AasPass Works Section matching reference */}
      <section className="container mx-auto px-4 sm:px-6 max-w-7xl space-y-6 pt-6">
        <div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-950 tracking-tight">
            How AasPass Works
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Simple steps to shop local
          </p>
        </div>

        <div className="bg-slate-50 rounded-3xl border border-slate-200/80 p-6 sm:p-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Step 1 */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200/60 shadow-xs space-y-3 relative">
            <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-800 font-extrabold text-xs flex items-center justify-center">
              1
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Search className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-slate-900 text-base">Find Shops</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Search nearby stores or browse by category.
            </p>
          </div>

          {/* Step 2 */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200/60 shadow-xs space-y-3 relative">
            <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-800 font-extrabold text-xs flex items-center justify-center">
              2
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-slate-900 text-base">Add to Cart</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Select products and choose pickup time.
            </p>
          </div>

          {/* Step 3 */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200/60 shadow-xs space-y-3 relative">
            <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-800 font-extrabold text-xs flex items-center justify-center">
              3
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CreditCard className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-slate-900 text-base">Pay Securely</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Use your preferred payment method.
            </p>
          </div>

          {/* Step 4 */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200/60 shadow-xs space-y-3 relative">
            <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-800 font-extrabold text-xs flex items-center justify-center">
              4
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Package className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-slate-900 text-base">Pick Up</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Visit the store and collect your order.
            </p>
          </div>
        </div>
      </section>

      {/* 6. Community CTA Banner matching reference */}
      <section className="container mx-auto px-4 sm:px-6 max-w-7xl pt-4">
        <div className="bg-gradient-to-r from-teal-950 via-teal-900 to-emerald-950 text-white rounded-3xl p-8 sm:p-12 relative overflow-hidden shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-xl relative z-10">
            <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center text-emerald-400 mb-2">
              <Store className="w-6 h-6" />
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Be Part of a Stronger Local Community
            </h2>
            <p className="text-sm text-teal-100/90">
              Shop local. Support local. Build a better tomorrow.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3 relative z-10 shrink-0">
            <Button
              size="lg"
              onClick={() => onNavigate('customer')}
              className="w-full sm:w-auto bg-white hover:bg-slate-100 text-slate-950 font-bold px-6 py-3 rounded-xl shadow-md cursor-pointer"
            >
              Browse Shops
            </Button>
            <Button
              size="lg"
              onClick={() => onNavigate('register')}
              className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-6 py-3 rounded-xl shadow-md cursor-pointer"
            >
              Create Account
            </Button>
          </div>
        </div>
      </section>

      {/* Professional Footer matching reference */}
      <footer className="bg-slate-900 text-slate-400 pt-16 pb-12 border-t border-slate-800 mt-16">
        <div className="container mx-auto px-4 sm:px-6 max-w-7xl space-y-10">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-8 border-b border-slate-800">
            <div className="flex items-center gap-2.5 text-white font-bold text-lg">
              <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-md">
                <Store className="w-5 h-5" />
              </div>
              <div>
                <span className="block leading-tight text-white">{t.common.appName}</span>
                <span className="text-[10px] text-slate-400 font-normal">{t.common.tagline}</span>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-6 text-xs font-semibold text-slate-300">
              <button onClick={() => onNavigate('landing')} className="hover:text-white transition-colors cursor-pointer">About Us</button>
              <button onClick={() => onNavigate('landing')} className="hover:text-white transition-colors cursor-pointer">Contact</button>
              <button onClick={onOpenSetupGuide} className="hover:text-white transition-colors cursor-pointer">Privacy Policy</button>
              <button onClick={onOpenSetupGuide} className="hover:text-white transition-colors cursor-pointer">Terms of Service</button>
            </div>

            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={toggleLanguage}
                className="px-3 py-1.5 rounded-lg bg-slate-800 text-xs font-bold text-white hover:bg-slate-700 transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <span>{language === 'en' ? 'EN' : 'हिंदी'}</span>
              </button>

              <div className="flex items-center gap-2 text-slate-400">
                <a href="#facebook" onClick={(e) => e.preventDefault()} className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center hover:text-white transition-colors">
                  <Facebook className="w-4 h-4" />
                </a>
                <a href="#instagram" onClick={(e) => e.preventDefault()} className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center hover:text-white transition-colors">
                  <Instagram className="w-4 h-4" />
                </a>
                <a href="#youtube" onClick={(e) => e.preventDefault()} className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center hover:text-white transition-colors">
                  <Youtube className="w-4 h-4" />
                </a>
              </div>
            </div>
          </div>

          <div className="text-center text-xs text-slate-500">
            &copy; {new Date().getFullYear()} AasPass Local Commerce. All rights reserved. Self-contained local prototype architecture.
          </div>
        </div>
      </footer>
    </div>
  );
};
