# BhuSetu — Ownership-State Verification Engine

**Project ID:** SIH26018  
**Ministry/Organization:** Ministry of Rural Development  
**Hackathon Target:** Smart India Hackathon (SIH) 2026 Prototype

---

BhuSetu is a decision-support system designed to reconstruct the chronological ownership state of land parcels from historical records and verify if a new proposed transaction is consistent with that history before it is committed.

Rather than validating documents in isolation, BhuSetu evaluates transaction consistency against the dynamically calculated ownership state established by all preceding records (RoR, Mutation Deeds, Sale Deeds).

---

## 🛠️ Technology Stack
* **Frontend:** React, TypeScript, Tailwind CSS, Leaflet.js (GIS Map rendering)
* **Backend:** Node.js, Express, TypeScript, SQLite (relational database), Turf.js (geometric area calculation)
* **Cryptographic Integrity:** SHA-256 hash chains for tamper-evident logging

---

## ⚙️ Quick Start (Workable Format)

The project is configured as a monorepo workspace. You can install all dependencies and start both backend and frontend servers with **just two commands** from the project root:

### 1. Install all dependencies
```bash
npm run setup
```
*(This command automatically runs `npm install` inside the root, `backend/`, and `frontend/` folders).*

### 2. Start servers concurrently
```bash
npm start
```
*(This starts the Express API server on port `5001` and the Vite/React console on port `3000` simultaneously in a single terminal window).*

Once started, open:
* **BhuSetu Console:** [http://localhost:3000](http://localhost:3000)
* **Backend API Health:** [http://localhost:5001/health](http://localhost:5001/health)

---

## 📦 Synthetic Demonstration Presets

On startup, the SQLite database is automatically generated and seeded with 7 test land parcels and historical mutation logs. In the **Document Upload** console, you can select from the following test scenarios:

1. **Case 1: Valid Sale Deed** (Anand Verma sells 40% of plot 142/3 to Chandra Kumar) ➔ **PASS**
2. **Case 2: Over-Transfer (Main Demo)** (Anand Verma attempts to sell 80% of plot 142/3 to Chandra Kumar while owning only 60%) ➔ **FAIL (Deficit 20%)**
3. **Case 3: Name Variation Resolution** (Ramesh K. sells plot 145/2. Resolves Ramesh K. to Ramesh Kumar in ledger) ➔ **PASS with fuzzy explanation**
4. **Case 4: Document Contradiction** (Devendra Prasad sells 80% of plot 146/1 while RoR limits him to 60%) ➔ **FAIL**
5. **Case 5: Temporal Anomaly** (Backdated deed submission dated 2019 on plot 147/4 bypassing 2020 ledger state) ➔ **FAIL**
6. **Case 6: Spatial GIS Discrepancy** (Deed claims 2.40 acres, but GIS coordinate bounds measure 2.70 acres - 12.5% discrepancy) ➔ **FAIL/REVIEW REQUIRED**
7. **Case 7: Litigation Hard Block** (Gopal Das attempts to sell plot 149/1, which has an active court dispute) ➔ **HARD BLOCK**
8. **Case 8: Clean Execution** (Hari Prasad sells plot 150/5; all checks pass) ➔ **PASS**

---

## 🔒 Tamper-Evident SHA-256 Audit Log Demo
1. Go to the **Audit Integrity chain** tab in the sidebar.
2. Click **Verify Audit Chain Integrity** (calculates hashes chronologically to confirm the DB is valid).
3. Scroll down and click **Simulate Tamper** on a log entry to modify a row in the database directly.
4. Click **Verify Audit Chain Integrity** again. The chain will fail, indicating the exact block ID that was modified.
