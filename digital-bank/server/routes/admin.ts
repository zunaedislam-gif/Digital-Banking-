import { Router } from 'express';
import { db } from '../db/database.js';
import { authMiddleware, AuthenticatedRequest, adminOnly } from '../middleware/authMiddleware.js';

export const adminRouter = Router();

// GET /api/admin/metrics - comprehensive overview metrics and dynamic chart data
adminRouter.get('/metrics', authMiddleware, adminOnly, (req: AuthenticatedRequest, res) => {
  try {
    const metrics = db.getSystemMetrics();
    const transactions = db.getAllTransactions();
    const users = db.getAllUsers().filter((u) => u.role === 'customer');
    const accounts = db.getAllAccounts();

    // 1. Transaction Type Distribution
    const typeTotals: Record<string, { count: number; volume: number }> = {
      transfers: { count: 0, volume: 0 },
      bill_payments: { count: 0, volume: 0 },
      deposits: { count: 0, volume: 0 },
    };

    transactions.forEach((t) => {
      const amt = t.amount || 0;
      if (t.type === 'deposit') {
        typeTotals.deposits.count++;
        typeTotals.deposits.volume += amt;
      } else if (t.type === 'bill_payment') {
        typeTotals.bill_payments.count++;
        typeTotals.bill_payments.volume += amt;
      } else {
        typeTotals.transfers.count++;
        typeTotals.transfers.volume += amt;
      }
    });

    const totalTxnVolume = Object.values(typeTotals).reduce((sum, item) => sum + item.volume, 0);

    const transactionTypes = [
      {
        name: 'Transfers',
        count: typeTotals.transfers.count,
        volume: typeTotals.transfers.volume,
        percentage: totalTxnVolume > 0 ? Math.round((typeTotals.transfers.volume / totalTxnVolume) * 100) : 0,
      },
      {
        name: 'Bill Payments',
        count: typeTotals.bill_payments.count,
        volume: typeTotals.bill_payments.volume,
        percentage: totalTxnVolume > 0 ? Math.round((typeTotals.bill_payments.volume / totalTxnVolume) * 100) : 0,
      },
      {
        name: 'Deposits',
        count: typeTotals.deposits.count,
        volume: typeTotals.deposits.volume,
        percentage: totalTxnVolume > 0 ? Math.round((typeTotals.deposits.volume / totalTxnVolume) * 100) : 0,
      },
    ];

    // 2. Monthly Transaction Volume (last 6 months)
    const now = new Date();
    const monthlyMap: Record<string, { month: string; volume: number; count: number }> = {};
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const monthLabel = d.toLocaleString('en-US', { month: 'short' });
      monthlyMap[key] = { month: monthLabel, volume: 0, count: 0 };
    }

    transactions.forEach((t) => {
      const d = new Date(t.timestamp);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      if (monthlyMap[key]) {
        monthlyMap[key].volume += t.amount || 0;
        monthlyMap[key].count++;
      }
    });

    const monthlyVolumeTrend = Object.values(monthlyMap);

    // 3. Customer Growth by month
    const growthMap: Record<string, { month: string; newCustomers: number; totalCumulative: number }> = {};
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const monthLabel = d.toLocaleString('en-US', { month: 'short' });
      growthMap[key] = { month: monthLabel, newCustomers: 0, totalCumulative: 0 };
    }

    users.forEach((u) => {
      const d = new Date(u.createdAt);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      if (growthMap[key]) {
        growthMap[key].newCustomers++;
      }
    });

    let cumulative = 0;
    const customerGrowth = Object.values(growthMap).map((item) => {
      cumulative += item.newCustomers;
      return {
        ...item,
        totalCumulative: Math.max(cumulative, 1),
      };
    });

    res.json({
      success: true,
      data: {
        summary: metrics,
        transactionTypes,
        monthlyVolumeTrend,
        customerGrowth,
        recentTransactions: transactions.slice(0, 6),
      },
    });
  } catch (err) {
    console.error('[Admin] metrics error:', err);
    res.status(500).json({ success: false, error: 'Failed to retrieve admin system metrics.' });
  }
});

