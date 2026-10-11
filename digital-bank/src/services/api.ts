import { User, BankAccount, ApiResponse } from '../types/banking.js';

const TOKEN_KEY = 'zr_bank_auth_token';

export const tokenStorage = {
  get: (): string | null => {
    try {
      return localStorage.getItem(TOKEN_KEY);
    } catch {
      return null;
    }
  },
  set: (token: string): void => {
    try {
      localStorage.setItem(TOKEN_KEY, token);
    } catch {
      // storage unavailable
    }
  },
  clear: (): void => {
    try {
      localStorage.removeItem(TOKEN_KEY);
    } catch {
      // ignore
    }
  },
};

async function request<T = any>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = tokenStorage.get();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`/api${endpoint}`, {
    ...options,
    headers,
  });

  const data = await response.json().catch(() => ({
    success: false,
    error: `Server returned ${response.status} with invalid JSON.`,
  }));

  if (!response.ok || data.success === false) {
    throw new Error(data.error || data.message || `Request failed with status ${response.status}`);
  }

  return data;
}

export const api = {
  // Auth
  register: async (payload: {
    fullName: string;
    email: string;
    phone: string;
    dateOfBirth: string;
    address: string;
    password: string;
    confirmPassword: string;
  }): Promise<{ user: User; account: BankAccount; token: string }> => {
    const res = await request<{ data: { user: User; account: BankAccount; token: string } }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    tokenStorage.set(res.data.token);
    return res.data;
  },

  login: async (email: string, password: string): Promise<{ user: User; account?: BankAccount; token: string }> => {
    const res = await request<{ data: { user: User; account?: BankAccount; token: string } }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    tokenStorage.set(res.data.token);
    return res.data;
  },

  logout: async (): Promise<void> => {
    try {
      await request('/auth/logout', { method: 'POST' });
    } catch (e) {
      console.warn('Logout API warning:', e);
    } finally {
      tokenStorage.clear();
    }
  },

  getMe: async (): Promise<{ user: User; account?: BankAccount }> => {
    const res = await request<{ data: { user: User; account?: BankAccount } }>('/auth/me');
    return res.data;
  },

  forgotPassword: async (email: string): Promise<{ message: string; tempPassword?: string }> => {
    return await request('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  },

  // Accounts & Analytics
  getMyAccount: async (): Promise<{ account: BankAccount; primaryCard: any; cardsCount: number; unreadNotifications: number }> => {
    const res = await request<{ data: { account: BankAccount; primaryCard: any; cardsCount: number; unreadNotifications: number } }>('/accounts/my-account');
    return res.data;
  },

  getAnalytics: async (): Promise<{
    totalIncome: number;
    totalExpense: number;
    netSavings: number;
    categoryBreakdown: { category: string; amount: number; percentage: number }[];
    monthlyTrend: { month: string; income: number; expense: number }[];
    recentTransactions: any[];
  }> => {
    const res = await request<{
      data: {
        totalIncome: number;
        totalExpense: number;
        netSavings: number;
        categoryBreakdown: { category: string; amount: number; percentage: number }[];
        monthlyTrend: { month: string; income: number; expense: number }[];
        recentTransactions: any[];
      };
    }>('/accounts/analytics');
    return res.data;
  },

  // Transactions & Transfers
  lookupAccount: async (accountNumber: string): Promise<{
    accountNumber: string;
    maskedAccountNumber: string;
    recipientName: string;
    bankName: string;
    accountType: string;
  }> => {
    const res = await request<{
      data: {
        accountNumber: string;
        maskedAccountNumber: string;
        recipientName: string;
        bankName: string;
        accountType: string;
      };
    }>(`/transactions/lookup?accountNumber=${encodeURIComponent(accountNumber)}`);
    return res.data;
  },

  transferMoney: async (payload: {
    recipientAccountNumber: string;
    amount: number;
    description: string;
    idempotencyKey?: string;
  }): Promise<{ transaction: any; updatedBalance: number; isIdempotentReplay?: boolean }> => {
    const idempotencyKey = payload.idempotencyKey || (typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `req-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`);
    const res = await request<{
      data: {
        transaction: any;
        updatedBalance: number;
        isIdempotentReplay?: boolean;
      };
      message: string;
    }>('/transactions/transfer', {
      method: 'POST',
      headers: {
        'Idempotency-Key': idempotencyKey,
      },
      body: JSON.stringify({
        ...payload,
        idempotencyKey,
      }),
    });
    return res.data;
  },

  getMyTransactions: async (params: {
    search?: string;
    type?: string;
    status?: string;
    dateRange?: string;
    page?: number;
    limit?: number;
  } = {}): Promise<{
    transactions: any[];
    total: number;
    page: number;
    totalPages: number;
    limit: number;
    summary: { totalIn: number; totalOut: number; count: number };
  }> => {
    const query = new URLSearchParams();
    if (params.search) query.append('search', params.search);
    if (params.type && params.type !== 'all') query.append('type', params.type);
    if (params.status && params.status !== 'all') query.append('status', params.status);
    if (params.dateRange && params.dateRange !== 'all') query.append('dateRange', params.dateRange);
    if (params.page) query.append('page', params.page.toString());
    if (params.limit) query.append('limit', params.limit.toString());

    const res = await request<{
      data: {
        transactions: any[];
        total: number;
        page: number;
        totalPages: number;
        limit: number;
        summary: { totalIn: number; totalOut: number; count: number };
      };
    }>(`/transactions/my-transactions?${query.toString()}`);
    return res.data;
  },

  getTransactionById: async (id: string): Promise<any> => {
    const res = await request<{ data: any }>(`/transactions/${encodeURIComponent(id)}`);
    return res.data;
  },

  // Beneficiaries
  getBeneficiaries: async (): Promise<any[]> => {
    const res = await request<{ data: any[] }>('/beneficiaries');
    return res.data;
  },

  addBeneficiary: async (payload: {
    accountNumber: string;
    nickname?: string;
    bankName?: string;
  }): Promise<any> => {
    const res = await request<{ data: any; message: string }>('/beneficiaries', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    return res.data;
  },

  deleteBeneficiary: async (id: string): Promise<void> => {
    await request(`/beneficiaries/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    });
  },

  // Bill Payments
  getBillProviders: async (): Promise<any[]> => {
    const res = await request<{ data: any[] }>('/bills/providers');
    return res.data;
  },

  getBillPaymentHistory: async (): Promise<any[]> => {
    const res = await request<{ data: any[] }>('/bills/history');
    return res.data;
  },

  payBill: async (payload: {
    providerId: string;
    customerNumber: string;
    amount: number;
  }): Promise<{ billPayment: any; transaction: any; updatedBalance: number }> => {
    const res = await request<{
      data: {
        billPayment: any;
        transaction: any;
        updatedBalance: number;
      };
      message: string;
    }>('/bills/pay', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    return res.data;
  },

  // Cards Management
  getCards: async (): Promise<any[]> => {
    const res = await request<{ data: any[] }>('/cards');
    return res.data;
  },

  updateCardStatus: async (id: string, status: string): Promise<any> => {
    const res = await request<{ data: any; message: string }>(`/cards/${encodeURIComponent(id)}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
    return res.data;
  },

  updateCardLimit: async (id: string, dailyLimit: number): Promise<any> => {
    const res = await request<{ data: any; message: string }>(`/cards/${encodeURIComponent(id)}/limit`, {
      method: 'PATCH',
      body: JSON.stringify({ dailyLimit }),
    });
    return res.data;
  },

  requestVirtualCard: async (payload: { type: string; network: string }): Promise<any> => {
    const res = await request<{ data: any; message: string }>('/cards', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    return res.data;
  },

  // Notifications Center
  getNotifications: async (): Promise<{ notifications: any[]; unreadCount: number }> => {
    const res = await request<{ data: { notifications: any[]; unreadCount: number } }>('/notifications');
    return res.data;
  },

  markNotificationRead: async (id: string): Promise<void> => {
    await request(`/notifications/${encodeURIComponent(id)}/read`, {
      method: 'PATCH',
    });
  },

  markAllNotificationsRead: async (): Promise<void> => {
    await request('/notifications/read-all', {
      method: 'POST',
    });
  },

  deleteNotification: async (id: string): Promise<void> => {
    await request(`/notifications/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    });
  },

  // Profile & Security
  getProfile: async (): Promise<{ user: any; account?: any; loginHistory: any[] }> => {
    const res = await request<{ data: { user: any; account?: any; loginHistory: any[] } }>('/profile');
    return res.data;
  },

  updateProfile: async (payload: { fullName?: string; phone?: string; address?: string }): Promise<any> => {
    const res = await request<{ data: any; message: string }>('/profile', {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
    return res.data;
  },

  changePassword: async (payload: { currentPassword: string; newPassword: string; confirmPassword: string }): Promise<{ message: string }> => {
    return await request('/profile/change-password', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  // Admin APIs
  getAdminMetrics: async () => {
    const res = await request<{ data: any }>('/admin/metrics');
    return res.data;
  },

  getAdminCustomers: async (params?: { q?: string; status?: string }) => {
    const query = new URLSearchParams();
    if (params?.q) query.append('q', params.q);
    if (params?.status) query.append('status', params.status);
    const queryString = query.toString() ? `?${query.toString()}` : '';
    const res = await request<{ data: { customers: any[]; total: number } }>(`/admin/customers${queryString}`);
    return res.data;
  },

  updateCustomerStatus: async (accountId: string, status: string, reason?: string) => {
    return await request<{ success: boolean; data: any; message: string; error?: string }>(`/admin/customers/${encodeURIComponent(accountId)}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status, reason }),
    });
  },

  adjustCustomerBalance: async (accountId: string, payload: { amount: number; type: 'credit' | 'debit'; reason: string }) => {
    return await request<{ success: boolean; data: any; message: string; error?: string }>(`/admin/customers/${encodeURIComponent(accountId)}/adjust-balance`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  getAdminTransactions: async (params?: { type?: string; status?: string; search?: string; limit?: number }) => {
    const query = new URLSearchParams();
    if (params?.type) query.append('type', params.type);
    if (params?.status) query.append('status', params.status);
    if (params?.search) query.append('search', params.search);
    if (params?.limit) query.append('limit', String(params.limit));
    const queryString = query.toString() ? `?${query.toString()}` : '';
    const res = await request<{ data: { transactions: any[]; totalCount: number } }>(`/admin/transactions${queryString}`);
    return res.data;
  },

  getAdminAuditLogs: async (params?: { action?: string; result?: string; search?: string; limit?: number }) => {
    const query = new URLSearchParams();
    if (params?.action) query.append('action', params.action);
    if (params?.result) query.append('result', params.result);
    if (params?.search) query.append('search', params.search);
    if (params?.limit) query.append('limit', String(params.limit));
    const queryString = query.toString() ? `?${query.toString()}` : '';
    const res = await request<{ data: { auditLogs: any[]; totalCount: number } }>(`/admin/audit-logs${queryString}`);
    return res.data;
  },

  // Diagnostics & Demo
  getDemoAccounts: async () => {
    return await request('/demo-accounts');
  },

  getHealth: async () => {
    return await fetch('/api/health').then((r) => r.json());
  },
};
