import React, { useState, useMemo } from 'react';
import { Invoice, Product, Expense, SupplierPurchase, UserRole } from '../../types';
import { 
  BarChart3, 
  TrendingUp, 
  Calendar, 
  Download, 
  Lock, 
  PieChart, 
  FileSpreadsheet, 
  Receipt, 
  ShieldCheck,
  CheckCircle2,
  DollarSign
} from 'lucide-react';

interface ReportsViewProps {
  invoices: Invoice[];
  products: Product[];
  expenses: Expense[];
  purchases: SupplierPurchase[];
  userRole: UserRole;
}

export const ReportsView: React.FC<ReportsViewProps> = ({
  invoices,
  products,
  expenses,
  purchases,
  userRole,
}) => {
  const isOwnerOrManager = userRole === 'owner' || userRole === 'manager';
  const [dateRange, setDateRange] = useState<'today' | 'week' | 'month' | 'year' | 'all'>('month');

  // Filter invoices by range
  const filteredInvoices = useMemo(() => {
    const valid = invoices.filter((i) => !i.isVoided);
    const now = new Date();
    
    return valid.filter((inv) => {
      const invDate = new Date(inv.date);
      if (dateRange === 'today') {
        return invDate.toDateString() === now.toDateString();
      } else if (dateRange === 'week') {
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        return invDate >= weekAgo;
      } else if (dateRange === 'month') {
        return invDate.getMonth() === now.getMonth() && invDate.getFullYear() === now.getFullYear();
      } else if (dateRange === 'year') {
        // FY 2026-27 (April 2026 onwards)
        return invDate.getFullYear() === 2026;
      }
      return true;
    });
  }, [invoices, dateRange]);

  // Total Sales Turnover
  const totalSales = useMemo(() => {
    return filteredInvoices.reduce((acc, curr) => acc + curr.totalAmount, 0);
  }, [filteredInvoices]);

  const totalCollected = useMemo(() => {
    return filteredInvoices.reduce((acc, curr) => acc + curr.amountPaid, 0);
  }, [filteredInvoices]);

  const totalKhataDue = useMemo(() => {
    return filteredInvoices.reduce((acc, curr) => acc + curr.balanceDue, 0);
  }, [filteredInvoices]);

  // Expenses in range
  const totalExpensesInRange = useMemo(() => {
    return expenses.reduce((acc, e) => acc + e.amount, 0);
  }, [expenses]);

  // Cost of Goods Sold & Profit (Only for Owner & Manager)
  const cogsAndProfit = useMemo(() => {
    if (!isOwnerOrManager) return { cogs: 0, grossProfit: 0, netProfit: 0, marginPercent: 0 };

    let cogs = 0;
    filteredInvoices.forEach((inv) => {
      inv.items.forEach((item) => {
        const cost = item.purchasePrice || (products.find((p) => p.id === item.productId)?.purchasePrice || 0);
        cogs += cost * item.quantity;
      });
    });

    const grossProfit = Math.max(0, totalSales - cogs);
    const netProfit = Math.max(0, grossProfit - totalExpensesInRange);
    const marginPercent = totalSales > 0 ? ((netProfit / totalSales) * 100).toFixed(1) : 0;

    return { cogs, grossProfit, netProfit, marginPercent };
  }, [filteredInvoices, products, totalSales, totalExpensesInRange, isOwnerOrManager]);

  // Payment Methods Breakdown
  const paymentBreakdown = useMemo(() => {
    const counts: Record<string, number> = { upi: 0, cash: 0, bank_transfer: 0, split: 0, credit: 0 };
    filteredInvoices.forEach((i) => {
      counts[i.paymentMethod] = (counts[i.paymentMethod] || 0) + i.totalAmount;
    });
    return counts;
  }, [filteredInvoices]);

  // Export CSV of non-GST sales
  const handleExportCSV = () => {
    const headers = ['Invoice Number', 'Date', 'Customer Name', 'Mobile', 'Payment Mode', 'Subtotal', 'Discount', 'Total Amount', 'Amount Paid', 'Balance Due'];
    const rows = filteredInvoices.map((inv) => [
      inv.invoiceNumber,
      new Date(inv.date).toLocaleDateString('en-IN'),
      `"${inv.customerName}"`,
      inv.customerPhone,
      inv.paymentMethod,
      inv.subtotal,
      inv.overallDiscount,
      inv.totalAmount,
      inv.amountPaid,
      inv.balanceDue,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `M1_Sales_Report_${dateRange}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-5">
      {/* Header & Date Range Toolbar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
        <div>
          <h2 className="font-extrabold text-base sm:text-lg text-slate-900">
            Store Performance &amp; Reports
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            M1 ENTERPRISES • Shrirampur Retail Turnover &amp; P&amp;L Analysis
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Time Filter Pills */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs font-semibold">
            {[
              { id: 'today', label: 'Today' },
              { id: 'week', label: '7 Days' },
              { id: 'month', label: 'This Month' },
              { id: 'year', label: 'FY 2026-27' },
              { id: 'all', label: 'All Time' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setDateRange(tab.id as any)}
                className={`px-3 py-1.5 rounded-lg text-xs transition ${
                  dateRange === tab.id
                    ? 'bg-[#0B2545] text-amber-400 font-bold shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition shadow-xs"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            Gross Sales Turnover
          </span>
          <div className="text-xl sm:text-2xl font-black text-slate-900 mt-1 font-mono">
            ₹{totalSales.toLocaleString('en-IN')}
          </div>
          <p className="text-[11px] text-slate-500 mt-0.5">
            {filteredInvoices.length} retail invoices generated
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            Amount Collected
          </span>
          <div className="text-xl sm:text-2xl font-black text-emerald-700 mt-1 font-mono">
            ₹{totalCollected.toLocaleString('en-IN')}
          </div>
          <p className="text-[11px] text-slate-500 mt-0.5">
            Cash, UPI &amp; Bank realizations
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            Pending Khata Due
          </span>
          <div className="text-xl sm:text-2xl font-black text-amber-700 mt-1 font-mono">
            ₹{totalKhataDue.toLocaleString('en-IN')}
          </div>
          <p className="text-[11px] text-slate-500 mt-0.5">
            Receivables from customers
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            Net Profit (Margin)
          </span>
          {isOwnerOrManager ? (
            <>
              <div className="text-xl sm:text-2xl font-black text-emerald-800 mt-1 font-mono">
                ₹{cogsAndProfit.netProfit.toLocaleString('en-IN')}
              </div>
              <p className="text-[11px] text-emerald-700 font-bold mt-0.5">
                ~{cogsAndProfit.marginPercent}% Net Return
              </p>
            </>
          ) : (
            <div className="mt-2 text-xs text-slate-400 flex items-center gap-1.5 font-bold">
              <Lock className="w-3.5 h-3.5 text-slate-400" />
              <span>Owner/Manager Only</span>
            </div>
          )}
        </div>
      </div>

      {/* PROFIT & LOSS STATEMENT (Owner & Manager View) */}
      {isOwnerOrManager ? (
        <div className="rounded-2xl bg-white border border-slate-200/80 shadow-xs p-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="font-bold text-sm text-slate-900">
                Profit &amp; Loss Statement (Owner &amp; Manager View)
              </h3>
              <p className="text-xs text-slate-500">
                Calculated based on actual supplier purchase costs and recorded operational overheads
              </p>
            </div>
            <span className="px-2.5 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
              Role Verified: {userRole.toUpperCase()}
            </span>
          </div>

          <div className="mt-4 grid grid-cols-1 md:grid-cols-4 gap-4 text-xs">
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-slate-500 font-semibold block mb-1">A. Gross Sales Revenue</span>
              <div className="text-lg font-black text-slate-900 font-mono">
                ₹{totalSales.toLocaleString('en-IN')}
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-slate-500 font-semibold block mb-1">B. Cost of Goods Sold (COGS)</span>
              <div className="text-lg font-black text-slate-800 font-mono">
                -₹{cogsAndProfit.cogs.toLocaleString('en-IN')}
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-slate-500 font-semibold block mb-1">C. Operating Overheads</span>
              <div className="text-lg font-black text-rose-700 font-mono">
                -₹{totalExpensesInRange.toLocaleString('en-IN')}
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-300">
              <span className="text-emerald-900 font-black block mb-1">Net Estimated Profit (A - B - C)</span>
              <div className="text-xl font-black text-emerald-800 font-mono">
                ₹{cogsAndProfit.netProfit.toLocaleString('en-IN')}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="p-4 rounded-2xl bg-slate-100 border border-slate-200 text-xs text-slate-600 flex items-center gap-3">
          <Lock className="w-5 h-5 text-slate-400 flex-shrink-0" />
          <div>
            <strong className="text-slate-800">Confidential Profit Information:</strong> In compliance with store security guidelines, purchase pricing, margins, and Profit &amp; Loss statements are hidden for the Staff role.
          </div>
        </div>
      )}

      {/* Non-GST Sales Register & Payment Methods Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Payment Methods Chart List */}
        <div className="rounded-2xl bg-white border border-slate-200/80 shadow-xs p-5">
          <h3 className="font-bold text-sm text-slate-900 pb-3 border-b border-slate-100">
            Payment Mode Distribution
          </h3>

          <div className="mt-4 space-y-3">
            {[
              { id: 'upi', label: 'UPI / QR Payments', color: 'bg-blue-600', text: 'text-blue-900' },
              { id: 'cash', label: 'Cash at Counter', color: 'bg-emerald-600', text: 'text-emerald-900' },
              { id: 'split', label: 'Split (Cash + UPI)', color: 'bg-amber-500', text: 'text-amber-900' },
              { id: 'bank_transfer', label: 'Bank Transfer (NEFT)', color: 'bg-indigo-600', text: 'text-indigo-900' },
              { id: 'credit', label: 'Customer Khata Credit', color: 'bg-rose-500', text: 'text-rose-900' },
            ].map((mode) => {
              const amount = paymentBreakdown[mode.id] || 0;
              const percent = totalSales > 0 ? ((amount / totalSales) * 100).toFixed(0) : 0;

              return (
                <div key={mode.id} className="space-y-1 text-xs">
                  <div className="flex justify-between font-medium">
                    <span className="text-slate-700">{mode.label}</span>
                    <span className="font-mono font-bold text-slate-900">
                      ₹{amount.toLocaleString('en-IN')} ({percent}%)
                    </span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                    <div
                      className={`h-full ${mode.color}`}
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Non-GST Statutory Sales Register */}
        <div className="lg:col-span-2 rounded-2xl bg-white border border-slate-200/80 shadow-xs p-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="font-bold text-sm text-slate-900">
                Statutory Non-GST Sales Register
              </h3>
              <p className="text-xs text-slate-500">
                Ready for future GSTR-1 turnover reconciliation once GST registration is active
              </p>
            </div>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800">
              Exempt / Retail Mode
            </span>
          </div>

          <div className="mt-3 overflow-x-auto max-h-72">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-slate-600 font-semibold">
                  <th className="py-2.5 px-3">Date</th>
                  <th className="py-2.5 px-3">Bill Number</th>
                  <th className="py-2.5 px-3">Customer</th>
                  <th className="py-2.5 px-3 text-right">Taxable (₹)</th>
                  <th className="py-2.5 px-3 text-right">GST (₹)</th>
                  <th className="py-2.5 px-3 text-right">Total (₹)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredInvoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-slate-50 transition">
                    <td className="py-2.5 px-3 text-slate-500">
                      {new Date(inv.date).toLocaleDateString('en-IN')}
                    </td>
                    <td className="py-2.5 px-3 font-mono font-bold text-slate-900">
                      {inv.invoiceNumber}
                    </td>
                    <td className="py-2.5 px-3 text-slate-800">
                      {inv.customerName}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono text-slate-700">
                      ₹{inv.totalAmount.toLocaleString('en-IN')}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono text-slate-400">
                      ₹0.00
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900">
                      ₹{inv.totalAmount.toLocaleString('en-IN')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
