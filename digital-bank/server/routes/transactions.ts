import { Router } from 'express';
import { db } from '../db/database.js';
import { authMiddleware, AuthenticatedRequest, customerOnly } from '../middleware/authMiddleware.js';
import { maskAccountNumber } from '../../src/utils/formatters.js';

export const transactionRouter = Router();

// GET /api/transactions/lookup?accountNumber=...
transactionRouter.get('/lookup', authMiddleware, customerOnly, (req: AuthenticatedRequest, res) => {
  try {
    const user = req.user!;
    const accountNumber = req.query.accountNumber as string;

    if (!accountNumber || typeof accountNumber !== 'string' || accountNumber.trim().length < 5) {
      res.status(400).json({ success: false, error: 'Please enter a valid account number.' });
      return;
    }

    const cleanNumber = accountNumber.trim().toUpperCase();
    const myAccount = db.getAccountByUserId(user.id);

    if (myAccount && myAccount.accountNumber.toUpperCase() === cleanNumber) {
      res.status(400).json({ 
        success: false, 
        error: 'You cannot transfer money to your own current account number.' 
      });
      return;
    }

    const targetAccount = db.getAccountByNumber(cleanNumber);
    if (!targetAccount) {
      res.status(404).json({ 
        success: false, 
        error: 'No account matching this account number exists in ZR Digital Bank.' 
      });
      return;
    }

    if (targetAccount.status !== 'active') {
      res.status(400).json({ 
        success: false, 
        error: `The recipient account is currently ${targetAccount.status} and cannot receive funds.` 
      });
      return;
    }

    const recipientUser = db.getUserById(targetAccount.userId);
    if (!recipientUser) {
      res.status(404).json({ success: false, error: 'Recipient user account could not be found.' });
      return;
    }

    res.json({
      success: true,
      data: {
        accountNumber: targetAccount.accountNumber,
        maskedAccountNumber: maskAccountNumber(targetAccount.accountNumber),
        recipientName: recipientUser.fullName,
        bankName: 'ZR Digital Bank',
        accountType: targetAccount.accountType,
      },
    });
  } catch (err) {
    console.error('[Transactions] lookup error:', err);
    res.status(500).json({ success: false, error: 'Error checking recipient account number.' });
  }
});

// Helper function for strict currency amount parsing
function parseStrictAmount(value: unknown): { valid: true; amount: number } | { valid: false; error: string } {
  if (value === undefined || value === null || value === '') {
    return { valid: false, error: 'Transfer amount is required.' };
  }

  let strVal: string;
  if (typeof value === 'number') {
    if (!Number.isFinite(value)) {
      return { valid: false, error: 'Transfer amount must be a finite number.' };
    }
    strVal = value.toString();
  } else if (typeof value === 'string') {
    strVal = value.trim();
  } else {
    return { valid: false, error: 'Transfer amount must be a numeric value.' };
  }

  // Reject malformed inputs (e.g., "12abc", multiple dots, negative signs, excessive decimal precision)
  if (!/^\d+(\.\d{1,2})?$/.test(strVal)) {
    return { valid: false, error: 'Transfer amount must be a positive number with at most 2 decimal places.' };
  }

  const num = Number(strVal);
  if (!Number.isFinite(num) || num <= 0) {
    return { valid: false, error: 'Transfer amount must be a positive number greater than zero.' };
  }

  if (num > 10000000) {
    return { valid: false, error: 'Transfer amount exceeds maximum single transfer limit of ৳10,000,000.00.' };
  }

  return { valid: true, amount: Math.round(num * 100) / 100 };
}

