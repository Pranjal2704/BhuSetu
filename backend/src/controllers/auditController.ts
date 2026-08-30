import { Request, Response } from 'express';
import { getDb } from '../config/db';
import { AuditService } from '../services/auditService';

export async function getLogs(req: Request, res: Response) {
  try {
    const db = await getDb();
    const logs = await db.all('SELECT * FROM audit_logs ORDER BY id DESC');
    return res.json(logs);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}

export async function verifyLogs(req: Request, res: Response) {
  try {
    const result = await AuditService.verifyIntegrity();
    return res.json(result);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}

export async function tamperLog(req: Request, res: Response) {
  try {
    const { id, alteredDetails } = req.body;
    
    if (!id || !alteredDetails) {
      return res.status(400).json({ error: 'id and alteredDetails are required.' });
    }

    const user = (req as any).user;

    // Run direct SQLite update bypassing the hashing mechanism to simulate an intruder
    await AuditService.tamperLog(id, alteredDetails);

    // Note: Do not write a log using writeLog because it would recalculate a valid current_hash
    // We intentionally create a mismatch in the database to simulate tampering.
    console.warn(`[WARNING] Log entry ${id} tampered by user ${user.username} for demonstration.`);

    return res.json({ success: true, message: `Log entry ID ${id} has been direct-edited in the database. Run verification to test integrity.` });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}
