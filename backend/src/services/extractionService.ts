import { DocType } from '../types';

export interface ExtractedFields {
  parcel_id?: string;
  khasra_number?: string;
  doc_type?: DocType;
  doc_ref?: string;
  seller?: string;
  buyer?: string;
  share?: number;
  claimed_area_acres?: number;
  owners?: Array<{ name: string; share: number }>;
}

export class ExtractionService {
  
  // Synthetic templates database mapping filename/content matches to structured results
  private static templates: Record<string, ExtractedFields> = {
    // Main demo over-transfer sale deed template
    'sale_deed_142_3_overtransfer.txt': {
      khasra_number: '142/3',
      doc_type: 'SALE_DEED',
      doc_ref: 'DEED/2026/0142',
      seller: 'Anand Verma',
      buyer: 'Chandra Kumar',
      share: 80.0,
      claimed_area_acres: 2.40
    },
    // Main demo valid transfer sale deed template
    'sale_deed_142_3_valid.txt': {
      khasra_number: '142/3',
      doc_type: 'SALE_DEED',
      doc_ref: 'DEED/2026/0143',
      seller: 'Anand Verma',
      buyer: 'Chandra Kumar',
      share: 40.0,
      claimed_area_acres: 2.40
    },
    // Case 3: Identity variation
    'sale_deed_145_2_identity.txt': {
      khasra_number: '145/2',
      doc_type: 'SALE_DEED',
      doc_ref: 'DEED/2026/0145',
      seller: 'Ramesh K.', // Note initial
      buyer: 'Chandra Kumar',
      share: 100.0,
      claimed_area_acres: 2.40
    },
    // Case 4: Document contradiction
    'sale_deed_146_1_contradict.txt': {
      khasra_number: '146/1',
      doc_type: 'SALE_DEED',
      doc_ref: 'DEED/2026/0146',
      seller: 'Devendra Prasad',
      buyer: 'Esha Gupta',
      share: 80.0, // Contradiction: Devendra only owns 60% according to RoR
      claimed_area_acres: 2.40
    },
    // Case 5: Temporal contradiction (Backdated Deed)
    'sale_deed_147_4_backdated.txt': {
      khasra_number: '147/4',
      doc_type: 'SALE_DEED',
      doc_ref: 'DEED/2026/0147',
      seller: 'Firoz Khan',
      buyer: 'Chandra Kumar',
      share: 100.0,
      claimed_area_acres: 2.40
      // Date will be simulated as 2019 (before the 2020 RoR which set Firoz to 100%)
    },
    // Case 6: Spatial mismatch
    'sale_deed_148_9_spatial.txt': {
      khasra_number: '148/9',
      doc_type: 'SALE_DEED',
      doc_ref: 'DEED/2026/0148',
      seller: 'Anand Verma',
      buyer: 'Chandra Kumar',
      share: 100.0,
      claimed_area_acres: 2.40 // Mismatch: GIS geometry calculates to 2.70 acres (12.5% discrepancy)
    },
    // Case 7: Dispute
    'sale_deed_149_1_dispute.txt': {
      khasra_number: '149/1',
      doc_type: 'SALE_DEED',
      doc_ref: 'DEED/2026/0149',
      seller: 'Gopal Das',
      buyer: 'Chandra Kumar',
      share: 100.0,
      claimed_area_acres: 2.40
    },
    // Case 8: Clean
    'sale_deed_150_5_clean.txt': {
      khasra_number: '150/5',
      doc_type: 'SALE_DEED',
      doc_ref: 'DEED/2026/0150',
      seller: 'Hari Prasad',
      buyer: 'Chandra Kumar',
      share: 100.0,
      claimed_area_acres: 2.40
    }
  };

  // Perform extraction on file. Runs a template lookup or regex heuristics fallback
  public static extract(fileName: string, fileContent: string): {
    fields: ExtractedFields;
    confidence: number;
    explanation: string;
  } {
    // 1. Try template lookup based on filename
    const trimmedFileName = fileName.trim().toLowerCase();
    for (const [tplName, tplData] of Object.entries(this.templates)) {
      if (trimmedFileName.includes(tplName) || fileContent.includes(tplName)) {
        return {
          fields: tplData,
          confidence: 0.98,
          explanation: `Identified synthetic demonstration template [${tplName}]. Extracted structured fields with high confidence.`
        };
      }
    }

    // 2. Heuristic extraction fallback (regex based)
    const text = fileContent;
    const fields: ExtractedFields = {};

    // Match Khasra/Parcel ID: e.g. "Parcel ID: 142/3" or "Khasra Number: 142/3"
    const khasraMatch = text.match(/(?:khasra|parcel(?:\s+id)?|plot|survey)(?:\s+number|\s+no|\s*\:)?\s*([0-9]+\/[0-9]+|[0-9]+)/i);
    if (khasraMatch) {
      fields.khasra_number = khasraMatch[1];
    }

    // Match Document Type
    if (text.match(/sale\s+deed/i)) {
      fields.doc_type = 'SALE_DEED';
    } else if (text.match(/ror|pahani|jamabandi/i)) {
      fields.doc_type = 'ROR';
    } else if (text.match(/mutation/i)) {
      fields.doc_type = 'MUTATION';
    }

    // Match Reference Number: e.g. "Ref: DEED/2026/0142"
    const refMatch = text.match(/(?:ref|deed\s+no|document\s+id|reference)(?:\s*number|\s+no|\s*\:)?\s*([a-z0-9\/]+)/i);
    if (refMatch) {
      fields.doc_ref = refMatch[1];
    }

    // Match Seller: e.g. "Seller: Anand Verma" or "Transferor: Anand Verma"
    const sellerMatch = text.match(/(?:seller|transferor|grantor)(?:\s*\:)?\s*([A-Za-z\s\.]+)(?:\r?\n|buyer|transferee|owns|sells)/i);
    if (sellerMatch) {
      fields.seller = sellerMatch[1].trim();
    }

    // Match Buyer: e.g. "Buyer: Chandra Kumar" or "Transferee: Chandra Kumar"
    const buyerMatch = text.match(/(?:buyer|transferee|grantee)(?:\s*\:)?\s*([A-Za-z\s\.]+)(?:\r?\n|share|percentage|transfers)/i);
    if (buyerMatch) {
      fields.buyer = buyerMatch[1].trim();
    }

    // Match Share Percentage: e.g. "share: 80%" or "transfers 80%"
    const shareMatch = text.match(/(?:share|percentage|transfer(?:\s+share)?)(?:\s*\:)?\s*(\d+(?:\.\d+)?)\s*\%?/i);
    if (shareMatch) {
      fields.share = parseFloat(shareMatch[1]);
    }

    // Match Claimed Area: e.g. "Area: 2.40 Acres"
    const areaMatch = text.match(/(?:area|size)(?:\s*\:)?\s*(\d+(?:\.\d+)?)\s*(?:acres|acre|hectares|sq\s*m)/i);
    if (areaMatch) {
      fields.claimed_area_acres = parseFloat(areaMatch[1]);
    }

    const confidence = Object.keys(fields).length > 2 ? 0.85 : 0.40;
    const explanation = confidence >= 0.85
      ? "Regex heuristics extracted key parcel and transaction fields successfully."
      : "Insufficient markers found in the document text for high-confidence extraction.";

    return {
      fields,
      confidence,
      explanation
    };
  }
}
