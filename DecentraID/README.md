# DecentraID - Decentralized Identity Platform

A **production-ready** self-sovereign identity (SSI) system built on blockchain technology, enabling users to own and control their digital identities with enterprise-grade security.

**Now features Gasless Identity creation!** Create identities without cryptocurrency and anchor them later.

---

## 📋 Table of Contents

1. [Features](#-features)
2. [Gasless Identity](#-gasless-identity-feature)
3. [System Architecture](#-system-architecture)
4. [Technology Stack](#-technology-stack)
5. [Getting Started](#-getting-started)
6. [API Reference](#-api-endpoints)
7. [Deployment](#-deployment-guide)
8. [Security](#-security)

---

## ✨ Features

- **Self-Sovereign Identity**: Users fully control their digital identity (DID).
- **Zero-Balance Support**: Connect wallets and create specific "Gasless Identities" without ETH.
- **Verifiable Credentials**: Issue and verify credentials with cryptographic proofs.
- **Hybrid Architecture**: Encrypted off-chain storage (MongoDB) + Immutable on-chain anchoring (Ethereum).
- **Privacy-First**: AES-256-CBC encryption for all sensitive data.
- **Audit Trail**: Immutable logging of all identity actions.
- **Shareable Identities**: Generate secure links to share and transfer gasless identities.

---

## 🚀 Gasless Identity Feature

DecentraID now supports **Gasless Identity**, lowering the barrier to entry by removing the need for cryptocurrency during initial setup.

### How It Works

1. **Create**: User generates an identity off-chain. Data is encrypted and stored in the backend.
2. **Share**: A unique, secure hash link is generated (e.g., `https://app.com/share/abc...`).
3. **Claim**: The link can be shared. A recipient (or the original user later) can "claim" the identity using their wallet, paying the gas fee to anchor it permanently on the blockchain.

### Workflow

```text
[User] -> [Create Gasless] -> [Backend Encrypts & Stores] -> [Returns Share Link]
                                                                  ↓
[Recipient] -> [Opens Link] -> [Imports Data] -> [Claims & Anchors on Blockchain]
```

---

## 🏗 System Architecture

DecentraID uses a hybrid architecture to balance security, cost, and performance.

### Components

- **Frontend (Web3 UI)**: React + Vite application for identity management and wallet interaction.
- **Backend API**: Express.js server handling encryption, off-chain storage, and ZK-proof coordination.
- **Blockchain Layer**: Solidity smart contracts on Ethereum (Sepolia) for immutable identity roots.
- **Database**: MongoDB for encrypted data persistence and audit logging.

### Data Flow

1. **Registration**: User signs data → Backend encrypts (AES-256) → Return IPFS/Storage Hash → Smart Contract registers Hash to DID.
2. **Verification**: Verifier requests data → User grants consent → Backend provides selective disclosure/proof.

---

## 🛠 Technology Stack

- **Frontend**: React 18, TypeScript, Tailwind CSS, Framer Motion, Ethers.js
- **Backend**: Node.js, Express, detailed logging (Winston), Rate Limiting
- **Database**: MongoDB (Atlas)
- **Blockchain**: Hardhat, Solidity 0.8.x, OpenZeppelin
- **Security**: Helmet.js, CORS, AES-256-CBC, Input Validation

---

## 💻 Getting Started

### Prerequisites

- Node.js v18+
- MongoDB (Running locally or Atlas URI)
- MetaMask Extension

### 1. Backend Setup

```bash
cd backend
npm install
# Create .env file based on .env.example
# Set ENCRYPTION_KEY (32 chars) and MONGODB_URI
npm start
```

### 2. Smart Contracts (Optional for local dev)

```bash
cd blockchain
npm install
npx hardhat node
npx hardhat run scripts/deploy-production.js --network localhost
```

### 3. Frontend Setup

```bash
cd web
npm install
# Create .env: VITE_API_URL=http://localhost:5000
npm run dev
```

Visit `http://localhost:5173` to interact with the app.

---

## 📡 API Endpoints

### Identity

- `POST /identity/create`: Create regular identity (requires gas on frontend).
- `POST /identity/create-gasless`: **New!** Create off-chain identity.
- `GET /identity/share/:hash`: **New!** Retrieve gasless identity.
- `POST /identity/claim`: **New!** Anchor gasless identity on-chain.

### Verification & Config

- `POST /credential/issue`: Issue verifiable credential.
- `GET /audit/logs`: Fetch audit history.
- `GET /health`: System status.

---

## 📦 Deployment Guide

### Backend (Node.js)

1. **Environment**: Node 18+, Production Mode.
2. **Env Vars**: `PORT`, `MONGODB_URI`, `ENCRYPTION_KEY`, `CORS_ORIGIN`.
3. **Process Manager**: Use PM2 (`pm2 start server.js`).
4. **Security**: Ensure SSL (HTTPS) is enabled via reverse proxy (Nginx).

### Frontend (Static)

1. Build the app: `cd web && npm run build`.
2. Deploy the `dist` folder to Vercel, Netlify, or AWS S3/CloudFront.
3. Set `VITE_API_URL` to your production backend URL.

### Smart Contracts

1. Deploy to Testnet (Sepolia):

   ```bash
   npx hardhat run scripts/deploy-production.js --network sepolia
   ```

2. Update `backend/config.json` and frontend config with new addresses.

---

## 🔐 Security

- **Encryption**: All PII is encrypted at rest using AES-256-CBC.
- **Key Management**: Encryption keys are server-side only; never exposed to client.
- **Integrity**: Blockchain ensures identity roots and credential hashes cannot be tampered with.
- **Protection**: API rate limiting, strict CORS, and input sanitization in place.

---

## 📄 License

MIT
