import { Router, Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { Role } from '../types';
import * as authController from '../controllers/authController';
import * as parcelController from '../controllers/parcelController';
import * as transactionController from '../controllers/transactionController';
import * as auditController from '../controllers/auditController';

const JWT_SECRET = process.env.JWT_SECRET || 'bhupramaan_secret_key_for_hackathon_2026';
const router = Router();

// ==========================================
// AUTHENTICATION MIDDLEWARE
// ==========================================
export function authMiddleware(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authentication token missing or invalid. Format: Bearer <token>' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    (req as any).user = decoded;
    return next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid or expired session token.' });
  }
}

// Role-Based Access Control Middleware
export function requireRole(allowedRoles: Role[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = (req as any).user;
    if (!user || !allowedRoles.includes(user.role)) {
      return res.status(403).json({ error: `Forbidden: This action requires one of the roles: ${allowedRoles.join(', ')}` });
    }
    return next();
  };
}

// ==========================================
// PUBLIC / AUTH ROUTES
// ==========================================
router.post('/auth/login', authController.login);
router.get('/auth/me', authMiddleware, authController.getCurrentUser);

// ==========================================
// LAND PARCEL ROUTES
// ==========================================
router.get('/parcels', authMiddleware, parcelController.listParcels);
router.get('/parcels/:id', authMiddleware, parcelController.getParcelById);

// ==========================================
// TRANSACTION & VERIFICATION ROUTES
// ==========================================
router.get('/transactions', authMiddleware, transactionController.listTransactions);
router.get('/transactions/:id', authMiddleware, transactionController.getTransactionDetails);
router.post('/transactions/propose', authMiddleware, transactionController.createProposedTransaction);

// Review actions are protected for Officers and Admins
router.post(
  '/transactions/:id/review',
  authMiddleware,
  requireRole(['OFFICER', 'ADMIN']),
  transactionController.reviewTransaction
);

// ==========================================
// TAMPER-EVIDENT AUDIT ROUTES
// ==========================================
router.get('/audit/logs', authMiddleware, auditController.getLogs);
router.get('/audit/verify', authMiddleware, auditController.verifyLogs);

// Tamper simulation is only allowed for Admins or Officers for testing/demo purposes
router.post(
  '/audit/tamper',
  authMiddleware,
  requireRole(['ADMIN', 'OFFICER']),
  auditController.tamperLog
);

export default router;
