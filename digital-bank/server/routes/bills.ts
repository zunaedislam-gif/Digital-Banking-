import { Router } from 'express';
import { db } from '../db/database.js';
import { authMiddleware, AuthenticatedRequest, customerOnly } from '../middleware/authMiddleware.js';

export const billRouter = Router();

// GET /api/bills/providers - list active utility providers
billRouter.get('/providers', (req, res) => {
  try {
    const providers = db.getBillProviders();
    res.json({
      success: true,
      data: providers,
    });
  } catch (err) {
    console.error('[Bills] providers error:', err);
    res.status(500).json({ success: false, error: 'Failed to retrieve bill providers.' });
  }
});

// GET /api/bills/history - user's bill payment history
billRouter.get('/history', authMiddleware, customerOnly, (req: AuthenticatedRequest, res) => {
  try {
    const user = req.user!;
    const history = db.getBillPaymentsForUser(user.id);
    res.json({
      success: true,
      data: history,
    });
  } catch (err) {
    console.error('[Bills] history error:', err);
    res.status(500).json({ success: false, error: 'Failed to retrieve bill payment history.' });
  }
});

// POST /api/bills/pay - execute utility bill payment
billRouter.post('/pay', authMiddleware, customerOnly, (req: AuthenticatedRequest, res) => {
  try {
    const user = req.user!;
    const { providerId, customerNumber, amount } = req.body;

    if (!providerId || typeof providerId !== 'string') {
      res.status(400).json({ success: false, error: 'Utility provider is required.' });
      return;
    }

    if (!customerNumber || typeof customerNumber !== 'string' || customerNumber.trim().length < 4) {
      res.status(400).json({ success: false, error: 'Please enter a valid customer / consumer account number.' });
      return;
    }

    const numericAmount = parseFloat(amount);
    if (isNaN(numericAmount) || numericAmount <= 0) {
      res.status(400).json({ success: false, error: 'Payment amount must be greater than zero.' });
      return;
    }

    const clientIp = req.ip || req.socket.remoteAddress;

    const result = db.payBill({
      userId: user.id,
      providerId,
      customerNumber: customerNumber.trim(),
      amount: numericAmount,
      clientIp,
    });

    if (!result.success) {
      res.status(400).json({ success: false, error: result.message });
      return;
    }

    const updatedAccount = db.getAccountByUserId(user.id);

    res.json({
      success: true,
      message: result.message,
      data: {
        billPayment: result.billPayment,
        transaction: result.transaction,
        updatedBalance: updatedAccount?.availableBalance || 0,
      },
    });
  } catch (err) {
    console.error('[Bills] pay error:', err);
    res.status(500).json({ success: false, error: 'Failed to process bill payment.' });
  }
});
