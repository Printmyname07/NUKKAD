import React, { useState } from 'react';
import { Store, ShoppingBag, Globe, HardDrive, User, Menu, X, LogOut } from 'lucide-react';
import { UserRole } from '../../types/index.ts';
import { useTranslation } from '../../i18n/LanguageContext.tsx';
import { useAuth } from '../../features/auth/AuthContext.tsx';
import { NukkadLogo } from '../ui/NukkadLogo.tsx';
import { Button } from '../ui/Button.tsx';

interface HeaderProps {
  currentRole: UserRole;
  onRoleChange: (role: UserRole) => void;
  onNavigate: (route: string) => void;
  currentRoute: string;
  cartItemCount: number;
  onOpenCart: () => void;
  onOpenSetupGuide: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentRole,
  onNavigate,
  currentRoute,
  cartItemCount,
  onOpenCart,
  onOpenSetupGuide,
}) => {
  const { language, setLanguage, t } = useTranslation();
  const { user, profile, roleVerificationStatus, signOut } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const toggleLanguage = () => {
    setLanguage(language === 'en' ? 'hi' : 'en');
  };

  const handleScrollTo = (sectionId: string) => {
    if (currentRoute !== 'landing') {
      onNavigate('landing');
      setTimeout(() => {
        const el = document.getElementById(sectionId);
        if (el) el.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    } else {
      const el = document.getElementById(sectionId);
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleSignOut = async () => {
    await signOut();
    onNavigate('landing');
  };

  const isAuthenticated = user !== null;

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200">
      {/* Top micro-banner for prototype environment awareness */}
      <div className="bg-emerald-950 text-emerald-100 text-xs py-1.5 px-4 flex items-center justify-between">
        <div className="container mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="font-semibold uppercase tracking-wider text-[10px] bg-emerald-800/80 px-2 py-0.5 rounded">
              {isAuthenticated
                ? roleVerificationStatus === 'verified' && currentRole
                  ? `Authenticated (${currentRole})`
                  : 'Authenticated'
                : 'Self-Contained Prototype'}
            </span>
            <span className="hidden sm:inline opacity-90">{t.landing.launchCityBadge}</span>
          </div>

          <div className="flex items-center gap-3">
            {/* Storage status indicator */}
            <button
              type="button"
              onClick={onOpenSetupGuide}
              className="flex items-center gap-1.5 hover:text-white transition-colors cursor-pointer text-[11px]"
              title="Click to view Architecture & Local Storage specs"
            >
              <HardDrive className="w-3.5 h-3.5 text-emerald-300" />
              <span>Storage: Browser Local</span>
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Navigation Bar */}
      <div className="container mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        {/* Brand & Desktop Navigation */}
        <div className="flex items-center gap-5 lg:gap-8">
          <button
            type="button"
            onClick={() => onNavigate(isAuthenticated && currentRole === 'vendor' ? 'vendor' : 'landing')}
            className="flex items-center gap-2 text-left group cursor-pointer"
          >
            <NukkadLogo size={38} showText={true} />
          </button>

          {/* Navigation Links (Desktop) */}
          {isAuthenticated && currentRole === 'vendor' ? (
            <nav className="hidden lg:flex items-center gap-3 text-xs font-semibold text-slate-700">
              <button
                type="button"
                onClick={() => onNavigate('vendor')}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                  currentRoute === 'vendor'
                    ? 'bg-amber-100 text-amber-900 font-bold border border-amber-300/80 shadow-xs'
                    : 'hover:text-amber-700 hover:bg-slate-100'
                }`}
              >
                <Store className="w-4 h-4 text-amber-700" />
                <span>My Shop Portal</span>
              </button>
            </nav>
          ) : (
            <nav className="hidden lg:flex items-center gap-5 text-xs font-semibold text-slate-600">
              <button
                type="button"
                onClick={() => onNavigate('landing')}
                className={`hover:text-amber-700 transition-colors cursor-pointer ${
                  currentRoute === 'landing' ? 'text-amber-700 font-bold' : ''
                }`}
              >
                {t.navigation.home}
              </button>
              <button
                type="button"
                onClick={() => onNavigate('customer')}
                className={`hover:text-amber-700 transition-colors cursor-pointer ${
                  currentRoute === 'customer' ? 'text-amber-700 font-bold' : ''
                }`}
              >
                {t.navigation.explore}
              </button>
              <button
                type="button"
                onClick={() => handleScrollTo('how-it-works')}
                className="hover:text-amber-700 transition-colors cursor-pointer"
              >
                {t.navigation.howItWorks}
              </button>
              <button
                type="button"
                onClick={() => handleScrollTo('about')}
                className="hover:text-amber-700 transition-colors cursor-pointer"
              >
                {t.navigation.about}
              </button>
            </nav>
          )}
        </div>

        {/* Right actions: Language, Cart, Auth */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Language Toggle */}
          <button
            type="button"
            onClick={toggleLanguage}
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors border border-slate-200 cursor-pointer shrink-0"
            title="Toggle English / हिन्दी"
          >
            <Globe className="w-3.5 h-3.5 text-slate-500" />
            <span>{language === 'en' ? 'हिन्दी' : 'English'}</span>
          </button>

          {/* Cart Button (Authenticated Customer role only) */}
          {isAuthenticated && currentRole === 'customer' && (
            <button
              type="button"
              onClick={onOpenCart}
              className="relative p-2 text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer shrink-0"
              aria-label="View pickup cart"
            >
              <ShoppingBag className="w-5 h-5" />
              {cartItemCount > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 bg-amber-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center animate-scale-in">
                  {cartItemCount}
                </span>
              )}
            </button>
          )}

          {/* Auth Actions: Authenticated User or Login/Register Buttons */}
          <div className="hidden sm:flex items-center gap-2">
            {isAuthenticated ? (
              <div className="flex items-center gap-2.5 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl">
                <div className="flex items-center gap-1.5 text-xs text-slate-800 font-medium">
                  <User className="w-3.5 h-3.5 text-amber-600" />
                  <span className="max-w-[140px] truncate" title={user.email}>
                    {profile?.displayName || user.email.split('@')[0]}
                  </span>
                  {roleVerificationStatus === 'verified' && currentRole ? (
                    <span className="text-[10px] font-bold uppercase bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded ml-0.5">
                      {currentRole}
                    </span>
                  ) : (
                    <span className="text-[10px] font-semibold bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded ml-0.5">
                      Customer
                    </span>
                  )}
                </div>
                <button
                  type="button"
                  onClick={handleSignOut}
                  className="text-slate-400 hover:text-rose-600 p-0.5 rounded transition-colors cursor-pointer"
                  title={t.common.signOut}
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <>
                <Button
                  size="sm"
                  variant={currentRoute === 'login' ? 'primary' : 'outline'}
                  onClick={() => onNavigate(currentRoute === 'login' ? 'landing' : 'login')}
                >
                  {currentRoute === 'login' ? t.common.back : t.navigation.login}
                </Button>

                <Button
                  size="sm"
                  variant="primary"
                  onClick={() => onNavigate('register')}
                >
                  {t.navigation.getStarted}
                </Button>
              </>
            )}
          </div>

          {/* Mobile menu button */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-2 text-slate-700 hover:bg-slate-100 rounded-lg cursor-pointer"
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-slate-200 bg-white px-4 py-4 space-y-4">
          {/* Nav Links (Mobile) */}
          {isAuthenticated && currentRole === 'vendor' ? (
            <div className="flex flex-col gap-2 pb-3 border-b border-slate-100 text-sm font-semibold text-slate-700">
              <button
                type="button"
                onClick={() => {
                  onNavigate('vendor');
                  setMobileMenuOpen(false);
                }}
                className="text-left py-2 px-3 rounded-xl bg-amber-50 text-amber-900 font-bold flex items-center gap-2"
              >
                <Store className="w-4 h-4 text-amber-600" />
                <span>My Shop Portal</span>
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-2 pb-3 border-b border-slate-100 text-sm font-semibold text-slate-700">
              <button
                type="button"
                onClick={() => {
                  onNavigate('landing');
                  setMobileMenuOpen(false);
                }}
                className="text-left py-1 hover:text-amber-700 transition-colors"
              >
                {t.navigation.home}
              </button>
              <button
                type="button"
                onClick={() => {
                  onNavigate('customer');
                  setMobileMenuOpen(false);
                }}
                className="text-left py-1 hover:text-amber-700 transition-colors"
              >
                {t.navigation.explore}
              </button>
              <button
                type="button"
                onClick={() => {
                  handleScrollTo('how-it-works');
                  setMobileMenuOpen(false);
                }}
                className="text-left py-1 hover:text-amber-700 transition-colors"
              >
                {t.navigation.howItWorks}
              </button>
              <button
                type="button"
                onClick={() => {
                  handleScrollTo('about');
                  setMobileMenuOpen(false);
                }}
                className="text-left py-1 hover:text-amber-700 transition-colors"
              >
                {t.navigation.about}
              </button>
            </div>
          )}

          <div className="pt-2 border-t border-slate-100 flex flex-col gap-2">
            {isAuthenticated ? (
              <div className="space-y-2">
                <div className="text-xs text-slate-600 py-1">
                  Signed in as <strong>{user?.email}</strong> ({currentRole})
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    handleSignOut();
                    setMobileMenuOpen(false);
                  }}
                  className="w-full text-rose-600 border-rose-200"
                >
                  <LogOut className="w-3.5 h-3.5 mr-1.5" />
                  {t.common.signOut}
                </Button>
              </div>
            ) : (
              <>
                <Button
                  size="sm"
                  variant="primary"
                  onClick={() => {
                    onNavigate('register');
                    setMobileMenuOpen(false);
                  }}
                >
                  {t.navigation.getStarted}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    onNavigate('login');
                    setMobileMenuOpen(false);
                  }}
                >
                  {t.navigation.login}
                </Button>
              </>
            )}
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                onOpenSetupGuide();
                setMobileMenuOpen(false);
              }}
            >
              Architecture & Storage Specs
            </Button>
          </div>
        </div>
      )}
    </header>
  );
};
