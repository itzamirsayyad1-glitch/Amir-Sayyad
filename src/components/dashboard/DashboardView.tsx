import React from 'react';
import { 
  Invoice, 
  Product, 
  Customer, 
  Expense, 
  StoreSettings, 
  UserRole 
} from '../../types';
import { GSTAlertBanner } from '../common/GSTAlertBanner';
import { 
  TrendingUp, 
  Receipt, 
  AlertTriangle, 
  Users, 
  Wallet, 
  IndianRupee, 
  Lock, 
  Plus, 
  Eye, 
  Share2, 
  ArrowUpRight,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Sparkles,
  ShoppingBag,
  BarChart3
} from 'lucide-react';

interface DashboardViewProps {
  invoices: Invoice[];
  products: Product[];
  customers: Customer[];
  expenses: Expense[];
  settings: StoreSettings;
  userRole: UserRole;
  onNavigate: (tab: string) => void;
  onSelectInvoice: (invoice: Invoice) => void;
  onNewBill: () => void;
  onAddStock: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  invoices,
  products,
  customers,
  expenses,
  settings,
  userRole,
  onNavigate,
  onSelectInvoice,
  onNewBill,
  onAddStock,
}) => {
  const isOwnerOrManager = userRole === 'owner' || userRole === 'manager';

  // Calculations for Today & This Month from existing invoices
  const now = new Date();
  const todayDateStr = now.toISOString().split('T')[0];
  const currentMonthStr = todayDateStr.slice(0, 7);
  const currentMonthLabel = now.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
  
  const validInvoices = invoices.filter((i) => !i.isVoided && i.status !== 'voided');
  
  // Today's Sales
  const todayInvoices = validInvoices.filter((i) => i.date.startsWith(todayDateStr));
  const todayTotalSales = todayInvoices.reduce((acc, curr) => acc + curr.totalAmount, 0);
  const todayCashCollected = todayInvoices.reduce((acc, curr) => acc + (curr.paymentDetails?.cashAmount || (curr.paymentMethod === 'cash' ? curr.amountPaid : 0)), 0);
  const todayUpiCollected = todayInvoices.reduce((acc, curr) => acc + (curr.paymentDetails?.upiAmount || (curr.paymentMethod === 'upi' ? curr.amountPaid : 0)), 0);

  // This Month's Sales
  const monthInvoices = validInvoices.filter((i) => i.date.startsWith(currentMonthStr));
  const monthTotalSales = monthInvoices.reduce((acc, curr) => acc + curr.totalAmount, 0);
  const monthCollected = monthInvoices.reduce((acc, curr) => acc + curr.amountPaid, 0);
  const todayShareOfMonth = monthTotalSales > 0 ? Math.min(100, Math.round((todayTotalSales / monthTotalSales) * 100)) : 0;
  const monthDailyAverage = monthTotalSales > 0 ? Math.round(monthTotalSales / Math.max(1, now.getDate())) : 0;

  // Total Outstanding Khata (Customer Credit)
  const totalOutstandingKhata = customers.reduce((acc, c) => acc + (c.outstandingBalance || 0), 0);

  // Low stock products
  const lowStockProducts = products.filter(
    (p) => p.isActive && p.stockQuantity <= p.minStockAlert
  );

  // Today's Expenses
  const todayExpensesList = expenses.filter((e) => e.date.startsWith(todayDateStr));
  const todayExpensesTotal = todayExpensesList.reduce((acc, e) => acc + e.amount, 0);

  // Profit calculation (Owner & Manager only)
  let todayEstimatedProfit = 0;
  if (isOwnerOrManager) {
    todayInvoices.forEach((inv) => {
      inv.items.forEach((item) => {
        const cost = item.purchasePrice || (products.find((p) => p.id === item.productId)?.purchasePrice || 0);
        const itemProfit = item.total - (cost * item.quantity);
        todayEstimatedProfit += itemProfit;
      });
    });
    // Subtract today's expenses from gross profit
    todayEstimatedProfit = Math.max(0, todayEstimatedProfit - todayExpensesTotal);
  }

  // Recent 6 Invoices
  const recentInvoices = [...invoices].slice(0, 6);

  return (
    <div className="space-y-6">
      {/* Top Banner: GST Statutory Status */}
      <GSTAlertBanner onConfigureClick={() => onNavigate('settings')} />

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Today's Sales */}
        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex flex-col justify-between hover:border-blue-400/60 transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Today's Sales
            </span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center font-bold">
              <Receipt className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-xl sm:text-2xl font-black text-[#0B2545] font-sans">
              ₹{todayTotalSales.toLocaleString('en-IN')}
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">
              {todayInvoices.length} {todayInvoices.length === 1 ? 'bill generated' : 'bills generated'} today
            </p>
          </div>
          <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px]">
            <span className="text-slate-500">Cash: ₹{todayCashCollected.toLocaleString('en-IN')}</span>
            <span className="text-blue-700 font-semibold">UPI: ₹{todayUpiCollected.toLocaleString('en-IN')}</span>
          </div>
        </div>

        {/* Outstanding Khata / Customer Credit */}
        <div 
          onClick={() => onNavigate('customers')}
          className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex flex-col justify-between hover:border-amber-400/80 cursor-pointer transition"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Customer Khata Due
            </span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center font-bold">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-xl sm:text-2xl font-black text-amber-700 font-sans">
              ₹{totalOutstandingKhata.toLocaleString('en-IN')}
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Uncollected Udhar / Balances
            </p>
          </div>
          <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px] text-amber-800 font-medium">
            <span>View 5 Active Customers</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </div>
        </div>

        {/* Low Stock Alerts */}
        <div 
          onClick={() => onNavigate('inventory')}
          className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex flex-col justify-between hover:border-rose-400/80 cursor-pointer transition"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Stock Alerts
            </span>
            <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-700 flex items-center justify-center font-bold">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-xl sm:text-2xl font-black text-rose-600 font-sans">
              {lowStockProducts.length} Models
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Below re-order threshold
            </p>
          </div>
          <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px] text-rose-700 font-medium">
            <span>Reorder Inverter AC &amp; Audio</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </div>
        </div>

        {/* Profit Summary (Role Gated) */}
        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex flex-col justify-between hover:border-emerald-400/80 transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Net Profit (Est.)
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
              {isOwnerOrManager ? (
                <TrendingUp className="w-4 h-4" />
              ) : (
                <Lock className="w-4 h-4 text-slate-400" />
              )}
            </div>
          </div>
          <div className="mt-2">
            {isOwnerOrManager ? (
              <>
                <div className="text-xl sm:text-2xl font-black text-emerald-700 font-sans">
                  ₹{todayEstimatedProfit.toLocaleString('en-IN')}
                </div>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Today's net margin after expenses
                </p>
              </>
            ) : (
              <>
                <div className="text-sm font-bold text-slate-400 italic">
                  Restricted Access
                </div>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Owner &amp; Manager view only
                </p>
              </>
            )}
          </div>
          <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
            <span>Today's Exp: ₹{todayExpensesTotal.toLocaleString('en-IN')}</span>
            <span className="text-emerald-700 font-semibold">{isOwnerOrManager ? 'Healthy' : 'Protected'}</span>
          </div>
        </div>
      </div>

      {/* Total Sales Today vs Total Sales This Month Summary Card */}
      <div className="rounded-2xl bg-white border border-slate-200/80 shadow-xs p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#0B2545] text-amber-400 flex items-center justify-center flex-shrink-0">
              <IndianRupee className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-extrabold text-slate-900">
                Total Sales Today vs Total Sales This Month
              </h3>
              <p className="text-xs text-slate-500">
                Live revenue comparison from non-voided store invoices ({currentMonthLabel})
              </p>
            </div>
          </div>

          <button
            onClick={() => onNavigate('reports')}
            className="text-xs font-bold text-blue-700 hover:text-blue-900 flex items-center gap-1 self-start sm:self-center cursor-pointer"
          >
            <span>Open Sales Reports</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Total Sales Today */}
          <div className="p-4 rounded-xl bg-blue-50/60 border border-blue-200/80 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold text-blue-900 uppercase tracking-wider">
                Total Sales Today
              </span>
              <span className="text-[11px] font-bold text-blue-700 tabular-nums">
                {todayInvoices.length} {todayInvoices.length === 1 ? 'Invoice' : 'Invoices'}
              </span>
            </div>
            <div className="mt-2 text-2xl sm:text-3xl font-black text-[#0B2545] tabular-nums">
              ₹{todayTotalSales.toLocaleString('en-IN')}
            </div>
            <div className="mt-2 flex items-center justify-between text-[11px] text-slate-600 tabular-nums">
              <span>Date: {now.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
              <span className="font-semibold text-blue-800">
                {todayShareOfMonth}% of this month
              </span>
            </div>
          </div>

          {/* Total Sales This Month */}
          <div className="p-4 rounded-xl bg-amber-50/60 border border-amber-200/80 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold text-amber-900 uppercase tracking-wider">
                Total Sales This Month
              </span>
              <span className="text-[11px] font-bold text-amber-800 tabular-nums">
                {monthInvoices.length} {monthInvoices.length === 1 ? 'Invoice' : 'Invoices'}
              </span>
            </div>
            <div className="mt-2 text-2xl sm:text-3xl font-black text-slate-900 tabular-nums">
              ₹{monthTotalSales.toLocaleString('en-IN')}
            </div>
            <div className="mt-2 flex items-center justify-between text-[11px] text-slate-600 tabular-nums">
              <span>Collected: ₹{monthCollected.toLocaleString('en-IN')}</span>
              <span className="font-semibold text-amber-900">
                Daily Avg: ₹{monthDailyAverage.toLocaleString('en-IN')}
              </span>
            </div>
          </div>
        </div>

        {/* Visual Comparison Bar */}
        <div className="mt-4 pt-3 border-t border-slate-100">
          <div className="flex items-center justify-between text-[11px] font-semibold text-slate-600 mb-1.5 tabular-nums">
            <span>Today's Contribution to {currentMonthLabel} Revenue</span>
            <span className="text-[#0B2545] font-bold">
              ₹{todayTotalSales.toLocaleString('en-IN')} / ₹{monthTotalSales.toLocaleString('en-IN')} ({todayShareOfMonth}%)
            </span>
          </div>
          <div className="w-full h-2.5 rounded-full bg-slate-100 overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-[#0B2545] to-amber-400 transition-all duration-500"
              style={{ width: `${todayTotalSales > 0 ? Math.max(4, todayShareOfMonth) : 0}%` }}
            />
          </div>
        </div>
      </div>

      {/* Quick Action Bar for Counter Staff */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-[#0B2545] to-[#123966] text-white shadow-md flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-400 text-slate-950 flex items-center justify-center font-black">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-extrabold text-sm sm:text-base">M1 Counter POS Fast Actions</h3>
            <p className="text-xs text-slate-300">
              Shrirampur Showroom • Quick customer checkouts and inventory entries
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => onNavigate('orders')}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition active:scale-95 shadow-sm"
          >
            <ShoppingBag className="w-4 h-4 text-amber-300" />
            <span>Take Order</span>
          </button>

          <button
            onClick={() => onNavigate('analytics')}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold border border-white/20 transition active:scale-95"
          >
            <BarChart3 className="w-4 h-4 text-amber-400" />
            <span>Analytics</span>
          </button>

          <button
            onClick={onNewBill}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-black shadow-md transition active:scale-95"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>New Bill</span>
          </button>
        </div>
      </div>

      {/* Two Column Grid: Low Stock Alert Warning & Recent Invoices */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 Cols): Recent Invoices */}
        <div className="lg:col-span-2 rounded-2xl bg-white border border-slate-200/80 shadow-xs p-5">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div>
              <h3 className="font-bold text-sm sm:text-base text-slate-900">
                Recent Store Invoices
              </h3>
              <p className="text-xs text-slate-500">
                Latest transactions at Shrirampur counter
              </p>
            </div>
            <button
              onClick={() => onNavigate('billing')}
              className="text-xs font-bold text-blue-700 hover:text-blue-800 flex items-center gap-1"
            >
              <span>View POS Terminal</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="mt-3 divide-y divide-slate-100 overflow-x-auto">
            {recentInvoices.map((inv) => (
              <div
                key={inv.id}
                className="py-3 flex items-center justify-between gap-3 hover:bg-slate-50/80 px-2 rounded-xl transition"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs flex-shrink-0 ${
                      inv.isVoided
                        ? 'bg-rose-100 text-rose-700'
                        : inv.balanceDue > 0
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-emerald-100 text-emerald-800'
                    }`}
                  >
                    <Receipt className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-slate-900">
                        {inv.invoiceNumber}
                      </span>
                      {inv.isVoided && (
                        <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-rose-500 text-white uppercase">
                          Voided
                        </span>
                      )}
                      {inv.isDemo && (
                        <span className="px-1 py-0.2 rounded text-[9px] font-semibold bg-slate-100 text-slate-500 border border-slate-200">
                          Demo Data
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-600 truncate mt-0.5">
                      {inv.customerName} • {inv.items.length} {inv.items.length === 1 ? 'item' : 'items'} ({inv.items[0]?.name.substring(0, 24)}...)
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 flex-shrink-0">
                  <div className="text-right">
                    <div className="text-xs sm:text-sm font-mono font-bold text-slate-900">
                      ₹{inv.totalAmount.toLocaleString('en-IN')}
                    </div>
                    <div className="text-[10px] text-slate-500 capitalize">
                      {inv.paymentMethod} {inv.balanceDue > 0 ? `(₹${inv.balanceDue.toLocaleString('en-IN')} due)` : '• Paid'}
                    </div>
                  </div>

                  <button
                    onClick={() => onSelectInvoice(inv)}
                    className="p-2 rounded-lg bg-slate-100 hover:bg-amber-400 hover:text-slate-950 text-slate-600 transition"
                    title="View & Print Invoice"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column (1 Col): Critical Stock & Category Breakdown */}
        <div className="space-y-6">
          {/* Low Stock Watchlist */}
          <div className="rounded-2xl bg-white border border-slate-200/80 shadow-xs p-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-600" />
                <h4 className="font-bold text-xs uppercase tracking-wider text-slate-900">
                  Low Stock Watchlist
                </h4>
              </div>
              <span className="text-[10px] font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full">
                {lowStockProducts.length} Re-order needed
              </span>
            </div>

            <div className="mt-3 space-y-2.5">
              {lowStockProducts.map((prod) => (
                <div
                  key={prod.id}
                  className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between gap-2.5"
                >
                  <div className="min-w-0">
                    <h5 className="text-xs font-bold text-slate-900 truncate">
                      {prod.name}
                    </h5>
                    <p className="text-[10px] text-slate-500 mt-0.5">
                      Model: {prod.modelNumber} • Brand: {prod.brand}
                    </p>
                    <p className="text-[10px] text-slate-400 truncate mt-0.5">
                      Supplier: {prod.supplier}
                    </p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <span className="inline-block px-2 py-0.5 text-xs font-black rounded-lg bg-rose-100 text-rose-800 border border-rose-300">
                      {prod.stockQuantity} Left
                    </span>
                    <p className="text-[9px] text-slate-400 mt-0.5">
                      Min: {prod.minStockAlert}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={() => onNavigate('inventory')}
              className="mt-4 w-full py-2 text-center text-xs font-bold rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 transition"
            >
              Open Full Inventory &amp; Adjustments &rarr;
            </button>
          </div>

          {/* Location & Store Hours Card */}
          <div className="rounded-2xl bg-gradient-to-br from-[#0A2540] to-[#07192F] text-slate-200 p-5 shadow-xs border border-blue-900/40">
            <div className="flex items-center gap-2 text-amber-400 font-bold text-xs mb-2">
              <ShieldCheck className="w-4 h-4" />
              <span>M1 ENTERPRISES VERIFIED STORE</span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Serving customers in Shrirampur, Babhaleshwar, Rahata, and Ahilyanagar district with genuine consumer electronics and appliances.
            </p>
            <div className="mt-3 pt-3 border-t border-slate-700/60 text-[11px] text-slate-400 space-y-1">
              <div>Store Hours: 9:30 AM – 9:00 PM (All 7 Days)</div>
              <div>Counter Support: {settings.phone}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