// GET /api/admin/customers - list all registered customers with account and activity details
adminRouter.get('/customers', authMiddleware, adminOnly, (req: AuthenticatedRequest, res) => {
  try {
    const { q, status } = req.query;
    const users = db.getAllUsers().filter((u) => u.role === 'customer');
    const accounts = db.getAllAccounts();
    const transactions = db.getAllTransactions();

    let customerRecords = users.map((user) => {
      const account = accounts.find((a) => a.userId === user.id);
      const userTxns = transactions.filter(
        (t) => t.senderUserId === user.id || t.recipientUserId === user.id
      );

      return {
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        phone: user.phone,
        dateOfBirth: user.dateOfBirth,
        address: user.address,
        createdAt: user.createdAt,
        lastLoginAt: user.lastLoginAt,
        account: account || null,
        transactionCount: userTxns.length,
      };
    });

    if (q && typeof q === 'string') {
      const searchTerm = q.toLowerCase().trim();
      customerRecords = customerRecords.filter(
        (c) =>
          c.fullName.toLowerCase().includes(searchTerm) ||
          c.email.toLowerCase().includes(searchTerm) ||
          c.phone.includes(searchTerm) ||
          (c.account && c.account.accountNumber.toLowerCase().includes(searchTerm))
      );
    }

    if (status && typeof status === 'string' && status !== 'all') {
      customerRecords = customerRecords.filter(
        (c) => c.account && c.account.status.toLowerCase() === status.toLowerCase()
      );
    }

    res.json({
      success: true,
      data: {
        customers: customerRecords,
        total: customerRecords.length,
      },
    });
  } catch (err) {
    console.error('[Admin] customers error:', err);
    res.status(500).json({ success: false, error: 'Failed to retrieve customers.' });
  }
});

// PATCH /api/admin/customers/:accountId/status - change customer account status (active, suspended, dormant, closed)
adminRouter.patch('/customers/:accountId/status', authMiddleware, adminOnly, (req: AuthenticatedRequest, res) => {
  try {
    const { accountId } = req.params;
    const { status, reason } = req.body;

    const validStatuses = ['active', 'suspended', 'dormant', 'closed'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        error: `Invalid status. Must be one of: ${validStatuses.join(', ')}`,
      });
    }

    const currentAcc = db.getAccountById(accountId);
    if (!currentAcc) {
      return res.status(404).json({ success: false, error: 'Account not found.' });
    }

    const previousStatus = currentAcc.status;
    const updated = db.setAccountStatus(accountId, status);

    const user = db.getUserById(currentAcc.userId);
    const adminUser = req.user!;

    // Log administrative action
    db.addAuditLog({
      userId: adminUser.id,
      userEmail: adminUser.email,
      userRole: 'admin',
      action: 'ADMIN_ACCOUNT_STATUS_CHANGE',
      resource: currentAcc.accountNumber,
      details: `Changed status from ${previousStatus.toUpperCase()} to ${status.toUpperCase()} for ${user?.fullName || 'customer'}. Reason: ${reason || 'Administrative review'}`,
      result: 'SUCCESS',
    });

    // Notify the customer
    if (user) {
      db.addAuditLog({
        userId: user.id,
        userEmail: user.email,
        userRole: 'customer',
        action: 'ACCOUNT_STATUS_UPDATED',
        resource: currentAcc.accountNumber,
        details: `Account status updated to ${status}. Reason: ${reason || 'Bank policy compliance'}`,
        result: 'SUCCESS',
      });
    }

    res.json({
      success: true,
      message: `Account status successfully changed to ${status}.`,
      data: { account: updated },
    });
  } catch (err) {
    console.error('[Admin] update status error:', err);
    res.status(500).json({ success: false, error: 'Failed to update account status.' });
  }
});

