export type UserRole = 'customer' | 'admin';

export type AccountStatus = 'active' | 'suspended' | 'dormant' | 'closed';

export type AccountType = 'savings' | 'checking' | 'current';

export type TransactionType = 'transfer_out' | 'transfer_in' | 'bill_payment' | 'deposit' | 'withdrawal';

export type TransactionStatus = 'completed' | 'pending' | 'failed' | 'reversed';

export type TransactionCategory = 
  | 'transfer' 
  | 'electricity' 
  | 'gas' 
  | 'water' 
  | 'internet' 
  | 'mobile_recharge' 
  | 'shopping' 
  | 'salary' 
  | 'dining' 
  | 'other';

export type CardStatus = 'active' | 'frozen' | 'reported' | 'cancelled';

export interface User {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  address: string;
  role: UserRole;
  avatarUrl?: string;
  createdAt: string;
  updatedAt: string;
  lastLoginAt?: string;
}

export interface BankAccount {
  id: string;
  userId: string;
  accountNumber: string; // e.g., ZR-8849-2041
  accountType: AccountType;
  currency: string; // 'BDT' (৳)
  balance: number;
  availableBalance: number;
  status: AccountStatus;
  createdAt: string;
}

export interface Transaction {
  id: string;
  transactionReference: string; // e.g., TXN-20261008-9481
  senderAccountId?: string;
  senderAccountNumber?: string;
  senderName?: string;
  senderUserId?: string;
  recipientAccountId?: string;
  recipientAccountNumber?: string;
  recipientName?: string;
  recipientUserId?: string;
  amount: number;
  currency: string;
  type: TransactionType;
  category: TransactionCategory;
  description: string;
  status: TransactionStatus;
  fee: number;
  timestamp: string;
  metadata?: Record<string, any>;
}

export interface Beneficiary {
  id: string;
  userId: string;
  accountNumber: string;
  accountHolderName: string;
  nickname: string;
  bankName: string;
  createdAt: string;
}

export interface BankCard {
  id: string;
  userId: string;
  accountId: string;
  cardNumber: string; // Stored securely/masked, e.g. "4532 •••• •••• 8841"
  cardHolderName: string;
  expiryDate: string; // MM/YY
  cvvMasked: string; // "***"
  type: 'debit' | 'credit';
  cardNetwork: 'visa' | 'mastercard';
  status: CardStatus;
  dailyLimit: number;
  contactlessEnabled: boolean;
  createdAt: string;
}

export interface BillProvider {
  id: string;
  name: string;
  code: string;
  category: 'electricity' | 'gas' | 'water' | 'internet' | 'mobile_recharge';
  accountNumberLabel: string;
  iconName: string;
}

export interface BillPaymentRecord {
  id: string;
  userId: string;
  accountId: string;
  providerId: string;
  providerName: string;
  category: string;
  billCustomerNumber: string;
  amount: number;
  currency: string;
  transactionId: string;
  status: 'successful' | 'pending' | 'failed';
  timestamp: string;
}

export interface NotificationItem {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'transfer' | 'bill' | 'security' | 'card' | 'account' | 'system';
  isRead: boolean;
  timestamp: string;
  link?: string;
}

export interface AuditLog {
  id: string;
  userId?: string;
  userEmail?: string;
  userRole?: UserRole;
  action: string;
  resource: string;
  details: string;
  ipAddress?: string;
  result: 'SUCCESS' | 'FAILURE' | 'WARNING';
  timestamp: string;
}

export interface AuthSession {
  user: User;
  token: string;
  primaryAccount?: BankAccount;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}
