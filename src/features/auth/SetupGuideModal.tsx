import React from 'react';
import { Database, Shield, HardDrive, CheckCircle2, AlertTriangle, Users } from 'lucide-react';
import { Modal } from '../../components/ui/Modal.tsx';
import { Button } from '../../components/ui/Button.tsx';
import { Badge } from '../../components/ui/Badge.tsx';
import { PROTOTYPE_STORAGE_DISCLAIMER } from '../../services/storage/prototypeStorage.ts';

interface SetupGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SetupGuideModal: React.FC<SetupGuideModalProps> = ({ isOpen, onClose }) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="AasPass Architecture & Local Storage Specs"
      maxWidth="lg"
      footer={<Button onClick={onClose}>Close Window</Button>}
    >
      <div className="space-y-4">
        {/* Status card */}
        <div className="p-4 rounded-xl border bg-emerald-50 border-emerald-200 text-emerald-950">
          <div className="flex items-center justify-between mb-2">
            <span className="font-semibold text-sm flex items-center gap-2">
              <HardDrive className="w-4 h-4 text-emerald-700" />
              Runtime Architecture: Self-Contained Prototype
            </span>
            <Badge variant="success">Active (Local Storage)</Badge>
          </div>
          <p className="text-xs leading-relaxed opacity-90">
            AasPass operates with zero external cloud dependencies. All user accounts, Jaipur pilot stores, inventory updates, and counter pickup orders are managed locally in this browser.
          </p>
        </div>

        {/* Disclaimer Callout */}
        <div className="p-3.5 rounded-xl border border-amber-200 bg-amber-50 text-amber-950 text-xs space-y-1.5">
          <div className="flex items-center gap-1.5 font-bold">
            <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0" />
            <span>Prototype Storage Limitations</span>
          </div>
          <p className="leading-relaxed text-[11px] text-amber-900">
            {PROTOTYPE_STORAGE_DISCLAIMER}
          </p>
        </div>

        {/* Architecture Specs */}
        <div className="border border-slate-200 rounded-xl p-4 bg-slate-50 space-y-3">
          <h4 className="font-semibold text-slate-800 text-xs uppercase tracking-wider flex items-center gap-1.5">
            <Shield className="w-3.5 h-3.5 text-slate-500" />
            Security & Data Boundaries
          </h4>
          <ul className="space-y-2 text-xs text-slate-600">
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
              <span>
                <strong>Password Protection:</strong> Passwords are protected using salted SHA-256 hashes in browser storage and never stored in plaintext.
              </span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
              <span>
                <strong>Role Isolation:</strong> Public registration strictly provisions Customer accounts. Privileged Vendor and Admin roles cannot be chosen or self-assigned.
              </span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
              <span>
                <strong>Single-Shop Checkout:</strong> Orders enforce strict single-shop integrity to prevent mixed merchant pickup conflicts.
              </span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
              <span>
                <strong>Zero External Credentials:</strong> No external database URLs, publishable anon keys, or third-party service tokens are required.
              </span>
            </li>
          </ul>
        </div>

        {/* Privileged Role Provisioning Limitation Notice */}
        <div className="border border-amber-200 rounded-xl p-4 bg-amber-50/60 space-y-2 text-xs">
          <h4 className="font-semibold text-amber-950 text-xs uppercase tracking-wider flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5 text-amber-700" />
            Privileged Role Provisioning & Security Limitation
          </h4>
          <p className="text-slate-600 leading-relaxed text-[11px]">
            In this local-only browser prototype without a trusted backend server or database, secure privileged-role provisioning cannot be guaranteed. Public registration strictly provisions standard <strong>Customer</strong> accounts.
          </p>
          <p className="text-slate-600 leading-relaxed text-[11px]">
            Ordinary customers cannot access vendor or admin portals, and no browser-side or public UI mechanism exists to silently grant or self-escalate vendor or admin privileges.
          </p>
        </div>
      </div>
    </Modal>
  );
};
