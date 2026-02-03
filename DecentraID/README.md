# DecentraID - Enterprise Self-Sovereign Identity (SSI) System

DecentraID is a production-grade, state-of-the-art decentralized identity system designed to eliminate the risks of centralized identity architectures. Built on blockchain technology and W3C standards, it empowers individuals with full ownership and control over their digital credentials.

## 🚀 Key Features

- **Decentralized Identifiers (DIDs)**: Unique, persistent identifiers anchored on the Ethereum blockchain (did:eth:...).
- **Verifiable Credentials (VCs)**: Digital proofs of identity attributes (National ID, Degree, Licenses) issued by trusted authorities.
- **Zero-Knowledge Privacy**: Selective disclosure simulation allowing users to prove attributes (e.g., "Over 18") without revealing sensitive PII.
- **Biometric Security**: Integrated Android mobile wallet with BiometricPrompt authentication.
- **Immutability & Trust**: Complete audit trail of every identity interaction stored on-chain or in an immutable off-chain ledger.

## 🌟 Technical Architecture

### 1. Blockchain Layer (Solidity / Hardhat)

- **IdentityRegistry.sol**: Manages DID registration, metadata updates, and identity revocation.
- **CredentialRegistry.sol**: Handles the issuance and management of W3C-compliant Verifiable Credentials.
- **VerificationRegistry.sol**: Manages secure verification requests and user consent tokens.
- **ZK Hooks**: Prepared functions for ZK-SNARK verification integration.

### 2. Backend Identity Services (Node.js / Express)

- **Identity Service**: Handles AES-256 encryption/decryption of user data before anchoring.
- **Verification Service**: Manages the selective disclosure flows and verification status.
- **Audit Service**: Tracks and serves immutable logs for audit compliance.

### 3. Web Intelligence Hub (React / Vite / Tailwind)

- **Glassmorphic Interface**: Ultra-modern UI with real-time blockchain event synchronization.
- **Identity Wallet**: Intuitive dashboard to view DIDs, manage credentials, and approve access requests.
- **Animations**: Fluid transitions powered by Framer Motion for a premium user experience.

### 4. Mobile Wallet (Android / Kotlin)

- **Secure Storage**: Encrypted key management.
- **Biometric Gate**: Hardware-backed authentication for credential sharing.

---

## 🛠️ Quick Start

### Prerequisites

- Node.js (v18+)
- MetaMask Browser Extension
- (Optional) Android Studio for mobile development

### Full System Initialization

```bash
# 1. Install dependencies for all layers
npm run setup

# 2. Launch the entire ecosystem (Blockchain + Backend + Web)
npm run dev
```

The `npm run dev` command orchestrates:

1. **Local Hardhat Node** (Port 8545)
2. **Contract Deployment** & Config generation
3. **Identity Backend API** (Port 5000)
4. **Vite React Frontend** (Port 5173 / 3000)

---

## 🔒 Security Model

- **Zero-Knowledge Architecture**: The backend never stores plaintext PII. All data is encrypted with client-derived keys.
- **On-Chain Privacy**: Only cryptographic hashes and encrypted IPFS pointers are stored on the public ledger.
- **Consent-First**: Verifiers can ONLY access identity attributes after an explicit on-chain consent transaction from the user.

## 📂 Project Structure

- `/blockchain`: Smart contracts, Hardhat configuration, and deployment scripts.
- `/backend`: Node.js services for encryption, auditing, and verification.
- `/web`: Modern React frontend with Tailwind CSS and Framer Motion.
- `/android`: Kotlin-based mobile wallet with biometric security.

---

_Created by DecentraID Engineering Team & Antigravity AI._
