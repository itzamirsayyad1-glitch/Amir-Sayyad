/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import { 
  User, 
  Product, 
  Customer, 
  Invoice, 
  Expense, 
  SupplierPurchase, 
  StoreSettings, 
  PaymentRecord, 
  AuditLog,
  CustomerOrder,
  OrderStatus,
  UserRole
} from './types';
import { AppStorage } from './services/storage';
import { Header } from './components/layout/Header';
import { Sidebar } from './components/layout/Sidebar';
import { DashboardView } from './components/dashboard/DashboardView';
import { BillingView } from './components/billing/BillingView';
import { InventoryView } from './components/inventory/InventoryView';
import { CustomersView } from './components/customers/CustomersView';
import { AccountsView } from './components/accounts/AccountsView';
import { ReportsView } from './components/reports/ReportsView';
import { AuditLogsView } from './components/audit/AuditLogsView';
import { SettingsView } from './components/settings/SettingsView';
import { OrdersView } from './components/orders/OrdersView';
import { AnalyticsView } from './components/analytics/AnalyticsView';
import { LoginView } from './components/auth/LoginView';
import { TeamManagementView } from './components/auth/TeamManagementView';
import { InvoiceModal } from './components/billing/InvoiceModal';
import { OfflineIndicator } from './components/common/OfflineIndicator';

