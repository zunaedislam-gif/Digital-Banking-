import { Request, Response, NextFunction } from 'express';
import { db } from '../db/database.js';
import { User } from '../../src/types/banking.js';

export interface AuthenticatedRequest extends Request {
  user?: User;
  token?: string;
}

export function authMiddleware(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ success: false, error: 'Authentication required. No Bearer token provided.' });
    return;
  }

  const token = authHeader.substring(7).trim();
  const session = db.getSession(token);

  if (!session) {
    res.status(401).json({ success: false, error: 'Session expired or invalid. Please sign in again.' });
    return;
  }

  const storedUser = db.getUserById(session.userId);
  if (!storedUser) {
    res.status(401).json({ success: false, error: 'User associated with session not found.' });
    return;
  }

  req.user = db.sanitizeUser(storedUser);
  req.token = token;
  next();
}

export function adminOnly(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  if (!req.user) {
    res.status(401).json({ success: false, error: 'Authentication required.' });
    return;
  }

  if (req.user.role !== 'admin') {
    db.addAuditLog({
      userId: req.user.id,
      userEmail: req.user.email,
      userRole: req.user.role,
      action: 'UNAUTHORIZED_ADMIN_ATTEMPT',
      resource: req.originalUrl,
      details: `User attempted to access restricted admin route ${req.originalUrl}`,
      result: 'FAILURE',
      ipAddress: req.ip,
    });

    res.status(403).json({ success: false, error: 'Access denied: Administrator privileges required.' });
    return;
  }

  next();
}

export function customerOnly(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  if (!req.user) {
    res.status(401).json({ success: false, error: 'Authentication required.' });
    return;
  }

  if (req.user.role !== 'customer') {
    res.status(403).json({ success: false, error: 'Access restricted to customer accounts.' });
    return;
  }

  next();
}
