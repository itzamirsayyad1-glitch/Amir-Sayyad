import React, { useState } from 'react';
import { StoreSettings, User, UserRole } from '../../types';
import {
  ShieldCheck,
  KeyRound,
  UserPlus,
  LogIn,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle2,
  MapPin,
  Users,
  Crown,
  Briefcase,
  UserCheck,
  ArrowRight,
} from 'lucide-react';

interface LoginViewProps {
  allUsers: User[];
  settings: StoreSettings;
  onLogin: (identifier: string, pin: string) => { success: boolean; user?: User; message?: string };
  onRegisterOwnerWithStaff: (
    ownerData: { name: string; phone: string; email: string; pin: string },
    initialStaff?: { name: string; phone: string; email: string; role: 'manager' | 'staff'; pin: string }
  ) => { success: boolean; message?: string };
  onQuickDemoLogin: (user: User) => void;
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export const LoginView: React.FC<LoginViewProps> = ({
  allUsers,
  settings,
  onLogin,
  onRegisterOwnerWithStaff,
  onQuickDemoLogin,
}) => {
  const [mode, setMode] = useState<'login' | 'register_owner'>('login');

  // Login Form State
  const [identifier, setIdentifier] = useState('');
  const [pin, setPin] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [loginError, setLoginError] = useState('');

  // Add Owner (+ Optional Staff) State
  const [ownerName, setOwnerName] = useState('');
  const [ownerPhone, setOwnerPhone] = useState('');
  const [ownerEmail, setOwnerEmail] = useState('');
  const [ownerPin, setOwnerPin] = useState('');

  const [includeStaff, setIncludeStaff] = useState(true);
  const [staffName, setStaffName] = useState('');
  const [staffPhone, setStaffPhone] = useState('');
  const [staffEmail, setStaffEmail] = useState('');
  const [staffRole, setStaffRole] = useState<'manager' | 'staff'>('staff');
  const [staffPin, setStaffPin] = useState('');

  const [regError, setRegError] = useState('');

  const activeUsers = allUsers.filter((u) => u.isActive !== false);
  const sortedUsers = [...activeUsers].sort((a, b) => {
    const order: Record<UserRole, number> = { owner: 0, manager: 1, staff: 2 };
    return order[a.role] - order[b.role];
  });

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    const result = onLogin(identifier, pin);
    if (!result.success) {
      setLoginError(result.message || 'Invalid login credentials.');
    }
  };

  const handleSelectAccount = (user: User) => {
    setMode('login');
    setIdentifier(user.phone || user.email);
    setPin('');
    setLoginError('');
  };

  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setRegError('');

    if (!ownerName.trim() || (!ownerPhone.trim() && !ownerEmail.trim())) {
      setRegError('Please enter Owner full name and mobile number or email.');
      return;
    }
    if (!/^\d{4,6}$/.test(ownerPin.trim())) {
      setRegError('Owner login PIN must be 4 to 6 numeric digits.');
      return;
    }

    if (includeStaff) {
      if (!staffName.trim() || (!staffPhone.trim() && !staffEmail.trim())) {
        setRegError('Please enter Staff full name and mobile number or email (or uncheck optional staff).');
        return;
      }
      if (!/^\d{4,6}$/.test(staffPin.trim())) {
        setRegError('Staff login PIN must be 4 to 6 numeric digits.');
        return;
      }
    }

    const res = onRegisterOwnerWithStaff(
      {
        name: ownerName,
        phone: ownerPhone,
        email: ownerEmail,
        pin: ownerPin,
      },
      includeStaff
        ? {
            name: staffName,
            phone: staffPhone,
            email: staffEmail,
            role: staffRole,
            pin: staffPin,
          }
        : undefined
    );