export default function App() {
  // Application Data States loaded from AppStorage
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => AppStorage.getIsAuthenticated());
  const [currentUser, setCurrentUser] = useState<User>(() => AppStorage.getActiveUser());
  const [allUsers, setAllUsers] = useState<User[]>(() => AppStorage.getUsers());
  const [settings, setSettings] = useState<StoreSettings>(() => AppStorage.getSettings());
  const [products, setProducts] = useState<Product[]>(() => AppStorage.getProducts());
  const [customers, setCustomers] = useState<Customer[]>(() => AppStorage.getCustomers());
  const [invoices, setInvoices] = useState<Invoice[]>(() => AppStorage.getInvoices());
  const [expenses, setExpenses] = useState<Expense[]>(() => AppStorage.getExpenses());
  const [purchases, setPurchases] = useState<SupplierPurchase[]>(() => AppStorage.getPurchases());
  const [payments, setPayments] = useState<PaymentRecord[]>(() => AppStorage.getPayments());
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(() => AppStorage.getAuditLogs());
  const [orders, setOrders] = useState<CustomerOrder[]>(() => AppStorage.getOrders());

  // Navigation & UI States
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const [globalSearch, setGlobalSearch] = useState('');
  const [activeInvoiceModal, setActiveInvoiceModal] = useState<Invoice | null>(null);

  // Synchronize state across browser tabs & windows
  const reloadFromStorage = useCallback(() => {
    setIsAuthenticated(AppStorage.getIsAuthenticated());
    setCurrentUser(AppStorage.getActiveUser());
    setAllUsers(AppStorage.getUsers());
    setSettings(AppStorage.getSettings());
    setProducts(AppStorage.getProducts());
    setCustomers(AppStorage.getCustomers());
    setInvoices(AppStorage.getInvoices());
    setExpenses(AppStorage.getExpenses());
    setPurchases(AppStorage.getPurchases());
    setPayments(AppStorage.getPayments());
    setAuditLogs(AppStorage.getAuditLogs());
    setOrders(AppStorage.getOrders());
  }, []);

  useEffect(() => {
    const handleStorageUpdate = () => reloadFromStorage();
    window.addEventListener('storage', handleStorageUpdate);
    window.addEventListener('m1_storage_update', handleStorageUpdate);

    // Keyboard shortcut F2 for POS Billing
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'F2' && AppStorage.getIsAuthenticated()) {
        e.preventDefault();
        setActiveTab('billing');
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('storage', handleStorageUpdate);
      window.removeEventListener('m1_storage_update', handleStorageUpdate);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [reloadFromStorage]);

  // Keep tab valid for current user's role
  const guardTabForRole = (role: UserRole, tab: string): string => {
    if (role === 'staff' && (tab === 'team' || tab === 'audit' || tab === 'settings')) {
      return 'dashboard';
    }
    if (role === 'manager' && tab === 'settings') {
      return 'dashboard';
    }
    return tab;
  };

  // Auth & Team Actions
  const handleSelectUser = (user: User) => {
    AppStorage.setActiveUser(user);
    setCurrentUser(user);
    setIsAuthenticated(true);
    setActiveTab((prev) => guardTabForRole(user.role, prev));
    reloadFromStorage();
  };

  const handleLogin = (identifier: string, pin: string) => {
    const result = AppStorage.loginWithCredentials(identifier, pin);
    if (result.success && result.user) {
      setCurrentUser(result.user);
      setIsAuthenticated(true);
      setActiveTab('dashboard');
      reloadFromStorage();
    }
    return result;
  };

  const handleLogout = () => {
    AppStorage.logoutUser(currentUser);
    setIsAuthenticated(false);
    reloadFromStorage();
  };

  const handleRegisterOwnerWithStaff = (
    ownerData: { name: string; phone: string; email: string; pin: string },
    initialStaff?: { name: string; phone: string; email: string; role: 'manager' | 'staff'; pin: string }
  ): { success: boolean; message?: string } => {
    const ownerRes = AppStorage.addUser({ ...ownerData, role: 'owner' });
    if (!ownerRes.success || !ownerRes.user) {
      return { success: false, message: ownerRes.message || 'Could not register Owner.' };
    }

    if (initialStaff) {
      const staffRes = AppStorage.addUser(initialStaff, ownerRes.user);
      if (!staffRes.success) {
        AppStorage.setActiveUser(ownerRes.user);
        setCurrentUser(ownerRes.user);
        setIsAuthenticated(true);
        setActiveTab('team');
        reloadFromStorage();
        return { success: true };
      }
    }

    AppStorage.setActiveUser(ownerRes.user);
    setCurrentUser(ownerRes.user);
    setIsAuthenticated(true);
    setActiveTab('dashboard');
    reloadFromStorage();
    return { success: true };
  };

  const handleAddUser = (userData: { name: string; email: string; phone: string; role: UserRole; pin: string }) => {
    const res = AppStorage.addUser(userData, currentUser);
    if (res.success) reloadFromStorage();
    return res;
  };

  const handleUpdateUser = (updatedUser: User) => {
    const res = AppStorage.updateUser(updatedUser, currentUser);
    if (res.success) reloadFromStorage();
    return res;
  };

  const handleToggleUserStatus = (userId: string, isActive: boolean) => {
    const res = AppStorage.toggleUserStatus(userId, isActive, currentUser);
    if (res.success) reloadFromStorage();
    return res;
  };

  // Billing Actions
  const handleSaveInvoice = (invoiceData: Omit<Invoice, 'id' | 'invoiceNumber' | 'date'>): Invoice => {
    const created = AppStorage.createInvoice(invoiceData, currentUser);
    reloadFromStorage();
    return created;
  };

  const handleVoidInvoice = (invoiceId: string, reason: string) => {
    const success = AppStorage.voidInvoice(invoiceId, reason, currentUser);
    if (success) {
      reloadFromStorage();
      if (activeInvoiceModal && activeInvoiceModal.id === invoiceId) {
        const updated = AppStorage.getInvoices().find((i) => i.id === invoiceId);
        if (updated) setActiveInvoiceModal(updated);
      }
    }
  };

  // Inventory Actions
  const handleAddProduct = (prod: Omit<Product, 'id'>) => {
    AppStorage.addProduct(prod, currentUser);
    reloadFromStorage();
  };

  const handleUpdateProduct = (prod: Product) => {
    AppStorage.updateProduct(prod, currentUser);
    reloadFromStorage();
  };

  const handleAdjustStock = (productId: string, delta: number, reason: string) => {
    AppStorage.adjustStock(productId, delta, reason, currentUser);
    reloadFromStorage();
  };

  const handleArchiveProduct = (productId: string, reason: string) => {
    AppStorage.archiveProduct(productId, reason, currentUser);
    reloadFromStorage();
  };

  // Customer Actions
  const handleAddCustomer = (custData: Omit<Customer, 'id' | 'outstandingBalance' | 'totalPurchases' | 'firstVisitDate'>): Customer => {
    const created = AppStorage.addCustomer(custData);
    reloadFromStorage();
    return created;
  };

  const handleRecordPayment = (paymentData: Omit<PaymentRecord, 'id'>): PaymentRecord => {
    const created = AppStorage.recordPayment(paymentData, true);
    reloadFromStorage();
    return created;
  };

  // Accounts Actions
  const handleAddExpense = (expData: Omit<Expense, 'id'>): Expense => {
    const created = AppStorage.addExpense(expData, currentUser);
    reloadFromStorage();
    return created;
  };

  const handleAddPurchase = (purData: Omit<SupplierPurchase, 'id' | 'purchaseNumber'>): SupplierPurchase => {
    const created = AppStorage.addPurchase(purData, currentUser);
    reloadFromStorage();
    return created;
  };

  // Order Actions
  const handleTakeOrder = (orderData: Omit<CustomerOrder, 'id' | 'orderNumber' | 'orderDate'>): CustomerOrder => {
    const created = AppStorage.createOrder(orderData, currentUser);
    reloadFromStorage();
    return created;
  };

  const handleUpdateOrderStatus = (orderId: string, status: OrderStatus) => {
    AppStorage.updateOrderStatus(orderId, status, currentUser);
    reloadFromStorage();
  };

  const handleConvertOrderToInvoice = (orderId: string): Invoice | null => {
    const inv = AppStorage.convertOrderToInvoice(orderId, currentUser);
    reloadFromStorage();
    return inv;
  };

  // Settings Actions
  const handleUpdateSettings = (newSettings: StoreSettings) => {
    AppStorage.updateSettings(newSettings, currentUser);
    reloadFromStorage();
  };

  const handleResetDemoData = () => {
    AppStorage.resetToDemoData(currentUser);
    reloadFromStorage();
  };

  // Counts for sidebar badges
  const lowStockCount = products.filter((p) => p.isActive && p.stockQuantity <= p.minStockAlert).length;
  const pendingKhataTotal = customers.reduce((acc, c) => acc + (c.outstandingBalance || 0), 0);
  const pendingOrdersCount = orders.filter((o) => o.status === 'pending' || o.status === 'confirmed').length;

  if (!isAuthenticated) {
    return (
      <>
        <OfflineIndicator />
        <LoginView
          allUsers={allUsers}
          settings={settings}
          onLogin={handleLogin}
          onRegisterOwnerWithStaff={handleRegisterOwnerWithStaff}
          onQuickDemoLogin={handleSelectUser}
        />
      </>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col selection:bg-amber-400 selection:text-slate-950">
      {/* Offline Toast */}
      <OfflineIndicator />

      {/* Main Header */}
      <Header
        currentUser={currentUser}
        allUsers={allUsers}
        onSelectUser={handleSelectUser}
        onLogout={handleLogout}
        settings={settings}
        onOpenMobileNav={() => setIsMobileNavOpen(true)}
        onNewBillClick={() => setActiveTab('billing')}
        activeTab={activeTab}
        onNavigate={(tab) => setActiveTab(tab)}
        searchTerm={globalSearch}
        onSearchChange={(term) => setGlobalSearch(term)}
      />

      {/* Body Layout: Sidebar + Main Content */}
      <div className="flex-1 flex max-w-7xl w-full mx-auto">
        <Sidebar
          activeTab={activeTab}
          onSelectTab={(tab) => setActiveTab(tab)}
          isOpenMobile={isMobileNavOpen}
          onCloseMobile={() => setIsMobileNavOpen(false)}
          userRole={currentUser.role}
          lowStockCount={lowStockCount}
          pendingKhataAmount={pendingKhataTotal}
          pendingOrdersCount={pendingOrdersCount}
          storePhone={settings.phone}
          altPhone={settings.altPhone}
        />

        {/* Main View Area */}
        <main className="flex-1 p-3.5 sm:p-6 lg:p-8 min-w-0">
          {activeTab === 'dashboard' && (
            <DashboardView
              invoices={invoices}
              products={products}
              customers={customers}
              expenses={expenses}
              settings={settings}
              userRole={currentUser.role}
              onNavigate={(tab) => setActiveTab(tab)}
              onSelectInvoice={(inv) => setActiveInvoiceModal(inv)}
              onNewBill={() => setActiveTab('billing')}
              onAddStock={() => setActiveTab('inventory')}
            />
          )}

          {activeTab === 'orders' && (
            <OrdersView
              orders={orders}
              products={products}
              customers={customers}
              currentUser={currentUser}
              onTakeOrder={handleTakeOrder}
              onUpdateStatus={handleUpdateOrderStatus}
              onConvertToInvoice={handleConvertOrderToInvoice}
              onOpenInvoiceModal={(inv) => setActiveInvoiceModal(inv)}
            />
          )}

          {activeTab === 'analytics' && (
            <AnalyticsView
              invoices={invoices}
              products={products}
              expenses={expenses}
              purchases={purchases}
              orders={orders}
              customers={customers}
              userRole={currentUser.role}
            />
          )}

          {activeTab === 'billing' && (
            <BillingView
              products={products}
              customers={customers}
              currentUser={currentUser}
              settings={settings}
              onSaveInvoice={handleSaveInvoice}
              onAddCustomer={handleAddCustomer}
              onOpenInvoiceModal={(inv) => setActiveInvoiceModal(inv)}
            />
          )}

          {activeTab === 'inventory' && (
            <InventoryView
              products={products}
              userRole={currentUser.role}
              onAddProduct={handleAddProduct}
              onUpdateProduct={handleUpdateProduct}
              onAdjustStock={handleAdjustStock}
              onArchiveProduct={handleArchiveProduct}
            />
          )}

          {activeTab === 'customers' && (
            <CustomersView
              customers={customers}
              invoices={invoices}
              payments={payments}
              currentUser={currentUser}
              settings={settings}
              onAddCustomer={handleAddCustomer}
              onRecordPayment={handleRecordPayment}
              onOpenInvoiceModal={(inv) => setActiveInvoiceModal(inv)}
            />
          )}

          {activeTab === 'accounts' && (
            <AccountsView
              invoices={invoices}
              payments={payments}
              expenses={expenses}
              purchases={purchases}
              currentUser={currentUser}
              onAddExpense={handleAddExpense}
              onAddPurchase={handleAddPurchase}
            />
          )}

          {activeTab === 'reports' && (
            <ReportsView
              invoices={invoices}
              products={products}
              expenses={expenses}
              purchases={purchases}
              userRole={currentUser.role}
            />
          )}

          {activeTab === 'team' && (currentUser.role === 'owner' || currentUser.role === 'manager') && (
            <TeamManagementView
              allUsers={allUsers}
              currentUser={currentUser}
              onAddUser={handleAddUser}
              onUpdateUser={handleUpdateUser}
              onToggleUserStatus={handleToggleUserStatus}
              onSwitchToUser={handleSelectUser}
            />
          )}

          {activeTab === 'audit' && (currentUser.role === 'owner' || currentUser.role === 'manager') && (
            <AuditLogsView auditLogs={auditLogs} />
          )}

          {activeTab === 'settings' && currentUser.role === 'owner' && (
            <SettingsView
              settings={settings}
              currentUser={currentUser}
              onUpdateSettings={handleUpdateSettings}
              onResetDemoData={handleResetDemoData}
            />
          )}
        </main>
      </div>

      {/* Invoice Modal for Printable A4 / PDF & WhatsApp */}
      {activeInvoiceModal && (
        <InvoiceModal
          invoice={activeInvoiceModal}
          settings={settings}
          userRole={currentUser.role}
          onClose={() => setActiveInvoiceModal(null)}
          onVoidInvoice={handleVoidInvoice}
        />
      )}
    </div>
  );
}
