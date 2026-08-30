import { Request, Response } from 'express';
import { getDb } from '../config/db';
import { ExtractionService } from '../services/extractionService';
import { VerificationService } from '../services/verificationService';
import { LedgerService } from '../services/ledgerService';
import { AuditService } from '../services/auditService';

export async function createProposedTransaction(req: Request, res: Response) {
  try {
    const { fileName, fileContent } = req.body;
    const user = (req as any).user;

    if (!fileName || !fileContent) {
      return res.status(400).json({ error: 'fileName and fileContent are required.' });
    }

    const db = await getDb();

    // 1. Run extraction/OCR parser
    const extractionResult = ExtractionService.extract(fileName, fileContent);
    const fields = extractionResult.fields;

    // Check if we resolved a parcel from Khasra number
    if (!fields.khasra_number) {
      return res.status(422).json({
        error: 'Document extraction failed: Khasra number could not be resolved from document text.',
        extraction: extractionResult
      });
    }

    const parcel = await db.get('SELECT * FROM parcels WHERE khasra_number = ?', fields.khasra_number);
    if (!parcel) {
      return res.status(404).json({
        error: `Land parcel with Khasra number '${fields.khasra_number}' not found in registry catalog.`,
        extraction: extractionResult
      });
    }

    // 2. Create document record
    const documentId = `doc-${Date.now()}`;
    const docRef = fields.doc_ref || `REF-${Date.now()}`;
    const docType = fields.doc_type || 'SALE_DEED';

    await db.run(
      `INSERT INTO documents (id, parcel_id, doc_type, doc_ref, file_name, file_content)
       VALUES (?, ?, ?, ?, ?, ?)`,
      documentId,
      parcel.id,
      docType,
      docRef,
      fileName,
      fileContent
    );

    // 3. Create document extraction record
    const extractionId = `ext-${Date.now()}`;
    await db.run(
      `INSERT INTO document_extractions (id, document_id, extracted_json, confidence, verified_by_human)
       VALUES (?, ?, ?, ?, 0)`,
      extractionId,
      documentId,
      JSON.stringify(fields),
      extractionResult.confidence
    );

    // 4. Create proposed transaction
    const transactionId = `tx-${Date.now()}`;
    const seller = fields.seller || 'Unknown Seller';
    const buyer = fields.buyer || 'Unknown Buyer';
    const share = fields.share || 0.0;

    await db.run(
      `INSERT INTO transactions (id, parcel_id, document_id, seller_raw, buyer_raw, share_percentage, status)
       VALUES (?, ?, ?, ?, ?, ?, 'PENDING')`,
      transactionId,
      parcel.id,
      documentId,
      seller,
      buyer,
      share
    );

    // 5. Run deterministic verification report
    const verificationReport = await VerificationService.verifyTransaction(transactionId);

    // 6. Write Audit Log for transaction submission
    await AuditService.writeLog(
      user.id,
      user.username,
      'TRANSACTION_SUBMITTED',
      parcel.id,
      `New proposed transaction ${transactionId} (Share: ${share}%, Seller: ${seller}, Buyer: ${buyer}) submitted via document upload [${fileName}]. Verification Disposition: ${verificationReport.status}.`
    );

    return res.status(201).json({
      transactionId,
      extraction: extractionResult,
      verification: verificationReport
    });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}

export async function listTransactions(req: Request, res: Response) {
  try {
    const db = await getDb();
    const transactions = await db.all(`
      SELECT 
        t.*, 
        p.khasra_number,
        d.file_name,
        vr.status as verification_status
      FROM transactions t
      JOIN parcels p ON t.parcel_id = p.id
      JOIN documents d ON t.document_id = d.id
      LEFT JOIN verification_results vr ON t.id = vr.transaction_id
      ORDER BY t.created_at DESC
    `);
    return res.json(transactions);
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}

export async function getTransactionDetails(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const db = await getDb();

    const tx = await db.get(`
      SELECT t.*, p.khasra_number, p.claimed_area_acres, p.calculated_area_acres, p.geojson_geometry
      FROM transactions t
      JOIN parcels p ON t.parcel_id = p.id
      WHERE t.id = ?
    `, id);

    if (!tx) {
      return res.status(404).json({ error: 'Transaction not found.' });
    }

    const document = await db.get('SELECT * FROM documents WHERE id = ?', tx.document_id);
    const extraction = await db.get('SELECT * FROM document_extractions WHERE document_id = ?', tx.document_id);
    const verification = await db.get('SELECT * FROM verification_results WHERE transaction_id = ?', tx.id);

    return res.json({
      transaction: tx,
      document,
      extraction: extraction ? { ...extraction, extracted_json: JSON.parse(extraction.extracted_json) } : null,
      verification
    });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}

export async function reviewTransaction(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const { action, comments } = req.body; // action: APPROVED, REJECTED, CLARIFICATION_REQUESTED
    const user = (req as any).user;

    if (!action || !['APPROVED', 'REJECTED', 'CLARIFICATION_REQUESTED'].includes(action)) {
      return res.status(400).json({ error: 'Valid review action is required (APPROVED, REJECTED, CLARIFICATION_REQUESTED).' });
    }

    const db = await getDb();
    const tx = await db.get('SELECT * FROM transactions WHERE id = ?', id);

    if (!tx) {
      return res.status(404).json({ error: 'Transaction not found.' });
    }

    if (tx.status !== 'PENDING') {
      return res.status(400).json({ error: `Transaction has already been reviewed. Current status is ${tx.status}.` });
    }

    if (action === 'APPROVED') {
      // Execute the ledger update
      await LedgerService.commitTransactionToLedger(id, user.id, user.username);
      
      // Update parcel status to CLEAR since the transaction is finalized
      await db.run("UPDATE parcels SET status = 'CLEAR' WHERE id = ?", tx.parcel_id);
      
      // Log human approval
      await AuditService.writeLog(
        user.id,
        user.username,
        'TRANSACTION_APPROVED',
        tx.parcel_id,
        `Officer approved transaction ${id} (Seller: ${tx.seller_raw}, Buyer: ${tx.buyer_raw}, Share: ${tx.share_percentage}%). Comments: ${comments || 'None'}. Ledger state updated.`
      );
    } else if (action === 'REJECTED') {
      await db.run("UPDATE transactions SET status = 'REJECTED' WHERE id = ?", id);
      
      // Update parcel status to CLEAR since the rejected deed is out of the queue
      await db.run("UPDATE parcels SET status = 'CLEAR' WHERE id = ?", tx.parcel_id);

      // Log human rejection
      await AuditService.writeLog(
        user.id,
        user.username,
        'TRANSACTION_REJECTED',
        tx.parcel_id,
        `Officer REJECTED transaction ${id} (Seller: ${tx.seller_raw}, Buyer: ${tx.buyer_raw}, Share: ${tx.share_percentage}%). Comments: ${comments || 'None'}.`
      );
    } else {
      await db.run("UPDATE transactions SET status = 'CLARIFICATION_REQUESTED' WHERE id = ?", id);
      await AuditService.writeLog(
        user.id,
        user.username,
        'TRANSACTION_CLARIFICATION',
        tx.parcel_id,
        `Officer requested clarification on transaction ${id}. Comments: ${comments || 'None'}.`
      );
    }

    return res.json({ success: true, status: action });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}
