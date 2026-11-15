import React, { useState, useMemo } from 'react';
import { AuditLog } from '../../types';
import { ShieldCheck, Search, Filter, Clock, AlertTriangle, ShieldAlert, CheckCircle2 } from 'lucide-react';

interface AuditLogsViewProps {
  auditLogs: AuditLog[];
}

export const AuditLogsView: React.FC<AuditLogsViewProps> = ({ auditLogs }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [actionFilter, setActionFilter] = useState<string>('all');

  const filteredLogs = useMemo(() => {
    return auditLogs.filter((log) => {
      const q = searchTerm.toLowerCase();
      const matchSearch =
        log.details.toLowerCase().includes(q) ||
        log.userName.toLowerCase().includes(q) ||
        log.action.toLowerCase().includes(q) ||
        log.targetId.toLowerCase().includes(q);

      const matchAction = actionFilter === 'all' || log.action === actionFilter;

      return matchSearch && matchAction;
    });
  }, [auditLogs, searchTerm, actionFilter]);

  const getActionBadge = (action: AuditLog['action']) => {
    switch (action) {
      case 'VOID_INVOICE':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-black bg-rose-100 text-rose-800 border border-rose-300">
            VOID INVOICE
          </span>
        );
      case 'CREATE_INVOICE':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
            NEW BILL
          </span>
        );
      case 'ADJUST_STOCK':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
            STOCK ADJUST
          </span>
        );
      case 'RECORD_PAYMENT':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-800">
            PAYMENT RECV
          </span>
        );
      case 'ADD_USER':
      case 'UPDATE_USER':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-100 text-indigo-800 border border-indigo-200">
            {action.replace('_', ' ')}
          </span>
        );
      case 'USER_LOGIN':
      case 'USER_LOGOUT':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-200 text-slate-800">
            {action.replace('_', ' ')}
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-700">
            {action.replace(/_/g, ' ')}
          </span>
        );
    }
  };

  return (
    <div className="space-y-5">
      {/* Security Guarantee Notice */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-[#0B2545] to-[#123966] text-white shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-400 text-slate-950 flex items-center justify-center font-bold flex-shrink-0">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-extrabold text-sm sm:text-base">
              M1 ENTERPRISES — Immutable Security Audit Trail
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              In accordance with store policy and statutory rules, bills, customer ledgers, and stock adjustments are <strong>never silently deleted</strong>. Every modification or cancellation is logged with user identity and timestamp.
            </p>
          </div>
        </div>

        <span className="px-3 py-1 rounded-xl bg-amber-400/20 text-amber-300 border border-amber-400/40 text-xs font-bold whitespace-nowrap self-end sm:self-center">
          {auditLogs.length} Logged Events
        </span>
      </div>

      {/* Filter Toolbar */}
      <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search audit trail by bill number, user, action details..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl bg-slate-50 border border-slate-300 focus:outline-none focus:border-amber-400"
          />
        </div>

        <select
          value={actionFilter}
          onChange={(e) => setActionFilter(e.target.value)}
          className="px-3 py-1.5 text-xs font-semibold rounded-xl bg-slate-50 border border-slate-300 text-slate-800 focus:outline-none focus:border-amber-400"
        >
          <option value="all">All Action Types</option>
          <option value="CREATE_INVOICE">New Bills Created</option>
          <option value="VOID_INVOICE">Voided / Cancelled Bills</option>
          <option value="ADJUST_STOCK">Stock Adjustments</option>
          <option value="RECORD_PAYMENT">Khata Payment Receipts</option>
          <option value="RECORD_EXPENSE">Expenses Recorded</option>
          <option value="ADD_USER">Owners &amp; Staff Added</option>
          <option value="UPDATE_USER">Account / PIN Changes</option>
          <option value="USER_LOGIN">User Sign-Ins</option>
          <option value="UPDATE_STORE_SETTINGS">Settings Changes</option>
        </select>
      </div>

      {/* Audit Logs Table */}
      <div className="rounded-2xl bg-white border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-slate-600 font-bold">
                <th className="py-3 px-4 w-36">Timestamp</th>
                <th className="py-3 px-3 w-32">Action</th>
                <th className="py-3 px-3 w-40">User &amp; Role</th>
                <th className="py-3 px-4">Audit Details &amp; Justification</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredLogs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50/80 transition">
                  <td className="py-3 px-4 font-mono text-[11px] text-slate-500 whitespace-nowrap">
                    {new Date(log.timestamp).toLocaleString('en-IN', {
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                      second: '2-digit',
                    })}
                  </td>

                  <td className="py-3 px-3">
                    {getActionBadge(log.action)}
                  </td>

                  <td className="py-3 px-3">
                    <div className="font-bold text-slate-900">{log.userName}</div>
                    <div className="text-[10px] text-slate-400 uppercase font-semibold">
                      {log.userRole}
                    </div>
                  </td>

                  <td className="py-3 px-4 text-slate-800 leading-relaxed">
                    {log.details}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
