import React, { useState } from 'react';
import { Invoice, StoreSettings, UserRole } from '../../types';
import { 
  Printer, 
  Share2, 
  Download, 
  X, 
  CheckCircle2, 
  AlertTriangle, 
  ShieldCheck, 
  QrCode,
  Phone,
  MapPin,
  Clock,
  RotateCcw
} from 'lucide-react';

interface InvoiceModalProps {
  invoice: Invoice;
  settings: StoreSettings;
  userRole: UserRole;
  onClose: () => void;
  onVoidInvoice?: (invoiceId: string, reason: string) => void;
}

export const InvoiceModal: React.FC<InvoiceModalProps> = ({
  invoice,
  settings,
  userRole,
  onClose,
  onVoidInvoice,
}) => {
  const [showVoidDialog, setShowVoidDialog] = useState(false);
  const [voidReason, setVoidReason] = useState('');
  const canVoid = (userRole === 'owner' || userRole === 'manager') && !invoice.isVoided;

  const handlePrint = () => {
    window.print();
  };

  const handleWhatsAppShare = () => {
    const cleanPhone = invoice.customerPhone.replace(/\D/g, '');
    const phoneWithCode = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;
    
    const itemsList = invoice.items
      .map(
        (i, idx) =>
          `${idx + 1}. *${i.name}* (Qty: ${i.quantity}) - ₹${i.total.toLocaleString('en-IN')}${
            i.serialNumber ? `\n   S/N: ${i.serialNumber}` : ''
          }\n   Warranty: ${i.warrantyPeriod}`
      )
      .join('\n\n');

    const message = `*M1 ENTERPRISES — RETAIL BILL*\n` +
      `📍 *Location:* Chatrapati Shivaji Maharaj Chowk, Shrirampur, Ahilyanagar\n` +
      `📞 *Contact:* Owner: ${settings.phone}${settings.altPhone ? ` | Affan: ${settings.altPhone}` : ''}\n` +
      `-----------------------------------------\n` +
      `📄 *Bill No:* ${invoice.invoiceNumber}\n` +
      `📅 *Date:* ${new Date(invoice.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}\n` +
      `👤 *Customer:* ${invoice.customerName} (${invoice.customerPhone})\n` +
      `-----------------------------------------\n` +
      `*PURCHASED APPLIANCES:*\n${itemsList}\n` +
      `-----------------------------------------\n` +
      `*Subtotal:* ₹${invoice.subtotal.toLocaleString('en-IN')}\n` +
      (invoice.overallDiscount > 0 ? `*Discount:* -₹${invoice.overallDiscount.toLocaleString('en-IN')}\n` : '') +
      `*TOTAL AMOUNT:* ₹${invoice.totalAmount.toLocaleString('en-IN')}\n` +
      `*Amount Paid:* ₹${invoice.amountPaid.toLocaleString('en-IN')} (${invoice.paymentMethod.toUpperCase()})\n` +
      (invoice.balanceDue > 0 ? `⚠️ *Balance Due (Khata):* ₹${invoice.balanceDue.toLocaleString('en-IN')}\n` : `✅ *Payment Status:* FULLY PAID\n`) +
      `-----------------------------------------\n` +
      `*Type:* Non-GST Retail Sale (Registration Pending)\n` +
      `🙏 *Thank you for shopping at M1 ENTERPRISES!*`;

    const encoded = encodeURIComponent(message);
    window.open(`https://wa.me/${phoneWithCode}?text=${encoded}`, '_blank');
  };

  const handleDownloadHtml = () => {
    const element = document.getElementById('printable-invoice-content');
    if (!element) return;
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Invoice - ${invoice.invoiceNumber}</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; padding: 20px; color: #1e293b; }
          .container { max-width: 800px; margin: 0 auto; border: 1px solid #cbd5e1; padding: 30px; border-radius: 8px; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th, td { border: 1px solid #cbd5e1; padding: 10px; text-align: left; }
          th { background: #f8fafc; font-weight: bold; }
          .text-right { text-align: right; }
          .header { text-align: center; border-bottom: 2px solid #0f2b48; padding-bottom: 15px; }
          .badge { display: inline-block; padding: 4px 8px; background: #fef3c7; color: #92400e; font-size: 12px; font-weight: bold; border-radius: 4px; }
        </style>
      </head>
      <body>
        <div class="container">
          ${element.innerHTML}
        </div>
      </body>
      </html>
    `;
    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Invoice_${invoice.invoiceNumber.replace(/\//g, '_')}.html`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleConfirmVoid = () => {
    if (!voidReason.trim()) {
      alert('Please specify a mandatory reason for voiding this bill.');
      return;
    }
    onVoidInvoice?.(invoice.id, voidReason.trim());
    setShowVoidDialog(false);
  };

  // UPI payment payload for quick QR code
  const upiQrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(
    `upi://pay?pa=${settings.upiId}&pn=${encodeURIComponent(settings.storeName)}&am=${invoice.balanceDue > 0 ? invoice.balanceDue : invoice.totalAmount}&cu=INR`
  )}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-2 sm:p-4 overflow-y-auto">
      <div className="relative w-full max-w-3xl rounded-2xl bg-white shadow-2xl text-slate-800 my-auto overflow-hidden animate-in fade-in zoom-in-95">
        {/* Top Action Bar (Hidden on print) */}
        <div className="print:hidden flex items-center justify-between px-4 sm:px-6 py-3 bg-[#0B2545] text-white">
          <div className="flex items-center gap-2">
            <span className="font-bold text-sm tracking-wide">
              Retail Bill: {invoice.invoiceNumber}
            </span>
            {invoice.isVoided ? (
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500 text-white uppercase">
                VOIDED / CANCELLED
              </span>
            ) : invoice.balanceDue > 0 ? (
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-400 text-slate-950 uppercase">
                Partial (Khata Due)
              </span>
            ) : (
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500 text-white uppercase">
                Paid in Full
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-bold transition shadow-xs"
              title="Print Bill or Save as PDF"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print / PDF</span>
            </button>

            <button
              onClick={handleWhatsAppShare}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition shadow-xs"
              title="Send to Customer WhatsApp"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>WhatsApp</span>
            </button>

            <button
              onClick={handleDownloadHtml}
              className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition"
              title="Download HTML Receipt"
            >
              <Download className="w-3.5 h-3.5" />
            </button>

            {canVoid && (
              <button
                onClick={() => setShowVoidDialog(true)}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-rose-600/80 hover:bg-rose-600 text-white text-xs font-semibold transition"
                title="Cancel Bill (Restores Stock & Audits)"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Void Bill</span>
              </button>
            )}

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition ml-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Void confirmation dialog */}
        {showVoidDialog && (
          <div className="p-4 bg-rose-50 border-b border-rose-200 text-rose-900 print:hidden animate-in fade-in">
            <div className="flex items-start gap-2">
              <AlertTriangle className="w-5 h-5 text-rose-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h4 className="font-bold text-sm">Void Transaction: {invoice.invoiceNumber}</h4>
                <p className="text-xs text-rose-700 mt-0.5">
                  This action restores product quantities to inventory, adjusts customer balance, and creates an immutable security audit log. Bills are never silently deleted.
                </p>
                <input
                  type="text"
                  placeholder="Enter mandatory reason for cancellation (e.g., Wrong model selected, Customer returned, Cashier error)..."
                  value={voidReason}
                  onChange={(e) => setVoidReason(e.target.value)}
                  className="mt-2 w-full px-3 py-1.5 text-xs rounded-lg border border-rose-300 bg-white focus:outline-none focus:ring-2 focus:ring-rose-500"
                />
                <div className="mt-2 flex items-center gap-2">
                  <button
                    onClick={handleConfirmVoid}
                    className="px-3 py-1 text-xs font-bold rounded-lg bg-rose-600 hover:bg-rose-700 text-white transition"
                  >
                    Confirm &amp; Log Void
                  </button>
                  <button
                    onClick={() => setShowVoidDialog(false)}
                    className="px-3 py-1 text-xs font-medium rounded-lg bg-slate-200 text-slate-700 hover:bg-slate-300 transition"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Printable Invoice Sheet */}
        <div id="printable-invoice-content" className="p-6 sm:p-8 max-h-[80vh] overflow-y-auto print:max-h-none print:overflow-visible print:p-0">
          {/* Void watermark banner if voided */}
          {invoice.isVoided && (
            <div className="mb-4 p-3 rounded-xl bg-rose-100 border-2 border-rose-400 text-rose-900 text-center">
              <div className="font-black text-sm uppercase tracking-widest text-rose-700">*** VOIDED TRANSACTION ***</div>
              <p className="text-xs font-medium mt-0.5">
                Voided By: {invoice.voidedBy} on {new Date(invoice.voidedAt || '').toLocaleString('en-IN')}
              </p>
              <p className="text-xs italic mt-0.5">Reason: {invoice.voidReason}</p>
            </div>
          )}

          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center pb-6 border-b-2 border-slate-900 gap-4">
            <div>
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-xl bg-[#0B2545] text-amber-400 flex items-center justify-center font-black text-xl border-2 border-amber-400">
                  M1
                </div>
                <div>
                  <h1 className="text-2xl font-black tracking-tight text-[#0B2545] font-sans">
                    {settings.storeName}
                  </h1>
                  <p className="text-xs font-bold text-amber-600 uppercase tracking-widest">
                    {settings.tagline}
                  </p>
                </div>
              </div>
              <div className="mt-2 text-xs text-slate-600 space-y-0.5">
                <p className="flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                  <span>{settings.address}, {settings.city}, {settings.district}, MH - {settings.pincode}</span>
                </p>
                <p className="flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                  <span>Owner: {settings.phone} {settings.altPhone ? `| Affan: ${settings.altPhone}` : ''}</span>
                </p>
              </div>
            </div>

            {/* Invoice Stamp / Non-GST Disclosure */}
            <div className="text-left sm:text-right bg-slate-50 sm:bg-transparent p-3 sm:p-0 rounded-xl border sm:border-0 border-slate-200 w-full sm:w-auto">
              <div className="inline-block px-2.5 py-1 rounded bg-amber-100 text-amber-900 font-extrabold text-xs uppercase tracking-wide border border-amber-300">
                Non-GST Retail Cash Memo
              </div>
              <p className="text-xs font-mono font-bold text-slate-900 mt-2">
                Bill No: <span className="text-[#0B2545] text-sm">{invoice.invoiceNumber}</span>
              </p>
              <p className="text-xs text-slate-600">
                Date: {new Date(invoice.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
              </p>
              <p className="text-xs text-slate-500">
                Time: {new Date(invoice.date).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
              </p>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Billed By: <span className="font-medium text-slate-700">{invoice.createdByName}</span>
              </p>
            </div>
          </div>

          {/* Customer & Billing Details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-4 border-b border-slate-200 text-xs">
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Billed To (Customer Details)
              </span>
              <h3 className="text-sm font-bold text-slate-900 mt-1">{invoice.customerName}</h3>
              <p className="text-slate-700 mt-0.5 font-medium">Phone: +91 {invoice.customerPhone}</p>
              {invoice.customerAddress && (
                <p className="text-slate-600 mt-0.5">{invoice.customerAddress}</p>
              )}
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex flex-col justify-between">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Payment Mode &amp; Terms
                </span>
                <div className="flex items-center gap-2 mt-1">
                  <span className="px-2 py-0.5 rounded text-xs font-bold uppercase bg-blue-100 text-blue-900 border border-blue-200">
                    {invoice.paymentMethod === 'split' ? 'Cash + UPI Split' : invoice.paymentMethod.replace('_', ' ')}
                  </span>
                  {invoice.status === 'paid' ? (
                    <span className="text-emerald-700 font-bold flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Fully Cleared
                    </span>
                  ) : (
                    <span className="text-amber-700 font-bold">
                      ₹{invoice.balanceDue.toLocaleString('en-IN')} Due
                    </span>
                  )}
                </div>
              </div>
              <p className="text-[11px] text-slate-500 mt-2">
                GST ARN: {settings.gstApplicationArn} (Verification In Progress)
              </p>
            </div>
          </div>

          {/* Line Items Table */}
          <div className="py-4">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b-2 border-slate-800 bg-slate-100 text-slate-700">
                  <th className="py-2.5 px-2 font-bold w-10">#</th>
                  <th className="py-2.5 px-2 font-bold">Item Description &amp; Appliance Details</th>
                  <th className="py-2.5 px-2 font-bold text-center w-16">Qty</th>
                  <th className="py-2.5 px-2 font-bold text-right w-24">Rate (₹)</th>
                  <th className="py-2.5 px-2 font-bold text-right w-20">Discount</th>
                  <th className="py-2.5 px-2 font-bold text-right w-28">Amount (₹)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-slate-800">
                {invoice.items.map((item, index) => (
                  <tr key={item.id} className="align-top">
                    <td className="py-3 px-2 text-slate-400 font-mono">{index + 1}</td>
                    <td className="py-3 px-2">
                      <div className="min-w-0">
                        <div className="font-bold text-slate-900 text-xs sm:text-sm">
                          {item.name}
                        </div>
                        <div className="text-[11px] text-slate-600 flex flex-wrap gap-x-3 gap-y-0.5 mt-0.5">
                          <span>Brand: <strong className="text-slate-800">{item.brand}</strong></span>
                          {item.modelNumber && <span>Model: <strong className="text-slate-800">{item.modelNumber}</strong></span>}
                        </div>
                        {item.serialNumber && (
                          <div className="text-[11px] font-mono text-blue-900 bg-blue-50 px-2 py-0.5 rounded mt-1 inline-block border border-blue-200">
                            Serial / IMEI: <strong>{item.serialNumber}</strong>
                          </div>
                        )}
                        <div className="text-[10px] text-emerald-800 mt-0.5 font-medium">
                          Warranty: {item.warrantyPeriod}
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-2 text-center font-bold text-sm">{item.quantity}</td>
                    <td className="py-3 px-2 text-right font-mono text-slate-700">
                      ₹{item.unitPrice.toLocaleString('en-IN')}
                    </td>
                    <td className="py-3 px-2 text-right font-mono text-slate-500">
                      {item.discount > 0 ? `₹${item.discount.toLocaleString('en-IN')}` : '-'}
                    </td>
                    <td className="py-3 px-2 text-right font-mono font-bold text-slate-900 text-sm">
                      ₹{item.total.toLocaleString('en-IN')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Totals & Calculations */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-4 border-t-2 border-slate-300">
            {/* Left: UPI QR Code for quick customer scan */}
            <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-200">
              <div className="w-20 h-20 bg-white p-1 rounded-lg border border-slate-300 flex-shrink-0">
                <img
                  src={upiQrUrl}
                  alt="UPI QR Code"
                  className="w-full h-full object-contain"
                />
              </div>
              <div className="text-[11px] text-slate-600">
                <div className="flex items-center gap-1 font-bold text-slate-900">
                  <QrCode className="w-3.5 h-3.5 text-blue-800" />
                  <span>Scan to Pay via UPI</span>
                </div>
                <p className="mt-0.5 font-mono text-[10px] text-slate-700">{settings.upiId}</p>
                <p className="text-[10px] text-slate-500 mt-1">
                  Works on PhonePe, GPay, Paytm, BHIM.
                </p>
              </div>
            </div>

            {/* Right: Summary Figures */}
            <div className="space-y-1.5 text-xs">
              <div className="flex justify-between py-1 text-slate-600">
                <span>Gross Items Subtotal:</span>
                <span className="font-mono font-medium">₹{invoice.subtotal.toLocaleString('en-IN')}</span>
              </div>

              {invoice.overallDiscount > 0 && (
                <div className="flex justify-between py-1 text-emerald-700">
                  <span>Special Bill Discount:</span>
                  <span className="font-mono font-bold">-₹{invoice.overallDiscount.toLocaleString('en-IN')}</span>
                </div>
              )}

              <div className="flex justify-between py-1 text-slate-600">
                <span>GST Tax (Non-GST Mode):</span>
                <span className="font-mono text-slate-500">₹0.00 (Exempt/Retail)</span>
              </div>

              <div className="flex justify-between py-2 border-t-2 border-b-2 border-slate-900 text-base font-black text-[#0B2545]">
                <span>Total Net Payable:</span>
                <span className="font-mono">₹{invoice.totalAmount.toLocaleString('en-IN')}</span>
              </div>

              <div className="flex justify-between py-1 text-slate-700 font-semibold">
                <span>Amount Paid Now:</span>
                <span className="font-mono text-emerald-700">₹{invoice.amountPaid.toLocaleString('en-IN')}</span>
              </div>

              {invoice.balanceDue > 0 && (
                <div className="flex justify-between py-1 text-amber-800 font-bold bg-amber-50 p-1.5 rounded">
                  <span>Balance Due (Customer Khata):</span>
                  <span className="font-mono">₹{invoice.balanceDue.toLocaleString('en-IN')}</span>
                </div>
              )}
            </div>
          </div>

          {/* Terms & Declarations */}
          <div className="pt-4 mt-2 border-t border-slate-200 text-[10px] text-slate-500 space-y-1">
            <div className="font-bold text-slate-700 uppercase">Terms &amp; Conditions:</div>
            <ul className="list-disc pl-4 space-y-0.5 leading-tight">
              {settings.invoiceTerms.map((term, i) => (
                <li key={i}>{term}</li>
              ))}
            </ul>
          </div>

          {/* Authorized Signatures */}
          <div className="mt-8 pt-6 border-t border-slate-200 flex justify-between items-end text-xs text-slate-600">
            <div className="text-center">
              <div className="h-10"></div>
              <p className="border-t border-slate-400 pt-1 px-4 font-medium">Customer's Signature</p>
            </div>
            <div className="text-center">
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-8">
                For M1 ENTERPRISES
              </p>
              <p className="border-t border-slate-400 pt-1 px-4 font-bold text-slate-800">
                Authorized Signatory
              </p>
            </div>
          </div>
        </div>

        {/* Bottom Print Note */}
        <div className="print:hidden p-3 bg-slate-100 border-t border-slate-200 text-center text-xs text-slate-500">
          Tip: You can print directly to thermal receipt or A4, or click <strong>WhatsApp</strong> to send instantly to the customer's mobile.
        </div>
      </div>
    </div>
  );
};
