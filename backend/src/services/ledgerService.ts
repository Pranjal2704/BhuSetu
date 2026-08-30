import { getDb } from '../config/db';
import { OwnershipEvent, OwnershipState } from '../types';

export class LedgerService {

  // Dynamically reconstructs the ownership state of a parcel as of a specific date (optional)
  public static async reconstructOwnershipState(
    parcelId: string,
    asOfDate?: string
  ): Promise<Record<string, number>> {
    const db = await getDb();
    
    // Fetch all events for the parcel in chronological order
    let query = 'SELECT * FROM ownership_events WHERE parcel_id = ?';
    const params: any[] = [parcelId];

    if (asOfDate) {
      query += ' AND effective_date <= ?';
      params.push(asOfDate);
    }

    query += ' ORDER BY effective_date ASC, id ASC';

    const events: OwnershipEvent[] = await db.all(query, ...params);
    const shares: Record<string, number> = {};

    for (const event of events) {
      const shareVal = event.share_percentage;
      
      switch (event.event_type) {
        case 'INITIAL':
          // Set initial buyer's share
          shares[event.buyer_person_id] = (shares[event.buyer_person_id] || 0) + shareVal;
          break;

        case 'MUTATION_RECORD':
        case 'SALE_TRANSFER':
          // Process transfers: deduct from seller, add to buyer
          if (event.seller_person_id) {
            const currentSellerShare = shares[event.seller_person_id] || 0;
            shares[event.seller_person_id] = Math.max(0, currentSellerShare - shareVal);
            // Clean up 0 share owners so they don't clutter the current state
            if (shares[event.seller_person_id] === 0) {
              delete shares[event.seller_person_id];
            }
          }
          shares[event.buyer_person_id] = (shares[event.buyer_person_id] || 0) + shareVal;
          break;

        default:
          break;
      }
    }

    // Clean up float rounding errors (e.g. 59.99999999999999 -> 60)
    for (const personId of Object.keys(shares)) {
      shares[personId] = Math.round(shares[personId] * 100) / 100;
    }

    return shares;
  }

  // Validates if a seller has the capacity to transfer the proposed share
  public static async checkShareConservation(
    parcelId: string,
    sellerPersonId: string,
    proposedTransferShare: number,
    asOfDate?: string
  ): Promise<{
    isValid: boolean;
    currentShare: number;
    deficit: number;
  }> {
    const shares = await this.reconstructOwnershipState(parcelId, asOfDate);
    const currentShare = shares[sellerPersonId] || 0;

    if (currentShare >= proposedTransferShare) {
      return {
        isValid: true,
        currentShare,
        deficit: 0
      };
    } else {
      return {
        isValid: false,
        currentShare,
        deficit: proposedTransferShare - currentShare
      };
    }
  }

  // Materializes the current ownership state into the database tables (e.g. upon transaction approval)
  public static async commitTransactionToLedger(
    transactionId: string,
    approvedByUserId: string,
    approvedByUsername: string
  ): Promise<void> {
    const db = await getDb();

    // 1. Get the transaction details
    const tx = await db.get('SELECT * FROM transactions WHERE id = ?', transactionId);
    if (!tx) {
      throw new Error(`Transaction ${transactionId} not found.`);
    }

    if (tx.status !== 'PENDING') {
      throw new Error(`Transaction ${transactionId} has already been processed (Status: ${tx.status}).`);
    }

    // 2. Insert ownership event
    const eventId = `evt-${tx.id}`;
    const effectiveDate = new Date().toISOString().split('T')[0];

    await db.run(
      `INSERT INTO ownership_events (id, parcel_id, event_type, transaction_id, document_id, seller_person_id, buyer_person_id, share_percentage, effective_date)
       VALUES (?, ?, 'SALE_TRANSFER', ?, ?, ?, ?, ?, ?)`,
      eventId,
      tx.parcel_id,
      tx.id,
      tx.document_id,
      tx.seller_resolved_id,
      tx.buyer_resolved_id,
      tx.share_percentage,
      effectiveDate
    );

    // 3. Update materialized shares in ownership_states
    // Recalculate full ledger state to prevent drift
    const updatedShares = await this.reconstructOwnershipState(tx.parcel_id);

    // Clear old state for this parcel
    await db.run('DELETE FROM ownership_states WHERE parcel_id = ?', tx.parcel_id);

    // Insert new materialized state
    for (const [personId, share] of Object.entries(updatedShares)) {
      await db.run(
        'INSERT INTO ownership_states (parcel_id, person_id, share_percentage) VALUES (?, ?, ?)',
        tx.parcel_id,
        personId,
        share
      );
    }

    // 4. Update transaction status
    await db.run(
      "UPDATE transactions SET status = 'APPROVED' WHERE id = ?",
      tx.id
    );
  }
}
