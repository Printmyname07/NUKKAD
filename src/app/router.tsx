import React, { useState, useEffect } from 'react';
import { UserRole, Cart, Shop, Product, ProductVariant } from '../types/index.ts';
import { Header } from '../components/layout/Header.tsx';
import { Footer } from '../components/layout/Footer.tsx';
import { PublicHomePage } from '../features/home/PublicHomePage.tsx';
import { CustomerPortal } from '../features/customer/CustomerPortal.tsx';
import { VendorPortal } from '../features/vendor/VendorPortal.tsx';
import { AdminPortal } from '../features/admin/AdminPortal.tsx';
import { LoginPage } from '../features/auth/LoginPage.tsx';
import { RegisterPage } from '../features/auth/RegisterPage.tsx';
import { CartDrawer } from '../features/customer/CartDrawer.tsx';
import { SetupGuideModal } from '../features/auth/SetupGuideModal.tsx';
import { Alert } from '../components/ui/Alert.tsx';
import { useTranslation } from '../i18n/LanguageContext.tsx';
import { useAuth } from '../features/auth/AuthContext.tsx';
import {
  checkRouteAccess,
  resolvePostLoginRoute,
} from '../features/auth/accessControl.ts';
import {
  createPrototypeOrder,
  getPrototypeSessionUser,
} from '../services/storage/prototypeStorage.ts';

