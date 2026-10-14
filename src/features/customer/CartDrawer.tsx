import React from 'react';
import { ShoppingBag, X, Trash2, ArrowRight, AlertCircle, Store } from 'lucide-react';
import { useTranslation } from '../../i18n/LanguageContext.tsx';
import { Cart } from '../../types/index.ts';
import { Button } from '../../components/ui/Button.tsx';
import { EmptyState } from '../../components/ui/EmptyState.tsx';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  cart: Cart;
  onUpdateQuantity: (variantId: string, quantity: number) => void;
  onClearCart: () => void;
  onProceedCheckout: () => void;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({
  isOpen,
  onClose,
  cart,
  onUpdateQuantity,
  onClearCart,
  onProceedCheckout,
}) => {
  const { t, formatCurrency } = useTranslation();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden" role="dialog" aria-modal="true">
      <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-2xs transition-opacity" onClick={onClose} />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-white shadow-2xl flex flex-col">
          {/* Header */}
          <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-amber-600" />
              <h2 className="text-base font-bold text-slate-900">{t.cart.title}</h2>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              aria-label="Close cart"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Shop Context Banner */}
          {cart.shopName && (
            <div className="px-6 py-2.5 bg-amber-50 border-b border-amber-100 flex items-center justify-between text-xs">
              <div className="flex items-center gap-1.5 text-amber-900 font-medium">
                <Store className="w-3.5 h-3.5 text-amber-700" />
                <span>Pickup from: <strong>{cart.shopName}</strong></span>
              </div>
              <button
                type="button"
                onClick={onClearCart}
                className="text-amber-800 hover:text-amber-950 underline font-semibold"
              >
                {t.cart.clearCart}
              </button>
            </div>
          )}

          {/* Body */}
          <div className="flex-1 overflow-y-auto p-6">
            {cart.items.length === 0 ? (
              <EmptyState
                icon={<ShoppingBag className="w-8 h-8 text-slate-400" />}
                title={t.cart.emptyCart}
                description="Browse items from Sharma General Store or Kanhaiya Dairy to test the pickup reservation flow."
              />
            ) : (
              <div className="space-y-4">
                {/* Single Shop Warning notice */}
                <div className="p-3 rounded-lg bg-blue-50 border border-blue-100 text-blue-900 text-xs flex gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-blue-600 mt-0.5" />
                  <p>{t.cart.singleShopWarning}</p>
                </div>

                <div className="divide-y divide-slate-100">
                  {cart.items.map((item) => (
                    <div key={item.variantId} className="py-3 flex items-center justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-semibold text-slate-900 truncate">
                          {item.productName}
                        </h4>
                        <p className="text-xs text-slate-500">
                          {item.variantLabel} • {formatCurrency(item.unitPriceMinor)}
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => onUpdateQuantity(item.variantId, item.quantity - 1)}
                          className="w-7 h-7 rounded-md border border-slate-300 text-slate-700 flex items-center justify-center hover:bg-slate-100 text-sm font-bold"
                        >
                          -
                        </button>
                        <span className="w-6 text-center text-sm font-semibold text-slate-800">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => onUpdateQuantity(item.variantId, item.quantity + 1)}
                          className="w-7 h-7 rounded-md border border-slate-300 text-slate-700 flex items-center justify-center hover:bg-slate-100 text-sm font-bold"
                        >
                          +
                        </button>
                      </div>

                      <div className="text-right min-w-[70px]">
                        <span className="text-sm font-bold text-slate-900">
                          {formatCurrency(item.unitPriceMinor * item.quantity)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          {cart.items.length > 0 && (
            <div className="p-6 border-t border-slate-200 bg-slate-50 space-y-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-600 font-medium">{t.cart.subtotal}</span>
                <span className="text-lg font-bold text-slate-900">
                  {formatCurrency(cart.subtotalMinor)}
                </span>
              </div>

              <Button
                className="w-full"
                rightIcon={<ArrowRight className="w-4 h-4" />}
                onClick={onProceedCheckout}
              >
                {t.cart.proceedToPickup}
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
