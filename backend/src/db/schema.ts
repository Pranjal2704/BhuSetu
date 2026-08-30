import { Database } from 'sqlite';
import bcryptjs from 'bcryptjs';
import { getDb } from '../config/db';

export async function initDb(db: Database) {
  // Disable foreign keys temporarily to drop tables in any order
  await db.run('PRAGMA foreign_keys = OFF;');

  const tables = [
    'audit_logs',
    'encumbrances',
    'disputes',
    'ownership_states',
    'ownership_events',
    'verification_results',
    'transactions',
    'document_extractions',
    'documents',
    'persons',
    'parcels',
    'users'
  ];

  for (const table of tables) {
    await db.run(`DROP TABLE IF EXISTS ${table};`);
  }

  // Re-enable foreign keys
  await db.run('PRAGMA foreign_keys = ON;');

  // Create Users & RBAC
  await db.run(`
    CREATE TABLE users (
      id TEXT PRIMARY KEY,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL CHECK (role IN ('ADMIN', 'OFFICER', 'VIEWER')),
      name TEXT NOT NULL
    );
  `);

  // Create Parcels
  await db.run(`
    CREATE TABLE parcels (
      id TEXT PRIMARY KEY,
      khasra_number TEXT UNIQUE NOT NULL,
      geojson_geometry TEXT NOT NULL,
      claimed_area_acres REAL NOT NULL,
      calculated_area_acres REAL NOT NULL,
      status TEXT DEFAULT 'CLEAR' CHECK (status IN ('CLEAR', 'DISPUTED', 'REVIEW_REQUIRED'))
    );
  `);

  // Create Resolved Identity Profiles (Persons)
  await db.run(`
    CREATE TABLE persons (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      normalized_name TEXT NOT NULL,
      aadhaar_token TEXT
    );
  `);

  // Create Source Documents
  await db.run(`
    CREATE TABLE documents (
      id TEXT PRIMARY KEY,
      parcel_id TEXT NOT NULL,
      doc_type TEXT NOT NULL CHECK (doc_type IN ('ROR', 'MUTATION', 'SALE_DEED', 'SURVEY')),
      doc_ref TEXT NOT NULL,
      file_name TEXT NOT NULL,
      file_content TEXT,
      uploaded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (parcel_id) REFERENCES parcels(id)
    );
  `);

  // Create Document Extraction Results
  await db.run(`
    CREATE TABLE document_extractions (
      id TEXT PRIMARY KEY,
      document_id TEXT NOT NULL UNIQUE,
      extracted_json TEXT NOT NULL,
      confidence REAL NOT NULL,
      verified_by_human INTEGER DEFAULT 0,
      FOREIGN KEY (document_id) REFERENCES documents(id)
    );
  `);

  // Create Proposed Transactions
  await db.run(`
    CREATE TABLE transactions (
      id TEXT PRIMARY KEY,
      parcel_id TEXT NOT NULL,
      document_id TEXT NOT NULL,
      seller_raw TEXT NOT NULL,
      buyer_raw TEXT NOT NULL,
      seller_resolved_id TEXT,
      buyer_resolved_id TEXT,
      share_percentage REAL NOT NULL,
      status TEXT DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED', 'CLARIFICATION_REQUESTED')),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (parcel_id) REFERENCES parcels(id),
      FOREIGN KEY (document_id) REFERENCES documents(id),
      FOREIGN KEY (seller_resolved_id) REFERENCES persons(id),
      FOREIGN KEY (buyer_resolved_id) REFERENCES persons(id)
    );
  `);

  // Create Verification Reports
  await db.run(`
    CREATE TABLE verification_results (
      id TEXT PRIMARY KEY,
      transaction_id TEXT NOT NULL UNIQUE,
      status TEXT NOT NULL CHECK (status IN ('VERIFIED', 'REVIEW_REQUIRED', 'REJECTED')),
      identity_status TEXT NOT NULL,
      identity_reason TEXT,
      ownership_status TEXT NOT NULL,
      ownership_reason TEXT,
      document_status TEXT NOT NULL,
      document_reason TEXT,
      temporal_status TEXT NOT NULL,
      temporal_reason TEXT,
      spatial_status TEXT NOT NULL,
      spatial_reason TEXT,
      dispute_status TEXT NOT NULL,
      dispute_reason TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (transaction_id) REFERENCES transactions(id)
    );
  `);

  // Create Ownership Mutation Events (Immutable Journal)
  await db.run(`
    CREATE TABLE ownership_events (
      id TEXT PRIMARY KEY,
      parcel_id TEXT NOT NULL,
      event_type TEXT NOT NULL CHECK (event_type IN ('INITIAL', 'MUTATION_RECORD', 'SALE_TRANSFER')),
      transaction_id TEXT,
      document_id TEXT NOT NULL,
      seller_person_id TEXT,
      buyer_person_id TEXT,
      share_percentage REAL NOT NULL,
      effective_date TEXT NOT NULL,
      FOREIGN KEY (parcel_id) REFERENCES parcels(id),
      FOREIGN KEY (transaction_id) REFERENCES transactions(id),
      FOREIGN KEY (document_id) REFERENCES documents(id),
      FOREIGN KEY (seller_person_id) REFERENCES persons(id),
      FOREIGN KEY (buyer_person_id) REFERENCES persons(id)
    );
  `);

  // Create Active Materialized Ownership Share State
  await db.run(`
    CREATE TABLE ownership_states (
      parcel_id TEXT NOT NULL,
      person_id TEXT NOT NULL,
      share_percentage REAL NOT NULL,
      PRIMARY KEY (parcel_id, person_id),
      FOREIGN KEY (parcel_id) REFERENCES parcels(id),
      FOREIGN KEY (person_id) REFERENCES persons(id)
    );
  `);

  // Create Active Disputes
  await db.run(`
    CREATE TABLE disputes (
      id TEXT PRIMARY KEY,
      parcel_id TEXT NOT NULL,
      description TEXT NOT NULL,
      status TEXT DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'RESOLVED')),
      filed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (parcel_id) REFERENCES parcels(id)
    );
  `);

  // Create Encumbrances
  await db.run(`
    CREATE TABLE encumbrances (
      id TEXT PRIMARY KEY,
      parcel_id TEXT NOT NULL,
      type TEXT NOT NULL,
      amount REAL,
      status TEXT DEFAULT 'ACTIVE',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (parcel_id) REFERENCES parcels(id)
    );
  `);

  // Create Tamper-Evident Audit Chain
  await db.run(`
    CREATE TABLE audit_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
      user_id TEXT NOT NULL,
      username TEXT NOT NULL,
      action_type TEXT NOT NULL,
      parcel_id TEXT,
      details TEXT NOT NULL,
      prev_hash TEXT NOT NULL,
      current_hash TEXT NOT NULL
    );
  `);
}

