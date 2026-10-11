-- ==============================================================================
-- ZR DIGITAL BANK - SUPABASE POSTGRESQL SCHEMA & INITIAL DATA
-- Copy and paste this script into your Supabase project's SQL Editor and click Run.
-- ==============================================================================

-- 1. Create Users Table
CREATE TABLE IF NOT EXISTS public.users (
  id TEXT PRIMARY KEY,
  full_name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  phone TEXT NOT NULL,
  date_of_birth TEXT NOT NULL,
  address TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'customer',
  avatar_url TEXT,
  password_hash TEXT NOT NULL,
  password_salt TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_login_at TIMESTAMPTZ
);

-- 2. Create Bank Accounts Table
CREATE TABLE IF NOT EXISTS public.accounts (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  account_number TEXT UNIQUE NOT NULL,
  account_type TEXT NOT NULL DEFAULT 'savings',
  currency TEXT NOT NULL DEFAULT 'BDT',
  balance NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
  available_balance NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Create Transactions Table
CREATE TABLE IF NOT EXISTS public.transactions (
  id TEXT PRIMARY KEY,
  transaction_reference TEXT UNIQUE NOT NULL,
  sender_account_id TEXT,
  sender_account_number TEXT,
  sender_name TEXT,
  sender_user_id TEXT,
  recipient_account_id TEXT,
  recipient_account_number TEXT,
  recipient_name TEXT,
  recipient_user_id TEXT,
  amount NUMERIC(15, 2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'BDT',
  type TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'other',
  description TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'completed',
  fee NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  metadata JSONB
);

-- 4. Create Beneficiaries Table
CREATE TABLE IF NOT EXISTS public.beneficiaries (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  account_number TEXT NOT NULL,
  account_holder_name TEXT NOT NULL,
  nickname TEXT NOT NULL,
  bank_name TEXT NOT NULL DEFAULT 'ZR Digital Bank',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. Create Bank Cards Table
CREATE TABLE IF NOT EXISTS public.cards (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  account_id TEXT NOT NULL REFERENCES public.accounts(id) ON DELETE CASCADE,
  card_number TEXT NOT NULL,
  card_holder_name TEXT NOT NULL,
  expiry_date TEXT NOT NULL,
  cvv_masked TEXT NOT NULL DEFAULT '***',
  type TEXT NOT NULL DEFAULT 'debit',
  card_network TEXT NOT NULL DEFAULT 'visa',
  status TEXT NOT NULL DEFAULT 'active',
  daily_limit NUMERIC(12, 2) NOT NULL DEFAULT 50000.00,
  contactless_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. Create Bill Providers Table
CREATE TABLE IF NOT EXISTS public.bill_providers (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  code TEXT NOT NULL UNIQUE,
  category TEXT NOT NULL,
  account_number_label TEXT NOT NULL,
  icon_name TEXT NOT NULL
);

-- 7. Create Bill Payment Records Table
CREATE TABLE IF NOT EXISTS public.bill_payments (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  account_id TEXT NOT NULL REFERENCES public.accounts(id) ON DELETE CASCADE,
  provider_id TEXT NOT NULL,
  provider_name TEXT NOT NULL,
  category TEXT NOT NULL,
  bill_customer_number TEXT NOT NULL,
  amount NUMERIC(15, 2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'BDT',
  transaction_id TEXT,
  status TEXT NOT NULL DEFAULT 'successful',
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 8. Create Notifications Table
CREATE TABLE IF NOT EXISTS public.notifications (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'system',
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  link TEXT
);

-- 9. Create Audit Logs Table
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id TEXT PRIMARY KEY,
  user_id TEXT,
  user_email TEXT,
  user_role TEXT,
  action TEXT NOT NULL,
  resource TEXT NOT NULL,
  details TEXT NOT NULL,
  ip_address TEXT,
  result TEXT NOT NULL DEFAULT 'SUCCESS',
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 10. Create Sessions Table
CREATE TABLE IF NOT EXISTS public.sessions (
  token TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL
);

-- ==============================================================================
-- ENABLE ACCESS & ROW LEVEL SECURITY POLICIES FOR THE REST API
-- ==============================================================================

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.beneficiaries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bill_providers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bill_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;

-- Allow anon and authenticated clients (our Express server API) full access to read and write
DO $$ 
BEGIN
  DROP POLICY IF EXISTS "Allow all for users" ON public.users;
  CREATE POLICY "Allow all for users" ON public.users FOR ALL USING (true) WITH CHECK (true);

  DROP POLICY IF EXISTS "Allow all for accounts" ON public.accounts;
  CREATE POLICY "Allow all for accounts" ON public.accounts FOR ALL USING (true) WITH CHECK (true);

  DROP POLICY IF EXISTS "Allow all for transactions" ON public.transactions;
  CREATE POLICY "Allow all for transactions" ON public.transactions FOR ALL USING (true) WITH CHECK (true);

  DROP POLICY IF EXISTS "Allow all for beneficiaries" ON public.beneficiaries;
  CREATE POLICY "Allow all for beneficiaries" ON public.beneficiaries FOR ALL USING (true) WITH CHECK (true);

  DROP POLICY IF EXISTS "Allow all for cards" ON public.cards;
  CREATE POLICY "Allow all for cards" ON public.cards FOR ALL USING (true) WITH CHECK (true);

  DROP POLICY IF EXISTS "Allow all for bill_providers" ON public.bill_providers;
  CREATE POLICY "Allow all for bill_providers" ON public.bill_providers FOR ALL USING (true) WITH CHECK (true);

  DROP POLICY IF EXISTS "Allow all for bill_payments" ON public.bill_payments;
  CREATE POLICY "Allow all for bill_payments" ON public.bill_payments FOR ALL USING (true) WITH CHECK (true);

  DROP POLICY IF EXISTS "Allow all for notifications" ON public.notifications;
  CREATE POLICY "Allow all for notifications" ON public.notifications FOR ALL USING (true) WITH CHECK (true);

  DROP POLICY IF EXISTS "Allow all for audit_logs" ON public.audit_logs;
  CREATE POLICY "Allow all for audit_logs" ON public.audit_logs FOR ALL USING (true) WITH CHECK (true);

  DROP POLICY IF EXISTS "Allow all for sessions" ON public.sessions;
  CREATE POLICY "Allow all for sessions" ON public.sessions FOR ALL USING (true) WITH CHECK (true);
END $$;

-- ==============================================================================
-- SEED INITIAL DEMO DATA
-- ==============================================================================

-- Seed Users
INSERT INTO public.users (id, full_name, email, phone, date_of_birth, address, role, password_hash, password_salt)
VALUES
  ('usr-admin-01', 'System Administrator (HQ)', 'admin@zrbank.com', '+880 1711-000001', '1988-03-15', 'ZR Tower, Level 18, Gulshan Avenue, Dhaka-1212', 'admin', '4af82cce5d8d73e1a74c1c09ae60d89f3ff26442991402fc85c834eaf808c4b75afa97885a6126a87b648704372f5d1d59587da316bef0d3199936b299e2ef0f', 'a30e912c8749c4a69f9482e6bda2491f'),
  ('usr-cust-01', 'Zunaed Ahmed', 'zunaed@example.com', '+880 1712-345678', '1995-06-20', 'House 42, Road 11, Banani, Dhaka-1213', 'customer', 'd99d849529de804c4f9d2ef1fb1818165c6a1e0f3b175801dc5fa3ac0011f42fd31495727cbf585aba038d1bc6ec9f9b51d4014edb52311949dc255f6546314b', '4190ffcc29d00f032dec53807601deff'),
  ('usr-cust-02', 'Md Rahim Uddin', 'rahim@example.com', '+880 1819-234567', '1992-11-14', 'Flat 4B, Concord Tower, Dhanmondi 27, Dhaka-1209', 'customer', 'b2174e7c72e6a8f18deb59bc0067e4a612d0e51e9805eddd85d19148435cb339c6a4d421ae667365b2f471298f907105440720a12ed980aef4c08ae50bfa36a4', '68dcdb674eff7b3c30e9d9c7ac404d25'),
  ('usr-cust-03', 'Nusrat Jahan', 'nusrat@example.com', '+880 1914-567890', '1998-04-05', 'Plot 15, Sector 7, Uttara, Dhaka-1230', 'customer', '648eede9406b89e591b61432fc100f9697b3a09b58588bb76ed6058696c205e5fff21a1b6e5904ea4f2ea48237d14e754deacf177d91143ed553657af16657cb', '420defc1b93b388295be25cc62b47e85')
ON CONFLICT (id) DO NOTHING;

-- Seed Accounts
INSERT INTO public.accounts (id, user_id, account_number, account_type, currency, balance, available_balance, status)
VALUES
  ('acc-admin-01', 'usr-admin-01', 'ZR-1000-0001', 'checking', 'BDT', 500000.00, 500000.00, 'active'),
  ('acc-cust-01', 'usr-cust-01', 'ZR-8849-2041', 'savings', 'BDT', 125400.00, 125400.00, 'active'),
  ('acc-cust-02', 'usr-cust-02', 'ZR-3391-7720', 'savings', 'BDT', 48200.00, 48200.00, 'active'),
  ('acc-cust-03', 'usr-cust-03', 'ZR-5512-9904', 'savings', 'BDT', 92000.00, 92000.00, 'active')
ON CONFLICT (id) DO NOTHING;

-- Seed Cards
INSERT INTO public.cards (id, user_id, account_id, card_number, card_holder_name, expiry_date, cvv_masked, type, card_network, status, daily_limit, contactless_enabled)
VALUES
  ('crd-01', 'usr-cust-01', 'acc-cust-01', '4532 8821 9934 8841', 'ZUNAED AHMED', '08/29', '***', 'debit', 'visa', 'active', 50000.00, TRUE),
  ('crd-02', 'usr-cust-01', 'acc-cust-01', '5241 1092 3381 2049', 'ZUNAED AHMED', '11/30', '***', 'credit', 'mastercard', 'active', 100000.00, TRUE)
ON CONFLICT (id) DO NOTHING;

-- Seed Bill Providers
INSERT INTO public.bill_providers (id, name, code, category, account_number_label, icon_name)
VALUES
  ('bp-01', 'DPDC Electricity', 'DPDC', 'electricity', 'Customer Number / Meter No', 'Zap'),
  ('bp-02', 'DESCO Electricity', 'DESCO', 'electricity', 'Account No (8 digits)', 'Zap'),
  ('bp-03', 'Titas Gas Transmission', 'TITAS', 'gas', 'Customer Code', 'Flame'),
  ('bp-04', 'Dhaka WASA Water', 'DWASA', 'water', 'Bill Account No', 'Droplets'),
  ('bp-05', 'Carnival Internet Broadband', 'CARNIVAL', 'internet', 'Subscriber ID', 'Wifi'),
  ('bp-06', 'Grameenphone Postpaid/Prepaid', 'GP', 'mobile_recharge', 'Mobile Number (11 digits)', 'Smartphone'),
  ('bp-07', 'Banglalink Top-up', 'BL', 'mobile_recharge', 'Mobile Number (11 digits)', 'Smartphone'),
  ('bp-08', 'Robi Axiata', 'ROBI', 'mobile_recharge', 'Mobile Number (11 digits)', 'Smartphone')
ON CONFLICT (id) DO NOTHING;

-- Seed Transactions
INSERT INTO public.transactions (id, transaction_reference, sender_account_id, sender_account_number, sender_name, sender_user_id, recipient_account_id, recipient_account_number, recipient_name, recipient_user_id, amount, currency, type, category, description, status, fee, timestamp)
VALUES
  ('txn-01', 'TXN-20261001-1001', NULL, NULL, 'ZR Treasury Payroll', NULL, 'acc-cust-01', 'ZR-8849-2041', 'Zunaed Ahmed', 'usr-cust-01', 75000.00, 'BDT', 'deposit', 'salary', 'Monthly Salary Deposit - October 2026', 'completed', 0.00, '2026-10-01T09:00:00Z'),
  ('txn-02', 'TXN-20261002-2004', 'acc-cust-01', 'ZR-8849-2041', 'Zunaed Ahmed', 'usr-cust-01', 'acc-cust-02', 'ZR-3391-7720', 'Md Rahim Uddin', 'usr-cust-02', 15000.00, 'BDT', 'transfer_out', 'transfer', 'Office project equipment reimbursement', 'completed', 0.00, '2026-10-02T14:30:00Z'),
  ('txn-03', 'TXN-20261003-3008', 'acc-cust-01', 'ZR-8849-2041', 'Zunaed Ahmed', 'usr-cust-01', NULL, 'DPDC-10928374', 'DPDC Electricity', NULL, 3450.00, 'BDT', 'bill_payment', 'electricity', 'DPDC Electricity Bill Payment', 'completed', 0.00, '2026-10-03T11:15:00Z')
ON CONFLICT (id) DO NOTHING;

-- Seed Notifications
INSERT INTO public.notifications (id, user_id, title, message, type, is_read, timestamp)
VALUES
  ('notif-01', 'usr-cust-01', 'Supabase Cloud Database Connected', 'Your ZR Digital Bank account is now synced with Supabase PostgreSQL cloud storage.', 'system', FALSE, NOW()),
  ('notif-02', 'usr-cust-01', 'Salary Credited', 'Your account ZR-8849-2041 was credited with ৳75,000.00 for October 2026 salary.', 'transfer', TRUE, '2026-10-01T09:00:00Z')
ON CONFLICT (id) DO NOTHING;
