import { Router } from 'express';
import { db } from '../db/database.js';
import { authMiddleware, AuthenticatedRequest, customerOnly } from '../middleware/authMiddleware.js';

export const beneficiaryRouter = Router();

// GET /api/beneficiaries - list customer's beneficiaries
beneficiaryRouter.get('/', authMiddleware, customerOnly, (req: AuthenticatedRequest, res) => {
  try {
    const user = req.user!;
    const beneficiaries = db.getBeneficiariesForUser(user.id);
    res.json({
      success: true,
      data: beneficiaries,
    });
  } catch (err) {
    console.error('[Beneficiaries] list error:', err);
    res.status(500).json({ success: false, error: 'Failed to retrieve beneficiaries.' });
  }
});

// POST /api/beneficiaries - add new beneficiary with account verification
beneficiaryRouter.post('/', authMiddleware, customerOnly, (req: AuthenticatedRequest, res) => {
  try {
    const user = req.user!;
    const { accountNumber, nickname, bankName } = req.body;

    if (!accountNumber || typeof accountNumber !== 'string') {
      res.status(400).json({ success: false, error: 'Account number is required.' });
      return;
    }

    const cleanAcc = accountNumber.trim().toUpperCase();
    const result = db.addBeneficiary({
      userId: user.id,
      accountNumber: cleanAcc,
      nickname: (nickname || '').trim(),
      bankName: (bankName || 'ZR Digital Bank').trim(),
    });

    if (!result.success) {
      res.status(400).json({ success: false, error: result.message });
      return;
    }

    res.status(201).json({
      success: true,
      message: result.message,
      data: result.beneficiary,
    });
  } catch (err) {
    console.error('[Beneficiaries] add error:', err);
    res.status(500).json({ success: false, error: 'Failed to add beneficiary.' });
  }
});

// DELETE /api/beneficiaries/:id - remove beneficiary
beneficiaryRouter.delete('/:id', authMiddleware, customerOnly, (req: AuthenticatedRequest, res) => {
  try {
    const user = req.user!;
    const { id } = req.params;

    const success = db.deleteBeneficiary(user.id, id);
    if (!success) {
      res.status(404).json({ success: false, error: 'Beneficiary record not found.' });
      return;
    }

    res.json({
      success: true,
      message: 'Beneficiary removed successfully.',
    });
  } catch (err) {
    console.error('[Beneficiaries] delete error:', err);
    res.status(500).json({ success: false, error: 'Failed to remove beneficiary.' });
  }
});
