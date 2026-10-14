import React, { useState } from 'react';
import {
  Mail,
  Lock,
  ArrowRight,
  User,
  Store,
  Plus,
  Trash2,
  Shield,
  Users,
  Eye,
  EyeOff,
  MapPin,
  CheckCircle2,
  TrendingUp,
  Phone,
} from 'lucide-react';
import { NukkadLogo } from '../../components/ui/NukkadLogo.tsx';
import { useTranslation } from '../../i18n/LanguageContext.tsx';
import { Button } from '../../components/ui/Button.tsx';
import { Input } from '../../components/ui/Input.tsx';
import { Alert } from '../../components/ui/Alert.tsx';
import { useAuth } from './AuthContext.tsx';
import { UserRole } from '../../types/index.ts';
import { DEMO_CATEGORIES } from '../../services/api/index.ts';

interface InitialProductInput {
  name: string;
  price: number;
  unit: string;
  quantity?: number;
}

interface RegisterPageProps {
  onSuccess: (role: UserRole) => void;
  onNavigateLogin: () => void;
}

export const RegisterPage: React.FC<RegisterPageProps> = ({ onSuccess, onNavigateLogin }) => {
  const { language, setLanguage, t } = useTranslation();
  const { signUpUser } = useAuth();

  const [accountType, setAccountType] = useState<'customer' | 'vendor'>('customer');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(true);

  // Vendor shop details
  const [shopName, setShopName] = useState('');
  const [shopCategory, setShopCategory] = useState(DEMO_CATEGORIES[0]?.id || 'cat-1');
  const [shopAddress, setShopAddress] = useState('');
  const [shopLandmark, setShopLandmark] = useState('');
  const [shopDesc, setShopDesc] = useState('');
  const [initialProducts, setInitialProducts] = useState<InitialProductInput[]>([
    { name: '', price: 30, unit: 'packet', quantity: 25 },
  ]);

  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const toggleLanguageMode = () => {
    setLanguage(language === 'en' ? 'hi' : 'en');
  };

  const handleAddInitialProductRow = () => {
    setInitialProducts((prev) => [
      ...prev,
      { name: '', price: 50, unit: 'piece', quantity: 20 },
    ]);
  };

  const handleRemoveInitialProductRow = (index: number) => {
    setInitialProducts((prev) => prev.filter((_, i) => i !== index));
  };

  const handleUpdateInitialProduct = (
    index: number,
    field: keyof InitialProductInput,
    value: string | number
  ) => {
    setInitialProducts((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!accountType) {
      setError(t.auth.selectAccountTypeError);
      return;
    }

    if (!email.trim() || !password) {
      setError(t.auth.invalidCredentials);
      return;
    }

    if (password.length < 6) {
      setError(t.auth.weakPassword);
      return;
    }

    if (confirmPassword && password !== confirmPassword) {
      setError('Passwords do not match. Please verify both fields.');
      return;
    }

    if (!agreeTerms) {
      setError('Please agree to the Terms of Service and Privacy Policy to continue.');
      return;
    }

    if (accountType === 'vendor' && !shopName.trim()) {
      setError(t.auth.shopNameRequiredError);
      return;
    }

    setIsLoading(true);

    const validInitialProducts = initialProducts
      .filter((p) => p.name.trim() !== '')
      .map((p) => ({
        name: p.name.trim(),
        price: p.price > 0 ? p.price : 20,
        unit: p.unit || 'piece',
        quantity: p.quantity !== undefined ? p.quantity : 25,
        categoryId: shopCategory,
      }));

    const result = await signUpUser(
      email,
      password,
      accountType,
      fullName || (accountType === 'vendor' ? shopName + ' Owner' : 'Customer'),
      shopName,
      accountType === 'vendor'
        ? {
            description: shopDesc.trim() || 'Local neighborhood shop on AasPass',
            categoryId: shopCategory,
            addressText: shopAddress.trim() || 'Jaipur Market, Rajasthan',
            landmark: shopLandmark.trim() || 'Main Bazaar',
            initialProducts: validInitialProducts,
          }
        : undefined
    );
    setIsLoading(false);

    if (result.success) {
      onSuccess(accountType);
    } else {
      if (result.error?.toLowerCase().includes('already exists')) {
        setError(t.auth.emailAlreadyRegistered);
      } else {
        setError(result.error || 'Failed to create account.');
      }
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col lg:flex-row font-sans text-slate-900 selection:bg-emerald-100 selection:text-emerald-900">
      {/* Left Column: Brand & Visual Panel (~55%) */}
      <div className="lg:w-[55%] bg-slate-900 text-white relative flex flex-col justify-between overflow-hidden p-8 sm:p-12 lg:p-16">
        {/* Background photo & overlay */}
        <div className="absolute inset-0 z-0">
          <img
            src="https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=1600&q=80"
            alt="Local Market Shopping"
            className="w-full h-full object-cover object-center opacity-35 mix-blend-overlay"
          />
          <div className="absolute inset-0 bg-gradient-to-br from-slate-950/90 via-slate-900/80 to-[#064E46]/90" />
        </div>

        {/* Top Branding */}
        <div className="relative z-10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <NukkadLogo size={40} />
            <div>
              <span className="text-xl font-black tracking-tight text-white block">NUKKAD</span>
              <span className="text-xs text-emerald-400 font-medium tracking-wide">LOCAL. LIVE. HUMAN. CONNECTED.</span>
            </div>
          </div>
        </div>

        {/* Hero Copy & Visuals */}
        <div className="relative z-10 my-auto py-10 space-y-6 max-w-xl">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-[1.1]">
            Join Your<br />
            <span className="text-[#08A85A]">Local Community.</span>
          </h1>

          <p className="text-base sm:text-lg text-slate-200 leading-relaxed font-normal">
            Discover neighborhood shops, support local businesses, or bring your own store online with AasPass.
          </p>

          {/* Feature Highlights Grid (3 items) */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4">
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/15 flex flex-col gap-2 shadow-sm">
              <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                <Store className="w-5 h-5" />
              </div>
              <h4 className="text-sm font-bold text-white">Discover Local Shops</h4>
              <p className="text-xs text-slate-300">Find unique shops around you.</p>
            </div>

            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/15 flex flex-col gap-2 shadow-sm">
              <div className="w-9 h-9 rounded-xl bg-sky-500/20 text-sky-400 flex items-center justify-center">
                <Shield className="w-5 h-5" />
              </div>
              <h4 className="text-sm font-bold text-white">Shop with Confidence</h4>
              <p className="text-xs text-slate-300">Safe, secure and trusted transactions.</p>
            </div>

            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/15 flex flex-col gap-2 shadow-sm">
              <div className="w-9 h-9 rounded-xl bg-purple-500/20 text-purple-300 flex items-center justify-center">
                <TrendingUp className="w-5 h-5" />
              </div>
              <h4 className="text-sm font-bold text-white">Grow Your Business</h4>
              <p className="text-xs text-slate-300">Reach more customers in your neighborhood.</p>
            </div>
          </div>
        </div>

        {/* Bottom Decorative Banner */}
        <div className="relative z-10 mt-8 pt-6 border-t border-white/15 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-300">
          <div className="flex items-center gap-2 font-medium text-emerald-400">
            <CheckCircle2 className="w-4 h-4 text-[#08A85A]" />
            <span>Local Choices. Lasting Impact.</span>
          </div>
          <div className="text-slate-400">
            © {new Date().getFullYear()} AasPass Marketplace. All rights reserved.
          </div>
        </div>
      </div>

      {/* Right Column: Registration Card (~45%) */}
      <div className="lg:w-[45%] bg-slate-50 flex flex-col justify-between p-6 sm:p-10 lg:p-16 relative">
        {/* Language Toggle at Top Right */}
        <div className="flex justify-end mb-4">
          <button
            type="button"
            onClick={toggleLanguageMode}
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white border border-slate-200 shadow-sm text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <span className={language === 'en' ? 'text-emerald-600 font-bold' : 'text-slate-400'}>EN</span>
            <span className="text-slate-300">|</span>
            <span className={language === 'hi' ? 'text-emerald-600 font-bold' : 'text-slate-400'}>हिंदी</span>
          </button>
        </div>

        {/* Register Form Card */}
        <div className="w-full max-w-lg mx-auto bg-white rounded-3xl shadow-xl shadow-slate-200/50 p-6 sm:p-8 border border-slate-100">
          <div className="text-center mb-6">
            <div className="inline-flex w-12 h-12 rounded-2xl bg-emerald-50 text-[#08A85A] items-center justify-center mb-2 shadow-inner">
              <MapPin className="w-6 h-6 fill-current text-[#08A85A]" />
            </div>
            <h2 className="text-2xl font-extrabold text-[#102B49] tracking-tight">
              Create Your Account
            </h2>
            <p className="text-xs text-slate-500 mt-1 font-medium">
              Join AasPass and experience shopping closer to home.
            </p>

            {/* Step indicator bar */}
            <div className="flex items-center justify-center gap-3 mt-4 text-[11px] font-semibold text-slate-600">
              <div className="flex items-center gap-1.5 text-[#08A85A]">
                <span className="w-5 h-5 rounded-full bg-emerald-100 text-[#08A85A] flex items-center justify-center text-[10px] font-bold">1</span>
                <span>Account Type</span>
              </div>
              <div className="w-8 h-0.5 bg-slate-200" />
              <div className="flex items-center gap-1.5 text-slate-400">
                <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center text-[10px] font-bold">2</span>
                <span>Your Details</span>
              </div>
              <div className="w-8 h-0.5 bg-slate-200" />
              <div className="flex items-center gap-1.5 text-slate-400">
                <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center text-[10px] font-bold">3</span>
                <span>Complete</span>
              </div>
            </div>
          </div>

          {error && (
            <Alert type="danger" className="mb-4 text-xs">
              {error}
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* 1. Choose account type */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-800 uppercase tracking-wide">
                1. Choose your account type <span className="text-[#08A85A]">*</span>
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setAccountType('customer')}
                  className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer flex flex-col gap-1 relative ${
                    accountType === 'customer'
                      ? 'border-[#08A85A] bg-emerald-50/50 ring-2 ring-[#08A85A]/20'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  {accountType === 'customer' && (
                    <div className="absolute top-3 right-3 w-5 h-5 rounded-full bg-[#08A85A] text-white flex items-center justify-center text-[10px]">
                      ✓
                    </div>
                  )}
                  <div className="flex items-center gap-1.5 font-bold text-xs text-slate-900">
                    <User className="w-4 h-4 text-[#08A85A]" />
                    {t.auth.customerOptionTitle}
                  </div>
                  <p className="text-[11px] text-slate-500 leading-snug">
                    {t.auth.customerOptionDesc}
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => setAccountType('vendor')}
                  className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer flex flex-col gap-1 relative ${
                    accountType === 'vendor'
                      ? 'border-[#08A85A] bg-emerald-50/50 ring-2 ring-[#08A85A]/20'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  {accountType === 'vendor' && (
                    <div className="absolute top-3 right-3 w-5 h-5 rounded-full bg-[#08A85A] text-white flex items-center justify-center text-[10px]">
                      ✓
                    </div>
                  )}
                  <div className="flex items-center gap-1.5 font-bold text-xs text-slate-900">
                    <Store className="w-4 h-4 text-[#08A85A]" />
                    {t.auth.vendorOptionTitle}
                  </div>
                  <p className="text-[11px] text-slate-500 leading-snug">
                    {t.auth.vendorOptionDesc}
                  </p>
                </button>
              </div>
            </div>

            {/* Vendor Details Section if Vendor selected */}
            {accountType === 'vendor' && (
              <div className="space-y-3 p-4 rounded-2xl bg-emerald-50/60 border border-emerald-200/80 animate-fadeIn">
                <div className="flex items-center gap-2 pb-2 border-b border-emerald-200/60">
                  <Store className="w-4 h-4 text-emerald-700" />
                  <span className="text-xs font-bold text-emerald-950 uppercase tracking-wide">
                    Shop Details & Inventory
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {t.auth.shopNameLabel} <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Sharma General & Organic Store"
                    value={shopName}
                    onChange={(e) => setShopName(e.target.value)}
                    required
                    className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#08A85A]/20 focus:border-[#08A85A]"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Shop Category</label>
                    <select
                      className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#08A85A]/20"
                      value={shopCategory}
                      onChange={(e) => setShopCategory(e.target.value)}
                    >
                      {DEMO_CATEGORIES.map((cat) => (
                        <option key={cat.id} value={cat.id}>
                          {cat.nameEn}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Address / Landmark</label>
                    <input
                      type="text"
                      placeholder="e.g. Near City Center, Jaipur"
                      value={shopAddress}
                      onChange={(e) => setShopAddress(e.target.value)}
                      className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* 2. Enter account details */}
            <div className="space-y-3 pt-2">
              <label className="block text-xs font-bold text-slate-800 uppercase tracking-wide">
                2. Enter your account details
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Full name <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                      <User className="w-3.5 h-3.5" />
                    </div>
                    <input
                      type="text"
                      placeholder="Enter your full name"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      required
                      className="w-full pl-9 pr-3 py-2.5 bg-slate-50/50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#08A85A]/20 focus:border-[#08A85A]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    {t.auth.emailLabel} <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                      <Mail className="w-3.5 h-3.5" />
                    </div>
                    <input
                      type="email"
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="w-full pl-9 pr-3 py-2.5 bg-slate-50/50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#08A85A]/20 focus:border-[#08A85A]"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Phone number</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Phone className="w-3.5 h-3.5" />
                  </div>
                  <input
                    type="tel"
                    placeholder="+91 98765 43210"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 bg-slate-50/50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#08A85A]/20 focus:border-[#08A85A]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    {t.auth.passwordLabel} <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                      <Lock className="w-3.5 h-3.5" />
                    </div>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Create password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className="w-full pl-9 pr-9 py-2.5 bg-slate-50/50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#08A85A]/20 focus:border-[#08A85A]"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Confirm password <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                      <Lock className="w-3.5 h-3.5" />
                    </div>
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      placeholder="Confirm password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      className="w-full pl-9 pr-9 py-2.5 bg-slate-50/50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#08A85A]/20 focus:border-[#08A85A]"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      {showConfirmPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
              </div>

              {/* Terms Checkbox */}
              <div className="flex items-start gap-2 pt-1 text-xs">
                <input
                  type="checkbox"
                  id="terms"
                  checked={agreeTerms}
                  onChange={(e) => setAgreeTerms(e.target.checked)}
                  className="mt-0.5 rounded border-slate-300 text-[#08A85A] focus:ring-[#08A85A]"
                />
                <label htmlFor="terms" className="text-slate-600 cursor-pointer">
                  I agree to the <span className="text-[#08A85A] font-semibold">Terms of Service</span> and <span className="text-[#08A85A] font-semibold">Privacy Policy</span>
                </label>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3.5 px-4 bg-[#08A85A] hover:bg-[#079550] text-white font-bold text-sm rounded-xl transition-all shadow-lg shadow-emerald-600/25 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-70 mt-2"
            >
              {isLoading ? (
                <span>Creating Account...</span>
              ) : (
                <>
                  <span>Create {accountType === 'vendor' ? 'Vendor' : 'Customer'} Account</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="relative my-5">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-100" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-3 text-slate-400 font-semibold">OR</span>
            </div>
          </div>

          <div className="text-center text-xs text-slate-500 font-medium">
            Already have an account?{' '}
            <button
              type="button"
              onClick={onNavigateLogin}
              className="font-bold text-[#08A85A] hover:text-emerald-700 cursor-pointer"
            >
              Log In
            </button>
          </div>
        </div>

        {/* Soft Green Information Panel at Bottom */}
        <div className="max-w-lg mx-auto w-full mt-6 bg-emerald-50/80 border border-emerald-100 rounded-2xl p-4 flex items-start gap-3 shadow-sm text-xs text-emerald-900">
          <span className="w-5 h-5 rounded-full bg-emerald-200 text-emerald-800 flex items-center justify-center shrink-0 font-bold">i</span>
          <p className="leading-relaxed font-medium">
            You can choose to shop as a <span className="font-bold">Customer</span> or register as a <span className="font-bold">Vendor</span> during sign up.
          </p>
        </div>
      </div>
    </div>
  );
};
