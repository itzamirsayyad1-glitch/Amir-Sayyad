import { 
  Product, 
  Invoice, 
  InvoiceItem,
  Customer, 
  Expense, 
  SupplierPurchase, 
  StoreSettings, 
  User, 
  AuditLog, 
  PaymentRecord,
  CustomerOrder,
  UserRole 
} from '../types';
import {
  INITIAL_PRODUCTS,
  INITIAL_CUSTOMERS,
  INITIAL_INVOICES,
  INITIAL_EXPENSES,
  INITIAL_PURCHASES,
  INITIAL_STORE_SETTINGS,
  INITIAL_USERS,
  INITIAL_AUDIT_LOGS,
  INITIAL_ORDERS,
} from '../data/sampleData';

const KEYS = {
  PRODUCTS: 'm1_products_v1',
  CUSTOMERS: 'm1_customers_v1',
  INVOICES: 'm1_invoices_v1',
  EXPENSES: 'm1_expenses_v1',
  PURCHASES: 'm1_purchases_v1',
  SETTINGS: 'm1_settings_v1',
  USERS: 'm1_users_v1',
  AUDIT_LOGS: 'm1_audit_logs_v1',
  PAYMENTS: 'm1_payments_v1',
  ORDERS: 'm1_orders_v1',
  ACTIVE_USER: 'm1_active_user_v1',
  AUTH_SESSION: 'm1_auth_session_v1',
};

// Generic read with fallback
function loadFromStorage<T>(key: string, defaultValue: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return defaultValue;
    return JSON.parse(raw);
  } catch (err) {
    console.error(`Error loading key ${key}:`, err);
    return defaultValue;
  }
}

// Generic write with sync event dispatch
function saveToStorage<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    // Trigger custom event for intra-tab and broadcast channel
    window.dispatchEvent(new CustomEvent('m1_storage_update', { detail: { key } }));
  } catch (err) {
    console.error(`Error saving key ${key}:`, err);
  }
}

function normalizePhoneDigits(value: string): string {
  const digits = value.replace(/\D/g, '');
  return digits.length > 10 ? digits.slice(-10) : digits;
}

export class AppStorage {
  // --- USERS & AUTH ---
  static getUsers(): User[] {
    const rawUsers = loadFromStorage<User[]>(KEYS.USERS, INITIAL_USERS);
    return rawUsers.map((u) => {
      const fallbackPin = u.role === 'owner' ? '1111' : u.role === 'manager' ? '2222' : '3333';
      let upgraded = {
        ...u,
        pin: u.pin || fallbackPin,
        isActive: u.isActive !== false,
      };
      if (upgraded.id === 'user-owner-01' && upgraded.phone === '+91 98812 34567') {
        upgraded = {
          ...upgraded,
          name: 'Owner',
          email: 'owner@m1enterprises.in',
          phone: '+91 82080 85678',
        };
      }
      if (upgraded.id === 'user-manager-02' && upgraded.phone === '+91 98220 98765') {
        upgraded = {
          ...upgraded,
          name: 'Affan',
          email: 'affan@m1enterprises.in',
          phone: '+91 74990 87861',
        };
      }
      return upgraded;
    });
  }

  static saveUsers(users: User[]): void {
    saveToStorage(KEYS.USERS, users);
  }

  static getIsAuthenticated(): boolean {
    return loadFromStorage<boolean>(KEYS.AUTH_SESSION, true);
  }

  static setIsAuthenticated(status: boolean): void {
    saveToStorage(KEYS.AUTH_SESSION, status);
  }

  static getActiveUser(): User {
    const users = this.getUsers();
    const saved = loadFromStorage<User | null>(KEYS.ACTIVE_USER, null);
    if (saved) {
      const matched = users.find((u) => u.id === saved.id && u.isActive !== false);
      if (matched) return matched;
    }
    return users.find((u) => u.isActive !== false) || users[0];
  }

  static setActiveUser(user: User): void {
    saveToStorage(KEYS.ACTIVE_USER, user);
    saveToStorage(KEYS.AUTH_SESSION, true);
  }

