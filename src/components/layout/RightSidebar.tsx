import React from 'react';
import { MapPin, Sun, ShoppingBag, ArrowRight } from 'lucide-react';

export const RightSidebar: React.FC = () => {
  return (
    <aside className="w-80 p-6 space-y-6 hidden xl:block">
      {/* Location/Weather */}
      <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm space-y-4">
        <div className="flex justify-between items-start">
          <div className="flex gap-2">
            <MapPin className="w-5 h-5 text-[#08A85A]" />
            <div>
              <p className="text-xs text-slate-500">Shopping in</p>
              <p className="text-sm font-bold text-slate-900">Jaipur, Rajasthan</p>
            </div>
          </div>
          <div className="flex gap-1 items-center">
            <Sun className="w-5 h-5 text-amber-500" />
            <span className="text-sm font-bold text-slate-900">28°C</span>
          </div>
        </div>
      </div>

      {/* Explore Banner */}
      <div className="bg-gradient-to-br from-emerald-500 to-[#064E46] rounded-3xl p-6 text-white space-y-3">
        <h3 className="font-bold">Discover local shops near you</h3>
        <p className="text-xs opacity-90">Fresh products • Great prices • Stronger communities</p>
        <button className="flex items-center gap-2 bg-white text-[#08A85A] text-xs font-bold px-4 py-2 rounded-xl">
          Explore Shops <ArrowRight className="w-3 h-3" />
        </button>
      </div>

      {/* Your Orders */}
      <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="font-bold text-slate-900">Your Orders</h3>
          <button className="text-xs text-[#08A85A] font-bold">View All</button>
        </div>
        {/* Placeholder order list */}
        <div className="space-y-4">
          <div className="flex gap-3 items-center">
            <div className="w-10 h-10 bg-slate-100 rounded-lg"></div>
            <div>
              <p className="text-xs font-bold text-slate-900">Fresh Mart</p>
              <p className="text-[10px] text-slate-500">Delivered</p>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
};
