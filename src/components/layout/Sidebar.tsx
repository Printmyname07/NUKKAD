import React from 'react';
import { Home, Store, Grid, ShoppingBag, Heart, Settings, HelpCircle, Package } from 'lucide-react';
import { NukkadLogo } from '../ui/NukkadLogo.tsx';

interface SidebarProps {
  onNavigate: (route: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ onNavigate }) => {
  const menuItems = [
    { name: 'Home', icon: Home, route: 'landing' },
    { name: 'Shops', icon: Store, route: 'customer' },
    { name: 'Categories', icon: Grid, route: 'categories' },
    { name: 'My Orders', icon: Package, route: 'orders' },
    { name: 'Wishlist', icon: Heart, route: 'wishlist' },
    { name: 'Cart', icon: ShoppingBag, route: 'cart' },
    { name: 'Settings', icon: Settings, route: 'settings' },
    { name: 'Help & Support', icon: HelpCircle, route: 'help' },
  ];

  return (
    <aside className="w-64 bg-white border-r border-slate-200 p-6 flex flex-col hidden lg:flex">
      <div className="mb-10">
        <NukkadLogo size={36} showText={true} />
      </div>
      <nav className="flex flex-col gap-2">
        {menuItems.map((item) => (
          <button
            key={item.name}
            onClick={() => onNavigate(item.route)}
            className="flex items-center gap-3 px-4 py-3 rounded-2xl text-slate-600 hover:bg-emerald-50 hover:text-[#08A85A] font-semibold transition-all cursor-pointer"
          >
            <item.icon className="w-5 h-5" />
            <span>{item.name}</span>
          </button>
        ))}
      </nav>
      <div className="mt-auto p-4 bg-emerald-50 rounded-3xl border border-emerald-100 text-center">
        <p className="text-sm font-bold text-emerald-900">Support Local</p>
        <p className="text-xs text-emerald-700 mt-1">Shop Local</p>
      </div>
    </aside>
  );
};
