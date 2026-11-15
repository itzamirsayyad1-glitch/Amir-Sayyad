import React, { useState } from 'react';
import { User, UserRole } from '../../types';
import { Shield, Lock, ChevronDown, Check, Info, LogOut, UserPlus } from 'lucide-react';

interface RoleSwitcherProps {
  currentUser: User;
  allUsers: User[];
  onSelectUser: (user: User) => void;
  onManageTeam: () => void;
  onLogout: () => void;
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export const RoleSwitcher: React.FC<RoleSwitcherProps> = ({
  currentUser,
  allUsers,
  onSelectUser,
  onManageTeam,
  onLogout,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [showRoleInfo, setShowRoleInfo] = useState(false);

  const activeUsers = allUsers.filter((u) => u.isActive !== false);
  const canManageTeam = currentUser.role === 'owner' || currentUser.role === 'manager';

  const getRoleBadge = (role: UserRole) => {
    switch (role) {
      case 'owner':
        return (
          <span className="px-2 py-0.5 text-[11px] font-bold rounded-md bg-amber-400/20 text-amber-300 border border-amber-400/40 uppercase tracking-wide">
            Owner (Full Access)
          </span>
        );
      case 'manager':
        return (
          <span className="px-2 py-0.5 text-[11px] font-bold rounded-md bg-sky-400/20 text-sky-300 border border-sky-400/40 uppercase tracking-wide">
            Manager
          </span>
        );
      case 'staff':
        return (
          <span className="px-2 py-0.5 text-[11px] font-bold rounded-md bg-emerald-400/20 text-emerald-300 border border-emerald-400/40 uppercase tracking-wide">
            Staff / Cashier
          </span>
        );
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 p-1.5 sm:px-3 sm:py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700/70 text-left transition cursor-pointer"
      >
        <div className="w-8 h-8 rounded-lg bg-amber-400 text-slate-950 font-black text-xs flex items-center justify-center flex-shrink-0">
          {getInitials(currentUser.name)}
        </div>
        <div className="hidden md:block">
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-bold text-white leading-tight">{currentUser.name}</span>
          </div>
          <p className="text-[10px] text-amber-300 font-medium capitalize">{currentUser.role}</p>
        </div>
        <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute right-0 mt-2 w-76 rounded-2xl bg-slate-900 border border-slate-700 shadow-2xl p-2 z-50 animate-in fade-in zoom-in-95">
            <div className="p-2.5 pb-2 border-b border-slate-800">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Active Owners &amp; Staff
                </span>
                <button
                  onClick={() => setShowRoleInfo(true)}
                  className="text-slate-400 hover:text-amber-300 p-1 rounded"
                  title="View Role Permissions Matrix"
                >
                  <Info className="w-3.5 h-3.5" />
                </button>
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Quick-switch terminal operator or sign out to PIN portal.
              </p>
            </div>

            <div className="py-1.5 space-y-1 max-h-60 overflow-y-auto">
              {activeUsers.map((u) => {
                const isSelected = u.id === currentUser.id;
                return (
                  <button
                    key={u.id}
                    onClick={() => {
                      onSelectUser(u);
                      setIsOpen(false);
                    }}
                    className={`w-full flex items-center justify-between p-2 rounded-xl text-left transition cursor-pointer ${
                      isSelected
                        ? 'bg-blue-600/20 border border-blue-500/40 text-white'
                        : 'hover:bg-slate-800/80 text-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div
                        className={`w-8 h-8 rounded-lg font-extrabold text-[11px] flex items-center justify-center flex-shrink-0 ${
                          u.role === 'owner'
                            ? 'bg-amber-400 text-slate-950'
                            : u.role === 'manager'
                            ? 'bg-sky-500 text-white'
                            : 'bg-emerald-500 text-white'
                        }`}
                      >
                        {getInitials(u.name)}
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-slate-100 truncate">
                          {u.name}
                        </div>
                        <div className="text-[10px] text-slate-400 mt-0.5">
                          {getRoleBadge(u.role)}
                        </div>
                      </div>
                    </div>
                    {isSelected && <Check className="w-4 h-4 text-amber-400 flex-shrink-0" />}
                  </button>
                );
              })}
            </div>

            {/* Action Buttons */}
            <div className="mt-1 pt-2 border-t border-slate-800 space-y-1">
              {canManageTeam && (
                <button
                  onClick={() => {
                    setIsOpen(false);
                    onManageTeam();
                  }}
                  className="w-full flex items-center gap-2 px-2.5 py-2 rounded-xl text-xs font-bold text-amber-300 hover:bg-slate-800 transition cursor-pointer"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>Add Owner / Manage Staff ({activeUsers.length})</span>
                </button>
              )}

              <button
                onClick={() => {
                  setIsOpen(false);
                  onLogout();
                }}
                className="w-full flex items-center gap-2 px-2.5 py-2 rounded-xl text-xs font-bold text-rose-300 hover:bg-rose-950/50 transition cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
                <span>Sign Out / PIN Login Screen</span>
              </button>
            </div>

            <div className="mt-1 pt-2 border-t border-slate-800 px-2 py-1 text-[11px] text-slate-400 flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
              <span>Purchase costs &amp; profit are hidden for Staff role.</span>
            </div>
          </div>
        </>
      )}

      {/* Permissions Matrix Modal */}
      {showRoleInfo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-2xl bg-slate-900 border border-slate-700 p-5 shadow-2xl text-slate-100 animate-in fade-in">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-amber-400" />
                <h3 className="font-bold text-sm text-white">M1 Enterprises — Role Permissions Matrix</h3>
              </div>
              <button
                onClick={() => setShowRoleInfo(false)}
                className="text-slate-400 hover:text-white p-1 rounded"
              >
                ✕
              </button>
            </div>

            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400">
                    <th className="py-2 pr-3 font-semibold">Capability</th>
                    <th className="py-2 px-2 text-center text-amber-300 font-semibold">Owner</th>
                    <th className="py-2 px-2 text-center text-sky-300 font-semibold">Manager</th>
                    <th className="py-2 px-2 text-center text-emerald-300 font-semibold">Staff</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-slate-300">
                  <tr>
                    <td className="py-2.5 pr-3">Create Bills &amp; Record Sales</td>
                    <td className="py-2.5 px-2 text-center text-emerald-400">✓</td>
                    <td className="py-2.5 px-2 text-center text-emerald-400">✓</td>
                    <td className="py-2.5 px-2 text-center text-emerald-400">✓</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 pr-3">Customer Khata &amp; Collections</td>
                    <td className="py-2.5 px-2 text-center text-emerald-400">✓</td>
                    <td className="py-2.5 px-2 text-center text-emerald-400">✓</td>
                    <td className="py-2.5 px-2 text-center text-emerald-400">✓</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 pr-3">View Purchase Costs &amp; Supplier Rates</td>
                    <td className="py-2.5 px-2 text-center text-emerald-400">✓</td>
                    <td className="py-2.5 px-2 text-center text-emerald-400">✓</td>
                    <td className="py-2.5 px-2 text-center text-rose-500 font-bold">✕ (Hidden)</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 pr-3">View Profit &amp; Margin Reports</td>
                    <td className="py-2.5 px-2 text-center text-emerald-400">✓</td>
                    <td className="py-2.5 px-2 text-center text-emerald-400">✓</td>
                    <td className="py-2.5 px-2 text-center text-rose-500 font-bold">✕ (Locked)</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 pr-3">Add Owners, Managers &amp; Staff Logins</td>
                    <td className="py-2.5 px-2 text-center text-emerald-400">✓</td>
                    <td className="py-2.5 px-2 text-center text-slate-400">Staff Only</td>
                    <td className="py-2.5 px-2 text-center text-rose-500 font-bold">✕</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 pr-3">Void / Cancel Bills (With Reason)</td>
                    <td className="py-2.5 px-2 text-center text-emerald-400">✓</td>
                    <td className="py-2.5 px-2 text-center text-emerald-400">✓</td>
                    <td className="py-2.5 px-2 text-center text-rose-500 font-bold">✕ (Restricted)</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 pr-3">Store Settings &amp; Cloud Database Sync</td>
                    <td className="py-2.5 px-2 text-center text-emerald-400">✓</td>
                    <td className="py-2.5 px-2 text-center text-slate-500">Limited</td>
                    <td className="py-2.5 px-2 text-center text-rose-500 font-bold">✕</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="mt-4 p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-200">
              <strong>Security Guarantee:</strong> Transactions and user logs cannot be silently deleted. Every login, account update, cancellation, or stock edit writes an immutable audit log record.
            </div>

            <button
              onClick={() => setShowRoleInfo(false)}
              className="mt-4 w-full py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-white transition"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
