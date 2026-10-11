import { Router } from 'express';
import { db } from '../db/database.js';
import { authMiddleware, AuthenticatedRequest, customerOnly } from '../middleware/authMiddleware.js';

export const accountRouter = Router();

// GET /api/accounts/my-account
accountRouter.get('/my-account', authMiddleware, customerOnly, (req: AuthenticatedRequest, res) => {
  try {
    const user = req.user!;
    const account = db.getAccountByUserId(user.id);
    if (!account) {
      res.status(404).json({ success: false, error: 'No bank account found for this customer.' });
      return;
    }

    const cards = db.getCardsForUser(user.id);
    const notifications = db.getNotificationsForUser(user.id);
    const unreadNotifications = notifications.filter((n) => !n.isRead).length;

    res.json({
      success: true,
      data: {
        account,
        primaryCard: cards[0] || null,
        cardsCount: cards.length,
        unreadNotifications,
      },
    });
  } catch (err) {
    console.error('[Accounts] my-account error:', err);
    res.status(500).json({ success: false, error: 'Failed to retrieve account details.' });
  }
});

// GET /api/accounts/analytics - dynamically computes charts & statistics from actual database transactions
accountRouter.get('/analytics', authMiddleware, customerOnly, (req: AuthenticatedRequest, res) => {
  try {
    const user = req.user!;
    const account = db.getAccountByUserId(user.id);
    if (!account) {
      res.status(404).json({ success: false, error: 'Account not found.' });
      return;
    }

    const transactions = db.getTransactionsForUser(user.id);

    let totalIncome = 0;
    let totalExpense = 0;
    const categoryTotals: Record<string, number> = {};

    // Grouping by month (YYYY-MM)
    const monthlyMap: Record<string, { month: string; income: number; expense: number }> = {};

    // Initialize last 6 calendar months
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const monthLabel = d.toLocaleString('en-US', { month: 'short' });
      monthlyMap[key] = { month: monthLabel, income: 0, expense: 0 };
    }

    transactions.forEach((t) => {
      if (t.status !== 'completed') return;

      const isIncoming =
        t.recipientUserId === user.id ||
        (t.recipientAccountId && t.recipientAccountId === account.id) ||
        (t.recipientAccountNumber && t.recipientAccountNumber === account.accountNumber) ||
        t.type === 'deposit' ||
        t.type === 'transfer_in';

      const txnDate = new Date(t.timestamp);
      const monthKey = `${txnDate.getFullYear()}-${String(txnDate.getMonth() + 1).padStart(2, '0')}`;

      if (isIncoming) {
        totalIncome += t.amount;
        if (monthlyMap[monthKey]) {
          monthlyMap[monthKey].income += t.amount;
        }
      } else {
        totalExpense += t.amount;
        if (monthlyMap[monthKey]) {
          monthlyMap[monthKey].expense += t.amount;
        }

        // Aggregate category expenses
        const cat = t.category || 'other';
        categoryTotals[cat] = (categoryTotals[cat] || 0) + t.amount;
      }
    });

    // Format category distribution
    const categoryBreakdown = Object.entries(categoryTotals).map(([category, amount]) => ({
      category,
      amount,
      percentage: totalExpense > 0 ? Math.round((amount / totalExpense) * 100) : 0,
    })).sort((a, b) => b.amount - a.amount);

    const monthlyTrend = Object.values(monthlyMap);

    res.json({
      success: true,
      data: {
        totalIncome,
        totalExpense,
        netSavings: totalIncome - totalExpense,
        categoryBreakdown,
        monthlyTrend,
        recentTransactions: transactions.slice(0, 5),
      },
    });
  } catch (err) {
    console.error('[Accounts] analytics error:', err);
    res.status(500).json({ success: false, error: 'Failed to generate financial analytics.' });
  }
});
