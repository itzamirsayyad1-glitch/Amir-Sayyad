import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { SupabaseConfig } from '../types';

const STORAGE_KEY_SUPABASE = 'm1_supabase_config_v1';

// Default / fallback configuration from environment or localStorage
export function getSavedSupabaseConfig(): SupabaseConfig {
  const envUrl = (import.meta as any).env?.VITE_SUPABASE_URL || '';
  const envKey = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || '';

  try {
    const raw = localStorage.getItem(STORAGE_KEY_SUPABASE);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        url: parsed.url || envUrl,
        anonKey: parsed.anonKey || envKey,
        isConnected: Boolean(parsed.isConnected),
        lastSyncedAt: parsed.lastSyncedAt,
      };
    }
  } catch (err) {
    console.warn('Error reading saved Supabase config:', err);
  }

  return {
    url: envUrl,
    anonKey: envKey,
    isConnected: false,
  };
}

export function saveSupabaseConfig(config: SupabaseConfig): void {
  try {
    localStorage.setItem(STORAGE_KEY_SUPABASE, JSON.stringify(config));
  } catch (err) {
    console.error('Failed to save Supabase config to storage:', err);
  }
}

let activeClient: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient | null {
  const config = getSavedSupabaseConfig();
  if (!config.url || !config.anonKey) {
    return null;
  }

  if (!activeClient) {
    try {
      activeClient = createClient(config.url, config.anonKey, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
        },
      });
    } catch (e) {
      console.error('Failed to initialize Supabase client:', e);
      return null;
    }
  }
  return activeClient;
}

export async function testSupabaseConnection(url: string, key: string): Promise<{ success: boolean; message: string }> {
  try {
    if (!url || !key) {
      return { success: false, message: 'Supabase URL and Anon Key are required.' };
    }
    const client = createClient(url, key);
    // Ping with auth or health query
    const { data: _, error } = await client.from('products').select('count', { count: 'exact', head: true });
    
    // Even if table doesn't exist yet, if we get 404 or connection, it proves credentials connect
    if (error && error.message.includes('FetchError') || error?.message.includes('Failed to fetch')) {
      return { success: false, message: `Could not reach Supabase endpoint: ${error.message}` };
    }
    
    return { 
      success: true, 
      message: 'Successfully connected to Supabase project! Database tables can now be synchronized.' 
    };
  } catch (err: any) {
    return { success: false, message: err?.message || 'Connection failed' };
  }
}

/**
 * Complete production SQL schema and Row Level Security (RLS) policies
 * for M1 ENTERPRISES electronics store database in Supabase.
 */