  static addUser(
    userData: { name: string; email: string; phone: string; role: UserRole; pin: string },
    actor?: User
  ): { success: boolean; user?: User; message?: string } {
    const users = this.getUsers();
    const trimmedEmail = userData.email.trim().toLowerCase();
    const phoneDigits = normalizePhoneDigits(userData.phone);

    if (!userData.name.trim()) {
      return { success: false, message: 'Full name is required.' };
    }
    if (!trimmedEmail && !phoneDigits) {
      return { success: false, message: 'Provide either a mobile number or email address.' };
    }
    if (!/^\d{4,6}$/.test(userData.pin.trim())) {
      return { success: false, message: 'Login PIN must be 4 to 6 digits.' };
    }

    const duplicate = users.find(
      (u) =>
        (trimmedEmail && u.email.trim().toLowerCase() === trimmedEmail) ||
        (phoneDigits && normalizePhoneDigits(u.phone) === phoneDigits)
    );
    if (duplicate) {
      return {
        success: false,
        message: `An account with this phone or email already exists (${duplicate.name} — ${duplicate.role.toUpperCase()}).`,
      };
    }

    const prefix = userData.role === 'owner' ? 'user-owner' : userData.role === 'manager' ? 'user-mgr' : 'user-staff';
    const newUser: User = {
      id: `${prefix}-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
      name: userData.name.trim(),
      email: trimmedEmail || `${phoneDigits}@m1enterprises.in`,
      phone: userData.phone.trim(),
      role: userData.role,
      pin: userData.pin.trim(),
      isActive: true,
      isDemo: false,
      createdAt: new Date().toISOString(),
      createdBy: actor?.id || 'self-registration',
    };

    const updatedUsers = [...users, newUser];
    this.saveUsers(updatedUsers);

    const logActor = actor || newUser;
    this.addAuditLog({
      action: 'ADD_USER',
      userId: logActor.id,
      userName: logActor.name,
      userRole: logActor.role,
      targetId: newUser.id,
      targetType: 'user',
      details: `Added new ${newUser.role.toUpperCase()} account "${newUser.name}" (${newUser.phone || newUser.email}).`,
    });

    return { success: true, user: newUser };
  }

  static updateUser(
    updatedUser: User,
    actor: User
  ): { success: boolean; message?: string } {
    const users = this.getUsers();
    const index = users.findIndex((u) => u.id === updatedUser.id);
    if (index === -1) {
      return { success: false, message: 'User account not found.' };
    }

    if (!/^\d{4,6}$/.test(updatedUser.pin.trim())) {
      return { success: false, message: 'Login PIN must be 4 to 6 digits.' };
    }

    const trimmedEmail = updatedUser.email.trim().toLowerCase();
    const phoneDigits = normalizePhoneDigits(updatedUser.phone);
    const conflict = users.find(
      (u) =>
        u.id !== updatedUser.id &&
        ((trimmedEmail && u.email.trim().toLowerCase() === trimmedEmail) ||
          (phoneDigits && normalizePhoneDigits(u.phone) === phoneDigits))
    );
    if (conflict) {
      return { success: false, message: `Email or phone already belongs to ${conflict.name}.` };
    }

    const cleanUser: User = {
      ...updatedUser,
      name: updatedUser.name.trim(),
      email: trimmedEmail,
      phone: updatedUser.phone.trim(),
      pin: updatedUser.pin.trim(),
    };

    users[index] = cleanUser;
    this.saveUsers(users);

    const currentActive = loadFromStorage<User | null>(KEYS.ACTIVE_USER, null);
    if (currentActive && currentActive.id === cleanUser.id) {
      saveToStorage(KEYS.ACTIVE_USER, cleanUser);
    }

    this.addAuditLog({
      action: 'UPDATE_USER',
      userId: actor.id,
      userName: actor.name,
      userRole: actor.role,
      targetId: cleanUser.id,
      targetType: 'user',
      details: `Updated account for "${cleanUser.name}" (${cleanUser.role.toUpperCase()}, Status: ${cleanUser.isActive ? 'Active' : 'Suspended'}).`,
    });

    return { success: true };
  }

  static toggleUserStatus(userId: string, isActive: boolean, actor: User): { success: boolean; message?: string } {
    const users = this.getUsers();
    const idx = users.findIndex((u) => u.id === userId);
    if (idx === -1) return { success: false, message: 'Account not found.' };

    if (userId === actor.id && !isActive) {
      return { success: false, message: 'You cannot suspend your own currently logged-in account.' };
    }

    if (!isActive && users[idx].role === 'owner') {
      const activeOwners = users.filter((u) => u.role === 'owner' && u.isActive !== false);
      if (activeOwners.length <= 1) {
        return { success: false, message: 'At least one active Owner account must remain enabled.' };
      }
    }

    users[idx] = { ...users[idx], isActive };
    this.saveUsers(users);

    this.addAuditLog({
      action: 'UPDATE_USER',
      userId: actor.id,
      userName: actor.name,
      userRole: actor.role,
      targetId: users[idx].id,
      targetType: 'user',
      details: `${isActive ? 'Activated' : 'Suspended'} ${users[idx].role.toUpperCase()} login access for "${users[idx].name}".`,
    });

    return { success: true };
  }

  static loginWithCredentials(
    identifier: string,
    pin: string
  ): { success: boolean; user?: User; message?: string } {
    const query = identifier.trim().toLowerCase();
    const queryDigits = normalizePhoneDigits(identifier);
    const cleanPin = pin.trim();

    if (!query || !cleanPin) {
      return { success: false, message: 'Enter both Mobile/Email and your Login PIN.' };
    }

    const users = this.getUsers();
    const matched = users.find((u) => {
      const emailMatch = u.email.trim().toLowerCase() === query;
      const phoneMatch = queryDigits.length >= 6 && normalizePhoneDigits(u.phone) === queryDigits;
      return emailMatch || phoneMatch;
    });

    if (!matched) {
      return { success: false, message: 'No Owner, Manager, or Staff account found with that mobile or email.' };
    }

    if (matched.isActive === false) {
      return { success: false, message: 'This account is suspended. Please contact a Shop Owner to reactivate access.' };
    }

    if (matched.pin !== cleanPin) {
      return { success: false, message: 'Incorrect Login PIN. Please verify and try again.' };
    }

    const signedInUser: User = {
      ...matched,
      lastLogin: new Date().toISOString(),
    };

    const updatedUsers = users.map((u) => (u.id === signedInUser.id ? signedInUser : u));
    this.saveUsers(updatedUsers);
    this.setActiveUser(signedInUser);

    this.addAuditLog({
      action: 'USER_LOGIN',
      userId: signedInUser.id,
      userName: signedInUser.name,
      userRole: signedInUser.role,
      targetId: signedInUser.id,
      targetType: 'user',
      details: `${signedInUser.name} (${signedInUser.role.toUpperCase()}) signed in via PIN authentication.`,
    });

    return { success: true, user: signedInUser };
  }

  static logoutUser(user: User): void {
    this.addAuditLog({
      action: 'USER_LOGOUT',
      userId: user.id,
      userName: user.name,
      userRole: user.role,
      targetId: user.id,
      targetType: 'user',
      details: `${user.name} (${user.role.toUpperCase()}) signed out of terminal.`,
    });
    saveToStorage(KEYS.AUTH_SESSION, false);
  }

  // --- STORE SETTINGS ---
  static getSettings(): StoreSettings {
    const saved = loadFromStorage<StoreSettings>(KEYS.SETTINGS, INITIAL_STORE_SETTINGS);
    return {
      ...saved,
      phone: saved.phone === '+91 98812 34567' ? '+91 82080 85678' : saved.phone,
      altPhone: saved.altPhone === '+91 2422 223456' ? '+91 74990 87861' : saved.altPhone,
    };
  }

  static updateSettings(settings: StoreSettings, user: User): void {
    saveToStorage(KEYS.SETTINGS, settings);
    this.addAuditLog({
      action: 'UPDATE_STORE_SETTINGS',
      userId: user.id,
      userName: user.name,
      userRole: user.role,
      targetId: 'settings',
      targetType: 'settings',
      details: `Updated store profile / GST settings. (GST Registered: ${settings.isGstRegistered ? 'YES' : 'NO - Non-GST Retail Active'})`,
    });
  }

  // --- PRODUCTS & INVENTORY ---
  static getProducts(): Product[] {
    return loadFromStorage<Product[]>(KEYS.PRODUCTS, INITIAL_PRODUCTS);
  }

  static saveProducts(products: Product[]): void {
    saveToStorage(KEYS.PRODUCTS, products);
  }

  static addProduct(product: Omit<Product, 'id'>, user: User): Product {
    const products = this.getProducts();
    const newProduct: Product = {
      ...product,
      id: `prod-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      isActive: true,
    };
    products.unshift(newProduct);
    this.saveProducts(products);

    this.addAuditLog({
      action: 'ADD_PRODUCT',
      userId: user.id,
      userName: user.name,
      userRole: user.role,
      targetId: newProduct.id,
      targetType: 'product',
      details: `Added new product "${newProduct.name}" (${newProduct.modelNumber}), selling price ₹${newProduct.sellingPrice}, initial stock ${newProduct.stockQuantity}.`,
    });

    return newProduct;
  }

