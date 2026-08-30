import crypto from 'crypto';
import { getDb } from '../config/db';
import { AuditLog } from '../types';

export class AuditService {
  
  // Computes current hash based on row properties and previous hash
  private static calculateHash(
    id: number,
    timestamp: string,
    userId: string,
    username: string,
    actionType: string,
    parcelId: string | null,
    details: string,
    prevHash: string
  ): string {
    const data = `${id}|${timestamp}|${userId}|${username}|${actionType}|${parcelId || ''}|${details}|${prevHash}`;
    return crypto.createHash('sha256').update(data).digest('hex');
  }

  // Write a new entry to the audit log, linking it to the previous hash
  public static async writeLog(
    userId: string,
    username: string,
    actionType: string,
    parcelId: string | null,
    details: string
  ): Promise<AuditLog> {
    const db = await getDb();

    // 1. Get the last audit log entry to find the previous hash
    const lastRow = await db.get('SELECT * FROM audit_logs ORDER BY id DESC LIMIT 1');
    const prevHash = lastRow ? lastRow.current_hash : '0';

    // 2. Insert with placeholders to get the auto-increment ID and timestamp
    const result = await db.run(
      `INSERT INTO audit_logs (user_id, username, action_type, parcel_id, details, prev_hash, current_hash)
       VALUES (?, ?, ?, ?, ?, ?, '')`,
      userId,
      username,
      actionType,
      parcelId,
      details,
      prevHash
    );

    const insertedId = result.lastID;
    if (!insertedId) {
      throw new Error("Failed to insert audit log.");
    }

    // 3. Fetch the inserted row to get the actual auto-generated timestamp
    const newRow = await db.get('SELECT * FROM audit_logs WHERE id = ?', insertedId);
    
    // 4. Calculate the SHA-256 hash including the generated ID and timestamp
    const computedHash = this.calculateHash(
      newRow.id,
      newRow.timestamp,
      newRow.user_id,
      newRow.username,
      newRow.action_type,
      newRow.parcel_id,
      newRow.details,
      newRow.prev_hash
    );

    // 5. Update the entry with its finalized current hash
    await db.run('UPDATE audit_logs SET current_hash = ? WHERE id = ?', computedHash, insertedId);

    newRow.current_hash = computedHash;
    return newRow;
  }

  // Verifies the integrity of the audit log chain.
  // Recalculates hashes sequentially.
  public static async verifyIntegrity(): Promise<{ isValid: boolean; corruptedId?: number; reason?: string }> {
    const db = await getDb();
    const logs = await db.all('SELECT * FROM audit_logs ORDER BY id ASC');

    let expectedPrevHash = '0';

    for (const log of logs) {
      // Check if prev_hash matches what we expected
      if (log.prev_hash !== expectedPrevHash) {
        return {
          isValid: false,
          corruptedId: log.id,
          reason: `Chain broken at log ID ${log.id}: prev_hash '${log.prev_hash}' does not match expected '${expectedPrevHash}'`
        };
      }

      // Recalculate hash of current block
      const computedHash = this.calculateHash(
        log.id,
        log.timestamp,
        log.user_id,
        log.username,
        log.action_type,
        log.parcel_id,
        log.details,
        log.prev_hash
      );

      // Check if stored hash matches recalculated hash
      if (log.current_hash !== computedHash) {
        return {
          isValid: false,
          corruptedId: log.id,
          reason: `Data tampering detected at log ID ${log.id}: current_hash '${log.current_hash}' does not match recomputed hash '${computedHash}'`
        };
      }

      expectedPrevHash = log.current_hash;
    }

    return { isValid: true };
  }

  // Developer utility to intentionally tamper with a row in the database
  public static async tamperLog(id: number, alteredDetails: string): Promise<void> {
    const db = await getDb();
    await db.run('UPDATE audit_logs SET details = ? WHERE id = ?', alteredDetails, id);
  }
}