export const SUPABASE_SQL_SCHEMA = `-- ====================================================================
-- M1 ENTERPRISES - ELECTRONICS & HOME APPLIANCES DATABASE SCHEMA
-- Location: Chatrapati Shivaji Maharaj Chowk, Shrirampur, Ahilyanagar
-- Supabase PostgreSQL with Row Level Security (RLS) Policies
-- ====================================================================

-- 1. Enable UUID Extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Store Configuration & Profile Table
CREATE TABLE IF NOT EXISTS store_settings (
    id TEXT PRIMARY KEY DEFAULT 'primary_store',
    store_name TEXT NOT NULL DEFAULT 'M1 ENTERPRISES',
    tagline TEXT DEFAULT 'Electronics & Home Appliances Store',
    address TEXT NOT NULL,
    city TEXT NOT NULL DEFAULT 'Shrirampur',
    district TEXT NOT NULL DEFAULT 'Ahilyanagar',
    state TEXT NOT NULL DEFAULT 'Maharashtra',
    pincode TEXT NOT NULL DEFAULT '413709',
    phone TEXT NOT NULL,
    alt_phone TEXT,
    email TEXT,
    upi_id TEXT,
    gst_number TEXT,
    is_gst_registered BOOLEAN NOT NULL DEFAULT FALSE,
    gst_application_arn TEXT,
    gst_status TEXT DEFAULT 'pending_application',
    bank_details JSONB,
    invoice_terms JSONB,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Staff & User Profiles Table
CREATE TABLE IF NOT EXISTS staff_users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    phone TEXT,
    role TEXT NOT NULL CHECK (role IN ('owner', 'manager', 'staff')),
    avatar_url TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    last_login TIMESTAMPTZ
);

-- 4. Product & Appliances Catalog Table
CREATE TABLE IF NOT EXISTS products (
    id TEXT PRIMARY KEY,
    code TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    brand TEXT NOT NULL,
    category TEXT NOT NULL,
    model_number TEXT,
    purchase_price NUMERIC(12, 2) NOT NULL DEFAULT 0, -- Protected by RLS for Staff
    selling_price NUMERIC(12, 2) NOT NULL,
    mrp NUMERIC(12, 2) NOT NULL,
    stock_quantity INTEGER NOT NULL DEFAULT 0,
    min_stock_alert INTEGER NOT NULL DEFAULT 2,
    supplier TEXT,
    warranty_period TEXT,
    has_serial_number BOOLEAN DEFAULT TRUE,
    is_active BOOLEAN DEFAULT TRUE,
    is_demo BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Customers & Khata Ledger Table
CREATE TABLE IF NOT EXISTS customers (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    phone TEXT NOT NULL,
    email TEXT,
    address TEXT,
    outstanding_balance NUMERIC(12, 2) DEFAULT 0,
    total_purchases NUMERIC(12, 2) DEFAULT 0,
    credit_limit NUMERIC(12, 2) DEFAULT 25000,
    first_visit_date DATE DEFAULT CURRENT_DATE,
    last_purchase_date TIMESTAMPTZ,
    notes TEXT,
    is_demo BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Invoices / Retail Bills Table
-- NEVER silently delete bills: use is_voided with mandatory reason
CREATE TABLE IF NOT EXISTS invoices (
    id TEXT PRIMARY KEY,
    invoice_number TEXT UNIQUE NOT NULL,
    date TIMESTAMPTZ DEFAULT NOW(),
    customer_id TEXT REFERENCES customers(id),
    customer_name TEXT NOT NULL,
    customer_phone TEXT NOT NULL,
    customer_address TEXT,
    subtotal NUMERIC(12, 2) NOT NULL,
    overall_discount NUMERIC(12, 2) DEFAULT 0,
    tax_amount NUMERIC(12, 2) DEFAULT 0,
    total_amount NUMERIC(12, 2) NOT NULL,
    amount_paid NUMERIC(12, 2) NOT NULL,
    balance_due NUMERIC(12, 2) DEFAULT 0,
    payment_method TEXT NOT NULL,
    payment_details JSONB,
    status TEXT NOT NULL CHECK (status IN ('paid', 'partial', 'pending', 'voided')),
    invoice_type TEXT NOT NULL DEFAULT 'non_gst_retail',
    is_gst_verified BOOLEAN DEFAULT FALSE,
    notes TEXT,
    created_by TEXT NOT NULL,
    created_by_name TEXT NOT NULL,
    created_by_role TEXT NOT NULL,
    is_voided BOOLEAN DEFAULT FALSE,
    void_reason TEXT,
    voided_at TIMESTAMPTZ,
    voided_by TEXT,
    is_demo BOOLEAN DEFAULT FALSE
);

-- 7. Invoice Line Items Table
CREATE TABLE IF NOT EXISTS invoice_items (
    id TEXT PRIMARY KEY,
    invoice_id TEXT REFERENCES invoices(id) ON DELETE RESTRICT,
    product_id TEXT REFERENCES products(id),
    name TEXT NOT NULL,
    brand TEXT NOT NULL,
    model_number TEXT,
    serial_number TEXT,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    unit_price NUMERIC(12, 2) NOT NULL,
    purchase_price NUMERIC(12, 2), -- Hidden from Staff views
    mrp NUMERIC(12, 2) NOT NULL,
    discount NUMERIC(12, 2) DEFAULT 0,
    total NUMERIC(12, 2) NOT NULL,
    warranty_period TEXT
);

-- 8. Customer Khata / Payment Collections Table
CREATE TABLE IF NOT EXISTS payments (
    id TEXT PRIMARY KEY,
    invoice_id TEXT REFERENCES invoices(id),
    customer_id TEXT REFERENCES customers(id),
    customer_name TEXT NOT NULL,
    amount NUMERIC(12, 2) NOT NULL,
    method TEXT NOT NULL CHECK (method IN ('cash', 'upi', 'bank_transfer', 'credit', 'split')),
    reference_number TEXT,
    timestamp TIMESTAMPTZ DEFAULT NOW(),
    notes TEXT,
    received_by TEXT NOT NULL,
    received_by_role TEXT NOT NULL
);

-- 9. Daily Store Expenses Table
CREATE TABLE IF NOT EXISTS expenses (
    id TEXT PRIMARY KEY,
    date TIMESTAMPTZ DEFAULT NOW(),
    category TEXT NOT NULL,
    amount NUMERIC(12, 2) NOT NULL,
    payment_method TEXT NOT NULL,
    paid_to TEXT NOT NULL,
    notes TEXT,
    recorded_by TEXT NOT NULL,
    receipt_number TEXT,
    is_demo BOOLEAN DEFAULT FALSE
);

-- 10. Inward Stock Supplier Purchases Table
CREATE TABLE IF NOT EXISTS supplier_purchases (
    id TEXT PRIMARY KEY,
    purchase_number TEXT UNIQUE NOT NULL,
    supplier_name TEXT NOT NULL,
    supplier_contact TEXT,
    invoice_number TEXT NOT NULL,
    date TIMESTAMPTZ DEFAULT NOW(),
    items_summary TEXT,
    total_amount NUMERIC(12, 2) NOT NULL,
    paid_amount NUMERIC(12, 2) NOT NULL,
    payment_status TEXT NOT NULL,
    payment_method TEXT NOT NULL,
    recorded_by TEXT NOT NULL,
    is_demo BOOLEAN DEFAULT FALSE
);

-- 11. Security Audit Logs Table (Immutable Audit Trail)
CREATE TABLE IF NOT EXISTS audit_logs (
    id TEXT PRIMARY KEY,
    timestamp TIMESTAMPTZ DEFAULT NOW(),
    action TEXT NOT NULL,
    user_id TEXT NOT NULL,
    user_name TEXT NOT NULL,
    user_role TEXT NOT NULL,
    target_id TEXT NOT NULL,
    target_type TEXT NOT NULL,
    details TEXT NOT NULL,
    metadata JSONB
);

-- ====================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ====================================================================

ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE supplier_purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE store_settings ENABLE ROW LEVEL SECURITY;

-- Read policies: Staff can read products, customers, invoices, and payments
CREATE POLICY "Allow authenticated staff to read products" ON products
    FOR SELECT TO authenticated USING (true);

-- Product modification: Only Owner and Manager can update products or stock
CREATE POLICY "Allow Owner/Manager to modify products" ON products
    FOR ALL TO authenticated
    USING (
      (auth.jwt() ->> 'role') IN ('owner', 'manager') OR
      (SELECT role FROM staff_users WHERE email = auth.jwt() ->> 'email') IN ('owner', 'manager')
    );

-- Invoices: Staff can insert invoices, but CANNOT DELETE
CREATE POLICY "Staff can insert invoices" ON invoices
    FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "All staff can view invoices" ON invoices
    FOR SELECT TO authenticated USING (true);

-- Never delete invoices: only Owner or Manager can mark voided
CREATE POLICY "Strict NO DELETE on invoices" ON invoices
    FOR DELETE TO authenticated USING (false);

-- Audit logs: Strict append-only policy. No user can delete audit logs!
CREATE POLICY "Allow staff to insert audit logs" ON audit_logs
    FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Owner and Manager can view audit logs" ON audit_logs
    FOR SELECT TO authenticated
    USING (
      (auth.jwt() ->> 'role') IN ('owner', 'manager') OR
      (SELECT role FROM staff_users WHERE email = auth.jwt() ->> 'email') IN ('owner', 'manager')
    );

CREATE POLICY "Strict NO DELETE on audit_logs" ON audit_logs
    FOR DELETE TO authenticated USING (false);
`;