    if (!res.success) {
      setRegError(res.message || 'Could not register owner.');
    }
  };

  const getRoleLabel = (role: UserRole) => {
    if (role === 'owner') return 'Owner';
    if (role === 'manager') return 'Manager';
    return 'Staff';
  };

  const getRoleBadgeClasses = (role: UserRole) => {
    if (role === 'owner') return 'bg-amber-50 text-amber-800 border-amber-200';
    if (role === 'manager') return 'bg-sky-50 text-sky-800 border-sky-200';
    return 'bg-emerald-50 text-emerald-800 border-emerald-200';
  };

  return (
    <div className="min-h-screen bg-[#07192F] flex flex-col justify-between p-4 sm:p-6 lg:p-10">
      {/* Top Bar */}
      <div className="max-w-6xl w-full mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-6 border-b border-blue-900/50">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-amber-300 via-amber-400 to-amber-500 flex items-center justify-center font-black text-slate-950 text-lg shadow-sm">
            M1
          </div>
          <div>
            <h1 className="text-lg sm:text-xl font-extrabold text-white tracking-tight">
              {settings.storeName}
            </h1>
            <p className="text-xs text-slate-300 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-amber-400" />
              <span>{settings.city}, {settings.district}, {settings.state}</span>
            </p>
          </div>
        </div>
        <div className="text-xs text-slate-300 bg-blue-950/60 border border-blue-800/60 px-3.5 py-2 rounded-xl flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-amber-400 flex-shrink-0" />
          <span>Non-GST Retail Billing &amp; Inventory Terminal</span>
        </div>
      </div>

      {/* Main Split Card */}
      <div className="max-w-6xl w-full mx-auto my-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: Login / Add Owner Form */}
        <div className="lg:col-span-7 bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
          {/* Mode Tabs */}
          <div className="grid grid-cols-2 bg-slate-100 p-1.5 border-b border-slate-200">
            <button
              type="button"
              onClick={() => {
                setMode('login');
                setLoginError('');
              }}
              className={`flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs sm:text-sm font-bold transition ${
                mode === 'login'
                  ? 'bg-[#0B2545] text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <LogIn className="w-4 h-4" />
              <span>Owner &amp; Staff Login</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('register_owner');
                setRegError('');
              }}
              className={`flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs sm:text-sm font-bold transition ${
                mode === 'register_owner'
                  ? 'bg-[#0B2545] text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <UserPlus className="w-4 h-4" />
              <span>Add New Owner</span>
            </button>
          </div>

          {mode === 'login' ? (
            <form onSubmit={handleLoginSubmit} className="p-5 sm:p-8 space-y-5">
              <div>
                <h2 className="text-xl font-extrabold text-slate-900">Sign In to Store Terminal</h2>
                <p className="text-xs sm:text-sm text-slate-500 mt-1">
                  Log in as Shop Owner, Manager, or Counter Staff using your mobile number or email and PIN.
                </p>
              </div>

              {loginError && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{loginError}</span>
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wide">
                    Mobile Number or Email
                  </label>
                  <input
                    type="text"
                    required
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    placeholder="e.g., 8208085678 or owner@m1enterprises.in"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wide">
                    Login PIN (4–6 Digits)
                  </label>
                  <div className="relative">
                    <KeyRound className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type={showPin ? 'text' : 'password'}
                      inputMode="numeric"
                      maxLength={6}
                      required
                      value={pin}
                      onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
                      placeholder="Enter 4-digit PIN"
                      className="w-full pl-10 pr-11 py-2.5 rounded-xl border border-slate-300 text-sm text-slate-900 font-mono tracking-widest focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPin(!showPin)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 p-1"
                      aria-label={showPin ? 'Hide PIN' : 'Show PIN'}
                    >
                      {showPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3 px-4 rounded-xl bg-[#0B2545] hover:bg-blue-950 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-sm transition cursor-pointer"
              >
                <span>Sign In to M1 Enterprises</span>
                <ArrowRight className="w-4 h-4 text-amber-400" />
              </button>

              <div className="pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
                <span>Need a new partner or co-owner login?</span>
                <button
                  type="button"
                  onClick={() => setMode('register_owner')}
                  className="font-bold text-blue-700 hover:text-blue-900 underline underline-offset-2"
                >
                  Add New Owner &amp; Staff →
                </button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleRegisterSubmit} className="p-5 sm:p-8 space-y-5">
              <div>
                <h2 className="text-xl font-extrabold text-slate-900">Add New Owner &amp; Staff</h2>
                <p className="text-xs sm:text-sm text-slate-500 mt-1">
                  Create a new Owner account with full store permissions, and optionally onboard a Manager or Staff member together.
                </p>
              </div>

              {regError && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{regError}</span>
                </div>
              )}

              {/* Owner Fields */}
              <div className="p-4 rounded-xl bg-amber-50/60 border border-amber-200/80 space-y-3">
                <div className="flex items-center gap-2 text-xs font-extrabold text-amber-900 uppercase tracking-wider">
                  <Crown className="w-4 h-4 text-amber-600" />
                  <span>New Owner Details</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">Owner Full Name *</label>
                    <input
                      type="text"
                      required
                      value={ownerName}
                      onChange={(e) => setOwnerName(e.target.value)}
                      placeholder="e.g., Vikram Shinde"
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">Mobile Number *</label>
                    <input
                      type="tel"
                      required
                      value={ownerPhone}
                      onChange={(e) => setOwnerPhone(e.target.value)}
                      placeholder="+91 98XXXXXXXX"
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white text-sm text-slate-900 tabular-nums focus:outline-none focus:ring-2 focus:ring-blue-600"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">Email Address</label>
                    <input
                      type="email"
                      value={ownerEmail}
                      onChange={(e) => setOwnerEmail(e.target.value)}
                      placeholder="owner@m1enterprises.in"
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">Owner Login PIN (4–6 Digits) *</label>
                    <input
                      type="password"
                      inputMode="numeric"
                      maxLength={6}
                      required
                      value={ownerPin}
                      onChange={(e) => setOwnerPin(e.target.value.replace(/\D/g, ''))}
                      placeholder="e.g., 4545"
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white text-sm text-slate-900 font-mono tracking-widest focus:outline-none focus:ring-2 focus:ring-blue-600"
                    />
                  </div>
                </div>
              </div>

              {/* Optional Initial Staff / Manager Toggle */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                <label className="flex items-center justify-between cursor-pointer">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-blue-700" />
                    <span className="text-xs font-bold text-slate-800">Also add a Staff / Manager member now</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={includeStaff}
                    onChange={(e) => setIncludeStaff(e.target.checked)}
                    className="w-4 h-4 accent-[#0B2545] rounded"
                  />
                </label>

                {includeStaff && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-200">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">Staff Full Name *</label>
                      <input
                        type="text"
                        required={includeStaff}
                        value={staffName}
                        onChange={(e) => setStaffName(e.target.value)}
                        placeholder="e.g., Sagar More"
                        className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">Role *</label>
                      <select
                        value={staffRole}
                        onChange={(e) => setStaffRole(e.target.value as 'manager' | 'staff')}
                        className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                      >
                        <option value="staff">Staff / Cashier (Billing &amp; Khata)</option>
                        <option value="manager">Manager (Billing, Stock &amp; Reports)</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">Staff Mobile Number *</label>
                      <input
                        type="tel"
                        required={includeStaff}
                        value={staffPhone}
                        onChange={(e) => setStaffPhone(e.target.value)}
                        placeholder="+91 97XXXXXXXX"
                        className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white text-sm text-slate-900 tabular-nums focus:outline-none focus:ring-2 focus:ring-blue-600"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">Staff Login PIN (4–6 Digits) *</label>
                      <input
                        type="password"
                        inputMode="numeric"
                        maxLength={6}
                        required={includeStaff}
                        value={staffPin}
                        onChange={(e) => setStaffPin(e.target.value.replace(/\D/g, ''))}
                        placeholder="e.g., 5656"
                        className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white text-sm text-slate-900 font-mono tracking-widest focus:outline-none focus:ring-2 focus:ring-blue-600"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">Staff Email (Optional)</label>
                      <input
                        type="email"
                        value={staffEmail}
                        onChange={(e) => setStaffEmail(e.target.value)}
                        placeholder="staff@m1enterprises.in"
                        className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                      />
                    </div>
                  </div>
                )}
              </div>

              <button
                type="submit"
                className="w-full py-3 px-4 rounded-xl bg-amber-400 hover:bg-amber-500 text-slate-950 font-extrabold text-sm flex items-center justify-center gap-2 shadow-sm transition cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Create Owner {includeStaff ? '& Staff ' : ''}and Sign In</span>
              </button>
            </form>
          )}
        </div>

        {/* Right: Quick Account Directory */}
        <div className="lg:col-span-5 bg-[#0B2545] rounded-2xl border border-blue-800/60 p-5 sm:p-6 text-white space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-blue-900/70">
            <div>
              <h3 className="text-sm font-extrabold text-white">Registered Owners &amp; Staff</h3>
              <p className="text-[11px] text-slate-300 mt-0.5">
                Click any account to fill credentials, or use 1-click sign-in on demo profiles.
              </p>
            </div>
            <span className="text-xs font-bold text-amber-300 tabular-nums">{sortedUsers.length} Active</span>
          </div>

          <div className="space-y-2.5 max-h-[420px] overflow-y-auto pr-1">
            {sortedUsers.map((u) => (
              <div
                key={u.id}
                className="p-3 rounded-xl bg-slate-900/60 border border-blue-900/70 hover:border-amber-400/50 transition"
              >
                <div className="flex items-start justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => handleSelectAccount(u)}
                    className="flex items-center gap-3 text-left flex-1 min-w-0 cursor-pointer"
                  >
                    <div
                      className={`w-10 h-10 rounded-lg font-extrabold text-xs flex items-center justify-center flex-shrink-0 ${
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
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-sm font-bold text-white truncate">{u.name}</span>
                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold border ${getRoleBadgeClasses(u.role)}`}>
                          {getRoleLabel(u.role)}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-300 tabular-nums truncate mt-0.5">
                        {u.phone || u.email}
                      </p>
                    </div>
                  </button>

                  {u.isDemo && (
                    <button
                      type="button"
                      onClick={() => onQuickDemoLogin(u)}
                      className="px-2.5 py-1.5 rounded-lg bg-amber-400/15 hover:bg-amber-400 text-amber-300 hover:text-slate-950 border border-amber-400/30 text-[11px] font-bold transition flex-shrink-0 cursor-pointer"
                    >
                      Demo Login
                    </button>
                  )}
                </div>

                {u.isDemo && (
                  <div className="mt-2 pt-2 border-t border-blue-950/80 flex items-center justify-between text-[11px] text-slate-400">
                    <span>Demo Profile</span>
                    <span className="font-mono text-amber-300 font-semibold">PIN: {u.pin}</span>
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="p-3.5 rounded-xl bg-blue-950/60 border border-blue-900 text-[11px] text-slate-300 space-y-1.5">
            <div className="flex items-center gap-1.5 font-bold text-amber-300">
              <Briefcase className="w-3.5 h-3.5" />
              <span>Role Access Summary</span>
            </div>
            <p><strong className="text-white">Owner:</strong> Full access including adding Owners/Staff, purchase costs, profit reports &amp; settings.</p>
            <p><strong className="text-white">Manager:</strong> Billing, inventory, orders, purchases &amp; profit reports.</p>
            <p><strong className="text-white">Staff:</strong> POS billing, customer orders &amp; Khata payments (purchase costs &amp; profits hidden).</p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="max-w-6xl w-full mx-auto pt-4 border-t border-blue-900/50 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-400">
        <span>{settings.address}, {settings.city} - {settings.pincode}</span>
        <span>All logins &amp; account changes are recorded in Audit Logs</span>
      </div>
    </div>
  );
};
