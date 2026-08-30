import * as turf from '@turf/turf';
import { getDb } from '../config/db';
import { VerificationResult, VerificationStatus, Transaction } from '../types';
import { LedgerService } from './ledgerService';
import { IdentityService } from './identityService';

export class VerificationService {

  // Runs all 6 validation modules and writes the report to verification_results
  public static async verifyTransaction(transactionId: string): Promise<VerificationResult> {
    const db = await getDb();

    // 1. Fetch transaction details
    const tx = await db.get('SELECT * FROM transactions WHERE id = ?', transactionId);
    if (!tx) {
      throw new Error(`Transaction ${transactionId} not found.`);
    }

    // 2. Fetch associated document, extraction, and parcel
    const doc = await db.get('SELECT * FROM documents WHERE id = ?', tx.document_id);
    const extraction = await db.get('SELECT * FROM document_extractions WHERE document_id = ?', tx.document_id);
    const parcel = await db.get('SELECT * FROM parcels WHERE id = ?', tx.parcel_id);

    if (!doc || !extraction || !parcel) {
      throw new Error(`Incomplete transaction data for validation. Check doc, extraction, and parcel records.`);
    }

    const extData = JSON.parse(extraction.extracted_json);

    // Initial status markers
    let identityStatus: 'PASSED' | 'FAILED' | 'AMBIGUOUS' = 'PASSED';
    let identityReason = 'Seller identity verified against ledger database.';

    let ownershipStatus: 'PASSED' | 'FAILED' = 'PASSED';
    let ownershipReason = 'Proposed share transfer is within seller\'s currently verified share.';

    let documentStatus: 'PASSED' | 'FAILED' = 'PASSED';
    let documentReason = 'All fields in transaction match extracted document properties.';

    let temporalStatus: 'PASSED' | 'FAILED' = 'PASSED';
    let temporalReason = 'Transaction timeline is consistent with historical records.';

    let spatialStatus: 'PASSED' | 'FAILED' | 'REVIEW_REQUIRED' = 'PASSED';
    let spatialReason = 'Document claimed area matches geographic parcel boundary.';

    let disputeStatus: 'CLEAR' | 'FAILED' = 'CLEAR';
    let disputeReason = 'No active disputes or litigation encumbrances found.';

    // ==========================================
    // A. IDENTITY RESOLUTION CHECK
    // ==========================================
    // Resolve seller
    const sellerResolution = await IdentityService.resolveIdentity(tx.seller_raw, tx.parcel_id);
    // Resolve buyer
    const buyerResolution = await IdentityService.resolveIdentity(tx.buyer_raw);

    let updatedSellerResolvedId = tx.seller_resolved_id;
    let updatedBuyerResolvedId = tx.buyer_resolved_id;

    if (sellerResolution.matchedPersonId) {
      updatedSellerResolvedId = sellerResolution.matchedPersonId;
    }
    if (buyerResolution.matchedPersonId) {
      updatedBuyerResolvedId = buyerResolution.matchedPersonId;
    }

    // Update transaction with resolved IDs
    await db.run(
      'UPDATE transactions SET seller_resolved_id = ?, buyer_resolved_id = ? WHERE id = ?',
      updatedSellerResolvedId,
      updatedBuyerResolvedId,
      tx.id
    );

    if (!sellerResolution.matchedPersonId) {
      identityStatus = 'FAILED';
      identityReason = `Seller identity '${tx.seller_raw}' could not be resolved. ${sellerResolution.explanation}`;
    } else if (sellerResolution.confidence < 85) {
      identityStatus = 'AMBIGUOUS';
      identityReason = `Ambiguous seller identity resolution (${sellerResolution.confidence}% confidence). ${sellerResolution.explanation}`;
    } else {
      identityReason = `Seller identity successfully resolved to ${sellerResolution.matchedPersonId} with ${sellerResolution.confidence}% confidence.`;
    }

    // ==========================================
    // B. OWNERSHIP SHARE CONSERVATION CHECK
    // ==========================================
    if (updatedSellerResolvedId) {
      const shareCheck = await LedgerService.checkShareConservation(
        tx.parcel_id,
        updatedSellerResolvedId,
        tx.share_percentage
      );

      if (!shareCheck.isValid) {
        ownershipStatus = 'FAILED';
        ownershipReason = `Ownership validation failed: Seller's verified share is ${shareCheck.currentShare}%, but proposed transaction transfers ${tx.share_percentage}%. The proposed transfer exceeds currently verified ownership by ${shareCheck.deficit} percentage points.`;
      } else {
        ownershipReason = `Ownership validation passed: Seller currently holds ${shareCheck.currentShare}% share, which is sufficient to cover the proposed transfer of ${tx.share_percentage}%.`;
      }
    } else {
      ownershipStatus = 'FAILED';
      ownershipReason = 'Ownership share check skipped because seller identity is unresolved.';
    }

    // ==========================================
    // C. DOCUMENT CONSISTENCY CHECK
    // ==========================================
    // Check if the fields in document extraction match transaction data
    const khasraMismatch = extData.khasra_number && extData.khasra_number !== parcel.khasra_number;
    const shareMismatch = extData.share && Math.abs(extData.share - tx.share_percentage) > 0.01;
    const sellerMismatch = extData.seller && IdentityService.resolveIdentity(extData.seller).then(res => res.matchedPersonId !== updatedSellerResolvedId);
    
    // Wait for seller match if applicable
    let docSellerMatched = true;
    if (extData.seller && updatedSellerResolvedId) {
      const res = await IdentityService.resolveIdentity(extData.seller);
      docSellerMatched = res.matchedPersonId === updatedSellerResolvedId;
    }

    if (khasraMismatch || shareMismatch || !docSellerMatched) {
      documentStatus = 'FAILED';
      const mismatchReasons: string[] = [];
      if (khasraMismatch) mismatchReasons.push(`Khasra number mismatch (Document: ${extData.khasra_number}, Transaction: ${parcel.khasra_number})`);
      if (shareMismatch) mismatchReasons.push(`Share percentage mismatch (Document: ${extData.share}%, Transaction: ${tx.share_percentage}%)`);
      if (!docSellerMatched) mismatchReasons.push(`Seller mismatch (Document: ${extData.seller}, Transaction: ${tx.seller_raw})`);
      
      documentReason = `Cross-source contradiction detected: ${mismatchReasons.join('; ')}.`;
    } else {
      documentReason = 'All extraction parameters (Khasra, Seller, Share) match the proposed transaction.';
    }

    // ==========================================
    // D. TEMPORAL CONSISTENCY CHECK
    // ==========================================
    // For demonstration, Case 5 contains a backdated deed
    // Let's query recent events on this parcel to verify chronological consistency.
    const lastEvent = await db.get(
      'SELECT * FROM ownership_events WHERE parcel_id = ? ORDER BY effective_date DESC LIMIT 1',
      tx.parcel_id
    );

    // If transaction date is before last historical event date, flag temporal failure
    const txDate = tx.created_at.split(' ')[0]; // YYYY-MM-DD
    if (lastEvent && lastEvent.effective_date > txDate) {
      temporalStatus = 'FAILED';
      temporalReason = `Temporal violation: Proposed transaction date (${txDate}) is backdated. Valid events exist on the ledger up to ${lastEvent.effective_date}.`;
    }

    // ==========================================
    // E. SPATIAL CONSISTENCY CHECK
    // ==========================================
    try {
      const geom = JSON.parse(parcel.geojson_geometry);
      // Calculate area in square meters using Turf
      const areaSqM = turf.area(geom);
      // Convert to acres: 1 acre = 4046.85642 square meters
      const calculatedArea = Math.round((areaSqM / 4046.85642) * 100) / 100;
      
      // Compare claimed area in database/document with calculated area
      const claimedArea = parcel.claimed_area_acres;
      const difference = Math.abs(claimedArea - calculatedArea);
      const discrepancyPct = (difference / claimedArea) * 100;

      // Allow 10% discrepancy tolerance
      if (discrepancyPct > 10) {
        spatialStatus = 'REVIEW_REQUIRED';
        spatialReason = `Spatial check flagged: Claimed area is ${claimedArea.toFixed(2)} acres, but mapped GIS boundary measures ${calculatedArea.toFixed(2)} acres (${discrepancyPct.toFixed(1)}% discrepancy, exceeding the 10% tolerance threshold).`;
      } else {
        spatialReason = `Spatial check passed: Claimed area is ${claimedArea.toFixed(2)} acres, boundary measures ${calculatedArea.toFixed(2)} acres (${discrepancyPct.toFixed(1)}% difference).`;
      }
    } catch (e: any) {
      spatialStatus = 'FAILED';
      spatialReason = `Spatial check failed: Error calculating parcel geometry area: ${e.message}`;
    }

    // ==========================================
    // F. ENCUMBRANCE / DISPUTE CHECK
    // ==========================================
    const activeDispute = await db.get(
      "SELECT * FROM disputes WHERE parcel_id = ? AND status = 'ACTIVE'",
      tx.parcel_id
    );

    if (activeDispute) {
      disputeStatus = 'FAILED';
      disputeReason = `HARD BLOCK: Active dispute detected on this parcel. Description: "${activeDispute.description}". Human verification required.`;
    }

    // ==========================================
    // DECISION RULE / DISPOSITION ENGINE
    // ==========================================
    let status: VerificationStatus = 'VERIFIED';
    
    // Hard block from dispute
    if (disputeStatus === 'FAILED') {
      status = 'REVIEW_REQUIRED';
    } 
    // Ownership checks or severe contradictions trigger rejection or review
    else if (ownershipStatus === 'FAILED') {
      status = 'REVIEW_REQUIRED'; // Set to REVIEW_REQUIRED as requested, so human can reject
    } 
    else if (identityStatus === 'FAILED' || identityStatus === 'AMBIGUOUS' || documentStatus === 'FAILED' || temporalStatus === 'FAILED' || spatialStatus === 'REVIEW_REQUIRED') {
      status = 'REVIEW_REQUIRED';
    }

    const verificationResultId = `vr-${tx.id}`;

    // Upsert verification result
    await db.run(
      `INSERT OR REPLACE INTO verification_results (
        id, transaction_id, status, 
        identity_status, identity_reason, 
        ownership_status, ownership_reason, 
        document_status, document_reason, 
        temporal_status, temporal_reason, 
        spatial_status, spatial_reason, 
        dispute_status, dispute_reason
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      verificationResultId,
      tx.id,
      status,
      identityStatus,
      identityReason,
      ownershipStatus,
      ownershipReason,
      documentStatus,
      documentReason,
      temporalStatus,
      temporalReason,
      spatialStatus,
      spatialReason,
      disputeStatus,
      disputeReason
    );

    // Update parcel status if review is required
    if (status === 'REVIEW_REQUIRED') {
      await db.run("UPDATE parcels SET status = 'REVIEW_REQUIRED' WHERE id = ?", tx.parcel_id);
    }

    return (await db.get('SELECT * FROM verification_results WHERE id = ?', verificationResultId)) as VerificationResult;
  }
}
