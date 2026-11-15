import React, { useState, useMemo } from 'react';
import { Expense, SupplierPurchase, Invoice, PaymentRecord, User, UserRole } from '../../types';
import { 
  WalletCards, 
  Banknote, 
  QrCode, 
  Building2, 
  Plus, 
  ArrowDownLeft, 
  ArrowUpRight, 
  Receipt, 
  Calendar, 
  Tag, 
  CheckCircle2, 
  Clock 
} from 'lucide-react';

interface AccountsViewProps {
  invoices: Invoice[];
  payments: PaymentRecord[];
  expenses: Expense[];
  purchases: SupplierPurchase[];
  currentUser: User;
  onAddExpense: (expense: Omit<Expense, 'id'>) => Expense;
  onAddPurchase: (purchase: Omit<SupplierPurchase, 'id' | 'purchaseNumber'>) => SupplierPurchase;
}

export const AccountsView: React.FC<AccountsViewProps> = ({
  invoices,
  payments,
  expenses,
  purchases,
  currentUser,
  onAddExpense,
  onAddPurchase,
}) => {
  const [activeTab, setActiveTab] = useState<'expenses' | 'purchases' | 'cashbook'>('cashbook');
  const [showAddExpense, setShowAddExpense] = useState(false);
  const [showAddPurchase, setShowAddPurchase] = useState(false);

  // Expense Form State
  const [expCategory, setExpCategory] = useState<Expense['category']>('Tea & Refreshments');
  const [expAmount, setExpAmount] = useState<number>(0);
  const [expMethod, setExpMethod] = useState<'cash' | 'upi' | 'bank_transfer'>('cash');
  const [expPaidTo, setExpPaidTo] = useState('');
  const [expNotes, setExpNotes] = useState('');

  // Purchase Form State
  const [purSupplier, setPurSupplier] = useState('');
  const [purContact, setPurContact] = useState('');
  const [purInvoiceNo, setPurInvoiceNo] = useState('');
  const [purSummary, setPurSummary] = useState('');
  const [purTotal, setPurTotal] = useState<number>(0);
  const [purPaid, setPurPaid] = useState<number>(0);
  const [purMethod, setPurMethod] = useState<'cash' | 'bank_transfer' | 'upi'>('bank_transfer');

  // Balances Calculations
  // 1. Total Cash In Drawer
  const totalCashIn = useMemo(() => {
    let sum = 0;
    // from invoices
    invoices.forEach((inv) => {
      if (!inv.isVoided) {
        if (inv.paymentMethod === 'cash') sum += inv.amountPaid;
        else if (inv.paymentMethod === 'split') sum += inv.paymentDetails?.cashAmount || 0;
      }
    });
    // from standalone khata payments
    payments.forEach((p) => {
      if (p.method === 'cash') sum += p.amount;
    });
    // subtract cash expenses
    const cashExp = expenses
      .filter((e) => e.paymentMethod === 'cash')
      .reduce((a, b) => a + b.amount, 0);
    return Math.max(0, sum - cashExp + 15000); // 15,000 float base
  }, [invoices, payments, expenses]);

  // 2. Total UPI Collections
  const totalUpiCollections = useMemo(() => {
    let sum = 0;
    invoices.forEach((inv) => {
      if (!inv.isVoided) {
        if (inv.paymentMethod === 'upi') sum += inv.amountPaid;
        else if (inv.paymentMethod === 'split') sum += inv.paymentDetails?.upiAmount || 0;
      }
    });
    payments.forEach((p) => {
      if (p.method === 'upi') sum += p.amount;
    });
    return sum;
  }, [invoices, payments]);

  // 3. Total Expenses
  const totalExpenses = useMemo(() => {
    return expenses.reduce((acc, curr) => acc + curr.amount, 0);
  }, [expenses]);

  // 4. Total Supplier Purchases
  const totalPurchasesCost = useMemo(() => {
    return purchases.reduce((acc, curr) => acc + curr.totalAmount, 0);
  }, [purchases]);

  const handleSaveExpense = (e: React.FormEvent) => {
    e.preventDefault();
    if (expAmount <= 0 || !expPaidTo) {
      alert('Amount and Paid To details are required.');
      return;
    }

    onAddExpense({
      date: new Date().toISOString(),
      category: expCategory,
      amount: expAmount,
      paymentMethod: expMethod,
      paidTo: expPaidTo.trim(),
      notes: expNotes.trim(),
      recordedBy: currentUser.name,
      isDemo: false,
    });

    setExpAmount(0);
    setExpPaidTo('');
    setExpNotes('');
    setShowAddExpense(false);
  };

  const handleSavePurchase = (e: React.FormEvent) => {
    e.preventDefault();
    if (!purSupplier || purTotal <= 0) {
      alert('Supplier Name and Total Amount are required.');
      return;
    }

    onAddPurchase({
      supplierName: purSupplier.trim(),
      supplierContact: purContact.trim(),
      invoiceNumber: purInvoiceNo.trim() || `PUR-${Date.now().toString().slice(-4)}`,
      date: new Date().toISOString(),
      itemsSummary: purSummary.trim() || 'Appliance stock inward',
      totalAmount: purTotal,
      paidAmount: purPaid,
      paymentStatus: purPaid >= purTotal ? 'paid' : purPaid > 0 ? 'partial' : 'unpaid',
      paymentMethod: purMethod,
      recordedBy: currentUser.name,
      isDemo: false,
    });

    setPurSupplier('');
    setPurContact('');
    setPurInvoiceNo('');
    setPurSummary('');
    setPurTotal(0);
    setPurPaid(0);
    setShowAddPurchase(false);
  };

  return (
    <div className="space-y-5">
      {/* Three Accounts Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Cash in Drawer */}
        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Cash in Counter Drawer
            </span>
            <div className="text-2xl font-black text-slate-900 mt-1 font-mono">
              ₹{totalCashIn.toLocaleString('en-IN')}
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Available physical currency float
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-800 flex items-center justify-center font-bold">
            <Banknote className="w-5 h-5" />
          </div>
        </div>

        {/* UPI Account */}
        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Showroom UPI Collections
            </span>
            <div className="text-2xl font-black text-blue-900 mt-1 font-mono">
              ₹{totalUpiCollections.toLocaleString('en-IN')}
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">
              GPay, PhonePe, Paytm transfers
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-800 flex items-center justify-center font-bold">
            <QrCode className="w-5 h-5" />
          </div>
        </div>

        {/* Bank & Operating Expenses */}
        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Recorded Expenses
            </span>
            <div className="text-2xl font-black text-rose-700 mt-1 font-mono">
              ₹{totalExpenses.toLocaleString('en-IN')}
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Rent, power, transport, salaries
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-800 flex items-center justify-center font-bold">
            <Building2 className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-2 bg-white rounded-2xl border border-slate-200/80 shadow-xs">
        <div className="flex items-center gap-1">
          {[
            { id: 'cashbook', label: 'Cash & UPI Stream' },
            { id: 'expenses', label: 'Operating Expenses' },
            { id: 'purchases', label: 'Supplier Purchases' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
                activeTab === tab.id
                  ? 'bg-[#0B2545] text-amber-400 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          {activeTab === 'expenses' && (
            <button
              onClick={() => setShowAddExpense(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-xs transition"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Record Expense</span>
            </button>
          )}

          {activeTab === 'purchases' && (
            <button
              onClick={() => setShowAddPurchase(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-800 hover:bg-blue-900 text-white font-bold text-xs shadow-xs transition"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Record Supplier Purchase</span>
            </button>
          )}
        </div>
      </div>

      {/* TAB 1: CASH & UPI STREAM */}
      {activeTab === 'cashbook' && (
        <div className="rounded-2xl bg-white border border-slate-200/80 shadow-xs p-4 sm:p-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="font-bold text-sm text-slate-900">
                Live Collections Stream
              </h3>
              <p className="text-xs text-slate-500">
                Sequential inflows and outlays across all payment accounts
              </p>
            </div>
          </div>

          <div className="mt-3 divide-y divide-slate-100">
            {invoices.map((inv) => (
              <div
                key={inv.id}
                className="py-3 flex items-center justify-between gap-3 hover:bg-slate-50/80 px-2 rounded-xl transition text-xs"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold flex-shrink-0 ${
                      inv.paymentMethod === 'upi'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-emerald-100 text-emerald-800'
                    }`}
                  >
                    <ArrowDownLeft className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900">
                        {inv.customerName}
                      </span>
                      <span className="font-mono text-[10px] text-slate-500">
                        {inv.invoiceNumber}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      {new Date(inv.date).toLocaleDateString('en-IN', {
                        day: '2-digit',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit',
                      })} • Billed by {inv.createdByName}
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <div className="font-mono font-bold text-emerald-700 text-sm">
                    +₹{inv.amountPaid.toLocaleString('en-IN')}
                  </div>
                  <div className="text-[10px] text-slate-500 uppercase font-semibold">
                    via {inv.paymentMethod}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 2: OPERATING EXPENSES */}
      {activeTab === 'expenses' && (
        <div className="rounded-2xl bg-white border border-slate-200/80 shadow-xs p-4 sm:p-5">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-slate-600 font-bold">
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-3">Expense Category</th>
                  <th className="py-3 px-3">Paid To / Recipient</th>
                  <th className="py-3 px-3">Payment Mode</th>
                  <th className="py-3 px-3 text-right">Amount (₹)</th>
                  <th className="py-3 px-4">Recorded By</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {expenses.map((exp) => (
                  <tr key={exp.id} className="hover:bg-slate-50/80 transition">
                    <td className="py-3 px-4 text-slate-500 whitespace-nowrap">
                      {new Date(exp.date).toLocaleDateString('en-IN')}
                    </td>
                    <td className="py-3 px-3">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                        {exp.category}
                      </span>
                    </td>
                    <td className="py-3 px-3 font-semibold text-slate-900">
                      {exp.paidTo}
                      {exp.notes && (
                        <p className="text-[10px] text-slate-400 font-normal">
                          {exp.notes}
                        </p>
                      )}
                    </td>
                    <td className="py-3 px-3 font-mono uppercase text-slate-600">
                      {exp.paymentMethod}
                    </td>
                    <td className="py-3 px-3 text-right font-mono font-bold text-rose-700 text-sm">
                      ₹{exp.amount.toLocaleString('en-IN')}
                    </td>
                    <td className="py-3 px-4 text-slate-500">
                      {exp.recordedBy}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: SUPPLIER PURCHASES */}
      {activeTab === 'purchases' && (
        <div className="rounded-2xl bg-white border border-slate-200/80 shadow-xs p-4 sm:p-5">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-slate-600 font-bold">
                  <th className="py-3 px-4">Purchase Ref</th>
                  <th className="py-3 px-3">Supplier / Distributor</th>
                  <th className="py-3 px-3">Items Summary</th>
                  <th className="py-3 px-3 text-right">Total (₹)</th>
                  <th className="py-3 px-3 text-right">Paid (₹)</th>
                  <th className="py-3 px-3 text-center">Status</th>
                  <th className="py-3 px-4 text-slate-500">Recorded By</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {purchases.map((pur) => (
                  <tr key={pur.id} className="hover:bg-slate-50/80 transition">
                    <td className="py-3 px-4">
                      <div className="font-mono font-bold text-slate-900">
                        {pur.purchaseNumber}
                      </div>
                      <div className="text-[10px] text-slate-500">
                        Inv: {pur.invoiceNumber}
                      </div>
                    </td>
                    <td className="py-3 px-3">
                      <div className="font-bold text-slate-900">{pur.supplierName}</div>
                      <div className="text-[10px] text-slate-500">{pur.supplierContact}</div>
                    </td>
                    <td className="py-3 px-3 text-slate-600 max-w-xs truncate">
                      {pur.itemsSummary}
                    </td>
                    <td className="py-3 px-3 text-right font-mono font-bold text-slate-900">
                      ₹{pur.totalAmount.toLocaleString('en-IN')}
                    </td>
                    <td className="py-3 px-3 text-right font-mono text-emerald-700 font-semibold">
                      ₹{pur.paidAmount.toLocaleString('en-IN')}
                    </td>
                    <td className="py-3 px-3 text-center">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold ${
                          pur.paymentStatus === 'paid'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {pur.paymentStatus.toUpperCase()}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-500">
                      {pur.recordedBy}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Record Expense Modal */}
      {showAddExpense && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-2xl text-slate-800 animate-in fade-in">
            <h3 className="font-bold text-sm text-slate-900 pb-2 border-b border-slate-100">
              Record Operating Store Expense
            </h3>

            <form onSubmit={handleSaveExpense} className="mt-4 space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Expense Category *</label>
                <select
                  value={expCategory}
                  onChange={(e) => setExpCategory(e.target.value as any)}
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-300 bg-white"
                >
                  <option value="Tea & Refreshments">Tea &amp; Customer Refreshments</option>
                  <option value="Electricity (MSEB)">Electricity (MSEB Power Bill)</option>
                  <option value="Rent">Showroom Monthly Rent</option>
                  <option value="Transport & Freight">Transport &amp; Hamali Unloading</option>
                  <option value="Staff Salary">Staff Salary Advance / Stipend</option>
                  <option value="Marketing">Local Marketing &amp; Banners</option>
                  <option value="Maintenance">Showroom AC &amp; Fixture Maintenance</option>
                  <option value="Miscellaneous">Miscellaneous Store Supplies</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Amount (₹) *</label>
                <input
                  type="number"
                  required
                  min="1"
                  value={expAmount || ''}
                  onChange={(e) => setExpAmount(Number(e.target.value) || 0)}
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-300 font-mono font-bold text-rose-700 text-sm"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Paid To / Vendor Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Amruttulya Tea Stall, MSEB Shrirampur, Transporter..."
                  value={expPaidTo}
                  onChange={(e) => setExpPaidTo(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-300"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Payment Mode</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['cash', 'upi', 'bank_transfer'] as const).map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setExpMethod(m)}
                      className={`py-1.5 rounded-lg text-xs font-bold border transition ${
                        expMethod === m
                          ? 'bg-[#0B2545] text-amber-400 border-blue-900'
                          : 'bg-slate-50 text-slate-700 border-slate-200'
                      }`}
                    >
                      {m.toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Details / Notes</label>
                <input
                  type="text"
                  placeholder="Brief note or voucher number"
                  value={expNotes}
                  onChange={(e) => setExpNotes(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-300"
                />
              </div>

              <div className="mt-5 flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddExpense(false)}
                  className="px-3 py-1.5 rounded-xl bg-slate-100 text-slate-700 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold shadow-xs"
                >
                  Save Expense
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Record Purchase Modal */}
      {showAddPurchase && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-2xl text-slate-800 animate-in fade-in">
            <h3 className="font-bold text-sm text-slate-900 pb-2 border-b border-slate-100">
              Record Supplier Stock Purchase
            </h3>

            <form onSubmit={handleSavePurchase} className="mt-4 space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Distributor / Supplier Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Maharashtra Electronics Distributors Pune"
                  value={purSupplier}
                  onChange={(e) => setPurSupplier(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-300"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Supplier Invoice #</label>
                  <input
                    type="text"
                    placeholder="e.g. MED/2026/890"
                    value={purInvoiceNo}
                    onChange={(e) => setPurInvoiceNo(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-300 font-mono"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Contact Phone</label>
                  <input
                    type="text"
                    placeholder="+91..."
                    value={purContact}
                    onChange={(e) => setPurContact(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-300"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Appliance Stock Summary *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 5x Daikin 1.5T ACs, 3x LG 43 inch LED TVs"
                  value={purSummary}
                  onChange={(e) => setPurSummary(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-300"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Total Bill Amount (₹) *</label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={purTotal || ''}
                    onChange={(e) => setPurTotal(Number(e.target.value) || 0)}
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-300 font-mono font-bold text-slate-900"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Amount Paid (₹)</label>
                  <input
                    type="number"
                    value={purPaid || ''}
                    onChange={(e) => setPurPaid(Number(e.target.value) || 0)}
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-300 font-mono font-bold text-emerald-800"
                  />
                </div>
              </div>

              <div className="mt-5 flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddPurchase(false)}
                  className="px-3 py-1.5 rounded-xl bg-slate-100 text-slate-700 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-xl bg-blue-800 hover:bg-blue-700 text-white font-bold shadow-xs"
                >
                  Save Inward Purchase
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
