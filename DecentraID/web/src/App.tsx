/// <reference types="vite/client" />
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Shield, 
  Wallet, 
  Fingerprint, 
  Key, 
  Activity, 
  CheckCircle2, 
  XCircle, 
  Copy, 
  Plus, 
  ExternalLink,
  ChevronRight,
  ShieldCheck,
  Zap
} from 'lucide-react';
import { ethers } from 'ethers';
import { QRCodeSVG } from 'qrcode.react';

declare global {
  interface Window {
    ethereum: any;
  }
}

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

export default function App() {
  const [wallet, setWallet] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [identity, setIdentity] = useState<any>(null);
  const [verificationRequests, setVerificationRequests] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [contracts, setContracts] = useState<any>(null);

  const [balance, setBalance] = useState<string>('0');
  
  // Form State
  const [regData, setRegData] = useState({ name: '', dob: '', email: '', govId: '' });

  // Gasless Identity State
  const [shareableLink, setShareableLink] = useState('');
  const [importHash, setImportHash] = useState('');
  const [previewIdentity, setPreviewIdentity] = useState<any>(null);

  useEffect(() => {
    init();
    if (shareableLink) console.log("New link generated:", shareableLink);
  }, [shareableLink]);

  // Detect import hash from URL
  useEffect(() => {
    const path = window.location.pathname;
    if (path.includes('/import/')) {
      const hash = path.split('/import/')[1];
      if (hash) {
        setImportHash(hash);
        console.log("Import hash detected from URL:", hash);
        
        // Auto-fetch identity details for preview
        fetch(`${API_URL}/identity/share/${hash}`)
          .then(res => res.json())
          .then(data => {
            if (!data.error) {
              setPreviewIdentity({ ...data, shareHash: hash });
            }
          })
          .catch(err => console.error("Failed to fetch preview:", err));
      }
    }
  }, []);

  const init = async () => {
    if (typeof window.ethereum !== 'undefined') {
      try {
        const provider = new ethers.BrowserProvider(window.ethereum);
        const res = await fetch(`${API_URL}/config`);
        const config = await res.json();
        
        const signer = await provider.getSigner();
        const IdentityRegistryABI = [
          "function registerIdentity(address user, string ipfsHash) external",
          "function getIdentity(address user) external view returns (string, bool, uint256, uint256)",
          "function revokeIdentity() external",
        ];
        const VerificationRegistryABI = [
          "function getUserRequests(address user) external view returns (tuple(uint256 id, address verifier, address user, string purpose, uint8 status, uint256 timestamp, uint256 confirmedAt)[])",
          "function grantConsent(uint256 requestId) external",
          "event VerificationRequested(uint256 indexed requestId, address indexed verifier, address indexed user, string purpose)"
        ];

        setContracts({
          identity: new ethers.Contract(config.IdentityRegistry, IdentityRegistryABI, signer),
          verification: new ethers.Contract(config.VerificationRegistry, VerificationRegistryABI, signer),
          config
        });

        const accounts = await provider.listAccounts();
        if (accounts.length > 0) {
          const address = accounts[0].address;
          setWallet(address);
          fetchBalance(address);
        }
      } catch (e) {
        console.error("Initialization failed", e);
      }
    }
  };

  useEffect(() => {
    if (wallet && contracts) {
      loadData();
      startListeners();
    }
  }, [wallet, contracts]);

  const fetchBalance = async (address: string) => {
    if (typeof window.ethereum !== 'undefined') {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const balanceBig = await provider.getBalance(address);
      const balanceEth = ethers.formatEther(balanceBig);
      setBalance(parseFloat(balanceEth).toFixed(4));
    }
  };

  const connectWallet = async () => {
    if (typeof window.ethereum !== 'undefined') {
      try {
        const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
        setWallet(accounts[0]);
        await fetchBalance(accounts[0]);
      } catch (error) {
        console.error("Connection failed:", error);
        alert("Failed to connect wallet. See console for details.");
      }
    } else {
      console.error("No wallet found");
      alert("No Ethereum wallet found! Please install MetaMask.");
    }
  };

  const loadData = async () => {
    if (!wallet || !contracts) return;
    try {
      // Load Identity
      const id = await contracts.identity.getIdentity(wallet);
      if (id[1]) {
        setIdentity({
          ipfsHash: id[0],
          isActive: id[1],
          createdAt: new Date(id[2] * 1000).toLocaleDateString(),
          did: `did:eth:${wallet}`
        });
      }

      // Load Requests
      const requests = await contracts.verification.getUserRequests(wallet);
      setVerificationRequests(requests.filter((r: any) => r.status === 0));

      // Load Audit
      const auditRes = await fetch(`${API_URL}/audit/logs?did=did:eth:${wallet}`);
      const logs = await auditRes.json();
      setAuditLogs(logs);

    } catch (e) {
      console.error("Data loading failed", e);
    }
  };

  const startListeners = () => {
    contracts.verification.on("VerificationRequested", (_id: any, _verifier: string, user: string, _purpose: string) => {
      if (user.toLowerCase() === wallet?.toLowerCase()) {
        loadData();
      }
    });
  };

  const handleRegister = async () => {
    console.log("Starting registration with data:", regData);
    if (!regData.name || !regData.email) {
      alert("Please fill in Name and Email!");
      return;
    }
    
    setLoading(true);
    try {
      // 1. Backend Encryption
      console.log("Sending data to backend...");
      const res = await fetch(`${API_URL}/identity/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          did: `did:eth:${wallet}`,
          personalData: regData
        })
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Backend failed");
      }

      const { ipfsHash } = await res.json();
      console.log("Received IPFS Hash:", ipfsHash);

      // 2. Blockchain Tx
      if (!contracts || !contracts.identity) {
        throw new Error("Smart contracts not initialized");
      }

      console.log("Sending transaction to blockchain...");
      const tx = await contracts.identity.registerIdentity(wallet, ipfsHash);
      console.log("Transaction sent:", tx.hash);
      
      await tx.wait();
      console.log("Transaction confirmed!");
      
      await loadData();
      setLoading(false);
    } catch (e) {
      console.error(e);
      setLoading(false);
    }
  };

  const handleGaslessRegister = async () => {
    if(!regData.name || !regData.email) {
      alert("Please fill in Name and Email!");
      return;
    }
    
    setLoading(true);
    try {
      let targetDid = wallet ? `did:eth:${wallet}` : '';
      
      if (!targetDid) {
        // Generate a random temporary address for the DID
        const randomWallet = ethers.Wallet.createRandom();
        targetDid = `did:eth:${randomWallet.address}`;
      }

      const res = await fetch(`${API_URL}/identity/create-gasless`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          did: targetDid,
          personalData: regData
        })
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Backend failed");
      }

      const { shareableLink: link } = await res.json();
      setShareableLink(link);
      // Removed alert, using Modal instead
      
      setLoading(false);
    } catch (e) {
      console.error(e);
      alert("Gasless creation failed: " + (e as Error).message);
      setLoading(false);
    }
  };

  const handleImportIdentity = async () => {
    // Clean input (handle full URL if pasted)
    let hashToUse = importHash.trim();
    if (hashToUse.includes('/import/')) {
        hashToUse = hashToUse.split('/import/')[1];
    }
    // Remove query string if any
    hashToUse = hashToUse.split('?')[0];

    if (!hashToUse) {
      alert("Please enter a valid share hash!");
      return;
    }
    
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/identity/share/${hashToUse}`);
      
      if (!res.ok) {
        throw new Error("Identity not found");
      }

      const data = await res.json();
      setPreviewIdentity({ ...data, shareHash: hashToUse });
      setLoading(false);
    } catch (e) {
      console.error(e);
      alert("Import failed: " + (e as Error).message);
      setLoading(false);
    }
  };

  const confirmClaimIdentity = async () => {
    if (!previewIdentity || !contracts || !wallet) return;
    
    setLoading(true);
    try {
        // Anchor on blockchain
        const tx = await contracts.identity.registerIdentity(wallet, previewIdentity.ipfsHash);
        await tx.wait();
        
        // Update backend
        await fetch(`${API_URL}/identity/claim`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            shareHash: previewIdentity.shareHash,
            claimantWallet: wallet,
            txHash: tx.hash
          })
        });
        
        setPreviewIdentity(null);
        setImportHash('');
        
        // Clear URL if needed
        window.history.pushState({}, '', '/');
        
        alert("✅ Identity claimed and anchored on blockchain!");
        await loadData();
    } catch (e) {
      console.error(e);
      alert("Claim failed: " + (e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const approveRequest = async (requestId: any) => {
    setLoading(true);
    try {
      const tx = await contracts.verification.grantConsent(requestId);
      await tx.wait();
      
      // Confirm to backend
      await fetch(`${API_URL}/verify/confirm`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          requestId: requestId.toNumber ? requestId.toNumber() : requestId, 
          userDid: wallet, 
          encryptedPayload: "DEMO_PAYLOAD" 
        })
      });

      await loadData();
      setLoading(false);
    } catch (e) {
      console.error(e);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative flex flex-col items-center">
      {/* Background Blobs */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary neo-blur"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-secondary neo-blur"></div>

      {/* Header */}
      <header className="w-full max-w-6xl px-6 py-8 flex justify-between items-center z-10">
        <div className="flex items-center gap-3">
          <div className="bg-primary/20 p-2 rounded-xl border border-primary/30">
            <Shield className="text-primary" size={32} />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight">DecentraID</h1>
            <p className="text-[10px] text-gray-500 font-mono tracking-widest uppercase">Self-Sovereign Identity</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {wallet ? (
            <div className="glass px-4 py-2 rounded-full border border-primary/20 flex items-center gap-4">
              <div className="flex items-center gap-2 border-r border-white/10 pr-3">
                <span className="text-xs font-bold text-primary">{balance} ETH</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                <span className="text-xs font-mono">{wallet.slice(0,6)}...{wallet.slice(-4)}</span>
              </div>
            </div>
          ) : (
            <button 
              onClick={connectWallet}
              className="bg-primary hover:bg-primary/80 text-white px-6 py-2.5 rounded-full flex items-center gap-2 font-semibold transition-all hover:scale-105 active:scale-95"
            >
              <Wallet size={18} />
              Connect Wallet
            </button>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="w-full max-w-6xl px-6 flex-1 z-10 pb-20">
        {!wallet ? (
          <div className="h-[60vh] flex flex-col items-center justify-center text-center">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="max-w-md w-full"
            >
              <Fingerprint size={80} className="text-primary mx-auto mb-6 opacity-50" />
              <h2 className="text-4xl font-bold mb-4">Your Identity, Your Control</h2>
              <p className="text-gray-400 mb-8">DecentraID empowers you to own and manage your digital credentials securely on the blockchain.</p>
              
              <div className="flex flex-col gap-4 w-full">
                <button 
                  onClick={connectWallet}
                  className="bg-white text-black px-10 py-4 rounded-full font-bold text-lg hover:shadow-[0_0_30px_rgba(255,255,255,0.3)] transition-all"
                >
                  Connect Wallet
                </button>
                
                {/* Gasless Identity Form for No-Wallet Users */}
                <div className="glass p-6 rounded-3xl border border-white/10 mt-6 animate-fade-in text-left">
                  <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                    <Zap size={18} className="text-secondary" />
                    No Wallet? Go Gasless!
                  </h3>
                  <div className="space-y-3">
                    <input 
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 outline-none text-sm"
                      placeholder="Full Name"
                      value={regData.name}
                      onChange={e => setRegData({...regData, name: e.target.value})}
                    />
                    <input 
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 outline-none text-sm"
                      placeholder="Email"
                      value={regData.email}
                      onChange={e => setRegData({...regData, email: e.target.value})}
                    />
                    <button 
                      onClick={handleGaslessRegister}
                      disabled={loading || !regData.name || !regData.email}
                      className="w-full bg-secondary py-3 rounded-xl font-bold text-sm hover:bg-secondary/80 transition-all disabled:opacity-50"
                    >
                      {loading ? "Creating..." : "Create Gasless ID"}
                    </button>
                  </div>
                </div>
              </div>

            </motion.div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Left Column: Navigation & Profile */}
            <div className="lg:col-span-3 flex flex-col gap-4">
              <div className="glass p-2 rounded-2xl flex flex-col">
                <button 
                  onClick={() => setActiveTab('dashboard')}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'dashboard' ? 'bg-primary/20 text-primary' : 'hover:bg-white/5'}`}
                >
                  <Activity size={18} />
                  <span className="font-semibold">Dashboard</span>
                </button>
                <button 
                  onClick={() => setActiveTab('credentials')}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'credentials' ? 'bg-primary/20 text-primary' : 'hover:bg-white/5'}`}
                >
                  <Key size={18} />
                  <span className="font-semibold text-left flex-1">Credentials</span>
                  {verificationRequests.length > 0 && (
                    <span className="bg-primary text-white text-[10px] px-2 py-0.5 rounded-full">{verificationRequests.length}</span>
                  )}
                </button>
                <button 
                  onClick={() => setActiveTab('audit')}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'audit' ? 'bg-primary/20 text-primary' : 'hover:bg-white/5'}`}
                >
                  <ShieldCheck size={18} />
                  <span className="font-semibold">Audit Logs</span>
                </button>
              </div>

              {identity && (
                <div className="glass p-6 rounded-3xl border border-white/10 relative overflow-hidden group">
                  <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                    <Shield size={60} />
                  </div>
                  <h3 className="text-xs font-mono text-gray-500 uppercase tracking-widest mb-4">Verified Proof</h3>
                  <div className="bg-white/10 p-3 rounded-xl mb-4 inline-block">
                    <QRCodeSVG value={identity.did} size={100} fgColor="#fff" bgColor="transparent" />
                  </div>
                  <p className="text-[10px] font-mono text-primary truncate mb-1">{identity.did}</p>
                  <p className="text-[10px] text-gray-400">Issued: {identity.createdAt}</p>
                </div>
              )}
            </div>

            {/* Middle Column: Active View */}
            <div className="lg:col-span-9 space-y-8">
              <AnimatePresence mode="wait">
                {activeTab === 'dashboard' && (
                  <motion.div 
                    key="dashboard"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-8"
                  >
                    {!identity ? (
                      <div className="glass-card p-10 rounded-[2.5rem] border border-white/10">
                        <div className="flex flex-col md:flex-row gap-10 items-center">
                          <div className="flex-1 space-y-6">
                            <h2 className="text-3xl font-bold">Create Your Global Identity</h2>
                            <p className="text-gray-400">Complete the form below to anchor your identity on-chain. This will generate your DID and encrypt your data.</p>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div className="space-y-2">
                                <label className="text-[10px] font-mono text-gray-500 uppercase">Full Name</label>
                                <input 
                                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-primary/50 transition-all font-medium"
                                  placeholder="John Doe"
                                  value={regData.name}
                                  onChange={e => setRegData({...regData, name: e.target.value})}
                                />
                              </div>
                              <div className="space-y-2">
                                <label className="text-[10px] font-mono text-gray-500 uppercase">Email Address</label>
                                <input 
                                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-primary/50 transition-all font-medium"
                                  placeholder="john@example.com"
                                  value={regData.email}
                                  onChange={e => setRegData({...regData, email: e.target.value})}
                                />
                              </div>
                              <div className="space-y-2">
                                <label className="text-[10px] font-mono text-gray-500 uppercase">Date of Birth</label>
                                <input 
                                  type="date"
                                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-primary/50 transition-all font-medium text-gray-400"
                                  value={regData.dob}
                                  onChange={e => setRegData({...regData, dob: e.target.value})}
                                />
                              </div>
                              <div className="space-y-2">
                                <label className="text-[10px] font-mono text-gray-500 uppercase">Gov ID (Optional)</label>
                                <input 
                                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-primary/50 transition-all font-medium"
                                  placeholder="ID-88XXXX"
                                  value={regData.govId}
                                  onChange={e => setRegData({...regData, govId: e.target.value})}
                                />
                              </div>
                            </div>
                            {/* Registration Buttons */}
                            <div className="space-y-3">
                              <button 
                                onClick={handleRegister}
                                disabled={loading}
                                className="w-full bg-primary py-4 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-primary/80 transition-all disabled:opacity-50"
                              >
                                {loading ? "Processing..." : "Register Identity (Requires Gas)"}
                                {!loading && <Plus size={20} />}
                              </button>
                              
                              <button 
                                onClick={handleGaslessRegister}
                                disabled={loading}
                                className="w-full bg-secondary py-4 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-secondary/80 transition-all disabled:opacity-50"
                              >
                                {loading ? "Processing..." : "🚀 Create Gasless Identity (No Gas!)"}
                              </button>
                              
                              <div className="flex items-center gap-2 pt-4">
                                <input 
                                  placeholder="Import from Share Hash"
                                  value={importHash}
                                  onChange={e => setImportHash(e.target.value)}
                                  className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-accent/50 transition-all font-medium text-sm"
                                />
                                <button
                                  onClick={handleImportIdentity}
                                  disabled={loading || !importHash}
                                  className="bg-accent px-6 py-3 rounded-xl font-bold hover:bg-accent/80 transition-all disabled:opacity-50"
                                >
                                  Import
                                </button>
                              </div>
                            </div>
                          </div>
                          <div className="w-full md:w-64 aspect-square glass rounded-3xl flex items-center justify-center border border-white/10 flex-col gap-4 text-center p-6 relative">
                            <div className="absolute inset-0 bg-primary/20 blur-[80px] -z-10 rounded-full"></div>
                            <Fingerprint size={64} className="text-primary/50" />
                            <p className="text-xs text-gray-500 font-mono">ENCRYPTION: AES-256-CBC</p>
                            <p className="text-[10px] text-accent font-bold">⚡ NOW GASLESS READY</p>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <>
                        {/* Highlights Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                           <div className="glass-card p-8 rounded-[2rem] border border-white/10 relative overflow-hidden group hover:scale-[1.02] transition-all">
                              <div className="absolute top-0 right-0 p-8 transform rotate-12 opacity-5 translate-x-4 -translate-y-4 group-hover:opacity-10 transition-all">
                                <ShieldCheck size={120} />
                              </div>
                              <h3 className="text-gray-400 font-medium mb-1">Identity Status</h3>
                              <div className="flex items-center gap-2 mb-6">
                                <CheckCircle2 className="text-green-500" size={24} />
                                <span className="text-2xl font-bold">Active & Secure</span>
                              </div>
                              <div className="flex items-center gap-4 text-xs font-mono">
                                <span className="bg-white/10 px-3 py-1 rounded-full text-gray-400">V.1.0</span>
                                <span className="text-primary flex items-center gap-1 cursor-pointer">
                                  View on Explorer <ExternalLink size={10} />
                                </span>
                              </div>
                           </div>
                           <div className="glass-card p-8 rounded-[2rem] border border-white/10 relative overflow-hidden group hover:scale-[1.02] transition-all">
                              <div className="absolute top-0 right-0 p-8 transform rotate-12 opacity-5 translate-x-4 -translate-y-4 group-hover:opacity-10 transition-all">
                                <Zap size={120} />
                              </div>
                              <h3 className="text-gray-400 font-medium mb-1">Total Activities</h3>
                              <div className="flex items-center gap-2 mb-6">
                                <Activity className="text-primary" size={24} />
                                <span className="text-2xl font-bold">{auditLogs.length} Actions</span>
                              </div>
                              <div className="p-1 px-3 bg-primary/10 rounded-full inline-block">
                                <p className="text-[10px] text-primary font-bold">LAST UPDATED TODAY</p>
                              </div>
                           </div>
                        </div>

                        {/* Identity Card */}
                        <div className="glass p-8 rounded-[2.5rem] border border-white/10 bg-gradient-to-br from-white/[0.05] to-transparent">
                          <div className="flex justify-between items-start mb-12">
                            <div>
                               <p className="text-[10px] font-mono text-gray-500 uppercase tracking-widest mb-1">Identity Owner</p>
                               <h2 className="text-3xl font-bold italic">{regData.name || "Verified Holder"}</h2>
                            </div>
                            <div className="bg-primary/20 p-3 rounded-2xl">
                               <Shield className="text-primary" size={24} />
                            </div>
                          </div>
                          <div className="flex flex-col md:flex-row justify-between items-end gap-6">
                            <div className="flex-1 w-full space-y-4">
                              <div className="bg-black/20 p-4 rounded-2xl border border-white/5 font-mono text-[11px] flex justify-between items-center group">
                                <span className="text-gray-500">DID: {identity.did}</span>
                                <Copy size={14} className="text-gray-500 cursor-pointer hover:text-white transition-colors" onClick={() => {
                                  navigator.clipboard.writeText(identity.did);
                                  alert("Copied!");
                                }} />
                              </div>
                               <div className="flex gap-4">
                                  <div className="space-y-1">
                                    <p className="text-[8px] font-mono text-gray-500 uppercase">Issuer</p>
                                    <p className="text-xs font-bold">DecentraID Core</p>
                                  </div>
                                  <div className="space-y-1">
                                    <p className="text-[8px] font-mono text-gray-500 uppercase">Valid Thru</p>
                                    <p className="text-xs font-bold text-green-500">PERMANENT</p>
                                  </div>
                               </div>
                            </div>
                            <div className="bg-white p-2 rounded-2xl">
                               <QRCodeSVG value={identity.did} size={80} level="H" />
                            </div>
                          </div>
                        </div>
                      </>
                    )}
                  </motion.div>
                )}

                {activeTab === 'credentials' && (
                  <motion.div 
                    key="credentials"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-6"
                  >
                    <div className="flex justify-between items-center">
                      <h2 className="text-2xl font-bold">Verifiable Credentials</h2>
                      <div className="bg-white/5 border border-white/10 px-4 py-2 rounded-xl text-xs flex items-center gap-2">
                        <CheckCircle2 size={14} className="text-green-500" />
                        Trustless Verification System
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Active Requests */}
                      {verificationRequests.length > 0 ? (
                        verificationRequests.map((req: any, i: number) => (
                          <div key={i} className="glass-card p-6 rounded-3xl border border-primary/30 bg-primary/5 animate-float">
                            <div className="flex justify-between items-start mb-4">
                              <div className="p-2 bg-primary/20 rounded-lg">
                                <Key className="text-primary" size={20} />
                              </div>
                              <span className="text-[10px] font-mono bg-primary/20 text-primary px-2 py-1 rounded-full uppercase">Pending Request</span>
                            </div>
                            <h4 className="font-bold mb-1">Access Requested by {req.verifier.slice(0,6)}...</h4>
                            <p className="text-sm text-gray-400 mb-6">Purpose: <span className="text-white italic underline">{req.purpose}</span></p>
                            <div className="flex gap-3">
                              <button 
                                onClick={() => approveRequest(req.id)}
                                disabled={loading}
                                className="flex-1 bg-white text-black py-2.5 rounded-xl font-bold text-sm hover:scale-[1.02] active:scale-98 transition-all disabled:opacity-50"
                              >
                                {loading ? "Approving..." : "Approve & Sign"}
                              </button>
                              <button className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-red-500/20 text-red-500 transition-colors">
                                <XCircle size={18} />
                              </button>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="col-span-full py-20 text-center glass rounded-[2.5rem] border-dashed border-2 border-white/10">
                           <Shield size={40} className="mx-auto mb-4 opacity-10" />
                           <p className="text-gray-500">No pending verification requests</p>
                        </div>
                      )}
                    </div>

                    <h3 className="text-lg font-bold mt-10 mb-4">Your Credential Ledger</h3>
                    <div className="space-y-4">
                      {['National ID Proof', 'University Degree', 'Web3 Reputation Score'].map((vc, i) => (
                        <div key={i} className="glass p-5 rounded-2xl flex items-center justify-between group hover:bg-white/[0.06] transition-all cursor-pointer border border-white/5">
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                              <CheckCircle2 size={20} />
                            </div>
                            <div>
                               <h4 className="font-bold text-sm">{vc}</h4>
                               <p className="text-[10px] font-mono text-gray-500">Ref: {Math.random().toString(16).slice(2, 10).toUpperCase()}</p>
                            </div>
                          </div>
                          <ChevronRight size={18} className="text-gray-600 group-hover:text-white transform group-hover:translate-x-1 transition-all" />
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}

                {activeTab === 'audit' && (
                  <motion.div 
                    key="audit"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-6"
                  >
                    <div className="flex justify-between items-center mb-8">
                      <div>
                        <h2 className="text-2xl font-bold">Immutable Audit Trail</h2>
                        <p className="text-xs text-gray-500">Every interaction is logged and anchored for transparency.</p>
                      </div>
                      <button className="glass px-4 py-2 rounded-xl text-xs hover:bg-white/10 transition-colors">Export Report</button>
                    </div>

                    <div className="glass rounded-3xl border border-white/10 overflow-hidden">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="bg-white/5">
                            <th className="px-6 py-4 text-[10px] font-mono uppercase text-gray-500 tracking-widest font-medium">Time (UTC)</th>
                            <th className="px-6 py-4 text-[10px] font-mono uppercase text-gray-500 tracking-widest font-medium">Action</th>
                            <th className="px-6 py-4 text-[10px] font-mono uppercase text-gray-500 tracking-widest font-medium">TX Hash</th>
                          </tr>
                        </thead>
                        <tbody>
                          {auditLogs.length > 0 ? auditLogs.map((log: any, i: number) => (
                            <tr key={i} className="border-t border-white/5 hover:bg-white/[0.02] transition-colors">
                              <td className="px-6 py-4 text-[11px] font-mono text-gray-400">{new Date(log.timestamp).toLocaleTimeString()}</td>
                              <td className="px-6 py-4">
                                <span className="bg-primary/10 text-primary text-[10px] font-bold px-3 py-1 rounded-full uppercase">{log.action}</span>
                              </td>
                              <td className="px-6 py-4 text-[11px] font-mono text-gray-500 truncate max-w-[120px]">{log.txHash}</td>
                            </tr>
                          )) : (
                            <tr>
                              <td colSpan={3} className="px-6 py-20 text-center text-gray-600 text-sm italic">Initialize identity to see logs</td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        )}
      </main>

      {/* Loading Overlay */}
      <AnimatePresence>
        {loading && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-6"
          >
            <div className="text-center space-y-6 max-w-xs">
              <div className="relative w-24 h-24 mx-auto">
                <div className="absolute inset-0 border-4 border-primary/20 rounded-full"></div>
                <div className="absolute inset-0 border-4 border-t-primary rounded-full animate-spin"></div>
                <Shield className="absolute inset-0 m-auto text-primary animate-pulse" size={40} />
              </div>
              <div>
                <h3 className="text-xl font-bold mb-2">Architecting Identity</h3>
                <p className="text-sm text-gray-400">Securing your cryptographic proof on the decentralized ledger...</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Share Link Modal */}
      <AnimatePresence>
        {shareableLink && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] bg-black/90 backdrop-blur-md flex items-center justify-center p-6"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="bg-[#121212] border border-white/10 p-8 rounded-[2rem] max-w-md w-full shadow-2xl relative"
            >
              <button 
                onClick={() => setShareableLink('')}
                className="absolute top-4 right-4 p-2 hover:bg-white/10 rounded-full transition-colors"
              >
                <XCircle size={24} className="text-gray-500" />
              </button>
              
              <div className="w-16 h-16 bg-secondary/20 rounded-2xl flex items-center justify-center mb-6 mx-auto">
                <Zap size={32} className="text-secondary fill-secondary" />
              </div>
              
              <div className="text-center mb-8">
                <h3 className="text-2xl font-bold mb-2">Identity Created!</h3>
                <p className="text-gray-400 text-sm">Your secure identity has been generated off-chain. Share this link to claim it.</p>
              </div>

              <div className="bg-black/40 p-4 rounded-xl border border-white/5 break-all font-mono text-xs mb-6 text-gray-300 relative group">
                {shareableLink}
                <div className="absolute top-2 right-2 flex gap-2">
                   <button 
                     onClick={() => {
                        navigator.clipboard.writeText(shareableLink);
                        alert("Copied to clipboard!");
                     }}
                     className="bg-white/10 hover:bg-white/20 p-2 rounded-lg transition-colors"
                     title="Copy Link"
                   >
                     <Copy size={14} />
                   </button>
                   <a 
                     href={shareableLink}
                     target="_blank"
                     rel="noreferrer"
                     className="bg-primary/20 hover:bg-primary/30 text-primary p-2 rounded-lg transition-colors"
                     title="Open Link"
                   >
                     <ExternalLink size={14} />
                   </a>
                </div>
              </div>

              <div className="flex gap-3">
                <button 
                  onClick={() => {
                    navigator.clipboard.writeText(shareableLink);
                    alert("Copied to clipboard!");
                  }}
                  className="flex-1 bg-white text-black py-3 rounded-xl font-bold hover:shadow-lg transition-all flex items-center justify-center gap-2"
                >
                  <Copy size={18} /> Copy Link
                </button>
                <button 
                  onClick={() => setShareableLink('')}
                  className="px-6 py-3 rounded-xl bg-white/5 hover:bg-white/10 font-bold transition-colors"
                >
                  Done
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Identity Preview Modal */}
      <AnimatePresence>
        {previewIdentity && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] bg-black/90 backdrop-blur-md flex items-center justify-center p-6"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="bg-[#121212] border border-white/10 p-8 rounded-[2rem] max-w-lg w-full shadow-2xl relative"
            >
              <button 
                onClick={() => setPreviewIdentity(null)}
                className="absolute top-4 right-4 p-2 hover:bg-white/10 rounded-full transition-colors"
              >
                <XCircle size={24} className="text-gray-500" />
              </button>
              
              <div className="text-center mb-6">
                 <div className="w-16 h-16 bg-primary/20 rounded-2xl flex items-center justify-center mb-4 mx-auto animate-pulse">
                    <Fingerprint size={32} className="text-primary" />
                 </div>
                 <h3 className="text-2xl font-bold">Identity Found</h3>
                 <p className="text-gray-400 text-sm">Review the details below to claim this identity.</p>
              </div>

              <div className="glass rounded-xl p-6 space-y-4 mb-8">
                 <div className="flex justify-between border-b border-white/5 pb-2">
                    <span className="text-gray-500 font-mono text-xs uppercase">Full Name</span>
                    <span className="font-bold">{previewIdentity.personalData.name}</span>
                 </div>
                 <div className="flex justify-between border-b border-white/5 pb-2">
                    <span className="text-gray-500 font-mono text-xs uppercase">Email</span>
                    <span className="font-bold">{previewIdentity.personalData.email}</span>
                 </div>
                 <div className="flex justify-between border-b border-white/5 pb-2">
                    <span className="text-gray-500 font-mono text-xs uppercase">Created At</span>
                    <span className="font-mono text-xs">{new Date(previewIdentity.createdAt).toLocaleString()}</span>
                 </div>
                 <div className="flex flex-col gap-1 pt-2">
                    <span className="text-gray-500 font-mono text-xs uppercase">Temporary DID</span>
                    <span className="font-mono text-[10px] bg-black/40 p-2 rounded break-all text-gray-400">{previewIdentity.did}</span>
                 </div>
              </div>

              <div className="flex gap-3">
                {wallet ? (
                    <button 
                      onClick={confirmClaimIdentity}
                      className="flex-1 bg-green-500 text-black py-4 rounded-xl font-bold hover:bg-green-400 transition-all flex items-center justify-center gap-2"
                    >
                      <CheckCircle2 size={18} /> Claim Identity
                    </button>
                ) : (
                    <button 
                      onClick={connectWallet}
                      className="flex-1 bg-white text-black py-4 rounded-xl font-bold hover:bg-gray-200 transition-all flex items-center justify-center gap-2"
                    >
                      <Wallet size={18} /> Connect Wallet to Claim
                    </button>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <footer className="w-full max-w-6xl px-6 py-10 text-center text-gray-600 text-[10px] font-mono tracking-widest uppercase">
          &copy; 2026 DecentraID Protocol &bull; Decentralized Trust Engine &bull; W3C Compliant
      </footer>
    </div>
  );
}
