import { Router } from 'express';
import { db } from '../db/database.js';
import { authMiddleware, AuthenticatedRequest, customerOnly } from '../middleware/authMiddleware.js';
import { verifyPassword } from '../db/seedData.js';

export const profileRouter = Router();

// GET /api/profile - get full profile and session history
profileRouter.get('/', authMiddleware, customerOnly, (req: AuthenticatedRequest, res) => {
  try {
    const user = req.user!;
    const account = db.getAccountByUserId(user.id);
    const auditLogs = db.getAllAuditLogs();

    // Extract user's login and security history
    const loginHistory = auditLogs
      .filter((log) => log.userId === user.id && (log.action.includes('LOGIN') || log.action.includes('AUTH') || log.action.includes('PASSWORD')))
      .slice(0, 10)
      .map((log) => ({
        id: log.id,
        action: log.action,
        timestamp: log.timestamp,
        ipAddress: log.ipAddress || '103.125.101.44',
        device: 'Chrome on macOS (Desktop)',
        result: log.result,
        details: log.details,
      }));

    res.json({
      success: true,
      data: {
        user,
        account,
        loginHistory,
      },
    });
  } catch (err) {
    console.error('[Profile] get error:', err);
    res.status(500).json({ success: false, error: 'Failed to retrieve profile.' });
  }
});

// PATCH /api/profile - update editable details (fullName, phone, address)
profileRouter.patch('/', authMiddleware, customerOnly, (req: AuthenticatedRequest, res) => {
  try {
    const user = req.user!;
    const { fullName, phone, address } = req.body;

    if (fullName && (typeof fullName !== 'string' || fullName.trim().length < 3)) {
      res.status(400).json({ success: false, error: 'Full legal name must be at least 3 characters.' });
      return;
    }

    if (phone && (typeof phone !== 'string' || phone.trim().length < 8)) {
      res.status(400).json({ success: false, error: 'Please enter a valid phone number.' });
      return;
    }

    if (address && (typeof address !== 'string' || address.trim().length < 5)) {
      res.status(400).json({ success: false, error: 'Please provide a valid residential address.' });
      return;
    }

    const updatedUser = db.updateUser(user.id, {
      fullName,
      phone,
      address,
    });

    if (!updatedUser) {
      res.status(404).json({ success: false, error: 'User record not found.' });
      return;
    }

    db.addAuditLog({
      userId: user.id,
      userEmail: user.email,
      userRole: user.role,
      action: 'PROFILE_UPDATED',
      resource: `USER:${user.id}`,
      details: 'Customer updated personal contact details',
      ipAddress: req.ip,
      result: 'SUCCESS',
    });

    res.json({
      success: true,
      message: 'Profile details updated successfully.',
      data: updatedUser,
    });
  } catch (err) {
    console.error('[Profile] patch error:', err);
    res.status(500).json({ success: false, error: 'Failed to update profile.' });
  }
});

// POST /api/profile/change-password
profileRouter.post('/change-password', authMiddleware, customerOnly, (req: AuthenticatedRequest, res) => {
  try {
    const user = req.user!;
    const { currentPassword, newPassword, confirmPassword } = req.body;

    if (!currentPassword || !newPassword || !confirmPassword) {
      res.status(400).json({ success: false, error: 'All password fields are required.' });
      return;
    }

    if (newPassword.length < 6) {
      res.status(400).json({ success: false, error: 'New password must be at least 6 characters long.' });
      return;
    }

    if (newPassword !== confirmPassword) {
      res.status(400).json({ success: false, error: 'New passwords do not match.' });
      return;
    }

    const storedUser = db.getUserById(user.id);
    if (!storedUser) {
      res.status(404).json({ success: false, error: 'User record not found.' });
      return;
    }

    // Verify current password
    const isCurrentValid = verifyPassword(currentPassword, storedUser.passwordHash, storedUser.passwordSalt);
    if (!isCurrentValid) {
      db.addAuditLog({
        userId: user.id,
        userEmail: user.email,
        userRole: user.role,
        action: 'PASSWORD_CHANGE_FAILED',
        resource: 'SECURITY',
        details: 'Incorrect current password provided during password change attempt',
        ipAddress: req.ip,
        result: 'FAILURE',
      });
      res.status(401).json({ success: false, error: 'Incorrect current password.' });
      return;
    }

    // Update password
    db.updatePassword(user.id, newPassword);

    // Add security notification
    db.addAuditLog({
      userId: user.id,
      userEmail: user.email,
      userRole: user.role,
      action: 'PASSWORD_CHANGED',
      resource: 'SECURITY',
      details: 'Password successfully modified by user',
      ipAddress: req.ip,
      result: 'SUCCESS',
    });

    res.json({
      success: true,
      message: 'Password changed successfully. Your account is secured with your new credentials.',
    });
  } catch (err) {
    console.error('[Profile] change-password error:', err);
    res.status(500).json({ success: false, error: 'Failed to change password.' });
  }
});
