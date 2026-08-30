import { Request, Response } from 'express';
import { getDb } from '../config/db';
import { LedgerService } from '../services/ledgerService';

export async function listParcels(req: Request, res: Response) {
  try {
    const db = await getDb();
    
    // Fetch all parcels
    const parcels = await db.all('SELECT * FROM parcels');
    
    // For each parcel, fetch active owners and their shares
    const results = [];
    for (const parcel of parcels) {
      const owners = await db.all(`
        SELECT os.share_percentage, p.id as person_id, p.name, p.aadhaar_token
        FROM ownership_states os
        JOIN persons p ON os.person_id = p.id
        WHERE os.parcel_id = ?
        ORDER BY os.share_percentage DESC
      `, parcel.id);

      const activeDisputes = await db.all(`
        SELECT * FROM disputes WHERE parcel_id = ? AND status = 'ACTIVE'
      `, parcel.id);

      const activeEncumbrances = await db.all(`
        SELECT * FROM encumbrances WHERE parcel_id = ? AND status = 'ACTIVE'
      `, parcel.id);

      results.push({
        ...parcel,
        owners,
        disputesCount: activeDisputes.length,
        encumbrancesCount: activeEncumbrances.length
      });
    }

    return res.json(results);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}

export async function getParcelById(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const db = await getDb();
    
    const parcel = await db.get('SELECT * FROM parcels WHERE id = ?', id);
    if (!parcel) {
      return res.status(404).json({ error: 'Parcel not found.' });
    }

    // Get current materialized owner shares
    const currentOwners = await db.all(`
      SELECT os.share_percentage, p.id as person_id, p.name, p.aadhaar_token
      FROM ownership_states os
      JOIN persons p ON os.person_id = p.id
      WHERE os.parcel_id = ?
      ORDER BY os.share_percentage DESC
    `, id);

    // Get disputes
    const disputes = await db.all('SELECT * FROM disputes WHERE parcel_id = ? ORDER BY filed_at DESC', id);

    // Get encumbrances
    const encumbrances = await db.all('SELECT * FROM encumbrances WHERE parcel_id = ? ORDER BY created_at DESC', id);

    // Get historical timeline of ownership events
    const rawEvents = await db.all(`
      SELECT 
        oe.id as event_id,
        oe.event_type,
        oe.share_percentage,
        oe.effective_date,
        oe.transaction_id,
        d.id as doc_id,
        d.doc_type,
        d.doc_ref,
        d.file_name,
        p_seller.name as seller_name,
        p_seller.id as seller_id,
        p_buyer.name as buyer_name,
        p_buyer.id as buyer_id
      FROM ownership_events oe
      LEFT JOIN documents d ON oe.document_id = d.id
      LEFT JOIN persons p_seller ON oe.seller_person_id = p_seller.id
      LEFT JOIN persons p_buyer ON oe.buyer_person_id = p_buyer.id
      WHERE oe.parcel_id = ?
      ORDER BY oe.effective_date ASC, oe.id ASC
    `, id);

    // Get verification results for rejected or pending transactions linked to this parcel
    const pendingTransactions = await db.all(`
      SELECT t.*, vr.status as verification_status, vr.id as verification_id
      FROM transactions t
      LEFT JOIN verification_results vr ON t.id = vr.transaction_id
      WHERE t.parcel_id = ? AND t.status IN ('PENDING', 'REJECTED')
      ORDER BY t.created_at DESC
    `, id);

    return res.json({
      parcel,
      currentOwners,
      disputes,
      encumbrances,
      history: rawEvents,
      pendingTransactions
    });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}
