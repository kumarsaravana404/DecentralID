const API_URL = "http://localhost:5000";
let provider, signer, userAddress;
let identityContract, verificationContract;

// Minimal ABIs
const IdentityRegistryABI = [
    "function registerIdentity(address user, string ipfsHash) external",
    "function updateIdentity(string newHash) external",
    "function revokeIdentity() external",
    "function getIdentity(address user) external view returns (string, bool, uint256, uint256)",
    "event IdentityRegistered(address indexed user, string ipfsHash, uint256 timestamp)"
];

const VerificationRegistryABI = [
    "function requestVerification(address user, string purpose) external returns (uint256)",
    "function grantConsent(uint256 requestId) external",
    "function verifyIdentity(uint256 requestId) external",
    "function getUserRequests(address user) external view returns (tuple(uint256 id, address verifier, address user, string purpose, uint8 status, uint256 timestamp, uint256 confirmedAt)[])",
    "event VerificationRequested(uint256 indexed requestId, address indexed verifier, address indexed user, string purpose)"
];

async function init() {
    if (window.ethereum) {
        provider = new ethers.providers.Web3Provider(window.ethereum);
        
        // Load Config
        try {
            const res = await fetch(`${API_URL}/config`);
            const config = await res.json();
            
            signer = provider.getSigner();
            
            identityContract = new ethers.Contract(config.IdentityRegistry, IdentityRegistryABI, signer);
            verificationContract = new ethers.Contract(config.VerificationRegistry, VerificationRegistryABI, signer);
            
            console.log("Contracts Loaded:", config);
        } catch (e) {
            console.error("Could not load config. Ensure backend is running and contracts are deployed.", e);
        }

        // Auto connect if authorized
        const accounts = await provider.listAccounts();
        if (accounts.length > 0) {
            connectWallet();
        }
    } else {
        alert("Please install MetaMask!");
    }
}

// =======================
// AUTH & NAVIGATION
// =======================

document.getElementById('connectWallet').addEventListener('click', connectWallet);

async function connectWallet() {
    try {
        const accounts = await provider.send("eth_requestAccounts", []);
        userAddress = accounts[0];
        
        document.getElementById('connectWallet').style.display = 'none';
        document.getElementById('networkBadge').innerHTML = `<span class="dot-status active"></span> Connected`;
        document.getElementById('mainNav').style.display = 'flex';
        
        loadIdentity();
        loadRequests();
        startEventListeners();
    } catch (e) {
        console.error(e);
    }
}

function switchTab(tabName) {
    document.querySelectorAll('.tab-view').forEach(el => el.classList.remove('active'));
    document.querySelectorAll('.nav-tab').forEach(el => el.classList.remove('active'));
    
    document.getElementById(`view-${tabName}`).classList.add('active');
    event.target.classList.add('active');
    
    if (tabName === 'audit') loadAuditLogs();
    if (tabName === 'requests') loadRequests();
}

// =======================
// IDENTITY LOGIC
// =======================

document.getElementById('btnRegister').addEventListener('click', async () => {
    const name = document.getElementById('regName').value;
    const dob = document.getElementById('regDob').value;
    const govId = document.getElementById('regGovId').value;
    
    if (!name || !dob || !govId) return alert("Fill all fields");
    
    showLoader(true, "ENCRYPTING & UPLOADING TO IPFS...");
    
    try {
        // 1. Backend: Encrypt & Store
        const res = await fetch(`${API_URL}/identity/create`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                did: `did:eth:${userAddress}`,
                personalData: { name, dob, govId }
            })
        });
        
        const data = await res.json();
        if (!data.success) throw new Error(data.error);
        
        // 2. Blockchain: Register
        updateLoader("CONFIRMING ON BLOCKCHAIN...");
        const tx = await identityContract.registerIdentity(userAddress, data.ipfsHash);
        await tx.wait();
        
        showLoader(false);
        alert("Identity Created Successfully!");
        loadIdentity();
        
    } catch (e) {
        showLoader(false);
        console.error(e);
        alert("Registration Failed: " + e.message);
    }
});

async function loadIdentity() {
    try {
        const id = await identityContract.getIdentity(userAddress);
        if (id[1]) { // isActive
            document.getElementById('formRegister').style.display = 'none';
            document.getElementById('identityDisplay').style.display = 'block';
            
            document.getElementById('displayDid').innerText = `did:eth:${userAddress}`;
            document.getElementById('displayDate').innerText = new Date(id[2] * 1000).toLocaleDateString();
            
            // Generate QR
            document.getElementById('qrCode').innerHTML = "";
            new QRCode(document.getElementById("qrCode"), {
                text: `did:eth:${userAddress}`,
                width: 128,
                height: 128
            });
        }
    } catch (e) {
        // User likely not registered
        console.log("No identity found or error:", e);
    }
}

