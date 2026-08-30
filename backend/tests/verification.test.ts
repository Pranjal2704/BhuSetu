import fs from 'fs';
import path from 'path';
import { getDb } from '../src/config/db';
import { initializeDatabase } from '../src/db/schema';
import { LedgerService } from '../src/services/ledgerService';
import { IdentityService } from '../src/services/identityService';
import { AuditService } from '../src/services/auditService';
import * as turf from '@turf/turf';

// Set test environment
process.env.NODE_ENV = 'test';

describe('BhuPramaan Verification Engine Tests', () => {
  let db: any;

  beforeAll(async () => {
    // Delete test database if it exists
    const testDbPath = path.join(__dirname, '../bhupramaan_test.db');
    if (fs.existsSync(testDbPath)) {
      try {
        fs.unlinkSync(testDbPath);
      } catch (err) {
        // ignore if locked
      }
    }

    db = await getDb();
    await initializeDatabase();
  });

  afterAll(async () => {
    if (db) {
      await db.close();
    }
  });

  // 1. Test Ledger Reconstruction & Materialized State
  test('Should reconstruct ownership state correctly from historical events', async () => {
    const shares = await LedgerService.reconstructOwnershipState('prcl-142-3');
    // Anand Verma (p-anand) has 100 - 40 = 60%
    // Bikram Singh (p-bikram) has 40%
    expect(shares['p-anand']).toBe(60);
    expect(shares['p-bikram']).toBe(40);
  });

  // 2. Test Share Conservation - Valid Transfer
  test('Should validate conservation of shares: valid transfer', async () => {
    const check = await LedgerService.checkShareConservation('prcl-142-3', 'p-anand', 40);
    expect(check.isValid).toBe(true);
    expect(check.currentShare).toBe(60);
    expect(check.deficit).toBe(0);
  });

  // 3. Test Share Conservation - Over-Transfer
  test('Should reject over-transfer: seller transfers more than owned', async () => {
    const check = await LedgerService.checkShareConservation('prcl-142-3', 'p-anand', 80);
    expect(check.isValid).toBe(false);
    expect(check.currentShare).toBe(60);
    expect(check.deficit).toBe(20);
  });

  // 4. Test Identity Resolution matching
  test('Should resolve abbreviated names with high confidence', async () => {
    const resolution = await IdentityService.resolveIdentity('Ramesh K.', 'prcl-145-2');
    expect(resolution.matchedPersonId).toBe('p-ramesh');
    expect(resolution.confidence).toBeGreaterThanOrEqual(85);
    expect(resolution.explanation).toContain('initial matching');
  });

  // 5. Test Spatial Tolerance calculation
  test('Should verify Turf.js area calculation and detect spatial mismatch (> 10%)', async () => {
    // For parcel 148/9: Claimed area is 2.40 acres.
    // Let's calculate the area of the polygon coordinates stored in the DB
    const parcelRow = await db.get("SELECT * FROM parcels WHERE id='prcl-148-9'");
    const geom = JSON.parse(parcelRow.geojson_geometry);
    
    const areaSqM = turf.area(geom);
    const calculatedArea = Math.round((areaSqM / 4046.85642) * 100) / 100;
    
    expect(calculatedArea).toBeCloseTo(2.70, 1); // should be around 2.70 acres
    
    const claimedArea = parcelRow.claimed_area_acres;
    const discrepancyPct = (Math.abs(claimedArea - calculatedArea) / claimedArea) * 100;
    
    expect(discrepancyPct).toBeGreaterThan(10); // should exceed 10%
  });

  // 6. Test Audit Chain Verification & Tamper Detection
  test('Should verify audit chain integrity and detect database tampering', async () => {
    // 1. Initial check - database must be valid
    const initialCheck = await AuditService.verifyIntegrity();
    expect(initialCheck.isValid).toBe(true);

    // 2. Add a new log entry
    const newLog = await AuditService.writeLog('u-admin', 'admin', 'TEST_ACTION', 'prcl-142-3', 'Integration test audit entry.');
    expect(newLog.current_hash).toBeTruthy();

    const postInsertCheck = await AuditService.verifyIntegrity();
    expect(postInsertCheck.isValid).toBe(true);

    // 3. Tamper with the new log entry directly in DB
    await AuditService.tamperLog(newLog.id!, 'Tampered details string.');

    // 4. Run integrity check - must fail
    const tamperCheck = await AuditService.verifyIntegrity();
    expect(tamperCheck.isValid).toBe(false);
    expect(tamperCheck.corruptedId).toBe(newLog.id);
  });
});
