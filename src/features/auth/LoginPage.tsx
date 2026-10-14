import React, { useState } from 'react';
import {
  Mail,
  Lock,
  ArrowRight,
  ShieldCheck,
  Info,
  Store,
  Package,
  Shield,
  Users,
  Eye,
  EyeOff,
  MapPin,
  CheckCircle2,
} from 'lucide-react';
import { useTranslation } from '../../i18n/LanguageContext.tsx';
import { NukkadLogo } from '../../components/ui/NukkadLogo.tsx';
import { Input } from '../../components/ui/Input.tsx';
import { Alert } from '../../components/ui/Alert.tsx';
import { useAuth } from './AuthContext.tsx';
import { UserRole } from '../../types/index.ts';

interface LoginPageProps {
  onSuccess: (role: UserRole) => void;
  onNavigateRegister: () => void;
  redirectNotice?: string | null;
}

export const LoginPage: React.FC<LoginPageProps> = ({
  onSuccess,
  onNavigateRegister,
  redirectNotice,
}) => {
  const { language, setLanguage, t } = useTranslation();
  const { signIn } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [infoNotice, setInfoNotice] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      setError(t.auth.invalidCredentials);
      return;
    }

    setIsLoading(true);
    setError(null);
    setInfoNotice(null);

    const result = await signIn(email, password);
    setIsLoading(false);

    if (result.success) {
      if (result.role === 'admin') {
        onSuccess('admin');
      } else if (result.role === 'vendor') {
        onSuccess('vendor');
      } else {
        onSuccess('customer');
      }
    } else {
      setError(result.error || t.auth.invalidCredentials);
    }
  };

  const toggleLanguageMode = () => {
    setLanguage(language === 'en' ? 'hi' : 'en');
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
            Local Shops.<br />
            Real People.<br />
            <span className="text-[#08A85A]">A Better Tomorrow.</span>
          </h1>

          <p className="text-base sm:text-lg text-slate-200 leading-relaxed font-normal">
            AasPass connects you with local shops, vendors and small businesses in your neighbourhood. Shop local. Support local.
          </p>

          {/* Feature Highlights Grid (4 items) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4">
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/15 flex items-start gap-3.5 shadow-sm">
              <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                <Store className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white">Discover Nearby Shops</h4>
                <p className="text-xs text-slate-300 mt-0.5">Find local shops around you</p>
              </div>
            </div>

            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/15 flex items-start gap-3.5 shadow-sm">
              <div className="w-9 h-9 rounded-xl bg-sky-500/20 text-sky-400 flex items-center justify-center shrink-0">
                <Package className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white">Real-time Stock</h4>
                <p className="text-xs text-slate-300 mt-0.5">See what's available instantly</p>
              </div>
            </div>

            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/15 flex items-start gap-3.5 shadow-sm">
              <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
                <Shield className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white">Secure Payments</h4>
                <p className="text-xs text-slate-300 mt-0.5">Multiple payment options</p>
              </div>
            </div>

            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/15 flex items-start gap-3.5 shadow-sm">
              <div className="w-9 h-9 rounded-xl bg-purple-500/20 text-purple-300 flex items-center justify-center shrink-0">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white">Support Local</h4>
                <p className="text-xs text-slate-300 mt-0.5">Keep your community strong</p>
              </div>
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

      {/* Right Column: Login Card (~45%) */}
      <div className="lg:w-[45%] bg-slate-50 flex flex-col justify-between p-6 sm:p-10 lg:p-16 relative">
        {/* Language Toggle at Top Right */}
        <div className="flex justify-end mb-6">
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

        {/* Centered Login Form Card */}
        <div className="w-full max-w-md mx-auto my-auto bg-white rounded-3xl shadow-xl shadow-slate-200/50 p-8 sm:p-10 border border-slate-100">
          <div className="text-center mb-8">
            <div className="inline-flex w-12 h-12 rounded-2xl bg-emerald-50 text-[#08A85A] items-center justify-center mb-3 shadow-inner">
              <MapPin className="w-6 h-6 fill-current text-[#08A85A]" />
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-[#102B49] tracking-tight">
              Welcome Back
            </h2>
            <p className="text-sm text-slate-500 mt-1.5 font-medium">
              Sign in to your AasPass account
            </p>
          </div>

          {redirectNotice && (
            <Alert type="info" className="mb-5 text-xs">
              {redirectNotice}
            </Alert>
          )}

          {error && (
            <Alert type="danger" className="mb-5 text-xs">
              {error}
            </Alert>
          )}

          {infoNotice && (
            <Alert type="info" className="mb-5 text-xs" onClose={() => setInfoNotice(null)}>
              {infoNotice}
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                {t.auth.emailLabel}
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  placeholder="customer@example.com or vendor@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full pl-10 pr-4 py-3 bg-slate-50/50 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#08A85A]/20 focus:border-[#08A85A] transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                {t.auth.passwordLabel}
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full pl-10 pr-12 py-3 bg-slate-50/50 border border-slate-200 rounded-xl text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#08A85A]/20 focus:border-[#08A85A] transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs pt-1">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-300 text-[#08A85A] focus:ring-[#08A85A]"
                />
                <span className="text-slate-600 font-medium">Remember me</span>
              </label>

              <button
                type="button"
                className="text-[#08A85A] hover:text-emerald-700 font-semibold cursor-pointer"
                onClick={() =>
                  setInfoNotice(
                    'Prototype accounts are managed in local storage. To reset credentials, register a new account or reset browser storage.'
                  )
                }
              >
                {t.auth.forgotPassword}
              </button>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3.5 px-4 bg-[#08A85A] hover:bg-[#079550] text-white font-bold text-sm rounded-xl transition-all shadow-lg shadow-emerald-600/25 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-70"
            >
              {isLoading ? (
                <span>{t.auth.authenticating}</span>
              ) : (
                <>
                  <span>Log In</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-100" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-3 text-slate-400 font-semibold">OR</span>
            </div>
          </div>

          {/* Create new account button */}
          <button
            type="button"
            onClick={onNavigateRegister}
            className="w-full py-3 px-4 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-sm rounded-xl border border-slate-200 transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-sm"
          >
            <span>Create a new account</span>
          </button>

          <div className="mt-6 text-center text-xs text-slate-500 font-medium">
            New to AasPass?{' '}
            <button
              type="button"
              onClick={onNavigateRegister}
              className="font-bold text-[#08A85A] hover:text-emerald-700 cursor-pointer inline-flex items-center gap-1"
            >
              <span>Create an account</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* Soft Green Information Panel at Bottom */}
        <div className="max-w-md mx-auto w-full mt-6 bg-emerald-50/80 border border-emerald-100 rounded-2xl p-4 flex items-start gap-3 shadow-sm text-xs text-emerald-900">
          <Info className="w-5 h-5 text-[#08A85A] shrink-0 mt-0.5" />
          <p className="leading-relaxed font-medium">
            Choose whether you want to shop as a <span className="font-bold">Customer</span> or register as a <span className="font-bold">Vendor</span> during sign up.
          </p>
        </div>
      </div>
    </div>
  );
};
