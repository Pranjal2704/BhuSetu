export type Role = 'ADMIN' | 'OFFICER' | 'VIEWER';

export interface User {
  id: string;
  username: string;
  password_hash: string;
  role: Role;
  name: string;
}

export interface Parcel {
  id: string;
  khasra_number: string;
  geojson_geometry: string; // JSON string
  claimed_area_acres: number;
  calculated_area_acres: number;
  status: 'CLEAR' | 'DISPUTED' | 'REVIEW_REQUIRED';
}

export interface Person {
  id: string;
  name: string;
  normalized_name: string;
  aadhaar_token?: string;
}

export type DocType = 'ROR' | 'MUTATION' | 'SALE_DEED' | 'SURVEY';

export interface Document {
  id: string;
  parcel_id: string;
  doc_type: DocType;
  doc_ref: string;
  file_name: string;
  file_content?: string;
  uploaded_at: string;
}

export interface DocumentExtraction {
  id: string;
  document_id: string;
  extracted_json: string; // JSON string
  confidence: number;
  verified_by_human: number; // SQLite INTEGER (0 or 1)
}

export type TransactionStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'CLARIFICATION_REQUESTED';

export interface Transaction {
  id: string;
  parcel_id: string;
  document_id: string;
  seller_raw: string;
  buyer_raw: string;
  seller_resolved_id?: string;
  buyer_resolved_id?: string;
  share_percentage: number;
  status: TransactionStatus;
  created_at: string;
}

export type VerificationStatus = 'VERIFIED' | 'REVIEW_REQUIRED' | 'REJECTED';

export interface VerificationResult {
  id: string;
  transaction_id: string;
  status: VerificationStatus;
  identity_status: 'PASSED' | 'FAILED' | 'AMBIGUOUS';
  identity_reason?: string;
  ownership_status: 'PASSED' | 'FAILED';
  ownership_reason?: string;
  document_status: 'PASSED' | 'FAILED';
  document_reason?: string;
  temporal_status: 'PASSED' | 'FAILED';
  temporal_reason?: string;
  spatial_status: 'PASSED' | 'FAILED' | 'REVIEW_REQUIRED';
  spatial_reason?: string;
  dispute_status: 'CLEAR' | 'FAILED';
  dispute_reason?: string;
  created_at: string;
}

export type EventType = 'INITIAL' | 'MUTATION_RECORD' | 'SALE_TRANSFER';

export interface OwnershipEvent {
  id: string;
  parcel_id: string;
  event_type: EventType;
  transaction_id?: string;
  document_id: string;
  seller_person_id?: string;
  buyer_person_id: string;
  share_percentage: number;
  effective_date: string;
}

export interface OwnershipState {
  parcel_id: string;
  person_id: string;
  share_percentage: number;
}

export interface Dispute {
  id: string;
  parcel_id: string;
  description: string;
  status: 'ACTIVE' | 'RESOLVED';
  filed_at: string;
}

export interface Encumbrance {
  id: string;
  parcel_id: string;
  type: string;
  amount?: number;
  status: 'ACTIVE' | 'RELEASED';
  created_at: string;
}

export interface AuditLog {
  id?: number;
  timestamp: string;
  user_id: string;
  username: string;
  action_type: string;
  parcel_id?: string;
  details: string;
  prev_hash: string;
  current_hash: string;
}