  static updateProduct(updated: Product, user: User): void {
    const products = this.getProducts();
    const index = products.findIndex(p => p.id === updated.id);
    if (index !== -1) {
      const old = products[index];
      products[index] = updated;
      this.saveProducts(products);

      this.addAuditLog({
        action: 'UPDATE_PRODUCT',
        userId: user.id,
        userName: user.name,
        userRole: user.role,
        targetId: updated.id,
        targetType: 'product',
        details: `Updated product "${updated.name}" (Stock: ${old.stockQuantity} -> ${updated.stockQuantity}, Price: ₹${updated.sellingPrice}).`,
      });
    }
  }

  /**
   * Adjust stock with mandatory audit reason.
   */
  static adjustStock(productId: string, deltaQuantity: number, reason: string, user: User): Product | null {
    const products = this.getProducts();
    const product = products.find(p => p.id === productId);
    if (!product) return null;

    const oldQty = product.stockQuantity;
    product.stockQuantity = Math.max(0, product.stockQuantity + deltaQuantity);
    this.saveProducts(products);

    this.addAuditLog({
      action: 'ADJUST_STOCK',
      userId: user.id,
      userName: user.name,
      userRole: user.role,
      targetId: product.id,
      targetType: 'product',
      details: `Stock adjusted for "${product.name}" by ${deltaQuantity > 0 ? `+${deltaQuantity}` : deltaQuantity} (from ${oldQty} to ${product.stockQuantity}). Reason: ${reason}`,
    });

    return product;
  }