export async function seedDb(db: Database) {
  // 1. Seed Users
  const saltRounds = 10;
  const adminHash = bcryptjs.hashSync('admin123', saltRounds);
  const officerHash = bcryptjs.hashSync('officer123', saltRounds);
  const viewerHash = bcryptjs.hashSync('viewer123', saltRounds);

  await db.run(`
    INSERT INTO users (id, username, password_hash, role, name) VALUES
    ('u-admin', 'admin', ?, 'ADMIN', 'System Administrator'),
    ('u-officer', 'officer', ?, 'OFFICER', 'Review Officer Pranav'),
    ('u-viewer', 'viewer', ?, 'VIEWER', 'Public Viewer')
  `, adminHash, officerHash, viewerHash);

  // 2. Seed Persons
  await db.run(`
    INSERT INTO persons (id, name, normalized_name, aadhaar_token) VALUES
    ('p-anand', 'Anand Verma', 'anand verma', 'AA-9912-3344'),
    ('p-bikram', 'Bikram Singh', 'bikram singh', 'AA-1122-3344'),
    ('p-chandra', 'Chandra Kumar', 'chandra kumar', 'AA-5566-7788'),
    ('p-ramesh', 'Ramesh Kumar', 'ramesh kumar', 'AA-8899-0011'),
    ('p-devendra', 'Devendra Prasad', 'devendra prasad', 'AA-2233-4455'),
    ('p-esha', 'Esha Gupta', 'esha gupta', 'AA-3344-5566'),
    ('p-firoz', 'Firoz Khan', 'firoz khan', 'AA-4455-6677'),
    ('p-gopal', 'Gopal Das', 'gopal das', 'AA-7788-9900'),
    ('p-hari', 'Hari Prasad', 'hari prasad', 'AA-6677-8899')
  `);

  // 3. Seed Parcels
  // Note: Geometries represent rectangular boxes.
  // 142/3 Main Demo: Area 2.40 acres
  const geom142_3 = JSON.stringify({
    type: 'Polygon',
    coordinates: [[
      [78.000, 17.000],
      [78.001, 17.000],
      [78.001, 17.0009],
      [78.000, 17.0009],
      [78.000, 17.000]
    ]]
  });
  // 145/2: Identity Resolution
  const geom145_2 = JSON.stringify({
    type: 'Polygon',
    coordinates: [[
      [78.002, 17.002],
      [78.003, 17.002],
      [78.003, 17.0029],
      [78.002, 17.0029],
      [78.002, 17.002]
    ]]
  });
  // 146/1: Doc Contradiction
  const geom146_1 = JSON.stringify({
    type: 'Polygon',
    coordinates: [[
      [78.004, 17.004],
      [78.005, 17.004],
      [78.005, 17.0049],
      [78.004, 17.0049],
      [78.004, 17.004]
    ]]
  });
  // 147/4: Temporal
  const geom147_4 = JSON.stringify({
    type: 'Polygon',
    coordinates: [[
      [78.006, 17.006],
      [78.007, 17.006],
      [78.007, 17.0069],
      [78.006, 17.0069],
      [78.006, 17.006]
    ]]
  });
  // 148/9: Spatial Mismatch (Claimed: 2.40 acres, Calculated: 2.72 acres)
  // width: 0.001 degrees lon (~106m)
  // height: 0.00093 degrees lat (~103m)
  // area: ~10,918 sq m ~ 2.70 acres
  const geom148_9 = JSON.stringify({
    type: 'Polygon',
    coordinates: [[
      [78.010, 17.010],
      [78.011, 17.010],
      [78.011, 17.01093],
      [78.010, 17.01093],
      [78.010, 17.010]
    ]]
  });
  // 149/1: Dispute
  const geom149_1 = JSON.stringify({
    type: 'Polygon',
    coordinates: [[
      [78.012, 17.012],
      [78.013, 17.012],
      [78.013, 17.0129],
      [78.012, 17.0129],
      [78.012, 17.012]
    ]]
  });
  // 150/5: Clean
  const geom150_5 = JSON.stringify({
    type: 'Polygon',
    coordinates: [[
      [78.014, 17.014],
      [78.015, 17.014],
      [78.015, 17.0149],
      [78.014, 17.0149],
      [78.014, 17.014]
    ]]
  });

  await db.run(`
    INSERT INTO parcels (id, khasra_number, geojson_geometry, claimed_area_acres, calculated_area_acres, status) VALUES
    ('prcl-142-3', '142/3', ?, 2.40, 2.40, 'CLEAR'),
    ('prcl-145-2', '145/2', ?, 2.40, 2.40, 'CLEAR'),
    ('prcl-146-1', '146/1', ?, 2.40, 2.40, 'CLEAR'),
    ('prcl-147-4', '147/4', ?, 2.40, 2.40, 'CLEAR'),
    ('prcl-148-9', '148/9', ?, 2.40, 2.70, 'REVIEW_REQUIRED'),
    ('prcl-149-1', '149/1', ?, 2.40, 2.40, 'DISPUTED'),
    ('prcl-150-5', '150/5', ?, 2.40, 2.40, 'CLEAR')
  `, geom142_3, geom145_2, geom146_1, geom147_4, geom148_9, geom149_1, geom150_5);

  // 4. Seed Documents for main parcel (142/3) and other initial states
  // We'll seed the original RoR (2020) and Mutation Record (2022) for 142/3
  await db.run(`
    INSERT INTO documents (id, parcel_id, doc_type, doc_ref, file_name, file_content, uploaded_at) VALUES
    ('doc-ror-2020', 'prcl-142-3', 'ROR', 'ROR/2020/142-3', 'ror_142_3_2020.txt',
     'LAND RECORD ROR PAHANI 2020\nParcel ID: 142/3\nTotal Area: 2.40 Acres\nSole Owner: Anand Verma\nShare: 100%', '2020-01-15 10:00:00'),
    ('doc-mut-2022', 'prcl-142-3', 'MUTATION', 'MUT/2022/881', 'mutation_142_3_2022.txt',
     'MUTATION ENTRY 2022\nReference: MUT/2022/881\nParcel: 142/3\nSeller/Transferer: Anand Verma\nBuyer/Transferee: Bikram Singh\nShare Transferred: 40%\nStatus: Approved', '2022-05-20 11:30:00'),
    
    -- Documents for other parcels
    ('doc-ror-145-2', 'prcl-145-2', 'ROR', 'ROR/2020/145-2', 'ror_145_2.txt',
     'LAND RECORD ROR PAHANI\nParcel: 145/2\nOwner: Ramesh Kumar\nShare: 100%', '2020-02-10 09:00:00'),
    ('doc-ror-146-1', 'prcl-146-1', 'ROR', 'ROR/2020/146-1', 'ror_146_1.txt',
     'LAND RECORD ROR\nParcel: 146/1\nOwner: Devendra Prasad (60%), Esha Gupta (40%)', '2020-03-01 10:00:00'),
    ('doc-ror-147-4', 'prcl-147-4', 'ROR', 'ROR/2020/147-4', 'ror_147_4.txt',
     'LAND RECORD ROR\nParcel: 147/4\nOwner: Firoz Khan\nShare: 100%', '2020-04-12 12:00:00'),
    ('doc-ror-148-9', 'prcl-148-9', 'ROR', 'ROR/2020/148-9', 'ror_148_9.txt',
     'LAND RECORD ROR\nParcel: 148/9\nOwner: Anand Verma\nShare: 100%\nClaimed Area: 2.40 Acres', '2020-05-15 14:00:00'),
    ('doc-ror-149-1', 'prcl-149-1', 'ROR', 'ROR/2020/149-1', 'ror_149_1.txt',
     'LAND RECORD ROR\nParcel: 149/1\nOwner: Gopal Das\nShare: 100%', '2020-06-18 15:30:00'),
    ('doc-ror-150-5', 'prcl-150-5', 'ROR', 'ROR/2020/150-5', 'ror_150_5.txt',
     'LAND RECORD ROR\nParcel: 150/5\nOwner: Hari Prasad\nShare: 100%', '2020-07-22 16:00:00')
  `);

  // 5. Seed Document Extractions
  await db.run(`
    INSERT INTO document_extractions (id, document_id, extracted_json, confidence, verified_by_human) VALUES
    ('ext-ror-2020', 'doc-ror-2020', '{"parcel_id":"prcl-142-3","khasra_number":"142/3","owners":[{"name":"Anand Verma","share":100}],"doc_type":"ROR"}', 0.98, 1),
    ('ext-mut-2022', 'doc-mut-2022', '{"parcel_id":"prcl-142-3","khasra_number":"142/3","seller":"Anand Verma","buyer":"Bikram Singh","share":40,"doc_type":"MUTATION"}', 0.95, 1),
    ('ext-ror-145-2', 'doc-ror-145-2', '{"parcel_id":"prcl-145-2","khasra_number":"145/2","owners":[{"name":"Ramesh Kumar","share":100}],"doc_type":"ROR"}', 0.97, 1),
    ('ext-ror-146-1', 'doc-ror-146-1', '{"parcel_id":"prcl-146-1","khasra_number":"146/1","owners":[{"name":"Devendra Prasad","share":60},{"name":"Esha Gupta","share":40}],"doc_type":"ROR"}', 0.96, 1),
    ('ext-ror-147-4', 'doc-ror-147-4', '{"parcel_id":"prcl-147-4","khasra_number":"147/4","owners":[{"name":"Firoz Khan","share":100}],"doc_type":"ROR"}', 0.98, 1),
    ('ext-ror-148-9', 'doc-ror-148-9', '{"parcel_id":"prcl-148-9","khasra_number":"148/9","owners":[{"name":"Anand Verma","share":100}],"doc_type":"ROR","claimed_area_acres":2.40}', 0.95, 1),
    ('ext-ror-149-1', 'doc-ror-149-1', '{"parcel_id":"prcl-149-1","khasra_number":"149/1","owners":[{"name":"Gopal Das","share":100}],"doc_type":"ROR"}', 0.99, 1),
    ('ext-ror-150-5', 'doc-ror-150-5', '{"parcel_id":"prcl-150-5","khasra_number":"150/5","owners":[{"name":"Hari Prasad","share":100}],"doc_type":"ROR"}', 0.98, 1)
  `);

  // 6. Seed Historical Events
  // This builds the initial ownership states
  await db.run(`
    INSERT INTO ownership_events (id, parcel_id, event_type, document_id, buyer_person_id, share_percentage, effective_date) VALUES
    ('evt-ror-142-3', 'prcl-142-3', 'INITIAL', 'doc-ror-2020', 'p-anand', 100.0, '2020-01-15')
  `);

  // Mutation 2022 (A -> B transfer of 40%)
  await db.run(`
    INSERT INTO ownership_events (id, parcel_id, event_type, document_id, seller_person_id, buyer_person_id, share_percentage, effective_date) VALUES
    ('evt-mut-142-3', 'prcl-142-3', 'MUTATION_RECORD', 'doc-mut-2022', 'p-anand', 'p-bikram', 40.0, '2022-05-20')
  `);

  // Other parcels initial events
  await db.run(`
    INSERT INTO ownership_events (id, parcel_id, event_type, document_id, buyer_person_id, share_percentage, effective_date) VALUES
    ('evt-145-2', 'prcl-145-2', 'INITIAL', 'doc-ror-145-2', 'p-ramesh', 100.0, '2020-02-10')
  `);

  await db.run(`
    INSERT INTO ownership_events (id, parcel_id, event_type, document_id, buyer_person_id, share_percentage, effective_date) VALUES
    ('evt-146-1-1', 'prcl-146-1', 'INITIAL', 'doc-ror-146-1', 'p-devendra', 60.0, '2020-03-01'),
    ('evt-146-1-2', 'prcl-146-1', 'INITIAL', 'doc-ror-146-1', 'p-esha', 40.0, '2020-03-01')
  `);

  await db.run(`
    INSERT INTO ownership_events (id, parcel_id, event_type, document_id, buyer_person_id, share_percentage, effective_date) VALUES
    ('evt-147-4', 'prcl-147-4', 'INITIAL', 'doc-ror-147-4', 'p-firoz', 100.0, '2020-04-12')
  `);

  await db.run(`
    INSERT INTO ownership_events (id, parcel_id, event_type, document_id, buyer_person_id, share_percentage, effective_date) VALUES
    ('evt-148-9', 'prcl-148-9', 'INITIAL', 'doc-ror-148-9', 'p-anand', 100.0, '2020-05-15')
  `);

  await db.run(`
    INSERT INTO ownership_events (id, parcel_id, event_type, document_id, buyer_person_id, share_percentage, effective_date) VALUES
    ('evt-149-1', 'prcl-149-1', 'INITIAL', 'doc-ror-149-1', 'p-gopal', 100.0, '2020-06-18')
  `);

  await db.run(`
    INSERT INTO ownership_events (id, parcel_id, event_type, document_id, buyer_person_id, share_percentage, effective_date) VALUES
    ('evt-150-5', 'prcl-150-5', 'INITIAL', 'doc-ror-150-5', 'p-hari', 100.0, '2020-07-22')
  `);

  // 7. Initialize Materialized States table matching the events
  await db.run(`
    INSERT INTO ownership_states (parcel_id, person_id, share_percentage) VALUES
    ('prcl-142-3', 'p-anand', 60.0),
    ('prcl-142-3', 'p-bikram', 40.0),
    ('prcl-145-2', 'p-ramesh', 100.0),
    ('prcl-146-1', 'p-devendra', 60.0),
    ('prcl-146-1', 'p-esha', 40.0),
    ('prcl-147-4', 'p-firoz', 100.0),
    ('prcl-148-9', 'p-anand', 100.0),
    ('prcl-149-1', 'p-gopal', 100.0),
    ('prcl-150-5', 'p-hari', 100.0)
  `);

  // 8. Seed disputes
  await db.run(`
    INSERT INTO disputes (id, parcel_id, description, status, filed_at) VALUES
    ('disp-149-1', 'prcl-149-1', 'Civil Court Title Dispute Suit No. 204/2025 regarding sibling share claims.', 'ACTIVE', '2025-02-14 11:00:00')
  `);

  // 9. Seed encumbrances
  await db.run(`
    INSERT INTO encumbrances (id, parcel_id, type, amount, status, created_at) VALUES
    ('enc-142-3', 'prcl-142-3', 'SBI Land Development Loan Mortgage', 150000.00, 'ACTIVE', '2023-08-10 10:00:00')
  `);

  // 10. Seed Audit Logs and hash chain initial entries
  // Entry 1
  const ts1 = '2026-08-30 10:00:00';
  const data1 = `1|${ts1}|u-admin|admin|DATABASE_INITIALIZED||Database schema initialized and seed data successfully loaded.|`;
  const h1 = require('crypto').createHash('sha256').update(data1 + '0').digest('hex');
  await db.run(`
    INSERT INTO audit_logs (id, timestamp, user_id, username, action_type, parcel_id, details, prev_hash, current_hash) VALUES
    (1, ?, 'u-admin', 'admin', 'DATABASE_INITIALIZED', NULL, 'Database schema initialized and seed data successfully loaded.', '0', ?)
  `, ts1, h1);

  // Entry 2
  const ts2 = '2026-08-30 10:05:00';
  const data2 = `2|${ts2}|u-admin|admin|PARCELS_SEEDED||Total of 7 land parcels pre-loaded into the ledger catalog.|${h1}`;
  const h2 = require('crypto').createHash('sha256').update(data2).digest('hex');
  await db.run(`
    INSERT INTO audit_logs (id, timestamp, user_id, username, action_type, parcel_id, details, prev_hash, current_hash) VALUES
    (2, ?, 'u-admin', 'admin', 'PARCELS_SEEDED', NULL, 'Total of 7 land parcels pre-loaded into the ledger catalog.', ?, ?)
  `, ts2, h1, h2);
}
export async function initializeDatabase() {
  const db = await getDb();
  await initDb(db);
  await seedDb(db);
  console.log("Database initialized and seeded successfully.");
}
