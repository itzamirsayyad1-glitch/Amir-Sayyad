import React, { useState } from 'react';
import { User, UserRole } from '../../types';
import {
  Users,
  UserPlus,
  Crown,
  Briefcase,
  UserCheck,
  Search,
  KeyRound,
  Eye,
  EyeOff,
  Edit3,
  Power,
  LogIn,
  ShieldCheck,
  AlertCircle,
  CheckCircle2,
  X,
} from 'lucide-react';

interface TeamManagementViewProps {
  allUsers: User[];
  currentUser: User;
  onAddUser: (userData: {
    name: string;
    email: string;
    phone: string;
    role: UserRole;
    pin: string;
  }) => { success: boolean; user?: User; message?: string };
  onUpdateUser: (updatedUser: User) => { success: boolean; message?: string };
  onToggleUserStatus: (userId: string, isActive: boolean) => { success: boolean; message?: string };
  onSwitchToUser: (user: User) => void;
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export const TeamManagementView: React.FC<TeamManagementViewProps> = ({
  allUsers,
  currentUser,
  onAddUser,
  onUpdateUser,
  onToggleUserStatus,
  onSwitchToUser,
}) => {
  const isOwner = currentUser.role === 'owner';
  const [roleFilter, setRoleFilter] = useState<'all' | UserRole>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [revealedPinId, setRevealedPinId] = useState<string | null>(null);
  const [statusFeedback, setStatusFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Modal State (Add / Edit)
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [formName, setFormName] = useState('');
  const [formRole, setFormRole] = useState<UserRole>('staff');
  const [formPhone, setFormPhone] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formPin, setFormPin] = useState('');
  const [formError, setFormError] = useState('');

  const ownerCount = allUsers.filter((u) => u.role === 'owner').length;
  const managerCount = allUsers.filter((u) => u.role === 'manager').length;
  const staffCount = allUsers.filter((u) => u.role === 'staff').length;
  const activeCount = allUsers.filter((u) => u.isActive !== false).length;

  const filteredUsers = allUsers.filter((u) => {
    if (roleFilter !== 'all' && u.role !== roleFilter) return false;
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      return (
        u.name.toLowerCase().includes(q) ||
        u.phone.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const openAddModal = (defaultRole: UserRole) => {
    setEditingUser(null);
    setFormName('');
    setFormRole(isOwner ? defaultRole : 'staff');
    setFormPhone('');
    setFormEmail('');
    setFormPin('');
    setFormError('');
    setIsModalOpen(true);
  };

  const openEditModal = (user: User) => {
    setEditingUser(user);
    setFormName(user.name);
    setFormRole(user.role);
    setFormPhone(user.phone);
    setFormEmail(user.email);
    setFormPin(user.pin);
    setFormError('');
    setIsModalOpen(true);
  };

  const handleSaveUser = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!formName.trim()) {
      setFormError('Full name is required.');
      return;
    }
    if (!formPhone.trim() && !formEmail.trim()) {
      setFormError('Mobile number or email address is required.');
      return;
    }
    if (!/^\d{4,6}$/.test(formPin.trim())) {
      setFormError('Login PIN must be 4 to 6 numeric digits.');
      return;
    }

    if (editingUser) {
      const res = onUpdateUser({
        ...editingUser,
        name: formName,
        role: isOwner ? formRole : editingUser.role,
        phone: formPhone,
        email: formEmail,
        pin: formPin,
      });
      if (!res.success) {
        setFormError(res.message || 'Failed to update account.');
        return;
      }
      setStatusFeedback({ type: 'success', text: `Updated login details for ${formName}.` });
      setIsModalOpen(false);
    } else {
      const res = onAddUser({
        name: formName,
        role: isOwner ? formRole : 'staff',
        phone: formPhone,
        email: formEmail,
        pin: formPin,
      });
      if (!res.success) {
        setFormError(res.message || 'Failed to create account.');
        return;
      }
      setStatusFeedback({
        type: 'success',
        text: `Added new ${formRole.toUpperCase()} "${formName}". They can now log in using PIN ${formPin}.`,
      });
      setIsModalOpen(false);
    }
  };

  const handleToggleStatus = (user: User) => {
    const nextActive = user.isActive === false;
    const res = onToggleUserStatus(user.id, nextActive);
    if (!res.success) {
      setStatusFeedback({ type: 'error', text: res.message || 'Unable to update status.' });
    } else {
      setStatusFeedback({
        type: 'success',
        text: `${user.name} is now ${nextActive ? 'Active' : 'Suspended'}.`,
      });
    }
  };

  const getRoleBadge = (role: UserRole) => {
    switch (role) {
      case 'owner':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
            <Crown className="w-3 h-3" />
            Owner
          </span>
        );
      case 'manager':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold bg-sky-50 text-sky-800 border border-sky-200">
            <Briefcase className="w-3 h-3" />
            Manager
          </span>
        );
      case 'staff':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
            <UserCheck className="w-3 h-3" />
            Staff
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900">
            Owners &amp; Staff Access
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Add Co-Owners, Managers, and Counter Staff with individual login PINs and role-based permissions.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {isOwner && (
            <button
              onClick={() => openAddModal('owner')}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-400 hover:bg-amber-500 text-slate-950 font-extrabold text-xs shadow-sm transition cursor-pointer"
            >
              <Crown className="w-4 h-4" />
              <span>Add New Owner</span>
            </button>
          )}
          <button
            onClick={() => openAddModal('staff')}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#0B2545] hover:bg-blue-950 text-white font-bold text-xs shadow-sm transition cursor-pointer"
          >
            <UserPlus className="w-4 h-4 text-amber-400" />
            <span>{isOwner ? 'Add Manager / Staff' : 'Add Counter Staff'}</span>
          </button>
        </div>
      </div>

      {/* Feedback Banner */}
      {statusFeedback && (
        <div
          className={`p-3.5 rounded-xl border text-xs font-semibold flex items-center justify-between gap-2 ${
            statusFeedback.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-rose-50 border-rose-200 text-rose-800'
          }`}
        >
          <div className="flex items-center gap-2">
            {statusFeedback.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
            )}
            <span>{statusFeedback.text}</span>
          </div>
          <button onClick={() => setStatusFeedback(null)} className="text-current opacity-70 hover:opacity-100">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* KPI Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Total Owners</div>
          <div className="mt-1.5 flex items-baseline justify-between">
            <span className="text-2xl font-black text-slate-900 tabular-nums">{ownerCount}</span>
            <Crown className="w-5 h-5 text-amber-500" />
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Full store &amp; profit control</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Managers</div>
          <div className="mt-1.5 flex items-baseline justify-between">
            <span className="text-2xl font-black text-slate-900 tabular-nums">{managerCount}</span>
            <Briefcase className="w-5 h-5 text-sky-600" />
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Stock, billing &amp; reports</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Counter Staff</div>
          <div className="mt-1.5 flex items-baseline justify-between">
            <span className="text-2xl font-black text-slate-900 tabular-nums">{staffCount}</span>
            <UserCheck className="w-5 h-5 text-emerald-600" />
          </div>
          <p className="text-[11px] text-slate-500 mt-1">POS billing &amp; Khata receipts</p>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Active Logins</div>
          <div className="mt-1.5 flex items-baseline justify-between">
            <span className="text-2xl font-black text-slate-900 tabular-nums">
              {activeCount} / {allUsers.length}
            </span>
            <ShieldCheck className="w-5 h-5 text-blue-700" />
          </div>
          <p className="text-[11px] text-slate-500 mt-1">PIN-protected terminal access</p>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-1.5">
          {(['all', 'owner', 'manager', 'staff'] as const).map((role) => (
            <button
              key={role}
              onClick={() => setRoleFilter(role)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold capitalize transition cursor-pointer ${
                roleFilter === role
                  ? 'bg-[#0B2545] text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {role === 'all' ? 'All Accounts' : `${role}s`}
            </button>
          ))}
        </div>

        <div className="relative sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search name, mobile or email..."
            className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-blue-600"
          />
        </div>
      </div>

      {/* Accounts Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <th className="py-3 px-4">User</th>
                <th className="py-3 px-4">Role</th>
                <th className="py-3 px-4">Contact Credentials</th>
                <th className="py-3 px-4">Login PIN</th>
                <th className="py-3 px-4">Last Login</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {filteredUsers.map((u) => {
                const isSelf = u.id === currentUser.id;
                const isPinRevealed = revealedPinId === u.id;
                const canModifyThisUser = isOwner || u.role === 'staff';
                const isActive = u.isActive !== false;

                return (
                  <tr key={u.id} className={`hover:bg-slate-50/80 transition ${!isActive ? 'opacity-65' : ''}`}>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-9 h-9 rounded-lg font-extrabold text-xs flex items-center justify-center flex-shrink-0 ${
                            u.role === 'owner'
                              ? 'bg-[#0B2545] text-amber-400'
                              : u.role === 'manager'
                              ? 'bg-sky-100 text-sky-900'
                              : 'bg-emerald-100 text-emerald-900'
                          }`}
                        >
                          {getInitials(u.name)}
                        </div>
                        <div>
                          <div className="font-bold text-slate-900 flex items-center gap-1.5">
                            <span>{u.name}</span>
                            {isSelf && (
                              <span className="px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 text-[10px] font-bold border border-blue-200">
                                You
                              </span>
                            )}
                          </div>
                          {u.isDemo && (
                            <span className="text-[10px] text-slate-400 font-medium">Demo Account</span>
                          )}
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-4">{getRoleBadge(u.role)}</td>

                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-800 tabular-nums">{u.phone || '—'}</div>
                      <div className="text-[11px] text-slate-500">{u.email}</div>
                    </td>

                    <td className="py-3.5 px-4">
                      {isOwner || isSelf ? (
                        <div className="flex items-center gap-1.5 font-mono">
                          <span className="px-2 py-0.5 rounded bg-slate-100 border border-slate-200 text-slate-800 font-bold">
                            {isPinRevealed ? u.pin : '••••'}
                          </span>
                          <button
                            type="button"
                            onClick={() => setRevealedPinId(isPinRevealed ? null : u.id)}
                            className="p-1 text-slate-400 hover:text-slate-700"
                            title={isPinRevealed ? 'Hide PIN' : 'Show PIN'}
                          >
                            {isPinRevealed ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      ) : (
                        <span className="text-slate-400 font-mono">••••</span>
                      )}
                    </td>

                    <td className="py-3.5 px-4 text-slate-600 tabular-nums">
                      {u.lastLogin
                        ? new Date(u.lastLogin).toLocaleString('en-IN', {
                            day: '2-digit',
                            month: 'short',
                            hour: '2-digit',
                            minute: '2-digit',
                          })
                        : 'Never'}
                    </td>

                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-bold border ${
                          isActive
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : 'bg-rose-50 text-rose-700 border-rose-200'
                        }`}
                      >
                        {isActive ? 'Active' : 'Suspended'}
                      </span>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="flex items-center justify-end gap-1.5">
                        {!isSelf && isActive && (
                          <button
                            type="button"
                            onClick={() => onSwitchToUser(u)}
                            className="px-2.5 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-[11px] flex items-center gap-1 transition cursor-pointer"
                            title="Log in as this user"
                          >
                            <LogIn className="w-3.5 h-3.5" />
                            <span>Login</span>
                          </button>
                        )}

                        {canModifyThisUser && (
                          <button
                            type="button"
                            onClick={() => openEditModal(u)}
                            className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-600 transition cursor-pointer"
                            title="Edit Details / Reset PIN"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                        )}

                        {isOwner && !isSelf && (
                          <button
                            type="button"
                            onClick={() => handleToggleStatus(u)}
                            className={`p-1.5 rounded-lg border transition cursor-pointer ${
                              isActive
                                ? 'border-rose-200 text-rose-600 hover:bg-rose-50'
                                : 'border-emerald-200 text-emerald-600 hover:bg-emerald-50'
                            }`}
                            title={isActive ? 'Suspend Account' : 'Reactivate Account'}
                          >
                            <Power className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}

              {filteredUsers.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-10 text-center text-slate-400">
                    No matching owner or staff accounts found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden">
            <div className="bg-[#0B2545] px-5 py-4 flex items-center justify-between text-white">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-amber-400" />
                <h3 className="font-bold text-sm">
                  {editingUser ? `Edit ${editingUser.name}` : 'Add Owner / Staff Account'}
                </h3>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-300 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveUser} className="p-5 space-y-4">
              {formError && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="e.g., Suresh Jadhav"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Account Role *</label>
                <select
                  value={formRole}
                  disabled={!isOwner}
                  onChange={(e) => setFormRole(e.target.value as UserRole)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm bg-white disabled:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-600"
                >
                  {isOwner && <option value="owner">Owner (Full Access + Add Owners &amp; Staff)</option>}
                  {isOwner && <option value="manager">Manager (Billing, Stock, Purchases &amp; Profit)</option>}
                  <option value="staff">Staff / Cashier (Billing, Orders &amp; Khata Only)</option>
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Mobile Number *</label>
                  <input
                    type="tel"
                    required
                    value={formPhone}
                    onChange={(e) => setFormPhone(e.target.value)}
                    placeholder="+91 98XXXXXXXX"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm tabular-nums focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Login PIN (4–6 Digits) *</label>
                  <div className="relative">
                    <KeyRound className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      inputMode="numeric"
                      maxLength={6}
                      required
                      value={formPin}
                      onChange={(e) => setFormPin(e.target.value.replace(/\D/g, ''))}
                      placeholder="e.g., 4545"
                      className="w-full pl-8 pr-3 py-2 rounded-xl border border-slate-300 text-sm font-mono tracking-widest focus:outline-none focus:ring-2 focus:ring-blue-600"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Email Address</label>
                <input
                  type="email"
                  value={formEmail}
                  onChange={(e) => setFormEmail(e.target.value)}
                  placeholder="name@m1enterprises.in"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-xs font-bold text-slate-700 hover:bg-slate-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#0B2545] hover:bg-blue-950 text-white text-xs font-bold shadow-sm cursor-pointer"
                >
                  {editingUser ? 'Save Changes' : 'Create Login Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
