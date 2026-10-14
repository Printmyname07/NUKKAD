import React from 'react';
import { Clock } from 'lucide-react';

export const PendingVendorScreen: React.FC = () => (
  <div className="container mx-auto px-4 py-16 text-center space-y-4">
    <div className="w-16 h-16 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center mx-auto">
      <Clock className="w-8 h-8" />
    </div>
    <h2 className="text-xl font-bold text-slate-900">Vendor Application Pending</h2>
    <p className="text-sm text-slate-600">Your merchant application is currently under review by our team.</p>
  </div>
);
