-- ==============================================================================
-- ZR DIGITAL BANK - PRODUCTION ATOMIC TRANSFER & IDEMPOTENCY MIGRATION (FINAL)
-- Project Reference: nrkgmudgecagtunfokte
-- Target Database: PostgreSQL (public schema)
--
-- EXECUTION INSTRUCTIONS:
-- 1. Open the Supabase Project Dashboard (https://supabase.com/dashboard/project/nrkgmudgecagtunfokte)
-- 2. Navigate to "SQL Editor" in the left sidebar.
-- 3. Create a "New Query", paste this entire script, and click "Run".
-- 4. Execute supabase_verify_transfer_funds.sql to verify the deployed state.
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. PREFLIGHT SAFETY CHECKS, CONSTRAINTS & IDEMPOTENCY COLUMN
-- ------------------------------------------------------------------------------
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'transactions'
  ) THEN
    RAISE EXCEPTION 'Preflight failed: public.transactions table does not exist.';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'accounts'
  ) THEN
    RAISE EXCEPTION 'Preflight failed: public.accounts table does not exist.';
  END IF;
END $$;

ALTER TABLE public.transactions 
ADD COLUMN IF NOT EXISTS idempotency_key TEXT;

DO $$
DECLARE
  v_dup_count INT;
BEGIN
  SELECT count(*) INTO v_dup_count
  FROM (
    SELECT idempotency_key
    FROM public.transactions
    WHERE idempotency_key IS NOT NULL
    GROUP BY idempotency_key
    HAVING count(*) > 1
  ) dups;

  IF v_dup_count > 0 THEN
    RAISE EXCEPTION 'Cannot enforce unique constraint: % duplicate non-null idempotency_key values exist in transactions.', v_dup_count;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'transactions_idempotency_key_key' 
      AND conrelid = 'public.transactions'::regclass
  ) THEN
    ALTER TABLE public.transactions 
    ADD CONSTRAINT transactions_idempotency_key_key UNIQUE (idempotency_key);
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_transactions_idempotency_key 
ON public.transactions(idempotency_key);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'accounts_balance_non_negative' 
      AND conrelid = 'public.accounts'::regclass
  ) THEN
    ALTER TABLE public.accounts 
    ADD CONSTRAINT accounts_balance_non_negative CHECK (balance >= 0 AND available_balance >= 0);
  END IF;
END $$;

-- ------------------------------------------------------------------------------
-- 2. CLEAN UP PRIOR FUNCTION OVERLOADS
-- ------------------------------------------------------------------------------
DROP FUNCTION IF EXISTS public.transfer_funds(TEXT, TEXT, NUMERIC, TEXT, TEXT, TEXT);
DROP FUNCTION IF EXISTS public.transfer_funds(TEXT, TEXT, NUMERIC, TEXT, TEXT, TEXT, TEXT);

