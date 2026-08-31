import React, { useState, useEffect } from 'react';
import { 
  ShieldAlert, 
  CheckCircle, 
  XCircle, 
  Search, 
  Upload, 
  Map, 
  History, 
  FileText, 
  Users, 
  RefreshCw, 
  AlertTriangle, 
  CornerDownRight, 
  LogOut, 
  Lock, 
  FileCheck,
  UserCheck,
  MapPin,
  TrendingDown,
  Layers,
  Database
} from 'lucide-react';
import { ParcelMap } from './components/ParcelMap';
import { ChatbotWidget } from './components/ChatbotWidget';

// Config
const API_BASE = ''; 

// Main App Container
export default function App() {
  const [token, setToken] = useState<string | null>(localStorage.getItem('bp_token'));
  const [user, setUser] = useState<any>(null);
  const [currentScreen, setCurrentScreen] = useState('dashboard');
  const [authError, setAuthError] = useState('');
  
  // Login form states
  const [usernameInput, setUsernameInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');

  // Global triggers for page refreshes
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Fetch current user if token exists
  useEffect(() => {
    if (token) {
      localStorage.setItem('bp_token', token);
      fetchUser();
    } else {
      localStorage.removeItem('bp_token');
      setUser(null);
    }
  }, [token]);

  const fetchUser = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/auth/me`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
      } else {
        handleLogout();
      }
    } catch (e) {
      handleLogout();
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    try {
      const res = await fetch(`${API_BASE}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: usernameInput, password: passwordInput })
      });
      const data = await res.json();
      if (res.ok) {
        setToken(data.token);
        setUser(data.user);
      } else {
        setAuthError(data.error || 'Authentication failed.');
      }
    } catch (err) {
      setAuthError('Cannot connect to backend server.');
    }
  };

  const handleLogout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('bp_token');
  };

  const fillCredentials = (uname: string, pass: string) => {
    setUsernameInput(uname);
    setPasswordInput(pass);
  };

  // If not logged in, render Login Page
  if (!token || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 px-4 relative overflow-hidden">
        {/* Subtle grid styling */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#0f172a_1px,transparent_1px),linear-gradient(to_bottom,#0f172a_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]"></div>

        <div className="max-w-md w-full space-y-8 bg-slate-900 p-8 rounded-xl border border-slate-800 shadow-2xl relative z-10">
          <div className="text-center">
            <span className="inline-block text-4xl mb-2">📜</span>
            <h2 className="text-3xl font-extrabold text-white tracking-tight">BhuSetu</h2>
            <p className="mt-2 text-sm text-slate-400 font-medium">
              Land Ownership-State Verification Engine
            </p>
            <div className="mt-1 inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-semibold text-blue-400 bg-blue-950/50 border border-blue-900/50 uppercase tracking-wider">
              Prototype Demonstration
            </div>
          </div>

          <form className="mt-8 space-y-6" onSubmit={handleLogin}>
            {authError && (
              <div className="bg-red-950/50 border border-red-900 rounded p-3 text-xs text-red-400 flex items-center gap-2">
                <ShieldAlert size={16} />
                <span>{authError}</span>
              </div>
            )}

            <div className="rounded-md shadow-sm space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Username</label>
                <input
                  type="text"
                  required
                  value={usernameInput}
                  onChange={(e) => setUsernameInput(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                  placeholder="Enter username"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">Password</label>
                <input
                  type="password"
                  required
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <div>
              <button
                type="submit"
                className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-semibold rounded bg-blue-600 hover:bg-blue-700 text-white focus:outline-none transition-colors"
              >
                Sign In to Console
              </button>
            </div>
          </form>

          {/* Quick presets for evaluation */}
          <div className="border-t border-slate-800 pt-6 mt-4">
            <span className="text-xs font-medium text-slate-400 block mb-2 text-center">
              Quick Autofill Credentials
            </span>
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => fillCredentials('officer', 'officer123')}
                className="px-2 py-1.5 text-xs text-slate-300 bg-slate-800 hover:bg-slate-700 rounded border border-slate-700 font-medium transition-colors"
              >
                ✍️ Officer
              </button>
              <button
                onClick={() => fillCredentials('admin', 'admin123')}
                className="px-2 py-1.5 text-xs text-slate-300 bg-slate-800 hover:bg-slate-700 rounded border border-slate-700 font-medium transition-colors"
              >
                ⚙️ Admin
              </button>
              <button
                onClick={() => fillCredentials('viewer', 'viewer123')}
                className="px-2 py-1.5 text-xs text-slate-300 bg-slate-800 hover:bg-slate-700 rounded border border-slate-700 font-medium transition-colors"
              >
                👁️ Viewer
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Render Main Layout with Sidebar
  return (
    <div className="h-screen flex bg-slate-50 overflow-hidden">
      {/* SIDEBAR */}
      <aside className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col text-slate-300 shrink-0">
        <div className="px-6 py-5 border-b border-slate-800 flex items-center gap-2">
          <span className="text-2xl">📜</span>
          <div>
            <h1 className="font-bold text-white text-lg tracking-tight leading-none">BhuSetu</h1>
            <span className="text-[10px] text-slate-400 font-medium uppercase tracking-wider block mt-1">
              State-Verification
            </span>
          </div>
        </div>

        {/* Navigation items */}
        <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
          <button
            onClick={() => setCurrentScreen('dashboard')}
            className={`w-full flex items-center gap-3 px-3 py-2 text-sm font-medium rounded transition-colors ${
              currentScreen === 'dashboard' ? 'bg-blue-600 text-white' : 'hover:bg-slate-800 hover:text-white'
            }`}
          >
            <Layers size={18} />
            <span>Dashboard</span>
          </button>

          <button
            onClick={() => setCurrentScreen('upload')}
            className={`w-full flex items-center gap-3 px-3 py-2 text-sm font-medium rounded transition-colors ${
              currentScreen === 'upload' ? 'bg-blue-600 text-white' : 'hover:bg-slate-800 hover:text-white'
            }`}
          >
            <Upload size={18} />
            <span>Document Upload</span>
          </button>

          <button
            onClick={() => setCurrentScreen('registry')}
            className={`w-full flex items-center gap-3 px-3 py-2 text-sm font-medium rounded transition-colors ${
              currentScreen === 'registry' ? 'bg-blue-600 text-white' : 'hover:bg-slate-800 hover:text-white'
            }`}
          >
            <Search size={18} />
            <span>Land Parcel Registry</span>
          </button>

          {/* Officer/Admin only check */}
          {(user.role === 'OFFICER' || user.role === 'ADMIN') && (
            <button
              onClick={() => setCurrentScreen('review')}
              className={`w-full flex items-center gap-3 px-3 py-2 text-sm font-medium rounded transition-colors ${
                currentScreen === 'review' ? 'bg-blue-600 text-white' : 'hover:bg-slate-800 hover:text-white'
              }`}
            >
              <FileCheck size={18} />
              <span>Review Officer Queue</span>
            </button>
          )}

          <button
            onClick={() => setCurrentScreen('audit')}
            className={`w-full flex items-center gap-3 px-3 py-2 text-sm font-medium rounded transition-colors ${
              currentScreen === 'audit' ? 'bg-blue-600 text-white' : 'hover:bg-slate-800 hover:text-white'
            }`}
          >
            <Database size={18} />
            <span>Audit Integrity chain</span>
          </button>
        </nav>

        {/* Bottom Profile and Sign Out */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/40 text-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-slate-400 font-medium truncate block max-w-[140px]">
              {user.name}
            </span>
            <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-slate-800 text-slate-300 border border-slate-700">
              {user.role}
            </span>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 py-1.5 px-3 rounded bg-slate-800 hover:bg-red-950 hover:text-red-400 text-slate-300 font-semibold transition-colors"
          >
            <LogOut size={12} />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* CONTENT AREA */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar */}
        <header className="h-14 bg-white border-b border-slate-200 flex items-center justify-between px-8 shrink-0">
          <div className="text-xs text-slate-500 font-medium flex items-center gap-2">
            <span>Server status:</span>
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-500"></span>
            <span className="font-semibold text-slate-700">BhuSetu Monolith API 1.0</span>
          </div>
          
          <div className="flex items-center gap-3 text-xs bg-slate-100 px-3 py-1 rounded border border-slate-200">
            <span className="font-semibold text-slate-700">Role Mode:</span>
            <span className="text-blue-700 font-bold uppercase tracking-wider">{user.role}</span>
          </div>
        </header>

        {/* Core screens renderer */}
        <div className="flex-1 overflow-y-auto p-8">
          {currentScreen === 'dashboard' && (
            <DashboardScreen 
              token={token} 
              onNavigate={setCurrentScreen} 
              refreshTrigger={refreshTrigger}
            />
          )}
          {currentScreen === 'upload' && (
            <UploadScreen 
              token={token} 
              onNavigate={setCurrentScreen} 
              setRefreshTrigger={setRefreshTrigger}
            />
          )}
          {currentScreen === 'registry' && (
            <RegistryScreen 
              token={token}
              refreshTrigger={refreshTrigger}
            />
          )}
          {currentScreen === 'review' && (
            <ReviewScreen 
              token={token} 
              user={user}
              refreshTrigger={refreshTrigger}
              setRefreshTrigger={setRefreshTrigger}
            />
          )}
          {currentScreen === 'audit' && (
            <AuditScreen 
              token={token} 
              user={user}
              refreshTrigger={refreshTrigger}
              setRefreshTrigger={setRefreshTrigger}
            />
          )}
        </div>
      </main>
      <ChatbotWidget token={token} />
    </div>
  );
}

// ============================================================================
// SCREEN: DASHBOARD
// ============================================================================
function DashboardScreen({ token, onNavigate, refreshTrigger }: any) {
  const [stats, setStats] = useState<any>({
    totalParcels: 0,
    activeDisputes: 0,
    pendingReviews: 0,
    warnings: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, [refreshTrigger]);

  const fetchDashboardData = async () => {
    try {
      // Fetch parcels list
      const pRes = await fetch('/api/parcels', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const parcels = await pRes.json();

      // Fetch transactions queue
      const tRes = await fetch('/api/transactions', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const transactions = await tRes.json();

      let disputesCount = 0;
      let reviewRequiredCount = 0;
      const warningList: any[] = [];

      parcels.forEach((p: any) => {
        disputesCount += p.disputesCount || 0;
        if (p.status === 'REVIEW_REQUIRED' || p.status === 'DISPUTED') {
          reviewRequiredCount++;
        }
      });

      const pendingTxs = transactions.filter((t: any) => t.status === 'PENDING');
      
      // Compute alerts from transaction verification results
      const failedTxs = transactions.filter((t: any) => t.status === 'REJECTED' || (t.status === 'PENDING' && t.verification_status === 'REVIEW_REQUIRED'));
      
      failedTxs.forEach((t: any) => {
        warningList.push({
          id: t.id,
          parcelId: t.parcel_id,
          khasraNumber: t.khasra_number,
          type: t.status === 'REJECTED' ? 'REJECTION' : 'WARNING',
          details: `Transaction ${t.id} seller ${t.seller_raw} share transfer of ${t.share_percentage}% triggers conflict resolution.`
        });
      });

      setStats({
        totalParcels: parcels.length,
        activeDisputes: disputesCount,
        pendingReviews: pendingTxs.length,
        warnings: warningList
      });
      setLoading(false);
    } catch (e) {
      console.error(e);
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="animate-spin text-slate-400 mr-2" />
        <span className="text-slate-500 font-semibold">Loading system telemetry...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-800">Operational Dashboard</h2>
        <p className="text-sm text-slate-500">Real-time status overview of Ownership-State Ledger catalog</p>
      </div>

      {/* METRIC CARD ROW */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-400 block uppercase tracking-wider mb-1">
              Registered Parcels
            </span>
            <span className="text-3xl font-bold text-slate-800">{stats.totalParcels}</span>
          </div>
          <span className="p-3 bg-blue-50 text-blue-600 rounded-lg text-xl">🗺️</span>
        </div>

        <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-400 block uppercase tracking-wider mb-1">
              Under Officer Review
            </span>
            <span className="text-3xl font-bold text-slate-800">{stats.pendingReviews}</span>
          </div>
          <span className="p-3 bg-amber-50 text-amber-600 rounded-lg text-xl">⏳</span>
        </div>

        <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-400 block uppercase tracking-wider mb-1">
              Active Disputes
            </span>
            <span className="text-3xl font-bold text-red-600">{stats.activeDisputes}</span>
          </div>
          <span className="p-3 bg-red-50 text-red-600 rounded-lg text-xl">⚠️</span>
        </div>

        <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-400 block uppercase tracking-wider mb-1">
              Ledger Integrity
            </span>
            <span className="text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded block mt-1.5 w-max">
              ✓ Chain Secure
            </span>
          </div>
          <span className="p-3 bg-emerald-50 text-emerald-600 rounded-lg text-xl">🔐</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* RECENT ALERTS */}
        <div className="bg-white border border-slate-200 rounded-lg shadow-sm lg:col-span-2 overflow-hidden flex flex-col">
          <div className="bg-slate-50 border-b border-slate-200 px-6 py-4">
            <h3 className="font-bold text-slate-700 flex items-center gap-2">
              <AlertTriangle className="text-amber-500" size={18} />
              <span>Inconsistencies & Flags Detected</span>
            </h3>
          </div>
          <div className="p-6 flex-1 space-y-4">
            {stats.warnings.length === 0 ? (
              <div className="text-slate-400 text-sm text-center py-8">
                ✓ No active contradictions or verification warnings in the queue.
              </div>
            ) : (
              stats.warnings.map((warn: any) => (
                <div key={warn.id} className="p-4 bg-amber-50 border border-amber-200 rounded flex gap-3 text-xs text-amber-800">
                  <ShieldAlert className="text-amber-600 shrink-0 mt-0.5" size={16} />
                  <div className="space-y-1">
                    <span className="font-semibold block">
                      Conflict on Khasra {warn.khasraNumber} (Ref ID: {warn.id})
                    </span>
                    <p className="text-amber-700 leading-relaxed">{warn.details}</p>
                    <div className="pt-2 flex gap-3">
                      <button 
                        onClick={() => onNavigate('review')}
                        className="text-blue-700 hover:text-blue-900 font-bold flex items-center gap-1"
                      >
                        Go to review queue <CornerDownRight size={12} />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* DEMO INSTRUCTIONS BOX */}
        <div className="bg-slate-900 border border-slate-800 text-slate-300 rounded-lg shadow-sm p-6 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-white">
              <span className="text-lg">💡</span>
              <h3 className="font-bold text-sm uppercase tracking-wider">Demo Guidelines</h3>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Use this sandbox interface to test BhuSetu's core features:
            </p>
            <ol className="text-xs text-slate-400 space-y-2 list-decimal pl-4">
              <li>Go to <strong className="text-slate-300">Document Upload</strong>.</li>
              <li>Select the <strong className="text-slate-300">Case 2: Over-transfer Sale Deed</strong> template.</li>
              <li>Click "Analyze & Verify" to see the engine fail the transaction with a 20% share deficit.</li>
              <li>Navigate to <strong className="text-slate-300">Review Queue</strong>, reject the file, and check the update log in the <strong className="text-slate-300">Audit chain</strong>.</li>
            </ol>
          </div>
          
          <div className="mt-6 pt-4 border-t border-slate-800 text-[10px] text-slate-500 font-medium">
            * Note: All preloaded datasets represent "Synthetic Demonstration Data" for hackathon purposes.
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// SCREEN: DOCUMENT UPLOAD & CASE SELECTOR
// ============================================================================
function UploadScreen({ token, onNavigate, setRefreshTrigger }: any) {
  const [selectedCase, setSelectedCase] = useState('');
  const [fileName, setFileName] = useState('');
  const [fileContent, setFileContent] = useState('');
  const [uploadStatus, setUploadStatus] = useState<'IDLE' | 'ANALYZING' | 'SUCCESS' | 'ERROR'>('IDLE');
  
  // Results
  const [txId, setTxId] = useState('');
  const [extraction, setExtraction] = useState<any>(null);
  const [verification, setVerification] = useState<any>(null);

  // Template registry
  const cases = [
    { id: 'sale_deed_142_3_overtransfer.txt', label: 'Case 2 — Over-Transfer (A attempts 80% on 142/3 - Deficit: 20%)' },
    { id: 'sale_deed_142_3_valid.txt', label: 'Case 1 — Valid Share Transfer (A transfers 40% of 142/3 to C - PASS)' },
    { id: 'sale_deed_145_2_identity.txt', label: 'Case 3 — Name Variation Resolution (Ramesh K. sells 100% of 145/2)' },
    { id: 'sale_deed_146_1_contradict.txt', label: 'Case 4 — Doc Contradiction (Devendra transfers 80% on 146/1 vs 60% RoR)' },
    { id: 'sale_deed_147_4_backdated.txt', label: 'Case 5 — Temporal Anomaly (Backdated Deed on 147/4 dated 2019)' },
    { id: 'sale_deed_148_9_spatial.txt', label: 'Case 6 — Spatial GIS Discrepancy (148/9 Claimed: 2.40 Ac, GIS: 2.70 Ac)' },
    { id: 'sale_deed_149_1_dispute.txt', label: 'Case 7 — Court Dispute Hard Block (Active claim on Gopal Das\'s parcel)' },
    { id: 'sale_deed_150_5_clean.txt', label: 'Case 8 — Clean Registry Execution (All checks passed)' }
  ];

  // Map case templates to simulated file content for display
  const getCaseContent = (id: string) => {
    switch (id) {
      case 'sale_deed_142_3_overtransfer.txt':
        return `DEED OF SALE (DEED/2026/0142)
This sale deed executed on 2026-08-30 between:
TRANSFEROR (SELLER): Anand Verma, Khasra owner.
TRANSFEREE (BUYER): Chandra Kumar, resident of Delhi.
PROPERTY DESCRIPTION: Khasra Plot No: 142/3. Total registered area 2.40 Acres.
TERMS OF TRANSFER: The seller Anand Verma hereby sells and transfers an undivided eighty percent (80.0%) share of Khasra parcel 142/3 to Chandra Kumar.`;
      
      case 'sale_deed_142_3_valid.txt':
        return `DEED OF SALE (DEED/2026/0143)
This sale deed executed on 2026-08-30 between:
TRANSFEROR (SELLER): Anand Verma, Khasra owner.
TRANSFEREE (BUYER): Chandra Kumar.
PROPERTY DESCRIPTION: Khasra Plot No: 142/3. Registered area 2.40 Acres.
TERMS OF TRANSFER: The seller Anand Verma hereby sells and transfers an undivided forty percent (40.0%) share of Khasra parcel 142/3 to Chandra Kumar.`;
      
      case 'sale_deed_145_2_identity.txt':
        return `DEED OF SALE (DEED/2026/0145)
This sale deed executed on 2026-08-30:
TRANSFEROR: Ramesh K.
TRANSFEREE: Chandra Kumar.
PROPERTY DESCRIPTION: Khasra Plot No: 145/2. Area 2.40 Acres.
TERMS OF TRANSFER: The seller Ramesh K. transfers one hundred percent (100.0%) share of Khasra parcel 145/2 to Chandra Kumar.`;

      case 'sale_deed_146_1_contradict.txt':
        return `DEED OF SALE (DEED/2026/0146)
TRANSFEROR: Devendra Prasad.
TRANSFEREE: Esha Gupta.
PROPERTY DESCRIPTION: Khasra Plot No: 146/1. Area 2.40 Acres.
TERMS OF TRANSFER: Devendra Prasad sells eighty percent (80.0%) share of Khasra parcel 146/1.`;

      case 'sale_deed_147_4_backdated.txt':
        return `DEED OF SALE (DEED/2026/0147)
This sale deed is signed on 2019-05-10:
TRANSFEROR: Firoz Khan.
TRANSFEREE: Chandra Kumar.
PROPERTY DESCRIPTION: Khasra Plot No: 147/4. Area 2.40 Acres.
TERMS OF TRANSFER: Transfer of one hundred percent (100.0%) share.`;

      case 'sale_deed_148_9_spatial.txt':
        return `DEED OF SALE (DEED/2026/0148)
TRANSFEROR: Anand Verma.
TRANSFEREE: Chandra Kumar.
PROPERTY DESCRIPTION: Khasra Plot No: 148/9. Claimed area 2.40 Acres.
TERMS OF TRANSFER: Transfer of one hundred percent (100.0%) share.`;

      case 'sale_deed_149_1_dispute.txt':
        return `DEED OF SALE (DEED/2026/0149)
TRANSFEROR: Gopal Das.
TRANSFEREE: Chandra Kumar.
PROPERTY DESCRIPTION: Khasra Plot No: 149/1. Area 2.40 Acres.
TERMS OF TRANSFER: Transfer of one hundred percent (100.0%) share.`;

      case 'sale_deed_150_5_clean.txt':
        return `DEED OF SALE (DEED/2026/0150)
TRANSFEROR: Hari Prasad.
TRANSFEREE: Chandra Kumar.
PROPERTY DESCRIPTION: Khasra Plot No: 150/5. Area 2.40 Acres.
TERMS OF TRANSFER: Transfer of one hundred percent (100.0%) share.`;

      default:
        return '';
    }
  };

  const handleSelectCase = (caseId: string) => {
    setSelectedCase(caseId);
    setFileName(caseId);
    setFileContent(getCaseContent(caseId));
    // Clear previous results
    setUploadStatus('IDLE');
    setExtraction(null);
    setVerification(null);
  };

  const triggerVerification = async () => {
    if (!fileName || !fileContent) return;

    setUploadStatus('ANALYZING');
    try {
      const res = await fetch('/api/transactions/propose', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({ fileName, fileContent })
      });
      
      const data = await res.json();
      if (res.ok) {
        setTxId(data.transactionId);
        setExtraction(data.extraction);
        setVerification(data.verification);
        setUploadStatus('SUCCESS');
        setRefreshTrigger((prev: number) => prev + 1);
      } else {
        setUploadStatus('ERROR');
        alert(data.error || 'Verification processing failed.');
      }
    } catch (e) {
      setUploadStatus('ERROR');
      alert('Backend server connection error.');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-800">Document Upload & Analysis</h2>
        <p className="text-sm text-slate-500">Upload transaction records or select synthetic demonstration cases</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* CASE SELECTION & UPLOAD INPUT */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm space-y-4">
            <h3 className="font-bold text-sm text-slate-700 uppercase tracking-wider">
              1. Select Demonstration Scenario
            </h3>
            
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-500">Template Presets</label>
              <select
                value={selectedCase}
                onChange={(e) => handleSelectCase(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded p-2 text-xs font-medium focus:outline-none focus:border-blue-500"
              >
                <option value="">-- Choose Preset Case --</option>
                {cases.map((c) => (
                  <option key={c.id} value={c.id}>{c.label}</option>
                ))}
              </select>
            </div>

            <div className="pt-2">
              <span className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider block mb-1">
                Selected Filename
              </span>
              <input
                type="text"
                disabled
                value={fileName || 'No file selected'}
                className="w-full bg-slate-100 border border-slate-200 rounded px-3 py-1.5 text-xs text-slate-600 font-mono focus:outline-none"
              />
            </div>

            <button
              onClick={triggerVerification}
              disabled={!fileName || uploadStatus === 'ANALYZING'}
              className="w-full flex items-center justify-center gap-2 py-2 px-4 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-200 disabled:text-slate-400 text-white text-sm font-semibold rounded shadow transition-colors"
            >
              {uploadStatus === 'ANALYZING' ? (
                <>
                  <RefreshCw className="animate-spin" size={16} />
                  <span>Processing Extraction...</span>
                </>
              ) : (
                <>
                  <FileText size={16} />
                  <span>Analyze & Run Verification</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* FILE DISPLAY / OCR CONTAINER */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white border border-slate-200 rounded-lg shadow-sm flex flex-col h-[320px] overflow-hidden">
            <div className="bg-slate-50 border-b border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 flex justify-between items-center">
              <span>📄 DOCUMENT RAW CONTENT VIEW</span>
              <span className="text-[10px] text-blue-600 bg-blue-50 border border-blue-100 px-1.5 py-0.5 rounded font-bold uppercase">
                Synthetic Demonstration Data
              </span>
            </div>
            
            <textarea
              value={fileContent}
              onChange={(e) => setFileContent(e.target.value)}
              placeholder="Select a scenario template or paste a document content here to run OCR simulation..."
              className="flex-1 p-4 font-mono text-xs text-slate-700 bg-slate-950 text-slate-300 resize-none focus:outline-none leading-relaxed"
            />
          </div>
        </div>
      </div>

      {/* VERIFICATION REPORT PANEL */}
      {uploadStatus === 'SUCCESS' && verification && (
        <div className="border border-slate-200 rounded-lg overflow-hidden bg-white shadow-sm transition-all duration-300">
          <div className="bg-slate-50 border-b border-slate-200 px-6 py-4 flex justify-between items-center">
            <div>
              <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2">
                <span>📊</span> Verification Analysis Report
              </h3>
              <span className="text-xs text-slate-400 font-mono">Proposed Transaction Reference: {txId}</span>
            </div>

            <div className="flex items-center gap-3">
              {verification.status === 'VERIFIED' ? (
                <span className="px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold rounded text-xs flex items-center gap-1.5">
                  <CheckCircle size={16} /> VERIFIED / CLEAR
                </span>
              ) : (
                <span className="px-3 py-1 bg-red-50 text-red-700 border border-red-200 font-bold rounded text-xs flex items-center gap-1.5">
                  <ShieldAlert size={16} /> REVIEW REQUIRED
                </span>
              )}
            </div>
          </div>

          <div className="p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* GRID OF CHECKS */}
            <div className="lg:col-span-1 space-y-4">
              <h4 className="font-bold text-xs uppercase tracking-wider text-slate-400">
                Evaluation Indicators
              </h4>
              
              <div className="space-y-2">
                {/* 1. Identity */}
                <div className="p-3 border border-slate-100 rounded flex justify-between items-center text-xs">
                  <span className="font-semibold text-slate-600">Identity Matching</span>
                  <StatusBadge status={verification.identity_status === 'PASSED' ? 'PASSED' : (verification.identity_status === 'AMBIGUOUS' ? 'AMBIGUOUS' : 'FAILED')} label={verification.identity_status} />
                </div>
                {/* 2. Share Conservation */}
                <div className="p-3 border border-slate-100 rounded flex justify-between items-center text-xs">
                  <span className="font-semibold text-slate-600">Ownership Share Check</span>
                  <StatusBadge status={verification.ownership_status} />
                </div>
                {/* 3. Document Consistency */}
                <div className="p-3 border border-slate-100 rounded flex justify-between items-center text-xs">
                  <span className="font-semibold text-slate-600">Cross-Document Match</span>
                  <StatusBadge status={verification.document_status} />
                </div>
                {/* 4. Temporal check */}
                <div className="p-3 border border-slate-100 rounded flex justify-between items-center text-xs">
                  <span className="font-semibold text-slate-600">Temporal Chronology</span>
                  <StatusBadge status={verification.temporal_status} />
                </div>
                {/* 5. Spatial check */}
                <div className="p-3 border border-slate-100 rounded flex justify-between items-center text-xs">
                  <span className="font-semibold text-slate-600">GIS Geometry Tolerance</span>
                  <StatusBadge status={verification.spatial_status} />
                </div>
                {/* 6. Disputes check */}
                <div className="p-3 border border-slate-100 rounded flex justify-between items-center text-xs">
                  <span className="font-semibold text-slate-600">Active Dispute check</span>
                  <StatusBadge status={verification.dispute_status === 'CLEAR' ? 'PASSED' : 'FAILED'} label={verification.dispute_status === 'CLEAR' ? 'CLEAR' : 'DISPUTED'} />
                </div>
              </div>
            </div>

            {/* DECISION SUMMARY & EXPLANATIONS */}
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-5">
                <h4 className="font-bold text-xs uppercase tracking-wider text-slate-500 mb-3">
                  Disposition Explanations & Evidence
                </h4>
                
                <div className="space-y-4 text-xs">
                  <div>
                    <span className="font-bold text-slate-700 block mb-0.5">Core Verdict:</span>
                    <p className="text-slate-600 bg-white border border-slate-100 rounded p-2 text-xs leading-relaxed">
                      {verification.status === 'VERIFIED' 
                        ? 'All automated checks pass spatial, identity, and database constraints. Transaction is clear to proceed for final human approval.'
                        : 'Validation constraints failed or flagged review. Handing off case details to human reviewer console.'}
                    </p>
                  </div>

                  {/* Dynamic failed explanations */}
                  {verification.ownership_status === 'FAILED' && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded text-red-800">
                      <span className="font-bold block mb-1">❌ Ownership Share Deficit</span>
                      <p>{verification.ownership_reason}</p>
                    </div>
                  )}

                  {verification.identity_status === 'AMBIGUOUS' && (
                    <div className="p-3 bg-amber-50 border border-amber-200 rounded text-amber-800">
                      <span className="font-bold block mb-1">⚠️ Identity Ambiguity Flag</span>
                      <p>{verification.identity_reason}</p>
                    </div>
                  )}

                  {verification.document_status === 'FAILED' && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded text-red-800">
                      <span className="font-bold block mb-1">❌ Cross-Source Inconsistency</span>
                      <p>{verification.document_reason}</p>
                    </div>
                  )}

                  {verification.temporal_status === 'FAILED' && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded text-red-800">
                      <span className="font-bold block mb-1">❌ Chronological Anomaly</span>
                      <p>{verification.temporal_reason}</p>
                    </div>
                  )}

                  {verification.spatial_status === 'REVIEW_REQUIRED' && (
                    <div className="p-3 bg-amber-50 border border-amber-200 rounded text-amber-800">
                      <span className="font-bold block mb-1">⚠️ GIS Area Mismatch warning</span>
                      <p>{verification.spatial_reason}</p>
                    </div>
                  )}

                  {verification.dispute_status === 'FAILED' && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded text-red-800">
                      <span className="font-bold block mb-1">🚨 Dispute Hard Block</span>
                      <p>{verification.dispute_reason}</p>
                    </div>
                  )}

                  {/* Default Pass message */}
                  {verification.status === 'VERIFIED' && (
                    <div className="p-3 bg-emerald-50 border border-emerald-200 rounded text-emerald-800">
                      <span className="font-bold block mb-1">✓ Complete Evidence Alignment</span>
                      <p>Ownership share checks passed, identity resolved with high confidence, spatial boundaries match, and no disputes are active on the parcel ledger.</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Navigation button shortcut */}
              <div className="flex justify-end gap-3 pt-2">
                <button
                  onClick={() => onNavigate('review')}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded text-xs font-semibold shadow flex items-center gap-1.5 transition-colors"
                >
                  <FileCheck size={14} /> Go to Review Queue Console
                </button>
              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}

// Status badge component helper
function StatusBadge({ status, label }: { status: string; label?: string }) {
  if (status === 'PASSED' || status === 'CLEAR') {
    return (
      <span className="px-2 py-0.5 font-semibold text-[10px] text-emerald-700 bg-emerald-50 border border-emerald-200 rounded uppercase">
        {label || 'Passed'}
      </span>
    );
  }
  if (status === 'FAILED') {
    return (
      <span className="px-2 py-0.5 font-semibold text-[10px] text-red-700 bg-red-50 border border-red-200 rounded uppercase">
        {label || 'Failed'}
      </span>
    );
  }
  if (status === 'AMBIGUOUS' || status === 'REVIEW_REQUIRED') {
    return (
      <span className="px-2 py-0.5 font-semibold text-[10px] text-amber-700 bg-amber-50 border border-amber-200 rounded uppercase">
        {label || 'Review'}
      </span>
    );
  }
  return null;
}

// ============================================================================
// SCREEN: REGISTRY parcel SEARCH & HISTORY TIMELINE
// ============================================================================
function RegistryScreen({ token, refreshTrigger }: any) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedParcel, setSelectedParcel] = useState<any>(null);
  const [parcels, setParcels] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchParcels();
  }, [refreshTrigger]);

  const fetchParcels = async () => {
    try {
      const res = await fetch('/api/parcels', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      setParcels(data);
      setLoading(false);
    } catch (e) {
      console.error(e);
      setLoading(false);
    }
  };

  const selectParcel = async (id: string) => {
    try {
      const res = await fetch(`/api/parcels/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      setSelectedParcel(data);
    } catch (e) {
      alert("Error loading parcel details.");
    }
  };

  // Filter parcels on search input
  const filteredParcels = parcels.filter((p) => 
    p.khasra_number.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Land Parcel Registry Catalog</h2>
          <p className="text-sm text-slate-500">Query and trace the chronological ownership timeline for parcels</p>
        </div>

        {/* Search bar */}
        <div className="relative">
          <input
            type="text"
            placeholder="Search Khasra (e.g. 142/3)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8 pr-4 py-1.5 border border-slate-200 rounded text-xs w-60 bg-white focus:outline-none focus:border-blue-500"
          />
          <Search className="absolute left-2.5 top-2.5 text-slate-400" size={14} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* PARCEL SELECTION LIST */}
        <div className="lg:col-span-1 bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden flex flex-col h-[520px]">
          <div className="bg-slate-50 border-b border-slate-200 px-4 py-3 shrink-0">
            <h3 className="font-bold text-xs uppercase tracking-wider text-slate-500">
              Land Records Catalog
            </h3>
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
            {loading ? (
              <div className="p-4 text-xs text-slate-400 text-center flex items-center justify-center gap-2">
                <RefreshCw className="animate-spin" size={14} /> Loading registry...
              </div>
            ) : filteredParcels.length === 0 ? (
              <div className="p-4 text-xs text-slate-400 text-center">No parcels match query.</div>
            ) : (
              filteredParcels.map((p) => (
                <button
                  key={p.id}
                  onClick={() => selectParcel(p.id)}
                  className={`w-full text-left p-4 hover:bg-slate-50 transition-colors flex items-center justify-between ${
                    selectedParcel?.parcel?.id === p.id ? 'bg-slate-100 font-semibold' : ''
                  }`}
                >
                  <div className="space-y-1">
                    <span className="text-xs font-bold text-slate-800 block">Khasra Plot {p.khasra_number}</span>
                    <span className="text-[10px] text-slate-400 font-mono block">ID: {p.id}</span>
                    <span className="text-[10px] text-slate-500 block">Area: {p.claimed_area_acres.toFixed(2)} Ac</span>
                  </div>

                  <div className="flex flex-col items-end gap-1">
                    {p.status === 'DISPUTED' ? (
                      <span className="px-1.5 py-0.5 rounded text-[8px] font-bold bg-red-50 text-red-700 border border-red-200">
                        🚨 COURT BLOCK
                      </span>
                    ) : (p.status === 'REVIEW_REQUIRED' ? (
                      <span className="px-1.5 py-0.5 rounded text-[8px] font-bold bg-amber-50 text-amber-700 border border-amber-200 animate-pulse">
                        ⚠️ REVIEW REQ
                      </span>
                    ) : (
                      <span className="px-1.5 py-0.5 rounded text-[8px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        ✓ SECURE
                      </span>
                    ))}
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* PARCEL HISTORY & DETAIL VISUALIZATION */}
        <div className="lg:col-span-2 space-y-6">
          {selectedParcel ? (
            <div className="space-y-6">
              
              {/* LEDGER DETAILS */}
              <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-sm grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider block">Parcel Identity</span>
                    <h3 className="text-xl font-bold text-slate-800">Khasra Plot No. {selectedParcel.parcel.khasra_number}</h3>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-xs">
                    <div>
                      <span className="text-slate-400 block font-semibold mb-0.5">Claimed Area</span>
                      <span className="text-slate-700 font-bold">{selectedParcel.parcel.claimed_area_acres.toFixed(2)} Acres</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block font-semibold mb-0.5">GIS Calculated</span>
                      <span className="text-slate-700 font-bold">{selectedParcel.parcel.calculated_area_acres.toFixed(2)} Acres</span>
                    </div>
                  </div>

                  {/* ACTIVE OWNERS */}
                  <div className="pt-2 border-t border-slate-100">
                    <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider block mb-2">Reconstructed Owner Shares</span>
                    <div className="space-y-1.5">
                      {selectedParcel.currentOwners.map((owner: any) => (
                        <div key={owner.person_id} className="text-xs flex items-center justify-between p-2 bg-slate-50 border border-slate-150 rounded">
                          <span className="font-semibold text-slate-700 flex items-center gap-1.5">
                            👤 {owner.name} <span className="text-[9px] font-mono text-slate-400">({owner.person_id})</span>
                          </span>
                          <span className="font-bold text-blue-700">{owner.share_percentage}%</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* GIS MAP CONTAINER */}
                <div className="h-64 rounded overflow-hidden">
                  <ParcelMap 
                    geojson={selectedParcel.parcel.geojson_geometry}
                    claimedArea={selectedParcel.parcel.claimed_area_acres}
                    calculatedArea={selectedParcel.parcel.calculated_area_acres}
                    khasraNumber={selectedParcel.parcel.khasra_number}
                  />
                </div>
              </div>

              {/* LITIGATION & DISPUTES */}
              {selectedParcel.disputes.length > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-5 text-xs text-red-800">
                  <h4 className="font-bold text-red-700 flex items-center gap-1 mb-2">
                    <ShieldAlert size={14} /> ACTIVE ENCUMBRANCES / LITIGATION RECORDS DETECTED
                  </h4>
                  <ul className="space-y-2 list-disc pl-4">
                    {selectedParcel.disputes.map((d: any) => (
                      <li key={d.id} className="leading-relaxed">
                        <strong className="text-red-950 font-bold">Dispute Ref: {d.id}</strong> (Filed: {d.filed_at.split(' ')[0]}) - {d.description}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* TIMELINE HISTORICAL CHRONOLOGY */}
              <div className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden flex flex-col">
                <div className="bg-slate-50 border-b border-slate-200 px-6 py-4 flex justify-between items-center">
                  <h3 className="font-bold text-slate-700 text-xs uppercase tracking-wider flex items-center gap-2">
                    <History size={16} /> 2. Traceability Layer: Chronological Ownership Event History
                  </h3>
                </div>

                <div className="p-6 relative">
                  {/* Vertical Timeline bar */}
                  <div className="absolute left-9 top-6 bottom-6 w-0.5 bg-slate-200" />

                  <div className="space-y-6">
                    {selectedParcel.history.map((event: any, idx: number) => (
                      <div key={event.event_id} className="flex gap-4 relative z-10">
                        {/* Event icon indicator */}
                        <div className={`w-6 h-6 rounded-full shrink-0 flex items-center justify-center text-xs font-bold ${
                          event.event_type === 'INITIAL' 
                            ? 'bg-blue-500 text-white' 
                            : 'bg-emerald-500 text-white'
                        }`}>
                          {idx + 1}
                        </div>

                        {/* Event text card */}
                        <div className="flex-1 bg-slate-50 border border-slate-200 rounded p-4 text-xs space-y-2">
                          <div className="flex justify-between items-start">
                            <div>
                              <span className="px-1.5 py-0.5 rounded text-[8px] font-bold uppercase bg-slate-200 text-slate-600 block w-max mb-1">
                                {event.event_type}
                              </span>
                              <span className="font-bold text-slate-700 block">
                                {event.event_type === 'INITIAL' 
                                  ? `Initial Ownership Allocation: ${event.buyer_name}` 
                                  : `Transaction deed: ${event.seller_name} ➔ ${event.buyer_name}`}
                              </span>
                            </div>
                            <span className="text-[10px] font-semibold text-slate-400 font-mono">
                              Date: {event.effective_date}
                            </span>
                          </div>

                          <div className="grid grid-cols-2 gap-4 pt-2 border-t border-slate-100 text-[11px] text-slate-600 leading-normal">
                            <div>
                              <span className="block font-semibold">Share Transfer:</span>
                              <span className="font-semibold text-slate-800">{event.share_percentage}%</span>
                            </div>
                            <div>
                              <span className="block font-semibold">Supporting Document:</span>
                              <span className="font-mono text-blue-700 underline font-semibold cursor-pointer">
                                {event.doc_ref} ({event.doc_type})
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

            </div>
          ) : (
            <div className="bg-slate-100 rounded-lg border-2 border-dashed border-slate-200 h-[380px] flex flex-col items-center justify-center text-slate-400">
              <span className="text-4xl mb-2">🔎</span>
              <p className="text-sm font-semibold">Select a land parcel Khasra from the registry</p>
              <p className="text-xs text-slate-400 mt-1">Details, ownership timeline, and map visualisations will appear here.</p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}

// ============================================================================
// SCREEN: HUMAN REVIEW QUEUE CONSOLE
// ============================================================================
function ReviewScreen({ token, user, refreshTrigger, setRefreshTrigger }: any) {
  const [queue, setQueue] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTx, setSelectedTx] = useState<any>(null);
  
  // Officer input states
  const [reviewComments, setReviewComments] = useState('');
  const [processingAction, setProcessingAction] = useState(false);

  useEffect(() => {
    fetchReviewQueue();
  }, [refreshTrigger]);

  const fetchReviewQueue = async () => {
    try {
      const res = await fetch('/api/transactions', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      // Only show PENDING transactions in review queue
      const pending = data.filter((t: any) => t.status === 'PENDING');
      setQueue(pending);
      setLoading(false);
    } catch (e) {
      console.error(e);
      setLoading(false);
    }
  };

  const loadTransactionDetails = async (id: string) => {
    try {
      const res = await fetch(`/api/transactions/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      setSelectedTx(data);
      setReviewComments('');
    } catch (e) {
      alert("Error loading transaction files.");
    }
  };

  const handleReviewAction = async (action: 'APPROVED' | 'REJECTED') => {
    if (!selectedTx) return;

    setProcessingAction(true);
    try {
      const res = await fetch(`/api/transactions/${selectedTx.transaction.id}/review`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ action, comments: reviewComments })
      });
      
      const data = await res.json();
      if (res.ok) {
        alert(`Transaction ${action === 'APPROVED' ? 'Approved' : 'Rejected'} successfully. Action committed to audit chain.`);
        setSelectedTx(null);
        setRefreshTrigger((prev: number) => prev + 1);
      } else {
        alert(data.error || 'Failed to submit review decision.');
      }
      setProcessingAction(false);
    } catch (e) {
      setProcessingAction(false);
      alert('Backend server connection error.');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-800">Officer Verification Review Console</h2>
        <p className="text-sm text-slate-500 font-semibold text-blue-700 uppercase tracking-wider mt-1">
          🔐 Authenticated: {user.name} ({user.role})
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* LIST OF PENDING ITEMS */}
        <div className="lg:col-span-1 bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden flex flex-col h-[520px]">
          <div className="bg-slate-50 border-b border-slate-200 px-4 py-3 shrink-0">
            <h3 className="font-bold text-xs uppercase tracking-wider text-slate-500">
              Pending Transactions Queue ({queue.length})
            </h3>
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
            {loading ? (
              <div className="p-4 text-xs text-slate-400 text-center">Loading queue...</div>
            ) : queue.length === 0 ? (
              <div className="p-8 text-slate-400 text-xs text-center">
                ✓ Review queue is clear. No transactions pending validation.
              </div>
            ) : (
              queue.map((tx) => (
                <button
                  key={tx.id}
                  onClick={() => loadTransactionDetails(tx.id)}
                  className={`w-full text-left p-4 hover:bg-slate-50 transition-colors flex items-center justify-between ${
                    selectedTx?.transaction?.id === tx.id ? 'bg-slate-100 font-semibold' : ''
                  }`}
                >
                  <div className="space-y-1">
                    <span className="text-xs font-bold text-slate-800 block">Khasra Plot {tx.khasra_number}</span>
                    <span className="text-[10px] text-slate-400 font-mono block">Tx ID: {tx.id}</span>
                    <span className="text-[10px] text-slate-500 block">Proposed Transfer: {tx.share_percentage}%</span>
                  </div>

                  <span className="px-1.5 py-0.5 rounded text-[8px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                    PENDING REVIEW
                  </span>
                </button>
              ))
            )}
          </div>
        </div>

        {/* DECISION WIDGET DETAILS */}
        <div className="lg:col-span-2 space-y-6">
          {selectedTx ? (
            <div className="space-y-6">
              
              {/* DETAILS SUMMARY */}
              <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-sm grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider block">Proposed Action details</span>
                    <h3 className="text-lg font-bold text-slate-800">Transaction Registry Proposal</h3>
                  </div>

                  <div className="text-xs space-y-2">
                    <div className="flex justify-between border-b border-slate-100 py-1.5">
                      <span className="text-slate-400 font-semibold">Khasra Parcel:</span>
                      <span className="text-slate-700 font-bold">Plot {selectedTx.transaction.khasra_number}</span>
                    </div>
                    <div className="flex justify-between border-b border-slate-100 py-1.5">
                      <span className="text-slate-400 font-semibold">Seller:</span>
                      <span className="text-slate-700 font-bold">{selectedTx.transaction.seller_raw}</span>
                    </div>
                    <div className="flex justify-between border-b border-slate-100 py-1.5">
                      <span className="text-slate-400 font-semibold">Buyer:</span>
                      <span className="text-slate-700 font-bold">{selectedTx.transaction.buyer_raw}</span>
                    </div>
                    <div className="flex justify-between border-b border-slate-100 py-1.5">
                      <span className="text-slate-400 font-semibold">Proposed Share:</span>
                      <span className="text-blue-700 font-bold">{selectedTx.transaction.share_percentage}%</span>
                    </div>
                    <div className="flex justify-between border-b border-slate-100 py-1.5">
                      <span className="text-slate-400 font-semibold">Document Reference:</span>
                      <span className="text-slate-700 font-mono font-semibold">{selectedTx.document.doc_ref}</span>
                    </div>
                  </div>
                </div>

                {/* GEOMETRY BOUNDARY CHECK */}
                <div className="h-56 rounded overflow-hidden">
                  <ParcelMap 
                    geojson={selectedTx.transaction.geojson_geometry}
                    claimedArea={selectedTx.transaction.claimed_area_acres}
                    calculatedArea={selectedTx.transaction.calculated_area_acres}
                    khasraNumber={selectedTx.transaction.khasra_number}
                  />
                </div>
              </div>

              {/* DETAILED VERIFICATION REPORT */}
              <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-sm space-y-4">
                <h4 className="font-bold text-xs uppercase tracking-wider text-slate-400">
                  Verification Audit Indicators
                </h4>

                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-xs">
                  <div className="p-3 border border-slate-100 rounded flex flex-col justify-between gap-2">
                    <span className="font-semibold text-slate-500">Identity Match</span>
                    <StatusBadge status={selectedTx.verification.identity_status === 'PASSED' ? 'PASSED' : (selectedTx.verification.identity_status === 'AMBIGUOUS' ? 'AMBIGUOUS' : 'FAILED')} label={selectedTx.verification.identity_status} />
                  </div>
                  <div className="p-3 border border-slate-100 rounded flex flex-col justify-between gap-2">
                    <span className="font-semibold text-slate-500">Share Conservation</span>
                    <StatusBadge status={selectedTx.verification.ownership_status} />
                  </div>
                  <div className="p-3 border border-slate-100 rounded flex flex-col justify-between gap-2">
                    <span className="font-semibold text-slate-500">Document Consistency</span>
                    <StatusBadge status={selectedTx.verification.document_status} />
                  </div>
                  <div className="p-3 border border-slate-100 rounded flex flex-col justify-between gap-2">
                    <span className="font-semibold text-slate-500">Temporal Chronology</span>
                    <StatusBadge status={selectedTx.verification.temporal_status} />
                  </div>
                  <div className="p-3 border border-slate-100 rounded flex flex-col justify-between gap-2">
                    <span className="font-semibold text-slate-500">Spatial Geometry</span>
                    <StatusBadge status={selectedTx.verification.spatial_status} />
                  </div>
                  <div className="p-3 border border-slate-100 rounded flex flex-col justify-between gap-2">
                    <span className="font-semibold text-slate-500">Disputes Block</span>
                    <StatusBadge status={selectedTx.verification.dispute_status === 'CLEAR' ? 'PASSED' : 'FAILED'} label={selectedTx.verification.dispute_status === 'CLEAR' ? 'CLEAR' : 'DISPUTED'} />
                  </div>
                </div>

                <div className="bg-slate-50 p-4 border border-slate-150 rounded text-xs space-y-3">
                  <span className="font-bold text-slate-700 block border-b border-slate-200 pb-1">Automated System Explanations</span>
                  
                  {/* Render failed metrics explanations dynamically */}
                  {selectedTx.verification.ownership_status === 'FAILED' && (
                    <p className="text-red-700 leading-relaxed font-medium">
                      ⚠️ {selectedTx.verification.ownership_reason}
                    </p>
                  )}
                  {selectedTx.verification.identity_status === 'AMBIGUOUS' && (
                    <p className="text-amber-700 leading-relaxed font-medium">
                      ⚠️ {selectedTx.verification.identity_reason}
                    </p>
                  )}
                  {selectedTx.verification.document_status === 'FAILED' && (
                    <p className="text-red-700 leading-relaxed font-medium">
                      ⚠️ {selectedTx.verification.document_reason}
                    </p>
                  )}
                  {selectedTx.verification.temporal_status === 'FAILED' && (
                    <p className="text-red-700 leading-relaxed font-medium">
                      ⚠️ {selectedTx.verification.temporal_reason}
                    </p>
                  )}
                  {selectedTx.verification.spatial_status === 'REVIEW_REQUIRED' && (
                    <p className="text-amber-700 leading-relaxed font-medium">
                      ⚠️ {selectedTx.verification.spatial_reason}
                    </p>
                  )}
                  {selectedTx.verification.dispute_status === 'FAILED' && (
                    <p className="text-red-700 leading-relaxed font-bold">
                      🚨 {selectedTx.verification.dispute_reason}
                    </p>
                  )}
                  
                  {selectedTx.verification.status === 'VERIFIED' && (
                    <p className="text-emerald-700 leading-relaxed font-medium">
                      ✓ All automated tests are aligned. This transaction conforms fully to the historical ownership state ledger.
                    </p>
                  )}
                </div>
              </div>

              {/* ACTION DIALOGUE CONTAINER */}
              <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-sm space-y-4">
                <h4 className="font-bold text-xs uppercase tracking-wider text-slate-600 block">
                  3. Submit Review Decision
                </h4>

                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-500">Review Comments & Decision Context</label>
                  <textarea
                    rows={3}
                    placeholder="Enter context, reasoning, or clarification request notes here..."
                    value={reviewComments}
                    onChange={(e) => setReviewComments(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded p-3 text-xs resize-none focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-2">
                  <button
                    onClick={() => handleReviewAction('REJECTED')}
                    disabled={processingAction}
                    className="px-4 py-2 border border-red-300 text-red-700 hover:bg-red-50 text-xs font-semibold rounded shadow-sm transition-colors"
                  >
                    Reject Transaction
                  </button>
                  
                  <button
                    onClick={() => handleReviewAction('APPROVED')}
                    disabled={processingAction || selectedTx.verification.dispute_status !== 'CLEAR'}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed text-white text-xs font-semibold rounded shadow transition-colors"
                  >
                    Approve & Commit Ledger
                  </button>
                </div>
              </div>

            </div>
          ) : (
            <div className="bg-slate-100 rounded-lg border-2 border-dashed border-slate-200 h-[380px] flex flex-col items-center justify-center text-slate-400">
              <span className="text-4xl mb-2">📋</span>
              <p className="text-sm font-semibold">Select a proposed transaction from the queue list</p>
              <p className="text-xs text-slate-400 mt-1">Review indicators, extraction logs, and geometries to take final action.</p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}

// ============================================================================
// SCREEN: TAMPER-EVIDENT AUDIT chain
// ============================================================================
function AuditScreen({ token, user, refreshTrigger, setRefreshTrigger }: any) {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Verification states
  const [verificationResult, setVerificationResult] = useState<any>(null);
  const [verifying, setVerifying] = useState(false);

  useEffect(() => {
    fetchLogs();
  }, [refreshTrigger]);

  const fetchLogs = async () => {
    try {
      const res = await fetch('/api/audit/logs', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      setLogs(data);
      setLoading(false);
    } catch (e) {
      console.error(e);
      setLoading(false);
    }
  };

  const runIntegrityVerification = async () => {
    setVerifying(true);
    setVerificationResult(null);
    try {
      const res = await fetch('/api/audit/verify', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      setVerificationResult(data);
      setVerifying(false);
    } catch (e) {
      setVerifying(false);
      alert('Error running integrity verification.');
    }
  };

  const simulateTampering = async (id: number) => {
    if (user.role === 'VIEWER') {
      alert("Forbidden: Public viewer does not have DB edit permissions.");
      return;
    }

    const alteredStr = prompt("Simulate direct database hack. Enter new details for this log block:", "HACKED: Deleted over-transfer warnings.");
    if (!alteredStr) return;

    try {
      const res = await fetch('/api/audit/tamper', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ id, alteredDetails: alteredStr })
      });
      
      const data = await res.json();
      if (res.ok) {
        alert(data.message);
        setRefreshTrigger((prev: number) => prev + 1);
      } else {
        alert(data.error);
      }
    } catch (e) {
      alert('Error communicating with database.');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Tamper-Evident SHA-256 Audit Log</h2>
          <p className="text-sm text-slate-500">Recalculates sequential cryptographically-linked log chains to check database validity</p>
        </div>

        <button
          onClick={runIntegrityVerification}
          disabled={verifying}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-semibold shadow flex items-center gap-1.5 transition-colors"
        >
          {verifying ? <RefreshCw className="animate-spin" size={14} /> : <Database size={14} />}
          <span>Verify Audit Chain Integrity</span>
        </button>
      </div>

      {/* INTEGRITY RESULTS */}
      {verificationResult && (
        <div className="transition-all duration-300">
          {verificationResult.isValid ? (
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-800 flex gap-3 text-xs">
              <CheckCircle className="text-emerald-600 mt-0.5 shrink-0" size={18} />
              <div>
                <span className="font-bold block text-sm">✓ AUDIT LOG INTEGRITY VERIFIED</span>
                <p className="mt-1 font-medium text-emerald-700 leading-relaxed">
                  All hash chains recalculated sequentially. Every previous block hash matches current blocks. No database tampering or out-of-band modifications detected.
                </p>
              </div>
            </div>
          ) : (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-800 flex gap-3 text-xs animate-shake">
              <ShieldAlert className="text-red-600 mt-0.5 shrink-0" size={18} />
              <div>
                <span className="font-bold block text-sm">🚨 AUDIT INTEGRITY CHECK FAILED</span>
                <p className="mt-1 font-semibold text-red-700 leading-relaxed">
                  {verificationResult.reason}
                </p>
                <div className="mt-2 bg-red-950 text-red-400 font-mono rounded p-2 border border-red-900 w-max text-[10px]">
                  CRITICAL: TAMPERING DETECTED AT BLOCK ID: #{verificationResult.corruptedId}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* LOG BLOCKS GRID */}
      <div className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden flex flex-col">
        <div className="bg-slate-50 border-b border-slate-200 px-6 py-4">
          <h3 className="font-bold text-xs uppercase tracking-wider text-slate-500">
            Audit Ledger Blocks
          </h3>
        </div>

        <div className="divide-y divide-slate-100 overflow-x-auto">
          {loading ? (
            <div className="p-4 text-xs text-slate-400 text-center">Loading blocks...</div>
          ) : logs.length === 0 ? (
            <div className="p-4 text-xs text-slate-400 text-center">No audit entries found.</div>
          ) : (
            <table className="w-full text-left border-collapse text-xs">
              <thead className="bg-slate-50 text-slate-500 font-semibold uppercase tracking-wider border-b border-slate-200 text-[10px]">
                <tr>
                  <th className="p-4">Block ID</th>
                  <th className="p-4">Timestamp</th>
                  <th className="p-4">User</th>
                  <th className="p-4">Action</th>
                  <th className="p-4">Details</th>
                  <th className="p-4">Hash chain connection</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                    <td className="p-4 font-bold text-slate-500 font-mono">#{log.id}</td>
                    <td className="p-4 font-mono text-[10px] text-slate-400">{log.timestamp}</td>
                    <td className="p-4">
                      <span className="font-semibold block">{log.username}</span>
                      <span className="text-[9px] text-slate-400 block font-mono">{log.user_id}</span>
                    </td>
                    <td className="p-4">
                      <span className="px-1.5 py-0.5 rounded text-[8px] font-bold bg-blue-50 text-blue-700 border border-blue-100 font-mono">
                        {log.action_type}
                      </span>
                    </td>
                    <td className="p-4 max-w-xs truncate font-medium text-slate-600 leading-normal" title={log.details}>
                      {log.details}
                    </td>
                    <td className="p-4 space-y-1 font-mono text-[9px]">
                      <span className="block text-slate-400 truncate max-w-[120px]" title={log.prev_hash}>
                        Prev: {log.prev_hash}
                      </span>
                      <span className="block text-blue-600 font-semibold truncate max-w-[120px]" title={log.current_hash}>
                        Curr: {log.current_hash}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      {user.role !== 'VIEWER' && (
                        <button
                          onClick={() => simulateTampering(log.id)}
                          className="px-2 py-1 bg-red-50 text-red-600 hover:bg-red-100 border border-red-200 rounded text-[10px] font-bold transition-colors"
                        >
                          Simulate Tamper
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
