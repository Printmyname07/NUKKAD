import React, { useState, useEffect } from 'react';
import { ShieldCheck, AlertCircle, FileText, CheckCircle2, XCircle, Search, Filter } from 'lucide-react';
import { useTranslation } from '../../i18n/LanguageContext.tsx';
import {
  getVendorApplications,
  approveVendorApplication,
  rejectVendorApplication,
  VendorApplication,
} from '../../services/storage/prototypeStorage.ts';
import { useAuth } from '../auth/AuthContext.tsx';
import { Button } from '../../components/ui/Button.tsx';
import { Badge } from '../../components/ui/Badge.tsx';
import { Card, CardHeader, CardBody } from '../../components/ui/Card.tsx';
import { Alert } from '../../components/ui/Alert.tsx';

export const AdminPortal: React.FC = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'verifications' | 'disputes' | 'reports' | 'audit'>(
    'verifications'
  );
  const [actionNotice, setActionNotice] = useState<string | null>(null);
  const [applications, setApplications] = useState<VendorApplication[]>([]);

  const loadApplications = () => {
    const loaded = getVendorApplications();
    setApplications(loaded);
  };

  useEffect(() => {
    loadApplications();
    const handleStorageUpdate = () => loadApplications();
    window.addEventListener('aaspass_storage_update', handleStorageUpdate);
    window.addEventListener('storage', handleStorageUpdate);
    return () => {
      window.removeEventListener('aaspass_storage_update', handleStorageUpdate);
      window.removeEventListener('storage', handleStorageUpdate);
    };
  }, []);

  const handleApprove = (appId: string) => {
    if (!user) return;
    const res = approveVendorApplication(appId, user.id);
    if (res.success) {
      setActionNotice('Vendor application approved successfully! Merchant shop verified and vendor role granted.');
      loadApplications();
    } else {
      setActionNotice(res.error || 'Failed to approve vendor application.');
    }
  };

  const handleReject = (appId: string) => {
    if (!user) return;
    const res = rejectVendorApplication(appId, user.id);
    if (res.success) {
      setActionNotice('Vendor application rejected.');
      loadApplications();
    } else {
      setActionNotice(res.error || 'Failed to reject vendor application.');
    }
  };

  const pendingApps = applications.filter((a) => a.status === 'pending');

  return (
    <div className="container mx-auto px-4 sm:px-6 max-w-6xl py-8 space-y-8">
      {/* Title */}
      <div className="pb-6 border-b border-slate-200">
        <div className="flex items-center gap-2 mb-1">
          <h1 className="text-2xl font-bold text-slate-900">{t.admin.portalTitle}</h1>
          <Badge variant="info">Platform Staff Only</Badge>
        </div>
        <p className="text-sm text-slate-500">{t.admin.portalSubtitle}</p>
      </div>

      {/* Action / Prototype Notice */}
      {actionNotice && (
        <Alert type="info" onClose={() => setActionNotice(null)}>
          {actionNotice}
        </Alert>
      )}

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          type="button"
          onClick={() => setActiveTab('verifications')}
          className={`px-4 py-2 rounded-lg text-xs font-bold transition-colors ${
            activeTab === 'verifications'
              ? 'bg-amber-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          {t.admin.verificationQueue} ({pendingApps.length} pending)
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('disputes')}
          className={`px-4 py-2 rounded-lg text-xs font-bold transition-colors ${
            activeTab === 'disputes'
              ? 'bg-amber-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          {t.admin.disputes} (0)
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('reports')}
          className={`px-4 py-2 rounded-lg text-xs font-bold transition-colors ${
            activeTab === 'reports'
              ? 'bg-amber-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          {t.admin.userReports} (0)
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('audit')}
          className={`px-4 py-2 rounded-lg text-xs font-bold transition-colors ${
            activeTab === 'audit'
              ? 'bg-amber-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          {t.admin.auditLogs}
        </button>
      </div>

      {/* Tab Contents */}
      {activeTab === 'verifications' && (
        <Card>
          <CardHeader>
            <h3 className="text-sm font-bold text-slate-900">
              Pending Merchant Registrations
            </h3>
          </CardHeader>
          <CardBody className="p-0">
            {pendingApps.length === 0 ? (
              <div className="p-8 text-center text-slate-500 text-xs">
                No pending vendor applications at this time.
              </div>
            ) : (
              <div className="divide-y divide-slate-100 text-xs">
                {pendingApps.map((app) => (
                  <div
                    key={app.id}
                    className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/50"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 text-sm">{app.shopName}</span>
                        <Badge variant="warning">Verification Pending</Badge>
                      </div>
                      <p className="text-slate-500">
                        Applicant Email: {app.email} • Submitted: {new Date(app.createdAt).toLocaleString()}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-rose-200 text-rose-700 hover:bg-rose-50"
                        onClick={() => handleReject(app.id)}
                      >
                        Reject
                      </Button>
                      <Button
                        size="sm"
                        variant="primary"
                        onClick={() => handleApprove(app.id)}
                      >
                        Approve & Verify
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardBody>
        </Card>
      )}

      {activeTab === 'audit' && (
        <Card>
          <CardHeader>
            <h3 className="text-sm font-bold text-slate-900">
              System Audit Trail (Immutable Log Format)
            </h3>
          </CardHeader>
          <CardBody className="p-0">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 border-b border-slate-200 uppercase font-semibold">
                <tr>
                  <th className="py-3 px-4">Timestamp (UTC)</th>
                  <th className="py-3 px-4">Actor</th>
                  <th className="py-3 px-4">Action</th>
                  <th className="py-3 px-4">Target Resource</th>
                  <th className="py-3 px-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700 font-mono">
                <tr>
                  <td className="py-3 px-4">{new Date().toISOString().slice(0, 19)}Z</td>
                  <td className="py-3 px-4">vendor-user-1</td>
                  <td className="py-3 px-4">inventory.update</td>
                  <td className="py-3 px-4">prod-1:var-1-1</td>
                  <td className="py-3 px-4 text-emerald-600 font-semibold">SUCCESS</td>
                </tr>
                <tr>
                  <td className="py-3 px-4">{new Date(Date.now() - 3600000).toISOString().slice(0, 19)}Z</td>
                  <td className="py-3 px-4">admin-system</td>
                  <td className="py-3 px-4">shop.verify</td>
                  <td className="py-3 px-4">shop-jaipur-1</td>
                  <td className="py-3 px-4 text-emerald-600 font-semibold">SUCCESS</td>
                </tr>
              </tbody>
            </table>
          </CardBody>
        </Card>
      )}

      {(activeTab === 'disputes' || activeTab === 'reports') && (
        <Card>
          <CardBody className="p-8 text-center text-slate-500 text-xs">
            No active {activeTab} in Jaipur market.
          </CardBody>
        </Card>
      )}
    </div>
  );
};