  /**
   * Never silently delete: Archive instead of permanent purge, and log audit!
   */
  static archiveProduct(productId: string, reason: string, user: User): void {
    const products = this.getProducts();
    const product = products.find(p => p.id === productId);
    if (product) {
      product.isActive = false;
      this.saveProducts(products);

      this.addAuditLog({
        action: 'DELETE_PRODUCT_ATTEMPT',
        userId: user.id,
        userName: user.name,
        userRole: user.role,
        targetId: product.id,
        targetType: 'product',
        details: `Archived/Deactivated product "${product.name}" instead of hard delete. Reason: ${reason}`,
      });
    }
  }

  // --- CUSTOMERS & KHATA ---
  static getCustomers(): Customer[] {
    return loadFromStorage<Customer[]>(KEYS.CUSTOMERS, INITIAL_CUSTOMERS);
  }

  static saveCustomers(customers: Customer[]): void {
    saveToStorage(KEYS.CUSTOMERS, customers);
  }

  static addCustomer(customer: Omit<Customer, 'id' | 'outstandingBalance' | 'totalPurchases' | 'firstVisitDate'>): Customer {
    const customers = this.getCustomers();
    const newCust: Customer = {
      ...customer,
      id: `cust-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      outstandingBalance: 0,
      totalPurchases: 0,
      firstVisitDate: new Date().toISOString().split('T')[0],
    };
    customers.unshift(newCust);
    this.saveCustomers(customers);
    return newCust;
  }

  static updateCustomer(updated: Customer): void {
    const customers = this.getCustomers();
    const idx = customers.findIndex(c => c.id === updated.id);
    if (idx !== -1) {
      customers[idx] = updated;
      this.saveCustomers(customers);
    }
  }

  // --- INVOICES & BILLING ---
  static getInvoices(): Invoice[] {
    return loadFromStorage<Invoice[]>(KEYS.INVOICES, INITIAL_INVOICES);
  }

  static saveInvoices(invoices: Invoice[]): void {
    saveToStorage(KEYS.INVOICES, invoices);
  }

  static createInvoice(invoiceData: Omit<Invoice, 'id' | 'invoiceNumber' | 'date'>, user: User): Invoice {
    const invoices = this.getInvoices();
    const settings = this.getSettings();

    // Generate consecutive invoice number: M1/2026-27/0104
    const count = invoices.length + 101;
    const invoiceNumber = `${settings.invoicePrefix || 'M1/2026-27/'}${count.toString().padStart(4, '0')}`;

    const newInvoice: Invoice = {
      ...invoiceData,
      id: `inv-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      invoiceNumber,
      date: new Date().toISOString(),
      isGstVerified: settings.isGstRegistered,
      invoiceType: settings.isGstRegistered ? 'gst_tax_invoice' : 'non_gst_retail',
      createdBy: user.id,
      createdByName: user.name,
      createdByRole: user.role,
    };

    // Deduct stock for all items
    const products = this.getProducts();
    for (const item of newInvoice.items) {
      const prod = products.find(p => p.id === item.productId);
      if (prod) {
        prod.stockQuantity = Math.max(0, prod.stockQuantity - item.quantity);
      }
    }
    this.saveProducts(products);

    // Update customer stats and outstanding Khata
    const customers = this.getCustomers();
    const cust = customers.find(c => c.id === newInvoice.customerId);
    if (cust) {
      cust.totalPurchases += newInvoice.totalAmount;
      if (newInvoice.balanceDue > 0) {
        cust.outstandingBalance += newInvoice.balanceDue;
      }
      cust.lastPurchaseDate = newInvoice.date;
      this.saveCustomers(customers);
    }

    invoices.unshift(newInvoice);
    this.saveInvoices(invoices);

    // Log payment if any amount was paid immediately
    if (newInvoice.amountPaid > 0) {
      this.recordPayment({
        invoiceId: newInvoice.id,
        customerId: newInvoice.customerId,
        customerName: newInvoice.customerName,
        amount: newInvoice.amountPaid,
        method: newInvoice.paymentMethod,
        referenceNumber: newInvoice.paymentDetails?.upiReference,
        timestamp: newInvoice.date,
        notes: `Initial bill payment for ${newInvoice.invoiceNumber}`,
        receivedBy: user.name,
        receivedByRole: user.role,
      }, false);
    }

    // Audit log
    this.addAuditLog({
      action: 'CREATE_INVOICE',
      userId: user.id,
      userName: user.name,
      userRole: user.role,
      targetId: newInvoice.id,
      targetType: 'invoice',
      details: `Generated bill ${newInvoice.invoiceNumber} for ${newInvoice.customerName}. Total: ₹${newInvoice.totalAmount.toLocaleString('en-IN')}, Paid: ₹${newInvoice.amountPaid.toLocaleString('en-IN')}, Due: ₹${newInvoice.balanceDue.toLocaleString('en-IN')} (${newInvoice.invoiceType}).`,
    });

    return newInvoice;
  }