// POST /api/transactions/transfer
transactionRouter.post('/transfer', authMiddleware, customerOnly, async (req: AuthenticatedRequest, res) => {
  try {
    const user = req.user!;
    const { recipientAccountNumber, amount, description, idempotencyKey: bodyKey } = req.body;
    const headerKey = (req.headers['idempotency-key'] || req.headers['x-idempotency-key']) as string | undefined;
    const idempotencyKey = (bodyKey || headerKey || '').trim() || undefined;

    const parsedAmount = parseStrictAmount(amount);
    if (!parsedAmount.valid) {
      res.status(400).json({ success: false, error: parsedAmount.error });
      return;
    }
    const numericAmount = parsedAmount.amount;

    if (!recipientAccountNumber || typeof recipientAccountNumber !== 'string') {
      res.status(400).json({ success: false, error: 'Recipient account number is required.' });
      return;
    }

    const cleanRecipientAcc = recipientAccountNumber.trim().toUpperCase();
    const senderAccount = db.getAccountByUserId(user.id);

    if (senderAccount && senderAccount.accountNumber.toUpperCase() === cleanRecipientAcc) {
      res.status(400).json({
        success: false,
        error: 'Cannot transfer money to your own current account number.',
      });
      return;
    }

    const targetAccount = db.getAccountByNumber(cleanRecipientAcc);
    if (!targetAccount) {
      res.status(404).json({
        success: false,
        code: 'RECIPIENT_NOT_FOUND',
        error: 'Recipient account number does not exist in ZR Digital Bank.',
      });
      return;
    }

    if (targetAccount.status !== 'active') {
      res.status(400).json({
        success: false,
        code: 'RECIPIENT_INACTIVE',
        error: `The recipient account is currently ${targetAccount.status} and cannot receive funds.`,
      });
      return;
    }

    if (senderAccount && senderAccount.availableBalance < numericAmount) {
      res.status(400).json({
        success: false,
        code: 'INSUFFICIENT_BALANCE',
        error: `Insufficient available balance. Spendable: ৳${senderAccount.availableBalance.toFixed(2)}.`,
      });
      return;
    }

    const clientIp = req.ip || req.socket.remoteAddress;

    const result = await db.executeTransfer({
      senderUserId: user.id,
      recipientAccountNumber: cleanRecipientAcc,
      amount: numericAmount,
      description: (description || '').trim(),
      idempotencyKey,
      sessionToken: req.token,
      clientIp,
    });

    if (!result.success) {
      let statusCode = 400;
      if (result.code === 'RECIPIENT_NOT_FOUND' || result.code === 'SENDER_ACCOUNT_NOT_FOUND' || result.message.includes('not exist')) {
        statusCode = 404;
      } else if (result.code === 'SESSION_REQUIRED' || result.code === 'UNAUTHORIZED_SESSION' || result.code === 'SESSION_EXPIRED') {
        statusCode = 401;
      } else if (result.code === 'IDEMPOTENCY_CONFLICT') {
        statusCode = 409;
      } else if (result.code === 'CONFIGURATION_ERROR' || result.code === 'DATABASE_RPC_UNAVAILABLE') {
        statusCode = 503;
      }

      res.status(statusCode).json({ success: false, code: result.code, error: result.message });
      return;
    }

    res.json({
      success: true,
      message: result.message,
      data: {
        transaction: result.transaction,
        updatedBalance: result.updatedBalance,
        isIdempotentReplay: Boolean(result.isIdempotentReplay),
      },
    });
  } catch (err: any) {
    console.error('[Transactions] transfer error:', err);
    res.status(500).json({ success: false, error: 'Internal system error processing fund transfer.' });
  }
});

