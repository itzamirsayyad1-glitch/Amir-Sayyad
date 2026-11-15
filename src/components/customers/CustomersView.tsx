import React, { useState, useMemo } from 'react';
import { Customer, Invoice, PaymentRecord, User, PaymentMethod, StoreSettings } from '../../types';
import { 
  Users, 
  Search, 
  Plus, 
  Phone, 
  MapPin, 
  CreditCard, 
  IndianRupee, 
  Send, 
  Clock, 
  CheckCircle2, 
  AlertCircle,
  Receipt,
  FileText
} from 'lucide-react';

interface CustomersViewProps {
  customers: Customer[];
  invoices: Invoice[];
  payments: PaymentRecord[];
  currentUser: User;
  settings: StoreSettings;
  onAddCustomer: (customer: Omit<Customer, 'id' | 'outstandingBalance' | 'totalPurchases' | 'firstVisitDate'>) => Customer;
  onRecordPayment: (payment: Omit<PaymentRecord, 'id'>) => PaymentRecord;
  onOpenInvoiceModal: (invoice: Invoice) => void;
}

export const CustomersView: React.FC<CustomersViewProps> = ({
  customers,
  invoices,
  payments,
  currentUser,
  settings,
  onAddCustomer,
  onRecordPayment,
  onOpenInvoiceModal,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddCustomer, setShowAddCustomer] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

  // Collect Payment Modal
  const [payingCustomer, setPayingCustomer] = useState<Customer | null>(null);
  const [payAmount, setPayAmount] = useState<number>(0);
  const [payMethod, setPayMethod] = useState<PaymentMethod>('upi');
  const [payRef, setPayRef] = useState('');
  const [payNotes, setPayNotes] = useState('');

  // Add Customer Form
  const [newCustName, setNewCustName] = useState('');
  const [newCustPhone, setNewCustPhone] = useState('');
  const [newCustAddress, setNewCustAddress] = useState('');
  const [newCustLimit, setNewCustLimit] = useState(25000);
  const [newCustNotes, setNewCustNotes] = useState('');

  // Total Outstanding Khata
  const totalOutstanding = useMemo(() => {
    return customers.reduce((acc, c) => acc + (c.outstandingBalance || 0), 0);
  }, [customers]);

  const filteredCustomers = useMemo(() => {
    const q = searchTerm.toLowerCase();
    return customers.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.phone.includes(q) ||
        c.address.toLowerCase().includes(q)
    );
  }, [customers, searchTerm]);

  // Customer Invoices & Payments History for selected customer
  const customerInvoices = useMemo(() => {
    if (!selectedCustomer) return [];
    return invoices.filter((i) => i.customerId === selectedCustomer.id);
  }, [invoices, selectedCustomer]);

  const customerPayments = useMemo(() => {
    if (!selectedCustomer) return [];
    return payments.filter((p) => p.customerId === selectedCustomer.id);
  }, [payments, selectedCustomer]);

  const handleCreateCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCustName || !newCustPhone) {
      alert('Name and Phone number are required.');
      return;
    }

    onAddCustomer({
      name: newCustName.trim(),
      phone: newCustPhone.trim().replace(/\D/g, ''),
      address: newCustAddress.trim() || 'Shrirampur, Ahilyanagar',
      creditLimit: newCustLimit || 25000,
      notes: newCustNotes.trim(),
    });

    setNewCustName('');
    setNewCustPhone('');
    setNewCustAddress('');
    setNewCustNotes('');
    setShowAddCustomer(false);
  };

  const handleOpenCollectPayment = (c: Customer) => {
    setPayingCustomer(c);
    setPayAmount(c.outstandingBalance > 0 ? c.outstandingBalance : 5000);
    setPayRef('');
    setPayNotes(`Khata payment collected at showroom`);
  };

  const handleSubmitPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!payingCustomer || payAmount <= 0) {
      alert('Please enter a valid payment amount.');
      return;
    }

    onRecordPayment({
      customerId: payingCustomer.id,
      customerName: payingCustomer.name,
      amount: payAmount,
      method: payMethod,
      referenceNumber: payRef.trim(),
      timestamp: new Date().toISOString(),
      notes: payNotes.trim(),
      receivedBy: currentUser.name,
      receivedByRole: currentUser.role,
    });

    // If modal is viewing customer, update local state
    if (selectedCustomer && selectedCustomer.id === payingCustomer.id) {
      setSelectedCustomer({
        ...selectedCustomer,
        outstandingBalance: Math.max(0, selectedCustomer.outstandingBalance - payAmount),
      });
    }

    setPayingCustomer(null);
  };

  const handleSendWhatsAppReminder = (c: Customer) => {
    const cleanPhone = c.phone.replace(/\D/g, '');
    const phoneWithCode = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;

    const message = `*M1 ENTERPRISES — KHATA STATEMENT REMINDER*\n` +
      `📍 *Location:* Chatrapati Shivaji Maharaj Chowk, Shrirampur\n` +
      `📞 *Contact:* ${settings.phone}\n` +
      `-----------------------------------------\n` +
      `Dear *${c.name}*,\n\n` +
      `Greetings from M1 ENTERPRISES Shrirampur!\n` +
      `This is a gentle reminder regarding your pending Khata credit balance for your recent electronics/appliances purchase.\n\n` +
      `💰 *Pending Balance:* ₹${c.outstandingBalance.toLocaleString('en-IN')}\n\n` +
      `You can clear your dues conveniently via UPI to:\n` +
      `👉 *UPI ID:* \`${settings.upiId}\`\n` +
      `Or visit our showroom at Shivaji Maharaj Chowk, Shrirampur.\n\n` +
      `If you have already paid, kindly reply with the transaction reference.\n` +
      `Thank you for your business!`;

    const encoded = encodeURIComponent(message);
    window.open(`https://wa.me/${phoneWithCode}?text=${encoded}`, '_blank');
  };

  return (
    <div className="space-y-5">
      {/* Top Stats Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Total Customers
            </span>
            <div className="text-2xl font-black text-slate-900 mt-1">
              {customers.length}
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">Active retail profiles</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-800 flex items-center justify-center font-bold">
            <Users className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Total Outstanding Khata
            </span>
            <div className="text-2xl font-black text-amber-700 mt-1">
              ₹{totalOutstanding.toLocaleString('en-IN')}
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Udhar across {customers.filter((c) => c.outstandingBalance > 0).length} customers
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-800 flex items-center justify-center font-bold">
            <CreditCard className="w-5 h-5" />
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-gradient-to-r from-[#0B2545] to-[#123966] text-white shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-amber-300 uppercase tracking-wider">
              Quick Customer Add
            </span>
            <p className="text-xs text-slate-300 mt-1">
              Register regular shoppers in Shrirampur
            </p>
            <button
              onClick={() => setShowAddCustomer(true)}
              className="mt-2 flex items-center gap-1 px-3 py-1.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs transition"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Customer</span>
            </button>
          </div>
        </div>
      </div>

      {/* Search & Customers Table */}
      <div className="rounded-2xl bg-white border border-slate-200/80 shadow-xs p-4 sm:p-5 space-y-4">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by customer name, mobile, village/area..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl bg-slate-50 border border-slate-300 focus:outline-none focus:border-amber-400"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-slate-600 font-bold">
                <th className="py-3 px-4">Customer Name</th>
                <th className="py-3 px-3">Mobile Contact</th>
                <th className="py-3 px-3">Location / Area</th>
                <th className="py-3 px-3 text-right">Lifetime Purchases</th>
                <th className="py-3 px-3 text-right">Khata Balance (Due)</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredCustomers.map((c) => {
                const hasDue = c.outstandingBalance > 0;

                return (
                  <tr key={c.id} className="hover:bg-slate-50/80 transition">
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900 text-xs sm:text-sm">
                        {c.name}
                      </div>
                      {c.isDemo && (
                        <span className="inline-block px-1 py-0.2 rounded text-[9px] font-medium bg-slate-100 text-slate-500 border border-slate-200">
                          Demo Data
                        </span>
                      )}
                    </td>

                    <td className="py-3 px-3 font-mono font-medium text-slate-800">
                      +91 {c.phone}
                    </td>

                    <td className="py-3 px-3 text-slate-600">
                      {c.address}
                    </td>

                    <td className="py-3 px-3 text-right font-mono font-bold text-slate-800">
                      ₹{c.totalPurchases.toLocaleString('en-IN')}
                    </td>

                    <td className="py-3 px-3 text-right">
                      {hasDue ? (
                        <span className="inline-block px-2.5 py-1 rounded-lg text-xs font-black bg-amber-100 text-amber-900 border border-amber-300 font-mono">
                          ₹{c.outstandingBalance.toLocaleString('en-IN')}
                        </span>
                      ) : (
                        <span className="inline-block px-2 py-0.5 rounded text-[11px] font-bold text-emerald-700 bg-emerald-50">
                          Cleared
                        </span>
                      )}
                    </td>

                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {hasDue && (
                          <>
                            <button
                              onClick={() => handleOpenCollectPayment(c)}
                              className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px] transition shadow-xs"
                              title="Record payment received"
                            >
                              Collect ₹
                            </button>

                            <button
                              onClick={() => handleSendWhatsAppReminder(c)}
                              className="p-1.5 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition"
                              title="Send WhatsApp payment reminder"
                            >
                              <Send className="w-3.5 h-3.5" />
                            </button>
                          </>
                        )}

                        <button
                          onClick={() => setSelectedCustomer(c)}
                          className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold text-[11px] transition"
                        >
                          Ledger
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Customer Ledger Statement Modal */}
      {selectedCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="w-full max-w-2xl rounded-2xl bg-white p-6 shadow-2xl text-slate-800 my-auto animate-in fade-in">
            <div className="flex items-start justify-between pb-4 border-b border-slate-100">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Khata Ledger Statement
                </span>
                <h3 className="text-lg font-black text-slate-900">
                  {selectedCustomer.name}
                </h3>
                <p className="text-xs text-slate-600 font-mono">
                  +91 {selectedCustomer.phone} • {selectedCustomer.address}
                </p>
              </div>

              <div className="text-right">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Current Khata Balance
                </span>
                <div className="text-xl font-black text-amber-700 font-mono">
                  ₹{selectedCustomer.outstandingBalance.toLocaleString('en-IN')}
                </div>
              </div>
            </div>

            {/* Invoices List for this Customer */}
            <div className="mt-4 space-y-4">
              <div>
                <h4 className="font-bold text-xs uppercase tracking-wider text-slate-700 mb-2">
                  Bill History ({customerInvoices.length} Bills)
                </h4>
                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {customerInvoices.map((inv) => (
                    <div
                      key={inv.id}
                      className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-slate-900">
                            {inv.invoiceNumber}
                          </span>
                          <span className="text-slate-500">
                            {new Date(inv.date).toLocaleDateString('en-IN')}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-600 mt-0.5">
                          {inv.items.map((i) => i.name).join(', ')}
                        </p>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <div className="font-mono font-bold text-slate-900">
                            ₹{inv.totalAmount.toLocaleString('en-IN')}
                          </div>
                          <div className="text-[10px] text-slate-500">
                            Paid: ₹{inv.amountPaid.toLocaleString('en-IN')} • Due: ₹{inv.balanceDue.toLocaleString('en-IN')}
                          </div>
                        </div>

                        <button
                          onClick={() => onOpenInvoiceModal(inv)}
                          className="px-2 py-1 rounded bg-slate-200 hover:bg-amber-400 hover:text-slate-950 font-semibold text-[10px]"
                        >
                          View Bill
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Payments History */}
              {customerPayments.length > 0 && (
                <div>
                  <h4 className="font-bold text-xs uppercase tracking-wider text-slate-700 mb-2">
                    Payment Receipts ({customerPayments.length} Payments)
                  </h4>
                  <div className="space-y-1.5 max-h-36 overflow-y-auto">
                    {customerPayments.map((pay) => (
                      <div
                        key={pay.id}
                        className="p-2.5 rounded-lg bg-emerald-50/70 border border-emerald-200 flex items-center justify-between text-xs"
                      >
                        <div>
                          <span className="font-bold text-emerald-900">
                            ₹{pay.amount.toLocaleString('en-IN')} via {pay.method.toUpperCase()}
                          </span>
                          <span className="text-[10px] text-slate-500 ml-2">
                            {new Date(pay.timestamp).toLocaleDateString('en-IN')}
                          </span>
                          <p className="text-[10px] text-slate-600">
                            {pay.notes} {pay.referenceNumber ? `(Ref: ${pay.referenceNumber})` : ''}
                          </p>
                        </div>
                        <span className="text-[10px] text-slate-500">Recv by {pay.receivedBy}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between">
              {selectedCustomer.outstandingBalance > 0 && (
                <button
                  onClick={() => handleOpenCollectPayment(selectedCustomer)}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-xs"
                >
                  Collect Payment (₹{selectedCustomer.outstandingBalance.toLocaleString('en-IN')})
                </button>
              )}
              <button
                onClick={() => setSelectedCustomer(null)}
                className="ml-auto px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs"
              >
                Close Ledger
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Collect Payment Modal */}
      {payingCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-2xl text-slate-800 animate-in fade-in">
            <h3 className="font-bold text-sm text-slate-900 pb-2 border-b border-slate-100">
              Collect Khata Payment: {payingCustomer.name}
            </h3>

            <div className="mt-2 text-xs text-slate-600">
              Current Outstanding Balance: <strong className="text-amber-700 font-mono text-sm">₹{payingCustomer.outstandingBalance.toLocaleString('en-IN')}</strong>
            </div>

            <form onSubmit={handleSubmitPayment} className="mt-4 space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Payment Amount (₹) *</label>
                <input
                  type="number"
                  required
                  min="1"
                  max={payingCustomer.outstandingBalance || 1000000}
                  value={payAmount}
                  onChange={(e) => setPayAmount(Number(e.target.value) || 0)}
                  className="w-full px-3 py-1.5 text-sm font-mono font-bold rounded-xl border border-slate-300"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Payment Mode</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'upi', label: 'UPI / QR' },
                    { id: 'cash', label: 'Cash' },
                    { id: 'bank_transfer', label: 'Bank (NEFT)' },
                  ].map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setPayMethod(m.id as PaymentMethod)}
                      className={`py-1.5 text-xs font-bold rounded-lg border transition ${
                        payMethod === m.id
                          ? 'bg-[#0B2545] text-amber-400 border-blue-900'
                          : 'bg-slate-50 text-slate-700 border-slate-200'
                      }`}
                    >
                      {m.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Reference / UTR Number</label>
                <input
                  type="text"
                  placeholder="e.g. PhonePe UPI Trans ID or Cash Receipt #"
                  value={payRef}
                  onChange={(e) => setPayRef(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-300 font-mono"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Notes</label>
                <input
                  type="text"
                  value={payNotes}
                  onChange={(e) => setPayNotes(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-300"
                />
              </div>

              <div className="mt-5 flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setPayingCustomer(null)}
                  className="px-3 py-1.5 rounded-xl bg-slate-100 text-slate-700 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold shadow-xs"
                >
                  Record Payment &amp; Update Khata
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Customer Modal */}
      {showAddCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-2xl text-slate-800 animate-in fade-in">
            <h3 className="font-bold text-sm text-slate-900 pb-2 border-b border-slate-100">
              Add New Customer Profile
            </h3>

            <form onSubmit={handleCreateCustomer} className="mt-4 space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Ramesh S. Kadam"
                  value={newCustName}
                  onChange={(e) => setNewCustName(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-300"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Mobile Number (10 Digits) *</label>
                <input
                  type="tel"
                  required
                  placeholder="9822000000"
                  value={newCustPhone}
                  onChange={(e) => setNewCustPhone(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-300 font-mono"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Village / Address in Shrirampur Area</label>
                <input
                  type="text"
                  placeholder="e.g. Near Sugar Factory, Babhaleshwar"
                  value={newCustAddress}
                  onChange={(e) => setNewCustAddress(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-300"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Credit Limit (₹)</label>
                <input
                  type="number"
                  value={newCustLimit}
                  onChange={(e) => setNewCustLimit(Number(e.target.value) || 25000)}
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-300 font-mono"
                />
              </div>

              <div className="mt-5 flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddCustomer(false)}
                  className="px-3 py-1.5 rounded-xl bg-slate-100 text-slate-700 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black shadow-xs"
                >
                  Create Profile
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