  /**
   * NEVER silently delete bills! Only void with reason, restore stock, and reverse Khata.
   */
  static voidInvoice(invoiceId: string, reason: string, user: User): boolean {
    if (user.role === 'staff') {
      alert('Security Policy: Staff members cannot void or cancel transactions. Please contact Manager or Owner.');
      return false;
    }

    const invoices = this.getInvoices();
    const inv = invoices.find(i => i.id === invoiceId);
    if (!inv || inv.isVoided) return false;

    inv.isVoided = true;
    inv.status = 'voided';
    inv.voidReason = reason;
    inv.voidedAt = new Date().toISOString();
    inv.voidedBy = `${user.name} (${user.role.toUpperCase()})`;
    this.saveInvoices(invoices);

    // Restore stock for all products in this bill
    const products = this.getProducts();
    for (const item of inv.items) {
      const prod = products.find(p => p.id === item.productId);
      if (prod) {
        prod.stockQuantity += item.quantity;
      }
    }
    this.saveProducts(products);

    // Reverse customer balance if balance was pending
    if (inv.balanceDue > 0) {
      const customers = this.getCustomers();
      const cust = customers.find(c => c.id === inv.customerId);
      if (cust) {
        cust.outstandingBalance = Math.max(0, cust.outstandingBalance - inv.balanceDue);
        cust.totalPurchases = Math.max(0, cust.totalPurchases - inv.totalAmount);
        this.saveCustomers(customers);
      }
    }

    this.addAuditLog({
      action: 'VOID_INVOICE',
      userId: user.id,
      userName: user.name,
      userRole: user.role,
      targetId: inv.id,
      targetType: 'invoice',
      details: `VOIDE/CANCELLED bill ${inv.invoiceNumber} (Total: ₹${inv.totalAmount}). Items stock restored to inventory. Reason: ${reason}`,
    });

    return true;
  }

