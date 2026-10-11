
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import {
  User,
  BankAccount,
  Transaction,
  Beneficiary,
  BankCard,
  BillProvider,
  BillPaymentRecord,
  NotificationItem,
  AuditLog,
} from '../../src/types/banking.js';
import { StoredUser } from './seedData.js';

dotenv.config();

const SUPABASE_URL = process.env.SUPABASE_URL || '';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || '';
const SUPABASE_SERVICE_ROLE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const validUrl = Boolean(
  SUPABASE_URL.startsWith('https://') &&
  SUPABASE_URL.includes('.supabase.co')
);

export const isSupabaseConfigured = (): boolean =>
  validUrl && Boolean(SUPABASE_SERVICE_ROLE_KEY || SUPABASE_ANON_KEY);

let clientInstance: SupabaseClient | null = null;
let adminClientInstance: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient | null {
  if (!isSupabaseConfigured()) return null;

  if (!clientInstance) {
    const key = SUPABASE_SERVICE_ROLE_KEY || SUPABASE_ANON_KEY;

    clientInstance = createClient(SUPABASE_URL, key, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });
  }

  return clientInstance;
}

function getSupabaseAdminClient(): SupabaseClient | null {
  if (!validUrl || !SUPABASE_SERVICE_ROLE_KEY) return null;

  if (!adminClientInstance) {
    adminClientInstance = createClient(
      SUPABASE_URL,
      SUPABASE_SERVICE_ROLE_KEY,
      {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        },
      }
    );
  }

  return adminClientInstance;
}

export interface SupabaseHealth {
  configured: boolean;
  connected: boolean;
  projectUrl: string;
  tablesAvailable: {
    users: boolean;
    accounts: boolean;
    transactions: boolean;
    beneficiaries: boolean;
    cards: boolean;
    notifications: boolean;
    audit_logs: boolean;
  };
  lastChecked: string;
  error?: string;
}

