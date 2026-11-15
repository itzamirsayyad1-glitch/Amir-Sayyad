import React from 'react';
import { useOnlineStatus } from '../../hooks/useOnlineStatus';
import { WifiOff, ShieldCheck } from 'lucide-react';

export const OfflineIndicator: React.FC = () => {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <div className="fixed bottom-4 left-4 z-50 flex items-center gap-2 rounded-xl bg-amber-600 px-3 py-2 text-xs font-semibold text-white shadow-xl border border-amber-400/40 animate-pulse">
      <WifiOff className="w-4 h-4 text-white" />
      <div>
        <span>Offline Mode</span>
        <span className="hidden sm:inline text-amber-100 text-[11px] font-normal ml-1">
          — Using local database. Changes will sync when reconnected.
        </span>
      </div>
    </div>
  );
};

interface GSTAlertProps {
  onConfigureClick?: () => void;
  compact?: boolean;
}

export const GSTAlertBanner: React.FC<GSTAlertProps> = ({ onConfigureClick, compact = false }) => {
  if (compact) {
    return (
      <div className="flex items-center gap-2 px-2.5 py-1 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-700 text-xs font-medium">
        <ShieldCheck className="w-3.5 h-3.5 text-amber-600 flex-shrink-0" />
        <span className="truncate">Non-GST Retail Mode (GST Registration Pending Verification)</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3.5 rounded-xl bg-gradient-to-r from-amber-50 via-amber-50/70 to-blue-50/40 border border-amber-200/80 shadow-xs">
      <div className="flex items-start gap-3">
        <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center flex-shrink-0 mt-0.5">
          <ShieldCheck className="w-5 h-5 text-amber-700" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-amber-900">
              Statutory Compliance Status: Non-GST Retail Mode Active
            </h4>
            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-200/80 text-amber-800">
              ARN: AA271126019283K
            </span>
          </div>
          <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">
            GST Tax Invoice issuance is <strong>strictly locked</strong> until official GST registration certificate is active and verified. The system currently emits valid Non-GST retail cash memos and delivery challans.
          </p>
        </div>
      </div>
      {onConfigureClick && (
        <button
          onClick={onConfigureClick}
          className="self-end sm:self-center px-3 py-1.5 text-xs font-semibold rounded-lg bg-amber-600 hover:bg-amber-700 text-white transition flex-shrink-0"
        >
          Check GST Status
        </button>
      )}
    </div>
  );
};