  // --- PAYMENTS & KHATA COLLECTIONS ---
  static getPayments(): PaymentRecord[] {
    return loadFromStorage<PaymentRecord[]>(KEYS.PAYMENTS, []);
  }

  static recordPayment(payment: Omit<PaymentRecord, 'id'>, logAudit = true): PaymentRecord {
    const payments = this.getPayments();
    const newPayment: PaymentRecord = {
      ...payment,
      id: `pay-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    };
    payments.unshift(newPayment);
    saveToStorage(KEYS.PAYMENTS, payments);

    // If Khata payment, reduce customer outstanding balance
    if (logAudit) {
      const customers = this.getCustomers();
      const cust = customers.find(c => c.id === payment.customerId);
      if (cust) {
        cust.outstandingBalance = Math.max(0, cust.outstandingBalance - payment.amount);
        this.saveCustomers(customers);
      }

      this.addAuditLog({
        action: 'RECORD_PAYMENT',
        userId: payment.receivedBy,
        userName: payment.receivedBy,
        userRole: payment.receivedByRole,
        targetId: newPayment.id,
        targetType: 'payment',
        details: `Collected ₹${payment.amount.toLocaleString('en-IN')} from ${payment.customerName} via ${payment.method.toUpperCase()}. Ref: ${payment.referenceNumber || 'N/A'}.`,
      });
    }

    return newPayment;
  }

  // --- CUSTOMER ORDERS & BOOKINGS ---
  static getOrders(): CustomerOrder[] {
    return loadFromStorage<CustomerOrder[]>(KEYS.ORDERS, INITIAL_ORDERS);
  }

  static saveOrders(orders: CustomerOrder[]): void {
    saveToStorage(KEYS.ORDERS, orders);
  }

  static createOrder(orderData: Omit<CustomerOrder, 'id' | 'orderNumber' | 'orderDate'>, user?: User): CustomerOrder {
    const orders = this.getOrders();
    const count = orders.length + 107;
    const orderNumber = `ORD-2026-${count.toString().padStart(3, '0')}`;

    const newOrder: CustomerOrder = {
      ...orderData,
      id: `ord-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      orderNumber,
      orderDate: new Date().toISOString(),
      createdBy: user ? user.id : 'online_public',
      createdByName: user ? user.name : 'Customer Web Portal',
    };

    orders.unshift(newOrder);
    this.saveOrders(orders);

    if (user) {
      this.addAuditLog({
        action: 'CREATE_INVOICE',
        userId: user.id,
        userName: user.name,
        userRole: user.role,
        targetId: newOrder.id,
        targetType: 'invoice',
        details: `Customer Order ${newOrder.orderNumber} recorded for ${newOrder.customerName}. Total: ₹${newOrder.totalAmount.toLocaleString('en-IN')}, Advance: ₹${newOrder.advancePaid.toLocaleString('en-IN')}, Status: ${newOrder.status.toUpperCase()}.`,
      });
    }

    return newOrder;
  }

  static updateOrderStatus(orderId: string, status: CustomerOrder['status'], user?: User): void {
    const orders = this.getOrders();
    const order = orders.find(o => o.id === orderId);
    if (order) {
      const oldStatus = order.status;
      order.status = status;
      this.saveOrders(orders);

      if (user) {
        this.addAuditLog({
          action: 'UPDATE_PRODUCT',
          userId: user.id,
          userName: user.name,
          userRole: user.role,
          targetId: order.id,
          targetType: 'invoice',
          details: `Updated order ${order.orderNumber} status from ${oldStatus.toUpperCase()} to ${status.toUpperCase()}.`,
        });
      }
    }
  }