export async function checkSupabaseStatus(): Promise<SupabaseHealth> {
  const status: SupabaseHealth = {
    configured: isSupabaseConfigured(),
    connected: false,
    projectUrl: SUPABASE_URL
      ? SUPABASE_URL.replace(/^https:\/\//, '')
      : 'not-configured',
    tablesAvailable: {
      users: false,
      accounts: false,
      transactions: false,
      beneficiaries: false,
      cards: false,
      notifications: false,
      audit_logs: false,
    },
    lastChecked: new Date().toISOString(),
  };

  const supabase = getSupabaseClient();
  if (!supabase) {
    status.error = 'Supabase environment variables are missing or invalid.';
    return status;
  }

  try {
    const checks = await Promise.all([
      supabase.from('users').select('id').limit(1),
      supabase.from('accounts').select('id').limit(1),
      supabase.from('transactions').select('id').limit(1),
      supabase.from('beneficiaries').select('id').limit(1),
      supabase.from('cards').select('id').limit(1),
      supabase.from('notifications').select('id').limit(1),
      supabase.from('audit_logs').select('id').limit(1),
    ]);

    status.tablesAvailable.users = !checks[0].error;
    status.tablesAvailable.accounts = !checks[1].error;
    status.tablesAvailable.transactions = !checks[2].error;
    status.tablesAvailable.beneficiaries = !checks[3].error;
    status.tablesAvailable.cards = !checks[4].error;
    status.tablesAvailable.notifications = !checks[5].error;
    status.tablesAvailable.audit_logs = !checks[6].error;

    status.connected = checks.some((check) => !check.error);

    const firstError = checks.find((check) => check.error)?.error;
    if (firstError) status.error = firstError.message;
  } catch (error: unknown) {
    status.connected = false;
    status.error =
      error instanceof Error ? error.message : 'Failed to connect to Supabase.';
  }

  return status;
}

// Database row mapping helpers

export const toDbUser = (u: StoredUser) => ({
  id: u.id,
  full_name: u.fullName,
  email: u.email,
  phone: u.phone,
  date_of_birth: u.dateOfBirth,
  address: u.address,
  role: u.role,
  avatar_url: u.avatarUrl || null,
  password_hash: u.passwordHash,
  password_salt: u.passwordSalt,
  created_at: u.createdAt,
  updated_at: u.updatedAt,
  last_login_at: u.lastLoginAt || null,
});

export const fromDbUser = (row: any): StoredUser => ({
  id: row.id,
  fullName: row.full_name,
  email: row.email,
  phone: row.phone,
  dateOfBirth: row.date_of_birth,
  address: row.address,
  role: row.role,
  avatarUrl: row.avatar_url || undefined,
  passwordHash: row.password_hash,
  passwordSalt: row.password_salt,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
  lastLoginAt: row.last_login_at || undefined,
});

export const toDbAccount = (a: BankAccount) => ({
  id: a.id,
  user_id: a.userId,
  account_number: a.accountNumber,
  account_type: a.accountType,
  currency: a.currency,
  balance: a.balance,
  available_balance: a.availableBalance,
  status: a.status,
  created_at: a.createdAt,
});

export const fromDbAccount = (row: any): BankAccount => ({
  id: row.id,
  userId: row.user_id,
  accountNumber: row.account_number,
  accountType: row.account_type,
  currency: row.currency,
  balance: Number(row.balance),
  availableBalance: Number(row.available_balance),
  status: row.status,
  createdAt: row.created_at,
});

export const toDbTransaction = (t: Transaction) => ({
  id: t.id,
  transaction_reference: t.transactionReference,
  sender_account_id: t.senderAccountId || null,
  sender_account_number: t.senderAccountNumber || null,
  sender_name: t.senderName || null,
  sender_user_id: t.senderUserId || null,
  recipient_account_id: t.recipientAccountId || null,
  recipient_account_number: t.recipientAccountNumber || null,
  recipient_name: t.recipientName || null,
  recipient_user_id: t.recipientUserId || null,
  amount: t.amount,
  currency: t.currency,
  type: t.type,
  category: t.category,
  description: t.description,
  status: t.status,
  fee: t.fee,
  timestamp: t.timestamp,
  metadata: t.metadata || null,
});

export const fromDbTransaction = (row: any): Transaction => ({
  id: row.id,
  transactionReference: row.transaction_reference,
  senderAccountId: row.sender_account_id || undefined,
  senderAccountNumber: row.sender_account_number || undefined,
  senderName: row.sender_name || undefined,
  senderUserId: row.sender_user_id || undefined,
  recipientAccountId: row.recipient_account_id || undefined,
  recipientAccountNumber: row.recipient_account_number || undefined,
  recipientName: row.recipient_name || undefined,
  recipientUserId: row.recipient_user_id || undefined,
  amount: Number(row.amount),
  currency: row.currency,
  type: row.type,
  category: row.category,
  description: row.description,
  status: row.status,
  fee: Number(row.fee || 0),
  timestamp: row.timestamp,
  metadata: row.metadata || undefined,
});

export const toDbBeneficiary = (b: Beneficiary) => ({
  id: b.id,
  user_id: b.userId,
  account_number: b.accountNumber,
  account_holder_name: b.accountHolderName,
  nickname: b.nickname,
  bank_name: b.bankName,
  created_at: b.createdAt,
});

export const fromDbBeneficiary = (row: any): Beneficiary => ({
  id: row.id,
  userId: row.user_id,
  accountNumber: row.account_number,
  accountHolderName: row.account_holder_name,
  nickname: row.nickname,
  bankName: row.bank_name,
  createdAt: row.created_at,
});

export const toDbCard = (c: BankCard) => ({
  id: c.id,
  user_id: c.userId,
  account_id: c.accountId,
  card_number: c.cardNumber,
  card_holder_name: c.cardHolderName,
  expiry_date: c.expiryDate,
  cvv_masked: c.cvvMasked,
  type: c.type,
  card_network: c.cardNetwork,
  status: c.status,
  daily_limit: c.dailyLimit,
  contactless_enabled: c.contactlessEnabled,
  created_at: c.createdAt,
});

export const fromDbCard = (row: any): BankCard => ({
  id: row.id,
  userId: row.user_id,
  accountId: row.account_id,
  cardNumber: row.card_number,
  cardHolderName: row.card_holder_name,
  expiryDate: row.expiry_date,
  cvvMasked: row.cvv_masked,
  type: row.type,
  cardNetwork: row.card_network,
  status: row.status,
  dailyLimit: Number(row.daily_limit),
  contactlessEnabled: row.contactless_enabled,
  createdAt: row.created_at,
});

export const toDbNotification = (n: NotificationItem) => ({
  id: n.id,
  user_id: n.userId,
  title: n.title,
  message: n.message,
  type: n.type,
  is_read: n.isRead,
  timestamp: n.timestamp,
  link: n.link || null,
});

export const fromDbNotification = (row: any): NotificationItem => ({
  id: row.id,
  userId: row.user_id,
  title: row.title,
  message: row.message,
  type: row.type,
  isRead: row.is_read,
  timestamp: row.timestamp,
  link: row.link || undefined,
});

export const toDbAuditLog = (a: AuditLog) => ({
  id: a.id,
  user_id: a.userId || null,
  user_email: a.userEmail || null,
  user_role: a.userRole || null,
  action: a.action,
  resource: a.resource,
  details: a.details,
  ip_address: a.ipAddress || null,
  result: a.result,
  timestamp: a.timestamp,
});

export const fromDbAuditLog = (row: any): AuditLog => ({
  id: row.id,
  userId: row.user_id || undefined,
  userEmail: row.user_email || undefined,
  userRole: row.user_role || undefined,
  action: row.action,
  resource: row.resource,
  details: row.details,
  ipAddress: row.ip_address || undefined,
  result: row.result,
  timestamp: row.timestamp,
});

// Asynchronous cloud database operations

export const supabaseDb = {
  async upsertUser(user: StoredUser): Promise<void> {
    const supabase = getSupabaseClient();
    if (!supabase) return;
    const { error } = await supabase.from('users').upsert(toDbUser(user), {
      onConflict: 'id',
    });
    if (error) console.error('[Supabase] Error syncing user:', error.message);
  },

  async upsertAccount(account: BankAccount): Promise<void> {
    const supabase = getSupabaseClient();
    if (!supabase) return;
    const { error } = await supabase.from('accounts').upsert(toDbAccount(account), {
      onConflict: 'id',
    });
    if (error) console.error('[Supabase] Error syncing account:', error.message);
  },

  async insertTransaction(transaction: Transaction): Promise<void> {
    const supabase = getSupabaseClient();
    if (!supabase) return;
    const { error } = await supabase.from('transactions').upsert(
      toDbTransaction(transaction),
      { onConflict: 'id' }
    );
    if (error) console.error('[Supabase] Error syncing transaction:', error.message);
  },

  async upsertCard(card: BankCard): Promise<void> {
    const supabase = getSupabaseClient();
    if (!supabase) return;
    const { error } = await supabase.from('cards').upsert(toDbCard(card), {
      onConflict: 'id',
    });
    if (error) console.error('[Supabase] Error syncing card:', error.message);
  },

  async upsertBeneficiary(beneficiary: Beneficiary): Promise<void> {
    const supabase = getSupabaseClient();
    if (!supabase) return;
    const { error } = await supabase.from('beneficiaries').upsert(
      toDbBeneficiary(beneficiary),
      { onConflict: 'id' }
    );
    if (error) console.error('[Supabase] Error syncing beneficiary:', error.message);
  },

  async deleteBeneficiary(id: string): Promise<void> {
    const supabase = getSupabaseClient();
    if (!supabase) return;
    const { error } = await supabase.from('beneficiaries').delete().eq('id', id);
    if (error) console.error('[Supabase] Error deleting beneficiary:', error.message);
  },

  async insertNotification(notif: NotificationItem): Promise<void> {
    const supabase = getSupabaseClient();
    if (!supabase) return;
    const { error } = await supabase.from('notifications').upsert(
      toDbNotification(notif),
      { onConflict: 'id' }
    );
    if (error) console.error('[Supabase] Error syncing notification:', error.message);
  },

  async updateNotificationRead(id: string, isRead: boolean): Promise<void> {
    const supabase = getSupabaseClient();
    if (!supabase) return;
    const { error } = await supabase.from('notifications')
      .update({ is_read: isRead })
      .eq('id', id);
    if (error) console.error('[Supabase] Error updating notification:', error.message);
  },

  async insertAuditLog(log: AuditLog): Promise<void> {
    const supabase = getSupabaseClient();
    if (!supabase) return;
    const { error } = await supabase.from('audit_logs').insert(toDbAuditLog(log));
    if (error) console.error('[Supabase] Error syncing audit log:', error.message);
  },

  async saveSession(token: string, userId: string, expiresAt: string): Promise<void> {
    const supabase = getSupabaseClient();
    if (!supabase) return;
    const { error } = await supabase.from('sessions').upsert({
      token,
      user_id: userId,
      expires_at: expiresAt,
    });
    if (error) console.error('[Supabase] Error saving session:', error.message);
  },

  async removeSession(token: string): Promise<void> {
    const supabase = getSupabaseClient();
    if (!supabase) return;
    const { error } = await supabase.from('sessions').delete().eq('token', token);
    if (error) console.error('[Supabase] Error removing session:', error.message);
  },

  async executeTransferRpc(params: {
    senderUserId: string;
    recipientAccountNumber: string;
    amount: number;
    description: string;
    idempotencyKey?: string;
    sessionToken?: string;
    clientIp?: string;
  }): Promise<{
    success: boolean;
    code?: string;
    message: string;
    transaction?: Transaction;
    updatedBalance?: number;
    updatedLedgerBalance?: number;
    recipientUpdatedBalance?: number;
    recipientUpdatedLedgerBalance?: number;
    isIdempotentReplay?: boolean;
    rpcExecuted: boolean;
  }> {
    // SECURITY: A Supabase admin client configured with SUPABASE_SERVICE_ROLE_KEY is strictly required.
    // Do NOT fall back to anon key for privileged transfer RPC.
    const adminClient = getSupabaseAdminClient();

    if (!adminClient) {
      return {
        success: false,
        code: 'CONFIGURATION_ERROR',
        message: 'Server configuration error: SUPABASE_SERVICE_ROLE_KEY is required to execute atomic transfers.',
        rpcExecuted: false,
      };
    }

    if (!params.sessionToken?.trim()) {
      return {
        success: false,
        code: 'SESSION_REQUIRED',
        message: 'An authenticated session is required for transfers.',
        rpcExecuted: false,
      };
    }

    if (
      !params.senderUserId?.trim() ||
      !params.recipientAccountNumber?.trim() ||
      !Number.isFinite(params.amount) ||
      params.amount <= 0
    ) {
      return {
        success: false,
        code: 'INVALID_TRANSFER_INPUT',
        message: 'Valid sender, recipient, and positive amount are required.',
        rpcExecuted: false,
      };
    }

    try {
      const { data, error } = await adminClient.rpc('transfer_funds', {
        p_sender_user_id: params.senderUserId,
        p_recipient_account_number: params.recipientAccountNumber.trim().toUpperCase(),
        p_amount: params.amount,
        p_session_token: params.sessionToken.trim(),
        p_description: params.description || '',
        p_idempotency_key: params.idempotencyKey || null,
        p_client_ip: params.clientIp || null,
      });

      if (error) {
        console.error('[Supabase] transfer_funds RPC error:', {
          code: error.code,
          message: error.message,
        });
        return {
          success: false,
          code: error.code || 'RPC_ERROR',
          message: error.message || 'RPC invocation failed.',
          rpcExecuted: false,
        };
      }

      if (!data || typeof data !== 'object') {
        return {
          success: false,
          code: 'INVALID_RPC_RESPONSE',
          message: 'The transfer function returned an invalid response.',
          rpcExecuted: true,
        };
      }

      const result = data as Record<string, any>;

      if (result.success !== true) {
        return {
          success: false,
          code: result.code || 'TRANSFER_FAILED',
          message: result.message || 'Transfer failed.',
          rpcExecuted: true,
        };
      }

      const updatedBalance = Number(result.updated_balance);
      const updatedLedgerBalance = Number.isFinite(Number(result.updated_ledger_balance))
        ? Number(result.updated_ledger_balance)
        : updatedBalance;
      const recipientUpdatedBalance = Number.isFinite(Number(result.recipient_updated_balance))
        ? Number(result.recipient_updated_balance)
        : undefined;
      const recipientUpdatedLedgerBalance = Number.isFinite(Number(result.recipient_updated_ledger_balance))
        ? Number(result.recipient_updated_ledger_balance)
        : recipientUpdatedBalance;

      if (!result.transaction || !Number.isFinite(updatedBalance) || updatedBalance < 0) {
        return {
          success: false,
          code: 'INVALID_RPC_RESPONSE',
          message: 'The transfer response is missing a valid transaction or balance.',
          rpcExecuted: true,
        };
      }

      return {
        success: true,
        code: result.code || 'SUCCESS',
        message: result.message || 'Transfer successful.',
        transaction: result.transaction as Transaction,
        updatedBalance,
        updatedLedgerBalance,
        recipientUpdatedBalance,
        recipientUpdatedLedgerBalance,
        isIdempotentReplay: Boolean(result.is_idempotent_replay),
        rpcExecuted: true,
      };
    } catch (error: unknown) {
      const message = error instanceof Error
        ? error.message
        : 'Unexpected transfer RPC error.';

      console.error('[Supabase] transfer_funds exception:', message);

      return {
        success: false,
        code: 'RPC_EXCEPTION',
        message,
        rpcExecuted: false,
      };
    }
  },
};