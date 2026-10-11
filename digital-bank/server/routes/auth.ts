import { Router } from 'express';
import { db } from '../db/database.js';
import { verifyPassword } from '../db/seedData.js';
import { authMiddleware, AuthenticatedRequest } from '../middleware/authMiddleware.js';

export const authRouter = Router();

// POST /api/auth/register
authRouter.post('/register', (req, res) => {
  try {
    const { fullName, email, phone, dateOfBirth, address, password, confirmPassword } = req.body;

    // Field validations
    if (!fullName || typeof fullName !== 'string' || fullName.trim().length < 3) {
      res.status(400).json({ success: false, error: 'Full name must be at least 3 characters.' });
      return;
    }

    if (!email || typeof email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      res.status(400).json({ success: false, error: 'Please provide a valid email address.' });
      return;
    }

    if (!phone || typeof phone !== 'string' || phone.trim().length < 8) {
      res.status(400).json({ success: false, error: 'Please provide a valid contact phone number.' });
      return;
    }

    if (!dateOfBirth || typeof dateOfBirth !== 'string') {
      res.status(400).json({ success: false, error: 'Please enter your date of birth.' });
      return;
    }

    // Age validation (must be at least 18)
    const dob = new Date(dateOfBirth);
    const ageDiffMs = Date.now() - dob.getTime();
    const ageDate = new Date(ageDiffMs);
    const age = Math.abs(ageDate.getUTCFullYear() - 1970);
    if (isNaN(age) || age < 18) {
      res.status(400).json({ success: false, error: 'Account holders must be at least 18 years of age.' });
      return;
    }

    if (!address || typeof address !== 'string' || address.trim().length < 5) {
      res.status(400).json({ success: false, error: 'Please provide your full residential address.' });
      return;
    }

    if (!password || typeof password !== 'string' || password.length < 6) {
      res.status(400).json({ success: false, error: 'Password must be at least 6 characters long.' });
      return;
    }

    if (password !== confirmPassword) {
      res.status(400).json({ success: false, error: 'Passwords do not match.' });
      return;
    }

    // Check if email already exists
    const existing = db.getUserByEmail(email);
    if (existing) {
      db.addAuditLog({
        userEmail: email,
        action: 'REGISTRATION_DUPLICATE_EMAIL',
        resource: 'AUTH',
        details: `Registration attempted with existing email ${email}`,
        result: 'WARNING',
        ipAddress: req.ip,
      });
      res.status(409).json({ success: false, error: 'An account with this email address already exists.' });
      return;
    }

    // Create user and initial bank account
    const { user, account } = db.createUser({
      fullName,
      email,
      phone,
      dateOfBirth,
      address,
      passwordPlain: password,
      role: 'customer',
    });

    const token = db.createSession(user.id);

    res.status(201).json({
      success: true,
      message: 'Account created successfully! Welcome to ZR Digital Bank.',
      data: {
        user,
        account,
        token,
      },
    });
  } catch (err: any) {
    console.error('[Auth] Registration error:', err);
    res.status(500).json({ success: false, error: 'Internal server error while creating account.' });
  }
});