  static convertOrderToInvoice(orderId: string, user: User): Invoice | null {
    const orders = this.getOrders();
    const order = orders.find(o => o.id === orderId);
    if (!order) return null;

    const invoiceItems: InvoiceItem[] = order.items.map((item, idx) => ({
      id: `item-${Date.now()}-${idx}`,
      productId: item.productId,
      name: item.name,
      brand: item.brand,
      modelNumber: item.modelNumber,
      serialNumber: '',
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      mrp: item.unitPrice,
      discount: 0,
      total: item.total,
      warrantyPeriod: item.warrantyPeriod,
    }));

    const customers = this.getCustomers();
    let cust = customers.find(c => c.phone === order.customerPhone);
    let custId = cust?.id;
    if (!custId) {
      const newCust = this.addCustomer({
        name: order.customerName,
        phone: order.customerPhone,
        address: order.customerAddress || 'Shrirampur, Ahilyanagar',
        creditLimit: 25000,
        notes: `Registered from order ${order.orderNumber}`,
      });
      custId = newCust.id;
    }

    const newInvoice = this.createInvoice({
      customerId: custId,
      customerName: order.customerName,
      customerPhone: order.customerPhone,
      customerAddress: order.customerAddress,
      items: invoiceItems,
      subtotal: order.totalAmount,
      overallDiscount: 0,
      taxAmount: 0,
      totalAmount: order.totalAmount,
      amountPaid: order.advancePaid > 0 ? order.advancePaid : order.totalAmount,
      balanceDue: order.advancePaid > 0 ? Math.max(0, order.totalAmount - order.advancePaid) : 0,
      paymentMethod: order.paymentMethod,
      paymentDetails: {},
      status: order.balanceDue > 0 ? 'partial' : 'paid',
      invoiceType: 'non_gst_retail',
      isGstVerified: false,
      notes: `Converted from order ${order.orderNumber}. ${order.notes || ''}`,
      createdBy: user.id,
      createdByName: user.name,
      createdByRole: user.role,
    }, user);

    order.status = 'delivered';
    order.invoiceId = newInvoice.id;
    this.saveOrders(orders);

    return newInvoice;
  }

  // --- EXPENSES ---
  static getExpenses(): Expense[] {
    return loadFromStorage<Expense[]>(KEYS.EXPENSES, INITIAL_EXPENSES);
  }

  static addExpense(expense: Omit<Expense, 'id'>, user: User): Expense {
    const expenses = this.getExpenses();
    const newExp: Expense = {
      ...expense,
      id: `exp-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    };
    expenses.unshift(newExp);
    saveToStorage(KEYS.EXPENSES, expenses);

    this.addAuditLog({
      action: 'RECORD_EXPENSE',
      userId: user.id,
      userName: user.name,
      userRole: user.role,
      targetId: newExp.id,
      targetType: 'expense',
      details: `Recorded expense of ₹${newExp.amount.toLocaleString('en-IN')} for [${newExp.category}] paid to "${newExp.paidTo}" via ${newExp.paymentMethod}.`,
    });

    return newExp;
  }

  // --- SUPPLIER PURCHASES ---
  static getPurchases(): SupplierPurchase[] {
    return loadFromStorage<SupplierPurchase[]>(KEYS.PURCHASES, INITIAL_PURCHASES);
  }

  static addPurchase(purchase: Omit<SupplierPurchase, 'id' | 'purchaseNumber'>, user: User): SupplierPurchase {
    const purchases = this.getPurchases();
    const count = purchases.length + 91;
    const purchaseNumber = `PUR/2026/${count.toString().padStart(3, '0')}`;
    const newPur: SupplierPurchase = {
      ...purchase,
      id: `pur-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      purchaseNumber,
    };
    purchases.unshift(newPur);
    saveToStorage(KEYS.PURCHASES, purchases);

    this.addAuditLog({
      action: 'CREATE_PURCHASE',
      userId: user.id,
      userName: user.name,
      userRole: user.role,
      targetId: newPur.id,
      targetType: 'purchase',
      details: `Inward stock purchase ${purchaseNumber} recorded from ${newPur.supplierName}. Total: ₹${newPur.totalAmount.toLocaleString('en-IN')}, Paid: ₹${newPur.paidAmount.toLocaleString('en-IN')}.`,
    });

    return newPur;
  }

