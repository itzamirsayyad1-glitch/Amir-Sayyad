export type UserRole = 'owner' | 'manager' | 'staff';

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  pin: string;
  isActive: boolean;
  avatar?: string;
  lastLogin?: string;
  createdAt?: string;
  createdBy?: string;
  isDemo?: boolean;
}

export type ProductCategory = 
  | 'Smartphones & Mobiles'
  | 'Smart TVs & Home Audio'
  | 'Refrigerators'
  | 'Air Conditioners'
  | 'Washing Machines'
  | 'Kitchen Appliances'
  | 'Small Appliances'
  | 'Cables & Accessories';

export interface Product {
  id: string;
  code: string; // e.g. M1-TV-001
  name: string;
  brand: string;
  category: ProductCategory;
  modelNumber: string;
  purchasePrice: number; // Hidden from Staff
  sellingPrice: number;
  mrp: number;
  stockQuantity: number;
  minStockAlert: number;
  supplier: string;
  warrantyPeriod: string; // e.g., "1 Year Comprehensive + 10 Years Compressor"
  hasSerialNumber: boolean;
  isActive: boolean;
  isDemo?: boolean;
  notes?: string;
}

export type OrderStatus = 'pending' | 'confirmed' | 'ready' | 'delivered' | 'cancelled';
export type DeliveryType = 'home_delivery' | 'store_pickup';
export type OrderSource = 'whatsapp' | 'walk_in' | 'phone';

export interface OrderItem {
  productId: string;
  name: string;
  brand: string;
  modelNumber: string;
  quantity: number;
  unitPrice: number;
  total: number;
  warrantyPeriod: string;
}

export interface CustomerOrder {
  id: string;
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  customerAddress?: string;
  items: OrderItem[];
  totalAmount: number;
  advancePaid: number;
  balanceDue: number;
  paymentMethod: PaymentMethod;
  status: OrderStatus;
  deliveryType: DeliveryType;
  orderSource: OrderSource;
  orderDate: string;
  deliveryDate?: string;
  notes?: string;
  invoiceId?: string;
  createdBy: string;
  createdByName: string;
  isDemo?: boolean;
}

export interface InvoiceItem {
  id: string;
  productId: string;
  name: string;
  brand: string;
  modelNumber: string;
  serialNumber?: string;
  quantity: number;
  unitPrice: number;
  mrp: number;
  purchasePrice?: number; // kept for profit reporting in backend
  discount: number; // in ₹
  total: number;
  warrantyPeriod: string;
}

export type PaymentMethod = 'cash' | 'upi' | 'bank_transfer' | 'credit' | 'split';
export type InvoiceStatus = 'paid' | 'partial' | 'pending' | 'voided';
export type InvoiceType = 'non_gst_retail' | 'gst_tax_invoice';

export interface PaymentRecord {
  id: string;
  invoiceId?: string;
  customerId: string;
  customerName: string;
  amount: number;
  method: PaymentMethod;
  referenceNumber?: string;
  timestamp: string;
  notes?: string;
  receivedBy: string;
  receivedByRole: UserRole;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  date: string; // ISO string
  customerId: string;
  customerName: string;
  customerPhone: string;
  customerAddress?: string;
  items: InvoiceItem[];
  subtotal: number;
  overallDiscount: number; // ₹
  taxAmount: number; // 0 for non-GST
  totalAmount: number;
  amountPaid: number;
  balanceDue: number;
  paymentMethod: PaymentMethod;
  paymentDetails?: {
    cashAmount?: number;
    upiAmount?: number;
    bankAmount?: number;
    upiReference?: string;
  };
  status: InvoiceStatus;
  invoiceType: InvoiceType;
  isGstVerified: boolean;
  notes?: string;
  createdBy: string;
  createdByName: string;
  createdByRole: UserRole;
  isVoided?: boolean;
  voidReason?: string;
  voidedAt?: string;
  voidedBy?: string;
  isDemo?: boolean;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  email?: string;
  address: string;
  outstandingBalance: number;
  totalPurchases: number;
  creditLimit: number;
  firstVisitDate: string;
  lastPurchaseDate?: string;
  notes?: string;
  isDemo?: boolean;
}

export interface Expense {
  id: string;
  date: string;
  category: 'Rent' | 'Electricity (MSEB)' | 'Staff Salary' | 'Transport & Freight' | 'Tea & Refreshments' | 'Marketing' | 'Maintenance' | 'Miscellaneous';
  amount: number;
  paymentMethod: 'cash' | 'upi' | 'bank_transfer';
  paidTo: string;
  notes?: string;
  recordedBy: string;
  receiptNumber?: string;
  isDemo?: boolean;
}

export interface SupplierPurchase {
  id: string;
  purchaseNumber: string;
  supplierName: string;
  supplierContact: string;
  invoiceNumber: string;
  date: string;
  itemsSummary: string;
  totalAmount: number;
  paidAmount: number;
  paymentStatus: 'paid' | 'partial' | 'unpaid';
  paymentMethod: 'cash' | 'bank_transfer' | 'upi';
  recordedBy: string;
  isDemo?: boolean;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  action: 
    | 'CREATE_INVOICE' 
    | 'VOID_INVOICE' 
    | 'RECORD_PAYMENT' 
    | 'ADD_PRODUCT' 
    | 'UPDATE_PRODUCT' 
    | 'ADJUST_STOCK' 
    | 'DELETE_PRODUCT_ATTEMPT' 
    | 'RECORD_EXPENSE' 
    | 'CREATE_PURCHASE' 
    | 'UPDATE_STORE_SETTINGS' 
    | 'BACKUP_DATABASE' 
    | 'RESTORE_DATABASE'
    | 'ADD_USER'
    | 'UPDATE_USER'
    | 'USER_LOGIN'
    | 'USER_LOGOUT';
  userId: string;
  userName: string;
  userRole: UserRole;
  targetId: string;
  targetType: 'invoice' | 'product' | 'customer' | 'payment' | 'expense' | 'purchase' | 'settings' | 'system' | 'user';
  details: string;
  metadata?: Record<string, any>;
}

export interface StoreSettings {
  storeName: string;
  tagline: string;
  address: string;
  city: string;
  district: string;
  state: string;
  pincode: string;
  phone: string;
  altPhone: string;
  email: string;
  upiId: string;
  gstNumber: string; // Application ARN or provisional
  isGstRegistered: boolean; // Locked to false until verified!
  gstRegistrationStatus: 'pending_application' | 'under_scrutiny' | 'verified_active';
  gstApplicationArn: string;
  bankDetails: {
    accountName: string;
    accountNumber: string;
    bankName: string;
    branch: string;
    ifscCode: string;
  };
  invoiceTerms: string[];
  invoicePrefix: string;
  enableStockAudit: boolean;
}

export interface SupabaseConfig {
  url: string;
  anonKey: string;
  isConnected: boolean;
  lastSyncedAt?: string;
}