export const AppRouter: React.FC = () => {
  const {
    role: authRole,
    roleVerificationStatus,
    roleError,
    retryRoleResolution,
    isLoading: authLoading,
    user,
  } = useAuth();

  const { t } = useTranslation();
  const [currentRoute, setCurrentRoute] = useState<string>('landing');
  const [redirectRoute, setRedirectRoute] = useState<string | null>(null);
  const [authRedirectNotice, setAuthRedirectNotice] = useState<string | null>(null);
  const [cartDrawerOpen, setCartDrawerOpen] = useState(false);
  const [setupGuideOpen, setSetupGuideOpen] = useState(false);
  const [cartConflictNotice, setCartConflictNotice] = useState<string | null>(null);
  const [checkoutNotice, setCheckoutNotice] = useState<string | null>(null);

  const { profile } = useAuth();
  const canAccessVendor =
    (authRole === 'vendor' && roleVerificationStatus === 'verified') ||
    (user !== null && (profile?.roles.includes('vendor') || authRole === 'vendor'));
  const canAccessAdmin = authRole === 'admin' && roleVerificationStatus === 'verified';

  // Enforce access control on route transitions
  const navigateTo = (targetRoute: string) => {
    // If a logged-in merchant tries to navigate away to general customer shop discovery, redirect them to their portal
    if (user && (authRole === 'vendor' || profile?.roles.includes('vendor')) && (targetRoute === 'landing' || targetRoute === 'customer')) {
      setCurrentRoute('vendor');
      return;
    }

    const access = checkRouteAccess(targetRoute, {
      isAuthenticated: !!user,
      role: authRole,
      roleVerificationStatus,
    });

    if (!access.allowed && access.redirectTo === 'login') {
      setRedirectRoute(targetRoute);
      setAuthRedirectNotice(
        targetRoute === 'vendor'
          ? 'Please sign in with a verified merchant account to access vendor tools.'
          : targetRoute === 'admin'
          ? 'Please sign in with an authorized account to access administrative tools.'
          : t.auth.signInRequiredNotice
      );
      setCurrentRoute('login');
      return;
    }

    if (targetRoute !== 'login') {
      setAuthRedirectNotice(null);
    }

    setCurrentRoute(targetRoute);
  };

  // Passive route guard to keep vendors strictly on their own shop portal and catch unauthorized drops
  useEffect(() => {
    if (authLoading) return;

    // Strictly keep authenticated vendors on their own shop portal
    if (user && (authRole === 'vendor' || profile?.roles.includes('vendor'))) {
      if (currentRoute === 'landing' || currentRoute === 'customer') {
        setCurrentRoute('vendor');
        return;
      }
    }

    const access = checkRouteAccess(currentRoute, {
      isAuthenticated: !!user,
      role: authRole,
      roleVerificationStatus,
    });

    if (!access.allowed && access.redirectTo === 'login') {
      setRedirectRoute(currentRoute);
      setAuthRedirectNotice(t.auth.signInRequiredNotice);
      setCurrentRoute('login');
    }
  }, [user, authLoading, authRole, profile, roleVerificationStatus, currentRoute, t]);

  // Single-Shop Cart State
  const [cart, setCart] = useState<Cart>({
    shopId: null,
    shopName: null,
    items: [],
    subtotalMinor: 0,
  });

  // Clear customer cart if session ends
  useEffect(() => {
    if (!user) {
      setCart({
        shopId: null,
        shopName: null,
        items: [],
        subtotalMinor: 0,
      });
      setCartDrawerOpen(false);
    }
  }, [user]);

  const handleOpenCart = () => {
    if (!user) {
      setRedirectRoute('customer');
      setAuthRedirectNotice(t.auth.authRequiredForCart);
      setCurrentRoute('login');
      return;
    }
    setCartDrawerOpen(true);
  };

  const handleAddToCart = (shop: Shop, product: Product, variant: ProductVariant) => {
    setCart((prev) => {
      // Enforce single-shop cart rule
      if (prev.shopId && prev.shopId !== shop.id) {
        setCartConflictNotice(
          `Your cart currently has items from "${prev.shopName}". For local pickup, orders can only be placed from one shop at a time. Please complete or clear your cart first.`
        );
        return prev;
      }

      setCartConflictNotice(null);
      const existingIndex = prev.items.findIndex((item) => item.variantId === variant.id);
      let updatedItems = [...prev.items];

      if (existingIndex > -1) {
        updatedItems[existingIndex] = {
          ...updatedItems[existingIndex],
          quantity: updatedItems[existingIndex].quantity + 1,
        };
      } else {
        updatedItems.push({
          variantId: variant.id,
          productId: product.id,
          productName: product.name,
          variantLabel: variant.variantLabel,
          unit: variant.unit,
          unitPriceMinor: variant.priceMinor,
          quantity: 1,
        });
      }

      const updatedSubtotal = updatedItems.reduce(
        (sum, item) => sum + item.unitPriceMinor * item.quantity,
        0
      );

      return {
        shopId: shop.id,
        shopName: shop.name,
        items: updatedItems,
        subtotalMinor: updatedSubtotal,
      };
    });
  };

  const handleUpdateQuantity = (variantId: string, newQuantity: number) => {
    setCart((prev) => {
      const itemIndex = prev.items.findIndex((i) => i.variantId === variantId);
      if (itemIndex === -1) return prev;

      let newItems = [...prev.items];

      if (newQuantity <= 0) {
        newItems.splice(itemIndex, 1);
      } else {
        newItems[itemIndex] = {
          ...newItems[itemIndex],
          quantity: newQuantity,
        };
      }

      if (newItems.length === 0) {
        return {
          shopId: null,
          shopName: null,
          items: [],
          subtotalMinor: 0,
        };
      }

      const updatedSubtotal = newItems.reduce(
        (sum, item) => sum + item.unitPriceMinor * item.quantity,
        0
      );

      return {
        ...prev,
        items: newItems,
        subtotalMinor: updatedSubtotal,
      };
    });
  };

  const handleClearCart = () => {
    setCart({
      shopId: null,
      shopName: null,
      items: [],
      subtotalMinor: 0,
    });
  };

  const handleCheckout = () => {
    setCartDrawerOpen(false);

    const storedUser = getPrototypeSessionUser();
    if (!storedUser) {
      navigateTo('login');
      return;
    }

    const result = createPrototypeOrder(cart, storedUser, 'pay_at_shop');
    if (result.success && result.order) {
      setCheckoutNotice(
        `Pickup order #${result.order.orderNumber} placed for "${cart.shopName}". Total: ₹${(
          result.order.totalMinor / 100
        ).toFixed(2)}. Pay at counter upon collection.`
      );
      handleClearCart();
    } else {
      setCheckoutNotice(result.error || 'Failed to place order.');
    }
  };

  const totalCartCount = cart.items.reduce((sum, item) => sum + item.quantity, 0);

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-3 border-amber-600 border-t-transparent rounded-full animate-spin" />
          <span className="text-xs font-semibold text-slate-500">Initializing session...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 font-sans selection:bg-amber-100 selection:text-amber-900">
      {/* Universal Navigation Header */}
      <Header
        currentRole={authRole || 'customer'}
        onRoleChange={navigateTo}
        onNavigate={navigateTo}
        currentRoute={currentRoute}
        cartItemCount={totalCartCount}
        onOpenCart={handleOpenCart}
        onOpenSetupGuide={() => setSetupGuideOpen(true)}
      />

      {/* Role Notice Banner */}
      {user && (roleVerificationStatus === 'error' || roleVerificationStatus === 'unassigned') && (
        <div className="container mx-auto px-4 sm:px-6 pt-4">
          <Alert type="warning" title="Account Role Verification Notice">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div>
                <p className="text-slate-800 font-medium">
                  {roleError || 'No verified merchant or administrative roles found for this account.'}
                </p>
                <p className="text-slate-600 text-[11px] mt-0.5">
                  Privileged Vendor and Admin views are restricted.
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => retryRoleResolution()}
                  className="px-2.5 py-1 text-xs font-semibold bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors cursor-pointer"
                >
                  Retry Role Check
                </button>
              </div>
            </div>
          </Alert>
        </div>
      )}

      {/* Cart Conflict Alert Banner */}
      {cartConflictNotice && (
        <div className="container mx-auto px-4 sm:px-6 pt-4">
          <Alert
            type="warning"
            title="Single-Shop Order Constraint"
            onClose={() => setCartConflictNotice(null)}
          >
            {cartConflictNotice}
          </Alert>
        </div>
      )}

      {/* Checkout Feedback Alert Banner */}
      {checkoutNotice && (
        <div className="container mx-auto px-4 sm:px-6 pt-4">
          <Alert
            type="info"
            title="Local Counter Pickup"
            onClose={() => setCheckoutNotice(null)}
          >
            {checkoutNotice}
          </Alert>
        </div>
      )}

      {/* Main View Router */}
      <main className="flex-1">
        {currentRoute === 'landing' ? (
          <PublicHomePage
            onNavigate={navigateTo}
            onOpenSetupGuide={() => setSetupGuideOpen(true)}
          />
        ) : currentRoute === 'customer' ? (
          !user ? (
            <div className="container mx-auto px-4 sm:px-6 py-16 max-w-xl text-center space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-800 mx-auto flex items-center justify-center font-bold text-xl">
                !
              </div>
              <h2 className="text-xl font-bold text-slate-900">Sign In Required</h2>
              <p className="text-sm text-slate-600">
                {t.auth.signInRequiredNotice}
              </p>
              <div className="flex items-center justify-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setRedirectRoute('customer');
                    setAuthRedirectNotice(t.auth.signInRequiredNotice);
                    setCurrentRoute('login');
                  }}
                  className="px-4 py-2 text-xs font-semibold bg-amber-600 text-white rounded-lg hover:bg-amber-700 cursor-pointer shadow-sm"
                >
                  {t.common.signIn}
                </button>
                <button
                  type="button"
                  onClick={() => setCurrentRoute('landing')}
                  className="px-4 py-2 text-xs font-semibold bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 cursor-pointer"
                >
                  Return Home
                </button>
              </div>
            </div>
          ) : (
            <CustomerPortal
              onAddToCart={handleAddToCart}
              onOpenCart={handleOpenCart}
              onOpenSetupGuide={() => setSetupGuideOpen(true)}
              onNavigate={navigateTo}
            />
          )
        ) : currentRoute === 'vendor' ? (
          canAccessVendor ? (
            <VendorPortal />
          ) : (
            <div className="container mx-auto px-4 sm:px-6 py-16 max-w-xl text-center space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-800 mx-auto flex items-center justify-center font-bold text-xl">
                !
              </div>
              <h2 className="text-xl font-bold text-slate-900">Vendor Desk Access Restricted</h2>
              <p className="text-sm text-slate-600">
                {user
                  ? "Access requires an authorized 'vendor' merchant role."
                  : 'Please sign in with a verified merchant account to access vendor tools.'}
              </p>
              {roleError && (
                <Alert type="warning" className="text-xs text-left">
                  {roleError}
                </Alert>
              )}
              <div className="flex items-center justify-center gap-3 pt-2">
                {user ? (
                  <button
                    type="button"
                    onClick={() => retryRoleResolution()}
                    className="px-3 py-1.5 text-xs font-semibold bg-amber-600 text-white rounded-lg hover:bg-amber-700 cursor-pointer"
                  >
                    Retry Role Check
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      setRedirectRoute('vendor');
                      setAuthRedirectNotice('Please sign in with a verified merchant account to access vendor tools.');
                      setCurrentRoute('login');
                    }}
                    className="px-3 py-1.5 text-xs font-semibold bg-amber-600 text-white rounded-lg hover:bg-amber-700 cursor-pointer"
                  >
                    Sign In as Vendor
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setCurrentRoute('landing')}
                  className="px-3 py-1.5 text-xs font-semibold bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 cursor-pointer"
                >
                  Return Home
                </button>
              </div>
            </div>
          )
        ) : currentRoute === 'admin' ? (
          canAccessAdmin ? (
            <AdminPortal />
          ) : (
            <div className="container mx-auto px-4 sm:px-6 py-16 max-w-xl text-center space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-800 mx-auto flex items-center justify-center font-bold text-xl">
                !
              </div>
              <h2 className="text-xl font-bold text-slate-900">Administrative Oversight Restricted</h2>
              <p className="text-sm text-slate-600">
                {user
                  ? "Platform administration requires an authoritative 'admin' role."
                  : 'Please sign in with an authorized administrative account to access staff tools.'}
              </p>
              {roleError && (
                <Alert type="warning" className="text-xs text-left">
                  {roleError}
                </Alert>
              )}
              <div className="flex items-center justify-center gap-3 pt-2">
                {user ? (
                  <button
                    type="button"
                    onClick={() => retryRoleResolution()}
                    className="px-3 py-1.5 text-xs font-semibold bg-amber-600 text-white rounded-lg hover:bg-amber-700 cursor-pointer"
                  >
                    Retry Role Check
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      setRedirectRoute('admin');
                      setAuthRedirectNotice('Please sign in with an authorized account to access administrative tools.');
                      setCurrentRoute('login');
                    }}
                    className="px-3 py-1.5 text-xs font-semibold bg-amber-600 text-white rounded-lg hover:bg-amber-700 cursor-pointer"
                  >
                    Sign In as Admin
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setCurrentRoute('landing')}
                  className="px-3 py-1.5 text-xs font-semibold bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 cursor-pointer"
                >
                  Return Home
                </button>
              </div>
            </div>
          )
        ) : currentRoute === 'login' ? (
          <LoginPage
            redirectNotice={authRedirectNotice}
            onSuccess={(role) => {
              const target = redirectRoute;
              setRedirectRoute(null);
              setAuthRedirectNotice(null);
              const nextRoute = role === 'vendor' ? 'vendor' : resolvePostLoginRoute(target, role, 'verified');
              setCurrentRoute(nextRoute);
            }}
            onNavigateRegister={() => setCurrentRoute('register')}
          />
        ) : currentRoute === 'register' ? (
          <RegisterPage
            onSuccess={(role) => {
              const target = redirectRoute;
              setRedirectRoute(null);
              setAuthRedirectNotice(null);
              const nextRoute = resolvePostLoginRoute(target, role, 'verified');
              setCurrentRoute(nextRoute);
            }}
            onNavigateLogin={() => setCurrentRoute('login')}
          />
        ) : (
          <div className="container mx-auto px-4 py-16 text-center">
            <h2 className="text-xl font-bold">Page Not Found</h2>
            <button
              onClick={() => setCurrentRoute('landing')}
              className="mt-4 text-amber-600 underline cursor-pointer"
            >
              Return Home
            </button>
          </div>
        )}
      </main>

      {/* Architecture & Specs Footer */}
      <Footer
        onOpenSetupGuide={() => setSetupGuideOpen(true)}
        onNavigate={navigateTo}
      />

      {/* Single-Shop Cart Drawer */}
      <CartDrawer
        isOpen={cartDrawerOpen}
        onClose={() => setCartDrawerOpen(false)}
        cart={cart}
        onUpdateQuantity={handleUpdateQuantity}
        onClearCart={handleClearCart}
        onProceedCheckout={handleCheckout}
      />

      {/* Architecture & Storage Specs Modal */}
      <SetupGuideModal
        isOpen={setupGuideOpen}
        onClose={() => setSetupGuideOpen(false)}
      />
    </div>
  );
};
