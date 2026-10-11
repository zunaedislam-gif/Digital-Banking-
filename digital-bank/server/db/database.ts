import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
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
  CardStatus,
  AccountStatus,
} from '../../src/types/banking.js';
import {
  generateSeedData,
  billProvidersSeed,
  StoredUser,
  hashPassword,
} from './seedData.js';
import {
  supabaseDb,
  getSupabaseClient,
  checkSupabaseStatus,
  fromDbUser,
  fromDbAccount,
  fromDbTransaction,
  isSupabaseConfigured,
  SupabaseHealth,
} from './supabase.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.resolve(__dirname, '../../data');
const DB_FILE_PATH = path.resolve(DATA_DIR, 'bank_storage.json');

export interface DatabaseSchema {
  version: number;
  users: StoredUser[];
  accounts: BankAccount[];
  transactions: Transaction[];
  beneficiaries: Beneficiary[];
  cards: BankCard[];
  billProviders: BillProvider[];
  billPayments: BillPaymentRecord[];
  notifications: NotificationItem[];
  auditLogs: AuditLog[];
  sessions: Record<string, { userId: string; createdAt: string; expiresAt: string }>;
}

class BankDatabase {
  private data: DatabaseSchema;
  private supabaseStatus: SupabaseHealth | null = null;

  constructor() {
    this.data = this.loadDatabase();
    this.initSupabaseSync().catch((e) => console.warn('[BankDatabase] Supabase init warning:', e));
  }

  private async initSupabaseSync() {
    if (!isSupabaseConfigured()) {
      return;
    }
    try {
      this.supabaseStatus = await checkSupabaseStatus();
      if (this.supabaseStatus.connected && this.supabaseStatus.tablesAvailable.users) {
        const supabase = getSupabaseClient();
        if (supabase) {
          const { data: dbUsers, error } = await supabase.from('users').select('*');
          if (!error && dbUsers && dbUsers.length > 0) {
            console.log(`[BankDatabase] Synced ${dbUsers.length} users from Supabase PostgreSQL.`);
            this.data.users = dbUsers.map(fromDbUser);
          }
          const { data: dbAccounts } = await supabase.from('accounts').select('*');
          if (dbAccounts && dbAccounts.length > 0) {
            this.data.accounts = dbAccounts.map(fromDbAccount);
          }
          const { data: dbTxns } = await supabase.from('transactions').select('*');
          if (dbTxns && dbTxns.length > 0) {
            this.data.transactions = dbTxns.map(fromDbTransaction);
          }
        }
      }
    } catch (err) {
      console.warn('[BankDatabase] Supabase sync error:', err);
    }
  }

  public async getSupabaseStatus(): Promise<SupabaseHealth> {
    this.supabaseStatus = await checkSupabaseStatus();
    return this.supabaseStatus;
  }

  private loadDatabase(): DatabaseSchema {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }

