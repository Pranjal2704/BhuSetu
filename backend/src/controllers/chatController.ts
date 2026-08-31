import { Request, Response } from 'express';
import { getDb } from '../config/db';
import { LedgerService } from '../services/ledgerService';

// Dictionary of plain language definitions for land record concepts
const CONCEPT_DEFINITIONS: Record<string, string> = {
  khata: "A **Khata** is an account number allotted to a family of landowners. It is used to track the tax liabilities of the family as a unit.",
  khatauni: "A **Khatauni** is a master register of landholdings in a village. It lists details of all cultivators, their specific parcel numbers, shares, and tax details.",
  mutation: "**Mutation** (also known as Dakhil-Kharij) is the process of updating the official land registry database when ownership changes hands. This occurs after a sale deed is executed, or due to inheritance or gift transfers.",
  ror: "The **Record of Rights (RoR)** (commonly called Pahani, Jamabandi, or Adangal in different regions) is the primary legal land document. It records details about the parcel ID, ownership shares, tenancy, crop history, and active bank mortgages.",
  gis: "A **Geographic Information System (GIS)** is a digital mapping framework. BhuSetu uses GIS boundaries (in GeoJSON format) to calculate the actual mathematical area of a parcel, which is then compared against the claimed area in documents to detect discrepancies.",
  audit: "The BhuSetu **Audit Chain** is a tamper-evident log that links every system action using cryptographic SHA-256 hashes. It ensures that historical transaction history cannot be altered without detection."
};

export async function chatHandler(req: Request, res: Response) {
  try {
    const { message } = req.body;
    if (!message) {
      return res.status(400).json({ error: "Message content is required." });
    }

    const text = message.toLowerCase();
    const db = await getDb();

    // 1. Check if the user is asking about a specific Khasra/Parcel number (e.g. "142/3" or "plot 145-2")
    const khasraMatch = text.match(/\b([0-9]+\/[0-9]+|[0-9]+)\b/);
    
    if (khasraMatch) {
      const khasraNo = khasraMatch[1];
      // Search for the parcel in the DB
      const parcel = await db.get("SELECT * FROM parcels WHERE khasra_number = ?", khasraNo);
      
      if (parcel) {
        // Fetch owners
        const owners = await db.all(`
          SELECT p.name, os.share_percentage 
          FROM ownership_states os
          JOIN persons p ON os.person_id = p.id
          WHERE os.parcel_id = ?
          ORDER BY os.share_percentage DESC
        `, parcel.id);

        const dispute = await db.get("SELECT * FROM disputes WHERE parcel_id = ? AND status = 'ACTIVE'", parcel.id);
        const encumbrances = await db.all("SELECT * FROM encumbrances WHERE parcel_id = ? AND status = 'ACTIVE'", parcel.id);

        let ownersText = owners.map(o => `${o.name} (${o.share_percentage}%)`).join(", ");
        
        let response = `I have pulled the authoritative records for **Khasra Plot ${khasraNo}**:\n\n`;
        response += `* **Claimed Area:** ${parcel.claimed_area_acres.toFixed(2)} Acres\n`;
        response += `* **GIS Calculated Area:** ${parcel.calculated_area_acres.toFixed(2)} Acres\n`;
        response += `* **Current Owner Shares:** ${ownersText || 'No active owners registered.'}\n`;
        response += `* **Ledger Status:** **${parcel.status}**\n\n`;

        if (dispute) {
          response += `⚠️ **DISPUTE ALERT:** There is an active court dispute registered on this parcel: *"${dispute.description}"*. Transaction locks are active.\n`;
        }

        if (encumbrances.length > 0) {
          const encText = encumbrances.map(e => `*${e.type}*` + (e.amount ? ` (Amount: ₹${e.amount})` : '')).join(", ");
          response += `🔗 **LIABILITIES:** Active encumbrances found: ${encText}.\n`;
        }

        if (parcel.status === 'REVIEW_REQUIRED') {
          const diffPct = (Math.abs(parcel.claimed_area_acres - parcel.calculated_area_acres) / parcel.claimed_area_acres) * 100;
          response += `🚨 **WARNING:** A spatial area discrepancy of ${diffPct.toFixed(1)}% has been detected between the document claims and the GIS map boundaries.\n`;
        }

        return res.json({ response });
      } else {
        return res.json({
          response: `I searched the registry catalog but could not find a land parcel with Khasra number **${khasraNo}**. Please double-check the identifier.`
        });
      }
    }

    // 2. Check if the user is asking for definitions/concepts
    for (const [concept, definition] of Object.entries(CONCEPT_DEFINITIONS)) {
      if (text.includes(concept)) {
        return res.json({
          response: `Here is the explanation for **${concept.toUpperCase()}**:\n\n${definition}`
        });
      }
    }

    // 3. Check if asking about system usage, next steps
    if (text.includes("how to use") || text.includes("steps") || text.includes("upload") || text.includes("verify")) {
      return res.json({
        response: "To use the system:\n1. Navigate to the **Document Upload** tab.\n2. Choose a demo transaction scenario from the dropdown preset list (or upload a custom text file).\n3. Click **Analyze & Run Verification** to trigger the 6 automated integrity audits.\n4. If a check fails, the transaction is routed to the **Review Officer Queue** where an authorized reviewer can evaluate the discrepancies and approve or reject it."
      });
    }

    // 4. Check if requesting data editing or overrides
    if (text.includes("edit") || text.includes("change") || text.includes("update") || text.includes("modify") || text.includes("delete") || text.includes("override")) {
      return res.json({
        response: "As **BhuSetu Sahayak**, I operate in a read-only guide capacity. I do **not** have permissions to modify records, bypass validation gates, or update ownership states. Any overrides or reviews must be executed by an authorized officer through the **Review Officer Queue** workspace."
      });
    }

    // Default Fallback Response
    return res.json({
      response: "Hello! I am **BhuSetu Sahayak**, your read-only guide. I can assist you with:\n\n" +
                "1. **Parcel Details:** Ask me about a specific Khasra number (e.g. \"*Tell me about parcel 142/3*\") to see its current owner shares, area, and dispute status.\n" +
                "2. **Definitions:** Ask me about terms like *RoR*, *Mutation*, *Khata*, *Khatauni*, or *GIS*.\n" +
                "3. **Navigation:** Ask \"*How do I use the system?*\" for a quick walkthrough.\n\n" +
                "Please note that I cannot edit or verify documents myself. How can I help you today?"
    });

  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}
