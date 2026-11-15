import React, { useState, useMemo } from 'react';
import { 
  Product, 
  Customer, 
  InvoiceItem, 
  PaymentMethod, 
  User, 
  StoreSettings, 
  Invoice 
} from '../../types';
import { 
  Search, 
  Plus, 
  Minus, 
  Trash2, 
  Receipt, 
  UserPlus, 
  Check, 
  AlertCircle, 
  Smartphone, 
  QrCode, 
  CreditCard, 
  Banknote, 
  ShieldAlert, 
  ShieldCheck,
  Tag,
  ArrowRight,
  Info
} from 'lucide-react';

interface BillingViewProps {
  products: Product[];
  customers: Customer[];
  currentUser: User;
  settings: StoreSettings;
  onSaveInvoice: (invoiceData: Omit<Invoice, 'id' | 'invoiceNumber' | 'date'>) => Invoice;
  onAddCustomer: (customer: Omit<Customer, 'id' | 'outstandingBalance' | 'totalPurchases' | 'firstVisitDate'>) => Customer;
  onOpenInvoiceModal: (invoice: Invoice) => void;
}

export const BillingView: React.FC<BillingViewProps> = ({
  products,
  customers,
  currentUser,
  settings,
  onSaveInvoice,
  onAddCustomer,
  onOpenInvoiceModal,
}) => {
  // Product Search & Filter
  const [productSearch, setProductSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Cart / Bill State
  const [cartItems, setCartItems] = useState<InvoiceItem[]>([]);
  const [overallDiscount, setOverallDiscount] = useState<number>(0);

  // Customer Selection State
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [customerSearch, setCustomerSearch] = useState('');
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);

  // Payment State
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('upi');
  const [cashAmount, setCashAmount] = useState<number>(0);
  const [upiAmount, setUpiAmount] = useState<number>(0);
  const [upiReference, setUpiReference] = useState('');
  const [amountPaidNow, setAmountPaidNow] = useState<number | null>(null); // null means full payment
  const [billNotes, setBillNotes] = useState('');

  // GST mode lock dialog
  const [showGstLockInfo, setShowGstLockInfo] = useState(false);

  // Categories list
  const categories = useMemo(() => {
    const set = new Set(products.map((p) => p.category));
    return ['all', ...Array.from(set)];
  }, [products]);

  // Filtered Products
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      if (!p.isActive) return false;
      const matchesCategory = selectedCategory === 'all' || p.category === selectedCategory;
      const query = productSearch.toLowerCase();
      const matchesSearch =
        p.name.toLowerCase().includes(query) ||
        p.code.toLowerCase().includes(query) ||
        p.brand.toLowerCase().includes(query) ||
        p.modelNumber.toLowerCase().includes(query);
      return matchesCategory && matchesSearch;
    });
  }, [products, selectedCategory, productSearch]);

  // Filtered Customers
  const filteredCustomers = useMemo(() => {
    if (!customerSearch.trim()) return customers.slice(0, 5);
    const q = customerSearch.toLowerCase();
    return customers.filter(
      (c) => c.name.toLowerCase().includes(q) || c.phone.includes(q)
    );
  }, [customers, customerSearch]);

  // Handle selecting an existing customer
  const handleSelectCustomer = (c: Customer) => {
    setSelectedCustomerId(c.id);
    setCustomerName(c.name);
    setCustomerPhone(c.phone);
    setCustomerAddress(c.address || '');
    setCustomerSearch('');
    setShowCustomerDropdown(false);
  };

  // Add product to bill
  const handleAddToCart = (product: Product) => {
    if (product.stockQuantity <= 0) {
      alert(`"${product.name}" is currently OUT OF STOCK! Please record incoming stock first.`);
      return;
    }

    setCartItems((prev) => {
      const existing = prev.find((i) => i.productId === product.id);
      if (existing) {
        if (existing.quantity >= product.stockQuantity) {
          alert(`Cannot add more than ${product.stockQuantity} units available in showroom inventory.`);
          return prev;
        }
        return prev.map((item) =>
          item.productId === product.id
            ? {
                ...item,
                quantity: item.quantity + 1,
                total: (item.quantity + 1) * item.unitPrice - item.discount,
              }
            : item
        );
      } else {
        const newItem: InvoiceItem = {
          id: `item-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
          productId: product.id,
          name: product.name,
          brand: product.brand,
          modelNumber: product.modelNumber,
          serialNumber: '', // cashier will fill
          quantity: 1,
          unitPrice: product.sellingPrice,
          purchasePrice: product.purchasePrice,
          mrp: product.mrp,
          discount: 0,
          total: product.sellingPrice,
          warrantyPeriod: product.warrantyPeriod,
        };
        return [...prev, newItem];
      }
    });
  };

  // Update item quantity
  const handleUpdateQuantity = (itemId: string, delta: number) => {
    setCartItems((prev) =>
      prev
        .map((item) => {
          if (item.id === itemId) {
            const product = products.find((p) => p.id === item.productId);
            const maxStock = product?.stockQuantity || 999;
            const newQty = item.quantity + delta;

            if (newQty > maxStock) {
              alert(`Maximum available showroom stock is ${maxStock}.`);
              return item;
            }
            if (newQty <= 0) return null;

            return {
              ...item,
              quantity: newQty,
              total: newQty * item.unitPrice - item.discount,
            };
          }
          return item;
        })
        .filter(Boolean) as InvoiceItem[]
    );
  };

  // Update item details (serial number, rate, discount)
  const handleUpdateItemDetail = (
    itemId: string,
    field: 'serialNumber' | 'unitPrice' | 'discount',
    val: any
  ) => {
    setCartItems((prev) =>
      prev.map((item) => {
        if (item.id === itemId) {
          const updated = { ...item, [field]: val };
          const unitPrice = field === 'unitPrice' ? Number(val) || 0 : item.unitPrice;
          const discount = field === 'discount' ? Number(val) || 0 : item.discount;
          updated.total = Math.max(0, item.quantity * unitPrice - discount);
          return updated;
        }
        return item;
      })
    );
  };

  // Remove item
  const handleRemoveItem = (itemId: string) => {
    setCartItems((prev) => prev.filter((i) => i.id !== itemId));
  };

  // Cart Calculations
  const subtotal = useMemo(() => {
    return cartItems.reduce((acc, curr) => acc + curr.total, 0);
  }, [cartItems]);

  const netTotal = useMemo(() => {
    return Math.max(0, subtotal - (overallDiscount || 0));
  }, [subtotal, overallDiscount]);

  // Actual amount paid live value
  const actualPaid = useMemo(() => {
    if (paymentMethod === 'credit') {
      return 0;
    }
    if (paymentMethod === 'split') {
      return (cashAmount || 0) + (upiAmount || 0);
    }
    if (amountPaidNow !== null) {
      return Math.min(netTotal, Math.max(0, amountPaidNow));
    }
    return netTotal;
  }, [paymentMethod, cashAmount, upiAmount, amountPaidNow, netTotal]);

  const balanceDue = useMemo(() => {
    return Math.max(0, netTotal - actualPaid);
  }, [netTotal, actualPaid]);

  // Complete and submit bill
  const handleGenerateInvoice = () => {
    if (cartItems.length === 0) {
      alert('Please add at least one product or appliance to the bill.');
      return;
    }

    if (!customerName.trim() || !customerPhone.trim()) {
      alert('Please enter customer Name and mobile number.');
      return;
    }

    if (customerPhone.trim().replace(/\D/g, '').length < 10) {
      alert('Please enter a valid 10-digit mobile number for WhatsApp sharing and Khata record.');
      return;
    }

    // If customer does not exist, create new customer profile
    let custId = selectedCustomerId;
    if (!custId) {
      const existing = customers.find(
        (c) => c.phone === customerPhone.trim().replace(/\D/g, '')
      );
      if (existing) {
        custId = existing.id;
      } else {
        const created = onAddCustomer({
          name: customerName.trim(),
          phone: customerPhone.trim().replace(/\D/g, ''),
          address: customerAddress.trim() || 'Shrirampur, Ahilyanagar',
          creditLimit: 25000,
          notes: 'Added from counter POS bill generation',
        });
        custId = created.id;
      }
    }

    const newInvoice = onSaveInvoice({
      customerId: custId,
      customerName: customerName.trim(),
      customerPhone: customerPhone.trim().replace(/\D/g, ''),
      customerAddress: customerAddress.trim(),
      items: cartItems,
      subtotal,
      overallDiscount: overallDiscount || 0,
      taxAmount: 0, // Non-GST mode
      totalAmount: netTotal,
      amountPaid: actualPaid,
      balanceDue,
      paymentMethod,
      paymentDetails: {
        cashAmount: paymentMethod === 'split' ? cashAmount : (paymentMethod === 'cash' ? actualPaid : 0),
        upiAmount: paymentMethod === 'split' ? upiAmount : (paymentMethod === 'upi' ? actualPaid : 0),
        upiReference: upiReference.trim(),
      },
      status: balanceDue === 0 ? 'paid' : actualPaid === 0 ? 'pending' : 'partial',
      invoiceType: 'non_gst_retail',
      isGstVerified: false,
      notes: billNotes.trim(),
      createdBy: currentUser.id,
      createdByName: currentUser.name,
      createdByRole: currentUser.role,
    });

    // Reset bill form
    setCartItems([]);
    setOverallDiscount(0);
    setSelectedCustomerId('');
    setCustomerName('');
    setCustomerPhone('');
    setCustomerAddress('');
    setCashAmount(0);
    setUpiAmount(0);
    setUpiReference('');
    setAmountPaidNow(null);
    setBillNotes('');

    // Open print & share modal
    onOpenInvoiceModal(newInvoice);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      {/* LEFT COLUMN: Product Catalog & Fast Add (7 Cols) */}
      <div className="lg:col-span-7 space-y-4">
        {/* Search & Category Filter Bar */}
        <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs space-y-3">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search TV, AC, Fridge, Mobile, Model (e.g. 43UR7500, S24)..."
                value={productSearch}
                onChange={(e) => setProductSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-slate-50 border border-slate-300 focus:outline-none focus:border-amber-400 focus:bg-white transition"
              />
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500 hidden sm:inline">Category:</span>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-3 py-2 text-xs font-semibold rounded-xl bg-slate-50 border border-slate-300 text-slate-800 focus:outline-none focus:border-amber-400"
              >
                <option value="all">All Appliances ({products.length})</option>
                {categories
                  .filter((c) => c !== 'all')
                  .map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
              </select>
            </div>
          </div>
        </div>

        {/* Product Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[620px] overflow-y-auto pr-1">
          {filteredProducts.map((p) => {
            const inCart = cartItems.find((i) => i.productId === p.id);
            const isOutOfStock = p.stockQuantity <= 0;
            const isLowStock = p.stockQuantity <= p.minStockAlert;

            return (
              <div
                key={p.id}
                onClick={() => !isOutOfStock && handleAddToCart(p)}
                className={`p-3 rounded-2xl border transition text-left flex flex-col justify-between group ${
                  isOutOfStock
                    ? 'bg-slate-100 border-slate-200 opacity-60 cursor-not-allowed'
                    : inCart
                    ? 'bg-amber-50/60 border-amber-300 shadow-xs cursor-pointer'
                    : 'bg-white border-slate-200 hover:border-amber-400 hover:shadow-xs cursor-pointer'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="px-2 py-0.5 rounded text-[10px] font-black bg-slate-900 text-white">
                      {p.brand}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        isOutOfStock
                          ? 'bg-rose-100 text-rose-800 border border-rose-200'
                          : isLowStock
                          ? 'bg-amber-100 text-amber-900 border border-amber-200'
                          : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                      }`}
                    >
                      {isOutOfStock ? '0 Left' : `${p.stockQuantity} in Stock`}
                    </span>
                  </div>

                  <h4 className="font-bold text-xs text-slate-900 line-clamp-2 group-hover:text-blue-900 transition leading-snug">
                    {p.name}
                  </h4>
                  <p className="text-[10px] text-slate-500 mt-0.5 font-mono">
                    Model: {p.modelNumber} • {p.code}
                  </p>
                </div>

                <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between">
                  <div>
                    <div className="text-sm sm:text-base font-black text-[#0B2545] font-sans">
                      ₹{p.sellingPrice.toLocaleString('en-IN')}
                    </div>
                    {p.mrp > p.sellingPrice && (
                      <span className="text-[10px] text-slate-400 line-through">
                        MRP ₹{p.mrp.toLocaleString('en-IN')}
                      </span>
                    )}
                  </div>

                  <button
                    disabled={isOutOfStock}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1 ${
                      isOutOfStock
                        ? 'bg-slate-200 text-slate-400'
                        : inCart
                        ? 'bg-amber-400 text-slate-950 font-black'
                        : 'bg-slate-900 text-white group-hover:bg-amber-400 group-hover:text-slate-950'
                    }`}
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>{inCart ? `Add (${inCart.quantity})` : 'Add'}</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* RIGHT COLUMN: Active Bill & POS Checkout (5 Cols) */}
      <div className="lg:col-span-5 space-y-4">
        <div className="rounded-2xl bg-white border border-slate-200 shadow-md p-4 sm:p-5 flex flex-col justify-between">
          <div>
            {/* Bill Header & GST Mode Indicator */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-amber-400 text-slate-950 font-black flex items-center justify-center text-xs">
                  M1
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900">
                    Retail Cash Memo
                  </h3>
                  <p className="text-[10px] text-slate-500">
                    Counter Staff: <strong className="text-slate-700">{currentUser.name}</strong>
                  </p>
                </div>
              </div>

              {/* GST Verification Status Badge */}
              <button
                onClick={() => setShowGstLockInfo(true)}
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-50 border border-amber-300 text-amber-800 text-[11px] font-bold hover:bg-amber-100 transition"
                title="Click to view GST registration compliance details"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-amber-600" />
                <span>Non-GST Mode</span>
                <Info className="w-3 h-3 text-amber-600" />
              </button>
            </div>

            {/* Customer Section */}
            <div className="mt-3.5 p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                  Customer &amp; Khata Record
                </span>
                {selectedCustomerId && (
                  <button
                    onClick={() => {
                      setSelectedCustomerId('');
                      setCustomerName('');
                      setCustomerPhone('');
                      setCustomerAddress('');
                    }}
                    className="text-[10px] text-rose-600 hover:underline font-semibold"
                  >
                    Clear
                  </button>
                )}
              </div>

              {/* Fast customer phone search & autocompletion */}
              <div className="relative">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <input
                    type="text"
                    placeholder="Customer Name *"
                    value={customerName}
                    onChange={(e) => {
                      setCustomerName(e.target.value);
                      setCustomerSearch(e.target.value);
                      setShowCustomerDropdown(true);
                    }}
                    onFocus={() => setShowCustomerDropdown(true)}
                    className="px-3 py-1.5 text-xs rounded-lg border border-slate-300 bg-white focus:outline-none focus:border-amber-400"
                  />
                  <input
                    type="tel"
                    placeholder="Mobile (10 Digits) *"
                    value={customerPhone}
                    onChange={(e) => {
                      setCustomerPhone(e.target.value);
                      setCustomerSearch(e.target.value);
                      setShowCustomerDropdown(true);
                    }}
                    className="px-3 py-1.5 text-xs rounded-lg border border-slate-300 bg-white focus:outline-none focus:border-amber-400"
                  />
                </div>

                {/* Customer Dropdown Results */}
                {showCustomerDropdown && filteredCustomers.length > 0 && !selectedCustomerId && (
                  <>
                    <div
                      className="fixed inset-0 z-10"
                      onClick={() => setShowCustomerDropdown(false)}
                    />
                    <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-slate-300 rounded-xl shadow-xl z-20 max-h-48 overflow-y-auto divide-y divide-slate-100">
                      {filteredCustomers.map((c) => (
                        <div
                          key={c.id}
                          onClick={() => handleSelectCustomer(c)}
                          className="p-2.5 hover:bg-amber-50 cursor-pointer text-xs flex items-center justify-between transition"
                        >
                          <div>
                            <div className="font-bold text-slate-900">{c.name}</div>
                            <div className="text-[10px] text-slate-500 font-mono">
                              +91 {c.phone} • {c.address}
                            </div>
                          </div>
                          {c.outstandingBalance > 0 && (
                            <span className="text-[10px] font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded">
                              Khata: ₹{c.outstandingBalance.toLocaleString('en-IN')}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>

              <input
                type="text"
                placeholder="Village / Area in Shrirampur (e.g. Babhaleshwar, Rahata Rd)"
                value={customerAddress}
                onChange={(e) => setCustomerAddress(e.target.value)}
                className="w-full px-3 py-1 text-xs rounded-lg border border-slate-300 bg-white focus:outline-none focus:border-amber-400"
              />
            </div>

            {/* Cart Items List */}
            <div className="mt-4 space-y-2.5 max-h-[260px] overflow-y-auto pr-1">
              {cartItems.length === 0 ? (
                <div className="py-8 text-center text-slate-400 text-xs border-2 border-dashed border-slate-200 rounded-xl">
                  <Receipt className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                  <p>Bill cart is empty</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Click products from the left catalog to add
                  </p>
                </div>
              ) : (
                cartItems.map((item) => (
                  <div
                    key={item.id}
                    className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2 text-xs"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="font-bold text-slate-900 truncate">
                          {item.name}
                        </div>
                        <div className="text-[10px] text-slate-500">
                          {item.brand} • {item.modelNumber}
                        </div>
                      </div>
                      <button
                        onClick={() => handleRemoveItem(item.id)}
                        className="text-slate-400 hover:text-rose-600 p-0.5 transition flex-shrink-0"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Serial / IMEI input field for electronics */}
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] font-semibold text-slate-500">S/N:</span>
                      <input
                        type="text"
                        placeholder="IMEI / Appliance Serial # (Warranty)"
                        value={item.serialNumber || ''}
                        onChange={(e) =>
                          handleUpdateItemDetail(item.id, 'serialNumber', e.target.value)
                        }
                        className="flex-1 px-2 py-0.5 text-[11px] font-mono rounded border border-slate-300 bg-white focus:outline-none focus:border-blue-500"
                      />
                    </div>

                    {/* Quantity & Pricing Controls */}
                    <div className="flex items-center justify-between pt-1 border-t border-slate-200">
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => handleUpdateQuantity(item.id, -1)}
                          className="w-6 h-6 rounded bg-white border border-slate-300 flex items-center justify-center font-bold text-slate-700 hover:bg-slate-100"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="w-7 text-center font-bold text-slate-900">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => handleUpdateQuantity(item.id, 1)}
                          className="w-6 h-6 rounded bg-white border border-slate-300 flex items-center justify-center font-bold text-slate-700 hover:bg-slate-100"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>

                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1 text-[11px] text-slate-600">
                          <span>Disc:</span>
                          <input
                            type="number"
                            placeholder="₹"
                            value={item.discount || ''}
                            onChange={(e) =>
                              handleUpdateItemDetail(item.id, 'discount', e.target.value)
                            }
                            className="w-14 px-1 py-0.5 text-right font-mono text-[11px] rounded border border-slate-300 bg-white"
                          />
                        </div>
                        <div className="font-mono font-bold text-slate-900 text-sm">
                          ₹{item.total.toLocaleString('en-IN')}
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Payment & Bill Summary Controls */}
          {cartItems.length > 0 && (
            <div className="mt-4 pt-3 border-t border-slate-200 space-y-3">
              {/* Overall Discount */}
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-600">Special Bill Discount:</span>
                <div className="flex items-center gap-1">
                  <span>- ₹</span>
                  <input
                    type="number"
                    min="0"
                    placeholder="0"
                    value={overallDiscount || ''}
                    onChange={(e) => setOverallDiscount(Number(e.target.value) || 0)}
                    className="w-20 px-2 py-0.5 text-right font-mono font-bold text-xs rounded border border-slate-300 bg-white"
                  />
                </div>
              </div>

              {/* Payment Method Selector */}
              <div>
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">
                  Payment Mode
                </span>
                <div className="grid grid-cols-4 gap-1.5">
                  {[
                    { id: 'upi', label: 'UPI / QR', icon: QrCode },
                    { id: 'cash', label: 'Cash', icon: Banknote },
                    { id: 'split', label: 'Split Pay', icon: Tag },
                    { id: 'credit', label: 'Khata Due', icon: CreditCard },
                  ].map((mode) => {
                    const Icon = mode.icon;
                    const isSelected = paymentMethod === mode.id;
                    return (
                      <button
                        key={mode.id}
                        type="button"
                        onClick={() => {
                          setPaymentMethod(mode.id as PaymentMethod);
                          if (mode.id === 'split') {
                            setCashAmount(Math.floor(netTotal / 2));
                            setUpiAmount(Math.ceil(netTotal / 2));
                          }
                        }}
                        className={`py-2 px-1 rounded-xl text-[11px] font-bold flex flex-col items-center gap-1 border transition ${
                          isSelected
                            ? 'bg-[#0B2545] text-amber-400 border-blue-900 shadow-xs'
                            : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        <Icon className="w-3.5 h-3.5" />
                        <span>{mode.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Split payment detailed breakdown */}
              {paymentMethod === 'split' && (
                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-[10px] text-slate-500 block mb-0.5">Cash Paid (₹)</span>
                    <input
                      type="number"
                      value={cashAmount || ''}
                      onChange={(e) => setCashAmount(Number(e.target.value) || 0)}
                      className="w-full px-2 py-1 font-mono font-bold rounded border border-slate-300 bg-white text-xs"
                    />
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block mb-0.5">UPI Paid (₹)</span>
                    <input
                      type="number"
                      value={upiAmount || ''}
                      onChange={(e) => setUpiAmount(Number(e.target.value) || 0)}
                      className="w-full px-2 py-1 font-mono font-bold rounded border border-slate-300 bg-white text-xs"
                    />
                  </div>
                </div>
              )}

              {/* Partial payment / Khata adjustment */}
              {paymentMethod !== 'credit' && paymentMethod !== 'split' && (
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-600">Amount Paid Now:</span>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="number"
                      placeholder={netTotal.toString()}
                      value={amountPaidNow !== null ? amountPaidNow : ''}
                      onChange={(e) => {
                        const val = e.target.value === '' ? null : Number(e.target.value);
                        setAmountPaidNow(val);
                      }}
                      className="w-24 px-2 py-1 text-right font-mono font-bold text-xs rounded border border-slate-300 bg-white"
                    />
                    <button
                      type="button"
                      onClick={() => setAmountPaidNow(null)}
                      className="text-[10px] text-blue-700 font-bold hover:underline"
                    >
                      Full
                    </button>
                  </div>
                </div>
              )}

              {/* Totals Box */}
              <div className="p-3 rounded-xl bg-[#0B2545] text-white space-y-1 text-xs">
                <div className="flex justify-between text-slate-300">
                  <span>Subtotal:</span>
                  <span className="font-mono">₹{subtotal.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between text-base font-black text-amber-400 pt-1 border-t border-blue-900">
                  <span>Net Payable:</span>
                  <span className="font-mono">₹{netTotal.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between text-[11px] text-slate-300 pt-1">
                  <span>Paid Now: ₹{actualPaid.toLocaleString('en-IN')}</span>
                  {balanceDue > 0 ? (
                    <span className="text-amber-300 font-bold">
                      Khata Due: ₹{balanceDue.toLocaleString('en-IN')}
                    </span>
                  ) : (
                    <span className="text-emerald-400 font-bold">Full Settlement</span>
                  )}
                </div>
              </div>

              {/* Complete & Generate Bill Button */}
              <button
                onClick={handleGenerateInvoice}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-black text-sm shadow-md active:scale-98 transition flex items-center justify-center gap-2"
              >
                <Receipt className="w-4 h-4 stroke-[2.5]" />
                <span>Save Bill &amp; Generate Invoice &rarr;</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* GST Lock Info Modal */}
      {showGstLockInfo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-2xl text-slate-800 animate-in fade-in">
            <div className="flex items-center gap-2 text-amber-600 pb-3 border-b border-slate-100">
              <ShieldAlert className="w-5 h-5 flex-shrink-0" />
              <h3 className="font-bold text-sm text-slate-900">
                GST Compliance Lock Notice
              </h3>
            </div>
            <p className="text-xs text-slate-600 mt-3 leading-relaxed">
              M1 ENTERPRISES has an active GST Registration application in progress (ARN: <strong>AA271126019283K</strong>).
            </p>
            <div className="mt-2 p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900">
              In strict accordance with statutory requirements, <strong>GST Tax Invoice issuance is disabled</strong> until the GSTIN is active and verified by tax authorities.
              <br /><br />
              All counter bills are legally recorded as <strong>Non-GST Retail Cash Memos / Delivery Estimates</strong>.
            </div>
            <button
              onClick={() => setShowGstLockInfo(false)}
              className="mt-4 w-full py-2 rounded-xl bg-slate-900 text-white font-bold text-xs"
            >
              Understand &amp; Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