-- ------------------------------------------------------------------------------
-- 3. CREATE ATOMIC transfer_funds FUNCTION
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.transfer_funds(
  p_sender_user_id TEXT,
  p_recipient_account_number TEXT,
  p_amount NUMERIC,
  p_session_token TEXT,
  p_description TEXT DEFAULT '',
  p_idempotency_key TEXT DEFAULT NULL,
  p_client_ip TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_clean_idemp TEXT;
  v_clean_recipient_acc TEXT;
  v_clean_session_token TEXT;
  v_session RECORD;
  v_sender_user RECORD;
  v_sender_account RECORD;
  v_recipient_account RECORD;
  v_recipient_user RECORD;
  v_existing_txn RECORD;
  v_txn_id TEXT;
  v_txn_ref TEXT;
  v_sender_new_balance NUMERIC;
  v_sender_new_avail NUMERIC;
  v_recipient_new_balance NUMERIC;
  v_recipient_new_avail NUMERIC;
  v_locked_rows INT;
  v_err_constraint TEXT;
  v_now TIMESTAMPTZ := NOW();
BEGIN
  -- 1. Input Sanitization
  IF p_amount IS NULL OR p_amount <= 0 OR p_amount != p_amount THEN
    RETURN jsonb_build_object(
      'success', false,
      'code', 'INVALID_AMOUNT',
      'message', 'Transfer amount must be a positive number greater than zero.'
    );
  END IF;

  v_clean_recipient_acc := UPPER(TRIM(COALESCE(p_recipient_account_number, '')));
  IF v_clean_recipient_acc = '' THEN
    RETURN jsonb_build_object(
      'success', false,
      'code', 'INVALID_RECIPIENT',
      'message', 'Recipient account number is required.'
    );
  END IF;

  v_clean_session_token := NULLIF(TRIM(COALESCE(p_session_token, '')), '');
  v_clean_idemp := NULLIF(TRIM(COALESCE(p_idempotency_key, '')), '');

  -- 2. Strict Session Authentication
  IF v_clean_session_token IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'code', 'SESSION_REQUIRED',
      'message', 'Transfer authorization failed: valid active session token is required.'
    );
  END IF;

  SELECT * INTO v_session
  FROM public.sessions
  WHERE token = v_clean_session_token;

  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'code', 'UNAUTHORIZED_SESSION',
      'message', 'Transfer authorization failed: session does not exist or has been revoked.'
    );
  END IF;

  IF v_session.expires_at <= NOW() THEN
    RETURN jsonb_build_object(
      'success', false,
      'code', 'SESSION_EXPIRED',
      'message', 'Transfer authorization failed: session has expired. Please sign in again.'
    );
  END IF;

  IF v_session.user_id <> p_sender_user_id THEN
    RETURN jsonb_build_object(
      'success', false,
      'code', 'UNAUTHORIZED_SESSION',
      'message', 'Transfer authorization failed: session does not belong to the requested sender.'
    );
  END IF;

  SELECT * INTO v_sender_user FROM public.users WHERE id = p_sender_user_id;
  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'code', 'SENDER_NOT_FOUND',
      'message', 'Sender profile could not be verified.'
    );
  END IF;

  SELECT * INTO v_sender_account 
  FROM public.accounts 
  WHERE user_id = p_sender_user_id 
  ORDER BY created_at ASC 
  LIMIT 1;
  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'code', 'SENDER_ACCOUNT_NOT_FOUND',
      'message', 'Sender bank account not found.'
    );
  END IF;

  IF v_sender_account.status <> 'active' THEN
    RETURN jsonb_build_object(
      'success', false,
      'code', 'SENDER_ACCOUNT_INACTIVE',
      'message', 'Your account is currently ' || v_sender_account.status || '. Transfers are disabled.'
    );
  END IF;

  -- 3. Idempotency Check, Lock & Authorized Replay
  --    If a non-null idempotency key is supplied, serialize on the advisory lock.
  IF v_clean_idemp IS NOT NULL THEN
    PERFORM pg_advisory_xact_lock(hashtext('idemp:' || v_clean_idemp));

    SELECT * INTO v_existing_txn 
    FROM public.transactions 
    WHERE idempotency_key = v_clean_idemp;

    IF FOUND THEN
      -- Replay Authorization: verify the key belongs to the current sender and account
      IF v_existing_txn.sender_user_id <> p_sender_user_id OR 
         v_existing_txn.sender_account_id <> v_sender_account.id THEN
        RETURN jsonb_build_object(
          'success', false,
          'code', 'IDEMPOTENCY_CONFLICT',
          'message', 'Idempotency key was previously used by a different account or user.'
        );
      END IF;

      -- Verify payload matches original transaction parameters
      IF v_existing_txn.amount <> p_amount OR 
         UPPER(COALESCE(v_existing_txn.recipient_account_number, '')) <> v_clean_recipient_acc THEN
        RETURN jsonb_build_object(
          'success', false,
          'code', 'IDEMPOTENCY_CONFLICT',
          'message', 'Idempotency key was previously used with different transfer parameters (amount or recipient).'
        );
      END IF;

      -- Lock and re-validate sender account under lock before returning replay
      PERFORM id FROM public.accounts WHERE id = v_sender_account.id FOR UPDATE;
      SELECT * INTO v_sender_account FROM public.accounts WHERE id = v_sender_account.id;

      IF v_sender_account.status <> 'active' THEN
        RETURN jsonb_build_object(
          'success', false,
          'code', 'SENDER_ACCOUNT_INACTIVE',
          'message', 'Your account is currently ' || v_sender_account.status || '. Transfers are disabled.'
        );
      END IF;

      IF v_sender_account.user_id <> p_sender_user_id THEN
        RETURN jsonb_build_object(
          'success', false,
          'code', 'SENDER_ACCOUNT_NOT_FOUND',
          'message', 'Sender account ownership verification failed.'
        );
      END IF;

      -- PRIVACY: Return sender balance only. Never expose recipient balance.
      RETURN jsonb_build_object(
        'success', true,
        'code', 'IDEMPOTENT_REPLAY',
        'is_idempotent_replay', true,
        'message', 'Transfer already processed.',
        'transaction', jsonb_build_object(
          'id', v_existing_txn.id,
          'transactionReference', v_existing_txn.transaction_reference,
          'senderAccountId', v_existing_txn.sender_account_id,
          'senderAccountNumber', v_existing_txn.sender_account_number,
          'senderName', v_existing_txn.sender_name,
          'senderUserId', v_existing_txn.sender_user_id,
          'recipientAccountId', v_existing_txn.recipient_account_id,
          'recipientAccountNumber', v_existing_txn.recipient_account_number,
          'recipientName', v_existing_txn.recipient_name,
          'recipientUserId', v_existing_txn.recipient_user_id,
          'amount', v_existing_txn.amount,
          'currency', v_existing_txn.currency,
          'type', v_existing_txn.type,
          'category', v_existing_txn.category,
          'description', v_existing_txn.description,
          'status', v_existing_txn.status,
          'fee', v_existing_txn.fee,
          'timestamp', v_existing_txn.timestamp
        ),
        'updated_balance', v_sender_account.available_balance,
        'updated_ledger_balance', v_sender_account.balance
      );
    END IF;
  END IF;

  -- 4. Recipient Validation & Self-Transfer Prohibition
  IF UPPER(v_sender_account.account_number) = v_clean_recipient_acc THEN
    RETURN jsonb_build_object(
      'success', false,
      'code', 'SELF_TRANSFER_PROHIBITED',
      'message', 'Cannot transfer money to your own current account number.'
    );
  END IF;

  SELECT * INTO v_recipient_account 
  FROM public.accounts 
  WHERE UPPER(account_number) = v_clean_recipient_acc;

  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'code', 'RECIPIENT_NOT_FOUND',
      'message', 'Recipient account number does not exist in ZR Digital Bank.'
    );
  END IF;

  SELECT * INTO v_recipient_user FROM public.users WHERE id = v_recipient_account.user_id;
  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'code', 'RECIPIENT_NOT_FOUND',
      'message', 'Recipient account profile could not be verified.'
    );
  END IF;

  -- 5. Deterministic Row Locking & Post-Lock Re-validation
  PERFORM id
  FROM public.accounts
  WHERE id IN (v_sender_account.id, v_recipient_account.id)
  ORDER BY id
  FOR UPDATE;

  GET DIAGNOSTICS v_locked_rows = ROW_COUNT;
  IF v_locked_rows <> 2 THEN
    RETURN jsonb_build_object(
      'success', false,
      'code', 'CONCURRENT_LOCK_FAILED',
      'message', 'Unable to lock both sender and recipient accounts for atomic transfer.'
    );
  END IF;

  SELECT * INTO v_sender_account FROM public.accounts WHERE id = v_sender_account.id;
  SELECT * INTO v_recipient_account FROM public.accounts WHERE id = v_recipient_account.id;

  IF v_sender_account.status <> 'active' THEN
    RETURN jsonb_build_object(
      'success', false,
      'code', 'SENDER_ACCOUNT_INACTIVE',
      'message', 'Your account is currently ' || v_sender_account.status || '. Transfers are disabled.'
    );
  END IF;

  IF v_sender_account.user_id <> p_sender_user_id THEN
    RETURN jsonb_build_object(
      'success', false,
      'code', 'SENDER_ACCOUNT_NOT_FOUND',
      'message', 'Sender account ownership verification failed.'
    );
  END IF;

  IF v_recipient_account.status <> 'active' THEN
    RETURN jsonb_build_object(
      'success', false,
      'code', 'RECIPIENT_INACTIVE',
      'message', 'The recipient account is not active and cannot receive transfers.'
    );
  END IF;

  -- Funds Check: verify available balance and non-negative invariants under lock
  IF v_sender_account.available_balance < p_amount OR 
     (v_sender_account.available_balance - p_amount) < 0 OR
     (v_sender_account.balance - p_amount) < 0 THEN

    INSERT INTO public.audit_logs (
      id, user_id, user_email, user_role, action, resource, details, ip_address, result, timestamp
    ) VALUES (
      'log-' || gen_random_uuid()::text,
      v_sender_user.id,
      v_sender_user.email,
      v_sender_user.role,
      'FUND_TRANSFER_FAILED',
      v_sender_account.account_number,
      'Insufficient balance: attempted ৳' || p_amount::text || ', available ৳' || v_sender_account.available_balance::text,
      p_client_ip,
      'FAILURE',
      v_now
    );

    RETURN jsonb_build_object(
      'success', false,
      'code', 'INSUFFICIENT_BALANCE',
      'message', 'Insufficient balance. Available: ৳' || v_sender_account.available_balance::text
    );
  END IF;

  -- 6. Atomic Mutation Block with Savepoint Protection
  --    If a unique_violation occurs during insertion, the sub-block savepoint
  --    automatically undoes the balance updates so NO partial mutations persist.
  BEGIN
    -- Both ledger balance and available balance are adjusted by the same delta
    UPDATE public.accounts
    SET balance = balance - p_amount,
        available_balance = available_balance - p_amount
    WHERE id = v_sender_account.id
    RETURNING balance, available_balance INTO v_sender_new_balance, v_sender_new_avail;

    UPDATE public.accounts
    SET balance = balance + p_amount,
        available_balance = available_balance + p_amount
    WHERE id = v_recipient_account.id
    RETURNING balance, available_balance INTO v_recipient_new_balance, v_recipient_new_avail;

    -- Generate robust collision-free identifiers
    v_txn_id := 'txn-' || gen_random_uuid()::text;
    v_txn_ref := 'TXN-' || to_char(v_now, 'YYYYMMDD-HH24MISS-') || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 10));

    INSERT INTO public.transactions (
      id,
      transaction_reference,
      sender_account_id,
      sender_account_number,
      sender_name,
      sender_user_id,
      recipient_account_id,
      recipient_account_number,
      recipient_name,
      recipient_user_id,
      amount,
      currency,
      type,
      category,
      description,
      status,
      fee,
      timestamp,
      idempotency_key,
      metadata
    ) VALUES (
      v_txn_id,
      v_txn_ref,
      v_sender_account.id,
      v_sender_account.account_number,
      v_sender_user.full_name,
      v_sender_user.id,
      v_recipient_account.id,
      v_recipient_account.account_number,
      COALESCE(v_recipient_user.full_name, 'Account Holder'),
      v_recipient_account.user_id,
      p_amount,
      'BDT',
      'transfer_out',
      'transfer',
      COALESCE(NULLIF(TRIM(p_description), ''), 'Transfer to ' || COALESCE(v_recipient_user.full_name, 'Account Holder')),
      'completed',
      0.00,
      v_now,
      v_clean_idemp,
      jsonb_build_object('clientIp', p_client_ip)
    );

    INSERT INTO public.notifications (id, user_id, title, message, type, is_read, timestamp)
    VALUES (
      'notif-' || gen_random_uuid()::text,
      v_sender_user.id,
      'Transfer Sent',
      'You successfully sent ৳' || to_char(p_amount, 'FM999,999,990.00') || ' to ' || COALESCE(v_recipient_user.full_name, 'Account Holder') || ' (' || v_recipient_account.account_number || ').',
      'transfer',
      false,
      v_now
    );

    INSERT INTO public.notifications (id, user_id, title, message, type, is_read, timestamp)
    VALUES (
      'notif-' || gen_random_uuid()::text,
      v_recipient_account.user_id,
      'Money Received',
      'You received ৳' || to_char(p_amount, 'FM999,999,990.00') || ' from ' || v_sender_user.full_name || '.',
      'transfer',
      false,
      v_now
    );

    INSERT INTO public.audit_logs (
      id, user_id, user_email, user_role, action, resource, details, ip_address, result, timestamp
    ) VALUES (
      'log-' || gen_random_uuid()::text,
      v_sender_user.id,
      v_sender_user.email,
      v_sender_user.role,
      'FUND_TRANSFER',
      v_txn_ref,
      'Transferred ৳' || to_char(p_amount, 'FM999,999,990.00') || ' to ' || v_recipient_account.account_number || ' (' || COALESCE(v_recipient_user.full_name, 'Recipient') || ').',
      p_client_ip,
      'SUCCESS',
      v_now
    );

  EXCEPTION WHEN unique_violation THEN
    GET STACKED DIAGNOSTICS v_err_constraint = CONSTRAINT_NAME;

    -- If a unique violation specifically occurs on idempotency_key for a non-null key:
    -- The sub-block savepoint automatically rolls back our balance mutations.
    IF v_clean_idemp IS NOT NULL AND v_err_constraint = 'transactions_idempotency_key_key' THEN
      SELECT * INTO v_existing_txn FROM public.transactions WHERE idempotency_key = v_clean_idemp;
      IF FOUND AND v_existing_txn.sender_user_id = p_sender_user_id AND v_existing_txn.amount = p_amount THEN
        SELECT balance, available_balance INTO v_sender_new_balance, v_sender_new_avail
        FROM public.accounts WHERE id = v_sender_account.id;

        RETURN jsonb_build_object(
          'success', true,
          'code', 'IDEMPOTENT_REPLAY',
          'is_idempotent_replay', true,
          'message', 'Transfer already processed.',
          'transaction', jsonb_build_object(
            'id', v_existing_txn.id,
            'transactionReference', v_existing_txn.transaction_reference,
            'senderAccountId', v_existing_txn.sender_account_id,
            'senderAccountNumber', v_existing_txn.sender_account_number,
            'senderName', v_existing_txn.sender_name,
            'senderUserId', v_existing_txn.sender_user_id,
            'recipientAccountId', v_existing_txn.recipient_account_id,
            'recipientAccountNumber', v_existing_txn.recipient_account_number,
            'recipientName', v_existing_txn.recipient_name,
            'recipientUserId', v_existing_txn.recipient_user_id,
            'amount', v_existing_txn.amount,
            'currency', v_existing_txn.currency,
            'type', v_existing_txn.type,
            'category', v_existing_txn.category,
            'description', v_existing_txn.description,
            'status', v_existing_txn.status,
            'fee', v_existing_txn.fee,
            'timestamp', v_existing_txn.timestamp
          ),
          'updated_balance', v_sender_new_avail,
          'updated_ledger_balance', v_sender_new_balance
        );
      ELSE
        RETURN jsonb_build_object(
          'success', false,
          'code', 'IDEMPOTENCY_CONFLICT',
          'message', 'Concurrent transfer conflict on idempotency key.'
        );
      END IF;
    ELSE
      -- Any other unique violation (or NULL idempotency key) re-raises to roll back all changes
      RAISE;
    END IF;
  END;

  -- 7. Return Clean Response (Sender Balances Only)
  RETURN jsonb_build_object(
    'success', true,
    'code', 'SUCCESS',
    'is_idempotent_replay', false,
    'message', 'Transfer successful.',
    'transaction', jsonb_build_object(
      'id', v_txn_id,
      'transactionReference', v_txn_ref,
      'senderAccountId', v_sender_account.id,
      'senderAccountNumber', v_sender_account.account_number,
      'senderName', v_sender_user.full_name,
      'senderUserId', v_sender_user.id,
      'recipientAccountId', v_recipient_account.id,
      'recipientAccountNumber', v_recipient_account.account_number,
      'recipientName', COALESCE(v_recipient_user.full_name, 'Account Holder'),
      'recipientUserId', v_recipient_account.user_id,
      'amount', p_amount,
      'currency', 'BDT',
      'type', 'transfer_out',
      'category', 'transfer',
      'description', COALESCE(NULLIF(TRIM(p_description), ''), 'Transfer to ' || COALESCE(v_recipient_user.full_name, 'Account Holder')),
      'status', 'completed',
      'fee', 0.00,
      'timestamp', v_now
    ),
    'updated_balance', v_sender_new_avail,
    'updated_ledger_balance', v_sender_new_balance
  );
END;
$$;

-- ------------------------------------------------------------------------------
-- 4. RESTRICTED DATABASE PERMISSIONS & EXECUTION PRIVILEGES
-- ------------------------------------------------------------------------------
REVOKE ALL ON FUNCTION public.transfer_funds(TEXT, TEXT, NUMERIC, TEXT, TEXT, TEXT, TEXT) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.transfer_funds(TEXT, TEXT, NUMERIC, TEXT, TEXT, TEXT, TEXT) FROM anon;
REVOKE ALL ON FUNCTION public.transfer_funds(TEXT, TEXT, NUMERIC, TEXT, TEXT, TEXT, TEXT) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.transfer_funds(TEXT, TEXT, NUMERIC, TEXT, TEXT, TEXT, TEXT) TO service_role;

-- ------------------------------------------------------------------------------
-- 5. RELOAD POSTGREST SCHEMA CACHE
-- ------------------------------------------------------------------------------
NOTIFY pgrst, 'reload schema';
