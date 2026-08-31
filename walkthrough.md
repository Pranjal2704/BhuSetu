# BhuSetu Verification Engine Walkthrough

BhuSetu is a prototype built for the Ministry of Rural Development (SIH26018) to verify proposed land transaction deeds against a dynamically reconstructed **Ownership-State Ledger**.

---

## 🏗️ System Architecture & Codebase Map

The system is constructed as a modular monolith containing a Node/Express backend database manager and a React/TypeScript frontend console.

```
bhusetu/
├── backend/
│   ├── bhusetu.db            # SQLite relational database
│   ├── src/
│   │   ├── config/db.ts         # Database driver initialization
│   │   ├── db/schema.ts         # Table schema creation & seeding
│   │   ├── services/            # Algorithmic engine modules
│   │   │   ├── ledgerService.ts       # Reconstructs ownership & checks shares
│   │   │   ├── identityService.ts     # Resolves name variations (Fuzzy/Token initials)
│   │   │   ├── extractionService.ts   # Regex-heuristic / Template text parser
│   │   │   ├── verificationService.ts # Orchestrates the 6 verification modules
│   │   │   └── auditService.ts        # Cryptographic SHA-256 hash log chain
│   │   ├── controllers/         # Express endpoint handlers
│   │   ├── routes/api.ts        # API paths & authentication/RBAC middleware
│   │   ├── index.ts             # Server entry point
│   │   └── types.ts             # Shared type definitions
│   ├── tests/
│   │   └── verification.test.ts # Jest automated test suite
│   ├── tsconfig.json
│   └── package.json
└── frontend/
    ├── src/
    │   ├── components/
    │   │   └── ParcelMap.tsx    # Leaflet Map GeoJSON drawer & mismatch highlighters
    │   ├── App.tsx              # React UI router & page layout console
    │   ├── index.css            # Stylesheets
    │   └── main.tsx
    ├── tailwind.config.js
    ├── tsconfig.json
    ├── vite.config.ts           # Development proxy & server config
    └── package.json
```

---

## 🧪 Verification & Test Coverage

Our core deterministic validation rules are backed by a Jest automated test suite that runs against an isolated SQLite test database.

### Automated Tests Run
The verification test suite covers:
1. **Ledger Reconstruction:** Tracing chronological transaction mutation history.
2. **Share Conservation:** Successful valid transfers vs. rejected over-transfers.
3. **Identity Matching:** Abbreviated name fuzzy matches.
4. **Spatial Tolerances:** Turf.js area comparisons flagging discrepancies.
5. **Tamper Detection:** Recalculating hash chain blocks detecting database modifications.

All checks passed successfully:
```bash
PASS tests/verification.test.ts
  BhuSetu Verification Engine Tests
    ✓ Should reconstruct ownership state correctly from historical events (2 ms)
    ✓ Should validate conservation of shares: valid transfer (1 ms)
    ✓ Should reject over-transfer: seller transfers more than owned
    ✓ Should resolve abbreviated names with high confidence (1 ms)
    ✓ Should verify Turf.js area calculation and detect spatial mismatch (> 10%) (15 ms)
    ✓ Should verify audit chain integrity and detect database tampering (3 ms)
```

---

## 🚀 Execution & Port Allocation

* **Backend Server:** Port **5001** (`http://localhost:5001`)
* **Frontend Vite App:** Port **3000** (`http://localhost:3000`)

---

## 📖 Step-by-Step Hackathon Demonstration Guide

Follow this sequence to showcase BhuSetu's core features to judges:

### Step 1: Login
1. Navigate to the frontend UI (`http://localhost:3000`).
2. Fill in credentials by clicking the **✍️ Officer** quick preset button (fills `officer` / `officer123`).
3. Click **Sign In**.

### Step 2: Search Parcel 142/3
1. Select **Land Parcel Registry** in the sidebar.
2. Search for or select **Khasra Plot 142/3** from the list.
3. Observe the reconstructed owners and their shares:
   * **Anand Verma = 60%**
   * **Bikram Singh = 40%**
4. Observe the chronological history timeline (2020 initial allocation 100%, 2022 mutation transfer of 40% to Bikram).
5. View the parcel boundary rendered on the Leaflet map.

### Step 3: Propose New Sale Deed (Over-Transfer)
1. Go to **Document Upload** in the sidebar.
2. In the dropdown selector, choose: **Case 2 — Over-Transfer (A attempts 80% on 142/3 - Deficit: 20%)**.
3. The raw deed text appears in the editor box. Observe the clause:
   * `TRANSFEROR: Anand Verma sells an undivided eighty percent (80.0%) share...`
4. Click **Analyze & Run Verification**.

### Step 4: Verification Report Analysis
1. The automated report renders immediately.
2. Observe the overall status: **🚨 REVIEW REQUIRED**.
3. Inspect individual indicators:
   * **Ownership Share Check: FAILED**
   * **Cross-Document Match: PASSED**
   * **Disputes Check: CLEAR**
4. Read the explanation under "Ownership Share Deficit":
   * `Ownership validation failed: Seller's verified share is 60%, but proposed transaction transfers 80%. The proposed transfer exceeds currently verified ownership by 20 percentage points.`
5. Click **Go to Review Queue Console**.

### Step 5: Officer Review Decision
1. Select the pending transaction from the list on the **Review Officer Queue** page.
2. Inspect the breakdown and map.
3. In the comment field, enter: `Rejecting transaction. Anand Verma only owns 60% of this parcel. He cannot transfer 80%.`
4. Click **Reject Transaction**.
5. Observe that the transaction disappears from the queue.

### Step 6: Verify Cryptographic Audit Chain
1. Click **Audit Integrity chain** in the sidebar.
2. Observe the latest audit entry recording the transaction rejection:
   * `action_type: TRANSACTION_REJECTED`
   * `details: Officer REJECTED transaction tx-...`
   * Observe the `prev_hash` linking this entry to the block before it, and the unique `current_hash`.
3. Click **Verify Audit Chain Integrity** at the top right.
4. A green alert box appears: **✓ AUDIT LOG INTEGRITY VERIFIED** (all recomputed block hashes align).

### Step 7: Simulate Database Tampering
1. Scroll down to the rejection log entry.
2. Click the **Simulate Tamper** button.
3. In the prompt box, enter a modified detail text, e.g., `Officer APPROVED transaction.` (simulates an external database intrusion changing the record).
4. Click **OK**.
5. Click **Verify Audit Chain Integrity** at the top right again.
6. A red alert box appears: **🚨 AUDIT INTEGRITY CHECK FAILED** indicating the exact block ID where the cryptographically-chained hash comparison failed.

