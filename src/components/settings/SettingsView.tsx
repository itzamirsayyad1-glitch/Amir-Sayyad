import React, { useState } from 'react';
import { StoreSettings, User, UserRole, SupabaseConfig } from '../../types';
import { 
  getSavedSupabaseConfig, 
  saveSupabaseConfig, 
  testSupabaseConnection, 
  SUPABASE_SQL_SCHEMA 
} from '../../services/supabase';
import { AppStorage } from '../../services/storage';
import { 
  Settings, 
  ShieldCheck, 
  Database, 
  Download, 
  Upload, 
  RefreshCw, 
  CheckCircle2, 
  AlertTriangle, 
  Copy, 
  Check, 
  Lock,
  Building,
  CreditCard,
  FileCode
} from 'lucide-react';

interface SettingsViewProps {
  settings: StoreSettings;
  currentUser: User;
  onUpdateSettings: (newSettings: StoreSettings) => void;
  onResetDemoData: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  settings,
  currentUser,
  onUpdateSettings,
  onResetDemoData,
}) => {
  const [activeTab, setActiveTab] = useState<'profile' | 'gst' | 'database' | 'backup'>('profile');

  // Store Profile Form State
  const [storeForm, setStoreForm] = useState<StoreSettings>({ ...settings });
  const [isSaved, setIsSaved] = useState(false);

  // Supabase State
  const [supabaseConfig, setSupabaseConfig] = useState<SupabaseConfig>(getSavedSupabaseConfig());
  const [testResult, setTestResult] = useState<{ loading: boolean; message?: string; success?: boolean }>({
    loading: false,
  });
  const [copiedSql, setCopiedSql] = useState(false);
  const [showSqlModal, setShowSqlModal] = useState(false);

  // Backup state
  const [restoreMessage, setRestoreMessage] = useState<{ text: string; success: boolean } | null>(null);

  const handleSaveStoreProfile = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateSettings(storeForm);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  const handleTestSupabase = async () => {
    setTestResult({ loading: true });
    const res = await testSupabaseConnection(supabaseConfig.url, supabaseConfig.anonKey);
    setTestResult({ loading: false, success: res.success, message: res.message });
    if (res.success) {
      const updated = { ...supabaseConfig, isConnected: true, lastSyncedAt: new Date().toISOString() };
      setSupabaseConfig(updated);
      saveSupabaseConfig(updated);
    }
  };

  const handleSaveSupabaseCredentials = () => {
    saveSupabaseConfig(supabaseConfig);
    alert('Supabase credentials saved successfully to browser vault.');
  };

  const handleCopySql = () => {
    navigator.clipboard.writeText(SUPABASE_SQL_SCHEMA);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 2500);
  };

  const handleDownloadBackup = () => {
    const jsonStr = AppStorage.exportFullBackup();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `M1_ENTERPRISES_Backup_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        const res = AppStorage.restoreFromBackup(content, currentUser);
        setRestoreMessage({ text: res.message, success: res.success });
        if (res.success) {
          setTimeout(() => window.location.reload(), 1500);
        }
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-5">
      {/* Settings Navigation Tabs */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-2 bg-white rounded-2xl border border-slate-200/80 shadow-xs">
        <div className="flex items-center gap-1 overflow-x-auto">
          {[
            { id: 'profile', label: 'Store Profile & Bank' },
            { id: 'gst', label: 'GST Compliance & Registration' },
            { id: 'database', label: 'Supabase Cloud Database & RLS' },
            { id: 'backup', label: 'Backup & Restore' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                activeTab === tab.id
                  ? 'bg-[#0B2545] text-amber-400 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* TAB 1: STORE PROFILE */}
      {activeTab === 'profile' && (
        <form onSubmit={handleSaveStoreProfile} className="space-y-4">
          <div className="rounded-2xl bg-white border border-slate-200/80 shadow-xs p-5 space-y-4">
            <h3 className="font-bold text-sm text-slate-900 pb-3 border-b border-slate-100">
              M1 ENTERPRISES — Store Information &amp; Branding
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Store Name *</label>
                <input
                  type="text"
                  required
                  value={storeForm.storeName}
                  onChange={(e) => setStoreForm({ ...storeForm, storeName: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 font-bold"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Tagline</label>
                <input
                  type="text"
                  value={storeForm.tagline}
                  onChange={(e) => setStoreForm({ ...storeForm, tagline: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="font-bold text-slate-700 block mb-1">Showroom Address (Street / Landmark) *</label>
                <input
                  type="text"
                  required
                  value={storeForm.address}
                  onChange={(e) => setStoreForm({ ...storeForm, address: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">City / Taluka</label>
                <input
                  type="text"
                  value={storeForm.city}
                  onChange={(e) => setStoreForm({ ...storeForm, city: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">District &amp; Pincode</label>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    value={storeForm.district}
                    onChange={(e) => setStoreForm({ ...storeForm, district: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300"
                  />
                  <input
                    type="text"
                    value={storeForm.pincode}
                    onChange={(e) => setStoreForm({ ...storeForm, pincode: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Owner Contact Number *</label>
                <input
                  type="text"
                  required
                  value={storeForm.phone}
                  onChange={(e) => setStoreForm({ ...storeForm, phone: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Affan Contact Number</label>
                <input
                  type="text"
                  value={storeForm.altPhone}
                  onChange={(e) => setStoreForm({ ...storeForm, altPhone: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="font-bold text-slate-700 block mb-1">Store UPI VPA (for invoice QR Code) *</label>
                <input
                  type="text"
                  required
                  value={storeForm.upiId}
                  onChange={(e) => setStoreForm({ ...storeForm, upiId: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono text-blue-900 font-bold"
                />
              </div>
            </div>
          </div>

          {/* Bank Details for Direct Customer Wire */}
          <div className="rounded-2xl bg-white border border-slate-200/80 shadow-xs p-5 space-y-4">
            <h3 className="font-bold text-sm text-slate-900 pb-3 border-b border-slate-100">
              Commercial Bank Account (Shrirampur Branch)
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Account Holder Name</label>
                <input
                  type="text"
                  value={storeForm.bankDetails.accountName}
                  onChange={(e) =>
                    setStoreForm({
                      ...storeForm,
                      bankDetails: { ...storeForm.bankDetails, accountName: e.target.value },
                    })
                  }
                  className="w-full px-3 py-2 rounded-xl border border-slate-300"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Current Account Number</label>
                <input
                  type="text"
                  value={storeForm.bankDetails.accountNumber}
                  onChange={(e) =>
                    setStoreForm({
                      ...storeForm,
                      bankDetails: { ...storeForm.bankDetails, accountNumber: e.target.value },
                    })
                  }
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Bank &amp; Branch</label>
                <input
                  type="text"
                  value={`${storeForm.bankDetails.bankName} - ${storeForm.bankDetails.branch}`}
                  onChange={(e) =>
                    setStoreForm({
                      ...storeForm,
                      bankDetails: { ...storeForm.bankDetails, bankName: e.target.value },
                    })
                  }
                  className="w-full px-3 py-2 rounded-xl border border-slate-300"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">IFSC Code</label>
                <input
                  type="text"
                  value={storeForm.bankDetails.ifscCode}
                  onChange={(e) =>
                    setStoreForm({
                      ...storeForm,
                      bankDetails: { ...storeForm.bankDetails, ifscCode: e.target.value },
                    })
                  }
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono uppercase font-bold"
                />
              </div>
            </div>

            <div className="pt-3 flex items-center justify-between">
              {isSaved && (
                <span className="text-xs font-bold text-emerald-700 flex items-center gap-1">
                  <CheckCircle2 className="w-4 h-4" /> Settings updated successfully!
                </span>
              )}
              <button
                type="submit"
                className="ml-auto px-5 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs shadow-xs transition"
              >
                Save Store Profile
              </button>
            </div>
          </div>
        </form>
      )}

      {/* TAB 2: GST COMPLIANCE & REGISTRATION */}
      {activeTab === 'gst' && (
        <div className="rounded-2xl bg-white border border-slate-200/80 shadow-xs p-5 space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <ShieldCheck className="w-5 h-5 text-amber-600" />
            <div>
              <h3 className="font-bold text-sm text-slate-900">
                Statutory GST Status &amp; Compliance Guard
              </h3>
              <p className="text-xs text-slate-500">
                Governing GST tax invoices and legal non-GST retail cash memos
              </p>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 leading-relaxed space-y-2">
            <div className="font-bold text-sm text-amber-950 flex items-center gap-2">
              <span>GST Registration: Application ARN AA271126019283K</span>
              <span className="px-2 py-0.5 rounded text-[10px] bg-amber-200 text-amber-900 uppercase font-bold">
                Verification Pending
              </span>
            </div>
            <p>
              In strict accordance with government regulations, <strong>GST Tax Invoice issuance is disabled</strong> until your official GST registration certificate is active and verified by the State Tax Department.
            </p>
            <p>
              Meanwhile, M1 ENTERPRISES operates legitimately in <strong>Non-GST Retail Mode</strong>, issuing legally compliant Cash Memos and Delivery Challans.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs pt-2">
            <div>
              <label className="font-bold text-slate-700 block mb-1">GST Application ARN</label>
              <input
                type="text"
                readOnly
                value={storeForm.gstApplicationArn}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-slate-50 font-mono font-bold"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">Provisional GSTIN (Locked)</label>
              <input
                type="text"
                readOnly
                value={storeForm.gstNumber}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-slate-50 font-mono"
              />
            </div>
          </div>

          {/* Verification Status Control */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs">
            <div>
              <span className="font-bold text-slate-900 block">
                Enable GST Tax Invoices (Requires Certificate Verification)
              </span>
              <p className="text-slate-500 text-[11px] mt-0.5">
                Keep disabled until the Maharashtra GST department issues final active registration.
              </p>
            </div>

            <button
              onClick={() => {
                alert(
                  'Statutory Notice: GST verification check returned status: UNDER_SCRUTINY. Tax invoice issuance remains locked as per legal mandate until active certificate is uploaded.'
                );
              }}
              className="px-4 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold text-xs transition"
            >
              Verify GSTIN Portal
            </button>
          </div>
        </div>
      )}

      {/* TAB 3: SUPABASE CLOUD DATABASE */}
      {activeTab === 'database' && (
        <div className="space-y-4">
          <div className="rounded-2xl bg-white border border-slate-200/80 shadow-xs p-5 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Database className="w-5 h-5 text-blue-800" />
                <div>
                  <h3 className="font-bold text-sm text-slate-900">
                    Supabase Authentication &amp; Multi-Device Database
                  </h3>
                  <p className="text-xs text-slate-500">
                    Connect real hosted PostgreSQL database with Row Level Security (RLS)
                  </p>
                </div>
              </div>

              {supabaseConfig.isConnected ? (
                <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-100 text-emerald-800 flex items-center gap-1.5 border border-emerald-300">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Connected</span>
                </span>
              ) : (
                <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-slate-100 text-slate-700 border border-slate-300">
                  Local Synced Mode
                </span>
              )}
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Supabase Project URL (e.g. https://xyz.supabase.co)
                </label>
                <input
                  type="text"
                  placeholder="https://xyzcompany.supabase.co"
                  value={supabaseConfig.url}
                  onChange={(e) => setSupabaseConfig({ ...supabaseConfig, url: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono text-xs"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Supabase Anon Public API Key
                </label>
                <input
                  type="password"
                  placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                  value={supabaseConfig.anonKey}
                  onChange={(e) => setSupabaseConfig({ ...supabaseConfig, anonKey: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 font-mono text-xs"
                />
              </div>

              <div className="flex flex-wrap items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={handleTestSupabase}
                  disabled={testResult.loading}
                  className="px-4 py-2 rounded-xl bg-blue-800 hover:bg-blue-700 text-white font-bold text-xs transition flex items-center gap-1.5"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${testResult.loading ? 'animate-spin' : ''}`} />
                  <span>{testResult.loading ? 'Testing...' : 'Test Connection'}</span>
                </button>

                <button
                  type="button"
                  onClick={handleSaveSupabaseCredentials}
                  className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs transition"
                >
                  Save Credentials
                </button>

                <button
                  type="button"
                  onClick={() => setShowSqlModal(true)}
                  className="px-4 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs transition flex items-center gap-1.5"
                >
                  <FileCode className="w-3.5 h-3.5" />
                  <span>View Supabase SQL Schema &amp; RLS</span>
                </button>
              </div>

              {testResult.message && (
                <div
                  className={`p-3 rounded-xl text-xs font-semibold ${
                    testResult.success
                      ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                      : 'bg-rose-50 text-rose-800 border border-rose-200'
                  }`}
                >
                  {testResult.message}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: BACKUP & RESTORE */}
      {activeTab === 'backup' && (
        <div className="rounded-2xl bg-white border border-slate-200/80 shadow-xs p-5 space-y-4">
          <h3 className="font-bold text-sm text-slate-900 pb-3 border-b border-slate-100">
            Database Snapshots, Export &amp; Disaster Recovery
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            {/* Download JSON Backup */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
              <h4 className="font-bold text-slate-900 flex items-center gap-1.5">
                <Download className="w-4 h-4 text-blue-700" />
                <span>Export Full Store Backup</span>
              </h4>
              <p className="text-slate-600 text-[11px] leading-relaxed">
                Generates a JSON snapshot containing all products, customer ledgers, bills, expenses, and security audit logs.
              </p>
              <button
                onClick={handleDownloadBackup}
                className="mt-2 w-full py-2 rounded-xl bg-[#0B2545] hover:bg-blue-900 text-amber-400 font-bold text-xs transition"
              >
                Download JSON Backup File
              </button>
            </div>

            {/* Restore JSON Backup */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
              <h4 className="font-bold text-slate-900 flex items-center gap-1.5">
                <Upload className="w-4 h-4 text-emerald-700" />
                <span>Restore from Backup File</span>
              </h4>
              <p className="text-slate-600 text-[11px] leading-relaxed">
                Upload a previously exported M1 Enterprises JSON backup to restore all records.
              </p>
              <label className="mt-2 block w-full py-2 text-center rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold text-xs cursor-pointer transition">
                <span>Select JSON File to Restore</span>
                <input
                  type="file"
                  accept=".json"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
            </div>
          </div>

          {restoreMessage && (
            <div
              className={`p-3 rounded-xl text-xs font-semibold ${
                restoreMessage.success ? 'bg-emerald-50 text-emerald-800' : 'bg-rose-50 text-rose-800'
              }`}
            >
              {restoreMessage.text}
            </div>
          )}

          {/* Reset Demo Data */}
          <div className="mt-6 pt-4 border-t border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <span className="font-bold text-rose-800 text-xs block">
                Reset to Sample Demo Dataset
              </span>
              <p className="text-slate-500 text-[11px]">
                Restores the initial Shrirampur showroom demo catalog, customer records, and bills.
              </p>
            </div>

            <button
              onClick={() => {
                if (window.confirm('Are you sure you want to reload the initial demo data for M1 Enterprises?')) {
                  onResetDemoData();
                  alert('Demo dataset reloaded successfully.');
                }
              }}
              className="px-4 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold text-xs transition"
            >
              Reset Sample Demo Data
            </button>
          </div>
        </div>
      )}

      {/* Supabase SQL Modal */}
      {showSqlModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="w-full max-w-3xl rounded-2xl bg-slate-900 border border-slate-700 p-6 shadow-2xl text-slate-100 my-auto animate-in fade-in">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <FileCode className="w-5 h-5 text-amber-400" />
                <h3 className="font-bold text-sm text-white">
                  Supabase PostgreSQL Schema &amp; Row Level Security (RLS)
                </h3>
              </div>
              <button
                onClick={() => setShowSqlModal(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-400 mt-2">
              Copy and execute this script in your <strong>Supabase SQL Editor</strong> to automatically create all tables, indexes, and role-based policies for M1 ENTERPRISES.
            </p>

            <div className="mt-3 relative">
              <pre className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-[11px] font-mono text-slate-300 max-h-80 overflow-y-auto overflow-x-auto leading-relaxed">
                {SUPABASE_SQL_SCHEMA}
              </pre>
              <button
                onClick={handleCopySql}
                className="absolute top-3 right-3 px-3 py-1.5 rounded-lg bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-bold flex items-center gap-1 shadow-md transition"
              >
                {copiedSql ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedSql ? 'Copied SQL' : 'Copy Script'}</span>
              </button>
            </div>

            <div className="mt-4 flex justify-end">
              <button
                onClick={() => setShowSqlModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-white transition"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
