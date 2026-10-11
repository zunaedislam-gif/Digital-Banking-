import { Router } from 'express';
import { db } from '../db/database.js';
import { authRouter } from './auth.js';
import { accountRouter } from './accounts.js';
import { transactionRouter } from './transactions.js';
import { beneficiaryRouter } from './beneficiaries.js';
import { billRouter } from './bills.js';
import { cardRouter } from './cards.js';
import { notificationRouter } from './notifications.js';
import { profileRouter } from './profile.js';
import { adminRouter } from './admin.js';

export const apiRouter = Router();

// Authentication Routes
apiRouter.use('/auth', authRouter);

// Accounts & Financial Analytics
apiRouter.use('/accounts', accountRouter);

// Transactions & Money Transfer
apiRouter.use('/transactions', transactionRouter);

// Beneficiaries Management
apiRouter.use('/beneficiaries', beneficiaryRouter);

// Utility Bill Payments
apiRouter.use('/bills', billRouter);

// Card Management
apiRouter.use('/cards', cardRouter);

// Notifications Center
apiRouter.use('/notifications', notificationRouter);

// Customer Profile & Security
apiRouter.use('/profile', profileRouter);

// Administration & Compliance
apiRouter.use('/admin', adminRouter);

// System Health & Database Diagnostics
apiRouter.get('/health', async (req, res) => {
  const supabase = await db.getSupabaseStatus();
  res.json({
    status: 'ok',
    service: 'ZR Digital Bank Core Engine',
    database: {
      type: 'Supabase PostgreSQL Cloud Storage',
      supabase,
    },
    timestamp: new Date().toISOString(),
    metrics: db.getSystemMetrics(),
  });
});

apiRouter.get('/supabase/status', async (req, res) => {
  const status = await db.getSupabaseStatus();
  res.json({
    success: true,
    data: status,
  });
});

// Demo accounts endpoint for easy one-click testing & login
apiRouter.get('/demo-accounts', (req, res) => {
  const users = db.getAllUsers();
  const accounts = db.getAllAccounts();

  const demoList = users.map((u) => {
    const acc = accounts.find((a) => a.userId === u.id);
    return {
      id: u.id,
      fullName: u.fullName,
      email: u.email,
      role: u.role,
      passwordHint: u.role === 'admin' ? 'AdminPassword123!' : 'Customer123!',
      accountNumber: acc?.accountNumber,
      balance: acc?.balance,
      status: acc?.status,
    };
  });

  res.json({
    success: true,
    data: demoList,
  });
});

// Utility providers list (publicly readable for bills)
apiRouter.get('/bill-providers', (req, res) => {
  res.json({
    success: true,
    data: db.getBillProviders(),
  });
});