// GET /api/transactions/my-transactions with filtering, search, and pagination
transactionRouter.get('/my-transactions', authMiddleware, customerOnly, (req: AuthenticatedRequest, res) => {
  try {
    const user = req.user!;
    const all = db.getTransactionsForUser(user.id);

    // Filters
    const search = ((req.query.search as string) || '').toLowerCase().trim();
    const type = (req.query.type as string) || 'all';
    const status = (req.query.status as string) || 'all';
    const dateRange = (req.query.dateRange as string) || 'all';
    const page = Math.max(parseInt((req.query.page as string) || '1', 10), 1);
    const limit = Math.max(parseInt((req.query.limit as string) || '10', 10), 1);

    const now = new Date();
    const myAccount = db.getAccountByUserId(user.id);

    const filtered = all.filter((t) => {
      // 1. Search term (reference, description, names, amount)
      if (search) {
        const matchesRef = t.transactionReference?.toLowerCase().includes(search);
        const matchesDesc = t.description?.toLowerCase().includes(search);
        const matchesSender = t.senderName?.toLowerCase().includes(search);
        const matchesRecipient = t.recipientName?.toLowerCase().includes(search);
        const matchesAmount = t.amount?.toString().includes(search);
        if (!matchesRef && !matchesDesc && !matchesSender && !matchesRecipient && !matchesAmount) {
          return false;
        }
      }

      // 2. Type filter
      if (type !== 'all') {
        if (type === 'transfer_in') {
          const isIncoming =
            t.recipientUserId === user.id ||
            t.type === 'deposit' ||
            t.type === 'transfer_in' ||
            (myAccount && t.recipientAccountNumber === myAccount.accountNumber);
          if (!isIncoming) return false;
        } else if (type === 'transfer_out') {
          if (t.type !== 'transfer_out') return false;
        } else if (type === 'bill_payment') {
          if (t.type !== 'bill_payment') return false;
        } else if (type === 'deposit') {
          if (t.type !== 'deposit') return false;
        } else if (t.type !== type) {
          return false;
        }
      }

      // 3. Status filter
      if (status !== 'all' && t.status !== status) {
        return false;
      }

      // 4. Date range filter
      if (dateRange !== 'all') {
        const tDate = new Date(t.timestamp).getTime();
        if (dateRange === 'today') {
          const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
          if (tDate < startOfDay) return false;
        } else if (dateRange === '7days') {
          const sevenDaysAgo = now.getTime() - 7 * 24 * 60 * 60 * 1000;
          if (tDate < sevenDaysAgo) return false;
        } else if (dateRange === '30days') {
          const thirtyDaysAgo = now.getTime() - 30 * 24 * 60 * 60 * 1000;
          if (tDate < thirtyDaysAgo) return false;
        } else if (dateRange === 'this_month') {
          const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
          if (tDate < startOfMonth) return false;
        }
      }

      return true;
    });

    // Summary calculation for the filtered results
    let totalIn = 0;
    let totalOut = 0;
    filtered.forEach((t) => {
      const isIncoming =
        t.recipientUserId === user.id ||
        t.type === 'deposit' ||
        t.type === 'transfer_in' ||
        (myAccount && t.recipientAccountNumber === myAccount.accountNumber);
      if (isIncoming) {
        totalIn += t.amount;
      } else {
        totalOut += t.amount;
      }
    });

    const total = filtered.length;
    const totalPages = Math.ceil(total / limit) || 1;
    const startIndex = (page - 1) * limit;
    const paginated = filtered.slice(startIndex, startIndex + limit);

    res.json({
      success: true,
      data: {
        transactions: paginated,
        total,
        page,
        totalPages,
        limit,
        summary: {
          totalIn,
          totalOut,
          count: total,
        },
      },
    });
  } catch (err) {
    console.error('[Transactions] list error:', err);
    res.status(500).json({ success: false, error: 'Failed to retrieve transactions.' });
  }
});

// GET /api/transactions/:id
transactionRouter.get('/:id', authMiddleware, customerOnly, (req: AuthenticatedRequest, res) => {
  try {
    const user = req.user!;
    const txnId = req.params.id;

    const txn = db.getTransactionById(txnId);
    if (!txn) {
      res.status(404).json({ success: false, error: 'Transaction record not found.' });
      return;
    }

    // Verify user ownership / separation
    const myAccount = db.getAccountByUserId(user.id);
    const isParty =
      txn.senderUserId === user.id ||
      txn.recipientUserId === user.id ||
      (myAccount && (txn.senderAccountId === myAccount.id || txn.recipientAccountId === myAccount.id));

    if (!isParty && user.role !== 'admin') {
      res.status(403).json({ success: false, error: 'Access denied to this transaction receipt.' });
      return;
    }

    res.json({
      success: true,
      data: txn,
    });
  } catch (err) {
    console.error('[Transactions] detail error:', err);
    res.status(500).json({ success: false, error: 'Failed to retrieve transaction details.' });
  }
});
