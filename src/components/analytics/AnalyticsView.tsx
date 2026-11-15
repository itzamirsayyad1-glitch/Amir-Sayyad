import React, { useState, useMemo } from 'react';
import { 
  Invoice, 
  Product, 
  Expense, 
  SupplierPurchase, 
  UserRole, 
  CustomerOrder, 
  Customer 
} from '../../types';
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  ShoppingBag, 
  Package, 
  Users, 
  CreditCard, 
  ArrowUpRight, 
  ArrowDownRight, 
  ShieldAlert, 
  Calendar, 
  Clock, 
  CheckCircle2, 
  AlertTriangle,
  Zap,
  Percent,
  RefreshCw
} from 'lucide-react';

interface AnalyticsViewProps {
  invoices: Invoice[];
  products: Product[];
  expenses: Expense[];
  purchases: SupplierPurchase[];
  orders: CustomerOrder[];
  customers: Customer[];
  userRole: UserRole;
}

export const AnalyticsView: React.FC<AnalyticsViewProps> = ({
  invoices,
  products,
  expenses,
  purchases,
  orders,
  customers,
  userRole,
}) => {
  const isOwnerOrManager = userRole === 'owner' || userRole === 'manager';
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | 'all'>('30d');

  // Filter invoices by time range
  const validInvoices = useMemo(() => {
    const active = invoices.filter((i) => !i.isVoided && i.status !== 'voided');
    const now = new Date();
    
    if (timeRange === '7d') {
      const past7 = new Date();
      past7.setDate(now.getDate() - 7);
      return active.filter((i) => new Date(i.date) >= past7);
    }
    if (timeRange === '30d') {
      const past30 = new Date();
      past30.setDate(now.getDate() - 30);
      return active.filter((i) => new Date(i.date) >= past30);
    }
    return active;
  }, [invoices, timeRange]);

  // Key KPI Metrics
  const metrics = useMemo(() => {
    const totalSales = validInvoices.reduce((acc, inv) => acc + inv.totalAmount, 0);
    const totalBills = validInvoices.length;
    const avgOrderValue = totalBills > 0 ? Math.round(totalSales / totalBills) : 0;

    // Total COGS (Cost of goods sold) - strictly calculated for Owner/Manager
    let totalCOGS = 0;
    validInvoices.forEach((inv) => {
      inv.items.forEach((item) => {
        const prod = products.find((p) => p.id === item.productId);
        const purchaseCost = prod?.purchasePrice || (item.unitPrice * 0.82); // fallback realistic wholesale margin
        totalCOGS += purchaseCost * item.quantity;
      });
    });

    const totalExpenseAmount = expenses.reduce((acc, e) => acc + e.amount, 0);
    const grossProfit = totalSales - totalCOGS;
    const grossMarginPct = totalSales > 0 ? ((grossProfit / totalSales) * 100).toFixed(1) : '0.0';
    const netProfit = grossProfit - totalExpenseAmount;

    // Order metrics
    const totalOrders = orders.length;
    const deliveredOrders = orders.filter((o) => o.status === 'delivered').length;
    const conversionRate = totalOrders > 0 ? Math.round((deliveredOrders / totalOrders) * 100) : 0;

    // Outstanding Khata
    const totalReceivables = customers.reduce((acc, c) => acc + (c.outstandingBalance || 0), 0);

    return {
      totalSales,
      totalBills,
      avgOrderValue,
      totalCOGS,
      grossProfit,
      grossMarginPct,
      netProfit,
      totalExpenseAmount,
      totalOrders,
      deliveredOrders,
      conversionRate,
      totalReceivables,
    };
  }, [validInvoices, products, expenses, orders, customers]);

  // Category revenue breakdown
  const categoryStats = useMemo(() => {
    const catMap: Record<string, { revenue: number; units: number; name: string }> = {};

    validInvoices.forEach((inv) => {
      inv.items.forEach((item) => {
        const prod = products.find((p) => p.id === item.productId);
        const cat = prod?.category || 'Appliances';
        if (!catMap[cat]) {
          catMap[cat] = { revenue: 0, units: 0, name: cat };
        }
        catMap[cat].revenue += item.total;
        catMap[cat].units += item.quantity;
      });
    });

    const totalRev = metrics.totalSales || 1;
    return Object.values(catMap)
      .map((c) => ({
        ...c,
        percentage: ((c.revenue / totalRev) * 100).toFixed(1),
      }))
      .sort((a, b) => b.revenue - a.revenue);
  }, [validInvoices, products, metrics.totalSales]);

  // Payment channel breakdown
  const paymentStats = useMemo(() => {
    const pMap: Record<string, number> = {
      cash: 0,
      upi: 0,
      bank_transfer: 0,
      credit: 0,
      split: 0,
    };

    validInvoices.forEach((inv) => {
      const mode = inv.paymentMethod || 'cash';
      pMap[mode] = (pMap[mode] || 0) + inv.totalAmount;
    });

    const total = metrics.totalSales || 1;
    return [
      { mode: 'UPI / QR Code', key: 'upi', amount: pMap.upi, pct: Math.round((pMap.upi / total) * 100), color: 'bg-emerald-500' },
      { mode: 'Cash at Counter', key: 'cash', amount: pMap.cash, pct: Math.round((pMap.cash / total) * 100), color: 'bg-blue-600' },
      { mode: 'Bank Transfer (NEFT/IMPS)', key: 'bank_transfer', amount: pMap.bank_transfer, pct: Math.round((pMap.bank_transfer / total) * 100), color: 'bg-purple-600' },
      { mode: 'Customer Credit (Khata)', key: 'credit', amount: pMap.credit, pct: Math.round((pMap.credit / total) * 100), color: 'bg-amber-500' },
    ];
  }, [validInvoices, metrics.totalSales]);

  // Fast-moving vs slow-moving stock velocity
  const velocityStats = useMemo(() => {
    const itemSoldMap: Record<string, number> = {};
    validInvoices.forEach((inv) => {
      inv.items.forEach((item) => {
        itemSoldMap[item.productId] = (itemSoldMap[item.productId] || 0) + item.quantity;
      });
    });

    const ranked = products
      .filter((p) => p.isActive)
      .map((p) => ({
        ...p,
        unitsSold: itemSoldMap[p.id] || 0,
        currentStock: p.stockQuantity,
      }))
      .sort((a, b) => b.unitsSold - a.unitsSold);

    const fastMoving = ranked.slice(0, 4);
    const slowMoving = ranked.filter((p) => p.unitsSold === 0 && p.stockQuantity > 0).slice(0, 4);

    return { fastMoving, slowMoving };
  }, [validInvoices, products]);

  // 7-day daily trend for chart
  const dailyTrend = useMemo(() => {
    const days: { label: string; dateStr: string; amount: number }[] = [];
    const now = new Date();

    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(now.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const dayLabel = d.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric' });

      const dayTotal = invoices
        .filter((inv) => !inv.isVoided && inv.status !== 'voided' && inv.date.startsWith(dateStr))
        .reduce((sum, inv) => sum + inv.totalAmount, 0);

      days.push({ label: dayLabel, dateStr, amount: dayTotal });
    }
    return days;
  }, [invoices]);

  const maxDailyAmount = Math.max(...dailyTrend.map((d) => d.amount), 50000);

  return (
    <div className="space-y-6">
      {/* Top Banner & Time Range Controls */}
      <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-[#0B2545] text-amber-400 flex items-center justify-center font-bold shadow-xs">
              <BarChart3 className="w-5 h-5" />
            </div>
            <h2 className="font-extrabold text-base sm:text-lg text-slate-900">
              Shop Performance &amp; Retail Analytics
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Real-time business intelligence for M1 ENTERPRISES Shrirampur. Sales, margins, stock velocity &amp; order conversions.
          </p>
        </div>

        {/* Time Filter Segmented Control */}
        <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl border border-slate-200 text-xs font-semibold">
          <button
            onClick={() => setTimeRange('7d')}
            className={`px-3 py-1.5 rounded-lg transition ${
              timeRange === '7d'
                ? 'bg-white text-slate-950 shadow-xs font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Last 7 Days
          </button>
          <button
            onClick={() => setTimeRange('30d')}
            className={`px-3 py-1.5 rounded-lg transition ${
              timeRange === '30d'
                ? 'bg-white text-slate-950 shadow-xs font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Last 30 Days
          </button>
          <button
            onClick={() => setTimeRange('all')}
            className={`px-3 py-1.5 rounded-lg transition ${
              timeRange === 'all'
                ? 'bg-white text-slate-950 shadow-xs font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            All Time
          </button>
        </div>
      </div>

      {/* Staff Permission Notice (if Staff) */}
      {!isOwnerOrManager && (
        <div className="p-3.5 rounded-2xl bg-blue-50 border border-blue-200 text-xs text-blue-900 flex items-center gap-2.5">
          <ShieldAlert className="w-4 h-4 text-blue-700 flex-shrink-0" />
          <span>
            <strong>Staff Access Mode:</strong> Showing sales volume, order conversions, and stock velocity. Purchase costs and profit margins are role-restricted to Store Owner and Manager.
          </span>
        </div>
      )}

      {/* 4 Primary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Gross Sales */}
        <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-400 font-semibold mb-2">
            <span>Gross Sales Revenue</span>
            <DollarSign className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="font-mono font-black text-2xl text-slate-900">
            ₹{metrics.totalSales.toLocaleString('en-IN')}
          </div>
          <div className="mt-2 flex items-center gap-1.5 text-xs text-slate-500">
            <span className="font-bold text-slate-700">{metrics.totalBills}</span>
            <span>retail memos issued</span>
          </div>
        </div>

        {/* KPI 2: Gross Profit & Margin (Owner/Manager Only) */}
        <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-400 font-semibold mb-2">
            <span>Gross Profit Margin</span>
            <Percent className="w-4 h-4 text-amber-500" />
          </div>
          {isOwnerOrManager ? (
            <>
              <div className="font-mono font-black text-2xl text-emerald-700">
                ₹{metrics.grossProfit.toLocaleString('en-IN')}
              </div>
              <div className="mt-2 flex items-center gap-1.5 text-xs text-emerald-700 font-bold">
                <ArrowUpRight className="w-3.5 h-3.5" />
                <span>{metrics.grossMarginPct}% gross margin</span>
              </div>
            </>
          ) : (
            <>
              <div className="font-mono font-bold text-base text-slate-400 py-1">
                [Confidential]
              </div>
              <span className="text-[11px] text-slate-400">Owner &amp; Manager only</span>
            </>
          )}
        </div>

        {/* KPI 3: Order Booking Conversion */}
        <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-400 font-semibold mb-2">
            <span>Order Pipeline Conversion</span>
            <ShoppingBag className="w-4 h-4 text-blue-600" />
          </div>
          <div className="font-mono font-black text-2xl text-blue-900">
            {metrics.conversionRate}%
          </div>
          <div className="mt-2 flex items-center gap-1 text-xs text-slate-500">
            <span className="font-bold text-slate-700">{metrics.deliveredOrders}</span>
            <span>of {metrics.totalOrders} bookings fulfilled</span>
          </div>
        </div>

        {/* KPI 4: Average Order Value / Outstanding Khata */}
        <div className="p-4 sm:p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-400 font-semibold mb-2">
            <span>Average Order Value (AOV)</span>
            <CreditCard className="w-4 h-4 text-purple-600" />
          </div>
          <div className="font-mono font-black text-2xl text-slate-900">
            ₹{metrics.avgOrderValue.toLocaleString('en-IN')}
          </div>
          <div className="mt-2 flex items-center justify-between text-xs text-slate-500">
            <span>Khata Receivables:</span>
            <span className="font-mono font-bold text-amber-700">₹{metrics.totalReceivables.toLocaleString('en-IN')}</span>
          </div>
        </div>
      </div>

      {/* Main Charts Row: 7-Day Trend + Category Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left (2 Cols): 7-Day Revenue Trend Chart */}
        <div className="lg:col-span-2 p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-extrabold text-sm text-slate-900">
                Daily Sales Trend (Last 7 Days)
              </h3>
              <p className="text-xs text-slate-500">
                Daily cash memo turnover in Shrirampur
              </p>
            </div>
            <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-blue-50 text-blue-900 border border-blue-200">
              Peak: ₹{maxDailyAmount.toLocaleString('en-IN')}
            </span>
          </div>

          {/* SVG Bar Chart with Tooltips */}
          <div className="h-56 w-full flex items-end justify-between gap-2 pt-6 pb-2 px-1">
            {dailyTrend.map((day, idx) => {
              const heightPct = Math.max(8, Math.round((day.amount / maxDailyAmount) * 100));
              return (
                <div key={idx} className="flex-1 flex flex-col items-center gap-2 group h-full justify-end">
                  {/* Tooltip amount */}
                  <div className="opacity-0 group-hover:opacity-100 transition duration-200 text-[10px] font-mono font-bold text-white bg-slate-900 px-1.5 py-0.5 rounded whitespace-nowrap shadow-sm pointer-events-none">
                    ₹{day.amount.toLocaleString('en-IN')}
                  </div>

                  {/* Bar */}
                  <div className="w-full max-w-[42px] bg-slate-100 rounded-t-xl overflow-hidden flex flex-col justify-end h-full">
                    <div
                      style={{ height: `${heightPct}%` }}
                      className="w-full bg-gradient-to-t from-[#0B2545] to-blue-600 rounded-t-xl group-hover:from-amber-500 group-hover:to-amber-400 transition-all duration-300"
                    />
                  </div>

                  {/* Label */}
                  <span className="text-[10px] font-semibold text-slate-500 truncate max-w-[48px] text-center">
                    {day.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right (1 Col): Payment Mode Split */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-4 flex flex-col justify-between">
          <div>
            <h3 className="font-extrabold text-sm text-slate-900">
              Payment Channels Split
            </h3>
            <p className="text-xs text-slate-500">
              Collections by payment method
            </p>
          </div>

          <div className="space-y-3 my-auto">
            {paymentStats.map((item) => (
              <div key={item.key} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium text-slate-700">{item.mode}</span>
                  <span className="font-mono font-bold text-slate-900">
                    ₹{item.amount.toLocaleString('en-IN')} ({item.pct}%)
                  </span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                  <div
                    style={{ width: `${item.pct}%` }}
                    className={`h-full ${item.color} rounded-full transition-all duration-500`}
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-[11px] text-slate-600">
            <strong>UPI Adoption:</strong> {paymentStats.find(p => p.key === 'upi')?.pct}% of customers pay directly via QR/UPI.
          </div>
        </div>
      </div>

      {/* Category Performance Breakdown */}
      <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-extrabold text-sm text-slate-900">
              Appliance Category Revenue &amp; Units
            </h3>
            <p className="text-xs text-slate-500">
              Performance across Smart TVs, Refrigerators, Washing Machines &amp; Air Conditioners
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {categoryStats.map((cat, idx) => (
            <div key={idx} className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-xs text-slate-900 truncate">{cat.name}</span>
                  <span className="font-mono font-bold text-xs text-[#0B2545]">
                    ₹{cat.revenue.toLocaleString('en-IN')}
                  </span>
                </div>
                <div className="w-full h-1.5 rounded-full bg-slate-200 overflow-hidden">
                  <div
                    style={{ width: `${cat.percentage}%` }}
                    className="h-full bg-[#0B2545] rounded-full"
                  />
                </div>
                <div className="flex items-center justify-between text-[10px] text-slate-500 mt-1">
                  <span>{cat.units} units sold</span>
                  <span>{cat.percentage}% of total revenue</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Stock Velocity & Turnover: Fast vs Slow Moving */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Fast-Moving Bestsellers */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-emerald-600" />
              <h3 className="font-extrabold text-sm text-slate-900">
                Fast-Moving Appliances (Top Velocity)
              </h3>
            </div>
            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
              High Demand
            </span>
          </div>

          <div className="space-y-2">
            {velocityStats.fastMoving.map((p) => (
              <div key={p.id} className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <span className="font-bold text-xs text-slate-900 block truncate">{p.name}</span>
                  <span className="text-[10px] text-slate-500">{p.brand} ({p.modelNumber})</span>
                </div>

                <div className="text-right flex-shrink-0">
                  <span className="font-mono font-bold text-xs text-emerald-700 block">
                    {p.unitsSold} Sold
                  </span>
                  <span className="text-[10px] text-slate-400">
                    {p.currentStock} in stock
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Slow-Moving Stock Alerts */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              <h3 className="font-extrabold text-sm text-slate-900">
                Slow-Moving Stock Watchlist
              </h3>
            </div>
            <span className="text-[10px] font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
              Requires Push / Discount
            </span>
          </div>

          <div className="space-y-2">
            {velocityStats.slowMoving.length === 0 ? (
              <p className="p-4 text-center text-xs text-slate-400">All appliances have active sales velocity!</p>
            ) : (
              velocityStats.slowMoving.map((p) => (
                <div key={p.id} className="p-2.5 rounded-xl bg-amber-50/50 border border-amber-200/80 flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <span className="font-bold text-xs text-slate-900 block truncate">{p.name}</span>
                    <span className="text-[10px] text-slate-500 font-mono">Stocked: {p.currentStock} units</span>
                  </div>

                  <div className="text-right flex-shrink-0">
                    <span className="font-mono font-bold text-xs text-slate-900 block">
                      ₹{p.sellingPrice.toLocaleString('en-IN')}
                    </span>
                    <span className="text-[10px] text-amber-700 font-bold">
                      Consider Discount
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
