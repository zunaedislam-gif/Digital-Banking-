import { Router } from 'express';
import { db } from '../db/database.js';
import { authMiddleware, AuthenticatedRequest, customerOnly } from '../middleware/authMiddleware.js';

export const cardRouter = Router();

// GET /api/cards - list customer's cards
cardRouter.get('/', authMiddleware, customerOnly, (req: AuthenticatedRequest, res) => {
  try {
    const user = req.user!;
    const cards = db.getCardsForUser(user.id);
    res.json({
      success: true,
      data: cards,
    });
  } catch (err) {
    console.error('[Cards] list error:', err);
    res.status(500).json({ success: false, error: 'Failed to retrieve cards.' });
  }
});

// PATCH /api/cards/:id/status - freeze, unfreeze, or report
cardRouter.patch('/:id/status', authMiddleware, customerOnly, (req: AuthenticatedRequest, res) => {
  try {
    const user = req.user!;
    const { id } = req.params;
    const { status } = req.body;

    if (!status || !['active', 'frozen', 'reported', 'cancelled'].includes(status)) {
      res.status(400).json({ success: false, error: 'Invalid card status value.' });
      return;
    }

    const result = db.updateCardStatus(user.id, id, status);
    if (!result.success) {
      res.status(404).json({ success: false, error: result.message });
      return;
    }

    res.json({
      success: true,
      message: result.message,
      data: result.card,
    });
  } catch (err) {
    console.error('[Cards] status error:', err);
    res.status(500).json({ success: false, error: 'Failed to update card status.' });
  }
});

// PATCH /api/cards/:id/limit - update daily limit
cardRouter.patch('/:id/limit', authMiddleware, customerOnly, (req: AuthenticatedRequest, res) => {
  try {
    const user = req.user!;
    const { id } = req.params;
    const { dailyLimit } = req.body;

    const limitNum = parseFloat(dailyLimit);
    if (isNaN(limitNum) || limitNum < 1000 || limitNum > 500000) {
      res.status(400).json({ success: false, error: 'Daily limit must be between ৳1,000 and ৳500,000.' });
      return;
    }

    const result = db.updateCardLimit(user.id, id, limitNum);
    if (!result.success) {
      res.status(404).json({ success: false, error: result.message });
      return;
    }

    res.json({
      success: true,
      message: result.message,
      data: result.card,
    });
  } catch (err) {
    console.error('[Cards] limit error:', err);
    res.status(500).json({ success: false, error: 'Failed to update daily spend limit.' });
  }
});

// POST /api/cards - request new virtual card
cardRouter.post('/', authMiddleware, customerOnly, (req: AuthenticatedRequest, res) => {
  try {
    const user = req.user!;
    const { type, network } = req.body;

    const cardType = type === 'credit' ? 'credit' : 'debit';
    const cardNetwork = network === 'mastercard' ? 'mastercard' : 'visa';

    const card = db.createVirtualCard(user.id, cardType, cardNetwork);
    res.status(201).json({
      success: true,
      message: 'New virtual banking card generated successfully.',
      data: card,
    });
  } catch (err) {
    console.error('[Cards] issue error:', err);
    res.status(500).json({ success: false, error: 'Failed to generate new card.' });
  }
});
