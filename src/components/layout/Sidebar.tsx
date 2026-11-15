import React from 'react';
import { UserRole } from '../../types';
import { 
  LayoutDashboard, 
  Receipt, 
  Boxes, 
  Users, 
  WalletCards, 
  BarChart3, 
  ShieldCheck, 
  Settings, 
  X, 
  MapPin, 
  Lock,
  Database,
  ShoppingBag,
  TrendingUp,
  UserCog
} from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  onSelectTab: (tab: string) => void;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
  userRole: UserRole;
  lowStockCount: number;
  pendingKhataAmount: number;
  pendingOrdersCount?: number;
  storePhone?: string;
  altPhone?: string;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onSelectTab,
  isOpenMobile,
  onCloseMobile,
  userRole,
  lowStockCount,
  pendingKhataAmount,
  pendingOrdersCount = 0,
  storePhone = '+91 82080 85678',
  altPhone = '+91 74990 87861',
}) => {
  const isOwner = userRole === 'owner';
  const isManager = userRole === 'manager';
  const canViewReports = isOwner || isManager;
  const canViewAudit = isOwner || isManager;
  const canViewSettings = isOwner;

  const navItems = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: LayoutDashboard,
      badge: null,
      allowed: true,
    },
    {
      id: 'orders',
      label: 'Customer Orders',
      icon: ShoppingBag,
      badge: pendingOrdersCount > 0 ? `${pendingOrdersCount} New` : null,
      badgeColor: 'bg-amber-400 text-slate-950 font-black',
      allowed: true,
    },
    {
      id: 'analytics',
      label: 'Shop Analytics',
      icon: TrendingUp,
      badge: null,
      allowed: true,
    },
    {
      id: 'billing',
      label: 'Billing / POS',
      icon: Receipt,
      badge: 'F2',
      allowed: true,
    },
    {
      id: 'inventory',
      label: 'Inventory & Stock',
      icon: Boxes,
      badge: lowStockCount > 0 ? `${lowStockCount} Low` : null,
      badgeColor: 'bg-rose-500/20 text-rose-300 border-rose-500/30',
      allowed: true,
    },
    {
      id: 'customers',
      label: 'Customers & Khata',
      icon: Users,
      badge: pendingKhataAmount > 0 ? `₹${(pendingKhataAmount / 1000).toFixed(0)}k Due` : null,
      badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
      allowed: true,
    },
    {
      id: 'accounts',
      label: 'Accounts & Cashbook',
      icon: WalletCards,
      badge: null,
      allowed: true,
    },
    {
      id: 'reports',
      label: 'Reports & Statements',
      icon: BarChart3,
      badge: userRole === 'staff' ? 'Limited' : null,
      badgeColor: 'bg-slate-700 text-slate-300',
      allowed: true,
    },
    {
      id: 'team',
      label: 'Owners & Staff',
      icon: UserCog,
      badge: null,
      allowed: isOwner || isManager,
    },
    {
      id: 'audit',
      label: 'Security & Audit Logs',
      icon: ShieldCheck,
      badge: null,
      allowed: canViewAudit,
    },
    {
      id: 'settings',
      label: 'Store Settings & DB',
      icon: Settings,
      badge: null,
      allowed: canViewSettings,
    },
  ];

  const handleNavClick = (tabId: string) => {
    onSelectTab(tabId);
    onCloseMobile();
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpenMobile && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-xs lg:hidden"
          onClick={onCloseMobile}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed lg:sticky top-0 lg:top-[85px] left-0 z-40 h-full lg:h-[calc(100vh-85px)] w-64 bg-[#0A223E] border-r border-blue-950 flex flex-col justify-between transition-transform duration-300 ease-in-out ${
          isOpenMobile ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Top Section */}
        <div>
          {/* Mobile Header Inside Drawer */}
          <div className="flex items-center justify-between p-4 border-b border-blue-950 lg:hidden">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-amber-400 font-black text-slate-950 flex items-center justify-center text-xs">
                M1
              </div>
              <span className="font-extrabold text-sm text-white">M1 ENTERPRISES</span>
            </div>
            <button
              onClick={onCloseMobile}
              className="p-1 rounded-lg text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Items */}
          <nav className="p-3 space-y-1">
            <div className="px-3 py-1.5 text-[10px] font-bold tracking-wider text-slate-400 uppercase">
              Main Operations
            </div>

            {navItems.map((item) => {
              if (!item.allowed) return null;
              const isActive = activeTab === item.id;
              const Icon = item.icon;

              return (
                <button
                  key={item.id}
                  onClick={() => handleNavClick(item.id)}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition group ${
                    isActive
                      ? 'bg-amber-400 text-slate-950 shadow-sm font-bold'
                      : 'text-slate-300 hover:bg-white/5 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon
                      className={`w-4 h-4 transition ${
                        isActive ? 'text-slate-950' : 'text-slate-400 group-hover:text-amber-400'
                      }`}
                    />
                    <span>{item.label}</span>
                  </div>

                  {item.badge && (
                    <span
                      className={`px-1.5 py-0.5 rounded text-[10px] font-bold border ${
                        isActive
                          ? 'bg-slate-950/15 text-slate-950 border-slate-950/20'
                          : item.badgeColor || 'bg-blue-900/60 text-blue-200 border-blue-700/50'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Bottom Store Location Badge */}
        <div className="p-3 border-t border-blue-950 bg-[#07192F]">
          <div className="p-3 rounded-xl bg-blue-950/40 border border-blue-900/40 text-slate-300 text-xs">
            <div className="flex items-center gap-1.5 text-amber-400 font-bold text-[11px] mb-1">
              <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
              <span>Showroom Location</span>
            </div>
            <p className="text-[11px] text-slate-300 leading-tight">
              Chatrapati Shivaji Maharaj Chowk, Shrirampur, Ahilyanagar, MH - 413709
            </p>
            <div className="mt-2 pt-2 border-t border-blue-900/50 space-y-0.5 text-[10px] text-slate-300 tabular-nums">
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Owner:</span>
                <span className="font-semibold text-white">{storePhone}</span>
              </div>
              {altPhone && (
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Affan:</span>
                  <span className="font-semibold text-white">{altPhone}</span>
                </div>
              )}
            </div>
            <div className="mt-2 pt-2 border-t border-blue-900/50 flex items-center justify-between text-[10px] text-slate-400">
              <span>GST Status: Pending</span>
              <span className="text-amber-400 font-semibold">Non-GST Retail</span>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};
