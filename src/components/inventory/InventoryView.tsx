import React, { useState, useMemo } from 'react';
import { Product, ProductCategory, UserRole } from '../../types';
import { 
  Plus, 
  Search, 
  Filter, 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  Edit3, 
  RotateCw, 
  Lock, 
  Archive, 
  Boxes, 
  Building2, 
  ShieldCheck,
  ChevronDown,
  LayoutGrid,
  List,
  X
} from 'lucide-react';

interface InventoryViewProps {
  products: Product[];
  userRole: UserRole;
  onAddProduct: (prod: Omit<Product, 'id'>) => void;
  onUpdateProduct: (prod: Product) => void;
  onAdjustStock: (productId: string, delta: number, reason: string) => void;
  onArchiveProduct: (productId: string, reason: string) => void;
}

const CATEGORIES: ProductCategory[] = [
  'Smartphones & Mobiles',
  'Smart TVs & Home Audio',
  'Refrigerators',
  'Air Conditioners',
  'Washing Machines',
  'Kitchen Appliances',
  'Small Appliances',
  'Cables & Accessories',
];

export const InventoryView: React.FC<InventoryViewProps> = ({
  products,
  userRole,
  onAddProduct,
  onUpdateProduct,
  onAdjustStock,
  onArchiveProduct,
}) => {
  const isOwnerOrManager = userRole === 'owner' || userRole === 'manager';

  // Filters & Layout Mode
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [stockStatusFilter, setStockStatusFilter] = useState<'all' | 'low' | 'out' | 'active'>('all');
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('table');

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [adjustingProduct, setAdjustingProduct] = useState<Product | null>(null);
  const [adjustQty, setAdjustQty] = useState<number>(1);
  const [adjustType, setAdjustType] = useState<'add' | 'subtract'>('add');
  const [adjustReason, setAdjustReason] = useState('');

  // Form State for Add / Edit
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    brand: '',
    category: 'Smart TVs & Home Audio' as ProductCategory,
    modelNumber: '',
    purchasePrice: 0,
    sellingPrice: 0,
    mrp: 0,
    stockQuantity: 5,
    minStockAlert: 2,
    supplier: 'Maharashtra Electronics Distributors, Pune',
    warrantyPeriod: '1 Year Brand Warranty',
    hasSerialNumber: true,
    notes: '',
  });

  // Filtered List
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const q = searchTerm.toLowerCase();
      const matchSearch =
        p.name.toLowerCase().includes(q) ||
        p.code.toLowerCase().includes(q) ||
        p.brand.toLowerCase().includes(q) ||
        p.modelNumber.toLowerCase().includes(q) ||
        p.supplier.toLowerCase().includes(q);

      const matchCategory = categoryFilter === 'all' || p.category === categoryFilter;

      let matchStatus = true;
      if (stockStatusFilter === 'low') matchStatus = p.stockQuantity <= p.minStockAlert && p.stockQuantity > 0;
      if (stockStatusFilter === 'out') matchStatus = p.stockQuantity === 0;
      if (stockStatusFilter === 'active') matchStatus = p.isActive;

      return matchSearch && matchCategory && matchStatus;
    });
  }, [products, searchTerm, categoryFilter, stockStatusFilter]);

  const handleOpenAdd = () => {
    setFormData({
      name: '',
      code: `M1-${Math.floor(1000 + Math.random() * 9000)}`,
      brand: 'Samsung',
      category: 'Smart TVs & Home Audio',
      modelNumber: '',
      purchasePrice: 15000,
      sellingPrice: 18990,
      mrp: 23990,
      stockQuantity: 4,
      minStockAlert: 2,
      supplier: 'Ahilyanagar Appliances Hub, Shrirampur',
      warrantyPeriod: '1 Year Comprehensive Warranty',
      hasSerialNumber: true,
      notes: '',
    });
    setShowAddModal(true);
  };

  const handleOpenEdit = (p: Product) => {
    setEditingProduct(p);
    setFormData({
      name: p.name,
      code: p.code,
      brand: p.brand,
      category: p.category,
      modelNumber: p.modelNumber,
      purchasePrice: p.purchasePrice,
      sellingPrice: p.sellingPrice,
      mrp: p.mrp,
      stockQuantity: p.stockQuantity,
      minStockAlert: p.minStockAlert,
      supplier: p.supplier,
      warrantyPeriod: p.warrantyPeriod,
      hasSerialNumber: p.hasSerialNumber,
      notes: p.notes || '',
    });
  };

  const handleSaveProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.sellingPrice) {
      alert('Product Name and Selling Price are required.');
      return;
    }

    if (editingProduct) {
      onUpdateProduct({
        ...editingProduct,
        ...formData,
        purchasePrice: isOwnerOrManager ? formData.purchasePrice : editingProduct.purchasePrice,
      });
      setEditingProduct(null);
    } else {
      onAddProduct({
        ...formData,
        purchasePrice: isOwnerOrManager ? formData.purchasePrice : 0,
        isActive: true,
        isDemo: false,
      });
      setShowAddModal(false);
    }
  };

  const handleConfirmStockAdjust = () => {
    if (!adjustingProduct) return;
    if (!adjustReason.trim()) {
      alert('Mandatory reason required for inventory stock adjustments to preserve audit trail.');
      return;
    }
    const delta = adjustType === 'add' ? Math.abs(adjustQty) : -Math.abs(adjustQty);
    onAdjustStock(adjustingProduct.id, delta, adjustReason.trim());
    setAdjustingProduct(null);
    setAdjustQty(1);
    setAdjustReason('');
  };

  return (
    <div className="space-y-5">
      {/* Action Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="font-extrabold text-base sm:text-lg text-slate-900">
              Electronics &amp; Appliances Inventory
            </h2>
            <span className="px-2 py-0.5 rounded text-xs font-bold bg-blue-100 text-blue-900">
              {products.length} Products
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Showroom stock levels, model numbers, warranty terms, and supplier pricing.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* View Mode Toggle */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-lg text-xs flex items-center gap-1 font-bold transition ${
                viewMode === 'table'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
              title="Table View"
            >
              <List className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Table</span>
            </button>
            <button
              onClick={() => setViewMode('cards')}
              className={`p-1.5 rounded-lg text-xs flex items-center gap-1 font-bold transition ${
                viewMode === 'cards'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
              title="Cards Grid View"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Cards</span>
            </button>
          </div>

          {isOwnerOrManager && (
            <button
              onClick={handleOpenAdd}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs shadow-sm transition active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>Add New Appliance</span>
            </button>
          )}
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by appliance name, model number, brand, code, supplier..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl bg-slate-50 border border-slate-300 focus:outline-none focus:border-amber-400"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Category Dropdown */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3 py-1.5 text-xs font-semibold rounded-xl bg-slate-50 border border-slate-300 text-slate-800 focus:outline-none focus:border-amber-400"
          >
            <option value="all">All Categories</option>
            {CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>

          {/* Stock Filter Pills */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs font-semibold">
            {[
              { id: 'all', label: 'All' },
              { id: 'low', label: 'Low Stock' },
              { id: 'out', label: 'Out of Stock' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setStockStatusFilter(tab.id as any)}
                className={`px-2.5 py-1 rounded-lg text-xs transition ${
                  stockStatusFilter === tab.id
                    ? 'bg-white text-slate-950 shadow-xs font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* CARDS GRID VIEW */}
      {viewMode === 'cards' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredProducts.map((p) => {
            const isOutOfStock = p.stockQuantity <= 0;
            const isLowStock = p.stockQuantity <= p.minStockAlert;

            return (
              <div
                key={p.id}
                className={`rounded-2xl border bg-white overflow-hidden shadow-xs hover:shadow-md transition flex flex-col justify-between group ${
                  isOutOfStock ? 'border-rose-300 opacity-75' : isLowStock ? 'border-amber-300' : 'border-slate-200'
                }`}
              >
                {/* Card Header Tags */}
                <div className="px-3.5 pt-3.5 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-black bg-slate-900 text-white uppercase tracking-wide">
                      {p.brand}
                    </span>
                    {p.isDemo && (
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-semibold bg-amber-400 text-slate-950">
                        Demo
                      </span>
                    )}
                  </div>

                  <span
                    className={`px-2 py-0.5 rounded-md text-[10px] font-black ${
                      isOutOfStock
                        ? 'bg-rose-100 text-rose-800 border border-rose-200'
                        : isLowStock
                        ? 'bg-amber-100 text-amber-900 border border-amber-200'
                        : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                    }`}
                  >
                    {isOutOfStock ? '0 in Stock' : `${p.stockQuantity} in Stock`}
                  </span>
                </div>

                {/* Card Content */}
                <div className="p-3.5 flex-1 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono mb-1">
                      <span>{p.code}</span>
                      <span className="truncate max-w-[130px]">{p.category}</span>
                    </div>
                    <h4 className="font-bold text-xs sm:text-sm text-slate-900 line-clamp-2 leading-snug group-hover:text-blue-900 transition">
                      {p.name}
                    </h4>
                    <p className="text-[11px] font-mono text-slate-500 mt-1">
                      Model: <strong>{p.modelNumber}</strong>
                    </p>
                    <p className="text-[10px] text-emerald-800 mt-0.5 truncate">
                      🛡️ {p.warrantyPeriod}
                    </p>
                  </div>

                  <div className="mt-3 pt-2.5 border-t border-slate-100">
                    <div className="flex items-baseline justify-between">
                      <div>
                        <div className="text-base font-black text-[#0B2545] font-sans">
                          ₹{p.sellingPrice.toLocaleString('en-IN')}
                        </div>
                        {p.mrp > p.sellingPrice && (
                          <span className="text-[10px] text-slate-400 line-through">
                            MRP ₹{p.mrp.toLocaleString('en-IN')}
                          </span>
                        )}
                      </div>

                      {isOwnerOrManager && (
                        <div className="text-right">
                          <span className="text-[10px] text-slate-400 block">Cost</span>
                          <span className="text-[11px] font-mono font-semibold text-slate-600">
                            ₹{p.purchasePrice.toLocaleString('en-IN')}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Quick Card Action Buttons */}
                    <div className="mt-3 flex items-center gap-1.5">
                      <button
                        onClick={() => setAdjustingProduct(p)}
                        className="flex-1 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-900 font-bold text-xs transition text-center"
                      >
                        Adjust Stock ±
                      </button>

                      {isOwnerOrManager && (
                        <button
                          onClick={() => handleOpenEdit(p)}
                          className="p-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 transition"
                          title="Edit Appliance Details"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* INVENTORY TABLE VIEW */}
      {viewMode === 'table' && (
        <div className="rounded-2xl bg-white border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/80 text-slate-600 font-bold">
                  <th className="py-3 px-4">Code / Item Name</th>
                  <th className="py-3 px-3">Category</th>
                  <th className="py-3 px-3">Brand &amp; Model</th>
                  {isOwnerOrManager && (
                    <th className="py-3 px-3 text-right">Cost (₹)</th>
                  )}
                  <th className="py-3 px-3 text-right">Selling (₹)</th>
                  <th className="py-3 px-3 text-right">MRP (₹)</th>
                  <th className="py-3 px-3 text-center">Stock</th>
                  <th className="py-3 px-3">Warranty</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredProducts.map((p) => {
                  const isOutOfStock = p.stockQuantity <= 0;
                  const isLowStock = p.stockQuantity <= p.minStockAlert;

                  return (
                    <tr
                      key={p.id}
                      className={`hover:bg-slate-50/80 transition ${
                        !p.isActive ? 'opacity-50 bg-slate-50' : ''
                      }`}
                    >
                      <td className="py-3 px-4">
                        <div className="font-mono text-[10px] text-slate-500 font-semibold">
                          {p.code}
                        </div>
                        <div className="font-bold text-slate-900 text-xs sm:text-sm">
                          {p.name}
                        </div>
                        {p.isDemo && (
                          <span className="inline-block mt-0.5 px-1 py-0.2 rounded text-[9px] font-medium bg-slate-100 text-slate-500 border border-slate-200">
                            Demo Data
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-3">
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-700">
                          {p.category}
                        </span>
                      </td>

                      <td className="py-3 px-3">
                        <div className="font-bold text-slate-800">{p.brand}</div>
                        <div className="text-[10px] text-slate-500 font-mono">
                          {p.modelNumber}
                        </div>
                      </td>

                      {isOwnerOrManager && (
                        <td className="py-3 px-3 text-right font-mono font-medium text-slate-600">
                          ₹{p.purchasePrice.toLocaleString('en-IN')}
                        </td>
                      )}

                      <td className="py-3 px-3 text-right font-mono font-bold text-slate-900 text-xs sm:text-sm">
                        ₹{p.sellingPrice.toLocaleString('en-IN')}
                      </td>

                      <td className="py-3 px-3 text-right font-mono text-slate-400 line-through">
                        ₹{p.mrp.toLocaleString('en-IN')}
                      </td>

                      <td className="py-3 px-3 text-center">
                        <span
                          className={`inline-block px-2.5 py-1 rounded-lg text-xs font-black ${
                            isOutOfStock
                              ? 'bg-rose-100 text-rose-800 border border-rose-300'
                              : isLowStock
                              ? 'bg-amber-100 text-amber-900 border border-amber-300'
                              : 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                          }`}
                        >
                          {p.stockQuantity}
                        </span>
                        {isLowStock && !isOutOfStock && (
                          <div className="text-[9px] text-amber-700 font-bold mt-0.5">
                            Min Alert: {p.minStockAlert}
                          </div>
                        )}
                      </td>

                      <td className="py-3 px-3 text-[11px] text-slate-600 max-w-[140px] truncate">
                        {p.warrantyPeriod}
                      </td>

                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setAdjustingProduct(p)}
                            className="px-2 py-1 rounded-lg bg-blue-50 text-blue-800 hover:bg-blue-100 font-semibold text-[11px] transition"
                            title="Adjust showroom stock with audit log"
                          >
                            Stock ±
                          </button>

                          {isOwnerOrManager && (
                            <button
                              onClick={() => handleOpenEdit(p)}
                              className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-900 transition"
                              title="Edit details"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Adjust Stock Modal */}
      {adjustingProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-2xl text-slate-800 animate-in fade-in">
            <div className="pb-2 border-b border-slate-100">
              <h3 className="font-bold text-sm text-slate-900">
                Adjust Inventory Stock
              </h3>
              <p className="text-xs text-slate-500 truncate max-w-xs">{adjustingProduct.name}</p>
            </div>

            <div className="mt-3 text-xs text-slate-600">
              Current Showroom Stock: <strong className="text-slate-900">{adjustingProduct.stockQuantity} units</strong>
            </div>

            <div className="mt-3 grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setAdjustType('add')}
                className={`py-2 rounded-xl text-xs font-bold transition ${
                  adjustType === 'add'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-700'
                }`}
              >
                + Add Stock (Inward)
              </button>
              <button
                type="button"
                onClick={() => setAdjustType('subtract')}
                className={`py-2 rounded-xl text-xs font-bold transition ${
                  adjustType === 'subtract'
                    ? 'bg-rose-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-700'
                }`}
              >
                - Reduce (Damage/Recount)
              </button>
            </div>

            <div className="mt-3">
              <label className="text-[11px] font-bold text-slate-700 block mb-1">
                Quantity to {adjustType === 'add' ? 'Add' : 'Deduct'}
              </label>
              <input
                type="number"
                min="1"
                value={adjustQty}
                onChange={(e) => setAdjustQty(Math.max(1, Number(e.target.value) || 1))}
                className="w-full px-3 py-1.5 text-xs font-mono font-bold rounded-xl border border-slate-300"
              />
            </div>

            <div className="mt-3">
              <label className="text-[11px] font-bold text-slate-700 block mb-1">
                Mandatory Reason (Audit Log) *
              </label>
              <input
                type="text"
                placeholder="e.g., Inward delivery from Pune distributor, Physical count audit..."
                value={adjustReason}
                onChange={(e) => setAdjustReason(e.target.value)}
                className="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-300 focus:outline-none focus:border-amber-400"
              />
            </div>

            <div className="mt-5 flex items-center justify-end gap-2">
              <button
                onClick={() => setAdjustingProduct(null)}
                className="px-3 py-1.5 text-xs font-semibold rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmStockAdjust}
                className="px-4 py-1.5 text-xs font-bold rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 shadow-xs"
              >
                Confirm &amp; Log Audit
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add / Edit Product Modal */}
      {(showAddModal || editingProduct) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="w-full max-w-xl rounded-2xl bg-white p-5 shadow-2xl text-slate-800 my-auto animate-in fade-in">
            <h3 className="font-bold text-base text-slate-900 pb-3 border-b border-slate-100 flex items-center justify-between">
              <span>{editingProduct ? 'Edit Appliance Details' : 'Add New Electronics / Appliance'}</span>
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setEditingProduct(null);
                }}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </h3>

            <form onSubmit={handleSaveProduct} className="mt-4 space-y-3.5 text-xs">

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Product Code</label>
                  <input
                    type="text"
                    required
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-300 bg-slate-50 font-mono"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Brand</label>
                  <input
                    type="text"
                    required
                    placeholder="Samsung, LG, Daikin, Whirlpool..."
                    value={formData.brand}
                    onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-300"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Appliance Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. LG 43-inch 4K UHD Smart LED TV"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-300"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Category</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value as ProductCategory })}
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-300 bg-white"
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Model Number</label>
                  <input
                    type="text"
                    placeholder="e.g. 43UR7500PSC"
                    value={formData.modelNumber}
                    onChange={(e) => setFormData({ ...formData, modelNumber: e.target.value })}
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-300 font-mono"
                  />
                </div>
              </div>

              {/* Pricing Grid */}
              <div className="grid grid-cols-3 gap-3 p-3 rounded-xl bg-slate-50 border border-slate-200">
                {isOwnerOrManager && (
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Purchase Cost (₹)</label>
                    <input
                      type="number"
                      required
                      value={formData.purchasePrice || ''}
                      onChange={(e) => setFormData({ ...formData, purchasePrice: Number(e.target.value) || 0 })}
                      className="w-full px-2 py-1 rounded border border-slate-300 font-mono font-bold"
                    />
                  </div>
                )}
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Selling Price (₹) *</label>
                  <input
                    type="number"
                    required
                    value={formData.sellingPrice || ''}
                    onChange={(e) => setFormData({ ...formData, sellingPrice: Number(e.target.value) || 0 })}
                    className="w-full px-2 py-1 rounded border border-slate-300 font-mono font-bold text-emerald-800"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">MRP (₹)</label>
                  <input
                    type="number"
                    value={formData.mrp || ''}
                    onChange={(e) => setFormData({ ...formData, mrp: Number(e.target.value) || 0 })}
                    className="w-full px-2 py-1 rounded border border-slate-300 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Initial Stock Qty</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.stockQuantity}
                    onChange={(e) => setFormData({ ...formData, stockQuantity: Number(e.target.value) || 0 })}
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-300 font-mono"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Low Stock Alert Level</label>
                  <input
                    type="number"
                    min="1"
                    value={formData.minStockAlert}
                    onChange={(e) => setFormData({ ...formData, minStockAlert: Number(e.target.value) || 1 })}
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-300 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Supplier / Distributor</label>
                <input
                  type="text"
                  placeholder="e.g. Maharashtra Electronics Distributors Pune"
                  value={formData.supplier}
                  onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-300"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Warranty Period</label>
                <input
                  type="text"
                  placeholder="e.g. 1 Year Comprehensive + 10 Years Compressor"
                  value={formData.warrantyPeriod}
                  onChange={(e) => setFormData({ ...formData, warrantyPeriod: e.target.value })}
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-300"
                />
              </div>

              <div className="mt-5 flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false);
                    setEditingProduct(null);
                  }}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black shadow-xs"
                >
                  {editingProduct ? 'Save Changes' : 'Add Appliance'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