document.getElementById('btnRevoke').addEventListener('click', async () => {
    if (!confirm("Are you sure? This is permanent.")) return;
    showLoader(true, "REVOKING IDENTITY...");
    try {
        const tx = await identityContract.revokeIdentity();
        await tx.wait();
        location.reload();
    } catch (e) {
        showLoader(false);
        alert("Revocation Failed");
    }
});

// =======================
// VERIFICATION LOGIC
// =======================

async function loadRequests() {
    try {
        const requests = await verificationContract.getUserRequests(userAddress);
        const list = document.getElementById('requestsList');
        list.innerHTML = "";
        
        document.getElementById('reqCount').innerText = requests.filter(r => r.status === 0).length;

        if (requests.length === 0) {
            list.innerHTML = `<div class="empty-state">No pending requests</div>`;
            return;
        }

        requests.forEach(req => {
            // Status: 0=Pending, 1=Approved, 2=Rejected, 3=Verified
            if (req.status !== 0) return; // Only show pending

            const div = document.createElement('div');
            div.className = 'req-item fade-in';
            div.innerHTML = `
                <h4>Request from: ${req.verifier.substring(0,6)}...${req.verifier.substring(38)}</h4>
                <p>Purpose: ${req.purpose}</p>
                <div class="req-actions">
                    <button class="btn-approve" onclick="grantConsent(${req.id})">Approve</button>
                    <button class="btn-reject">Reject</button>
                </div>
            `;
            list.appendChild(div);
        });
    } catch (e) {
        console.error("Error loading requests", e);
    }
}

window.grantConsent = async (requestId) => {
    showLoader(true, "GRANTING ACCESS...");
    try {
        const tx = await verificationContract.grantConsent(requestId);
        await tx.wait();
        
        // Notify Backend (Optional syncing)
        await fetch(`${API_URL}/verify/confirm`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ requestId: requestId.toNumber(), userDid: userAddress, encryptedPayload: "..." }) 
            // In real app, we would send the re-encrypted key for the verifier here.
        });

        showLoader(false);
        loadRequests();
        alert("Access Granted!");
    } catch (e) {
        showLoader(false);
        alert("Consent Failed");
    }
};

// =======================
// AUDIT LOGS
// =======================

async function loadAuditLogs() {
    try {
        const res = await fetch(`${API_URL}/audit/logs`);
        const logs = await res.json();
        
        const tbody = document.getElementById('auditTableBody');
        tbody.innerHTML = "";
        
        logs.forEach(log => {
            const row = `<tr>
                <td>${new Date(log.timestamp).toLocaleString()}</td>
                <td><span class="badge-action">${log.action}</span></td>
                <td class="mono-text">${log.did || 'System'}</td>
                <td class="mono-text">${log.txHash}</td>
            </tr>`;
            tbody.innerHTML += row;
        });
    } catch (e) {
        console.error("Audit load failed", e);
    }
}

window.exportLogs = () => {
    window.open(`${API_URL}/audit/logs`);
};

// =======================
// UTILS
// =======================

let loaderTimeout;

function showLoader(show, msg) {
    const el = document.getElementById('loadingOverlay');
    const controls = document.getElementById('loaderControls');
    
    if (show) {
        el.style.display = 'flex';
        controls.style.display = 'none'; // Hide initially
        if (msg) document.getElementById('loaderMessage').innerText = msg;
        
        // If it takes longer than 5 seconds, show the help controls
        clearTimeout(loaderTimeout);
        loaderTimeout = setTimeout(() => {
            controls.style.display = 'block';
        }, 5000);
        
    } else {
        el.style.display = 'none';
        clearTimeout(loaderTimeout);
    }
}

function updateLoader(msg) {
    document.getElementById('loaderMessage').innerText = msg;
}

window.forceCloseLoader = () => {
    document.getElementById('loadingOverlay').style.display = 'none';
    clearTimeout(loaderTimeout);
};

function copyDid() {
    navigator.clipboard.writeText(`did:eth:${userAddress}`);
    alert("DID Copied!");
}

async function startEventListeners() {
    verificationContract.on("VerificationRequested", (id, verifier, user, purpose) => {
        if (user === userAddress) {
            
            // alert(`New Verification Request: ${purpose}`);
            loadRequests();
        }
    });
}

// Initialize
window.addEventListener('load', init);

