import React, { useState, useMemo } from 'react';
import { CustomerOrder, Product, Customer, User, UserRole, OrderStatus, DeliveryType, OrderSource, PaymentMethod, Invoice } from '../../types';
import { 
  ShoppingBag, 
  Search, 
  Plus, 
  Truck, 
  Store, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  ArrowRight, 
  Receipt, 
  Share2, 
  Phone, 
  MapPin, 
  Calendar, 
  Filter,
  X,
  CreditCard,
  MessageSquare
} from 'lucide-react';

interface OrdersViewProps {
  orders: CustomerOrder[];
  products: Product[];
  customers: Customer[];
  currentUser: User;
  onTakeOrder: (order: Omit<CustomerOrder, 'id' | 'orderNumber' | 'orderDate'>) => CustomerOrder;
  onUpdateStatus: (orderId: string, status: OrderStatus) => void;
  onConvertToInvoice: (orderId: string) => Invoice | null;
  onOpenInvoiceModal: (invoice: Invoice) => void;
}

export const OrdersView: React.FC<OrdersViewProps> = ({
  orders,
  products,
  customers,
  currentUser,
  onTakeOrder,
  onUpdateStatus,
  onConvertToInvoice,
  onOpenInvoiceModal,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | OrderStatus>('all');
  const [showTakeOrderModal, setShowTakeOrderModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<CustomerOrder | null>(null);

  // New Order Form State
  const [custName, setCustName] = useState('');
  const [custPhone, setCustPhone] = useState('');
  const [custAddress, setCustAddress] = useState('');
  const [deliveryType, setDeliveryType] = useState<DeliveryType>('home_delivery');
  const [orderSource, setOrderSource] = useState<OrderSource>('walk_in');
  const [deliveryDate, setDeliveryDate] = useState('');
  const [orderNotes, setOrderNotes] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('upi');
  const [advancePaid, setAdvancePaid] = useState<number>(0);

  // Order Items in form
  const [selectedItems, setSelectedItems] = useState<{ productId: string; quantity: number }[]>([]);

  // Filtered orders
  const filteredOrders = useMemo(() => {
    return orders.filter((o) => {
      const q = searchTerm.toLowerCase();
      const matchSearch =
        o.orderNumber.toLowerCase().includes(q) ||
        o.customerName.toLowerCase().includes(q) ||
        o.customerPhone.includes(q) ||
        (o.customerAddress && o.customerAddress.toLowerCase().includes(q));

      const matchStatus = statusFilter === 'all' || o.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [orders, searchTerm, statusFilter]);

  // Order summary calculations for new order
  const newOrderCalculations = useMemo(() => {
    let total = 0;
    const items = selectedItems.map((si) => {
      const prod = products.find((p) => p.id === si.productId);
      const unitPrice = prod?.sellingPrice || 0;
      const lineTotal = unitPrice * si.quantity;
      total += lineTotal;
      return {
        productId: si.productId,
        name: prod?.name || 'Appliance',
        brand: prod?.brand || '',
        modelNumber: prod?.modelNumber || '',
        quantity: si.quantity,
        unitPrice,
        total: lineTotal,
        warrantyPeriod: prod?.warrantyPeriod || '1 Year',
      };
    });

    const balanceDue = Math.max(0, total - advancePaid);
    return { items, total, balanceDue };
  }, [selectedItems, products, advancePaid]);

  const handleAddItemToOrder = (productId: string) => {
    setSelectedItems((prev) => {
      const exists = prev.find((i) => i.productId === productId);
      if (exists) {
        return prev.map((i) =>
          i.productId === productId ? { ...i, quantity: i.quantity + 1 } : i
        );
      }
      return [...prev, { productId, quantity: 1 }];
    });
  };

  const handleRemoveItem = (productId: string) => {
    setSelectedItems((prev) => prev.filter((i) => i.productId !== productId));
  };

  const handleUpdateItemQty = (productId: string, qty: number) => {
    if (qty <= 0) {
      handleRemoveItem(productId);
      return;
    }
    setSelectedItems((prev) =>
      prev.map((i) => (i.productId === productId ? { ...i, quantity: qty } : i))
    );
  };

  const handleSubmitNewOrder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!custName.trim() || !custPhone.trim()) {
      alert('Customer Name and 10-digit mobile number are required.');
      return;
    }
    if (selectedItems.length === 0) {
      alert('Please select at least one appliance for this order.');
      return;
    }

    const { items, total, balanceDue } = newOrderCalculations;

    onTakeOrder({
      customerName: custName.trim(),
      customerPhone: custPhone.trim().replace(/\D/g, ''),
      customerAddress: custAddress.trim(),
      items,
      totalAmount: total,
      advancePaid,
      balanceDue,
      paymentMethod,
      status: advancePaid > 0 ? 'confirmed' : 'pending',
      deliveryType,
      orderSource,
      deliveryDate: deliveryDate || undefined,
      notes: orderNotes.trim(),
      createdBy: currentUser.id,
      createdByName: currentUser.name,
      isDemo: false,
    });

    // Reset Form
    setCustName('');
    setCustPhone('');
    setCustAddress('');
    setSelectedItems([]);
    setAdvancePaid(0);
    setOrderNotes('');
    setShowTakeOrderModal(false);
  };

  const handleConvertOrder = (orderId: string) => {
    const inv = onConvertToInvoice(orderId);
    if (inv) {
      onOpenInvoiceModal(inv);
    }
  };

  const handleSendWhatsAppUpdate = (order: CustomerOrder) => {
    const cleanPhone = order.customerPhone.replace(/\D/g, '');
    const phoneWithCode = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;

    const itemsText = order.items
      .map((i, idx) => `${idx + 1}. *${i.name}* (Qty: ${i.quantity}) - ₹${i.total.toLocaleString('en-IN')}`)
      .join('\n');

    const statusMsg = 
      order.status === 'confirmed' ? '✅ Your order is confirmed and scheduled for dispatch/installation.' :
      order.status === 'ready' ? '📦 Your order is ready for showroom pickup / delivery.' :
      order.status === 'delivered' ? '🎉 Your order has been delivered and fulfilled.' :
      '📝 We have received your booking enquiry and will confirm shortly.';

    const message = `*M1 ENTERPRISES — ORDER UPDATE*\n` +
      `📍 *Location:* Chatrapati Shivaji Maharaj Chowk, Shrirampur\n` +
      `-----------------------------------------\n` +
      `Order Ref: *#${order.orderNumber}*\n` +
      `Customer: *${order.customerName}*\n` +
      `Status: *${order.status.toUpperCase()}*\n\n` +
      `${statusMsg}\n\n` +
      `*Appliance Details:*\n${itemsText}\n\n` +
      `*Total Amount:* ₹${order.totalAmount.toLocaleString('en-IN')}\n` +
      `*Advance Paid:* ₹${order.advancePaid.toLocaleString('en-IN')}\n` +
      (order.balanceDue > 0 ? `*Balance on Delivery:* ₹${order.balanceDue.toLocaleString('en-IN')}\n` : '') +
      `-----------------------------------------\n` +
      `Thank you for trusting M1 ENTERPRISES Shrirampur!`;

    window.open(`https://wa.me/${phoneWithCode}?text=${encodeURIComponent(message)}`, '_blank');
  };

  const getStatusBadge = (status: OrderStatus) => {
    switch (status) {
      case 'confirmed':
        return <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-100 text-blue-900 border border-blue-200">Confirmed</span>;
      case 'ready':
        return <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-purple-100 text-purple-900 border border-purple-200">Ready for Pickup</span>;
      case 'delivered':
        return <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-900 border border-emerald-200">Delivered &amp; Billed</span>;
      case 'cancelled':
        return <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-100 text-rose-900 border border-rose-200">Cancelled</span>;
      default:
        return <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-900 border border-amber-200">Pending Review</span>;
    }
  };

  return (
    <div className="space-y-5">
      {/* Top Banner & Fast Action */}
      <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-900 flex items-center justify-center font-bold">
              <ShoppingBag className="w-4 h-4 text-blue-800" />
            </div>
            <h2 className="font-extrabold text-base sm:text-lg text-slate-900">
              Orders &amp; Customer Pre-Bookings
            </h2>
            <span className="px-2 py-0.5 rounded text-xs font-bold bg-blue-100 text-blue-900">
              {orders.length} Orders
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Take appliance orders for home delivery, installation bookings, or store pickup in Shrirampur.
          </p>
        </div>

        <button
          onClick={() => setShowTakeOrderModal(true)}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-black text-xs shadow-md transition active:scale-95"
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          <span>Take New Order</span>
        </button>
      </div>

      {/* Orders Filter Toolbar */}
      <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search order #, customer name, mobile, area..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl bg-slate-50 border border-slate-300 focus:outline-none focus:border-amber-400"
          />
        </div>

        {/* Status Filter Tabs */}
        <div className="flex flex-wrap items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs font-semibold">
          {[
            { id: 'all', label: 'All Orders' },
            { id: 'pending', label: 'Pending' },
            { id: 'confirmed', label: 'Confirmed' },
            { id: 'ready', label: 'Ready' },
            { id: 'delivered', label: 'Delivered' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id as any)}
              className={`px-3 py-1 rounded-lg text-xs transition ${
                statusFilter === tab.id
                  ? 'bg-white text-slate-950 shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Orders Pipeline Cards List */}
      <div className="space-y-3">
        {filteredOrders.length === 0 ? (
          <div className="p-10 text-center bg-white rounded-2xl border border-slate-200 text-slate-400 text-xs">
            <ShoppingBag className="w-8 h-8 mx-auto text-slate-300 mb-2" />
            <p className="font-bold text-slate-700">No orders found</p>
            <p className="text-slate-400 mt-0.5">Click "Take New Order" to record your first booking.</p>
          </div>
        ) : (
          filteredOrders.map((order) => (
            <div
              key={order.id}
              className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs hover:border-blue-400/60 transition space-y-3"
            >
              {/* Order Header */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-700 font-bold text-xs">
                    {order.deliveryType === 'home_delivery' ? (
                      <Truck className="w-5 h-5 text-blue-700" />
                    ) : (
                      <Store className="w-5 h-5 text-amber-700" />
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-xs text-slate-900">
                        {order.orderNumber}
                      </span>
                      {getStatusBadge(order.status)}
                      <span className="text-[10px] text-slate-400 uppercase font-semibold">
                        Source: {order.orderSource.replace('_', ' ')}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 mt-0.5">
                      Customer: <strong className="text-slate-900">{order.customerName}</strong> • Phone: +91 {order.customerPhone}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-center">
                  <span className="text-xs text-slate-500">
                    {new Date(order.orderDate).toLocaleDateString('en-IN', {
                      day: '2-digit',
                      month: 'short',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
              </div>

              {/* Items & Delivery Details */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                {/* Items List */}
                <div className="md:col-span-2 space-y-2">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Ordered Appliances ({order.items.length})
                  </span>
                  <div className="space-y-1.5">
                    {order.items.map((item, idx) => (
                      <div key={idx} className="flex items-center justify-between p-2 rounded-xl bg-slate-50 border border-slate-200/70">
                        <div className="min-w-0">
                          <div className="font-bold text-slate-900 truncate">
                            {item.name}
                          </div>
                          <div className="text-[10px] text-slate-500">
                            Qty: <strong>{item.quantity}</strong> • {item.brand} ({item.modelNumber})
                          </div>
                        </div>
                        <div className="font-mono font-bold text-slate-900 text-xs">
                          ₹{item.total.toLocaleString('en-IN')}
                        </div>
                      </div>
                    ))}
                  </div>

                  {order.notes && (
                    <p className="text-[11px] text-slate-500 italic bg-amber-50/70 p-2 rounded-lg border border-amber-200">
                      Note: {order.notes}
                    </p>
                  )}
                </div>

                {/* Financials & Delivery Location */}
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex flex-col justify-between space-y-2">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                      Payment &amp; Delivery Status
                    </span>

                    <div className="mt-2 space-y-1 text-xs">
                      <div className="flex justify-between text-slate-600">
                        <span>Total Bill Value:</span>
                        <span className="font-mono font-bold text-slate-900">₹{order.totalAmount.toLocaleString('en-IN')}</span>
                      </div>
                      <div className="flex justify-between text-emerald-700">
                        <span>Advance Paid:</span>
                        <span className="font-mono font-bold">₹{order.advancePaid.toLocaleString('en-IN')}</span>
                      </div>
                      {order.balanceDue > 0 && (
                        <div className="flex justify-between text-amber-800 font-bold pt-1 border-t border-slate-200">
                          <span>Due on Delivery:</span>
                          <span className="font-mono">₹{order.balanceDue.toLocaleString('en-IN')}</span>
                        </div>
                      )}
                    </div>

                    <div className="mt-2.5 pt-2 border-t border-slate-200 text-[11px] text-slate-600">
                      <div className="flex items-start gap-1">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 flex-shrink-0 mt-0.5" />
                        <span className="line-clamp-2">{order.customerAddress || 'Showroom Pickup (CSM Chowk, Shrirampur)'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions for this Order */}
                  <div className="pt-2 border-t border-slate-200 flex flex-wrap items-center gap-1.5">
                    {order.status !== 'delivered' && (
                      <button
                        onClick={() => handleConvertOrder(order.id)}
                        className="flex-1 py-1.5 px-2 rounded-xl bg-[#0B2545] hover:bg-blue-900 text-amber-400 font-bold text-[11px] flex items-center justify-center gap-1 transition shadow-xs"
                        title="Generate Official Cash Memo & Complete Order"
                      >
                        <Receipt className="w-3.5 h-3.5" />
                        <span>Generate Bill</span>
                      </button>
                    )}

                    <button
                      onClick={() => handleSendWhatsAppUpdate(order)}
                      className="p-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white transition"
                      title="Send WhatsApp Order Update to Customer"
                    >
                      <Share2 className="w-3.5 h-3.5" />
                    </button>

                    {/* Status Changer */}
                    <select
                      value={order.status}
                      onChange={(e) => onUpdateStatus(order.id, e.target.value as OrderStatus)}
                      className="px-2 py-1 text-[11px] font-semibold rounded-xl border border-slate-300 bg-white"
                    >
                      <option value="pending">Pending</option>
                      <option value="confirmed">Confirmed</option>
                      <option value="ready">Ready</option>
                      <option value="delivered">Delivered</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* TAKE NEW ORDER MODAL */}
      {showTakeOrderModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="w-full max-w-2xl rounded-2xl bg-white p-5 sm:p-6 shadow-2xl text-slate-800 my-auto animate-in fade-in">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <ShoppingBag className="w-5 h-5 text-blue-800" />
                <h3 className="font-bold text-base text-slate-900">
                  Take Customer Booking / Order
                </h3>
              </div>
              <button
                onClick={() => setShowTakeOrderModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitNewOrder} className="mt-4 space-y-4 text-xs">
              {/* Customer details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Customer Full Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Ramesh S. Kadam"
                    value={custName}
                    onChange={(e) => setCustName(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-xl border border-slate-300 bg-white"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Mobile (10 Digits) *</label>
                  <input
                    type="tel"
                    required
                    placeholder="9822000000"
                    value={custPhone}
                    onChange={(e) => setCustPhone(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-xl border border-slate-300 bg-white font-mono"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="font-bold text-slate-700 block mb-1">Delivery Address / Village (Shrirampur Taluka)</label>
                  <input
                    type="text"
                    placeholder="e.g. Station Road, Babhaleshwar or Near Shivaji Chowk"
                    value={custAddress}
                    onChange={(e) => setCustAddress(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-xl border border-slate-300 bg-white"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Delivery Preference</label>
                  <select
                    value={deliveryType}
                    onChange={(e) => setDeliveryType(e.target.value as DeliveryType)}
                    className="w-full px-3 py-1.5 rounded-xl border border-slate-300 bg-white font-semibold"
                  >
                    <option value="home_delivery">Home Delivery &amp; Installation</option>
                    <option value="store_pickup">Store Pickup at Showroom</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Order Booking Channel</label>
                  <select
                    value={orderSource}
                    onChange={(e) => setOrderSource(e.target.value as OrderSource)}
                    className="w-full px-3 py-1.5 rounded-xl border border-slate-300 bg-white font-semibold"
                  >
                    <option value="walk_in">Walk-in Counter</option>
                    <option value="whatsapp">WhatsApp Order</option>
                    <option value="phone">Phone Booking</option>
                  </select>
                </div>
              </div>

              {/* Product Selection */}
              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Select Appliances for this Order *
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-40 overflow-y-auto p-2 bg-slate-50 border border-slate-200 rounded-xl">
                  {products.filter(p => p.isActive).map((p) => {
                    const isSelected = selectedItems.some((si) => si.productId === p.id);
                    return (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => handleAddItemToOrder(p.id)}
                        className={`p-2 rounded-xl text-left border transition text-xs flex flex-col justify-between ${
                          isSelected
                            ? 'bg-amber-100/70 border-amber-400 font-bold text-slate-950'
                            : 'bg-white border-slate-200 hover:border-slate-400 text-slate-700'
                        }`}
                      >
                        <span className="line-clamp-2 leading-tight">{p.name}</span>
                        <span className="font-mono text-emerald-800 font-bold mt-1">₹{p.sellingPrice.toLocaleString('en-IN')}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Selected Items Breakdown */}
              {selectedItems.length > 0 && (
                <div className="p-3 rounded-xl bg-slate-100 border border-slate-200 space-y-1.5">
                  <span className="font-bold text-slate-800 block text-xs">
                    Order Items ({selectedItems.length})
                  </span>
                  {newOrderCalculations.items.map((item) => (
                    <div key={item.productId} className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleUpdateItemQty(item.productId, item.quantity - 1)}
                          className="w-5 h-5 rounded bg-white border border-slate-300 flex items-center justify-center font-bold"
                        >
                          -
                        </button>
                        <span className="font-bold">{item.quantity}</span>
                        <button
                          type="button"
                          onClick={() => handleUpdateItemQty(item.productId, item.quantity + 1)}
                          className="w-5 h-5 rounded bg-white border border-slate-300 flex items-center justify-center font-bold"
                        >
                          +
                        </button>
                        <span className="truncate max-w-[200px]">{item.name}</span>
                      </div>
                      <span className="font-mono font-bold">₹{item.total.toLocaleString('en-IN')}</span>
                    </div>
                  ))}

                  <div className="pt-2 border-t border-slate-200 flex justify-between font-black text-sm text-[#0B2545]">
                    <span>Total Order Value:</span>
                    <span className="font-mono">₹{newOrderCalculations.total.toLocaleString('en-IN')}</span>
                  </div>
                </div>
              )}

              {/* Advance Payment & Notes */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Advance Payment Received (₹)</label>
                  <input
                    type="number"
                    min="0"
                    max={newOrderCalculations.total}
                    value={advancePaid || ''}
                    onChange={(e) => setAdvancePaid(Number(e.target.value) || 0)}
                    placeholder="0 (Or token advance)"
                    className="w-full px-3 py-1.5 rounded-xl border border-slate-300 font-mono font-bold text-emerald-800"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Advance Payment Method</label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                    className="w-full px-3 py-1.5 rounded-xl border border-slate-300 bg-white font-semibold"
                  >
                    <option value="upi">UPI / GPay / PhonePe</option>
                    <option value="cash">Cash at Counter</option>
                    <option value="bank_transfer">Bank Transfer</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Special Order / Installation Notes</label>
                <input
                  type="text"
                  placeholder="e.g. Copper piping required, customer requested delivery after 4 PM"
                  value={orderNotes}
                  onChange={(e) => setOrderNotes(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-xl border border-slate-300"
                />
              </div>

              <div className="mt-5 flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowTakeOrderModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black shadow-xs"
                >
                  Save &amp; Confirm Booking
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
