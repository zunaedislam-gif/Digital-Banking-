-- ==============================================================================
-- ZR DIGITAL BANK - PRE-MIGRATION READ-ONLY SCHEMA & DATA INSPECTION SCRIPT
-- Target Project: nrkgmudgecagtunfokte
-- Target Database: PostgreSQL (public schema)
--
-- EXECUTION INSTRUCTIONS:
-- 1. Open Supabase Dashboard -> SQL Editor (https://supabase.com/dashboard/project/nrkgmudgecagtunfokte)
-- 2. Paste and run this script BEFORE running supabase_transfer_funds_migration.sql.
-- 3. Review the outputs to verify all pre-migration assumptions.
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- QUERY 1: CORE TABLES EXISTENCE AND ROW COUNTS
-- ------------------------------------------------------------------------------
SELECT 
  t.table_name,
  EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = t.table_name
  ) AS table_exists,
  CASE 
    WHEN t.table_name = 'users' THEN (SELECT count(*) FROM public.users)
    WHEN t.table_name = 'accounts' THEN (SELECT count(*) FROM public.accounts)
    WHEN t.table_name = 'transactions' THEN (SELECT count(*) FROM public.transactions)
    WHEN t.table_name = 'sessions' THEN (SELECT count(*) FROM public.sessions)
    WHEN t.table_name = 'notifications' THEN (SELECT count(*) FROM public.notifications)
    WHEN t.table_name = 'audit_logs' THEN (SELECT count(*) FROM public.audit_logs)
    ELSE 0
  END AS live_row_count
FROM (
  VALUES 
    ('users'),
    ('accounts'),
    ('transactions'),
    ('sessions'),
    ('notifications'),
    ('audit_logs')
) AS t(table_name);

-- ------------------------------------------------------------------------------
-- QUERY 2: IDEMPOTENCY COLUMN STATUS & DUPLICATE CHECK IN transactions
-- ------------------------------------------------------------------------------
SELECT 
  EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = 'transactions' 
      AND column_name = 'idempotency_key'
  ) AS idempotency_column_already_exists,
  EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'transactions_idempotency_key_key' 
      AND conrelid = 'public.transactions'::regclass
  ) AS idempotency_unique_constraint_exists;

-- ------------------------------------------------------------------------------
-- QUERY 3: ACCOUNTS BALANCE INVARIANT & CHECK CONSTRAINT COMPATIBILITY
-- ------------------------------------------------------------------------------
SELECT 
  count(*) AS total_accounts,
  count(*) FILTER (WHERE balance < 0) AS accounts_with_negative_balance,
  count(*) FILTER (WHERE available_balance < 0) AS accounts_with_negative_available_balance,
  MIN(balance) AS min_balance,
  MAX(balance) AS max_balance,
  MIN(available_balance) AS min_available_balance,
  MAX(available_balance) AS max_available_balance,
  EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'accounts_balance_non_negative' 
      AND conrelid = 'public.accounts'::regclass
  ) AS balance_constraint_already_exists,
  CASE 
    WHEN count(*) FILTER (WHERE balance < 0 OR available_balance < 0) = 0 
    THEN 'SAFE TO APPLY accounts_balance_non_negative CHECK CONSTRAINT'
    ELSE 'UNSAFE: EXISTING ROWS VIOLATE NON-NEGATIVE INVARIANT'
  END AS check_constraint_safety_verdict
FROM public.accounts;

-- ------------------------------------------------------------------------------
-- QUERY 4: USER-TO-ACCOUNT MULTIPLICITY CHECK
-- ------------------------------------------------------------------------------
SELECT 
  count(DISTINCT user_id) AS total_users_with_accounts,
  MAX(accounts_per_user) AS max_accounts_per_single_user,
  count(*) FILTER (WHERE accounts_per_user > 1) AS users_with_multiple_accounts
FROM (
  SELECT user_id, count(*) AS accounts_per_user
  FROM public.accounts
  GROUP BY user_id
) sub;

-- ------------------------------------------------------------------------------
-- QUERY 5: EXISTING FUNCTION OVERLOADS FOR public.transfer_funds
-- ------------------------------------------------------------------------------
SELECT 
  p.proname AS function_name,
  pg_get_function_identity_arguments(p.oid) AS argument_signature,
  pg_get_userbyid(p.proowner) AS owner,
  p.prosecdef AS is_security_definer,
  array_to_string(p.proconfig, ', ') AS search_path_settings,
  has_function_privilege('anon', p.oid, 'EXECUTE') AS anon_can_execute,
  has_function_privilege('authenticated', p.oid, 'EXECUTE') AS authenticated_can_execute,
  has_function_privilege('service_role', p.oid, 'EXECUTE') AS service_role_can_execute
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public' 
  AND p.proname = 'transfer_funds';
