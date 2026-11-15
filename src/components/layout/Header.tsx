import React from 'react';
import { User, StoreSettings } from '../../types';
import { PWAInstallButton } from '../common/PWAInstallButton';
import { RoleSwitcher } from '../common/RoleSwitcher';
import { Menu, PlusCircle, Search, ShieldAlert } from 'lucide-react';

interface HeaderProps {
  currentUser: User;
  allUsers: User[];
  onSelectUser: (user: User) => void;
  onLogout: () => void;
  settings: StoreSettings;
  onOpenMobileNav: () => void;
  onNewBillClick: () => void;
  activeTab: string;
  onNavigate: (tab: string) => void;
  searchTerm?: string;
  onSearchChange?: (term: string) => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentUser,
  allUsers,
  onSelectUser,
  onLogout,
  settings,
  onOpenMobileNav,
  onNewBillClick,
  activeTab,
  onNavigate,
  searchTerm = '',
  onSearchChange,
}) => {
  return (
    <header className="sticky top-0 z-30 bg-[#0B2545] border-b border-blue-950/60 shadow-md">
      <div className="px-3 sm:px-6 py-2.5 flex items-center justify-between gap-3">
        {/* Left: Mobile Menu & Store Brand */}
        <div className="flex items-center gap-3">
          <button
            onClick={onOpenMobileNav}
            className="lg:hidden p-2 rounded-xl text-slate-300 hover:text-white hover:bg-white/10 transition"
            aria-label="Toggle navigation menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div 
            onClick={() => onNavigate('dashboard')} 
            className="flex items-center gap-2.5 cursor-pointer group"
          >
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-300 via-amber-400 to-amber-600 flex items-center justify-center font-black text-slate-950 text-base shadow-sm ring-2 ring-amber-400/30 group-hover:scale-105 transition">
              M1
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-sm sm:text-base tracking-tight text-white font-sans">
                  {settings.storeName}
                </span>
                <span className="hidden sm:inline-block px-1.5 py-0.2 rounded text-[10px] font-bold bg-amber-400/20 text-amber-300 border border-amber-400/40">
                  SHRIRAMPUR
                </span>
              </div>
              <p className="text-[10px] text-slate-300 font-medium truncate max-w-[170px] sm:max-w-none">
                {settings.tagline} • Ahilyanagar
              </p>
            </div>
          </div>
        </div>

        {/* Center: Search & Quick Status */}
        <div className="hidden md:flex items-center flex-1 max-w-md mx-4">
          <div className="relative w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search products, models, customer phone, bills..."
              value={searchTerm}
              onChange={(e) => onSearchChange?.(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-slate-900/60 border border-slate-700/80 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-amber-400 transition"
            />
          </div>
        </div>

        {/* Right: Quick Bill Action, PWA Button, GST Status Badge, & Role Switcher */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Quick Create Bill Button */}
          <button
            onClick={onNewBillClick}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 shadow-md shadow-amber-500/20 active:scale-95 transition"
            title="Create New Bill (Non-GST Retail Cash Memo)"
          >
            <PlusCircle className="w-4 h-4 text-slate-950" />
            <span className="font-extrabold">New Bill</span>
          </button>

          {/* PWA Install Button */}
          <PWAInstallButton />

          {/* Role Switcher */}
          <RoleSwitcher
            currentUser={currentUser}
            allUsers={allUsers}
            onSelectUser={onSelectUser}
            onManageTeam={() => onNavigate('team')}
            onLogout={onLogout}
          />
        </div>
      </div>

      {/* Non-GST Active Bar for clear visibility */}
      <div className="bg-[#07192F] px-3 sm:px-6 py-1 border-t border-blue-950 flex items-center justify-between text-[11px] text-slate-300">
        <div className="flex items-center gap-2 overflow-hidden">
          <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse flex-shrink-0"></span>
          <span className="font-semibold text-amber-300 truncate">
            Non-GST Retail Mode Active:
          </span>
          <span className="text-slate-400 truncate hidden sm:inline">
            Tax Invoice issuance locked pending GST Registration ARN verification.
          </span>
        </div>
        <div className="flex items-center gap-3 text-slate-400 flex-shrink-0 text-[10px]">
          <span className="hidden md:inline">FY 2026-27</span>
          <span className="text-amber-400 font-mono font-semibold">INR (₹)</span>
        </div>
      </div>
    </header>
  );
};
