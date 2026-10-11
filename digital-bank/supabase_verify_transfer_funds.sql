-- ==============================================================================
-- ZR DIGITAL BANK - READ-ONLY PRODUCTION VERIFICATION SCRIPT (FINAL)
-- Target Project: nrkgmudgecagtunfokte
-- Target Database: PostgreSQL (public schema)
--
-- EXECUTION INSTRUCTIONS:
-- 1. Open the Supabase Project Dashboard (https://supabase.com/dashboard/project/nrkgmudgecagtunfokte)
-- 2. Navigate to "SQL Editor" in the left sidebar.
-- 3. Paste and run this script.
-- 4. Confirm that verification_verdict returns 'ALL VERIFICATIONS PASSED - PRODUCTION READY'.
-- ==============================================================================

WITH exact_fn AS (
  -- Identify public.transfer_funds by its exact seven-argument identity signature.
  -- to_regprocedure returns NULL if the exact signature does not exist (NO arbitrary LIMIT 1).
  SELECT 
    p.oid AS fn_oid,
    p.prosecdef,
    p.proconfig,
    p.proacl,
    p.proowner,
    pg_get_userbyid(p.proowner) AS function_owner
  FROM pg_proc p
  WHERE p.oid = to_regprocedure('public.transfer_funds(text,text,numeric,text,text,text,text)')
),
overload_inventory AS (
  -- Count all functions named transfer_funds in schema public (reported separately).
  SELECT count(*) AS total_overloads
  FROM pg_proc p
  JOIN pg_namespace n ON p.pronamespace = n.oid
  WHERE n.nspname = 'public' 
    AND p.proname = 'transfer_funds'
),
checks AS (
  SELECT
    -- 1. Table public.transactions exists (Expected: TRUE)
    (SELECT EXISTS (
      SELECT 1 FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_name = 'transactions'
    )) AS transactions_table_exists,

    -- 2. Column idempotency_key exists on transactions (Expected: TRUE)
    (SELECT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema = 'public' 
        AND table_name = 'transactions' 
        AND column_name = 'idempotency_key'
    )) AS idempotency_column_exists,

    -- 3. Unique constraint on idempotency_key exists (Expected: TRUE)
    (SELECT EXISTS (
      SELECT 1 FROM pg_constraint 
      WHERE conname = 'transactions_idempotency_key_key' 
        AND conrelid = 'public.transactions'::regclass
    )) AS idempotency_constraint_exists,

    -- 4. Non-negative account balance constraint exists (Expected: TRUE)
    (SELECT EXISTS (
      SELECT 1 FROM pg_constraint 
      WHERE conname = 'accounts_balance_non_negative' 
        AND conrelid = 'public.accounts'::regclass
    )) AS balance_constraint_exists,

    -- 5. Exact transfer_funds function exists (Expected: TRUE)
    (SELECT (fn_oid IS NOT NULL) FROM exact_fn) AS exact_function_exists,

    -- 6. Total overloads count (Reported separately; does not fail solely on unrelated overloads)
    (SELECT total_overloads FROM overload_inventory) AS total_overloads_count,

    -- 7. Exact argument signature matches the expected specification
    (SELECT pg_get_function_identity_arguments(fn_oid) FROM exact_fn) AS exact_argument_signature,

    -- 8. Function is configured as SECURITY DEFINER (Expected: TRUE)
    (SELECT prosecdef FROM exact_fn) AS is_security_definer,

    -- 9. Function owner
    (SELECT function_owner FROM exact_fn) AS function_owner,

    -- 10. Configured search_path is safe and explicitly pinned (Expected: TRUE)
    (SELECT CASE 
       WHEN fn_oid IS NOT NULL AND proconfig IS NOT NULL 
       THEN 'search_path=public, pg_temp' = ANY(proconfig)
       ELSE FALSE
     END FROM exact_fn) AS is_search_path_secured,

    -- 11. Raw configured search path string
    (SELECT array_to_string(proconfig, ', ') FROM exact_fn) AS configured_search_path,

    -- 12. anon role cannot execute (Expected: FALSE - accounts for direct grants and inherited PUBLIC privileges)
    (SELECT CASE 
       WHEN fn_oid IS NOT NULL 
       THEN has_function_privilege('anon', fn_oid, 'EXECUTE')
       ELSE NULL 
     END FROM exact_fn) AS anon_can_execute,

    -- 13. authenticated role cannot execute (Expected: FALSE - accounts for direct grants and inherited PUBLIC privileges)
    (SELECT CASE 
       WHEN fn_oid IS NOT NULL 
       THEN has_function_privilege('authenticated', fn_oid, 'EXECUTE')
       ELSE NULL 
     END FROM exact_fn) AS authenticated_can_execute,

    -- 14. PUBLIC pseudo-role has EXECUTE revoked in ACL (Expected: FALSE)
    (SELECT CASE 
       WHEN fn_oid IS NOT NULL 
       THEN EXISTS (
         SELECT 1 
         FROM aclexplode(COALESCE(proacl, acldefault('f', proowner))) acl
         WHERE acl.grantee = 0 AND acl.privilege_type = 'EXECUTE'
       )
       ELSE NULL 
     END FROM exact_fn) AS public_acl_has_execute,

    -- 15. service_role has EXECUTE granted (Expected: TRUE - required for server-side execution)
    (SELECT CASE 
       WHEN fn_oid IS NOT NULL 
       THEN has_function_privilege('service_role', fn_oid, 'EXECUTE')
       ELSE NULL 
     END FROM exact_fn) AS service_role_can_execute
)
SELECT 
  transactions_table_exists,
  idempotency_column_exists,
  idempotency_constraint_exists,
  balance_constraint_exists,
  exact_function_exists,
  total_overloads_count,
  exact_argument_signature,
  is_security_definer,
  function_owner,
  is_search_path_secured,
  configured_search_path,
  anon_can_execute,
  authenticated_can_execute,
  public_acl_has_execute,
  service_role_can_execute,
  CASE 
    WHEN transactions_table_exists = true
     AND idempotency_column_exists = true
     AND idempotency_constraint_exists = true
     AND balance_constraint_exists = true
     AND exact_function_exists = true
     AND is_security_definer = true
     AND is_search_path_secured = true
     AND anon_can_execute = false
     AND authenticated_can_execute = false
     AND public_acl_has_execute = false
     AND service_role_can_execute = true
    THEN 'ALL VERIFICATIONS PASSED - PRODUCTION READY'
    ELSE 'VERIFICATION FAILED OR PENDING EXECUTION'
  END AS verification_verdict
FROM checks;