  // --- AUDIT LOGS ---
  static getAuditLogs(): AuditLog[] {
    return loadFromStorage<AuditLog[]>(KEYS.AUDIT_LOGS, INITIAL_AUDIT_LOGS);
  }

  static addAuditLog(entry: Omit<AuditLog, 'id' | 'timestamp'>): void {
    const logs = this.getAuditLogs();
    const newLog: AuditLog = {
      ...entry,
      id: `audit-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      timestamp: new Date().toISOString(),
    };
    logs.unshift(newLog);
    // Keep last 1000 logs
    if (logs.length > 1000) logs.pop();
    saveToStorage(KEYS.AUDIT_LOGS, logs);
  }

  // --- BACKUP & RESTORE ---
  static exportFullBackup(): string {
    const data = {
      app: 'M1 ENTERPRISES',
      exportedAt: new Date().toISOString(),
      storeSettings: this.getSettings(),
      users: this.getUsers(),
      products: this.getProducts(),
      customers: this.getCustomers(),
      invoices: this.getInvoices(),
      orders: this.getOrders(),
      expenses: this.getExpenses(),
      purchases: this.getPurchases(),
      payments: this.getPayments(),
      auditLogs: this.getAuditLogs(),
    };
    return JSON.stringify(data, null, 2);
  }

  static restoreFromBackup(jsonString: string, user: User): { success: boolean; message: string } {
    try {
      const data = JSON.parse(jsonString);
      if (!data.products || !data.invoices) {
        return { success: false, message: 'Invalid backup format. Missing core products or invoices table.' };
      }

      if (data.users) saveToStorage(KEYS.USERS, data.users);
      if (data.products) saveToStorage(KEYS.PRODUCTS, data.products);
      if (data.customers) saveToStorage(KEYS.CUSTOMERS, data.customers);
      if (data.invoices) saveToStorage(KEYS.INVOICES, data.invoices);
      if (data.orders) saveToStorage(KEYS.ORDERS, data.orders);
      if (data.expenses) saveToStorage(KEYS.EXPENSES, data.expenses);
      if (data.purchases) saveToStorage(KEYS.PURCHASES, data.purchases);
      if (data.payments) saveToStorage(KEYS.PAYMENTS, data.payments);
      if (data.storeSettings) saveToStorage(KEYS.SETTINGS, data.storeSettings);

      this.addAuditLog({
        action: 'RESTORE_DATABASE',
        userId: user.id,
        userName: user.name,
        userRole: user.role,
        targetId: 'database',
        targetType: 'system',
        details: `Restored entire database from backup file (${data.products.length} products, ${data.invoices.length} bills).`,
      });

      return { success: true, message: 'Database restored successfully! All devices updated.' };
    } catch (err: any) {
      return { success: false, message: `Failed to restore: ${err?.message || 'Parse error'}` };
    }
  }

  static resetToDemoData(user: User): void {
    saveToStorage(KEYS.USERS, INITIAL_USERS);
    saveToStorage(KEYS.PRODUCTS, INITIAL_PRODUCTS);
    saveToStorage(KEYS.CUSTOMERS, INITIAL_CUSTOMERS);
    saveToStorage(KEYS.INVOICES, INITIAL_INVOICES);
    saveToStorage(KEYS.ORDERS, INITIAL_ORDERS);
    saveToStorage(KEYS.EXPENSES, INITIAL_EXPENSES);
    saveToStorage(KEYS.PURCHASES, INITIAL_PURCHASES);
    saveToStorage(KEYS.SETTINGS, INITIAL_STORE_SETTINGS);
    saveToStorage(KEYS.AUDIT_LOGS, INITIAL_AUDIT_LOGS);
    saveToStorage(KEYS.PAYMENTS, []);

    this.addAuditLog({
      action: 'RESTORE_DATABASE',
      userId: user.id,
      userName: user.name,
      userRole: user.role,
      targetId: 'database',
      targetType: 'system',
      details: 'Reset system back to initial demo dataset for M1 ENTERPRISES.',
    });
  }
}