// POST /api/admin/customers/:accountId/adjust-balance - credit or debit customer account
adminRouter.post('/customers/:accountId/adjust-balance', authMiddleware, adminOnly, (req: AuthenticatedRequest, res) => {
  try {
    const { accountId } = req.params;
    const { amount, type, reason } = req.body;

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      return res.status(400).json({ success: false, error: 'Amount must be greater than zero.' });
    }

    if (type !== 'credit' && type !== 'debit') {
      return res.status(400).json({ success: false, error: "Adjustment type must be 'credit' or 'debit'." });
    }

    if (!reason || typeof reason !== 'string' || reason.trim().length === 0) {
      return res.status(400).json({ success: false, error: 'A valid reason or reference note is required for balance adjustments.' });
    }

    const admin = req.user!;
    const result = db.adjustAccountBalance({
      accountId,
      amount: parsedAmount,
      type,
      reason: reason.trim(),
      adminUserId: admin.id,
      adminEmail: admin.email,
    });

    if (!result.success) {
      return res.status(400).json({ success: false, error: result.message });
    }

    res.json({
      success: true,
      message: result.message,
      data: {
        account: result.account,
        transaction: result.transaction,
      },
    });
  } catch (err) {
    console.error('[Admin] adjust balance error:', err);
    res.status(500).json({ success: false, error: 'Failed to adjust account balance.' });
  }
});

// GET /api/admin/transactions - view all bank transactions system-wide
adminRouter.get('/transactions', authMiddleware, adminOnly, (req: AuthenticatedRequest, res) => {
  try {
    const { type, status, search, limit } = req.query;
    let transactions = db.getAllTransactions();

    if (type && typeof type === 'string' && type !== 'all') {
      transactions = transactions.filter((t) => t.type === type);
    }

    if (status && typeof status === 'string' && status !== 'all') {
      transactions = transactions.filter((t) => t.status === status);
    }

    if (search && typeof search === 'string') {
      const q = search.toLowerCase().trim();
      transactions = transactions.filter(
        (t) =>
          t.transactionReference.toLowerCase().includes(q) ||
          (t.senderName && t.senderName.toLowerCase().includes(q)) ||
          (t.recipientName && t.recipientName.toLowerCase().includes(q)) ||
          (t.senderAccountNumber && t.senderAccountNumber.toLowerCase().includes(q)) ||
          (t.recipientAccountNumber && t.recipientAccountNumber.toLowerCase().includes(q)) ||
          (t.description && t.description.toLowerCase().includes(q))
      );
    }

    const maxItems = limit ? parseInt(limit as string, 10) : 100;

    res.json({
      success: true,
      data: {
        transactions: transactions.slice(0, maxItems),
        totalCount: transactions.length,
      },
    });
  } catch (err) {
    console.error('[Admin] transactions error:', err);
    res.status(500).json({ success: false, error: 'Failed to retrieve transactions.' });
  }
});

// GET /api/admin/audit-logs - view comprehensive bank audit logs
adminRouter.get('/audit-logs', authMiddleware, adminOnly, (req: AuthenticatedRequest, res) => {
  try {
    const { action, result: resultFilter, search, limit } = req.query;
    let logs = db.getAllAuditLogs();

    if (action && typeof action === 'string' && action !== 'all') {
      logs = logs.filter((l) => l.action.toLowerCase() === action.toLowerCase());
    }

    if (resultFilter && typeof resultFilter === 'string' && resultFilter !== 'all') {
      logs = logs.filter((l) => l.result.toLowerCase() === resultFilter.toLowerCase());
    }

    if (search && typeof search === 'string') {
      const q = search.toLowerCase().trim();
      logs = logs.filter(
        (l) =>
          (l.userEmail && l.userEmail.toLowerCase().includes(q)) ||
          l.action.toLowerCase().includes(q) ||
          l.resource.toLowerCase().includes(q) ||
          l.details.toLowerCase().includes(q)
      );
    }

    const maxItems = limit ? parseInt(limit as string, 10) : 200;

    res.json({
      success: true,
      data: {
        auditLogs: logs.slice(0, maxItems),
        totalCount: logs.length,
      },
    });
  } catch (err) {
    console.error('[Admin] audit-logs error:', err);
    res.status(500).json({ success: false, error: 'Failed to retrieve audit logs.' });
  }
});