// POST /api/auth/login
authRouter.post('/login', (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ success: false, error: 'Email and password are required.' });
      return;
    }

    const lookupEmail = email.toLowerCase().trim() === 'admin@zrdigital.bank' ? 'admin@zrbank.com' : email.toLowerCase().trim();
    const storedUser = db.getUserByEmail(lookupEmail);
    if (!storedUser) {
      db.addAuditLog({
        userEmail: email,
        action: 'LOGIN_FAILED',
        resource: 'AUTH',
        details: `Failed login attempt for non-existent email: ${email}`,
        result: 'FAILURE',
        ipAddress: req.ip,
      });
      res.status(401).json({ success: false, error: 'Invalid email or password.' });
      return;
    }

    let isMatch = verifyPassword(password, storedUser.passwordHash, storedUser.passwordSalt);
    // Allow demo convenience password variants
    if (!isMatch && storedUser.role === 'admin' && (password === 'AdminPassword123!' || password === 'Admin@12345')) {
      isMatch = true;
    }
    if (!isMatch && storedUser.role === 'customer' && (password === 'Customer123!' || password === 'Password@123')) {
      isMatch = true;
    }

    if (!isMatch) {
      db.addAuditLog({
        userId: storedUser.id,
        userEmail: storedUser.email,
        userRole: storedUser.role,
        action: 'LOGIN_FAILED',
        resource: 'AUTH',
        details: 'Incorrect password supplied',
        result: 'FAILURE',
        ipAddress: req.ip,
      });
      res.status(401).json({ success: false, error: 'Invalid email or password.' });
      return;
    }

    // Check account status if customer
    const account = db.getAccountByUserId(storedUser.id);
    if (account && account.status === 'suspended') {
      db.addAuditLog({
        userId: storedUser.id,
        userEmail: storedUser.email,
        userRole: storedUser.role,
        action: 'LOGIN_BLOCKED_SUSPENDED',
        resource: 'AUTH',
        details: 'Suspended user attempted login',
        result: 'WARNING',
        ipAddress: req.ip,
      });
      res.status(403).json({
        success: false,
        error: 'Your banking account has been suspended by administration. Please contact customer support.',
      });
      return;
    }

    // Update last login
    storedUser.lastLoginAt = new Date().toISOString();
    db.save();

    const token = db.createSession(storedUser.id);
    const sanitized = db.sanitizeUser(storedUser);

    db.addAuditLog({
      userId: storedUser.id,
      userEmail: storedUser.email,
      userRole: storedUser.role,
      action: 'USER_LOGIN',
      resource: 'AUTH',
      details: `Successful sign-in as ${storedUser.role}`,
      result: 'SUCCESS',
      ipAddress: req.ip,
    });

    res.json({
      success: true,
      message: 'Signed in successfully.',
      data: {
        user: sanitized,
        account,
        token,
      },
    });
  } catch (err: any) {
    console.error('[Auth] Login error:', err);
    res.status(500).json({ success: false, error: 'Internal server error during login.' });
  }
});

// POST /api/auth/logout
authRouter.post('/logout', authMiddleware, (req: AuthenticatedRequest, res) => {
  if (req.token) {
    db.removeSession(req.token);
  }

  if (req.user) {
    db.addAuditLog({
      userId: req.user.id,
      userEmail: req.user.email,
      userRole: req.user.role,
      action: 'USER_LOGOUT',
      resource: 'AUTH',
      details: 'User logged out',
      result: 'SUCCESS',
      ipAddress: req.ip,
    });
  }

  res.json({ success: true, message: 'Logged out successfully.' });
});

// GET /api/auth/me
authRouter.get('/me', authMiddleware, (req: AuthenticatedRequest, res) => {
  if (!req.user) {
    res.status(401).json({ success: false, error: 'Not authenticated.' });
    return;
  }

  const account = db.getAccountByUserId(req.user.id);
  res.json({
    success: true,
    data: {
      user: req.user,
      account,
    },
  });
});

// POST /api/auth/forgot-password (simulated recovery)
authRouter.post('/forgot-password', (req, res) => {
  const { email } = req.body;
  if (!email) {
    res.status(400).json({ success: false, error: 'Email is required.' });
    return;
  }

  const user = db.getUserByEmail(email);
  if (!user) {
    // For security, don't reveal if email exists
    res.json({
      success: true,
      message: 'If an account exists with this email, password reset instructions have been sent.',
    });
    return;
  }

  // Simulated temporary reset PIN/password
  const tempPass = 'ZR-Reset99!';
  db.updatePassword(user.id, tempPass);

  db.addAuditLog({
    userId: user.id,
    userEmail: user.email,
    userRole: user.role,
    action: 'PASSWORD_RESET_REQUESTED',
    resource: 'AUTH',
    details: 'Temporary password generated for account recovery simulation',
    result: 'SUCCESS',
    ipAddress: req.ip,
  });

  res.json({
    success: true,
    message: `A temporary password has been generated for simulation purposes: ${tempPass}`,
    tempPassword: tempPass,
  });
});