      if (fs.existsSync(DB_FILE_PATH)) {
        const raw = fs.readFileSync(DB_FILE_PATH, 'utf-8');
        const parsed = JSON.parse(raw);
        if (parsed.users && parsed.accounts) {
          return parsed;
        }
      }
    } catch (err) {
      console.warn('[BankDatabase] Warning reading existing database file, re-initializing seed:', err);
    }

    // Initialize with seed data
    const seed = generateSeedData();
    const initialData: DatabaseSchema = {
      version: 1,
      users: seed.users,
      accounts: seed.accounts,
      transactions: seed.transactions,
      beneficiaries: seed.beneficiaries,
      cards: seed.cards,
      billProviders: billProvidersSeed,
      billPayments: seed.billPayments,
      notifications: seed.notifications,
      auditLogs: seed.auditLogs,
      sessions: {},
    };

    this.saveDirect(initialData);
    return initialData;
  }

  private saveDirect(data: DatabaseSchema) {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      const tmpFile = `${DB_FILE_PATH}.${crypto.randomBytes(4).toString('hex')}.tmp`;
      fs.writeFileSync(tmpFile, JSON.stringify(data, null, 2), 'utf-8');
      fs.renameSync(tmpFile, DB_FILE_PATH);
    } catch (err) {
      console.error('[BankDatabase] Failed to write database to disk:', err);
    }
  }

  public save() {
    this.saveDirect(this.data);
  }

  // --- Session Management ---
  public createSession(userId: string): string {
    const token = crypto.randomBytes(32).toString('hex');
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString(); // 7 days
    this.data.sessions[token] = {
      userId,
      createdAt: now.toISOString(),
      expiresAt,
    };
    this.save();
    supabaseDb.saveSession(token, userId, expiresAt);
    return token;
  }

  public getSession(token: string): { userId: string } | null {
    if (!token) return null;
    const session = this.data.sessions[token];
    if (!session) return null;
    if (new Date(session.expiresAt).getTime() < Date.now()) {
      delete this.data.sessions[token];
      this.save();
      supabaseDb.removeSession(token);
      return null;
    }
    return { userId: session.userId };
  }

  public removeSession(token: string) {
    if (this.data.sessions[token]) {
      delete this.data.sessions[token];
      this.save();
      supabaseDb.removeSession(token);
    }
  }

  // --- User Operations ---
  public getUserByEmail(email: string): StoredUser | undefined {
    return this.data.users.find((u) => u.email.toLowerCase() === email.toLowerCase().trim());
  }

  public getUserById(id: string): StoredUser | undefined {
    return this.data.users.find((u) => u.id === id);
  }

  public getAllUsers(): User[] {
    // Return sanitized users without password hashes
    return this.data.users.map(({ passwordHash, passwordSalt, ...safeUser }) => safeUser);
  }

  public sanitizeUser(user: StoredUser): User {
    const { passwordHash, passwordSalt, ...safe } = user;
    return safe;
  }

  public createUser(userData: {
    fullName: string;
    email: string;
    phone: string;
    dateOfBirth: string;
    address: string;
    passwordPlain: string;
    role?: 'customer' | 'admin';
  }): { user: User; account: BankAccount } {
    const userId = `usr-${crypto.randomUUID().slice(0, 8)}`;
    const { hash, salt } = hashPassword(userData.passwordPlain);
    const now = new Date().toISOString();

    const newUser: StoredUser = {
      id: userId,
      fullName: userData.fullName.trim(),
      email: userData.email.toLowerCase().trim(),
      phone: userData.phone.trim(),
      dateOfBirth: userData.dateOfBirth,
      address: userData.address.trim(),
      role: userData.role || 'customer',
      createdAt: now,
      updatedAt: now,
      passwordHash: hash,
      passwordSalt: salt,
    };

    // Generate unique account number: ZR-XXXX-XXXX
    const randomBlock1 = Math.floor(1000 + Math.random() * 9000);
    const randomBlock2 = Math.floor(1000 + Math.random() * 9000);
    const accountNumber = `ZR-${randomBlock1}-${randomBlock2}`;

    const newAccount: BankAccount = {
      id: `acc-${crypto.randomUUID().slice(0, 8)}`,
      userId: newUser.id,
      accountNumber,
      accountType: 'savings',
      currency: 'BDT',
      balance: 10000.0, // Initial welcome bonus balance for simulation
      availableBalance: 10000.0,
      status: 'active',
      createdAt: now,
    };

    // Generate a default simulated debit card for the customer
    const cardBlock1 = Math.floor(1000 + Math.random() * 9000);
    const cardBlock2 = Math.floor(1000 + Math.random() * 9000);
    const newCard: BankCard = {
      id: `crd-${crypto.randomUUID().slice(0, 8)}`,
      userId: newUser.id,
      accountId: newAccount.id,
      cardNumber: `4532 ${cardBlock1} ${cardBlock2} ${randomBlock2}`,
      cardHolderName: newUser.fullName.toUpperCase(),
      expiryDate: '10/30',
      cvvMasked: '***',
      type: 'debit',
      cardNetwork: 'visa',
      status: 'active',
      dailyLimit: 50000,
      contactlessEnabled: true,
      createdAt: now,
    };

    // Welcome deposit transaction
    const welcomeTxn: Transaction = {
      id: `txn-${crypto.randomUUID().slice(0, 8)}`,
      transactionReference: `TXN-${Date.now()}-0001`,
      recipientAccountId: newAccount.id,
      recipientAccountNumber: newAccount.accountNumber,
      recipientName: newUser.fullName,
      recipientUserId: newUser.id,
      amount: 10000.0,
      currency: 'BDT',
      type: 'deposit',
      category: 'other',
      description: 'Account Opening Welcome Credit - ZR Digital Bank',
      status: 'completed',
      fee: 0,
      timestamp: now,
    };

    // Welcome notification
    const welcomeNotif: NotificationItem = {
      id: `notif-${crypto.randomUUID().slice(0, 8)}`,
      userId: newUser.id,
      title: 'Welcome to ZR Digital Bank!',
      message: `Your account ${accountNumber} has been opened with a complimentary initial credit of ৳10,000.00.`,
      type: 'account',
      isRead: false,
      timestamp: now,
    };

    this.data.users.push(newUser);
    this.data.accounts.push(newAccount);
    this.data.cards.push(newCard);
    this.data.transactions.push(welcomeTxn);
    this.data.notifications.push(welcomeNotif);

    this.addAuditLog({
      userId: newUser.id,
      userEmail: newUser.email,
      userRole: newUser.role,
      action: 'CUSTOMER_REGISTRATION',
      resource: `ACCOUNT:${accountNumber}`,
      details: `New account created for ${newUser.fullName} with initial credit ৳10,000.00`,
      result: 'SUCCESS',
    });

    this.save();
    supabaseDb.upsertUser(newUser);
    supabaseDb.upsertAccount(newAccount);
    supabaseDb.upsertCard(newCard);
    supabaseDb.insertTransaction(welcomeTxn);
    supabaseDb.insertNotification(welcomeNotif);
    return { user: this.sanitizeUser(newUser), account: newAccount };
  }

  public updateUser(userId: string, updates: Partial<Pick<User, 'fullName' | 'phone' | 'address'>>): User | null {
    const userIndex = this.data.users.findIndex((u) => u.id === userId);
    if (userIndex === -1) return null;

    const current = this.data.users[userIndex];
    if (updates.fullName) current.fullName = updates.fullName.trim();
    if (updates.phone) current.phone = updates.phone.trim();
    if (updates.address) current.address = updates.address.trim();
    current.updatedAt = new Date().toISOString();

    this.save();
    supabaseDb.upsertUser(current);
    return this.sanitizeUser(current);
  }

  public updatePassword(userId: string, newPlainPassword: string): boolean {
    const user = this.data.users.find((u) => u.id === userId);
    if (!user) return false;

    const { hash, salt } = hashPassword(newPlainPassword);
    user.passwordHash = hash;
    user.passwordSalt = salt;
    user.updatedAt = new Date().toISOString();
    this.save();
    supabaseDb.upsertUser(user);
    return true;
  }

  // --- Accounts Operations ---
  public getAccountById(id: string): BankAccount | undefined {
    return this.data.accounts.find((a) => a.id === id);
  }

  public getAccountByUserId(userId: string): BankAccount | undefined {
    return this.data.accounts.find((a) => a.userId === userId);
  }

  public getAccountByNumber(accountNumber: string): BankAccount | undefined {
    const cleanNumber = accountNumber.trim().toUpperCase();
    return this.data.accounts.find((a) => a.accountNumber.toUpperCase() === cleanNumber);
  }

  public getAllAccounts(): BankAccount[] {
    return this.data.accounts;
  }

  public setAccountStatus(accountId: string, status: AccountStatus): BankAccount | null {
    const acc = this.data.accounts.find((a) => a.id === accountId);
    if (!acc) return null;
    acc.status = status;
    this.save();
    supabaseDb.upsertAccount(acc);
    return acc;
  }

  public adjustAccountBalance(params: {
    accountId: string;
    amount: number;
    type: 'credit' | 'debit';
    reason: string;
    adminUserId: string;
    adminEmail: string;
  }): { success: boolean; message: string; account?: BankAccount; transaction?: Transaction } {
    const { accountId, amount, type, reason, adminUserId, adminEmail } = params;

    if (!amount || amount <= 0 || isNaN(amount)) {
      return { success: false, message: 'Adjustment amount must be a positive number.' };
    }

    const acc = this.data.accounts.find((a) => a.id === accountId);
    if (!acc) {
      return { success: false, message: 'Target account not found.' };
    }

    const user = this.getUserById(acc.userId);
    if (!user) {
      return { success: false, message: 'Customer profile for this account not found.' };
    }

    if (type === 'debit' && acc.availableBalance < amount) {
      return { success: false, message: `Insufficient balance for debit. Current balance is ৳${acc.availableBalance.toFixed(2)}` };
    }

    if (type === 'credit') {
      acc.balance += amount;
      acc.availableBalance += amount;
    } else {
      acc.balance -= amount;
      acc.availableBalance -= amount;
    }

    const now = new Date().toISOString();
    const txnRef = `TXN-ADM-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.floor(1000 + Math.random() * 9000)}`;

    const transaction: Transaction = {
      id: `txn-${crypto.randomUUID().slice(0, 8)}`,
      transactionReference: txnRef,
      recipientAccountId: type === 'credit' ? acc.id : undefined,
      recipientAccountNumber: type === 'credit' ? acc.accountNumber : undefined,
      recipientName: type === 'credit' ? user.fullName : undefined,
      recipientUserId: type === 'credit' ? user.id : undefined,
      senderAccountId: type === 'debit' ? acc.id : undefined,
      senderAccountNumber: type === 'debit' ? acc.accountNumber : undefined,
      senderName: type === 'debit' ? user.fullName : undefined,
      senderUserId: type === 'debit' ? user.id : undefined,
      amount,
      currency: acc.currency,
      type: type === 'credit' ? 'deposit' : 'withdrawal',
      category: 'other',
      description: `Administrative ${type === 'credit' ? 'Credit' : 'Debit'}: ${reason.trim() || 'Manual adjustment'}`,
      status: 'completed',
      fee: 0,
      timestamp: now,
    };

    this.data.transactions.unshift(transaction);

    // Notify customer
    const notif: NotificationItem = {
      id: `notif-${crypto.randomUUID().slice(0, 8)}`,
      userId: user.id,
      title: type === 'credit' ? 'Account Credited by Admin' : 'Account Debited by Admin',
      message: `Your account ${acc.accountNumber} has been ${type === 'credit' ? 'credited' : 'debited'} with ৳${amount.toFixed(2)}. Reason: ${reason}`,
      type: 'account',
      isRead: false,
      timestamp: now,
    };
    this.data.notifications.unshift(notif);

    // Audit log
    this.addAuditLog({
      userId: adminUserId,
      userEmail: adminEmail,
      userRole: 'admin',
      action: `ADMIN_BALANCE_${type.toUpperCase()}`,
      resource: acc.accountNumber,
      details: `${type.toUpperCase()} ৳${amount.toFixed(2)} to ${acc.accountNumber} (${user.fullName}). Reason: ${reason}. New balance: ৳${acc.balance.toFixed(2)}`,
      result: 'SUCCESS',
    });

    this.save();
    supabaseDb.upsertAccount(acc);
    supabaseDb.insertTransaction(transaction);
    supabaseDb.insertNotification(notif);
    return { success: true, message: `Account successfully ${type === 'credit' ? 'credited' : 'debited'}.`, account: acc, transaction };
  }

  // --- Transactions Operations ---
  public getAllTransactions(): Transaction[] {
    return [...this.data.transactions].sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
  }

  public getTransactionsForUser(userId: string): Transaction[] {
    const userAccount = this.getAccountByUserId(userId);
    const userAccId = userAccount?.id;
    const userAccNum = userAccount?.accountNumber;

    return this.data.transactions
      .filter(
        (t) =>
          t.senderUserId === userId ||
          t.recipientUserId === userId ||
          (userAccId && (t.senderAccountId === userAccId || t.recipientAccountId === userAccId)) ||
          (userAccNum && (t.senderAccountNumber === userAccNum || t.recipientAccountNumber === userAccNum))
      )
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }

  public getTransactionById(txnId: string): Transaction | undefined {
    return this.data.transactions.find((t) => t.id === txnId || t.transactionReference === txnId);
  }

  // --- Money Transfer Core (PostgreSQL Atomic RPC with Idempotency) ---
  public async executeTransfer(params: {
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
    isIdempotentReplay?: boolean;
  }> {
    const { senderUserId, recipientAccountNumber, amount, description, idempotencyKey, sessionToken, clientIp } = params;

    if (amount <= 0 || isNaN(amount)) {
      return { success: false, code: 'INVALID_AMOUNT', message: 'Transfer amount must be greater than zero.' };
    }

    // 1. Mandatory Path: Call PostgreSQL atomic function transfer_funds
    const rpcResult = await supabaseDb.executeTransferRpc({
      senderUserId,
      recipientAccountNumber,
      amount,
      description,
      idempotencyKey,
      sessionToken,
      clientIp,
    });

    if (rpcResult.rpcExecuted) {
      if (rpcResult.success && rpcResult.transaction) {
        // Sync local cache directly with PostgreSQL transaction output
        const senderAccount = this.getAccountByUserId(senderUserId);
        if (senderAccount && rpcResult.updatedBalance !== undefined) {
          senderAccount.availableBalance = rpcResult.updatedBalance;
          senderAccount.balance = rpcResult.updatedLedgerBalance !== undefined
            ? rpcResult.updatedLedgerBalance
            : rpcResult.updatedBalance;
        }

        const cleanTarget = recipientAccountNumber.trim().toUpperCase();
        const recipientAccount = this.getAccountByNumber(cleanTarget);
        if (recipientAccount && !rpcResult.isIdempotentReplay) {
          if (rpcResult.recipientUpdatedBalance !== undefined) {
            recipientAccount.availableBalance = rpcResult.recipientUpdatedBalance;
            recipientAccount.balance = rpcResult.recipientUpdatedLedgerBalance !== undefined
              ? rpcResult.recipientUpdatedLedgerBalance
              : rpcResult.recipientUpdatedBalance;
          } else {
            recipientAccount.availableBalance += amount;
            recipientAccount.balance += amount;
          }
        }

        // Maintain local transaction list
        const existingTxnIdx = this.data.transactions.findIndex(
          (t) => t.id === rpcResult.transaction?.id || t.transactionReference === rpcResult.transaction?.transactionReference
        );
        if (existingTxnIdx === -1) {
          this.data.transactions.unshift(rpcResult.transaction);
        } else {
          this.data.transactions[existingTxnIdx] = rpcResult.transaction;
        }

        this.save();
        return {
          success: true,
          code: rpcResult.code,
          message: rpcResult.message,
          transaction: rpcResult.transaction,
          updatedBalance: rpcResult.updatedBalance,
          isIdempotentReplay: rpcResult.isIdempotentReplay,
        };
      } else {
        return {
          success: false,
          code: rpcResult.code,
          message: rpcResult.message,
        };
      }
    }

    // 2. Strict Requirement: Do NOT silently fall back to in-memory transfers
    console.error('[BankDatabase] transfer_funds RPC unavailable:', rpcResult.message);
    return {
      success: false,
      code: rpcResult.code || 'DATABASE_RPC_UNAVAILABLE',
      message: `Database transfer RPC is unavailable: ${rpcResult.message}`,
    };
  }

  // --- Beneficiaries Operations ---
  public getBeneficiariesForUser(userId: string): Beneficiary[] {
    return this.data.beneficiaries.filter((b) => b.userId === userId);
  }

  public addBeneficiary(params: {
    userId: string;
    accountNumber: string;
    nickname: string;
    bankName?: string;
  }): { success: boolean; message: string; beneficiary?: Beneficiary } {
    const { userId, accountNumber, nickname, bankName } = params;
    const cleanNumber = accountNumber.trim().toUpperCase();

    // Verify account exists in the simulated banking system
    const targetAccount = this.getAccountByNumber(cleanNumber);
    if (!targetAccount) {
      return { success: false, message: 'Account number does not exist in ZR Digital Bank system.' };
    }

    if (targetAccount.userId === userId) {
      return { success: false, message: 'You cannot add your own account as a beneficiary.' };
    }

    const existing = this.data.beneficiaries.find(
      (b) => b.userId === userId && b.accountNumber.toUpperCase() === cleanNumber
    );
    if (existing) {
      return { success: false, message: 'This beneficiary account is already in your saved list.' };
    }

    const targetUser = this.getUserById(targetAccount.userId);
    const newBen: Beneficiary = {
      id: `ben-${crypto.randomUUID().slice(0, 8)}`,
      userId,
      accountNumber: targetAccount.accountNumber,
      accountHolderName: targetUser?.fullName || 'Account Holder',
      nickname: nickname.trim() || targetUser?.fullName || 'Beneficiary',
      bankName: bankName || 'ZR Digital Bank',
      createdAt: new Date().toISOString(),
    };

    this.data.beneficiaries.push(newBen);

    // Notification & Audit
    this.data.notifications.push({
      id: `notif-${crypto.randomUUID().slice(0, 8)}`,
      userId,
      title: 'Beneficiary Added',
      message: `Beneficiary ${newBen.nickname} (${newBen.accountNumber}) was added successfully.`,
      type: 'account',
      isRead: false,
      timestamp: new Date().toISOString(),
    });

    this.addAuditLog({
      userId,
      action: 'ADD_BENEFICIARY',
      resource: newBen.accountNumber,
      details: `Added beneficiary ${newBen.accountHolderName} (${newBen.accountNumber})`,
      result: 'SUCCESS',
    });

    this.save();
    supabaseDb.upsertBeneficiary(newBen);
    return { success: true, message: 'Beneficiary added successfully.', beneficiary: newBen };
  }

  public deleteBeneficiary(userId: string, beneficiaryId: string): boolean {
    const idx = this.data.beneficiaries.findIndex((b) => b.id === beneficiaryId && b.userId === userId);
    if (idx === -1) return false;

    const removed = this.data.beneficiaries.splice(idx, 1)[0];
    this.addAuditLog({
      userId,
      action: 'DELETE_BENEFICIARY',
      resource: removed.accountNumber,
      details: `Deleted beneficiary ${removed.nickname} (${removed.accountNumber})`,
      result: 'SUCCESS',
    });
    this.save();
    supabaseDb.deleteBeneficiary(beneficiaryId);
    return true;
  }

  // --- Bill Payments Operations ---
  public getBillProviders(): BillProvider[] {
    return this.data.billProviders;
  }

  public getBillPaymentsForUser(userId: string): BillPaymentRecord[] {
    return this.data.billPayments
      .filter((bp) => bp.userId === userId)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }

  public payBill(params: {
    userId: string;
    providerId: string;
    customerNumber: string;
    amount: number;
    clientIp?: string;
  }): { success: boolean; message: string; billPayment?: BillPaymentRecord; transaction?: Transaction } {
    const { userId, providerId, customerNumber, amount, clientIp } = params;

    if (amount <= 0 || isNaN(amount)) {
      return { success: false, message: 'Bill amount must be greater than zero.' };
    }

    const provider = this.data.billProviders.find((p) => p.id === providerId);
    if (!provider) {
      return { success: false, message: 'Selected utility provider was not found.' };
    }

    const user = this.getUserById(userId);
    const account = this.getAccountByUserId(userId);
    if (!user || !account) {
      return { success: false, message: 'Active banking account not found.' };
    }

    if (account.status !== 'active') {
      return { success: false, message: `Your account is ${account.status}. Bill payment is unavailable.` };
    }

    if (account.availableBalance < amount) {
      return { success: false, message: 'Insufficient balance to pay this bill.' };
    }

    // Deduct balance
    account.balance -= amount;
    account.availableBalance -= amount;

    const now = new Date().toISOString();
    const txnRef = `TXN-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.floor(1000 + Math.random() * 9000)}`;

    const transaction: Transaction = {
      id: `txn-${crypto.randomUUID().slice(0, 8)}`,
      transactionReference: txnRef,
      senderAccountId: account.id,
      senderAccountNumber: account.accountNumber,
      senderName: user.fullName,
      senderUserId: user.id,
      recipientAccountNumber: `${provider.code}-${customerNumber}`,
      recipientName: provider.name,
      amount,
      currency: 'BDT',
      type: 'bill_payment',
      category: provider.category,
      description: `${provider.name} Bill Payment for ${customerNumber}`,
      status: 'completed',
      fee: 0,
      timestamp: now,
    };

    const billRecord: BillPaymentRecord = {
      id: `bill-${crypto.randomUUID().slice(0, 8)}`,
      userId: user.id,
      accountId: account.id,
      providerId: provider.id,
      providerName: provider.name,
      category: provider.category,
      billCustomerNumber: customerNumber.trim(),
      amount,
      currency: 'BDT',
      transactionId: transaction.id,
      status: 'successful',
      timestamp: now,
    };

    this.data.transactions.push(transaction);
    this.data.billPayments.push(billRecord);

    // Notification
    this.data.notifications.push({
      id: `notif-${crypto.randomUUID().slice(0, 8)}`,
      userId: user.id,
      title: 'Bill Payment Completed',
      message: `Paid ৳${amount.toLocaleString('en-BD', { minimumFractionDigits: 2 })} to ${provider.name} (${customerNumber}).`,
      type: 'bill',
      isRead: false,
      timestamp: now,
    });

    // Audit log
    this.addAuditLog({
      userId: user.id,
      userEmail: user.email,
      userRole: user.role,
      action: 'BILL_PAYMENT',
      resource: `${provider.code}:${customerNumber}`,
      details: `Paid ৳${amount.toFixed(2)} to ${provider.name}`,
      ipAddress: clientIp,
      result: 'SUCCESS',
    });

    this.save();
    supabaseDb.upsertAccount(account);
    supabaseDb.insertTransaction(transaction);
    supabaseDb.insertNotification(this.data.notifications[this.data.notifications.length - 1]);
    return {
      success: true,
      message: 'Bill payment successful.',
      billPayment: billRecord,
      transaction,
    };
  }

  // --- Cards Operations ---
  public getCardsForUser(userId: string): BankCard[] {
    return this.data.cards.filter((c) => c.userId === userId);
  }

  public getCardById(cardId: string): BankCard | undefined {
    return this.data.cards.find((c) => c.id === cardId);
  }

  public updateCardStatus(userId: string, cardId: string, status: CardStatus): { success: boolean; message: string; card?: BankCard } {
    const card = this.data.cards.find((c) => c.id === cardId && c.userId === userId);
    if (!card) {
      return { success: false, message: 'Card not found.' };
    }

    card.status = status;
    const now = new Date().toISOString();

    this.data.notifications.push({
      id: `notif-${crypto.randomUUID().slice(0, 8)}`,
      userId,
      title: `Card Status Changed: ${status.toUpperCase()}`,
      message: `Your debit card ending in ${card.cardNumber.slice(-4)} has been set to ${status}.`,
      type: 'card',
      isRead: false,
      timestamp: now,
    });

    this.addAuditLog({
      userId,
      action: 'CARD_STATUS_UPDATE',
      resource: `CARD:${card.id}`,
      details: `Card ending ${card.cardNumber.slice(-4)} status changed to ${status}`,
      result: 'SUCCESS',
    });

    this.save();
    supabaseDb.upsertCard(card);
    return { success: true, message: `Card has been ${status}.`, card };
  }

  public updateCardLimit(userId: string, cardId: string, dailyLimit: number): { success: boolean; message: string; card?: BankCard } {
    const card = this.data.cards.find((c) => c.id === cardId && c.userId === userId);
    if (!card) {
      return { success: false, message: 'Card not found.' };
    }

    card.dailyLimit = dailyLimit;
    this.addAuditLog({
      userId,
      action: 'CARD_LIMIT_UPDATE',
      resource: `CARD:${card.id}`,
      details: `Daily spend limit updated to ৳${dailyLimit.toLocaleString('en-BD')}`,
      result: 'SUCCESS',
    });
    this.save();
    supabaseDb.upsertCard(card);
    return { success: true, message: 'Daily limit updated successfully.', card };
  }

  public createVirtualCard(userId: string, cardType: 'debit' | 'credit' = 'debit', network: 'visa' | 'mastercard' = 'visa'): BankCard {
    const account = this.getAccountByUserId(userId);
    const user = this.getUserById(userId);
    const randomBlock1 = Math.floor(1000 + Math.random() * 9000);
    const randomBlock2 = Math.floor(1000 + Math.random() * 9000);
    const randomBlock3 = Math.floor(1000 + Math.random() * 9000);
    const prefix = network === 'visa' ? '4532' : '5241';

    const newCard: BankCard = {
      id: `crd-${crypto.randomUUID().slice(0, 8)}`,
      userId,
      accountId: account?.id || `acc-${userId}`,
      cardNumber: `${prefix} ${randomBlock1} ${randomBlock2} ${randomBlock3}`,
      cardHolderName: user ? user.fullName.toUpperCase() : 'ZR CARDHOLDER',
      expiryDate: '12/31',
      cvvMasked: '***',
      type: cardType,
      cardNetwork: network,
      status: 'active',
      dailyLimit: 75000,
      contactlessEnabled: true,
      createdAt: new Date().toISOString(),
    };

    this.data.cards.push(newCard);

    this.data.notifications.push({
      id: `notif-${crypto.randomUUID().slice(0, 8)}`,
      userId,
      title: 'New Virtual Card Issued',
      message: `Your new ${network.toUpperCase()} ${cardType.toUpperCase()} ending in ${randomBlock3} has been activated.`,
      type: 'card',
      isRead: false,
      timestamp: new Date().toISOString(),
    });

    this.addAuditLog({
      userId,
      action: 'CARD_ISSUANCE',
      resource: `CARD:${newCard.id}`,
      details: `Issued virtual ${network} ${cardType} ending in ${randomBlock3}`,
      result: 'SUCCESS',
    });

    this.save();
    supabaseDb.upsertCard(newCard);
    supabaseDb.insertNotification(this.data.notifications[this.data.notifications.length - 1]);
    return newCard;
  }

  // --- Notifications Operations ---
  public getNotificationsForUser(userId: string): NotificationItem[] {
    return this.data.notifications
      .filter((n) => n.userId === userId)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }

  public markNotificationAsRead(userId: string, notifId: string): boolean {
    const notif = this.data.notifications.find((n) => n.id === notifId && n.userId === userId);
    if (!notif) return false;
    notif.isRead = true;
    this.save();
    supabaseDb.updateNotificationRead(notifId, true);
    return true;
  }

  public deleteNotification(userId: string, notifId: string): boolean {
    const idx = this.data.notifications.findIndex((n) => n.id === notifId && n.userId === userId);
    if (idx === -1) return false;
    this.data.notifications.splice(idx, 1);
    this.save();
    return true;
  }

  public markAllNotificationsAsRead(userId: string): boolean {
    let changed = false;
    this.data.notifications.forEach((n) => {
      if (n.userId === userId && !n.isRead) {
        n.isRead = true;
        changed = true;
        supabaseDb.updateNotificationRead(n.id, true);
      }
    });
    if (changed) this.save();
    return true;
  }

  // --- Audit Logs Operations ---
  public addAuditLog(entry: Omit<AuditLog, 'id' | 'timestamp'>): AuditLog {
    const log: AuditLog = {
      id: `log-${crypto.randomUUID().slice(0, 8)}`,
      timestamp: new Date().toISOString(),
      ...entry,
    };
    this.data.auditLogs.unshift(log); // Prepend so newest is first
    // Keep reasonable bounded size in memory (e.g., last 1000 logs)
    if (this.data.auditLogs.length > 1000) {
      this.data.auditLogs = this.data.auditLogs.slice(0, 1000);
    }
    this.save();
    supabaseDb.insertAuditLog(log);
    return log;
  }

  public getAllAuditLogs(): AuditLog[] {
    return this.data.auditLogs;
  }

  // --- System Diagnostic & Metrics ---
  public getSystemMetrics() {
    const totalCustomers = this.data.users.filter((u) => u.role === 'customer').length;
    const totalAccounts = this.data.accounts.length;
    const totalMoneyInSystem = this.data.accounts.reduce((sum, a) => sum + a.balance, 0);
    const totalTransactions = this.data.transactions.length;

    const todayStr = new Date().toISOString().slice(0, 10);
    const todayTransactions = this.data.transactions.filter((t) => t.timestamp.startsWith(todayStr)).length;
    const failedTransactions = this.data.transactions.filter((t) => t.status === 'failed').length;
    const pendingTransactions = this.data.transactions.filter((t) => t.status === 'pending').length;

    return {
      totalCustomers,
      totalAccounts,
      totalMoneyInSystem,
      totalTransactions,
      todayTransactions,
      failedTransactions,
      pendingTransactions,
    };
  }
}

export const db = new BankDatabase();
